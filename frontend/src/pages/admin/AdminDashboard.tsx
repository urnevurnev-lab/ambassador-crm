import React, { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { PageHeader } from '../../components/PageHeader';
import apiClient from '../../api/apiClient';
import WebApp from '@twa-dev/sdk';
import { Link } from 'react-router-dom';
import { Users, ShoppingBag, MapPin, RefreshCw } from 'lucide-react';

const api = apiClient;

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({ users: 0, orders: 0, facilities: 0 });
  const [loadingStats, setLoadingStats] = useState(false);
  const [geocodeLoading, setGeocodeLoading] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      setLoadingStats(true);
      try {
        const [usersRes, ordersRes, facilitiesRes] = await Promise.all([
          api.get('/users'),
          api.get('/orders'),
          api.get('/facilities'),
        ]);
        setStats({
          users: usersRes.data?.length || 0,
          orders: ordersRes.data?.length || 0,
          facilities: facilitiesRes.data?.length || 0,
        });
      } catch (e) {
        WebApp.showAlert('Не удалось загрузить статистику');
      } finally {
        setLoadingStats(false);
      }
    };
    loadStats();
  }, []);

  const handleGeocode = async () => {
    setGeocodeLoading(true);
    try {
      await fetch('/api/admin/geocode', { method: 'POST' });
      WebApp.showAlert('Геокодинг завершен');
    } catch (e) {
      WebApp.showAlert('Ошибка геокодинга');
    } finally {
      setGeocodeLoading(false);
    }
  };

  const navItems = [
    { label: 'Пользователи', icon: Users, to: '/admin' },
    { label: 'Заказы', icon: ShoppingBag, to: '/orders' },
    { label: 'Заведения', icon: MapPin, to: '/facilities' },
  ];

  return (
    <Layout>
      <PageHeader title="Админ-панель" />

      <div className="bg-[#F8F9FA] min-h-screen pt-[calc(env(safe-area-inset-top)+60px)] px-4 pb-24">
        {/* Статистика */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Амбассадоров', value: stats.users },
            { label: 'Активных заказов', value: stats.orders },
            { label: 'Заведений', value: stats.facilities },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-start"
            >
              <span className="text-[11px] uppercase text-gray-400 font-bold mb-2">{card.label}</span>
              <span className="text-2xl font-bold text-[#1C1C1E]">
                {loadingStats ? '—' : card.value}
              </span>
            </div>
          ))}
        </div>

        {/* Навигация */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-[#1C1C1E] mb-3">Разделы</h2>
          <div className="grid grid-cols-3 gap-3">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className="bg-gray-50 hover:bg-gray-100 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition"
              >
                <item.icon size={24} className="text-[#1C1C1E] mb-2" />
                <span className="text-sm font-semibold text-[#1C1C1E]">{item.label}</span>
                {item.to === '/admin' && (
                  <span className="text-[10px] text-gray-400 mt-1">Скоро</span>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Сервисная кнопка */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-base font-semibold text-[#1C1C1E] mb-2">Обслуживание</h3>
          <p className="text-sm text-gray-500 mb-4">Запустить обновление геопозиций заведений.</p>
          <button
            onClick={handleGeocode}
            disabled={geocodeLoading}
            className="w-full flex items-center justify-center gap-2 bg-[#007AFF] text-white py-3 rounded-xl font-semibold shadow-lg shadow-blue-500/20 active:scale-[0.98] transition disabled:opacity-60"
          >
            <RefreshCw size={18} />
            {geocodeLoading ? 'Геокодинг...' : 'Обновить геопозицию'}
          </button>
        </div>
      </div>
    </Layout>
  );
};
