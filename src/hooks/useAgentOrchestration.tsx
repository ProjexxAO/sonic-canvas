import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AgentTask {
  id: string;
  user_id: string;
  task_type: 'automation' | 'notification' | 'analysis' | 'assistance' | 'background';
  task_title: string;
  task_description?: string;
  task_priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_agents: string[];
  orchestration_mode: 'automatic' | 'user_directed' | 'hybrid' | 'autonomous';
  status: 'pending' | 'in_progress' | 'awaiting_approval' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  input_data: Record<string, any>;
  output_data: Record<string, any>;
  agent_suggestions: AgentSuggestion[];
  scheduled_at?: Date;
  started_at?: Date;
  completed_at?: Date;
  created_at: Date;
}

export interface AgentSuggestion {
  agent_id: string;
  agent_name: string;
  action: string;
  reason: string;
  confidence: number;
  requires_approval: boolean;
}

export interface AgentNotification {
  id: string;
  user_id: string;
  notification_type: 'alert' | 'recommendation' | 'update' | 'reminder' | 'insight';
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  source_agent_id?: string;
  source_agent_name?: string;
  action_items: ActionItem[];
  is_read: boolean;
  is_dismissed: boolean;
  is_actioned: boolean;
  related_entity_type?: string;
  related_entity_id?: string;
  metadata: Record<string, any>;
  expires_at?: Date;
  created_at: Date;
}

export interface ActionItem {
  label: string;
  action_type: string;
  action_data: Record<string, any>;
}

export interface AgentCapability {
  id: string;
  agent_id: string;
  capability_name: string;
  capability_type: 'automation' | 'analysis' | 'notification' | 'integration' | 'processing';
  description?: string;
  trigger_conditions: Record<string, any>;
  requires_approval: boolean;
  max_autonomous_actions: number;
  cooldown_seconds: number;
  is_active: boolean;
  last_invoked_at?: Date;
  invocation_count: number;
}

