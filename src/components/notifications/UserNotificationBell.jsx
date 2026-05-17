import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Ticket, Tag, Check, Trophy, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function UserNotificationBell({ user }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['userNotifications', user?.email],
    queryFn: () => base44.entities.UserNotification.filter(
      { user_email: user.email },
      '-created_date',
      30
    ),
    enabled: !!user?.email,
    refetchInterval: 60000
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAllRead = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => base44.entities.UserNotification.update(n.id, { is_read: true })));
    },
    onSuccess: () => queryClient.invalidateQueries(['userNotifications', user?.email])
  });

  const markRead = async (id) => {
    await base44.entities.UserNotification.update(id, { is_read: true });
    queryClient.invalidateQueries(['userNotifications', user?.email]);
  };

  const typeConfig = {
    voucher_expiring: { icon: Ticket,  color: 'text-amber-500',  bg: 'bg-amber-50'  },
    new_coupon:       { icon: Tag,     color: 'text-violet-500', bg: 'bg-violet-50' },
    level_up:         { icon: Trophy,  color: 'text-yellow-500', bg: 'bg-yellow-50' },
    badge_earned:     { icon: Award,   color: 'text-orange-500', bg: 'bg-orange-50' },
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 shadow-xl" sideOffset={8}>
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-slate-800">Notificações</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-violet-600 h-auto py-1"
              onClick={() => markAllRead.mutate()}
            >
              <Check className="w-3 h-3 mr-1" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-10 text-center">
              <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Nenhuma notificação</p>
            </div>
          ) : (
            notifications.map(notif => {
              const cfg = typeConfig[notif.type] || typeConfig.new_coupon;
              const Icon = cfg.icon;
              return (
                <div
                  key={notif.id}
                  className={`flex gap-3 px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-slate-50 transition-colors ${!notif.is_read ? 'bg-slate-50' : ''}`}
                  onClick={() => !notif.is_read && markRead(notif.id)}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${cfg.bg}`}>
                    <Icon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${!notif.is_read ? 'text-slate-800' : 'text-slate-600'}`}>
                      {notif.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatDistanceToNow(new Date(notif.created_date), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <div className="w-2 h-2 bg-violet-500 rounded-full shrink-0 mt-2" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}