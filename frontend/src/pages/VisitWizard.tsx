import React, { useState, useEffect, useMemo } from 'react';
import WebApp from '@twa-dev/sdk';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { StandardCard } from '../components/ui/StandardCard';
import { Check, Plus, Send } from 'lucide-react';
import apiClient from '../api/apiClient';
import { motion } from 'framer-motion';

// Helper
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

    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [comment, setComment] = useState('');

    // State for scenarios
    const [inventory, setInventory] = useState<Record<number, boolean>>({});
    const [guests, setGuests] = useState<{ name: string, phone: string }[]>([{ name: '', phone: '' }]);
    const [b2bContact, setB2bContact] = useState({ name: '', phone: '', venue: '' });
    const [shift, setShift] = useState({ start: '12:00', end: '20:00', cups: 0 });

    useEffect(() => {
        if (activity) {
            WebApp.enableClosingConfirmation();
        }
        return () => {
            WebApp.disableClosingConfirmation();
        };
    }, [activity]);

    useEffect(() => {
        if (activity === 'transit') {
            setLoading(true);
            apiClient.get('/api/products')
                .then(res => setProducts(res.data || []))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [activity]);

    const groupedProducts = useMemo(() => {
        if (activity !== 'transit') return {};
        return groupBy(products, 'line');
    }, [products, activity]);

    const handleToggleInventory = (id: number) => {
        setInventory(prev => ({ ...prev, [id]: !prev[id] }));
        WebApp.HapticFeedback.impactOccurred('light');
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            const telegramUser = WebApp.initDataUnsafe?.user;
            const userId = telegramUser?.id ? String(telegramUser.id) : '1';

            const scenarioData: any = { comment };
            if (activity === 'transit') scenarioData.inventory = inventory;
            if (activity === 'tasting') scenarioData.guests = guests.filter(g => g.name || g.phone);
            if (activity === 'b2b') scenarioData.b2bContact = b2bContact;
            if (activity === 'checkup') scenarioData.shift = shift;

            await apiClient.post('/api/visits', {
                facilityId: Number(facilityId),
                type: activity,
                userId,
                status: 'COMPLETED',
                scenarioData
            });

            WebApp.HapticFeedback?.notificationOccurred('success');
            WebApp.disableClosingConfirmation();

            if (activity === 'transit') {
                WebApp.showConfirm(
                    "Анализ полки завершен. Сформировать заказ на отсутствующие позиции?",
                    (ok) => {
                        if (ok) navigate(`/orders?facilityId=${facilityId}`);
                        else navigate(-1);
                    }
                );
            } else {
                WebApp.showAlert("Отчет успешно отправлен!");
                navigate(-1);
            }
        } catch (e) {
            console.error(e);
            WebApp.showAlert("Ошибка при отправке отчета");
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        switch (activity) {
            case 'transit': return 'Анализ полки';
            case 'tasting': return 'Дегустация';
            case 'b2b': return 'B2B Контакт';
            case 'checkup': return 'Рабочая смена';
            default: return 'Отчет';
        }
    };

    // --- RENDERERS ---

    const renderTransit = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-[32px] p-6 shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-[#C6C6C8]/10">
                <div className="flex items-center gap-2 mb-6 px-1">
                    <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                    <h3 className="text-[20px] font-black text-gray-900">Наличие продукции</h3>
                </div>

                {Object.entries(groupedProducts).map(([line, items]: [string, any]) => (
                    <div key={line} className="mb-8 last:mb-0">
                        <h4 className="text-[11px] font-[900] text-gray-400 uppercase mb-4 ml-1 tracking-[0.1em]">{line}</h4>
                        <div className="grid grid-cols-1 gap-2.5">
                            {items.map((p: any) => (
                                <motion.div
                                    key={p.id}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => handleToggleInventory(p.id)}
                                    className={`
                                        flex items-center justify-between p-5 rounded-[22px] border-2 transition-all cursor-pointer
                                        ${inventory[p.id]
                                            ? 'border-blue-500 bg-blue-50 shadow-[0_8px_20px_rgba(59,130,246,0.15)]'
                                            : 'border-transparent bg-[#F2F2F7]/50'
                                        }
                                    `}
                                >
                                    <span className={`font-bold text-[15px] ${inventory[p.id] ? 'text-blue-900' : 'text-gray-700'}`}>
                                        {p.flavor}
                                    </span>
                                    <div className={`
                                        w-7 h-7 rounded-full flex items-center justify-center transition-all
                                        ${inventory[p.id] ? 'bg-blue-500 text-white scale-110' : 'bg-gray-200 text-transparent'}
                                    `}>
                                        <Check size={16} strokeWidth={4} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <StandardCard title="Комментарий" color="white" floating={false}>
                <textarea
                    className="w-full bg-[#F2F2F7]/50 rounded-2xl p-5 text-[15px] font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all mt-4 border border-transparent focus:border-blue-500/20"
                    placeholder="Что важного произошло во время анализа?"
                    rows={4}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                />
            </StandardCard>
        </div>
    );

    const renderTasting = () => (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
                <h2 className="text-[18px] font-black text-[#000000]">Гости</h2>
            </div>
            {guests.map((guest, idx) => (
                <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 bg-white rounded-[28px] border border-[#C6C6C8]/10 shadow-[0_10px_30px_rgba(0,0,0,0.03)] space-y-4"
                >
                    <div className="flex items-center justify-between">
                        <div className="text-[11px] font-black text-blue-500 uppercase tracking-widest">Гость #{idx + 1}</div>
                        {guests.length > 1 && (
                            <button onClick={() => setGuests(guests.filter((_, i) => i !== idx))} className="text-red-400 text-xs font-bold">Удалить</button>
                        )}
                    </div>
                    <input
                        placeholder="Имя гостя"
                        className="w-full p-4 bg-[#F2F2F7]/50 rounded-2xl text-[15px] font-bold border border-transparent focus:bg-white focus:border-blue-500/20 outline-none"
                        value={guest.name}
                        onChange={e => {
                            const newGuests = [...guests];
                            newGuests[idx].name = e.target.value;
                            setGuests(newGuests);
                        }}
                    />
                    <input
                        placeholder="Контакт (TG/Тел)"
                        className="w-full p-4 bg-[#F2F2F7]/50 rounded-2xl text-[15px] font-bold border border-transparent focus:bg-white focus:border-blue-500/20 outline-none"
                        value={guest.phone}
                        onChange={e => {
                            const newGuests = [...guests];
                            newGuests[idx].phone = e.target.value;
                            setGuests(newGuests);
                        }}
                    />
                </motion.div>
            ))}
            <button
                onClick={() => { setGuests([...guests, { name: '', phone: '' }]); WebApp.HapticFeedback.impactOccurred('light'); }}
                className="w-full py-5 border-2 border-dashed border-[#C6C6C8]/30 rounded-[28px] text-gray-400 font-bold text-sm flex items-center justify-center gap-2 active:bg-blue-50"
            >
                <Plus size={20} /> Еще гость
            </button>
        </div>
    );

    const renderB2B = () => (
        <div className="space-y-6">
            <StandardCard title="Контактные данные" color="white" floating={false}>
                <div className="space-y-4 mt-4">
                    <input
                        placeholder="Название заведения"
                        className="w-full p-4 bg-[#F2F2F7]/50 rounded-2xl text-[15px] font-bold border border-transparent focus:bg-white focus:border-blue-500/20 outline-none"
                        value={b2bContact.venue}
                        onChange={e => setB2bContact({ ...b2bContact, venue: e.target.value })}
                    />
                    <input
                        placeholder="Имя ЛПР"
                        className="w-full p-4 bg-[#F2F2F7]/50 rounded-2xl text-[15px] font-bold border border-transparent focus:bg-white focus:border-blue-500/20 outline-none"
                        value={b2bContact.name}
                        onChange={e => setB2bContact({ ...b2bContact, name: e.target.value })}
                    />
                    <input
                        placeholder="Телефон для связи"
                        className="w-full p-4 bg-[#F2F2F7]/50 rounded-2xl text-[15px] font-bold border border-transparent focus:bg-white focus:border-blue-500/20 outline-none"
                        value={b2bContact.phone}
                        onChange={e => setB2bContact({ ...b2bContact, phone: e.target.value })}
                    />
                </div>
            </StandardCard>
        </div>
    );

    const renderCheckup = () => (
        <div className="space-y-6">
            <StandardCard title="Время смены" color="white" floating={false}>
                <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="bg-[#F2F2F7]/50 p-4 rounded-2xl text-center border border-transparent">
                        <div className="text-[10px] font-black text-[#8E8E93] uppercase mb-2">Начало</div>
                        <input type="time" value={shift.start} onChange={e => setShift({ ...shift, start: e.target.value })}
                            className="bg-transparent text-xl font-black text-center outline-none w-full"
                        />
                    </div>
                    <div className="bg-[#F2F2F7]/50 p-4 rounded-2xl text-center border border-transparent">
                        <div className="text-[10px] font-black text-[#8E8E93] uppercase mb-2">Конец</div>
                        <input type="time" value={shift.end} onChange={e => setShift({ ...shift, end: e.target.value })}
                            className="bg-transparent text-xl font-black text-center outline-none w-full"
                        />
                    </div>
                </div>
            </StandardCard>

            <StandardCard title="Показатели" subtitle="Чашки / Кальяны" color="white" floating={false}>
                <div className="flex items-center justify-center gap-10 py-6">
                    <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => { setShift(s => ({ ...s, cups: Math.max(0, s.cups - 1) })); WebApp.HapticFeedback.impactOccurred('medium'); }}
                        className="w-16 h-16 rounded-3xl bg-[#F2F2F7] flex items-center justify-center text-3xl font-black text-gray-500 shadow-sm"
                    >
                        -
                    </motion.button>
                    <div className="flex flex-col items-center">
                        <span className="text-6xl font-black text-gray-900 leading-none">{shift.cups}</span>
                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest mt-2">Всего</span>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => { setShift(s => ({ ...s, cups: s.cups + 1 })); WebApp.HapticFeedback.impactOccurred('medium'); }}
                        className="w-16 h-16 rounded-3xl bg-blue-600 text-white flex items-center justify-center text-3xl font-black shadow-xl shadow-blue-500/30"
                    >
                        +
                    </motion.button>
                </div>
            </StandardCard>
        </div>
    );

    return (
        <Layout>
            <div className="px-5 pb-40 pt-6 space-y-8">
                <div className="pt-2">
                    <PageHeader title={getTitle()} />
                    <p className="text-[14px] text-[#8E8E93] font-bold mt-2 uppercase tracking-tight opacity-70 px-1">Заполнение отчета</p>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        {activity === 'transit' && renderTransit()}
                        {activity === 'tasting' && renderTasting()}
                        {activity === 'b2b' && renderB2B()}
                        {activity === 'checkup' && renderCheckup()}

                        <div className="fixed bottom-10 left-5 right-5 z-50">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleFinish}
                                disabled={loading}
                                className="w-full py-6 rounded-[30px] bg-gray-900 text-white font-[900] text-[17px] uppercase tracking-wider shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex items-center justify-center gap-3"
                            >
                                {loading ? 'Отправка...' : <><Send size={20} strokeWidth={3} /> <span>Отправить отчет</span></>}
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </div>
        </Layout>
    );
};

export default VisitWizard;