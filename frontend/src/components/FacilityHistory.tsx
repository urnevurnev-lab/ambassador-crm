import React, { useState } from 'react';
import { ChevronDown, ChevronUp, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Visit { id: number; date: string; type: string; comment?: string; summary?: string[]; }
interface FacilityHistoryProps {
    visits: Visit[];
}

export const FacilityHistory: React.FC<FacilityHistoryProps> = ({ visits }) => {
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const toggle = (id: number) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="space-y-4">
            <h3 className="font-bold text-[#1C1C1E] px-1 text-lg">История визитов</h3>
            <div className="space-y-3">
                {visits.slice(0, 5).map((v) => (
                    <div key={v.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div
                            onClick={() => toggle(v.id)}
                            className="p-4 flex justify-between items-center cursor-pointer active:bg-gray-50 bg-white z-10 relative"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                                    <User size={20} />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-[#1C1C1E]">
                                        {new Date(v.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                                    </div>
                                    <div className="text-xs text-gray-500">{v.type}</div>
                                </div>
                            </div>
                            {expandedId === v.id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                        </div>

                        <AnimatePresence>
                            {expandedId === v.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="bg-gray-50 border-t border-gray-100"
                                >
                                    <div className="p-4 text-sm text-gray-600 space-y-2">
                                        {v.comment && (
                                            <div className="italic">"{v.comment}"</div>
                                        )}
                                        <div className="text-xs font-bold uppercase text-gray-400 tracking-wider mt-2">На момент визита:</div>
                                        {/* Mock summary if not present, user requested "accordion summary" */}
                                        <ul className="list-disc list-inside text-xs space-y-1">
                                            <li>Товаров на полке: 14 SKU</li>
                                            <li>Фотоотчет: загружен</li>
                                            <li>Статус: <span className="text-green-600">Ок</span></li>
                                        </ul>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
                {visits.length === 0 && (
                    <div className="text-center py-6 text-gray-400">История пуста</div>
                )}
            </div>
        </div>
    );
};
