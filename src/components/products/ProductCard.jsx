import React from 'react';
import { Tag, Percent, Eye, Star, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export default function ProductCard({ product, partner, onClick, showViews = false, avgRating, reviewCount }) {
  const discountPercent = Math.round(
    ((product.original_price - product.discount_price) / product.original_price) * 100
  );

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
        {/* Discount badge - top right */}
        <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
          <Percent className="w-3 h-3" />
          {discountPercent}% OFF
        </div>
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
      </div>
    </motion.div>
  );
}