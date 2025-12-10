import React from 'react';
import { useLocation } from 'react-router-dom';
import { BottomTab } from './BottomTab'; // Убедитесь, что этот файл существует

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  // Скрываем меню только в админке и на экране входа
  const showBottomTab = !location.pathname.startsWith('/admin') && location.pathname !== '/login';

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FA]">
      {/* Контент растягивается на всю доступную высоту */}
      <main className={`flex-grow w-full ${showBottomTab ? 'pb-24' : ''}`}>
        {children}
      </main>

      {/* Нижнее меню: фиксировано, Z-index максимальный, чтобы карта не перекрывала */}
      {showBottomTab && (
        <div className="fixed bottom-0 left-0 right-0 z-[9999]">
          <BottomTab />
        </div>
      )}
    </div>
  );
};
