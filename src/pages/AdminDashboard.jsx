import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users, Store, Ticket, CreditCard, Search, CheckCircle,
  XCircle, Clock, Loader2, ShieldAlert, TrendingUp, BarChart2,
  Trash2, Edit2, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [searchPartner, setSearchPartner] = useState('');
  const [searchSub, setSearchSub] = useState('');
  const [searchUser, setSearchUser] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('user');
  const [inviting, setInviting] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
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

  // User management
  const inviteUser = async () => {
    if (!inviteEmail || !inviteRole) return;
    setInviting(true);
    try {
      await base44.users.inviteUser(inviteEmail.trim().toLowerCase(), inviteRole);
      toast.success(`Convite enviado para ${inviteEmail}!`);
      setInviteEmail('');
      setInviteRole('user');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (e) {
      toast.error('Erro ao enviar convite: ' + (e.message || 'Tente novamente.'));
    }
    setInviting(false);
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <ShieldAlert className="w-7 h-7 text-violet-400" />
            <h1 className="text-2xl font-bold">Painel Administrativo</h1>
          </div>
          <p className="text-slate-400 text-sm">Clube Max Descontos — Gestão completa da plataforma</p>
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

              {/* Invite form */}
              <div className="px-6 py-4 bg-violet-50/50 border-y border-violet-100">
                <p className="text-sm font-semibold text-violet-800 mb-3">Convidar novo usuário</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    className="h-9 text-sm flex-1"
                    onKeyDown={e => e.key === 'Enter' && inviteUser()}
                  />
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="h-9 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={inviteUser} disabled={!inviteEmail || inviting} className="bg-violet-600 hover:bg-violet-700 h-9">
                    {inviting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                    Convidar
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2">O usuário receberá um email para criar a conta. Admins têm acesso total ao painel.</p>
              </div>

              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredUsers.map(u => (
                    <div key={u.id} className="px-6 py-3 flex items-center justify-between gap-3 hover:bg-slate-50">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-sm font-bold text-violet-700 flex-shrink-0">
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
                            <Button size="sm" className="h-7 text-xs bg-violet-600 hover:bg-violet-700" onClick={() => updateUserRole(u, 'admin')}>
                              Admin
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-400" onClick={() => setEditingUserId(null)}>
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Badge variant={u.role === 'admin' ? 'default' : 'outline'} className={`text-xs ${u.role === 'admin' ? 'bg-violet-600' : ''}`}>
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
        </Tabs>
      </div>
    </div>
  );
}