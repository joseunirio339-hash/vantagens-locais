import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Search, Tag, SlidersHorizontal, MapPin, X, Utensils, Shirt, Zap, Sparkles, Heart, ShoppingCart, Briefcase, Music, Package, Navigation, Loader2, DollarSign, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard from '@/components/products/ProductCard';
import FeaturedVideoStrip from '@/components/products/FeaturedVideoStrip';
import VoucherModal from '@/components/voucher/VoucherModal';
import { useFavorites } from '@/hooks/useFavorites';
import { getAllCities, getNeighborhoods } from '@/lib/brazilianCities';

// Haversine distance in km
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocodePartner(partner) {
  if (partner.lat && partner.lng) return { lat: partner.lat, lng: partner.lng };
  const query = [partner.address, partner.neighborhood, partner.city, partner.state, 'Brasil']
    .filter(Boolean).join(', ');
  if (!query.trim()) return null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
    );
    const data = await res.json();
    if (data.length === 0) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch { return null; }
}

export default function Products() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [cityFilter, setCityFilter] = useState('');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [voucherModalOpen, setVoucherModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [proximityMode, setProximityMode] = useState(false);
  const [proximityLoading, setProximityLoading] = useState(false);
  const [proximityError, setProximityError] = useState('');
  const [sortedByProximity, setSortedByProximity] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [maxDistance, setMaxDistance] = useState('');

  const { favoriteIds, toggleFavorite } = useFavorites(user);

  const CATEGORIES = [
    { value: 'alimentacao', label: 'Alimentação', icon: Utensils },
    { value: 'moda', label: 'Moda', icon: Shirt },
    { value: 'eletronicos', label: 'Eletrônicos', icon: Zap },
    { value: 'beleza', label: 'Beleza', icon: Sparkles },
    { value: 'saude', label: 'Saúde', icon: Heart },
    { value: 'mercado', label: 'Mercado', icon: ShoppingCart },
    { value: 'servicos', label: 'Serviços', icon: Briefcase },
    { value: 'lazer', label: 'Lazer', icon: Music },
    { value: 'outros', label: 'Outros', icon: Package },
  ];

  useEffect(() => {
    // Read search query from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const urlSearch = urlParams.get('search');
    if (urlSearch) setSearchTerm(urlSearch);

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

  const { data: partners = [] } = useQuery({
    queryKey: ['partners'],
    queryFn: () => base44.entities.Partner.filter({ subscription_status: 'active' })
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.filter({ is_active: true })
  });

  // Detect Premium partners (active lojista subscriptions)
  const { data: premiumSubs = [] } = useQuery({
    queryKey: ['premiumSubs'],
    queryFn: () => base44.entities.Subscription.filter({ type: 'lojista', status: 'active' })
  });

  const activePartnerIds = partners.map(p => p.id);
  const activeProducts = products.filter(p => activePartnerIds.includes(p.partner_id));

  const premiumPartnerIds = useMemo(() => {
    const premiumEmails = new Set(premiumSubs.map(s => s.user_email));
    return new Set(partners.filter(p => premiumEmails.has(p.owner_email)).map(p => p.id));
  }, [premiumSubs, partners]);

  const allCities = React.useMemo(() => getAllCities(), []);
  const allNeighborhoods = React.useMemo(() => getNeighborhoods(cityFilter), [cityFilter]);

  const locationFilteredProducts = React.useMemo(() => {
    if (!cityFilter && !neighborhoodFilter) return activeProducts;
    const filteredPartnerIds = partners
      .filter(p => {
        if (cityFilter && p.city !== cityFilter) return false;
        if (neighborhoodFilter && p.neighborhood !== neighborhoodFilter) return false;
        return true;
      })
      .map(p => p.id);
    return activeProducts.filter(p => filteredPartnerIds.includes(p.partner_id));
  }, [activeProducts, partners, cityFilter, neighborhoodFilter]);

  const baseProductList = proximityMode 
    ? sortedByProximity.filter(p => {
        // Apply location filters on top of proximity results
        if (cityFilter || neighborhoodFilter) {
          const partner = p._partner || partners.find(pp => pp.id === p.partner_id);
          if (!partner) return false;
          if (cityFilter && partner.city !== cityFilter) return false;
          if (neighborhoodFilter && partner.neighborhood !== neighborhoodFilter) return false;
        }
        return true;
      })
    : locationFilteredProducts;

  const filteredProducts = (proximityMode ? baseProductList : baseProductList
    .sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return a.discount_price - b.discount_price;
        case 'price_high':
          return b.discount_price - a.discount_price;
        case 'discount':
          const discountA = ((a.original_price - a.discount_price) / a.original_price) * 100;
          const discountB = ((b.original_price - b.discount_price) / b.original_price) * 100;
          return discountB - discountA;
        case 'popular':
          return (b.views_count || 0) - (a.views_count || 0);
        default:
          return new Date(b.created_date) - new Date(a.created_date);
      }
    }))
    .filter(p => {
      const matchesSearch = !searchTerm ||
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || p.category === categoryFilter;
      const minOk = !priceRange.min || p.discount_price >= Number(priceRange.min);
      const maxOk = !priceRange.max || p.discount_price <= Number(priceRange.max);
      return matchesSearch && matchesCategory && minOk && maxOk;
    })
    .filter(p => {
      if (!maxDistance || !proximityMode) return true;
      return p.distance != null && p.distance <= Number(maxDistance);
    });

  const handleProximitySort = () => {
    if (!navigator.geolocation) {
      setProximityError('Geolocalização não suportada neste navegador.');
      return;
    }
    setProximityLoading(true);
    setProximityError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        const sorted = await Promise.all(
          activeProducts.map(async (product) => {
            const partner = partners.find(p => p.id === product.partner_id);
            if (!partner) return { ...product, distance: Infinity };
            const coords = await geocodePartner(partner);
            if (!coords) return { ...product, distance: Infinity };
            const dist = haversine(userLat, userLng, coords.lat, coords.lng);
            return { ...product, distance: dist, _partner: partner };
          })
        );
        const sortedFiltered = sorted
          .filter(p => p.distance !== Infinity)
          .sort((a, b) => a.distance - b.distance)
          .concat(sorted.filter(p => p.distance === Infinity));
        setSortedByProximity(sortedFiltered);
        setProximityMode(true);
        setProximityLoading(false);
      },
      () => {
        setProximityError('Não foi possível obter sua localização. Verifique as permissões do navegador.');
        setProximityLoading(false);
      }
    );
  };

  const clearProximity = () => {
    setProximityMode(false);
    setSortedByProximity([]);
    setProximityError('');
  };

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

    await base44.entities.ProductView.create({
      product_id: product.id,
      partner_id: product.partner_id,
      user_email: user.email
    });

    await base44.entities.Product.update(product.id, {
      views_count: (product.views_count || 0) + 1
    });
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero com busca no topo */}
      <div className="bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 pb-6">
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-4">
          <h1 className="text-3xl font-bold text-white mb-1">Produtos</h1>
          <p className="text-amber-100 mb-5">Encontre o produto com desconto que você procura</p>
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Buscar por nome, descrição ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-base rounded-xl bg-white border-0 shadow-lg focus-visible:ring-2 focus-visible:ring-amber-300"
              autoFocus={false}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ×
              </button>
            )}
          </div>
          {(searchTerm || categoryFilter) && (
            <p className="text-amber-100 text-sm mt-3">
              {filteredProducts.length} resultado{filteredProducts.length !== 1 ? 's' : ''}
              {searchTerm && <> para "<strong className="text-white">{searchTerm}</strong>"</>}
              {categoryFilter && <> em <strong className="text-white">{CATEGORIES.find(c => c.value === categoryFilter)?.label}</strong></>}
            </p>
          )}
        </div>

      </div>

      {/* Category Quick Filter Buttons */}
      <div className="max-w-6xl mx-auto px-4 -mt-3 relative z-10">
        <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-4">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Filtrar por Categoria</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setCategoryFilter('')}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                !categoryFilter
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300 hover:text-amber-600'
              }`}
            >
              Todos
            </button>
            {CATEGORIES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setCategoryFilter(categoryFilter === value ? '' : value)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                  categoryFilter === value
                    ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300 hover:text-amber-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Filtro de Preço */}
          <div className="mt-4 pt-4 border-t border-stone-100">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-3">Filtrar por Preço</p>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs text-stone-500 whitespace-nowrap">De R$</label>
                <input
                  type="number"
                  placeholder="Mín"
                  value={priceRange.min}
                  onChange={e => setPriceRange(p => ({ ...p, min: e.target.value }))}
                  className="w-24 h-9 px-3 rounded-xl border border-stone-200 bg-white text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-stone-500 whitespace-nowrap">Até R$</label>
                <input
                  type="number"
                  placeholder="Máx"
                  value={priceRange.max}
                  onChange={e => setPriceRange(p => ({ ...p, max: e.target.value }))}
                  className="w-24 h-9 px-3 rounded-xl border border-stone-200 bg-white text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-300"
                />
              </div>
              {(priceRange.min || priceRange.max) && (
                <button
                  onClick={() => setPriceRange({ min: '', max: '' })}
                  className="text-xs text-stone-400 hover:text-red-500 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Limpar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Filtro de Localização */}
        {(allCities.length > 0) && (
          <div className="bg-white border border-stone-200 rounded-2xl shadow-sm p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-amber-600" />
              </div>
              <span className="font-semibold text-stone-700 text-sm">Filtrar por Localidade</span>
              <div className="ml-auto flex items-center gap-2">
                {proximityMode ? (
                  <button
                    onClick={clearProximity}
                    className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-200 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1"
                  >
                    <Navigation className="w-3 h-3" /> Próximos <X className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    onClick={handleProximitySort}
                    disabled={proximityLoading}
                    className="text-xs border border-amber-200 text-amber-600 hover:bg-amber-50 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 disabled:opacity-50"
                  >
                    {proximityLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Navigation className="w-3 h-3" />
                    )}
                    {proximityLoading ? 'Localizando...' : 'Perto de mim'}
                  </button>
                )}
                {(cityFilter || neighborhoodFilter) && (
                  <button
                    onClick={() => { setCityFilter(''); setNeighborhoodFilter(''); }}
                    className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Limpar
                  </button>
                )}
              </div>
            </div>
            {proximityError && (
              <p className="text-xs text-red-500 flex items-center gap-1 mb-2">
                <MapPin className="w-3 h-3" /> {proximityError}
              </p>
            )}
            {proximityMode && (
              <div className="flex items-center gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-stone-500 whitespace-nowrap">Distância máx.:</label>
                  <input
                    type="number"
                    placeholder="km"
                    value={maxDistance}
                    onChange={e => setMaxDistance(e.target.value)}
                    className="w-20 h-8 px-2 rounded-lg border border-stone-200 bg-white text-sm text-stone-700 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                  <span className="text-xs text-stone-400">km</span>
                </div>
                {maxDistance && (
                  <button onClick={() => setMaxDistance('')} className="text-xs text-stone-400 hover:text-red-500 flex items-center gap-1">
                    <X className="w-3 h-3" /> Limpar
                  </button>
                )}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block font-medium">Cidade</label>
                <input
                  type="text"
                  placeholder="Buscar cidade..."
                  value={cityFilter}
                  onChange={(e) => {
                    setCityFilter(e.target.value);
                    setNeighborhoodFilter('');
                  }}
                  list="products-city-list"
                  className="w-full h-10 pl-3 pr-8 rounded-xl border border-stone-200 bg-white text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <datalist id="products-city-list">
                  <option value="">Todas as cidades</option>
                  {allCities.map(city => <option key={city} value={city} />)}
                </datalist>
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block font-medium">Bairro</label>
                <input
                  type="text"
                  placeholder="Buscar bairro..."
                  value={neighborhoodFilter}
                  onChange={(e) => setNeighborhoodFilter(e.target.value)}
                  disabled={!cityFilter}
                  list="products-nbh-list"
                  className="w-full h-10 pl-3 pr-8 rounded-xl border border-stone-200 bg-white text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:opacity-50"
                />
                <datalist id="products-nbh-list">
                  <option value="">Todos os bairros</option>
                  {allNeighborhoods.map(nb => <option key={nb} value={nb} />)}
                </datalist>
              </div>
            </div>
          </div>
        )}

        {/* Destaque de Vídeos Premium */}
        {(() => {
          const videoProducts = filteredProducts.filter(p => p.video_url);
          if (videoProducts.length > 0) {
            return (
              <FeaturedVideoStrip
                products={videoProducts}
                partners={partners}
                onProductClick={handleProductClick}
              />
            );
          }
          return null;
        })()}

        {/* Filtro de ordenação */}
        <div className="flex justify-end mb-6">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mais recentes</SelectItem>
              <SelectItem value="popular">Mais populares</SelectItem>
              <SelectItem value="discount">Maior desconto</SelectItem>
              <SelectItem value="price_low">Menor preço</SelectItem>
              <SelectItem value="price_high">Maior preço</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-2xl" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhum produto encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => {
              const productPartner = product._partner || partners.find(p => p.id === product.partner_id);
              const distance = product.distance;
              return (
                <div key={product.id} className="relative">
                  {proximityMode && distance != null && distance !== Infinity && (
                    <div className="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-semibold text-amber-700 shadow-sm flex items-center gap-1">
                      <Navigation className="w-3 h-3" />
                      {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}
                    </div>
                  )}
                  <ProductCard
                    product={product}
                    partner={productPartner}
                    onClick={() => handleProductClick(product)}
                    isFavorite={favoriteIds.has(product.id)}
                    onToggleFavorite={user ? () => toggleFavorite(product, productPartner) : undefined}
                    isPremium={premiumPartnerIds.has(product.partner_id)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <VoucherModal
        open={voucherModalOpen}
        onClose={() => setVoucherModalOpen(false)}
        product={selectedProduct}
        partner={selectedPartner}
        user={user}
        onSuccess={() => {}}
      />
    </div>
  );
}