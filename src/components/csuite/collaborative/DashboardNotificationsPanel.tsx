import React from 'react';
import { useDashboardNotifications, DashboardNotification } from '@/hooks/useDashboardNotifications';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, Check, CheckCheck, Trash2, AtSign, MessageSquare, Upload, UserPlus, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface DashboardNotificationsPanelProps {
  userId: string;
}

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  mention: AtSign,
  comment_mention: MessageSquare,
  file_upload: Upload,
  member_added: UserPlus,
  default: Bell,
};

function getNotificationIcon(type: string) {
  return NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.default;
}

export function DashboardNotificationsPanel({ userId }: DashboardNotificationsPanelProps) {
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useDashboardNotifications(userId);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
              className="h-7 text-xs"
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No notifications
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notification => {
                const Icon = getNotificationIcon(notification.notification_type);
                
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-3 hover:bg-accent/50 transition-colors',
                      !notification.is_read && 'bg-primary/5'
                    )}
                  >
                    <div className="flex gap-3">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={notification.actor_avatar} />
                          <AvatarFallback>{notification.actor_name?.charAt(0) || '?'}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-background flex items-center justify-center">
                          <Icon className="h-2.5 w-2.5 text-muted-foreground" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{notification.actor_name}</span>
                          {' '}
                          <span className="text-muted-foreground">{notification.title.toLowerCase()}</span>
                        </p>
                        {notification.message && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {notification.message}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </span>
                          {notification.dashboard_name && (
                            <>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground truncate">
                                {notification.dashboard_name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        {!notification.is_read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
