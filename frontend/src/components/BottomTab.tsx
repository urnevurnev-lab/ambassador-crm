import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Map, Briefcase, User, List } from 'lucide-react';

export const BottomTab: React.FC = () => {
  const navItems = [
    { path: '/', icon: Home, label: 'Главная' },
    { path: '/facilities', icon: List, label: 'Точки' },
    { path: '/work', icon: Briefcase, label: 'Работа' },
    { path: '/map', icon: Map, label: 'Карта' },
    { path: '/profile', icon: User, label: 'Профиль' },
  ];

  return (
    // fixed bottom-0: Прибиваем к низу
    // pb-[env(safe-area-inset-bottom)]: Учитываем "бороду" iPhone
    // z-40: Чтобы было поверх контента
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 pb-[env(safe-area-inset-bottom)] z-40">
      <div className="flex justify-around items-center h-[60px] px-2">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `
              flex flex-col items-center justify-center w-full h-full space-y-1
              ${isActive ? 'text-[#007AFF]' : 'text-gray-400'}
              active:scale-95 transition-transform duration-100
            `}
          >
            <Icon size={24} strokeWidth={2} />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};