import React, { useState } from 'react';
import { Navigation, X, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Haversine distance in km between two lat/lng points
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Geocode a partner using Nominatim (uses existing lat/lng if available)
async function geocodePartner(partner) {
  if (partner.lat && partner.lng) {
    return { lat: partner.lat, lng: partner.lng };
  }
  const query = [partner.address, partner.neighborhood, partner.city, partner.state, 'Brasil']
    .filter(Boolean)
    .join(', ');
  if (!query.trim()) return null;
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
  );
  const data = await res.json();
  if (data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

export default function ProximitySearch({ onProximitySort, active, onClear }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada neste navegador.');
      return;
    }
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        onProximitySort(userLat, userLng, geocodePartner, haversine);
        setLoading(false);
      },
      () => {
        setError('Não foi possível obter sua localização. Verifique as permissões do navegador.');
        setLoading(false);
      }
    );
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {active ? (
        <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 flex items-center gap-1.5 px-3 py-1.5 text-sm">
          <Navigation className="w-3.5 h-3.5" />
          Ordenado por proximidade
          <button onClick={onClear} className="ml-1 hover:text-red-500">
            <X className="w-3.5 h-3.5" />
          </button>
        </Badge>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleLocate}
          disabled={loading}
          className="gap-2 h-10 border-violet-200 text-violet-700 hover:bg-violet-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          {loading ? 'Localizando...' : 'Perto de mim'}
        </Button>
      )}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <MapPin className="w-3 h-3" /> {error}
        </p>
      )}
    </div>
  );
}