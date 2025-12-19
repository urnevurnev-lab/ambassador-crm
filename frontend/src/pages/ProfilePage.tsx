import React from 'react';
import { 
  User, 
  Settings, 
  Shield, 
  LogOut, 
  Crown, 
  Star,
  Zap
} from 'lucide-react';
import { StandardCard } from '../components/ui/StandardCard';
import WebApp from '@twa-dev/sdk';

const ProfilePage: React.FC = () => {
  const user = WebApp.initDataUnsafe?.user;

  return (
    <div className="space-y-5 pb-24">
      
      {/* 1. КАРТОЧКА ПРОФИЛЯ (Темная, Премиальная) */}
      <StandardCard
        title={user?.first_name || 'Амбассадор'}
        subtitle={`@${user?.username || 'username'} • Pro Account`}
        color="dark"
        className="min-h-[220px]"
        illustration={
          <User size={180} className="text-white opacity-10 translate-y-4" />
        }
      >
        {/* Бейджи внутри карточки */}
        <div className="flex gap-2 mt-4">
          <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold border border-white/10 flex items-center gap-1">
            <Crown size={12} className="text-yellow-400" /> Leader
          </div>
          <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold border border-white/10">
            Lv. 5
          </div>
        </div>
      </StandardCard>

      {/* 2. СЕТКА СТАТИСТИКИ (Bento Grid) */}
      <div className="grid grid-cols-2 gap-3">
        <StandardCard 
          title="Рейтинг" 
          value="4.98"
          color="white"
          illustration={<Star size={60} className="text-yellow-400 opacity-20 rotate-12" />}
        />
        <StandardCard 
          title="XP" 
          value="12,450"
          color="white"
          illustration={<Zap size={60} className="text-blue-400 opacity-20 -rotate-12" />}
        />
      </div>

      {/* 3. НАСТРОЙКИ (Парящие белые блоки) */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900 px-2">Настройки</h3>
        
        <StandardCard 
          title="Личные данные" 
          subtitle="Изменить фото и имя"
          color="white"
          showArrow
          floating={false}
          icon={User}
        />
        
        <StandardCard 
          title="Безопасность" 
          subtitle="Пароль и FaceID"
          color="white"
          showArrow
          floating={false}
          icon={Shield}
        />

        <StandardCard 
          title="Настройки приложения" 
          color="white"
          showArrow
          floating={false}
          icon={Settings}
        />
      </div>

      {/* Кнопка выхода */}
      <button className="w-full py-4 text-red-500 font-bold bg-red-50 rounded-[24px] active:scale-95 transition-transform">
        Выйти из аккаунта
      </button>
    </div>
  );
};

export default ProfilePage;