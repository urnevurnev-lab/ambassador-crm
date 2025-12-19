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
    CheckCircle2,
    ChevronRight,
    Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WebApp from '@twa-dev/sdk';

const FacilityPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [isSelectingActivity, setIsSelectingActivity] = useState(false);

    useEffect(() => {
        apiClient.get(`/api/facilities/${id}`).then(res => setData(res.data));
    }, [id]);

    const startVisit = (type: string) => {
        setIsSelectingActivity(false);
        navigate(`/visit?facilityId=${id}&activity=${type}`);
    };

    const startOrder = () => {
        navigate(`/orders?facilityId=${id}`);
    };

    if (!data) return (
        <Layout>
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-gray-400 font-medium">Загрузка...</p>
            </div>
        </Layout>
    );

    const { facility, currentStock } = data;

    const activities = [
        { id: 'transit', title: 'Проезд', sub: 'Транзит / Чек-ин', icon: Footprints, color: 'bg-blue-500' },
        { id: 'tasting', title: 'Дегустация', sub: 'Работа с гостями', icon: Users, color: 'bg-orange-500' },
        { id: 'b2b', title: 'B2B Визит', sub: 'Переговоры', icon: Briefcase, color: 'bg-purple-500' },
        { id: 'checkup', title: 'Смена', sub: 'Контроль зала', icon: Martini, color: 'bg-teal-500' },
    ];

    return (
        <Layout>
            <div className="space-y-6 pb-32">

                {/* HEADER */}
                <div className="relative pt-4">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate(-1)}
                        className="mb-6 flex items-center gap-2 text-gray-400 font-bold text-xs uppercase tracking-widest"
                    >
                        <ArrowLeft size={16} />
                        Назад
                    </motion.button>

                    <div className="px-1">
                        <motion.h1 className="text-[34px] font-[900] text-gray-900 leading-none tracking-tight">
                            {facility.name}
                        </motion.h1>
                        <div className="flex items-center gap-2 mt-4 text-gray-500 font-semibold text-sm">
                            <MapPin size={16} className="text-blue-500 shrink-0" />
                            <span className="leading-tight">{facility.address || "Адрес не указан"}</span>
                        </div>
                    </div>
                </div>

                {/* ACTION HUB */}
                <div className="space-y-3">
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                            WebApp.HapticFeedback.impactOccurred('medium');
                            setIsSelectingActivity(true);
                        }}
                        className="w-full py-4.5 bg-blue-600 rounded-[24px] text-white flex items-center justify-center gap-3 shadow-[0_15px_30px_rgba(37,99,235,0.2)] relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                        <Play size={20} fill="currentColor" strokeWidth={0} />
                        <span className="text-[16px] font-black uppercase tracking-wider">Начать работу</span>
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={startOrder}
                        className="w-full py-4 bg-white border border-[#C6C6C8]/20 rounded-[22px] text-gray-900 flex items-center justify-center gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
                    >
                        <ShoppingCart size={18} className="text-blue-500" />
                        <span className="text-[15px] font-bold">Сформировать заказ</span>
                    </motion.button>
                </div>

                {/* DETAILS SECTION */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-[18px] font-black text-[#000000]">Состояние</h2>
                    </div>

                    {/* Stock Recap */}
                    <StandardCard title="На полке" color="white" floating={false}>
                        <div className="flex flex-wrap gap-2 mt-4">
                            {currentStock && currentStock.length > 0 ? currentStock.map((p: any) => (
                                <span key={p.id} className="text-[11px] font-black bg-[#F2F2F7] text-gray-900 px-3 py-1.5 rounded-lg border border-gray-100 flex items-center gap-1.5">
                                    <CheckCircle2 size={12} className="text-blue-500" />
                                    {p.flavor}
                                </span>
                            )) : (
                                <div className="flex items-center gap-3 py-2 text-gray-400 text-sm font-medium">
                                    <Package size={18} className="opacity-40" />
                                    Остатки не заполнены
                                </div>
                            )}
                        </div>
                    </StandardCard>

                    {/* History Shortcut */}
                    <motion.div
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(`/visits-history?facilityId=${id}`)}
                        className="bg-white p-5 rounded-[24px] border border-[#C6C6C8]/10 shadow-[0_8px_20px_rgba(0,0,0,0.03)] flex items-center gap-4"
                    >
                        <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                            <History size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-[15px] font-bold text-[#000000]">История визитов</h3>
                            <p className="text-[13px] text-[#8E8E93] font-medium">Прошлые активности</p>
                        </div>
                        <ChevronRight size={20} className="text-[#C6C6C8]" />
                    </motion.div>
                </div>
            </div>

            {/* ACTIVITY SELECTOR BOTTOM SHEET */}
            <AnimatePresence>
                {isSelectingActivity && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsSelectingActivity(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[40px] z-[101] px-6 pt-2 pb-12 shadow-[0_-20px_40px_rgba(0,0,0,0.1)]"
                        >
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-4" />
                            <h2 className="text-[24px] font-[900] text-center mb-8">Что делаем?</h2>

                            <div className="grid grid-cols-1 gap-3">
                                {activities.map((act) => (
                                    <motion.button
                                        key={act.id}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => {
                                            WebApp.HapticFeedback.impactOccurred('light');
                                            startVisit(act.id);
                                        }}
                                        className="flex items-center gap-4 p-5 bg-[#F8F9FB] rounded-[24px] border border-gray-100 transition-colors active:bg-blue-50"
                                    >
                                        <div className={`w-12 h-12 ${act.color} text-white rounded-2xl flex items-center justify-center shadow-lg shadow-black/5`}>
                                            <act.icon size={24} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-[16px] font-black text-gray-900 leading-none">{act.title}</h3>
                                            <p className="text-[13px] text-gray-500 font-bold mt-1.5">{act.sub}</p>
                                        </div>
                                        <ChevronRight size={20} className="ml-auto text-gray-300" />
                                    </motion.button>
                                ))}
                            </div>

                            <button
                                onClick={() => setIsSelectingActivity(false)}
                                className="w-full mt-6 py-4 text-gray-400 font-black text-[13px] uppercase tracking-widest"
                            >
                                Отмена
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </Layout>
    );
};

export default FacilityPage;