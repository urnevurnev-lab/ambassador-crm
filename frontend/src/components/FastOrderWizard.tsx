import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, User, Phone, Send, Check } from 'lucide-react';
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
    const [step, setStep] = useState<1 | 2>(1);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [distributors, setDistributors] = useState<Distributor[]>([]);
    const [selectedDistributor, setSelectedDistributor] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Загружаем список дистрибьюторов (мокируем пока, если нет апи)
            // В идеале: apiClient.get('/api/distributors')
            setDistributors([
                { id: 1, name: 'Основной Склад' },
                { id: 2, name: 'Премиум Табак' },
                { id: 3, name: 'HoReCa Service' }
            ]);

            // Пытаемся предзаполнить имя
            if (WebApp.initDataUnsafe?.user) {
                // setName(WebApp.initDataUnsafe.user.first_name); // Не будем заполнять собой, нужно имя ЛПР
            }
        }
    }, [isOpen]);

    const handleSubmit = async () => {
        if (!selectedDistributor) return;
        setLoading(true);
        try {
            await apiClient.post('/api/orders', {
                facilityId,
                distributorId: selectedDistributor,
                contactName: name,
                contactPhone: phone,
                items: items.map(i => ({ sku: i.flavor, quantity: 1 })) // Пока по 1 шт
            });
            WebApp.showAlert('Заказ успешно отправлен!');
            onClose();
        } catch (e) {
            console.error(e);
            WebApp.showAlert('Ошибка отправки. Проверьте консоль.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center">
            {/* Backdrop - Explicit z-0 */}
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm z-0"
                onClick={onClose}
            />

            {/* Modal - Explicit z-10 to stay above backdrop */}
            <motion.div
                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                className="bg-white w-full max-w-md rounded-t-[30px] p-6 pb-12 h-[85vh] flex flex-col relative z-10 shadow-2xl"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-[#1C1C1E]">
                        {step === 1 ? 'Контактные данные' : 'Выбор дистрибьютора'}
                    </h2>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-500 active:scale-95 transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {step === 1 ? (
                        <div className="space-y-6">
                            <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4">
                                <div className="p-3 bg-white rounded-xl text-gray-400 shadow-sm">
                                    <User size={24} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500 ml-1">Имя получателя (ЛПР)</label>
                                    <input
                                        value={name} onChange={e => setName(e.target.value)}
                                        placeholder="Иван Иванов"
                                        className="w-full bg-transparent font-bold text-lg outline-none placeholder:text-gray-300"
                                    />
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4">
                                <div className="p-3 bg-white rounded-xl text-gray-400 shadow-sm">
                                    <Phone size={24} />
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs text-gray-500 ml-1">Телефон</label>
                                    <input
                                        type="tel"
                                        value={phone} onChange={e => setPhone(e.target.value)}
                                        placeholder="+7 (999) ..."
                                        className="w-full bg-transparent font-bold text-lg outline-none placeholder:text-gray-300"
                                    />
                                </div>
                            </div>

                            <div className="text-center text-sm text-gray-400 mt-8">
                                Заполните контакты того, кто будет принимать заказ на точке.
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {distributors.map(d => (
                                <div
                                    key={d.id}
                                    onClick={() => setSelectedDistributor(d.id)}
                                    className={`p-4 rounded-2xl border flex items-center justify-between transition active:scale-95 cursor-pointer ${selectedDistributor === d.id ? 'border-black bg-gray-50' : 'border-gray-100 bg-white'
                                        }`}
                                >
                                    <span className="font-bold text-[#1C1C1E]">{d.name}</span>
                                    {selectedDistributor === d.id && (
                                        <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center text-white">
                                            <Check size={14} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mt-4">
                    {step === 1 ? (
                        <button
                            disabled={!name || !phone}
                            onClick={() => setStep(2)}
                            className="w-full py-4 bg-[#1C1C1E] text-white rounded-2xl font-bold text-lg disabled:opacity-50 disabled:scale-100 active:scale-95 transition"
                        >
                            Далее
                        </button>
                    ) : (
                        <button
                            disabled={!selectedDistributor || loading}
                            onClick={handleSubmit}
                            className="w-full py-4 bg-[#1C1C1E] text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition"
                        >
                            {loading ? 'Отправка...' : 'Отправить в чат'} <Send size={20} />
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