export function useAgentOrchestration(userId: string | undefined) {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [notifications, setNotifications] = useState<AgentNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const csuiteTaskId = (id: string) => `csuite:${id}`;

  const mapCsuiteTaskToAgentTask = (t: any): AgentTask => {
    const rawStatus = String(t.status || 'pending');
    const status: AgentTask['status'] =
      rawStatus === 'done'
        ? 'completed'
        : rawStatus === 'review'
          ? 'awaiting_approval'
          : rawStatus === 'in_progress'
            ? 'in_progress'
            : 'pending';

    const progress =
      status === 'completed' ? 100 : status === 'awaiting_approval' ? 80 : status === 'in_progress' ? 50 : 0;

    const priority = (String(t.priority || 'medium') as AgentTask['task_priority']) || 'medium';

    return {
      id: csuiteTaskId(t.id),
      user_id: t.user_id,
      task_type: 'assistance',
      task_title: t.title,
      task_description: t.description || undefined,
      task_priority: priority,
      assigned_agents: [],
      orchestration_mode: 'user_directed',
      status,
      progress,
      input_data: { source: 'csuite_tasks', csuite_task_id: t.id },
      output_data: {},
      agent_suggestions: [],
      scheduled_at: undefined,
      started_at: undefined,
      completed_at: undefined,
      created_at: new Date(t.created_at),
    };
  };

  const isAtlasAssigned = (assignedTo: unknown) => {
    if (!assignedTo) return false;
    return String(assignedTo).toLowerCase().includes('atlas');
  };

  // Fetch tasks (orchestration queue + user-assigned-to-Atlas tasks)
  const fetchTasks = useCallback(async () => {
    if (!userId) return;

    try {
      const [agentTasksRes, csuiteTasksRes] = await Promise.all([
        (supabase as any)
          .from('agent_task_queue')
          .select('*')
          .eq('user_id', userId)
          .in('status', ['pending', 'in_progress', 'awaiting_approval'])
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('csuite_tasks')
          .select('id,user_id,title,description,status,priority,assigned_to,created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(200),
      ]);

      if (agentTasksRes.error) throw agentTasksRes.error;
      if (csuiteTasksRes.error) throw csuiteTasksRes.error;

      const agentTasks: AgentTask[] = (agentTasksRes.data || []).map((t: any) => ({
        ...t,
        scheduled_at: t.scheduled_at ? new Date(t.scheduled_at) : undefined,
        started_at: t.started_at ? new Date(t.started_at) : undefined,
        completed_at: t.completed_at ? new Date(t.completed_at) : undefined,
        created_at: new Date(t.created_at),
      }));

      const csuiteAtlasTasks: AgentTask[] = (csuiteTasksRes.data || [])
        .filter((t: any) => isAtlasAssigned(t.assigned_to))
        .filter((t: any) => ['pending', 'in_progress', 'review'].includes(String(t.status || 'pending')))
        .map(mapCsuiteTaskToAgentTask);

      const merged = [...agentTasks, ...csuiteAtlasTasks].sort(
        (a, b) => b.created_at.getTime() - a.created_at.getTime()
      );

      setTasks(merged);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  }, [userId]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await (supabase as any)
        .from('agent_notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const notifs = data?.map((n: any) => ({
        ...n,
        expires_at: n.expires_at ? new Date(n.expires_at) : undefined,
        created_at: new Date(n.created_at),
      })) || [];

      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: AgentNotification) => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    if (userId) {
      setIsLoading(true);
      Promise.all([fetchTasks(), fetchNotifications()]).finally(() => setIsLoading(false));
    }
  }, [userId, fetchTasks, fetchNotifications]);

  // Real-time subscription for orchestration tasks
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('agent-tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_task_queue',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTask = {
              ...payload.new,
              scheduled_at: payload.new.scheduled_at ? new Date(payload.new.scheduled_at) : undefined,
              started_at: payload.new.started_at ? new Date(payload.new.started_at) : undefined,
              completed_at: payload.new.completed_at ? new Date(payload.new.completed_at) : undefined,
              created_at: new Date(payload.new.created_at),
            } as AgentTask;

            setTasks((prev) => [newTask, ...prev]);
            toast.info(`New task: ${newTask.task_title}`, {
              description: `Status: ${newTask.status}`,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedTask = {
              ...payload.new,
              scheduled_at: payload.new.scheduled_at ? new Date(payload.new.scheduled_at) : undefined,
              started_at: payload.new.started_at ? new Date(payload.new.started_at) : undefined,
              completed_at: payload.new.completed_at ? new Date(payload.new.completed_at) : undefined,
              created_at: new Date(payload.new.created_at),
            } as AgentTask;

            setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));

            if (updatedTask.status === 'completed') {
              toast.success(`Task completed: ${updatedTask.task_title}`);
            } else if (updatedTask.status === 'failed') {
              toast.error(`Task failed: ${updatedTask.task_title}`);
            }
          } else if (payload.eventType === 'DELETE') {
            setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Real-time subscription for user tasks assigned to Atlas (csuite_tasks)
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('csuite-atlas-tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'csuite_tasks',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            if (!isAtlasAssigned((payload.new as any).assigned_to)) return;
            const newTask = mapCsuiteTaskToAgentTask(payload.new);
            setTasks((prev) => [newTask, ...prev].sort((a, b) => b.created_at.getTime() - a.created_at.getTime()));
          } else if (payload.eventType === 'UPDATE') {
            const id = csuiteTaskId((payload.new as any).id);
            const shouldShow =
              isAtlasAssigned((payload.new as any).assigned_to) &&
              ['pending', 'in_progress', 'review'].includes(String((payload.new as any).status || 'pending'));

            setTasks((prev) => {
              const next = prev.filter((t) => t.id !== id);
              if (!shouldShow) return next;
              return [mapCsuiteTaskToAgentTask(payload.new), ...next].sort(
                (a, b) => b.created_at.getTime() - a.created_at.getTime()
              );
            });
          } else if (payload.eventType === 'DELETE') {
            const id = csuiteTaskId((payload.old as any).id);
            setTasks((prev) => prev.filter((t) => t.id !== id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Real-time subscription for notifications
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('agent-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = {
            ...payload.new,
            expires_at: payload.new.expires_at ? new Date(payload.new.expires_at) : undefined,
            created_at: new Date(payload.new.created_at),
          } as AgentNotification;

          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show toast for high priority notifications
          if (newNotif.priority === 'high' || newNotif.priority === 'urgent') {
            toast.info(newNotif.title, {
              description: newNotif.message,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Create a new task
  const createTask = useCallback(async (task: Omit<AgentTask, 'id' | 'user_id' | 'created_at' | 'status' | 'progress'>) => {
    if (!userId) return null;

    try {
      const { data, error } = await (supabase as any)
        .from('agent_task_queue')
        .insert({
          user_id: userId,
          ...task,
          status: 'pending',
          progress: 0,
        })
        .select()
        .single();

      if (error) throw error;

      fetchTasks();
      toast.success('Task created');
      return data;
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
      return null;
    }
  }, [userId, fetchTasks]);

  // Approve a task suggestion
  const approveTaskSuggestion = useCallback(async (taskId: string, suggestionIndex: number) => {
    if (!userId) return;

    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const { error } = await (supabase as any)
        .from('agent_task_queue')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .eq('id', taskId)
        .eq('user_id', userId);

      if (error) throw error;

      fetchTasks();
      toast.success('Task approved and started');
    } catch (error) {
      console.error('Error approving task:', error);
      toast.error('Failed to approve task');
    }
  }, [userId, tasks, fetchTasks]);

  // Cancel a task
  const cancelTask = useCallback(async (taskId: string) => {
    if (!userId) return;

    try {
      const { error } = await (supabase as any)
        .from('agent_task_queue')
        .update({ status: 'cancelled' })
        .eq('id', taskId)
        .eq('user_id', userId);

      if (error) throw error;

      fetchTasks();
      toast.success('Task cancelled');
    } catch (error) {
      console.error('Error cancelling task:', error);
      toast.error('Failed to cancel task');
    }
  }, [userId, fetchTasks]);

  // Update task progress
  const updateTaskProgress = useCallback(async (taskId: string, progress: number, status?: AgentTask['status']) => {
    if (!userId) return;

    try {
      const updates: Record<string, any> = { progress };
      if (status) {
        updates.status = status;
        if (status === 'in_progress' && !tasks.find(t => t.id === taskId)?.started_at) {
          updates.started_at = new Date().toISOString();
        }
        if (status === 'completed' || status === 'failed') {
          updates.completed_at = new Date().toISOString();
        }
      }

      const { error } = await (supabase as any)
        .from('agent_task_queue')
        .update(updates)
        .eq('id', taskId)
        .eq('user_id', userId);

      if (error) throw error;
      // Real-time subscription will handle the UI update
    } catch (error) {
      console.error('Error updating task progress:', error);
      toast.error('Failed to update task');
    }
  }, [userId, tasks]);

  // Mark notification as read
  const markNotificationRead = useCallback(async (notificationId: string) => {
    if (!userId) return;

    try {
      const { error } = await (supabase as any)
        .from('agent_notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  }, [userId]);

  // Dismiss notification
  const dismissNotification = useCallback(async (notificationId: string) => {
    if (!userId) return;

    try {
      const { error } = await (supabase as any)
        .from('agent_notifications')
        .update({ is_dismissed: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;

      const notif = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notif && !notif.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  }, [userId, notifications]);

  // Mark all notifications as read
  const markAllRead = useCallback(async () => {
    if (!userId) return;

    try {
      const { error } = await (supabase as any)
        .from('agent_notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all read:', error);
    }
  }, [userId]);

  // Execute notification action
  const executeAction = useCallback(async (notificationId: string, action: ActionItem) => {
    if (!userId) return;

    try {
      // Mark as actioned
      await (supabase as any)
        .from('agent_notifications')
        .update({ is_actioned: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

      // Handle different action types
      switch (action.action_type) {
        case 'navigate':
          // Navigation handled by caller
          break;
        case 'approve':
          // Approve related task
          if (action.action_data.task_id) {
            await approveTaskSuggestion(action.action_data.task_id, 0);
          }
          break;
        case 'dismiss':
          await dismissNotification(notificationId);
          break;
        default:
          console.log('Action executed:', action);
      }

      return action;
    } catch (error) {
      console.error('Error executing action:', error);
      toast.error('Failed to execute action');
      return null;
    }
  }, [userId, approveTaskSuggestion, dismissNotification]);

  // Sync tasks from long-term memory using AI extraction
  const syncMemoryTasks = useCallback(async () => {
    if (!userId) return null;

    try {
      toast.info('Extracting tasks from memory...', { duration: 2000 });
      
      const response = await supabase.functions.invoke('atlas-orchestrator', {
        body: { action: 'sync_memory_tasks', userId }
      });

      if (response.error) throw response.error;

      const result = response.data;
      
      if (result.inserted > 0) {
        toast.success(`Synced ${result.inserted} tasks from memory`);
        await fetchTasks(); // Refresh task list
      } else if (result.extracted > 0) {
        toast.info('All extracted tasks already exist');
      } else {
        toast.info('No actionable tasks found in memory');
      }

      return result;
    } catch (error) {
      console.error('Error syncing memory tasks:', error);
      toast.error('Failed to sync tasks from memory');
      return null;
    }
  }, [userId, fetchTasks]);

  return {
    tasks,
    notifications,
    unreadCount,
    isLoading,
    createTask,
    updateTaskProgress,
    approveTaskSuggestion,
    cancelTask,
    markNotificationRead,
    dismissNotification,
    markAllRead,
    executeAction,
    refreshTasks: fetchTasks,
    refreshNotifications: fetchNotifications,
    syncMemoryTasks,
  };
}
