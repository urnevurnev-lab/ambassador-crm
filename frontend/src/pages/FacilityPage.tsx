import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { MapPin, Package, ShoppingCart, Star } from 'lucide-react';
import { FacilityHistory } from '../components/FacilityHistory';
import { FastOrderWizard } from '../components/FastOrderWizard';
import { FacilityActions } from '../components/FacilityActions';
import { motion } from 'framer-motion';

// --- Interfaces ---
export interface Product { id: number; flavor: string; category: string; line: string; }
interface Visit { id: number; date: string; type: string; comment?: string; summary?: string[]; }
interface Activity { id: number; code: string; name: string; }
interface FacilityResponse {
    facility: { id: number; name: string; address: string; lat?: number; lng?: number; visits: Visit[]; };
    currentStock: Product[];
    missingRecommendations?: Product[];
    categoryBreakdown?: Record<string, number>;
}

const FacilityPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState<FacilityResponse | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOrderWizardOpen, setOrderWizardOpen] = useState(false);
    const [orderItems, setOrderItems] = useState<Product[]>([]);

    useEffect(() => {
        Promise.all([
            apiClient.get<FacilityResponse>(`/api/facilities/${id}`),
            apiClient.get<Activity[]>('/api/activities')
        ]).then(([facRes, actRes]) => {
            setData(facRes.data);
            let fetchedActs = actRes.data || [];
            if (fetchedActs.length === 0) {
                fetchedActs = [
                    { id: 101, code: 'checkup', name: 'Открытая смена' },
                    { id: 102, code: 'transit', name: 'Проезд' },
                    { id: 103, code: 'training', name: 'Обучение' },
                    { id: 104, code: 'tasting', name: 'Дегустация' }
                ];
            }
            setActivities(fetchedActs);
        }).finally(() => setLoading(false));
    }, [id]);

    const handleStartActivity = async (activityCode: string) => {
        const getGeoPosition = (): Promise<{ lat: number; lng: number }> => {
            return new Promise((resolve) => {
                if (!navigator.geolocation) {
                    resolve({ lat: 0, lng: 0 });
                    return;
                }
                navigator.geolocation.getCurrentPosition(
                    (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
                    () => resolve({ lat: 0, lng: 0 }),
                    { enableHighAccuracy: true, timeout: 5000 }
                );
            });
        };
        const { lat, lng } = await getGeoPosition();
        sessionStorage.setItem('last_geo_lat', lat.toString());
        sessionStorage.setItem('last_geo_lng', lng.toString());
        navigate(`/visit?facilityId=${id}&activity=${activityCode}`);
    };

    const handleOpenOrder = () => {
        setOrderItems(data?.missingRecommendations || []);
        setOrderWizardOpen(true);
    };

    if (loading || !data) return <Layout><div className="h-full flex items-center justify-center text-gray-400">Загрузка...</div></Layout>;

    const { facility, currentStock, missingRecommendations } = data;
    const missing = missingRecommendations || [];
    const healthScore = Math.max(0, 100 - (missing.length * 5));
    const ratingColor = healthScore > 80 ? 'text-green-500' : healthScore > 50 ? 'text-yellow-500' : 'text-red-500';
    const ratingBg = healthScore > 80 ? 'bg-green-500' : healthScore > 50 ? 'bg-yellow-500' : 'bg-red-500';

    return (
        <Layout>
            {/* ГЛАВНЫЙ КОНТЕЙНЕР ОТСТУПОВ */}
            {/* pt-4: Отступ сверху (чтобы рейтинг не лип к хедеру) */}
            {/* px-4: Единый отступ по бокам для всей страницы */}
            {/* pb-32: Отступ снизу для таббара */}
            <div className="pt-4 px-4 pb-32 space-y-4">
                
                {/* Хедер с кнопкой Назад */}
                <PageHeader title={facility.name} back />

                {/* 1. Рейтинг и Адрес (Карточка) */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                        <MapPin size={16} className="text-gray-400 shrink-0" /> 
                        <span className="text-sm font-medium text-gray-500 truncate">{facility.address}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Star size={24} className={ratingColor} fill="currentColor" />
                            <span className="text-3xl font-bold text-[#1C1C1E]">{healthScore}%</span>
                        </div>
                        <div className="text-right">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Рейтинг</div>
                            <div className="text-[10px] text-gray-300">Наполненность</div>
                        </div>
                    </div>
                    
                    {/* Полоска прогресса */}
                    <div className="w-full h-2 bg-gray-50 rounded-full mt-4 overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${healthScore}%` }} 
                            className={`h-full ${ratingBg}`}
                        />
                    </div>
                </div>

                {/* 2. Сценарии работы */}
                {/* Теперь внутри FacilityActions у нас красивые карточки, 
                    а отступы контролирует родительский div (px-4) */}
                <FacilityActions
                    activities={activities}
                    onStart={handleStartActivity}
                    showHeader={true}
                />

                {/* 3. Кнопка Заказа */}
                <div>
                    <h3 className="font-bold text-[#1C1C1E] text-lg mb-3 px-1">Заказ</h3>
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleOpenOrder}
                        className="w-full bg-white text-[#1C1C1E] border border-gray-200 rounded-[20px] p-4 shadow-sm flex items-center justify-between group relative overflow-hidden active:border-blue-500 transition-all"
                    >
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 bg-[#1C1C1E] rounded-2xl flex items-center justify-center text-white shadow-md">
                                <ShoppingCart size={24} />
                            </div>
                            <div className="text-left">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-[15px]">Сверка и Заказ</h3>
                                    {missing.length > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                            -{missing.length}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {missing.length > 0 ? 'Есть отсутствующие позиции' : 'Склад полон'}
                                </p>
                            </div>
                        </div>
                    </motion.button>
                </div>

                {/* 4. На полке */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-[#1C1C1E]">На полке</h3>
                        <Package size={20} className="text-gray-300" />
                    </div>
                    
                    {/* ... (код списка продуктов без изменений) ... */}
                    {currentStock.length === 0 ? (
                        <div className="text-center py-6 text-gray-400 text-xs">Данных нет</div>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(currentStock.reduce((acc, p) => {
                                const line = p.line || 'Другое';
                                if (!acc[line]) acc[line] = [];
                                acc[line].push(p);
                                return acc;
                            }, {} as Record<string, Product[]>)).map(([line, items]) => (
                                <div key={line}>
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2">{line}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {items.map(p => (
                                            <span key={p.id} className="text-xs font-bold bg-gray-50 text-gray-600 px-3 py-1.5 rounded-lg border border-gray-100">
                                                {p.flavor}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* История */}
                <FacilityHistory visits={facility.visits} />
            </div>

            <FastOrderWizard
                isOpen={isOrderWizardOpen}
                onClose={() => setOrderWizardOpen(false)}
                facilityId={Number(id)}
                items={orderItems}
            />
        </Layout>
    );
};

export default FacilityPage;
