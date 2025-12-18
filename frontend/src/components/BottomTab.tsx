import { Home, Map, ClipboardList, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomTab = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Функция для проверки активна кнопка или нет
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-full flex justify-around items-center py-3 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      
      {/* Кнопка: Главная */}
      <button 
        onClick={() => navigate('/')} 
        className="flex flex-col items-center gap-1 min-w-[60px]"
      >
        <Home 
          size={24} 
          className={isActive('/') ? 'text-blue-600 fill-blue-100' : 'text-slate-400'} 
          strokeWidth={isActive('/') ? 2.5 : 2}
        />
        <span className={`text-[10px] font-medium ${isActive('/') ? 'text-blue-600' : 'text-slate-400'}`}>
          Главная
        </span>
      </button>

      {/* Кнопка: Заказы */}
      <button 
        onClick={() => navigate('/orders')} 
        className="flex flex-col items-center gap-1 min-w-[60px]"
      >
        <ClipboardList 
          size={24} 
          className={isActive('/orders') ? 'text-blue-600 fill-blue-100' : 'text-slate-400'}
          strokeWidth={isActive('/orders') ? 2.5 : 2}
        />
        <span className={`text-[10px] font-medium ${isActive('/orders') ? 'text-blue-600' : 'text-slate-400'}`}>
          Заказы
        </span>
      </button>

      {/* Кнопка: Карта */}
      <button 
        onClick={() => navigate('/map')} 
        className="flex flex-col items-center gap-1 min-w-[60px]"
      >
        <Map 
          size={24} 
          className={isActive('/map') ? 'text-blue-600 fill-blue-100' : 'text-slate-400'}
          strokeWidth={isActive('/map') ? 2.5 : 2}
        />
        <span className={`text-[10px] font-medium ${isActive('/map') ? 'text-blue-600' : 'text-slate-400'}`}>
          Карта
        </span>
      </button>

      {/* Кнопка: Профиль */}
      <button 
        onClick={() => navigate('/profile')} 
        className="flex flex-col items-center gap-1 min-w-[60px]"
      >
        <User 
          size={24} 
          className={isActive('/profile') ? 'text-blue-600 fill-blue-100' : 'text-slate-400'}
          strokeWidth={isActive('/profile') ? 2.5 : 2}
        />
        <span className={`text-[10px] font-medium ${isActive('/profile') ? 'text-blue-600' : 'text-slate-400'}`}>
          Профиль
        </span>
      </button>

    </div>
  );
};

export default BottomTab;
