import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { Search, ChevronRight, Building2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFacilities } from '../context/FacilitiesContext';

const FacilitiesListPage: React.FC = () => {
    const { facilities, loading } = useFacilities();
    const [search, setSearch] = useState('');

    // useEffect removed - handled by context

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
                <div className="sticky top-[calc(env(safe-area-inset-top)+10px)] z-30 mb-6">
                    <div className="relative shadow-sm rounded-[24px]">
                        <div className="absolute left-4 top-3.5 text-gray-400 pointer-events-none">
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Поиск точки или адреса..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white text-[#1C1C1E] rounded-[24px] py-3 pl-11 pr-4 outline-none border border-gray-200 focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 transition-all text-sm font-medium"
                        />
                    </div>
                </div>

                {/* Список */}
                {loading ? (
                    <div className="text-center text-gray-400 mt-10">Загрузка...</div>
                ) : (
                    <div className="space-y-3 pb-20">
                        {filtered.map((f) => {
                            const score = f.score || 0;
                            let borderColor = 'border-gray-100';
                            let glow = '';
                            if (score > 75) {
                                borderColor = 'border-green-400';
                                glow = 'shadow-[0_4px_12px_rgba(34,197,94,0.15)]';
                            } else if (score < 30) {
                                borderColor = 'border-red-300';
                            }

                            return (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.2 }}
                            key={f.id}
                        >
                            <Link to={`/facilities/${f.id}`}>
                                <div className={`bg-white p-5 rounded-[30px] border ${borderColor} ${glow} active:scale-[0.98] transition-all shadow-sm flex justify-between items-center group relative overflow-hidden`}>
                                    {/* Score Badge */}
                                    {score > 0 && (
                                        <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-2xl text-[10px] font-bold ${score > 75 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {score}%
                                                </div>
                                            )}

                                            <div className="flex items-center gap-4 overflow-hidden">
                                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 shrink-0 group-hover:bg-[#1C1C1E] group-hover:text-white transition-colors">
                                                    <Building2 size={24} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-bold text-[16px] text-[#1C1C1E] truncate mb-0.5">{f.name}</div>
                                                    <div className="text-xs text-gray-400 truncate font-medium">{f.address}</div>
                                                </div>
                                            </div>
                                            <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center">
                                                <ChevronRight size={16} className="text-gray-300" />
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                        {filtered.length === 0 && (
                            <div className="text-center text-gray-400 py-10">Ничего не найдено</div>
                        )}
                    </div>
                )}

                {/* Плавающая кнопка добавления (FAB) */}
                <Link to="/facilities/new" className="fixed bottom-[100px] right-4 z-50">
                    <motion.div
                        whileTap={{ scale: 0.9 }}
                        className="w-14 h-14 bg-[#1C1C1E] rounded-full flex items-center justify-center text-white shadow-xl border border-white/20"
                    >
                        <Plus size={28} />
                    </motion.div>
                </Link>

            </div>
        </Layout>
    );
};
export default FacilitiesListPage;
