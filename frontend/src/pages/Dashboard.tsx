import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import apiClient from '../api/apiClient';
import { CheckCircle, User, Footprints, Store, Trophy, ShoppingBag, Wallet, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import WebApp from '@twa-dev/sdk';
import { LeaderboardWidget } from '../components/LeaderboardWidget';

// --- Types ---
interface DashboardStats {
  totalFacilities: number;
  totalVisits: number;
}

interface OrderStats {
  shippedSum: number;
  pendingCount: number;
  rejectedSum: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [visitsToday, setVisitsToday] = useState(0);

  const DAILY_TARGET = 5;

  const telegramUser = useMemo(() => WebApp.initDataUnsafe?.user, []);
  const displayName = telegramUser
    ? [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ') || 'Сотрудник'
    : 'Сотрудник';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [facRes, visitRes, ordersRes] = await Promise.all([
          apiClient.get('/api/facilities'),
          apiClient.get('/api/visits'),
          apiClient.get('/api/orders/my-stats').catch(() => ({ data: { shippedSum: 0, pendingCount: 0, rejectedSum: 0 } })),
        ]);

        const visits = visitRes.data || [];
        
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
        setOrderStats(ordersRes.data);
        setVisitsToday(todayCount);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const progressPercent = Math.min(100, Math.round((visitsToday / DAILY_TARGET) * 100));

  // Форматирование денег (15 000 ₽)
  const formatMoney = (val: number) => new Intl.NumberFormat('ru-RU').format(val);

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
      <div className="pt-6 px-4 pb-32 space-y-4">

        {/* 1. Header */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-[#1C1C1E] leading-tight mt-2">
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

        {/* 2. GRID LAYOUT */}
        <div className="grid grid-cols-2 gap-3">
          
          {/* BIG CARD 1: План на смену */}
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="col-span-2 bg-[#1C1C1E] rounded-[30px] p-6 min-h-[140px] shadow-lg flex flex-col justify-between relative overflow-hidden text-white"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
            
            <div className="flex justify-between items-start relative z-10">
              <div>
                <h3 className="text-xl font-bold">План на смену</h3>
                <p className="text-white/60 text-xs mt-1">Визиты сегодня</p>
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
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className={`h-full rounded-full ${progressPercent >= 100 ? 'bg-green-400' : 'bg-[#007AFF]'}`}
                />
              </div>
            </div>
          </motion.div>

          {/* BIG CARD 2: Мои Заказы (ФИНАНСЫ) */}
          <Link to="/my-orders" className="contents">
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="col-span-2 bg-white rounded-[30px] p-6 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden cursor-pointer"
            >
              <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                          <Wallet size={20} />
                      </div>
                      <div>
                          <h3 className="text-lg font-bold text-[#1C1C1E]">Мои продажи</h3>
                          <p className="text-gray-400 text-xs">Подтвержденные</p>
                      </div>
                  </div>
                  {/* Если есть заявки в ожидании - показываем бейдж */}
                  {orderStats && orderStats.pendingCount > 0 && (
                       <div className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full flex items-center gap-1">
                          <ShoppingBag size={12} />
                          {orderStats.pendingCount} в обр.
                       </div>
                  )}
              </div>

              <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-[#1C1C1E]">{formatMoney(orderStats?.shippedSum || 0)}</span>
                  <span className="text-lg font-bold text-gray-400 mb-1">₽</span>
              </div>

              {/* Если есть отказы - показываем мелким шрифтом внизу */}
              {orderStats && orderStats.rejectedSum > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2 text-xs text-red-500">
                      <AlertCircle size={14} />
                      <span>Отклонено на {formatMoney(orderStats.rejectedSum)} ₽</span>
                  </div>
              )}
            </motion.div>
          </Link>

          {/* CARD 3: Точки */}
          <Link to="/facilities" className="contents">
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-[30px] p-5 h-[140px] shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                <Store size={80} />
              </div>
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-2">
                <Store size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1C1C1E]">Точки</h3>
                <p className="text-gray-400 text-xs">Всего: {stats?.totalFacilities || 0}</p>
              </div>
            </motion.div>
          </Link>

          {/* CARD 4: История визитов */}
          <Link to="/visits-history" className="contents">
            <motion.div
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-[30px] p-5 h-[140px] shadow-sm border border-gray-100 flex flex-col justify-between relative overflow-hidden group"
            >
              <div className="absolute -top-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Footprints size={80} />
              </div>
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-2">
                <Footprints size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1C1C1E]">История</h3>
                <p className="text-gray-400 text-xs">Визитов: {stats?.totalVisits || 0}</p>
              </div>
            </motion.div>
          </Link>

        </div>

        {/* 3. LEADERBOARD */}
        <div className="mt-6">
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
