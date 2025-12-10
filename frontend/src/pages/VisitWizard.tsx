import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronRight, Check, Loader2, Lock, Unlock, Package } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { PageHeader } from '../components/PageHeader';

interface Facility { id: number; name: string; address: string; lat: number; lng: number; }
interface Product { id: number; flavor: string; line: string; sku: string; }

type Step = 'select' | 'lock' | 'activity' | 'stock' | 'summary' | 'done';
const activities = ['Проезд', 'Открытая смена', 'B2B', 'Дегустация'];

export const VisitWizard = () => {
  const [step, setStep] = useState<Step>('select');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<string>('');
  const [comment, setComment] = useState('');

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get('facilityId');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [facRes, prodRes] = await Promise.all([
          apiClient.get<Facility[]>('/api/facilities'),
          apiClient.get<Product[]>('/api/products'),
        ]);
        const valid = facRes.data.filter((f) => f.lat && f.lng);
        setFacilities(valid);
        setProducts(prodRes.data);

        if (preselectedId) {
          const found = valid.find((f) => f.id === Number(preselectedId));
          if (found) {
            setSelectedFacility(found);
            setStep('lock');
          }
        }
      } catch {
        WebApp.showAlert('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [preselectedId]);

  const groupedProducts = useMemo(
    () =>
      products.reduce((acc, p) => {
        (acc[p.line] = acc[p.line] || []).push(p);
        return acc;
      }, {} as Record<string, Product[]>),
    [products],
  );

  const checkGeo = () => {
    if (!selectedFacility) return;
    setGeoStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const dist = getDistanceFromLatLonInKm(pos.coords.latitude, pos.coords.longitude, selectedFacility.lat, selectedFacility.lng);
        const isDev = import.meta.env.DEV;
        if (dist < 0.1 || isDev) {
          WebApp.HapticFeedback?.notificationOccurred('success');
          setGeoStatus('success');
          setTimeout(() => setStep('activity'), 600);
        } else {
          WebApp.HapticFeedback?.notificationOccurred('error');
          setGeoStatus('error');
        }
      },
      () => setGeoStatus('error'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const toggleProduct = (id: number) => {
    setSelectedProducts((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  };

  const handleSubmit = async () => {
    if (!selectedFacility || !activity) {
      WebApp.showAlert('Выберите активность');
      return;
    }
    try {
      await apiClient.post('/api/visits', {
        facilityId: selectedFacility.id,
        type: activity,
        productsAvailable: selectedProducts,
        lat: selectedFacility.lat,
        lng: selectedFacility.lng,
        comment: comment || undefined,
      });
      WebApp.HapticFeedback?.notificationOccurred('success');
      setStep('done');
    } catch {
      WebApp.HapticFeedback?.notificationOccurred('error');
      WebApp.showAlert('Ошибка при отправке визита');
    }
  };

  return (
    <div className="h-full bg-[#F8F9FA] flex flex-col">
      <PageHeader title="Новый визит" back />

      <div className="flex-grow pt-[calc(env(safe-area-inset-top)+60px)] pb-10 px-4 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {step === 'select' && (
            <motion.div key="select" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-3">
              <h2 className="text-xl font-bold mb-2">Где вы находитесь?</h2>
              {loading ? (
                <Loader2 className="animate-spin mx-auto text-gray-400" />
              ) : (
                facilities.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => {
                      setSelectedFacility(f);
                      setStep('lock');
                    }}
                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-95 transition"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                        <MapPin size={20} />
                      </div>
                      <div>
                        <div className="font-bold truncate">{f.name}</div>
                        <div className="text-xs text-gray-500 truncate">{f.address}</div>
                      </div>
                    </div>
                    <ChevronRight className="text-gray-300" />
                  </div>
                ))
              )}
            </motion.div>
          )}

          {step === 'lock' && selectedFacility && (
            <motion.div
              key="lock"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full flex items-center justify-center relative"
            >
              <div className="absolute inset-0 bg-white/70 backdrop-blur-md rounded-3xl" />
              <div className="relative z-10 text-center space-y-4 px-6">
                <div
                  className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center shadow-lg transition ${
                    geoStatus === 'success'
                      ? 'bg-green-100 text-green-600'
                      : geoStatus === 'error'
                        ? 'bg-red-100 text-red-500'
                        : 'bg-white text-gray-700'
                  }`}
                >
                  {geoStatus === 'loading' ? <Loader2 size={48} className="animate-spin" /> : geoStatus === 'success' ? <Unlock size={48} /> : <Lock size={48} />}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Заведение</p>
                  <h2 className="text-2xl font-bold text-[#1C1C1E]">{selectedFacility.name}</h2>
                  <p className="text-xs text-gray-500 mt-1">{selectedFacility.address}</p>
                </div>
                <button
                  onClick={checkGeo}
                  disabled={geoStatus === 'loading'}
                  className="w-full bg-[#1C1C1E] text-white py-4 rounded-2xl font-semibold shadow-lg active:scale-95 transition"
                >
                  {geoStatus === 'loading' ? 'Проверяем GPS...' : 'Открыть смену'}
                </button>
                {geoStatus === 'error' && <p className="text-sm text-red-500">Далеко от точки. Подойдите ближе (100м).</p>}
              </div>
            </motion.div>
          )}

          {step === 'activity' && (
            <motion.div key="activity" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 mb-3">Что делаем сегодня?</p>
                <div className="grid grid-cols-2 gap-3">
                  {activities.map((act) => (
                    <button
                      key={act}
                      onClick={() => {
                        setActivity(act);
                        setStep('stock');
                      }}
                      className={`p-3 rounded-2xl border text-sm font-semibold transition ${
                        activity === act ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]' : 'border-gray-200 bg-white text-[#1C1C1E]'
                      }`}
                    >
                      {act}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 'stock' && (
            <motion.div key="stock" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6 pb-20">
              <div className="flex items-center gap-3 bg-green-50 p-4 rounded-2xl text-green-700">
                <Unlock size={20} /> <span className="font-bold">Визит активен</span>
              </div>
              <h3 className="font-bold text-xl flex items-center gap-2">
                <Package size={20} /> Что на полке?
              </h3>
              {Object.entries(groupedProducts).map(([line, prods]) => (
                <div key={line} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                  <h4 className="font-bold text-gray-400 text-xs uppercase mb-3 tracking-wider">{line}</h4>
                  <div className="space-y-2">
                    {prods.map((p) => {
                      const isSelected = selectedProducts.includes(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => toggleProduct(p.id)}
                          className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${
                            isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white'
                          }`}
                        >
                          <span className="font-medium text-sm">{p.flavor}</span>
                          {isSelected && <Check size={16} className="text-blue-600" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              <button
                onClick={() => setStep('summary')}
                className="w-full bg-[#007AFF] text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/30 active:scale-95 transition"
              >
                Далее
              </button>
            </motion.div>
          )}

          {step === 'summary' && (
            <motion.div key="summary" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="space-y-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <p className="text-sm font-semibold text-[#1C1C1E] mb-2">Комментарий к визиту</p>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full h-28 bg-gray-100 rounded-xl p-3 text-sm resize-none"
                  placeholder="Например: нет Bliss Ананас, договорились о поставке..."
                />
              </div>
              <button
                onClick={handleSubmit}
                className="w-full bg-[#1C1C1E] text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition"
              >
                Завершить визит
              </button>
            </motion.div>
          )}

          {step === 'done' && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                <span className="text-4xl">🏆</span>
              </div>
              <h2 className="text-2xl font-bold">Визит завершен</h2>
              <p className="text-gray-500 text-sm">Данные отправлены. Спасибо!</p>
              <button onClick={() => navigate('/')} className="px-6 py-3 bg-gray-100 rounded-xl font-semibold">
                На главную
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; const dLat = deg2rad(lat2 - lat1); const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function deg2rad(deg: number) { return deg * (Math.PI / 180); }
