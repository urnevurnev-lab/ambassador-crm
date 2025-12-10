import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader'; // Используем наш новый хедер
import apiClient from '../api/apiClient';
import { MapPin, Search, ChevronRight, Building2 } from 'lucide-react';

interface Facility { id: number; name: string; address: string; }
interface Visit { facilityId: number; }

const FacilitiesListPage: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiClient.get('/api/facilities'), apiClient.get('/api/visits')])
      .then(([fac, vis]) => {
        setFacilities(fac.data || []);
        setVisits(vis.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const visitCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    visits.forEach(v => { if (v.facilityId) counts[v.facilityId] = (counts[v.facilityId] || 0) + 1; });
    return counts;
  }, [visits]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return facilities.filter(f => 
      !f.name.startsWith('Активность:') &&
      (f.name.toLowerCase().includes(term) || f.address?.toLowerCase().includes(term))
    );
  }, [facilities, search]);

  if (loading) return <Layout><div className="h-screen flex items-center justify-center text-gray-400 bg-[#F8F9FA]">Загрузка...</div></Layout>;

  return (
    <Layout>
      {/* 1. Светлый хедер с кнопкой "Назад" слева (безопасно) */}
      <PageHeader
        title="База точек"
        back
        rightContent={
          <Link
            to="/facility/new"
            className="w-9 h-9 rounded-full bg-[#007AFF] text-white flex items-center justify-center text-lg font-bold"
          >
            +
          </Link>
        }
      />

      <div className="bg-[#F8F9FA] min-h-screen pt-[calc(env(safe-area-inset-top)+60px)] pb-32 px-4">
        
        {/* 2. Поиск (светлый стиль) */}
        <div className="relative mb-6">
            <div className="absolute left-4 top-3.5 text-gray-400 pointer-events-none">
                <Search size={18} />
            </div>
            <input 
                type="text" 
                placeholder="Поиск по названию..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white text-[#1C1C1E] placeholder-gray-400 rounded-2xl py-3 pl-11 pr-4 outline-none border border-gray-200 focus:border-[#007AFF] focus:ring-4 focus:ring-[#007AFF]/10 transition shadow-sm"
            />
        </div>

        {/* 3. Список (карточки) */}
        <div className="space-y-3">
            {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
                    <Search size={48} className="opacity-20 mb-4"/>
                    <p>Ничего не найдено</p>
                </div>
            )}
            
            {filtered.map((f) => (
                <Link key={f.id} to={`/facility/${f.id}`}>
                    <div className="bg-white p-4 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-gray-100 active:scale-[0.98] transition-transform flex justify-between items-center group">
                        <div className="flex items-start gap-3 overflow-hidden">
                            {/* Иконка */}
                            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-500 group-hover:bg-[#007AFF]/10 group-hover:text-[#007AFF] transition-colors shrink-0">
                                <Building2 size={20}/>
                            </div>
                            
                            {/* Текст */}
                            <div className="min-w-0">
                                <div className="font-semibold text-[15px] text-[#1C1C1E] truncate leading-tight mb-1">{f.name}</div>
                                <div className="text-xs text-gray-400 flex items-center truncate">
                                    <MapPin size={12} className="mr-1 shrink-0"/> 
                                    {f.address || 'Адрес не указан'}
                                </div>
                            </div>
                        </div>
                        
                        {/* Бейдж и стрелка */}
                        <div className="flex items-center gap-3 shrink-0 pl-2">
                            {visitCounts[f.id] ? (
                                <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                                    {visitCounts[f.id]}
                                </span>
                            ) : null}
                            <ChevronRight size={16} className="text-gray-300"/>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
      </div>
    </Layout>
  );
};
export default FacilitiesListPage;
