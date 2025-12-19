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
    <div className="fixed bottom-0 left-0 right-0 z-[9999] pointer-events-none">
      <div className="flex justify-center pointer-events-auto px-4 pb-[max(env(safe-area-inset-bottom),16px)]">
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="
            flex items-center justify-around 
            w-full max-w-md h-[72px]
            bg-white/80 backdrop-blur-2xl 
            border border-[#C6C6C8]/30
            rounded-[32px] 
            shadow-elevated
            px-2
          "
        >
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                relative flex flex-col items-center justify-center h-full flex-1 transition-all duration-300
                ${isActive ? 'text-[#007AFF]' : 'text-[#8E8E93]'}
              `}
            >
              {({ isActive }) => (
                <div className="flex flex-col items-center gap-1 relative z-10 transition-transform duration-300 active:scale-90">
                  <item.icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className={`text-[10px] font-bold tracking-tight transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                    {item.label}
                  </span>

                  {isActive && (
                    <motion.div
                      layoutId="active-dot"
                      className="absolute -top-1 w-1 h-1 bg-[#007AFF] rounded-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default BottomTab;