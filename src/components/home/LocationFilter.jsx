import React, { useMemo, useState } from 'react';
import { MapPin, X, Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCitiesByState, getNeighborhoods, BRAZILIAN_STATES } from '@/lib/brazilianCities';

export default function LocationFilter({ partners, selectedCity, selectedNeighborhood, selectedState, onCityChange, onNeighborhoodChange, onStateChange }) {
  const [citySearch, setCitySearch] = useState('');
  const [nbhSearch, setNbhSearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');

  const allCities = useMemo(() => getCitiesByState(selectedState), [selectedState]);
  const allNeighborhoods = useMemo(() => getNeighborhoods(selectedCity), [selectedCity]);

  const filteredStates = useMemo(() => {
    if (!stateSearch) return BRAZILIAN_STATES;
    const q = stateSearch.toLowerCase();
    return BRAZILIAN_STATES.filter(s => s.name.toLowerCase().includes(q) || s.uf.toLowerCase().includes(q));
  }, [stateSearch]);

  const filteredCities = useMemo(() => {
    if (!citySearch) return allCities;
    const q = citySearch.toLowerCase();
    return allCities.filter(c => c.toLowerCase().includes(q));
  }, [allCities, citySearch]);

  const filteredNeighborhoods = useMemo(() => {
    if (!nbhSearch) return allNeighborhoods;
    const q = nbhSearch.toLowerCase();
    return allNeighborhoods.filter(n => n.toLowerCase().includes(q));
  }, [allNeighborhoods, nbhSearch]);

  const hasFilter = selectedState || selectedCity || selectedNeighborhood;

  const handleStateChange = (val) => {
    onStateChange(val);
    onCityChange('');
    onNeighborhoodChange('');
    setCitySearch('');
    setNbhSearch('');
    setStateSearch(val);
  };

  const handleCityChange = (val) => {
    onCityChange(val);
    onNeighborhoodChange('');
    setCitySearch(val);
    setNbhSearch('');
  };

  const handleClear = () => {
    onStateChange('');
    onCityChange('');
    onNeighborhoodChange('');
    setStateSearch('');
    setCitySearch('');
    setNbhSearch('');
  };

  // Formatar o nome do estado selecionado
  const selectedStateName = selectedState ? BRAZILIAN_STATES.find(s => s.uf === selectedState)?.name : '';

  return (
    <div className="bg-white border border-stone-200 rounded-2xl shadow-sm mb-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <div className="w-7 h-7 bg-rose-100 rounded-lg flex items-center justify-center">
          <MapPin className="w-4 h-4 text-rose-600" />
        </div>
        <span className="font-semibold text-stone-700 text-sm">Filtrar por Localidade</span>
        {hasFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="ml-auto text-xs text-stone-400 hover:text-red-500 h-7 px-2"
          >
            <X className="w-3 h-3 mr-1" />
            Limpar
          </Button>
        )}
      </div>

      {/* Filters row */}
      <div className="px-4 pb-4 flex flex-col sm:flex-row gap-3">
        {/* Estado */}
        <div className="flex-1">
          <label className="text-xs text-stone-500 mb-1 block font-medium">Estado</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar estado..."
              value={stateSearch}
              onChange={(e) => {
                setStateSearch(e.target.value);
                if (e.target.value === '') handleStateChange('');
              }}
              list="state-list"
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-stone-200 bg-white text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400"
            />
            <datalist id="state-list">
              <option value="">Todos os estados</option>
              {filteredStates.map(s => (
                <option key={s.uf} value={s.uf}>{s.name}</option>
              ))}
            </datalist>
            {stateSearch && (
              <button onClick={handleClear} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-red-500">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {selectedState && (
            <p className="text-xs text-rose-600 mt-1 ml-1">{selectedStateName} — {allCities.length} cidades</p>
          )}
        </div>

        {/* Cidade */}
        <div className="flex-1">
          <label className="text-xs text-stone-500 mb-1 block font-medium">Cidade</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
            <input
              type="text"
              placeholder={selectedState ? 'Buscar cidade...' : 'Selecione um estado primeiro'}
              value={citySearch}
              onChange={(e) => {
                setCitySearch(e.target.value);
                if (e.target.value === '') handleCityChange('');
              }}
              list="city-list"
              disabled={!selectedState}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-stone-200 bg-white text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <datalist id="city-list">
              <option value="">Todas as cidades</option>
              {filteredCities.slice(0, 100).map(c => <option key={c} value={c} />)}
            </datalist>
            {citySearch && selectedState && (
              <button onClick={() => handleCityChange('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-red-500">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Bairro */}
        <div className="flex-1">
          <label className="text-xs text-stone-500 mb-1 block font-medium">Bairro</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
            <input
              type="text"
              placeholder={selectedCity ? 'Buscar bairro...' : 'Selecione uma cidade'}
              value={nbhSearch}
              onChange={(e) => setNbhSearch(e.target.value)}
              onBlur={(e) => {
                const match = allNeighborhoods.find(n => n.toLowerCase() === e.target.value.toLowerCase());
                if (match) onNeighborhoodChange(match);
                else if (e.target.value === '') onNeighborhoodChange('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const match = allNeighborhoods.find(n => n.toLowerCase() === e.target.value.toLowerCase());
                  if (match) { onNeighborhoodChange(match); setNbhSearch(match); }
                }
              }}
              list="nbh-list"
              disabled={!selectedCity}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-stone-200 bg-white text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <datalist id="nbh-list">
              <option value="">Todos os bairros</option>
              {filteredNeighborhoods.map(nb => <option key={nb} value={nb} />)}
            </datalist>
            {nbhSearch && selectedCity && (
              <button onClick={() => { onNeighborhoodChange(''); setNbhSearch(''); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-red-500">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active filter badge */}
      {hasFilter && (
        <div className="px-4 pb-3 flex items-center gap-2">
          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 text-xs flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {[selectedState, selectedCity, selectedNeighborhood].filter(Boolean).join(' › ')}
          </Badge>
        </div>
      )}
    </div>
  );
}