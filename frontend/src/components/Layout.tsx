import React from 'react';
import { useLocation } from 'react-router-dom';
import { BottomTab } from './BottomTab';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  
  // Где НЕ ПОКАЗЫВАТЬ нижнюю панель?
  // 1. В админке (/admin)
  // 2. В визарде визита (/visit) - там свои кнопки
  // 3. На сплеше (но он обрабатывается в App.tsx)
  const hideBottomTab = location.pathname.startsWith('/admin') || location.pathname === '/visit';

  return (
    <div className="flex flex-col min-h-screen bg-[#F2F3F7] text-[#1C1C1E]">
      {/* Основной контент.
         pb-24: Делаем большой отступ снизу, если есть меню, чтобы контент не перекрывался.
         pb-safe: Если меню нет, просто отступ безопасности.
      */}
      <main className={`flex-grow w-full ${!hideBottomTab ? 'pb-24' : 'pb-[env(safe-area-inset-bottom)]'}`}>
        {children}
      </main>

      {!hideBottomTab && <BottomTab />}
    </div>
  );
};