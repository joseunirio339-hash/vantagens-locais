import React from 'react';
import { Star } from 'lucide-react';

export default function MiniStarRating({ rating, count }) {
  if (!rating || rating === 0) return null;

  return (
    <div className="flex items-center gap-1">
      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
      <span className="text-xs font-semibold text-slate-700">{Number(rating).toFixed(1)}</span>
      {count !== undefined && (
        <span className="text-xs text-slate-400">({count})</span>
      )}
    </div>
  );
}