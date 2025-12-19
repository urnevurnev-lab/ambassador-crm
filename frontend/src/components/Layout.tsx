import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import BottomTab from './BottomTab';
import { Toaster } from 'react-hot-toast';
import WebApp from '@twa-dev/sdk';

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
    
    if (WebApp.isVersionAtLeast('6.1')) {
       try {
         WebApp.setHeaderColor('#F8F9FE'); 
         WebApp.setBackgroundColor('#F8F9FE');
       } catch (e) { console.warn(e); }
    }
  }, []);

  useEffect(() => {
    document.getElementById('main-scroll-container')?.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex flex-col h-full relative bg-[#F8F9FE] text-[#111827]">
      {/* Контент */}
      <main 
        id="main-scroll-container"
        className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar w-full"
      >
        <div className="pt-[calc(env(safe-area-inset-top)+20px)] w-full max-w-md mx-auto">
           {children}
        </div>
      </main>

      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.5)',
            borderRadius: '16px',
            color: '#1D1D1F',
          },
        }}
      />

      <BottomTab />
    </div>
  );
};