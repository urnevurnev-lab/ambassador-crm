import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { StandardCard } from '../components/ui/StandardCard';
import { LockScreen } from '../components/LockScreen';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';
import {
  Users,
  Package,
  FlaskConical,
  DollarSign,
  X,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  Building2,
  CheckCircle,
  ShoppingBag,
  Download,
  BookOpen,
  Truck,
  ShieldCheck,
  ShieldOff,
} from 'lucide-react';
import WebApp from '@twa-dev/sdk';

type AdminView =
  | 'menu'
  | 'products'
  | 'prices'
  | 'users'
  | 'facilities'
  | 'reports'
  | 'orders'
  | 'samples'
  | 'posts'
  | 'distributors';

type UserRole = 'ADMIN' | 'AMBASSADOR';

interface Product {
  id: number;
  line: string;
  flavor: string;
  price: number;
  isTopFlavor: boolean;
}

interface User {
  id: number;
  fullName: string;
  telegramId: string;
  role: UserRole;
}

interface Facility {
  id: number;
  name: string;
  address: string;
  isVerified: boolean;
}

interface Visit {
  id: number;
  date: string;
  type: string;
  facility?: { name: string } | null;
  user?: { fullName: string } | null;
}

interface Order {
  id: number;
  status: string;
  facility?: { name: string } | null;
  user?: { fullName: string } | null;
}

interface SampleOrder {
  id: number;
  status: string;
  createdAt: string;
  user?: { fullName: string } | null;
  items?: Array<{ quantity: number; product?: { line: string; flavor: string } | null }> | null;
}

interface Post {
  id: number;
  title: string;
  category?: string | null;
}

interface Distributor {
  id: number;
  name: string;
  telegramChatId: string;
}

const formatPrice = (value: number) => new Intl.NumberFormat('ru-RU').format(value);

const formatDate = (value: string) => {
  return new Date(value).toLocaleDateString('ru-RU');
};

const buildSku = (line: string, flavor: string) => {
  return `${line}-${flavor}`
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const ManagerHeader: React.FC<{ title: string; subtitle?: string; onBack: () => void }> = ({
  title,
  subtitle,
  onBack,
}) => (
  <PageHeader
    title={title}
    subtitle={subtitle}
    rightAction={
      <button onClick={onBack} className="text-sm font-semibold text-gray-500">
        Закрыть
      </button>
    }
  />
);

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div className="text-center text-gray-500 py-8">{text}</div>
);

const SkeletonList: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-3 animate-pulse">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="h-20 rounded-3xl bg-white border border-gray-100 shadow-sm" />
    ))}
  </div>
);

const Modal: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, onClose, children, action }) => (
  <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
    <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-black">{title}</h3>
        <button onClick={onClose} className="text-gray-400">
          <X size={20} strokeWidth={2} />
        </button>
      </div>
      <div className="space-y-4">{children}</div>
      {action && <div className="mt-6">{action}</div>}
    </div>
  </div>
);

