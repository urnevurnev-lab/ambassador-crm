import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import WebApp from '@twa-dev/sdk';
import BottomTab from './BottomTab';

interface LayoutProps {
  children?: React.ReactNode;
}

const APP_BG = '#F5F5F7';
const BOTTOM_BAR_HEIGHT = 84;
const CONTENT_BOTTOM_PADDING = 108;

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isBottomTabVisible = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/admin')) return false;
    if (path.startsWith('/education')) return false;
    if (path === '/orders') return false;
    if (path.startsWith('/orders/')) return false;
    return true;
  }, [location.pathname]);

  useEffect(() => {
    try {
      WebApp.ready();
      WebApp.expand();

      WebApp.setHeaderColor(APP_BG);
      WebApp.setBackgroundColor(APP_BG);

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
    <div
      className="flex min-h-screen w-full flex-col text-[#111111] font-sans relative overflow-hidden"
      style={{ backgroundColor: APP_BG }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#F5F5F7] via-[#F2F3FF] to-[#EEF1FF]" />
      <div className="pointer-events-none absolute -top-24 left-1/2 h-[440px] w-[440px] -translate-x-1/2 rounded-full bg-[#007AFF]/10 blur-3xl" />
      <div className="pointer-events-none absolute top-28 -left-28 h-[360px] w-[360px] rounded-full bg-fuchsia-400/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-[-140px] h-[420px] w-[420px] rounded-full bg-emerald-400/10 blur-3xl" />
      <main
        id="main-scroll-container"
        className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar w-full relative z-0"
        style={{
          paddingTop: 'var(--tg-safe-area-top)',
          paddingBottom: `calc(${isBottomTabVisible ? CONTENT_BOTTOM_PADDING : 20}px + var(--tg-safe-area-bottom))`,
        }}
      >
        <div className="w-full max-w-md mx-auto px-4 pt-4 relative space-y-4 z-10">
          {children}
        </div>
      </main>

      <Toaster
        position="top-center"
        toastOptions={{
          className:
            '!bg-white/80 !backdrop-blur-xl !text-black !rounded-2xl !shadow-md !border !border-white/30 !px-4 !py-3 !font-medium !text-sm',
          duration: 3000,
        }}
      />

      {isBottomTabVisible && <BottomTab height={BOTTOM_BAR_HEIGHT} />}
    </div>
  );
};
