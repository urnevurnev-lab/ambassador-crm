import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

// Интерфейс для пропсов (чтобы App.tsx не ругался)
interface SplashPageProps {
    onFinish?: () => void;
}

const SplashPage: React.FC<SplashPageProps> = ({ onFinish }) => {
    
    useEffect(() => {
        // Если передали функцию завершения - вызываем её через 2.5 сек
        if (onFinish) {
            const timer = setTimeout(() => {
                onFinish();
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [onFinish]);

    return (
        <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex flex-col items-center"
            >
                {/* Логотип */}
                <div className="w-28 h-28 mb-6 rounded-3xl overflow-hidden shadow-lg shadow-blue-100 border border-blue-50">
                    {/* Если картинки нет, будет просто красивый квадрат */}
                    <img 
                        src="/logo_splash.png" 
                        alt="Ambassador" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'; 
                            (e.target as HTMLImageElement).parentElement!.style.backgroundColor = '#F3F4F6';
                        }} 
                    />
                </div>

                {/* Текст */}
                <h1 className="text-3xl font-bold tracking-tight mb-2">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        Ambassador
                    </span>
                    <span className="text-[#1C1C1E]">CRM</span>
                </h1>
                
                <motion.p 
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-xs text-gray-400 font-medium uppercase tracking-widest"
                >
                    Загрузка профиля
                </motion.p>
            </motion.div>
        </div>
    );
};

export default SplashPage;