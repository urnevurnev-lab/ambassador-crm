import React, { useEffect, useMemo, useState } from 'react';
import apiClient from '../api/apiClient';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { Clock, MapPin, Filter, Calendar } from 'lucide-react';
import WebApp from '@twa-dev/sdk';

// Перевод типов активностей
const ACTIVITY_NAMES: Record<string, string> = {
    'checkup': 'Открытая смена',
    'transit': 'Проезд',
    'training': 'B2B / Обучение',
    'tasting': 'Дегустация'
};

export const VisitsHistoryPage: React.FC = () => {
    const [visits, setVisits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [filterDate, setFilterDate] = useState('');
    const [filterType, setFilterType] = useState('ALL');

    const telegramUser = WebApp.initDataUnsafe?.user;

    useEffect(() => {
        apiClient.get('/api/visits')
            .then(res => {
                const all = res.data || [];
                // Фильтруем сразу, показываем только МОИ (если знаем Telegram ID)
                const myVisits = telegramUser?.id
                    ? all.filter((v: any) => 
                        v.user?.telegramId === String(telegramUser?.id) || v.userId === telegramUser?.id
                    )
                    : all;
                setVisits(myVisits);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [telegramUser]);

    // Применяем фильтры
    const filteredVisits = useMemo(() => {
        return visits.filter(v => {
            if (filterDate) {
                const vDate = new Date(v.date).toISOString().split('T')[0];
                if (vDate !== filterDate) return false;
            }
            if (filterType !== 'ALL') {
                if (v.type !== filterType) return false;
            }
            return true;
        });
    }, [visits, filterDate, filterType]);

    return (
        <Layout>
            <div className="pt-2 px-4 pb-32 space-y-4">
                <PageHeader title="Моя история" back />

                {/* Блок фильтров */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                    {/* Фильтр Даты */}
                    <div className="relative shrink-0">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Calendar size={16} />
                        </div>
                        <input 
                            type="date"
                            className="bg-white pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium border border-gray-100 shadow-sm outline-none focus:ring-2 ring-blue-100 text-[#1C1C1E]"
                            value={filterDate}
                            onChange={e => setFilterDate(e.target.value)}
                        />
                    </div>

                    {/* Фильтр Типа */}
                    <div className="relative shrink-0">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                            <Filter size={16} />
                        </div>
                        <select
                            className="bg-white pl-10 pr-8 py-2.5 rounded-xl text-sm font-medium border border-gray-100 shadow-sm outline-none focus:ring-2 ring-blue-100 text-[#1C1C1E] appearance-none"
                            value={filterType}
                            onChange={e => setFilterType(e.target.value)}
                        >
                            <option value="ALL">Все активности</option>
                            <option value="checkup">Открытая смена</option>
                            <option value="transit">Проезд</option>
                            <option value="training">B2B</option>
                            <option value="tasting">Дегустация</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center text-gray-400 py-10">Загрузка...</div>
                ) : filteredVisits.length === 0 ? (
                    <div className="text-center text-gray-400 py-10">История пуста</div>
                ) : (
                    <div className="space-y-3">
                        {filteredVisits.map((visit) => {
                            const dateObj = new Date(visit.date);
                            const time = dateObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                            const date = dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
                            
                            const activityName = ACTIVITY_NAMES[visit.type] || visit.type;
                            const comment = visit.comment || (visit.data && typeof visit.data === 'object' ? (visit.data as any).comment : null);

                            return (
                                <div key={visit.id} className="bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 flex items-start gap-4">
                                    <div className="hidden sm:flex flex-col items-center justify-center min-w-[50px] text-center pt-1 border-r border-gray-100 pr-4">
                                        <span className="font-bold text-lg text-[#1C1C1E]">{time}</span>
                                        <span className="text-xs text-gray-400">{date}</span>
                                    </div>
                                    
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                                {activityName}
                                            </span>
                                            <div className="text-right sm:hidden">
                                                <span className="text-xs font-bold text-[#1C1C1E] block">{time}</span>
                                                <span className="text-[10px] text-gray-400 block">{date}</span>
                                            </div>
                                        </div>
                                        
                                        <h3 className="font-bold text-[#1C1C1E] text-base mb-1">{visit.facility?.name || 'Неизвестно'}</h3>
                                        
                                        <div className="flex items-center gap-1 text-xs text-gray-400">
                                            <MapPin size={12} />
                                            <span className="truncate max-w-[200px]">{visit.facility?.address}</span>
                                        </div>

                                        {comment && (
                                            <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg italic flex items-center gap-2">
                                                <Clock size={14} className="text-gray-300" />
                                                <span className="leading-snug">"{comment}"</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Layout>
    );
};
