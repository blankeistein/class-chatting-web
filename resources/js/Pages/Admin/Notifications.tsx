import React from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Card, Typography, Button, IconButton, Chip } from '@material-tailwind/react';
import { BellIcon, CheckCircle2Icon, AlertCircleIcon, InfoIcon, Trash2Icon, CheckIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { route } from 'ziggy-js';

interface Props {
  notifications: {
    data: any[];
    links: any[];
    meta: any;
  };
}

export default function Notifications({ notifications }: any) {
  const handleMarkAsRead = (id: string) => {
    router.put(route('notifications.read', { id }), {}, {
      preserveScroll: true
    });
  };

  const handleMarkAllAsRead = () => {
    router.put(route('notifications.read-all'), {}, {
      preserveScroll: true
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this notification?')) {
      router.delete(route('notifications.destroy', { id }), {
        preserveScroll: true
      });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2Icon className="h-5 w-5 text-primary" />;
      case 'warning': return <AlertCircleIcon className="h-5 w-5 text-warning" />;
      case 'error': return <AlertCircleIcon className="h-5 w-5 text-error" />;
      default: return <InfoIcon className="h-5 w-5 text-info" />;
    }
  };

  return (
    <AdminLayout>
      <Head title="Notifications" />
      <div className="p-4 lg:p-8 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <Typography variant="h4" className="font-bold text-surface-foreground">
              Notifications
            </Typography>
            <Typography className="text-surface-foreground/60">
              Stay updated with the latest activities and alerts.
            </Typography>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-surface text-surface-foreground"
              onClick={handleMarkAllAsRead}
            >
              <CheckIcon className="h-4 w-4" />
              Mark all as read
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {notifications.data.length > 0 ? (
            notifications.data.map((notification: any) => (
              <Card
                key={notification.id}
                className={`p-4 border border-surface shadow-sm transition-all hover:shadow-md ${!notification.read_at ? 'bg-primary/5 border-primary/20' : 'bg-background'}`}
              >
                <div className="flex gap-4">
                  <div className="mt-1">
                    {getIcon(notification.data.type || 'info')}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Typography className="font-bold text-base text-surface-foreground">
                        {notification.data.title}
                      </Typography>
                      <div className="flex items-center gap-1">
                        {!notification.read_at && (
                          <IconButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            title="Mark as read"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </IconButton>
                        )}
                        <IconButton
                          variant="ghost"
                          size="sm"
                          className="text-error hover:bg-error/10 hover:text-error"
                          onClick={() => handleDelete(notification.id)}
                          title="Delete notification"
                        >
                          <Trash2Icon className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </div>
                    <Typography className="text-surface-foreground/80 my-1">
                      {notification.data.message}
                    </Typography>
                    <div className="flex items-center gap-4 mt-2">
                      <Typography className="text-xs text-surface-foreground/40">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                      </Typography>
                      {notification.data.url && notification.data.url !== '#' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-[10px] px-2"
                          onClick={() => router.visit(notification.data.url)}
                        >
                          View Details
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-12 text-center border border-dashed border-surface bg-transparent">
              <BellIcon className="h-12 w-12 mx-auto text-surface-foreground/10 mb-4" />
              <Typography variant="h6" className="text-surface-foreground/40 font-medium">
                No notifications found
              </Typography>
              <Typography className="text-surface-foreground/30 text-sm">
                When you receive notifications, they will appear here.
              </Typography>
            </Card>
          )}
        </div>

        {/* Simple Pagination */}
        {notifications.last_page > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            {notifications.links.map((link: any, i: number) => (
              <Button
                key={i}
                variant={link.active ? 'solid' : 'outline'}
                size="sm"
                className={`min-w-[40px] ${link.active ? 'bg-primary' : 'border-surface text-surface-foreground'}`}
                disabled={!link.url}
                onClick={() => link.url && router.get(link.url)}
                dangerouslySetInnerHTML={{ __html: link.label }}
              />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
