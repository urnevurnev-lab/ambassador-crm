import React, { useState } from 'react';
import { CheckCircle2, XCircle, ShoppingBasket, ArrowRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface Product { id: number; flavor: string; category: string; line: string; }
interface FacilityMustListProps {
    missing: Product[];
    onOrder?: (items: Product[]) => void;
}

export const FacilityMustList: React.FC<FacilityMustListProps> = ({ missing, onOrder }) => {
    const navigate = useNavigate();
    const [restoredIds, setRestoredIds] = useState<number[]>([]);

    const toggleRestored = (id: number) => {
        setRestoredIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleCreateOrder = () => {
        if (onOrder) {
            // Find the full product objects
            const items = missing.filter(p => restoredIds.includes(p.id));
            onOrder(items);
        } else {
            navigate('/orders');
        }
    };

    // Calculate effective missing count (original missing - restored)
    const effectiveMissingCount = missing.length - restoredIds.length;
    const isComplete = missing.length === 0;

    return (
        <div className="bg-white rounded-[30px] p-5 shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    Сверка с Must List
                </h3>
                {isComplete ? (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">100%</span>
                ) : (
                    <div className="flex gap-2">
                        <span className={`${effectiveMissingCount === 0 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'} px-3 py-1 rounded-full text-xs font-bold transition-colors`}>
                            {effectiveMissingCount === 0 ? 'Готово' : `-${effectiveMissingCount} SKU`}
                        </span>
                    </div>
                )}
            </div>

            {isComplete ? (
                <div className="text-center py-6 text-green-600 font-medium flex flex-col items-center">
                    <CheckCircle2 size={48} className="mb-2 opacity-50" />
                    <div>Полка идеальна!</div>
                </div>
            ) : (
                <div className="space-y-3 pb-2">
                    <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">
                        {effectiveMissingCount === 0 ? 'Все позиции отмечены' : 'Отсутствует на полке'}
                    </div>

                    <AnimatePresence mode='popLayout'>
                        {missing.map((p) => {
                            const isRestored = restoredIds.includes(p.id);
                            return (
                                <motion.div
                                    layout
                                    key={p.id}
                                    onClick={() => toggleRestored(p.id)}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer active:scale-[0.98] ${isRestored
                                        ? 'bg-green-50 border-green-200 shadow-sm'
                                        : 'bg-red-50/50 border-red-100'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {isRestored ? (
                                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0">
                                                <Check size={12} strokeWidth={3} />
                                            </div>
                                        ) : (
                                            <XCircle className="text-red-400 shrink-0" size={20} />
                                        )}

                                        <div>
                                            <div className={`text-sm font-bold ${isRestored ? 'text-green-800' : 'text-[#1C1C1E]'}`}>
                                                {p.flavor}
                                            </div>
                                            <div className={`text-[10px] ${isRestored ? 'text-green-600' : 'text-gray-500'}`}>
                                                {p.line}
                                            </div>
                                        </div>
                                    </div>

                                    {isRestored ? (
                                        <div className="text-xs font-bold text-green-600 bg-white px-2 py-1 rounded-lg border border-green-100 shadow-sm">
                                            В заказ
                                        </div>
                                    ) : (
                                        <div className="text-xs font-bold text-red-500 bg-white px-2 py-1 rounded-lg border border-red-100">
                                            Must Have
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>

                    {/* Action Button if items are restored */}
                    <AnimatePresence>
                        {restoredIds.length > 0 && (
                            <motion.button
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                onClick={handleCreateOrder}
                                className="w-full mt-4 bg-[#1C1C1E] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition shadow-lg"
                            >
                                <ShoppingBasket size={18} />
                                <span>Оформить ({restoredIds.length})</span>
                                <ArrowRight size={16} className="opacity-60" />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};
