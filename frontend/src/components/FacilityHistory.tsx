import React, { useState } from 'react';
import { ChevronDown, ChevronUp, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Visit {
    id: number;
    date: string;
    type: string;
    comment?: string;
    productsAvailable?: { id: number; flavor: string; line: string }[];
}
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
                    <div key={v.id} className="bg-white rounded-[30px] border border-gray-100 shadow-sm overflow-hidden">
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
                                    {v.comment && (
                                        <div className="italic">"{v.comment}"</div>
                                    )}

                                    {v.productsAvailable && v.productsAvailable.length > 0 ? (
                                        <div className="mt-3">
                                            <div className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">На полке ({v.productsAvailable.length}):</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {v.productsAvailable.map((p: any) => (
                                                    <div key={p.id} className="text-xs bg-white border border-gray-100 px-2 py-1 rounded-md text-gray-700">
                                                        {p.flavor}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-400 mt-2">Нет данных о товарах</div>
                                    )}
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
