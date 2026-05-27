import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, Store, Tag, ChevronRight, Sparkles, Heart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard from '@/components/products/ProductCard';
import PartnerCard from '@/components/partners/PartnerCard';
import SubscriptionBanner from '@/components/ui/SubscriptionBanner';
import VoucherModal from '@/components/voucher/VoucherModal';
import EntrepreneurVoucherModal from '@/components/voucher/EntrepreneurVoucherModal';
import LocationFilter from '@/components/home/LocationFilter';
import NearbyPartnersMap from '@/components/home/NearbyPartnersMap';
import LeaderboardTop10 from '@/components/referral/LeaderboardTop10';
import HomeBadgesWidget from '@/components/badges/HomeBadgesWidget';
import TopRatedPartners from '@/components/home/TopRatedPartners';
import { useFavorites } from '@/hooks/useFavorites';

export default function Home() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('');
  const [productCounts, setProductCounts] = useState({});

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        const subs = await base44.entities.Subscription.filter({
          user_email: currentUser.email,
          type: 'user'
        });
        if (subs.length > 0) {
          const sub = subs[0];
          const isExpired = new Date(sub.expires_at) < new Date();
          setSubscription({
            ...sub,
            status: isExpired ? 'expired' : sub.status
          });
        }
      }
    };
    loadUser();
  }, []);

  const { data: partners = [], isLoading: loadingPartners } = useQuery({
    queryKey: ['partners'],
    queryFn: async () => {
      const active = await base44.entities.Partner.filter({ subscription_status: 'active' });
      const extras = await Promise.all([
        base44.entities.Partner.filter({ id: '699667374773d515504fac61' }),
        base44.entities.Partner.filter({ id: '69c6dd738bb52da27d1adad8' }),
      ]);
      const all = [...active];
      extras.flat().forEach(p => { if (!all.find(a => a.id === p.id)) all.push(p); });
      return all;
    }
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.filter({ is_active: true })
  });

  React.useEffect(() => {
    if (products.length > 0) {
      const counts = {};
      products.forEach(p => { counts[p.partner_id] = (counts[p.partner_id] || 0) + 1; });
      setProductCounts(counts);
    }
  }, [products]);

  const { data: reviews = [] } = useQuery({
    queryKey: ['allReviews'],
    queryFn: () => base44.entities.Review.list()
  });

  const avgRatings = React.useMemo(() => {
    const map = {};
    reviews.forEach(r => {
      if (!map[r.partner_id]) map[r.partner_id] = { sum: 0, count: 0 };
      map[r.partner_id].sum += r.rating;
      map[r.partner_id].count += 1;
    });
    return map;
  }, [reviews]);

  const activePartnerIds = partners.map(p => p.id);
  const activeProducts = products.filter(p => activePartnerIds.includes(p.partner_id));

  // Filtro de localidade
  const locationFilteredPartners = React.useMemo(() => {
    return partners.filter(p => {
      if (selectedCity && p.city !== selectedCity) return false;
      if (selectedNeighborhood && p.neighborhood !== selectedNeighborhood) return false;
      return true;
    });
  }, [partners, selectedCity, selectedNeighborhood]);

  const locationFilteredPartnerIds = locationFilteredPartners.map(p => p.id);
  const locationFilteredProducts = activeProducts.filter(p => locationFilteredPartnerIds.includes(p.partner_id));

  const filteredProducts = locationFilteredProducts.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { favoriteIds, toggleFavorite } = useFavorites(user);

  const [shuffleSeed, setShuffleSeed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setShuffleSeed(s => s + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const featuredProducts = React.useMemo(() => {
    const sorted = [...locationFilteredProducts].sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
    const top = sorted.slice(0, 8);
    // embaralha aleatoriamente a cada tick
    for (let i = top.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [top[i], top[j]] = [top[j], top[i]];
    }
    return top.slice(0, 6);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shuffleSeed, activeProducts.length]);

  const handleProductClick = async (product) => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.href);
      return;
    }

    if (!subscription || subscription.status !== 'active') {
      window.location.href = createPageUrl('Subscription');
      return;
    }

    const partner = partners.find(p => p.id === product.partner_id);
    setSelectedProduct(product);
    setSelectedPartner(partner);
    setVoucherModalOpen(true);

    // Register view
    await base44.entities.ProductView.create({
      product_id: product.id,
      partner_id: product.partner_id,
      user_email: user.email
    });

    await base44.entities.Product.update(product.id, {
      views_count: (product.views_count || 0) + 1
    });
  };

  const getProductCount = (partnerId) => {
    return products.filter(p => p.partner_id === partnerId).length;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden" style={{background: 'linear-gradient(135deg, #e8316c 0%, #f4692a 50%, #f59e0b 100%)'}}>
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-16">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Text side */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-white/25 backdrop-blur-sm rounded-full px-4 py-1.5 mb-5 border border-white/30">
                <Sparkles className="w-4 h-4 text-yellow-200" />
                <span className="text-sm font-semibold text-white">🛍️ Ofertas imperdíveis perto de você</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black mb-4 tracking-tight leading-none">
                <span className="text-white drop-shadow-md">CLUBE MAX</span>
                <br />
                <span className="text-white drop-shadow-md">DESCONTOS</span>
              </h1>
              <p className="text-base text-white/90 max-w-xl mb-8 font-medium">
                Descubra ofertas incríveis dos melhores estabelecimentos da sua região 🔥
              </p>
              <div className="max-w-md relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Buscar produtos ou lojas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 rounded-2xl border-0 shadow-xl text-slate-800 bg-white"
                />
              </div>
            </div>
            {/* Image side */}
            <div className="flex-shrink-0 w-full md:w-72 lg:w-80">
              <img
                src="https://media.base44.com/images/public/6996317474c6e4e8fab2245f/e7d12a3df_generated_image.png"
                alt="Família feliz com compras"
                className="w-full h-56 md:h-72 object-cover rounded-3xl shadow-2xl border-4 border-white/20"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {user && (
          <SubscriptionBanner
            type="user"
            status={subscription?.status}
            expiresAt={subscription?.expires_at}
          />
        )}

        {/* Badges Widget */}
        {user && (
          <div className="mb-8">
            <HomeBadgesWidget userEmail={user.email} />
          </div>
        )}

        {/* Nearby Partners Map */}
        <NearbyPartnersMap
          partners={partners}
          avgRatings={avgRatings}
          productCounts={productCounts}
        />

        {/* Location Filter */}
        <LocationFilter
          partners={partners}
          selectedCity={selectedCity}
          selectedNeighborhood={selectedNeighborhood}
          onCityChange={setSelectedCity}
          onNeighborhoodChange={setSelectedNeighborhood}
        />

        {/* Top Rated Partners */}
        {!searchTerm && <TopRatedPartners />}

        {/* Meus Favoritos */}
        {!searchTerm && user && favoriteIds.size > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Heart className="w-6 h-6 fill-rose-500 text-rose-500" />
                  Meus Favoritos
                </h2>
                <p className="text-slate-500 text-sm">{favoriteIds.size} produto{favoriteIds.size !== 1 ? 's' : ''} salvos</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {activeProducts
                .filter(p => favoriteIds.has(p.id))
                .map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    partner={partners.find(p => p.id === product.partner_id)}
                    onClick={() => handleProductClick(product)}
                    isFavorite={true}
                    onToggleFavorite={() => toggleFavorite(product, partners.find(p => p.id === product.partner_id))}
                  />
                ))}
            </div>
          </section>
        )}

        {/* Featured Products */}
        {!searchTerm && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Em Alta 🔥</h2>
                <p className="text-slate-500 text-sm">Produtos mais acessados</p>
              </div>
              <Link to={createPageUrl('Products')}>
                <Button variant="ghost" className="text-fuchsia-600 font-semibold hover:bg-fuchsia-50">
                  Ver todos <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {loadingProducts ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {featuredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    partner={partners.find(p => p.id === product.partner_id)}
                    onClick={() => handleProductClick(product)}
                    isFavorite={favoriteIds.has(product.id)}
                    onToggleFavorite={user ? () => toggleFavorite(product, partners.find(p => p.id === product.partner_id)) : null}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Search Results */}
        {searchTerm && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">
              Resultados para "{searchTerm}"
            </h2>
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <Tag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Nenhum produto encontrado</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    partner={partners.find(p => p.id === product.partner_id)}
                    onClick={() => handleProductClick(product)}
                    isFavorite={favoriteIds.has(product.id)}
                    onToggleFavorite={user ? () => toggleFavorite(product, partners.find(p => p.id === product.partner_id)) : null}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Leaderboard Top 10 */}
        {!searchTerm && (
          <section className="mb-12">
            <LeaderboardTop10 />
          </section>
        )}

        {/* Partners */}
        {!searchTerm && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Parceiros 🏪</h2>
                <p className="text-slate-500 text-sm">Lojas com descontos exclusivos</p>
              </div>
              <Link to={createPageUrl('Partners')}>
                <Button variant="ghost" className="text-fuchsia-600 font-semibold hover:bg-fuchsia-50">
                  Ver todos <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>

            {loadingPartners ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {locationFilteredPartners.slice(0, 4).map(partner => (
                  <Link key={partner.id} to={createPageUrl(`PartnerStore?id=${partner.id}`)}>
                    <PartnerCard
                      partner={partner}
                      productCount={getProductCount(partner.id)}
                      avgRating={avgRatings[partner.id] ? avgRatings[partner.id].sum / avgRatings[partner.id].count : 0}
                      reviewCount={avgRatings[partner.id]?.count || 0}
                    />
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {selectedPartner?.partner_type === 'empreendedor' ? (
        <EntrepreneurVoucherModal
          open={voucherModalOpen}
          onClose={() => setVoucherModalOpen(false)}
          product={selectedProduct}
          partner={selectedPartner}
          user={user}
          onSuccess={() => {}}
        />
      ) : (
        <VoucherModal
          open={voucherModalOpen}
          onClose={() => setVoucherModalOpen(false)}
          product={selectedProduct}
          partner={selectedPartner}
          user={user}
          onSuccess={() => {}}
        />
      )}

    </div>
  );
}