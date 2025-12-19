import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface SplashPageProps {
  onFinish: () => void;
}

const SplashPage: React.FC<SplashPageProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => onFinish(), 2500);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#F8F9FE] flex flex-col items-center justify-center overflow-hidden">
      
      {/* Фоновые пятна */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/10 blur-3xl rounded-full" />

      {/* Логотип */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10"
      >
        <div className="w-32 h-32 bg-white rounded-[32px] shadow-2xl shadow-blue-500/20 flex items-center justify-center">
           {/* Вставь сюда свой <img src="/logo.png" /> если есть */}
           <span className="text-4xl">💎</span>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-center z-10"
      >
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Ambassador CRM</h2>
        <div className="mt-2 flex justify-center gap-1">
           <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-blue-500 rounded-full" />
           <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-purple-500 rounded-full" />
           <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-coral-500 rounded-full" />
        </div>
      </motion.div>
    </div>
  );
};

export default SplashPage;