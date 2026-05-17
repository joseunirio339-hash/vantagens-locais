import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Clock, User, Phone, Check, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  pending:   { label: 'Pendente',   className: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Confirmado', className: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Concluído',  className: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelado',  className: 'bg-red-100 text-red-700' }
};

export default function AppointmentManager({ partner }) {
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState(null);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', partner.id],
    queryFn: () => base44.entities.Appointment.filter({ partner_id: partner.id }, '-date', 100)
  });

  const updateStatus = async (id, status) => {
    setUpdatingId(id);
    await base44.entities.Appointment.update(id, { status });
    queryClient.invalidateQueries(['appointments', partner.id]);
    setUpdatingId(null);
    toast.success(`Agendamento ${STATUS_CONFIG[status].label.toLowerCase()}!`);
  };

  const upcoming = appointments.filter(a => a.status !== 'cancelled' && new Date(a.date) >= new Date(new Date().toDateString()));
  const past = appointments.filter(a => a.status === 'cancelled' || new Date(a.date) < new Date(new Date().toDateString()));

  if (isLoading) return <div className="py-8 text-center text-slate-400">Carregando agendamentos...</div>;

  const AppointmentCard = ({ appt }) => {
    const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending;
    return (
      <div className="border rounded-xl p-4 bg-white hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-800 truncate">{appt.service_name}</span>
              <Badge className={cfg.className}>{cfg.label}</Badge>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-slate-500 flex-wrap">
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                {format(parseISO(appt.date), "dd 'de' MMM", { locale: ptBR })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {appt.time}
              </span>
              {appt.user_name && (
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {appt.user_name}
                </span>
              )}
              {appt.user_phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {appt.user_phone}
                </span>
              )}
            </div>
            {appt.notes && <p className="text-xs text-slate-400 mt-1 italic">"{appt.notes}"</p>}
          </div>

          {appt.status === 'pending' && (
            <div className="flex gap-1 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 border-emerald-300 hover:bg-emerald-50"
                onClick={() => updateStatus(appt.id, 'confirmed')}
                disabled={updatingId === appt.id}
              >
                {updatingId === appt.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 text-emerald-600" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 border-red-200 hover:bg-red-50"
                onClick={() => updateStatus(appt.id, 'cancelled')}
                disabled={updatingId === appt.id}
              >
                <X className="w-3 h-3 text-red-500" />
              </Button>
            </div>
          )}
          {appt.status === 'confirmed' && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs px-3"
              onClick={() => updateStatus(appt.id, 'completed')}
              disabled={updatingId === appt.id}
            >
              {updatingId === appt.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Concluir'}
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-violet-600" />
          Agendamentos
          <Badge className="bg-violet-100 text-violet-700 ml-auto">{upcoming.length} próximos</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {upcoming.length === 0 && past.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>Nenhum agendamento ainda.</p>
          </div>
        )}

        {upcoming.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Próximos</h4>
            {upcoming.map(a => <AppointmentCard key={a.id} appt={a} />)}
          </div>
        )}

        {past.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Anteriores / Cancelados</h4>
            {past.slice(0, 10).map(a => <AppointmentCard key={a.id} appt={a} />)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}