import React from 'react';
import { useLocation } from 'react-router-dom';
import { BottomTab } from './BottomTab'; // Импортируем правильно (с фигурными скобками)

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  // Скрываем нижнее меню на странице входа/сплэше/визите (если нужно)
  // Пока оставляем везде, кроме, может быть, самого сплэша (который перекрывает всё)
  const showBottomTab = true; 

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-gray-900 font-sans">
      <main className="w-full max-w-md mx-auto min-h-screen bg-[#F3F4F6] relative shadow-2xl">
        {children}
      </main>
      
      {showBottomTab && <BottomTab />}
    </div>
  );
};