import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Search, Plus, MapPin } from 'lucide-react';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

interface Facility {
  id: number;
  name: string;
  address: string;
  isVerified: boolean;
  daysSinceLastVisit: number | null;
  score: number;
}

const isMustVisit = (facility: Facility) => {
  return facility.daysSinceLastVisit === null || facility.daysSinceLastVisit >= 7;
};

const WorkHubPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<Facility[]>('/api/facilities');
        if (isMounted) setFacilities(res.data || []);
      } catch (e) {
        toast.error('Не удалось загрузить список точек');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const filterMode = searchParams.get('filter');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = facilities;
    if (filterMode === 'must') {
      list = list.filter((f) => (f.score ?? 0) < 100);
    }
    if (!term) return list;
    return list.filter((f) =>
      [f.name, f.address].some((value) => value?.toLowerCase().includes(term))
    );
  }, [facilities, search, filterMode]);

  const mustVisit = useMemo(() => filtered.filter(isMustVisit), [filtered]);
  const regular = useMemo(() => filtered.filter((f) => !isMustVisit(f)), [filtered]);

  return (
    <div className="pb-24">
      <PageHeader
        title="Работа"
        subtitle={`${facilities.length} точек в базе`}
        rightAction={
          <button
            onClick={() => navigate('/facilities/new')}
            className="w-10 h-10 rounded-2xl bg-black text-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
          >
            <Plus size={20} strokeWidth={2} />
          </button>
        }
      />

      <div className="relative mb-6">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30">
          <Search size={18} strokeWidth={1.5} />
        </div>
        <input
          type="text"
          placeholder="Поиск по названию или адресу"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white/60 backdrop-blur-xl h-[52px] rounded-3xl pl-11 pr-4 text-[15px] font-medium shadow-[0_10px_30px_rgba(0,0,0,0.10)] border border-white/30 outline-none placeholder:text-black/30"
        />
      </div>

      {loading ? (
        <WorkHubSkeleton />
      ) : filtered.length === 0 ? (
        <div className="text-center text-black/50 mt-10">Ничего не найдено</div>
      ) : (
        <div className="space-y-6">
          {mustVisit.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/50 px-1">
                В приоритете
              </h2>
              {mustVisit.map((item) => (
                <FacilityRow key={item.id} facility={item} onClick={() => navigate(`/facilities/${item.id}`)} />
              ))}
            </section>
          )}

          {regular.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/50 px-1">
                Все точки
              </h2>
              {regular.map((item) => (
                <FacilityRow key={item.id} facility={item} onClick={() => navigate(`/facilities/${item.id}`)} />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
};

const FacilityRow: React.FC<{ facility: Facility; onClick: () => void }> = ({ facility, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white/60 backdrop-blur-xl rounded-3xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.10)] border border-white/30 active:scale-[0.99] transition-transform"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-semibold text-black">{facility.name}</h3>
            {facility.isVerified && <span className="h-2 w-2 rounded-full bg-black/30" />}
          </div>
          <p className="text-[12px] text-black/50 flex items-center gap-1 mt-1">
            <MapPin size={12} strokeWidth={1.5} className="text-black/30" />
            {facility.address}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div className="px-2 py-1 rounded-xl text-[11px] font-semibold bg-black/5 border border-white/40 text-black/70">
            Must {facility.score ?? 0}%
          </div>
          <span className="text-[11px] text-black/35">
            {facility.daysSinceLastVisit !== null ? `${facility.daysSinceLastVisit} дн.` : '—'}
          </span>
        </div>
      </div>
    </button>
  );
};

const WorkHubSkeleton: React.FC = () => {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((item) => (
        <div key={item} className="h-20 rounded-3xl bg-white/60 border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.06)]" />
      ))}
    </div>
  );
};

export default WorkHubPage;
