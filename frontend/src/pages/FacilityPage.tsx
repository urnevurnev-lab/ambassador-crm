import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { motion } from 'framer-motion';
import { MapPin, AlertTriangle, CheckCircle2, History, Play } from 'lucide-react';
import WebApp from '@twa-dev/sdk';

// --- Interfaces ---
interface Product { id: number; flavor: string; category: string; line: string; }
interface Visit { id: number; date: string; type: string; comment?: string; }
interface Activity { id: number; code: string; name: string; }
interface FacilityResponse {
  facility: { id: number; name: string; address: string; lat?: number; lng?: number; visits: Visit[]; };
  currentStock: Product[];
  missingRecommendations?: (Product & { count?: number })[];
  categoryBreakdown?: Record<string, number>;
}

const FacilityPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<FacilityResponse | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // Загружаем данные заведения и список активностей
  useEffect(() => {
    Promise.all([
        apiClient.get<FacilityResponse>(`/api/facilities/${id}`),
        apiClient.get<Activity[]>('/api/activities')
    ]).then(([facRes, actRes]) => {
        setData(facRes.data);
        setActivities(actRes.data || []);
    }).catch((err) => {
        console.error(err);
        WebApp.showAlert("Ошибка загрузки данных");
    }).finally(() => setLoading(false));
  }, [id]);

  // Обработчик начала активности (Фоновая Геопозиция)
  const handleStartActivity = (activityCode: string) => {
    // 1. Пытаемся тихо получить геопозицию
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // В будущем: отправляем координаты на бэкенд для проверки
                console.log("Geo captured:", position.coords);
                // Можно сохранить в sessionStorage, чтобы подставить в форму визита
                sessionStorage.setItem('last_geo_lat', position.coords.latitude.toString());
                sessionStorage.setItem('last_geo_lng', position.coords.longitude.toString());
            },
            (error) => {
                console.warn("Geo access failed:", error);
                // Не блокируем работу, просто фиксируем факт отсутствия гео (если нужно)
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    }

    // 2. Переходим к сценарию
    navigate(`/visit?facilityId=${id}&activity=${activityCode}`);
  };

  if (loading || !data) return <Layout><div className="h-screen flex items-center justify-center text-gray-400">Загрузка...</div></Layout>;
  
  const { facility, currentStock } = data;
  const healthScore = Math.max(0, 100 - ((data.missingRecommendations?.length || 0) * 5));

  return (
    <Layout>
      <PageHeader title={facility.name} back />
      
      <div className="pt-[calc(env(safe-area-inset-top)+60px)] px-4 pb-32 space-y-5 bg-[#F8F9FA] min-h-screen">
        
        {/* Адрес */}
        <div className="flex justify-center text-center">
             <div className="text-sm text-gray-500 flex items-center gap-1">
                <MapPin size={14}/> {facility.address}
             </div>
        </div>

        {/* Ключевые показатели */}
        <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                <div className="text-xs text-gray-400 uppercase font-bold mb-1">Рейтинг</div>
                <div className={`text-3xl font-black ${healthScore > 80 ? 'text-green-500' : 'text-orange-500'}`}>
                    {healthScore}%
                </div>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                <div className="text-xs text-gray-400 uppercase font-bold mb-1">На полке</div>
                <div className="text-3xl font-black text-[#1C1C1E]">{currentStock.length} SKU</div>
            </div>
        </div>

        {/* Сценарии работы (Динамические кнопки) */}
        <div>
            <h3 className="font-bold text-[#1C1C1E] mb-3 px-1">Начать работу</h3>
            <div className="grid grid-cols-1 gap-3">
                {activities.map(act => (
                    <motion.button
                        key={act.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleStartActivity(act.code)}
                        className="bg-[#1C1C1E] text-white p-4 rounded-2xl flex items-center justify-between shadow-lg"
                    >
                        <span className="font-semibold">{act.name}</span>
                        <Play size={20} fill="currentColor" />
                    </motion.button>
                ))}
                {activities.length === 0 && (
                    <div className="text-gray-400 text-sm text-center py-4 bg-white rounded-2xl">Нет доступных сценариев</div>
                )}
            </div>
        </div>

        {/* Рекомендации (Чего нет) - Оставили как есть */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2 mb-4">
                <AlertTriangle size={20} className="text-orange-500"/>
                Чего не хватает
            </h3>
            {(!data.missingRecommendations || data.missingRecommendations.length === 0) ? (
                <div className="text-center py-4 text-green-600 font-medium flex flex-col items-center">
                    <CheckCircle2 className="mb-2"/> Полка укомплектована
                </div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {data.missingRecommendations.map((p, i) => (
                        <span key={i} className="text-xs font-bold text-orange-800 bg-orange-100 px-2 py-1 rounded-lg">
                            {p.flavor}
                        </span>
                    ))}
                </div>
            )}
        </div>

        {/* История (последние 3) */}
        <div className="space-y-3">
            <h3 className="font-bold text-[#1C1C1E] px-1">История</h3>
            {facility.visits.slice(0, 3).map((v) => (
                <div key={v.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                    <div>
                        <div className="text-sm font-bold text-[#1C1C1E]">{new Date(v.date).toLocaleDateString('ru-RU')}</div>
                        <div className="text-xs text-gray-500">{v.type}</div>
                    </div>
                    <History size={16} className="text-gray-300"/>
                </div>
            ))}
        </div>
      </div>
    </Layout>
  );
};

export default FacilityPage;