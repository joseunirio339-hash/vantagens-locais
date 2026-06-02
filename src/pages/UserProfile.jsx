import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  User, CreditCard, CheckCircle, XCircle, Clock, RefreshCw,
  ExternalLink, Receipt, ChevronDown, ChevronUp, AlertCircle,
  Sparkles, Settings, ArrowRight, Loader2, Crown, Star, Ticket,
  TrendingDown, ShoppingBag, BadgePercent, Store
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const planLabels = {
  'price_1TY8efLsB3SzuNJItliAzOIn': 'Plano Usuário',
  'price_1TY8efLsB3SzuNJIgs5Hw2ka': 'Plano Lojista',
  'price_1TY8efLsB3SzuNJIjd10iAOn': 'Plano Empreendedor',
};

const chargeStatusConfig = {
  succeeded: { label: 'Aprovado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
  failed: { label: 'Recusado', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  refunded: { label: 'Reembolsado', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: RefreshCw },
};

const subStatusConfig = {
  active:    { label: 'Ativa',       color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  canceled:  { label: 'Cancelada',   color: 'bg-slate-100 text-slate-600 border-slate-200' },
  past_due:  { label: 'Em atraso',   color: 'bg-red-100 text-red-700 border-red-200' },
  trialing:  { label: 'Trial',       color: 'bg-violet-100 text-violet-700 border-violet-200' },
  unpaid:    { label: 'Não paga',    color: 'bg-orange-100 text-orange-700 border-orange-200' },
};

function ChargeRow({ charge }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = chargeStatusConfig[charge.status] || chargeStatusConfig.pending;
  const Icon = cfg.icon;

  return (
    <div className="border rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4 text-violet-500" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">
              R$ {charge.amount.toFixed(2).replace('.', ',')}
            </p>
            <p className="text-xs text-slate-400">
              {format(new Date(charge.created), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${cfg.color} border gap-1 text-xs`}>
            <Icon className="w-3 h-3" />
            {cfg.label}
          </Badge>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t bg-slate-50 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-sm pt-3">
            <div>
              <p className="text-xs text-slate-400">ID da transação</p>
              <p className="font-mono text-xs text-slate-600 truncate">{charge.id}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Moeda</p>
              <p className="text-xs text-slate-600 uppercase">{charge.currency}</p>
            </div>
          </div>
          {charge.failure_message && (
            <div className="flex items-start gap-2 bg-red-50 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{charge.failure_message}</p>
            </div>
          )}
          {charge.receipt_url && (
            <a href={charge.receipt_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2 w-full">
                <Receipt className="w-4 h-4" />
                Ver Recibo
                <ExternalLink className="w-3 h-3 ml-auto" />
              </Button>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function SubscriptionCard({ sub }) {
  const cfg = subStatusConfig[sub.status] || subStatusConfig.canceled;
  const item = sub.items?.[0];
  const planName = planLabels[item?.price_id] || 'Assinatura';

  return (
    <div className="border rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold text-slate-800">{planName}</p>
          {item && (
            <p className="text-xs text-slate-500">
              R$ {item.amount.toFixed(2).replace('.', ',')} / {item.interval === 'month' ? 'mês' : item.interval}
            </p>
          )}
        </div>
        <Badge className={`${cfg.color} border text-xs`}>{cfg.label}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-slate-400 mb-0.5">Início do período</p>
          <p className="text-slate-700 font-medium">
            {format(new Date(sub.current_period_start), 'dd/MM/yyyy', { locale: ptBR })}
          </p>
        </div>
        <div>
          <p className="text-slate-400 mb-0.5">
            {sub.cancel_at_period_end ? 'Cancela em' : 'Renova em'}
          </p>
          <p className={`font-medium ${sub.cancel_at_period_end ? 'text-amber-600' : 'text-slate-700'}`}>
            {format(new Date(sub.current_period_end), 'dd/MM/yyyy', { locale: ptBR })}
          </p>
        </div>
      </div>
      {sub.cancel_at_period_end && (
        <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-2 text-xs text-amber-700">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          Cancelamento agendado ao fim do período atual
        </div>
      )}
    </div>
  );
}

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [dbSubs, setDbSubs] = useState([]);
  const [portalLoading, setPortalLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (auth) => {
      if (!auth) {
        base44.auth.redirectToLogin(createPageUrl('UserProfile'));
        return;
      }
      const me = await base44.auth.me();
      setUser(me);
      const subs = await base44.entities.Subscription.filter({ user_email: me.email });
      setDbSubs(subs);
    });
  }, []);

  const { data: vouchers, isLoading: vouchersLoading } = useQuery({
    queryKey: ['userVouchers', user?.email],
    queryFn: () => base44.entities.Voucher.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: partners } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.Partner.list(),
    enabled: !!user?.email,
  });

  const voucherStats = useMemo(() => {
    if (!vouchers) return { total: 0, used: 0, totalSpentVouchers: 0, totalSaved: 0, byPartner: [] };
    const used = vouchers.filter(v => v.status === 'used');
    const totalSpentVouchers = used.reduce((s, v) => s + (v.discount_price || 0), 0);
    const totalSaved = used.reduce((s, v) => s + ((v.original_price || 0) - (v.discount_price || 0)), 0);
    const partnerMap = {};
    used.forEach(v => {
      if (!partnerMap[v.partner_id]) partnerMap[v.partner_id] = { partner_id: v.partner_id, count: 0, spent: 0, saved: 0 };
      partnerMap[v.partner_id].count += 1;
      partnerMap[v.partner_id].spent += v.discount_price || 0;
      partnerMap[v.partner_id].saved += (v.original_price || 0) - (v.discount_price || 0);
    });
    const partnerName = (id) => partners?.find(p => p.id === id)?.business_name || 'Parceiro';
    const byPartner = Object.values(partnerMap)
      .sort((a, b) => b.spent - a.spent)
      .map(p => ({ ...p, name: partnerName(p.partner_id) }));
    return { total: vouchers.length, used: used.length, totalSpentVouchers, totalSaved, byPartner };
  }, [vouchers, partners]);

  const { data: stripeData, isLoading: stripeLoading, refetch } = useQuery({
    queryKey: ['stripeHistory', user?.email],
    queryFn: () => base44.functions.invoke('stripeHistory', {}),
    enabled: !!user?.email,
    select: (res) => res.data,
  });

  const charges = stripeData?.charges || [];
  const stripeSubs = stripeData?.subscriptions || [];
  const activeSubs = stripeSubs.filter(s => s.status === 'active' || s.status === 'trialing');
  const totalSpent = charges.filter(c => c.status === 'succeeded').reduce((s, c) => s + c.amount, 0);

  // Active subscription from local DB (for plans that went through trial without Stripe)
  const localActiveSub = dbSubs.find(s => s.status === 'active' && new Date(s.expires_at) > new Date());
  const planTypeLabels = { user: 'Plano Usuário', lojista: 'Plano Lojista', empreendedor: 'Plano Empreendedor' };

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const res = await base44.functions.invoke('stripePortal', {});
      const url = res.data?.url;
      if (url) {
        window.open(url, '_blank');
      } else {
        toast.error(res.data?.error || 'Não foi possível abrir o portal.');
      }
    } catch (e) {
      toast.error('Erro ao acessar portal de assinatura.');
    } finally {
      setPortalLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{user.full_name}</h1>
              <p className="text-slate-500 text-sm">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white border w-full">
            <TabsTrigger value="overview" className="flex-1 gap-1 text-xs sm:text-sm">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Visão Geral</span>
              <span className="sm:hidden">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="vouchers" className="flex-1 gap-1 text-xs sm:text-sm">
              <Ticket className="w-4 h-4" />
              Vouchers
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex-1 gap-1 text-xs sm:text-sm">
              <Receipt className="w-4 h-4" />
              <span className="hidden sm:inline">Pagamentos</span>
              <span className="sm:hidden">Pgtos</span>
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex-1 gap-1 text-xs sm:text-sm">
              <Crown className="w-4 h-4" />
              <span className="hidden sm:inline">Assinaturas</span>
              <span className="sm:hidden">Planos</span>
            </TabsTrigger>
          </TabsList>

          {/* === OVERVIEW === */}
          <TabsContent value="overview" className="space-y-5 mt-5">
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-0 bg-gradient-to-br from-violet-50 to-violet-100">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-violet-700">
                    R$ {totalSpent.toFixed(2).replace('.', ',')}
                  </p>
                  <p className="text-xs text-violet-500 mt-1">Total investido</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-emerald-700">
                    {charges.filter(c => c.status === 'succeeded').length}
                  </p>
                  <p className="text-xs text-emerald-500 mt-1">Pagamentos</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-amber-50 to-amber-100">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-amber-700">
                    {activeSubs.length + (localActiveSub && activeSubs.length === 0 ? 1 : 0)}
                  </p>
                  <p className="text-xs text-amber-500 mt-1">Planos ativos</p>
                </CardContent>
              </Card>
            </div>

            {/* Active plan card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Crown className="w-4 h-4 text-amber-500" />
                  Plano Atual
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stripeLoading ? (
                  <Skeleton className="h-16 rounded-xl" />
                ) : activeSubs.length > 0 ? (
                  activeSubs.map(sub => {
                    const item = sub.items?.[0];
                    const planName = planLabels[item?.price_id] || 'Assinatura';
                    const renewDate = format(new Date(sub.current_period_end), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
                    return (
                      <div key={sub.id} className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <Star className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-emerald-800 text-sm">{planName}</p>
                            <p className="text-xs text-emerald-600">
                              {sub.cancel_at_period_end ? `Cancela em ${renewDate}` : `Renova em ${renewDate}`}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 border text-xs">Ativo</Badge>
                      </div>
                    );
                  })
                ) : localActiveSub ? (
                  <div className="flex items-center justify-between bg-violet-50 border border-violet-200 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-violet-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-violet-800 text-sm">
                          {planTypeLabels[localActiveSub.type] || 'Plano'}
                          {localActiveSub.is_trial && ' (Trial)'}
                        </p>
                        <p className="text-xs text-violet-600">
                          Válido até {new Date(localActiveSub.expires_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-violet-100 text-violet-700 border-violet-200 border text-xs">
                      {localActiveSub.is_trial ? 'Trial' : 'Ativo'}
                    </Badge>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Crown className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 mb-3">Nenhum plano ativo</p>
                    <Button
                      size="sm"
                      className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
                      onClick={() => window.location.href = createPageUrl('Subscription')}
                    >
                      Ver planos disponíveis
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Portal Stripe */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Settings className="w-4 h-4 text-slate-500" />
                  Gerenciar Assinatura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-slate-500">
                  Cancele, atualize seu método de pagamento ou troque de plano diretamente pelo portal seguro da Stripe.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    onClick={openPortal}
                    disabled={portalLoading}
                    className="flex-1 gap-2 bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    {portalLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4" />
                    )}
                    Acessar Portal de Pagamentos
                    <ExternalLink className="w-3.5 h-3.5 ml-auto" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = createPageUrl('Subscription')}
                    className="flex-1 gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Ver/Mudar Plano
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === VOUCHERS === */}
          <TabsContent value="vouchers" className="mt-5 space-y-5">
            {vouchersLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
            ) : (
              <>
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Card className="border-0 bg-gradient-to-br from-violet-50 to-violet-100">
                    <CardContent className="p-4 text-center">
                      <ShoppingBag className="w-5 h-5 text-violet-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-violet-700">{voucherStats.used}</p>
                      <p className="text-xs text-violet-500 mt-0.5">Vouchers usados</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 bg-gradient-to-br from-fuchsia-50 to-fuchsia-100">
                    <CardContent className="p-4 text-center">
                      <Ticket className="w-5 h-5 text-fuchsia-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-fuchsia-700">{voucherStats.total}</p>
                      <p className="text-xs text-fuchsia-500 mt-0.5">Total gerados</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100">
                    <CardContent className="p-4 text-center">
                      <CreditCard className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                      <p className="text-xl font-bold text-blue-700">
                        R$ {voucherStats.totalSpentVouchers.toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-xs text-blue-500 mt-0.5">Total gasto</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100">
                    <CardContent className="p-4 text-center">
                      <TrendingDown className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                      <p className="text-xl font-bold text-emerald-700">
                        R$ {voucherStats.totalSaved.toFixed(2).replace('.', ',')}
                      </p>
                      <p className="text-xs text-emerald-500 mt-0.5">Economia total</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Savings highlight */}
                {voucherStats.totalSaved > 0 && (
                  <div className="rounded-2xl p-5 text-center" style={{background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}}>
                    <BadgePercent className="w-8 h-8 text-white/80 mx-auto mb-2" />
                    <p className="text-white/80 text-sm mb-1">Você economizou no total</p>
                    <p className="text-4xl font-black text-white">
                      R$ {voucherStats.totalSaved.toFixed(2).replace('.', ',')}
                    </p>
                    <p className="text-white/70 text-xs mt-1">usando vouchers do Clube Max Descontos 🎉</p>
                  </div>
                )}

                {/* By partner */}
                {voucherStats.byPartner.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Store className="w-4 h-4 text-slate-400" />
                        Gastos por Parceiro
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {voucherStats.byPartner.map((p, i) => (
                        <div key={p.partner_id} className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm font-medium text-slate-800 truncate">{p.name}</p>
                              <p className="text-xs text-slate-500 shrink-0 ml-2">{p.count} voucher{p.count > 1 ? 's' : ''}</p>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-1.5">
                              <div
                                className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                                style={{ width: `${Math.min(100, (p.spent / voucherStats.totalSpentVouchers) * 100)}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold text-slate-800">R$ {p.spent.toFixed(2).replace('.', ',')}</p>
                            <p className="text-xs text-emerald-600">-R$ {p.saved.toFixed(2).replace('.', ',')}</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Voucher list */}
                {vouchers && vouchers.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-slate-400" />
                        Histórico de Vouchers
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {[...vouchers].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).map(v => {
                        const saved = (v.original_price || 0) - (v.discount_price || 0);
                        const statusMap = {
                          pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700 border-amber-200' },
                          used: { label: 'Usado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
                          expired: { label: 'Expirado', color: 'bg-slate-100 text-slate-500 border-slate-200' },
                        };
                        const sc = statusMap[v.status] || statusMap.pending;
                        return (
                          <div key={v.id} className="flex items-center justify-between p-3 rounded-xl border bg-slate-50/50 gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                                <Ticket className="w-4 h-4 text-violet-500" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-800 truncate">{v.product_name || 'Voucher'}</p>
                                <p className="text-xs text-slate-400">
                                  {v.created_date ? format(new Date(v.created_date), "dd/MM/yyyy", { locale: ptBR }) : '—'}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-semibold text-slate-800">R$ {(v.discount_price || 0).toFixed(2).replace('.', ',')}</p>
                              {saved > 0 && <p className="text-xs text-emerald-600">-R$ {saved.toFixed(2).replace('.', ',')}</p>}
                            </div>
                            <Badge className={`${sc.color} border text-xs shrink-0`}>{sc.label}</Badge>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}

                {(!vouchers || vouchers.length === 0) && (
                  <div className="text-center py-16">
                    <Ticket className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500">Nenhum voucher encontrado</p>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* === PAYMENTS === */}
          <TabsContent value="payments" className="mt-5">
            {stripeLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : charges.length === 0 ? (
              <div className="text-center py-16">
                <Receipt className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500">Nenhum pagamento encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {charges.map(charge => (
                  <ChargeRow key={charge.id} charge={charge} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* === SUBSCRIPTIONS === */}
          <TabsContent value="subscriptions" className="mt-5 space-y-4">
            {stripeLoading ? (
              <div className="space-y-3">
                {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
              </div>
            ) : stripeSubs.length === 0 && dbSubs.length === 0 ? (
              <div className="text-center py-16">
                <Crown className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 mb-4">Nenhuma assinatura encontrada</p>
                <Button
                  size="sm"
                  className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
                  onClick={() => window.location.href = createPageUrl('Subscription')}
                >
                  Ver planos
                  <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <>
                {stripeSubs.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Stripe</p>
                    {stripeSubs.map(sub => (
                      <SubscriptionCard key={sub.id} sub={sub} />
                    ))}
                  </div>
                )}
                {dbSubs.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Registros locais</p>
                    {dbSubs.map(sub => {
                      const isExpired = new Date(sub.expires_at) < new Date();
                      const statusLabel = isExpired ? 'Expirado' : sub.status === 'active' ? 'Ativo' : sub.status;
                      const statusColor = isExpired ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200';
                      return (
                        <div key={sub.id} className="border rounded-xl p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-slate-800 text-sm">
                                {planTypeLabels[sub.type] || sub.type}
                                {sub.is_trial && <span className="ml-2 text-xs text-violet-600 font-normal">(Trial)</span>}
                              </p>
                              {sub.price > 0 && (
                                <p className="text-xs text-slate-400">R$ {sub.price.toFixed(2).replace('.', ',')}</p>
                              )}
                            </div>
                            <Badge className={`${statusColor} border text-xs`}>{statusLabel}</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="text-slate-400 mb-0.5">Início</p>
                              <p className="text-slate-700 font-medium">
                                {sub.starts_at ? new Date(sub.starts_at).toLocaleDateString('pt-BR') : '—'}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400 mb-0.5">Vencimento</p>
                              <p className={`font-medium ${isExpired ? 'text-red-500' : 'text-slate-700'}`}>
                                {sub.expires_at ? new Date(sub.expires_at).toLocaleDateString('pt-BR') : '—'}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="pt-2">
                  <Button
                    onClick={openPortal}
                    disabled={portalLoading}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Settings className="w-4 h-4" />}
                    Gerenciar no Portal Stripe
                    <ExternalLink className="w-3.5 h-3.5 ml-auto" />
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}