import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, Store, Tag, ChevronRight, Heart, Megaphone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard from '@/components/products/ProductCard';
import PartnerCard from '@/components/partners/PartnerCard';
import SubscriptionBanner from '@/components/ui/SubscriptionBanner';
import VoucherModal from '@/components/voucher/VoucherModal';
import EntrepreneurVoucherModal from '@/components/voucher/EntrepreneurVoucherModal';
import LocationFilter from '@/components/home/LocationFilter';
import ProductFilterBar from '@/components/home/ProductFilterBar';
import SmartSearchBar from '@/components/home/SmartSearchBar';
import NearbyPartnersMap from '@/components/home/NearbyPartnersMap';
import LeaderboardTop10 from '@/components/referral/LeaderboardTop10';
import HomeBadgesWidget from '@/components/badges/HomeBadgesWidget';
import TopRatedPartners from '@/components/home/TopRatedPartners';
import MonthlyPurchaseRanking from '@/components/home/MonthlyPurchaseRanking';
import { useFavorites } from '@/hooks/useFavorites';
import { usePartnerFavorites } from '@/hooks/usePartnerFavorites';
import NewsFeed from '@/components/news/NewsFeed';

export default function Home() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('');
  const [productCounts, setProductCounts] = useState({});

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
      if (selectedState && p.state !== selectedState) return false;
      if (selectedCity && p.city !== selectedCity) return false;
      if (selectedNeighborhood && p.neighborhood !== selectedNeighborhood) return false;
      return true;
    });
  }, [partners, selectedState, selectedCity, selectedNeighborhood]);

  const locationFilteredPartnerIds = locationFilteredPartners.map(p => p.id);
  const locationFilteredProducts = activeProducts.filter(p => locationFilteredPartnerIds.includes(p.partner_id));

  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('');

  const filteredProducts = React.useMemo(() => {
    let list = locationFilteredProducts.filter(p =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (selectedCategory) {
      list = list.filter(p => p.category === selectedCategory);
    }
    if (sortBy === 'price_asc') {
      list = [...list].sort((a, b) => (a.discount_price || a.original_price) - (b.discount_price || b.original_price));
    } else if (sortBy === 'discount_desc') {
      list = [...list].sort((a, b) => {
        const discA = a.discount_percentage || (a.original_price ? ((a.original_price - a.discount_price) / a.original_price) * 100 : 0);
        const discB = b.discount_percentage || (b.original_price ? ((b.original_price - b.discount_price) / b.original_price) * 100 : 0);
        return discB - discA;
      });
    }
    return list;
  }, [locationFilteredProducts, searchTerm, selectedCategory, sortBy]);

  const { favoriteIds, toggleFavorite } = useFavorites(user);
  const { favoriteIds: favPartnerIds, toggleFavorite: togglePartnerFav } = usePartnerFavorites(user);

  const [shuffleSeed, setShuffleSeed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setShuffleSeed(s => s + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const featuredProducts = React.useMemo(() => {
    let pool = [...locationFilteredProducts];
    if (selectedCategory) pool = pool.filter(p => p.category === selectedCategory);

    if (sortBy === 'price_asc') {
      pool.sort((a, b) => (a.discount_price || a.original_price) - (b.discount_price || b.original_price));
      return pool.slice(0, 6);
    } else if (sortBy === 'discount_desc') {
      pool.sort((a, b) => {
        const discA = a.discount_percentage || (a.original_price ? ((a.original_price - a.discount_price) / a.original_price) * 100 : 0);
        const discB = b.discount_percentage || (b.original_price ? ((b.original_price - b.discount_price) / b.original_price) * 100 : 0);
        return discB - discA;
      });
      return pool.slice(0, 6);
    }

    const top = pool.sort((a, b) => (b.views_count || 0) - (a.views_count || 0)).slice(0, 8);
    for (let i = top.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [top[i], top[j]] = [top[j], top[i]];
    }
    return top.slice(0, 6);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shuffleSeed, activeProducts.length, selectedCategory, sortBy]);

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
      <div className="relative overflow-hidden" style={{background: 'linear-gradient(135deg, #FF9C45 0%, #FF527C 50%, #e04070 100%)'}}>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 py-12 md:py-20 relative">
          <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Text side */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 tracking-tight leading-tight">
                <span className="text-white drop-shadow-lg">Os melhores descontos</span>
                <br />
                <span className="text-white drop-shadow-lg">da sua cidade em um só lugar</span>
              </h1>
              <p className="text-base md:text-lg text-white/90 max-w-xl mb-6 leading-relaxed">
                Tenha acesso a ofertas exclusivas, vouchers personalizados e vantagens especiais em dezenas de estabelecimentos parceiros. Economize mais em cada compra com o Clube Max.
              </p>

              {/* Benefícios */}
              <div className="flex flex-col gap-2 mb-8">
                {[
                  'Mais de 100 empresas participantes',
                  'Benefícios exclusivos para membros',
                  'Economia real em produtos e serviços',
                  'Ativação rápida pelo CPF',
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/90 text-sm">
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0 text-xs">
                      {['🏪','🎁','💰','⚡'][i]}
                    </span>
                    {text}
                  </div>
                ))}
              </div>

              <p className="text-white font-semibold text-sm mb-3">Encontre sua próxima oferta agora mesmo.</p>

              {/* Smart Search Bar */}
              <div className="mb-5">
                <SmartSearchBar
                  products={activeProducts}
                  partners={partners}
                  searchTerm={searchTerm}
                  selectedCategory={selectedCategory}
                  onSearch={setSearchTerm}
                  onCategoryChange={setSelectedCategory}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link to={createPageUrl('Subscription')}>
                  <Button size="lg" className="w-full sm:w-auto bg-white text-[#FF527C] hover:bg-white/90 font-bold shadow-lg text-base px-8">
                    Quero Economizar
                  </Button>
                </Link>
                <Link to={createPageUrl('Products')}>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/40 text-white bg-transparent hover:bg-white/15 font-semibold text-base px-8">
                    Conhecer as Ofertas
                  </Button>
                </Link>
              </div>
            </div>
            {/* Image side */}
            <div className="flex-shrink-0 w-full md:w-72 lg:w-80">
              <div className="relative">
                <img
                  src="https://media.base44.com/images/public/6996317474c6e4e8fab2245f/188f1bafc_clubemax.png"
                  alt="Vantagens Locais — Descontos do Club Max"
                  className="w-full h-56 md:h-72 object-contain rounded-3xl"
                />
                {/* Floating badge */}
                <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl px-4 py-2.5 shadow-xl border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium">🎁 1º mês</p>
                  <p className="text-lg font-black text-emerald-600">GRÁTIS</p>
                </div>
              </div>
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
          products={activeProducts}
          selectedState={selectedState}
          selectedCity={selectedCity}
          selectedNeighborhood={selectedNeighborhood}
          onStateChange={setSelectedState}
          onCityChange={setSelectedCity}
          onNeighborhoodChange={setSelectedNeighborhood}
          avgRatings={avgRatings}
          productCounts={productCounts}
        />

        {/* Novidades dos Parceiros */}
        {!searchTerm && <NewsFeed />}

        {/* Top Rated Partners */}
        {!searchTerm && <TopRatedPartners />}

        {/* Filter Bar */}
        <ProductFilterBar
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

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

        {/* Ranking de Compras do Mês */}
        {!searchTerm && (
          <section className="mb-12">
            <MonthlyPurchaseRanking />
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
                      isFavorite={favPartnerIds.has(partner.id)}
                      onToggleFavorite={user ? () => togglePartnerFav(partner.id) : undefined}
                    />
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}

        {/* CTA Lojistas */}
        {!searchTerm && (
          <section className="mt-12">
            <div className="relative overflow-hidden rounded-3xl" style={{background: 'linear-gradient(135deg, #FF9C45 0%, #FF527C 100%)'}}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
              <div className="relative px-8 py-10 md:py-12 flex flex-col md:flex-row items-center gap-6 justify-between">
                <div className="text-center md:text-left">
                  <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1 mb-3">
                    <Megaphone className="w-4 h-4 text-yellow-300" />
                    <span className="text-xs font-semibold text-white">Para lojistas e empreendedores</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-white mb-2">
                    Seu negócio aqui! 🚀
                  </h3>
                  <p className="text-white/80 text-sm max-w-md">
                    Alcance centenas de consumidores locais. Planos a partir de <strong className="text-white">R$ 29,90/mês</strong>.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                  <Link to={createPageUrl('ParceiroContato')}>
                    <Button size="lg" className="bg-white text-violet-700 hover:bg-violet-50 font-bold shadow-lg whitespace-nowrap">
                      Saiba Mais
                    </Button>
                  </Link>
                  <Link to={createPageUrl('PartnerSignup')}>
                    <Button size="lg" variant="outline" className="border-white/50 text-white bg-transparent hover:bg-white/15 font-semibold whitespace-nowrap">
                      Cadastrar Agora <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
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