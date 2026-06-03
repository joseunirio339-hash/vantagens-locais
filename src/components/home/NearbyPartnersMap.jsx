import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MapPin, Navigation, Star, ExternalLink, Loader2, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const userIcon = new L.DivIcon({
  html: `<div style="width:18px;height:18px;background:#3b82f6;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.3)"></div>`,
  className: '',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const partnerIcon = new L.DivIcon({
  html: `<div style="width:28px;height:28px;background:linear-gradient(135deg,#7c3aed,#a855f7);border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(124,58,237,0.4);display:flex;align-items:center;justify-content:center">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
  </div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const nearIcon = new L.DivIcon({
  html: `<div style="width:32px;height:32px;background:linear-gradient(135deg,#059669,#10b981);border:3px solid #fff;border-radius:50%;box-shadow:0 2px 10px rgba(5,150,105,0.5);display:flex;align-items:center;justify-content:center">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
  </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function RecenterMap({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom || 13);
  }, [center, zoom, map]);
  return null;
}

const DISTANCE_OPTIONS = [1, 5, 10];

export default function NearbyPartnersMap({ partners, avgRatings = {}, productCounts = {} }) {
  const [userLocation, setUserLocation] = useState(null);
  const [locError, setLocError] = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [maxDistanceKm, setMaxDistanceKm] = useState(5);
  const [open, setOpen] = useState(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocError('Geolocalização não suportada pelo seu navegador.');
      return;
    }
    setLocLoading(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        setLocLoading(false);
        setOpen(true);
      },
      (err) => {
        setLocError('Não foi possível obter sua localização. Verifique as permissões do navegador.');
        setLocLoading(false);
      },
      { timeout: 10000 }
    );
  };

  // Partners that have lat/lng stored
  const partnersWithCoords = useMemo(
    () => partners.filter(p => p.lat && p.lng),
    [partners]
  );

  // Partners within radius
  const nearbyPartners = useMemo(() => {
    if (!userLocation) return partnersWithCoords;
    return partnersWithCoords
      .map(p => ({
        ...p,
        distance: getDistanceKm(userLocation[0], userLocation[1], p.lat, p.lng)
      }))
      .filter(p => p.distance <= maxDistanceKm)
      .sort((a, b) => a.distance - b.distance);
  }, [partnersWithCoords, userLocation, maxDistanceKm]);

  const mapCenter = userLocation || (partnersWithCoords.length > 0
    ? [partnersWithCoords[0].lat, partnersWithCoords[0].lng]
    : [-15.78, -47.93]);

  return (
    <div className="bg-white border border-violet-100 rounded-2xl shadow-sm mb-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Navigation className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">Parceiros Próximos</p>
            <p className="text-xs text-slate-400">
              {userLocation
                ? `${nearbyPartners.length} parceiro${nearbyPartners.length !== 1 ? 's' : ''} em até ${maxDistanceKm} km`
                : 'Use sua localização para encontrar parceiros perto de você'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {open && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={() => setOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          )}
          {!userLocation ? (
            <Button
              size="sm"
              onClick={handleGetLocation}
              disabled={locLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 px-3 text-xs gap-1.5"
            >
              {locLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
              {locLoading ? 'Localizando...' : 'Usar minha localização'}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOpen(v => !v)}
              className="h-8 px-3 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              <MapPin className="w-3.5 h-3.5 mr-1" />
              {open ? 'Ocultar mapa' : 'Ver no mapa'}
            </Button>
          )}
        </div>
      </div>

      {locError && (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 text-xs border-b border-red-100">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {locError}
        </div>
      )}

      {/* Distance filter */}
      {userLocation && (
        <div className="px-4 py-2 flex items-center gap-3 border-b border-slate-100 bg-slate-50/50">
          <span className="text-xs font-medium text-slate-500 shrink-0">Raio de busca:</span>
          <div className="flex gap-1.5 flex-wrap">
            {DISTANCE_OPTIONS.map(km => (
              <button
                key={km}
                onClick={() => setMaxDistanceKm(km)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  maxDistanceKm === km
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-300'
                }`}
              >
                {km} km
              </button>
            ))}
          </div>
          {nearbyPartners.length > 0 && (
            <Badge className="ml-auto bg-emerald-100 text-emerald-700 text-xs">
              {nearbyPartners.length} encontrado{nearbyPartners.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      )}

      {/* Map */}
      {open && userLocation && (
        <div className="relative">
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '360px', width: '100%' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <RecenterMap center={mapCenter} zoom={maxDistanceKm <= 3 ? 14 : maxDistanceKm <= 10 ? 13 : 11} />

            {/* Radius circle */}
            <Circle
              center={userLocation}
              radius={maxDistanceKm * 1000}
              pathOptions={{ color: '#10b981', fillColor: '#10b981', fillOpacity: 0.06, weight: 1.5, dashArray: '5 5' }}
            />

            {/* User marker */}
            <Marker position={userLocation} icon={userIcon}>
              <Popup>
                <p className="font-semibold text-blue-600 text-sm">📍 Você está aqui</p>
              </Popup>
            </Marker>

            {/* Nearby partner markers (green) */}
            {nearbyPartners.map(p => (
              <Marker key={p.id} position={[p.lat, p.lng]} icon={nearIcon}>
                <Popup minWidth={190}>
                  <div>
                    {p.logo_url && (
                      <img src={p.logo_url} alt={p.business_name} className="w-10 h-10 rounded-lg object-cover mb-1.5 mx-auto" />
                    )}
                    <p className="font-bold text-slate-800 text-sm text-center">{p.business_name}</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-emerald-500" />
                      <span className="text-xs text-emerald-600 font-semibold">{p.distance.toFixed(1)} km de você</span>
                    </div>
                    {avgRatings[p.id] && (
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span className="text-xs font-semibold">{(avgRatings[p.id].sum / avgRatings[p.id].count).toFixed(1)}</span>
                      </div>
                    )}
                    {p.address && <p className="text-xs text-slate-400 text-center mt-1">{p.address}</p>}
                    <Link to={createPageUrl(`PartnerStore?id=${p.id}`)}>
                      <Button size="sm" className="w-full mt-2 h-7 text-xs bg-violet-600 hover:bg-violet-700">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Ver loja
                      </Button>
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Far partners (grey) */}
            {partnersWithCoords
              .filter(p => !nearbyPartners.find(n => n.id === p.id))
              .map(p => (
                <Marker key={p.id} position={[p.lat, p.lng]} icon={partnerIcon}>
                  <Popup minWidth={170}>
                    <p className="font-semibold text-slate-700 text-sm">{p.business_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {getDistanceKm(userLocation[0], userLocation[1], p.lat, p.lng).toFixed(1)} km de você
                    </p>
                    <Link to={createPageUrl(`PartnerStore?id=${p.id}`)}>
                      <Button size="sm" variant="outline" className="w-full mt-2 h-7 text-xs">
                        Ver loja
                      </Button>
                    </Link>
                  </Popup>
                </Marker>
              ))}
          </MapContainer>

          {/* Legend */}
          <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md border border-slate-200 text-xs flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white" />
              <span className="text-slate-600">Você</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
              <span className="text-slate-600">Parceiro próximo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-violet-500 border-2 border-white" />
              <span className="text-slate-600">Outros parceiros</span>
            </div>
          </div>
        </div>
      )}

      {/* List of nearby partners */}
      {userLocation && nearbyPartners.length > 0 && (
        <div className="px-4 py-3">
          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Mais próximos de você</p>
          <div className="space-y-2">
            {nearbyPartners.slice(0, 5).map((p, i) => {
              const avg = avgRatings[p.id];
              return (
                <Link key={p.id} to={createPageUrl(`PartnerStore?id=${p.id}`)}>
                  <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm shrink-0 overflow-hidden">
                      {p.logo_url
                        ? <img src={p.logo_url} alt={p.business_name} className="w-full h-full object-cover" />
                        : p.business_name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{p.business_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {avg && (
                          <span className="flex items-center gap-0.5 text-xs text-amber-500">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {(avg.sum / avg.count).toFixed(1)}
                          </span>
                        )}
                        {productCounts[p.id] > 0 && (
                          <span className="text-xs text-slate-400">{productCounts[p.id]} cupons</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-600">{p.distance.toFixed(1)} km</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {userLocation && nearbyPartners.length === 0 && (
        <div className="py-8 text-center px-4">
          <MapPin className="w-8 h-8 text-slate-200 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Nenhum parceiro em até {maxDistanceKm} km</p>
          <p className="text-xs text-slate-400 mt-1">Tente aumentar o raio de busca</p>
        </div>
      )}
    </div>
  );
}