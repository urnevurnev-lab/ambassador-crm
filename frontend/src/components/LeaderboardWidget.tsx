import React from 'react';
import { Trophy, TrendingUp } from 'lucide-react';

const LeaderboardWidget: React.FC = () => {
    // Mock Data: Сортировка по среднему чеку
    const leaders = [
        { id: 1, name: 'Виктор Урнев', avgCheck: 15400, orders: 12 },
        { id: 2, name: 'Анна С.', avgCheck: 12800, orders: 15 },
        { id: 3, name: 'Дмитрий К.', avgCheck: 9500, orders: 8 },
    ];

    const formatMoney = (val: number) => new Intl.NumberFormat('ru-RU').format(val);

    return (
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100">
            {/* Заголовок */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="bg-yellow-100 p-1.5 rounded-lg text-yellow-600">
                        <Trophy size={16} />
                    </div>
                    <h3 className="font-bold text-[#1C1C1E]">Лидеры месяца</h3>
                </div>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md uppercase">
                    По ср. чеку
                </span>
            </div>

            {/* Список */}
            <div className="space-y-4">
                {leaders.map((leader, index) => (
                    <div key={leader.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {/* Медалька за 1, 2, 3 место */}
                            <div className={`
                                w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                                  index === 1 ? 'bg-gray-100 text-gray-600' : 
                                  index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-white text-gray-400'}
                            `}>
                                {index + 1}
                            </div>
                            
                            <div>
                                <div className="text-sm font-bold text-[#1C1C1E]">{leader.name}</div>
                                <div className="text-[10px] text-gray-400">{leader.orders} заказов</div>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="text-sm font-bold text-[#1C1C1E]">{formatMoney(leader.avgCheck)} ₽</div>
                            <div className="text-[10px] text-gray-400 flex items-center justify-end gap-1">
                                <TrendingUp size={10} className="text-green-500" />
                                ср. чек
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const LeaderboardWidgetContainer = () => {
    return <LeaderboardWidget />;
};

export default LeaderboardWidget;
