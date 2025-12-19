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
      const bgColor = '#F2F2F7'; // Match var(--ios-bg)
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

    const handleBack = () => {
      navigate(-1);
    };

    WebApp.BackButton.onClick(handleBack);
    return () => {
      WebApp.BackButton.offClick(handleBack);
    };
  }, [location.pathname, navigate]);

  useEffect(() => {
    document.getElementById('main-scroll-container')?.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen w-full relative bg-[var(--ios-bg)] text-[var(--ios-text)]">
      <main
        id="main-scroll-container"
        className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar w-full safe-p-top"
        style={{
          paddingBottom: '140px'
        }}
      >
        <div className="w-full max-w-md mx-auto relative z-0 px-1">
          {children}
        </div>
      </main>

      <Toaster position="top-center"
        toastOptions={{
          style: {
            borderRadius: '16px',
            background: '#FFFFFF',
            color: '#000000',
            fontWeight: 600,
            fontSize: '14px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
            border: '1px solid rgba(198, 198, 200, 0.3)'
          }
        }}
      />
      <BottomTab />
    </div>
  );
};