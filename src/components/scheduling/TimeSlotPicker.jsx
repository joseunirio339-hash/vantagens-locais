import React, { useMemo } from 'react';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function TimeSlotPicker({ config, appointments, selectedDate, selectedTime, onSelectTime }) {
  const slots = useMemo(() => {
    if (!config || !selectedDate) return [];

    const startTime = config.start_time || '08:00';
    const endTime = config.end_time || '18:00';
    const duration = config.slot_duration || 60;

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const bookedTimes = appointments
      .filter(a => a.date === dateStr && a.status !== 'cancelled')
      .map(a => a.time);

    const result = [];
    for (let m = startMinutes; m + duration <= endMinutes; m += duration) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const timeStr = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      result.push({
        time: timeStr,
        booked: bookedTimes.includes(timeStr)
      });
    }
    return result;
  }, [config, appointments, selectedDate]);

  if (!selectedDate) {
    return (
      <div className="bg-white rounded-2xl border p-6 flex flex-col items-center justify-center text-center min-h-[160px]">
        <Clock className="w-8 h-8 text-slate-300 mb-2" />
        <p className="text-slate-400 text-sm">Selecione uma data para ver os horários disponíveis</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="bg-white rounded-2xl border p-6 text-center">
        <p className="text-slate-400 text-sm">Nenhum horário configurado para este dia.</p>
      </div>
    );
  }

  const available = slots.filter(s => !s.booked);

  return (
    <div className="bg-white rounded-2xl border p-4">
      <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4 text-violet-600" />
        Horários disponíveis
        <span className="text-xs font-normal text-slate-400">({available.length} livres)</span>
      </h4>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {slots.map(({ time, booked }) => (
          <button
            key={time}
            disabled={booked}
            onClick={() => !booked && onSelectTime(time)}
            className={`
              py-2 px-3 rounded-xl text-sm font-medium text-center transition-all
              ${selectedTime === time ? 'bg-violet-600 text-white shadow' : ''}
              ${!booked && selectedTime !== time ? 'bg-slate-50 hover:bg-violet-50 text-slate-700 border border-slate-200' : ''}
              ${booked ? 'bg-slate-100 text-slate-300 cursor-not-allowed line-through' : ''}
            `}
          >
            {time}
          </button>
        ))}
      </div>
    </div>
  );
}