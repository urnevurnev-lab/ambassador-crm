import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import apiClient from '../api/apiClient';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { Navigation, Plus } from 'lucide-react';

// Фикс иконок
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
const DefaultIcon = L.icon({ iconRetinaUrl, iconUrl, shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

interface Facility { id: number; name: string; address: string; lat: number; lng: number; }
const MOSCOW_CENTER: [number, number] = [55.7558, 37.6173];

const MapPage: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [search, setSearch] = useState('');
  
  useEffect(() => {
    apiClient.get<Facility[]>('/api/facilities').then(res => setFacilities(res.data)).catch(() => {});
  }, []);

  const validFacilities = facilities.filter(f => f.lat && f.lng && f.lat !== 0);
  const filteredFacilities = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return validFacilities;
    return validFacilities.filter((f) => f.name.toLowerCase().includes(term));
  }, [search, validFacilities]);

  const center = validFacilities[0] ? [validFacilities[0].lat, validFacilities[0].lng] : MOSCOW_CENTER;

  return (
    <Layout>
      <div className="flex flex-col h-full bg-[#F8F9FA] relative">
        <PageHeader
          title="Карта заведений"
          className="bg-white/70 backdrop-blur-xl border-none"
        />

        <div className="flex-1 pt-[calc(env(safe-area-inset-top)+56px)] pb-[calc(env(safe-area-inset-bottom)+100px)]">
          <div className="relative h-full w-full">
            {/* Поиск и счетчик поверх карты */}
            <div className="absolute z-[1000] left-0 right-0 px-4" style={{ top: '14px' }}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск заведения..."
                className="w-full bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl px-4 py-3 text-sm shadow-lg focus:outline-none focus:ring-2 focus:ring-[#007AFF]/30"
              />
              <div className="flex justify-center mt-2 pointer-events-none">
                <div className="bg-white/90 backdrop-blur-md text-[#1C1C1E] px-4 py-2 rounded-full text-xs font-semibold shadow-sm border border-gray-100">
                  Найдено: {filteredFacilities.length}
                </div>
              </div>
            </div>

            <MapContainer
              center={center as [number, number]}
              zoom={11}
              zoomControl={false}
              attributionControl={false}
              className="w-full h-full"
            >
              <TileLayer 
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" 
              />
              {filteredFacilities.map(f => (
                <Marker key={f.id} position={[f.lat, f.lng]}>
                  <Popup>
                    <div className="font-bold text-sm">{f.name}</div>
                    <div className="text-[10px] text-gray-500 mb-2">{f.address}</div>
                    <Link to={`/facility/${f.id}`} className="block text-center bg-[#007AFF] text-white py-1.5 rounded-lg text-xs font-medium">Открыть</Link>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            {/* Новая кнопка добавления точки */}
            <Link
              to="/facility/new"
              className="absolute right-4 z-[1000] flex h-12 w-12 items-center justify-center rounded-full bg-[#007AFF] text-white shadow-lg transition active:scale-90"
              style={{ bottom: 'calc(env(safe-area-inset-bottom) + 150px)' }}
            >
              <Plus size={24} />
            </Link>

            {/* Кнопка навигации (поднята над табом) */}
            <div
              className="absolute right-5 z-[1000]"
              style={{ bottom: 'calc(env(safe-area-inset-bottom) + 90px)' }}
            >
              <button className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-lg border border-gray-100 active:scale-90 transition">
                <Navigation size={20}/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
export default MapPage;
