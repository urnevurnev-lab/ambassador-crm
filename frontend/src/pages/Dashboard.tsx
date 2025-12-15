import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import apiClient from '../api/apiClient';
import { CheckCircle, ChevronRight, User, Footprints, Store } from 'lucide-react';
import { motion } from 'framer-motion';
import WebApp from '@twa-dev/sdk';
import { LeaderboardWidget } from '../components/LeaderboardWidget';

interface DashboardStats {
  totalFacilities: number;
  totalVisits: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [visitsToday, setVisitsToday] = useState(0);

  // План на смену - жестко 5
  const DAILY_TARGET = 5;

  const telegramUser = useMemo(() => WebApp.initDataUnsafe?.user, []);
  const displayName = telegramUser
    ? [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ') || 'Сотрудник'
    : 'Сотрудник';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [facRes, visitRes] = await Promise.all([
          apiClient.get('/api/facilities'),
          apiClient.get('/api/visits'),
        ]);

        const visits = visitRes.data || [];
        // Считаем визиты за сегодня
        const todayCount = visits.filter((v: any) => {
          const d = new Date(v.date || v.createdAt);
          const now = new Date();
          return d.getDate() === now.getDate() &&
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear();
        }).length;

        setStats({
          totalFacilities: facRes.data.length,
          totalVisits: visits.length,
        });
        setVisitsToday(todayCount);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <Layout><div className="p-4 text-center mt-8 text-gray-400">Загрузка...</div></Layout>;
  }

  const progressPercent = Math.min(100, Math.round((visitsToday / DAILY_TARGET) * 100));

  return (
    <Layout>
      {/* Increased top padding to avoid Telegram header overlap */}
      <div className="pt-[calc(env(safe-area-inset-top)+35px)] px-4 pb-32 space-y-6">

        {/* Приветствие */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-sm text-gray-400 font-medium mb-1 uppercase tracking-wide">
              {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <h1 className="text-3xl font-bold text-[#1C1C1E] leading-tight">
              Привет,<br />{displayName}
            </h1>
          </div>
          <Link to="/profile">
            <motion.div
              whileTap={{ scale: 0.9 }}
              className="w-14 h-14 bg-white border border-gray-100 shadow-sm rounded-full flex items-center justify-center text-[#1C1C1E] relative overflow-hidden"
            >
              {telegramUser?.photo_url ? (
                <img src={telegramUser.photo_url} alt="Ava" className="w-full h-full object-cover" />
              ) : (
                <User size={24} />
              )}
            </motion.div>
          </Link>
        </div>

        {/* Главный блок - План на смену */}
        <div className="bg-gradient-to-br from-[#1C1C1E] to-[#2C2C2E] rounded-[30px] p-6 shadow-xl relative overflow-hidden text-white">
          {/* Background Decor */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

          <div className="flex justify-between items-end mb-6 relative z-10">
            <div>
              <div className="text-white/60 text-sm font-medium mb-2">План на смену</div>
              <div className="text-5xl font-bold flex items-baseline gap-2">
                {visitsToday} <span className="text-white/30 text-2xl font-medium">/ {DAILY_TARGET}</span>
              </div>
            </div>
            <div className="h-12 w-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10">
              <CheckCircle size={24} />
            </div>
          </div>

          {/* Прогресс бар */}
          <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden relative z-10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className={`h-full ${progressPercent >= 100 ? 'bg-green-400' : 'bg-[#007AFF]'}`}
            />
          </div>
          {progressPercent >= 100 && (
            <div className="mt-4 text-sm text-green-400 font-bold relative z-10 flex items-center gap-2">
              🎉 План выполнен!
            </div>
          )}
        </div>

        {/* Статистика (Кликабельная) */}
        <div className="grid grid-cols-2 gap-4">
          {/* Кнопка 1: История визитов */}
          <Link to="/visits-history">
            <motion.div whileTap={{ scale: 0.98 }} className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100 h-full flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Footprints size={60} />
              </div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-blue-50 rounded-2xl text-blue-600 w-fit">
                  <Footprints size={22} />
                </div>
                <ChevronRight size={20} className="text-gray-300" />
              </div>
              <div>
                <div className="text-3xl font-bold text-[#1C1C1E] mb-1">{stats?.totalVisits || 0}</div>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Визитов</div>
              </div>
            </motion.div>
          </Link>

          {/* Кнопка 2: База заведений */}
          <Link to="/facilities">
            <motion.div whileTap={{ scale: 0.98 }} className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100 h-full flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Store size={60} />
              </div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-purple-50 rounded-2xl text-purple-600 w-fit">
                  <Store size={22} />
                </div>
                <ChevronRight size={20} className="text-gray-300" />
              </div>
              <div>
                <div className="text-3xl font-bold text-[#1C1C1E] mb-1">{stats?.totalFacilities || 0}</div>
                <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">Точек</div>
              </div>
            </motion.div>
          </Link>
        </div>

        {/* Кнопка быстрого перехода к списку (теперь посередине) */}
        <Link to="/facilities">
          <button className="w-full py-4 bg-[#F2F2F7] rounded-2xl text-[#1C1C1E] font-semibold text-sm active:bg-gray-200 transition">
            Перейти к списку заведений
          </button>
        </Link>

        {/* Рейтинг Амбассадоров */}
        <LeaderboardWidget />
      </div>
    </Layout>
  );
};

export default Dashboard;