import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Search, Store, Filter, Star, MapPin, X, Map, List, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PartnerCard from '@/components/partners/PartnerCard';
import PartnersMap from '@/components/partners/PartnersMap';
import { usePartnerFavorites } from '@/hooks/usePartnerFavorites';

const categories = [
  { value: 'all', label: 'Todas Categorias' },
  { value: 'restaurante', label: '🍽️ Restaurante' },
  { value: 'moda', label: '👗 Moda' },
  { value: 'eletronicos', label: '📱 Eletrônicos' },
  { value: 'beleza', label: '💄 Beleza' },
  { value: 'saude', label: '🏥 Saúde' },
  { value: 'mercado', label: '🛒 Mercado' },
  { value: 'servicos', label: '🔧 Serviços' },
  { value: 'doceria', label: '🍰 Doceria' },
  { value: 'hamburgueria', label: '🍔 Hamburgueria' },
  { value: 'confeitaria', label: '🎂 Confeitaria' },
  { value: 'artesanato', label: '🎨 Artesanato' },
  { value: 'outros', label: '📦 Outros' }
];

const ratingOptions = [
  { value: 'all', label: 'Qualquer nota' },
  { value: '4', label: '⭐ 4+ estrelas' },
  { value: '3', label: '⭐ 3+ estrelas' },
  { value: '2', label: '⭐ 2+ estrelas' }
];

