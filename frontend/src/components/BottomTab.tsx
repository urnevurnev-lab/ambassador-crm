import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Briefcase, BookOpen, Settings } from 'lucide-react';

export const BottomTab: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { id: 'home', label: 'Главная', icon: Home, path: '/' },
    { id: 'work', label: 'Работа', icon: Briefcase, path: '/work' }, // Бывший Портфель/Orders
    { id: 'base', label: 'База', icon: BookOpen, path: '/knowledge' },
    { id: 'admin', label: 'Админка', icon: Settings, path: '/admin' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 pb-safe pt-3 z-50">
      <div className="flex justify-between items-center max-w-md mx-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname.startsWith(tab.path) && tab.path !== '/' 
            ? true 
            : location.pathname === tab.path;
            
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center w-16 gap-1"
            >
              <div
                className={`
                  p-2 rounded-xl transition-all duration-300
                  ${isActive ? 'bg-black text-white shadow-md scale-110' : 'text-gray-400 bg-transparent'}
                `}
              >
                <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'text-black' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};