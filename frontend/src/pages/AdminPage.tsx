import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { StandardCard } from '../components/ui/StandardCard';
import { LockScreen } from '../components/LockScreen'; // <--- ИСПРАВЛЕНО: Добавил { }
import apiClient from '../api/apiClient';
import {
    Users, Package, DollarSign,
    X, Trash2, Plus, ChevronDown, ChevronUp,
    Building2, CheckCircle, ShoppingBag, Download, BookOpen, Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- ТИПЫ ДАННЫХ ---
interface Product {
    id: number;
    line: string;
    flavor: string;
    price: number;
    isTopFlavor: boolean;
}

interface User {
    id: number;
    name: string;
    telegramId: string;
    chatId?: string;
    role?: string;
}

// --- КОМПОНЕНТЫ УПРАВЛЕНИЯ ---

// 1. МЕНЕДЖЕР ТОВАРОВ (Логика: Линейка -> Вкусы)
const ProductManager = ({ onBack }: { onBack: () => void }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    // Состояние формы добавления
    const [isCreating, setIsCreating] = useState(false);
    const [newLine, setNewLine] = useState('');
    const [selectedLine, setSelectedLine] = useState('');
    const [newFlavor, setNewFlavor] = useState('');
    const [newPrice, setNewPrice] = useState(2500);

    // Раскрытые линейки
    const [expandedLines, setExpandedLines] = useState<Record<string, boolean>>({});

    useEffect(() => { loadProducts(); }, []);

    const loadProducts = () => {
        setLoading(true);
        apiClient.get('/api/products')
            .then(res => setProducts(res.data || []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    // Группировка
    const lines = useMemo(() => {
        const groups: Record<string, Product[]> = {};
        products.forEach(p => {
            if (!groups[p.line]) groups[p.line] = [];
            groups[p.line].push(p);
        });
        return groups;
    }, [products]);

    const handleAddProduct = async () => {
        const lineToUse = selectedLine === 'NEW' ? newLine : selectedLine;
        if (!lineToUse || !newFlavor) return alert("Заполните линейку и вкус");

        try {
            await apiClient.post('/api/products', {
                line: lineToUse,
                flavor: newFlavor,
                price: Number(newPrice),
                category: 'Tobacco',
                isTopFlavor: false // По умолчанию false при быстром создании
            });
            setIsCreating(false);
            setNewLine('');
            setNewFlavor('');
            loadProducts();
        } catch (e) {
            alert("Ошибка при создании");
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Удалить этот вкус?")) {
            await apiClient.delete(`/api/products/${id}`);
            loadProducts();
        }
    };

    const toggleLine = (line: string) => {
        setExpandedLines(prev => ({ ...prev, [line]: !prev[line] }));
    };

    return (
        <div className="pb-32 px-4 space-y-3 pt-2">
            <PageHeader title="Товары" rightAction={<button onClick={onBack}>Закрыть</button>} />

            <button
                onClick={() => setIsCreating(true)}
                className="w-full py-3 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
            >
                <Plus size={20} /> Добавить вкус
            </button>

            {loading ? <div className="text-center py-10">Загрузка...</div> : Object.entries(lines).map(([line, items]) => (
                <div key={line} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div
                        onClick={() => toggleLine(line)}
                        className="p-4 flex items-center justify-between bg-gray-50 cursor-pointer active:bg-gray-100"
                    >
                        <div className="font-bold text-lg">{line} <span className="text-gray-400 text-sm font-normal">({items.length})</span></div>
                        {expandedLines[line] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>

                    {expandedLines[line] && (
                        <div className="p-2 space-y-1">
                            {items.map(p => (
                                <div key={p.id} className="flex justify-between items-center p-3 bg-white border-b border-gray-100 last:border-0">
                                    <div>
                                        <div className="font-medium">{p.flavor}</div>
                                        <div className="text-xs text-gray-400">{p.price} ₽</div>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            await apiClient.patch(`/api/products/${p.id}`, { isTopFlavor: !p.isTopFlavor });
                                            loadProducts();
                                        }}
                                        className={`px-2 py-1 rounded text-[10px] font-bold ${p.isTopFlavor ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'}`}
                                    >
                                        {p.isTopFlavor ? 'TOP' : 'SET TOP'}
                                    </button>
                                    <button onClick={() => handleDelete(p.id)} className="p-2 text-red-400 hover:text-red-600">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}

            {/* Модалка создания */}
            {isCreating && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold">Новый продукт</h3>
                            <button onClick={() => setIsCreating(false)}><X size={24} /></button>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-400 ml-1">Линейка</label>
                            <select
                                value={selectedLine}
                                onChange={e => setSelectedLine(e.target.value)}
                                className="w-full bg-gray-50 p-3 rounded-xl mt-1 border border-gray-200"
                            >
                                <option value="" disabled>Выберите линейку</option>
                                {Object.keys(lines).map(l => <option key={l} value={l}>{l}</option>)}
                                <option value="NEW">+ Создать новую...</option>
                            </select>
                        </div>

                        {selectedLine === 'NEW' && (
                            <input
                                placeholder="Название новой линейки"
                                value={newLine}
                                onChange={e => setNewLine(e.target.value)}
                                className="w-full bg-white border-2 border-black p-3 rounded-xl font-bold"
                            />
                        )}

                        <div>
                            <label className="text-xs font-bold text-gray-400 ml-1">Вкус</label>
                            <input
                                placeholder="Например: Cherry Cola"
                                value={newFlavor}
                                onChange={e => setNewFlavor(e.target.value)}
                                className="w-full bg-gray-50 p-3 rounded-xl mt-1 border border-gray-200"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-400 ml-1">Цена (₽)</label>
                            <input
                                type="number"
                                value={newPrice}
                                onChange={e => setNewPrice(Number(e.target.value))}
                                className="w-full bg-gray-50 p-3 rounded-xl mt-1 border border-gray-200"
                            />
                        </div>

                        <button onClick={handleAddProduct} className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg">
                            Сохранить
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// 2. МЕНЕДЖЕР ЦЕН
const PriceManager = ({ onBack }: { onBack: () => void }) => {
    const [prices, setPrices] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/api/products').then(res => {
            const temp: Record<string, number> = {};
            (res.data || []).forEach((p: Product) => {
                if (!temp[p.line]) temp[p.line] = p.price;
            });
            setPrices(temp);
            setLoading(false);
        });
    }, []);

    const savePrice = async (line: string, price: number) => {
        try {
            await apiClient.post('/api/products/lines/update-price', { line, price });
            alert(`Цена для ${line} обновлена!`);
        } catch (e) {
            alert("Ошибка сохранения");
        }
    };

    return (
        <div className="pb-32 px-4 space-y-3 pt-2">
            <PageHeader title="Цены (по линейкам)" rightAction={<button onClick={onBack}>Закрыть</button>} />

            {loading ? <div className="text-center">Загрузка...</div> : Object.entries(prices).map(([line, price]) => (
                <StandardCard key={line} title={line} icon={DollarSign}>
                    <div className="flex gap-2 mt-2">
                        <input
                            type="number"
                            defaultValue={price}
                            onBlur={(e) => savePrice(line, Number(e.target.value))}
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-2 font-bold text-center"
                        />
                        <div className="flex items-center justify-center bg-gray-100 rounded-xl w-10 text-gray-500">
                            ₽
                        </div>
                    </div>
                </StandardCard>
            ))}
        </div>
    );
};

// 3. МЕНЕДЖЕР СОТРУДНИКОВ
const UserManager = ({ onBack }: { onBack: () => void }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newUser, setNewUser] = useState<Partial<User>>({});

    useEffect(() => { loadUsers(); }, []);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/api/users');
            setUsers(res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!newUser.name || !newUser.telegramId) return alert("Имя и ID обязательны");
        try {
            await apiClient.post('/api/users', {
                fullName: newUser.name,
                telegramId: String(newUser.telegramId),
                role: newUser.role || 'AMBASSADOR'
            });
            setIsCreating(false);
            setNewUser({});
            loadUsers();
        } catch (e) {
            alert("Ошибка сохранения");
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Удалить сотрудника?")) return;
        try {
            await apiClient.delete(`/api/users/${id}`);
            loadUsers();
        } catch (e) {
            alert("Ошибка удаления");
        }
    };

    return (
        <div className="pb-32 px-4 space-y-3 pt-2">
            <PageHeader title="Команда" rightAction={<button onClick={onBack}>Закрыть</button>} />

            <button
                onClick={() => setIsCreating(true)}
                className="w-full py-4 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg mb-4 active:scale-95 transition-transform"
            >
                <Plus size={20} /> Добавить сотрудника
            </button>

            {loading ? <div className="text-center py-10 text-gray-400">Загрузка...</div> : (
                <div className="space-y-3">
                    {users.map(u => (
                        <StandardCard
                            key={u.id}
                            title={u.name || (u as any).fullName}
                            subtitle={u.role || 'Сотрудник'}
                            icon={Users}
                            action={
                                <button onClick={() => handleDelete(u.id)} className="p-2 text-red-400">
                                    <Trash2 size={16} />
                                </button>
                            }
                        >
                            <div className="text-[11px] font-mono text-gray-400 mt-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                <div className="flex justify-between"><span>TG ID:</span> <span>{u.telegramId}</span></div>
                                <div className="flex justify-between"><span>XP:</span> <span>{(u as any).xp || 0}</span></div>
                            </div>
                        </StandardCard>
                    ))}
                    {users.length === 0 && <div className="text-center text-gray-400 py-10">Сотрудники не найдены</div>}
                </div>
            )}

            {isCreating && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-xl">Новый сотрудник</h3>
                            <button onClick={() => setIsCreating(false)}><X size={24} /></button>
                        </div>

                        <div className="space-y-3">
                            <input placeholder="Полное имя" className="w-full bg-gray-50 p-3.5 rounded-xl border border-gray-100 font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                                onChange={e => setNewUser({ ...newUser, name: e.target.value })} />

                            <input placeholder="Telegram ID (чифры)" className="w-full bg-gray-50 p-3.5 rounded-xl border border-gray-100 font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                                onChange={e => setNewUser({ ...newUser, telegramId: e.target.value })} />

                            <select className="w-full bg-gray-50 p-3.5 rounded-xl border border-gray-100 font-medium outline-none focus:ring-2 focus:ring-blue-500/20"
                                onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                <option value="AMBASSADOR">Амбассадор</option>
                                <option value="ADMIN">Админ</option>
                            </select>
                        </div>

                        <button onClick={handleSave} className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg shadow-lg">
                            Сохранить
                        </button>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

// 4. МЕНЕДЖЕР ОБЪЕКТОВ
const FacilityManager = ({ onBack }: { onBack: () => void }) => {
    const [facilities, setFacilities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadFacilities(); }, []);

    const loadFacilities = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('/api/facilities');
            setFacilities(res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Удалить объект?")) return;
        try {
            await apiClient.delete(`/api/facilities/${id}`);
            loadFacilities();
        } catch (e) {
            alert("Ошибка удаления");
        }
    };

    return (
        <div className="pb-32 px-4 space-y-3 pt-2">
            <PageHeader title="Объекты" rightAction={<button onClick={onBack}>Закрыть</button>} />

            {loading ? <div className="text-center py-10">Загрузка...</div> : facilities.map(f => (
                <StandardCard key={f.id} title={f.name} subtitle={f.address} icon={Building2}
                    action={
                        <button onClick={() => handleDelete(f.id)} className="p-2 text-red-400">
                            <Trash2 size={16} />
                        </button>
                    }
                />
            ))}
        </div>
    );
};

// 5. ЖУРНАЛ ОТЧЕТОВ
const ReportsManager = ({ onBack }: { onBack: () => void }) => {
    const [visits, setVisits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/api/visits')
            .then(res => setVisits(res.data || []))
            .finally(() => setLoading(false));
    }, []);

    const exportActivity = () => {
        window.open(`${apiClient.defaults.baseURL}/api/reports/visits`, '_blank');
    };

    return (
        <div className="pb-32 px-4 space-y-3 pt-2">
            <PageHeader title="Журнал визитов" rightAction={<button onClick={onBack}>Закрыть</button>} />

            <button
                onClick={exportActivity}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg mb-4 active:scale-95 transition-transform"
            >
                <Download size={20} /> Выгрузить Excel (Активность)
            </button>

            {loading ? <div className="text-center py-10">Загрузка...</div> : visits.map(v => (
                <StandardCard
                    key={v.id}
                    title={v.facility?.name || 'Объект'}
                    subtitle={`${new Date(v.date).toLocaleDateString()} • ${v.type}`}
                    icon={CheckCircle}
                >
                    <div className="text-[11px] text-gray-400 mt-2">
                        Амбассадор: <b>{v.user?.fullName || '—'}</b>
                        {v.comment && <div className="mt-1 italic">"{v.comment}"</div>}
                    </div>
                </StandardCard>
            ))}
        </div>
    );
};

// 7. МЕНЕДЖЕР БАЗЫ ЗНАНИЙ
const KnowledgeManager = ({ onBack }: { onBack: () => void }) => {
    const [posts, setPosts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/api/posts')
            .then(res => setPosts(res.data || []))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="pb-32 px-4 space-y-3 pt-2">
            <PageHeader title="Контент" rightAction={<button onClick={onBack}>Закрыть</button>} />

            <button className="w-full py-4 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 mb-4">
                <Plus size={20} /> Написать статью
            </button>

            {loading ? <div className="text-center py-10">Загрузка...</div> : posts.map(p => (
                <StandardCard
                    key={p.id}
                    title={p.title}
                    subtitle={p.category || 'Общее'}
                    icon={BookOpen}
                    action={<button className="p-2 text-gray-400"><Trash2 size={16} /></button>}
                />
            ))}
        </div>
    );
};

// 6. УПРАВЛЕНИЕ ЗАКАЗАМИ
const SampleOrdersManager = ({ onBack }: { onBack: () => void }) => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/api/orders')
            .then(res => setOrders(res.data || []))
            .finally(() => setLoading(false));
    }, []);

    const exportSamples = () => {
        window.open(`${apiClient.defaults.baseURL}/api/samples/export`, '_blank');
    };

    return (
        <div className="pb-32 px-4 space-y-3 pt-2">
            <PageHeader title="Заказы" rightAction={<button onClick={onBack}>Закрыть</button>} />

            <button
                onClick={exportSamples}
                className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg mb-4 active:scale-95 transition-transform"
            >
                <Download size={20} /> Экспорт в Excel (Пробники)
            </button>

            {loading ? <div className="text-center py-10">Загрузка...</div> : orders.map(o => (
                <StandardCard
                    key={o.id}
                    title={`Заказ #${o.id}`}
                    subtitle={o.facility?.name || 'Заказ пробников'}
                    icon={ShoppingBag}
                    action={
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${o.status === 'PENDING' ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-500'
                            }`}>
                            {o.status}
                        </span>
                    }
                >
                    <div className="text-[11px] text-gray-400 mt-2">
                        Амбассадор: <b>{o.user?.fullName || '—'}</b>
                        <div className="mt-1">{new Date(o.createdAt).toLocaleString()}</div>
                    </div>
                </StandardCard>
            ))}
            {orders.length === 0 && !loading && <div className="text-center text-gray-400 py-10">Заказов пока нет</div>}
        </div>
    );
};

// 8. МЕНЕДЖЕР ДИСТРИБЬЮТОРОВ
const DistributorManager = ({ onBack }: { onBack: () => void }) => {
    const [distributors, setDistributors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/api/distributors')
            .then(res => setDistributors(res.data || []))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="pb-32 px-4 space-y-3 pt-2">
            <PageHeader title="Дистрибьюторы" rightAction={<button onClick={onBack}>Закрыть</button>} />

            <button className="w-full py-4 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 mb-4">
                <Plus size={20} /> Добавить партнера
            </button>

            {loading ? <div className="text-center py-10">Загрузка...</div> : distributors.map(d => (
                <StandardCard
                    key={d.id}
                    title={d.name}
                    subtitle={d.address || 'Адрес не указан'}
                    icon={Truck}
                    action={<button className="p-2 text-gray-400"><Trash2 size={16} /></button>}
                >
                    <div className="text-[10px] font-mono text-gray-400 mt-2">Chat ID: {d.chatId || '—'}</div>
                </StandardCard>
            ))}
        </div>
    );
};

// --- ГЛАВНЫЙ ЭКРАН АДМИНКИ ---

const AdminPage: React.FC = () => {
    const [view, setView] = useState<'menu' | 'products' | 'prices' | 'users' | 'facilities' | 'reports' | 'orders' | 'posts' | 'distributors'>('menu');
    const [isUnlocked, setIsUnlocked] = useState(false);

    if (!isUnlocked) {
        return <LockScreen onSuccess={() => setIsUnlocked(true)} />;
    }

    return (
        <Layout>
            <div className="min-h-screen bg-[#F8F9FE]">
                <AnimatePresence mode="wait">
                    {view === 'menu' && (
                        <motion.div
                            key="menu"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="px-4 pb-32 pt-2"
                        >
                            <PageHeader title="Управление" />

                            <div className="space-y-3 mt-4">
                                <h3 className="text-xs font-bold text-gray-400 uppercase ml-1 mb-2">Контент</h3>

                                <StandardCard
                                    title="Товары и Вкусы"
                                    subtitle="Редактировать каталог"
                                    icon={Package}
                                    onClick={() => setView('products')}
                                    showArrow={true}
                                />

                                <StandardCard
                                    title="Цены линеек"
                                    subtitle="Массовое изменение"
                                    icon={DollarSign}
                                    onClick={() => setView('prices')}
                                    showArrow={true}
                                />

                                <StandardCard
                                    title="База Знаний"
                                    subtitle="Статьи и обучение"
                                    icon={BookOpen}
                                    onClick={() => setView('posts')}
                                    showArrow={true}
                                />

                                <h3 className="text-xs font-bold text-gray-400 uppercase ml-1 mb-2 mt-6">Операционка</h3>

                                <StandardCard
                                    title="Амбассадоры"
                                    subtitle="Команда и доступы"
                                    icon={Users}
                                    onClick={() => setView('users')}
                                    showArrow={true}
                                />

                                <StandardCard
                                    title="База объектов"
                                    subtitle="Управление точками"
                                    icon={Building2}
                                    onClick={() => setView('facilities')}
                                    showArrow={true}
                                />

                                <StandardCard
                                    title="Журнал визитов"
                                    subtitle="Все отчеты с полей"
                                    icon={CheckCircle}
                                    onClick={() => setView('reports')}
                                    showArrow={true}
                                />

                                <StandardCard
                                    title="Дистрибьюторы"
                                    subtitle="Партнеры и логистика"
                                    icon={Truck}
                                    onClick={() => setView('distributors')}
                                    showArrow={true}
                                />

                                <StandardCard
                                    title="Заказы пробников"
                                    subtitle="История заявок"
                                    icon={ShoppingBag}
                                    onClick={() => setView('orders')}
                                    showArrow={true}
                                />
                            </div>
                        </motion.div>
                    )}

                    {view === 'products' && <ProductManager onBack={() => setView('menu')} />}
                    {view === 'prices' && <PriceManager onBack={() => setView('menu')} />}
                    {view === 'users' && <UserManager onBack={() => setView('menu')} />}
                    {view === 'facilities' && <FacilityManager onBack={() => setView('menu')} />}
                    {view === 'reports' && <ReportsManager onBack={() => setView('menu')} />}
                    {view === 'orders' && <SampleOrdersManager onBack={() => setView('menu')} />}
                    {view === 'posts' && <KnowledgeManager onBack={() => setView('menu')} />}
                    {view === 'distributors' && <DistributorManager onBack={() => setView('menu')} />}

                </AnimatePresence>
            </div>
        </Layout>
    );
};

export default AdminPage;