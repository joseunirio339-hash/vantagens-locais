import React, { useMemo } from 'react';
import { MapPin, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export default function LocationFilter({ partners, selectedCity, selectedNeighborhood, onCityChange, onNeighborhoodChange }) {
  const cities = useMemo(() => {
    const set = new Set(partners.map(p => p.city).filter(Boolean));
    return [...set].sort();
  }, [partners]);

  const neighborhoods = useMemo(() => {
    const filtered = selectedCity
      ? partners.filter(p => p.city === selectedCity)
      : partners;
    const set = new Set(filtered.map(p => p.neighborhood).filter(Boolean));
    return [...set].sort();
  }, [partners, selectedCity]);

  const hasFilter = selectedCity || selectedNeighborhood;

  const handleCityChange = (val) => {
    onCityChange(val === 'all' ? '' : val);
    onNeighborhoodChange('');
  };

  const handleNeighborhoodChange = (val) => {
    onNeighborhoodChange(val === 'all' ? '' : val);
  };

  const handleClear = () => {
    onCityChange('');
    onNeighborhoodChange('');
  };

  return (
    <div className="bg-white border border-violet-100 rounded-2xl p-4 mb-6 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 bg-violet-100 rounded-lg flex items-center justify-center">
          <MapPin className="w-4 h-4 text-violet-600" />
        </div>
        <span className="font-semibold text-slate-700 text-sm">Filtrar por Localidade</span>
        {hasFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="ml-auto text-xs text-slate-400 hover:text-red-500 h-7 px-2"
          >
            <X className="w-3 h-3 mr-1" />
            Limpar
          </Button>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={selectedCity || 'all'} onValueChange={handleCityChange}>
          <SelectTrigger className="flex-1 h-10 rounded-xl border-slate-200">
            <SelectValue placeholder="Selecione a cidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as cidades</SelectItem>
            {cities.map(city => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedNeighborhood || 'all'} onValueChange={handleNeighborhoodChange}>
          <SelectTrigger className="flex-1 h-10 rounded-xl border-slate-200">
            <SelectValue placeholder="Selecione o bairro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os bairros</SelectItem>
            {neighborhoods.map(nb => (
              <SelectItem key={nb} value={nb}>{nb}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasFilter && (
        <p className="text-xs text-violet-600 mt-2 flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          Mostrando parceiros em: {[selectedCity, selectedNeighborhood].filter(Boolean).join(' › ')}
        </p>
      )}
    </div>
  );
}