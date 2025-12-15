import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { Users, Package, BarChart2, Upload, Database, Settings, ChevronRight, Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../api/apiClient';

// --- Types ---
interface Product {
    id: number;
    line: string;
    flavor: string;
    sku: string;
    category: string;
}

// --- Sub-Components ---

const ProductManager = ({ onBack }: { onBack: () => void }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState<Product | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [formData, setFormData] = useState({ line: '', flavor: '', sku: '', category: 'Tobacco' });

    // Fetch
    React.useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = () => {
        setLoading(true);
        apiClient.get('/api/products')
            .then(res => setProducts(res.data))
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
        try {
            if (isEditing) {
                await apiClient.patch(`/api/products/${isEditing.id}`, formData);
            } else {
                await apiClient.post('/api/products', formData);
            }
            setIsEditing(null);
            setIsCreating(false);
            setFormData({ line: '', flavor: '', sku: '', category: 'Tobacco' });
            loadProducts();
        } catch (e) {
            alert('Ошибка сохранения');
        }
    };

    const openCreate = () => {
        setFormData({ line: '', flavor: '', sku: '', category: 'Tobacco' });
        setIsCreating(true);
        setIsEditing(null);
    };

    const openEdit = (p: Product) => {
        setFormData({ line: p.line, flavor: p.flavor, sku: p.sku, category: p.category });
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
                            <option value="Classic">Classic</option>
                            <option value="Black">Black</option>
                            <option value="Shot">Shot</option>
                            <option value="Mix">Mix</option>
                            {/* Add logic to allow custom input if needed, but select is safer for consistency */}
                        </select>
                        {/* Fallback Input if they want custom */}
                        <input
                            placeholder="Или введите свою"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm mt-2"
                            value={formData.line}
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
                    <div>
                        <label className="text-xs text-gray-500 font-bold ml-1">Артикул (SKU)</label>
                        <input
                            placeholder="SKU"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm"
                            value={formData.sku}
                            onChange={e => setFormData({ ...formData, sku: e.target.value })}
                        />
                    </div>
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
                                <div className="font-bold text-[#1C1C1E]">{p.flavor}</div>
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
// --- Main Admin Page ---

type AdminView = 'menu' | 'products' | 'users' | 'reports' | 'orders';

const AdminPage: React.FC = () => {
    const [view, setView] = useState<AdminView>('menu');

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
                </AnimatePresence>
            </div>
        </Layout>
    );
};

export default AdminPage;
