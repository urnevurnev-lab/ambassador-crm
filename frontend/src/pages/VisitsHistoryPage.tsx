import React, { useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { StandardCard } from '../components/ui/StandardCard';
import { MapPin, Calendar, Clock } from 'lucide-react';
import WebApp from '@twa-dev/sdk';

const VisitsHistoryPage: React.FC = () => {
    const [visits, setVisits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
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

    return (
        <Layout>
            <div className="pt-4 px-4 pb-32 space-y-5">
                <PageHeader title="История Визитов" back />
                
                {loading ? <div className="text-center py-10 text-gray-400">Загрузка...</div> : 
                visits.length > 0 ? (
                    <div className="space-y-3">
                        {visits.map(visit => (
                            <StandardCard
                                key={visit.id}
                                title={visit.facility?.name || "Неизвестная точка"}
                                subtitle={visit.type || "Визит"}
                                color="white"
                                floating={false}
                                icon={MapPin}
                            >
                                <div className="flex items-center justify-between mt-2 text-xs text-gray-400 border-t border-gray-50 pt-2">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(visit.date).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock size={12} />
                                        {new Date(visit.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                </div>
                            </StandardCard>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-400 py-10">История пуста</div>
                )}
            </div>
        </Layout>
    );
};

export default VisitsHistoryPage;