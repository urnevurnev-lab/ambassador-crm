import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import apiClient from '../api/apiClient';
import { User, MapPin, Calendar, Shirt, Save, CheckCircle } from 'lucide-react';
import WebApp from '@twa-dev/sdk';

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

    useEffect(() => {
        // Fetch current profile
        // Since we didn't make a dedicated /api/me endpoint yet, we might need one or rely on what we have.
        // Let's assume we can GET /api/users/me (Need to implement or mock for now)
        // For now, let's just use WebApp user data and local storage or empty state if API not ready

        // MOCK:
        if (WebApp.initDataUnsafe?.user) {
            setData(prev => ({ ...prev, fullName: [WebApp.initDataUnsafe.user?.first_name, WebApp.initDataUnsafe.user?.last_name].join(' ') }));
        }
        setLoading(false);
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            // Need endpoint PUT /api/users/me
            // For now, mock success
            await new Promise(r => setTimeout(r, 1000));
            WebApp.showAlert('Профиль сохранен!');
        } catch (e) {
            WebApp.showAlert('Ошибка сохранения');
        } finally {
            setSaving(false);
        }
    };

    const updateCdek = (field: string, val: string) => {
        setData(prev => ({ ...prev, cdekInfo: { ...prev.cdekInfo, [field]: val } }));
    };

    if (loading) return <Layout><div className="flex h-screen items-center justify-center text-gray-400">Загрузка...</div></Layout>;

    return (
        <Layout>
            <PageHeader title="Мой профиль" back />

            <div className="pt-[60px] pb-32 px-4 space-y-6">

                {/* Avatar & Name */}
                <div className="flex flex-col items-center py-6">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                        <User size={48} />
                    </div>
                    <h2 className="text-xl font-bold text-[#1C1C1E]">{data.fullName}</h2>
                    <div className="text-sm text-gray-400">Амбассадор</div>
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
