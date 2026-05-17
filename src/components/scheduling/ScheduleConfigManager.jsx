import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Save, Loader2, Plus, X, ToggleLeft, ToggleRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function ScheduleConfigManager({ partner }) {
  const queryClient = useQueryClient();
  const [newService, setNewService] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: config, isLoading } = useQuery({
    queryKey: ['scheduleConfig', partner.id],
    queryFn: async () => {
      const configs = await base44.entities.ScheduleConfig.filter({ partner_id: partner.id });
      return configs[0] || null;
    }
  });

  const [form, setForm] = useState(null);

  React.useEffect(() => {
    if (config !== undefined) {
      setForm(config ? { ...config } : {
        partner_id: partner.id,
        scheduling_enabled: true,
        working_days: [1, 2, 3, 4, 5],
        start_time: '08:00',
        end_time: '18:00',
        slot_duration: 60,
        services: [],
        blocked_dates: [],
        advance_booking_days: 30
      });
    }
  }, [config]);

  const toggleDay = (day) => {
    setForm(prev => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter(d => d !== day)
        : [...prev.working_days, day].sort()
    }));
  };

  const addService = () => {
    if (!newService.trim()) return;
    setForm(prev => ({ ...prev, services: [...(prev.services || []), newService.trim()] }));
    setNewService('');
  };

  const removeService = (s) => {
    setForm(prev => ({ ...prev, services: prev.services.filter(x => x !== s) }));
  };

  const handleSave = async () => {
    setSaving(true);
    if (config) {
      await base44.entities.ScheduleConfig.update(config.id, form);
    } else {
      await base44.entities.ScheduleConfig.create(form);
    }
    queryClient.invalidateQueries(['scheduleConfig', partner.id]);
    setSaving(false);
    toast.success('Configurações de agenda salvas!');
  };

  if (isLoading || !form) return <div className="py-8 text-center text-slate-400">Carregando...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-violet-600" />
            Configurar Agenda
          </span>
          <button
            type="button"
            onClick={() => setForm(p => ({ ...p, scheduling_enabled: !p.scheduling_enabled }))}
            className="flex items-center gap-2 text-sm"
          >
            {form.scheduling_enabled
              ? <><ToggleRight className="w-6 h-6 text-violet-600" /><span className="text-violet-600">Habilitado</span></>
              : <><ToggleLeft className="w-6 h-6 text-slate-400" /><span className="text-slate-400">Desabilitado</span></>}
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Working days */}
        <div className="space-y-2">
          <Label>Dias de atendimento</Label>
          <div className="flex gap-2 flex-wrap">
            {DAY_LABELS.map((label, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  form.working_days?.includes(i)
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Hours */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Início do atendimento</Label>
            <Input
              type="time"
              value={form.start_time}
              onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Fim do atendimento</Label>
            <Input
              type="time"
              value={form.end_time}
              onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))}
            />
          </div>
        </div>

        {/* Slot duration + advance days */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Duração de cada slot (min)</Label>
            <Input
              type="number"
              min="15"
              step="15"
              value={form.slot_duration}
              onChange={e => setForm(p => ({ ...p, slot_duration: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Dias de antecedência</Label>
            <Input
              type="number"
              min="1"
              value={form.advance_booking_days}
              onChange={e => setForm(p => ({ ...p, advance_booking_days: Number(e.target.value) }))}
            />
          </div>
        </div>

        {/* Services */}
        <div className="space-y-2">
          <Label>Serviços oferecidos</Label>
          <div className="flex gap-2">
            <Input
              value={newService}
              onChange={e => setNewService(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addService())}
              placeholder="Ex: Corte feminino"
            />
            <Button type="button" variant="outline" onClick={addService}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {(form.services || []).map(s => (
              <Badge key={s} variant="secondary" className="flex items-center gap-1 pr-1">
                {s}
                <button onClick={() => removeService(s)} className="ml-1 hover:text-red-500">
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full bg-violet-600 hover:bg-violet-700">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 mr-2" />Salvar Configurações</>}
        </Button>
      </CardContent>
    </Card>
  );
}