import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface SplashPageProps {
  onFinish: () => void;
}

const SplashPage: React.FC<SplashPageProps> = ({ onFinish }) => {
  
  useEffect(() => {
    // Имитация загрузки и проверки "свой/чужой"
    // Через 2.5 секунды переключаем на главное меню
    const timer = setTimeout(() => {
      onFinish();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-50 bg-[#F3F4F6] flex flex-col items-center justify-center">
      
      {/* Логотип с анимацией пульсации */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        {/* ВОТ ЗДЕСЬ ИСПРАВЛЕНИЕ: */}
        <img 
          src="/logo.png" 
          alt="Loading..." 
          className="w-32 h-32 rounded-full object-cover mix-blend-multiply shadow-xl"
        />
        
        {/* Крутящийся спиннер вокруг логотипа (для красоты) */}
        <div className="absolute inset-0 -m-2 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center"
      >
        <h2 className="text-xl font-bold text-gray-800">Ambassador CRM</h2>
        <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Проверка доступа...</p>
      </motion.div>

      <div className="absolute bottom-10 text-gray-300 text-[10px]">
        v1.0.0
      </div>
    </div>
  );
};

export default SplashPage;