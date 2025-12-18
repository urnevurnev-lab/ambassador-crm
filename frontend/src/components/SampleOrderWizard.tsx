import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, MapPin, User, Phone, Calendar, Plus, Minus } from 'lucide-react';
import apiClient from '../api/apiClient';
import { StandardCard } from './ui/StandardCard';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

// Типы для формы данных
interface UserData {
    fullName: string;
    phone: string;
    cdekAddress: string;
    birthDate: string;
}

export default function SampleOrderWizard({ isOpen, onClose }: Props) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [cart, setCart] = useState<Record<number, number>>({});
    
    // Данные пользователя для сверки
    const [userData, setUserData] = useState<UserData>({
        fullName: '',
        phone: '',
        cdekAddress: '',
        birthDate: ''
    });

    // 1. Загружаем товары и профиль при открытии
    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            // Грузим товары
            apiClient.get('/api/products').then(res => setProducts(res.data || []));
            
            // Грузим профиль (имитация, или реальный запрос)
            apiClient.get('/api/users/me').then(res => {
                const u = res.data;
                setUserData({
                    fullName: u.name || '',
                    phone: u.phone || '',
                    cdekAddress: u.cdekAddress || '', // Предполагаем, что в базе есть это поле
                    birthDate: u.birthDate || ''
                });
            }).finally(() => setLoading(false));
        }
    }, [isOpen]);

    // Группировка товаров по линейкам
    const groupedProducts = useMemo(() => {
        const groups: Record<string, any[]> = {};
        products.forEach(p => {
            if (!groups[p.line]) groups[p.line] = [];
            groups[p.line].push(p);
        });
        return groups;
    }, [products]);

    // Управление корзиной
    const updateCart = (id: number, delta: number) => {
        setCart(prev => {
            const newVal = (prev[id] || 0) + delta;
            if (newVal <= 0) {
                const { [id]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [id]: newVal };
        });
    };

    const handleSend = async () => {
        if (!userData.cdekAddress || !userData.fullName) {
            alert("Пожалуйста, заполните ФИО и адрес СДЭК");
            return;
        }

        setLoading(true);
        try {
            // 1. Обновляем данные пользователя, если он их поменял
            await apiClient.patch('/api/users/me', userData);

            // 2. Отправляем заказ пробников
            await apiClient.post('/api/samples', {
                items: cart,
                userData: userData // Дублируем для удобства в заявке
            });

            alert('Заказ пробников оформлен! Ждите трек-номер.');
            onClose();
            setStep(1);
            setCart({});
        } catch (e) {
            alert('Ошибка отправки');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#F3F4F6]">
            {/* Header */}
            <div className="bg-white px-4 py-4 pt-4 border-b border-gray-200 flex justify-between items-center shadow-sm">
                <h2 className="font-bold text-lg">
                    {step === 1 ? 'Выбор пробников' : 'Сверка данных'}
                </h2>
                <button onClick={onClose} className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center">
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto pb-32 px-4 pt-4">
                
                {/* ШАГ 1: ВЫБОР ТОВАРОВ */}
                {step === 1 && (
                    <div className="space-y-6">
                        {Object.entries(groupedProducts).map(([line, items]) => (
                            <div key={line}>
                                <h3 className="font-bold text-gray-400 uppercase text-xs mb-2 pl-1">{line}</h3>
                                <div className="space-y-2">
                                    {items.map(p => {
                                        const count = cart[p.id] || 0;
                                        return (
                                            <StandardCard key={p.id} className="!p-3 !mb-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium text-sm">{p.flavor}</span>
                                                    
                                                    {count > 0 ? (
                                                        <div className="flex items-center bg-black rounded-lg p-1">
                                                            <button onClick={() => updateCart(p.id, -1)} className="w-7 h-7 flex items-center justify-center text-white"><Minus size={14}/></button>
                                                            <span className="w-6 text-center text-white font-bold text-sm">{count}</span>
                                                            <button onClick={() => updateCart(p.id, 1)} className="w-7 h-7 flex items-center justify-center text-white"><Plus size={14}/></button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => updateCart(p.id, 1)} className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200">
                                                            <Plus size={18} className="text-gray-600" />
                                                        </button>
                                                    )}
                                                </div>
                                            </StandardCard>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ШАГ 2: СВЕРКА ДАННЫХ */}
                {step === 2 && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="bg-yellow-50 p-4 rounded-2xl border border-yellow-100 text-yellow-800 text-sm mb-4">
                            Проверьте данные. На этот адрес и имя мы отправим посылку через СДЭК.
                        </div>

                        <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 font-bold ml-1 flex items-center gap-1"><User size={12}/> ФИО Получателя</label>
                                <input 
                                    value={userData.fullName}
                                    onChange={e => setUserData({...userData, fullName: e.target.value})}
                                    className="w-full mt-1 p-3 bg-gray-50 rounded-xl border-b-2 border-transparent focus:border-black outline-none transition-colors"
                                    placeholder="Иванов Иван Иванович"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 font-bold ml-1 flex items-center gap-1"><MapPin size={12}/> Адрес СДЭК (ПВЗ)</label>
                                <input 
                                    value={userData.cdekAddress}
                                    onChange={e => setUserData({...userData, cdekAddress: e.target.value})}
                                    className="w-full mt-1 p-3 bg-gray-50 rounded-xl border-b-2 border-transparent focus:border-black outline-none transition-colors"
                                    placeholder="г. Москва, ул. Ленина 1 (код пвз)"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 font-bold ml-1 flex items-center gap-1"><Phone size={12}/> Телефон</label>
                                <input 
                                    value={userData.phone}
                                    onChange={e => setUserData({...userData, phone: e.target.value})}
                                    className="w-full mt-1 p-3 bg-gray-50 rounded-xl border-b-2 border-transparent focus:border-black outline-none transition-colors"
                                    placeholder="+7 999 000 00 00"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 font-bold ml-1 flex items-center gap-1"><Calendar size={12}/> Дата рождения</label>
                                <input 
                                    value={userData.birthDate}
                                    onChange={e => setUserData({...userData, birthDate: e.target.value})}
                                    className="w-full mt-1 p-3 bg-gray-50 rounded-xl border-b-2 border-transparent focus:border-black outline-none transition-colors"
                                    placeholder="01.01.1990"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Action */}
            <div className="bg-white p-4 pb-8 border-t border-gray-200 absolute bottom-0 w-full">
                {step === 1 ? (
                    <button 
                        onClick={() => {
                            if (Object.keys(cart).length === 0) return alert("Выберите хотя бы один вкус");
                            setStep(2);
                        }} 
                        className="w-full bg-black text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-transform"
                    >
                        Перейти к оформлению ({Object.values(cart).reduce((a, b) => a + b, 0)} шт)
                    </button>
                ) : (
                    <div className="flex gap-3">
                        <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-2xl">
                            Назад
                        </button>
                        <button onClick={handleSend} disabled={loading} className="flex-[2] bg-black text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2">
                            {loading ? 'Отправка...' : <>Подтвердить <Check size={18}/></>}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};