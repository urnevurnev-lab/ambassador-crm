import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { StandardCard } from '../components/ui/StandardCard';
import { MapPin, ShoppingCart, Truck, Coffee, Users, ClipboardCheck, History, Package } from 'lucide-react';

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
        // Запуск сценария "Сверка и Заказ" (о нем позже, пока заглушка)
        // Логика: МастЛист -> SKU -> Контакты -> Чат
        alert("Запуск модуля Заказа (в разработке)");
        // navigate(`/order-wizard?facilityId=${id}`); 
    };

    if (!data) return <Layout><div className="text-center mt-20">Загрузка...</div></Layout>;
    const { facility, currentStock } = data;

    return (
        <Layout>
            <PageHeader title={facility.name} backTo="/work" />

            <div className="bg-[#F3F4F6] px-4 pb-32 pt-2 space-y-4 min-h-screen">
                
                {/* 1. ИНФО */}
                <StandardCard>
                    <div className="flex items-start gap-3">
                        <MapPin className="text-gray-400 mt-1" size={18} />
                        <div className="text-sm text-gray-600 font-medium">
                            {facility.address || "Адрес не указан"}
                        </div>
                    </div>
                </StandardCard>

                {/* 2. НА ПОЛКЕ (Что мы отгружали в прошлый раз) */}
                <StandardCard title="Числится на полке" icon={Package}>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {currentStock && currentStock.length > 0 ? currentStock.map((p: any) => (
                            <span key={p.id} className="text-xs font-semibold bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg shadow-sm">
                                {p.flavor}
                            </span>
                        )) : (
                            <span className="text-gray-400 text-xs italic">Нет данных о наличии</span>
                        )}
                    </div>
                </StandardCard>

                {/* 3. АКТИВНОСТИ (4 кнопки) */}
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase ml-1 mb-2">Начать работу</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => startVisit('transit')}
                            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                <Truck size={20} />
                            </div>
                            <span className="font-bold text-sm">Проезд</span>
                        </button>

                        <button 
                            onClick={() => startVisit('tasting')}
                            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center">
                                <Coffee size={20} />
                            </div>
                            <span className="font-bold text-sm">Дегустация</span>
                        </button>

                        <button 
                            onClick={() => startVisit('b2b')}
                            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center">
                                <Users size={20} />
                            </div>
                            <span className="font-bold text-sm">B2B</span>
                        </button>

                        <button 
                            onClick={() => startVisit('checkup')}
                            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
                        >
                            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                                <ClipboardCheck size={20} />
                            </div>
                            <span className="font-bold text-sm">Открытая смена</span>
                        </button>
                    </div>
                </div>

                {/* 4. ЗАКАЗ (Отдельно) */}
                <StandardCard 
                    title="Сверка и Заказ" 
                    subtitle="Анализ остатков и заявка"
                    icon={ShoppingCart}
                    onClick={startOrder}
                    showArrow={true}
                    className="border-black/10 bg-gradient-to-r from-gray-900 to-black text-white"
                >
                    <div className="text-white/60 text-xs mt-1">
                        Программа предложит Маст-лист
                    </div>
                </StandardCard>

                {/* 5. ИСТОРИЯ */}
                <StandardCard title="История визитов" icon={History}>
                     <div className="text-gray-400 text-sm py-2">
                         Здесь будет список последних посещений...
                     </div>
                </StandardCard>
            </div>
        </Layout>
    );
};

export default FacilityPage;