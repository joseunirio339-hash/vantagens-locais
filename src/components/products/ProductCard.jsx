import React from 'react';
import { Tag, Percent, Eye, Star, Sparkles, ShoppingCart, Check, Play, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import FavoriteButton from './FavoriteButton';
import { useCart } from '@/context/CartContext';

export default function ProductCard({ product, partner, onClick, showViews = false, avgRating, reviewCount, isFavorite, onToggleFavorite, isPremium = false }) {
  const { addItem, items } = useCart();
  const [added, setAdded] = React.useState(false);
  const inCart = items.some(i => i.product.id === product.id);

  const discountPercent = Math.round(
    ((product.original_price - product.discount_price) / product.original_price) * 100
  );

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addItem(product, partner);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: '0 12px 32px rgba(0,0,0,0.08)' }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="bg-[#fefcf8] rounded-3xl border border-amber-100/80 overflow-hidden cursor-pointer transition-all hover:border-amber-300 hover:shadow-lg hover:shadow-amber-100/50 group"
    >
      {/* Image area */}
      <div className="relative aspect-[4/3] bg-stone-100">
        {product.image_url ? (
          <div className="w-full h-full relative">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-900/10 via-transparent to-transparent pointer-events-none" />
            {product.video_url && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-11 h-11 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-amber-200/30 group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 text-amber-500 ml-0.5" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-amber-50 to-orange-50">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
              <Tag className="w-6 h-6 text-amber-400" />
            </div>
            <span className="text-xs font-medium text-amber-300/80">Em breve</span>
          </div>
        )}

        {/* Discount badge */}
        <div className="absolute top-3 left-3 bg-gradient-to-br from-rose-400 to-rose-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-md shadow-rose-200/50">
          <Percent className="w-3 h-3" />
          -{discountPercent}%
        </div>

        {/* Premium badge */}
        {isPremium && (
          <div className="absolute top-12 left-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[10px] font-semibold px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-md shadow-amber-200/50">
            <Sparkles className="w-2.5 h-2.5" /> Premium
          </div>
        )}

        {/* Favorite button */}
        {onToggleFavorite && (
          <div className="absolute top-2.5 right-2.5">
            <FavoriteButton isFavorite={!!isFavorite} onToggle={onToggleFavorite} />
          </div>
        )}
      </div>

      {/* Card info */}
      <div className="p-3.5">
        {/* Partner name */}
        {partner && (
          <div className="flex items-center gap-1 mb-1.5">
            {partner.logo_url ? (
              <img src={partner.logo_url} alt="" className="w-4 h-4 rounded-full object-cover" />
            ) : (
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
            )}
            <p className="text-[11px] text-stone-400 truncate font-medium">{partner.business_name}</p>
          </div>
        )}

        {/* Product name */}
        <h3 className="font-semibold text-stone-800 mb-1 line-clamp-2 text-sm leading-snug">{product.name}</h3>

        {/* Short description if available */}
        {product.description && (
          <p className="text-xs text-stone-400 line-clamp-2 mb-2 leading-relaxed">{product.description}</p>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-lg font-extrabold text-rose-600">
            R$ {product.discount_price?.toFixed(2).replace('.', ',')}
          </span>
          <span className="text-xs text-stone-400 line-through">
            R$ {product.original_price?.toFixed(2).replace('.', ',')}
          </span>
        </div>

        {/* Rating + views row */}
        <div className="flex items-center justify-between text-xs text-stone-400 mb-0.5">
          {avgRating ? (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="font-semibold text-stone-600">{Number(avgRating).toFixed(1)}</span>
              {reviewCount !== undefined && (
                <span>({reviewCount})</span>
              )}
            </div>
          ) : <span />}
          {showViews && (
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {product.views_count || 0}
            </div>
          )}
        </div>

        {/* Add to cart button */}
        <button
          onClick={handleAddToCart}
          className={`mt-2.5 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
            added
              ? 'bg-gradient-to-r from-rose-400 to-rose-500 text-white shadow-md shadow-rose-200/40'
              : inCart
              ? 'bg-amber-100 text-amber-800 border border-amber-300'
              : 'bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-200'
          }`}
        >
          {added ? (
            <><Check className="w-3.5 h-3.5" /> Adicionado!</>
          ) : inCart ? (
            <><ShoppingCart className="w-3.5 h-3.5" /> No carrinho</>
          ) : (
            <><ShoppingCart className="w-3.5 h-3.5" /> Adicionar</>
          )}
        </button>
      </div>
    </motion.div>
  );
}