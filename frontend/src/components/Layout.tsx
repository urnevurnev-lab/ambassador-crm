import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BottomTab } from './BottomTab';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const showBottomTab = true; // Можно скрыть на некоторых экранах if (...)

  // Скролл наверх при переходе между страницами
  useEffect(() => {
    const mainContainer = document.getElementById('main-scroll-container');
    if (mainContainer) {
      mainContainer.scrollTo(0, 0);
    }
  }, [location.pathname]);

  return (
    <div className="flex flex-col h-screen w-full max-w-md mx-auto bg-[var(--tg-theme-bg-color)] relative shadow-2xl overflow-hidden">
      
      {/* ОСНОВНОЙ КОНТЕЙНЕР ДЛЯ СКРОЛЛА */}
      {/* pt-safe: отступ сверху под челку */}
      {/* pb-safe: отступ снизу под меню и полоску */}
      <main 
        id="main-scroll-container"
        className="flex-1 overflow-y-auto overflow-x-hidden pt-safe pb-safe no-scrollbar"
        style={{ WebkitOverflowScrolling: 'touch' }} // Плавный скролл на iOS
      >
        {children}
      </main>
      
      {showBottomTab && <BottomTab />}
    </div>
  );
};