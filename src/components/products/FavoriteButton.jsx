import React from 'react';
import { Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FavoriteButton({ isFavorite, onToggle, className = '' }) {
  const handleClick = (e) => {
    e.stopPropagation();
    onToggle();
  };

  return (
    <motion.button
      whileTap={{ scale: 0.8 }}
      onClick={handleClick}
      className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors ${
        isFavorite
          ? 'bg-rose-500 text-white'
          : 'bg-white/90 text-slate-400 hover:text-rose-400'
      } ${className}`}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={isFavorite ? 'filled' : 'empty'}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-white' : ''}`} />
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}