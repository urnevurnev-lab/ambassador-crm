import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Layout } from '../components/Layout';
import { StandardCard } from '../components/ui/StandardCard';
import { 
  MapPin, 
  ShoppingCart, 
  Footprints, // Ноги
  Users,      // Люди
  Briefcase,  // Профи (B2B)
  Martini,    // Бар/Кальян (Атмосфера)
  History, 
  Package,
  ArrowLeft
} from 'lucide-react';

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
        alert("Запуск модуля Заказа (в разработке)");
    };

    if (!data) return (
        <Layout>
            <div className="flex items-center justify-center h-screen text-gray-400">
                Загрузка данных...
            </div>
        </Layout>
    );

    const { facility, currentStock } = data;

    return (
        <Layout>
            <div className="bg-[#F8F9FE] min-h-screen px-4 pb-32 pt-4 space-y-5">
                
                {/* 1. ШАПКА ЗАВЕДЕНИЯ */}
                <div className="relative">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="absolute -top-2 -left-2 p-2 text-gray-400 hover:text-gray-900 z-20"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    
                    <div className="pt-8 px-2 mb-2">
                        <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
                            {facility.name}
                        </h1>
                        <div className="flex items-center gap-2 mt-2 text-gray-500 font-medium">
                            <MapPin size={16} className="text-blue-500" />
                            <span className="text-sm">{facility.address || "Адрес не указан"}</span>
                        </div>
                    </div>
                </div>

                {/* 2. СЕТКА ДЕЙСТВИЙ (Bento Grid) */}
                <div className="grid grid-cols-2 gap-3">
                    
                    {/* ПРОЕЗД (Синий - Ноги) */}
                    <StandardCard
                        title="Проезд"
                        subtitle="Быстрый чек-ин"
                        color="blue"
                        onClick={() => startVisit('transit')}
                        className="h-[140px]"
                        illustration={
                            <Footprints size={110} className="text-white opacity-20 -rotate-12 translate-x-4" />
                        }
                    />

                    {/* ДЕГУСТАЦИЯ (Оранжевый - Люди) */}
                    <StandardCard
                        title="Дегустация"
                        subtitle="Работа с гостями"
                        color="coral" // Оранжево-коралловый
                        onClick={() => startVisit('tasting')}
                        className="h-[140px]"
                        illustration={
                            <Users size={100} className="text-white opacity-20 rotate-6 translate-x-2" />
                        }
                    />

                    {/* B2B (Фиолетовый - Профессионалы/Кейс) */}
                    <StandardCard
                        title="B2B Визит"
                        subtitle="Переговоры"
                        color="purple"
                        onClick={() => startVisit('b2b')}
                        className="h-[140px]"
                        illustration={
                            <Briefcase size={100} className="text-white opacity-20 -rotate-6 translate-y-2" />
                        }
                    />

                    {/* ОТКРЫТАЯ СМЕНА (Тил - Бар/Кальян) */}
                    <StandardCard
                        title="Смена"
                        subtitle="Работа в зале"
                        color="teal"
                        onClick={() => startVisit('checkup')}
                        className="h-[140px]"
                        illustration={
                            <Martini size={100} className="text-white opacity-20 rotate-12 translate-x-2" />
                        }
                    />
                </div>

                {/* 3. ЗАКАЗ (Белая кнопка) */}
                <StandardCard 
                    title="Сформировать Заказ" 
                    subtitle="Анализ остатков и заявка"
                    color="white"
                    icon={ShoppingCart}
                    showArrow
                    onClick={startOrder}
                    floating={false}
                />

                {/* 4. ИНФО О ПОЛКЕ */}
                <StandardCard title="На полке" color="white" floating={false}>
                    <div className="flex flex-wrap gap-2 mt-3">
                        {currentStock && currentStock.length > 0 ? currentStock.map((p: any) => (
                            <span key={p.id} className="text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200">
                                {p.flavor}
                            </span>
                        )) : (
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <Package size={16} /> Нет данных
                            </div>
                        )}
                    </div>
                </StandardCard>

                {/* 5. ИСТОРИЯ */}
                <StandardCard 
                    title="История" 
                    subtitle="Последние активности"
                    color="white"
                    icon={History}
                    floating={false}
                    showArrow
                />
            </div>
        </Layout>
    );
};

export default FacilityPage;