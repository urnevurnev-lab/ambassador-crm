import { useMemo } from 'react';
import { Check } from 'lucide-react';

interface Product { id: number; flavor: string; line: string; sku: string; }

interface Props {
    products: Product[];
    selectedProducts: number[];
    onToggleProduct: (id: number) => void;
    note: string;
    onNoteChange: (value: string) => void;
    onSubmit: () => void;
}

export const InventoryForm = ({ products, selectedProducts, onToggleProduct, note, onNoteChange, onSubmit }: Props) => {
    const groupedProducts = useMemo(() => {
        return products.reduce((acc, p) => {
            (acc[p.line] = acc[p.line] || []).push(p);
            return acc;
        }, {} as Record<string, Product[]>);
    }, [products]);

    return (
        <div className="pb-24 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Отметьте наличие</h2>
            </div>
            
            {Object.entries(groupedProducts).map(([line, prods]) => (
                <div key={line} className="bg-white p-4 rounded-3xl shadow-sm">
                    <div className="text-xs font-bold text-gray-400 uppercase mb-3">{line}</div>
                    <div className="space-y-2">
                        {prods.map(p => {
                            const isSelected = selectedProducts.includes(p.id);
                            return (
                                <div
                                    key={p.id}
                                    onClick={() => onToggleProduct(p.id)}
                                    className={`flex justify-between p-3 rounded-xl border transition cursor-pointer ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-100'}`}
                                >
                                    <span className="font-medium">{p.flavor}</span>
                                    {isSelected && <Check size={18} className="text-blue-500" />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}

            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                <div className="text-xs font-bold text-gray-400 uppercase mb-2">Комментарий по выкладке</div>
                <textarea
                    value={note}
                    onChange={(e) => onNoteChange(e.target.value)}
                    placeholder="Что нашли / чего нет, договоренности по поставкам"
                    className="w-full h-28 p-3 rounded-2xl border border-gray-100 focus:ring-2 ring-blue-500 shadow-inner resize-none"
                />
            </div>

            <button
                onClick={onSubmit}
                className="fixed bottom-6 left-4 right-4 bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-xl z-50 active:scale-95 transition"
            >
                Далее
            </button>
        </div>
    );
};
