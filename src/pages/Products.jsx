import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Search, Tag, SlidersHorizontal, MapPin, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard from '@/components/products/ProductCard';
import VoucherModal from '@/components/voucher/VoucherModal';
import { useFavorites } from '@/hooks/useFavorites';

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

  const { favoriteIds, toggleFavorite } = useFavorites(user);

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

  const { data: partners = [] } = useQuery({
    queryKey: ['partners'],
    queryFn: () => base44.entities.Partner.filter({ subscription_status: 'active' })
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.filter({ is_active: true })
  });

  const activePartnerIds = partners.map(p => p.id);
  const activeProducts = products.filter(p => activePartnerIds.includes(p.partner_id));

  const cities = React.useMemo(() => {
    return Array.from(new Set(partners.filter(p => p.city).map(p => p.city))).sort();
  }, [partners]);

  const neighborhoods = React.useMemo(() => {
    const filtered = cityFilter ? partners.filter(p => p.city === cityFilter) : partners;
    return Array.from(new Set(filtered.filter(p => p.neighborhood).map(p => p.neighborhood))).sort();
  }, [partners, cityFilter]);

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

  const filteredProducts = locationFilteredProducts
    .filter(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()))
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
    });

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
    <div className="min-h-screen bg-slate-50">
      {/* Hero com busca no topo */}
      <div className="bg-gradient-to-br from-violet-600 to-fuchsia-600">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <h1 className="text-3xl font-bold text-white mb-1">Produtos</h1>
          <p className="text-violet-200 mb-6">Encontre o produto com desconto que você procura</p>
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Buscar produtos pelo nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-base rounded-xl bg-white border-0 shadow-lg focus-visible:ring-2 focus-visible:ring-white/50"
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
          {searchTerm && (
            <p className="text-violet-200 text-sm mt-3">
              {filteredProducts.length} resultado{filteredProducts.length !== 1 ? 's' : ''} para "<strong className="text-white">{searchTerm}</strong>"
            </p>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Filtro de Localização */}
        {(cities.length > 0) && (
          <div className="bg-white border border-violet-100 rounded-2xl shadow-sm p-4 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-violet-600" />
              </div>
              <span className="font-semibold text-slate-700 text-sm">Filtrar por Localidade</span>
              {(cityFilter || neighborhoodFilter) && (
                <button
                  onClick={() => { setCityFilter(''); setNeighborhoodFilter(''); }}
                  className="ml-auto text-xs text-slate-400 hover:text-red-500 flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Limpar
                </button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block font-medium">Cidade</label>
                <select
                  value={cityFilter}
                  onChange={(e) => { setCityFilter(e.target.value); setNeighborhoodFilter(''); }}
                  className="w-full h-10 pl-3 pr-8 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-violet-300 cursor-pointer"
                >
                  <option value="">Todas as cidades</option>
                  {cities.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-slate-500 mb-1 block font-medium">Bairro</label>
                <select
                  value={neighborhoodFilter}
                  onChange={(e) => setNeighborhoodFilter(e.target.value)}
                  disabled={neighborhoods.length === 0}
                  className="w-full h-10 pl-3 pr-8 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-violet-300 cursor-pointer disabled:opacity-50"
                >
                  <option value="">Todos os bairros</option>
                  {neighborhoods.map(nb => <option key={nb} value={nb}>{nb}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

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
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                partner={partners.find(p => p.id === product.partner_id)}
                onClick={() => handleProductClick(product)}
                isFavorite={favoriteIds.has(product.id)}
                onToggleFavorite={user ? () => toggleFavorite(product, partners.find(p => p.id === product.partner_id)) : undefined}
              />
            ))}
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