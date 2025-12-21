import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Delete, Fingerprint } from 'lucide-react';
import WebApp from '@twa-dev/sdk';

interface LockScreenProps {
    onSuccess: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onSuccess }) => {
    const PASSCODE = '28678720';
    const [input, setInput] = useState('');
    const [error, setError] = useState(false);

    const handlePress = (digit: string) => {
        if (input.length < 8) {
            setInput(prev => prev + digit);
            setError(false);
        }
    };

    useEffect(() => {
        // Инициализация биометрии
        try {
            WebApp.BiometricManager?.init?.(() => {
                if (WebApp.BiometricManager?.isBiometricAvailable) {
                    // Можно попробовать авто-запрос или просто показать кнопку
                }
            });
        } catch (e) {
            console.warn('Biometric init failed:', e);
        }
    }, []);

    const handleBiometry = () => {
        if (WebApp.BiometricManager?.isBiometricAvailable) {
            WebApp.BiometricManager.authenticate({ reason: 'Вход в панель администратора' }, (success: boolean) => {
                if (success) {
                    WebApp.HapticFeedback?.notificationOccurred?.('success');
                    onSuccess();
                } else {
                    WebApp.HapticFeedback?.notificationOccurred?.('error');
                }
            });
        }
    };

    const handleDelete = () => {
        setInput(prev => prev.slice(0, -1));
        setError(false);
    };

    useEffect(() => {
        if (input.length === 8) {
            if (input === PASSCODE) {
                // Short delay for visual feedback
                setTimeout(() => {
                    onSuccess();
                }, 300);
            } else {
                setError(true);
                // Shake and clear
                setTimeout(() => {
                    setInput('');
                    setError(false);
                }, 500);
            }
        }
    }, [input, onSuccess]);

    return (
        <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex flex-col items-center justify-center text-white"
            style={{ paddingBottom: 'calc(24px + var(--tg-safe-area-bottom))', paddingTop: 'var(--tg-safe-area-top)' }}
        >
            <div className="mb-8 flex flex-col items-center">
                <div className="mb-4">
                    <Lock size={32} />
                </div>
                <h2 className="text-xl font-medium">Введите код-пароль</h2>
            </div>

            {/* Dots */}
            <motion.div
                className="flex gap-4 mb-12 h-4"
                animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
            >
                {Array.from({ length: 8 }).map((_, i) => (
                    <div
                        key={i}
                        className={`w-3 h-3 rounded-full transition-all ${i < input.length ? 'bg-white' : 'border border-white/30'
                            }`}
                    />
                ))}
            </motion.div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-x-8 gap-y-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <KeypadButton key={num} number={num} onClick={() => handlePress(num.toString())} />
                ))}
                <div className="flex items-center justify-center">
                    {WebApp.BiometricManager?.isBiometricAvailable && (
                        <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={handleBiometry}
                            className="w-[75px] h-[75px] rounded-full bg-white/5 flex items-center justify-center text-white/70"
                        >
                            <Fingerprint size={32} />
                        </motion.button>
                    )}
                </div>
                <KeypadButton number={0} onClick={() => handlePress('0')} />
                <div className="flex items-center justify-center">
                    {input.length > 0 && (
                        <button
                            onClick={handleDelete}
                            className="w-[75px] h-[75px] flex items-center justify-center text-white/50 active:text-white transition"
                        >
                            <Delete size={24} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const KeypadButton: React.FC<{ number: number; onClick: () => void }> = ({ number, onClick }) => {
    return (
        <motion.button
            whileTap={{ scale: 0.85, backgroundColor: 'rgba(255,255,255,0.4)' }}
            onClick={onClick}
            className="w-[75px] h-[75px] rounded-full bg-white/10 backdrop-blur-lg flex flex-col items-center justify-center transition-colors"
        >
            <span className="text-3xl font-normal">{number}</span>
        </motion.button>
    );
};
