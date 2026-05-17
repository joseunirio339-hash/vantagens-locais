import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Star, ExternalLink, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const partnerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 13);
  }, [center, map]);
  return null;
}

export default function PartnersMap({ partners, avgRatings, userLocation }) {
  const [selectedPartner, setSelectedPartner] = useState(null);

  // Only show partners that have geocoded addresses (lat/lng stored) or we geocode by CEP
  // We'll use partners with city info and show them clustered at city level if no precise coords
  const defaultCenter = userLocation || [-15.7942, -47.8822]; // Brazil center

  const partnersWithCoords = partners.filter(p => p.lat && p.lng);

  return (
    <div className="h-[420px] rounded-2xl overflow-hidden border shadow-sm relative">
      <MapContainer
        center={defaultCenter}
        zoom={userLocation ? 13 : 5}
        className="h-full w-full"
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {userLocation && (
          <RecenterMap center={userLocation} />
        )}

        {/* User location marker */}
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="text-center">
                <p className="font-semibold text-blue-600">📍 Sua localização</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Partner markers */}
        {partnersWithCoords.map(partner => {
          const avg = avgRatings[partner.id];
          return (
            <Marker
              key={partner.id}
              position={[partner.lat, partner.lng]}
              icon={partnerIcon}
              eventHandlers={{ click: () => setSelectedPartner(partner) }}
            >
              <Popup>
                <div className="min-w-[180px]">
                  {partner.logo_url && (
                    <img src={partner.logo_url} alt={partner.business_name} className="w-12 h-12 rounded-lg object-cover mb-2 mx-auto" />
                  )}
                  <p className="font-bold text-slate-800 text-sm">{partner.business_name}</p>
                  {partner.address && (
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{partner.address}
                    </p>
                  )}
                  {avg && (
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-semibold">{avg.toFixed(1)}</span>
                    </div>
                  )}
                  <Link to={createPageUrl(`PartnerStore?id=${partner.id}`)}>
                    <Button size="sm" className="w-full mt-2 h-7 text-xs bg-violet-600 hover:bg-violet-700">
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Ver loja
                    </Button>
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* No coordinates notice */}
      {partnersWithCoords.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm pointer-events-none">
          <div className="text-center">
            <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500 font-medium">Nenhum parceiro com localização cadastrada</p>
            <p className="text-xs text-slate-400 mt-1">Os parceiros precisam cadastrar lat/lng no perfil</p>
          </div>
        </div>
      )}
    </div>
  );
}