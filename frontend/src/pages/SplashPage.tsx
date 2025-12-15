import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Lock } from 'lucide-react';
import apiClient from '../api/apiClient';

interface SplashPageProps {
    onLoginSuccess: () => void;
}

const SplashPage: React.FC<SplashPageProps> = ({ onLoginSuccess }) => {
    const [step, setStep] = useState<'splash' | 'login'>('splash');
    const [code, setCode] = useState('');
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleEnter = () => {
        setStep('login');
    };

    const handleLogin = async () => {
        if (!code) return;
        setLoading(true);
        try {
            // Mock auth for now: check if code is valid, then link to telegram user
            // Ideally: POST /api/auth/login { code }
            // For now, let's assume any code > 3 chars is "valid" or matches specific ID
            // Since backend "userId" logic is simple, let's just proceed.
            // User asked: "By ID?". Yes.

            // Simulation
            await new Promise(r => setTimeout(r, 1000));

            if (code.length >= 0) {
                onLoginSuccess();
            } else {
                setError(true);
            }
        } catch (e) {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black text-white overflow-hidden flex flex-col items-center justify-center">

            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-black via-[#111111] to-black" />

            {/* Animated Glow in background */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-900/20 rounded-full blur-[100px]"
            />

            <div className="relative z-10 w-full max-w-sm px-8 flex flex-col items-center">

                <AnimatePresence mode="wait">
                    {step === 'splash' && (
                        <motion.div
                            key="logo-view"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
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

                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleEnter}
                                className="w-full h-14 bg-white text-black rounded-2xl font-bold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-shadow"
                            >
                                Войти <ArrowRight size={20} />
                            </motion.button>
                        </motion.div>
                    )}

                    {step === 'login' && (
                        <motion.div
                            key="login-view"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="w-full"
                        >
                            <h2 className="text-2xl font-bold mb-6 text-center">Введите ID сотрудника</h2>

                            <div className="relative mb-6">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                <input
                                    type="text"
                                    value={code}
                                    onChange={(e) => { setCode(e.target.value); setError(false); }}
                                    placeholder="Ваш ID"
                                    className={`w-full h-14 bg-white/10 border ${error ? 'border-red-500' : 'border-white/20'} rounded-2xl pl-12 pr-4 text-white placeholder:text-gray-500 outline-none focus:border-white transition-colors text-center text-lg tracking-widest`}
                                />
                            </div>

                            <button
                                onClick={handleLogin}
                                disabled={loading}
                                className="w-full h-14 bg-[#007AFF] text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-50"
                            >
                                {loading ? 'Проверка...' : 'Подтвердить'}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>


        </div>
    );
};

export default SplashPage;
