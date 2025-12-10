import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { Users, ShoppingBag, MapPin, Activity } from 'lucide-react';
import apiClient from '../../api/apiClient';
import WebApp from '@twa-dev/sdk';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    orders: 0,
    facilities: 0,
    visits: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await apiClient.get('/api/admin/stats');
      setStats(res.data);
    } catch (e) {
      console.error('Failed to load stats', e);
      WebApp.showAlert('Не удалось загрузить статистику');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const runGeocoding = async () => {
    WebApp.showAlert('Запуск геокодинга... Это займет время.');
    try {
      await apiClient.post('/api/admin/geocode');
      WebApp.showAlert('Пакет обработан. Обновите страницу через минуту.');
      fetchStats();
    } catch (e) {
      WebApp.showAlert('Ошибка запуска.');
    }
  };

  const runCleanDb = async () => {
    const confirmed = window.confirm('Удалить мусорные записи?');
    if (!confirmed) return;
    WebApp.showAlert('Запускаем очистку базы...');
    try {
      await apiClient.post('/api/admin/clean-db');
      WebApp.showAlert('Очистка завершена');
      fetchStats();
    } catch (e) {
      WebApp.showAlert('Ошибка очистки');
    }
  };

  return (
    <Layout>
      <PageHeader title="Админ-панель" />
      <div className="pt-[calc(env(safe-area-inset-top)+60px)] px-4 pb-32 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="Амбассадоры"
            value={loading ? '...' : stats.users}
            icon={<Users className="text-blue-500" />}
          />
          <StatCard
            title="Активные Заказы"
            value={loading ? '...' : stats.orders}
            icon={<ShoppingBag className="text-orange-500" />}
          />
          <StatCard
            title="Заведения (Всего)"
            value={loading ? '...' : stats.facilities}
            icon={<MapPin className="text-purple-500" />}
          />
          <StatCard
            title="Визиты"
            value={loading ? '...' : stats.visits}
            icon={<Activity className="text-green-500" />}
          />
        </div>

        <h3 className="font-bold text-lg mt-4">Управление базой</h3>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm">Геокодинг базы</div>
              <div className="text-xs text-gray-400">Найти координаты для новых точек</div>
            </div>
            <button
              onClick={runGeocoding}
              className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition"
            >
              Запустить
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div>
              <div className="font-semibold text-sm">🗑 Очистить мусор</div>
              <div className="text-xs text-gray-400">Удалить активности, дубликаты и пустые адреса</div>
            </div>
            <button
              onClick={runCleanDb}
              className="bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition"
            >
              Очистить
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};
