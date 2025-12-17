import React, { useState } from 'react';
import { Layout } from '../components/Layout';

import { Users, Package, BarChart2, Upload, Settings, ChevronRight, Plus, Trash2, Edit2, X, MessageCircle, Check } from 'lucide-react';
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
    isTopFlavor?: boolean;
}

// --- Sub-Components ---

const ProductManager = ({ onBack }: { onBack: () => void }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [availableLines, setAvailableLines] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<Product | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Form State (removed sku - will auto-generate)
    const [formData, setFormData] = useState({ line: '', flavor: '', category: 'Tobacco', isTopFlavor: false });

    // Auto-generate SKU from line + flavor
    const generateSku = (line: string, flavor: string) => {
        const translit = (str: string) => {
            const ru: Record<string, string> = { 'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'j', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya' };
            return str.toLowerCase().split('').map(char => ru[char] || char).join('').replace(/[^a-z0-9]/g, '_');
        };
        return `${translit(line)}_${translit(flavor)}`;
    };

    // Fetch products and extract unique lines
    React.useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = () => {
        setLoading(true);
        apiClient.get('/api/products')
            .then(res => {
                const data = res.data || [];
                setProducts(data);
                // Extract unique lines from existing products
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
            if (isEditing) {
                await apiClient.patch(`/api/products/${isEditing.id}`, { ...formData, sku });
            } else {
                await apiClient.post('/api/products', { ...formData, sku });
            }
            setIsEditing(null);
            setIsCreating(false);
            setFormData({ line: '', flavor: '', category: 'Tobacco', isTopFlavor: false });
            loadProducts();
        } catch (e) {
            alert('Ошибка сохранения');
        }
    };

    const openCreate = () => {
        setFormData({ line: '', flavor: '', category: 'Tobacco', isTopFlavor: false });
        setIsCreating(true);
        setIsEditing(null);
    };

    const openEdit = (p: Product) => {
        setFormData({ line: p.line, flavor: p.flavor, category: p.category, isTopFlavor: !!p.isTopFlavor });
        setIsEditing(p);
        setIsCreating(true);
    };

    // Form Modal
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
                        <select
                            value={formData.line}
                            onChange={e => setFormData({ ...formData, line: e.target.value })}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"
                        >
                            <option value="">Выберите линейку...</option>
                            {availableLines.map(line => (
                                <option key={line} value={line}>{line}</option>
                            ))}
                        </select>
                        {/* Custom line input */}
                        <input
                            placeholder="Или введите новую линейку"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm mt-2"
                            value={!availableLines.includes(formData.line) ? formData.line : ''}
                            onChange={e => setFormData({ ...formData, line: e.target.value })}
                        />
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
                    <label className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            checked={formData.isTopFlavor}
                            onChange={(e) => setFormData({ ...formData, isTopFlavor: e.target.checked })}
                        />
                        <span className="font-semibold">Топ-вкус (подсветка в каталоге)</span>
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
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-[#1C1C1E] active:scale-95 transition"
                    >
                        <ChevronRight size={20} className="rotate-180" />
                    </button>
                    <h1 className="text-2xl font-bold text-[#1C1C1E]">Продукты</h1>
                </div>
                <button onClick={openCreate} className="w-10 h-10 bg-[#1C1C1E] rounded-full flex items-center justify-center shadow-sm text-white active:scale-95 transition">
                    <Plus size={20} />
                </button>
            </div>

            {(isCreating || isEditing) && renderForm()}

            {loading ? <div className="text-center text-gray-400 py-10">Загрузка...</div> : (
                <div className="space-y-3">
                    {products.map((p) => (
                        <div key={p.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                            <div>
                                <div className="text-xs text-gray-400 font-bold uppercase">{p.line}</div>
                                <div className="flex items-center gap-2">
                                    <div className="font-bold text-[#1C1C1E]">{p.flavor}</div>
                                    {p.isTopFlavor && (
                                        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                            ТОП
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-400 font-mono mt-1">{p.sku}</div>
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

// --- New Sub-Components ---

const ReportsManager = ({ onBack }: { onBack: () => void }) => {
    const download = (type: 'visits' | 'orders') => {
        // Direct download link
        window.location.href = `${apiClient.defaults.baseURL || ''}/api/reports/${type}`;
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
                <h1 className="text-2xl font-bold text-[#1C1C1E]">Отчеты</h1>
            </div>

            <div className="space-y-4">
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => download('visits')}
                    className="w-full bg-white p-6 rounded-[30px] border border-gray-200 shadow-sm flex items-center justify-between group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                            <BarChart2 size={24} />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-[#1C1C1E] text-lg">Отчет по Визитам</div>
                            <div className="text-xs text-gray-400">Excel • Вся история</div>
                        </div>
                    </div>
                    <Upload size={20} className="text-gray-300 group-hover:text-[#007AFF] transition-colors rotate-180" />
                </motion.button>

                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => download('orders')}
                    className="w-full bg-white p-6 rounded-[30px] border border-gray-200 shadow-sm flex items-center justify-between group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center">
                            <Package size={24} />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-[#1C1C1E] text-lg">Отчет по Заказам</div>
                            <div className="text-xs text-gray-400">Excel • Статусы</div>
                        </div>
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

    React.useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = () => {
        setLoading(true);
        apiClient.get('/api/orders')
            .then(res => setOrders(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const updateStatus = async (id: number, status: string) => {
        try {
            await apiClient.patch(`/api/orders/${id}/status`, { status });
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
        } catch (e) {
            alert('Ошибка обновления');
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
                <h1 className="text-2xl font-bold text-[#1C1C1E]">Заказы</h1>
            </div>

            {loading ? <div className="text-center text-gray-400">Загрузка...</div> : (
                <div className="space-y-4">
                    {orders.map(order => (
                        <div key={order.id} className="bg-white p-5 rounded-[30px] border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="font-bold text-[#1C1C1E]">#{order.id} {order.facility?.name}</div>
                                    <div className="text-xs text-gray-400">Дистрибьютор: {order.distributor?.name}</div>
                                </div>
                                <div className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${order.status === 'SHIPPED' ? 'bg-green-100 text-green-700' :
                                    order.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                        'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {order.status === 'SHIPPED' ? 'Отгружен' :
                                        order.status === 'REJECTED' ? 'Отменен' : 'В ожидании'}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-50">
                                <button
                                    onClick={() => updateStatus(order.id, 'SHIPPED')}
                                    className="flex-1 bg-green-50 text-green-600 py-2 rounded-xl text-xs font-bold active:scale-95 transition"
                                >
                                    Отгрузить
                                </button>
                                <button
                                    onClick={() => updateStatus(order.id, 'REJECTED')}
                                    className="flex-1 bg-red-50 text-red-500 py-2 rounded-xl text-xs font-bold active:scale-95 transition"
                                >
                                    Отменить
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Users Manager ---
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

// --- Chats / Distributors Manager ---
const DistributorsManager = ({ onBack }: { onBack: () => void }) => {
    const [distributors, setDistributors] = useState<Distributor[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({ name: '', telegramChatId: '' });

    React.useEffect(() => {
        loadDistributors();
    }, []);

    const loadDistributors = () => {
        setLoading(true);
        apiClient.get('/api/distributors')
            .then(res => setDistributors(res.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const handleDelete = async (id: number, name: string) => {
        if (!window.confirm(`Удалить чат "${name}"?`)) return;
        try {
            await apiClient.delete(`/api/distributors/${id}`);
            setDistributors(prev => prev.filter(d => d.id !== id));
        } catch (e) {
            alert('Ошибка удаления');
        }
    };

    const handleSave = async () => {
        const name = formData.name.trim();
        const chatId = formData.telegramChatId.trim();
        if (!name || !chatId) {
            alert('Укажите название и Telegram Chat ID');
            return;
        }
        try {
            await apiClient.post('/api/distributors', { name, telegramChatId: chatId });
            setIsCreating(false);
            setFormData({ name: '', telegramChatId: '' });
            loadDistributors();
        } catch (e) {
            alert('Ошибка сохранения');
        }
    };

    const renderForm = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[24px] p-6 w-full max-w-sm shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Добавить чат</h3>
                    <button onClick={() => setIsCreating(false)}><X size={20} /></button>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-gray-500 font-bold ml-1">Название</label>
                        <input
                            placeholder="Например: Склад Центр"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 font-bold ml-1">Telegram Chat ID</label>
                        <input
                            placeholder="-100..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"
                            value={formData.telegramChatId}
                            onChange={e => setFormData({ ...formData, telegramChatId: e.target.value })}
                        />
                    </div>
                    <button onClick={handleSave} className="w-full bg-[#1C1C1E] text-white font-bold py-3 rounded-xl mt-2">
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
                    <button
                        onClick={onBack}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-[#1C1C1E] active:scale-95 transition"
                    >
                        <ChevronRight size={20} className="rotate-180" />
                    </button>
                    <h1 className="text-2xl font-bold text-[#1C1C1E]">Чаты</h1>
                </div>
                <button onClick={() => setIsCreating(true)} className="w-10 h-10 bg-[#1C1C1E] rounded-full flex items-center justify-center shadow-sm text-white active:scale-95 transition">
                    <Plus size={20} />
                </button>
            </div>

            {isCreating && renderForm()}

            {loading ? (
                <div className="text-center text-gray-400 py-10">Загрузка...</div>
            ) : (
                <div className="space-y-3">
                    {distributors.length === 0 ? (
                        <div className="text-center text-gray-400 py-10">Чатов пока нет</div>
                    ) : distributors.map((d) => (
                        <div key={d.id} className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm flex items-center justify-between">
                            <div className="min-w-0">
                                <div className="font-bold text-[#1C1C1E] truncate">{d.fullName || d.name}</div>
                                <div className="text-xs text-gray-400 font-mono mt-1 truncate">{d.telegramChatId || d.chatId}</div>
                            </div>
                            <button onClick={() => handleDelete(d.id, d.fullName || d.name)} className="text-red-400 p-2">
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const UsersManager = ({ onBack }: { onBack: () => void }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({ fullName: '', telegramId: '', role: 'AMBASSADOR' as 'ADMIN' | 'AMBASSADOR' });

    const [distributors, setDistributors] = useState<Distributor[]>([]);
    const [chatsLoading, setChatsLoading] = useState(false);
    const [editingChatsUser, setEditingChatsUser] = useState<User | null>(null);
    const [selectedChatIds, setSelectedChatIds] = useState<Set<number>>(new Set());
    const [savingChats, setSavingChats] = useState(false);
    const [newChatName, setNewChatName] = useState('');
    const [newChatId, setNewChatId] = useState('');
    const [creatingChat, setCreatingChat] = useState(false);

    React.useEffect(() => {
        loadUsers();
        loadDistributors();
    }, []);

    const loadUsers = () => {
        setLoading(true);
        apiClient.get('/api/users')
            .then(res => {
                const all = (res.data || []) as User[];
                // Hide seeded/system users (temp_...) and keep only real Telegram IDs
                setUsers(all.filter((u) => /^\d+$/.test(String(u.telegramId))));
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    const loadDistributors = () => {
        setChatsLoading(true);
        apiClient.get('/api/distributors')
            .then(res => setDistributors(res.data || []))
            .catch(console.error)
            .finally(() => setChatsLoading(false));
    };

    const handleCreateChat = async () => {
        const name = newChatName.trim();
        const chatId = newChatId.trim();
        if (!name || !chatId) {
            alert('Укажите название и Telegram Chat ID');
            return;
        }
        setCreatingChat(true);
        try {
            await apiClient.post('/api/distributors', {
                name,
                telegramChatId: chatId,
            });
            setNewChatName('');
            setNewChatId('');
            loadDistributors();
        } catch (e) {
            alert('Ошибка создания чата');
        } finally {
            setCreatingChat(false);
        }
    };

    const handleCreate = async () => {
        const trimmedTgId = formData.telegramId.trim();
        if (!formData.fullName || !trimmedTgId) {
            alert('Заполните все поля');
            return;
        }
        if (!/^\d+$/.test(trimmedTgId)) {
            alert('Telegram ID должен содержать только цифры');
            return;
        }
        try {
            await apiClient.post('/api/users', { ...formData, telegramId: trimmedTgId });
            setIsCreating(false);
            setFormData({ fullName: '', telegramId: '', role: 'AMBASSADOR' });
            loadUsers();
        } catch (e: any) {
            alert(e?.response?.data?.message || 'Ошибка создания');
        }
    };

    const handleDelete = async (id: number, name: string) => {
        if (!window.confirm(`Удалить сотрудника "${name}"? Его визиты и заказы останутся в базе.`)) return;
        try {
            await apiClient.delete(`/api/users/${id}`);
            setUsers(prev => prev.filter(u => u.id !== id));
        } catch (e) {
            alert('Ошибка удаления');
        }
    };

    const openChatsEditor = (user: User) => {
        setEditingChatsUser(user);
        setSelectedChatIds(new Set((user.allowedDistributors || []).map((d) => d.id)));
    };

    const toggleChat = (id: number) => {
        setSelectedChatIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const saveChats = async () => {
        if (!editingChatsUser) return;
        setSavingChats(true);
        try {
            const res = await apiClient.post(`/api/users/${editingChatsUser.id}/distributors`, {
                distributorIds: Array.from(selectedChatIds),
            });
            const updated = res.data as User;
            setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
            setEditingChatsUser(updated);
        } catch (e) {
            alert('Ошибка сохранения чатов');
        } finally {
            setSavingChats(false);
        }
    };

    return (
        <div className="pt-[20px]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-[#1C1C1E] active:scale-95 transition"
                    >
                        <ChevronRight size={20} className="rotate-180" />
                    </button>
                    <h1 className="text-2xl font-bold text-[#1C1C1E]">Сотрудники</h1>
                </div>
                <button onClick={() => setIsCreating(true)} className="w-10 h-10 bg-[#1C1C1E] rounded-full flex items-center justify-center shadow-sm text-white active:scale-95 transition">
                    <Plus size={20} />
                </button>
            </div>

            {/* Create Modal */}
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[24px] p-6 w-full max-w-sm shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Добавить сотрудника</h3>
                            <button onClick={() => setIsCreating(false)}><X size={20} /></button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500 font-bold ml-1">Имя</label>
                                <input
                                    placeholder="ФИО сотрудника"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"
                                    value={formData.fullName}
                                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 font-bold ml-1">Telegram ID</label>
                                <input
                                    placeholder="Например: 123456789"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"
                                    value={formData.telegramId}
                                    onChange={e => setFormData({ ...formData, telegramId: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 font-bold ml-1">Роль</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'AMBASSADOR' })}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"
                                >
                                    <option value="AMBASSADOR">Амбассадор</option>
                                    <option value="ADMIN">Админ</option>
                                </select>
                            </div>
                            <button onClick={handleCreate} className="w-full bg-[#1C1C1E] text-white font-bold py-3 rounded-xl mt-4">
                                Добавить
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {loading ? <div className="text-center text-gray-400 py-10">Загрузка...</div> : (
                <div className="space-y-3">
                    {users.length === 0 ? (
                        <div className="text-center text-gray-400 py-10">Нет сотрудников</div>
                    ) : users.map(user => (
                        <div key={user.id} className="bg-white p-4 rounded-[20px] border border-gray-100 shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-bold text-[#1C1C1E]">{user.fullName}</div>
                                    <div className="text-xs text-gray-400">Telegram ID: {user.telegramId}</div>
                                    <div className={`text-[10px] font-bold mt-1 px-2 py-0.5 rounded-md inline-block ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {user.role === 'ADMIN' ? 'Админ' : 'Амбассадор'}
                                    </div>
                                    <div className="text-[10px] text-gray-400 mt-1">
                                        Чаты: {user.allowedDistributors && user.allowedDistributors.length > 0
                                            ? user.allowedDistributors.map(d => d.name).join(', ')
                                            : '—'}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => openChatsEditor(user)}
                                        className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-[#007AFF] active:opacity-70 transition"
                                    >
                                        <MessageCircle size={14} />
                                        Управлять чатами
                                    </button>
                                </div>
                                <button onClick={() => handleDelete(user.id, user.fullName)} className="text-red-400 p-2">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Chats Editor Modal */}
            {editingChatsUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[24px] p-6 w-full max-w-sm shadow-xl"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="font-bold text-lg">Чаты сотрудника</h3>
                                <div className="text-xs text-gray-400 mt-0.5">{editingChatsUser.fullName}</div>
                            </div>
                            <button onClick={() => setEditingChatsUser(null)}><X size={20} /></button>
                        </div>

                        {chatsLoading ? (
                            <div className="text-center text-gray-400 py-10">Загрузка чатов...</div>
                        ) : distributors.length === 0 ? (
                            <div className="space-y-3">
                                <div className="text-center text-gray-400">
                                    Список чатов пуст. Добавьте чат для заявок ниже.
                                </div>
                                <input
                                    value={newChatName}
                                    onChange={(e) => setNewChatName(e.target.value)}
                                    placeholder="Название чата (например: Склад Центр)"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"
                                />
                                <input
                                    value={newChatId}
                                    onChange={(e) => setNewChatId(e.target.value)}
                                    placeholder="Telegram Chat ID (-100...)"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={handleCreateChat}
                                    disabled={creatingChat}
                                    className="w-full bg-[#1C1C1E] text-white font-bold py-3 rounded-xl active:scale-95 transition disabled:opacity-60"
                                >
                                    {creatingChat ? 'Создаем...' : 'Добавить чат'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                                {distributors.map((d) => {
                                    const checked = selectedChatIds.has(d.id);
                                    return (
                                        <button
                                            key={d.id}
                                            type="button"
                                            onClick={() => toggleChat(d.id)}
                                            className={`w-full p-4 rounded-2xl border flex items-center justify-between text-left active:scale-[0.99] transition ${checked ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100'
                                                }`}
                                        >
                                            <div className="min-w-0">
                                                <div className="font-bold text-[#1C1C1E] text-sm truncate">{d.fullName || d.name}</div>
                                                <div className="text-xs text-gray-400 mt-1">{checked ? 'Доступ разрешен' : 'Нет доступа'}</div>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${checked ? 'bg-[#007AFF] border-[#007AFF] text-white' : 'bg-white border-gray-200 text-transparent'
                                                }`}
                                            >
                                                <Check size={14} />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-5 flex gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedChatIds(new Set())}
                                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl active:scale-95 transition"
                            >
                                Сбросить
                            </button>
                            <button
                                type="button"
                                onClick={saveChats}
                                disabled={savingChats}
                                className="flex-1 bg-[#1C1C1E] text-white font-bold py-3 rounded-xl active:scale-95 transition disabled:opacity-60"
                            >
                                {savingChats ? 'Сохраняем...' : 'Сохранить'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

// --- Main Admin Page ---

type AdminView = 'menu' | 'products' | 'users' | 'reports' | 'orders' | 'chats';

const AdminPage: React.FC = () => {
    const [view, setView] = useState<AdminView>('menu');
    const [isUnlocked, setIsUnlocked] = useState(false);

    if (!isUnlocked) {
        return <LockScreen onSuccess={() => setIsUnlocked(true)} />;
    }

    const renderMenu = () => (
        <div className="space-y-4 px-4 pt-[calc(env(safe-area-inset-top)+20px)] pb-32">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-[#1C1C1E]">Админ<br />Панель</h1>
                <div className="w-12 h-12 bg-[#1C1C1E] rounded-full flex items-center justify-center text-white">
                    <Settings size={24} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Reports (Big Card) */}
                <motion.div
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setView('reports')}
                    className="col-span-2 bg-[#007AFF] rounded-[30px] p-6 h-[140px] shadow-lg flex flex-col justify-between relative overflow-hidden text-white"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-20">
                        <BarChart2 size={100} />
                    </div>
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                        <BarChart2 size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Отчеты</h3>
                        <p className="text-white/80 text-xs">Excel выгрузки</p>
                    </div>
                </motion.div>

                {/* Orders */}
                <motion.div
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setView('orders')}
                    className="bg-white rounded-[30px] p-6 h-[180px] shadow-sm border border-gray-200 flex flex-col justify-between relative overflow-hidden"
                >
                    <div className="absolute -bottom-4 -right-4 opacity-5 text-[#1C1C1E]">
                        <Package size={100} />
                    </div>
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                        <Package size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-[#1C1C1E]">Заказы</h3>
                        <p className="text-gray-400 text-xs">Управление статусами</p>
                    </div>
                </motion.div>

                {/* Products */}
                <motion.div
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setView('products')}
                    className="bg-[#1C1C1E] rounded-[30px] p-6 h-[180px] shadow-lg flex flex-col justify-between relative overflow-hidden text-white"
                >
                    <div className="absolute -top-4 -right-4 opacity-10 rotate-12">
                        <Package size={80} />
                    </div>
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                        <Settings size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Продукты</h3>
                        <p className="text-white/60 text-xs">Редактор</p>
                    </div>
                </motion.div>

                {/* Users */}
                <motion.div
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setView('users')}
                    className="bg-white rounded-[30px] p-6 h-[180px] shadow-sm border border-gray-200 flex flex-col justify-between relative overflow-hidden col-span-2"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                        <Users size={100} />
                    </div>
                    <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">
                        <Users size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-[#1C1C1E]">Сотрудники</h3>
                        <p className="text-gray-400 text-xs">Управление доступом</p>
                    </div>
                </motion.div>

                {/* Chats */}
                <motion.div
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setView('chats')}
                    className="bg-white rounded-[30px] p-6 h-[160px] shadow-sm border border-gray-200 flex flex-col justify-between relative overflow-hidden col-span-2"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                        <MessageCircle size={100} />
                    </div>
                    <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                        <MessageCircle size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-[#1C1C1E]">Чаты</h3>
                        <p className="text-gray-400 text-xs">Дистрибьюторы и Telegram chatId</p>
                    </div>
                </motion.div>
            </div>

            <div className="text-center pt-8 text-xs text-gray-300">
                v1.1.0 Admin Suite
            </div>
        </div>
    );

    return (
        <Layout>
            <div className="min-h-screen bg-[#F2F2F7]">
                <AnimatePresence mode="wait">
                    {view === 'menu' && (
                        <motion.div key="menu" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                            {renderMenu()}
                        </motion.div>
                    )}
                    {view === 'products' && (
                        <motion.div key="products" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="px-4 pb-32">
                            <ProductManager onBack={() => setView('menu')} />
                        </motion.div>
                    )}
                    {view === 'reports' && (
                        <motion.div key="reports" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="px-4 pb-32">
                            <ReportsManager onBack={() => setView('menu')} />
                        </motion.div>
                    )}
                    {view === 'orders' && (
                        <motion.div key="orders" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="px-4 pb-32">
                            <OrderManager onBack={() => setView('menu')} />
                        </motion.div>
                    )}
                    {view === 'chats' && (
                        <motion.div key="chats" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="px-4 pb-32">
                            <DistributorsManager onBack={() => setView('menu')} />
                        </motion.div>
                    )}
                    {view === 'users' && (
                        <motion.div key="users" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="px-4 pb-32">
                            <UsersManager onBack={() => setView('menu')} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Layout>
    );
};


export default AdminPage;
