import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Gift, Trash2, Edit2, Check, X, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

const REWARD_TYPE_LABELS = {
  desconto_percentual: { label: 'Desconto %', color: 'bg-blue-100 text-blue-700', symbol: '%' },
  desconto_fixo:       { label: 'Desconto R$', color: 'bg-emerald-100 text-emerald-700', symbol: 'R$' },
  item_gratis:         { label: 'Item Grátis', color: 'bg-amber-100 text-amber-700', symbol: '' },
  servico_gratis:      { label: 'Serviço Grátis', color: 'bg-violet-100 text-violet-700', symbol: '' },
  brinde:              { label: 'Brinde', color: 'bg-fuchsia-100 text-fuchsia-700', symbol: '' },
};

const EMPTY_FORM = {
  title: '',
  description: '',
  points_required: 100,
  reward_type: 'desconto_percentual',
  reward_value: 10,
  max_redemptions: 0,
  is_active: true,
  expires_at: ''
};

export default function LoyaltyRewardsManager({ partnerId }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const { data: rewards = [], isLoading } = useQuery({
    queryKey: ['loyaltyRewards', partnerId],
    queryFn: () => base44.entities.LoyaltyReward.filter({ partner_id: partnerId }),
    enabled: !!partnerId
  });

  const { data: redemptions = [] } = useQuery({
    queryKey: ['loyaltyRedemptions', partnerId],
    queryFn: () => base44.entities.LoyaltyRedemption.filter({ partner_id: partnerId }),
    enabled: !!partnerId
  });

  const pendingRedemptions = redemptions.filter(r => r.status === 'pending');

  const invalidate = () => qc.invalidateQueries({ queryKey: ['loyaltyRewards', partnerId] });

  const startEdit = (reward) => {
    setForm({ ...reward });
    setEditingId(reward.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!form.title || !form.points_required) {
      toast.error('Preencha título e pontos necessários.');
      return;
    }
    setSaving(true);
    const data = { ...form, partner_id: partnerId };
    if (editingId) {
      await base44.entities.LoyaltyReward.update(editingId, data);
      toast.success('Recompensa atualizada!');
    } else {
      await base44.entities.LoyaltyReward.create(data);
      toast.success('Recompensa criada!');
    }
    setSaving(false);
    invalidate();
    resetForm();
  };

  const toggleActive = async (reward) => {
    await base44.entities.LoyaltyReward.update(reward.id, { is_active: !reward.is_active });
    invalidate();
  };

  const handleDelete = async (id) => {
    if (!confirm('Excluir esta recompensa?')) return;
    await base44.entities.LoyaltyReward.delete(id);
    invalidate();
    toast.success('Recompensa removida.');
  };

  const markUsed = async (redemption) => {
    await base44.entities.LoyaltyRedemption.update(redemption.id, {
      status: 'used',
      used_at: new Date().toISOString()
    });
    qc.invalidateQueries({ queryKey: ['loyaltyRedemptions', partnerId] });
    toast.success('Resgate marcado como utilizado!');
  };

  return (
    <div className="space-y-6">
      {/* Pending redemptions alert */}
      {pendingRedemptions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="font-semibold text-amber-800 text-sm mb-3 flex items-center gap-2">
            <Gift className="w-4 h-4" />
            {pendingRedemptions.length} Resgate{pendingRedemptions.length > 1 ? 's' : ''} Pendente{pendingRedemptions.length > 1 ? 's' : ''}
          </p>
          <div className="space-y-2">
            {pendingRedemptions.map(r => (
              <div key={r.id} className="flex items-center justify-between bg-white rounded-xl p-3 gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{r.reward_title}</p>
                  <p className="text-xs text-slate-500">{r.user_email} · Código: <span className="font-mono font-bold text-amber-700">{r.redemption_code}</span></p>
                </div>
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shrink-0" onClick={() => markUsed(r)}>
                  <Check className="w-3 h-3" /> Marcar Usado
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Gift className="w-5 h-5 text-violet-600" />
          Recompensas de Fidelidade
        </h3>
        <Button
          size="sm"
          className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
          onClick={() => { resetForm(); setShowForm(true); }}
        >
          <Plus className="w-4 h-4" /> Nova Recompensa
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-2 border-violet-200">
          <CardContent className="p-5 space-y-4">
            <p className="font-semibold text-slate-800 text-sm">{editingId ? 'Editar Recompensa' : 'Nova Recompensa'}</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs">Título *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Café Grátis" />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs">Descrição</Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Um café expresso ou americano à escolha" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Tipo de Recompensa *</Label>
                <select
                  value={form.reward_type}
                  onChange={e => setForm(f => ({ ...f, reward_type: e.target.value }))}
                  className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-sm"
                >
                  {Object.entries(REWARD_TYPE_LABELS).map(([v, cfg]) => (
                    <option key={v} value={v}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">
                  {form.reward_type === 'desconto_percentual' ? 'Desconto (%)' :
                   form.reward_type === 'desconto_fixo' ? 'Desconto (R$)' : 'Valor (deixe 0 se N/A)'}
                </Label>
                <Input type="number" min={0} value={form.reward_value} onChange={e => setForm(f => ({ ...f, reward_value: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Pontos Necessários *</Label>
                <Input type="number" min={1} value={form.points_required} onChange={e => setForm(f => ({ ...f, points_required: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Limite de Resgates (0 = ilimitado)</Label>
                <Input type="number" min={0} value={form.max_redemptions} onChange={e => setForm(f => ({ ...f, max_redemptions: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Válido até (opcional)</Label>
                <Input type="date" value={form.expires_at || ''} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" size="sm" onClick={resetForm}><X className="w-4 h-4 mr-1" /> Cancelar</Button>
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {isLoading ? (
        <p className="text-sm text-slate-400 text-center py-6">Carregando...</p>
      ) : rewards.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Gift className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">Nenhuma recompensa cadastrada.</p>
          <p className="text-slate-400 text-xs mt-1">Crie recompensas que seus clientes fiéis podem resgatar com pontos.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rewards.map(reward => {
            const typeCfg = REWARD_TYPE_LABELS[reward.reward_type] || REWARD_TYPE_LABELS.brinde;
            const redeemCount = redemptions.filter(r => r.reward_id === reward.id && r.status === 'used').length;
            return (
              <div key={reward.id} className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${reward.is_active ? 'border-violet-200 bg-violet-50/30' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                <div className="w-12 h-12 rounded-xl bg-white border border-violet-200 flex items-center justify-center text-2xl shrink-0">
                  {reward.reward_type === 'item_gratis' ? '🎁' :
                   reward.reward_type === 'desconto_percentual' ? '🏷️' :
                   reward.reward_type === 'desconto_fixo' ? '💰' :
                   reward.reward_type === 'servico_gratis' ? '✨' : '🎀'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-800 text-sm">{reward.title}</p>
                    <Badge className={`${typeCfg.color} text-xs border-0`}>{typeCfg.label}</Badge>
                    {!reward.is_active && <Badge className="bg-slate-200 text-slate-500 text-xs border-0">Inativa</Badge>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{reward.description}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-bold text-violet-700">🪙 {reward.points_required} pts</span>
                    {redeemCount > 0 && <span className="text-xs text-slate-400">{redeemCount} resgate{redeemCount > 1 ? 's' : ''}</span>}
                    {reward.expires_at && <span className="text-xs text-slate-400">até {new Date(reward.expires_at).toLocaleDateString('pt-BR')}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleActive(reward)} className="p-2 rounded-lg hover:bg-white transition-colors" title={reward.is_active ? 'Desativar' : 'Ativar'}>
                    {reward.is_active ? <ToggleRight className="w-5 h-5 text-emerald-500" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                  </button>
                  <button onClick={() => startEdit(reward)} className="p-2 rounded-lg hover:bg-white transition-colors">
                    <Edit2 className="w-4 h-4 text-slate-500" />
                  </button>
                  <button onClick={() => handleDelete(reward.id)} className="p-2 rounded-lg hover:bg-white transition-colors">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}