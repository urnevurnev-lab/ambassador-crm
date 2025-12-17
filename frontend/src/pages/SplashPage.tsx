import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

    return (
        <div className="fixed inset-0 z-[9999] bg-black text-white overflow-hidden flex flex-col items-center justify-center">

            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-black via-[#111111] to-black" />

            {/* Animated Glow in background */}
            <motion.div
                initial={{ scale: 1, opacity: 0.28 }}
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.28, 0.45, 0.28],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[560px] rounded-full"
                style={{
                    background:
                        'radial-gradient(circle at center, rgba(99,102,241,0.45) 0%, rgba(99,102,241,0.0) 65%)',
                }}
            />

            <div className="relative z-10 w-full max-w-sm px-8 flex flex-col items-center">

                <AnimatePresence mode="wait">
                    <motion.div
                        key="splash-view"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex flex-col items-center w-full"
                    >
                        <motion.div
                            className="flex flex-col items-center"
                        >
                            {/* Logo Wrapper with Shimmer */}
                            <div className="relative mb-10 group">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    className="absolute -inset-1 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent blur-md opacity-50"
                                />
                                <div className="w-48 h-48 rounded-full bg-black/50 border border-white/10 backdrop-blur-sm flex items-center justify-center p-6 relative shadow-2xl">
                                    <img src="/logo_splash.png" alt="Logo" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                                </div>
                            </div>

                            {/* Shimmering Text */}
                            <div className="relative overflow-hidden mb-12">
                                <h1 className="text-3xl font-black uppercase tracking-widest text-center">
                                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-500 via-white to-gray-500 animate-shimmer bg-[length:200%_auto]">
                                        Только для своих
                                    </span>
                                </h1>
                            </div>

                        </motion.div>

                        {status === 'checking' ? (
                            <div className="w-full flex items-center justify-center gap-3 text-white/70 mt-2">
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white/80" />
                                <div className="text-sm font-semibold">Проверяем доступ…</div>
                            </div>
                        ) : (
                            <div className="w-full mt-2">
                                <div className="text-sm text-white/70 text-center">
                                    {message}
                                </div>

                                {telegramId && (
                                    <div className="mt-4 bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                                        <div className="text-[10px] uppercase tracking-widest text-white/50 font-bold">Ваш Telegram ID</div>
                                        <div className="mt-1 font-mono text-white text-lg tracking-wider">{telegramId}</div>
                                    </div>
                                )}

                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={checkAccess}
                                    className="w-full h-14 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-shadow mt-6"
                                >
                                    <RefreshCw size={20} /> Повторить
                                </motion.button>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

            </div>


        </div>
    );
};

export default SplashPage;
