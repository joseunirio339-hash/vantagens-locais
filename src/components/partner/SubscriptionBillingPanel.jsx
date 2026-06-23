import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import AddToCalendarButton from '@/components/partner/AddToCalendarButton';
import { 
  CreditCard, Receipt, Calendar, Clock, CheckCircle, XCircle, 
  AlertCircle, ExternalLink, TrendingUp, DollarSign, Download
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const planNames = {
  lojista: 'Plano Premium Lojista',
  stander: 'Plano Stander',
  partner: 'Plano Lojista',
  empreendedor: 'Plano Empreendedor',
  user: 'Plano Usuário'
};

const statusLabels = {
  active: 'Ativa',
  expired: 'Expirada',
  pending: 'Pendente',
  canceled: 'Cancelada',
  past_due: 'Atrasada',
  trialing: 'Período de Teste',
  incomplete: 'Incompleta',
  incomplete_expired: 'Incompleta (Expirada)',
  unpaid: 'Não paga',
  paused: 'Pausada'
};

const statusColors = {
  active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  trialing: 'bg-blue-100 text-blue-700 border-blue-200',
  expired: 'bg-red-100 text-red-700 border-red-200',
  past_due: 'bg-amber-100 text-amber-700 border-amber-200',
  canceled: 'bg-slate-100 text-slate-600 border-slate-200',
  unpaid: 'bg-red-100 text-red-700 border-red-200',
  incomplete: 'bg-orange-100 text-orange-700 border-orange-200',
  incomplete_expired: 'bg-red-100 text-red-700 border-red-200',
  paused: 'bg-slate-100 text-slate-600 border-slate-200',
  pending: 'bg-slate-100 text-slate-600 border-slate-200'
};

export default function SubscriptionBillingPanel({ subscription, userEmail, businessName }) {
  const [stripeData, setStripeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStripeHistory = async () => {
      try {
        setLoading(true);
        const response = await base44.functions.invoke('stripeHistory', {});
        setStripeData(response.data);
      } catch (err) {
        setError(err.message || 'Erro ao carregar histórico');
      } finally {
        setLoading(false);
      }
    };
    fetchStripeHistory();
  }, []);

  const planName = planNames[subscription?.type] || 'Plano Desconhecido';
  const isActive = subscription?.status === 'active';
  const isExpired = subscription?.status === 'expired';

  const charges = stripeData?.charges || [];
  const stripeSubscriptions = stripeData?.subscriptions || [];

  // Filter charges for the last 12 months
  const monthlyRevenue = React.useMemo(() => {
    const months = {};
    const now = new Date();
    charges.forEach(charge => {
      if (charge.status !== 'succeeded') return;
      const date = new Date(charge.created);
      if (date > new Date(now.getFullYear() - 1, now.getMonth(), 1)) {
        const key = format(date, 'yyyy-MM');
        months[key] = (months[key] || 0) + charge.amount;
      }
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({
        month: format(new Date(month + '-01'), 'MMM/yy', { locale: ptBR }),
        total
      }));
  }, [charges]);

  const totalPaid = charges
    .filter(c => c.status === 'succeeded')
    .reduce((sum, c) => sum + c.amount, 0);

  const handleOpenReceipt = async (paymentIntentId) => {
    try {
      const res = await base44.functions.invoke('stripeHistory', { 
        action: 'get_receipt', 
        payment_intent_id: paymentIntentId 
      });
      if (res.data?.receipt_url) {
        window.open(res.data.receipt_url, '_blank');
      }
    } catch (e) {
      // silently fail
    }
  };

  const handleBillingPortal = async () => {
    try {
      const res = await base44.functions.invoke('stripePortal', {});
      if (res.data?.url) {
        window.open(res.data.url, '_blank');
      }
    } catch (e) {
      // silently fail
    }
  };

  if (loading) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <Card className="border-0 shadow-md bg-white overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-violet-100 text-xs font-medium uppercase tracking-wide">Plano Atual</p>
                <h3 className="text-white font-bold text-lg">{planName}</h3>
              </div>
            </div>
            <Badge className={`${isActive ? 'bg-emerald-500' : isExpired ? 'bg-red-500' : 'bg-amber-500'} text-white border-0 text-xs px-3 py-1`}>
              {statusLabels[subscription?.status] || subscription?.status}
            </Badge>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span className="text-xs text-slate-500">Valor Mensal</span>
              </div>
              <p className="text-lg font-bold text-slate-800">R$ {subscription?.price?.toFixed(2).replace('.', ',') || '—'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-slate-500">Início</span>
              </div>
              <p className="text-lg font-bold text-slate-800">
                {subscription?.starts_at ? format(new Date(subscription.starts_at), 'dd/MM/yy') : '—'}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-xs text-slate-500">Expira em</span>
              </div>
              <p className="text-lg font-bold text-slate-800">
                {subscription?.expires_at ? format(new Date(subscription.expires_at), 'dd/MM/yy') : '—'}
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-violet-600" />
                <span className="text-xs text-slate-500">Total Pago</span>
              </div>
              <p className="text-lg font-bold text-slate-800">R$ {totalPaid.toFixed(2).replace('.', ',')}</p>
            </div>
          </div>

          <button
            onClick={handleBillingPortal}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors text-sm font-semibold"
          >
            <ExternalLink className="w-4 h-4" />
            Gerenciar Assinatura no Stripe
          </button>

          <div className="mt-3 flex justify-center">
            <AddToCalendarButton subscription={subscription} businessName={businessName} />
          </div>
        </CardContent>
      </Card>

      {/* Revenue Chart */}
      {monthlyRevenue.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Faturamento Mensal — Últimos 12 meses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-32">
              {monthlyRevenue.map((item, i) => {
                const maxVal = Math.max(...monthlyRevenue.map(m => m.total));
                const height = maxVal > 0 ? (item.total / maxVal) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <span className="text-xs font-semibold text-slate-700">
                      R${item.total.toFixed(0)}
                    </span>
                    <div 
                      className="w-full bg-gradient-to-t from-violet-500 to-fuchsia-500 rounded-t-lg transition-all"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    />
                    <span className="text-[10px] text-slate-400">{item.month}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-600" />
            Histórico de Pagamentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {charges.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Receipt className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Nenhum pagamento registrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-2 text-xs font-semibold text-slate-400 uppercase">Data</th>
                    <th className="text-left py-3 px-2 text-xs font-semibold text-slate-400 uppercase">Descrição</th>
                    <th className="text-right py-3 px-2 text-xs font-semibold text-slate-400 uppercase">Valor</th>
                    <th className="text-center py-3 px-2 text-xs font-semibold text-slate-400 uppercase">Status</th>
                    <th className="text-center py-3 px-2 text-xs font-semibold text-slate-400 uppercase"></th>
                  </tr>
                </thead>
                <tbody>
                  {charges.map((charge) => (
                    <tr key={charge.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-3 px-2">
                        <p className="font-medium text-slate-700">
                          {format(new Date(charge.created), 'dd/MM/yy')}
                        </p>
                        <p className="text-xs text-slate-400">
                          {format(new Date(charge.created), 'HH:mm')}
                        </p>
                      </td>
                      <td className="py-3 px-2">
                        <p className="text-slate-700 truncate max-w-[200px]">
                          {charge.description || 'Pagamento de assinatura'}
                        </p>
                        {charge.failure_message && (
                          <p className="text-xs text-red-500 mt-0.5">{charge.failure_message}</p>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <span className="font-bold text-slate-800">
                          R$ {charge.amount.toFixed(2).replace('.', ',')}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {charge.status === 'succeeded' ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500 inline" />
                        ) : charge.status === 'failed' ? (
                          <XCircle className="w-4 h-4 text-red-500 inline" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500 inline" />
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        {charge.receipt_url && (
                          <button
                            onClick={() => handleOpenReceipt(charge.payment_intent)}
                            className="text-violet-600 hover:text-violet-800 transition-colors"
                            title="Ver recibo"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {error && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          ⚠️ Não foi possível carregar o histórico completo do Stripe. Tente novamente mais tarde.
        </div>
      )}
    </div>
  );
}