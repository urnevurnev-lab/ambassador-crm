import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Package } from 'lucide-react';

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
            <div className="flex items-center justify-between mb-4">
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
                        className="flex items-center space-x-3"
                    >
                        <div className="w-8 h-8 flex items-center justify-center text-xl">
                            {item.avatar}
                        </div>

                        <div className="flex-1">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-[#1C1C1E]">{item.name}</span>
                                <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                    {item.score} баллов
                                </span>
                            </div>
                            <div className="flex items-center space-x-3 text-xs text-gray-400 mt-1">
                                <span className="flex items-center">
                                    <Package size={12} className="mr-1" />
                                    {item.skuCount} SKU
                                </span>
                                <span className="flex items-center">
                                    <TrendingUp size={12} className="mr-1" />
                                    {Math.round(item.ordersVolume / 1000)}k ₽
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
