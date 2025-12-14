import { useMemo } from 'react';
import { Check } from 'lucide-react';

interface Product { id: number; flavor: string; line: string; sku: string; }

interface Props {
    products: Product[];
    selectedProducts: number[];
    onToggleProduct: (id: number) => void;
    contacts: string;
    onContactsChange: (value: string) => void;
    comment: string;
    onCommentChange: (value: string) => void;
    onSubmit: () => void;
}

export const VisitForm = ({
    products,
    selectedProducts,
    onToggleProduct,
    contacts,
    onContactsChange,
    comment,
    onCommentChange,
    onSubmit
}: Props) => {
    const groupedProducts = useMemo(() => {
        return products.reduce((acc, p) => {
            (acc[p.line] = acc[p.line] || []).push(p);
            return acc;
        }, {} as Record<string, Product[]>);
    }, [products]);

    return (
        <div className="pb-24 space-y-6">
            <div className="bg-white p-4 rounded-3xl shadow-sm">
                <div className="text-xs font-bold text-gray-400 uppercase mb-3">Какие вкусы стоят на полке?</div>
                {Object.entries(groupedProducts).map(([line, prods]) => (
                    <div key={line} className="mb-4 last:mb-0">
                        <div className="text-[11px] font-bold text-gray-500 uppercase mb-2">{line}</div>
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
            </div>

            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 space-y-3">
                <label className="block text-xs font-bold text-gray-500 uppercase">С кем общались? (Контакты)</label>
                <input
                    value={contacts}
                    onChange={(e) => onContactsChange(e.target.value)}
                    placeholder="Имя, роль, телефон/телеграм"
                    className="w-full p-3 rounded-2xl border border-gray-200 focus:ring-2 ring-blue-500"
                />
            </div>

            <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 space-y-3">
                <label className="block text-xs font-bold text-gray-500 uppercase">Комментарий (что делали, что курили)</label>
                <textarea
                    value={comment}
                    onChange={(e) => onCommentChange(e.target.value)}
                    placeholder="Коротко о взаимодействии, договоренности, фидбек по вкусам"
                    className="w-full h-28 p-3 rounded-2xl border border-gray-200 focus:ring-2 ring-blue-500 resize-none"
                />
            </div>

            <button
                onClick={onSubmit}
                className="fixed bottom-6 left-4 right-4 bg-black text-white py-4 rounded-2xl font-bold text-lg shadow-xl z-50 active:scale-95 transition"
            >
                Далее
            </button>
        </div>
    );
};
