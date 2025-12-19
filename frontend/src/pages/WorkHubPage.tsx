import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListItem } from '../components/ui/ListItem';
import { Building2, Search, Plus } from 'lucide-react';
import apiClient from '../api/apiClient';
import { motion } from 'framer-motion';
import WebApp from '@twa-dev/sdk';

const WorkHubPage: React.FC = () => {
    const navigate = useNavigate();
    const [facilities, setFacilities] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    const handleNavigate = (path: string) => {
        WebApp.HapticFeedback.impactOccurred('light');
        navigate(path);
    };

    useEffect(() => {
        apiClient.get('/api/facilities')
            .then(res => setFacilities(res.data || []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        if (!search) return facilities.slice(0, 50); // Show top 50 initially for performance
        const term = search.toLowerCase();
        return facilities.filter(f =>
            f.name.toLowerCase().includes(term) ||
            (f.address && f.address.toLowerCase().includes(term))
        ).slice(0, 50); // Limit search results too
    }, [facilities, search]);

    return (
        <div className="safe-p-top pb-32 space-y-6 px-4">
            {/* Header */}
            <div className="flex justify-between items-center py-2">
                <div>
                    <h1 className="text-[28px] font-extrabold text-[#000000] tracking-tight">Где сегодня?</h1>
                    <p className="text-[14px] text-[#8E8E93] font-medium">Выберите точку для начала смены</p>
                </div>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleNavigate('/facilities/new')}
                    className="w-12 h-12 bg-white rounded-full border border-[#C6C6C8]/30 flex items-center justify-center text-[#007AFF] shadow-ios"
                >
                    <Plus size={24} />
                </motion.button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93]">
                    <Search size={20} />
                </div>
                <input
                    type="text"
                    placeholder="Найти заведение..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 h-12 bg-white rounded-2xl border border-[#C6C6C8]/30 text-[17px] outline-none shadow-ios focus:ring-2 focus:ring-[#007AFF]/10 transition-all font-medium"
                />
            </div>

            {/* Venues List */}
            <div className="space-y-2">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-8 h-8 border-[3px] border-[#007AFF] border-t-transparent rounded-full animate-spin" />
                        <p className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wider">Загрузка базы...</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filtered.length > 0 ? (
                            filtered.map((f) => (
                                <ListItem
                                    key={f.id}
                                    title={f.name}
                                    subtitle={f.address || 'Адрес не указан'}
                                    icon={Building2}
                                    onClick={() => handleNavigate(`/facilities/${f.id}`)}
                                />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-16 h-16 bg-[#F2F2F7] rounded-full flex items-center justify-center mb-4">
                                    <Search size={28} className="text-[#C6C6C8]" />
                                </div>
                                <h3 className="font-bold text-[#000000]">Ничего не найдено</h3>
                                <p className="text-[14px] text-[#8E8E93] mt-1 px-10">Проверьте правильность написания или добавьте новую точку</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {facilities.length > 50 && !search && (
                <p className="text-center text-[12px] text-[#8E8E93] pt-2">
                    Показано 50 из {facilities.length} точек. Используйте поиск.
                </p>
            )}
        </div>
    );
};

export default WorkHubPage;