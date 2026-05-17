import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Clock, MapPin, X, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  pending:   { label: 'Aguardando confirmação', className: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Confirmado',              className: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Concluído',               className: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Cancelado',               className: 'bg-red-100 text-red-700' }
};

export default function MyAppointments() {
  const [user, setUser] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (auth) => {
      if (auth) setUser(await base44.auth.me());
      else base44.auth.redirectToLogin(window.location.href);
    });
  }, []);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['myAppointments', user?.email],
    queryFn: () => base44.entities.Appointment.filter({ user_email: user.email }, '-date', 100),
    enabled: !!user
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.Partner.list(),
    enabled: appointments.length > 0
  });

  const partnerMap = Object.fromEntries(partners.map(p => [p.id, p]));

  const handleCancel = async (id) => {
    setCancellingId(id);
    await base44.entities.Appointment.update(id, { status: 'cancelled' });
    queryClient.invalidateQueries(['myAppointments', user?.email]);
    setCancellingId(null);
    toast.success('Agendamento cancelado.');
  };

  const upcoming = appointments.filter(a => a.status !== 'cancelled' && a.status !== 'completed' && new Date(a.date) >= new Date(new Date().toDateString()));
  const past = appointments.filter(a => a.status === 'cancelled' || a.status === 'completed' || new Date(a.date) < new Date(new Date().toDateString()));

  const AppointmentRow = ({ appt }) => {
    const cfg = STATUS_CONFIG[appt.status] || STATUS_CONFIG.pending;
    const p = partnerMap[appt.partner_id];
    const canCancel = appt.status === 'pending' || appt.status === 'confirmed';

    return (
      <div className="bg-white border rounded-2xl p-4 hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CalendarDays className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">{appt.service_name}</p>
              {p && (
                <Link to={createPageUrl(`PartnerStore?id=${p.id}`)} className="text-sm text-violet-600 hover:underline">
                  {p.business_name}
                </Link>
              )}
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {format(parseISO(appt.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {appt.time}
                </span>
                {p?.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {p.address}
                  </span>
                )}
              </div>
              {appt.notes && <p className="text-xs text-slate-400 mt-1 italic">"{appt.notes}"</p>}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={cfg.className}>{cfg.label}</Badge>
            {canCancel && (
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500 hover:text-red-600 hover:bg-red-50 h-7 px-2 text-xs"
                onClick={() => handleCancel(appt.id)}
                disabled={cancellingId === appt.id}
              >
                {cancellingId === appt.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <><X className="w-3 h-3 mr-1" />Cancelar</>}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-violet-600" />
            Meus Agendamentos
          </h1>
          <p className="text-slate-500 mt-1">Gerencie seus horários marcados</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border">
            <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Você ainda não tem agendamentos</p>
            <Link to={createPageUrl('Partners')}>
              <Button className="mt-4 bg-violet-600 hover:bg-violet-700">
                Ver parceiros com agendamento
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {upcoming.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Próximos ({upcoming.length})</h2>
                {upcoming.map(a => <AppointmentRow key={a.id} appt={a} />)}
              </div>
            )}
            {past.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Histórico</h2>
                {past.map(a => <AppointmentRow key={a.id} appt={a} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}