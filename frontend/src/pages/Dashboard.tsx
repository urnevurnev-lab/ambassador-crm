import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StandardCard } from '../components/ui/StandardCard';
import { PageHeader } from '../components/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Activity, ShoppingBag, Users, ArrowRight, AlertCircle } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import apiClient from '../api/apiClient';

// Типы данных
interface Facility { id: number; name: string; address: string; isVerified: boolean; daysSinceLastVisit: number | null; }
interface Order { id: number; status: string; facility: { name: string }; }

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = WebApp.initDataUnsafe?.user;

  const [alerts, setAlerts] = useState<{ type: 'verify' | 'rejected', data: any }[]>([]);
  const [loading, setLoading] = useState(true);

  // Загрузка данных
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [facRes, orderRes] = await Promise.all([
          apiClient.get('/api/facilities'),
          apiClient.get('/api/orders/my-history')
        ]);
        
        const facilities = facRes.data as Facility[];
        const orders = orderRes.data as Order[];

        // Собираем алерты
        const newAlerts: any[] = [];
        
        // 1. Неподтвержденные точки
        facilities.filter(f => !f.isVerified).slice(0, 2).forEach(f => {
          newAlerts.push({ type: 'verify', data: f });
        });

        // 2. Отклоненные заказы
        orders.filter(o => o.status === 'REJECTED').slice(0, 1).forEach(o => {
          newAlerts.push({ type: 'rejected', data: o });
        });

        setAlerts(newAlerts);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleVerify = async (id: number) => {
    try {
      await apiClient.patch(`/api/facilities/${id}`, { isVerified: true });
      setAlerts(prev => prev.filter(a => a.data.id !== id));
      WebApp.HapticFeedback.notificationOccurred('success');
    } catch (e) { console.error(e); }
  };

  return (
    <div className="pb-24">
      {/* Приветствие */}
      <PageHeader 
        title="Обзор" 
        subtitle={user ? `С возвращением, ${user.first_name}` : 'Твоя статистика'}
        rightAction={
          <div 
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-white shadow-soft flex items-center justify-center overflow-hidden border border-gray-100"
          >
            {user?.photo_url ? <img src={user.photo_url} className="w-full h-full" /> : <Users size={20} className="text-gray-400" />}
          </div>
        }
      />

      <div className="flex flex-col gap-4">
        
        {/* Алерты (Темные карточки) */}
        <AnimatePresence>
          {alerts.map((alert, idx) => (
            <motion.div
              key={`${alert.type}-${alert.data.id}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {alert.type === 'verify' ? (
                <StandardCard 
                  variant="dark"
                  title="Подтверждение"
                  subtitle="Это ваше заведение?"
                  className="bg-[#111]"
                >
                  <p className="text-white/70 text-sm mb-4">
                    {alert.data.name} <br/> 
                    <span className="opacity-50">{alert.data.address}</span>
                  </p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleVerify(alert.data.id)}
                      className="flex-1 bg-white text-black py-3 rounded-2xl font-bold text-sm active:scale-95 transition-transform"
                    >
                      Да, моё
                    </button>
                    <button className="px-6 py-3 rounded-2xl bg-white/10 text-white font-bold text-sm">Нет</button>
                  </div>
                </StandardCard>
              ) : (
                <StandardCard 
                  variant="dark" 
                  className="bg-red-500 text-white" // Можно переопределить цвет для критичных ошибок
                  title="Внимание"
                  subtitle={`Заказ #${alert.data.id} отменен`}
                  icon={AlertCircle}
                  onClick={() => navigate('/my-orders')}
                />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Bento Grid */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* Большая карточка "Работа" */}
          <div className="col-span-2">
            <StandardCard
              title="Маршрут"
              subtitle="Карта заведений"
              icon={MapPin}
              onClick={() => navigate('/work')}
              showArrow
              illustration={
                 // Иллюстрацию можно заменить на 3D иконку
                 <div className="w-24 h-24 bg-gradient-to-tr from-blue-400 to-blue-600 rounded-full blur-xl opacity-20" />
              }
            >
              <div className="text-sm text-gray-500 font-medium mt-1">
                Открыть список активных точек →
              </div>
            </StandardCard>
          </div>

          {/* KPI */}
          <StandardCard
            title="KPI"
            subtitle="Визиты"
            value="85%"
            icon={Activity}
            onClick={() => navigate('/visits-history')}
          />

          {/* Заказы */}
          <StandardCard
            title="Лог"
            subtitle="Заказы"
            value="12"
            icon={ShoppingBag}
            onClick={() => navigate('/my-orders')}
          />

          {/* Команда (Длинная карточка внизу) */}
          <div className="col-span-2">
            <StandardCard
              title="Команда"
              subtitle="Календарь событий"
              icon={Users}
              onClick={() => navigate('/calendar')}
              className="flex items-center justify-between"
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;