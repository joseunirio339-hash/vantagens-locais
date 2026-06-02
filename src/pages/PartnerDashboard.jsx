import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { 
  Store, Package, Eye, Ticket, TrendingUp, 
  Settings, BarChart3, AlertTriangle, Star, ShoppingBag, QrCode, ChevronDown, Gift, CalendarDays
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
import QRScanner from '@/components/partner/QRScanner';
import RaffleManager from '@/components/raffle/RaffleManager';
import PartnerPerformance from '@/components/partner/PartnerPerformance';
import AppointmentsCalendar from '@/components/partner/AppointmentsCalendar';
import FinancialPanel from '@/components/partner/FinancialPanel';
import LoyaltyRewardsManager from '@/components/loyalty/LoyaltyRewardsManager';
import StampCardsManager from '@/components/loyalty/StampCardsManager';
import ExportSalesButton from '@/components/partner/ExportSalesButton';

export default function PartnerDashboard() {
  const [user, setUser] = useState(null);
  const [allPartners, setAllPartners] = useState([]);
  const [partner, setPartner] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
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

      setAllPartners(partners);

      // Check if a specific partner was requested via URL
      const urlParams = new URLSearchParams(window.location.search);
      const requestedId = urlParams.get('partner_id');
      const partnerData = (requestedId && partners.find(p => p.id === requestedId)) || partners[0];
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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden bg-violet-100">
                {partner?.logo_url ? (
                  <img src={partner.logo_url} alt={partner.business_name} className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-7 h-7 text-violet-600" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">{partner?.business_name}</h1>
                <p className="text-slate-500">Painel do Parceiro</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Partner selector */}
              {allPartners.length > 1 && (
                <div className="relative">
                  <select
                    value={partner?.id || ''}
                    onChange={(e) => {
                      const p = allPartners.find(x => x.id === e.target.value);
                      if (p) { setPartner(p); setActiveTab('products'); }
                    }}
                    className="pl-3 pr-8 py-2 rounded-xl border border-violet-200 bg-violet-50 text-violet-800 text-sm font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-violet-300 cursor-pointer"
                  >
                    {allPartners.map(p => (
                      <option key={p.id} value={p.id}>{p.business_name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500 pointer-events-none" />
                </div>
              )}
              <NotificationBell partnerId={partner?.id} />
            </div>
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

        {/* QR Scanner Destaque */}
        <div
          className="bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl p-5 mb-6 flex items-center justify-between cursor-pointer hover:from-violet-700 hover:to-fuchsia-700 transition-all shadow-lg"
          onClick={() => setActiveTab('qrscanner')}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <QrCode className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Validar Voucher do Cliente</h3>
              <p className="text-violet-100 text-sm">Escaneie o QR Code para confirmar o desconto na hora</p>
            </div>
          </div>
          <div className="bg-white text-violet-700 font-semibold text-sm px-5 py-2.5 rounded-xl shadow hidden sm:block">
            Abrir Scanner →
          </div>
        </div>

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

        <FinancialPanel vouchers={vouchers} />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Análises
            </TabsTrigger>
            <TabsTrigger value="reviews" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Avaliações
            </TabsTrigger>
            <TabsTrigger value="qrscanner" className="flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              Ler QR Code
            </TabsTrigger>
            <TabsTrigger value="raffles" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Sorteios
            </TabsTrigger>
            <TabsTrigger value="appointments" className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Agendamentos
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Fidelidade
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
            <div className="flex justify-end mb-4">
              <ExportSalesButton vouchers={vouchers} products={products} partnerName={partner?.business_name} />
            </div>
            <SalesOverview vouchers={vouchers} products={products} />
          </TabsContent>

          <TabsContent value="performance">
            <PartnerPerformance
              partner={partner}
              products={products}
              vouchers={vouchers}
              views={views}
            />
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

          <TabsContent value="qrscanner">
            <QRScanner
              partner={partner}
              onValidated={() => queryClient.invalidateQueries(['partnerVouchers'])}
            />
          </TabsContent>

          <TabsContent value="raffles">
            <RaffleManager partner={partner} />
          </TabsContent>

          <TabsContent value="appointments">
            <AppointmentsCalendar partnerId={partner?.id} />
          </TabsContent>

          <TabsContent value="loyalty">
            <div className="space-y-8">
              <StampCardsManager partnerId={partner?.id} />
              <div className="border-t pt-6">
                <LoyaltyRewardsManager partnerId={partner?.id} />
              </div>
            </div>
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