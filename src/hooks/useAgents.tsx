// Atlas Sonic OS - Agents Database Hook

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { SonicAgent, AgentSector, AgentStatus, AgentClass, generateCodeArtifact, generateAgentId } from '@/lib/agentTypes';
import { WaveformType } from '@/lib/audioEngine';
import { toast } from 'sonner';

// Map database types to our app types
const mapDbToAgent = (row: any): SonicAgent => ({
  id: row.id,
  name: row.name,
  designation: row.designation,
  sector: row.sector as AgentSector,
  status: row.status as AgentStatus,
  class: row.class as AgentClass,
  sonicDNA: {
    waveform: row.waveform as WaveformType,
    frequency: Number(row.frequency),
    color: row.color,
    modulation: Number(row.modulation),
    density: Number(row.density),
  },
  codeArtifact: row.code_artifact || '',
  createdAt: new Date(row.created_at),
  lastActive: new Date(row.last_active),
  metrics: {
    cycles: row.cycles,
    efficiency: Number(row.efficiency),
    stability: Number(row.stability),
  },
  linkedAgents: row.linked_agents || [],
});

export function useAgents() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<SonicAgent[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch agents from database
  const fetchAgents = useCallback(async () => {
    if (!user) {
      setAgents([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('sonic_agents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setAgents(data?.map(mapDbToAgent) || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load agents on mount and when user changes
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('sonic-agents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sonic_agents',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setAgents(prev => [mapDbToAgent(payload.new), ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setAgents(prev => prev.map(a => 
              a.id === payload.new.id ? mapDbToAgent(payload.new) : a
            ));
          } else if (payload.eventType === 'DELETE') {
            setAgents(prev => prev.filter(a => a.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Create a new agent
  const createAgent = async (name: string, sector: AgentSector): Promise<SonicAgent | null> => {
    if (!user) {
      toast.error('Please sign in to create agents');
      return null;
    }

    const designation = `${sector.slice(0, 3)}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`;
    const waveforms: WaveformType[] = ['sine', 'square', 'sawtooth', 'triangle'];
    const sectorColors: Record<AgentSector, string> = {
      FINANCE: '#00ffd5',
      BIOTECH: '#00ff88',
      SECURITY: '#ff3366',
      DATA: '#9945ff',
      CREATIVE: '#ffaa00',
      UTILITY: '#4488ff',
    };
    const sectorFrequencies: Record<AgentSector, number> = {
      FINANCE: 440,
      BIOTECH: 523.25,
      SECURITY: 329.63,
      DATA: 392,
      CREATIVE: 493.88,
      UTILITY: 369.99,
    };

    const newAgent = {
      user_id: user.id,
      name,
      designation,
      sector,
      status: 'IDLE' as const,
      class: 'BASIC' as const,
      waveform: waveforms[Math.floor(Math.random() * waveforms.length)],
      frequency: sectorFrequencies[sector] + (Math.random() - 0.5) * 100,
      color: sectorColors[sector],
      modulation: Math.random() * 10 + 1,
      density: Math.random() * 100,
      code_artifact: generateCodeArtifact(name, sector),
      cycles: 0,
      efficiency: Math.random() * 40 + 60,
      stability: Math.random() * 30 + 70,
      linked_agents: [],
    };

    try {
      const { data, error } = await supabase
        .from('sonic_agents')
        .insert(newAgent)
        .select()
        .single();

      if (error) throw error;
      
      return mapDbToAgent(data);
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error('Failed to create agent');
      return null;
    }
  };

  // Update an agent
  const updateAgent = async (id: string, updates: Partial<SonicAgent>): Promise<boolean> => {
    if (!user) return false;

    const dbUpdates: any = {};
    
    if (updates.status) dbUpdates.status = updates.status;
    if (updates.class) dbUpdates.class = updates.class;
    if (updates.metrics) {
      dbUpdates.cycles = updates.metrics.cycles;
      dbUpdates.efficiency = updates.metrics.efficiency;
      dbUpdates.stability = updates.metrics.stability;
    }
    if (updates.sonicDNA) {
      dbUpdates.waveform = updates.sonicDNA.waveform;
      dbUpdates.frequency = updates.sonicDNA.frequency;
      dbUpdates.color = updates.sonicDNA.color;
      dbUpdates.modulation = updates.sonicDNA.modulation;
      dbUpdates.density = updates.sonicDNA.density;
    }
    if (updates.linkedAgents) {
      dbUpdates.linked_agents = updates.linkedAgents;
    }
    
    dbUpdates.last_active = new Date().toISOString();

    try {
      const { error } = await supabase
        .from('sonic_agents')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating agent:', error);
      toast.error('Failed to update agent');
      return false;
    }
  };

  // Delete an agent
  const deleteAgent = async (id: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('sonic_agents')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Failed to delete agent');
      return false;
    }
  };

  return {
    agents,
    loading,
    createAgent,
    updateAgent,
    deleteAgent,
    refetch: fetchAgents,
  };
}
