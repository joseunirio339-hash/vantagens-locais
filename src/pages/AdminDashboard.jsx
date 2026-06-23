import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users, Store, Ticket, CreditCard, Search, CheckCircle,
  XCircle, Clock, Loader2, ShieldAlert, TrendingUp, BarChart2,
  Trash2, Edit2, RefreshCw, Plus, Copy, Check, Trophy, Medal, Crown, Star, ExternalLink, DollarSign, PieChart
} from 'lucide-react';
import ConsolidatedCharts from '@/components/admin/ConsolidatedCharts';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [searchPartner, setSearchPartner] = useState('');
  const [searchSub, setSearchSub] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState('user');
  const [creating, setCreating] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  // Reps state
  const [repFormOpen, setRepFormOpen] = useState(false);
  const [newRep, setNewRep] = useState({ name: '', email: '', phone: '', code: '' });
  const [copiedCode, setCopiedCode] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const init = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) { base44.auth.redirectToLogin(window.location.pathname); return; }
      const me = await base44.auth.me();
      if (me.role !== 'admin') { window.location.href = '/'; return; }
      setUser(me);
      setAuthLoading(false);
    };
    init();
  }, []);

  const { data: partners = [] } = useQuery({
    queryKey: ['admin-partners'],
    queryFn: () => base44.entities.Partner.list('-created_date', 200),
    enabled: !!user
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: () => base44.entities.Subscription.list('-created_date', 200),
    enabled: !!user
  });

  const { data: vouchers = [] } = useQuery({
    queryKey: ['admin-vouchers'],
    queryFn: () => base44.entities.Voucher.list('-created_date', 200),
    enabled: !!user
  });

  const { data: appUsers = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list('-created_date', 200),
    enabled: !!user
  });

  const { data: reps = [], isLoading: repsLoading } = useQuery({
    queryKey: ['admin-representatives'],
    queryFn: () => base44.entities.Representative.list('-created_date', 50),
    enabled: !!user
  });

  const { data: repCommissions = [] } = useQuery({
    queryKey: ['admin-repCommissions'],
    queryFn: () => base44.entities.RepresentativeCommission.list('-created_date', 200),
    enabled: !!user
  });

  // Metrics
  const totalRevenue = subscriptions.filter(s => s.status === 'active').reduce((acc, s) => acc + (s.price || 0), 0);
  const activePartners = partners.filter(p => p.subscription_status === 'active').length;
  const pendingPartners = partners.filter(p => p.subscription_status === 'pending').length;
  const usedVouchers = vouchers.filter(v => v.status === 'used').length;

  const updatePartnerStatus = async (partner, status) => {
    await base44.entities.Partner.update(partner.id, { subscription_status: status });
    queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
    toast.success(`Parceiro ${status === 'active' ? 'aprovado' : 'suspenso'}!`);
  };

  const updateSubscriptionStatus = async (sub, status) => {
    await base44.entities.Subscription.update(sub.id, { status });
    queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
    toast.success('Assinatura atualizada!');
  };

  const deletePartner = async (partner) => {
    if (!confirm(`Excluir parceiro "${partner.business_name}"?`)) return;
    await base44.entities.Partner.delete(partner.id);
    queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
    toast.success('Parceiro excluído!');
  };

  // User management — direct creation with email + password
  const createUser = async () => {
    if (!createEmail || !createPassword || !createRole) return;
    setCreating(true);
    try {
      await base44.auth.register({
        email: createEmail.trim().toLowerCase(),
        password: createPassword
      });
      // Small delay to ensure user record is created
      await new Promise(r => setTimeout(r, 1500));
      // Update role if needed
      if (createRole !== 'user') {
        const users = await base44.entities.User.filter({ email: createEmail.trim().toLowerCase() });
        if (users.length > 0) {
          await base44.entities.User.update(users[0].id, { role: createRole });
        }
      }
      toast.success(`Usuário ${createEmail} criado com sucesso!`);
      setCreateEmail('');
      setCreatePassword('');
      setCreateRole('user');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (e) {
      toast.error('Erro ao criar usuário: ' + (e.message || 'Tente novamente.'));
    }
    setCreating(false);
  };

  const updateUserRole = async (u, role) => {
    await base44.entities.User.update(u.id, { role });
    setEditingUserId(null);
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    toast.success(`Função de ${u.full_name || u.email} alterada para ${role}!`);
  };

  const deleteUser = async (u) => {
    if (!confirm(`Excluir usuário "${u.full_name || u.email}"? Esta ação não pode ser desfeita.`)) return;
    await base44.entities.User.delete(u.id);
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    toast.success('Usuário excluído!');
  };

  // Representative helpers
  const generateCode = (name) => {
    const clean = name.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const random = Math.floor(Math.random() * 90 + 10);
    return clean.substring(0, 10) + random;
  };

  const handleCreateRep = async () => {
    if (!newRep.name || !newRep.email || !newRep.code) return;
    await base44.entities.Representative.create({
      name: newRep.name, email: newRep.email, phone: newRep.phone,
      code: newRep.code, commission_percentage: 5,
    });
    setRepFormOpen(false);
    setNewRep({ name: '', email: '', phone: '', code: '' });
    queryClient.invalidateQueries({ queryKey: ['admin-representatives'] });
    toast.success('Representante criado!');
  };

  const handleToggleRep = async (rep) => {
    await base44.entities.Representative.update(rep.id, { is_active: !rep.is_active });
    queryClient.invalidateQueries({ queryKey: ['admin-representatives'] });
    toast.success(`Representante ${rep.is_active ? 'desativado' : 'ativado'}!`);
  };

  const handleDeleteRep = async (rep) => {
    if (!confirm(`Remover ${rep.name}?`)) return;
    await base44.entities.Representative.delete(rep.id);
    queryClient.invalidateQueries({ queryKey: ['admin-representatives'] });
    toast.success('Representante removido!');
  };

  const markCommPaid = async (c) => {
    await base44.entities.RepresentativeCommission.update(c.id, { status: 'paid' });
    queryClient.invalidateQueries({ queryKey: ['admin-repCommissions'] });
    toast.success('Comissão baixada!');
  };

  const markCommPending = async (c) => {
    await base44.entities.RepresentativeCommission.update(c.id, { status: 'pending' });
    queryClient.invalidateQueries({ queryKey: ['admin-repCommissions'] });
    toast.success('Comissão estornada!');
  };

  const copyRepLink = (code) => {
    const link = `https://vantagens-locais-app.base44.app/rep/${code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Rep stats
  const repTotalSales = reps.reduce((s, r) => s + (r.total_sales || 0), 0);
  const pendingCommissions = repCommissions.filter(c => c.status === 'pending');
  const pendingCommsTotal = pendingCommissions.reduce((s, c) => s + (c.commission_amount || 0), 0);
  const paidCommsTotal = repCommissions.filter(c => c.status === 'paid').reduce((s, c) => s + (c.commission_amount || 0), 0);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthlyComms = repCommissions.filter(c => c.created_date >= monthStart);
  const repRanking = reps.map(r => {
    const rm = monthlyComms.filter(c => c.representative_id === r.id);
    return { ...r, monthlyTotal: rm.reduce((s, c) => s + (c.commission_amount || 0), 0), monthlyCount: rm.length };
  }).sort((a, b) => b.monthlyTotal - a.monthlyTotal);
  const monthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const rankIcons = [Crown, Medal, Star];
  const rankColors = ['bg-amber-400', 'bg-slate-300', 'bg-amber-700'];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const filteredPartners = partners.filter(p =>
    p.business_name?.toLowerCase().includes(searchPartner.toLowerCase()) ||
    p.owner_email?.toLowerCase().includes(searchPartner.toLowerCase())
  );

  const filteredSubs = subscriptions.filter(s =>
    s.user_email?.toLowerCase().includes(searchSub.toLowerCase())
  );

  const filteredUsers = appUsers.filter(u =>
    !searchUser ||
    u.full_name?.toLowerCase().includes(searchUser.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchUser.toLowerCase())
  );

  const statusColor = {
    active: 'bg-emerald-100 text-emerald-700',
    expired: 'bg-red-100 text-red-700',
    pending: 'bg-yellow-100 text-yellow-700',
    trial: 'bg-blue-100 text-blue-700',
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-stone-800 to-stone-900 text-white px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="w-7 h-7 text-amber-400" />
            <h1 className="text-2xl font-bold">Painel Administrativo</h1>
          </div>
          <p className="text-stone-400 text-sm">Clube Max Descontos — Gestão completa da plataforma</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Usuários', value: appUsers.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Parceiros Ativos', value: activePartners, icon: Store, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Vouchers Usados', value: usedVouchers, icon: Ticket, color: 'text-orange-600', bg: 'bg-orange-50' },
            { label: 'Receita Ativa (R$)', value: totalRevenue.toFixed(2).replace('.', ','), icon: TrendingUp, color: 'text-violet-600', bg: 'bg-violet-50' },
          ].map((m, i) => {
            const Icon = m.icon;
            return (
              <Card key={i}>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${m.bg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${m.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{m.value}</p>
                    <p className="text-xs text-slate-500">{m.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="partners">
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="partners" className="flex items-center gap-1">
              <Store className="w-4 h-4" /> Parceiros
              {pendingPartners > 0 && (
                <span className="ml-1 bg-yellow-500 text-white text-xs rounded-full px-1.5">{pendingPartners}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-1">
              <CreditCard className="w-4 h-4" /> Assinaturas
            </TabsTrigger>
            <TabsTrigger value="vouchers" className="flex items-center gap-1">
              <Ticket className="w-4 h-4" /> Vouchers
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-1">
              <Users className="w-4 h-4" /> Usuários
            </TabsTrigger>
            <TabsTrigger value="representatives" className="flex items-center gap-1">
              <Users className="w-4 h-4" /> Representantes
            </TabsTrigger>
            <TabsTrigger value="consolidated" className="flex items-center gap-1">
              <PieChart className="w-4 h-4" /> Consolidado
            </TabsTrigger>
          </TabsList>

          {/* PARCEIROS */}
          <TabsContent value="partners">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-base">Parceiros ({filteredPartners.length})</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input className="pl-9 h-8 text-sm" placeholder="Buscar parceiro..." value={searchPartner} onChange={e => setSearchPartner(e.target.value)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredPartners.map(partner => (
                    <div key={partner.id} className="px-6 py-4 flex items-center justify-between gap-3 flex-wrap hover:bg-slate-50">
                      <div className="flex items-center gap-3 min-w-0">
                        {partner.logo_url ? (
                          <img src={partner.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                            <Store className="w-5 h-5 text-violet-600" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 truncate">{partner.business_name}</p>
                          <p className="text-xs text-slate-500 truncate">{partner.owner_email} · {partner.city || '—'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[partner.subscription_status] || 'bg-slate-100 text-slate-600'}`}>
                          {partner.subscription_status}
                        </span>
                        {partner.subscription_status !== 'active' && (
                          <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => updatePartnerStatus(partner, 'active')}>
                            <CheckCircle className="w-3 h-3 mr-1" /> Aprovar
                          </Button>
                        )}
                        {partner.subscription_status === 'active' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs text-orange-600 border-orange-300" onClick={() => updatePartnerStatus(partner, 'pending')}>
                            <XCircle className="w-3 h-3 mr-1" /> Suspender
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 hover:bg-red-50" onClick={() => deletePartner(partner)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {filteredPartners.length === 0 && (
                    <div className="py-12 text-center text-slate-400">Nenhum parceiro encontrado</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ASSINATURAS */}
          <TabsContent value="subscriptions">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-base">Assinaturas ({filteredSubs.length})</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input className="pl-9 h-8 text-sm" placeholder="Buscar por email..." value={searchSub} onChange={e => setSearchSub(e.target.value)} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredSubs.map(sub => (
                    <div key={sub.id} className="px-6 py-4 flex items-center justify-between gap-3 flex-wrap hover:bg-slate-50">
                      <div>
                        <p className="font-medium text-slate-800 text-sm">{sub.user_email}</p>
                        <p className="text-xs text-slate-500">
                          {sub.type} · R$ {sub.price?.toFixed(2).replace('.', ',') || '0,00'} · Expira: {sub.expires_at || '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[sub.status] || 'bg-slate-100 text-slate-600'}`}>
                          {sub.status}
                        </span>
                        <Select value={sub.status} onValueChange={v => updateSubscriptionStatus(sub, v)}>
                          <SelectTrigger className="h-7 text-xs w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="trial">Trial</SelectItem>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="expired">Expirado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                  {filteredSubs.length === 0 && (
                    <div className="py-12 text-center text-slate-400">Nenhuma assinatura encontrada</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* VOUCHERS */}
          <TabsContent value="vouchers">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Vouchers ({vouchers.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {vouchers.slice(0, 100).map(v => (
                    <div key={v.id} className="px-6 py-3 flex items-center justify-between gap-3 flex-wrap hover:bg-slate-50">
                      <div>
                        <p className="font-mono text-sm font-bold text-slate-700">{v.code}</p>
                        <p className="text-xs text-slate-500">{v.product_name} · {v.user_name || v.user_email} · R$ {v.discount_price?.toFixed(2).replace('.', ',')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[v.status] || 'bg-slate-100 text-slate-600'}`}>
                          {v.status}
                        </span>
                        {v.used_at && <p className="text-xs text-slate-400">Usado: {new Date(v.used_at).toLocaleDateString('pt-BR')}</p>}
                      </div>
                    </div>
                  ))}
                  {vouchers.length === 0 && (
                    <div className="py-12 text-center text-slate-400">Nenhum voucher encontrado</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* USUÁRIOS */}
          <TabsContent value="users">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-base">Usuários ({filteredUsers.length})</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input className="pl-9 h-8 text-sm" placeholder="Buscar por nome ou email..." value={searchUser} onChange={e => setSearchUser(e.target.value)} />
                  </div>
                </div>
              </CardHeader>

              {/* Create user form */}
              <div className="px-6 py-4 bg-amber-50/50 border-y border-amber-100">
                <p className="text-sm font-semibold text-amber-800 mb-3">Criar novo usuário</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={createEmail}
                    onChange={e => setCreateEmail(e.target.value)}
                    className="h-9 text-sm flex-1"
                  />
                  <Input
                    type="password"
                    placeholder="Senha"
                    value={createPassword}
                    onChange={e => setCreatePassword(e.target.value)}
                    className="h-9 text-sm w-full sm:w-40"
                    onKeyDown={e => e.key === 'Enter' && createUser()}
                  />
                  <Select value={createRole} onValueChange={setCreateRole}>
                    <SelectTrigger className="h-9 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={createUser} disabled={!createEmail || !createPassword || creating} className="bg-amber-500 hover:bg-amber-600 h-9">
                    {creating ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    Criar
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2">O usuário será criado com o email e senha fornecidos. Um código de verificação será enviado automaticamente.</p>
              </div>

              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredUsers.map(u => (
                    <div key={u.id} className="px-6 py-3 flex items-center justify-between gap-3 hover:bg-slate-50">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-sm font-bold text-amber-700 flex-shrink-0">
                          {u.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{u.full_name || '—'}</p>
                          <p className="text-xs text-slate-500 truncate">{u.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {editingUserId === u.id ? (
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateUserRole(u, 'user')}>
                              Usuário
                            </Button>
                            <Button size="sm" className="h-7 text-xs bg-amber-500 hover:bg-amber-600" onClick={() => updateUserRole(u, 'admin')}>
                              Admin
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-400" onClick={() => setEditingUserId(null)}>
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Badge variant={u.role === 'admin' ? 'default' : 'outline'} className={`text-xs ${u.role === 'admin' ? 'bg-amber-500' : ''}`}>
                              {u.role === 'admin' ? 'Admin' : 'Usuário'}
                            </Badge>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingUserId(u.id)}>
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500 hover:bg-red-50" onClick={() => deleteUser(u)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredUsers.length === 0 && (
                    <div className="py-12 text-center text-slate-400">
                      {appUsers.length === 0 ? 'Nenhum usuário cadastrado' : 'Nenhum usuário encontrado com este filtro'}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* REPRESENTANTES */}
          <TabsContent value="representatives">
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Representantes', value: reps.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Total de Vendas', value: repTotalSales, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Comissões a Pagar', value: `R$ ${pendingCommsTotal.toFixed(2).replace('.', ',')}`, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Comissão Padrão', value: '50%', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map((m, i) => {
                  const Icon = m.icon;
                  return (
                    <Card key={i}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${m.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-5 h-5 ${m.color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-lg font-bold text-slate-800 truncate">{m.value}</p>
                          <p className="text-xs text-slate-500">{m.label}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Ranking Mensal */}
              {repRanking.some(r => r.monthlyTotal > 0) && (
                <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      Ranking de Vendas — {monthName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {repRanking.map((rep, idx) => {
                        const RankIcon = idx < 3 ? rankIcons[idx] : null;
                        const rankBg = idx < 3 ? rankColors[idx] : 'bg-slate-100';
                        const rankText = idx < 3 ? 'text-white' : 'text-slate-500';
                        return (
                          <div key={rep.id} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-white/60">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${rankBg} ${rankText}`}>
                              {RankIcon ? <RankIcon className="w-4 h-4" /> : idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-800 text-sm truncate">{rep.name}</p>
                              <p className="text-xs text-slate-400">{rep.monthlyCount} venda{rep.monthlyCount !== 1 ? 's' : ''} no mês</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold text-amber-700 text-sm">R$ {rep.monthlyTotal.toFixed(2).replace('.', ',')}</p>
                              <p className="text-xs text-slate-400">em comissões</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Comissões Pendentes */}
              {pendingCommissions.length > 0 && (
                <Card className="border-amber-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Clock className="w-5 h-5 text-amber-500" />
                      Comissões Pendentes de Baixa ({pendingCommissions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {pendingCommissions.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map(c => {
                        const repName = reps.find(r => r.id === c.representative_id)?.name || c.representative_name;
                        return (
                          <div key={c.id} className="flex items-center justify-between gap-3 py-2 px-3 bg-white rounded-lg border">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-slate-800">{repName}</span>
                                <span className="text-xs text-slate-400">·</span>
                                <span className="text-xs text-slate-500 truncate">{c.customer_email}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                                <span>{({user:'Usuário',stander:'Stander',lojista:'Lojista',partner:'Parceiro'})[c.subscription_type] || c.subscription_type}</span>
                                <span>·</span>
                                <span>R$ {c.subscription_price?.toFixed(2).replace('.', ',')}</span>
                                {c.created_date && (<><span>·</span><span>{new Date(c.created_date).toLocaleDateString('pt-BR')}</span></>)}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-amber-600 text-sm">R$ {c.commission_amount.toFixed(2).replace('.', ',')}</span>
                              <Button size="sm" onClick={() => markCommPaid(c)} className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" /> Dar Baixa
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lista de Representantes */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Representantes ({reps.length})</CardTitle>
                    <Button size="sm" onClick={() => setRepFormOpen(true)} className="bg-amber-500 hover:bg-amber-600 h-8 text-xs">
                      <Plus className="w-3 h-3 mr-1" /> Novo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {repsLoading ? (
                    <div className="p-4 space-y-3">
                      {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
                    </div>
                  ) : reps.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">Nenhum representante cadastrado</div>
                  ) : (
                    <div className="divide-y">
                      {reps.map(rep => {
                        const rc = repCommissions.filter(c => c.representative_id === rep.id);
                        const rcPaid = rc.filter(c => c.status === 'paid').reduce((s, c) => s + c.commission_amount, 0);
                        return (
                          <div key={rep.id} className={`px-4 py-3 ${!rep.is_active ? 'opacity-50' : ''}`}>
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 flex-shrink-0">
                                  {rep.name?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-semibold text-sm text-slate-800 truncate">{rep.name}</p>
                                    <Badge variant={rep.is_active ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0">
                                      {rep.is_active ? 'Ativo' : 'Inativo'}
                                    </Badge>
                                    {rep.total_sales > 0 && (
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-emerald-600 border-emerald-300">
                                        {rep.total_sales} venda{rep.total_sales !== 1 ? 's' : ''}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 truncate">{rep.email}{rep.phone ? ` · ${rep.phone}` : ''}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <code className="text-[11px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-mono">/rep/{rep.code}</code>
                                    <button onClick={() => copyRepLink(rep.code)} className="text-stone-400 hover:text-amber-600">
                                      {copiedCode === rep.code ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                    <a href={`/rep/${rep.code}`} target="_blank" rel="noopener" className="text-stone-400 hover:text-amber-600">
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-right hidden sm:block">
                                  <p className="text-xs text-slate-400">Comissões pagas</p>
                                  <p className="font-bold text-emerald-600 text-sm">R$ {rcPaid.toFixed(2).replace('.', ',')}</p>
                                </div>
                                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => handleToggleRep(rep)}>
                                  {rep.is_active ? 'Desativar' : 'Ativar'}
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:bg-red-50" onClick={() => handleDeleteRep(rep)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            {rc.length > 0 && (
                              <div className="mt-2 pt-2 border-t">
                                <div className="space-y-1">
                                  {rc.slice(0, 5).map(c => (
                                    <div key={c.id} className="flex items-center justify-between gap-2 text-xs">
                                      <span className="text-slate-600 truncate max-w-[160px]">{c.customer_email}</span>
                                      <span className="text-slate-400 hidden sm:inline">{({user:'Usuário',stander:'Stander',lojista:'Lojista',partner:'Parceiro'})[c.subscription_type] || c.subscription_type}</span>
                                      <span className="font-semibold text-emerald-600">R$ {c.commission_amount.toFixed(2).replace('.', ',')}</span>
                                      <Badge variant={c.status === 'paid' ? 'default' : 'secondary'} className="text-[10px]">{c.status === 'paid' ? 'Pago' : 'Pendente'}</Badge>
                                      {c.status === 'pending' ? (
                                        <Button variant="ghost" size="sm" onClick={() => markCommPaid(c)} className="text-emerald-600 h-6 px-1 text-[11px]"><CheckCircle className="w-3 h-3 mr-0.5" />Baixa</Button>
                                      ) : (
                                        <Button variant="ghost" size="sm" onClick={() => markCommPending(c)} className="text-amber-600 h-6 px-1 text-[11px]">Estornar</Button>
                                      )}
                                    </div>
                                  ))}
                                  {rc.length > 5 && <p className="text-xs text-slate-400 text-center">+{rc.length - 5} comissões</p>}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* CONSOLIDADO */}
          <TabsContent value="consolidated">
            <ConsolidatedCharts
              vouchers={vouchers}
              partners={partners}
              reps={reps}
              repCommissions={repCommissions}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog: Novo Representante */}
      <Dialog open={repFormOpen} onOpenChange={setRepFormOpen}>
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
                  setNewRep(prev => ({ ...prev, name, code: prev.code || generateCode(name) }));
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
              <p className="text-xs text-slate-400 mt-1">Link: /rep/{newRep.code || 'CODIGO'}</p>
            </div>
            <p className="text-sm text-stone-600 bg-amber-50 p-3 rounded-lg">
              Comissão padrão: <strong>5%</strong> sobre cada venda
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRepFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateRep} disabled={!newRep.name || !newRep.email || !newRep.code}
              className="bg-amber-500 hover:bg-amber-600">
              Criar Representante
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}