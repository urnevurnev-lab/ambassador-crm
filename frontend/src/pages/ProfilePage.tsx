import React from 'react';
import {
  User,
  Settings,
  Shield,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { StandardCard } from '../components/ui/StandardCard';
import WebApp from '@twa-dev/sdk';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';

const ProfilePage: React.FC = () => {
  const user = WebApp.initDataUnsafe?.user;

  return (
    <div className="space-y-6 pb-24 pt-2">
      <PageHeader title="Профиль" />

      {/* 1. КАРТОЧКА ПРОФИЛЯ */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <StandardCard
          title={user?.first_name || 'Амбассадор'}
          subtitle={user?.username ? `@${user.username}` : 'Амбассадор'}
          icon={User}
          color="purple"
        >
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl border border-white/20">
              <span className="text-xs font-bold text-gray-500 uppercase">Telegram ID</span>
              <span className="text-sm font-bold text-gray-900 font-mono">@{user?.id || '—'}</span>
            </div>
          </div>
        </StandardCard>
      </motion.div>

      {/* 2. НАСТРОЙКИ */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-400 uppercase px-1 mt-6 tracking-widest">Настройки</h3>

        <StandardCard
          title="Личные данные"
          subtitle="Аккаунт и фото"
          color="white"
          floating={false}
          icon={User}
          action={
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
              <ChevronRight size={18} className="text-gray-300" />
            </div>
          }
        />

        <StandardCard
          title="Безопасность"
          subtitle="Доступ и сессии"
          color="white"
          floating={false}
          icon={Shield}
          action={
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
              <ChevronRight size={18} className="text-gray-300" />
            </div>
          }
        />

        <StandardCard
          title="Приложение"
          subtitle="Тема и уведомления"
          color="white"
          floating={false}
          icon={Settings}
          action={
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
              <ChevronRight size={18} className="text-gray-300" />
            </div>
          }
        />
      </div>

      {/* Кнопка выхода */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        className="w-full py-5 text-red-500 font-extrabold bg-red-50 rounded-[28px] border border-red-100 flex items-center justify-center gap-2 active:brightness-95 transition-all mt-4"
      >
        <LogOut size={20} />
        Выйти из системы
      </motion.button>
    </div>
  );
};

export default ProfilePage;