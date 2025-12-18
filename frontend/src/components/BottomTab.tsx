import { Home, Map, ClipboardList, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomTab = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // Функция навигации без перезагрузки
  const go = (path: string) => {
    navigate(path);
    // Вибрация при клике (Haptic Feedback) для ощущения нативности
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
  };

  return (
    <div className="w-full flex justify-around items-center py-3 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-[calc(10px+var(--tg-safe-area-bottom))]">
      <button onClick={() => go('/')} className="flex flex-col items-center gap-1 w-16">
        <Home size={24} className={isActive('/') ? 'text-blue-600 fill-blue-50' : 'text-slate-400'} strokeWidth={2} />
        <span className={`text-[10px] font-medium ${isActive('/') ? 'text-blue-600' : 'text-slate-400'}`}>Главная</span>
      </button>

      <button onClick={() => go('/orders')} className="flex flex-col items-center gap-1 w-16">
        <ClipboardList size={24} className={isActive('/orders') ? 'text-blue-600 fill-blue-50' : 'text-slate-400'} strokeWidth={2} />
        <span className={`text-[10px] font-medium ${isActive('/orders') ? 'text-blue-600' : 'text-slate-400'}`}>Заказы</span>
      </button>

      <button onClick={() => go('/map')} className="flex flex-col items-center gap-1 w-16">
        <Map size={24} className={isActive('/map') ? 'text-blue-600 fill-blue-50' : 'text-slate-400'} strokeWidth={2} />
        <span className={`text-[10px] font-medium ${isActive('/map') ? 'text-blue-600' : 'text-slate-400'}`}>Карта</span>
      </button>

      <button onClick={() => go('/profile')} className="flex flex-col items-center gap-1 w-16">
        <User size={24} className={isActive('/profile') ? 'text-blue-600 fill-blue-50' : 'text-slate-400'} strokeWidth={2} />
        <span className={`text-[10px] font-medium ${isActive('/profile') ? 'text-blue-600' : 'text-slate-400'}`}>Профиль</span>
      </button>
    </div>
  );
};

export default BottomTab;