import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import apiClient from '../api/apiClient';

interface SplashPageProps {
    onLoginSuccess: () => void;
}

const SplashPage: React.FC<SplashPageProps> = ({ onLoginSuccess }) => {
    const [status, setStatus] = useState<'checking' | 'denied'>('checking');
    const [message, setMessage] = useState<string | null>(null);

    const telegramId = (WebApp as any)?.initDataUnsafe?.user?.id ? String((WebApp as any).initDataUnsafe.user.id) : null;

    useEffect(() => {
        (WebApp as any)?.ready?.();
        (WebApp as any)?.expand?.();
    }, []);

    const checkAccess = useCallback(async () => {
        setStatus('checking');
        setMessage(null);
        try {
            await apiClient.get('/api/users/me');
            onLoginSuccess();
        } catch (e: any) {
            const httpStatus = e?.response?.status;
            if (httpStatus === 404) {
                setMessage('Вас нет в списке сотрудников. Обратитесь к администратору.');
            } else if (httpStatus === 401) {
                setMessage('Не удалось подтвердить Telegram-авторизацию. Откройте приложение внутри Telegram.');
            } else {
                setMessage('Не удалось проверить доступ. Попробуйте еще раз.');
            }
            setStatus('denied');
        }
    }, [onLoginSuccess]);

    useEffect(() => {
        checkAccess();
    }, [checkAccess]);

    const isChecking = status === 'checking';

    return (
        <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50 text-[#1C1C1E]">
            <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45 }}
                className="flex flex-col items-center"
            >
                <div className="w-24 h-24 mb-6 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                    <img src="/logo_splash.png" alt="Logo" className="w-full h-full object-cover" />
                </div>

                <h1 className="text-2xl font-bold tracking-tight">
                    Ambassador<span className="text-blue-500">CRM</span>
                </h1>
                
                <motion.p 
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-sm text-gray-400 mt-2 font-medium"
                >
                    Загрузка профиля...
                </motion.p>

                {status === 'denied' && (
                    <div className="mt-6 text-center">
                        <div className="text-sm text-gray-500 mb-3">{message}</div>
                        {telegramId && (
                            <div className="text-[11px] text-gray-400 mb-2">Telegram ID: {telegramId}</div>
                        )}
                        <button
                            onClick={checkAccess}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black text-white font-semibold shadow-sm active:scale-95 transition"
                        >
                            <RefreshCw size={16} /> Повторить
                        </button>
                    </div>
                )}
            </motion.div>

            {isChecking && (
                <div className="absolute bottom-10 w-32 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-[#1C1C1E]"
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                </div>
            )}
        </div>
    );
};

export default SplashPage;
