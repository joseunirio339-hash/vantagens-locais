import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Users, Plus, Copy, Check, Trash2, TrendingUp,
  DollarSign, UserCheck, X, ExternalLink, ShieldAlert,
  Trophy, Medal, Crown, Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';

export default function RepresentativesDashboard() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [newRep, setNewRep] = useState({ name: '', email: '', phone: '', code: '' });
  const [copiedCode, setCopiedCode] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const load = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) { base44.auth.redirectToLogin(); return; }
      const u = await base44.auth.me();
      setUser(u);
      setIsAdmin(u.role === 'admin');
    };
    load();
  }, []);

  const { data: reps = [], isLoading } = useQuery({
    queryKey: ['representatives'],
    queryFn: () => base44.entities.Representative.list('-created_date', 50),
    enabled: isAdmin,
  });

  const { data: commissions = [] } = useQuery({
    queryKey: ['representativeCommissions'],
    queryFn: () => base44.entities.RepresentativeCommission.list('-created_date', 50),
    enabled: isAdmin,
  });

  const getRepCommissions = (repId) => commissions.filter(c => c.representative_id === repId);
  const getRepTotalPaid = (repId) => getRepCommissions(repId)
    .filter(c => c.status === 'paid')
    .reduce((sum, c) => sum + c.commission_amount, 0);

  const generateCode = (name) => {
    const clean = name.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const random = Math.floor(Math.random() * 90 + 10);
    return clean.substring(0, 10) + random;
  };

  const handleCreateRep = async () => {
    if (!newRep.name || !newRep.email || !newRep.code) return;
    await base44.entities.Representative.create({
      name: newRep.name,
      email: newRep.email,
      phone: newRep.phone,
      code: newRep.code,
      commission_percentage: 50,
    });
    setFormOpen(false);
    setNewRep({ name: '', email: '', phone: '', code: '' });
    queryClient.invalidateQueries({ queryKey: ['representatives'] });
  };

  const handleToggleStatus = async (rep) => {
    await base44.entities.Representative.update(rep.id, { is_active: !rep.is_active });
    queryClient.invalidateQueries({ queryKey: ['representatives'] });
  };

  const handleDelete = async (rep) => {
    if (!confirm(`Tem certeza que deseja remover ${rep.name}?`)) return;
    await base44.entities.Representative.delete(rep.id);
    queryClient.invalidateQueries({ queryKey: ['representatives'] });
  };

  const copyLink = (code) => {
    const link = `https://app.clubemaxdescontos.com.br/rep/${code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (!isAdmin) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <ShieldAlert className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-700 mb-2">Acesso Restrito</h1>
        <p className="text-slate-500">Apenas administradores do sistema podem acessar este painel.</p>
      </div>
    );
  }

  const totalSales = reps.reduce((sum, r) => sum + (r.total_sales || 0), 0);
  const totalEarned = reps.reduce((sum, r) => sum + (r.total_earned || 0), 0);

  // Ranking mensal: comissões do mês atual por representante
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthlyCommissions = commissions.filter(c => c.created_date >= monthStart);
  const ranking = reps
    .map(rep => {
      const repMonthly = monthlyCommissions.filter(c => c.representative_id === rep.id);
      const total = repMonthly.reduce((sum, c) => sum + (c.commission_amount || 0), 0);
      const count = repMonthly.length;
      return { ...rep, monthlyTotal: total, monthlyCount: count };
    })
    .sort((a, b) => b.monthlyTotal - a.monthlyTotal);

  const monthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const rankColors = ['bg-amber-400', 'bg-slate-300', 'bg-amber-700'];
  const rankIcons = [Crown, Medal, Star];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-violet-600" />
            Painel de Representantes
          </h1>
          <p className="text-slate-500 text-sm">Gerencie representantes e acompanhe comissões</p>
        </div>
        <Button onClick={() => setFormOpen(true)} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="w-4 h-4 mr-2" /> Novo Representante
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 mb-1">Representantes</p>
            <p className="text-2xl font-bold text-slate-800">{reps.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 mb-1">Total de Vendas</p>
            <p className="text-2xl font-bold text-emerald-600">{totalSales}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 mb-1">Comissões a Pagar</p>
            <p className="text-2xl font-bold text-amber-600">
              R$ {totalEarned.toFixed(2).replace('.', ',')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-500 mb-1">Comissão Padrão</p>
            <p className="text-2xl font-bold text-violet-600">50%</p>
          </CardContent>
        </Card>
      </div>

      {/* Ranking Mensal */}
      <Card className="mb-8 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-amber-500" />
            Ranking de Vendas — {monthName}
          </CardTitle>
          <p className="text-sm text-slate-500">Volume total de assinaturas vendidas por cada representante neste mês</p>
        </CardHeader>
        <CardContent>
          {ranking.length === 0 ? (
            <p className="text-center text-slate-400 py-4 text-sm">Nenhuma venda registrada este mês.</p>
          ) : (
            <div className="space-y-2">
              {ranking.map((rep, idx) => {
                const RankIcon = idx < 3 ? rankIcons[idx] : null;
                const rankBg = idx < 3 ? rankColors[idx] : 'bg-slate-100';
                const rankText = idx < 3 ? 'text-white' : 'text-slate-500';
                return (
                  <div key={rep.id} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-white/60 transition-colors">
                    {/* Posição */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${rankBg} ${rankText}`}>
                      {RankIcon ? <RankIcon className="w-4 h-4" /> : idx + 1}
                    </div>
                    {/* Nome */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm truncate">{rep.name}</p>
                      <p className="text-xs text-slate-400">{rep.monthlyCount} venda{rep.monthlyCount !== 1 ? 's' : ''} no mês</p>
                    </div>
                    {/* Barra de progresso */}
                    <div className="flex-1 max-w-[200px] hidden md:block">
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all"
                          style={{ width: `${ranking[0]?.monthlyTotal > 0 ? (rep.monthlyTotal / ranking[0].monthlyTotal) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                    {/* Valor */}
                    <div className="text-right shrink-0">
                      <p className="font-bold text-amber-700 text-sm">
                        R$ {rep.monthlyTotal.toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-xs text-slate-400">em comissões</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reps List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : reps.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhum representante cadastrado</p>
            <Button variant="outline" className="mt-4" onClick={() => setFormOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Criar primeiro representante
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reps.map(rep => {
            const repCommissions = getRepCommissions(rep.id);
            return (
              <Card key={rep.id} className={!rep.is_active ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-800">{rep.name}</h3>
                        <Badge variant={rep.is_active ? 'default' : 'secondary'} className="text-xs">
                          {rep.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                        {rep.total_sales > 0 && (
                          <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-xs">
                            {rep.total_sales} venda{rep.total_sales !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{rep.email}{rep.phone ? ` · ${rep.phone}` : ''}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded font-mono">
                          /rep/{rep.code}
                        </code>
                        <button
                          onClick={() => copyLink(rep.code)}
                          className="text-slate-400 hover:text-violet-600 transition-colors"
                        >
                          {copiedCode === rep.code ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <a href={`/rep/${rep.code}`} target="_blank" rel="noopener noreferrer"
                          className="text-slate-400 hover:text-violet-600 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Comissões</p>
                        <p className="font-bold text-emerald-600">
                          R$ {getRepTotalPaid(rep.id).toFixed(2).replace('.', ',')}
                        </p>
                        <p className="text-xs text-slate-400">{repCommissions.length} registro{repCommissions.length !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(rep)}
                          className={rep.is_active ? 'text-amber-600' : 'text-emerald-600'}>
                          {rep.is_active ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(rep)} className="text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Commission history for this rep */}
                  {repCommissions.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-xs font-semibold text-slate-500 mb-2">Histórico de comissões</p>
                      <div className="space-y-1">
                        {repCommissions.slice(0, 5).map(c => (
                          <div key={c.id} className="flex items-center justify-between text-xs">
                            <span className="text-slate-600 truncate max-w-[200px]">{c.customer_email}</span>
                            <span className="text-slate-400">{c.subscription_type}</span>
                            <span className="font-semibold text-emerald-600">R$ {c.commission_amount.toFixed(2).replace('.', ',')}</span>
                            <Badge variant={c.status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                              {c.status === 'paid' ? 'Pago' : 'Pendente'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Rep Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Representante</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Nome completo *</label>
              <Input
                value={newRep.name}
                onChange={e => {
                  const name = e.target.value;
                  setNewRep(prev => ({
                    ...prev,
                    name,
                    code: prev.code || generateCode(name)
                  }));
                }}
                placeholder="Ex: Marcos Silva"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Email *</label>
              <Input
                type="email"
                value={newRep.email}
                onChange={e => setNewRep(prev => ({ ...prev, email: e.target.value }))}
                placeholder="marcos@email.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">WhatsApp</label>
              <Input
                value={newRep.phone}
                onChange={e => setNewRep(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(21) 99999-9999"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Código do link *</label>
              <Input
                value={newRep.code}
                onChange={e => setNewRep(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="MARCOS10"
              />
              <p className="text-xs text-slate-400 mt-1">
                Link: app.clubemaxdescontos.com.br/rep/{newRep.code || 'CODIGO'}
              </p>
            </div>
            <p className="text-sm text-slate-500 bg-violet-50 p-3 rounded-lg">
              💰 Comissão padrão: <strong>50%</strong> sobre a 1ª mensalidade de cada venda
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateRep} disabled={!newRep.name || !newRep.email || !newRep.code}
              className="bg-violet-600 hover:bg-violet-700">
              Criar Representante
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}