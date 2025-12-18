import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { StandardCard } from '../components/ui/StandardCard';
import { Check, Plus, User, Clock, MessageSquare, Coffee } from 'lucide-react';
import apiClient from '../api/apiClient';

// Вспомогательная функция (вынесена наружу)
const groupBy = (array: any[], key: string) => {
  return array.reduce((result, currentValue) => {
    (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
    return result;
  }, {});
};

const VisitWizard: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const activity = searchParams.get('activity') || 'checkup';
    const facilityId = searchParams.get('facilityId');

    // --- СОСТОЯНИЕ (HOOKS) ---
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [comment, setComment] = useState('');

    // Сценарий 1: Проезд
    const [inventory, setInventory] = useState<Record<number, boolean>>({}); 
    // Сценарий 2: Дегустация
    const [guests, setGuests] = useState<{name: string, phone: string}[]>([{name: '', phone: ''}]);
    // Сценарий 3: B2B
    const [b2bContact, setB2bContact] = useState({ name: '', phone: '', venue: '' });
    // Сценарий 4: Смена
    const [shift, setShift] = useState({ start: '12:00', end: '20:00', cups: 0 });

    // --- ЭФФЕКТЫ ---
    useEffect(() => {
        if (activity === 'transit') {
            setLoading(true);
            apiClient.get('/api/products')
                .then(res => setProducts(res.data || []))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [activity]);

    // ВАЖНО: useMemo теперь НА ВЕРХНЕМ УРОВНЕ (Исправление ошибки)
    const groupedProducts = useMemo(() => {
        if (activity !== 'transit') return {};
        return groupBy(products, 'line');
    }, [products, activity]);

    const handleFinish = () => {
        const reportData = {
            facilityId,
            activity,
            comment,
            data: activity === 'transit' ? { inventory } :
                  activity === 'tasting' ? { guests } :
                  activity === 'b2b' ? { b2bContact } :
                  { shift }
        };

        console.log("Отправка отчета:", reportData);
        alert("Отчет отправлен! (Данные в консоли)");
        navigate(-1);
    };

    // --- РЕНДЕР ФУНКЦИИ (теперь просто возвращают JSX) ---

    const renderTransit = () => (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100">
                <h3 className="font-bold mb-4">Отметьте наличие (по линейкам)</h3>
                {Object.entries(groupedProducts).map(([line, items]: [string, any]) => (
                    <div key={line} className="mb-6">
                        <h4 className="text-sm font-bold text-gray-400 uppercase mb-2 border-b border-gray-100 pb-1">{line}</h4>
                        <div className="space-y-2">
                            {items.map((p: any) => (
                                <div 
                                    key={p.id}
                                    onClick={() => setInventory(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${inventory[p.id] ? 'border-green-500 bg-green-50' : 'border-gray-100 bg-white'}`}
                                >
                                    <span className={`text-sm font-medium ${inventory[p.id] ? 'text-green-900' : 'text-gray-700'}`}>{p.flavor}</span>
                                    {inventory[p.id] && <Check size={16} className="text-green-600" />}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <StandardCard title="Комментарий" icon={MessageSquare}>
                <textarea 
                    className="w-full bg-gray-50 rounded-xl p-3 text-sm focus:outline-none mt-2"
                    placeholder="Что делали, что курили..."
                    rows={3}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                />
            </StandardCard>
        </div>
    );

    const renderTasting = () => (
        <div className="space-y-4">
            <StandardCard title="Участники дегустации" icon={Coffee}>
                <div className="space-y-4 mt-2">
                    {guests.map((guest, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                            <div className="text-xs font-bold text-gray-400">Гость #{idx + 1}</div>
                            <input 
                                placeholder="Имя" 
                                className="w-full p-2 rounded-lg border border-gray-200 text-sm bg-white"
                                value={guest.name}
                                onChange={e => {
                                    const newGuests = [...guests];
                                    newGuests[idx].name = e.target.value;
                                    setGuests(newGuests);
                                }}
                            />
                            <input 
                                placeholder="Контакт / Telegram" 
                                className="w-full p-2 rounded-lg border border-gray-200 text-sm bg-white"
                                value={guest.phone}
                                onChange={e => {
                                    const newGuests = [...guests];
                                    newGuests[idx].phone = e.target.value;
                                    setGuests(newGuests);
                                }}
                            />
                        </div>
                    ))}
                    <button 
                        onClick={() => setGuests([...guests, {name: '', phone: ''}])}
                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold flex items-center justify-center gap-2 hover:border-black hover:text-black transition-colors"
                    >
                        <Plus size={18} /> Добавить человека
                    </button>
                </div>
            </StandardCard>
            <div className="text-center text-gray-400 text-sm">Всего гостей: {guests.length}</div>
        </div>
    );

    const renderB2B = () => (
        <StandardCard title="Контакт B2B" icon={User}>
            <div className="space-y-3 mt-2">
                <input 
                    placeholder="Название заведения" 
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none"
                    value={b2bContact.venue}
                    onChange={e => setB2bContact({...b2bContact, venue: e.target.value})}
                />
                <input 
                    placeholder="Имя ЛПР" 
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none"
                    value={b2bContact.name}
                    onChange={e => setB2bContact({...b2bContact, name: e.target.value})}
                />
                <input 
                    placeholder="Контакт" 
                    className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 outline-none"
                    value={b2bContact.phone}
                    onChange={e => setB2bContact({...b2bContact, phone: e.target.value})}
                />
            </div>
        </StandardCard>
    );

    const renderCheckup = () => (
        <div className="space-y-3">
            <StandardCard title="Время работы" icon={Clock}>
                <div className="flex gap-4 mt-2">
                    <div className="flex-1">
                        <div className="text-xs text-gray-400 mb-1">Начало</div>
                        <input type="time" value={shift.start} onChange={e => setShift({...shift, start: e.target.value})} className="w-full p-2 bg-gray-50 rounded-lg font-bold text-center border border-gray-200" />
                    </div>
                    <div className="flex-1">
                        <div className="text-xs text-gray-400 mb-1">Конец</div>
                        <input type="time" value={shift.end} onChange={e => setShift({...shift, end: e.target.value})} className="w-full p-2 bg-gray-50 rounded-lg font-bold text-center border border-gray-200" />
                    </div>
                </div>
            </StandardCard>

            <StandardCard title="Продажи" icon={Coffee}>
                <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-600">Отдано чашек/кальянов:</span>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShift(s => ({...s, cups: Math.max(0, s.cups - 1)}))} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold">-</button>
                        <span className="text-xl font-bold w-8 text-center">{shift.cups}</span>
                        <button onClick={() => setShift(s => ({...s, cups: s.cups + 1}))} className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold">+</button>
                    </div>
                </div>
            </StandardCard>

            <StandardCard title="Комментарии посетителей" icon={MessageSquare}>
                <textarea 
                    className="w-full bg-gray-50 rounded-xl p-3 text-sm focus:outline-none mt-2"
                    placeholder="Отзывы гостей..."
                    rows={4}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                />
            </StandardCard>
        </div>
    );

    const getTitle = () => {
        switch(activity) {
            case 'transit': return 'Проезд';
            case 'tasting': return 'Дегустация';
            case 'b2b': return 'Обучение B2B';
            case 'checkup': return 'Открытая смена';
            default: return 'Визит';
        }
    };

    return (
        <Layout>
            <PageHeader title={getTitle()} />
            <div className="px-4 pb-32 pt-2 bg-[#F3F4F6] min-h-screen">
                
                {loading && <div className="text-center py-10">Загрузка данных...</div>}
                
                {!loading && (
                    <div className="animate-fade-in">
                        {activity === 'transit' && renderTransit()}
                        {activity === 'tasting' && renderTasting()}
                        {activity === 'b2b' && renderB2B()}
                        {activity === 'checkup' && renderCheckup()}
                        
                        <button 
                            onClick={handleFinish}
                            className="w-full bg-black text-white py-4 rounded-2xl font-bold shadow-lg mt-8 active:scale-[0.98] transition-transform"
                        >
                            Завершить и Отправить
                        </button>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default VisitWizard;