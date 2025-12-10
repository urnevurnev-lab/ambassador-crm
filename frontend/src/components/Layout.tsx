import React from 'react';
import { useLocation } from 'react-router-dom';
import { BottomTab } from './BottomTab'; // Убедитесь, что этот файл существует

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const showBottomTab = !location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col relative">
      {/* Контент растягивается на всю высоту */}
      <main className="flex-grow w-full">
        {children}
      </main>

      {/* Нижнее меню - ВСЕГДА ПОВЕРХ ВСЕГО (z-50) */}
      {showBottomTab && (
        <div className="fixed bottom-0 left-0 right-0 z-[9999]">
          <BottomTab />
        </div>
      )}
    </div>
  );
};
