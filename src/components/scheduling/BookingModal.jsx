import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, addDays, isBefore, startOfDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const TIME_SLOTS = [
  '08:00','08:30','09:00','09:30','10:00','10:30',
  '11:00','11:30','13:00','13:30','14:00','14:30',
  '15:00','15:30','16:00','16:30','17:00','17:30',
];

function generateDays(count = 14) {
  const days = [];
  const today = startOfDay(new Date());
  for (let i = 1; i <= count; i++) {
    days.push(addDays(today, i));
  }
  return days;
}

export default function BookingModal({ open, onClose, partner, voucher, user }) {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [weekOffset, setWeekOffset] = useState(0);

  const days = generateDays(28);
  const visibleDays = days.slice(weekOffset * 7, weekOffset * 7 + 7);

  const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;

  // Busca agendamentos já feitos para a data selecionada neste parceiro
  const { data: existingAppointments = [] } = useQuery({
    queryKey: ['appointments', partner?.id, dateStr],
    queryFn: () => base44.entities.Appointment.filter({ partner_id: partner.id, date: dateStr }),
    enabled: !!partner?.id && !!dateStr,
  });

  const takenSlots = existingAppointments
    .filter(a => a.status !== 'cancelled')
    .map(a => a.time_slot);

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) return;
    setSubmitting(true);
    await base44.entities.Appointment.create({
      partner_id: partner.id,
      user_email: user.email,
      user_name: user.full_name,
      voucher_id: voucher?.id,
      product_id: voucher?.product_id,
      product_name: voucher?.product_name,
      date: format(selectedDate, 'yyyy-MM-dd'),
      time_slot: selectedTime,
      notes: notes.trim() || undefined,
      status: 'pending',
    });
    queryClient.invalidateQueries({ queryKey: ['appointments', partner.id] });
    setDone(true);
    setSubmitting(false);
  };

  const handleClose = () => {
    setSelectedDate(null);
    setSelectedTime(null);
    setNotes('');
    setDone(false);
    setWeekOffset(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-violet-600" />
            Agendar Horário
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="py-10 text-center space-y-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
            <p className="text-xl font-bold text-slate-800">Agendamento Solicitado!</p>
            <p className="text-slate-500 text-sm">
              {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })} às {selectedTime}
            </p>
            <p className="text-xs text-slate-400">O parceiro receberá sua solicitação e confirmará em breve.</p>
            <Button onClick={handleClose} className="mt-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white">
              Fechar
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Voucher info */}
            {voucher && (
              <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-3 text-sm">
                <span className="text-violet-700 font-medium">Voucher: </span>
                <span className="text-slate-700">{voucher.product_name}</span>
                <span className="ml-2 text-violet-400 text-xs font-mono">{voucher.code}</span>
              </div>
            )}

            {/* Date picker */}
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-500" />
                Escolha uma data
              </p>
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => setWeekOffset(w => Math.max(0, w - 1))}
                  disabled={weekOffset === 0}
                  className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex-1 grid grid-cols-7 gap-1">
                  {visibleDays.map(day => {
                    const isSelected = selectedDate && format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => { setSelectedDate(day); setSelectedTime(null); }}
                        className={`flex flex-col items-center p-2 rounded-xl text-xs transition-all ${
                          isSelected
                            ? 'bg-violet-600 text-white font-bold'
                            : 'hover:bg-violet-50 text-slate-600 border border-slate-100'
                        }`}
                      >
                        <span className="text-[10px] uppercase opacity-70">
                          {format(day, 'EEE', { locale: ptBR })}
                        </span>
                        <span className="font-semibold text-sm">{format(day, 'd')}</span>
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setWeekOffset(w => Math.min(3, w + 1))}
                  disabled={weekOffset === 3}
                  className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-violet-500" />
                  Escolha um horário
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map(slot => {
                    const taken = takenSlots.includes(slot);
                    const isSelected = selectedTime === slot;
                    return (
                      <button
                        key={slot}
                        disabled={taken}
                        onClick={() => setSelectedTime(slot)}
                        className={`py-2 px-1 rounded-xl text-sm font-medium transition-all ${
                          taken
                            ? 'bg-slate-100 text-slate-300 cursor-not-allowed line-through'
                            : isSelected
                              ? 'bg-violet-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-700 hover:border-violet-300 hover:bg-violet-50'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedDate && selectedTime && (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Observações (opcional)</p>
                <Textarea
                  placeholder="Ex: Tenho alergia a..., prefiro atendimento com..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="text-sm resize-none"
                />
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!selectedDate || !selectedTime || submitting}
              className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white"
            >
              {submitting ? 'Agendando...' : 'Confirmar Agendamento'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}