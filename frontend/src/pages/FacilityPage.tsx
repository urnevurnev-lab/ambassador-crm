import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { StandardCard } from '../components/ui/StandardCard';
import {
  Briefcase,
  Car,
  MapPin,
  ShoppingCart,
  History,
  Package,
  ArrowLeft,
  ChevronRight,
  Timer,
  Wine
} from 'lucide-react';
import toast from 'react-hot-toast';

interface FacilityInfo {
  id: number;
  name: string;
  address: string;
}

interface ProductInfo {
  id: number;
  line: string;
  flavor: string;
}

interface FacilityResponse {
  facility: FacilityInfo;
  currentStock: ProductInfo[];
}

const VISIT_SCENARIOS = [
  { code: 'transit', title: 'Проезд', subtitle: 'Чек-ин и инвентарь', Icon: Car },
  { code: 'checkup', title: 'Открытая смена', subtitle: 'Время и чашки', Icon: Timer },
  { code: 'tasting', title: 'Дегустация', subtitle: 'Участники и фидбек', Icon: Wine },
  { code: 'b2b', title: 'B2B', subtitle: 'Переговоры и ЛПР', Icon: Briefcase },
] as const;

const FacilityPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<FacilityResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<FacilityResponse>(`/api/facilities/${id}`);
        if (isMounted) setData(res.data);
      } catch (e) {
        toast.error('Не удалось загрузить данные точки');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
        <p className="text-gray-400 font-medium">Загрузка...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-gray-500 py-20">
        Не удалось загрузить данные
      </div>
    );
  }

  const { facility, currentStock } = data;

  return (
    <div className="space-y-6 pb-24">
      <div className="pt-2">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-gray-500 font-semibold text-xs uppercase tracking-widest"
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          Назад
        </button>

        <div className="px-1">
          <h1 className="text-[28px] font-bold text-gray-900 leading-tight">
            {facility.name}
          </h1>
          <div className="flex items-center gap-2 mt-3 text-gray-500 text-sm">
            <MapPin size={14} strokeWidth={1.5} className="text-gray-400 shrink-0" />
            <span className="leading-tight">{facility.address || 'Адрес не указан'}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="px-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/50">
            Активности
          </div>
          <div className="mt-2 text-[18px] font-semibold text-black">Что вы делаете в точке?</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {VISIT_SCENARIOS.map(({ code, title, subtitle, Icon }) => (
            <button
              key={code}
              onClick={() => navigate(`/visit?facilityId=${facility.id}&type=${code}`)}
              className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.10)] p-4 text-left active:scale-[0.99] transition-transform"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[15px] font-semibold text-black">{title}</div>
                  <div className="mt-1 text-[12px] text-black/50">{subtitle}</div>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-black/5 border border-white/40 flex items-center justify-center text-black/60 shrink-0">
                  <Icon size={18} strokeWidth={1.5} />
                </div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate(`/orders?facilityId=${facility.id}`)}
          className="w-full py-4 bg-black/75 backdrop-blur-xl border border-white/10 rounded-3xl text-white flex items-center justify-center gap-3 shadow-[0_20px_60px_rgba(0,0,0,0.22)] active:scale-[0.99] transition-transform"
        >
          <ShoppingCart size={18} strokeWidth={1.75} className="text-white/80" />
          <span className="text-[14px] font-semibold uppercase tracking-widest">Сформировать заказ</span>
        </button>
      </div>

      <div className="space-y-4">
        <StandardCard title="На полке" floating={false} className="bg-white/60 backdrop-blur-xl border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.10)]">
          <div className="flex flex-wrap gap-2">
            {currentStock && currentStock.length > 0 ? (
              currentStock.map((product) => (
                <span
                  key={product.id}
                  className="text-[11px] font-semibold bg-black/5 border border-white/40 text-gray-900 px-3 py-1.5 rounded-xl"
                >
                  {product.flavor}
                </span>
              ))
            ) : (
              <div className="flex items-center gap-3 py-2 text-gray-400 text-sm font-medium">
                <Package size={18} strokeWidth={1.5} className="opacity-40" />
                Остатки не заполнены
              </div>
            )}
          </div>
        </StandardCard>

        <button
          onClick={() => navigate(`/visits-history?facilityId=${facility.id}`)}
          className="w-full bg-white/60 backdrop-blur-xl p-5 rounded-3xl border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.10)] flex items-center gap-4 text-left active:scale-[0.99] transition-transform"
        >
          <div className="w-12 h-12 bg-black/5 border border-white/40 rounded-2xl flex items-center justify-center text-black/60">
            <History size={22} strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-semibold text-black">История визитов</h3>
            <p className="text-[13px] text-black/50">Прошлые активности</p>
          </div>
          <ChevronRight size={18} strokeWidth={2} className="text-black/30" />
        </button>
      </div>
    </div>
  );
};

export default FacilityPage;
