import React from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpen, LayoutGrid, MapPin, ShoppingBag, User } from 'lucide-react';

interface BottomTabProps {
  height?: number;
}

const navItems = [
  { path: '/', icon: LayoutGrid, label: 'Главная' },
  { path: '/work', icon: MapPin, label: 'Точки' },
  { path: '/my-orders', icon: ShoppingBag, label: 'Заказы' },
  { path: '/knowledge', icon: BookOpen, label: 'Знания' },
  { path: '/profile', icon: User, label: 'Профиль' },
];

export const BottomTab: React.FC<BottomTabProps> = ({ height = 64 }) => {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
    >
      <div className="mx-auto max-w-md px-4">
        <div
          className="rounded-[44px] bg-gradient-to-b from-white/85 to-white/65 backdrop-blur-2xl border border-white/40 shadow-[0_30px_90px_rgba(0,0,0,0.18)]"
          style={{ paddingBottom: 'var(--tg-safe-area-bottom)' }}
        >
          <div className="px-6 pt-6 pb-4" style={{ minHeight: height }}>
            <div className="flex h-full items-end justify-between gap-3">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex flex-1 flex-col items-center justify-end gap-2 select-none transition-all duration-200 active:scale-95 ${
                      isActive ? 'text-black' : 'text-black/35 hover:text-black/55'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon size={28} strokeWidth={isActive ? 2 : 1.75} className={isActive ? '' : 'opacity-70'} />
                      <span className={`text-[12px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomTab;
