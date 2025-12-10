import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import {
  MapPin,
  TrendingUp,
  AlertOctagon,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  History,
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface Product { id: number; flavor: string; category: string; line: string; }
interface Visit { id: number; date: string; type: string; user?: { fullName: string }; productsAvailable?: Product[]; }
interface FacilityResponse {
  facility: { id: number; name: string; address: string; tier?: string; format?: string; lat?: number; lng?: number; visits: Visit[]; };
  lastVisit: Visit | null;
  currentStock: Product[];
  missingRecommendations?: (Product & { count?: number })[];
  categoryBreakdown?: Record<string, number>;
}

const cleanName = (name: string) => {
  let cleaned = name.split('(')[0].trim();
  if (cleaned === cleaned.toUpperCase()) cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  return cleaned;
};

const COLORS: Record<string, string> = {
  Bliss: '#F472B6',
  'White Line': '#94A3B8',
  'Black Line': '#171717',
  'Cigar Line': '#D97706',
  Other: '#6366F1',
};

const FacilityPage: React.FC = () => {
  const { id } = useParams();
  const [data, setData] = useState<FacilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [openVisitId, setOpenVisitId] = useState<number | null>(null);

  useEffect(() => {
    apiClient
      .get<FacilityResponse>(`/api/facilities/${id}`)
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const lineStats = useMemo(() => {
    if (!data?.categoryBreakdown) return [];
    const total = Object.values(data.categoryBreakdown).reduce((a, b) => a + b, 0);
    return Object.entries(data.categoryBreakdown)
      .map(([name, value]) => ({
        name,
        value,
        percent: total ? Math.round((value / total) * 100) : 0,
        fill: COLORS[name] || COLORS['Other'],
      }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const groupedMissing = useMemo(() => {
    if (!data?.missingRecommendations) return {};
    return data.missingRecommendations.reduce((acc, item) => {
      const line = item.line || 'Другое';
      if (!acc[line]) acc[line] = [];
      acc[line].push(item);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [data]);

  const healthScore = useMemo(() => {
    if (!data) return 0;
    const missingCount = data.missingRecommendations?.length || 0;
    return Math.max(0, 100 - missingCount * 5);
  }, [data]);

  if (loading || !data) {
    return (
      <Layout>
        <div className="h-screen flex items-center justify-center bg-[#F8F9FA] text-gray-400">Загрузка...</div>
      </Layout>
    );
  }

  const { facility, currentStock } = data;

  return (
    <Layout>
      <PageHeader title={cleanName(facility.name)} back />

      <div className="pt-[calc(env(safe-area-inset-top)+60px)] px-4 pb-32 space-y-4">
        <div className="text-center mb-1">
          <div className="inline-flex items-center justify-center px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500">
            <MapPin size={12} className="mr-1" /> {facility.address}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
            <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Health</div>
            <div className={`text-xl font-bold ${healthScore > 80 ? 'text-green-500' : 'text-amber-500'}`}>{healthScore}%</div>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
            <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">SKU</div>
            <div className="text-xl font-bold text-gray-900">{currentStock.length}</div>
          </div>
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
            <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Визиты</div>
            <div className="text-xl font-bold text-gray-900">{facility.visits.length}</div>
          </div>
        </div>

        {facility.lat && facility.lng && (
          <div className="h-32 w-full rounded-2xl overflow-hidden shadow-sm border border-gray-100 relative z-0">
            <MapContainer
              center={[facility.lat, facility.lng]}
              zoom={15}
              zoomControl={false}
              dragging={false}
              className="w-full h-full"
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
              <Marker position={[facility.lat, facility.lng]} />
            </MapContainer>
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-indigo-600" />
            <h3 className="font-bold text-gray-900">Полка</h3>
          </div>
          <div className="flex flex-col items-center">
            <div className="h-48 w-48 mb-6 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={lineStats} innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
                    {lineStats.map((e, i) => (
                      <Cell key={i} fill={e.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-gray-900">{currentStock.length}</span>
                <span className="text-[10px] text-gray-400 uppercase">Всего</span>
              </div>
            </div>
            <div className="w-full space-y-3">
              {lineStats.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.fill }}></span>
                    <span className="text-gray-600 font-medium">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 font-medium">{s.percent}%</span>
                    <span className="font-bold text-gray-900">{s.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <AlertOctagon size={18} className="text-rose-500" />
              Рекомендации
            </h3>
          </div>
          {Object.keys(groupedMissing).length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
                <CheckCircle2 size={24} />
              </div>
              <p className="text-gray-900 font-medium">Отличная работа!</p>
              <p className="text-gray-500 text-sm mt-1">Все топовые позиции в наличии</p>
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(groupedMissing).map(([line, items]) => (
                <div key={line}>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-100 pb-1">
                    {line}
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {items.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-xl hover:bg-rose-50/50 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-700 ml-1">{cleanName(p.flavor)}</span>
                        <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-transparent"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
            <History size={18} className="text-gray-400" />
            История
          </h3>
          <div className="space-y-0 relative border-l-2 border-gray-100 ml-2.5">
            {facility.visits.map((v) => (
              <div key={v.id} className="pl-6 pb-8 last:pb-0 relative">
                <div className="absolute -left-[7px] top-1.5 w-3.5 h-3.5 bg-white border-[3px] border-gray-300 rounded-full"></div>
                <div onClick={() => setOpenVisitId(openVisitId === v.id ? null : v.id)} className="cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-bold text-gray-900">
                        {new Date(v.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{v.user?.fullName}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {v.productsAvailable && v.productsAvailable.length > 0 && (
                        <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md">
                          +{v.productsAvailable.length}
                        </span>
                      )}
                      {openVisitId === v.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </div>
                  {openVisitId === v.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3 overflow-hidden">
                      <div className="flex flex-wrap gap-1.5">
                        {v.productsAvailable?.map((p) => (
                          <span key={p.id} className="text-[10px] px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                            {cleanName(p.flavor)}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-gray-100 z-40 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <Link to={`/visit/new?facilityId=${facility.id}`}>
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="w-full h-12 bg-[#007AFF] text-white rounded-xl font-semibold text-base shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
          >
            Начать визит <ArrowRight size={18} />
          </motion.button>
        </Link>
      </div>
    </Layout>
  );
};

export default FacilityPage;
