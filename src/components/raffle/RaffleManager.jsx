import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Gift, ToggleLeft, ToggleRight, X } from 'lucide-react';

const PRESET_COLORS = ['#7C3AED','#DB2777','#D97706','#059669','#2563EB','#DC2626','#0891B2','#EA580C'];

const defaultPrize = () => ({ label: '', color: PRESET_COLORS[0], weight: 1 });

export default function RaffleManager({ partner }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    vouchers_per_spin: 1,
    ends_at: '',
    prizes: [defaultPrize(), defaultPrize()]
  });
  const [editingId, setEditingId] = useState(null);

  const { data: raffles = [] } = useQuery({
    queryKey: ['raffles', partner?.id],
    queryFn: () => base44.entities.Raffle.filter({ partner_id: partner.id }),
    enabled: !!partner?.id
  });

  const resetForm = () => {
    setForm({ title: '', description: '', vouchers_per_spin: 1, ends_at: '', prizes: [defaultPrize(), defaultPrize()] });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.title || form.prizes.filter(p => p.label).length < 2) return;
    const validPrizes = form.prizes.filter(p => p.label.trim());
    const data = { ...form, prizes: validPrizes, partner_id: partner.id };
    if (editingId) {
      await base44.entities.Raffle.update(editingId, data);
    } else {
      await base44.entities.Raffle.create(data);
    }
    queryClient.invalidateQueries(['raffles', partner.id]);
    resetForm();
  };

  const handleEdit = (raffle) => {
    setForm({
      title: raffle.title,
      description: raffle.description || '',
      vouchers_per_spin: raffle.vouchers_per_spin || 1,
      ends_at: raffle.ends_at || '',
      prizes: raffle.prizes || []
    });
    setEditingId(raffle.id);
    setShowForm(true);
  };

  const handleToggle = async (raffle) => {
    await base44.entities.Raffle.update(raffle.id, { is_active: !raffle.is_active });
    queryClient.invalidateQueries(['raffles', partner.id]);
  };

  const handleDelete = async (id) => {
    await base44.entities.Raffle.delete(id);
    queryClient.invalidateQueries(['raffles', partner.id]);
  };

  const updatePrize = (idx, field, value) => {
    const prizes = [...form.prizes];
    prizes[idx] = { ...prizes[idx], [field]: value };
    setForm({ ...form, prizes });
  };

  const addPrize = () => setForm({ ...form, prizes: [...form.prizes, defaultPrize()] });
  const removePrize = (idx) => setForm({ ...form, prizes: form.prizes.filter((_, i) => i !== idx) });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Gift className="w-5 h-5 text-violet-600" />
          Sorteios de Prêmios
        </h3>
        <Button onClick={() => setShowForm(true)} size="sm" className="bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4 mr-1" /> Novo Sorteio
        </Button>
      </div>

      {showForm && (
        <Card className="border-violet-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              {editingId ? 'Editar Sorteio' : 'Criar Sorteio'}
              <button onClick={resetForm}><X className="w-4 h-4 text-slate-400" /></button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Título do sorteio"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
            />
            <Input
              placeholder="Descrição (opcional)"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block">Vouchers p/ giro</label>
                <Input
                  type="number"
                  min="1"
                  value={form.vouchers_per_spin}
                  onChange={e => setForm({ ...form, vouchers_per_spin: Number(e.target.value) })}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block">Encerra em</label>
                <Input
                  type="date"
                  value={form.ends_at}
                  onChange={e => setForm({ ...form, ends_at: e.target.value })}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">Prêmios da Roleta</label>
                <Button size="sm" variant="outline" onClick={addPrize}>
                  <Plus className="w-3 h-3 mr-1" /> Adicionar
                </Button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {form.prizes.map((prize, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={prize.color}
                      onChange={e => updatePrize(idx, 'color', e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                    />
                    <Input
                      placeholder="Nome do prêmio"
                      value={prize.label}
                      onChange={e => updatePrize(idx, 'label', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      min="1"
                      title="Peso (probabilidade)"
                      value={prize.weight}
                      onChange={e => updatePrize(idx, 'weight', Number(e.target.value))}
                      className="w-16 text-center"
                    />
                    {form.prizes.length > 2 && (
                      <button onClick={() => removePrize(idx)}>
                        <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-1">O número ao lado é o peso (maior = mais chance)</p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button onClick={handleSave} className="bg-violet-600 hover:bg-violet-700">Salvar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {raffles.length === 0 && !showForm ? (
        <div className="text-center py-8 text-slate-400">
          <Gift className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Nenhum sorteio criado ainda</p>
        </div>
      ) : (
        <div className="space-y-3">
          {raffles.map(raffle => (
            <Card key={raffle.id} className={!raffle.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800">{raffle.title}</span>
                      <Badge className={raffle.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}>
                        {raffle.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {raffle.prizes?.length} prêmios · {raffle.vouchers_per_spin || 1} voucher(s) p/ giro
                      {raffle.ends_at && ` · Encerra ${new Date(raffle.ends_at).toLocaleDateString('pt-BR')}`}
                    </p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {raffle.prizes?.slice(0, 6).map((p, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: p.color }}>
                          {p.label}
                        </span>
                      ))}
                      {raffle.prizes?.length > 6 && (
                        <span className="text-xs text-slate-400">+{raffle.prizes.length - 6} mais</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(raffle)}>Editar</Button>
                    <button onClick={() => handleToggle(raffle)} title={raffle.is_active ? 'Desativar' : 'Ativar'}>
                      {raffle.is_active
                        ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                        : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                    </button>
                    <button onClick={() => handleDelete(raffle.id)}>
                      <Trash2 className="w-4 h-4 text-red-400 hover:text-red-600" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}