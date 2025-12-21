import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { CalendarDays, ChevronRight, ClipboardList, GraduationCap, IdCard, ListChecks, Package, Shield } from 'lucide-react';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';
import SampleOrderWizard from '../components/SampleOrderWizard';

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
  data?: any;
}

interface SampleOrderEntry {
  id: number;
  items?: Array<{ quantity: number }> | null;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [visitCount, setVisitCount] = useState(0);
  const [sampleUnits, setSampleUnits] = useState(0);
  const [sampleConsumedPortions, setSampleConsumedPortions] = useState(0);
  const [isSampleWizardOpen, setSampleWizardOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setLoading(true);
      const results = await Promise.allSettled([
        apiClient.get<UserProfile>('/api/users/me'),
        apiClient.get<OrderStats>('/api/orders/my-stats'),
        apiClient.get<VisitEntry[]>('/api/visits'),
        apiClient.get<SampleOrderEntry[]>('/api/samples/my'),
      ]);

      if (!isMounted) return;

      const [userRes, statsRes, visitsRes, samplesRes] = results;
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

        if (telegramId) {
	          const myVisits = visits.filter((visit) => visit.user?.telegramId === telegramId);
	          const portions = myVisits.reduce((sum, visit) => {
	            const usage = visit.data?.sampleUsage;
	            if (!usage || typeof usage !== 'object') return sum;
	            const values = Object.values(usage as Record<string, unknown>);
	            const add = values.reduce<number>(
	              (acc, value) => acc + (typeof value === 'number' ? value : Number(value) || 0),
	              0
	            );
	            return sum + add;
	          }, 0);
	          setSampleConsumedPortions(portions);
	        }
      }
      if (samplesRes.status === 'fulfilled') {
        const orders = samplesRes.value.data || [];
        const units = orders.reduce((sum, order) => {
          const items = order.items || [];
          return sum + items.reduce((acc, item) => acc + (item.quantity || 0), 0);
        }, 0);
        setSampleUnits(units);
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

          <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.10)] p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[11px] text-black/50 font-semibold uppercase tracking-[0.22em]">Баланс пробников</div>
              <div className="mt-2 text-[18px] font-semibold text-black">
                {Math.max(0, sampleUnits * 0.1 - sampleConsumedPortions * 0.025).toFixed(1)} кг
              </div>
              <div className="mt-1 text-[12px] text-black/50">
                Заказано {(sampleUnits * 0.1).toFixed(1)} кг • Списано {(sampleConsumedPortions * 0.025).toFixed(1)} кг
              </div>
            </div>
            <div className="px-3 py-2 rounded-2xl bg-black/5 border border-white/40 text-[12px] font-semibold text-black/60 shrink-0">
              {sampleUnits} поз.
            </div>
          </div>

          <div className="space-y-3">
            <SettingsRow
              title="Заказать пробники"
              subtitle="Заявка на ежемесячный набор"
              icon={<Package size={18} strokeWidth={1.5} />}
              onClick={() => setSampleWizardOpen(true)}
            />
            <SettingsRow
              title="Мои данные"
              subtitle="СДЭК и телефон"
              icon={<IdCard size={18} strokeWidth={1.5} />}
              onClick={() => navigate('/profile/data')}
            />
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

          <SampleOrderWizard isOpen={isSampleWizardOpen} onClose={() => setSampleWizardOpen(false)} />
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
