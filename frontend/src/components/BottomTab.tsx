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
  { path: '/orders', icon: PlusCircle, label: 'Действия' },
  { path: '/admin', icon: User, label: 'Админка' },
];

const TabButton: React.FC<{ tab: TabItem; isActive: boolean }> = ({ tab, isActive }) => {
  const Icon = tab.icon;
  const color = isActive ? '#1C1C1E' : '#C7C7CC';

  return (
    <motion.div whileTap={{ scale: 0.92 }} className="flex-1 text-center">
      <Link to={tab.path} className="flex flex-col items-center justify-center">
        <Icon size={28} strokeWidth={2.5} color={color} />
        <span className="text-[11px] font-medium" style={{ color }}>{tab.label}</span>
      </Link>
    </motion.div>
  );
};

export const BottomTab: React.FC = () => {
  const location = useLocation();
  const primaryActionPath = '/orders';
  const primaryTab = tabs.find((t) => t.path === primaryActionPath)!;
  const PrimaryIcon = primaryTab.icon;
  const secondaryTabs = tabs.filter((t) => t.path !== primaryActionPath);
  const isActive = (path: string) =>
    location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <div className="fixed bottom-6 left-4 right-4 h-[80px] rounded-[40px] z-50 bg-white/80 backdrop-blur-xl shadow-soft border border-white/20">
      <div className="h-full max-w-3xl mx-auto px-6 flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center justify-evenly">
          {secondaryTabs.slice(0, 2).map((tab) => (
            <TabButton key={tab.path} tab={tab} isActive={isActive(tab.path)} />
          ))}
        </div>

        <motion.div whileTap={{ scale: 0.95 }} className="-translate-y-4">
          <Link
            to={primaryTab.path}
            className="w-16 h-16 rounded-full bg-[#1C1C1E] text-white flex items-center justify-center shadow-soft border border-white/30"
          >
            <PrimaryIcon size={32} />
          </Link>
        </motion.div>

        <div className="flex flex-1 items-center justify-evenly">
          {secondaryTabs.slice(2).map((tab) => (
            <TabButton key={tab.path} tab={tab} isActive={isActive(tab.path)} />
          ))}
        </div>
      </div>
    </div>
  );
};
