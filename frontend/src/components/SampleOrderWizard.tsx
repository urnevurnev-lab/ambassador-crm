import React, { useState } from 'react';
import apiClient from '../api/apiClient';
import { X, Package } from 'lucide-react';

// Определяем интерфейс пропсов
interface Props {
    isOpen: boolean;
    onClose: () => void;
    facilityId?: number;
    items?: any[];
}

// Используем export default function для надежности
export default function SampleOrderWizard({ isOpen, onClose, facilityId }: Props) {
    const [loading, setLoading] = useState(false);
    
    // Если закрыто - возвращаем null (ничего не рисуем)
    if (!isOpen) return null;

    const handleSend = async () => {
        setLoading(true);
        try {
            await apiClient.post('/api/samples', {
                facilityId: facilityId || 0, 
                products: [], 
                comment: "Заказ сэмплов"
            });
            alert('Заявка отправлена');
            onClose();
        } catch (e) {
            console.error(e);
            alert('Ошибка (проверь консоль)');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#F2F3F7]">
            <div className="bg-white px-4 py-4 pt-12 border-b border-gray-200 flex justify-between items-center">
                <h2 className="font-bold text-lg">Заказ сэмплов</h2>
                <button onClick={onClose} className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center">
                    <X size={18} />
                </button>
            </div>
            <div className="flex-1 p-4 flex flex-col justify-center items-center text-gray-400">
                <Package size={48} className="mb-4 opacity-20" />
                <p>Функционал сэмплов в разработке</p>
                <p className="text-xs mt-2">ID Точки: {facilityId || 'Не выбрана'}</p>
            </div>
            <div className="bg-white p-4 pb-8 border-t border-gray-200">
                <button onClick={handleSend} disabled={loading} className="w-full bg-[#1C1C1E] text-white font-bold py-4 rounded-2xl">
                    {loading ? 'Отправка...' : 'Отправить заявку'}
                </button>
            </div>
        </div>
    );
};