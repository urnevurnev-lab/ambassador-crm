import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, User, Phone, Check, Plus, Minus, Star } from 'lucide-react';
import apiClient from '../api/apiClient';
import WebApp from '@twa-dev/sdk';

interface FastOrderWizardProps {
    isOpen: boolean;
    onClose: () => void;
    facilityId: number;
    items: { id: number; flavor: string; line: string; category?: string; sku?: string; isTopFlavor?: boolean }[];
}

interface Product {
    id: number;
    flavor: string;
    line: string;
    sku: string;
    category?: string;
    isTopFlavor?: boolean;
}

interface Distributor {
    id: number;
    name: string;
    fullName?: string;
}

export const FastOrderWizard: React.FC<FastOrderWizardProps> = ({ isOpen, onClose, facilityId, items }) => {
    const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('+7');

    const [products, setProducts] = useState<Product[]>([]);
    const [catalogLoading, setCatalogLoading] = useState(false);
    const [catalogError, setCatalogError] = useState<string | null>(null);
    const [catalogSearch, setCatalogSearch] = useState('');

    const [distributors, setDistributors] = useState<Distributor[]>([]);
    const [distributorsLoading, setDistributorsLoading] = useState(false);

    // Cart: productId -> quantity
    const [cart, setCart] = useState<Record<number, number>>({});
    const [selectedDistributor, setSelectedDistributor] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setName('');
            setPhone('+7');
            setSelectedDistributor(null);
            // Pre-select all Must-лист items by default (qty = 1)
            setCart(() => {
                const initial: Record<number, number> = {};
                for (const item of items) initial[item.id] = 1;
                return initial;
            });
            setCatalogError(null);
        }
    }, [isOpen, items]);

    // Load catalog + distributors when wizard opens
    useEffect(() => {
        if (!isOpen) return;

        let isCancelled = false;

        const loadCatalog = async () => {
            setCatalogLoading(true);
            setCatalogError(null);
            try {
                const res = await apiClient.get('/api/products');
                const data = (res.data || []) as Product[];
                if (isCancelled) return;
                setProducts(data);
            } catch (e) {
                console.error(e);
                if (!isCancelled) setCatalogError('Не удалось загрузить каталог');
            } finally {
                if (!isCancelled) setCatalogLoading(false);
            }
        };

        const loadDistributors = async () => {
            setDistributorsLoading(true);
            try {
                const res = await apiClient.get('/api/distributors');
                const data = (res.data || []) as Distributor[];
                if (isCancelled) return;
                setDistributors(data);
            } catch (e) {
                console.error(e);
                if (!isCancelled) {
                    // Fallback list (demo) if API is not available
                    setDistributors([
                        { id: 1, name: 'HookahMarket' },
                        { id: 2, name: 'Oshisha' },
                        { id: 3, name: 'PiterSmoke' },
                        { id: 4, name: 'S2B' },
                    ]);
                }
            } finally {
                if (!isCancelled) setDistributorsLoading(false);
            }
        };

        loadCatalog();
        loadDistributors();

        return () => {
            isCancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    const productById = React.useMemo(() => {
        return new Map(products.map((p) => [p.id, p]));
    }, [products]);

    const mustIds = React.useMemo(() => new Set(items.map((i) => i.id)), [items]);
    const topIds = React.useMemo(() => {
        const ids = new Set<number>();
        for (const item of items) ids.add(item.id);
        for (const p of products) if (p.isTopFlavor) ids.add(p.id);
        return ids;
    }, [items, products]);

    const visibleProducts = React.useMemo(() => {
        const term = catalogSearch.trim().toLowerCase();
        if (!term) return products;
        return products.filter((p) => p.flavor.toLowerCase().includes(term));
    }, [catalogSearch, products]);

    const updateCart = (productId: number, delta: number) => {
        setCart((prev) => {
            const next = { ...prev };
            const newCount = (next[productId] || 0) + delta;
            if (newCount <= 0) delete next[productId];
            else next[productId] = newCount;
            return next;
        });
    };

    const toggleInCart = (productId: number) => {
        setCart((prev) => {
            const next = { ...prev };
            if (next[productId]) delete next[productId];
            else next[productId] = 1;
            return next;
        });
    };

    // Phone number auto-format with +7 prefix
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        // Remove leading 7 or 8 if present
        if (val.startsWith('7') || val.startsWith('8')) val = val.slice(1);
        // Limit to 10 digits after +7
        val = val.slice(0, 10);
        setPhone('+7' + val);
    };

    const handleSubmit = async () => {
        if (!selectedDistributor) return;
        if (Object.keys(cart).length === 0) {
            WebApp.showAlert('Корзина пуста');
            return;
        }

        const unknown = Object.keys(cart)
            .map((id) => Number(id))
            .filter((id) => !productById.get(id)?.sku && !items.find((i) => i.id === id)?.sku);
        if (unknown.length > 0) {
            WebApp.showAlert('Не удалось определить SKU для некоторых позиций. Обновите каталог и попробуйте снова.');
            return;
        }

        setLoading(true);
        try {
            await apiClient.post('/api/orders', {
                facilityId,
                distributorId: selectedDistributor,
                contactName: name,
                contactPhone: phone,
                items: Object.entries(cart).map(([productId, quantity]) => {
                    const pid = Number(productId);
                    const p = productById.get(pid);
                    const sku = p?.sku || items.find((i) => i.id === pid)?.sku;
                    return { sku: sku as string, quantity };
                })
            });
            WebApp.showAlert('Заказ успешно отправлен!');
            onClose();
        } catch (e) {
            console.error(e);
            WebApp.showAlert('Ошибка отправки.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const totalSku = Object.keys(cart).length;
    const totalQty = Object.values(cart).reduce((a, b) => a + b, 0);

    return (
        <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center">
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-md z-0"
                onClick={onClose}
            />

            <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                className="bg-[#F2F2F7] w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 pb-12 h-[85vh] flex flex-col relative z-10 shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-6 px-1">
                    <div>
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                            Шаг {step} из 5
                        </div>
                        <h2 className="text-2xl font-bold text-[#1C1C1E] leading-none">
                            {step === 1
                                ? 'Must-лист'
                                : step === 2
                                    ? 'Каталог'
                                    : step === 3
                                        ? 'Корзина'
                                        : step === 4
                                            ? 'Дистрибьютор'
                                            : 'Контакты'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-black active:scale-95 transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto -mx-2 px-2 pb-4">
                    {step === 1 && (
                        <div className="space-y-3">
                            <p className="text-xs text-gray-500 mb-2">
                                Выберите позиции для заказа или пропустите этот шаг
                            </p>
                            {items.length === 0 ? (
                                <div className="text-center text-gray-400 py-10">Список пуст</div>
                            ) : (
                                items.map((item) => {
                                    const isSelected = !!cart[item.id];
                                    const qty = cart[item.id] || 0;
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => toggleInCart(item.id)}
                                            className={`p-4 rounded-2xl border-2 flex justify-between items-center shadow-sm cursor-pointer active:scale-[0.98] transition ${isSelected
                                                ? 'bg-white border-[#1C1C1E]'
                                                : 'bg-gray-50 border-transparent opacity-60'
                                                }`}
                                        >
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[#1C1C1E]">{item.flavor}</span>
                                                {topIds.has(item.id) && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                                            <Star size={12} />
                                                            ТОП
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-gray-500">×{qty}</span>
                                                    <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center">
                                                        <Check size={16} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                            <div className="text-center text-xs text-gray-400 mt-4">
                                Выбрано {items.filter((i) => !!cart[i.id]).length} из {items.length} позиций
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm">
                                <input
                                    value={catalogSearch}
                                    onChange={(e) => setCatalogSearch(e.target.value)}
                                    placeholder="Поиск вкуса..."
                                    className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-gray-400"
                                />
                            </div>

                            {catalogLoading && (
                                <div className="text-center text-gray-400 py-10">Загрузка каталога...</div>
                            )}
                            {!catalogLoading && catalogError && (
                                <div className="text-center text-gray-400 py-10">{catalogError}</div>
                            )}
                            {!catalogLoading && !catalogError && visibleProducts.length === 0 && (
                                <div className="text-center text-gray-400 py-10">Ничего не найдено</div>
                            )}

                            <div className="space-y-2">
                                {visibleProducts.map((p) => {
                                    const qty = cart[p.id] || 0;
                                    const isTop = topIds.has(p.id);
                                    return (
                                        <div
                                            key={p.id}
                                            className={`bg-white p-4 rounded-2xl border flex items-center justify-between shadow-sm ${isTop ? 'border-amber-200' : 'border-gray-100'
                                                }`}
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-[#1C1C1E] text-sm truncate">{p.flavor}</span>
                                                    {isTop && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full shrink-0">
                                                            <Star size={12} />
                                                            ТОП
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center bg-gray-50 rounded-xl p-1 gap-2 shrink-0">
                                                <button
                                                    onClick={() => updateCart(p.id, -1)}
                                                    className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-400 active:scale-90 transition"
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <div className="w-8 text-center font-bold text-sm">{qty}</div>
                                                <button
                                                    onClick={() => updateCart(p.id, 1)}
                                                    className="w-8 h-8 flex items-center justify-center bg-[#1C1C1E] text-white rounded-md shadow-sm active:scale-90 transition"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Итого</div>
                                        <div className="font-bold text-[#1C1C1E] text-lg">
                                            {totalSku} SKU • {totalQty} шт
                                        </div>
                                    </div>
                                    {totalSku === 0 && (
                                        <div className="text-xs font-bold text-red-500">Корзина пуста</div>
                                    )}
                                </div>
                                {Object.keys(cart).length > 0 && (
                                    <div className="mt-3 text-xs text-gray-400">
                                        Must-лист: {Array.from(mustIds).filter((id) => !!cart[id]).length} поз.
                                    </div>
                                )}
                            </div>

                            {totalSku === 0 ? (
                                <div className="text-center text-gray-400 py-8">Добавьте позиции в корзину в каталоге</div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
                                        <div className="px-4 pt-4 pb-3">
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Позиции</div>
                                        </div>
                                        <div className="px-4 pb-4 space-y-2">
                                            {Object.entries(cart)
                                                .map(([pid, qty]) => {
                                                    const id = Number(pid);
                                                    const p = productById.get(id) || items.find((i) => i.id === id);
                                                    return { id, qty: Number(qty), flavor: p?.flavor || `#${id}` };
                                                })
                                                .sort((a, b) => a.flavor.localeCompare(b.flavor))
                                                .map((ci) => (
                                                    <div key={ci.id} className="flex items-center justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-[#1C1C1E] text-sm truncate">{ci.flavor}</div>
                                                        </div>
                                                        <div className="flex items-center bg-gray-50 rounded-xl p-1 gap-2 shrink-0">
                                                            <button
                                                                onClick={() => updateCart(ci.id, -1)}
                                                                className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-400 active:scale-90 transition"
                                                            >
                                                                <Minus size={16} />
                                                            </button>
                                                            <div className="w-8 text-center font-bold text-sm">{ci.qty}</div>
                                                            <button
                                                                onClick={() => updateCart(ci.id, 1)}
                                                                className="w-8 h-8 flex items-center justify-center bg-[#1C1C1E] text-white rounded-md shadow-sm active:scale-90 transition"
                                                            >
                                                                <Plus size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-3">
                            {distributorsLoading && (
                                <div className="text-center text-gray-400 py-10">Загрузка...</div>
                            )}
                            {!distributorsLoading && distributors.length === 0 && (
                                <div className="text-center text-gray-400 py-10">Нет доступных дистрибьюторов</div>
                            )}
                            {distributors.map(d => (
                                <div
                                    key={d.id}
                                    onClick={() => setSelectedDistributor(d.id)}
                                    className={`p-5 rounded-2xl border-2 flex items-center justify-between transition active:scale-95 cursor-pointer shadow-sm ${selectedDistributor === d.id ? 'border-black bg-white' : 'border-transparent bg-white'
                                        }`}
                                >
                                    <span className="font-bold text-[#1C1C1E] text-lg">{d.fullName || d.name}</span>
                                    {selectedDistributor === d.id && (
                                        <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center text-white">
                                            <Check size={14} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {step === 5 && (
                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded-[24px] shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between">
                                    <div className="text-sm font-bold text-[#1C1C1E]">Корзина</div>
                                    <div className="text-xs text-gray-500 font-medium">{totalSku} SKU • {totalQty} шт</div>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-[24px] flex items-center gap-4 shadow-sm border border-gray-100">
                                <div className="p-3 bg-gray-50 rounded-2xl text-gray-400">
                                    <User size={24} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-gray-400 ml-1 uppercase">Имя</label>
                                    <input
                                        value={name} onChange={e => setName(e.target.value)}
                                        placeholder="Имя получателя"
                                        className="w-full bg-transparent font-bold text-lg outline-none placeholder:text-gray-300 py-1"
                                    />
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-[24px] flex items-center gap-4 shadow-sm border border-gray-100">
                                <div className="p-3 bg-gray-50 rounded-2xl text-gray-400">
                                    <Phone size={24} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-bold text-gray-400 ml-1 uppercase">Телефон</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={handlePhoneChange}
                                        placeholder="+7 (___) ___-__-__"
                                        className="w-full bg-transparent font-bold text-lg outline-none placeholder:text-gray-300 py-1"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200/50">
                    <button
                        onClick={() => {
                            if (step === 1) setStep(2);
                            else if (step === 2) setStep(3);
                            else if (step === 3) setStep(4);
                            else if (step === 4) setStep(5);
                            else handleSubmit();
                        }}
                        disabled={
                            (step === 3 && totalSku === 0) ||
                            (step === 4 && !selectedDistributor) ||
                            (step === 5 && (!name || !phone || totalSku === 0 || !selectedDistributor)) ||
                            loading
                        }
                        className="w-full h-16 bg-[#1C1C1E] text-white rounded-[24px] font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100 active:scale-95 transition shadow-xl shadow-black/10"
                    >
                        {loading ? 'Отправка...' : step === 5 ? 'Подтвердить заказ' : 'Далее'}
                        {!loading && step !== 5 && <Check size={20} />}
                    </button>
                    {step > 1 && (
                        <button
                            onClick={() => setStep(prev => prev - 1 as any)}
                            className="w-full py-4 text-gray-500 font-medium text-sm mt-1"
                        >
                            Назад
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
