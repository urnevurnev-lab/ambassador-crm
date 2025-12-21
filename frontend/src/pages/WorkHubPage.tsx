import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { StandardCard } from '../components/ui/StandardCard';
import { Search, Plus, MapPin, Filter } from 'lucide-react';
import apiClient from '../api/apiClient';

interface Facility {
  id: number;
  name: string;
  address: string;
  isVerified: boolean;
  daysSinceLastVisit: number | null;
  score: number;
}

const WorkHubPage: React.FC = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get('/api/facilities');
        setFacilities(res.data);
      } catch (e) { console.error(e); } 
      finally { setLoading(false); }
    };
    load();
  }, []);

  const filtered = facilities.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) || 
    f.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pb-24">
      <PageHeader 
        title="Работа" 
        subtitle={`${facilities.length} точек в базе`}
        rightAction={
          <button 
            onClick={() => navigate('/facility/new')}
            className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
          >
            <Plus size={24} />
          </button>
        }
      />

      {/* Поиск */}
      <div className="relative mb-6">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <Search size={20} />
        </div>
        <input 
          type="text"
          placeholder="Поиск по названию..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white h-[56px] rounded-[24px] pl-12 pr-4 text-[17px] font-medium shadow-soft outline-none placeholder:text-gray-300"
        />
      </div>

      {/* Список */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center text-gray-400 mt-10">Загрузка...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">Ничего не найдено</div>
        ) : (
          filtered.map(item => (
            <div 
              key={item.id}
              onClick={() => navigate(`/facility/${item.id}`)}
              className="w-full bg-white rounded-[28px] p-5 shadow-soft active:scale-[0.98] transition-all flex justify-between items-center"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-[17px] font-bold text-black">{item.name}</h3>
                  {item.isVerified && (
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </div>
                <p className="text-[13px] text-[#86868B] flex items-center gap-1">
                  <MapPin size={12} /> {item.address}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1">
                 <div className={`px-2 py-1 rounded-lg text-[11px] font-bold ${item.score > 70 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                   {item.score}%
                 </div>
                 <span className="text-[11px] text-gray-400">
                   {item.daysSinceLastVisit ? `${item.daysSinceLastVisit} дн.` : '—'}
                 </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default WorkHubPage;