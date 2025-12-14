import { useEffect, useState } from 'react';
import { Layout } from '../../components/Layout';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { Users, ShoppingBag, MapPin, Activity, Download } from 'lucide-react';
import apiClient from '../../api/apiClient';
import WebApp from '@twa-dev/sdk';

interface Visit {
  id: number;
  date: string;
  type: string;
  comment?: string;
  user?: { fullName: string };
  facility?: { name: string; address?: string };
  activity?: { name: string; code: string };
  data?: any;
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    orders: 0,
    facilities: 0,
    visits: 0,
  });
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [visitsLoading, setVisitsLoading] = useState(true);

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

  const fetchVisits = async () => {
    try {
      const res = await apiClient.get<Visit[]>('/api/visits');
      setVisits(res.data || []);
    } catch (e) {
      console.error('Failed to load visits', e);
      WebApp.showAlert('Не удалось загрузить визиты');
    } finally {
      setVisitsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchVisits();
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

  const downloadReport = async () => {
    try {
      const res = await apiClient.get('/api/admin/export/visits', { responseType: 'arraybuffer' });
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'visits.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export error', e);
      WebApp.showAlert('Не удалось скачать отчет');
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('ru-RU');
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

        <div className="flex items-center justify-between mt-6">
          <h3 className="font-bold text-lg">Визиты</h3>
          <button
            onClick={downloadReport}
            className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition shadow-sm"
          >
            <Download size={14}/> 📥 Скачать отчет (Excel)
          </button>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 overflow-auto">
          {visitsLoading ? (
            <div className="text-gray-500 text-sm">Загрузка визитов...</div>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="text-gray-500">
                  <th className="py-2 pr-4">Дата</th>
                  <th className="py-2 pr-4">Амбассадор</th>
                  <th className="py-2 pr-4">Заведение</th>
                  <th className="py-2 pr-4">Активность</th>
                  <th className="py-2 pr-4">Контакты</th>
                  <th className="py-2 pr-4">Чашки</th>
                  <th className="py-2">Комментарий</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visits.map((v) => {
                  const data = (v.data as any) || {};
                  return (
                    <tr key={v.id} className="align-top">
                      <td className="py-2 pr-4 whitespace-nowrap">{formatDate(v.date)}</td>
                      <td className="py-2 pr-4">{v.user?.fullName || '—'}</td>
                      <td className="py-2 pr-4">
                        <div className="font-semibold">{v.facility?.name || '—'}</div>
                        {v.facility?.address && <div className="text-xs text-gray-500">{v.facility.address}</div>}
                      </td>
                      <td className="py-2 pr-4">{v.activity?.name || v.type || '—'}</td>
                      <td className="py-2 pr-4">{data.contacts || '—'}</td>
                      <td className="py-2 pr-4">{data.cups ?? '—'}</td>
                      <td className="py-2 text-gray-700">{v.comment || '—'}</td>
                    </tr>
                  );
                })}
                {visits.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-3 text-center text-gray-400">Визитов пока нет</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
};
