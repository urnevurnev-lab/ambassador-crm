import React, { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { MapPin, Calendar, Filter } from 'lucide-react';
import WebApp from '@twa-dev/sdk';

const VisitsHistoryPage: React.FC = () => {
    const [visits, setVisits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const telegramUser = WebApp.initDataUnsafe?.user;

    useEffect(() => {
        apiClient.get('/api/visits')
            .then(res => {
                const all = res.data || [];
                // Фильтрация по пользователю
                const myVisits = all.filter((v: any) => 
                    v.user?.telegramId === String(telegramUser?.id) || v.userId === telegramUser?.id
                );
                setVisits(myVisits);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [telegramUser]);

    return (
        <Layout>
            <div className="pt-4 px-4 pb-32 space-y-4">
                <PageHeader title="Моя история" back />
                {loading ? (
                    <div className="text-center py-10 text-gray-400">Загрузка...</div>
                ) : visits.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">История пуста</div>
                ) : (
                    <div className="space-y-3">
                        {visits.map(visit => (
                            <div key={visit.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                                <div className="flex justify-between mb-1">
                                    <span className="font-bold text-[#1C1C1E]">{visit.facility?.name}</span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(visit.date).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <MapPin size={12}/> {visit.facility?.address}
                                </div>
                                <div className="mt-2 text-xs bg-gray-50 p-2 rounded-lg text-gray-700">
                                    {visit.type}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};

// --- ОБЯЗАТЕЛЬНЫЙ EXPORT DEFAULT ---
export default VisitsHistoryPage;