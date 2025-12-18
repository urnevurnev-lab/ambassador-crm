import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { StandardCard } from '../components/ui/StandardCard';
import { Building2, Search } from 'lucide-react';
import apiClient from '../api/apiClient';

const WorkHubPage: React.FC = () => {
    const navigate = useNavigate();
    const [facilities, setFacilities] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Загружаем список заведений
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
            <PageHeader title="Работа" />
            
            <div className="px-4 pb-32 pt-2 bg-[#F3F4F6] min-h-screen">
                {/* Поиск */}
                <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Найти заведение..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-white rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-black/5"
                    />
                </div>

                {loading ? (
                     <div className="text-center py-10 text-gray-400">Загрузка точек...</div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(f => (
                            <StandardCard
                                key={f.id}
                                title={f.name}
                                subtitle={f.address || 'Адрес не указан'}
                                icon={Building2}
                                onClick={() => navigate(`/facilities/${f.id}`)}
                                showArrow={true}
                            />
                        ))}
                        {filtered.length === 0 && (
                            <div className="text-center py-10 text-gray-400">Точки не найдены</div>
                        )}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default WorkHubPage;