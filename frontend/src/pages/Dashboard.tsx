import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import apiClient from '../api/apiClient';
import { Link } from 'react-router-dom';
import { Briefcase, ShoppingCart, MapPin, CheckCircle, Package, ArrowUpRight, Play } from 'lucide-react';
import { motion } from 'framer-motion';

// Интерфейсы для статистики
interface DashboardStats {
  totalFacilities: number;
  totalVisits: number;
  totalProducts: number;
}

interface Target {
  name: string;
  address: string;
  lat?: number;
  lng?: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTarget] = useState<Target | null>(null);

  // --- Загрузка базовой статистики (Сохранена рабочая логика) ---
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [facRes, prodRes, visitRes] = await Promise.all([
          apiClient.get('/api/facilities'),
          apiClient.get('/api/products'),
          apiClient.get('/api/visits'),
        ]);

        setStats({
          totalFacilities: facRes.data.length,
          totalProducts: prodRes.data.length,
          totalVisits: visitRes.data.length,
        });

      } catch (err) {
        console.error("Dashboard data load error:", err);
        setError("Не удалось загрузить ключевые данные.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <Layout><div className="p-4 text-center mt-8 text-indigo-600">Загрузка Панели...</div></Layout>;
  }

  if (error) {
    return <Layout><div className="p-4 text-red-500 font-semibold">{error}</div></Layout>;
  }

  return (
    <Layout>
      <div className="p-4 pb-32 space-y-6 pt-[calc(env(safe-area-inset-top)+32px)]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-[#1C1C1E] leading-tight">
              Добрый день,<br />Виктор 👋
            </h1>
          </div>
          <img
            src="https://ui-avatars.com/api/?name=Victor&background=0D8ABC&color=fff"
            alt="Avatar"
            className="w-12 h-12 rounded-full bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 object-cover"
          />
        </div>

        {/* Current Target */}
        <motion.div
          whileHover={{ scale: currentTarget ? 1.01 : 1 }}
          className="relative bg-white rounded-[35px] h-[200px] overflow-hidden shadow-soft col-span-2"
        >
          {currentTarget ? (
            <>
              <img
                src="https://a.tile.openstreetmap.org/15/19304/10899.png"
                alt="map preview"
                className="absolute inset-0 w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-white/80" />
              <div className="relative h-full w-full p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-[#8E8E93]">Текущая цель</p>
                  <ArrowUpRight size={18} className="text-indigo-500" />
                </div>
                <div>
                  <p className="text-xl font-bold text-[#1C1C1E]">{currentTarget.name}</p>
                  <p className="text-sm text-[#8E8E93]">{currentTarget.address}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="relative h-full w-full p-6 flex flex-col justify-center items-start bg-gradient-to-br from-gray-50 to-white">
              <p className="text-xs uppercase tracking-wide text-[#8E8E93] mb-2">Текущая цель</p>
              <p className="text-lg font-semibold text-[#1C1C1E]">Цель не выбрана</p>
              <p className="text-sm text-[#8E8E93] mt-1">Выберите точку на карте, чтобы запланировать визит.</p>
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-white to-[#F2F3F7] h-[160px] p-6 rounded-[35px] shadow-soft flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package size={20} className="text-indigo-500" />
                <p className="text-sm text-[#8E8E93]">Заработано</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-[#1C1C1E]">0 ₽</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-white to-[#F2F3F7] h-[160px] p-6 rounded-[35px] shadow-soft flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-green-500" />
                <p className="text-sm text-[#8E8E93]">Визиты сегодня</p>
              </div>
              <span className="text-xs text-[#1C1C1E] font-semibold">12/15</span>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-2xl font-bold text-[#1C1C1E]">12 / 15</p>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-3">
                <div className="h-full bg-purple-600" style={{ width: '80%' }} />
              </div>
            </div>
          </motion.div>

          <Link to="/facilities">
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-gradient-to-br from-white to-[#F2F3F7] p-5 rounded-3xl shadow-soft col-span-2 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Briefcase size={20} className="text-indigo-500" />
                  <p className="text-sm text-[#8E8E93]">Заведений в базе</p>
                </div>
                <ArrowUpRight size={16} className="text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-[#1C1C1E]">{stats?.totalFacilities ?? 0}</p>
              <p className="text-xs text-[#8E8E93] mt-1">Каталог SKU: {stats?.totalProducts ?? 0}</p>
            </motion.div>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="space-y-3">
          <motion.div whileTap={{ scale: 0.98 }}>
            <Link
              to="/map"
              className="flex items-center justify-between bg-gradient-to-br from-white to-[#F2F3F7] p-4 rounded-2xl shadow-soft text-indigo-700 font-medium"
            >
              <div className="flex items-center">
                <MapPin size={24} className="mr-4 text-indigo-500" />
                <span>Открыть Карту Заведений</span>
              </div>
              <span className="text-lg">&gt;</span>
            </Link>
          </motion.div>

          <motion.div whileTap={{ scale: 0.98 }}>
            <Link
              to="/orders"
              className="flex items-center justify-between bg-gradient-to-br from-white to-[#F2F3F7] p-4 rounded-2xl shadow-soft text-indigo-700 font-medium"
            >
              <div className="flex items-center">
                <ShoppingCart size={24} className="mr-4 text-indigo-500" />
                <span>Создать Новый Заказ</span>
              </div>
              <span className="text-lg">&gt;</span>
            </Link>
          </motion.div>
        </div>

        {/* Start Visit CTA */}
        <Link to="/map" className="block">
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="w-full h-[72px] bg-[#1C1C1E] rounded-full text-white text-lg font-semibold flex items-center justify-between px-8 mt-8 shadow-lg active:scale-95 transition-transform"
          >
            <span>Начать визит</span>
            <Play size={22} />
          </motion.button>
        </Link>
      </div>
    </Layout>
  );
};

export default Dashboard;
