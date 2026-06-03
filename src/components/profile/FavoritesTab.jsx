import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Heart, Store, Tag, MapPin, Star, Loader2, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const categoryLabels = {
  restaurante: 'Restaurante', moda: 'Moda', eletronicos: 'Eletrônicos',
  beleza: 'Beleza', saude: 'Saúde', mercado: 'Mercado', servicos: 'Serviços',
  doceria: '🍰 Doceria', hamburgueria: '🍔 Hamburgueria', trailer_food: '🚚 Trailer',
  artesanato: '🎨 Artesanato', confeitaria: '🎂 Confeitaria', salgados: '🥟 Salgados',
  costura: '🧵 Costura', outros: 'Outros'
};

function FavoriteProductCard({ product, partner, onUnfavorite }) {
  const discountPct = product.original_price
    ? Math.round(((product.original_price - product.discount_price) / product.original_price) * 100)
    : 0;

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border bg-white hover:bg-slate-50 transition-colors">
      <Link to={partner ? `/PartnerStore?id=${partner.id}` : '#'} className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Tag className="w-5 h-5 text-slate-300" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          {partner && <p className="text-xs text-slate-400 truncate">{partner.business_name}</p>}
          <p className="text-sm font-semibold text-slate-800 truncate">{product.name}</p>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-sm font-bold text-emerald-600">
              R$ {product.discount_price?.toFixed(2).replace('.', ',')}
            </span>
            <span className="text-xs text-slate-400 line-through">
              R$ {product.original_price?.toFixed(2).replace('.', ',')}
            </span>
            {discountPct > 0 && (
              <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">
                -{discountPct}%
              </span>
            )}
          </div>
        </div>
      </Link>
      <div className="flex items-center gap-2 flex-shrink-0">
        {partner && (
          <Link to={`/PartnerStore?id=${partner.id}`}>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1 border-violet-200 text-violet-700 hover:bg-violet-50">
              <ShoppingBag className="w-3 h-3" />
              Comprar
            </Button>
          </Link>
        )}
        <button
          onClick={onUnfavorite}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-rose-50 hover:bg-rose-100 transition-colors"
        >
          <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
        </button>
      </div>
    </div>
  );
}

function FavoritePartnerCard({ partner, avgRating, reviewCount, onUnfavorite }) {
  return (
    <Link to={`/PartnerStore?id=${partner.id}`} className="block">
      <div className="flex items-center gap-3 p-3 rounded-xl border bg-white hover:bg-slate-50 transition-colors">
        <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
          {partner.logo_url ? (
            <img src={partner.logo_url} alt={partner.business_name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-lg font-bold text-slate-400">{partner.business_name?.charAt(0)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{partner.business_name}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {partner.category && (
              <span className="text-xs text-slate-400">{categoryLabels[partner.category] || partner.category}</span>
            )}
            {partner.address && (
              <span className="text-xs text-slate-400 flex items-center gap-0.5 truncate">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {partner.address}
              </span>
            )}
            {reviewCount > 0 && (
              <span className="text-xs text-amber-500 flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-amber-400" />
                {avgRating?.toFixed(1)} ({reviewCount})
              </span>
            )}
          </div>
        </div>
        <button
          onClick={(e) => { e.preventDefault(); onUnfavorite(); }}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-rose-50 hover:bg-rose-100 transition-colors flex-shrink-0"
        >
          <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
        </button>
      </div>
    </Link>
  );
}

export default function FavoritesTab({ user }) {
  const queryClient = useQueryClient();

  const { data: favProducts = [], isLoading: loadingFavProds } = useQuery({
    queryKey: ['favoriteProducts', user?.email],
    queryFn: () => base44.entities.FavoriteProduct.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: favPartners = [], isLoading: loadingFavParts } = useQuery({
    queryKey: ['favoritePartners', user?.email],
    queryFn: () => base44.entities.FavoritePartner.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ['allProducts'],
    queryFn: () => base44.entities.Product.list(),
    enabled: favProducts.length > 0,
  });

  const { data: allPartners = [] } = useQuery({
    queryKey: ['allPartners'],
    queryFn: () => base44.entities.Partner.list(),
    enabled: favPartners.length > 0 || favProducts.length > 0,
  });

  const { data: allReviews = [] } = useQuery({
    queryKey: ['allReviews'],
    queryFn: () => base44.entities.Review.list(),
    enabled: favPartners.length > 0,
  });

  const removeFavProduct = useMutation({
    mutationFn: (id) => base44.entities.FavoriteProduct.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favoriteProducts', user?.email] }),
  });

  const removeFavPartner = useMutation({
    mutationFn: (id) => base44.entities.FavoritePartner.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favoritePartners', user?.email] }),
  });

  const isLoading = loadingFavProds || loadingFavParts;

  // Build enriched lists
  const favProductsEnriched = favProducts
    .map(fp => ({
      fav: fp,
      product: allProducts.find(p => p.id === fp.product_id),
      partner: allPartners.find(p => p.id === fp.partner_id),
    }))
    .filter(x => x.product);

  const favPartnersEnriched = favPartners
    .map(fp => {
      const partner = allPartners.find(p => p.id === fp.partner_id);
      const reviews = allReviews.filter(r => r.partner_id === fp.partner_id);
      const avgRating = reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : 0;
      return { fav: fp, partner, avgRating, reviewCount: reviews.length };
    })
    .filter(x => x.partner);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (favProductsEnriched.length === 0 && favPartnersEnriched.length === 0) {
    return (
      <div className="text-center py-16">
        <Heart className="w-12 h-12 text-slate-200 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">Nenhum favorito ainda</p>
        <p className="text-sm text-slate-400 mt-1">
          Toque no ❤️ em produtos e lojas para salvar aqui
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Favorite Partners */}
      {favPartnersEnriched.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Store className="w-4 h-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-slate-700">
              Lojas Favoritas
              <span className="ml-2 text-xs font-normal text-slate-400">({favPartnersEnriched.length})</span>
            </h3>
          </div>
          <div className="space-y-2">
            {favPartnersEnriched.map(({ fav, partner, avgRating, reviewCount }) => (
              <FavoritePartnerCard
                key={fav.id}
                partner={partner}
                avgRating={avgRating}
                reviewCount={reviewCount}
                onUnfavorite={() => removeFavPartner.mutate(fav.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Favorite Products */}
      {favProductsEnriched.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-fuchsia-500" />
            <h3 className="text-sm font-semibold text-slate-700">
              Produtos Favoritos
              <span className="ml-2 text-xs font-normal text-slate-400">({favProductsEnriched.length})</span>
            </h3>
          </div>
          <div className="space-y-2">
            {favProductsEnriched.map(({ fav, product, partner }) => (
              <FavoriteProductCard
                key={fav.id}
                product={product}
                partner={partner}
                onUnfavorite={() => removeFavProduct.mutate(fav.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}