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
  const isMapPage = location.pathname === '/map';

  return (
    /* h-[100dvh] фиксирует высоту на мобильных с динамическим viewport и убирает прокрутку body */
    <div className="flex flex-col h-[100dvh] bg-[#F8F9FA] overflow-hidden">
      {/* Контент скроллится внутри main, а не на уровне body */}
      <main
        className={`flex-grow w-full flex flex-col overflow-y-auto ${!isMapPage ? 'pt-14 px-4' : ''} ${
          showBottomTab && !isMapPage ? 'pb-24' : ''
        }`}
      >
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
