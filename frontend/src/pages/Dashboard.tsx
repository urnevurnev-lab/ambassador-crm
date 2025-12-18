import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import apiClient from '../api/apiClient';
import { CheckCircle, User, Footprints, Store, Trophy, Wallet, ShoppingBag, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import WebApp from '@twa-dev/sdk';
import LeaderboardWidget from '../components/LeaderboardWidget';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({ totalFacilities: 0, totalVisits: 0 });
  const [orderStats, setOrderStats] = useState({ shippedSum: 0, pendingCount: 0, rejectedSum: 0 });
  const [loading, setLoading] = useState(true);
  const [visitsToday, setVisitsToday] = useState(0);
  const telegramUser = useMemo(() => WebApp.initDataUnsafe?.user, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [facRes, visitRes, ordersRes] = await Promise.all([
          apiClient.get('/api/facilities'),
          apiClient.get('/api/visits'),
          apiClient.get('/api/orders/my-stats').catch(() => ({ data: { shippedSum: 0, pendingCount: 0, rejectedSum: 0 } })),
        ]);

        const allVisits = visitRes.data || [];
        const myVisits = allVisits.filter((v: any) => v.user?.telegramId === String(telegramUser?.id) || v.userId === telegramUser?.id);
        
        const today = new Date().toDateString();
        setVisitsToday(myVisits.filter((v: any) => new Date(v.date).toDateString() === today).length);
        setStats({ totalFacilities: facRes.data.length, totalVisits: myVisits.length });
        setOrderStats(ordersRes.data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchData();
  }, [telegramUser]);

  const formatMoney = (val: number) => new Intl.NumberFormat('ru-RU').format(val);

  if (loading) return <Layout><div className="flex justify-center items-center h-screen">Загрузка...</div></Layout>;

  return (
    <Layout>
      <div className="pt-6 px-4 pb-32 space-y-4">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold text-[#1C1C1E]">Привет,<br />{telegramUser?.first_name || 'Сотрудник'}</h1>
          <div className="flex gap-3 items-center">
             <Link to="/my-orders">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm relative border border-gray-200">
                    <AlertCircle size={20} />
                    {orderStats.rejectedSum > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-ping" />}
                </div>
             </Link>
             <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden"><img src={telegramUser?.photo_url} className="w-full h-full" /></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 bg-[#1C1C1E] text-white p-6 rounded-[30px] shadow-lg relative overflow-hidden">
                <h3 className="font-bold text-xl">План на смену</h3>
                <div className="text-4xl font-bold mt-2">{visitsToday} <span className="text-white/40 text-lg">/ 5</span></div>
                <div className="w-full bg-white/10 h-2 rounded-full mt-2"><div style={{ width: `${(visitsToday/5)*100}%` }} className="bg-green-400 h-full rounded-full" /></div>
            </div>

            <Link to="/my-orders" className="col-span-2">
                <div className="bg-white p-6 rounded-[30px] shadow-sm border border-gray-100 relative">
                    <div className="flex justify-between mb-4">
                        <div className="flex gap-3 items-center"><div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center"><Wallet /></div><div><div className="font-bold text-lg">Мои продажи</div><div className="text-xs text-gray-400">Подтверждено</div></div></div>
                        {orderStats.pendingCount > 0 && <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><ShoppingBag size={12}/> {orderStats.pendingCount}</div>}
                    </div>
                    <div className="text-3xl font-bold">{formatMoney(orderStats.shippedSum)} ₽</div>
                    {orderStats.rejectedSum > 0 && <div className="mt-2 text-xs text-red-500 flex gap-1 items-center"><AlertCircle size={12}/> Отклонено: {formatMoney(orderStats.rejectedSum)} ₽</div>}
                </div>
            </Link>

            <Link to="/facilities" className="bg-white p-5 rounded-[30px] shadow-sm border border-gray-100 h-[140px] flex flex-col justify-between">
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center"><Store /></div>
                <div><div className="font-bold text-lg">Точки</div><div className="text-xs text-gray-400">{stats.totalFacilities} всего</div></div>
            </Link>

            <Link to="/visits-history" className="bg-white p-5 rounded-[30px] shadow-sm border border-gray-100 h-[140px] flex flex-col justify-between">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center"><Footprints /></div>
                <div><div className="font-bold text-lg">История</div><div className="text-xs text-gray-400">{stats.totalVisits} визитов</div></div>
            </Link>
        </div>

        <div className="mt-4"><h2 className="text-lg font-bold mb-3 flex gap-2 items-center"><Trophy className="text-yellow-500"/> Лидеры месяца</h2><LeaderboardWidget /></div>
      </div>
    </Layout>
  );
};
export default Dashboard;