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

      // Настройка темы
      const bgColor = '#F8F9FE';
      WebApp.setHeaderColor(bgColor);
      WebApp.setBackgroundColor(bgColor);

      // Блокировка свайпа вниз (только для новых версий)
      if (WebApp.isVersionAtLeast('7.7')) {
        WebApp.disableVerticalSwipes();
      }

      // Настройка высоты вьюпорта
      document.documentElement.style.setProperty('--tg-viewport-height', `${WebApp.viewportHeight}px`);
      document.documentElement.style.setProperty('--tg-viewport-stable-height', `${WebApp.viewportStableHeight}px`);

    } catch (e) {
      console.warn('WebApp init error', e);
    }
  }, []);

  // Управление кнопкой "Назад"
  useEffect(() => {
    const isRoot = location.pathname === '/';

    if (isRoot) {
      WebApp.BackButton.hide();
    } else {
      WebApp.BackButton.show();
    }

    const handleBack = () => {
      navigate(-1);
    };

    WebApp.BackButton.onClick(handleBack);
    return () => {
      WebApp.BackButton.offClick(handleBack);
    };
  }, [location.pathname, navigate]);

  // Скролл вверх при смене страницы
  useEffect(() => {
    document.getElementById('main-scroll-container')?.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex flex-col h-[100dvh] w-full relative bg-[#F8F9FE] text-[#111827] overflow-hidden">
      <main
        id="main-scroll-container"
        className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar w-full"
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 120px)'
        }}
      >
        <div className="w-full max-w-md mx-auto px-4 pt-4 relative z-0">
          {children}
        </div>
      </main>

      <Toaster position="top-center" />
      <BottomTab />
    </div>
  );
};