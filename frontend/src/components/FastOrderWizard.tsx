import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, User, Phone, Check } from 'lucide-react';
import apiClient from '../api/apiClient';
import WebApp from '@twa-dev/sdk';

interface FastOrderWizardProps {
    isOpen: boolean;
    onClose: () => void;
    facilityId: number;
    items: { id: number; flavor: string; line: string; category?: string }[];
}

interface Distributor {
    id: number;
    name: string;
}

export const FastOrderWizard: React.FC<FastOrderWizardProps> = ({ isOpen, onClose, facilityId, items }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('+7');

    // Selected items for order (user can toggle)
    const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());

    // Realistic Distributors
    const [distributors] = useState<Distributor[]>([
        { id: 1, name: 'HookahMarket' },
        { id: 2, name: 'Oshisha' },
        { id: 3, name: 'PiterSmoke' },
        { id: 4, name: 'S2B' }
    ]);
    const [selectedDistributor, setSelectedDistributor] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setPhone('+7');
            // Pre-select all items by default
            setSelectedItems(new Set(items.map(i => i.id)));
        }
    }, [isOpen, items]);

    // Toggle item selection
    const toggleItem = (id: number) => {
        const next = new Set(selectedItems);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedItems(next);
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
        setLoading(true);
        try {
            await apiClient.post('/api/orders', {
                facilityId,
                distributorId: selectedDistributor,
                contactName: name,
                contactPhone: phone,
                items: items.filter(i => selectedItems.has(i.id)).map(i => ({ sku: i.flavor, quantity: 1 }))
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
                            Шаг {step} из 3
                        </div>
                        <h2 className="text-2xl font-bold text-[#1C1C1E] leading-none">
                            {step === 1 ? 'Must-лист' : step === 2 ? 'Дистрибьютор' : 'Контакты'}
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
                                    const isSelected = selectedItems.has(item.id);
                                    return (
                                        <div
                                            key={item.id}
                                            onClick={() => toggleItem(item.id)}
                                            className={`p-4 rounded-2xl border-2 flex justify-between items-center shadow-sm cursor-pointer active:scale-[0.98] transition ${isSelected
                                                ? 'bg-white border-[#1C1C1E]'
                                                : 'bg-gray-50 border-transparent opacity-60'
                                                }`}
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-bold text-[#1C1C1E]">{item.flavor}</span>
                                                <span className="text-xs text-gray-400">{item.line}</span>
                                            </div>
                                            {isSelected && (
                                                <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center">
                                                    <Check size={16} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                            <div className="text-center text-xs text-gray-400 mt-4">
                                Выбрано {selectedItems.size} из {items.length} позиций
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-3">
                            {distributors.map(d => (
                                <div
                                    key={d.id}
                                    onClick={() => setSelectedDistributor(d.id)}
                                    className={`p-5 rounded-2xl border-2 flex items-center justify-between transition active:scale-95 cursor-pointer shadow-sm ${selectedDistributor === d.id ? 'border-black bg-white' : 'border-transparent bg-white'
                                        }`}
                                >
                                    <span className="font-bold text-[#1C1C1E] text-lg">{d.name}</span>
                                    {selectedDistributor === d.id && (
                                        <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center text-white">
                                            <Check size={14} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
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
                            else handleSubmit();
                        }}
                        disabled={(step === 2 && !selectedDistributor) || (step === 3 && (!name || !phone)) || loading}
                        className="w-full h-16 bg-[#1C1C1E] text-white rounded-[24px] font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100 active:scale-95 transition shadow-xl shadow-black/10"
                    >
                        {loading ? 'Отправка...' : step === 3 ? 'Подтвердить заказ' : 'Далее'}
                        {!loading && step !== 3 && <Check size={20} />}
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
