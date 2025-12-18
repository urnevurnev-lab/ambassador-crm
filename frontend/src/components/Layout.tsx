import React from 'react';
import { useLocation } from 'react-router-dom';
import { BottomTab } from './BottomTab';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  
  // Скрываем меню ТОЛЬКО внутри визарда визита
  const hideBottomTab = location.pathname === '/visit';

  return (
    <div className="flex flex-col min-h-screen bg-[#F2F3F7] text-[#1C1C1E]">
      <main className={`flex-grow w-full ${!hideBottomTab ? 'pb-24' : 'pb-[env(safe-area-inset-bottom)]'}`}>
        {children}
      </main>

      {!hideBottomTab && <BottomTab />}
    </div>
  );
};