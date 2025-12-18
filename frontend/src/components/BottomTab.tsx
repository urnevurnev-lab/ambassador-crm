import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Briefcase, BookOpen, User, ShieldCheck } from 'lucide-react';

export const BottomTab: React.FC = () => {
  // Базовые стили для кнопок
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center w-full h-full space-y-[2px] transition-all duration-200 ${
      isActive ? 'text-black scale-105' : 'text-gray-400 hover:text-gray-600'
    }`;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100 pb-[env(safe-area-inset-bottom,20px)]">
      <div className="flex justify-between items-center h-[60px] max-w-md mx-auto px-4">
        
        <NavLink to="/" className={navClass}>
          {({ isActive }) => (
             <>
               <LayoutDashboard size={22} strokeWidth={isActive ? 2.5 : 2} />
               <span className="text-[9px] font-bold mt-0.5">Главная</span>
             </>
          )}
        </NavLink>

        <NavLink to="/work" className={navClass}>
          {({ isActive }) => (
             <>
               <Briefcase size={22} strokeWidth={isActive ? 2.5 : 2} />
               <span className="text-[9px] font-bold mt-0.5">Работа</span>
             </>
          )}
        </NavLink>

        <NavLink to="/knowledge" className={navClass}>
          {({ isActive }) => (
             <>
               <BookOpen size={22} strokeWidth={isActive ? 2.5 : 2} />
               <span className="text-[9px] font-bold mt-0.5">База</span>
             </>
          )}
        </NavLink>

        {/* КНОПКА АДМИНКИ (Доступна всем, но внутри пароль) */}
        <NavLink to="/admin" className={navClass}>
          {({ isActive }) => (
             <>
               <ShieldCheck size={22} strokeWidth={isActive ? 2.5 : 2} />
               <span className="text-[9px] font-bold mt-0.5">Админ</span>
             </>
          )}
        </NavLink>

        <NavLink to="/profile" className={navClass}>
          {({ isActive }) => (
             <>
               <User size={22} strokeWidth={isActive ? 2.5 : 2} />
               <span className="text-[9px] font-bold mt-0.5">Профиль</span>
             </>
          )}
        </NavLink>

      </div>
    </div>
  );
};