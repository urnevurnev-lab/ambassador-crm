import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import apiClient from '../api/apiClient';
import { Plus, Minus, Send, Store } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { motion } from 'framer-motion';

interface Product { id: number; flavor: string; line: string; sku: string; }


import { useFacilities } from '../context/FacilitiesContext';

export const OrderPage: React.FC = () => {
    const [step, setStep] = useState<1 | 2>(1);
    const { facilities, loading: facilitiesLoading } = useFacilities();
    const [products, setProducts] = useState<Product[]>([]);

    const [search, setSearch] = useState('');
    const [selectedFacility, setSelectedFacility] = useState<number | null>(null);
    const [cart, setCart] = useState<Record<number, number>>({});
    const [productsLoading, setProductsLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/api/products')
            .then(res => setProducts(res.data || []))
            .finally(() => setProductsLoading(false));
    }, []);

    const loading = facilitiesLoading || productsLoading;

    const filteredFacilities = facilities.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.address.toLowerCase().includes(search.toLowerCase())
    );

    const updateCart = (pid: number, delta: number) => {
        setCart(prev => {
            const next = { ...prev };
            const newCount = (next[pid] || 0) + delta;
            if (newCount <= 0) delete next[pid];
            else next[pid] = newCount;
            return next;
        });
    };

    const handleSendOrder = async () => {
        if (!selectedFacility) return;
        try {
            await apiClient.post('/api/orders', {
                facilityId: selectedFacility,
                items: Object.entries(cart).map(([pid, qty]) => ({ productId: Number(pid), quantity: qty }))
            });
            WebApp.showAlert('Заказ отправлен дистрибьютору!');
            setCart({});
            setStep(1);
        } catch (e) {
            WebApp.showAlert('Ошибка отправки заказа');
        }
    };

    if (loading) return <Layout><div className="h-screen flex items-center justify-center text-gray-400">Загрузка...</div></Layout>;

    // Группировка товаров по линейкам
    const groupedProducts = products.reduce((acc, p) => {
        if (!acc[p.line]) acc[p.line] = [];
        acc[p.line].push(p);
        return acc;
    }, {} as Record<string, Product[]>);

    return (
        <Layout>
            <PageHeader title="Новый заказ" back={step === 2} onBack={() => { setStep(1); setSearch(''); }} />

            <div className="pt-[60px] pb-32">

                {/* Шаг 1: Выбор точки */}
                {step === 1 && (
                    <div className="space-y-4 px-4">
                        {/* Sticky Search */}
                        <div className="sticky top-[70px] z-30 pb-2">
                            <div className="bg-white p-2 rounded-[24px] shadow-sm border border-gray-100 flex items-center gap-2">
                                <Store className="text-gray-400 ml-2" size={20} />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Поиск заведения..."
                                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400 py-2"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            {filteredFacilities.map((f, i) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    key={f.id}
                                    onClick={() => { setSelectedFacility(f.id); setStep(2); }}
                                    whileTap={{ scale: 0.98 }}
                                    className="bg-white p-5 rounded-[30px] border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                                            <Store size={24} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-[#1C1C1E] text-lg">{f.name}</div>
                                            <div className="text-xs text-gray-400 mt-1">{f.address}</div>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full border-2 border-gray-100 flex items-center justify-center">
                                        <div className="w-4 h-4 rounded-full bg-gray-100" />
                                    </div>
                                </motion.div>
                            ))}
                            {filteredFacilities.length === 0 && (
                                <div className="text-center text-gray-400 py-10">Ничего не найдено</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Шаг 2: Формирование корзины */}
                {step === 2 && (
                    <div className="space-y-4 px-4">
                        {Object.entries(groupedProducts).map(([line, items]) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={line}
                                className="bg-white rounded-[30px] p-6 border border-gray-100 shadow-sm"
                            >
                                <h3 className="font-bold text-xl mb-6 text-[#1C1C1E]">{line}</h3>
                                <div className="space-y-6">
                                    {items.map(p => (
                                        <div key={p.id} className="flex justify-between items-center">
                                            <div className="text-sm font-bold text-gray-700 w-1/2">{p.flavor}</div>

                                            <div className="flex items-center bg-gray-50 rounded-2xl p-1.5 gap-2">
                                                <button
                                                    onClick={() => updateCart(p.id, -1)}
                                                    className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm text-gray-600 active:scale-90 transition"
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <div className="w-8 text-center font-bold text-[#1C1C1E]">
                                                    {cart[p.id] || 0}
                                                </div>
                                                <button
                                                    onClick={() => updateCart(p.id, 1)}
                                                    className="w-8 h-8 flex items-center justify-center bg-[#1C1C1E] text-white rounded-xl shadow-sm active:scale-90 transition"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Плашка итого (только на шаге 2) */}
                {step === 2 && Object.keys(cart).length > 0 && (
                    <div className="fixed bottom-[80px] left-0 right-0 px-4 z-[3000]">
                        <button
                            onClick={handleSendOrder}
                            className="w-full h-14 bg-[#1C1C1E] text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition shadow-2xl border border-gray-700/10"
                        >
                            <Send size={20} /> Отправить заказ ({Object.values(cart).reduce((a, b) => a + b, 0)} шт.)
                        </button>
                    </div>
                )}

            </div>
        </Layout>
    );
};

export default OrderPage;
