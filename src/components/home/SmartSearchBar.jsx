import React, { useState, useRef, useEffect } from 'react';
import { Search, Store, Tag, X, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const CATEGORIES = [
  { value: 'restaurante', label: '🍽️ Restaurante' },
  { value: 'moda', label: '👗 Moda' },
  { value: 'eletronicos', label: '📱 Eletrônicos' },
  { value: 'beleza', label: '💄 Beleza' },
  { value: 'saude', label: '🏥 Saúde' },
  { value: 'mercado', label: '🛒 Mercado' },
  { value: 'servicos', label: '🔧 Serviços' },
  { value: 'doceria', label: '🍰 Doceria' },
  { value: 'hamburgueria', label: '🍔 Hamburgueria' },
  { value: 'confeitaria', label: '🎂 Confeitaria' },
  { value: 'artesanato', label: '🎨 Artesanato' },
  { value: 'outros', label: '📦 Outros' },
];

export default function SmartSearchBar({ products = [], partners = [], onSearch, onCategoryChange, searchTerm, selectedCategory }) {
  const [inputValue, setInputValue] = useState(searchTerm || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Sync external searchTerm
  useEffect(() => {
    setInputValue(searchTerm || '');
  }, [searchTerm]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) {
        setShowDropdown(false);
        setShowCategories(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setInputValue(val);
    onSearch(val);
    setShowDropdown(val.length >= 2);
    setShowCategories(false);
  };

  const clear = () => {
    setInputValue('');
    onSearch('');
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleCategoryClick = (cat) => {
    onCategoryChange(cat === selectedCategory ? '' : cat);
    setShowCategories(false);
    setShowDropdown(false);
  };

  // Build suggestions
  const q = inputValue.toLowerCase().trim();
  const matchedProducts = q.length >= 2
    ? products.filter(p => p.name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)).slice(0, 4)
    : [];
  const matchedPartners = q.length >= 2
    ? partners.filter(p => p.business_name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)).slice(0, 3)
    : [];

  const hasSuggestions = matchedProducts.length > 0 || matchedPartners.length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      {/* Main input */}
      <div className={`flex items-center gap-2 bg-white rounded-2xl shadow-2xl border-2 transition-all ${showDropdown || showCategories ? 'border-violet-400' : 'border-white'}`}>
        <Search className="w-5 h-5 text-slate-400 ml-4 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInput}
          onFocus={() => {
            if (inputValue.length >= 2) setShowDropdown(true);
            else setShowCategories(true);
          }}
          placeholder="Buscar lojas, produtos ou categorias..."
          className="flex-1 py-3.5 text-slate-800 bg-transparent outline-none text-base placeholder:text-slate-400"
        />
        {inputValue && (
          <button onClick={clear} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
        {/* Category pill */}
        <button
          onClick={() => { setShowCategories(!showCategories); setShowDropdown(false); }}
          className={`flex-shrink-0 flex items-center gap-1.5 mr-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
            selectedCategory
              ? 'bg-violet-600 text-white border-violet-600'
              : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200'
          }`}
        >
          {selectedCategory
            ? CATEGORIES.find(c => c.value === selectedCategory)?.label || selectedCategory
            : '🏷️ Categoria'}
        </button>
      </div>

      {/* Category dropdown */}
      {showCategories && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 p-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-2 mb-2">Categorias</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => handleCategoryClick(cat.value)}
                className={`text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                  selectedCategory === cat.value
                    ? 'bg-violet-100 text-violet-700 font-semibold'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {selectedCategory && (
            <button
              onClick={() => handleCategoryClick(selectedCategory)}
              className="mt-2 w-full text-xs text-center text-slate-400 hover:text-rose-500 transition-colors py-1"
            >
              ✕ Limpar categoria
            </button>
          )}
        </div>
      )}

      {/* Suggestions dropdown */}
      {showDropdown && hasSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
          {matchedPartners.length > 0 && (
            <div className="px-3 pt-3 pb-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-2 mb-1">Lojas</p>
              {matchedPartners.map(p => (
                <Link
                  key={p.id}
                  to={createPageUrl(`PartnerStore?id=${p.id}`)}
                  onClick={() => { setShowDropdown(false); }}
                  className="flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-violet-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {p.logo_url
                      ? <img src={p.logo_url} alt={p.business_name} className="w-full h-full object-cover" />
                      : <Store className="w-4 h-4 text-slate-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{p.business_name}</p>
                    {p.city && <p className="text-xs text-slate-400 truncate">📍 {p.city}</p>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}

          {matchedProducts.length > 0 && (
            <div className={`px-3 pb-3 ${matchedPartners.length > 0 ? 'pt-1 border-t border-slate-100 mt-1' : 'pt-3'}`}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-2 mb-1">Produtos</p>
              {matchedProducts.map(p => {
                const discountPct = p.original_price
                  ? Math.round(((p.original_price - p.discount_price) / p.original_price) * 100)
                  : 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => { setShowDropdown(false); onSearch(p.name); setInputValue(p.name); }}
                    className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-fuchsia-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {p.image_url
                        ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                        : <Tag className="w-4 h-4 text-slate-400" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                      <p className="text-xs text-emerald-600 font-medium">
                        R$ {p.discount_price?.toFixed(2).replace('.', ',')}
                        {discountPct > 0 && <span className="ml-1 text-slate-400 line-through text-xs">R$ {p.original_price?.toFixed(2).replace('.', ',')}</span>}
                      </p>
                    </div>
                    {discountPct > 0 && (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
                        -{discountPct}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* View all results */}
          <div className="border-t border-slate-100 px-5 py-2.5">
            <button
              onClick={() => setShowDropdown(false)}
              className="text-xs text-violet-600 font-semibold hover:underline"
            >
              Ver todos os resultados para "{inputValue}" ↓
            </button>
          </div>
        </div>
      )}

      {/* No results */}
      {showDropdown && !hasSuggestions && q.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 px-5 py-4 text-center">
          <p className="text-sm text-slate-500">Nenhum resultado para "<strong>{inputValue}</strong>"</p>
          <p className="text-xs text-slate-400 mt-1">Tente outra palavra-chave ou navegue pelas categorias</p>
        </div>
      )}
    </div>
  );
}