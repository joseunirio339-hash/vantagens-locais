import React from 'react';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, ArrowDownUp, X } from 'lucide-react';

const CATEGORIES = [
  { value: '', label: 'Todos' },
  { value: 'alimentacao', label: '🍔 Alimentação' },
  { value: 'moda', label: '👗 Moda' },
  { value: 'eletronicos', label: '📱 Eletrônicos' },
  { value: 'beleza', label: '💄 Beleza' },
  { value: 'saude', label: '💊 Saúde' },
  { value: 'mercado', label: '🛒 Mercado' },
  { value: 'servicos', label: '🔧 Serviços' },
  { value: 'lazer', label: '🎉 Lazer' },
  { value: 'outros', label: '📦 Outros' },
];

const SORT_OPTIONS = [
  { value: '', label: 'Relevância' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'discount_desc', label: 'Maior desconto' },
];

export default function ProductFilterBar({ selectedCategory, onCategoryChange, sortBy, onSortChange }) {
  const hasFilters = selectedCategory || sortBy;

  return (
    <div className="mb-6">
      {/* Category pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <SlidersHorizontal className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <div className="flex gap-2 flex-nowrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => onCategoryChange(cat.value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                selectedCategory === cat.value
                  ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                  : 'bg-white text-stone-600 border-stone-200 hover:border-amber-300 hover:text-amber-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort row */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <ArrowDownUp className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-500">Ordenar:</span>
          <div className="flex gap-2">
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => onSortChange(opt.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                  sortBy === opt.value
                    ? 'bg-rose-500 text-white border-rose-500'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-rose-300 hover:text-rose-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {hasFilters && (
          <button
            onClick={() => { onCategoryChange(''); onSortChange(''); }}
            className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-medium"
          >
            <X className="w-3 h-3" />
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}