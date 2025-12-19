import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Layout } from '../components/Layout';
import { StandardCard } from '../components/ui/StandardCard';
import {
    MapPin,
    ShoppingCart,
    Footprints,
    Users,
    Briefcase,
    Martini,
    History,
    Package,
    ArrowLeft,
    ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const FacilityPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        apiClient.get(`/api/facilities/${id}`).then(res => setData(res.data));
    }, [id]);

    const startVisit = (type: string) => {
        navigate(`/visit?facilityId=${id}&activity=${type}`);
    };

    const startOrder = () => {
        navigate(`/orders?facilityId=${id}`);
    };

    if (!data) return (
        <Layout>
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-gray-400 font-medium">Загрузка заведения...</p>
            </div>
        </Layout>
    );

    const { facility, currentStock } = data;

    return (
        <Layout>
            <div className="space-y-6 pb-12">

                {/* ШАПКА ЗАВЕДЕНИЯ */}
                <div className="relative">
                    <motion.button
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => navigate(-1)}
                        className="mb-4 flex items-center gap-2 text-gray-400 font-bold text-sm uppercase tracking-widest hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Назад
                    </motion.button>

                    <div className="px-1">
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-[34px] font-extrabold text-gray-900 leading-tight tracking-tight"
                        >
                            {facility.name}
                        </motion.h1>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="flex items-center gap-2 mt-3 text-gray-500 font-medium bg-white w-fit px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm"
                        >
                            <MapPin size={16} className="text-blue-500" />
                            <span className="text-sm">{facility.address || "Адрес не указан"}</span>
                        </motion.div>
                    </div>
                </div>

                {/* СЕТКА ДЕЙСТВИЙ (Standard Bento Grid) */}
                <div className="grid grid-cols-2 gap-4">

                    {/* ПРОЕЗД (Royal Blue) */}
                    <StandardCard
                        title="Проезд"
                        subtitle="Транзит / Чек-ин"
                        color="blue"
                        onClick={() => startVisit('transit')}
                        className="h-[180px]"
                        illustration={
                            <Footprints size={120} className="text-white opacity-25" />
                        }
                    />

                    {/* ДЕГУСТАЦИЯ (Warm Coral) */}
                    <StandardCard
                        title="Дегустация"
                        subtitle="Работа с гостями"
                        color="coral"
                        onClick={() => startVisit('tasting')}
                        className="h-[180px]"
                        illustration={
                            <Users size={110} className="text-white opacity-25" />
                        }
                    />

                    {/* B2B (Deep Iris) */}
                    <StandardCard
                        title="B2B Визит"
                        subtitle="Переговоры"
                        color="purple"
                        onClick={() => startVisit('b2b')}
                        className="h-[180px]"
                        illustration={
                            <Briefcase size={110} className="text-white opacity-25" />
                        }
                    />

                    {/* СМЕНА (Fresh Teal) */}
                    <StandardCard
                        title="Смена"
                        subtitle="Контроль зала"
                        color="teal"
                        onClick={() => startVisit('checkup')}
                        className="h-[180px]"
                        illustration={
                            <Martini size={110} className="text-white opacity-25" />
                        }
                    />
                </div>

                {/* ЗАКАЗ (Premium White) */}
                <StandardCard
                    title="Сформировать Заказ"
                    subtitle="Анализ полки и новая заявка"
                    color="white"
                    icon={ShoppingCart}
                    showArrow
                    onClick={startOrder}
                    floating={false}
                    action={
                        <div className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest border border-blue-100">
                            Action
                        </div>
                    }
                />

                {/* НА ПОЛКЕ (White) */}
                <StandardCard title="На полке" color="white" floating={false}>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {currentStock && currentStock.length > 0 ? currentStock.map((p: any) => (
                            <span key={p.id} className="text-xs font-bold bg-gray-50 text-gray-600 px-3 py-2 rounded-xl border border-gray-100 shadow-sm">
                                {p.flavor}
                            </span>
                        )) : (
                            <div className="flex items-center gap-3 py-2 text-gray-400 text-sm font-medium">
                                <Package size={18} className="opacity-40" />
                                Еще не заполняли остатки
                            </div>
                        )}
                    </div>
                </StandardCard>

                {/* ИСТОРИЯ (White) */}
                <StandardCard
                    title="История визитов"
                    subtitle="Прошлые активности"
                    color="white"
                    icon={History}
                    floating={false}
                    onClick={() => navigate(`/visits-history?facilityId=${id}`)}
                    action={
                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                            <ChevronRight size={18} className="text-gray-300" />
                        </div>
                    }
                />
            </div>
        </Layout>
    );
};

export default FacilityPage;