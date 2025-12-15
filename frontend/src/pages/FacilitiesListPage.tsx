import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import apiClient from '../api/apiClient';
import { Search, ChevronRight, Building2, Plus } from 'lucide-react';

interface Facility { id: number; name: string; address: string; }

const FacilitiesListPage: React.FC = () => {
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/api/facilities')
            .then(res => setFacilities(res.data || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        const term = search.toLowerCase();
        return facilities.filter(f =>
            !f.name.startsWith('Активность:') &&
            (f.name.toLowerCase().includes(term) || f.address?.toLowerCase().includes(term))
        );
    }, [facilities, search]);

    return (
        <Layout>
            <PageHeader title="База точек" back />

            <div className="bg-[#F8F9FA] min-h-screen pt-[calc(env(safe-area-inset-top)+60px)] pb-32 px-4 relative">

                {/* Поиск */}
                <div className="relative mb-4">
                    <div className="absolute left-4 top-3.5 text-gray-400 pointer-events-none">
                        <Search size={18} />
                    </div>
                    <input
                        type="text"
                        placeholder="Поиск..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white text-[#1C1C1E] rounded-2xl py-3 pl-11 pr-4 outline-none border border-gray-200 focus:border-black transition"
                    />
                </div>

                {/* Список */}
                {loading ? (
                    <div className="text-center text-gray-400 mt-10">Загрузка...</div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((f) => (
                            <Link key={f.id} to={`/facility/${f.id}`}>
                                <div className="bg-white p-4 rounded-2xl border border-gray-100 active:scale-[0.98] transition-transform flex justify-between items-center">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 shrink-0">
                                            <Building2 size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-semibold text-[15px] text-[#1C1C1E] truncate">{f.name}</div>
                                            <div className="text-xs text-gray-400 truncate">{f.address}</div>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-300" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Плавающая кнопка добавления (FAB) - Справа снизу, над таббаром */}
                <Link to="/facility/new" className="fixed bottom-24 right-4 z-50">
                    <div className="w-14 h-14 bg-[#1C1C1E] rounded-full flex items-center justify-center text-white shadow-xl active:scale-90 transition-transform">
                        <Plus size={28} />
                    </div>
                </Link>

            </div>
        </Layout>
    );
};
export default FacilitiesListPage;