import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import apiClient from '../api/apiClient';
import { MapPin, Search, ChevronRight, Building2 } from 'lucide-react';

interface Facility { id: number; name: string; address: string; }
interface Visit { facilityId: number; }

const FacilitiesListPage: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
      !f.name.startsWith('Активность:') && // Скрываем B2B
      (f.name.toLowerCase().includes(term) || f.address?.toLowerCase().includes(term))
    );
  }, [facilities, search]);

  if (loading) return <Layout><div className="h-screen flex items-center justify-center text-gray-400">Загрузка...</div></Layout>;

  return (
    <Layout>
      <div className="bg-[#F8F9FA] min-h-screen pb-[calc(env(safe-area-inset-bottom)+120px)]">
        {/* HEADER */}
        <div className="bg-[#111] text-white pt-[calc(env(safe-area-inset-top)+16px)] pb-8 px-5 rounded-b-[2rem] shadow-xl sticky top-0 z-30">
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => navigate(-1)} className="text-white/60 hover:text-white transition font-medium">Назад</button>
                <div className="font-bold text-lg">Заведения</div>
                <div className="w-10"></div>
            </div>
            
            <h1 className="text-3xl font-bold mb-4">База точек</h1>
            
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Поиск по названию или адресу"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white/10 backdrop-blur-md text-white placeholder-white/40 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:bg-white/20 transition border border-white/5"
                />
            </div>
        </div>

        {/* LIST */}
        <div className="px-4 mt-6 space-y-3">
            {filtered.length === 0 && <div className="text-center text-gray-400 mt-10">Ничего не найдено</div>}
            
            {filtered.map((f) => (
                <Link key={f.id} to={`/facility/${f.id}`}>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 active:scale-[0.98] transition-transform flex justify-between items-center">
                        <div className="flex items-start gap-3 overflow-hidden">
                            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
                                <Building2 size={20}/>
                            </div>
                            <div className="min-w-0">
                                <div className="font-bold text-gray-900 truncate">{f.name}</div>
                                <div className="text-xs text-gray-500 flex items-center mt-0.5 truncate">
                                    <MapPin size={12} className="mr-1 shrink-0"/> 
                                    {f.address || 'Адрес не указан'}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 shrink-0 pl-2">
                            {visitCounts[f.id] ? (
                                <span className="text-[10px] font-bold bg-gray-900 text-white px-2 py-1 rounded-lg">
                                    {visitCounts[f.id]} виз.
                                </span>
                            ) : null}
                            <ChevronRight size={18} className="text-gray-300"/>
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
