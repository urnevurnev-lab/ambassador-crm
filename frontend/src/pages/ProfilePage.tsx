import React, { useEffect, useState } from 'react';
import {
  User,
  Settings,
  Shield,
  ChevronRight,
  Database
} from 'lucide-react';
import { StandardCard } from '../components/ui/StandardCard';
import WebApp from '@twa-dev/sdk';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const tgUser = WebApp.initDataUnsafe?.user;
  const [dbUser, setDbUser] = useState<any>(null);

  useEffect(() => {
    apiClient.get('/api/users/me')
      .then(res => setDbUser(res.data))
      .catch(err => console.error('Error fetching user data:', err));
  }, []);

  const isAdmin = dbUser?.role === 'ADMIN';

  const handleAction = (path?: string) => {
    WebApp.HapticFeedback.impactOccurred('light');
    if (path) navigate(path);
  };

  return (
    <div className="space-y-6 pb-24 pt-2">
      <PageHeader title="Профиль" />

      {/* 1. КАРТОЧКА ПРОФИЛЯ */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <StandardCard
          title={dbUser?.fullName || tgUser?.first_name || 'Амбассадор'}
          subtitle={tgUser?.username ? `@${tgUser.username}` : 'Амбассадор'}
          icon={User}
          color="purple"
        >
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl border border-white/20">
              <span className="text-xs font-bold text-gray-500 uppercase">Telegram ID</span>
              <span className="text-sm font-bold text-gray-900 font-mono">{tgUser?.id || '—'}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white/50 rounded-xl border border-white/20">
              <span className="text-xs font-bold text-gray-500 uppercase">Роль</span>
              <span className="text-[10px] font-black bg-purple-500 text-white px-2 py-0.5 rounded leading-none">
                {dbUser?.role || 'AMBASSADOR'}
              </span>
            </div>
          </div>
        </StandardCard>
      </motion.div>

      {/* 2. АДМИН-ПАНЕЛЬ (ТОЛЬКО ДЛЯ АДМИНОВ) */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="px-1"
        >
          <h3 className="text-sm font-bold text-gray-400 uppercase px-1 mb-3 mt-4 tracking-widest">Управление</h3>
          <StandardCard
            title="Панель управления"
            subtitle="Настройки системы и CRM"
            color="blue"
            icon={Database}
            onClick={() => handleAction('/admin')}
            action={<ChevronRight size={18} className="text-white/50" />}
          />
        </motion.div>
      )}

      {/* 3. НАСТРОЙКИ (КЛИКАБЕЛЬНЫЕ) */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-400 uppercase px-1 mt-6 tracking-widest">Настройки</h3>

        <StandardCard
          title="Личные данные"
          subtitle="Аккаунт и фото"
          color="white"
          floating={false}
          icon={User}
          onClick={() => handleAction()} // Можно добавить переход на экран редактирования
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
          onClick={() => handleAction()}
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
          onClick={() => handleAction()}
          action={
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
              <ChevronRight size={18} className="text-gray-300" />
            </div>
          }
        />
      </div>

    </div>
  );
};

export default ProfilePage;