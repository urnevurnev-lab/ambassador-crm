import React from 'react';
import { useLocation } from 'react-router-dom';
import { BottomTab } from './BottomTab';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const showBottomTab = !location.pathname.startsWith('/admin') && location.pathname !== '/login';

  return (
    <div className="fixed inset-0 z-0 flex flex-col bg-[#F2F3F7] overflow-hidden text-[#1C1C1E]">
      <main
        className={`
          flex-grow w-full flex flex-col overflow-y-auto 
          /* Сдвигаем контент ниже "челки", но НЕ добавляем отступы по бокам */
          pt-[var(--sat)] 
          ${showBottomTab ? 'pb-32' : 'pb-[var(--sab)]'} 
        `}
      >
        {children}
      </main>

      {showBottomTab && <BottomTab />}
    </div>
  );
};