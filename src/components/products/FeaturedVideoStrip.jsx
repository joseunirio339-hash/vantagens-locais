import React, { useRef, useState } from 'react';
import { Play, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export default function FeaturedVideoStrip({ products, partners, onProductClick }) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const scroll = (direction) => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollAmount = 280;
    container.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    setTimeout(() => {
      setCanScrollLeft(container.scrollLeft > 10);
      setCanScrollRight(container.scrollLeft + container.clientWidth < container.scrollWidth - 10);
    }, 400);
  };

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    setCanScrollLeft(container.scrollLeft > 10);
    setCanScrollRight(container.scrollLeft + container.clientWidth < container.scrollWidth - 10);
  };

  if (!products.length) return null;

  return (
    <div className="relative mb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-rose-500 rounded-xl flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Produtos em Destaque</h3>
          <p className="text-xs text-slate-400">Veja os produtos Premium em vídeo</p>
        </div>
      </div>

      {/* Scroll buttons */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white shadow-lg rounded-full flex items-center justify-center text-stone-600 hover:text-amber-600 transition-colors"
          style={{ marginTop: '16px' }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white shadow-lg rounded-full flex items-center justify-center text-stone-600 hover:text-amber-600 transition-colors"
          style={{ marginTop: '16px' }}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Video strip */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1 snap-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => {
          const partner = partners.find(p => p.id === product.partner_id);
          return (
            <div
              key={product.id}
              onClick={() => onProductClick(product)}
              className="flex-shrink-0 w-[240px] sm:w-[280px] snap-start cursor-pointer group"
            >
              {/* Video container */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 shadow-lg group-hover:shadow-xl transition-shadow">
                <video
                  src={product.video_url}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                  autoPlay
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Play icon */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-xl">
                    <Play className="w-6 h-6 text-amber-600 ml-1" />
                  </div>
                </div>

                {/* Info bar at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-sm font-semibold truncate">{product.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-emerald-300 text-xs font-bold">
                      R$ {product.discount_price?.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-white/60 text-xs line-through">
                      R$ {product.original_price?.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* Discount badge */}
                <div className="absolute top-2 left-2 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  -{Math.round(((product.original_price - product.discount_price) / product.original_price) * 100)}%
                </div>

                {/* Partner name */}
                {partner && (
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-xs font-medium text-slate-700 px-2 py-0.5 rounded-full">
                    {partner.business_name}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}