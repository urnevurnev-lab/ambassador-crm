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

      // Tesla Style: Светлый чистый фон
      const bgColor = '#F5F5F7'; 
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
    return () => {
      WebApp.BackButton.offClick(handleBack);
    };
  }, [location.pathname, navigate]);

  useEffect(() => {
    document.getElementById('main-scroll-container')?.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex flex-col h-screen w-full relative bg-bg-primary text-text-primary font-sans overflow-hidden">

      {/* Основной скролл-контейнер */}
      <main
        id="main-scroll-container"
        className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar w-full relative z-0"
        style={{
          paddingTop: 'var(--tg-safe-area-top)',
          paddingBottom: 'calc(100px + var(--tg-safe-area-bottom))' // Место под меню
        }}
      >
        <div className="w-full max-w-md mx-auto px-4 pt-4 relative space-y-4">
          {children}
        </div>
      </main>

      {/* Уведомления: Premium Style */}
      <Toaster
        position="top-center"
        toastOptions={{
          className: '!bg-white/90 !backdrop-blur-md !text-black !rounded-2xl !shadow-float !border !border-gray-100 !px-4 !py-3 !font-medium !text-sm',
          duration: 3000,
        }}
      />

      <BottomTab />
    </div>
  );
};