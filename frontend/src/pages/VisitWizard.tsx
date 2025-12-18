import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { X, Check, Search, Plus, Trash2, MapPin, Users, Briefcase } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
interface Product { id: number; flavor: string; line: string; }
interface Guest { id: string; name: string; contact: string; facility?: string; }

const VisitWizard: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    const facilityId = Number(searchParams.get('facilityId'));
    const activityCode = searchParams.get('activity') || 'checkup';

    const [loading, setLoading] = useState(true);
    const [visitId, setVisitId] = useState<number | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    
    // --- STATE ---
    
    // 1. Transit (Проезд)
    const [transitSelection, setTransitSelection] = useState<Set<number>>(new Set());
    const [transitComment, setTransitComment] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // 2. Tasting (Дегустация)
    const [tastingGuests, setTastingGuests] = useState<Guest[]>([{ id: '1', name: '', contact: '' }]);
    const [tastingFeedback, setTastingFeedback] = useState('');

    // 3. B2B (Training)
    const [b2bGuests, setB2bGuests] = useState<Guest[]>([{ id: '1', name: '', contact: '', facility: '' }]);
    const [b2bComment, setB2bComment] = useState('');

    // 4. Checkup (Открытая смена)
    const [checkupData, setCheckupData] = useState({ startTime: '', endTime: '', cups: '', feedback: '' });

    // Инициализация
    useEffect(() => {
        const init = async () => {
            try {
                // Грузим продукты
                const pRes = await apiClient.get<Product[]>('/api/products');
                setProducts(pRes.data || []);

                // Создаем визит
                const userId = WebApp.initDataUnsafe?.user?.id;
                const lat = sessionStorage.getItem('last_geo_lat');
                const lng = sessionStorage.getItem('last_geo_lng');

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
                console.error(e);
                alert("Ошибка сети");
                navigate(-1);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    // --- LOGIC ---

    const handleFinish = async () => {
        if (!visitId) return;
        setLoading(true);

        // Собираем данные в зависимости от сценария
        let finalData: any = {};
        let mainComment = '';

        if (activityCode === 'transit') {
            finalData = { productsAvailable: Array.from(transitSelection) };
            mainComment = transitComment;
        } else if (activityCode === 'tasting') {
            finalData = { guests: tastingGuests.filter(g => g.name) };
            mainComment = tastingFeedback;
        } else if (activityCode === 'training') {
            finalData = { guests: b2bGuests.filter(g => g.name) };
            mainComment = b2bComment;
        } else {
            finalData = checkupData;
            mainComment = checkupData.feedback;
        }

        try {
            await apiClient.patch(`/api/visits/${visitId}`, { 
                status: 'COMPLETED', 
                endedAt: new Date(),
                comment: mainComment,
                data: finalData
            });
            navigate(-1); 
        } catch (e) {
            console.error(e);
            setLoading(false);
        }
    };

    // --- RENDERERS ---

    // 1. ПРОЕЗД (Transit) - Красивое меню выбора
    const renderTransit = () => {
        // Группировка по линейкам + Фильтрация
        const filtered = products.filter(p => 
            p.flavor.toLowerCase().includes(searchTerm.toLowerCase()) || 
            p.line.toLowerCase().includes(searchTerm.toLowerCase())
        );

        const grouped = filtered.reduce((acc, p) => {
            const line = p.line || 'Другое';
            if (!acc[line]) acc[line] = [];
            acc[line].push(p);
            return acc;
        }, {} as Record<string, Product[]>);

        const toggleProduct = (id: number) => {
            const next = new Set(transitSelection);
            if (next.has(id)) next.delete(id); else next.add(id);
            setTransitSelection(next);
        };

        return (
            <div className="space-y-4">
                {/* Гео-метка */}
                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm"><MapPin size={20} /></div>
                    <div><div className="font-bold text-blue-900 text-sm">Чек-ин выполнен</div><div className="text-blue-600 text-xs opacity-80">Геопозиция сохранена</div></div>
                </div>

                {/* Комментарий */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Что делали / Курили?</label>
                    <textarea 
                        className="w-full bg-gray-50 rounded-xl p-3 mt-2 min-h-[80px] outline-none focus:ring-2 ring-blue-100 resize-none text-sm" 
                        placeholder="Краткий отчет..."
                        value={transitComment} onChange={e => setTransitComment(e.target.value)} 
                    />
                </div>

                {/* Поиск и Выбор SKU */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg">Наличие на полке</h3>
                        <span className="text-xs text-gray-400 font-bold">{transitSelection.size} выбрано</span>
                    </div>
                    
                    {/* Search */}
                    <div className="relative mb-6">
                        <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                        <input 
                            type="text" placeholder="Найти вкус..." 
                            className="w-full bg-gray-50 rounded-xl pl-10 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 ring-blue-100"
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Chips Grouped by Line */}
                    <div className="space-y-6">
                        {Object.entries(grouped).sort().map(([line, items]) => (
                            <div key={line}>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-1">{line}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {items.map(p => {
                                        const isSelected = transitSelection.has(p.id);
                                        return (
                                            <button
                                                key={p.id}
                                                onClick={() => toggleProduct(p.id)}
                                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                                                    isSelected 
                                                    ? 'bg-[#1C1C1E] text-white border-[#1C1C1E] shadow-md transform scale-105' 
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                {p.flavor}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                        {Object.keys(grouped).length === 0 && <div className="text-center text-gray-400 py-4">Ничего не найдено</div>}
                    </div>
                </div>
            </div>
        );
    };

    // 2. ДЕГУСТАЦИЯ (Tasting)
    const renderTasting = () => {
        const addGuest = () => setTastingGuests([...tastingGuests, { id: Date.now().toString(), name: '', contact: '' }]);
        const removeGuest = (id: string) => setTastingGuests(tastingGuests.filter(g => g.id !== id));
        const updateGuest = (id: string, field: keyof Guest, val: string) => {
            setTastingGuests(prev => prev.map(g => g.id === id ? { ...g, [field]: val } : g));
        };

        return (
            <div className="space-y-6">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Users size={20} className="text-rose-600" />
                        Гости дегустации
                    </h3>
                    
                    <div className="space-y-4">
                        <AnimatePresence>
                            {tastingGuests.map((guest, idx) => (
                                <motion.div 
                                    key={guest.id} 
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                                    className="relative bg-gray-50 rounded-xl p-3 border border-gray-100"
                                >
                                    <div className="absolute -left-2 -top-2 w-6 h-6 bg-rose-500 rounded-full text-white flex items-center justify-center text-xs font-bold shadow-sm">
                                        {idx + 1}
                                    </div>
                                    {tastingGuests.length > 1 && (
                                        <button onClick={() => removeGuest(guest.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                                    )}
                                    <div className="space-y-2 mt-1">
                                        <input placeholder="Имя гостя" className="w-full bg-transparent border-b border-gray-200 pb-1 text-sm font-bold text-[#1C1C1E] outline-none focus:border-rose-400 placeholder:font-normal"
                                            value={guest.name} onChange={e => updateGuest(guest.id, 'name', e.target.value)} />
                                        <input placeholder="Телефон / Telegram" className="w-full bg-transparent border-b border-gray-200 pb-1 text-sm text-[#1C1C1E] outline-none focus:border-rose-400 placeholder:text-gray-400"
                                            value={guest.contact} onChange={e => updateGuest(guest.id, 'contact', e.target.value)} />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <button onClick={addGuest} className="w-full mt-4 py-3 rounded-xl border border-dashed border-gray-300 text-gray-500 text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-50 active:bg-gray-100 transition">
                        <Plus size={16} /> Добавить гостя
                    </button>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Общий фидбек</label>
                    <textarea 
                        className="w-full bg-gray-50 rounded-xl p-3 mt-2 min-h-[120px] outline-none focus:ring-2 ring-rose-100 resize-none text-sm" 
                        placeholder="Как прошла дегустация? Какие вкусы понравились?"
                        value={tastingFeedback} onChange={e => setTastingFeedback(e.target.value)} 
                    />
                </div>
            </div>
        );
    };

    // 3. B2B (Training)
    const renderB2B = () => {
        const addGuest = () => setB2bGuests([...b2bGuests, { id: Date.now().toString(), name: '', contact: '', facility: '' }]);
        const removeGuest = (id: string) => setB2bGuests(b2bGuests.filter(g => g.id !== id));
        const updateGuest = (id: string, field: keyof Guest, val: string) => {
            setB2bGuests(prev => prev.map(g => g.id === id ? { ...g, [field]: val } : g));
        };

        return (
            <div className="space-y-6">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Briefcase size={20} className="text-purple-600" />
                        Участники B2B
                    </h3>
                    
                    <div className="space-y-4">
                        <AnimatePresence>
                            {b2bGuests.map((guest, idx) => (
                                <motion.div 
                                    key={guest.id} 
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}
                                    className="relative bg-gray-50 rounded-xl p-3 border border-gray-100"
                                >
                                    <div className="absolute -left-2 -top-2 w-6 h-6 bg-purple-500 rounded-full text-white flex items-center justify-center text-xs font-bold shadow-sm">
                                        {idx + 1}
                                    </div>
                                    {b2bGuests.length > 1 && (
                                        <button onClick={() => removeGuest(guest.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                                    )}
                                    <div className="space-y-3 mt-1">
                                        <input placeholder="Имя / Должность" className="w-full bg-transparent border-b border-gray-200 pb-1 text-sm font-bold text-[#1C1C1E] outline-none focus:border-purple-400 placeholder:font-normal"
                                            value={guest.name} onChange={e => updateGuest(guest.id, 'name', e.target.value)} />
                                        <input placeholder="Телефон" className="w-full bg-transparent border-b border-gray-200 pb-1 text-sm text-[#1C1C1E] outline-none focus:border-purple-400 placeholder:text-gray-400"
                                            value={guest.contact} onChange={e => updateGuest(guest.id, 'contact', e.target.value)} />
                                        <input placeholder="Название заведения (откуда)" className="w-full bg-white rounded-lg px-2 py-1.5 text-xs text-[#1C1C1E] border border-gray-200 outline-none focus:border-purple-400"
                                            value={guest.facility} onChange={e => updateGuest(guest.id, 'facility', e.target.value)} />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <button onClick={addGuest} className="w-full mt-4 py-3 rounded-xl border border-dashed border-gray-300 text-gray-500 text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-50 active:bg-gray-100 transition">
                        <Plus size={16} /> Добавить участника
                    </button>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Итоги / Комментарий</label>
                    <textarea 
                        className="w-full bg-gray-50 rounded-xl p-3 mt-2 min-h-[120px] outline-none focus:ring-2 ring-purple-100 resize-none text-sm" 
                        placeholder="О чем договорились?"
                        value={b2bComment} onChange={e => setB2bComment(e.target.value)} 
                    />
                </div>
            </div>
        );
    };

    // 4. ОТКРЫТАЯ СМЕНА (Checkup)
    const renderCheckup = () => (
        <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg mb-4 text-[#1C1C1E]">Смена</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Начало</label>
                        <input type="time" className="w-full bg-gray-50 rounded-xl p-3 mt-1 font-medium text-[#1C1C1E] outline-none focus:ring-2 ring-emerald-100" 
                            value={checkupData.startTime} onChange={e => setCheckupData({...checkupData, startTime: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Конец</label>
                        <input type="time" className="w-full bg-gray-50 rounded-xl p-3 mt-1 font-medium text-[#1C1C1E] outline-none focus:ring-2 ring-emerald-100" 
                            value={checkupData.endTime} onChange={e => setCheckupData({...checkupData, endTime: e.target.value})} />
                    </div>
                </div>
                <div>
                    <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Продано чашек</label>
                    <input type="number" placeholder="0" className="w-full bg-gray-50 rounded-xl p-3 mt-1 font-bold text-lg outline-none focus:ring-2 ring-emerald-100" 
                        value={checkupData.cups} onChange={e => setCheckupData({...checkupData, cups: e.target.value})} />
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-lg mb-2 text-[#1C1C1E]">Фидбек</h3>
                <textarea className="w-full bg-gray-50 rounded-xl p-3 mt-2 min-h-[120px] outline-none focus:ring-2 ring-emerald-100 resize-none text-sm" 
                    placeholder="Что говорят гости? Понравилось/не понравилось..."
                    value={checkupData.feedback} onChange={e => setCheckupData({...checkupData, feedback: e.target.value})} 
                />
            </div>
        </div>
    );

    if (loading) return <div className="h-screen flex items-center justify-center bg-[#F2F3F7] text-gray-400">Загрузка...</div>;

    const getTitle = () => {
        if (activityCode === 'checkup') return 'Открытая смена';
        if (activityCode === 'training') return 'B2B / Обучение';
        if (activityCode === 'transit') return 'Проезд / SKU';
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

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 pb-32">
                {activityCode === 'checkup' && renderCheckup()}
                {activityCode === 'training' && renderB2B()}
                {activityCode === 'transit' && renderTransit()}
                {activityCode === 'tasting' && renderTasting()}
            </div>

            {/* Footer Button */}
            <div className="bg-white border-t border-gray-200 p-4 pb-[calc(20px+var(--sab))] shrink-0 z-10">
                <button 
                    onClick={handleFinish}
                    className="w-full bg-[#1C1C1E] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-gray-300 active:scale-[0.98] transition-all"
                >
                    <Check size={20} />
                    Завершить визит
                </button>
            </div>
        </div>
    );
};

export default VisitWizard;
