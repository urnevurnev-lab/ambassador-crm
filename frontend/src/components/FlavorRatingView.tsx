import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import apiClient from '../api/apiClient';

interface RatingItem {
    id: number;
    flavor: string;
    score: number;
}
type RatingData = Record<string, RatingItem[]>;

interface FlavorRatingViewProps {
    onBack: () => void;
}

export const FlavorRatingView: React.FC<FlavorRatingViewProps> = ({ onBack }) => {
    const [data, setData] = useState<RatingData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/api/samples/analytics')
            .then(res => setData(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="pt-[calc(env(safe-area-inset-top)+20px)] px-4 pb-32">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={onBack}
                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-[#1C1C1E] active:scale-95 transition"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold text-[#1C1C1E]">Рейтинг вкусов</h1>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-50 rounded-2xl animate-pulse" />)}
                </div>
            ) : data ? (
                <div className="space-y-8">
                    {Object.entries(data).map(([line, items], lineIdx) => (
                        <motion.div
                            key={line}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: lineIdx * 0.1 }}
                            className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100"
                        >
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-2 h-6 bg-[#1C1C1E] rounded-full" />
                                <h3 className="text-lg font-bold text-[#1C1C1E] uppercase tracking-wide">{line}</h3>
                            </div>

                            <div className="space-y-4">
                                {items.map((item, idx) => {
                                    // Calculate relative percentage against the top item in this line (or global max?)
                                    // Usually rating is relative to the best performer in the list
                                    const maxScore = items[0]?.score || 1;
                                    const percent = (item.score / maxScore) * 100;

                                    return (
                                        <div key={item.id} className="relative">
                                            <div className="flex justify-between items-center z-10 relative mb-2">
                                                <span className="font-medium text-[#1C1C1E] text-sm">
                                                    {idx + 1}. {item.flavor}
                                                </span>
                                            </div>

                                            {/* Beautiful Bar */}
                                            <div className="h-3 bg-gray-50 rounded-full overflow-hidden w-full">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percent}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    className={`h-full rounded-full ${idx === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                                                            idx === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
                                                                idx === 2 ? 'bg-gradient-to-r from-orange-200 to-orange-300' :
                                                                    'bg-gray-200'
                                                        }`}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : null}
        </div>
    );
};
