import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import apiClient from '../api/apiClient';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Link, useNavigate } from 'react-router-dom';
import { X, Plus } from 'lucide-react';
import { Layout } from '../components/Layout';

// Icons fix
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({ iconRetinaUrl, iconUrl, shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

interface Facility { id: number; name: string; address: string; lat: number; lng: number; }
const MOSCOW_CENTER: [number, number] = [55.7558, 37.6173];

const MAP_BOTTOM_OFFSET = 90; // высота нижнего меню

const MapPage: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    apiClient.get<Facility[]>('/api/facilities')
      .then(res => setFacilities(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const validFacilities = facilities.filter(f => f.lat && f.lng && f.lat !== 0);
  const center = validFacilities[0] ? [validFacilities[0].lat, validFacilities[0].lng] as [number, number] : MOSCOW_CENTER;

  return (
    <Layout>
      <div className="relative bg-[#0D0D0F] text-white" style={{ minHeight: `calc(100vh - ${MAP_BOTTOM_OFFSET}px)` }}>
        <div className="relative w-full" style={{ height: `calc(100vh - ${MAP_BOTTOM_OFFSET}px)` }}>
          <MapContainer center={center} zoom={11} zoomControl={false} className="w-full h-full">
            <TileLayer 
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
            />
            {validFacilities.map(f => (
              <Marker key={f.id} position={[f.lat, f.lng]}>
                <Popup>
                  <div className="font-bold">{f.name}</div>
                  <div className="text-xs text-gray-500 mb-2">{f.address}</div>
                  <Link to={`/facility/${f.id}`} className="block text-center bg-black text-white py-1 rounded text-xs">Открыть</Link>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* HEADER OVERLAY */}
          <div className="pointer-events-none absolute top-0 left-0 right-0 p-4 pt-[calc(env(safe-area-inset-top)+10px)] z-30">
              <div className="flex justify-between items-center">
                  <div className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-bold pointer-events-auto border border-white/10 shadow-lg">
                      Карта {loading ? '...' : `(${validFacilities.length})`}
                  </div>
                  <button onClick={() => navigate(-1)} className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-lg pointer-events-auto active:scale-90 transition">
                      <X size={20}/>
                  </button>
              </div>
          </div>

          {/* BOTTOM BUTTON */}
          <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+24px)] right-4 z-30">
              <button className="w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-indigo-500/30 active:scale-90 transition">
                  <Plus size={28}/>
              </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default MapPage;
