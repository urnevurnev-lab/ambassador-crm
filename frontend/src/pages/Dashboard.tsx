import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Trophy,
  Building2, ShoppingBag, BookOpen
} from 'lucide-react';
import { StandardCard } from '../components/ui/StandardCard';
import { motion } from 'framer-motion';
import WebApp from '@twa-dev/sdk';
import apiClient from '../api/apiClient';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = WebApp.initDataUnsafe?.user;
  const userName = user?.first_name || "Амбассадор";

  const [leaderboard, setLeaderboard] = useState<string[]>([]);

  useEffect(() => {
    apiClient.get('/api/orders/leaderboard')
      .then(res => setLeaderboard(res.data || []))
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6 pb-24 pt-2 text-left">
      {/* ПРЕМИАЛЬНАЯ ШАПКА */}
      <div className="px-1 flex justify-between items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">Панель управления</p>
          <h1 className="text-[34px] font-extrabold text-gray-900 leading-none tracking-tight">
            Привет, <span className="text-blue-600">{userName}</span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ rotate: 10, scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/profile')}
          className="w-14 h-14 bg-white rounded-2xl border border-gray-100 flex items-center justify-center text-2xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] cursor-pointer overflow-hidden"
        >
          {user?.photo_url ? (
            <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            "👤"
          )}
        </motion.div>
      </div>

      {/* РЕЙТИНГ АМБАССАДОРОВ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <StandardCard
          title="Рейтинг Амбассадоров"
          subtitle="Топ по заказам и чеку"
          icon={Trophy}
          color="blue"
        >
          <div className="space-y-3 mt-4">
            {(leaderboard.length > 0 ? leaderboard : ['Загрузка...']).map((name, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/40 rounded-xl border border-white/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 border border-blue-200">
                    {i + 1}
                  </div>
                  <span className="text-sm font-bold text-gray-800">{name}</span>
                </div>
                <div className={`w-2 h-2 rounded-full ${i === 0 && leaderboard.length > 0 ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-gray-300'}`} />
              </div>
            ))}
          </div>
        </StandardCard>
      </motion.div>

      {/* ОСНОВНЫЕ ДЕЙСТВИЯ */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <StandardCard
            title="Рабочая Смена"
            subtitle="Выбери заведение и начни работу"
            color="blue"
            onClick={() => navigate('/work')}
            className="min-h-[140px]"
            illustration={
              <Building2 size={120} className="text-white opacity-20" strokeWidth={1} />
            }
          />
        </div>

        <div className="h-[180px]">
          <StandardCard
            title="Знания"
            subtitle="Обучение"
            color="purple"
            onClick={() => navigate('/knowledge')}
            className="h-full"
            illustration={
              <BookOpen size={100} className="text-white opacity-20 rotate-6" strokeWidth={1} />
            }
          />
        </div>

        <div className="h-[180px]">
          <StandardCard
            title="Заказы"
            subtitle="История"
            color="coral"
            onClick={() => navigate('/my-orders')}
            className="h-full"
            illustration={
              <ShoppingBag size={100} className="text-white opacity-20 -rotate-6" strokeWidth={1} />
            }
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;