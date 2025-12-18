import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { X, Check, Search, Clock, Users, MessageSquare, MapPin } from 'lucide-react';
import WebApp from '@twa-dev/sdk';

const VisitWizard: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // Параметры запуска
    const facilityId = Number(searchParams.get('facilityId'));
    const activityCode = searchParams.get('activity') || 'checkup';

    const [loading, setLoading] = useState(true);
    const [visitId, setVisitId] = useState<number | null>(null);
    const [products, setProducts] = useState<any[]>([]);
    
    // Глобальный стейт формы
    const [formData, setFormData] = useState({
        // Checkup (Открытая смена)
        startTime: '',
        endTime: '',
        cups: '',
        guestFeedback: '',
        
        // Tasting (Дегустация) & Training (B2B)
        contacts: '', // Кто пришел / Кто присутствовал
        reviews: '',  // Отзывы людей (для дегустации)
        
        // Transit (Проезд)
        productsAvailable: [] as number[], // SKU на полке
        
        // General
        comment: '',
    });

    // Для поиска продуктов в Проезде
    const [searchTerm, setSearchTerm] = useState('');

    // 1. Инициализация
    useEffect(() => {
        const init = async () => {
            try {
                // Грузим продукты
                const pRes = await apiClient.get('/api/products');
                setProducts(pRes.data || []);

                // Берем гео
                const userId = WebApp.initDataUnsafe?.user?.id;
                const lat = sessionStorage.getItem('last_geo_lat');
                const lng = sessionStorage.getItem('last_geo_lng');

                // Создаем черновик визита
                const res = await apiClient.post('/api/visits', {
                    facilityId,
                    type: activityCode,
                    userId: userId || 1, 
                    userLat: lat ? parseFloat(lat) : 0,
                    userLng: lng ? parseFloat(lng) : 0,
                    status: 'IN_PROGRESS'
                });
                
                setVisitId(res.data.id);
            } catch (e) {
                console.error("Visit init error", e);
                // Если ошибка — возвращаем назад, чтобы не висеть на белом экране
                alert("Не удалось начать визит. Проверьте интернет.");
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    // 2. Сохранение и выход
    const handleFinish = async () => {
        if (!visitId) return;
        setLoading(true);
        try {
            await apiClient.patch(`/api/visits/${visitId}`, { 
                status: 'COMPLETED', 
                endedAt: new Date(),
                comment: formData.comment || formData.guestFeedback || formData.reviews, // Основной коммент
                data: { ...formData } // Все поля сохраняем в JSON
            });
            navigate(-1); 
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    // --- ЛОГИКА СЦЕНАРИЕВ ---

    // 1. ОТКРЫТАЯ СМЕНА (Checkup)
    const renderCheckup = () => (
        <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-emerald-600" /> 
                    Смена
                </h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Начало</label>
                        <input type="time" className="w-full bg-gray-50 rounded-xl p-3 mt-1 font-medium text-[#1C1C1E] outline-none focus:ring-2 ring-emerald-100" 
                            value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Конец</label>
                        <input type="time" className="w-full bg-gray-50 rounded-xl p-3 mt-1 font-medium text-[#1C1C1E] outline-none focus:ring-2 ring-emerald-100" 
                            value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                    </div>
                </div>
                <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Отдали чашек</label>
                    <input type="number" placeholder="0" className="w-full bg-gray-50 rounded-xl p-3 mt-1 font-bold text-lg outline-none focus:ring-2 ring-emerald-100" 
                        value={formData.cups} onChange={e => setFormData({...formData, cups: e.target.value})} />
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <MessageSquare size={20} className="text-emerald-600" />
                    Гости
                </h3>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Обратная связь</label>
                <textarea className="w-full bg-gray-50 rounded-xl p-3 mt-2 min-h-[120px] outline-none focus:ring-2 ring-emerald-100 resize-none" 
                    placeholder="Что говорят гости? Понравилось/не понравилось..."
                    value={formData.guestFeedback} onChange={e => setFormData({...formData, guestFeedback: e.target.value})} 
                />
            </div>
        </div>
    );

    // 2. ДЕГУСТАЦИЯ (Tasting)
    const renderTasting = () => (
        <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Users size={20} className="text-rose-600" />
                    Участники
                </h3>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Кто пришел?</label>
                <input type="text" placeholder="Имена / Контакты" className="w-full bg-gray-50 rounded-xl p-3 mt-2 outline-none focus:ring-2 ring-rose-100" 
                    value={formData.contacts} onChange={e => setFormData({...formData, contacts: e.target.value})} />
            </div>
            
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                    <MessageSquare size={20} className="text-rose-600" />
                    Фидбек
                </h3>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Отзывы людей</label>
                <textarea className="w-full bg-gray-50 rounded-xl p-3 mt-2 min-h-[150px] outline-none focus:ring-2 ring-rose-100 resize-none" 
                    placeholder="Реакция на вкусы, комментарии..."
                    value={formData.reviews} onChange={e => setFormData({...formData, reviews: e.target.value})} 
                />
            </div>
        </div>
    );

    // 3. B2B (Training)
    const renderTraining = () => (
        <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Users size={20} className="text-purple-600" />
                    Участники B2B
                </h3>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Кто присутствовал?</label>
                <input type="text" placeholder="Сотрудники / ЛПР" className="w-full bg-gray-50 rounded-xl p-3 mt-2 outline-none focus:ring-2 ring-purple-100" 
                    value={formData.contacts} onChange={e => setFormData({...formData, contacts: e.target.value})} />
            </div>
            
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Комментарий / Итоги</label>
                <textarea className="w-full bg-gray-50 rounded-xl p-3 mt-2 min-h-[150px] outline-none focus:ring-2 ring-purple-100 resize-none" 
                    placeholder="О чем договорились? Как прошло обучение?"
                    value={formData.comment} onChange={e => setFormData({...formData, comment: e.target.value})} 
                />
            </div>
        </div>
    );

    // 4. ПРОЕЗД (Transit) - с ПОИСКОМ
    const renderTransit = () => {
        // Фильтрация продуктов
        const filteredProducts = products.filter(p => 
            p.flavor.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (p.line && p.line.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        const toggleProduct = (id: number) => {
            setFormData(prev => {
                const current = prev.productsAvailable;
                const updated = current.includes(id) 
                    ? current.filter(pid => pid !== id) 
                    : [...current, id];
                return { ...prev, productsAvailable: updated };
            });
        };

        return (
            <div className="space-y-4">
                {/* Гео метка */}
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm">
                        <MapPin size={20} />
                    </div>
                    <div>
                        <div className="font-bold text-blue-900 text-sm">Чек-ин выполнен</div>
                        <div className="text-blue-600 text-xs opacity-80">Геопозиция сохранена</div>
                    </div>
                </div>

                {/* SKU Search */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 min-h-[300px]">
                    <h3 className="font-bold text-lg mb-4">Наличие SKU</h3>
                    
                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Поиск вкуса..." 
                            className="w-full bg-gray-50 rounded-xl pl-10 pr-4 py-3 text-sm font-medium outline-none focus:ring-2 ring-blue-100 transition-all"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* List */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {filteredProducts.map(p => {
                            const isSelected = formData.productsAvailable.includes(p.id);
                            return (
                                <div key={p.id} onClick={() => toggleProduct(p.id)}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer active:scale-[0.98] ${isSelected ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-gray-100'}`}
                                >
                                    <div>
                                        <div className={`font-bold text-sm ${isSelected ? 'text-blue-700' : 'text-[#1C1C1E]'}`}>{p.flavor}</div>
                                        <div className="text-[10px] text-gray-400 font-bold uppercase">{p.line}</div>
                                    </div>
                                    {isSelected && (
                                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white animate-in zoom-in duration-200">
                                            <Check size={14} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {filteredProducts.length === 0 && (
                            <div className="text-center text-gray-400 py-4 text-xs">Ничего не найдено</div>
                        )}
                    </div>
                </div>

                {/* Комментарий */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Комментарий (если нужно)</label>
                    <textarea className="w-full bg-gray-50 rounded-xl p-3 mt-2 min-h-[80px] outline-none focus:ring-2 ring-blue-100 resize-none" 
                        placeholder="Дополнительно..."
                        value={formData.comment} onChange={e => setFormData({...formData, comment: e.target.value})} 
                    />
                </div>
            </div>
        );
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-[#F2F3F7] text-gray-400">Загрузка...</div>;

    // Заголовки для хедера
    const getTitle = () => {
        if (activityCode === 'checkup') return 'Открытая смена';
        if (activityCode === 'training') return 'B2B / Обучение';
        if (activityCode === 'transit') return 'Проезд';
        if (activityCode === 'tasting') return 'Дегустация';
        return 'Визит';
    };

    return (
        <div className="fixed inset-0 z-0 flex flex-col bg-[#F2F3F7] overflow-hidden text-[#1C1C1E]">
            {/* Header */}
            <div className="bg-white px-4 py-4 pt-[var(--sat)] border-b border-gray-200 flex items-center justify-between z-10 shrink-0 shadow-sm">
                <h1 className="font-bold text-lg">{getTitle()}</h1>
                <button onClick={() => navigate(-1)} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center active:scale-90 transition">
                    <X size={18} className="text-gray-600" />
                </button>
            </div>

            {/* Content Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-4 pb-32">
                {activityCode === 'checkup' && renderCheckup()}
                {activityCode === 'training' && renderTraining()}
                {activityCode === 'transit' && renderTransit()}
                {activityCode === 'tasting' && renderTasting()}
            </div>

            {/* Fixed Footer */}
            <div className="bg-white border-t border-gray-200 p-4 pb-[calc(20px+var(--sab))] shrink-0 z-10">
                <button 
                    onClick={handleFinish}
                    className="w-full bg-[#1C1C1E] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-gray-300 active:scale-[0.98] transition-all"
                >
                    <Check size={20} />
                    Завершить
                </button>
            </div>
        </div>
    );
};

export default VisitWizard;