export default function Partners() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState('all');
  const [minRating, setMinRating] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (auth) => {
      if (auth) setUser(await base44.auth.me());
    });
  }, []);

  const { favoriteIds: favPartnerIds, toggleFavorite: togglePartnerFav } = usePartnerFavorites(user);

  const { data: partners = [], isLoading } = useQuery({
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

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list()
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['allReviews'],
    queryFn: () => base44.entities.Review.list()
  });

  // Build avg rating map
  const avgRatings = {};
  reviews.forEach(r => {
    if (!avgRatings[r.partner_id]) avgRatings[r.partner_id] = { sum: 0, count: 0 };
    avgRatings[r.partner_id].sum += r.rating;
    avgRatings[r.partner_id].count += 1;
  });
  const getAvgRating = (partnerId) => {
    const data = avgRatings[partnerId];
    if (!data || data.count === 0) return null;
    return data.sum / data.count;
  };

  const cities = ['all', ...Array.from(new Set(partners.filter(p => p.city).map(p => p.city))).sort()];

  const neighborhoods = React.useMemo(() => {
    const filtered = cityFilter !== 'all' ? partners.filter(p => p.city === cityFilter) : partners;
    return ['all', ...Array.from(new Set(filtered.filter(p => p.neighborhood).map(p => p.neighborhood))).sort()];
  }, [partners, cityFilter]);

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.neighborhood?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === 'all' || partner.category === category;
    const matchesCity = cityFilter === 'all' || partner.city === cityFilter;
    const matchesNeighborhood = neighborhoodFilter === 'all' || partner.neighborhood === neighborhoodFilter;
    const avg = getAvgRating(partner.id);
    const matchesRating = minRating === 'all' || (avg !== null && avg >= parseFloat(minRating));
    return matchesSearch && matchesCategory && matchesCity && matchesNeighborhood && matchesRating;
  });

  const getProductCount = (partnerId) => products.filter(p => p.partner_id === partnerId).length;

  const hasActiveFilters = category !== 'all' || cityFilter !== 'all' || neighborhoodFilter !== 'all' || minRating !== 'all' || searchTerm;

  const clearFilters = () => {
    setSearchTerm('');
    setCategory('all');
    setCityFilter('all');
    setNeighborhoodFilter('all');
    setMinRating('all');
  };

  const handleLocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setViewMode('map');
        setLocating(false);
      },
      () => setLocating(false)
    );
  };

  // Build avgRatings map for map component
  const avgRatingsMap = {};
  Object.entries(avgRatings).forEach(([id, data]) => {
    avgRatingsMap[id] = data.sum / data.count;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Parceiros</h1>
          <p className="text-slate-500">Encontre lojas com ofertas exclusivas</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Buscar por nome, cidade ou bairro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-base"
          />
          {searchTerm && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              onClick={() => setSearchTerm('')}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-3 mb-4">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-52">
              <Filter className="w-4 h-4 mr-2 shrink-0" />
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <MapPin className="w-4 h-4 mr-2 shrink-0" />
              <SelectValue placeholder="Cidade" />
            </SelectTrigger>
            <SelectContent>
              {cities.map(city => (
                <SelectItem key={city} value={city}>
                  {city === 'all' ? 'Todas as cidades' : city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={neighborhoodFilter}
            onValueChange={(v) => setNeighborhoodFilter(v)}
            disabled={neighborhoods.length <= 1}
          >
            <SelectTrigger className="w-full sm:w-48">
              <MapPin className="w-4 h-4 mr-2 shrink-0" />
              <SelectValue placeholder="Bairro" />
            </SelectTrigger>
            <SelectContent>
              {neighborhoods.map(nb => (
                <SelectItem key={nb} value={nb}>
                  {nb === 'all' ? 'Todos os bairros' : nb}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={minRating} onValueChange={setMinRating}>
            <SelectTrigger className="w-full sm:w-44">
              <Star className="w-4 h-4 mr-2 shrink-0" />
              <SelectValue placeholder="Nota mínima" />
            </SelectTrigger>
            <SelectContent>
              {ratingOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="gap-2 h-10">
              <X className="w-3 h-3" />
              Limpar filtros
            </Button>
          )}
        </div>

        {/* Active filter badges */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {searchTerm && (
              <Badge variant="outline" className="gap-1 text-xs">
                Busca: "{searchTerm}"
                <button onClick={() => setSearchTerm('')}><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {category !== 'all' && (
              <Badge variant="outline" className="gap-1 text-xs">
                {categories.find(c => c.value === category)?.label}
                <button onClick={() => setCategory('all')}><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {cityFilter !== 'all' && (
              <Badge variant="outline" className="gap-1 text-xs">
                📍 {cityFilter}
                <button onClick={() => { setCityFilter('all'); setNeighborhoodFilter('all'); }}><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {neighborhoodFilter !== 'all' && (
              <Badge variant="outline" className="gap-1 text-xs">
                🏘️ {neighborhoodFilter}
                <button onClick={() => setNeighborhoodFilter('all')}><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {minRating !== 'all' && (
              <Badge variant="outline" className="gap-1 text-xs">
                ⭐ {minRating}+ estrelas
                <button onClick={() => setMinRating('all')}><X className="w-3 h-3" /></button>
              </Badge>
            )}
          </div>
        )}

        {/* Results count + view toggle */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-slate-500">
            {isLoading ? 'Carregando...' : `${filteredPartners.length} parceiro${filteredPartners.length !== 1 ? 's' : ''} encontrado${filteredPartners.length !== 1 ? 's' : ''}`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleLocate}
              disabled={locating}
            >
              <Navigation className={`w-4 h-4 ${locating ? 'animate-pulse text-violet-500' : ''}`} />
              {locating ? 'Localizando...' : 'Perto de mim'}
            </Button>
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${viewMode === 'list' ? 'bg-violet-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                <List className="w-4 h-4" /> Lista
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${viewMode === 'map' ? 'bg-violet-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                <Map className="w-4 h-4" /> Mapa
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : filteredPartners.length === 0 ? (
          <div className="text-center py-12">
            <Store className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhum parceiro encontrado</p>
            {hasActiveFilters && (
              <Button variant="ghost" className="mt-3 text-violet-600" onClick={clearFilters}>
                Limpar filtros
              </Button>
            )}
          </div>
        ) : viewMode === 'map' ? (
          <PartnersMap
            partners={filteredPartners}
            avgRatings={avgRatingsMap}
            userLocation={userLocation}
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredPartners.map(partner => {
              const avg = getAvgRating(partner.id);
              return (
                <Link key={partner.id} to={createPageUrl(`PartnerStore?id=${partner.id}`)}>
                  <PartnerCard
                    partner={partner}
                    productCount={getProductCount(partner.id)}
                    avgRating={avg || 0}
                    reviewCount={avgRatings[partner.id]?.count || 0}
                    isFavorite={favPartnerIds.has(partner.id)}
                    onToggleFavorite={user ? () => togglePartnerFav(partner.id) : undefined}
                  />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}