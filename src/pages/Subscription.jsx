import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, CreditCard, Store, Users, Loader2, Crown, Sparkles, Gift, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';

const plans = [
  {
    type: 'user',
    name: 'Usuário',
    price: 4.99,
    period: 'mês',
    icon: Users,
    color: 'emerald',
    trialDays: 30,
    features: [
      '🎁 1º mês GRÁTIS (período de teste)',
      'Acesso a todos os descontos',
      'Geração ilimitada de vouchers',
      'Busca de produtos e lojas',
      'Histórico de compras',
      'Suporte por email'
    ]
  },
  {
    type: 'lojista',
    name: 'Lojista Parceiro',
    price: 99.99,
    period: 'mês',
    icon: Store,
    color: 'violet',
    features: [
      'Cadastro de até 20 produtos',
      'Painel de gestão completo',
      'Análises de vendas e acessos',
      'Logo e perfil da loja',
      'Validação de vouchers',
      'Suporte prioritário'
    ]
  },
];

export default function Subscription() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [existingSubscriptions, setExistingSubscriptions] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin(createPageUrl('Subscription'));
        return;
      }

      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const subs = await base44.entities.Subscription.filter({
        user_email: currentUser.email
      });
      setExistingSubscriptions(subs);
    };
    loadData();
  }, []);

  const getSubscriptionStatus = (type) => {
    const sub = existingSubscriptions.find(s => s.type === type);
    if (!sub) return null;
    
    const isExpired = new Date(sub.expires_at) < new Date();
    return {
      ...sub,
      status: isExpired ? 'expired' : sub.status
    };
  };

  // Verifica se o usuário já usou o trial
  const hasUsedTrial = existingSubscriptions.some(s => s.type === 'user' && s.is_trial === true);

  const handleSubscribe = async (planType) => {
    if (!user) {
      base44.auth.redirectToLogin(createPageUrl('Subscription'));
      return;
    }

    setSelectedPlan(planType);
    setLoading(true);

    const isFreeTrialEligible = planType === 'user' && !existingSubscriptions.find(s => s.type === 'user') && !hasUsedTrial;

    try {
      // Se é trial gratuito do plano user, ativa sem Stripe
      if (isFreeTrialEligible) {
        const startsAt = new Date();
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        await base44.entities.Subscription.create({
          user_email: user.email,
          type: 'user',
          status: 'active',
          price: 0,
          is_trial: true,
          starts_at: startsAt.toISOString().split('T')[0],
          expires_at: expiresAt.toISOString().split('T')[0]
        });

        setLoading(false);
        toast.success('🎁 Período de teste gratuito ativado por 1 mês!');
        window.location.href = createPageUrl('Home');
        return;
      }

      // Redireciona para checkout do Stripe
      const response = await base44.functions.invoke('stripeCheckout', {
        subscriptionType: planType
      });

      if (response.data.isIframe) {
        setLoading(false);
        toast.error('Abra o checkout em uma nova janela (pop-up)');
        return;
      }

      if (response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('Falha ao gerar link de checkout');
      }
    } catch (error) {
      setLoading(false);
      toast.error('Erro ao processar assinatura');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 rounded-full px-4 py-2 mb-4">
            <Crown className="w-4 h-4" />
            <span className="text-sm font-medium">Planos Mensais</span>
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-4">
            Escolha seu Plano
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            Acesse descontos exclusivos do comércio local, cadastre seu negócio ou loja parceira
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
           {plans.map(plan => {
             const sub = getSubscriptionStatus(plan.type);
             const isActive = sub?.status === 'active';
             const isExpired = sub?.status === 'expired';
             const isTrial = sub?.is_trial === true;
             const isTrialExpired = isTrial && isExpired;
             const isFreeTrial = plan.type === 'user' && !sub && !hasUsedTrial;
             const Icon = plan.icon;

             const colorMap = {
               emerald: { border: 'border-emerald-200', icon: 'bg-emerald-100', iconText: 'text-emerald-600', btn: 'bg-emerald-600 hover:bg-emerald-700', check: 'bg-emerald-100 text-emerald-600', badge: 'bg-emerald-500' },
               amber:   { border: 'border-amber-300 shadow-lg shadow-amber-100', icon: 'bg-amber-100', iconText: 'text-amber-600', btn: 'bg-amber-500 hover:bg-amber-600', check: 'bg-amber-100 text-amber-600', badge: 'bg-amber-500' },
               violet:  { border: 'border-violet-200', icon: 'bg-violet-100', iconText: 'text-violet-600', btn: 'bg-violet-600 hover:bg-violet-700', check: 'bg-violet-100 text-violet-600', badge: 'bg-violet-500' }
             };
             const c = colorMap[plan.color];

             const descriptions = {
               user: 'Para consumidores que querem economizar',
               lojista: 'Para lojistas estabelecidos com CNPJ'
             };

            return (
              <Card
                key={plan.type}
                className={`relative overflow-hidden border-2 transition-all ${c.border}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <Badge className={`rounded-none rounded-bl-lg ${c.badge} hover:${c.badge} text-white`}>
                      <Sparkles className="w-3 h-3 mr-1" />
                      {plan.badge || 'Popular'}
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${c.icon}`}>
                    <Icon className={`w-7 h-7 ${c.iconText}`} />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{descriptions[plan.type]}</CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="mb-6">
                    {isFreeTrial ? (
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-emerald-600">GRÁTIS</span>
                          <span className="text-slate-400 line-through text-sm">R$ {plan.price.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <p className="text-xs text-emerald-600 mt-1">1º mês de teste • depois R$ {plan.price.toFixed(2).replace('.', ',')}/mês via ticket</p>
                      </div>
                    ) : (
                      <div>
                        <span className="text-3xl font-bold text-slate-800">
                          R$ {plan.price.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-slate-500">/{plan.period}</span>
                      </div>
                    )}
                  </div>

                  {isActive && sub?.expires_at && (
                    <div className={`border rounded-xl p-3 mb-4 ${isTrial ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-50 border-emerald-200'}`}>
                      <p className="text-sm text-emerald-700">
                        <Check className="w-4 h-4 inline mr-1" />
                        {isTrial ? '🎁 Teste gratuito' : 'Ativo'} até {new Date(sub.expires_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}

                  {isTrialExpired && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                      <p className="text-sm text-amber-700 font-medium">Período de teste encerrado</p>
                      <p className="text-xs text-amber-600 mt-1">Para continuar, use um ticket de acesso</p>
                    </div>
                  )}

                  {isExpired && !isTrial && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                      <p className="text-sm text-amber-700">
                        Expirado em {new Date(sub.expires_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}

                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${c.check}`}>
                          <Check className="w-3 h-3" />
                        </div>
                        <span className="text-sm text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleSubscribe(plan.type)}
                    disabled={loading || (isActive && !isExpired)}
                    className={`w-full h-11 text-sm font-semibold text-white ${c.btn} ${isActive && !isExpired ? 'opacity-50' : ''}`}
                  >
                    {loading && selectedPlan === plan.type ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : isActive && !isExpired ? (
                      isTrial ? '🎁 Teste Ativo' : 'Plano Ativo'
                    ) : isFreeTrial ? (
                      <><Gift className="w-4 h-4 mr-2" />Ativar Mês Grátis</>
                    ) : isExpired ? (
                      <><CreditCard className="w-4 h-4 mr-2" />Renovar Assinatura</>
                    ) : (
                      <><CreditCard className="w-4 h-4 mr-2" />Assinar Agora</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-10 bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm">
          <p className="text-sm text-slate-600 font-medium mb-1">
            💳 Pagamentos processados com segurança via <strong>Stripe</strong>
          </p>
          <p className="text-xs text-slate-400 mb-3">Assinatura mensal recorrente · Cancele a qualquer momento · Suporte por e-mail incluído</p>
          <p className="text-xs text-emerald-600 flex items-center justify-center gap-1">
            <Gift className="w-3 h-3" /> Plano Usuário: 1º mês GRÁTIS para novos usuários (depois R$ 19,99/mês).
          </p>
        </div>
      </div>
    </div>
  );
}