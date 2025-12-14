import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/Layout';
import { PageHeader } from '../../components/PageHeader';
import { Users, Package, MessageCircle, Trash2, Plus } from 'lucide-react';
import apiClient from '../../api/apiClient';
import WebApp from '@twa-dev/sdk';

// --- Interfaces ---
interface Product { id: number; line: string; flavor: string; sku: string; category: string; }
interface UserData { id: number; fullName: string; telegramId: string; role: string; }
interface Distributor { id: number; name: string; telegramChatId: string; }

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'products' | 'users' | 'chats'>('products');
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  
  // Forms State
  const [selectedLine, setSelectedLine] = useState('');
  const [newLineName, setNewLineName] = useState(''); // Если выбрана "Новая линейка"
  const [flavorName, setFlavorName] = useState('');
  
  const [newUserName, setNewUserName] = useState('');
  const [newUserTgId, setNewUserTgId] = useState('');

  const [newChatName, setNewChatName] = useState('');
  const [newChatId, setNewChatId] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
        const [pRes, uRes, dRes] = await Promise.all([
            apiClient.get('/api/products'),
            apiClient.get('/api/users'),
            apiClient.get('/api/distributors') // Нужно убедиться, что такой эндпоинт есть, иначе добавить
        ]);
        setProducts(pRes.data || []);
        setUsers(uRes.data || []);
        setDistributors(dRes.data || []);
    } catch (e) { console.error(e); }
  };

  // --- Logic: Products ---
  const uniqueLines = Array.from(new Set(products.map(p => p.line))).sort();
  
  const handleAddProduct = async () => {
    const finalLine = selectedLine === 'NEW_LINE' ? newLineName : selectedLine;
    if (!finalLine || !flavorName) {
        WebApp.showAlert('Заполните Линейку и Вкус');
        return;
    }
    // Генерируем SKU автоматически или берем название
    const generatedSku = `${finalLine.toUpperCase()}-${flavorName.toUpperCase().replace(/\s+/g, '_')}`;

    try {
        await apiClient.post('/api/products', {
            line: finalLine,
            flavor: flavorName,
            sku: generatedSku,
            category: 'TOBACCO' // Default
        });
        WebApp.showAlert('Вкус добавлен!');
        setFlavorName('');
        setNewLineName('');
        loadAll();
    } catch (e) {
        WebApp.showAlert('Ошибка добавления');
    }
  };

  // --- Logic: Users ---
  const handleAddUser = async () => {
    if (!newUserName || !newUserTgId) return;
    try {
        await apiClient.post('/api/users', {
            fullName: newUserName,
            telegramId: newUserTgId,
            role: 'AMBASSADOR'
        });
        WebApp.showAlert('Сотрудник добавлен');
        setNewUserName('');
        setNewUserTgId('');
        loadAll();
    } catch (e) { WebApp.showAlert('Ошибка создания сотрудника'); }
  };

  // --- Logic: Chats (Distributors) ---
  const handleAddChat = async () => {
    if (!newChatName || !newChatId) return;
    try {
        await apiClient.post('/api/distributors', {
            name: newChatName,
            telegramChatId: newChatId
        });
        WebApp.showAlert('Чат добавлен');
        setNewChatName('');
        setNewChatId('');
        loadAll();
    } catch (e) { WebApp.showAlert('Ошибка сохранения чата'); }
  };

  return (
    <Layout>
      <PageHeader title="Управление" rightContent={<div onClick={() => navigate('/')} className="text-gray-400 text-xs">Выход</div>} />
      
      <div className="pt-[calc(env(safe-area-inset-top)+60px)] px-4 pb-32">
        
        {/* Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
            <button onClick={() => setActiveTab('products')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${activeTab === 'products' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}>Товары</button>
            <button onClick={() => setActiveTab('users')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${activeTab === 'users' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}>Люди</button>
            <button onClick={() => setActiveTab('chats')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${activeTab === 'chats' ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}>Чаты</button>
        </div>

        {/* --- PRODUCTS TAB --- */}
        {activeTab === 'products' && (
            <div className="space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <h3 className="font-bold flex items-center gap-2"><Package size={18}/> Добавить вкус</h3>
                    
                    {/* 1. Выбор линейки */}
                    <div>
                        <label className="text-xs text-gray-400 font-bold uppercase ml-1">Линейка</label>
                        <select 
                            value={selectedLine} 
                            onChange={e => setSelectedLine(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 mt-1 outline-none focus:border-black"
                        >
                            <option value="">-- Выберите линейку --</option>
                            {uniqueLines.map(l => <option key={l} value={l}>{l}</option>)}
                            <option value="NEW_LINE">+ Создать новую линейку...</option>
                        </select>
                    </div>

                    {/* Если новая линейка */}
                    {selectedLine === 'NEW_LINE' && (
                        <input 
                            type="text" 
                            placeholder="Название новой линейки"
                            value={newLineName}
                            onChange={e => setNewLineName(e.target.value)}
                            className="w-full bg-white border-2 border-indigo-100 rounded-xl p-3 outline-none"
                        />
                    )}

                    {/* 2. Название вкуса */}
                    {selectedLine && (
                        <div className="animate-fade-in">
                            <label className="text-xs text-gray-400 font-bold uppercase ml-1">Название вкуса</label>
                            <input 
                                type="text" 
                                placeholder="Например: Berry Mint"
                                value={flavorName}
                                onChange={e => setFlavorName(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 mt-1 outline-none focus:border-black"
                            />
                            
                            <button 
                                onClick={handleAddProduct}
                                className="w-full bg-black text-white font-bold rounded-xl py-3 mt-4 active:scale-95 transition"
                            >
                                Сохранить
                            </button>
                        </div>
                    )}
                </div>
                
                <div className="text-sm text-gray-400 text-center">Всего SKU в базе: {products.length}</div>
            </div>
        )}

        {/* --- USERS TAB --- */}
        {activeTab === 'users' && (
            <div className="space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                    <h3 className="font-bold flex items-center gap-2"><Users size={18}/> Новый сотрудник</h3>
                    <input 
                        className="w-full bg-gray-50 rounded-xl p-3 border border-gray-200 text-sm"
                        placeholder="Имя Фамилия"
                        value={newUserName}
                        onChange={e => setNewUserName(e.target.value)}
                    />
                    <input 
                        className="w-full bg-gray-50 rounded-xl p-3 border border-gray-200 text-sm"
                        placeholder="Telegram ID (цифры)"
                        value={newUserTgId}
                        onChange={e => setNewUserTgId(e.target.value)}
                    />
                    <button onClick={handleAddUser} className="w-full bg-black text-white font-bold rounded-xl py-3 text-sm">Добавить</button>
                </div>

                <div className="space-y-2">
                    {users.map(u => (
                        <div key={u.id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center">
                            <div>
                                <div className="font-bold text-sm">{u.fullName}</div>
                                <div className="text-xs text-gray-400">ID: {u.telegramId}</div>
                            </div>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">{u.role}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- CHATS TAB --- */}
        {activeTab === 'chats' && (
            <div className="space-y-6">
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                    <h3 className="font-bold flex items-center gap-2"><MessageCircle size={18}/> Добавить чат для заявок</h3>
                    <div className="text-xs text-gray-400 mb-2">Сотрудники будут видеть только название, ID скрыт.</div>
                    
                    <input 
                        className="w-full bg-gray-50 rounded-xl p-3 border border-gray-200 text-sm"
                        placeholder="Название чата (например: Склад Центр)"
                        value={newChatName}
                        onChange={e => setNewChatName(e.target.value)}
                    />
                    <input 
                        className="w-full bg-gray-50 rounded-xl p-3 border border-gray-200 text-sm"
                        placeholder="ID чата (-100...)"
                        value={newChatId}
                        onChange={e => setNewChatId(e.target.value)}
                    />
                    <button onClick={handleAddChat} className="w-full bg-black text-white font-bold rounded-xl py-3 text-sm">Привязать чат</button>
                </div>

                <div className="space-y-2">
                    {distributors.map(d => (
                        <div key={d.id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center">
                            <div>
                                <div className="font-bold text-sm">{d.name}</div>
                                <div className="text-xs text-gray-400 font-mono">{d.telegramChatId}</div>
                            </div>
                            <button className="text-red-400 p-2"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>
            </div>
        )}

      </div>
    </Layout>
  );
};