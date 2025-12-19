import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { StandardCard } from '../components/ui/StandardCard';
import { Building2, Search, Plus, MapPin } from 'lucide-react';
import apiClient from '../api/apiClient';
import { motion } from 'framer-motion';

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
            <div className="px-4 pb-32 pt-4 bg-[#F8F9FE] min-h-screen space-y-6">
                
                {/* ЗАГОЛОВОК + КНОПКА ДОБАВИТЬ */}
                <div className="flex justify-between items-end px-1">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 leading-none">
                            Работа
                        </h1>
                        <p className="text-gray-400 text-sm font-medium mt-1">Твоя территория</p>
                    </div>
                    <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate('/facilities/new')}
                        className="w-12 h-12 bg-blue-600 rounded-full text-white flex items-center justify-center shadow-lg shadow-blue-500/30"
                    >
                        <Plus size={24} strokeWidth={3} />
                    </motion.button>
                </div>

                {/* ПОИСК (Красивый инпут) */}
                <div className="relative shadow-sm">
                    <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Найти заведение или адрес..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 h-12 bg-white rounded-[20px] border border-gray-100 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-gray-400 font-medium"
                    />
                </div>

                {/* СПИСОК ЗАВЕДЕНИЙ */}
                <div className="space-y-3">
                    {loading ? (
                         <div className="text-center py-10 text-gray-400 animate-pulse">Загрузка базы...</div>
                    ) : (
                        <>
                            {filtered.map(f => (
                                <StandardCard
                                    key={f.id}
                                    title={f.name}
                                    subtitle={f.address || 'Адрес не указан'}
                                    color="white" // Белые аккуратные карточки
                                    floating={false} // Списки не должны плавать, иначе укачает
                                    onClick={() => navigate(`/facilities/${f.id}`)}
                                    showArrow
                                    icon={Building2}
                                />
                            ))}
                            
                            {filtered.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                                    <MapPin size={48} className="mb-2 opacity-20" />
                                    <p>Ничего не найдено</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default WorkHubPage;