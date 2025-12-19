import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { StandardCard } from '../components/ui/StandardCard';
import { Building2, Search, Plus, MapPin, ChevronRight } from 'lucide-react';
import apiClient from '../api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';

const WorkHubPage: React.FC = () => {
    const navigate = useNavigate();
    const [facilities, setFacilities] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/api/facilities')
            .then(res => setFacilities(res.data || []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const filtered = facilities.filter(f =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        (f.address && f.address.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <Layout>
            <div className="space-y-6 pb-12">

                {/* ЗАГОЛОВОК */}
                <div className="flex justify-between items-end px-1">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1">Выбор объекта</p>
                        <h1 className="text-3xl font-extrabold text-gray-900 leading-none">
                            Где сегодня?
                        </h1>
                    </motion.div>

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate('/facilities/new')}
                        className="w-12 h-12 bg-white rounded-2xl border border-gray-100 flex items-center justify-center text-blue-600 shadow-sm"
                    >
                        <Plus size={24} strokeWidth={2.5} />
                    </motion.button>
                </div>

                {/* ПОИСК */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="relative"
                >
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Search size={20} />
                    </div>
                    <input
                        type="text"
                        placeholder="Найти заведение или адрес..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 h-14 bg-white rounded-[24px] border border-gray-100 text-base focus:ring-4 focus:ring-blue-500/5 outline-none transition-all placeholder:text-gray-400 font-medium shadow-sm shadow-blue-500/5"
                    />
                </motion.div>

                {/* СПИСОК ЗАВЕДЕНИЙ */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                            <p className="text-gray-400 font-medium animate-pulse">Загрузка базы...</p>
                        </div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {filtered.length > 0 ? (
                                filtered.map((f, index) => (
                                    <motion.div
                                        key={f.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <StandardCard
                                            title={f.name}
                                            subtitle={f.address || 'Адрес не указан'}
                                            color="white"
                                            floating={false}
                                            onClick={() => navigate(`/facilities/${f.id}`)}
                                            icon={Building2}
                                            action={
                                                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
                                                    <ChevronRight size={18} className="text-gray-300" />
                                                </div>
                                            }
                                        />
                                    </motion.div>
                                ))
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-20 text-gray-400"
                                >
                                    <div className="p-6 bg-gray-50 rounded-full mb-4">
                                        <MapPin size={40} className="opacity-20 translate-y-1" />
                                    </div>
                                    <p className="font-bold">Ничего не найдено</p>
                                    <p className="text-sm">Попробуй другой запрос</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default WorkHubPage;