const ProductManager: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newLine, setNewLine] = useState('');
  const [selectedLine, setSelectedLine] = useState('');
  const [newFlavor, setNewFlavor] = useState('');
  const [newPrice, setNewPrice] = useState(2500);
  const [expandedLines, setExpandedLines] = useState<Record<string, boolean>>({});

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<Product[]>('/api/products');
      setProducts(res.data || []);
    } catch (e) {
      toast.error('Не удалось загрузить товары');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const lines = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    products.forEach((product) => {
      if (!groups[product.line]) groups[product.line] = [];
      groups[product.line].push(product);
    });
    return groups;
  }, [products]);

  const handleAddProduct = async () => {
    const lineToUse = selectedLine === 'NEW' ? newLine.trim() : selectedLine.trim();
    if (!lineToUse || !newFlavor.trim()) {
      toast.error('Заполните линейку и вкус');
      return;
    }

    const sku = buildSku(lineToUse, newFlavor.trim());

    try {
      await apiClient.post('/api/products', {
        line: lineToUse,
        flavor: newFlavor.trim(),
        price: Number(newPrice),
        category: 'Tobacco',
        sku,
        isTopFlavor: false,
      });
      toast.success('Продукт создан');
      setIsCreating(false);
      setNewLine('');
      setSelectedLine('');
      setNewFlavor('');
      setNewPrice(2500);
      loadProducts();
    } catch (e) {
      toast.error('Ошибка при создании');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Удалить этот вкус?')) return;
    try {
      await apiClient.delete(`/api/products/${id}`);
      toast.success('Вкус удален');
      loadProducts();
    } catch (e) {
      toast.error('Ошибка удаления');
    }
  };

  const toggleLine = (line: string) => {
    setExpandedLines((prev) => ({ ...prev, [line]: !prev[line] }));
  };

  const handleToggleTop = async (product: Product) => {
    try {
      await apiClient.patch(`/api/products/${product.id}`, { isTopFlavor: !product.isTopFlavor });
      loadProducts();
    } catch (e) {
      toast.error('Не удалось обновить статус');
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <ManagerHeader title="Товары" subtitle="Линейки и вкусы" onBack={onBack} />

      <button
        onClick={() => setIsCreating(true)}
        className="w-full py-3 bg-black text-white rounded-3xl font-semibold flex items-center justify-center gap-2 shadow-md active:scale-95 transition-transform"
      >
        <Plus size={18} strokeWidth={2} /> Добавить вкус
      </button>

      {loading ? (
        <SkeletonList count={3} />
      ) : Object.keys(lines).length === 0 ? (
        <EmptyState text="Товары отсутствуют" />
      ) : (
        Object.entries(lines).map(([line, items]) => (
          <div key={line} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleLine(line)}
              className="w-full px-5 py-4 flex items-center justify-between text-left"
            >
              <div>
                <div className="text-[14px] font-semibold text-black">{line}</div>
                <div className="text-[11px] text-gray-500">{items.length} вкусов</div>
              </div>
              {expandedLines[line] ? (
                <ChevronUp size={18} strokeWidth={2} className="text-gray-400" />
              ) : (
                <ChevronDown size={18} strokeWidth={2} className="text-gray-400" />
              )}
            </button>

            {expandedLines[line] && (
              <div className="px-5 pb-5 space-y-2">
                {items.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-2xl border border-gray-100 bg-[#F5F5F7] px-4 py-3"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.flavor}</div>
                      <div className="text-xs text-gray-500">{formatPrice(product.price)} ₽</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleTop(product)}
                        className={`px-3 py-1 rounded-xl text-[10px] font-semibold border ${
                          product.isTopFlavor
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-gray-600 border-gray-200'
                        }`}
                      >
                        TOP
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-gray-400 hover:text-gray-600"
                      >
                        <Trash2 size={16} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}

      {isCreating && (
        <Modal
          title="Новый продукт"
          onClose={() => setIsCreating(false)}
          action={
            <button
              onClick={handleAddProduct}
              className="w-full bg-black text-white py-3 rounded-2xl font-semibold"
            >
              Сохранить
            </button>
          }
        >
          <div>
            <label className="text-xs font-semibold text-gray-500 ml-1">Линейка</label>
            <select
              value={selectedLine}
              onChange={(e) => setSelectedLine(e.target.value)}
              className="w-full bg-[#F5F5F7] p-3 rounded-2xl mt-2 border border-gray-100"
            >
              <option value="" disabled>
                Выберите линейку
              </option>
              {Object.keys(lines).map((line) => (
                <option key={line} value={line}>
                  {line}
                </option>
              ))}
              <option value="NEW">+ Создать новую...</option>
            </select>
          </div>
          {selectedLine === 'NEW' && (
            <input
              placeholder="Название новой линейки"
              value={newLine}
              onChange={(e) => setNewLine(e.target.value)}
              className="w-full bg-white border border-gray-200 p-3 rounded-2xl font-medium"
            />
          )}
          <div>
            <label className="text-xs font-semibold text-gray-500 ml-1">Вкус</label>
            <input
              placeholder="Например: Cherry Cola"
              value={newFlavor}
              onChange={(e) => setNewFlavor(e.target.value)}
              className="w-full bg-[#F5F5F7] p-3 rounded-2xl mt-2 border border-gray-100"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 ml-1">Цена (₽)</label>
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(Number(e.target.value))}
              className="w-full bg-[#F5F5F7] p-3 rounded-2xl mt-2 border border-gray-100"
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

const PriceManager: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<Product[]>('/api/products');
        const temp: Record<string, number> = {};
        (res.data || []).forEach((product) => {
          if (!temp[product.line]) temp[product.line] = product.price;
        });
        setPrices(temp);
      } catch (e) {
        toast.error('Не удалось загрузить цены');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const savePrice = async (line: string, price: number) => {
    try {
      await apiClient.post('/api/products/lines/update-price', { line, price });
      toast.success(`Цена для ${line} обновлена`);
    } catch (e) {
      toast.error('Ошибка сохранения');
    }
  };

  const updatePrice = (line: string, value: number) => {
    setPrices((prev) => ({ ...prev, [line]: value }));
  };

  return (
    <div className="space-y-6 pb-24">
      <ManagerHeader title="Цены" subtitle="По линейкам" onBack={onBack} />

      {loading ? (
        <SkeletonList count={3} />
      ) : Object.keys(prices).length === 0 ? (
        <EmptyState text="Нет данных" />
      ) : (
        <div className="space-y-3">
          {Object.entries(prices).map(([line, price]) => (
            <div key={line} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
              <div className="text-[14px] font-semibold text-black">{line}</div>
              <div className="flex items-center gap-2 mt-3">
                <input
                  type="number"
                  value={price}
                  onChange={(e) => updatePrice(line, Number(e.target.value))}
                  onBlur={(e) => savePrice(line, Number(e.target.value))}
                  className="flex-1 bg-[#F5F5F7] border border-gray-100 rounded-2xl p-2 font-medium text-center"
                />
                <div className="flex items-center justify-center bg-[#F5F5F7] rounded-2xl w-10 text-gray-500">₽</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const UserManager: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [fullName, setFullName] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [role, setRole] = useState<UserRole>('AMBASSADOR');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<User[]>('/api/users');
      setUsers(res.data || []);
    } catch (e) {
      toast.error('Не удалось загрузить сотрудников');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSave = async () => {
    if (!fullName.trim() || !telegramId.trim()) {
      toast.error('Имя и ID обязательны');
      return;
    }
    try {
      await apiClient.post('/api/users', {
        fullName: fullName.trim(),
        telegramId: telegramId.trim(),
        role,
      });
      toast.success('Сотрудник добавлен');
      setIsCreating(false);
      setFullName('');
      setTelegramId('');
      setRole('AMBASSADOR');
      loadUsers();
    } catch (e) {
      toast.error('Ошибка сохранения');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Удалить сотрудника?')) return;
    try {
      await apiClient.delete(`/api/users/${id}`);
      toast.success('Сотрудник удален');
      loadUsers();
    } catch (e) {
      toast.error('Ошибка удаления');
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <ManagerHeader title="Команда" subtitle="Амбассадоры" onBack={onBack} />

      <button
        onClick={() => setIsCreating(true)}
        className="w-full py-3 bg-black text-white rounded-3xl font-semibold flex items-center justify-center gap-2 shadow-md"
      >
        <Plus size={18} strokeWidth={2} /> Добавить сотрудника
      </button>

      {loading ? (
        <SkeletonList count={3} />
      ) : users.length === 0 ? (
        <EmptyState text="Сотрудники отсутствуют" />
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <StandardCard
              key={user.id}
              title={user.role === 'ADMIN' ? 'Администратор' : 'Амбассадор'}
              subtitle={user.fullName}
              action={
                <button
                  onClick={() => handleDelete(user.id)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <Trash2 size={16} strokeWidth={2} />
                </button>
              }
            >
              <div className="text-[12px] text-gray-500 mt-2 bg-[#F5F5F7] p-3 rounded-2xl border border-gray-100">
                TG ID: <span className="font-mono text-gray-700">{user.telegramId}</span>
              </div>
            </StandardCard>
          ))}
        </div>
      )}

      {isCreating && (
        <Modal
          title="Новый сотрудник"
          onClose={() => setIsCreating(false)}
          action={
            <button
              onClick={handleSave}
              className="w-full bg-black text-white py-3 rounded-2xl font-semibold"
            >
              Сохранить
            </button>
          }
        >
          <input
            placeholder="Полное имя"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-[#F5F5F7] p-3 rounded-2xl border border-gray-100 font-medium"
          />
          <input
            placeholder="Telegram ID"
            value={telegramId}
            onChange={(e) => setTelegramId(e.target.value)}
            className="w-full bg-[#F5F5F7] p-3 rounded-2xl border border-gray-100 font-medium"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full bg-[#F5F5F7] p-3 rounded-2xl border border-gray-100 font-medium"
          >
            <option value="AMBASSADOR">Амбассадор</option>
            <option value="ADMIN">Админ</option>
          </select>
        </Modal>
      )}
    </div>
  );
};

const FacilityManager: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFacilities = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<Facility[]>('/api/facilities');
      setFacilities(res.data || []);
    } catch (e) {
      toast.error('Не удалось загрузить объекты');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFacilities();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Удалить объект?')) return;
    try {
      await apiClient.delete(`/api/facilities/${id}`);
      toast.success('Объект удален');
      loadFacilities();
    } catch (e) {
      toast.error('Ошибка удаления');
    }
  };

  const toggleVerify = async (facility: Facility) => {
    try {
      await apiClient.patch(`/api/facilities/${facility.id}`, { isVerified: !facility.isVerified });
      toast.success(facility.isVerified ? 'Статус снят' : 'Точка подтверждена');
      loadFacilities();
    } catch (e) {
      toast.error('Ошибка обновления');
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <ManagerHeader title="Объекты" subtitle="Подтверждение точек" onBack={onBack} />

      {loading ? (
        <SkeletonList count={3} />
      ) : facilities.length === 0 ? (
        <EmptyState text="Объекты отсутствуют" />
      ) : (
        <div className="space-y-3">
          {facilities.map((facility) => (
            <StandardCard
              key={facility.id}
              title={facility.isVerified ? 'Подтверждено' : 'На проверке'}
              subtitle={facility.name}
              action={
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleVerify(facility)}
                    className="px-3 py-2 rounded-2xl border border-gray-200 text-xs font-semibold text-gray-600"
                  >
                    {facility.isVerified ? (
                      <span className="inline-flex items-center gap-1">
                        <ShieldOff size={14} strokeWidth={2} /> Снять
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        <ShieldCheck size={14} strokeWidth={2} /> Подтвердить
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(facility.id)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <Trash2 size={16} strokeWidth={2} />
                  </button>
                </div>
              }
            >
              <div className="text-[12px] text-gray-500">{facility.address}</div>
            </StandardCard>
          ))}
        </div>
      )}
    </div>
  );
};

const ReportsManager: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<Visit[]>('/api/visits')
      .then((res) => setVisits(res.data || []))
      .catch(() => toast.error('Не удалось загрузить визиты'))
      .finally(() => setLoading(false));
  }, []);

  const exportActivity = () => {
    window.open('/api/reports/visits', '_blank');
  };

  return (
    <div className="space-y-6 pb-24">
      <ManagerHeader title="Журнал визитов" subtitle="Отчеты" onBack={onBack} />
      <button
        onClick={exportActivity}
        className="w-full py-3 bg-black text-white rounded-3xl font-semibold flex items-center justify-center gap-2 shadow-md"
      >
        <Download size={18} strokeWidth={2} /> Выгрузить Excel
      </button>

      {loading ? (
        <SkeletonList count={3} />
      ) : visits.length === 0 ? (
        <EmptyState text="Отчеты отсутствуют" />
      ) : (
        <div className="space-y-3">
          {visits.map((visit) => (
            <StandardCard
              key={visit.id}
              title={formatDate(visit.date)}
              subtitle={visit.facility?.name || 'Объект'}
              icon={CheckCircle}
            >
              <div className="text-[12px] text-gray-500 mt-2">
                Тип: <span className="text-gray-700">{visit.type}</span>
              </div>
              <div className="text-[12px] text-gray-500 mt-1">
                Амбассадор: <span className="text-gray-700">{visit.user?.fullName || '—'}</span>
              </div>
            </StandardCard>
          ))}
        </div>
      )}
    </div>
  );
};

const OrdersManager: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<Order[]>('/api/orders')
      .then((res) => setOrders(res.data || []))
      .catch(() => toast.error('Не удалось загрузить заказы'))
      .finally(() => setLoading(false));
  }, []);

  const exportOrders = () => {
    window.open('/api/samples/export', '_blank');
  };

  return (
    <div className="space-y-6 pb-24">
      <ManagerHeader title="Заказы" subtitle="История" onBack={onBack} />
      <button
        onClick={exportOrders}
        className="w-full py-3 bg-black text-white rounded-3xl font-semibold flex items-center justify-center gap-2 shadow-md"
      >
        <Download size={18} strokeWidth={2} /> Экспорт в Excel
      </button>

      {loading ? (
        <SkeletonList count={3} />
      ) : orders.length === 0 ? (
        <EmptyState text="Заказы отсутствуют" />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <StandardCard
              key={order.id}
              title={order.status}
              subtitle={`Заказ #${order.id}`}
              icon={ShoppingBag}
            >
              <div className="text-[12px] text-gray-500 mt-2">
                Объект: <span className="text-gray-700">{order.facility?.name || '—'}</span>
              </div>
              <div className="text-[12px] text-gray-500 mt-1">
                Амбассадор: <span className="text-gray-700">{order.user?.fullName || '—'}</span>
              </div>
            </StandardCard>
          ))}
        </div>
      )}
    </div>
  );
};

const SamplesManager: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [orders, setOrders] = useState<SampleOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<SampleOrder[]>('/api/samples')
      .then((res) => setOrders(res.data || []))
      .catch(() => toast.error('Не удалось загрузить заявки'))
      .finally(() => setLoading(false));
  }, []);

  const exportOrders = () => {
    window.open('/api/samples/export', '_blank');
  };

  const getQty = (order: SampleOrder) => (order.items || []).reduce((sum, item) => sum + (item.quantity || 0), 0);

  return (
    <div className="space-y-6 pb-24">
      <ManagerHeader title="Пробники" subtitle="Заявки сотрудников" onBack={onBack} />
      <button
        onClick={exportOrders}
        className="w-full py-3 bg-black text-white rounded-3xl font-semibold flex items-center justify-center gap-2 shadow-md"
      >
        <Download size={18} strokeWidth={2} /> Экспорт в Excel
      </button>

      {loading ? (
        <SkeletonList count={3} />
      ) : orders.length === 0 ? (
        <EmptyState text="Заявок нет" />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <StandardCard
              key={order.id}
              title={`#${order.id} • ${order.status || 'PENDING'}`}
              subtitle={order.user?.fullName || 'Сотрудник'}
              icon={Package}
            >
              <div className="text-[12px] text-gray-500 mt-2">
                Позиций: <span className="text-gray-700">{getQty(order)}</span>
              </div>
              <div className="text-[12px] text-gray-500 mt-1">
                Дата: <span className="text-gray-700">{formatDate(order.createdAt)}</span>
              </div>
            </StandardCard>
          ))}
        </div>
      )}
    </div>
  );
};

const KnowledgeManager: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<Post[]>('/api/posts')
      .then((res) => setPosts(res.data || []))
      .catch(() => toast.error('Не удалось загрузить контент'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 pb-24">
      <ManagerHeader title="Контент" subtitle="База знаний" onBack={onBack} />
      {loading ? (
        <SkeletonList count={3} />
      ) : posts.length === 0 ? (
        <EmptyState text="Материалы отсутствуют" />
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <StandardCard
              key={post.id}
              title={post.category || 'Материал'}
              subtitle={post.title}
              icon={BookOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const DistributorManager: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<Distributor[]>('/api/distributors')
      .then((res) => setDistributors(res.data || []))
      .catch(() => toast.error('Не удалось загрузить дистрибьюторов'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 pb-24">
      <ManagerHeader title="Дистрибьюторы" subtitle="Контакты" onBack={onBack} />
      {loading ? (
        <SkeletonList count={3} />
      ) : distributors.length === 0 ? (
        <EmptyState text="Данные отсутствуют" />
      ) : (
        <div className="space-y-3">
          {distributors.map((dist) => (
            <StandardCard key={dist.id} title="Дистрибьютор" subtitle={dist.name} icon={Truck}>
              <div className="text-[12px] text-gray-500 mt-2">
                Chat ID: <span className="text-gray-700">{dist.telegramChatId || '—'}</span>
              </div>
            </StandardCard>
          ))}
        </div>
      )}
    </div>
  );
};

const AdminMenu: React.FC<{ onSelect: (view: AdminView) => void }> = ({ onSelect }) => (
  <div className="space-y-6 pb-24">
    <PageHeader title="Админ" subtitle="Панель управления" />

    <div className="grid grid-cols-2 gap-4">
      <ManagerCard title="Товары" subtitle="Линейки" icon={Package} onClick={() => onSelect('products')} />
      <ManagerCard title="Команда" subtitle="Амбассадоры" icon={Users} onClick={() => onSelect('users')} />
      <ManagerCard title="Объекты" subtitle="Подтверждения" icon={Building2} onClick={() => onSelect('facilities')} />
      <ManagerCard title="Цены" subtitle="Прайс" icon={DollarSign} onClick={() => onSelect('prices')} />
      <ManagerCard title="Заказы" subtitle="История" icon={ShoppingBag} onClick={() => onSelect('orders')} />
      <ManagerCard title="Пробники" subtitle="Заявки" icon={FlaskConical} onClick={() => onSelect('samples')} />
      <ManagerCard title="Визиты" subtitle="Отчеты" icon={CheckCircle} onClick={() => onSelect('reports')} />
      <ManagerCard title="Контент" subtitle="База" icon={BookOpen} onClick={() => onSelect('posts')} />
      <ManagerCard title="Дистрибьюторы" subtitle="Чаты" icon={Truck} onClick={() => onSelect('distributors')} />
    </div>
  </div>
);

const ManagerCard: React.FC<{
  title: string;
  subtitle: string;
  icon: React.ElementType;
  onClick: () => void;
}> = ({ title, subtitle, icon: Icon, onClick }) => (
  <button
    onClick={onClick}
    className="w-full bg-white rounded-3xl border border-gray-100 shadow-sm p-4 text-left active:scale-[0.99] transition-transform"
  >
    <div className="w-10 h-10 rounded-2xl bg-[#F5F5F7] flex items-center justify-center text-gray-600 mb-3">
      <Icon size={18} strokeWidth={1.5} />
    </div>
    <div className="text-[14px] font-semibold text-black">{title}</div>
    <div className="text-[11px] text-gray-500 mt-1">{subtitle}</div>
  </button>
);

const AdminPage: React.FC = () => {
  const [view, setView] = useState<AdminView>('menu');
  const [isUnlocked, setIsUnlocked] = useState(false);

  const handleNavigate = (nextView: AdminView) => {
    setView(nextView);
    WebApp.HapticFeedback?.impactOccurred('light');
  };

  if (!isUnlocked) {
    return <LockScreen onSuccess={() => setIsUnlocked(true)} />;
  }

  return (
    <div className="min-h-screen">
      {view === 'menu' && <AdminMenu onSelect={handleNavigate} />}
      {view === 'products' && <ProductManager onBack={() => handleNavigate('menu')} />}
      {view === 'prices' && <PriceManager onBack={() => handleNavigate('menu')} />}
      {view === 'users' && <UserManager onBack={() => handleNavigate('menu')} />}
      {view === 'facilities' && <FacilityManager onBack={() => handleNavigate('menu')} />}
      {view === 'reports' && <ReportsManager onBack={() => handleNavigate('menu')} />}
      {view === 'orders' && <OrdersManager onBack={() => handleNavigate('menu')} />}
      {view === 'samples' && <SamplesManager onBack={() => handleNavigate('menu')} />}
      {view === 'posts' && <KnowledgeManager onBack={() => handleNavigate('menu')} />}
      {view === 'distributors' && <DistributorManager onBack={() => handleNavigate('menu')} />}
    </div>
  );
};

export default AdminPage;
