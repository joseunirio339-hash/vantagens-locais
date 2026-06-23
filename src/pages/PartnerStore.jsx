import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { MapPin, Phone, Tag, ArrowLeft, Star, Gift, Sparkles } from 'lucide-react';
import PartnerLocationMap from '@/components/partners/PartnerLocationMap';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
import ProductCard from '@/components/products/ProductCard';
import VoucherModal from '@/components/voucher/VoucherModal';
import EntrepreneurVoucherModal from '@/components/voucher/EntrepreneurVoucherModal';
import ProductReviews from '@/components/reviews/ProductReviews';
import PartnerReviewForm from '@/components/reviews/PartnerReviewForm';
import RaffleSpinModal from '@/components/raffle/RaffleSpinModal';

const categoryLabels = {
  restaurante: 'Restaurante',
  moda: 'Moda',
  eletronicos: 'Eletrônicos',
  beleza: 'Beleza',
  saude: 'Saúde',
  mercado: 'Mercado',
  servicos: 'Serviços',
  doceria: '🍰 Doceria',
  hamburgueria: '🍔 Hamburgueria',
  trailer_food: '🚚 Trailer / Food Truck',
  artesanato: '🎨 Artesanato',
  confeitaria: '🎂 Confeitaria',
  salgados: '🥟 Salgados',
  costura: '🧵 Costura',
  outros: 'Outros'
};

