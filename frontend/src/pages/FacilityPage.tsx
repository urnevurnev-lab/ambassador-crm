import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { MapPin, Package, ShoppingCart, Briefcase } from 'lucide-react';
import { FacilityRating } from '../components/FacilityRating';
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

            // --- HARDCODED FALLBACK FOR DEMO ---
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
        // Request geolocation first and wait for it
        const getGeoPosition = (): Promise<{ lat: number; lng: number }> => {
            return new Promise((resolve) => {
                if (!navigator.geolocation) {
                    resolve({ lat: 0, lng: 0 });
                    return;
                }
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        });
                    },
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

    if (loading || !data) return <Layout><div className="h-screen flex items-center justify-center text-gray-400">Загрузка...</div></Layout>;

    const { facility, currentStock, missingRecommendations } = data;
    const missing = missingRecommendations || [];
    const healthScore = Math.max(0, 100 - (missing.length * 5));

    return (
        <Layout>
            <PageHeader title={facility.name} back />

            <div className="pb-[calc(env(safe-area-inset-bottom)+128px)] pt-[calc(env(safe-area-inset-top)+60px)] px-4 space-y-6 bg-[#F2F2F7] min-h-screen">

                {/* 1. Header Info (Gauge) */}
                <div className="flex flex-col items-center justify-center py-4">
                    <FacilityRating score={healthScore} />
                    <div className="mt-2 flex items-center gap-1 text-gray-400 text-xs">
                        <MapPin size={12} /> {facility.address}
                    </div>
                </div>

                {/* 2. Start Work Block - Unified Card Style */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 relative overflow-hidden">
                    <div className="absolute -top-16 -right-10 w-40 h-40 bg-emerald-50 blur-3xl opacity-70" />
                    <div className="absolute -bottom-10 -left-16 w-48 h-48 bg-blue-50 blur-3xl opacity-60" />

                    <div className="relative z-10 flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[11px] uppercase tracking-wide text-gray-500">Сценарии работы</p>
                            <h3 className="font-bold text-xl text-[#1C1C1E] mt-1">Начать работу</h3>
                            <p className="text-sm text-gray-500 mt-1">Выберите сценарий и отметьте визит в пару тапов.</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-[#1C1C1E] text-white flex items-center justify-center shadow-sm">
                            <Briefcase size={22} />
                        </div>
                    </div>

                    <div className="relative z-10 mt-4">
                        <FacilityActions
                            activities={activities}
                            onStart={handleStartActivity}
                            showHeader={false}
                            className="space-y-2"
                        />
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

                {/* 4. Current Stock Block - Grouped by Line */}
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
                        <div className="space-y-4 relative z-10">
                            {(() => {
                                // Group by line
                                const byLine = currentStock.reduce((acc, p) => {
                                    const line = p.line || 'Другое';
                                    if (!acc[line]) acc[line] = [];
                                    acc[line].push(p);
                                    return acc;
                                }, {} as Record<string, typeof currentStock>);

                                return Object.entries(byLine).map(([line, items]) => (
                                    <div key={line}>
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{line}</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {items.map(p => (
                                                <span
                                                    key={p.id}
                                                    className="text-xs font-medium bg-gray-50 text-gray-700 px-3 py-1.5 rounded-xl border border-gray-100"
                                                >
                                                    {p.flavor}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ));
                            })()}
                            <div className="text-center text-[10px] text-gray-300 mt-2">
                                Всего {currentStock.length} позиций в наличии
                            </div>
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
