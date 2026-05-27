import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight, Clock, User, Check, X, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const STATUS_CONFIG = {
  pending:   { label: 'Aguardando', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  confirmed: { label: 'Confirmado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelado',  color: 'bg-red-100 text-red-600 border-red-200' },
  completed: { label: 'Concluído',  color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

function AppointmentCard({ apt, onStatusChange }) {
  const cfg = STATUS_CONFIG[apt.status] || STATUS_CONFIG.pending;
  return (
    <div className="border border-slate-100 rounded-xl p-3 bg-white hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
            <span className="font-bold text-slate-800 text-sm">{apt.time_slot}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-600 mb-1">
            <User className="w-3 h-3" />
            <span className="truncate">{apt.user_name || apt.user_email}</span>
          </div>
          {apt.product_name && (
            <p className="text-xs text-violet-600 truncate">📦 {apt.product_name}</p>
          )}
          {apt.notes && (
            <p className="text-xs text-slate-400 mt-1 truncate">💬 {apt.notes}</p>
          )}
        </div>

        {apt.status === 'pending' && (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => onStatusChange(apt.id, 'confirmed')}
              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
              title="Confirmar"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onStatusChange(apt.id, 'cancelled')}
              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
              title="Cancelar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {apt.status === 'confirmed' && (
          <button
            onClick={() => onStatusChange(apt.id, 'completed')}
            className="p-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-600 transition-colors text-xs font-medium px-2"
            title="Marcar como concluído"
          >
            ✓ Concluir
          </button>
        )}
      </div>
    </div>
  );
}

export default function AppointmentsCalendar({ partnerId }) {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['partnerAppointments', partnerId],
    queryFn: () => base44.entities.Appointment.filter({ partner_id: partnerId }, '-date', 200),
    enabled: !!partnerId,
    refetchInterval: 30000,
  });

  const getAppointmentsForDay = (day) =>
    appointments.filter(a => a.date === format(day, 'yyyy-MM-dd'));

  const selectedDayAppointments = getAppointmentsForDay(selectedDay)
    .sort((a, b) => a.time_slot.localeCompare(b.time_slot));

  const handleStatusChange = async (id, status) => {
    await base44.entities.Appointment.update(id, { status });
    queryClient.invalidateQueries({ queryKey: ['partnerAppointments', partnerId] });
  };

  const pending = appointments.filter(a => a.status === 'pending').length;

  // First day of week offset (Sunday = 0)
  const firstDayOfWeek = monthStart.getDay();

  return (
    <div className="space-y-6">
      {pending > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700 font-medium">
            {pending} agendamento{pending !== 1 ? 's' : ''} aguardando confirmação
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="w-5 h-5 text-violet-600" />
                  {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </CardTitle>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-2">
                {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d => (
                  <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
                ))}
              </div>
              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells before first day */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {days.map(day => {
                  const dayApts = getAppointmentsForDay(day);
                  const isSelected = isSameDay(day, selectedDay);
                  const hasPending = dayApts.some(a => a.status === 'pending');
                  const hasConfirmed = dayApts.some(a => a.status === 'confirmed');
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDay(day)}
                      className={`relative flex flex-col items-center py-2 rounded-xl transition-all text-sm ${
                        isSelected
                          ? 'bg-violet-600 text-white font-bold'
                          : 'hover:bg-violet-50 text-slate-700'
                      }`}
                    >
                      {format(day, 'd')}
                      {dayApts.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5">
                          {hasPending && <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                          {hasConfirmed && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex gap-4 mt-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-400" /> Pendente</span>
                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400" /> Confirmado</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Day appointments */}
        <div>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-slate-700">
                {format(selectedDay, "d 'de' MMMM", { locale: ptBR })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <div key={i} className="h-16 animate-pulse bg-slate-100 rounded-xl" />)}
                </div>
              ) : selectedDayAppointments.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum agendamento</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDayAppointments.map(apt => (
                    <AppointmentCard key={apt.id} apt={apt} onStatusChange={handleStatusChange} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}