import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { StandardCard } from '../components/ui/StandardCard';
import { LockScreen } from '../components/LockScreen'; // <--- ИСПРАВЛЕНО: Добавил { }
import apiClient from '../api/apiClient';
import { 
    Users, Package, DollarSign, 
    Check, X, Trash2, Plus, ChevronDown, ChevronUp 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- ТИПЫ ДАННЫХ ---
interface Product {
    id: number;
    line: string;
    flavor: string;
    price: number;
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
                category: 'Tobacco'
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
    const [isCreating, setIsCreating] = useState(false);
    const [newUser, setNewUser] = useState<Partial<User>>({});

    const handleSave = () => {
        console.log("Сохраняем:", newUser);
        setUsers([...users, { id: Date.now(), ...newUser } as User]);
        setIsCreating(false);
        setNewUser({});
    };

    return (
        <div className="pb-32 px-4 space-y-3 pt-2">
            <PageHeader title="Команда и Чаты" rightAction={<button onClick={onBack}>Закрыть</button>} />

            <button 
                onClick={() => setIsCreating(true)}
                className="w-full py-3 bg-black text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg mb-4"
            >
                <Plus size={20} /> Добавить сотрудника
            </button>

            {users.length === 0 && <div className="text-center text-gray-400">Нет сотрудников</div>}

            {users.map(u => (
                <StandardCard key={u.id} title={u.name} subtitle={u.role || 'Сотрудник'} icon={Users}>
                    <div className="text-xs text-gray-500 mt-2 space-y-1 bg-gray-50 p-2 rounded-lg">
                        <div className="flex justify-between"><span>TG ID:</span> <span className="font-mono">{u.telegramId}</span></div>
                        <div className="flex justify-between"><span>Chat ID:</span> <span className="font-mono">{u.chatId || '-'}</span></div>
                    </div>
                </StandardCard>
            ))}

            {isCreating && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-3">
                        <h3 className="font-bold text-lg mb-2">Новый сотрудник</h3>
                        
                        <input placeholder="Имя" className="w-full bg-gray-50 p-3 rounded-xl border" 
                            onChange={e => setNewUser({...newUser, name: e.target.value})} />
                        
                        <input placeholder="Telegram ID (цифры)" className="w-full bg-gray-50 p-3 rounded-xl border" 
                            onChange={e => setNewUser({...newUser, telegramId: e.target.value})} />
                        
                        <input placeholder="ID Чата (для отчетов)" className="w-full bg-gray-50 p-3 rounded-xl border" 
                            onChange={e => setNewUser({...newUser, chatId: e.target.value})} />
                        
                        <input placeholder="Роль (Склад, Логист...)" className="w-full bg-gray-50 p-3 rounded-xl border" 
                            onChange={e => setNewUser({...newUser, role: e.target.value})} />

                        <button onClick={handleSave} className="w-full bg-black text-white py-3 rounded-xl font-bold mt-2">
                            Добавить
                        </button>
                        <button onClick={() => setIsCreating(false)} className="w-full text-gray-500 py-2">Отмена</button>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- ГЛАВНЫЙ ЭКРАН АДМИНКИ ---

const AdminPage: React.FC = () => {
    const [view, setView] = useState<'menu' | 'products' | 'prices' | 'users' | 'orders'>('menu');
    const [isUnlocked, setIsUnlocked] = useState(false);

    if (!isUnlocked) {
        return <LockScreen onSuccess={() => setIsUnlocked(true)} />;
    }

    return (
        <Layout>
            <div className="min-h-screen bg-[#F3F4F6]">
                <AnimatePresence mode="wait">
                    {view === 'menu' && (
                        <motion.div 
                            key="menu" 
                            initial={{ opacity: 0, y: 10 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            className="px-4 pb-32 pt-2"
                        >
                            <PageHeader title="Админ Панель" />
                            
                            <div className="space-y-3 mt-4">
                                <h3 className="text-xs font-bold text-gray-400 uppercase ml-1 mb-2">База данных</h3>
                                
                                <StandardCard 
                                    title="Товары и Вкусы" 
                                    subtitle="Добавить новые позиции"
                                    icon={Package}
                                    onClick={() => setView('products')}
                                    showArrow={true}
                                />

                                <StandardCard 
                                    title="Управление Ценами" 
                                    subtitle="Изменить цены линеек"
                                    icon={DollarSign}
                                    onClick={() => setView('prices')}
                                    showArrow={true}
                                />

                                <h3 className="text-xs font-bold text-gray-400 uppercase ml-1 mb-2 mt-6">Персонал</h3>
                                
                                <StandardCard 
                                    title="Команда и Чаты" 
                                    subtitle="Доступ и куда слать отчеты"
                                    icon={Users}
                                    onClick={() => setView('users')}
                                    showArrow={true}
                                />
                                
                                <StandardCard 
                                    title="Заказы (История)" 
                                    subtitle="Все входящие заявки"
                                    icon={Check}
                                    onClick={() => setView('orders')}
                                    showArrow={true}
                                />
                            </div>
                        </motion.div>
                    )}

                    {view === 'products' && <ProductManager onBack={() => setView('menu')} />}
                    {view === 'prices' && <PriceManager onBack={() => setView('menu')} />}
                    {view === 'users' && <UserManager onBack={() => setView('menu')} />}
                    {view === 'orders' && (
                        <div className="pt-2 px-4">
                            <PageHeader title="Заказы" rightAction={<button onClick={() => setView('menu')}>Закрыть</button>} />
                            <div className="text-center text-gray-400 mt-10">Список заказов пуст</div>
                        </div>
                    )}

                </AnimatePresence>
            </div>
        </Layout>
    );
};

export default AdminPage;