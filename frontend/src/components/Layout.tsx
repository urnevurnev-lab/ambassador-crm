import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BottomTab from './BottomTab';
import { Toaster } from 'react-hot-toast';
import WebApp from '@twa-dev/sdk';

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      WebApp.ready();
      WebApp.expand();

      // Настройка цветов под терминал
      const bgColor = '#000000';
      WebApp.setHeaderColor(bgColor);
      WebApp.setBackgroundColor(bgColor);

      if (WebApp.isVersionAtLeast('7.7')) {
        WebApp.disableVerticalSwipes();
      }

      document.documentElement.style.setProperty('--tg-viewport-height', `${WebApp.viewportHeight}px`);
      document.documentElement.style.setProperty('--tg-viewport-stable-height', `${WebApp.viewportStableHeight}px`);

    } catch (e) {
      console.warn('WebApp init error', e);
    }
  }, []);

  useEffect(() => {
    const isRoot = location.pathname === '/';
    if (isRoot) {
      WebApp.BackButton.hide();
    } else {
      WebApp.BackButton.show();
    }
    const handleBack = () => navigate(-1);

    WebApp.BackButton.onClick(handleBack);

    // !!! ИСПРАВЛЕНИЕ ЗДЕСЬ: Обернули в скобки, чтобы вернуть void
    return () => {
      WebApp.BackButton.offClick(handleBack);
    };
  }, [location.pathname, navigate]);

  useEffect(() => {
    document.getElementById('main-scroll-container')?.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen w-full relative bg-[#F5F5F7] text-black font-sans overflow-hidden">

      {/* Основной контейнер */}
      <main
        id="main-scroll-container"
        className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar w-full relative z-0"
        style={{
          paddingTop: 'var(--tg-safe-area-top)',
          paddingBottom: 'calc(100px + var(--tg-safe-area-bottom))'
        }}
      >
        <div className="w-full max-w-md mx-auto px-4 relative">
          {children}
        </div>
      </main>

      {/* Уведомления (Toasts) - Стиль 8-bit */}
      <Toaster
        position="top-center"
        toastOptions={{
          className: '!bg-[#111] !text-white !border-2 !border-white !rounded-none !shadow-[4px_4px_0_0_#fff] !font-mono !text-xs !uppercase',
          duration: 3000,
        }}
      />

      {/* Навигация */}
      <BottomTab />
    </div>
  );
};