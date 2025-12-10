import { useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import WebApp from '@twa-dev/sdk';

const api = apiClient;

export const AdminDashboard = () => {
    // Modals
    const [showFacilityModal, setShowFacilityModal] = useState(false);
    const [showProductModal, setShowProductModal] = useState(false);
    const [showDistributorsModal, setShowDistributorsModal] = useState(false);
    const [showAmbassadorsModal, setShowAmbassadorsModal] = useState(false);

    // Data States
    const [distributors, setDistributors] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [geocodeLoading, setGeocodeLoading] = useState(false);
    const [distributorLoading, setDistributorLoading] = useState(false);
    const [importLoading, setImportLoading] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);

    // Forms
    const [facilityName, setFacilityName] = useState('');
    const [facilityAddress, setFacilityAddress] = useState('');

    const [productName, setProductName] = useState('');
    const [productSku, setProductSku] = useState('');
    const [productCategory, setProductCategory] = useState('coffee');

    const [distributorName, setDistributorName] = useState('');
    const [distributorChatId, setDistributorChatId] = useState('');

    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [editTelegramId, setEditTelegramId] = useState('');

    // --- Fetchers ---
    const fetchDistributors = async () => {
        try {
            const res = await api.get('/distributors');
            setDistributors(res.data);
            setShowDistributorsModal(true);
        } catch (e) {
            WebApp.showAlert('Ошибка загрузки дистрибьюторов');
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
            setShowAmbassadorsModal(true);
        } catch (e) {
            WebApp.showAlert('Ошибка загрузки пользователей');
        }
    };

    // --- Handlers ---
    const handleCreateFacility = async () => {
        try {
            await api.post('/facilities', {
                name: facilityName,
                address: facilityAddress,
                lat: 55.75 + Math.random() * 0.01,
                lng: 37.61 + Math.random() * 0.01
            });
            WebApp.HapticFeedback.notificationOccurred('success');
            setShowFacilityModal(false);
            setFacilityName('');
            setFacilityAddress('');
            WebApp.showAlert('Заведение добавлено!');
        } catch (e) {
            WebApp.HapticFeedback.notificationOccurred('error');
            WebApp.showAlert('Ошибка при создании');
        }
    };

    const handleCreateProduct = async () => {
        try {
            await api.post('/products', {
                name: productName,
                sku: productSku,
                category: productCategory
            });
            WebApp.HapticFeedback.notificationOccurred('success');
            setShowProductModal(false);
            setProductName('');
            setProductSku('');
            WebApp.showAlert('Товар добавлен!');
        } catch (e) {
            WebApp.HapticFeedback.notificationOccurred('error');
            WebApp.showAlert('Ошибка при создании');
        }
    };

    const handleCreateDistributor = async () => {
        try {
            await api.post('/distributors', {
                name: distributorName,
                telegramChatId: distributorChatId
            });
            WebApp.HapticFeedback.notificationOccurred('success');
            setDistributorName('');
            setDistributorChatId('');
            // Refresh list
            const res = await api.get('/distributors');
            setDistributors(res.data);
        } catch (e) {
            WebApp.HapticFeedback.notificationOccurred('error');
            WebApp.showAlert('Ошибка создания');
        }
    };

    const handleDeleteDistributor = async (id: number) => {
        try {
            await api.delete(`/distributors/${id}`);
            const res = await api.get('/distributors');
            setDistributors(res.data);
        } catch (e) {
            WebApp.showAlert('Ошибка удаления');
        }
    };

    const handleGeocode = async () => {
        setGeocodeLoading(true);
        try {
            await fetch('/api/admin/geocode', { method: 'POST' });
            WebApp.showAlert('Геокодинг завершен');
        } catch (e) {
            WebApp.showAlert('Ошибка геокодинга');
        } finally {
            setGeocodeLoading(false);
        }
    };

    const handleCreateMainDistributor = async () => {
        setDistributorLoading(true);
        try {
            await fetch('/api/admin/create-distributor', { method: 'POST' });
            WebApp.showAlert('Дистрибьютор создан/существует');
        } catch (e) {
            WebApp.showAlert('Ошибка создания дистрибьютора');
        } finally {
            setDistributorLoading(false);
        }
    };

    const handleImportExcel = async (file?: File | null) => {
        if (!file) return;
        setImportLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            await api.post('/api/imports/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            WebApp.showAlert('Импорт завершен');
        } catch (e) {
            WebApp.HapticFeedback.notificationOccurred('error');
            WebApp.showAlert('Ошибка импорта');
        } finally {
            setImportLoading(false);
        }
    };

    const handleMergeDuplicates = async () => {
        try {
            const res = await fetch('/api/admin/merge-duplicates', { method: 'POST' });
            const data = await res.json();
            WebApp.showAlert(`Объединено групп: ${data.mergedGroups}, удалено: ${data.deletedFacilities}`);
        } catch (e) {
            WebApp.showAlert('Ошибка объединения дубликатов');
        }
    };

    const handleSmartMerge = async () => {
        try {
            const res = await fetch('/api/admin/smart-merge', { method: 'POST' });
            const data = await res.json();
            WebApp.showAlert(`Связано: ${data.mergedNames} групп, перемещено визитов: ${data.visitsMoved}`);
        } catch (e) {
            WebApp.showAlert('Ошибка связывания');
        }
    };

    const handleResetDb = async () => {
        if (!window.confirm('⚠️ Вы уверены, что хотите очистить базу?')) return;
        setResetLoading(true);
        try {
            await fetch('/api/admin/reset', { method: 'DELETE' });
            WebApp.showAlert('База очищена');
        } catch (e) {
            WebApp.showAlert('Ошибка очистки базы');
        } finally {
            setResetLoading(false);
        }
    };

    const handleUpdateUser = async (id: number) => {
        try {
            await api.patch(`/users/${id}`, { telegramId: editTelegramId });
            WebApp.HapticFeedback.notificationOccurred('success');
            setEditingUserId(null);
            setEditTelegramId('');
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (e) {
            WebApp.HapticFeedback.notificationOccurred('error');
            WebApp.showAlert('Ошибка обновления');
        }
    };

    return (
        <div className="min-h-screen bg-[#F2F3F7] p-5 pb-32 pt-24">
            <div className="flex justify-between items-center mb-6">
                <Link to="/" className="text-gray-600 font-medium flex items-center space-x-2">
                    <span className="text-lg">←</span>
                    <span>Назад</span>
                </Link>
                <h1 className="text-3xl font-bold text-black">Управление</h1>
                <div className="w-8" />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                    onClick={() => setShowFacilityModal(true)}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-3 active:scale-95 transition aspect-square"
                >
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 text-2xl">🏢</div>
                    <span className="font-bold text-gray-900 text-center text-sm">Добавить Заведение</span>
                </button>

                <button
                    onClick={() => setShowProductModal(true)}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-3 active:scale-95 transition aspect-square"
                >
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-500 text-2xl">📦</div>
                    <span className="font-bold text-gray-900 text-center text-sm">Добавить Товар</span>
                </button>

                <button
                    onClick={fetchDistributors}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-3 active:scale-95 transition aspect-square"
                >
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 text-2xl">🚚</div>
                    <span className="font-bold text-gray-900 text-center text-sm">Дистрибьюторы</span>
                </button>

                <button
                    onClick={fetchUsers}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-3 active:scale-95 transition aspect-square"
                >
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-500 text-2xl">👥</div>
                    <span className="font-bold text-gray-900 text-center text-sm">Амбассадоры</span>
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                    onClick={handleGeocode}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-3 active:scale-95 transition"
                >
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl">📍</div>
                    <span className="font-bold text-gray-900 text-center text-sm">{geocodeLoading ? 'Геокодинг...' : 'Запуск Геокодинга'}</span>
                </button>
                <button
                    onClick={handleCreateMainDistributor}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-3 active:scale-95 transition"
                >
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-2xl">🚚</div>
                    <span className="font-bold text-gray-900 text-center text-sm">{distributorLoading ? 'Создание...' : 'Создать Дистрибьютора'}</span>
                </button>
                <button
                    onClick={handleMergeDuplicates}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-3 active:scale-95 transition col-span-2"
                >
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 text-2xl">🧹</div>
                    <span className="font-bold text-gray-900 text-center text-sm">Объединить Дубликаты</span>
                </button>
                <button
                    onClick={handleSmartMerge}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-3 active:scale-95 transition col-span-2"
                >
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-700 text-2xl">🔗</div>
                    <span className="font-bold text-gray-900 text-center text-sm">Умное Связывание</span>
                </button>
                <button
                    onClick={handleResetDb}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-red-200 flex flex-col items-center justify-center space-y-3 active:scale-95 transition col-span-2"
                >
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-500 text-2xl">⚠️</div>
                    <span className="font-bold text-red-600 text-center text-sm">{resetLoading ? 'Очистка...' : 'Сброс Базы'}</span>
                </button>
                <label className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-3 active:scale-95 transition col-span-2 cursor-pointer">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-2xl">{importLoading ? '⏳' : '📥'}</div>
                    <span className="font-bold text-gray-900 text-center text-sm">{importLoading ? 'Импорт...' : 'Импорт Excel'}</span>
                    <input
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            handleImportExcel(file);
                            e.target.value = '';
                        }}
                    />
                </label>
            </div>

            {/* --- MODALS --- */}

            {/* Facility Modal */}
            {showFacilityModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-5">
                    <div className="bg-white rounded-[32px] p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-xl font-bold mb-4">Новое заведение</h3>
                        <input className="w-full bg-gray-100 rounded-xl p-4 mb-3" placeholder="Название" value={facilityName} onChange={e => setFacilityName(e.target.value)} />
                        <input className="w-full bg-gray-100 rounded-xl p-4 mb-6" placeholder="Адрес" value={facilityAddress} onChange={e => setFacilityAddress(e.target.value)} />
                        <div className="flex space-x-3">
                            <button onClick={() => setShowFacilityModal(false)} className="flex-1 py-4 text-gray-500 font-bold bg-gray-100 rounded-xl">Отмена</button>
                            <button onClick={handleCreateFacility} className="flex-1 py-4 text-white font-bold bg-blue-500 rounded-xl">Создать</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Modal */}
            {showProductModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-5">
                    <div className="bg-white rounded-[32px] p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-xl font-bold mb-4">Новый товар</h3>
                        <input className="w-full bg-gray-100 rounded-xl p-4 mb-3" placeholder="Название" value={productName} onChange={e => setProductName(e.target.value)} />
                        <input className="w-full bg-gray-100 rounded-xl p-4 mb-3" placeholder="SKU" value={productSku} onChange={e => setProductSku(e.target.value)} />
                        <select className="w-full bg-gray-100 rounded-xl p-4 mb-6" value={productCategory} onChange={e => setProductCategory(e.target.value)}>
                            <option value="coffee">Кофе</option>
                            <option value="food">Еда</option>
                            <option value="merch">Мерч</option>
                        </select>
                        <div className="flex space-x-3">
                            <button onClick={() => setShowProductModal(false)} className="flex-1 py-4 text-gray-500 font-bold bg-gray-100 rounded-xl">Отмена</button>
                            <button onClick={handleCreateProduct} className="flex-1 py-4 text-white font-bold bg-green-500 rounded-xl">Создать</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Distributors Modal */}
            {showDistributorsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-5">
                    <div className="bg-white rounded-[32px] p-6 w-full max-w-sm shadow-2xl h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Дистрибьюторы</h3>
                            <button onClick={() => setShowDistributorsModal(false)} className="text-gray-400">Закрыть</button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                            {distributors.map(d => (
                                <div key={d.id} className="bg-gray-50 p-3 rounded-xl flex justify-between items-center">
                                    <div>
                                        <div className="font-bold">{d.name}</div>
                                        <div className="text-xs text-gray-400">{d.telegramChatId}</div>
                                    </div>
                                    <button onClick={() => handleDeleteDistributor(d.id)} className="text-red-500 font-bold px-2">X</button>
                                </div>
                            ))}
                        </div>

                        {/* Add Form */}
                        <div className="border-t pt-4">
                            <input className="w-full bg-gray-100 rounded-xl p-3 mb-2" placeholder="Название" value={distributorName} onChange={e => setDistributorName(e.target.value)} />
                            <input className="w-full bg-gray-100 rounded-xl p-3 mb-3" placeholder="Chat ID (напр. -100...)" value={distributorChatId} onChange={e => setDistributorChatId(e.target.value)} />
                            <button onClick={handleCreateDistributor} className="w-full py-3 text-white font-bold bg-orange-500 rounded-xl">Добавить</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Ambassadors Modal */}
            {showAmbassadorsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-5">
                    <div className="bg-white rounded-[32px] p-6 w-full max-w-sm shadow-2xl h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold">Амбассадоры</h3>
                            <button onClick={() => setShowAmbassadorsModal(false)} className="text-gray-400">Закрыть</button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto space-y-3">
                            {users.map(u => (
                                <div key={u.id} className="bg-gray-50 p-3 rounded-xl">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold">{u.fullName}</span>
                                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{u.role}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {editingUserId === u.id ? (
                                            <>
                                                <input
                                                    className="bg-white border rounded px-2 py-1 text-sm w-full"
                                                    value={editTelegramId}
                                                    onChange={e => setEditTelegramId(e.target.value)}
                                                    placeholder="Telegram ID"
                                                />
                                                <button onClick={() => handleUpdateUser(u.id)} className="text-green-500 font-bold">OK</button>
                                                <button onClick={() => setEditingUserId(null)} className="text-gray-400">X</button>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-xs text-gray-500">ID: {u.telegramId}</span>
                                                <button
                                                    onClick={() => {
                                                        setEditingUserId(u.id);
                                                        setEditTelegramId(u.telegramId);
                                                    }}
                                                    className="text-blue-500 text-xs font-bold"
                                                >
                                                    Изменить
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
