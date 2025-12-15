import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Product { category: string; line: string; }
interface FacilitySaturationProps {
    currentStock: Product[];
    missing: Product[];
}

export const FacilitySaturation: React.FC<FacilitySaturationProps> = ({ currentStock, missing }) => {

    const stats = useMemo(() => {
        // Collect all lines
        const allLines = new Set([...currentStock.map(p => p.line), ...missing.map(p => p.line)]);
        const result: { line: string; current: number; total: number; percent: number }[] = [];

        allLines.forEach(line => {
            // Skip undefined lines
            if (!line) return;

            const inStock = currentStock.filter(p => p.line === line).length;
            const isMissing = missing.filter(p => p.line === line).length;
            const total = inStock + isMissing;
            if (total > 0) {
                result.push({
                    line,
                    current: inStock,
                    total,
                    percent: Math.round((inStock / total) * 100)
                });
            }
        });

        return result.sort((a, b) => b.percent - a.percent);
    }, [currentStock, missing]);

    if (stats.length === 0) return null;

    return (
        <div className="bg-white p-5 rounded-[30px] shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-[#1C1C1E] mb-4">Насыщенность по линейкам</h3>
            <div className="space-y-4">
                {stats.map((item) => (
                    <div key={item.line}>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-gray-600">{item.line}</span>
                            <span className={item.percent < 50 ? 'text-orange-500' : 'text-green-600'}>{item.percent}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.percent}%` }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className={`h-full rounded-full ${item.percent < 50 ? 'bg-orange-400' : 'bg-[#007AFF]'}`}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
