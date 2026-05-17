import React from 'react';
import { MapPin, Tag, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const categoryLabels = {
  restaurante: 'Restaurante', moda: 'Moda', eletronicos: 'Eletrônicos',
  beleza: 'Beleza', saude: 'Saúde', mercado: 'Mercado', servicos: 'Serviços',
  doceria: '🍰 Doceria', hamburgueria: '🍔 Hamburgueria', trailer_food: '🚚 Trailer',
  artesanato: '🎨 Artesanato', confeitaria: '🎂 Confeitaria', salgados: '🥟 Salgados',
  costura: '🧵 Costura', outros: 'Outros'
};

const categoryColors = {
  restaurante: 'bg-orange-100 text-orange-700', moda: 'bg-pink-100 text-pink-700',
  eletronicos: 'bg-blue-100 text-blue-700', beleza: 'bg-purple-100 text-purple-700',
  saude: 'bg-green-100 text-green-700', mercado: 'bg-yellow-100 text-yellow-700',
  servicos: 'bg-indigo-100 text-indigo-700', doceria: 'bg-rose-100 text-rose-700',
  hamburgueria: 'bg-orange-100 text-orange-700', trailer_food: 'bg-amber-100 text-amber-700',
  artesanato: 'bg-teal-100 text-teal-700', confeitaria: 'bg-pink-100 text-pink-700',
  salgados: 'bg-yellow-100 text-yellow-700', costura: 'bg-purple-100 text-purple-700',
  outros: 'bg-slate-100 text-slate-700'
};

export default function PartnerCard({ partner, productCount = 0, avgRating = 0, reviewCount = 0, onClick }) {
  const isEmpreendedor = partner?.partner_type === 'empreendedor';
  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-sm border overflow-hidden cursor-pointer hover:shadow-lg transition-shadow p-4 ${isEmpreendedor ? 'border-amber-200' : 'border-slate-100'}`}
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {partner.logo_url ? (
            <img
              src={partner.logo_url}
              alt={partner.business_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-slate-400">
              {partner.business_name?.charAt(0)?.toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="font-semibold text-slate-800 truncate">{partner.business_name}</h3>
              {isEmpreendedor && (
                <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 whitespace-nowrap flex-shrink-0">🤝 Autônomo</span>
              )}
            </div>
            {partner.category && (
              <Badge className={`${categoryColors[partner.category]} text-xs flex-shrink-0`}>
                {categoryLabels[partner.category]}
              </Badge>
            )}
          </div>

          {partner.description && (
            <p className="text-sm text-slate-500 mt-1 line-clamp-2">
              {partner.description}
            </p>
          )}

          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
            {partner.address && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{partner.address}</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {productCount} produtos
            </span>
            {reviewCount > 0 && (
              <span className="flex items-center gap-1 text-amber-500">
                <Star className="w-3 h-3 fill-amber-400" />
                <span className="font-semibold">{avgRating.toFixed(1)}</span>
                <span className="text-slate-400">({reviewCount})</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}