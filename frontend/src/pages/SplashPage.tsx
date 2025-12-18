import React from 'react';
import { motion } from 'framer-motion';

const SplashPage: React.FC = () => {
    return (
        // z-50 гарантирует, что это перекроет всё
        <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="flex flex-col items-center"
            >
                {/* Логотип */}
                <div className="w-28 h-28 mb-6 rounded-3xl overflow-hidden shadow-lg shadow-blue-100">
                    {/* Убедись, что logo_splash.png лежит в папке public */}
                    <img src="/logo_splash.png" alt="Ambassador" className="w-full h-full object-cover" />
                </div>

                {/* Название с градиентом */}
                <h1 className="text-3xl font-bold tracking-tight mb-2">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                        Ambassador
                    </span>
                    <span className="text-[#1C1C1E]">CRM</span>
                </h1>
                
                {/* Текст загрузки */}
                <motion.p 
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-xs text-gray-400 font-medium uppercase tracking-widest"
                >
                    Загрузка профиля
                </motion.p>
            </motion.div>

            {/* Полоска загрузки внизу */}
            <div className="absolute bottom-12 w-48 h-1 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-[#1C1C1E]"
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>
        </div>
    );
};

export default SplashPage;

