import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { CalendarDays, ChevronRight, ClipboardList, GraduationCap, ListChecks, Shield } from 'lucide-react';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

interface UserProfile {
  id: number;
  fullName: string;
  telegramId: string;
  role: 'ADMIN' | 'AMBASSADOR';
  createdAt: string;
}

interface OrderStats {
  shippedSum: number;
  pendingCount: number;
  rejectedSum: number;
}

interface VisitEntry {
  id: number;
  user?: { telegramId: string } | null;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [visitCount, setVisitCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      const results = await Promise.allSettled([
        apiClient.get<UserProfile>('/api/users/me'),
        apiClient.get<OrderStats>('/api/orders/my-stats'),
        apiClient.get<VisitEntry[]>('/api/visits'),
      ]);

      if (!isMounted) return;

      const [userRes, statsRes, visitsRes] = results;
      if (userRes.status === 'fulfilled') {
        setUser(userRes.value.data);
      }
      if (statsRes.status === 'fulfilled') {
        setOrderStats(statsRes.value.data);
      }
      if (visitsRes.status === 'fulfilled') {
        const visits = visitsRes.value.data || [];
        const telegramId = userRes.status === 'fulfilled' ? userRes.value.data.telegramId : null;
        const count = telegramId
          ? visits.filter((visit) => visit.user?.telegramId === telegramId).length
          : visits.length;
        setVisitCount(count);
      }

      if (results.some((r) => r.status === 'rejected')) {
        toast.error('Не удалось загрузить профиль');
      }

      setLoading(false);
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const greeting = useMemo(() => {
    if (!user?.fullName) return 'Профиль';
    return user.fullName;
  }, [user]);

  return (
    <div className="pb-24 space-y-6">
      <PageHeader title={greeting} subtitle={user ? user.role === 'ADMIN' ? 'Администратор' : 'Амбассадор' : 'Профиль'} />

      {loading ? (
        <ProfileSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Визиты" value={visitCount} />
            <StatCard label="Ожидают" value={orderStats?.pendingCount ?? 0} />
            <StatCard label="Отгрузки" value={`${orderStats?.shippedSum ?? 0} ₽`} />
          </div>

          <div className="space-y-3">
            <SettingsRow
              title="История визитов"
              subtitle="Все отчеты"
              icon={<ListChecks size={18} strokeWidth={1.5} />}
              onClick={() => navigate('/visits-history')}
            />
            <SettingsRow
              title="Мои заказы"
              subtitle="История заявок"
              icon={<ClipboardList size={18} strokeWidth={1.5} />}
              onClick={() => navigate('/my-orders')}
            />
            <SettingsRow
              title="Календарь команды"
              subtitle="Дни рождения и события"
              icon={<CalendarDays size={18} strokeWidth={1.5} />}
              onClick={() => navigate('/calendar')}
            />
            <SettingsRow
              title="Обучение"
              subtitle="Материалы и инструкции"
              icon={<GraduationCap size={18} strokeWidth={1.5} />}
              onClick={() => navigate('/education')}
            />
            {user?.role === 'ADMIN' && (
              <SettingsRow
                title="Админ-панель"
                subtitle="Управление системой"
                icon={<Shield size={18} strokeWidth={1.5} />}
                onClick={() => navigate('/admin')}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.10)] p-4 text-center">
    <div className="text-[11px] text-black/50 font-semibold uppercase tracking-[0.22em]">{label}</div>
    <div className="mt-2 text-[18px] font-semibold text-black">{value}</div>
  </div>
);

const SettingsRow: React.FC<{
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  onClick: () => void;
}> = ({ title, subtitle, icon, onClick }) => (
  <button
    onClick={onClick}
    className="w-full bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.10)] rounded-3xl p-4 flex items-center gap-4 text-left active:scale-[0.99] transition-transform"
  >
    <div className="w-10 h-10 rounded-2xl bg-black/5 border border-white/40 flex items-center justify-center text-black/60">
      {icon}
    </div>
    <div className="flex-1">
      <div className="text-[15px] font-semibold text-black">{title}</div>
      <div className="text-[12px] text-black/50 mt-1">{subtitle}</div>
    </div>
    <ChevronRight size={18} strokeWidth={2} className="text-black/30" />
  </button>
);

const ProfileSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="h-20 rounded-3xl bg-white/60 border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.06)]" />
      ))}
    </div>
    {[1, 2, 3].map((item) => (
      <div key={item} className="h-20 rounded-3xl bg-white/60 border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.06)]" />
    ))}
  </div>
);

export default ProfilePage;
