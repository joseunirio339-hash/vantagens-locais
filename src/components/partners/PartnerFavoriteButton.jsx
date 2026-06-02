import React from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PartnerFavoriteButton({ isFavorite, onToggle }) {
  return (
    <motion.button
      whileTap={{ scale: 0.8 }}
      onClick={(e) => { e.stopPropagation(); onToggle(); }}
      className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md border transition-colors ${
        isFavorite
          ? 'bg-rose-500 border-rose-500'
          : 'bg-white/90 border-slate-200 hover:bg-rose-50'
      }`}
    >
      <Heart
        className={`w-4 h-4 transition-colors ${isFavorite ? 'fill-white text-white' : 'text-slate-400'}`}
      />
    </motion.button>
  );
}