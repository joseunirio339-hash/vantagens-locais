import React, { useMemo, useState, useEffect } from 'react';
import { MapPin, X, Search, ExternalLink, Star, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getAllCities, getNeighborhoods } from '@/lib/brazilianCities';

// Fix Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom partner marker icon
const partnerIcon = new L.DivIcon({
  html: `<div style="width:30px;height:30px;background:linear-gradient(135deg,#f59e0b,#ef4444);border:3px solid #fff;border-radius:50%;box-shadow:0 3px 12px rgba(239,68,68,0.35);display:flex;align-items:center;justify-content:center;font-size:14px">🏪</div>`,
  className: '',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

// Recenter map when coordinates change
function RecenterMap({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom || 6);
  }, [center, zoom, map]);
  return null;
}

// Approximate city center coordinates for map centering
const CITY_COORDS = {
  'São Paulo': [-23.5505, -46.6333],
  'Rio de Janeiro': [-22.9068, -43.1729],
  'Belo Horizonte': [-19.9167, -43.9345],
  'Brasília': [-15.7801, -47.9292],
  'Salvador': [-12.9714, -38.5014],
  'Fortaleza': [-3.7319, -38.5267],
  'Curitiba': [-25.4290, -49.2671],
  'Manaus': [-3.1190, -60.0217],
  'Recife': [-8.0476, -34.8770],
  'Porto Alegre': [-30.0346, -51.2177],
  'Belém': [-1.4558, -48.4902],
  'Goiânia': [-16.6864, -49.2643],
  'Guarulhos': [-23.4538, -46.5333],
  'Campinas': [-22.9056, -47.0608],
  'São Luís': [-2.5307, -44.3068],
  'Maceió': [-9.6658, -35.7353],
  'São Gonçalo': [-22.8269, -43.0634],
  'Teresina': [-5.0892, -42.8019],
  'Natal': [-5.7950, -35.2094],
  'Campo Grande': [-20.4435, -54.6478],
  'João Pessoa': [-7.1150, -34.8631],
  'São Bernardo do Campo': [-23.6930, -46.5650],
  'Santo André': [-23.6568, -46.5377],
  'Osasco': [-23.5329, -46.7916],
  'Florianópolis': [-27.5954, -48.5480],
  'Vitória': [-20.3190, -40.3370],
  'Aracaju': [-10.9111, -37.0717],
  'Cuiabá': [-15.6010, -56.0974],
  'Porto Velho': [-8.7612, -63.9000],
  'Rio Branco': [-9.9747, -67.8100],
  'Macapá': [0.0349, -51.0694],
  'Boa Vista': [2.8195, -60.6714],
  'Palmas': [-10.1844, -48.3336],
  'Niterói': [-22.8832, -43.1034],
  'Contagem': [-19.9317, -44.0475],
  'Ribeirão Preto': [-21.1775, -47.8100],
  'Sorocaba': [-23.5015, -47.4581],
  'Juiz de Fora': [-21.7642, -43.3495],
  'Uberlândia': [-18.9188, -48.2769],
  'Londrina': [-23.3103, -51.1628],
  'Joinville': [-26.3045, -48.8487],
  'Maringá': [-23.4253, -51.9386],
  'São José dos Campos': [-23.1895, -45.8841],
  'Santos': [-23.9608, -46.3336],
  'Vila Velha': [-20.3297, -40.2925],
  'Serra': [-20.1286, -40.3082],
  'Caxias do Sul': [-29.1685, -51.1794],
  'Blumenau': [-26.9194, -49.0661],
  'Nova Iguaçu': [-22.7590, -43.4504],
  'Duque de Caxias': [-22.7856, -43.3129],
  'Petrópolis': [-22.5050, -43.1786],
  'Volta Redonda': [-22.5215, -44.1039],
  'Campos dos Goytacazes': [-21.7545, -41.3244],
  'Macaé': [-22.3708, -41.7869],
  'Cabo Frio': [-22.8794, -42.0197],
  'Belford Roxo': [-22.7642, -43.3928],
  'São João de Meriti': [-22.8039, -43.3725],
  'Feira de Santana': [-12.2664, -38.9663],
  'Campina Grande': [-7.2306, -35.8780],
  'Caruaru': [-8.2833, -35.9761],
  'Jaboatão dos Guararapes': [-8.1128, -35.0150],
  'Olinda': [-8.0087, -34.8553],
  'Petrolina': [-9.3986, -40.5008],
  'Juazeiro do Norte': [-7.2127, -39.3152],
  'Ilhéus': [-14.7885, -39.0493],
  'Porto Seguro': [-16.4435, -39.0643],
  'Canoas': [-29.9176, -51.1836],
  'Gravataí': [-29.9440, -50.9928],
  'Novo Hamburgo': [-29.6880, -51.1327],
  'Santa Maria': [-29.6842, -53.8063],
  'Pelotas': [-31.7719, -52.3425],
  'Imperatriz': [-5.5264, -47.4754],
  'Vitória da Conquista': [-14.8662, -40.8392],
  'Cascavel': [-24.9555, -53.4553],
  'Foz do Iguaçu': [-25.5478, -54.5882],
  'Ponta Grossa': [-25.0945, -50.1633],
  'Uberaba': [-19.7488, -47.9325],
  'Montes Claros': [-16.7269, -43.8711],
  'Governador Valadares': [-18.8503, -41.9490],
  'Ipatinga': [-19.4689, -42.5367],
  'Divinópolis': [-20.1390, -44.8915],
  'Betim': [-19.9690, -44.1978],
  'Sete Lagoas': [-19.4658, -44.2469],
  'Criciúma': [-28.6783, -49.3704],
  'Chapecó': [-27.0966, -52.6185],
  'Itajaí': [-26.9083, -48.6626],
  'Balneário Camboriú': [-26.9910, -48.6352],
  'Bauru': [-22.3147, -49.0601],
  'São José do Rio Preto': [-20.8113, -49.3758],
  'Piracicaba': [-22.7256, -47.6492],
  'Jundiaí': [-23.1857, -46.8978],
  'Marília': [-22.2140, -49.9470],
  'Presidente Prudente': [-22.1252, -51.3892],
  'Araçatuba': [-21.2107, -50.4320],
};

