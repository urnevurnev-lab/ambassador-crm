import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { 
  MapPin, AlertTriangle, CheckCircle2, 
  ArrowRight, History, BarChart3 
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// --- ИНТЕРФЕЙСЫ ---
interface Product { id: number; flavor: string; category: string; line: string; }
interface Visit { id: number; date: string; type: string; comment?: string; user?: { fullName: string }; productsAvailable?: Product[]; }
interface FacilityResponse {
  facility: { id: number; name: string; address: string; lat?: number; lng?: number; visits: Visit[]; };
  currentStock: Product[];
  missingRecommendations?: (Product & { count?: number })[];
  categoryBreakdown?: Record<string, number>;
}

// Умная очистка имени
const cleanName = (name: string) => {
  let cleaned = name.split('(')[0].trim();
  // Если все капсом - делаем красиво (МЯТА -> Мята)
  if (cleaned === cleaned.toUpperCase()) cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  return cleaned;
};

// Цвета для полосок
const LINE_COLORS: Record<string, string> = {
  'Bliss': '#ec4899',      // Розовый
  'White Line': '#94a3b8', // Серый
  'Black Line': '#171717', // Черный
  'Cigar Line': '#d97706', // Янтарный
  'Other': '#6366f1'       // Индиго
};

const FacilityPage: React.FC = () => {
  const { id } = useParams();
  const [data, setData] = useState<FacilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiClient.get<FacilityResponse>(`/api/facilities/${id}`)
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // Данные для линейных графиков
  const stats = useMemo(() => {
      if (!data?.categoryBreakdown) return [];
      const total = Object.values(data.categoryBreakdown).reduce((a: number, b: number) => a + b, 0);
      const base = total === 0 ? 1 : total;
      
      return Object.entries(data.categoryBreakdown).map(([name, value]) => ({
          name, 
          value: value as number, 
          percent: Math.round(((value as number) / base) * 100),
          color: LINE_COLORS[name] || LINE_COLORS['Other']
      })).sort((a, b) => (b.value as number) - (a.value as number));
  }, [data]);

  const groupedMissing = useMemo(() => {
    if (!data?.missingRecommendations) return {};
    return data.missingRecommendations.reduce((acc: Record<string, Product[]>, item: Product) => {
      const line = item.line || 'Другое';
      if (!acc[line]) acc[line] = [];
      acc[line].push(item);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [data]);

  const healthScore = useMemo(() => {
      if (!data) return 0;
      const missingCount = data.missingRecommendations?.length || 0;
      return Math.max(0, 100 - (missingCount * 5));
  }, [data]);

  if (loading || !data) return <Layout><div className="h-screen flex items-center justify-center text-gray-400">Загрузка...</div></Layout>;
  
  const { facility, currentStock } = data;

  return (
    <Layout>
      <PageHeader title={cleanName(facility.name)} back />
      
      <div className="pt-[calc(env(safe-area-inset-top)+60px)] px-4 pb-32 space-y-5 bg-[#F8F9FA]">
        
        {/* Адрес */}
        <div className="flex justify-center">
             <div className="inline-flex items-center px-3 py-1.5 bg-white rounded-full text-xs font-medium text-gray-600 shadow-sm border border-gray-200">
                <MapPin size={14} className="mr-1.5 text-gray-400"/> {facility.address}
             </div>
        </div>

        {/* 3 Главные цифры (РУССКИЕ) */}
        <div className="grid grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-center flex flex-col justify-center h-24">
                <div className="text-[9px] text-gray-400 uppercase font-bold mb-1 tracking-wider leading-tight">Рейтинг<br/>заполненности</div>
                <div className={`text-2xl font-black ${healthScore > 80 ? 'text-green-500' : healthScore > 50 ? 'text-yellow-500' : 'text-red-500'}`}>{healthScore}%</div>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-center flex flex-col justify-center h-24">
                <div className="text-[9px] text-gray-400 uppercase font-bold mb-1 tracking-wider leading-tight">Позиций<br/>в наличии</div>
                <div className="text-2xl font-black text-[#1C1C1E]">{currentStock.length}</div>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm text-center flex flex-col justify-center h-24">
                <div className="text-[9px] text-gray-400 uppercase font-bold mb-1 tracking-wider leading-tight">Всего<br/>визитов</div>
                <div className="text-2xl font-black text-[#1C1C1E]">{facility.visits.length}</div>
            </div>
        </div>

        {/* Карта (Без флага) */}
        {facility.lat && facility.lng && (
            <div className="h-32 w-full rounded-3xl overflow-hidden shadow-sm border border-gray-100 relative z-0">
                 <MapContainer 
                    center={[facility.lat, facility.lng]} 
                    zoom={15} 
                    zoomControl={false} 
                    dragging={false} 
                    attributionControl={false} // Убираем копирайты
                    className="w-full h-full bg-gray-100"
                 >
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                    <Marker position={[facility.lat, facility.lng]} />
                 </MapContainer>
            </div>
        )}

        {/* Полка (Линейные графики) */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-5">
                <BarChart3 size={20} className="text-indigo-600"/>
                <h3 className="font-bold text-gray-900 text-lg">Структура полки</h3>
            </div>
            
            <div className="space-y-4">
                {stats.map(s => (
                    <div key={s.name}>
                        <div className="flex justify-between text-xs font-bold text-gray-700 mb-1.5">
                            <span>{s.name}</span>
                            <span>{s.percent}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }} 
                                animate={{ width: `${s.percent}%` }} 
                                className="h-full rounded-full" 
                                style={{ backgroundColor: s.color }} 
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Рекомендации (Чего нет) */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <AlertTriangle size={20} className="text-orange-500"/>
                    Чего не хватает
                </h3>
            </div>

            {Object.keys(groupedMissing).length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                    <CheckCircle2 size={32} className="text-green-500 mb-2"/>
                    <p className="text-gray-900 font-bold">Полка идеальна!</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {Object.entries(groupedMissing).map(([line, items]) => (
                        <div key={line} className="bg-orange-50/80 rounded-2xl p-3 border border-orange-100/50">
                            <div className="text-[10px] font-bold text-orange-400 uppercase mb-2 tracking-widest">{line}</div>
                            <div className="flex flex-wrap gap-1.5">
                                {items.map(p => (
                                    <span key={p.id} className="text-xs font-semibold text-orange-900 bg-white border border-orange-200 px-2 py-1 rounded shadow-sm">
                                        ⚠️ {cleanName(p.flavor)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* История визитов */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 text-lg mb-5 flex items-center gap-2">
                <History size={20} className="text-gray-400"/>
                История визитов
            </h3>
            
            <div className="space-y-6 relative border-l-2 border-gray-100 ml-2.5">
                {facility.visits.map((v) => (
                    <div key={v.id} className="pl-6 relative">
                        {/* Точка на линии */}
                        <div className="absolute -left-[7px] top-1.5 w-3.5 h-3.5 bg-white border-[3px] border-gray-300 rounded-full"></div>
                        
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="text-sm font-bold text-gray-900">{new Date(v.date).toLocaleDateString('ru-RU')}</div>
                                    <div className="text-xs text-gray-500">{v.type}</div>
                                </div>
                            </div>
                            
                            {/* Комментарий (если есть) */}
                            {v.comment && (
                                <div className="text-xs text-gray-600 italic bg-white p-2 rounded-lg border border-gray-100 mb-2">
                                    "{v.comment}"
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {facility.visits.length === 0 && <div className="pl-6 text-gray-400 text-sm">История пуста</div>}
            </div>
        </div>

      </div>

      {/* Кнопка действия */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t border-gray-100 z-40 pb-[calc(env(safe-area-inset-bottom)+16px)]">
            <Link to={`/visit?facilityId=${facility.id}`}>
                <motion.button whileTap={{ scale: 0.98 }} className="w-full h-16 bg-gradient-to-r from-[#1C1C1E] to-[#111] text-white rounded-2xl font-bold text-lg shadow-2xl flex items-center justify-center gap-2">
                    Начать визит <ArrowRight size={20}/>
                </motion.button>
            </Link>
      </div>
    </Layout>
  );
};

export default FacilityPage;
