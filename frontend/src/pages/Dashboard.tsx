import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import apiClient from '../api/apiClient';
import { Briefcase, CheckCircle, ChevronRight, User } from 'lucide-react';
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1C1C1E]">
              Привет,<br />{displayName}
            </h1>
          </div>
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
            <User size={24} />
          </div>
        </div>

        {/* Главный блок - План на смену */}
        <div className="bg-white rounded-[30px] p-6 shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="flex justify-between items-end mb-4 relative z-10">
            <div>
              <div className="text-gray-400 text-sm font-medium mb-1">План на смену</div>
              <div className="text-4xl font-bold text-[#1C1C1E]">{visitsToday} <span className="text-gray-300 text-2xl">/ {DAILY_TARGET}</span></div>
            </div>
            <div className="h-10 w-10 bg-[#1C1C1E] rounded-full flex items-center justify-center text-white">
              <CheckCircle size={20} />
            </div>
          </div>

          {/* Прогресс бар */}
          <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden relative z-10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              className={`h-full ${progressPercent >= 100 ? 'bg-green-500' : 'bg-[#1C1C1E]'}`}
            />
          </div>
          {progressPercent >= 100 && (
            <div className="mt-3 text-sm text-green-600 font-bold relative z-10">
              🎉 План выполнен!
            </div>
          )}
        </div>

        {/* Статистика (Кликабельная) */}
        <div className="grid grid-cols-2 gap-3">
          {/* Кнопка 1: История визитов */}
          <Link to="/visits-history">
            <motion.div whileTap={{ scale: 0.98 }} className="bg-white p-5 rounded-[25px] shadow-sm border border-gray-100 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600 w-fit">
                  <Briefcase size={20} />
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#1C1C1E] mt-3">{stats?.totalVisits || 0}</div>
                <div className="text-xs text-gray-400 font-medium">Всего визитов</div>
              </div>
            </motion.div>
          </Link>

          {/* Кнопка 2: База заведений */}
          <Link to="/facilities">
            <motion.div whileTap={{ scale: 0.98 }} className="bg-white p-5 rounded-[25px] shadow-sm border border-gray-100 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-purple-50 rounded-xl text-purple-600 w-fit">
                  <Briefcase size={20} />
                </div>
                <ChevronRight size={18} className="text-gray-300" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#1C1C1E] mt-3">{stats?.totalFacilities || 0}</div>
                <div className="text-xs text-gray-400 font-medium">Точек в базе</div>
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