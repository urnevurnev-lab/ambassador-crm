import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { MapPin, Package, ShoppingCart, Briefcase, AlertCircle } from 'lucide-react';
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

    return (
        <Layout>
            <div className="pt-4 pb-4 space-y-4">
                <PageHeader title={facility.name} back />

                {/* 1. Rating & Address Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex flex-col items-center justify-center">
                    <FacilityRating score={healthScore} />
                    <div className="mt-3 flex items-center gap-1.5 text-gray-400 text-sm font-medium">
                        <MapPin size={14} /> 
                        <span className="truncate max-w-[200px]">{facility.address}</span>
                    </div>
                </div>

                {/* 2. Start Work - Unified Card */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 relative overflow-hidden">
                    <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                            <h3 className="font-bold text-lg text-[#1C1C1E]">Начать работу</h3>
                            <p className="text-sm text-gray-500">Выберите действие</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gray-50 text-[#1C1C1E] flex items-center justify-center">
                            <Briefcase size={20} />
                        </div>
                    </div>
                    <FacilityActions
                        activities={activities}
                        onStart={handleStartActivity}
                        showHeader={false}
                        className="space-y-2"
                    />
                </div>

                {/* 3. Smart Order Block */}
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleOpenOrder}
                    className="w-full bg-[#1C1C1E] text-white rounded-2xl p-5 shadow-lg shadow-gray-200 flex items-center justify-between group relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
                        <ShoppingCart size={80} />
                    </div>
                    
                    <div className="relative z-10 text-left">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg">Сверка и Заказ</h3>
                            {missing.length > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    -{missing.length} SKU
                                </span>
                            )}
                        </div>
                        <p className="text-white/60 text-xs">
                            {missing.length > 0 ? 'Есть отсутствующие позиции' : 'Склад полон'}
                        </p>
                    </div>
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center relative z-10">
                        <ShoppingCart size={20} />
                    </div>
                </motion.button>

                {/* 4. Current Stock */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-[#1C1C1E]">На полке</h3>
                        <Package size={20} className="text-gray-300" />
                    </div>

                    {currentStock.length === 0 ? (
                        <div className="text-center py-6">
                            <div className="text-gray-400 text-sm mb-2">Данных пока нет</div>
                            <div className="text-xs text-gray-300">Сделайте визит, чтобы обновить</div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {Object.entries(currentStock.reduce((acc, p) => {
                                const line = p.line || 'Другое';
                                if (!acc[line]) acc[line] = [];
                                acc[line].push(p);
                                return acc;
                            }, {} as Record<string, Product[]>)).map(([line, items]) => (
                                <div key={line}>
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{line}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {items.map(p => (
                                            <span key={p.id} className="text-xs font-medium bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg border border-gray-100">
                                                {p.flavor}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* History */}
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