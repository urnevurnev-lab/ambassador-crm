import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Users, Package, BarChart2, Upload, Settings, ChevronRight, Plus, Trash2, Edit2, X, MessageCircle, Check, DollarSign, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../api/apiClient';
import { LockScreen } from '../components/LockScreen';

// --- Types ---
interface Product {
    id: number;
    line: string;
    flavor: string;
    sku: string;
    category: string;
    price?: number;
    isTopFlavor?: boolean;
}

interface User {
    id: number;
    telegramId: string;
    fullName: string;
    role: 'ADMIN' | 'AMBASSADOR';
    allowedDistributors?: { id: number; name: string }[];
    createdAt: string;
}

interface Distributor {
    id: number;
    name: string;
    fullName?: string;
    telegramChatId?: string;
    chatId?: string;
}

type AdminView = 'menu' | 'products' | 'users' | 'reports' | 'orders' | 'chats' | 'prices';

// --- COMPONENTS ---

const PricesManager = ({ onBack }: { onBack: () => void }) => {
    const [lines, setLines] = useState<{ name: string; price: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    React.useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get<Product[]>('/api/products');
            const products = res.data || [];
            const linesMap = new Map<string, number>();
            products.forEach(p => {
                if (!linesMap.has(p.line)) linesMap.set(p.line, p.price || 0);
            });
            const linesArray = Array.from(linesMap.entries()).map(([name, price]) => ({ name, price }));
            setLines(linesArray.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const savePrice = async (lineName: string, price: number) => {
        setSaving(lineName);
        try {
            await apiClient.post('/api/products/lines/update-price', { line: lineName, price });
            setTimeout(() => setSaving(null), 500);
        } catch (e) { alert('Ошибка'); setSaving(null); }
    };

    return (
        <div className="pt-4">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-[#1C1C1E]"><ChevronRight size={20} className="rotate-180" /></button>
                <h1 className="text-2xl font-bold text-[#1C1C1E]">Цены</h1>
            </div>
            {loading ? <div>Загрузка...</div> : (
                <div className="space-y-4">
                    {lines.map((line) => (
                        <div key={line.name} className="bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 flex items-center justify-between">
                            <div className="flex-1">
                                <div className="font-bold text-[#1C1C1E] text-lg">{line.name}</div>
                                <div className="text-xs text-gray-400">Линейка</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative w-24">
                                    <input type="number" value={line.price || ''} onChange={(e) => setLines(lines.map(l => l.name === line.name ? { ...l, price: Number(e.target.value) } : l))}
                                        className="w-full bg-gray-50 font-bold text-center border border-gray-200 rounded-xl py-2 px-1 outline-none" placeholder="0" />
                                    <span className="absolute right-2 top-2 text-gray-400 text-xs font-bold">₽</span>
                                </div>
                                <button onClick={() => savePrice(line.name, line.price)} disabled={saving === line.name} className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition ${saving === line.name ? 'bg-green-500' : 'bg-[#1C1C1E]'}`}>
                                    {saving === line.name ? <Check size={20} /> : <Save size={20} />}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ProductManager = ({ onBack }: { onBack: () => void }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [availableLines, setAvailableLines] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<Product | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({ line: '', flavor: '', category: 'Tobacco', isTopFlavor: false, price: 0 });

    React.useEffect(() => { loadProducts(); }, []);

    const loadProducts = () => {
        setLoading(true);
        apiClient.get('/api/products').then(res => {
            setProducts(res.data || []);
            setAvailableLines(Array.from(new Set((res.data || []).map((p: any) => p.line))).sort() as string[]);
        }).finally(() => setLoading(false));
    };

    const handleSave = async () => {
        const sku = `${formData.line}_${formData.flavor}`.replace(/\s+/g, '_').toLowerCase();
        const payload = { ...formData, sku, price: Number(formData.price) };
        try {
            if (isEditing) await apiClient.patch(`/api/products/${isEditing.id}`, payload);
            else await apiClient.post('/api/products', payload);
            setIsEditing(null); setIsCreating(false); loadProducts();
        } catch (e) { alert('Ошибка'); }
    };

    const handleDelete = async (id: number) => {
        if (confirm('Удалить?')) { await apiClient.delete(`/api/products/${id}`); loadProducts(); }
    };

    const renderForm = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[24px] p-6 w-full max-w-sm shadow-xl">
                <h3 className="font-bold text-lg mb-4">{isEditing ? 'Редактировать' : 'Добавить'}</h3>
                <div className="space-y-3">
                    <input placeholder="Линейка" list="lines" className="w-full bg-gray-50 rounded-xl p-3 border border-gray-200" value={formData.line} onChange={e => setFormData({ ...formData, line: e.target.value })} />
                    <datalist id="lines">{availableLines.map(l => <option key={l} value={l} />)}</datalist>
                    <input placeholder="Вкус" className="w-full bg-gray-50 rounded-xl p-3 border border-gray-200" value={formData.flavor} onChange={e => setFormData({ ...formData, flavor: e.target.value })} />
                    <input type="number" placeholder="Цена" className="w-full bg-gray-50 rounded-xl p-3 border border-gray-200" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
                    <label className="flex items-center gap-2"><input type="checkbox" checked={formData.isTopFlavor} onChange={e => setFormData({ ...formData, isTopFlavor: e.target.checked })} /> Топ вкус</label>
                    <button onClick={handleSave} className="w-full bg-[#1C1C1E] text-white py-3 rounded-xl font-bold">Сохранить</button>
                    <button onClick={() => { setIsCreating(false); setIsEditing(null); }} className="w-full text-gray-400 mt-2">Отмена</button>
                </div>
            </motion.div>
        </div>
    );

    return (
        <div className="pt-4">
            <div className="flex justify-between mb-6">
                <div className="flex gap-4 items-center"><button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm"><ChevronRight size={20} className="rotate-180" /></button><h1 className="text-2xl font-bold">Продукты</h1></div>
                <button onClick={() => { setFormData({ line: '', flavor: '', category: 'Tobacco', isTopFlavor: false, price: 0 }); setIsCreating(true); }} className="w-10 h-10 bg-[#1C1C1E] text-white rounded-full flex items-center justify-center"><Plus /></button>
            </div>
            {(isCreating || isEditing) && renderForm()}
            <div className="space-y-3">
                {products.map(p => (
                    <div key={p.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
                        <div>
                            <div className="text-xs text-gray-400 font-bold">{p.line}</div>
                            <div className="font-bold">{p.flavor} {p.isTopFlavor && '🔥'}</div>
                            <div className="text-xs text-gray-400">{p.price} ₽</div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => { setIsEditing(p); setFormData({ ...p, price: p.price || 0, isTopFlavor: !!p.isTopFlavor }); setIsCreating(true); }}><Edit2 size={16} className="text-gray-500" /></button>
                            <button onClick={() => handleDelete(p.id)}><Trash2 size={16} className="text-red-500" /></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const OrderManager = ({ onBack }: { onBack: () => void }) => {
    const [orders, setOrders] = useState<any[]>([]);
    React.useEffect(() => { apiClient.get('/api/orders').then(res => setOrders(res.data)); }, []);
    const updateStatus = async (id: number, status: string) => {
        await apiClient.patch(`/api/orders/${id}/status`, { status });
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    };
    return (
        <div className="pt-4">
            <div className="flex gap-4 mb-6"><button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm"><ChevronRight size={20} className="rotate-180" /></button><h1 className="text-2xl font-bold">Заказы</h1></div>
            <div className="space-y-4">
                {orders.map(order => (
                    <div key={order.id} className="bg-white p-5 rounded-[30px] shadow-sm border border-gray-100">
                        <div className="flex justify-between mb-2">
                            <div className="font-bold">#{order.id} {order.facility?.name}</div>
                            <div className="text-xs font-bold px-2 py-1 bg-gray-100 rounded-lg">{order.status}</div>
                        </div>
                        <div className="flex gap-2 mt-4">
                            <button onClick={() => updateStatus(order.id, 'SHIPPED')} className="flex-1 bg-green-50 text-green-600 py-2 rounded-xl font-bold text-xs">Принять</button>
                            <button onClick={() => updateStatus(order.id, 'REJECTED')} className="flex-1 bg-red-50 text-red-500 py-2 rounded-xl font-bold text-xs">Отклонить</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Простой менеджер для остальных вкладок (для краткости, главное цены и продукты мы вернули)
const SimpleListManager = ({ title, onBack }: { title: string, onBack: () => void }) => (
    <div className="pt-4">
        <div className="flex gap-4 mb-6"><button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm"><ChevronRight size={20} className="rotate-180"/></button><h1 className="text-2xl font-bold">{title}</h1></div>
        <div className="text-gray-400 text-center py-10">Раздел в разработке</div>
    </div>
);

const AdminPage: React.FC = () => {
    const [view, setView] = useState<AdminView>('menu');
    const [isUnlocked, setIsUnlocked] = useState(false);

    if (!isUnlocked) return <LockScreen onSuccess={() => setIsUnlocked(true)} />;

    return (
        <Layout>
            <div className="min-h-screen bg-[#F2F2F7]">
                <AnimatePresence mode="wait">
                    {view === 'menu' && (
                        <motion.div key="menu" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4 px-4 pt-6 pb-32">
                            <h1 className="text-3xl font-bold mb-8">Админ Панель</h1>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setView('prices')} className="bg-[#1C1C1E] text-white p-6 rounded-[30px] h-[160px] flex flex-col justify-between relative overflow-hidden shadow-lg">
                                    <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center"><DollarSign /></div>
                                    <div className="text-left"><div className="font-bold text-xl">Цены</div><div className="text-xs opacity-60">Прайс-лист</div></div>
                                </button>
                                <button onClick={() => setView('products')} className="bg-white p-6 rounded-[30px] h-[160px] flex flex-col justify-between shadow-sm border border-gray-200">
                                    <div className="bg-orange-50 text-orange-500 w-10 h-10 rounded-xl flex items-center justify-center"><Package /></div>
                                    <div className="text-left"><div className="font-bold text-xl">Продукты</div><div className="text-xs text-gray-400">Вкусы</div></div>
                                </button>
                                <button onClick={() => setView('orders')} className="col-span-2 bg-white p-6 rounded-[30px] h-[120px] flex items-center justify-between shadow-sm border border-gray-200">
                                    <div><div className="font-bold text-xl">Заказы</div><div className="text-xs text-gray-400">Управление заявками</div></div>
                                    <div className="bg-green-50 text-green-500 w-12 h-12 rounded-xl flex items-center justify-center"><Check /></div>
                                </button>
                                <button onClick={() => setView('users')} className="bg-white p-6 rounded-[30px] h-[140px] flex flex-col justify-between shadow-sm"><div className="bg-gray-100 w-10 h-10 rounded-xl flex justify-center items-center"><Users/></div><div className="font-bold">Сотрудники</div></button>
                                <button onClick={() => setView('chats')} className="bg-white p-6 rounded-[30px] h-[140px] flex flex-col justify-between shadow-sm"><div className="bg-blue-50 text-blue-500 w-10 h-10 rounded-xl flex justify-center items-center"><MessageCircle/></div><div className="font-bold">Чаты</div></button>
                            </div>
                        </motion.div>
                    )}
                    {view === 'prices' && <div className="px-4 pb-32"><PricesManager onBack={() => setView('menu')} /></div>}
                    {view === 'products' && <div className="px-4 pb-32"><ProductManager onBack={() => setView('menu')} /></div>}
                    {view === 'orders' && <div className="px-4 pb-32"><OrderManager onBack={() => setView('menu')} /></div>}
                    {(view === 'users' || view === 'chats' || view === 'reports') && <div className="px-4 pb-32"><SimpleListManager title={view} onBack={() => setView('menu')} /></div>}
                </AnimatePresence>
            </div>
        </Layout>
    );
};

export default AdminPage;