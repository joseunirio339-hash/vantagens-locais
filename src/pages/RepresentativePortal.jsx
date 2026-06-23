import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Store, Tag, Copy, Check, ExternalLink, TrendingUp,
  DollarSign, ShoppingBag, Users, Sparkles, Loader2,
  UserPlus, Phone, Mail, ChevronDown, Search, Plus,
  Pencil, UserCheck, UserX, Clock, Filter, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';

const clientStatusMap = {
  prospect: { label: 'Prospect', color: 'bg-slate-100 text-slate-700', icon: UserPlus },
  contacted: { label: 'Contatado', color: 'bg-amber-100 text-amber-700', icon: Phone },
  signed_up: { label: 'Cadastrado', color: 'bg-blue-100 text-blue-700', icon: UserCheck },
  subscribed: { label: 'Assinante', color: 'bg-emerald-100 text-emerald-700', icon: Check },
};

export default function RepresentativePortal() {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email');
  const [email, setEmail] = useState(emailParam || '');
  const [rep, setRep] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [clientSearch, setClientSearch] = useState('');
  const [clientStatusFilter, setClientStatusFilter] = useState('all');
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', status: 'prospect', plan_interest: 'indefinido', notes: '' });
  const queryClient = useQueryClient();

  const handleLogin = async () => {
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const reps = await base44.entities.Representative.filter({ email: email.trim().toLowerCase(), is_active: true });
      if (reps.length > 0) {
        setRep(reps[0]);
      } else {
        setError('Representante não encontrado ou conta inativa. Verifique o email.');
      }
    } catch (e) {
      setError('Erro ao buscar dados. Tente novamente.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (emailParam) handleLogin();
  }, []);

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['rep-portal-products', rep?.id],
    queryFn: () => base44.entities.Product.filter({ is_active: true }, '', 20),
    enabled: !!rep,
  });

  const { data: partners = [] } = useQuery({
    queryKey: ['rep-portal-partners', rep?.id],
    queryFn: () => base44.entities.Partner.list(),
    enabled: !!rep,
  });

  const { data: commissions = [], isLoading: loadingCommissions } = useQuery({
    queryKey: ['rep-commissions', rep?.id],
    queryFn: () => base44.entities.RepresentativeCommission.filter({ representative_id: rep?.id }, '-created_date', 50),
    enabled: !!rep,
  });

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['rep-clients', rep?.id],
    queryFn: () => base44.entities.Client.filter({ representative_id: rep?.id }, '-created_date', 100),
    enabled: !!rep,
  });

  const copyLink = (code) => {
    const link = `https://app.clubemaxdescontos.com.br/rep/${code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Client CRUD
  const resetClientForm = () => {
    setNewClient({ name: '', email: '', phone: '', status: 'prospect', plan_interest: 'indefinido', notes: '' });
    setEditingClient(null);
  };

  const openNewClient = () => {
    resetClientForm();
    setClientFormOpen(true);
  };

  const openEditClient = (client) => {
    setEditingClient(client);
    setNewClient({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      status: client.status || 'prospect',
      plan_interest: client.plan_interest || 'indefinido',
      notes: client.notes || '',
    });
    setClientFormOpen(true);
  };

  const handleSaveClient = async () => {
    if (!newClient.name) return;
    try {
      if (editingClient) {
        await base44.entities.Client.update(editingClient.id, newClient);
        toast.success('Cliente atualizado!');
      } else {
        await base44.entities.Client.create({
          ...newClient,
          representative_id: rep.id,
          representative_name: rep.name,
        });
        toast.success('Cliente cadastrado!');
      }
      setClientFormOpen(false);
      resetClientForm();
      queryClient.invalidateQueries({ queryKey: ['rep-clients', rep?.id] });
    } catch (e) {
      toast.error('Erro ao salvar cliente.');
    }
  };

  const handleDeleteClient = async (client) => {
    if (!confirm(`Remover ${client.name} da lista?`)) return;
    await base44.entities.Client.delete(client.id);
    queryClient.invalidateQueries({ queryKey: ['rep-clients', rep?.id] });
    toast.success('Cliente removido.');
  };

  // Filter clients
  const filteredClients = (clients || []).filter(c => {
    const matchSearch = !clientSearch || 
      c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.email?.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.phone?.includes(clientSearch);
    const matchStatus = clientStatusFilter === 'all' || c.status === clientStatusFilter;
    return matchSearch && matchStatus;
  });

  // Stats
  const paidCommissions = commissions.filter(c => c.status === 'paid');
  const pendingCommissions = commissions.filter(c => c.status === 'pending');
  const totalEarned = paidCommissions.reduce((sum, c) => sum + c.commission_amount, 0);
  const totalPending = pendingCommissions.reduce((sum, c) => sum + c.commission_amount, 0);
  const subscribedClients = clients.filter(c => c.status === 'subscribed').length;
  const totalClients = clients.length;

  // Login screen
  if (!rep) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8 text-violet-600" />
            </div>
            <CardTitle className="text-xl">Portal do Representante</CardTitle>
            <p className="text-sm text-slate-500">Acesse seu painel de vendas, produtos e clientes</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Email cadastrado</label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button
              onClick={handleLogin}
              disabled={!email || loading}
              className="w-full bg-violet-600 hover:bg-violet-700"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Entrar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <img src="https://media.base44.com/images/public/6996317474c6e4e8fab2245f/188f1bafc_clubemax.png"
                alt="Clube Max" className="w-8 h-8 rounded-lg" />
            </Link>
            <div>
              <p className="font-bold text-slate-800 text-sm">Painel do Representante</p>
              <p className="text-xs text-slate-500">{rep.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => copyLink(rep.code)}>
              {copiedCode ? <Check className="w-4 h-4 text-emerald-500 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
              {copiedCode ? 'Copiado!' : 'Link'}
            </Button>
            <a href={`/rep/${rep.code}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-1" /> Ver Página
              </Button>
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Comissões Recebidas</p>
                <p className="text-lg font-bold text-emerald-600">R$ {totalEarned.toFixed(2).replace('.', ',')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">A Receber</p>
                <p className="text-lg font-bold text-amber-600">R$ {totalPending.toFixed(2).replace('.', ',')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Clientes</p>
                <p className="text-lg font-bold text-slate-800">{totalClients}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Assinantes</p>
                <p className="text-lg font-bold text-blue-600">{subscribedClients}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Seu Código</p>
                <code className="text-sm font-mono text-violet-600 font-bold">{rep.code}</code>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Link compartilhamento */}
        <Card className="mb-8 border-violet-200 bg-violet-50/50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">🔗 Seu link de vendas</h3>
                <p className="text-sm text-slate-500">
                  Compartilhe com seus clientes. A cada assinatura, você recebe <strong className="text-violet-700">50%</strong> da 1ª mensalidade.
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Input
                  readOnly
                  value={`https://app.clubemaxdescontos.com.br/rep/${rep.code}`}
                  className="font-mono text-sm flex-1 sm:w-80"
                />
                <Button onClick={() => copyLink(rep.code)} variant="default" className="bg-violet-600 hover:bg-violet-700">
                  {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs: Produtos | Clientes | Comissões */}
        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList className="bg-white border">
            <TabsTrigger value="clients" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
              <Users className="w-4 h-4 mr-2" /> Clientes
            </TabsTrigger>
            <TabsTrigger value="products" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
              <Tag className="w-4 h-4 mr-2" /> Produtos
            </TabsTrigger>
            <TabsTrigger value="commissions" className="data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700">
              <DollarSign className="w-4 h-4 mr-2" /> Comissões
            </TabsTrigger>
          </TabsList>

          {/* Tab Clientes */}
          <TabsContent value="clients">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 flex-1 w-full">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Buscar cliente..."
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={clientStatusFilter} onValueChange={setClientStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="w-3.5 h-3.5 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="prospect">Prospects</SelectItem>
                    <SelectItem value="contacted">Contatados</SelectItem>
                    <SelectItem value="signed_up">Cadastrados</SelectItem>
                    <SelectItem value="subscribed">Assinantes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={openNewClient} className="bg-violet-600 hover:bg-violet-700 shrink-0">
                <UserPlus className="w-4 h-4 mr-2" /> Novo Cliente
              </Button>
            </div>

            {loadingClients ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : filteredClients.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 mb-2">
                    {clients.length === 0 ? 'Nenhum cliente cadastrado ainda' : 'Nenhum cliente encontrado com este filtro'}
                  </p>
                  {clients.length === 0 && (
                    <Button variant="outline" onClick={openNewClient}>
                      <UserPlus className="w-4 h-4 mr-2" /> Cadastrar primeiro cliente
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredClients.map(client => {
                  const status = clientStatusMap[client.status] || clientStatusMap.prospect;
                  const StatusIcon = status.icon;
                  return (
                    <Card key={client.id} className="hover:shadow-sm transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-slate-800 truncate">{client.name}</h4>
                              <Badge className={status.color + ' text-xs'}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {status.label}
                              </Badge>
                              {client.plan_interest !== 'indefinido' && (
                                <Badge variant="outline" className="text-xs">
                                  {client.plan_interest}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              {client.email && (
                                <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {client.email}</span>
                              )}
                              {client.phone && (
                                <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {client.phone}</span>
                              )}
                              {client.notes && (
                                <span className="truncate max-w-[200px] text-slate-400">📝 {client.notes}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditClient(client)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteClient(client)} className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Tab Produtos */}
          <TabsContent value="products">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-800">Produtos para Demonstração</h3>
                <p className="text-sm text-slate-500">Mostre estas ofertas para seus clientes</p>
              </div>
              <Badge variant="outline" className="border-violet-300 text-violet-600">
                {products.length} ofertas
              </Badge>
            </div>

            {loadingProducts ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.slice(0, 12).map(product => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-square bg-slate-100 relative">
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Tag className="w-10 h-10 text-slate-300" />
                        </div>
                      )}
                      {product.discount_percentage > 0 && (
                        <Badge className="absolute top-2 left-2 bg-red-500 hover:bg-red-600 text-white">
                          -{Math.round(product.discount_percentage)}%
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <p className="text-xs text-slate-400 truncate">
                        {partners.find(p => p.id === product.partner_id)?.business_name || 'Parceiro'}
                      </p>
                      <p className="font-semibold text-sm text-slate-800 line-clamp-2 mt-0.5">{product.name}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-sm font-bold text-emerald-600">
                          R$ {product.discount_price?.toFixed(2).replace('.', ',')}
                        </span>
                        {product.original_price > product.discount_price && (
                          <span className="text-xs text-slate-400 line-through">
                            R$ {product.original_price?.toFixed(2).replace('.', ',')}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab Comissões */}
          <TabsContent value="commissions">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-slate-800">Histórico de Comissões</h3>
                <p className="text-sm text-slate-500">
                  Comissão de 50% sobre a 1ª mensalidade de cada venda fechada pelo seu link
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Total recebido</p>
                <p className="text-xl font-bold text-emerald-600">R$ {totalEarned.toFixed(2).replace('.', ',')}</p>
              </div>
            </div>

            {loadingCommissions ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
              </div>
            ) : commissions.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Nenhuma comissão registrada ainda.</p>
                  <p className="text-sm text-slate-400 mt-1">As comissões aparecem aqui automaticamente quando clientes assinam pelo seu link.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {commissions.map(c => (
                  <Card key={c.id}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{c.customer_email}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span>Plano: {c.subscription_type}</span>
                          <span>·</span>
                          <span>R$ {c.subscription_price?.toFixed(2).replace('.', ',')}</span>
                          {c.created_date && (
                            <>
                              <span>·</span>
                              <span>{new Date(c.created_date).toLocaleDateString('pt-BR')}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-emerald-600">R$ {c.commission_amount.toFixed(2).replace('.', ',')}</p>
                        <Badge variant={c.status === 'paid' ? 'default' : 'secondary'} className="text-xs mt-0.5">
                          {c.status === 'paid' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog: Novo/Editar Cliente */}
      <Dialog open={clientFormOpen} onOpenChange={setClientFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Nome *</label>
              <Input
                value={newClient.name}
                onChange={e => setNewClient(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome completo do cliente"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Email</label>
                <Input
                  type="email"
                  value={newClient.email}
                  onChange={e => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="cliente@email.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">WhatsApp</label>
                <Input
                  value={newClient.phone}
                  onChange={e => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(21) 99999-9999"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Status</label>
                <Select value={newClient.status} onValueChange={v => setNewClient(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="contacted">Contatado</SelectItem>
                    <SelectItem value="signed_up">Cadastrado</SelectItem>
                    <SelectItem value="subscribed">Assinante</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Interesse</label>
                <Select value={newClient.plan_interest} onValueChange={v => setNewClient(prev => ({ ...prev, plan_interest: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indefinido">Indefinido</SelectItem>
                    <SelectItem value="user">Usuário</SelectItem>
                    <SelectItem value="stander">Stander</SelectItem>
                    <SelectItem value="lojista">Lojista</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Observações</label>
              <Input
                value={newClient.notes}
                onChange={e => setNewClient(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Anotações sobre este cliente..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setClientFormOpen(false); resetClientForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleSaveClient} disabled={!newClient.name} className="bg-violet-600 hover:bg-violet-700">
              {editingClient ? 'Salvar' : 'Cadastrar Cliente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}