import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import apiClient from '../api/apiClient';
import { ArrowUpRight, CalendarDays, Route, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

interface FacilitySummary {
  id: number;
  name: string;
  address: string;
  isVerified: boolean;
  daysSinceLastVisit: number | null;
  score: number;
}

interface OrderStats {
  shippedSum: number;
  pendingCount: number;
  rejectedSum: number;
}

interface OrderSummary {
  id: number;
  status: string;
  createdAt: string;
  facility?: { name: string } | null;
}

const orderStatusLabel = (status?: string) => {
  switch (status) {
    case 'APPROVED':
      return 'Одобрен';
    case 'SHIPPED':
      return 'Отгружен';
    case 'REJECTED':
      return 'Отклонен';
    case 'PENDING':
    default:
      return 'Ожидает';
  }
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Амбассадор');
  const [facilities, setFacilities] = useState<FacilitySummary[]>([]);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [recentOrder, setRecentOrder] = useState<OrderSummary | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      const results = await Promise.allSettled([
        apiClient.get('/api/users/me'),
        apiClient.get<FacilitySummary[]>('/api/facilities'),
        apiClient.get<OrderStats>('/api/orders/my-stats'),
        apiClient.get<OrderSummary[]>('/api/orders/my-history'),
      ]);

      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length) {
        toast.error('Не удалось загрузить часть данных');
      }

      if (!isMounted) return;

      const [userRes, facilitiesRes, statsRes, historyRes] = results;
      if (userRes.status === 'fulfilled') {
        const fullName = userRes.value.data?.fullName || '';
        if (fullName) setUserName(fullName.split(' ')[0]);
      }
      if (facilitiesRes.status === 'fulfilled') {
        setFacilities(facilitiesRes.value.data || []);
      }
      if (statsRes.status === 'fulfilled') {
        setOrderStats(statsRes.value.data);
      }
      if (historyRes.status === 'fulfilled') {
        setRecentOrder(historyRes.value.data?.[0] ?? null);
      }

      setLoading(false);
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const todayLabel = useMemo(() => {
    return new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
  }, []);

  const mustVisit = useMemo(() => {
    return facilities.find((f) => f.daysSinceLastVisit === null || f.daysSinceLastVisit >= 7);
  }, [facilities]);

  const coverage = useMemo(() => {
    if (!facilities.length) return 0;
    const total = facilities.reduce((sum, f) => sum + (f.score || 0), 0);
    return Math.round(total / facilities.length);
  }, [facilities]);

  const hasActiveRoute = Boolean(mustVisit);

  return (
    <div className="pb-24 space-y-6">
      <PageHeader title={`Привет, ${userName}`} subtitle={`Сегодня ${todayLabel}`} />

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 rounded-3xl bg-black/75 backdrop-blur-xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.25)] p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/60">Маршрут</p>
                <h3 className="text-lg font-semibold text-white mt-2">
                  {hasActiveRoute ? 'Активен' : 'Завершен'}
                </h3>
                <p className="text-sm text-white/60 mt-1">
                  {hasActiveRoute ? mustVisit?.name : 'На сегодня задач нет'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white/80">
                <Route size={18} strokeWidth={1.5} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.10)] p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/50">KPI</p>
              <div className="w-9 h-9 rounded-2xl bg-black/5 border border-white/40 flex items-center justify-center text-black/60">
                <ArrowUpRight size={16} strokeWidth={1.5} />
              </div>
            </div>
            <div className="mt-4 text-3xl font-semibold text-black">{coverage}%</div>
            <p className="text-xs text-black/50 mt-1">Средняя заполненность</p>
          </div>

          <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.10)] p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/50">Заказы</p>
              <div className="w-9 h-9 rounded-2xl bg-black/5 border border-white/40 flex items-center justify-center text-black/60">
                <ShoppingBag size={16} strokeWidth={1.5} />
              </div>
            </div>
            <div className="mt-4 text-lg font-semibold text-black">
              {recentOrder ? `#${recentOrder.id}` : 'Нет заказов'}
            </div>
            <p className="text-xs text-black/50 mt-1">
              {recentOrder ? orderStatusLabel(recentOrder.status) : `В ожидании: ${orderStats?.pendingCount ?? 0}`}
            </p>
          </div>

          <button
            onClick={() => navigate('/calendar')}
            className="col-span-2 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.10)] p-5 text-left active:scale-[0.99] transition-transform"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/50">Команда</p>
                <h3 className="text-lg font-semibold text-black mt-2">Календарь и график</h3>
                <p className="text-sm text-black/50 mt-1">План смен и события</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-black/5 border border-white/40 flex items-center justify-center text-black/60">
                <CalendarDays size={18} strokeWidth={1.5} />
              </div>
            </div>
          </button>

          {facilities.length === 0 && (
            <div className="col-span-2 rounded-3xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.08)] p-5 text-center text-sm text-black/50">
              Пока нет точек в базе
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-40 rounded-2xl bg-white/60 border border-white/30" />
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 h-28 rounded-3xl bg-white/60 border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.06)]" />
        <div className="h-24 rounded-3xl bg-white/60 border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.06)]" />
        <div className="h-24 rounded-3xl bg-white/60 border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.06)]" />
        <div className="col-span-2 h-24 rounded-3xl bg-white/60 border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.06)]" />
      </div>
    </div>
  );
};

export default Dashboard;
