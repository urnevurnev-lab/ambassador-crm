import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Map, PlusCircle, User } from 'lucide-react';

interface TabItem {
  path: string;
  icon: React.ElementType;
  label: string;
}

const tabs: TabItem[] = [
  { path: '/', icon: Home, label: 'Панель' },
  { path: '/facilities', icon: Map, label: 'Заведения' },
  { path: '/orders', icon: PlusCircle, label: 'Заказ' },
  { path: '/admin', icon: User, label: 'Профиль' },
];

const TabButton: React.FC<{ tab: TabItem; isActive: boolean }> = ({ tab, isActive }) => {
  const Icon = tab.icon;
  // Используем акцентный цвет для активной иконки
  const activeColor = '#4F46E5'; 
  const inactiveColor = '#C7C7CC';

  return (
    <div className="flex-1 flex justify-center group pointer-events-auto">
      <Link to={tab.path} className="flex flex-col items-center justify-center w-full h-full pt-1">
        <Icon 
          size={26} 
          strokeWidth={isActive ? 2.5 : 2} 
          color={isActive ? activeColor : inactiveColor} 
          className="transition-transform duration-200 group-active:scale-95"
        />
        <span 
          className={`text-[10px] mt-1 font-medium transition-colors duration-200 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}
        >
          {tab.label}
        </span>
      </Link>
    </div>
  );
};

export const BottomTab: React.FC = () => {
  const location = useLocation();

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-[2000] bg-white rounded-t-[30px] shadow-[0_-10px_60px_rgba(0,0,0,0.05)]"
      style={{ 
        paddingBottom: 'env(safe-area-inset-bottom)', 
        height: 'calc(80px + env(safe-area-inset-bottom))'
      }}
    >
      <div className="flex items-center justify-between h-[80px] px-6">
        {tabs.map((tab) => (
          <TabButton
            key={tab.path}
            tab={tab}
            isActive={location.pathname === tab.path || (tab.path !== '/' && location.pathname.startsWith(tab.path))}
          />
        ))}
      </div>
    </div>
  );
};
