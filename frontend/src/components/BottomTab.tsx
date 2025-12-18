import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Briefcase, BookOpen, Settings } from 'lucide-react';

interface TabItem {
  path: string;
  icon: React.ElementType;
  label: string;
}

const tabs: TabItem[] = [
  { path: '/', icon: Home, label: 'Главная' },
  { path: '/facilities', icon: Briefcase, label: 'Работа' },
  { path: '/knowledge', icon: BookOpen, label: 'База' },
  { path: '/admin', icon: Settings, label: 'Меню' },
];

const TabButton: React.FC<{ tab: TabItem; isActive: boolean }> = ({ tab, isActive }) => {
  const Icon = tab.icon;
  // Используем только цвет иконки, без фона
  const color = isActive ? '#1C1C1E' : '#C7C7CC';

  return (
    <div className="flex-1 flex justify-center group pointer-events-auto">
      <Link
        to={tab.path}
        className="w-full h-full flex flex-col items-center justify-center pt-1"
      >
        <Icon
          size={26}
          strokeWidth={isActive ? 2.5 : 2}
          color={color}
          className="transition-transform duration-200 group-active:scale-95"
        />
        <span
          className="text-[10px] mt-1 font-medium transition-colors duration-200"
          style={{ color }}
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
      className="fixed bottom-0 left-0 right-0 z-[2000] bg-white border-t border-gray-100"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        height: 'calc(60px + env(safe-area-inset-bottom))'
      }}
    >
      <div className="flex items-center justify-between h-[60px] px-6">
        {tabs.map((tab) => (
          <TabButton
            key={tab.path}
            tab={tab}
            isActive={location.pathname === tab.path}
          />
        ))}
      </div>
    </div>
  );
};

export default BottomTab;
