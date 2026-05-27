import React from 'react';
import { Tag, Percent, Eye, Star, Sparkles, ShoppingCart, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import FavoriteButton from './FavoriteButton';
import { useCart } from '@/context/CartContext';

export default function ProductCard({ product, partner, onClick, showViews = false, avgRating, reviewCount, isFavorite, onToggleFavorite }) {
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
      whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden cursor-pointer transition-all"
    >
      <div className="relative aspect-square bg-slate-100">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Tag className="w-12 h-12 text-slate-300" />
          </div>
        )}
        {/* Discount badge - top left */}
        <div className="absolute top-3 left-3 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
          <Percent className="w-3 h-3" />
          {discountPercent}% OFF
        </div>
        {/* Favorite button - top right */}
        {onToggleFavorite && (
          <div className="absolute top-3 right-3">
            <FavoriteButton isFavorite={!!isFavorite} onToggle={onToggleFavorite} />
          </div>
        )}
        {/* Bottom glassmorphism strip */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-fuchsia-600/80 to-transparent px-3 py-2">
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-yellow-300 flex-shrink-0" />
            <span className="text-white text-xs font-medium truncate">Ofertas imperdíveis perto de você</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        {partner && (
          <p className="text-xs text-slate-400 mb-1 truncate font-medium">{partner.business_name}</p>
        )}
        <h3 className="font-bold text-slate-800 mb-2 line-clamp-2 text-sm">{product.name}</h3>
        
        <div className="flex items-baseline gap-2">
          <span className="text-base font-extrabold text-emerald-600">
            R$ {product.discount_price?.toFixed(2).replace('.', ',')}
          </span>
          <span className="text-xs text-slate-400 line-through">
            R$ {product.original_price?.toFixed(2).replace('.', ',')}
          </span>
        </div>

        {avgRating ? (
          <div className="flex items-center gap-1 mt-1.5">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span className="text-xs font-semibold text-slate-700">{Number(avgRating).toFixed(1)}</span>
            {reviewCount !== undefined && (
              <span className="text-xs text-slate-400">({reviewCount})</span>
            )}
          </div>
        ) : null}
        {showViews && (
          <div className="flex items-center gap-1 mt-1 text-xs text-slate-400">
            <Eye className="w-3 h-3" />
            {product.views_count || 0}
          </div>
        )}

        {/* Add to cart button */}
        <button
          onClick={handleAddToCart}
          className={`mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
            added
              ? 'bg-emerald-500 text-white'
              : inCart
              ? 'bg-violet-100 text-violet-700 hover:bg-violet-200'
              : 'bg-slate-100 text-slate-700 hover:bg-fuchsia-100 hover:text-fuchsia-700'
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