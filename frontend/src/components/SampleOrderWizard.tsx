import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { X, Check, Search, Plus, Trash2, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    facilityId?: number; // Делаем необязательным
    items?: any[];       // Делаем необязательным
}

export const SampleOrderWizard: React.FC<Props> = ({ isOpen, onClose, facilityId, items = [] }) => {
    const [step, setStep] = useState(1);
    const [cart, setCart] = useState<Set<number>>(new Set());
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Если закрыто - не рендерим (для модального режима)
    if (!isOpen) return null;

    // ... (оставляем логику простой для примера восстановления)
    
    const handleSend = async () => {
        setLoading(true);
        try {
            // Если facilityId нет (зашли через меню "Работа"), берем 0 или требуем выбор
            await apiClient.post('/api/samples', {
                facilityId: facilityId || 0, 
                products: Array.from(cart),
                comment
            });
            onClose();
        } catch (e) {
            console.error(e);
            alert('Ошибка создания заявки');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#F2F3F7]">
            {/* Header */}
            <div className="bg-white px-4 py-4 pt-12 border-b border-gray-200 flex justify-between items-center">
                <h2 className="font-bold text-lg">Заказ сэмплов</h2>
                <button onClick={onClose} className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center">
                    <X size={18} />
                </button>
            </div>

            {/* Body */}
            <div className="flex-1 p-4 flex flex-col justify-center items-center text-gray-400">
                <Package size={48} className="mb-4 opacity-20" />
                <p>Функционал сэмплов в разработке</p>
                <p className="text-xs mt-2">ID Точки: {facilityId || 'Не выбрана'}</p>
            </div>

            {/* Footer */}
            <div className="bg-white p-4 pb-8 border-t border-gray-200">
                <button 
                    onClick={handleSend}
                    disabled={loading}
                    className="w-full bg-[#1C1C1E] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
                >
                    {loading ? 'Отправка...' : 'Отправить заявку'}
                </button>
            </div>
        </div>
    );
};

// --- ВАЖНО: Добавляем export default, чтобы App.tsx не падал ---
export default SampleOrderWizard;