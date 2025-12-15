import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

interface Product { id: number; flavor: string; line: string; }
interface FacilityMustListProps {
    missing: Product[];
}

export const FacilityMustList: React.FC<FacilityMustListProps> = ({ missing }) => {
    const isComplete = !missing || missing.length === 0;

    return (
        <div className="bg-white rounded-[30px] p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    Сверка с Must List
                </h3>
                {isComplete ? (
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">100%</span>
                ) : (
                    <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">-{missing.length} SKU</span>
                )}
            </div>

            {isComplete ? (
                <div className="text-center py-6 text-green-600 font-medium flex flex-col items-center">
                    <CheckCircle2 size={48} className="mb-2 opacity-50" />
                    <div>Полка идеальна!</div>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Отсутствует на полке</div>
                    {missing.map((p, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl border border-red-100">
                            <div className="flex items-center gap-3">
                                <XCircle className="text-red-400" size={18} />
                                <div>
                                    <div className="text-sm font-bold text-[#1C1C1E]">{p.flavor}</div>
                                    <div className="text-[10px] text-gray-500">{p.line}</div>
                                </div>
                            </div>
                            <div className="text-xs font-bold text-red-500 bg-white px-2 py-1 rounded-lg border border-red-100">
                                Must Have
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
