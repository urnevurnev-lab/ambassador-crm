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

const FacilityPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [isOrderWizardOpen, setOrderWizardOpen] = useState(false);

    useEffect(() => {
        apiClient.get(`/api/facilities/${id}`).then(res => setData(res.data));
    }, [id]);

    const handleStartActivity = async (code: string) => {
        navigate(`/visit?facilityId=${id}&activity=${code}`);
    };

    if (!data) return <Layout>Loading...</Layout>;
    const { facility, currentStock, missingRecommendations } = data;
    const healthScore = Math.max(0, 100 - ((missingRecommendations || []).length * 5));

    return (
        <Layout>
            <div className="pt-4 px-4 pb-32 space-y-4">
                <PageHeader title={facility.name} back />

                {/* 1. Рейтинг */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-3 text-gray-400 text-sm"><MapPin size={16}/> {facility.address}</div>
                    <div className="flex justify-between items-center">
                        <div className="flex gap-2 items-center"><Star className="text-yellow-400" fill="currentColor"/><span className="text-3xl font-bold">{healthScore}%</span></div>
                        <div className="text-right text-xs font-bold text-gray-400 uppercase">Рейтинг</div>
                    </div>
                    <div className="w-full h-2 bg-gray-50 rounded-full mt-4 overflow-hidden"><div style={{ width: `${healthScore}%` }} className="bg-yellow-400 h-full"/></div>
                </div>

                {/* 2. Сценарии */}
                <FacilityActions 
                    activities={[{id:1, code:'checkup', name:'Открытая смена'}, {id:2, code:'transit', name:'Проезд'}, {id:3, code:'training', name:'B2B'}, {id:4, code:'tasting', name:'Дегустация'}]} 
                    onStart={handleStartActivity} 
                />

                {/* 3. Заказ */}
                <h3 className="font-bold text-lg px-1">Заказ</h3>
                <motion.button whileTap={{ scale: 0.98 }} onClick={() => setOrderWizardOpen(true)} className="w-full bg-white border border-gray-200 rounded-[20px] p-4 shadow-sm flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 bg-[#1C1C1E] rounded-xl flex items-center justify-center text-white"><ShoppingCart /></div>
                        <div className="text-left"><div className="font-bold">Сверка и Заказ</div><div className="text-xs text-gray-400">Склад</div></div>
                    </div>
                </motion.button>

                {/* 4. Полка */}
                <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100">
                    <div className="flex justify-between mb-4"><h3 className="font-bold text-lg">На полке</h3><Package className="text-gray-300"/></div>
                    <div className="flex flex-wrap gap-2">
                        {currentStock.map((p: any) => <span key={p.id} className="text-xs font-bold bg-gray-50 px-3 py-1.5 rounded-lg">{p.flavor}</span>)}
                    </div>
                </div>

                <FacilityHistory visits={facility.visits} />
            </div>
            <FastOrderWizard isOpen={isOrderWizardOpen} onClose={() => setOrderWizardOpen(false)} facilityId={Number(id)} items={missingRecommendations || []} />
        </Layout>
    );
};
export default FacilityPage;