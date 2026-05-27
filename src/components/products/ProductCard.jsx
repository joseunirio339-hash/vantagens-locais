import React from 'react';
import { Tag, Percent, Eye, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export default function ProductCard({ product, partner, onClick, showViews = false, avgRating, reviewCount }) {
  const discountPercent = Math.round(
    ((product.original_price - product.discount_price) / product.original_price) * 100
  );

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
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
        <Badge className="absolute top-3 right-3 bg-emerald-500 hover:bg-emerald-500 text-white font-bold px-3 py-1">
          <Percent className="w-3 h-3 mr-1" />
          {discountPercent}% OFF
        </Badge>
      </div>

      <div className="p-4">
        {partner && (
          <p className="text-xs text-slate-500 mb-1 truncate">{partner.business_name}</p>
        )}
        <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2">{product.name}</h3>
        
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-emerald-600">
            R$ {product.discount_price?.toFixed(2).replace('.', ',')}
          </span>
          <span className="text-sm text-slate-400 line-through">
            R$ {product.original_price?.toFixed(2).replace('.', ',')}
          </span>
        </div>

        <div className="flex items-center justify-between mt-2">
          {avgRating ? (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-xs font-semibold text-slate-700">{Number(avgRating).toFixed(1)}</span>
              {reviewCount !== undefined && (
                <span className="text-xs text-slate-400">({reviewCount})</span>
              )}
            </div>
          ) : <span />}
          {showViews && (
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Eye className="w-3 h-3" />
              {product.views_count || 0}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}