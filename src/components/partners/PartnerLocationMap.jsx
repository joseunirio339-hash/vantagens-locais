import React, { useState, useEffect } from 'react';
import { MapPin, Map, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function PartnerLocationMap({ partner }) {
  const [showMap, setShowMap] = useState(false);
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);

  const hasAddress = partner?.address || partner?.city;

  const geocode = async () => {
    if (coords) return; // already geocoded
    setLoading(true);
    const query = [partner.address, partner.neighborhood, partner.city, partner.state, 'Brasil']
      .filter(Boolean).join(', ');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
      );
      const data = await res.json();
      if (data.length > 0) {
        setCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) });
      }
    } catch (_) {}
    setLoading(false);
  };

  const handleToggle = () => {
    if (!showMap) geocode();
    setShowMap(v => !v);
  };

  if (!hasAddress) return null;

  return (
    <div className="mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggle}
        className="h-8 text-xs border-violet-200 text-violet-700 hover:bg-violet-50 flex items-center gap-1.5"
      >
        <Map className="w-3.5 h-3.5" />
        {showMap ? 'Ocultar Mapa' : 'Ver Localização no Mapa'}
      </Button>

      {showMap && (
        <div className="mt-3 rounded-2xl overflow-hidden border border-violet-100 shadow-sm">
          {loading ? (
            <div className="h-56 flex items-center justify-center bg-slate-50">
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <div className="w-6 h-6 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
                <span className="text-sm">Carregando mapa...</span>
              </div>
            </div>
          ) : coords ? (
            <MapContainer
              center={[coords.lat, coords.lon]}
              zoom={16}
              style={{ height: '260px', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[coords.lat, coords.lon]}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{partner.business_name}</p>
                    {partner.address && <p className="text-slate-500 text-xs mt-1">{partner.address}</p>}
                    {partner.neighborhood && (
                      <p className="text-slate-500 text-xs">{partner.neighborhood} – {partner.city}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          ) : (
            <div className="h-56 flex items-center justify-center bg-slate-50">
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <MapPin className="w-6 h-6" />
                <span className="text-sm">Endereço não encontrado no mapa</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}