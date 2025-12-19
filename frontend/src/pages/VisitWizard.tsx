import React, { useState, useEffect, useMemo } from 'react';
import WebApp from '@twa-dev/sdk';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { StandardCard } from '../components/ui/StandardCard';
import { Check, Plus, User, Clock, MessageSquare, Coffee, Send } from 'lucide-react';
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

    const handleFinish = async () => {
        setLoading(true);
        try {
            const telegramUser = WebApp.initDataUnsafe?.user;
            const userId = telegramUser?.id ? String(telegramUser.id) : '1'; // Fallback to 1 for dev

            // Collect scenario-specific data
            const scenarioData: any = {
                comment,
            };

            if (activity === 'transit') scenarioData.inventory = inventory;
            if (activity === 'tasting') scenarioData.guests = guests.filter(g => g.name || g.phone);
            if (activity === 'b2b') scenarioData.b2bContact = b2bContact;
            if (activity === 'checkup') scenarioData.shift = shift;

            await apiClient.post('/api/visits', {
                facilityId: Number(facilityId),
                type: activity,
                userId,
                status: 'COMPLETED',
                scenarioData // Sending extra data for TG notification and storage
            });

            WebApp.HapticFeedback?.notificationOccurred('success');
            WebApp.disableClosingConfirmation();

            if (activity === 'transit') {
                WebApp.showConfirm(
                    "Инвентаризация завершена. Есть отсутствующие позиции. Сформировать заказ?",
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
            alert("Ошибка при отправке отчета");
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        switch (activity) {
            case 'transit': return 'Проезд';
            case 'tasting': return 'Дегустация';
            case 'b2b': return 'B2B Встреча';
            case 'checkup': return 'Смена';
            default: return 'Визит';
        }
    };

    // --- RENDERERS ---

    const renderTransit = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-[28px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100">
                <h3 className="font-extrabold text-lg text-gray-900 mb-4 px-1">Наличие</h3>
                {Object.entries(groupedProducts).map(([line, items]: [string, any]) => (
                    <div key={line} className="mb-6 last:mb-0">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-3 ml-1 tracking-wider">{line}</h4>
                        <div className="space-y-2">
                            {items.map((p: any) => (
                                <motion.div
                                    key={p.id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setInventory(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                                    className={`
                                        flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer
                                        ${inventory[p.id]
                                            ? 'border-green-500 bg-green-50 shadow-sm'
                                            : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    <span className={`font-bold text-sm ${inventory[p.id] ? 'text-green-800' : 'text-gray-700'}`}>
                                        {p.flavor}
                                    </span>
                                    {inventory[p.id] && (
                                        <div className="bg-green-500 text-white rounded-full p-1">
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <StandardCard title="Комментарий" icon={MessageSquare} color="white" floating={false}>
                <textarea
                    className="w-full bg-gray-50 rounded-xl p-4 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all mt-2"
                    placeholder="Заметки по визиту..."
                    rows={3}
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                />
            </StandardCard>
        </div>
    );

    const renderTasting = () => (
        <div className="space-y-4">
            <StandardCard title="Гости" subtitle="Кто пробовал?" icon={Coffee} color="white" floating={false}>
                <div className="space-y-4 mt-4">
                    {guests.map((guest, idx) => (
                        <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide">Гость #{idx + 1}</div>
                            <input
                                placeholder="Имя"
                                className="w-full p-3.5 bg-white rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-500/20 outline-none"
                                value={guest.name}
                                onChange={e => {
                                    const newGuests = [...guests];
                                    newGuests[idx].name = e.target.value;
                                    setGuests(newGuests);
                                }}
                            />
                            <input
                                placeholder="Телефон / Telegram"
                                className="w-full p-3.5 bg-white rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-orange-500/20 outline-none"
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
                        onClick={() => setGuests([...guests, { name: '', phone: '' }])}
                        className="w-full py-3.5 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-bold text-sm flex items-center justify-center gap-2 hover:border-orange-400 hover:text-orange-500 transition-colors"
                    >
                        <Plus size={18} /> Добавить гостя
                    </button>
                </div>
            </StandardCard>
        </div>
    );

    const renderB2B = () => (
        <div className="space-y-4">
            <StandardCard title="Контакт" subtitle="ЛПР или менеджер" icon={User} color="white" floating={false}>
                <div className="space-y-3 mt-3">
                    <input
                        placeholder="Название заведения"
                        className="w-full p-4 bg-gray-50 rounded-2xl border-none font-medium focus:bg-white focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                        value={b2bContact.venue}
                        onChange={e => setB2bContact({ ...b2bContact, venue: e.target.value })}
                    />
                    <input
                        placeholder="Имя контакта"
                        className="w-full p-4 bg-gray-50 rounded-2xl border-none font-medium focus:bg-white focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                        value={b2bContact.name}
                        onChange={e => setB2bContact({ ...b2bContact, name: e.target.value })}
                    />
                    <input
                        placeholder="Телефон"
                        className="w-full p-4 bg-gray-50 rounded-2xl border-none font-medium focus:bg-white focus:ring-2 focus:ring-purple-500/20 transition-all outline-none"
                        value={b2bContact.phone}
                        onChange={e => setB2bContact({ ...b2bContact, phone: e.target.value })}
                    />
                </div>
            </StandardCard>
        </div>
    );

    const renderCheckup = () => (
        <div className="space-y-4">
            <StandardCard title="Смена" icon={Clock} color="white" floating={false}>
                <div className="flex gap-4 mt-3">
                    <div className="flex-1">
                        <div className="text-xs font-bold text-gray-400 uppercase mb-2 text-center">Начало</div>
                        <input type="time" value={shift.start} onChange={e => setShift({ ...shift, start: e.target.value })}
                            className="w-full p-3 bg-gray-50 rounded-xl font-bold text-center border-none focus:ring-2 focus:ring-teal-500/20 outline-none"
                        />
                    </div>
                    <div className="flex-1">
                        <div className="text-xs font-bold text-gray-400 uppercase mb-2 text-center">Конец</div>
                        <input type="time" value={shift.end} onChange={e => setShift({ ...shift, end: e.target.value })}
                            className="w-full p-3 bg-gray-50 rounded-xl font-bold text-center border-none focus:ring-2 focus:ring-teal-500/20 outline-none"
                        />
                    </div>
                </div>
            </StandardCard>

            <StandardCard title="Продажи" subtitle="Чашки / Кальяны" icon={Coffee} color="white" floating={false}>
                <div className="flex items-center justify-center gap-6 py-2">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShift(s => ({ ...s, cups: Math.max(0, s.cups - 1) }))}
                        className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold text-gray-600 shadow-sm"
                    >
                        -
                    </motion.button>
                    <span className="text-4xl font-extrabold text-gray-900 w-16 text-center">{shift.cups}</span>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShift(s => ({ ...s, cups: s.cups + 1 }))}
                        className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center text-xl font-bold shadow-lg"
                    >
                        +
                    </motion.button>
                </div>
            </StandardCard>
        </div>
    );

    return (
        <Layout>
            <div className="px-4 pb-32 pt-4 space-y-6">
                <PageHeader title={getTitle()} backTo={`/facilities/${facilityId}`} />

                {loading ? <div className="text-center py-10 text-gray-400">Загрузка...</div> : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {activity === 'transit' && renderTransit()}
                        {activity === 'tasting' && renderTasting()}
                        {activity === 'b2b' && renderB2B()}
                        {activity === 'checkup' && renderCheckup()}

                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleFinish}
                            className="w-full py-4 rounded-[24px] bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-lg shadow-[0_10px_30px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2"
                        >
                            <Send size={20} /> Завершить отчет
                        </motion.button>
                    </motion.div>
                )}
            </div>
        </Layout>
    );
};

export default VisitWizard;