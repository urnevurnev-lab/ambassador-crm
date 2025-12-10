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
        className={`flex-grow w-full flex flex-col overflow-y-auto ${!isMapPage ? 'pt-14 px-4' : ''} ${
          /* pb-32 (128px) гарантирует, что контент будет выше меню даже на новых iPhone */
          showBottomTab && !isMapPage ? 'pb-32' : ''
        }`}
      >
        {children}
      </main>

      {showBottomTab && <BottomTab />}
    </div>
  );
};
