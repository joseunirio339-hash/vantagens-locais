import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isSameDay, isToday, isBefore, startOfDay, addMonths, subMonths, getDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function BookingCalendar({ config, appointments, onSelectDate, selectedDate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const today = startOfDay(new Date());
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + (config?.advance_booking_days || 30));

  const workingDays = config?.working_days || [1, 2, 3, 4, 5];
  const blockedDates = (config?.blocked_dates || []).map(d => d.split('T')[0]);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const firstDayOfWeek = getDay(startOfMonth(currentMonth));

  const isAvailable = (day) => {
    if (isBefore(day, today)) return false;
    if (isBefore(maxDate, day)) return false;
    if (!workingDays.includes(getDay(day))) return false;
    const dateStr = format(day, 'yyyy-MM-dd');
    if (blockedDates.includes(dateStr)) return false;
    return true;
  };

  const hasAppointments = (day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return appointments.some(a => a.date === dateStr && a.status !== 'cancelled');
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="bg-white rounded-2xl border p-4">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          disabled={isSameMonth(currentMonth, new Date())}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="font-semibold text-slate-800 capitalize">
          {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map(d => (
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
          const available = isAvailable(day);
          const selected = selectedDate && isSameDay(day, selectedDate);
          const booked = hasAppointments(day);

          return (
            <button
              key={day.toString()}
              onClick={() => available && onSelectDate(day)}
              disabled={!available}
              className={`
                relative h-9 w-full rounded-lg text-sm font-medium transition-all
                ${selected ? 'bg-violet-600 text-white shadow-md' : ''}
                ${!selected && available ? 'hover:bg-violet-50 text-slate-700' : ''}
                ${!available ? 'text-slate-300 cursor-not-allowed' : ''}
                ${isToday(day) && !selected ? 'ring-2 ring-violet-400 ring-offset-1' : ''}
              `}
            >
              {format(day, 'd')}
              {booked && !selected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-4 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Com agendamentos
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-violet-600 inline-block" /> Selecionado
        </span>
      </div>
    </div>
  );
}