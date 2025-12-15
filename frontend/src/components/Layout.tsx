import React from 'react';
import { useLocation } from 'react-router-dom';
import { BottomTab } from './BottomTab';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const showBottomTab = !location.pathname.startsWith('/admin') && location.pathname !== '/login';
  const isMapPage = location.pathname === '/map';

  return (
    <div className="flex flex-col h-[100dvh] bg-[#F8F9FA] overflow-hidden">
      <main
        className={`flex-grow w-full flex flex-col overflow-y-auto pt-[var(--sat)] ${showBottomTab ? 'pb-32' : 'pb-[var(--sab)]'} ${isMapPage ? '' : 'px-2'}`}
      >
        {children}
      </main>

      {showBottomTab && <BottomTab />}
    </div>
  );
};
