import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Map, PlusCircle, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface TabItem {
  path: string;
  icon: React.ElementType;
  label: string;
}

const tabs: TabItem[] = [
  { path: '/', icon: Home, label: 'Панель' },
  { path: '/map', icon: Map, label: 'Карта' },
  { path: '/orders', icon: PlusCircle, label: 'Заказ' },
  { path: '/admin', icon: User, label: 'Админка' },
];

const TabButton: React.FC<{ tab: TabItem; isActive: boolean }> = ({ tab, isActive }) => {
  const Icon = tab.icon;
  const color = isActive ? '#1C1C1E' : '#C7C7CC';

  return (
    <motion.div whileTap={{ scale: 0.9 }} className="flex-1 text-center">
      <Link to={tab.path} className="flex flex-col items-center justify-center">
        <Icon size={28} strokeWidth={2.5} color={color} />
        <span className="text-[11px] font-medium" style={{ color }}>{tab.label}</span>
      </Link>
    </motion.div>
  );
};

export const BottomTab: React.FC = () => {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[90px] z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-[35px]">
      <div className="h-full max-w-3xl mx-auto px-6 flex items-center justify-between">
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
