import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, CheckSquare, BookOpen, User } from 'lucide-react';

export const BottomTab: React.FC = () => {
  const navItems = [
    { path: '/', icon: LayoutGrid, label: 'Главная' },
    { path: '/work', icon: CheckSquare, label: 'Задачи' },
    { path: '/knowledge', icon: BookOpen, label: 'База' },
    { path: '/profile', icon: User, label: 'Профиль' },
  ];

  return (
    // DOCKED BAR: Прибита к низу, фон размыт
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#F5F5F7]/90 backdrop-blur-xl border-t border-gray-200 pb-[env(safe-area-inset-bottom)] transition-all duration-300">
      
      {/* Контейнер: высота 50px (компактнее) */}
      <div className="flex items-center justify-around h-[50px] w-full max-w-md mx-auto px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              relative flex flex-col items-center justify-center flex-1 h-full
              transition-all duration-200 active:scale-95
              ${isActive ? 'text-black' : 'text-[#999999] hover:text-[#666666]'}
            `}
          >
            {({ isActive }) => (
              <>
                {/* Иконка */}
                <item.icon
                  size={26}
                  strokeWidth={isActive ? 2.5 : 2} // Жирнее при активе
                  className="transition-transform duration-200"
                />
                
                {/* Если нужны подписи - раскомментируй. 
                    Сейчас они убраны для чистого стиля "как на референсе" */}
                {/* <span className="text-[10px] font-medium mt-1">{item.label}</span> */}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default BottomTab;