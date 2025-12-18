import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Plus, Building2 } from 'lucide-react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { StandardCard } from '../components/ui/StandardCard'; // Наш новый стандарт
import { useFacilities } from '../context/FacilitiesContext';

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
            <PageHeader title="База точек" />

            <div className="min-h-screen bg-[#F3F4F6] px-4 pb-32">
                
                {/* Поиск - в стиле карточки */}
                <div className="sticky top-[60px] z-30 mb-4 pt-2">
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Поиск точки или адреса..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white text-gray-900 rounded-2xl py-3 pl-11 pr-4 border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                        />
                    </div>
                </div>

                {/* Список заведений */}
                {loading ? (
                    <div className="flex justify-center mt-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map((f) => {
                            const score = f.score || 0;
                            // Цвет рейтинга
                            let badgeColor = "bg-gray-100 text-gray-500";
                            if (score > 75) badgeColor = "bg-green-100 text-green-700";
                            else if (score < 30 && score > 0) badgeColor = "bg-red-50 text-red-500";

                            return (
                                <StandardCard
                                    key={f.id}
                                    title={f.name}
                                    subtitle={f.address}
                                    icon={Building2}
                                    onClick={() => navigate(`/facilities/${f.id}`)}
                                    showArrow={true} // Стрелочка сама появится
                                    action={
                                        score > 0 && (
                                            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${badgeColor}`}>
                                                {score}%
                                            </span>
                                        )
                                    }
                                />
                            );
                        })}

                        {filtered.length === 0 && (
                            <div className="text-center text-gray-400 py-10 font-medium">
                                Ничего не найдено
                            </div>
                        )}
                    </div>
                )}

                {/* FAB - Кнопка добавления */}
                <Link to="/facilities/new" className="fixed bottom-safe right-4 z-40 mb-20">
                    <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center text-white shadow-xl active:scale-90 transition-transform">
                        <Plus size={28} />
                    </div>
                </Link>

            </div>
        </Layout>
    );
};

export default FacilitiesListPage;