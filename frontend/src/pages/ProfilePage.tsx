import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import apiClient from '../api/apiClient';
import { User, MapPin, Calendar, Shirt, Save, ShieldAlert } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ProfileData {
    fullName: string;
    birthDate: string; // YYYY-MM-DD
    tshirtSize: string;
    cdekInfo: { city: string; address: string; code?: string };
}

const ProfilePage: React.FC = () => {
    const [data, setData] = useState<ProfileData>({
        fullName: '',
        birthDate: '',
        tshirtSize: 'M',
        cdekInfo: { city: '', address: '' }
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [adminTaps, setAdminTaps] = useState(0);

    useEffect(() => {
        setLoading(true);
        apiClient.get('/api/users/me')
            .then(res => {
                const user = res.data;
                setData({
                    fullName: user.fullName || '',
                    birthDate: user.birthDate ? user.birthDate.split('T')[0] : '',
                    tshirtSize: user.tshirtSize || 'M',
                    cdekInfo: user.cdekInfo ? (typeof user.cdekInfo === 'string' ? JSON.parse(user.cdekInfo) : user.cdekInfo) : { city: '', address: '' }
                });
            })
            .catch(err => {
                console.error('Profile load error', err);
                // Fallback to Telegram data if API fails or user new
                if (WebApp.initDataUnsafe?.user) {
                    setData(prev => ({ ...prev, fullName: [WebApp.initDataUnsafe.user?.first_name, WebApp.initDataUnsafe.user?.last_name].join(' ') }));
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await apiClient.patch('/api/users/me', {
                birthDate: data.birthDate,
                tshirtSize: data.tshirtSize,
                cdekInfo: data.cdekInfo
            });
            WebApp.showAlert('Профиль сохранен!');
        } catch (e) {
            console.error(e);
            WebApp.showAlert('Ошибка сохранения');
        } finally {
            setSaving(false);
        }
    };

    const updateCdek = (field: string, val: string) => {
        setData(prev => ({
            ...prev,
            cdekInfo: { ...prev.cdekInfo, [field]: val }
        }));
    };

    if (loading) return <Layout><div className="flex h-screen items-center justify-center text-gray-400">Загрузка...</div></Layout>;

    return (
        <Layout>
            <PageHeader title="Мой профиль" back />

            <div className="pt-[60px] pb-32 px-4 space-y-6">

                {/* Avatar & Name */}
                <div className="flex flex-col items-center py-6">
                    <motion.div
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                            setAdminTaps(p => p + 1);
                            if (adminTaps + 1 === 5) WebApp.HapticFeedback.notificationOccurred('success');
                        }}
                        className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4 cursor-pointer relative overflow-hidden"
                    >
                        {data.fullName === 'Виктор Урнев' || adminTaps >= 5 ? (
                            <div className="absolute inset-0 bg-gradient-to-br from-[#1C1C1E] to-gray-800 flex items-center justify-center text-white">
                                <User size={48} />
                            </div>
                        ) : (
                            <User size={48} />
                        )}
                    </motion.div>
                    <h2 className="text-xl font-bold text-[#1C1C1E]">{data.fullName}</h2>
                    <div className="text-sm text-gray-400">Амбассадор</div>

                    {/* Secret Admin Link */}
                    {adminTaps >= 5 && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                            <Link to="/admin" className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold flex items-center gap-2">
                                <ShieldAlert size={14} /> ADMIN PANEL
                            </Link>
                        </motion.div>
                    )}
                </div>

                {/* Form Fields */}
                <div className="bg-white rounded-[30px] p-6 shadow-sm border border-gray-100 space-y-6">

                    {/* Birth Date */}
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-sm font-bold text-gray-700">
                            <Calendar size={16} className="text-blue-500" />
                            Дата рождения
                        </div>
                        <input
                            type="date"
                            value={data.birthDate}
                            onChange={(e) => setData(prev => ({ ...prev, birthDate: e.target.value }))}
                            className="w-full bg-gray-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    {/* T-Shirt */}
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-sm font-bold text-gray-700">
                            <Shirt size={16} className="text-purple-500" />
                            Размер футболки
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                            {['XS', 'S', 'M', 'L', 'XL'].map(size => (
                                <button
                                    key={size}
                                    onClick={() => setData(prev => ({ ...prev, tshirtSize: size }))}
                                    className={`py-2 rounded-xl text-sm font-bold transition ${data.tshirtSize === size
                                        ? 'bg-[#1C1C1E] text-white'
                                        : 'bg-gray-50 text-gray-500'
                                        }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* CDEK */}
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-sm font-bold text-gray-700">
                            <MapPin size={16} className="text-green-500" />
                            ПВЗ СДЭК (для посылок)
                        </div>
                        <div className="space-y-3">
                            <input
                                placeholder="Город"
                                value={data.cdekInfo.city}
                                onChange={e => updateCdek('city', e.target.value)}
                                className="w-full bg-gray-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-green-500/20"
                            />
                            <input
                                placeholder="Адрес / Код ПВЗ"
                                value={data.cdekInfo.address}
                                onChange={e => updateCdek('address', e.target.value)}
                                className="w-full bg-gray-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-green-500/20"
                            />
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full h-14 bg-[#1C1C1E] text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition shadow-lg"
                >
                    {saving ? 'Сохранение...' : 'Сохранить'} <Save size={20} />
                </button>

            </div>
        </Layout>
    );
};

export default ProfilePage;
