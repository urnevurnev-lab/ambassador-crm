import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { Users, Package, BarChart2, Upload, Settings, ChevronRight, Plus, Trash2, Edit2, X, MessageCircle, Check, DollarSign, Save } from 'lucide-react'; // Добавил иконки
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
    price?: number; // Добавили цену
    isTopFlavor?: boolean;
}

// --- NEW COMPONENT: Prices Manager ---
const PricesManager = ({ onBack }: { onBack: () => void }) => {
    const [lines, setLines] = useState<{ name: string; price: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

    React.useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get<Product[]>('/api/products');
            const products = res.data || [];
            
            // Группируем, чтобы найти уникальные линейки и их текущую цену
            const linesMap = new Map<string, number>();
            products.forEach(p => {
                if (!linesMap.has(p.line)) {
                    // Берем цену первого встречного товара как цену линейки
                    linesMap.set(p.line, p.price || 0);
                }
            });

            const linesArray = Array.from(linesMap.entries()).map(([name, price]) => ({ name, price }));
            setLines(linesArray.sort((a, b) => a.name.localeCompare(b.name)));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handlePriceChange = (lineName: string, newPrice: string) => {
        setLines(prev => prev.map(l => l.name === lineName ? { ...l, price: Number(newPrice) } : l));
    };

    const savePrice = async (lineName: string, price: number) => {
        setSaving(lineName);
        try {
            await apiClient.post('/api/products/lines/update-price', {
                line: lineName,
                price: price
            });
            // Небольшая задержка для визуального эффекта
            setTimeout(() => setSaving(null), 500);
        } catch (e) {
            alert('Ошибка сохранения');
            setSaving(null);
        }
    };

    return (
        <div className="pt-[20px]">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={onBack}
                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-[#1C1C1E] active:scale-95 transition"
                >
                    <ChevronRight size={20} className="rotate-180" />
                </button>
                <h1 className="text-2xl font-bold text-[#1C1C1E]">Цены</h1>
            </div>

            {loading ? <div className="text-center text-gray-400 py-10">Загрузка...</div> : (
                <div className="space-y-4">
                    <p className="text-sm text-gray-400 px-2 mb-2">Укажите цену за 1 шт. для всей линейки.</p>
                    
                    {lines.map((line) => (
                        <div key={line.name} className="bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 flex items-center justify-between">
                            <div className="flex-1">
                                <div className="font-bold text-[#1C1C1E] text-lg">{line.name}</div>
                                <div className="text-xs text-gray-400">Линейка</div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <div className="relative w-24">
                                    <input
                                        type="number"
                                        value={line.price || ''}
                                        onChange={(e) => handlePriceChange(line.name, e.target.value)}
                                        className="w-full bg-gray-50 font-bold text-center border border-gray-200 rounded-xl py-2 px-1 text-[#1C1C1E] focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-2 top-2 text-gray-400 text-xs font-bold">₽</span>
                                </div>
                                
                                <button 
                                    onClick={() => savePrice(line.name, line.price)}
                                    disabled={saving === line.name}
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm active:scale-95 transition ${saving === line.name ? 'bg-green-500' : 'bg-[#1C1C1E]'}`}
                                >
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

// --- Sub-Components (ProductManager, etc.) ---

const ProductManager = ({ onBack }: { onBack: () => void }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [availableLines, setAvailableLines] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<Product | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({ line: '', flavor: '', category: 'Tobacco', isTopFlavor: false, price: 0 });

    const generateSku = (line: string, flavor: string) => {
        const translit = (str: string) => {
            const ru: Record<string, string> = { 'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'j', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya' };
            return str.toLowerCase().split('').map(char => ru[char] || char).join('').replace(/[^a-z0-9]/g, '_');
        };
        return `${translit(line)}_${translit(flavor)}`;
    };

    React.useEffect(() => { loadProducts(); }, []);

    const loadProducts = () => {
        setLoading(true);
        apiClient.get('/api/products')
            .then(res => {
                const data = res.data || [];
                setProducts(data);
                const lines = Array.from(new Set(data.map((p: Product) => p.line))).filter(Boolean) as string[];
                setAvailableLines(lines.sort());
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Удалить этот вкус?')) return;
        try {
            await apiClient.delete(`/api/products/${id}`);
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (e) {
            alert('Ошибка удаления');
        }
    };

    const handleSave = async () => {
        if (!formData.line || !formData.flavor) {
            alert('Укажите линейку и вкус');
            return;
        }
        try {
            const sku = generateSku(formData.line, formData.flavor);
            const payload = { ...formData, sku, price: Number(formData.price) };
            
            if (isEditing) {
                await apiClient.patch(`/api/products/${isEditing.id}`, payload);
            } else {
                await apiClient.post('/api/products', payload);
            }
            setIsEditing(null);
            setIsCreating(false);
            setFormData({ line: '', flavor: '', category: 'Tobacco', isTopFlavor: false, price: 0 });
            loadProducts();
        } catch (e) {
            alert('Ошибка сохранения');
        }
    };

    const openCreate = () => {
        setFormData({ line: '', flavor: '', category: 'Tobacco', isTopFlavor: false, price: 0 });
        setIsCreating(true);
        setIsEditing(null);
    };

    const openEdit = (p: Product) => {
        setFormData({ 
            line: p.line, 
            flavor: p.flavor, 
            category: p.category, 
            isTopFlavor: !!p.isTopFlavor,
            price: p.price || 0 
        });
        setIsEditing(p);
        setIsCreating(true);
    };

    const renderForm = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[24px] p-6 w-full max-w-sm shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">{isEditing ? 'Редактировать' : 'Добавить вкус'}</h3>
                    <button onClick={() => { setIsCreating(false); setIsEditing(null); }}><X size={20} /></button>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-gray-500 font-bold ml-1">Линейка</label>
                        <div className="flex gap-2">
                             <select
                                value={availableLines.includes(formData.line) ? formData.line : ''}
                                onChange={e => setFormData({ ...formData, line: e.target.value })}
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"
                            >
                                <option value="">Выбрать...</option>
                                {availableLines.map(line => (
                                    <option key={line} value={line}>{line}</option>
                                ))}
                            </select>
                            <input
                                placeholder="Новая..."
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"
                                value={!availableLines.includes(formData.line) ? formData.line : ''}
                                onChange={e => setFormData({ ...formData, line: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 font-bold ml-1">Вкус</label>
                        <input
                            placeholder="Название вкуса"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"
                            value={formData.flavor}
                            onChange={e => setFormData({ ...formData, flavor: e.target.value })}
                        />
                    </div>
                    <div>
                         <label className="text-xs text-gray-500 font-bold ml-1">Цена (₽)</label>
                         <input
                            type="number"
                            placeholder="0"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                        />
                    </div>

                    <label className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={formData.isTopFlavor}
                            onChange={(e) => setFormData({ ...formData, isTopFlavor: e.target.checked })}
                        />
                        <span className="font-semibold">Топ-вкус</span>
                    </label>
                    <button onClick={handleSave} className="w-full bg-[#1C1C1E] text-white font-bold py-3 rounded-xl mt-4">
                        Сохранить
                    </button>
                </div>
            </motion.div>
        </div>
    );

    return (
        <div className="pt-[20px]">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-[#1C1C1E]"><ChevronRight size={20} className="rotate-180" /></button>
                    <h1 className="text-2xl font-bold text-[#1C1C1E]">Продукты</h1>
                </div>
                <button onClick={openCreate} className="w-10 h-10 bg-[#1C1C1E] rounded-full flex items-center justify-center shadow-sm text-white"><Plus size={20} /></button>
            </div>
            {(isCreating || isEditing) && renderForm()}
            {loading ? <div className="text-center text-gray-400">Загрузка...</div> : (
                <div className="space-y-3">
                    {products.map((p) => (
                        <div key={p.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                            <div>
                                <div className="text-xs text-gray-400 font-bold uppercase">{p.line}</div>
                                <div className="flex items-center gap-2">
                                    <div className="font-bold text-[#1C1C1E]">{p.flavor}</div>
                                    {p.isTopFlavor && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">TOP</span>}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">{p.price ? `${p.price} ₽` : '0 ₽'}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => openEdit(p)} className="p-2 bg-gray-100 rounded-lg text-gray-600"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete(p.id)} className="p-2 bg-red-50 rounded-lg text-red-500"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const ReportsManager = ({ onBack }: { onBack: () => void }) => {
    const download = (type: 'visits' | 'orders') => { window.location.href = `${apiClient.defaults.baseURL || ''}/api/reports/${type}`; };
    return (
        <div className="pt-[20px]">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-[#1C1C1E]"><ChevronRight size={20} className="rotate-180" /></button>
                <h1 className="text-2xl font-bold text-[#1C1C1E]">Отчеты</h1>
            </div>
            <div className="space-y-4">
                <motion.button whileTap={{ scale: 0.98 }} onClick={() => download('visits')} className="w-full bg-white p-6 rounded-[30px] border border-gray-200 shadow-sm flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><BarChart2 size={24} /></div>
                        <div className="text-left"><div className="font-bold text-[#1C1C1E] text-lg">Визиты</div><div className="text-xs text-gray-400">Excel</div></div>
                    </div>
                    <Upload size={20} className="text-gray-300 group-hover:text-[#007AFF] transition-colors rotate-180" />
                </motion.button>
                <motion.button whileTap={{ scale: 0.98 }} onClick={() => download('orders')} className="w-full bg-white p-6 rounded-[30px] border border-gray-200 shadow-sm flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center"><Package size={24} /></div>
                        <div className="text-left"><div className="font-bold text-[#1C1C1E] text-lg">Заказы</div><div className="text-xs text-gray-400">Excel</div></div>
                    </div>
                    <Upload size={20} className="text-gray-300 group-hover:text-green-600 transition-colors rotate-180" />
                </motion.button>
            </div>
        </div>
    );
};

const OrderManager = ({ onBack }: { onBack: () => void }) => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    React.useEffect(() => { loadOrders(); }, []);
    const loadOrders = () => { setLoading(true); apiClient.get('/api/orders').then(res => setOrders(res.data)).finally(() => setLoading(false)); };
    const updateStatus = async (id: number, status: string) => { try { await apiClient.patch(`/api/orders/${id}/status`, { status }); setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o)); } catch (e) { alert('Ошибка'); } };
    return (
        <div className="pt-[20px]">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-[#1C1C1E]"><ChevronRight size={20} className="rotate-180" /></button>
                <h1 className="text-2xl font-bold text-[#1C1C1E]">Заказы</h1>
            </div>
            {loading ? <div className="text-center text-gray-400">Загрузка...</div> : (
                <div className="space-y-4">
                    {orders.map(order => (
                        <div key={order.id} className="bg-white p-5 rounded-[30px] border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                                <div><div className="font-bold text-[#1C1C1E]">#{order.id} {order.facility?.name}</div><div className="text-xs text-gray-400">Дист: {order.distributor?.name}</div></div>
                                <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${order.status === 'SHIPPED' ? 'bg-green-100 text-green-700' : order.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{order.status}</div>
                            </div>
                            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
                                <button onClick={() => updateStatus(order.id, 'SHIPPED')} className="flex-1 bg-green-50 text-green-600 py-2 rounded-xl text-xs font-bold">Отгрузить</button>
                                <button onClick={() => updateStatus(order.id, 'REJECTED')} className="flex-1 bg-red-50 text-red-500 py-2 rounded-xl text-xs font-bold">Отменить</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Users & Distributors (Same as before, minimized for brevity but kept functional) ---
// ... (I will keep the UsersManager and DistributorsManager from your file but to save space I assume they are the same.
// ... Wait, to be safe and "Care Mode", I must provide the FULL file content so you can just copy-paste).

// --- Distributors Manager ---
interface Distributor { id: number; name: string; fullName?: string; telegramChatId?: string; chatId?: string; }
const DistributorsManager = ({ onBack }: { onBack: () => void }) => {
    const [distributors, setDistributors] = useState<Distributor[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({ name: '', telegramChatId: '' });
    React.useEffect(() => { loadDistributors(); }, []);
    const loadDistributors = () => { setLoading(true); apiClient.get('/api/distributors').then(res => setDistributors(res.data || [])).finally(() => setLoading(false)); };
    const handleDelete = async (id: number) => { if (!window.confirm('Удалить?')) return; await apiClient.delete(`/api/distributors/${id}`); setDistributors(prev => prev.filter(d => d.id !== id)); };
    const handleSave = async () => { if(!formData.name || !formData.telegramChatId) return alert('Заполните поля'); await apiClient.post('/api/distributors', formData); setIsCreating(false); setFormData({name:'', telegramChatId:''}); loadDistributors(); };
    
    return (
        <div className="pt-[20px]">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4"><button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-[#1C1C1E]"><ChevronRight size={20} className="rotate-180" /></button><h1 className="text-2xl font-bold text-[#1C1C1E]">Чаты</h1></div>
                <button onClick={() => setIsCreating(true)} className="w-10 h-10 bg-[#1C1C1E] rounded-full flex items-center justify-center shadow-sm text-white"><Plus size={20} /></button>
            </div>
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-white rounded-[24px] p-6 w-full max-w-sm">
                        <h3 className="font-bold mb-4">Добавить чат</h3>
                        <input placeholder="Название" className="w-full bg-gray-50 rounded-xl p-3 text-sm mb-3" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} />
                        <input placeholder="Chat ID" className="w-full bg-gray-50 rounded-xl p-3 text-sm mb-3" value={formData.telegramChatId} onChange={e=>setFormData({...formData, telegramChatId:e.target.value})} />
                        <button onClick={handleSave} className="w-full bg-[#1C1C1E] text-white font-bold py-3 rounded-xl">Сохранить</button>
                        <button onClick={()=>setIsCreating(false)} className="w-full mt-2 text-gray-400 text-sm">Отмена</button>
                    </motion.div>
                </div>
            )}
            <div className="space-y-3">
                {distributors.map(d => (
                    <div key={d.id} className="bg-white p-4 rounded-[20px] shadow-sm flex justify-between items-center">
                        <div><div className="font-bold">{d.fullName || d.name}</div><div className="text-xs text-gray-400">{d.telegramChatId || d.chatId}</div></div>
                        <button onClick={()=>handleDelete(d.id)} className="text-red-400"><Trash2 size={16}/></button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- Users Manager ---
interface User { id: number; telegramId: string; fullName: string; role: 'ADMIN' | 'AMBASSADOR'; allowedDistributors?: { id: number; name: string }[]; createdAt: string; }
const UsersManager = ({ onBack }: { onBack: () => void }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({ fullName: '', telegramId: '', role: 'AMBASSADOR' as const });
    const [editingChatsUser, setEditingChatsUser] = useState<User | null>(null);
    const [distributors, setDistributors] = useState<Distributor[]>([]);
    const [selectedChatIds, setSelectedChatIds] = useState<Set<number>>(new Set());

    React.useEffect(() => { 
        setLoading(true); 
        Promise.all([apiClient.get('/api/users'), apiClient.get('/api/distributors')])
            .then(([resUsers, resDists]) => {
                setUsers((resUsers.data || []).filter((u:User) => /^\d+$/.test(String(u.telegramId))));
                setDistributors(resDists.data || []);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleCreate = async () => {
        if(!formData.fullName || !formData.telegramId) return alert('Заполните поля');
        try { await apiClient.post('/api/users', formData); setIsCreating(false); setFormData({fullName:'', telegramId:'', role:'AMBASSADOR'}); 
              const res = await apiClient.get('/api/users'); setUsers((res.data||[]).filter((u:User) => /^\d+$/.test(String(u.telegramId))));
        } catch(e) { alert('Ошибка'); }
    };

    const handleDelete = async (id: number) => { if(!window.confirm('Удалить?')) return; await apiClient.delete(`/api/users/${id}`); setUsers(prev=>prev.filter(u=>u.id!==id)); };

    const saveChats = async () => {
        if (!editingChatsUser) return;
        try {
            await apiClient.post(`/api/users/${editingChatsUser.id}/distributors`, { distributorIds: Array.from(selectedChatIds) });
            const res = await apiClient.get('/api/users');
            setUsers((res.data || []).filter((u:User) => /^\d+$/.test(String(u.telegramId))));
            setEditingChatsUser(null);
        } catch (e) { alert('Ошибка'); }
    };

    const openChats = (u: User) => { setEditingChatsUser(u); setSelectedChatIds(new Set((u.allowedDistributors || []).map(d => d.id))); };
    const toggleChat = (id: number) => { setSelectedChatIds(prev => { const n = new Set(prev); if(n.has(id)) n.delete(id); else n.add(id); return n; }); };

    return (
        <div className="pt-[20px]">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4"><button onClick={onBack} className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-[#1C1C1E]"><ChevronRight size={20} className="rotate-180" /></button><h1 className="text-2xl font-bold text-[#1C1C1E]">Сотрудники</h1></div>
                <button onClick={() => setIsCreating(true)} className="w-10 h-10 bg-[#1C1C1E] rounded-full flex items-center justify-center shadow-sm text-white"><Plus size={20} /></button>
            </div>
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-white rounded-[24px] p-6 w-full max-w-sm">
                        <h3 className="font-bold mb-4">Добавить сотрудника</h3>
                        <input placeholder="Имя" className="w-full bg-gray-50 rounded-xl p-3 text-sm mb-3" value={formData.fullName} onChange={e=>setFormData({...formData, fullName:e.target.value})} />
                        <input placeholder="Telegram ID" className="w-full bg-gray-50 rounded-xl p-3 text-sm mb-3" value={formData.telegramId} onChange={e=>setFormData({...formData, telegramId:e.target.value})} />
                        <select className="w-full bg-gray-50 rounded-xl p-3 text-sm mb-3" value={formData.role} onChange={e=>setFormData({...formData, role:e.target.value as any})}><option value="AMBASSADOR">Амбассадор</option><option value="ADMIN">Админ</option></select>
                        <button onClick={handleCreate} className="w-full bg-[#1C1C1E] text-white font-bold py-3 rounded-xl">Добавить</button>
                        <button onClick={()=>setIsCreating(false)} className="w-full mt-2 text-gray-400 text-sm">Отмена</button>
                    </motion.div>
                </div>
            )}
            <div className="space-y-3">
                {users.map(u => (
                    <div key={u.id} className="bg-white p-4 rounded-[20px] shadow-sm flex justify-between items-start">
                        <div>
                            <div className="font-bold">{u.fullName}</div>
                            <div className="text-xs text-gray-400">ID: {u.telegramId}</div>
                            <button onClick={()=>openChats(u)} className="text-[#007AFF] text-xs font-bold mt-1 flex items-center gap-1"><MessageCircle size={12}/> Чаты</button>
                        </div>
                        <button onClick={()=>handleDelete(u.id)} className="text-red-400"><Trash2 size={16}/></button>
                    </div>
                ))}
            </div>
            {editingChatsUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-white rounded-[24px] p-6 w-full max-w-sm shadow-xl">
                        <h3 className="font-bold mb-2">Чаты: {editingChatsUser.fullName}</h3>
                        <div className="max-h-[50vh] overflow-y-auto space-y-2 mb-4">
                            {distributors.map(d => (
                                <div key={d.id} onClick={()=>toggleChat(d.id)} className={`p-3 rounded-xl border flex justify-between items-center ${selectedChatIds.has(d.id)?'bg-blue-50 border-blue-200':'border-gray-100'}`}>
                                    <span className="text-sm font-bold">{d.fullName||d.name}</span>
                                    {selectedChatIds.has(d.id) && <Check size={16} className="text-[#007AFF]"/>}
                                </div>
                            ))}
                        </div>
                        <button onClick={saveChats} className="w-full bg-[#1C1C1E] text-white font-bold py-3 rounded-xl">Сохранить</button>
                        <button onClick={()=>setEditingChatsUser(null)} className="w-full mt-2 text-gray-400 text-sm">Отмена</button>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

// --- Main Page ---

type AdminView = 'menu' | 'products' | 'users' | 'reports' | 'orders' | 'chats' | 'prices'; // Добавил 'prices'

const AdminPage: React.FC = () => {
    const [view, setView] = useState<AdminView>('menu');
    const [isUnlocked, setIsUnlocked] = useState(false);

    if (!isUnlocked) return <LockScreen onSuccess={() => setIsUnlocked(true)} />;

    const renderMenu = () => (
        <div className="space-y-4 px-4 pt-[calc(env(safe-area-inset-top)+20px)] pb-32">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-[#1C1C1E]">Админ<br />Панель</h1>
                <div className="w-12 h-12 bg-[#1C1C1E] rounded-full flex items-center justify-center text-white"><Settings size={24} /></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                 {/* Reports */}
                 <motion.div whileTap={{ scale: 0.98 }} onClick={() => setView('reports')} className="col-span-2 bg-[#007AFF] rounded-[30px] p-6 h-[140px] shadow-lg flex flex-col justify-between relative overflow-hidden text-white">
                    <div className="absolute top-0 right-0 p-4 opacity-20"><BarChart2 size={100} /></div>
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center"><BarChart2 size={24} /></div>
                    <div><h3 className="text-xl font-bold">Отчеты</h3><p className="text-white/80 text-xs">Excel выгрузки</p></div>
                </motion.div>

                {/* НОВАЯ КНОПКА: Цены (Prices) */}
                <motion.div whileTap={{ scale: 0.98 }} onClick={() => setView('prices')} className="bg-[#1C1C1E] rounded-[30px] p-6 h-[180px] shadow-lg flex flex-col justify-between relative overflow-hidden text-white">
                    <div className="absolute -top-4 -right-4 opacity-10 rotate-12"><DollarSign size={80} /></div>
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center"><DollarSign size={20} /></div>
                    <div><h3 className="text-xl font-bold">Цены</h3><p className="text-white/60 text-xs">Управление прайсом</p></div>
                </motion.div>

                {/* Products */}
                <motion.div whileTap={{ scale: 0.98 }} onClick={() => setView('products')} className="bg-white rounded-[30px] p-6 h-[180px] shadow-sm border border-gray-200 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute -bottom-4 -right-4 opacity-5 text-[#1C1C1E]"><Package size={100} /></div>
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600"><Settings size={20} /></div>
                    <div><h3 className="text-xl font-bold text-[#1C1C1E]">Продукты</h3><p className="text-gray-400 text-xs">Редактор вкусов</p></div>
                </motion.div>

                {/* Orders (Full Width) */}
                <motion.div whileTap={{ scale: 0.98 }} onClick={() => setView('orders')} className="col-span-2 bg-white rounded-[30px] p-6 h-[140px] shadow-sm border border-gray-200 flex flex-col justify-between relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-6 opacity-5"><Package size={100} /></div>
                     <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600"><Package size={20} /></div>
                     <div><h3 className="text-xl font-bold text-[#1C1C1E]">Заказы</h3><p className="text-gray-400 text-xs">Статусы и обработка</p></div>
                </motion.div>

                {/* Users & Chats */}
                <motion.div whileTap={{ scale: 0.98 }} onClick={() => setView('users')} className="bg-white rounded-[30px] p-6 h-[160px] shadow-sm border border-gray-200 flex flex-col justify-between relative overflow-hidden">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600"><Users size={20} /></div>
                    <div><h3 className="text-lg font-bold text-[#1C1C1E]">Сотрудники</h3><p className="text-gray-400 text-xs">Доступ</p></div>
                </motion.div>
                <motion.div whileTap={{ scale: 0.98 }} onClick={() => setView('chats')} className="bg-white rounded-[30px] p-6 h-[160px] shadow-sm border border-gray-200 flex flex-col justify-between relative overflow-hidden">
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><MessageCircle size={20} /></div>
                    <div><h3 className="text-lg font-bold text-[#1C1C1E]">Чаты</h3><p className="text-gray-400 text-xs">Telegram</p></div>
                </motion.div>
            </div>
            <div className="text-center pt-8 text-xs text-gray-300">v1.2.0 Price Update</div>
        </div>
    );

    return (
        <Layout>
            <div className="min-h-screen bg-[#F2F2F7]">
                <AnimatePresence mode="wait">
                    {view === 'menu' && <motion.div key="menu" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>{renderMenu()}</motion.div>}
                    {view === 'prices' && <motion.div key="prices" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="px-4 pb-32"><PricesManager onBack={() => setView('menu')} /></motion.div>}
                    {view === 'products' && <motion.div key="products" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="px-4 pb-32"><ProductManager onBack={() => setView('menu')} /></motion.div>}
                    {view === 'reports' && <motion.div key="reports" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="px-4 pb-32"><ReportsManager onBack={() => setView('menu')} /></motion.div>}
                    {view === 'orders' && <motion.div key="orders" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="px-4 pb-32"><OrderManager onBack={() => setView('menu')} /></motion.div>}
                    {view === 'chats' && <motion.div key="chats" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="px-4 pb-32"><DistributorsManager onBack={() => setView('menu')} /></motion.div>}
                    {view === 'users' && <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="px-4 pb-32"><UsersManager onBack={() => setView('menu')} /></motion.div>}
                </AnimatePresence>
            </div>
        </Layout>
    );
};

export default AdminPage;
