import React, { useMemo, useState } from 'react';
import { MapPin, X, ChevronDown, Map, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getAllCities, getNeighborhoods } from '@/lib/brazilianCities';

// Fix default marker icon issue with webpack/vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function LocationFilter({ partners, selectedCity, selectedNeighborhood, onCityChange, onNeighborhoodChange }) {
  const [showMap, setShowMap] = useState(false);
  const [mapPartners, setMapPartners] = useState([]);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodedPartners, setGeocodedPartners] = useState([]);
  const [citySearch, setCitySearch] = useState('');
  const [nbhSearch, setNbhSearch] = useState('');

  const allCities = useMemo(() => getAllCities(), []);
  const allNeighborhoods = useMemo(() => getNeighborhoods(selectedCity), [selectedCity]);

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

  const hasFilter = selectedCity || selectedNeighborhood;

  const handleCityChange = (val) => {
    onCityChange(val);
    onNeighborhoodChange('');
    setCitySearch(val);
    setNbhSearch('');
  };

  const handleClear = () => {
    onCityChange('');
    onNeighborhoodChange('');
    setCitySearch('');
    setNbhSearch('');
    setShowMap(false);
    setGeocodedPartners([]);
  };

  // Geocode partners that have address/city info to show on map
  const handleShowMap = async () => {
    setShowMap(true);
    setGeocoding(true);

    const relevantPartners = partners.filter(p => {
      if (selectedCity && p.city !== selectedCity) return false;
      if (selectedNeighborhood && p.neighborhood !== selectedNeighborhood) return false;
      return p.city || p.address;
    });

    const results = [];
    for (const p of relevantPartners.slice(0, 10)) {
      const query = [p.address, p.neighborhood, p.city, p.state, 'Brasil']
        .filter(Boolean).join(', ');
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
        );
        const data = await res.json();
        if (data.length > 0) {
          results.push({
            ...p,
            lat: parseFloat(data[0].lat),
            lon: parseFloat(data[0].lon),
          });
        }
      } catch (_) { /* skip */ }
    }
    setGeocodedPartners(results);
    setGeocoding(false);
  };

  // Default map center: Brazil
  const mapCenter = geocodedPartners.length > 0
    ? [geocodedPartners[0].lat, geocodedPartners[0].lon]
    : [-15.7801, -47.9292];

  return (
    <div className="bg-white border border-violet-100 rounded-2xl shadow-sm mb-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
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

      {/* Selects */}
      <div className="px-4 pb-3 flex flex-col sm:flex-row gap-3">
        {/* City searchable input */}
        <div className="flex-1">
          <label className="text-xs text-slate-500 mb-1 block font-medium">Cidade</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar cidade..."
              value={citySearch}
              onChange={(e) => {
                setCitySearch(e.target.value);
                if (e.target.value === '') handleCityChange('');
              }}
              list="city-list"
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400"
            />
            <datalist id="city-list">
              <option value="">Todas as cidades</option>
              {filteredCities.slice(0, 100).map(city => (
                <option key={city} value={city} />
              ))}
            </datalist>
            {citySearch && (
              <button
                onClick={() => handleClear()}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {selectedCity && (
            <p className="text-xs text-violet-600 mt-1 ml-1">{allCities.length} cidades disponíveis</p>
          )}
        </div>

        {/* Neighborhood searchable input */}
        <div className="flex-1">
          <label className="text-xs text-slate-500 mb-1 block font-medium">Bairro</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={selectedCity ? 'Buscar bairro...' : 'Selecione uma cidade'}
              value={nbhSearch}
              onChange={(e) => {
                setNbhSearch(e.target.value);
              }}
              onBlur={(e) => {
                // On blur, if the value matches a neighborhood, set it
                const match = allNeighborhoods.find(
                  n => n.toLowerCase() === e.target.value.toLowerCase()
                );
                if (match) {
                  onNeighborhoodChange(match);
                } else if (e.target.value === '') {
                  onNeighborhoodChange('');
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const match = allNeighborhoods.find(
                    n => n.toLowerCase() === e.target.value.toLowerCase()
                  );
                  if (match) {
                    onNeighborhoodChange(match);
                    setNbhSearch(match);
                  }
                }
              }}
              list="nbh-list"
              disabled={!selectedCity}
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <datalist id="nbh-list">
              <option value="">Todos os bairros</option>
              {filteredNeighborhoods.map(nb => (
                <option key={nb} value={nb} />
              ))}
            </datalist>
            {nbhSearch && selectedCity && (
              <button
                onClick={() => { onNeighborhoodChange(''); setNbhSearch(''); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {selectedCity && allNeighborhoods.length > 0 && (
            <p className="text-xs text-violet-600 mt-1 ml-1">{allNeighborhoods.length} bairros em {selectedCity}</p>
          )}
        </div>
      </div>

      {/* Active filter badge + map toggle */}
      <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
        {hasFilter && (
          <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 text-xs flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {[selectedCity, selectedNeighborhood].filter(Boolean).join(' › ')}
          </Badge>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={showMap ? () => setShowMap(false) : handleShowMap}
          className="ml-auto h-8 text-xs border-violet-200 text-violet-700 hover:bg-violet-50 flex items-center gap-1.5"
        >
          <Map className="w-3.5 h-3.5" />
          {showMap ? 'Ocultar Mapa' : 'Ver no Mapa'}
        </Button>
      </div>

      {/* Map section */}
      {showMap && (
        <div className="border-t border-violet-100">
          {geocoding ? (
            <div className="h-64 flex items-center justify-center bg-slate-50">
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <div className="w-6 h-6 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
                <span className="text-sm">Carregando mapa...</span>
              </div>
            </div>
          ) : (
            <div className="relative">
              <MapContainer
                center={mapCenter}
                zoom={geocodedPartners.length > 0 ? 13 : 4}
                style={{ height: '320px', width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {geocodedPartners.map(p => (
                  <Marker key={p.id} position={[p.lat, p.lon]}>
                    <Popup>
                      <div className="text-sm">
                        <p className="font-semibold">{p.business_name}</p>
                        {p.address && <p className="text-slate-500 text-xs mt-1">{p.address}</p>}
                        {p.neighborhood && <p className="text-slate-500 text-xs">{p.neighborhood} – {p.city}</p>}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
              {geocodedPartners.length === 0 && !geocoding && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                  <p className="text-slate-400 text-sm">Nenhum parceiro com endereço cadastrado nessa região.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}