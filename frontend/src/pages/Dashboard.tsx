import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import apiClient from '../api/apiClient';
import { CheckCircle, ChevronRight, User, Footprints, Store, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import WebApp from '@twa-dev/sdk';
import { LeaderboardWidget } from '../components/LeaderboardWidget';

// --- Types ---
interface DashboardStats {
  totalFacilities: number;
  totalVisits: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [visitsToday, setVisitsToday] = useState(0);

  // FIXME: В будущем получать с бэкенда
  const DAILY_TARGET = 5;

  // Безопасное получение данных пользователя
  const telegramUser = useMemo(() => WebApp.initDataUnsafe?.user, []);
  const displayName = telegramUser
    ? [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ') || 'Сотрудник'
    : 'Сотрудник';

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Параллельная загрузка для скорости
        const [facRes, visitRes] = await Promise.all([
          apiClient.get('/api/facilities'),
          apiClient.get('/api/visits'),
        ]);

        const visits = visitRes.data || [];
        
        // Считаем визиты за сегодня (Локальное время)
        const now = new Date();
        const todayCount = visits.filter((v: any) => {
          const d = new Date(v.date || v.createdAt);
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

  // Вычисляем процент выполнения
  const progressPercent = Math.min(100, Math.round((visitsToday / DAILY_TARGET) * 100));

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center text-gray-400">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Единый отступ сверху как в AdminPage: safe-area + 20px */}
      <div className="pt-[calc(env(safe-area-inset-top)+20px)] px-4 pb-32 space-y-6">

        {/* 1. Header (Приветствие + Аватар) */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-1">
              {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <h1 className="text-3xl font-bold text-[#1C1C1E] leading-tight">
              Привет,<br />{displayName}
            </h1>
          </div>
          <Link to="/profile">
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="w-12 h-12 bg-white border border-gray-200 shadow-sm rounded-full flex items-center justify-center text-[#1C1C1E] overflow-hidden"
            >
              {telegramUser?.photo_url ? (
                <img src={telegramUser.photo_url} alt="User" className="w-full h-full object-cover" />
              ) : (
                <User size={20} />
              )}
            </motion.div>
          </Link>
        </div>

        {/* 2. GRID LAYOUT (Как в Админке) */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* BIG CARD: План на смену (Col-span-2) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.98 }}
            className="col-span-2 bg-[#1C1C1E] rounded-[30px] p-6 min-h-[160px] shadow-lg flex flex-col justify-between relative overflow-hidden text-white"
          >
             {/* Decor Background */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            
            <div className="flex justify-between items-start relative z-10">
              <div>
                <h3 className="text-xl font-bold">План на смену</h3>
                <p className="text-white/60 text-xs mt-1">Выполнено визитов</p>
              </div>
              <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                <CheckCircle size={20} className={progressPercent >= 100 ? "text-green-400" : "text-white"} />
              </div>
            </div>

            <div className="relative z-10 mt-4">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold">{visitsToday}</span>
                <span className="text-white/40 text-lg font-medium">/ {DAILY_TARGET}</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className={`h-full rounded-full ${progressPercent >= 100 ? 'bg-green-400' : 'bg-[#007AFF]'}`}
                />
              </div>
            </div>
          </motion.div>

          {/* CARD 1: Точки (Facilities) */}
          <Link to="/facilities" className="contents">
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-[30px] p-5 h-[160px] shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                <Store size={80} />
              </div>
              
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-2">
                <Store size={20} />
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-[#1C1C1E]">Точки</h3>
                <p className="text-gray-400 text-xs">База: {stats?.totalFacilities || 0}</p>
              </div>
            </motion.div>
          </Link>

          {/* CARD 2: История (History) */}
          <Link to="/visits-history" className="contents">
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-[30px] p-5 h-[160px] shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute -top-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Footprints size={80} />
              </div>

              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-2">
                <Footprints size={20} />
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-[#1C1C1E]">История</h3>
                <p className="text-gray-400 text-xs">Всего: {stats?.totalVisits || 0}</p>
              </div>
            </motion.div>
          </Link>

        </div>

        {/* 3. LEADERBOARD (Как отдельный виджет, но в стиле) */}
        <div className="mt-8">
           <div className="flex items-center gap-2 mb-4 px-1">
             <Trophy size={18} className="text-[#FFD700]" />
             <h2 className="text-lg font-bold text-[#1C1C1E]">Лидеры недели</h2>
           </div>
           <LeaderboardWidget />
        </div>

      </div>
    </Layout>
  );
};

export default Dashboard;