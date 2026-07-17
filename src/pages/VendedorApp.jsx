import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Store, Tag, Copy, Check, ExternalLink, TrendingUp,
  DollarSign, Users, Loader2, UserPlus, Mail, Phone,
  ShieldCheck, FileText, Clock, RefreshCw, Sparkles,
  Crown, ShoppingCart, BadgeCheck, Wallet, Receipt
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';

const SELLER_PLANS = [
  {
    type: 'user',
    name: 'Plano Usuário',
    price: 19.99,
    icon: Users,
    color: 'emerald',
    features: [
      'Acesso a todos os descontos exclusivos',
      'Geração de vouchers ilimitada',
      'Programa de pontos e cashback',
      'Vantagens do comércio local'
    ]
  },
  {
    type: 'stander',
    name: 'Plano Stander',
    price: 99.99,
    icon: Crown,
    color: 'amber',
    features: [
      'Roleta de gamificação para lojistas',
      'Validação de vouchers',
      'Logo e perfil da loja',
      'Análises de vendas e acessos'
    ]
  },
];

const planNames = { user: 'Usuário', stander: 'Stander', lojista: 'Lojista', partner: 'Parceiro' };

export default function VendedorApp() {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email');
  const [email, setEmail] = useState(emailParam || '');
  const [rep, setRep] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);
  const [saleOpen, setSaleOpen] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [newSale, setNewSale] = useState({ name: '', email: '', phone: '', cpf: '', plan: 'user' });
  const queryClient = useQueryClient();

  const handleLogin = async () => {
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const reps = await base44.entities.Representative.filter({
        email: email.trim().toLowerCase(),
        is_active: true,
        is_seller: true
      });
      if (reps.length > 0) {
        setRep(reps[0]);
      } else {
        setError('Vendedor não encontrado, inativo ou sem perfil de vendedor. Verifique com o administrador.');
      }
    } catch (e) {
      setError('Erro ao buscar dados. Tente novamente.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (emailParam) handleLogin();
  }, []);

  const { data: commissions = [], isLoading: loadingCommissions } = useQuery({
    queryKey: ['seller-commissions', rep?.id],
    queryFn: () => base44.entities.RepresentativeCommission.filter({ representative_id: rep?.id }, '-created_date', 50),
    enabled: !!rep,
  });

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['seller-clients', rep?.id],
    queryFn: () => base44.entities.Client.filter({ representative_id: rep?.id }, '-created_date', 100),
    enabled: !!rep,
  });

  const paidCommissions = commissions.filter(c => c.status === 'paid');
  const pendingCommissions = commissions.filter(c => c.status === 'pending');
  const totalEarned = paidCommissions.reduce((s, c) => s + c.commission_amount, 0);
  const totalPending = pendingCommissions.reduce((s, c) => s + c.commission_amount, 0);
  const subscribedClients = clients.filter(c => c.status === 'subscribed').length;

  const copyLink = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const openSale = (planType) => {
    setNewSale(prev => ({ ...prev, plan: planType }));
    setCheckoutUrl(null);
    setSaleOpen(true);
  };

  const handleGenerateSale = async () => {
    if (!newSale.name || !newSale.email) {
      toast.error('Preencha nome e email do cliente.');
      return;
    }
    setGenerating(true);
    try {
      // Cria/atualiza o cliente no funil
      await base44.entities.Client.create({
        name: newSale.name,
        email: newSale.email,
        phone: newSale.phone,
        representative_id: rep.id,
        representative_name: rep.name,
        status: 'contacted',
        plan_interest: newSale.plan
      });

      // Gera link de checkout do Stripe com o email do cliente e código do vendedor
      const response = await base44.functions.invoke('sellerCheckout', {
        subscriptionType: newSale.plan,
        representative_code: rep.code,
        customer_email: newSale.email.trim().toLowerCase()
      });

      const url = response.data?.url;
      if (!url) throw new Error('Não foi possível gerar o link de pagamento.');

      setCheckoutUrl(url);
      toast.success('Link de pagamento gerado! Envie ao cliente.');
      queryClient.invalidateQueries({ queryKey: ['seller-clients', rep?.id] });
    } catch (e) {
      toast.error(e.message || 'Erro ao gerar venda.');
    }
    setGenerating(false);
  };

  // --- Login Screen ---
  if (!rep) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8 text-amber-600" />
            </div>
            <CardTitle className="text-xl">App do Vendedor</CardTitle>
            <p className="text-sm text-slate-500">Acesse seu painel de vendas e comissões</p>
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
              className="w-full bg-amber-500 hover:bg-amber-600"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Entrar
            </Button>
            <p className="text-xs text-slate-400 text-center">
              Acesso exclusivo para vendedores autorizados.
            </p>
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
              <p className="font-bold text-slate-800 text-sm flex items-center gap-1">
                App do Vendedor
                <Badge className="bg-amber-100 text-amber-700 text-xs">Vendedor</Badge>
              </p>
              <p className="text-xs text-slate-500">{rep.name} · Código {rep.code}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => copyLink(`https://app.clubemaxdescontos.com.br/rep/${rep.code}`, 'link')}>
            {copiedCode === 'link' ? <Check className="w-4 h-4 text-emerald-500 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
            Meu Link
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Remuneração Highlight */}
        <Card className="mb-6 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
                <DollarSign className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800">Sua Remuneração</h3>
                <p className="text-sm text-slate-600 mt-0.5">
                  Você ganha <strong className="text-amber-700">50% da 1ª mensalidade</strong> de cada venda fechada.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Pagamento em <strong>30 dias + 5 mensalidades</strong>. Direito de reembolso em 7 dias (CDC, Art. 49).
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Recebido</p>
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
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Clientes</p>
                <p className="text-lg font-bold text-slate-800">{clients.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                <BadgeCheck className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Assinantes</p>
                <p className="text-lg font-bold text-violet-600">{subscribedClients}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Planos para Vender */}
        <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
          <Tag className="w-5 h-5 text-amber-500" /> Planos para Vender
        </h2>
        <p className="text-sm text-slate-500 mb-4">Selecione um plano para iniciar uma venda</p>

        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {SELLER_PLANS.map(plan => {
            const Icon = plan.icon;
            const commission = plan.price * 0.5;
            const colorMap = {
              emerald: { border: 'border-emerald-200', icon: 'bg-emerald-100', iconText: 'text-emerald-600', btn: 'bg-emerald-600 hover:bg-emerald-700' },
              amber: { border: 'border-amber-300', icon: 'bg-amber-100', iconText: 'text-amber-600', btn: 'bg-amber-500 hover:bg-amber-600' }
            };
            const c = colorMap[plan.color];
            return (
              <Card key={plan.type} className={`border-2 ${c.border} relative overflow-hidden`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${c.icon}`}>
                      <Icon className={`w-6 h-6 ${c.iconText}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <p className="text-2xl font-bold text-slate-800">
                        R$ {plan.price.toFixed(2).replace('.', ',')}<span className="text-sm font-normal text-slate-400">/mês</span>
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> {f}
                      </li>
                    ))}
                  </ul>
                  <div className="bg-amber-50 rounded-xl p-3 mb-4 flex items-center justify-between">
                    <span className="text-sm text-slate-600">Sua comissão (50%)</span>
                    <span className="font-bold text-amber-700">R$ {commission.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <Button onClick={() => openSale(plan.type)} className={`w-full ${c.btn}`}>
                    <ShoppingCart className="w-4 h-4 mr-2" /> Iniciar Venda
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Termos do Contrato */}
        <Card className="mb-8 border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" /> Termos do Contrato
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">Pagamento: 30 dias + 5 mensalidades</p>
                <p className="text-xs text-slate-500">A primeira cobrança ocorre após 30 dias; em seguida, 5 mensalidades recorrentes.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <RefreshCw className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">Reembolso em 7 dias</p>
                <p className="text-xs text-slate-500">
                  Direito de arrependimento em até 7 dias corridos, conforme o Código de Defesa do Consumidor
                  (Lei nº 8.078/90, Art. 49). Este termo consta no contrato apresentado ao cliente.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">Remuneração do Vendedor</p>
                <p className="text-xs text-slate-500">50% da primeira mensalidade paga, creditados conforme cronograma de pagamentos.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comissões */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-500" /> Minhas Comissões
            </h2>
            {loadingCommissions ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : commissions.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-slate-400 text-sm">
                <DollarSign className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                Nenhuma comissão ainda. As comissões aparecem quando o cliente conclui o pagamento.
              </CardContent></Card>
            ) : (
              <div className="space-y-2">
                {commissions.slice(0, 8).map(c => (
                  <Card key={c.id}>
                    <CardContent className="p-3 flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-slate-800 truncate">{c.customer_email}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-xs">{planNames[c.subscription_type] || c.subscription_type}</Badge>
                          <span className="text-xs text-slate-400">
                            {c.created_date ? new Date(c.created_date).toLocaleDateString('pt-BR') : ''}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-bold ${c.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                          R$ {c.commission_amount.toFixed(2).replace('.', ',')}
                        </p>
                        <Badge variant={c.status === 'paid' ? 'default' : 'secondary'} className="text-xs">
                          {c.status === 'paid' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Clientes */}
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" /> Meus Clientes
            </h2>
            {loadingClients ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : clients.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-slate-400 text-sm">
                <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                Nenhum cliente ainda. Inicie uma venda para cadastrar seu primeiro cliente.
              </CardContent></Card>
            ) : (
              <div className="space-y-2">
                {clients.slice(0, 8).map(cl => (
                  <Card key={cl.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm text-slate-800 truncate">{cl.name}</p>
                        <Badge variant="outline" className="text-xs">{planNames[cl.plan_interest] || cl.plan_interest}</Badge>
                      </div>
                      {cl.email && <p className="text-xs text-slate-500 flex items-center gap-1 mt-1"><Mail className="w-3 h-3" /> {cl.email}</p>}
                      {cl.phone && <p className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" /> {cl.phone}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog: Nova Venda */}
      <Dialog open={saleOpen} onOpenChange={setSaleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-amber-500" /> Nova Venda
            </DialogTitle>
          </DialogHeader>

          {checkoutUrl ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                <p className="font-semibold text-emerald-700 flex items-center gap-2">
                  <Check className="w-5 h-5" /> Link de pagamento gerado!
                </p>
                <p className="text-sm text-slate-600 mt-1">
                  Envie este link ao cliente para ele concluir o pagamento. Sua comissão será registrada
                  automaticamente quando o pagamento for confirmado.
                </p>
              </div>
              <Input readOnly value={checkoutUrl} className="font-mono text-xs" />
              <div className="flex gap-2">
                <Button onClick={() => copyLink(checkoutUrl, 'checkout')} variant="outline" className="flex-1">
                  {copiedCode === 'checkout' ? <Check className="w-4 h-4 text-emerald-500 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  Copiar Link
                </Button>
                <a href={checkoutUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
                  <Button className="w-full bg-amber-500 hover:bg-amber-600">
                    <ExternalLink className="w-4 h-4 mr-1" /> Abrir Pagamento
                  </Button>
                </a>
              </div>
              <Button variant="ghost" className="w-full" onClick={() => setSaleOpen(false)}>Fechar</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Plano</label>
                <Select value={newSale.plan} onValueChange={v => setNewSale(prev => ({ ...prev, plan: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Plano Usuário — R$ 19,99/mês</SelectItem>
                    <SelectItem value="stander">Plano Stander — R$ 99,99/mês</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Nome do cliente *</label>
                <Input value={newSale.name} onChange={e => setNewSale(prev => ({ ...prev, name: e.target.value }))} placeholder="Nome completo" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Email do cliente *</label>
                <Input type="email" value={newSale.email} onChange={e => setNewSale(prev => ({ ...prev, email: e.target.value }))} placeholder="cliente@email.com" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">WhatsApp</label>
                <Input value={newSale.phone} onChange={e => setNewSale(prev => ({ ...prev, phone: e.target.value }))} placeholder="(21) 99999-9999" />
              </div>
              <div className="bg-amber-50 rounded-xl p-3 text-xs text-slate-600 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span>O cliente verá o contrato com os termos (30 dias + 5 mensalidades e reembolso em 7 dias pelo CDC Art. 49) no checkout.</span>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSaleOpen(false)}>Cancelar</Button>
                <Button onClick={handleGenerateSale} disabled={generating} className="bg-amber-500 hover:bg-amber-600">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
                  Gerar Link de Pagamento
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}