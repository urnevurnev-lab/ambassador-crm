import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import apiClient from '../api/apiClient';
import WebApp from '@twa-dev/sdk';

interface Product { id: number; flavor: string; line: string; }
interface SampleOrderWizardProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SampleOrderWizard: React.FC<SampleOrderWizardProps> = ({ isOpen, onClose }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [lines, setLines] = useState<string[]>([]);
    const [activeLine, setActiveLine] = useState<string>('');
    const [cart, setCart] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && products.length === 0) {
            apiClient.get('/api/products').then(res => {
                const data = res.data || [];
                setProducts(data);
                const uniqueLines = Array.from(new Set(data.map((p: Product) => p.line))) as string[];
                setLines(uniqueLines);
                if (uniqueLines.length > 0) setActiveLine(uniqueLines[0]);
            });
        }
    }, [isOpen]);

    const updateCart = (pid: number, delta: number) => {
        setCart(prev => {
            const next = { ...prev };
            const newCount = (next[pid] || 0) + delta;
            if (newCount <= 0) delete next[pid];
            else next[pid] = newCount;
            return next;
        });
    };

    const handleSubmit = async () => {
        if (Object.keys(cart).length === 0) return;
        setLoading(true);
        try {
            await apiClient.post('/api/samples', {
                items: Object.entries(cart).map(([pid, qty]) => ({ productId: Number(pid), quantity: qty }))
            });
            WebApp.showAlert('Заказ на пробники создан!');
            setCart({});
            onClose();
        } catch (e) {
            console.error(e);
            WebApp.showAlert('Ошибка создания заказа');
        } finally {
            setLoading(false);
        }
    };

    const currentLineProducts = products.filter(p => p.line === activeLine);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm z-0"
                onClick={onClose}
            />

            <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                className="bg-white w-full max-w-md rounded-t-[30px] p-6 pb-12 h-[90vh] flex flex-col relative z-10 shadow-2xl"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-[#1C1C1E]">Заказ пробников</h2>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500 active:scale-95 transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Line Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                    {lines.map(line => (
                        <button
                            key={line}
                            onClick={() => setActiveLine(line)}
                            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition ${activeLine === line
                                    ? 'bg-[#1C1C1E] text-white'
                                    : 'bg-gray-100 text-gray-500'
                                }`}
                        >
                            {line}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto space-y-3">
                    {currentLineProducts.map(p => (
                        <div key={p.id} className="flex items-center justify-between p-3 border-b border-gray-50 last:border-0">
                            <span className="font-medium text-[#1C1C1E] text-sm">{p.flavor}</span>

                            <div className="flex items-center bg-gray-50 rounded-lg p-1">
                                <button onClick={() => updateCart(p.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-400 active:scale-90 transition">
                                    <Minus size={16} />
                                </button>
                                <div className="w-8 text-center font-bold text-sm">
                                    {cart[p.id] || 0}
                                </div>
                                <button onClick={() => updateCart(p.id, 1)} className="w-8 h-8 flex items-center justify-center bg-[#1C1C1E] text-white rounded-md shadow-sm active:scale-90 transition">
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                    <button
                        disabled={Object.keys(cart).length === 0 || loading}
                        onClick={handleSubmit}
                        className="w-full py-4 bg-[#1C1C1E] text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition"
                    >
                        {loading ? 'Отправка...' : `Оформить (${Object.values(cart).reduce((a, b) => a + b, 0)} шт)`} <ShoppingBag size={20} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
