import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import BookingCalendar from './BookingCalendar';
import TimeSlotPicker from './TimeSlotPicker';
import BookingModal from './BookingModal';

export default function PartnerSchedulingSection({ partner, user }) {
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data: config } = useQuery({
    queryKey: ['scheduleConfig', partner.id],
    queryFn: async () => {
      const configs = await base44.entities.ScheduleConfig.filter({ partner_id: partner.id });
      return configs[0] || null;
    }
  });

  const { data: appointments = [], refetch } = useQuery({
    queryKey: ['appointments', partner.id],
    queryFn: () => base44.entities.Appointment.filter({ partner_id: partner.id })
  });

  if (!config || !config.scheduling_enabled) return null;

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleBook = () => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }
    setModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 border-t">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-violet-600" />
        Agendar Horário
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        <BookingCalendar
          config={config}
          appointments={appointments}
          selectedDate={selectedDate}
          onSelectDate={handleDateSelect}
        />

        <div className="flex flex-col gap-4">
          <TimeSlotPicker
            config={config}
            appointments={appointments}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onSelectTime={setSelectedTime}
          />

          {selectedDate && selectedTime && (
            <Button
              onClick={handleBook}
              className="w-full bg-violet-600 hover:bg-violet-700 h-11"
            >
              <CalendarDays className="w-4 h-4 mr-2" />
              Agendar {selectedTime} — {user ? 'Confirmar' : 'Entrar para agendar'}
            </Button>
          )}
        </div>
      </div>

      {modalOpen && selectedDate && selectedTime && (
        <BookingModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          partner={partner}
          user={user}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          config={config}
          onSuccess={() => {
            refetch();
            setSelectedDate(null);
            setSelectedTime(null);
          }}
        />
      )}
    </div>
  );
}