import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, User, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';

export const BottomTab: React.FC = () => {
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Главная' },
    { path: '/work', icon: Briefcase, label: 'Работа' },
    { path: '/knowledge', icon: BookOpen, label: 'Знания' },
    { path: '/profile', icon: User, label: 'Профиль' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] pb-[calc(env(safe-area-inset-bottom)+12px)] pointer-events-none px-4">
      <div className="flex justify-center pointer-events-auto">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="
            flex items-center justify-around 
            w-full max-w-[400px] h-[72px]
            bg-white/80 backdrop-blur-2xl 
            border border-white/40
            rounded-[32px] 
            shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)]
            px-4
          "
        >
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                relative flex flex-col items-center justify-center h-full flex-1 transition-all duration-300
                ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}
              `}
            >
              {({ isActive }) => (
                <>
                  <motion.div
                    animate={isActive ? { y: -4, scale: 1.1 } : { y: 0, scale: 1 }}
                    className="flex flex-col items-center gap-1"
                  >
                    <item.icon
                      size={24}
                      strokeWidth={isActive ? 2.5 : 2}
                      className="relative z-10"
                    />
                    <span className={`text-[10px] font-bold tracking-tight ${isActive ? 'opacity-100' : 'opacity-0 translate-y-2'} transition-all duration-300`}>
                      {item.label}
                    </span>
                  </motion.div>

                  {isActive && (
                    <motion.div
                      layoutId="active-pill"
                      className="absolute inset-0 bg-blue-50/50 rounded-[24px] -z-0"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default BottomTab;