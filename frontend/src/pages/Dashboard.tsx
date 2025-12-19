import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StandardCard } from '../components/ui/StandardCard';
import { motion, AnimatePresence } from 'framer-motion';
import WebApp from '@twa-dev/sdk';
import apiClient from '../api/apiClient';

interface Facility {
  id: number;
  name: string;
  address: string;
  city: string | null;
  isVerified: boolean;
  daysSinceLastVisit: number | null;
  score: number;
}

interface Order {
  id: number;
  status: string;
  facility: { name: string };
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = WebApp.initDataUnsafe?.user;

  const [forgottenVenues, setForgottenVenues] = useState<Facility[]>([]);
  const [unverifiedVenues, setUnverifiedVenues] = useState<Facility[]>([]);
  const [rejectedOrders, setRejectedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [facRes, orderRes] = await Promise.all([
        apiClient.get('/api/facilities'),
        apiClient.get('/api/orders/my-history')
      ]);

      const allFacs = facRes.data as Facility[];

      // Filter forgotten: 7+ days or never visited, AND verified
      const forgotten = allFacs
        .filter(f => f.isVerified && (f.daysSinceLastVisit === null || f.daysSinceLastVisit >= 7))
        .slice(0, 3);

      setForgottenVenues(forgotten);

      // Filter unverified
      const unverified = allFacs
        .filter(f => !f.isVerified)
        .slice(0, 2);

      setUnverifiedVenues(unverified);

      // Filter rejected orders
      const rejected = (orderRes.data as Order[])
        .filter(o => o.status === 'REJECTED')
        .slice(0, 2);

      setRejectedOrders(rejected);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerify = async (id: number, verified: boolean) => {
    try {
      if (verified) {
        await apiClient.patch(`/api/facilities/${id}`, { isVerified: true });
        WebApp.HapticFeedback.notificationOccurred('success');
      } else {
        // Maybe hide it or reassign? For now just mark as verified to remove from list
        // In a real scenario, this might delete or flag for admin
        await apiClient.patch(`/api/facilities/${id}`, { isVerified: true });
      }
      fetchData(); // Refresh
    } catch (error) {
      console.error("Error verifying venue:", error);
      WebApp.HapticFeedback.notificationOccurred('error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F8F9FB]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="safe-p-top pt-24 pb-32 space-y-8 px-4 bg-[#F8F9FB] min-h-screen">
      {/* Header Area */}
      <div className="flex justify-between items-center py-2">
        <div>
          <h1 className="text-[34px] font-[900] text-[#000000] tracking-tight leading-none">
            Главная
          </h1>
          <p className="text-[14px] text-[#8E8E93] font-bold mt-2 uppercase tracking-tight opacity-70">
            {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        <motion.div
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate('/profile')}
          className="w-14 h-14 bg-white rounded-2xl border border-[#C6C6C8]/10 overflow-hidden shadow-[0_8px_20px_rgba(0,0,0,0.05)] flex items-center justify-center text-2xl"
        >
          {user?.photo_url ? (
            <img src={user.photo_url} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            "👤"
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {/* Priority Section */}
        {(forgottenVenues.length > 0 || rejectedOrders.length > 0 || unverifiedVenues.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[18px] font-black text-[#000000]">Приоритетные задачи</h2>
              <span className="text-[12px] bg-red-500 text-white px-2 py-0.5 rounded-full font-black">
                {forgottenVenues.length + rejectedOrders.length + unverifiedVenues.length}
              </span>
            </div>

            {/* Address Verification Alerts */}
            {unverifiedVenues.map(venue => (
              <motion.div
                key={`verify-${venue.id}`}
                className="bg-white p-5 rounded-[24px] border border-blue-100 shadow-[0_10px_30px_rgba(0,122,255,0.05)] space-y-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl">❓</div>
                  <div className="flex-1">
                    <h3 className="text-[15px] font-bold text-[#000000]">Твоё заведение?</h3>
                    <p className="text-[13px] text-[#8E8E93] font-medium leading-tight mt-0.5">
                      {venue.name}<br />
                      <span className="text-[11px] opacity-70">{venue.city || 'Адрес'}: {venue.address}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleVerify(venue.id, true)}
                    className="flex-1 py-3 bg-blue-500 text-white rounded-xl text-[13px] font-black shadow-lg shadow-blue-500/20"
                  >
                    Да, моё
                  </button>
                  <button
                    onClick={() => handleVerify(venue.id, false)}
                    className="flex-1 py-3 bg-[#F2F2F7] text-[#8E8E93] rounded-xl text-[13px] font-bold"
                  >
                    Нет
                  </button>
                </div>
              </motion.div>
            ))}

            {/* Rejected Orders Alerts */}
            {rejectedOrders.map(order => (
              <motion.div
                key={`order-${order.id}`}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/my-orders`)}
                className="bg-white p-5 rounded-[24px] border border-red-100 shadow-[0_10px_30px_rgba(239,68,68,0.08)] flex items-center gap-4 relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500" />
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-2xl">🚨</div>
                <div className="flex-1">
                  <h3 className="text-[15px] font-bold text-[#000000]">Отказ по заказу #{order.id}</h3>
                  <p className="text-[13px] text-[#8E8E93] font-medium">{order.facility.name} — нужно уточнить причину</p>
                </div>
                <div className="text-[#8E8E93]">→</div>
              </motion.div>
            ))}

            {/* Forgotten Venues */}
            {forgottenVenues.map(venue => (
              <motion.div
                key={`venue-${venue.id}`}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/facility/${venue.id}`)}
                className="bg-white p-5 rounded-[24px] border border-[#C6C6C8]/10 shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl">⏳</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-bold text-[#000000]">{venue.name}</h3>
                    {venue.daysSinceLastVisit === null && (
                      <span className="text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-black uppercase">New</span>
                    )}
                  </div>
                  <p className="text-[13px] text-[#8E8E93] font-medium">
                    {venue.daysSinceLastVisit !== null
                      ? `Не были ${venue.daysSinceLastVisit} дн.`
                      : 'Заведение без визитов'}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-[11px] font-bold text-blue-600">Начать</div>
                  <div className="text-[#8E8E93]">→</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Modules Grid */}
      <div className="space-y-4">
        <h2 className="text-[18px] font-black text-[#000000] px-1">Меню</h2>
        <div className="grid grid-cols-2 gap-5">

          {/* VISITS / WORK */}
          <div className="col-span-2">
            <StandardCard
              title="Работа"
              subtitle="Список заведений и карта"
              color="blue"
              onClick={() => navigate('/work')}
              className="min-h-[160px]"
              illustration={
                <img src="/3d-icons/visits.png" className="w-[130px] h-[130px] object-contain -mr-4 -mb-4 opacity-90" alt="Work" />
              }
            />
          </div>

          {/* KPI / HISTORY */}
          <div className="col-span-2">
            <StandardCard
              title="Моя активность (KPI)"
              subtitle="История визитов и отчеты"
              color="purple"
              onClick={() => navigate('/visits-history')}
              className="min-h-[140px]"
              illustration={
                <img src="/3d-icons/kpi.png" className="w-[110px] h-[110px] object-contain -mr-2 -mb-2 opacity-90" alt="KPI" />
              }
            />
          </div>

          {/* ORDERS / APPLICATIONS */}
          <div className="h-[180px]">
            <StandardCard
              title="Заявки"
              subtitle="История заказов"
              color="coral"
              onClick={() => navigate('/my-orders')}
              className="h-full"
              illustration={
                <img src="/3d-icons/orders.png" className="w-[90px] h-[90px] object-contain -mr-2 -mb-2 opacity-90" alt="Orders" />
              }
            />
          </div>

          {/* TEAM CALENDAR */}
          <div className="h-[180px]">
            <StandardCard
              title="Команда"
              subtitle="Дни рождения"
              color="white"
              onClick={() => navigate('/calendar')}
              className="h-full"
              illustration={
                <img src="/3d-icons/admin.png" className="w-[90px] h-[90px] object-contain -mr-1 -mb-1 opacity-90" alt="Calendar" />
              }
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;