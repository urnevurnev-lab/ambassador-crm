import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { MapPin } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { FacilityRating } from '../components/FacilityRating';
import { FacilitySaturation } from '../components/FacilitySaturation';
import { FacilityActions } from '../components/FacilityActions';
import { FacilityMustList } from '../components/FacilityMustList';
import { FacilityHistory } from '../components/FacilityHistory';
import { FastOrderWizard } from '../components/FastOrderWizard';

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

            // --- HARDCODED FALLBACK FOR DEMO IF API IS EMPTY ---
            // User requested: "Проезд, Открытая смена, Дегустация, B2B"
            let fetchedActs = actRes.data || [];
            if (fetchedActs.length === 0) {
                fetchedActs = [
                    { id: 101, code: 'transit', name: 'Проезд' },
                    { id: 102, code: 'open_shift', name: 'Открытая смена' },
                    { id: 103, code: 'tasting', name: 'Дегустация' },
                    { id: 104, code: 'b2b', name: 'B2B' }
                ];
            }
            setActivities(fetchedActs);
        }).catch((err) => {
            console.error(err);
            WebApp.showAlert("Ошибка загрузки данных");
        }).finally(() => setLoading(false));
    }, [id]);

    const handleStartActivity = (activityCode: string) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    sessionStorage.setItem('last_geo_lat', position.coords.latitude.toString());
                    sessionStorage.setItem('last_geo_lng', position.coords.longitude.toString());
                },
                () => { },
                { enableHighAccuracy: true, timeout: 5000 }
            );
        }
        navigate(`/visit?facilityId=${id}&activity=${activityCode}`);
    };

    const handleOpenOrder = (items: Product[]) => {
        setOrderItems(items);
        setOrderWizardOpen(true);
    };

    if (loading || !data) return <Layout><div className="h-screen flex items-center justify-center text-gray-400">Загрузка...</div></Layout>;

    const { facility, currentStock, missingRecommendations } = data;
    const missing = missingRecommendations || [];

    // Scoring logic: 100 - (5 per missing item), min 0
    const healthScore = Math.max(0, 100 - (missing.length * 5));

    return (
        <Layout>
            <PageHeader title={facility.name} back />

            <div className="space-y-5 pb-32 pt-5 bg-[#F8F9FA] min-h-screen">

                {/* Адрес */}
                <div className="flex justify-center text-center">
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin size={14} /> {facility.address}
                    </div>
                </div>

                {/* Сетка: Рейтинг + Насыщенность */}
                <div className="space-y-5">
                    <FacilityRating score={healthScore} />
                    <FacilitySaturation currentStock={currentStock} missing={missing} />
                </div>

                {/* Сценарии работы */}
                <FacilityActions activities={activities} onStart={handleStartActivity} />

                {/* Must List (passed callback to open wizard) */}
                <FacilityMustList missing={missing} onOrder={handleOpenOrder} />

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