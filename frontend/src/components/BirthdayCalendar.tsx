import React from 'react';
import { PageHeader } from './PageHeader';
import { StandardCard } from './ui/StandardCard';
import { Gift } from 'lucide-react';

export const BirthdayCalendar: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    // В будущем будем брать из API: apiClient.get('/api/users/birthdays')
    const birthdays = [
        { id: 1, name: 'Алина (Маркетинг)', date: '24.12', daysLeft: 3 },
        { id: 2, name: 'Виктор (CEO)', date: '10.01', daysLeft: 20 },
        { id: 3, name: 'Сергей (Склад)', date: '15.01', daysLeft: 25 },
        { id: 4, name: 'Мария (Sales)', date: '02.02', daysLeft: 42 },
    ];

    return (
        <div className="pt-2 px-4 pb-32 space-y-4">
            <PageHeader title="Дни рождения" rightAction={<button onClick={onBack}>Закрыть</button>} />

            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-6 text-white shadow-lg mb-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-bold">Ближайший праздник</h2>
                        <p className="opacity-90 mt-1">через {birthdays[0].daysLeft} дня</p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-full">
                        <Gift size={24} />
                    </div>
                </div>
                <div className="mt-6 font-medium text-lg">
                    🎉 {birthdays[0].name}
                </div>
            </div>

            <h3 className="font-bold text-gray-400 uppercase text-xs pl-2">Скоро</h3>

            <div className="space-y-2">
                {birthdays.map((b) => (
                    <StandardCard key={b.id} title={b.name}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center font-bold text-xs">
                                    {b.date}
                                </div>
                                <span className="font-medium text-gray-900">{b.name}</span>
                            </div>
                            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                                через {b.daysLeft} дн.
                            </span>
                        </div>
                    </StandardCard>
                ))}
            </div>
        </div>
    );
};