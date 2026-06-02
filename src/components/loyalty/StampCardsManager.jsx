import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Stamp, Plus, Check, X, Loader2, Users, ToggleLeft, ToggleRight, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const DEFAULT_DISCOUNTS = ['10% OFF', '15% OFF', '20% OFF', 'Item Grátis', 'Frete Grátis', 'Brinde Surpresa'];

export default function StampCardsManager({ partnerId }) {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    stamps_goal: 5,
    reward_description: 'Complete o cartão e ganhe um desconto surpresa!',
    discount_options: ['10% OFF', '15% OFF', 'Item Grátis'],
    is_active: true
  });
  const [newDiscount, setNewDiscount] = useState('');

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['stampConfig', partnerId],
    queryFn: () => base44.entities.StampCardConfig.filter({ partner_id: partnerId }),
    enabled: !!partnerId
  });

  const { data: stampCards = [] } = useQuery({
    queryKey: ['stampCards', partnerId],
    queryFn: () => base44.entities.StampCard.filter({ partner_id: partnerId }),
    enabled: !!partnerId
  });

  const config = configs[0] || null;

  const loadFormFromConfig = (cfg) => {
    setForm({
      stamps_goal: cfg.stamps_goal || 5,
      reward_description: cfg.reward_description || '',
      discount_options: cfg.discount_options || [],
      is_active: cfg.is_active !== false
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.stamps_goal || form.discount_options.length === 0) {
      toast.error('Defina a meta de selos e ao menos um desconto surpresa.');
      return;
    }
    setSaving(true);
    const data = { ...form, partner_id: partnerId };
    if (config) {
      await base44.entities.StampCardConfig.update(config.id, data);
      toast.success('Configuração atualizada!');
    } else {
      await base44.entities.StampCardConfig.create(data);
      toast.success('Programa de selos criado!');
    }
    setSaving(false);
    qc.invalidateQueries({ queryKey: ['stampConfig', partnerId] });
    setShowForm(false);
  };

  const toggleActive = async () => {
    if (!config) return;
    await base44.entities.StampCardConfig.update(config.id, { is_active: !config.is_active });
    qc.invalidateQueries({ queryKey: ['stampConfig', partnerId] });
    toast.success(config.is_active ? 'Programa pausado.' : 'Programa ativado!');
  };

  const addDiscount = () => {
    const val = newDiscount.trim();
    if (!val || form.discount_options.includes(val)) return;
    setForm(f => ({ ...f, discount_options: [...f.discount_options, val] }));
    setNewDiscount('');
  };

  const removeDiscount = (idx) => {
    setForm(f => ({ ...f, discount_options: f.discount_options.filter((_, i) => i !== idx) }));
  };

  const unlockedCards = stampCards.filter(c => c.reward_status === 'unlocked');
  const totalCompleted = stampCards.reduce((acc, c) => acc + (c.total_completed || 0), 0);
  const activeUsers = new Set(stampCards.map(c => c.user_email)).size;

  if (isLoading) return <p className="text-sm text-slate-400 py-6 text-center">Carregando...</p>;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Usuários Ativos', value: activeUsers, icon: Users, color: 'text-blue-600 bg-blue-100' },
          { label: 'Cartões Completos', value: totalCompleted, icon: Stamp, color: 'text-violet-600 bg-violet-100' },
          { label: 'Prêmios Desbloqueados', value: unlockedCards.length, icon: Gift, color: 'text-amber-600 bg-amber-100' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <Card key={i}>
              <CardContent className="p-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${s.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Current Config */}
      {config && !showForm && (
        <div className={`rounded-2xl border-2 p-5 ${config.is_active ? 'border-violet-200 bg-violet-50/30' : 'border-slate-200 bg-slate-50 opacity-70'}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Stamp className="w-5 h-5 text-violet-600" />
              <p className="font-bold text-slate-800">Programa de Selos</p>
              <Badge className={config.is_active ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-slate-200 text-slate-500 border-0'}>
                {config.is_active ? 'Ativo' : 'Pausado'}
              </Badge>
            </div>
            <div className="flex gap-2">
              <button onClick={toggleActive} className="p-2 rounded-lg hover:bg-white transition-colors" title={config.is_active ? 'Pausar' : 'Ativar'}>
                {config.is_active
                  ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                  : <ToggleLeft className="w-5 h-5 text-slate-400" />}
              </button>
              <Button size="sm" variant="outline" onClick={() => loadFormFromConfig(config)}>Editar</Button>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <span className="text-slate-600">🎯 Meta: <b>{config.stamps_goal} selos</b></span>
            <span className="text-slate-600">🎁 {config.discount_options?.length || 0} opções de desconto surpresa</span>
          </div>
          {config.reward_description && (
            <p className="text-xs text-slate-500 mt-2 italic">"{config.reward_description}"</p>
          )}
          <div className="flex flex-wrap gap-2 mt-3">
            {(config.discount_options || []).map((d, i) => (
              <Badge key={i} className="bg-fuchsia-100 text-fuchsia-700 border-0 text-xs">{d}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* No config yet */}
      {!config && !showForm && (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <Stamp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-600">Programa de Selos não configurado</p>
          <p className="text-xs text-slate-400 mt-1 mb-4">A cada 5 compras, o cliente ganha um desconto surpresa!</p>
          <Button
            size="sm"
            className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-4 h-4" /> Configurar Agora
          </Button>
        </div>
      )}

      {/* Create button when config exists */}
      {config && !showForm && (
        <div />
      )}

      {/* Form */}
      {showForm && (
        <Card className="border-2 border-violet-200">
          <CardContent className="p-5 space-y-4">
            <p className="font-semibold text-slate-800 text-sm">{config ? 'Editar Programa de Selos' : 'Criar Programa de Selos'}</p>

            <div className="space-y-1">
              <Label className="text-xs">Quantos selos para completar o cartão?</Label>
              <Input
                type="number" min={3} max={20}
                value={form.stamps_goal}
                onChange={e => setForm(f => ({ ...f, stamps_goal: Number(e.target.value) }))}
              />
              <p className="text-xs text-slate-400">Recomendado: 5 selos (1 por compra com voucher)</p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Mensagem de teaser (exibida antes de completar)</Label>
              <Input
                value={form.reward_description}
                onChange={e => setForm(f => ({ ...f, reward_description: e.target.value }))}
                placeholder="Ex: Complete e ganhe um desconto surpresa!"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Descontos Surpresa possíveis (sorteado ao completar)</Label>
              <p className="text-xs text-slate-400">Adicione as opções que serão sorteadas quando o cliente completar o cartão.</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.discount_options.map((d, i) => (
                  <Badge key={i} className="bg-fuchsia-100 text-fuchsia-700 border-0 text-xs flex items-center gap-1 pl-2">
                    {d}
                    <button onClick={() => removeDiscount(i)} className="ml-1 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: 15% OFF"
                  value={newDiscount}
                  onChange={e => setNewDiscount(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addDiscount()}
                  className="flex-1"
                />
                <Button size="sm" variant="outline" onClick={addDiscount}><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {DEFAULT_DISCOUNTS.filter(d => !form.discount_options.includes(d)).map((d, i) => (
                  <button
                    key={i}
                    onClick={() => setForm(f => ({ ...f, discount_options: [...f.discount_options, d] }))}
                    className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 hover:bg-violet-100 hover:text-violet-700 transition-colors"
                  >
                    + {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
                <X className="w-4 h-4 mr-1" /> Cancelar
              </Button>
              <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Unlocked prizes to validate */}
      {unlockedCards.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="font-semibold text-amber-800 text-sm mb-3 flex items-center gap-2">
            <Gift className="w-4 h-4" />
            {unlockedCards.length} Prêmio{unlockedCards.length > 1 ? 's' : ''} Desbloqueado{unlockedCards.length > 1 ? 's' : ''} aguardando uso
          </p>
          <div className="space-y-2">
            {unlockedCards.map(card => (
              <div key={card.id} className="flex items-center justify-between bg-white rounded-xl p-3 gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{card.user_email}</p>
                  <p className="text-xs text-slate-500">
                    Desconto: <span className="font-bold text-fuchsia-600">{card.discount_revealed}</span>
                    {' · '}Código: <span className="font-mono font-bold text-amber-700">{card.reward_code}</span>
                  </p>
                </div>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shrink-0"
                  onClick={async () => {
                    await base44.entities.StampCard.update(card.id, { reward_status: 'used' });
                    qc.invalidateQueries({ queryKey: ['stampCards', partnerId] });
                    toast.success('Prêmio marcado como utilizado!');
                  }}
                >
                  <Check className="w-3 h-3" /> Marcar Usado
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}