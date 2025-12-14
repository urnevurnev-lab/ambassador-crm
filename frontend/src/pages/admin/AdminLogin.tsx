import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';
import apiClient from '../../api/apiClient';

export const AdminLogin = () => {
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const tryLogin = async () => {
            if (pin.length !== 4) return;
            setLoading(true);
            try {
                const res = await apiClient.post('/api/auth/admin', { password: pin });
                const token = res.data?.token;
                if (token) {
                    localStorage.setItem('adminToken', token);
                    WebApp.HapticFeedback.notificationOccurred('success');
                    navigate('/admin');
                    return;
                }
                throw new Error('Token missing');
            } catch (e) {
                WebApp.HapticFeedback.notificationOccurred('error');
                WebApp.showAlert('Неверный код доступа');
                setPin('');
            } finally {
                setLoading(false);
            }
        };

        tryLogin();
    }, [pin, navigate]);

    const handlePress = (num: number) => {
        if (pin.length < 4) {
            WebApp.HapticFeedback.impactOccurred('light');
            setPin(prev => prev + num);
        }
    };

    const handleDelete = () => {
        WebApp.HapticFeedback.impactOccurred('light');
        setPin(prev => prev.slice(0, -1));
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F2F2F7]">
            <h1 className="text-2xl font-bold mb-8 text-black">Введите код доступа</h1>

            <div className="flex space-x-4 mb-12">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className={`w-4 h-4 rounded-full transition-all duration-200 ${i < pin.length ? 'bg-black' : 'border-2 border-gray-300'
                            }`}
                    />
                ))}
            </div>

            <div className="grid grid-cols-3 gap-6 w-64">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                        key={num}
                        onClick={() => handlePress(num)}
                        disabled={loading}
                        className="w-16 h-16 rounded-full bg-white text-2xl font-medium shadow-sm active:bg-gray-100 flex items-center justify-center text-black disabled:opacity-50"
                    >
                        {num}
                    </button>
                ))}
                <div className="col-start-2">
                    <button
                        onClick={() => handlePress(0)}
                        disabled={loading}
                        className="w-16 h-16 rounded-full bg-white text-2xl font-medium shadow-sm active:bg-gray-100 flex items-center justify-center text-black disabled:opacity-50"
                    >
                        0
                    </button>
                </div>
                <div className="col-start-3 flex items-center justify-center">
                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="w-16 h-16 flex items-center justify-center text-gray-500 active:text-gray-700 disabled:opacity-50"
                    >
                        ⌫
                    </button>
                </div>
            </div>

            <button
                onClick={() => navigate('/')}
                className="mt-12 text-blue-500 font-medium"
            >
                Отмена
            </button>
        </div>
    );
};
