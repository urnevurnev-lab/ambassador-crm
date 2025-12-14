import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { Users, ShoppingBag, MapPin, Activity, Download, Plus } from 'lucide-react';
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

interface Product {
  id: number;
  line: string;
  flavor: string;
  sku: string;
  category: string;
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
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [filterLine, setFilterLine] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const navigate = useNavigate();

  const ensureAuth = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) {
      navigate('/admin/login');
      return false;
    }
    return true;
  };

  const handleAuthError = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const fetchStats = async () => {
    if (!ensureAuth()) return;
    try {
      const res = await apiClient.get('/api/admin/stats');
      setStats(res.data);
    } catch (e) {
      console.error('Failed to load stats', e);
      if ((e as any)?.response?.status === 401 || (e as any)?.response?.status === 403) {
        handleAuthError();
        return;
      }
      WebApp.showAlert('Не удалось загрузить статистику');
    } finally {
      setLoading(false);
    }
  };

  const fetchVisits = async () => {
    if (!ensureAuth()) return;
    try {
      const res = await apiClient.get<Visit[]>('/api/visits');
      setVisits(res.data || []);
    } catch (e) {
      console.error('Failed to load visits', e);
      if ((e as any)?.response?.status === 401 || (e as any)?.response?.status === 403) {
        handleAuthError();
        return;
      }
      WebApp.showAlert('Не удалось загрузить визиты');
    } finally {
      setVisitsLoading(false);
    }
  };

  const fetchProducts = async () => {
    if (!ensureAuth()) return;
    setProductsLoading(true);
    try {
      const res = await apiClient.get<Product[]>('/api/products');
      setProducts(res.data || []);
    } catch (e) {
      console.error('Failed to load products', e);
      if ((e as any)?.response?.status === 401 || (e as any)?.response?.status === 403) {
        handleAuthError();
        return;
      }
      WebApp.showAlert('Не удалось загрузить продукты');
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    if (!ensureAuth()) return;
    fetchStats();
    fetchVisits();
    fetchProducts();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

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

  const saveProduct = async () => {
    if (!editing?.sku || !editing.line || !editing.flavor) {
      WebApp.showAlert('Заполните line, flavor и sku');
      return;
    }
    try {
      if (editing.id) {
        await apiClient.patch(`/api/products/${editing.id}`, {
          line: editing.line,
          flavor: editing.flavor,
          sku: editing.sku,
          category: editing.category || 'UNKNOWN',
        });
      } else {
        await apiClient.post('/api/products', {
          line: editing.line,
          flavor: editing.flavor,
          sku: editing.sku,
          category: editing.category || 'UNKNOWN',
        });
      }
      setEditing(null);
      fetchProducts();
      WebApp.showAlert('Сохранено');
    } catch (e) {
      WebApp.showAlert('Ошибка сохранения SKU');
    }
  };

  const startEdit = (product?: Product) => {
    if (product) {
      setEditing(product);
    } else {
      setEditing({ line: '', flavor: '', sku: '', category: 'UNKNOWN' });
    }
  };

  const deleteProduct = async (id: number) => {
    const confirmed = window.confirm('Удалить товар?');
    if (!confirmed) return;
    try {
      await apiClient.delete(`/api/products/${id}`);
      fetchProducts();
    } catch (e) {
      WebApp.showAlert('Не удалось удалить товар');
    }
  };

  const filteredProducts = products.filter((p) => {
    const okLine = filterLine ? p.line === filterLine : true;
    const okCat = filterCategory ? p.category === filterCategory : true;
    return okLine && okCat;
  });

  return (
    <Layout>
      <PageHeader
        title="Админ-панель"
        rightContent={
          <button
            onClick={handleLogout}
            className="text-xs font-semibold text-red-500"
          >
            Выйти
          </button>
        }
      />
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

        {/* Управление продуктами */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-sm">Каталог SKU</div>
              <div className="text-xs text-gray-400">Добавляйте и редактируйте товары</div>
            </div>
            <button
              onClick={() => startEdit()}
              className="bg-black text-white px-3 py-2 rounded-xl text-xs font-bold active:scale-95 transition flex items-center gap-1"
            >
              <Plus size={14}/> Добавить
            </button>
          </div>

          <div className="flex gap-3">
            <select
              value={filterLine}
              onChange={(e) => setFilterLine(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm"
            >
              <option value="">Все линейки</option>
              {Array.from(new Set(products.map(p => p.line))).map(line => (
                <option key={line} value={line}>{line}</option>
              ))}
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm"
            >
              <option value="">Все категории</option>
              {Array.from(new Set(products.map(p => p.category))).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {editing && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-3">
              <div className="flex gap-2">
                <input
                  value={editing.line || ''}
                  onChange={(e) => setEditing({ ...editing, line: e.target.value })}
                  placeholder="Line"
                  className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  value={editing.category || ''}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  placeholder="Category"
                  className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <input
                  value={editing.flavor || ''}
                  onChange={(e) => setEditing({ ...editing, flavor: e.target.value })}
                  placeholder="Flavor"
                  className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  value={editing.sku || ''}
                  onChange={(e) => setEditing({ ...editing, sku: e.target.value })}
                  placeholder="SKU"
                  className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveProduct}
                  className="flex-1 bg-black text-white py-2 rounded-lg text-sm font-semibold active:scale-95 transition"
                >
                  Сохранить
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="flex-1 bg-white text-gray-600 border border-gray-200 py-2 rounded-lg text-sm font-semibold active:scale-95 transition"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {productsLoading ? (
              <div className="text-center text-gray-400 py-4">Загрузка...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center text-gray-400 py-4">Ничего не найдено</div>
            ) : (
              filteredProducts.map((p) => (
                <div key={p.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-2">
                  <div className="flex justify-between text-sm font-semibold text-gray-900">
                    <span>Line: {p.line}</span>
                    <span>SKU: {p.sku}</span>
                  </div>
                  <div className="text-sm text-gray-700">Category: {p.category}</div>
                  <div className="text-sm text-gray-700">Flavor: {p.flavor}</div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => startEdit(p)}
                      className="flex-1 bg-gray-100 text-gray-800 py-2 rounded-xl font-semibold active:scale-95 transition"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => deleteProduct(p.id)}
                      className="flex-1 bg-red-100 text-red-700 py-2 rounded-xl font-semibold active:scale-95 transition"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))
            )}
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

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          {visitsLoading ? (
            <div className="text-gray-500 text-sm">Загрузка визитов...</div>
          ) : visits.length === 0 ? (
            <div className="text-center text-gray-400">Визитов пока нет</div>
          ) : (
            <div className="flex flex-col gap-3">
              {visits.map((v) => {
                const data = (v.data as any) || {};
                return (
                  <div key={v.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 shadow-sm space-y-2">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{formatDate(v.date)}</span>
                      <span>{v.activity?.name || v.type || '—'}</span>
                    </div>
                    <div className="font-semibold text-gray-900">{v.facility?.name || '—'}</div>
                    {v.facility?.address && <div className="text-xs text-gray-500">{v.facility.address}</div>}
                    <div className="text-sm text-gray-700">Амбассадор: {v.user?.fullName || '—'}</div>
                    <div className="text-sm text-gray-700">Контакты: {data.contacts || '—'}</div>
                    <div className="text-sm text-gray-700">Чашки: {data.cups ?? '—'}</div>
                    <div className="text-sm text-gray-700">{v.comment || '—'}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
