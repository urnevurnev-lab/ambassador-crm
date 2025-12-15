import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { MapPin, Briefcase, Package, ShoppingCart, ClipboardList, Car, GraduationCap, Wine } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { FacilityRating } from '../components/FacilityRating';
import { FacilityHistory } from '../components/FacilityHistory';
import { FastOrderWizard } from '../components/FastOrderWizard';
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

            // --- HARDCODED FALLBACK FOR DEMO ---
            let fetchedActs = actRes.data || [];
            if (fetchedActs.length === 0) {
                fetchedActs = [
                    { id: 101, code: 'checkup', name: '🕵️‍♂️ Проверка' },
                    { id: 102, code: 'transit', name: '🚗 Проезд' },
                    { id: 103, code: 'training', name: '🎓 Обучение' },
                    { id: 104, code: 'tasting', name: '🍷 Дегустация' }
                ];
            }
            setActivities(fetchedActs);
        }).finally(() => setLoading(false));
    }, [id]);

    const handleStartActivity = (activityCode: string) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    sessionStorage.setItem('last_geo_lat', position.coords.latitude.toString());
                    sessionStorage.setItem('last_geo_lng', position.coords.longitude.toString());
                },
                () => { }, { enableHighAccuracy: true, timeout: 3000 }
            );
        }
        navigate(`/visit?facilityId=${id}&activity=${activityCode}`);
    };

    const handleOpenOrder = () => {
        setOrderItems(data?.missingRecommendations || []);
        setOrderWizardOpen(true);
    };

    if (loading || !data) return <Layout><div className="h-screen flex items-center justify-center text-gray-400">Загрузка...</div></Layout>;

    const { facility, currentStock, missingRecommendations } = data;
    const missing = missingRecommendations || [];
    const healthScore = Math.max(0, 100 - (missing.length * 5));

    return (
        <Layout>
            <PageHeader title={facility.name} back />

            <div className="pb-32 pt-[calc(env(safe-area-inset-top)+60px)] px-4 space-y-6 bg-[#F2F2F7] min-h-screen">

                {/* 1. Header Info (Gauge) */}
                <div className="flex flex-col items-center justify-center py-4">
                    <FacilityRating score={healthScore} />
                    <div className="mt-2 flex items-center gap-1 text-gray-400 text-xs">
                        <MapPin size={12} /> {facility.address}
                    </div>
                </div>

                {/* 2. Start Work Block - Grid Style */}
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 relative overflow-hidden">
                    <h3 className="font-bold text-xl mb-4 text-[#1C1C1E] relative z-10">Начать работу</h3>

                    <div className="grid grid-cols-2 gap-3 relative z-10">
                        {/* Custom Render for specific activities to match Premium Style */}
                        {activities.map(act => {
                            let Icon = Briefcase;
                            let colorClass = 'bg-gray-100 text-gray-600';

                            if (act.code === 'checkup') { Icon = ClipboardList; colorClass = 'bg-green-100 text-green-600'; }
                            else if (act.code === 'transit') { Icon = Car; colorClass = 'bg-blue-100 text-blue-600'; }
                            else if (act.code === 'training') { Icon = GraduationCap; colorClass = 'bg-purple-100 text-purple-600'; }
                            else if (act.code === 'tasting') { Icon = Wine; colorClass = 'bg-rose-100 text-rose-600'; }

                            // If activity name has emoji, strip it for cleaner look
                            const cleanName = act.name.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

                            return (
                                <motion.button
                                    key={act.id}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleStartActivity(act.code)}
                                    className="bg-white border border-gray-100 p-4 rounded-[24px] flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md transition h-[110px]"
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
                                        <Icon size={20} />
                                    </div>
                                    <span className="text-xs font-bold text-[#1C1C1E] text-center leading-tight">
                                        {cleanName || act.name}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>
                </div>

                {/* 3. Must List / Order Block - Colored Card Style */}
                <motion.div
                    whileTap={{ scale: 0.98 }}
                    onClick={handleOpenOrder}
                    className="bg-black text-white rounded-[32px] p-6 shadow-lg shadow-gray-200 relative overflow-hidden group cursor-pointer"
                >
                    {/* Decor */}
                    <div className="absolute -top-4 -right-4 opacity-10 rotate-12 group-hover:opacity-20 transition-opacity">
                        <ShoppingCart size={100} />
                    </div>

                    <div className="flex justify-between items-start mb-10 relative z-10">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                            <ShoppingCart size={24} />
                        </div>
                        {missing.length > 0 && (
                            <div className="bg-red-500 text-white px-3 py-1 rounded-xl text-xs font-bold shadow-lg shadow-red-500/30">
                                -{missing.length} SKU
                            </div>
                        )}
                    </div>

                    <div className="relative z-10">
                        <h3 className="font-bold text-2xl mb-1">Сверка и Заказ</h3>
                        <p className="text-white/60 text-sm">
                            {missing.length > 0
                                ? 'Есть отсутствующие позиции. Нажмите, чтобы оформить заказ.'
                                : 'Все позиции в наличии. Оформить дозаказ?'}
                        </p>
                    </div>
                </motion.div>

                {/* 4. Current Stock Block - Clean List Style */}
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 relative overflow-hidden min-h-[150px]">
                    <div className="absolute top-0 right-0 p-6 opacity-5 text-gray-400 pointer-events-none">
                        <Package size={80} />
                    </div>

                    <h3 className="font-bold text-xl mb-4 text-[#1C1C1E] relative z-10">Сейчас в заведении</h3>

                    {currentStock.length === 0 ? (
                        <div className="text-center text-gray-400 py-6 text-sm relative z-10">
                            Данных нет. <br />Нужен визит.
                        </div>
                    ) : (
                        <div className="space-y-3 relative z-10">
                            {currentStock.slice(0, 5).map(p => (
                                <div key={p.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl">
                                    <span className="text-sm font-bold text-gray-800">{p.flavor}</span>
                                    <span className="text-[10px] text-gray-500 bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm">{p.line}</span>
                                </div>
                            ))}
                            {currentStock.length > 5 && (
                                <div className="text-center text-xs text-gray-400 mt-2">
                                    и еще {currentStock.length - 5} позиции...
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* History (Link only?) Or Keep it? User didn't explicitly ask for history block but good to have */}
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