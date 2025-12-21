import React, { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { PageHeader } from '../components/PageHeader';
import { StandardCard } from '../components/ui/StandardCard';
import { MapPin, Calendar, Clock, Search } from 'lucide-react';
import WebApp from '@twa-dev/sdk';

const VisitsHistoryPage: React.FC = () => {
    const [visits, setVisits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const telegramUser = WebApp.initDataUnsafe?.user;

    useEffect(() => {
        apiClient.get('/api/visits')
            .then(res => {
                const all = res.data || [];
                const myVisits = all.filter((v: any) =>
                    v.user?.telegramId === String(telegramUser?.id) || v.userId === telegramUser?.id
                );
                setVisits(myVisits);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [telegramUser]);

    const filterOptions = [
        { id: 'all', label: 'Все' },
        { id: 'transit', label: 'Транзит' },
        { id: 'tasting', label: 'Дегустация' },
        { id: 'b2b', label: 'B2B' },
        { id: 'checkup', label: 'Смена' },
    ];

    const filteredVisits = activeFilter === 'all'
        ? visits
        : visits.filter(v => v.type?.toLowerCase().includes(activeFilter) || v.activityType?.toLowerCase().includes(activeFilter));

    return (
            <div className="pb-24 space-y-6">
                <PageHeader title="История визитов" subtitle="Ваша активность" />

                {/* FILTERS */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
                    {filterOptions.map(opt => (
                        <button
                            key={opt.id}
                            onClick={() => {
                                WebApp.HapticFeedback.impactOccurred('light');
                                setActiveFilter(opt.id);
                            }}
                            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all whitespace-nowrap border ${
                                activeFilter === opt.id
                                    ? 'bg-gray-900 text-white border-gray-900 shadow-[0_20px_40px_rgba(0,0,0,0.15)]'
                                    : 'bg-white/60 backdrop-blur-xl text-black/45 border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.08)]'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-10 h-10 border-4 border-black/10 border-t-black/40 rounded-full animate-spin" />
                        <p className="text-black/50 font-semibold text-sm">Загрузка данных...</p>
                    </div>
                ) : filteredVisits.length > 0 ? (
                    <div className="space-y-4">
                        {filteredVisits.map(visit => (
                            <StandardCard
                                key={visit.id}
                                title={visit.facility?.name || "Неизвестная точка"}
                                subtitle={visit.type || "Визит"}
                                color="white"
                                floating={false}
                                icon={MapPin}
                                className="bg-white/60 backdrop-blur-xl border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.10)]"
                            >
                                <div className="flex items-center justify-between mt-4 text-[11px] font-bold text-black/50 bg-black/5 border border-white/40 p-2.5 rounded-2xl">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-black/50" />
                                        {new Date(visit.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-black/50" />
                                        {new Date(visit.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </StandardCard>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                        <div className="w-14 h-14 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.10)] flex items-center justify-center text-black/50">
                            <Search size={20} strokeWidth={1.5} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-gray-900 font-semibold">Ничего не найдено</p>
                            <p className="text-black/50 text-xs font-medium px-10">
                                За выбранный период или по данному фильтру нет активностей
                            </p>
                        </div>
                    </div>
                )}
            </div>
    );
};

export default VisitsHistoryPage;
