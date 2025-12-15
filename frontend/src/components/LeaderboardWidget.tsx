import React from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

interface LeaderboardItem {
    id: number;
    name: string;
    skuCount: number;
    ordersVolume: number;
    score: number;
    avatar: string;
}

const mockData: LeaderboardItem[] = [
    { id: 1, name: 'Алексей', skuCount: 145, ordersVolume: 120000, score: 98, avatar: '🥇' },
    { id: 2, name: 'Мария', skuCount: 132, ordersVolume: 98000, score: 92, avatar: '🥈' },
    { id: 3, name: 'Иван', skuCount: 120, ordersVolume: 85000, score: 88, avatar: '🥉' },
];

export const LeaderboardWidget: React.FC = () => {
    return (
        <div className="bg-white rounded-[30px] p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-[#1C1C1E]">Топ Амбассадоров</h3>
                <Trophy className="text-yellow-500" size={24} />
            </div>

            <div className="space-y-4">
                {mockData.map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-4"
                    >
                        <div className={`w-8 h-8 flex items-center justify-center font-bold rounded-full ${index === 0 ? 'bg-yellow-100 text-yellow-600' :
                            index === 1 ? 'bg-gray-100 text-gray-500' :
                                index === 2 ? 'bg-orange-100 text-orange-600' : 'text-gray-400'
                            }`}>
                            {index + 1}
                        </div>

                        <div className="flex-1 flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                            <div className="flex items-center gap-3">
                                {/* Avatar placeholder if needed */}
                                {/* <div className="w-8 h-8 bg-gray-200 rounded-full"/> */}
                                <div>
                                    <div className="font-bold text-sm text-[#1C1C1E]">{item.name}</div>
                                    <div className="text-[10px] text-gray-400 font-medium uppercase">
                                        {item.skuCount} SKU / {Math.round(item.ordersVolume / 1000)}k ₽
                                    </div>
                                </div>
                            </div>

                            <div className="text-sm font-bold bg-white px-2 py-1 rounded-lg border border-gray-100 text-[#1C1C1E] shadow-sm">
                                {item.score}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