function getCityCoords(city) {
  return CITY_COORDS[city] || null;
}

export default function LocationFilter({ partners, products, selectedCity, selectedNeighborhood, onCityChange, onNeighborhoodChange, avgRatings, productCounts }) {
  const [citySearch, setCitySearch] = useState('');
  const [nbhSearch, setNbhSearch] = useState('');
  const [geocoded, setGeocoded] = useState({});
  const [geocoding, setGeocoding] = useState(false);

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
  };

  // Partners filtered by city/neighborhood
  const filteredPartners = useMemo(() => {
    return partners.filter(p => {
      if (selectedCity && p.city !== selectedCity) return false;
      if (selectedNeighborhood && p.neighborhood !== selectedNeighborhood) return false;
      return true;
    });
  }, [partners, selectedCity, selectedNeighborhood]);

  // Partners that already have coordinates
  const partnersWithCoords = useMemo(
    () => filteredPartners.filter(p => p.lat && p.lng),
    [filteredPartners]
  );

  // Map center based on selected city or default Brazil center
  const mapCenter = useMemo(() => {
    if (selectedCity) {
      const coords = getCityCoords(selectedCity);
      if (coords) return coords;
    }
    // If partners with coords exist, use first one's location
    if (partnersWithCoords.length > 0) return [partnersWithCoords[0].lat, partnersWithCoords[0].lng];
    return [-15.78, -47.93]; // Brazil center
  }, [selectedCity, partnersWithCoords]);

  const mapZoom = selectedCity ? 12 : 5;

  // Geocode partners without coordinates (when city selected)
  const partnersNeedingGeocode = useMemo(
    () => filteredPartners.filter(p => !p.lat && !p.lng && !geocoded[p.id]),
    [filteredPartners, geocoded]
  );

  useEffect(() => {
    if (!selectedCity || partnersNeedingGeocode.length === 0) return;
    if (geocoding) return;

    const geocode = async () => {
      setGeocoding(true);
      const batch = partnersNeedingGeocode.slice(0, 5);
      const newGeocoded = { ...geocoded };

      for (const p of batch) {
        const query = [p.address, p.neighborhood, p.city, p.state, 'Brasil']
          .filter(Boolean).join(', ');
        if (!query.trim()) {
          newGeocoded[p.id] = null; // mark as tried
          continue;
        }
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
          );
          const data = await res.json();
          if (data.length > 0) {
            newGeocoded[p.id] = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
          } else {
            newGeocoded[p.id] = null;
          }
        } catch (_) {
          newGeocoded[p.id] = null;
        }
        // Rate limit respect
        await new Promise(r => setTimeout(r, 300));
      }

      setGeocoded(newGeocoded);
      setGeocoding(false);
    };

    geocode();
  }, [selectedCity, partnersNeedingGeocode.length]);

  // Merge partners with coords + geocoded
  const mapPartners = useMemo(() => {
    const withBuiltIn = partnersWithCoords.map(p => ({
      ...p, _lat: p.lat, _lng: p.lng, _source: 'stored'
    }));
    const withGeocoded = filteredPartners
      .filter(p => geocoded[p.id] !== undefined && geocoded[p.id] !== null)
      .map(p => ({ ...p, _lat: geocoded[p.id].lat, _lng: geocoded[p.id].lng, _source: 'geocoded' }));
    // Deduplicate by id
    const seen = new Set(withBuiltIn.map(p => p.id));
    return [...withBuiltIn, ...withGeocoded.filter(p => !seen.has(p.id))];
  }, [partnersWithCoords, filteredPartners, geocoded]);

  const mapPartnerCount = mapPartners.length;

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

      {/* Search inputs */}
      <div className="px-4 pb-3 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="text-xs text-stone-500 mb-1 block font-medium">Cidade</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar cidade..."
              value={citySearch}
              onChange={(e) => {
                setCitySearch(e.target.value);
                if (e.target.value === '') handleClear();
              }}
              list="city-list"
              className="w-full h-10 pl-9 pr-8 rounded-xl border border-stone-200 bg-white text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400"
            />
            <datalist id="city-list">
              <option value="">Todas as cidades</option>
              {filteredCities.slice(0, 100).map(c => <option key={c} value={c} />)}
            </datalist>
            {citySearch && (
              <button onClick={handleClear} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-red-500">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

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

      {/* Active filter info */}
      <div className="px-4 pb-2 flex items-center gap-2 flex-wrap">
        {hasFilter && (
          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 text-xs flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {[selectedCity, selectedNeighborhood].filter(Boolean).join(' › ')}
          </Badge>
        )}
        {mapPartnerCount > 0 && (
          <span className="text-xs text-stone-400">
            {mapPartnerCount} parceiro{mapPartnerCount !== 1 ? 's' : ''} no mapa
          </span>
        )}
        {geocoding && (
          <span className="text-xs text-amber-500 flex items-center gap-1 ml-auto">
            <Loader2 className="w-3 h-3 animate-spin" />
            Localizando parceiros...
          </span>
        )}
      </div>

      {/* Map — always visible */}
      <div className="border-t border-stone-100">
        <div className="relative">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '360px', width: '100%' }}
            scrollWheelZoom={false}
            key={`${selectedCity || 'all'}-${selectedNeighborhood || 'all'}`}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RecenterMap center={mapCenter} zoom={selectedCity ? 13 : 5} />

            {mapPartners.map(p => (
              <Marker key={p.id} position={[p._lat, p._lng]} icon={partnerIcon}>
                <Popup minWidth={200}>
                  <div className="text-sm">
                    {p.logo_url && (
                      <img src={p.logo_url} alt={p.business_name} className="w-10 h-10 rounded-lg object-cover mb-1.5 mx-auto" />
                    )}
                    <p className="font-bold text-stone-800 text-center">{p.business_name}</p>
                    {p.address && <p className="text-xs text-stone-500 text-center mt-0.5">{p.address}</p>}
                    {p.neighborhood && <p className="text-xs text-stone-400 text-center">{p.neighborhood} – {p.city}</p>}

                    {avgRatings && avgRatings[p.id] && (
                      <div className="flex items-center justify-center gap-1 mt-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-semibold text-stone-700">
                          {(avgRatings[p.id].sum / avgRatings[p.id].count).toFixed(1)}
                        </span>
                        <span className="text-xs text-stone-400">({avgRatings[p.id].count} avaliações)</span>
                      </div>
                    )}

                    {productCounts && productCounts[p.id] > 0 && (
                      <p className="text-xs font-semibold text-rose-600 text-center mt-1">
                        {productCounts[p.id]} produto{productCounts[p.id] !== 1 ? 's' : ''} disponíve{productCounts[p.id] !== 1 ? 'is' : 'l'}
                      </p>
                    )}

                    <Link to={createPageUrl(`PartnerStore?id=${p.id}`)}>
                      <Button size="sm" className="w-full mt-2 h-7 text-xs bg-rose-500 hover:bg-rose-600">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Ver loja
                      </Button>
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Empty state overlay */}
          {mapPartnerCount === 0 && !geocoding && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 pointer-events-none">
              <div className="text-center">
                <MapPin className="w-10 h-10 text-stone-200 mx-auto mb-3" />
                <p className="text-stone-500 text-sm font-medium">
                  {selectedCity
                    ? `Nenhum parceiro mapeado em ${selectedCity}${selectedNeighborhood ? ` – ${selectedNeighborhood}` : ''}`
                    : 'Selecione uma cidade para ver os parceiros no mapa'}
                </p>
                <p className="text-xs text-stone-400 mt-1">
                  {selectedCity ? 'Os parceiros serão exibidos aqui conforme cadastram seus endereços.' : 'Use os filtros acima para começar.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}