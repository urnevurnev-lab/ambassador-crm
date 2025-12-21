import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Briefcase, BookOpen, User } from 'lucide-react';

export const BottomTab: React.FC = () => {
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'MAIN' },
    { path: '/work', icon: Briefcase, label: 'WORK' },
    { path: '/knowledge', icon: BookOpen, label: 'BASE' },
    { path: '/profile', icon: User, label: 'USER' },
  ];

  return (
    <div className="fixed bottom-6 left-4 right-4 z-[50]">
      <div className="flex items-center justify-around h-[72px] w-full max-w-md mx-auto bg-white/80 backdrop-blur-xl rounded-[32px] shadow-[0_20px_40px_rgba(0,0,0,0.1)] px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              relative flex flex-col items-center justify-center flex-1 h-full
              transition-all duration-200
              ${isActive ? 'text-black' : 'text-[#C7C7CC]'}
            `}
          >
            <item.icon
              size={24}
              strokeWidth={2}
              className="mb-1"
            />
            <span className="text-[10px] font-medium uppercase tracking-tight">
              {item.label}
            </span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default BottomTab;