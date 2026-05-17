import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createPageUrl } from '@/utils';
import {
  CreditCard, CheckCircle, XCircle, Clock, ExternalLink,
  Receipt, RefreshCw, ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const statusConfig = {
  succeeded: { label: 'Aprovado', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle },
  failed: { label: 'Recusado', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  refunded: { label: 'Reembolsado', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: RefreshCw },
};

const subscriptionStatusConfig = {
  active: { label: 'Ativa', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  canceled: { label: 'Cancelada', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  past_due: { label: 'Em atraso', color: 'bg-red-100 text-red-700 border-red-200' },
  trialing: { label: 'Trial', color: 'bg-violet-100 text-violet-700 border-violet-200' },
  unpaid: { label: 'Não paga', color: 'bg-orange-100 text-orange-700 border-orange-200' },
};

const planLabels = {
  'price_1TY8efLsB3SzuNJItliAzOIn': 'Plano Usuário',
  'price_1TY8efLsB3SzuNJIgs5Hw2ka': 'Plano Lojista',
  'price_1TY8efLsB3SzuNJIjd10iAOn': 'Plano Empreendedor',
};

function ChargeCard({ charge }) {
  const [expanded, setExpanded] = useState(false);
  const status = statusConfig[charge.status] || statusConfig.pending;
  const Icon = status.icon;

  return (
    <Card className="border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">
                R$ {charge.amount.toFixed(2).replace('.', ',')}
              </p>
              <p className="text-xs text-slate-500">
                {format(new Date(charge.created), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${status.color} border gap-1 text-xs`}>
              <Icon className="w-3 h-3" />
              {status.label}
            </Badge>
            <button onClick={() => setExpanded(!expanded)} className="text-slate-400 hover:text-slate-600">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-500 text-xs">ID da transação</p>
                <p className="font-mono text-xs text-slate-700 truncate">{charge.id}</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Moeda</p>
                <p className="text-slate-700 uppercase">{charge.currency}</p>
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
                  Ver Recibo PDF
                  <ExternalLink className="w-3 h-3 ml-auto" />
                </Button>
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SubscriptionCard({ sub }) {
  const status = subscriptionStatusConfig[sub.status] || subscriptionStatusConfig.canceled;
  const item = sub.items[0];
  const planName = planLabels[item?.price_id] || 'Assinatura';

  return (
    <Card className="border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-semibold text-slate-800">{planName}</p>
            <p className="text-xs text-slate-500">
              {item ? `R$ ${item.amount.toFixed(2).replace('.', ',')} / ${item.interval === 'month' ? 'mês' : item.interval}` : ''}
            </p>
          </div>
          <Badge className={`${status.color} border text-xs`}>{status.label}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-slate-400">Período atual</p>
            <p className="text-slate-700 font-medium">
              {format(new Date(sub.current_period_start), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Renova em</p>
            <p className="text-slate-700 font-medium">
              {format(new Date(sub.current_period_end), "dd/MM/yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
        {sub.cancel_at_period_end && (
          <div className="mt-3 bg-amber-50 rounded-lg px-3 py-2 text-xs text-amber-700 flex items-center gap-2">
            <AlertCircle className="w-3 h-3" />
            Cancelamento agendado ao fim do período
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PurchaseHistory() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (auth) => {
      if (!auth) {
        base44.auth.redirectToLogin(createPageUrl('PurchaseHistory'));
        return;
      }
      setUser(await base44.auth.me());
    });
  }, []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['stripeHistory', user?.email],
    queryFn: () => base44.functions.invoke('stripeHistory', {}),
    enabled: !!user?.email,
    select: (res) => res.data
  });

  const charges = data?.charges || [];
  const subscriptions = data?.subscriptions || [];
  const totalSpent = charges.filter(c => c.status === 'succeeded').reduce((s, c) => s + c.amount, 0);

  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-3xl mx-auto">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || data?.error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
          <p className="text-slate-600 mb-4">Erro ao carregar histórico</p>
          <Button onClick={() => refetch()} variant="outline">Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Minhas Compras</h1>
          <p className="text-slate-500">Histórico de transações e assinaturas</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-violet-600">
                R$ {totalSpent.toFixed(2).replace('.', ',')}
              </p>
              <p className="text-xs text-slate-500 mt-1">Total investido</p>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">
                {charges.filter(c => c.status === 'succeeded').length}
              </p>
              <p className="text-xs text-slate-500 mt-1">Pagamentos aprovados</p>
            </CardContent>
          </Card>
          <Card className="border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-slate-700">
                {subscriptions.filter(s => s.status === 'active').length}
              </p>
              <p className="text-xs text-slate-500 mt-1">Assinaturas ativas</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="payments">
          <TabsList className="bg-white border w-full mb-6">
            <TabsTrigger value="payments" className="flex-1">
              Pagamentos ({charges.length})
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex-1">
              Assinaturas ({subscriptions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments">
            {charges.length === 0 ? (
              <div className="text-center py-12">
                <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Nenhum pagamento encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {charges.map(charge => (
                  <ChargeCard key={charge.id} charge={charge} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="subscriptions">
            {subscriptions.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">Nenhuma assinatura encontrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {subscriptions.map(sub => (
                  <SubscriptionCard key={sub.id} sub={sub} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}