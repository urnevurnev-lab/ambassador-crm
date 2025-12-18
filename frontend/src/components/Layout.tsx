import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomTab from './BottomTab';

interface LayoutProps {
  children?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const content = children ?? <Outlet />;

  return (
    // min-h-screen и w-full растягивают на всю доступную область
    <div className="flex flex-col min-h-screen w-full bg-gray-50">

      {/* max-w-md mx-auto: Ограничивает ширину контента на планшетах/ПК (как моб. приложение).
          На телефоне это не создаст отступов, если ширина экрана < 448px.
          pb-[90px]: Отступ снизу под меню.
      */}
      <main className="flex-1 w-full max-w-md mx-auto relative pt-[var(--tg-safe-area-top)] pb-[90px]">
        <div className="px-4 py-6 space-y-4">
          {content}
        </div>
      </main>

      {/* Меню фиксировано снизу */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-[var(--tg-safe-area-bottom)] bg-white border-t border-gray-100">
        {/* Ограничиваем ширину меню тоже, чтобы оно не разъезжалось на ПК */}
        <div className="w-full max-w-md">
          <BottomTab />
        </div>
      </div>
    </div>
  );
};

export { Layout };
export default Layout;
