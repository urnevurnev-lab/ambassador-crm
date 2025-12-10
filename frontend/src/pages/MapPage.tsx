import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import apiClient from '../api/apiClient';
import { Layout } from '../components/Layout';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { Navigation } from 'lucide-react';

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
  
  useEffect(() => {
    apiClient.get<Facility[]>('/api/facilities').then(res => setFacilities(res.data)).catch(() => {});
  }, []);

  const validFacilities = facilities.filter(f => f.lat && f.lng && f.lat !== 0);
  const center = validFacilities[0] ? [validFacilities[0].lat, validFacilities[0].lng] : MOSCOW_CENTER;

  return (
    <Layout>
      {/* Контейнер карты тянется на всю доступную высоту */}
      <div className="relative w-full h-full z-0">
        
        {/* Хедер поверх карты */}
        <div className="absolute top-14 left-0 right-0 z-[1000] px-4 pointer-events-none">
          <div className="flex justify-between items-center pointer-events-auto">
            <div className="bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-bold border border-white/10 shadow-lg">
              Точек на карте: {validFacilities.length}
            </div>
          </div>
        </div>

        {/* Сама карта */}
        <MapContainer
          center={center as [number, number]}
          zoom={11}
          zoomControl={false}
          className="w-full h-full z-0"
          style={{ minHeight: '100%' }}
        >
          <TileLayer 
              attribution='&copy; CARTO' 
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

        {/* Кнопки управления */}
        <div className="absolute bottom-28 right-4 z-[1000] flex flex-col gap-3">
          <button className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-lg active:scale-90 transition">
            <Navigation size={20}/>
          </button>
        </div>
      </div>
    </Layout>
  );
};
export default MapPage;
