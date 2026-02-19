import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { 
  Store, Package, Eye, Ticket, TrendingUp, 
  Settings, BarChart3, AlertTriangle, Star, ShoppingBag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import SubscriptionBanner from '@/components/ui/SubscriptionBanner';
import ProductManagement from '@/components/partner/ProductManagement';
import PartnerAnalytics from '@/components/partner/PartnerAnalytics';
import PartnerSettings from '@/components/partner/PartnerSettings';
import VoucherManagement from '@/components/partner/VoucherManagement';
import NotificationBell from '@/components/partner/NotificationBell';
import PartnerReviews from '@/components/partner/PartnerReviews';
import SalesOverview from '@/components/partner/SalesOverview';

export default function PartnerDashboard() {
  const [user, setUser] = useState(null);
  const [partner, setPartner] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadData = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        base44.auth.redirectToLogin(createPageUrl('PartnerDashboard'));
        return;
      }

      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const partners = await base44.entities.Partner.filter({
        owner_email: currentUser.email
      });

      if (partners.length === 0) {
        window.location.href = createPageUrl('Subscription');
        return;
      }

      const partnerData = partners[0];
      setPartner(partnerData);

      const subs = await base44.entities.Subscription.filter({
        user_email: currentUser.email,
        type: 'partner'
      });

      if (subs.length > 0) {
        const sub = subs[0];
        const isExpired = new Date(sub.expires_at) < new Date();
        setSubscription({
          ...sub,
          status: isExpired ? 'expired' : sub.status
        });

        if (isExpired && partnerData.subscription_status === 'active') {
          await base44.entities.Partner.update(partnerData.id, {
            subscription_status: 'expired'
          });
          setPartner({ ...partnerData, subscription_status: 'expired' });
        }
      }

      setLoading(false);
    };
    loadData();
  }, []);

  const { data: products = [] } = useQuery({
    queryKey: ['partnerProducts', partner?.id],
    queryFn: () => base44.entities.Product.filter({ partner_id: partner.id }),
    enabled: !!partner?.id
  });

  const { data: vouchers = [] } = useQuery({
    queryKey: ['partnerVouchers', partner?.id],
    queryFn: () => base44.entities.Voucher.filter({ partner_id: partner.id }),
    enabled: !!partner?.id
  });

  const { data: views = [] } = useQuery({
    queryKey: ['partnerViews', partner?.id],
    queryFn: () => base44.entities.ProductView.filter({ partner_id: partner.id }),
    enabled: !!partner?.id
  });

  const isBlocked = subscription?.status !== 'active';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-12 w-48 mb-6" />
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Produtos',
      value: products.length,
      max: 20,
      icon: Package,
      color: 'emerald'
    },
    {
      label: 'Vouchers Gerados',
      value: vouchers.length,
      icon: Ticket,
      color: 'blue'
    },
    {
      label: 'Vouchers Usados',
      value: vouchers.filter(v => v.status === 'used').length,
      icon: TrendingUp,
      color: 'violet'
    },
    {
      label: 'Visualizações',
      value: views.length,
      icon: Eye,
      color: 'amber'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden ${partner?.partner_type === 'empreendedor' ? 'bg-amber-100' : 'bg-violet-100'}`}>
                {partner?.logo_url ? (
                  <img src={partner.logo_url} alt={partner.business_name} className="w-full h-full object-cover" />
                ) : (
                  <Store className={`w-7 h-7 ${partner?.partner_type === 'empreendedor' ? 'text-amber-600' : 'text-violet-600'}`} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-800">{partner?.business_name}</h1>
                  {partner?.partner_type === 'empreendedor' && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">🤝 Empreendedor</span>
                  )}
                </div>
                <p className="text-slate-500">Painel do Parceiro</p>
              </div>
            </div>
            <NotificationBell partnerId={partner?.id} />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <SubscriptionBanner
          type="partner"
          status={subscription?.status}
          expiresAt={subscription?.expires_at}
        />

        {isBlocked && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-800">Acesso Bloqueado</h3>
                <p className="text-red-600 mt-1">
                  Sua assinatura expirou. Renove para continuar gerenciando seus produtos e receber novos clientes.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            const colors = {
              emerald: 'bg-emerald-100 text-emerald-600',
              blue: 'bg-blue-100 text-blue-600',
              violet: 'bg-violet-100 text-violet-600',
              amber: 'bg-amber-100 text-amber-600'
            };

            return (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-xl ${colors[stat.color]}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {stat.max && (
                      <span className="text-xs text-slate-500">
                        {stat.value}/{stat.max}
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="bg-white border flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="vouchers" className="flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              Vouchers
            </TabsTrigger>
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Vendas
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Análises
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Avaliações
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            <ProductManagement 
              partner={partner} 
              products={products}
              isBlocked={isBlocked}
              onUpdate={() => queryClient.invalidateQueries(['partnerProducts'])}
            />
          </TabsContent>

          <TabsContent value="vouchers">
            <VoucherManagement 
              vouchers={vouchers}
              products={products}
              onUpdate={() => queryClient.invalidateQueries(['partnerVouchers'])}
            />
          </TabsContent>

          <TabsContent value="sales">
            <SalesOverview vouchers={vouchers} products={products} />
          </TabsContent>

          <TabsContent value="analytics">
            <PartnerAnalytics 
              products={products}
              vouchers={vouchers}
              views={views}
            />
          </TabsContent>

          <TabsContent value="reviews">
            <PartnerReviews partnerId={partner?.id} />
          </TabsContent>

          <TabsContent value="settings">
            <PartnerSettings 
              partner={partner}
              subscription={subscription}
              onUpdate={(updatedPartner) => setPartner(updatedPartner)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}