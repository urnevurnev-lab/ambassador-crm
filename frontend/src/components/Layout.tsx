import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomTab } from './BottomTab';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const showBottomTab = !location.pathname.startsWith('/admin') && location.pathname !== '/login';
  const content = children ?? <Outlet />;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Основной контент с отступами безопасности */}
      <main
        className={`
          flex-1 w-full max-w-md mx-auto relative
          pt-[var(--tg-safe-area-top)]
          ${showBottomTab ? 'pb-[90px]' : 'pb-[var(--tg-safe-area-bottom)]'}
        `}
      >
        <div className="px-4 py-6 space-y-4">
          {content}
        </div>
      </main>

      {/* Нижнее меню: фиксированное, с учетом отступа iPhone */}
      {showBottomTab && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 pb-[var(--tg-safe-area-bottom)]">
          <BottomTab />
        </div>
      )}
    </div>
  );
};

export { Layout };
export default Layout;
