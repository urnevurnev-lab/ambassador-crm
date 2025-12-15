import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import apiClient from '../api/apiClient';
import { Plus, Minus, Send, Store } from 'lucide-react';
import WebApp from '@twa-dev/sdk';

interface Product { id: number; flavor: string; line: string; sku: string; }
interface Facility { id: number; name: string; address: string; }

export const OrderPage: React.FC = () => {
    const [step, setStep] = useState<1 | 2>(1);
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [products, setProducts] = useState<Product[]>([]);

    const [search, setSearch] = useState('');
    const [selectedFacility, setSelectedFacility] = useState<number | null>(null);
    const [cart, setCart] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            apiClient.get('/api/facilities'),
            apiClient.get('/api/products'),
        ]).then(([facRes, prodRes]) => {
            setFacilities(facRes.data || []);
            setProducts(prodRes.data || []);
        }).finally(() => setLoading(false));
    }, []);

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
                    <div className="space-y-4">
                        {/* Sticky Search */}
                        <div className="sticky top-[56px] z-30 bg-[#F8F9FA] pb-2 pt-2 -mx-4 px-4 shadow-sm">
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Поиск по названию или адресу..."
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20"
                            />
                        </div>

                        <div className="space-y-2">
                            {filteredFacilities.map(f => (
                                <div
                                    key={f.id}
                                    onClick={() => { setSelectedFacility(f.id); setStep(2); }}
                                    className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between active:scale-95 transition cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                                            <Store size={20} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-[#1C1C1E]">{f.name}</div>
                                            <div className="text-xs text-gray-400">{f.address}</div>
                                        </div>
                                    </div>
                                    <div className="w-6 h-6 rounded-full border-2 border-gray-200 shrink-0"></div>
                                </div>
                            ))}
                            {filteredFacilities.length === 0 && (
                                <div className="text-center text-gray-400 py-8">Ничего не найдено</div>
                            )}
                        </div>
                    </div>
                )}

                {/* Шаг 2: Формирование корзины */}
                {step === 2 && (
                    <div className="space-y-6">
                        {Object.entries(groupedProducts).map(([line, items]) => (
                            <div key={line} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                                <h3 className="font-bold text-lg mb-4 text-[#1C1C1E]">{line}</h3>
                                <div className="space-y-4">
                                    {items.map(p => (
                                        <div key={p.id} className="flex justify-between items-center">
                                            <div className="text-sm font-medium text-gray-700">{p.flavor}</div>

                                            <div className="flex items-center bg-gray-50 rounded-lg p-1">
                                                <button
                                                    onClick={() => updateCart(p.id, -1)}
                                                    className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-600 active:scale-90 transition"
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <div className="w-10 text-center font-bold text-[#1C1C1E]">
                                                    {cart[p.id] || 0}
                                                </div>
                                                <button
                                                    onClick={() => updateCart(p.id, 1)}
                                                    className="w-8 h-8 flex items-center justify-center bg-[#1C1C1E] text-white rounded-md shadow-sm active:scale-90 transition"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Плашка итого (только на шаге 2) */}
                {step === 2 && Object.keys(cart).length > 0 && (
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-50 pb-[calc(env(safe-area-inset-bottom)+20px)]">
                        <button
                            onClick={handleSendOrder}
                            className="w-full h-14 bg-[#1C1C1E] text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition shadow-lg"
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
