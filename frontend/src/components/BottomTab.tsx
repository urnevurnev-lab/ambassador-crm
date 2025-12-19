import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, User, Briefcase, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export const BottomTab: React.FC = () => {
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Главная' },
    { path: '/work', icon: Briefcase, label: 'Работа' },
    { path: '/knowledge', icon: BookOpen, label: 'База' },
    { path: '/profile', icon: User, label: 'Профиль' },
  ];

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 flex justify-center">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="
          flex items-center justify-between 
          w-full max-w-sm px-6 py-4
          bg-white/80 backdrop-blur-xl 
          border border-white/40
          rounded-[32px] 
          shadow-[0_8px_30px_rgba(0,0,0,0.1)]
        "
      >
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              relative flex flex-col items-center justify-center
              transition-all duration-300
              ${isActive ? 'text-blue-600 scale-110' : 'text-gray-400 hover:text-gray-600'}
            `}
          >
            {({ isActive }) => (
              <>
                {/* Активная подсветка (Glow) */}
                {isActive && (
                  <motion.div 
                    layoutId="tab-glow"
                    className="absolute -inset-3 bg-blue-500/10 blur-lg rounded-full" 
                  />
                )}
                
                <item.icon 
                  size={24} 
                  strokeWidth={isActive ? 2.5 : 2}
                  className="relative z-10"
                />
                
                {/* Точка вместо текста для минимализма */}
                {isActive && (
                  <motion.div 
                    layoutId="tab-dot"
                    className="absolute -bottom-2 w-1 h-1 bg-blue-600 rounded-full"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </motion.div>
    </div>
  );
};

export default BottomTab;