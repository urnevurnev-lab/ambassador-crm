import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Building2 } from 'lucide-react';
import { Layout } from '../components/Layout';
import { StandardCard } from '../components/ui/StandardCard';
import { useFacilities } from '../context/FacilitiesContext';
import { motion } from 'framer-motion';

const FacilitiesListPage: React.FC = () => {
    const { facilities, loading } = useFacilities();
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    const filtered = useMemo(() => {
        const term = search.toLowerCase();
        return facilities.filter(f =>
            !f.name.startsWith('Активность:') &&
            (f.name.toLowerCase().includes(term) || f.address?.toLowerCase().includes(term))
        );
    }, [facilities, search]);

    return (
        <Layout>
            <div className="min-h-screen px-4 pb-32 pt-4 space-y-5">
                
                {/* Header */}
                <div className="px-1">
                    <h1 className="text-3xl font-extrabold text-gray-900">База Точек</h1>
                    <p className="text-gray-400 text-sm font-medium">Полный список</p>
                </div>
                
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Поиск..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white rounded-[20px] h-12 pl-11 pr-4 border border-gray-100 shadow-sm focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                </div>

                {/* List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="text-center py-10 text-gray-400">Загрузка...</div>
                    ) : filtered.length > 0 ? (
                        filtered.map((f) => {
                            // Безопасное получение рейтинга
                            const score = f.score ?? 0; // Если undefined, будет 0
                            
                            let badgeColor = "bg-gray-100 text-gray-500";
                            if (score > 75) badgeColor = "bg-green-100 text-green-700";
                            else if (score < 30 && score > 0) badgeColor = "bg-red-50 text-red-500";

                            return (
                                <StandardCard
                                    key={f.id}
                                    title={f.name}
                                    subtitle={f.address}
                                    color="white"
                                    floating={false}
                                    onClick={() => navigate(`/facilities/${f.id}`)}
                                    showArrow
                                    icon={Building2}
                                    // Передаем кастомный бейдж в action
                                    action={
                                        score > 0 && (
                                            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${badgeColor}`}>
                                                {score}%
                                            </span>
                                        )
                                    }
                                />
                            );
                        })
                    ) : (
                        <div className="text-center py-10 text-gray-400">Пусто</div>
                    )}
                </div>

                {/* FAB (Floating Button) */}
                <Link to="/facilities/new" className="fixed bottom-24 right-4 z-40">
                    <motion.div 
                        whileTap={{ scale: 0.9 }}
                        className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-blue-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-500/40"
                    >
                        <Plus size={28} />
                    </motion.div>
                </Link>

            </div>
        </Layout>
    );
};

export default FacilitiesListPage;