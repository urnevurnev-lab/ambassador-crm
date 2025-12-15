import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import apiClient from '../api/apiClient';
import { CheckCircle2, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

interface Visit {
    id: number;
    date: string;
    type: string;
    comment?: string;
    facility: { name: string; address: string; };
}

export const VisitsHistoryPage: React.FC = () => {
    const [visits, setVisits] = useState<Visit[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/api/visits')
            .then(res => {
                // Sort by date desc
                const sorted = (res.data || []).sort((a: Visit, b: Visit) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                );
                setVisits(sorted);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'checkup': return 'Проверка полки';
            case 'training': return 'Обучение';
            case 'tasting': return 'Дегустация';
            default: return 'Визит';
        }
    };

    return (
        <Layout>
            <PageHeader title="История визитов" back />

            <div className="pt-[calc(env(safe-area-inset-top)+60px)] px-4 pb-32 space-y-4 min-h-screen bg-[#F8F9FA]">
                {loading ? (
                    <div className="text-center text-gray-400 mt-10">Загрузка...</div>
                ) : (
                    <>
                        {visits.map((visit, i) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={visit.id}
                                className="bg-white p-6 rounded-[30px] border border-gray-100 shadow-sm"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <div className="font-bold text-lg text-[#1C1C1E] leading-tight mb-1">{visit.facility?.name || 'Неизвестно'}</div>
                                        <div className="flex items-center text-xs text-gray-400 gap-1">
                                            <MapPin size={12} /> {visit.facility?.address || 'Без адреса'}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 text-gray-500 font-bold text-[10px] px-3 py-1.5 rounded-full uppercase tracking-wide">
                                        {new Date(visit.date).toLocaleDateString()}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${visit.type === 'checkup' ? 'bg-blue-50 text-blue-600' :
                                        visit.type === 'training' ? 'bg-purple-50 text-purple-600' :
                                            'bg-orange-50 text-orange-600'
                                        }`}>
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-[#1C1C1E]">{getTypeLabel(visit.type)}</div>
                                        <div className="text-xs text-gray-400">Успешно завершено</div>
                                    </div>
                                </div>

                                {visit.comment && (
                                    <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-2xl italic border border-gray-100/50">
                                        "{visit.comment}"
                                    </div>
                                )}
                            </motion.div>
                        ))}
                        {visits.length === 0 && (
                            <div className="text-center text-gray-400 py-10">История пуста</div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
};
