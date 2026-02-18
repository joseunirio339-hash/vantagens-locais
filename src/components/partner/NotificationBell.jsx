import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, Check, CheckCheck, Ticket, Star, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const typeConfig = {
  new_voucher: { icon: Ticket, color: 'text-blue-600 bg-blue-100' },
  voucher_used: { icon: CheckCheck, color: 'text-emerald-600 bg-emerald-100' },
  new_review: { icon: Star, color: 'text-amber-600 bg-amber-100' },
  subscription_expiring: { icon: AlertCircle, color: 'text-red-600 bg-red-100' }
};

export default function NotificationBell({ partnerId }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', partnerId],
    queryFn: () => base44.entities.Notification.filter({ partner_id: partnerId }, '-created_date', 30),
    enabled: !!partnerId,
    refetchInterval: 30000
  });

  const unread = notifications.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    const unreadItems = notifications.filter(n => !n.is_read);
    await Promise.all(unreadItems.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    queryClient.invalidateQueries(['notifications', partnerId]);
  };

  const markRead = async (id) => {
    await base44.entities.Notification.update(id, { is_read: true });
    queryClient.invalidateQueries(['notifications', partnerId]);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notificações
                {unread > 0 && (
                  <Badge className="bg-red-100 text-red-700 text-xs">{unread} novas</Badge>
                )}
              </h3>
              <div className="flex gap-1">
                {unread > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs h-7 px-2 text-slate-500">
                    <Check className="w-3 h-3 mr-1" /> Ler todas
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma notificação</p>
                </div>
              ) : (
                notifications.map(notif => {
                  const cfg = typeConfig[notif.type] || typeConfig.new_voucher;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={notif.id}
                      onClick={() => !notif.is_read && markRead(notif.id)}
                      className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors ${!notif.is_read ? 'bg-blue-50/50' : ''}`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium text-slate-800 ${!notif.is_read ? 'font-semibold' : ''}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDistanceToNow(new Date(notif.created_date), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}