import React from "react";
import {
  IconButton,
  Menu,
  Typography,
  List,
  Button
} from "@material-tailwind/react";
import { BellIcon, InfoIcon, AlertCircleIcon, CheckCircle2Icon } from "lucide-react";
import { usePage, router } from "@inertiajs/react";
import { AuthProps } from "@/types/global";
import { formatDistanceToNow } from "date-fns";
import { route } from "ziggy-js";

export function NotificationMenu() {
  const { auth } = usePage<AuthProps>().props;
  // Notifications are stored in auth.user.notifications
  const notifications = auth.user?.notifications || [];
  const unreadCount = auth.user?.unread_notifications_count || 0;

  const handleMarkAsRead = (id: string) => {
    router.put(route('notifications.read', { id }), {}, {
      preserveScroll: true
    });
  };

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.put(route('notifications.read-all'), {}, {
      preserveScroll: true
    });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2Icon className="h-4 w-4 text-primary" />;
      case 'warning': return <AlertCircleIcon className="h-4 w-4 text-warning" />;
      case 'error': return <AlertCircleIcon className="h-4 w-4 text-error" />;
      default: return <InfoIcon className="h-4 w-4 text-info" />;
    }
  }

  return (
    <Menu placement="bottom-end">
      <Menu.Trigger
        as={IconButton}
        variant="ghost"
        className="relative"
      >
        <BellIcon className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 bg-error rounded-full animate-pulse" />
        )}
      </Menu.Trigger>
      <Menu.Content className="w-80 p-0 overflow-hidden bg-background border border-surface shadow-xl z-[9000]">
        <div className="flex items-center justify-between p-4 border-b border-surface">
          <Typography className="font-bold text-surface-foreground">Notifications</Typography>
          {unreadCount > 0 && (
            <button className="text-xs text-primary hover:underline font-medium" onClick={handleMarkAllAsRead}>
              Mark all as read
            </button>
          )}
        </div>
        <div className="max-h-96 overflow-auto">
          {notifications.length > 0 ? (
            <List className="p-0">
              {notifications.map((notification: any) => (
                <List.Item
                  key={notification.id}
                  className={`flex flex-col items-start gap-1 p-4 border-b border-surface last:border-0 rounded-none cursor-pointer transition-colors !bg-transparent hover:!bg-surface/50 ${!notification.read_at ? 'relative' : ''}`}
                  onClick={() => {
                    if (!notification.read_at) handleMarkAsRead(notification.id);
                    if (notification.data.url && notification.data.url !== '#') {
                      router.visit(notification.data.url);
                    }
                  }}
                >
                  {!notification.read_at && (
                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                  )}
                  <div className="flex items-center gap-2 w-full">
                    {getIcon(notification.data.type || 'info')}
                    <Typography className="font-semibold text-sm flex-1 truncate text-surface-foreground">
                      {notification.data.title}
                    </Typography>
                  </div>
                  <Typography className="text-xs text-surface-foreground/70 leading-normal pl-6">
                    {notification.data.message}
                  </Typography>
                  <Typography className="text-[10px] text-surface-foreground/40 mt-1 pl-6">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </Typography>
                </List.Item>
              ))}
            </List>
          ) : (
            <div className="py-12 px-4 text-center">
              <BellIcon className="h-8 w-8 mx-auto text-surface-foreground/20 mb-2" />
              <Typography className="text-sm text-surface-foreground/50">
                No notifications yet
              </Typography>
            </div>
          )}
        </div>
        <div className="p-2 border-t border-surface text-center">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs font-normal text-surface-foreground/70"
            onClick={() => router.get(route('notifications.index'))}
          >
            View all notifications
          </Button>
        </div>
      </Menu.Content>
    </Menu>
  );
}