export default function PartnerStore() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [raffleModalOpen, setRaffleModalOpen] = useState(false);
  const [selectedRaffle, setSelectedRaffle] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const partnerId = urlParams.get('id');

  useEffect(() => {
    let cancelled = false;
    const loadUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth || cancelled) return;
        const currentUser = await base44.auth.me();
        if (cancelled) return;
        setUser(currentUser);

        try {
          const subs = await base44.entities.Subscription.filter({
            user_email: currentUser.email,
            type: 'user'
          });
          if (cancelled) return;
          if (subs.length > 0) {
            const sub = subs[0];
            const isExpired = new Date(sub.expires_at) < new Date();
            setSubscription({
              ...sub,
              status: isExpired ? 'expired' : sub.status
            });
          }
        } catch (_) { /* subscription check failed silently */ }
      } catch (_) { /* rate limit / network error */ }
    };
    loadUser();
    return () => { cancelled = true; };
  }, []);

  const { data: partner, isLoading: loadingPartner } = useQuery({
    queryKey: ['partner', partnerId],
    queryFn: async () => {
      const partners = await base44.entities.Partner.filter({ id: partnerId });
      return partners[0];
    },
    enabled: !!partnerId
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['partnerProducts', partnerId],
    queryFn: () => base44.entities.Product.filter({ partner_id: partnerId, is_active: true }),
    enabled: !!partnerId
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['partnerReviews', partnerId],
    queryFn: () => base44.entities.Review.filter({ partner_id: partnerId }, '-created_date', 50),
    enabled: !!partnerId
  });

  const { data: raffles = [] } = useQuery({
    queryKey: ['partnerRaffles', partnerId],
    queryFn: () => base44.entities.Raffle.filter({ partner_id: partnerId, is_active: true }),
    enabled: !!partnerId
  });

  const { data: partnerSubscription } = useQuery({
    queryKey: ['partnerSubscription', partner?.owner_email],
    queryFn: async () => {
      const subs = await base44.entities.Subscription.filter({
        user_email: partner?.owner_email,
        type: 'lojista',
        status: 'active'
      });
      return subs.length > 0 ? subs[0] : null;
    },
    enabled: !!partner?.owner_email
  });

  const isPartnerPremium = !!partnerSubscription;

  const { data: userVouchers = [] } = useQuery({
    queryKey: ['userVouchers', user?.email, partnerId],
    queryFn: () => base44.entities.Voucher.filter({ user_email: user.email, partner_id: partnerId }),
    enabled: !!user?.email && !!partnerId
  });

  const handleOpenRaffle = (raffle) => {
    if (!user) { base44.auth.redirectToLogin(window.location.href); return; }
    setSelectedRaffle(raffle);
    setRaffleModalOpen(true);
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const handleProductClick = async (product) => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    if (!subscription || subscription.status !== 'active') {
      window.location.href = createPageUrl('Subscription');
      return;
    }

    setSelectedProduct(product);
    setVoucherModalOpen(true);

    await base44.entities.ProductView.create({
      product_id: product.id,
      partner_id: partnerId,
      user_email: user.email
    });

    await base44.entities.Product.update(product.id, {
      views_count: (product.views_count || 0) + 1
    });
  };

  if (loadingPartner) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <Skeleton className="h-48 rounded-2xl mb-4" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Tag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Parceiro não encontrado</p>
          <Link to={createPageUrl('Partners')}>
            <Button className="mt-4">Voltar para Parceiros</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link to={createPageUrl('Partners')}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>

          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
              {partner.logo_url ? (
                <img
                  src={partner.logo_url}
                  alt={partner.business_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-slate-400">
                  {partner.business_name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-800">
                    {partner.business_name}
                  </h1>
                  {isPartnerPremium && (
                    <span className="text-xs bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-full px-2.5 py-1 flex items-center gap-1 font-bold shadow-md">
                      <Sparkles className="w-3 h-3" /> PREMIUM
                    </span>
                  )}
                </div>
                {partner.category && (
                  <Badge variant="secondary">
                    {categoryLabels[partner.category]}
                  </Badge>
                )}
              </div>

              {partner.description && (
                <p className="text-slate-500 mt-2">{partner.description}</p>
              )}

              {avgRating && (
                <div className="flex items-center gap-1 mt-2">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="font-semibold text-slate-700">{avgRating}</span>
                  <span className="text-slate-400 text-sm">({reviews.length} avaliação{reviews.length !== 1 ? 'ões' : ''})</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
                {partner.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {partner.address}
                  </span>
                )}
                {partner.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {partner.phone}
                  </span>
                )}
              </div>

              <PartnerLocationMap partner={partner} />
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-slate-800 mb-6">
          Produtos com Desconto ({products.length})
        </h2>

        {loadingProducts ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-2xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhum produto disponível no momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => handleProductClick(product)}
                avgRating={avgRating}
                reviewCount={reviews.length}
                isPremium={isPartnerPremium}
              />
            ))}
          </div>
        )}
      </div>

      {/* Raffles Section — somente plano premium */}
      {isPartnerPremium && raffles.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 pb-4">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Gift className="w-5 h-5 text-violet-600" />
            Sorteios de Prêmios
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {raffles.map(raffle => (
              <div
                key={raffle.id}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-2xl p-5 text-white cursor-pointer hover:from-violet-700 hover:to-fuchsia-700 transition-all shadow-lg"
                onClick={() => handleOpenRaffle(raffle)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-lg">{raffle.title}</h3>
                    {raffle.description && <p className="text-violet-100 text-sm mt-1">{raffle.description}</p>}
                    <p className="text-violet-200 text-xs mt-2">{raffle.prizes?.length} prêmios disponíveis</p>
                  </div>
                  <div className="bg-white/20 rounded-xl p-3">
                    <Gift className="w-8 h-8 text-white" />
                  </div>
                </div>
                <Button size="sm" className="mt-3 bg-white text-violet-700 hover:bg-violet-50 font-semibold">
                  Girar Roleta →
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Reviews Section */}
      <div className="max-w-6xl mx-auto px-4 pb-10">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          Avaliações dos Clientes
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <ProductReviews partnerId={partnerId} partnerName={partner?.business_name} />
          </div>
          <div>
            <PartnerReviewForm partnerId={partnerId} user={user} />
          </div>
        </div>
      </div>

      <RaffleSpinModal
        open={raffleModalOpen}
        onClose={() => { setRaffleModalOpen(false); setSelectedRaffle(null); }}
        raffle={selectedRaffle}
        partner={partner}
        user={user}
        availableVouchers={userVouchers}
      />

      {partner?.partner_type === 'empreendedor' ? (
        <EntrepreneurVoucherModal
          open={voucherModalOpen}
          onClose={() => setVoucherModalOpen(false)}
          product={selectedProduct}
          partner={partner}
          user={user}
          onSuccess={() => {}}
        />
      ) : (
        <VoucherModal
          open={voucherModalOpen}
          onClose={() => setVoucherModalOpen(false)}
          product={selectedProduct}
          partner={partner}
          user={user}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}