import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import apiClient from '../api/apiClient';
import { Store, Footprints, Wallet, ShoppingBag, AlertCircle, ChevronRight, Trophy } from 'lucide-react';
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

  if (loading) return <Layout><div className="flex justify-center items-center h-screen text-gray-400">Загрузка данных...</div></Layout>;

  return (
    <Layout>
      <div className="pt-4 px-5 pb-32 space-y-6">
        
        {/* 1. ШАПКА */}
        <div className="flex justify-between items-center mt-2">
          <div className="flex gap-4 items-center">
             <div className="w-14 h-14 bg-white rounded-full shadow-md flex items-center justify-center overflow-hidden border border-gray-100">
                <img src="/logo.png" className="w-full h-full object-cover mix-blend-multiply opacity-90" />
             </div>
             <div>
                <h1 className="text-2xl font-extrabold text-gray-900 leading-none">Привет,</h1>
                <p className="text-lg text-gray-500 font-medium">{telegramUser?.first_name || 'Амбассадор'}</p>
             </div>
          </div>
          
          {/* Аватарка справа */}
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-md">
              {telegramUser?.photo_url ? (
                  <img src={telegramUser.photo_url} className="w-full h-full object-cover" />
              ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400">User</div>
              )}
          </div>
        </div>

        {/* 2. ПЛАН НА СМЕНУ (ТЕМНАЯ КАРТОЧКА) */}
        <div className="bg-[#1C1C1E] text-white p-6 rounded-[32px] shadow-xl shadow-gray-200 relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-white/90">План визитов</h3>
                    <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">Сегодня</div>
                </div>
                
                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black tracking-tight">{visitsToday}</span>
                    <span className="text-xl text-white/40 font-medium">/ 5</span>
                </div>

                <div className="w-full bg-white/10 h-3 rounded-full mt-4 overflow-hidden">
                    <div 
                        style={{ width: `${Math.min((visitsToday/5)*100, 100)}%` }} 
                        className="bg-gradient-to-r from-green-400 to-emerald-500 h-full rounded-full transition-all duration-500" 
                    />
                </div>
            </div>
            
            {/* Декор на фоне */}
            <div className="absolute -right-4 -top-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl" />
            <div className="absolute -left-4 -bottom-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl" />
        </div>

        {/* 3. СЕТКА КАРТОЧЕК */}
        <div className="grid grid-cols-2 gap-4">
            
            {/* Продажи (Широкая) */}
            <Link to="/my-orders" className="col-span-2 bg-white p-5 rounded-[28px] shadow-sm border border-gray-100 flex items-center justify-between active:scale-[0.98] transition-transform">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="bg-green-100 text-green-600 p-1.5 rounded-lg"><Wallet size={16}/></div>
                        <span className="text-sm font-bold text-gray-400 uppercase tracking-wide">Продажи</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{formatMoney(orderStats.shippedSum)} ₽</div>
                    
                    {orderStats.pendingCount > 0 && (
                        <div className="mt-1 text-xs font-bold text-orange-500 flex items-center gap-1">
                            <ShoppingBag size={10} /> {orderStats.pendingCount} в обработке
                        </div>
                    )}
                </div>
                <div className="bg-gray-50 p-3 rounded-full text-gray-400">
                    <ChevronRight size={20} />
                </div>
            </Link>

            {/* Точки */}
            <Link to="/facilities" className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100 flex flex-col justify-between h-[150px] active:scale-[0.98] transition-transform">
                <div className="flex justify-between items-start">
                    <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
                        <Store size={20} />
                    </div>
                    <span className="text-xs font-bold text-gray-300">ALL</span>
                </div>
                <div>
                    <div className="text-3xl font-bold text-gray-900">{stats.totalFacilities}</div>
                    <div className="text-sm text-gray-400 font-medium">Точки в базе</div>
                </div>
            </Link>

            {/* История */}
            <Link to="/visits-history" className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100 flex flex-col justify-between h-[150px] active:scale-[0.98] transition-transform">
                <div className="flex justify-between items-start">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                        <Footprints size={20} />
                    </div>
                </div>
                <div>
                    <div className="text-3xl font-bold text-gray-900">{stats.totalVisits}</div>
                    <div className="text-sm text-gray-400 font-medium">Мои визиты</div>
                </div>
            </Link>
        </div>

        {/* 4. ЛИДЕРБОРД */}
        <div className="pt-2">
            <div className="flex items-center gap-2 mb-3 px-2">
                <Trophy className="text-yellow-500 fill-yellow-500" size={18} />
                <h2 className="text-lg font-bold text-gray-900">Топ Амбассадоров</h2>
            </div>
            <LeaderboardWidget />
        </div>

      </div>
    </Layout>
  );
};

export default Dashboard;