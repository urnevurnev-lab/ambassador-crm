import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Pencil,
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
                    <div className="text-sm font-medium text-gray-900">{product.flavor}</div>
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
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [editingChatsUser, setEditingChatsUser] = useState<User | null>(null);
  const [selectedChatIds, setSelectedChatIds] = useState<number[]>([]);
  const [newChatName, setNewChatName] = useState('');
  const [newChatId, setNewChatId] = useState('');

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
    apiClient
      .get<Distributor[]>('/api/distributors')
      .then((res) => setDistributors(res.data || []))
      .catch(() => toast.error('Не удалось загрузить чаты'));
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

  const toggleChat = (id: number) => {
    setSelectedChatIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 7) return prev; // максимум 7 чатов
      return [...prev, id];
    });
  };

  const saveChats = async () => {
    if (!editingChatsUser) return;
    try {
      await apiClient.post(`/api/users/${editingChatsUser.id}/distributors`, {
        distributorIds: selectedChatIds,
      });
      toast.success('Чаты сохранены');
      setEditingChatsUser(null);
      loadUsers();
    } catch (e) {
      toast.error('Не удалось сохранить чаты');
    }
  };

  const addDistributor = async () => {
    if (!newChatName.trim() || !newChatId.trim()) {
      toast.error('Введите название и Chat ID');
      return;
    }
    try {
      const res = await apiClient.post<Distributor>('/api/distributors', {
        name: newChatName.trim(),
        telegramChatId: newChatId.trim(),
      });
      const created = res.data;
      setDistributors((prev) => [created, ...prev]);
      setNewChatName('');
      setNewChatId('');
      toggleChat(created.id);
      toast.success('Чат добавлен');
    } catch (e) {
      toast.error('Не удалось добавить чат');
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
              <button
                onClick={() => {
                  setEditingChatsUser(user);
                  const current = (user as any).allowedDistributors || [];
                  setSelectedChatIds(current.map((d: any) => d.id));
                }}
                className="mt-3 w-full bg-white border border-gray-200 rounded-2xl py-3 text-[13px] font-semibold text-gray-700 active:scale-[0.99] transition"
              >
                Настроить чаты (до 7)
              </button>
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

      {editingChatsUser && (
        <Modal
          title={`Чаты для ${editingChatsUser.fullName}`}
          onClose={() => setEditingChatsUser(null)}
          action={
            <button
              onClick={saveChats}
              className="w-full bg-black text-white py-3 rounded-2xl font-semibold disabled:opacity-50"
              disabled={selectedChatIds.length === 0}
            >
              Сохранить
            </button>
          }
        >
          <p className="text-sm text-gray-500">
            Можно выбрать до 7 чатов. Заявка по заказу уйдёт в выбранный чат.
          </p>

          {selectedChatIds.length > 0 && (
            <div className="flex flex-wrap gap-2 bg-[#F5F5F7] p-3 rounded-2xl border border-gray-200">
              {distributors
                .filter((d) => selectedChatIds.includes(d.id))
                .map((d) => (
                  <span
                    key={d.id}
                    className="inline-flex items-center gap-1 bg-white border border-gray-200 rounded-xl px-2 py-1 text-xs font-semibold"
                  >
                    {d.name}
                    <button
                      onClick={() => toggleChat(d.id)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X size={12} strokeWidth={2} />
                    </button>
                  </span>
                ))}
            </div>
          )}

          <div className="space-y-2 bg-[#F5F5F7] p-3 rounded-2xl border border-gray-200">
            <input
              placeholder="Название дистрибьютора"
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
              className="w-full bg-white rounded-xl border border-gray-200 p-2 text-sm font-medium"
            />
            <input
              placeholder="Chat ID"
              value={newChatId}
              onChange={(e) => setNewChatId(e.target.value)}
              className="w-full bg-white rounded-xl border border-gray-200 p-2 text-sm font-medium"
            />
            <button
              onClick={addDistributor}
              className="w-full bg-black text-white rounded-xl py-2 text-sm font-semibold active:scale-[0.99] transition"
            >
              Добавить чат
            </button>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {distributors.map((d) => {
              const checked = selectedChatIds.includes(d.id);
              const disabled = !checked && selectedChatIds.length >= 7;
              return (
                <button
                  key={d.id}
                  onClick={() => toggleChat(d.id)}
                  disabled={disabled}
                  className={`w-full text-left px-3 py-2 rounded-2xl border ${
                    checked ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-700'
                  } ${disabled ? 'opacity-40' : ''}`}
                >
                  <div className="font-semibold">{d.name}</div>
                  <div className="text-[12px] text-gray-500">Chat ID: {d.telegramChatId || '—'}</div>
                </button>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
};

const FacilityManager: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const filteredFacilities = facilities.filter((facility) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      facility.name.toLowerCase().includes(term) ||
      (facility.address || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 pb-24">
      <ManagerHeader title="Объекты" subtitle="Подтверждение точек" onBack={onBack} />

      <input
        placeholder="Поиск по названию или адресу"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-white p-3 rounded-2xl border border-gray-200 font-medium"
      />

      {loading ? (
        <SkeletonList count={3} />
      ) : filteredFacilities.length === 0 ? (
        <EmptyState text="Объекты отсутствуют" />
      ) : (
        <div className="space-y-3">
          {filteredFacilities.map((facility) => (
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
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    apiClient
      .get<Visit[]>('/api/visits')
      .then((res) => setVisits(res.data || []))
      .catch(() => toast.error('Не удалось загрузить визиты'))
      .finally(() => setLoading(false));
  }, []);

  const exportActivity = () => {
    const params = new URLSearchParams();
    if (fromDate) params.append('from', fromDate);
    if (toDate) params.append('to', toDate);
    const qs = params.toString();
    window.open(`/api/reports/visits${qs ? `?${qs}` : ''}`, '_blank');
  };

  const filteredVisits = useMemo(() => {
    if (!fromDate && !toDate) return visits;
    return visits.filter((visit) => {
      const date = new Date(visit.date).toISOString().slice(0, 10);
      if (fromDate && date < fromDate) return false;
      if (toDate && date > toDate) return false;
      return true;
    });
  }, [visits, fromDate, toDate]);

  return (
    <div className="space-y-6 pb-24">
      <ManagerHeader title="Журнал визитов" subtitle="Отчеты" onBack={onBack} />
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="text-xs font-semibold text-gray-500">Диапазон дат для выгрузки</div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full bg-[#F5F5F7] border border-gray-200 rounded-2xl p-2 text-sm font-medium"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full bg-[#F5F5F7] border border-gray-200 rounded-2xl p-2 text-sm font-medium"
          />
        </div>
      </div>
      <button
        onClick={exportActivity}
        className="w-full py-3 bg-black text-white rounded-3xl font-semibold flex items-center justify-center gap-2 shadow-md"
      >
        <Download size={18} strokeWidth={2} /> Выгрузить Excel
      </button>

      {loading ? (
        <SkeletonList count={3} />
      ) : filteredVisits.length === 0 ? (
        <EmptyState text="Отчеты отсутствуют" />
      ) : (
        <div className="space-y-3">
          {filteredVisits.map((visit) => (
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
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    apiClient
      .get<Order[]>('/api/orders')
      .then((res) => setOrders(res.data || []))
      .catch(() => toast.error('Не удалось загрузить заказы'))
      .finally(() => setLoading(false));
  }, []);

  const exportOrders = () => {
    const params = new URLSearchParams();
    if (fromDate) params.append('from', fromDate);
    if (toDate) params.append('to', toDate);
    const qs = params.toString();
    window.open(`/api/samples/export${qs ? `?${qs}` : ''}`, '_blank');
  };

  const filteredOrders = useMemo(() => {
    if (!fromDate && !toDate) return orders;
    return orders.filter((order) => {
      const dateRaw = (order as any).createdAt || '';
      if (!dateRaw) return true;
      const date = new Date(dateRaw).toISOString().slice(0, 10);
      if (fromDate && date < fromDate) return false;
      if (toDate && date > toDate) return false;
      return true;
    });
  }, [orders, fromDate, toDate]);

  return (
    <div className="space-y-6 pb-24">
      <ManagerHeader title="Заказы" subtitle="История" onBack={onBack} />
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="text-xs font-semibold text-gray-500">Диапазон дат для выгрузки</div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full bg-[#F5F5F7] border border-gray-200 rounded-2xl p-2 text-sm font-medium"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full bg-[#F5F5F7] border border-gray-200 rounded-2xl p-2 text-sm font-medium"
          />
        </div>
      </div>
      <button
        onClick={exportOrders}
        className="w-full py-3 bg-black text-white rounded-3xl font-semibold flex items-center justify-center gap-2 shadow-md"
      >
        <Download size={18} strokeWidth={2} /> Экспорт в Excel
      </button>

      {loading ? (
        <SkeletonList count={3} />
      ) : filteredOrders.length === 0 ? (
        <EmptyState text="Заказы отсутствуют" />
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [readTime, setReadTime] = useState('');
  const [importance, setImportance] = useState(0);
  const [content, setContent] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<Post[]>('/api/posts');
      setPosts(res.data || []);
    } catch {
      toast.error('Не удалось загрузить контент');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingPost(null);
    setTitle('');
    setCategory('');
    setImageUrl('');
    setReadTime('');
    setImportance(0);
    setContent('');
    setIsModalOpen(true);
  };

  const openEdit = (post: Post) => {
    setEditingPost(post);
    setTitle(post.title || '');
    setCategory(post.category || '');
    setImageUrl((post as any).imageUrl || '');
    setReadTime((post as any).readTime || '');
    setImportance((post as any).importance || 0);
    setContent((post as any).content || '');
    setIsModalOpen(true);
  };

  const savePost = async () => {
    if (!title.trim()) {
      toast.error('Введите заголовок');
      return;
    }
    const payload = {
      title: title.trim(),
      category: category.trim() || 'KNOWLEDGE',
      imageUrl: imageUrl.trim() || undefined,
      readTime: readTime.trim() || undefined,
      importance,
      content,
    };
    try {
      if (editingPost) {
        await apiClient.patch(`/api/posts/${editingPost.id}`, payload);
        toast.success('Раздел обновлен');
      } else {
        await apiClient.post('/api/posts', payload);
        toast.success('Раздел создан');
      }
      setIsModalOpen(false);
      load();
    } catch {
      toast.error('Не удалось сохранить');
    }
  };

  const deletePost = async (id: number) => {
    if (!window.confirm('Удалить раздел?')) return;
    try {
      await apiClient.delete(`/api/posts/${id}`);
      toast.success('Удалено');
      load();
    } catch {
      toast.error('Не удалось удалить');
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <ManagerHeader title="Контент" subtitle="База знаний" onBack={onBack} />
      <button
        onClick={openCreate}
        className="w-full bg-black text-white rounded-2xl py-3 font-semibold text-sm"
      >
        + Добавить раздел
      </button>
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
              action={
                <button
                  onClick={() => openEdit(post)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  aria-label="Редактировать"
                >
                  <Pencil size={16} strokeWidth={2} />
                </button>
              }
              icon={BookOpen}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <Modal
          title={editingPost ? 'Редактировать раздел' : 'Новый раздел'}
          onClose={() => setIsModalOpen(false)}
          action={
            <div className="flex flex-col gap-2">
              {editingPost && (
                <button
                  onClick={() => deletePost(editingPost.id)}
                  className="w-full bg-white border border-gray-200 text-red-600 rounded-2xl py-3 font-semibold"
                >
                  Удалить раздел
                </button>
              )}
              <button
                onClick={savePost}
                className="w-full bg-black text-white py-3 rounded-2xl font-semibold"
              >
                Сохранить
              </button>
            </div>
          }
        >
          <input
            placeholder="Заголовок"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#F5F5F7] p-3 rounded-2xl border border-gray-100 font-medium"
          />
          <input
            placeholder="Категория (например KNOWLEDGE)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-[#F5F5F7] p-3 rounded-2xl border border-gray-100 font-medium"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="Read time (например 5 мин)"
              value={readTime}
              onChange={(e) => setReadTime(e.target.value)}
              className="w-full bg-[#F5F5F7] p-3 rounded-2xl border border-gray-100 font-medium"
            />
            <input
              type="number"
              placeholder="Важность (0-10)"
              value={importance}
              onChange={(e) => setImportance(Number(e.target.value))}
              className="w-full bg-[#F5F5F7] p-3 rounded-2xl border border-gray-100 font-medium"
            />
          </div>
          <input
            placeholder="Image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full bg-[#F5F5F7] p-3 rounded-2xl border border-gray-100 font-medium"
          />
          <textarea
            placeholder="Контент (markdown / текст)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="w-full bg-[#F5F5F7] p-3 rounded-2xl border border-gray-100 font-medium"
          />
        </Modal>
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
  const navigate = useNavigate();

  useEffect(() => {
    if (!isUnlocked) return;

    const handleBack = () => {
      if (view !== 'menu') {
        setView('menu');
        WebApp.HapticFeedback?.impactOccurred('light');
        return;
      }
      navigate(-1);
    };

    try {
      WebApp.BackButton?.onClick?.(handleBack);
      WebApp.BackButton?.show?.();
    } catch (e) {
      console.warn('Admin back handler error', e);
    }

    return () => {
      try {
        WebApp.BackButton?.offClick?.(handleBack);
      } catch (e) {
        console.warn('Admin back handler cleanup error', e);
      }
    };
  }, [isUnlocked, view, navigate]);

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
