import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, User, Phone, FileText, Loader2, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function BookingModal({ open, onClose, partner, user, selectedDate, selectedTime, config, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    service_name: '',
    user_name: user?.full_name || '',
    user_phone: '',
    notes: ''
  });

  const services = config?.services || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.service_name) { toast.error('Selecione um serviço.'); return; }
    setLoading(true);

    await base44.entities.Appointment.create({
      partner_id: partner.id,
      user_email: user.email,
      user_name: form.user_name,
      user_phone: form.user_phone,
      service_name: form.service_name,
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: selectedTime,
      notes: form.notes,
      duration_minutes: config?.slot_duration || 60,
      status: 'pending'
    });

    setLoading(false);
    setDone(true);
    onSuccess?.();
  };

  const handleClose = () => {
    setDone(false);
    setForm({ service_name: '', user_name: user?.full_name || '', user_phone: '', notes: '' });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {done ? (
          <div className="flex flex-col items-center py-8 text-center gap-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">Agendamento Confirmado!</h3>
              <p className="text-slate-500 mt-1 text-sm">
                {form.service_name} em <strong>{partner.business_name}</strong>
              </p>
              <p className="text-violet-700 font-semibold mt-2">
                {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })} às {selectedTime}
              </p>
            </div>
            <Button onClick={handleClose} className="bg-violet-600 hover:bg-violet-700 mt-2">
              Fechar
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-violet-600" />
                Confirmar Agendamento
              </DialogTitle>
            </DialogHeader>

            {/* Summary */}
            <div className="bg-violet-50 rounded-xl p-3 flex flex-col gap-1.5 text-sm">
              <div className="flex items-center gap-2 text-violet-700 font-medium">
                <Calendar className="w-4 h-4" />
                {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </div>
              <div className="flex items-center gap-2 text-violet-700 font-medium">
                <Clock className="w-4 h-4" />
                {selectedTime}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Serviço *</Label>
                {services.length > 0 ? (
                  <Select value={form.service_name} onValueChange={v => setForm(p => ({ ...p, service_name: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o serviço" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={form.service_name}
                    onChange={e => setForm(p => ({ ...p, service_name: e.target.value }))}
                    placeholder="Ex: Corte de cabelo"
                    required
                  />
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1"><User className="w-3 h-3" /> Seu nome *</Label>
                <Input
                  value={form.user_name}
                  onChange={e => setForm(p => ({ ...p, user_name: e.target.value }))}
                  placeholder="Nome completo"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1"><Phone className="w-3 h-3" /> Telefone</Label>
                <Input
                  value={form.user_phone}
                  onChange={e => setForm(p => ({ ...p, user_phone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-1"><FileText className="w-3 h-3" /> Observações</Label>
                <Textarea
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Alguma observação para o prestador..."
                  rows={2}
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-violet-600 hover:bg-violet-700">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Agendamento'}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}