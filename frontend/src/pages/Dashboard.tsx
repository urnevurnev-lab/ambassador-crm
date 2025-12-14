import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import apiClient from '../api/apiClient';
import { Briefcase, ShoppingCart, MapPin, CheckCircle, Package, ArrowUpRight, Play, Megaphone, Loader2, Navigation } from 'lucide-react';
import { motion } from 'framer-motion';
import WebApp from '@twa-dev/sdk';

// Интерфейсы для статистики
interface DashboardStats {
  totalFacilities: number;
  totalVisits: number;
  totalProducts: number;
}

interface Target {
  id: number;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
}

interface Post {
  id: number;
  title: string;
  content: string;
  imageUrl?: string;
  importance: number;
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<Target[]>([]);
  const [nearest, setNearest] = useState<{ facility: Target; distance: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [visitsToday, setVisitsToday] = useState(0);
  const DAILY_TARGET = 15;
  const NEARBY_RADIUS = 150; // meters

  const telegramUser = useMemo(() => WebApp.initDataUnsafe?.user, []);
  const displayName = telegramUser
    ? [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ') || telegramUser.username || 'Амбассадор'
    : 'Амбассадор';
  const avatarUrl = telegramUser?.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=0D8ABC&color=fff`;

  // --- Загрузка базовой статистики (Сохранена рабочая логика) ---
  useEffect(() => {
    const fetchStats = async () => {
      setPostsLoading(true);
      try {
        const [facRes, prodRes, visitRes, postsRes] = await Promise.all([
          apiClient.get('/api/facilities'),
          apiClient.get('/api/products'),
          apiClient.get('/api/visits'),
          apiClient.get<Post[]>('/api/posts'),
        ]);

        const visits = visitRes.data || [];
        const todayCount = visits.filter((v: any) => {
          const d = new Date(v.date || v.createdAt);
          const now = new Date();
          return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;

        setStats({
          totalFacilities: facRes.data.length,
          totalProducts: prodRes.data.length,
          totalVisits: visits.length,
        });
        setFacilities(facRes.data || []);
        setPosts(postsRes.data || []);
        setVisitsToday(todayCount);

      } catch (err) {
        console.error("Dashboard data load error:", err);
        setError("Не удалось загрузить ключевые данные.");
      } finally {
        setLoading(false);
        setPostsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Геолокация недоступна на устройстве');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationError(null);
      },
      () => setLocationError('Включите GPS, чтобы показать ближайшее заведение'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  useEffect(() => {
    requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleVisitCreated = async () => {
      try {
        const res = await apiClient.get('/api/visits');
        const visits = res.data || [];
        const todayCount = visits.filter((v: any) => {
          const d = new Date(v.date || v.createdAt);
          const now = new Date();
          return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }).length;
        setVisitsToday(todayCount);
        setStats((prev) => prev ? { ...prev, totalVisits: visits.length } : prev);
      } catch (e) {
        console.error('Failed to refresh visits', e);
      }
    };
    window.addEventListener('visit:created', handleVisitCreated as EventListener);
    return () => window.removeEventListener('visit:created', handleVisitCreated as EventListener);
  }, []);

  useEffect(() => {
    if (!userLocation || facilities.length === 0) {
      setNearest(null);
      return;
    }
    const validFacilities = facilities.filter(f => f.lat && f.lng);
    if (validFacilities.length === 0) {
      setNearest(null);
      return;
    }

    let best = validFacilities[0];
    let bestDist = getDistance(userLocation.lat, userLocation.lng, best.lat!, best.lng!);
    for (const fac of validFacilities.slice(1)) {
      const d = getDistance(userLocation.lat, userLocation.lng, fac.lat!, fac.lng!);
      if (d < bestDist) {
        best = fac;
        bestDist = d;
      }
    }
    setNearest({ facility: best, distance: bestDist });
  }, [userLocation, facilities]);

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
              Добрый день,<br />{displayName} 👋
            </h1>
          </div>
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-12 h-12 rounded-full bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100 object-cover"
          />
        </div>

        {/* Current Target */}
        <motion.div
          whileHover={{ scale: nearest ? 1.01 : 1 }}
          className="relative bg-white rounded-[35px] h-[200px] overflow-hidden shadow-soft col-span-2"
        >
          {nearest ? (
            <div className="relative h-full w-full p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-[#8E8E93]">Ближайшая точка</p>
                <ArrowUpRight size={18} className="text-indigo-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-[#1C1C1E]">{nearest.facility.name}</p>
                <p className="text-sm text-[#8E8E93]">{nearest.facility.address}</p>
                <div className="flex items-center gap-2 mt-3 text-sm text-[#1C1C1E] font-semibold">
                  <Navigation size={16} className="text-indigo-500" />
                  {nearest.distance.toFixed(0)} м
                </div>
              </div>
            </div>
          ) : (
            <div className="relative h-full w-full p-6 flex flex-col justify-center items-start bg-white">
              <p className="text-xs uppercase tracking-wide text-[#8E8E93] mb-2">Текущая цель</p>
              <p className="text-lg font-semibold text-[#1C1C1E]">Не удалось определить локацию</p>
              <p className="text-sm text-[#8E8E93] mt-1 mb-4">
                {locationError || 'Включите GPS, чтобы показать ближайшее заведение'}
              </p>
              <button
                onClick={requestLocation}
                className="w-full bg-[#4F46E5] text-white text-base font-semibold px-4 py-3 rounded-2xl shadow-md active:scale-98 transition"
              >
                Включить GPS
              </button>
            </div>
          )}
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white h-[160px] p-6 rounded-[35px] shadow-soft flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package size={20} className="text-indigo-500" />
                <p className="text-sm text-[#8E8E93]">План на смену</p>
              </div>
              <span className="text-xs text-[#1C1C1E] font-semibold">{visitsToday}/{DAILY_TARGET}</span>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-2xl font-bold text-[#1C1C1E]">Визитов: {visitsToday}</p>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, Math.round((visitsToday / DAILY_TARGET) * 100))}%` }} />
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white h-[160px] p-6 rounded-[35px] shadow-soft flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle size={20} className="text-green-500" />
                <p className="text-sm text-[#8E8E93]">Визиты сегодня</p>
              </div>
              <span className="text-xs text-[#1C1C1E] font-semibold">{visitsToday}/{DAILY_TARGET}</span>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-2xl font-bold text-[#1C1C1E]">{visitsToday} / {DAILY_TARGET}</p>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mt-3">
                <div className="h-full bg-purple-600" style={{ width: `${Math.min(100, Math.round((visitsToday / DAILY_TARGET) * 100))}%` }} />
              </div>
            </div>
          </motion.div>

          <Link to="/facilities">
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="bg-white p-5 rounded-3xl shadow-soft col-span-2 cursor-pointer"
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
              className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-soft text-indigo-700 font-medium"
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
              className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-soft text-indigo-700 font-medium"
            >
              <div className="flex items-center">
                <ShoppingCart size={24} className="mr-4 text-indigo-500" />
                <span>Создать Новый Заказ</span>
              </div>
              <span className="text-lg">&gt;</span>
            </Link>
          </motion.div>
        </div>

        {/* News */}
        <div className="bg-white rounded-3xl p-5 shadow-soft border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Megaphone size={18} className="text-orange-500" />
              <h3 className="font-bold text-lg text-[#1C1C1E]">Новости</h3>
            </div>
            {postsLoading && <Loader2 size={18} className="animate-spin text-gray-400" />}
          </div>
          {posts.length === 0 && !postsLoading ? (
            <div className="text-sm text-gray-500">Нет свежих новостей</div>
          ) : (
            <div className="space-y-3">
              {posts.slice(0, 3).map((post) => (
                <div key={post.id} className="p-4 rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-[#F8F9F8] shadow-sm">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>{new Date(post.createdAt).toLocaleDateString('ru-RU')}</span>
                    {post.importance > 0 && <span className="text-[10px] font-bold text-red-500 uppercase">Важно</span>}
                  </div>
                  <div className="font-semibold text-[#1C1C1E]">{post.title}</div>
                  <div className="text-sm text-gray-600 mt-1 overflow-hidden text-ellipsis whitespace-normal">
                    {post.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Start Visit CTA */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            if (nearest && nearest.distance < NEARBY_RADIUS) {
              navigate(`/visit?facilityId=${nearest.facility.id}&smart=1`);
            } else {
              navigate('/map');
            }
          }}
          className="w-full h-[72px] bg-[#1C1C1E] rounded-full text-white text-lg font-semibold flex items-center justify-between px-8 mt-8 shadow-lg active:scale-95 transition-transform"
        >
          <span>
            {nearest && nearest.distance < NEARBY_RADIUS
              ? `Визит в ${nearest.facility.name}`
              : 'Начать визит'}
          </span>
          <Play size={22} />
        </motion.button>
      </div>
    </Layout>
  );
};

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000; // meters
  const toRad = (deg: number) => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default Dashboard;
