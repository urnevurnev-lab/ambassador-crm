import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Loader2, Lock, Unlock } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { PageHeader } from '../components/PageHeader';
import { StandardVisitForm } from '../components/activities/StandardVisitForm';
import { InventoryForm } from '../components/activities/InventoryForm';

interface Facility { id: number; name: string; address: string; lat: number; lng: number; }
interface Product { id: number; flavor: string; line: string; sku: string; }
interface Activity { id: number; code: string; name: string; description?: string; }

// Этапы визита
type Step = 'select' | 'lock' | 'activity' | 'form' | 'summary' | 'done';

export const VisitWizard = () => {
    const [step, setStep] = useState<Step>('select');
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    
    const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [comment, setComment] = useState('');
    const [standardNote, setStandardNote] = useState('');
    const [inventoryNote, setInventoryNote] = useState('');
    
    const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [loading, setLoading] = useState(true);
    
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preselectedId = searchParams.get('facilityId');

    // 1. Загрузка данных
    useEffect(() => {
        const loadData = async () => {
            try {
                const [facRes, prodRes, actRes] = await Promise.all([
                    apiClient.get<Facility[]>('/api/facilities'),
                    apiClient.get<Product[]>('/api/products'),
                    apiClient.get<Activity[]>('/api/activities')
                ]);
                
                const valid = facRes.data.filter(f => f.lat && f.lng);
                setFacilities(valid);
                setProducts(prodRes.data);
                setActivities(actRes.data);

                // ЛОГИКА АВТО-ВЫБОРА И ЗАМКА
                if (preselectedId) {
                    const found = valid.find(f => f.id === Number(preselectedId));
                    if (found) {
                        setSelectedFacility(found);
                        setStep('lock'); // <--- ПРИНУДИТЕЛЬНО СТАВИМ ЗАМОК
                    }
                }
            } catch (e) {
                console.error(e);
                WebApp.showAlert('Ошибка загрузки данных');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [preselectedId]);

    // 2. Проверка GPS
    const checkGeo = () => {
        if (!selectedFacility) return;
        setGeoStatus('loading');

        if (!navigator.geolocation) {
            setGeoStatus('error');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const dist = getDistanceFromLatLonInKm(latitude, longitude, selectedFacility.lat, selectedFacility.lng);
                
                // 100 метров или DEV режим
                const isDev = import.meta.env.DEV; 
                if (dist < 0.1 || isDev) {
                    WebApp.HapticFeedback.notificationOccurred('success');
                    setGeoStatus('success');
                    // Ждем анимацию и переходим к активности
                    setTimeout(() => setStep('activity'), 1200); 
                } else {
                    WebApp.HapticFeedback.notificationOccurred('error');
                    setGeoStatus('error');
                }
            },
            () => setGeoStatus('error'),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // 3. Отправка
    const handleSubmit = async () => {
        if (!selectedFacility) return;
        if (!selectedActivity) {
            WebApp.showAlert('Выберите активность');
            setStep('activity');
            return;
        }
        try {
            await apiClient.post('/api/visits', {
                facilityId: selectedFacility.id,
                activityId: selectedActivity.id,
                type: selectedActivity.code || 'VISIT',
                productsAvailable: selectedProducts,
                lat: selectedFacility.lat,
                lng: selectedFacility.lng,
                comment: comment
            });
            WebApp.HapticFeedback.notificationOccurred('success');
            setStep('done');
        } catch (e) {
            WebApp.showAlert('Ошибка отправки');
        }
    };

    // --- RENDER ---
    return (
        <div className="h-full bg-[#F8F9FA] flex flex-col">
            <PageHeader title="Визит" back={step === 'select'} />
            
            <div className="flex-grow pt-[calc(env(safe-area-inset-top)+60px)] pb-10 px-4 relative overflow-hidden">
                <AnimatePresence mode="wait">
                    
                    {/* 1. ВЫБОР (если не пришли с карты) */}
                    {step === 'select' && (
                        <motion.div key="select" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-3">
                            <h2 className="text-xl font-bold mb-4">Выберите заведение</h2>
                            {loading ? <Loader2 className="animate-spin mx-auto"/> : 
                             facilities.map(f => (
                                <div key={f.id} onClick={() => { setSelectedFacility(f); setStep('lock'); }} className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center active:scale-95 transition">
                                    <div className="font-bold">{f.name}</div>
                                    <ChevronRight className="text-gray-300"/>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {/* 2. ЗАМОК (LOCK) */}
                    {step === 'lock' && selectedFacility && (
                        <motion.div key="lock" initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:1.1, opacity:0}} className="h-full flex flex-col items-center justify-center text-center relative z-50">
                            {/* Блур фон */}
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-xl z-[-1] rounded-3xl"></div>
                            
                            <h2 className="text-2xl font-black mb-2">{selectedFacility.name}</h2>
                            <p className="text-gray-500 text-sm mb-10">{selectedFacility.address}</p>

                            <motion.div 
                                animate={geoStatus === 'success' ? { x: [0, -5, 5, -5, 5, 0], scale: 1.1 } : { scale: 1 }}
                                className={`w-40 h-40 rounded-full flex items-center justify-center mb-8 transition-colors duration-500 shadow-2xl ${geoStatus === 'success' ? 'bg-green-500 text-white' : geoStatus === 'error' ? 'bg-red-100 text-red-500' : 'bg-white text-gray-800'}`}
                            >
                                {geoStatus === 'loading' ? <Loader2 size={64} className="animate-spin"/> :
                                 geoStatus === 'success' ? <Unlock size={64}/> :
                                 <Lock size={64}/>}
                            </motion.div>

                            {geoStatus === 'error' && <div className="text-red-500 font-bold mb-4">Вы слишком далеко!</div>}
                            {geoStatus === 'success' && <div className="text-green-600 font-bold mb-4">Доступ открыт!</div>}

                            {geoStatus !== 'success' && (
                                <button onClick={checkGeo} className="w-full max-w-xs bg-black text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition">
                                    📍 Открыть смену
                                </button>
                            )}
                        </motion.div>
                    )}

                    {/* 3. АКТИВНОСТЬ */}
                    {step === 'activity' && (
                        <motion.div key="activity" initial={{x:50, opacity:0}} animate={{x:0, opacity:1}} exit={{x:-50, opacity:0}} className="space-y-4">
                            <h2 className="text-2xl font-bold">Что делаем сегодня?</h2>
                            {loading ? (
                                <Loader2 className="animate-spin mx-auto"/>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {activities.map(act => (
                                        <button
                                            key={act.id}
                                            onClick={() => { setSelectedActivity(act); setStep('form'); }}
                                            className="p-5 bg-white rounded-2xl shadow-sm text-left flex justify-between items-center active:scale-95 transition border border-gray-100"
                                        >
                                            <div>
                                                <div className="font-bold text-lg">{act.name}</div>
                                                {act.description && <div className="text-sm text-gray-500 mt-1">{act.description}</div>}
                                            </div>
                                            <ChevronRight className="text-gray-300"/>
                                        </button>
                                    ))}

                                    {activities.length === 0 && (
                                        <button
                                            onClick={() => {
                                                const fallback = { id: 0, code: 'standard_visit', name: 'Стандартный визит', description: 'Резерв, если не пришли данные с сервера' };
                                                setSelectedActivity(fallback);
                                                setStep('form');
                                            }}
                                            className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-left font-semibold text-blue-900"
                                        >
                                            Данные не пришли. Продолжить как «Стандартный визит».
                                        </button>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* 4. ФОРМА ПОД АКТИВНОСТЬ */}
                    {step === 'form' && selectedActivity && (
                        <motion.div key="form" initial={{opacity:0}} animate={{opacity:1}} className="space-y-4">
                            {selectedActivity.code === 'inventory' ? (
                                <InventoryForm
                                    products={products}
                                    selectedProducts={selectedProducts}
                                    onToggleProduct={(id) => setSelectedProducts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                                    note={inventoryNote}
                                    onNoteChange={setInventoryNote}
                                    onSubmit={() => {
                                        if (!comment && inventoryNote) setComment(inventoryNote);
                                        setStep('summary');
                                    }}
                                />
                            ) : (
                                <StandardVisitForm
                                    note={standardNote}
                                    onChange={setStandardNote}
                                    onSubmit={() => {
                                        if (!comment && standardNote) setComment(standardNote);
                                        setStep('summary');
                                    }}
                                />
                            )}
                        </motion.div>
                    )}

                    {/* 5. ИТОГ (КОММЕНТАРИЙ) */}
                    {step === 'summary' && (
                        <motion.div key="summary" initial={{opacity:0}} animate={{opacity:1}} className="space-y-4">
                            <h2 className="text-2xl font-bold">Комментарий</h2>
                            <textarea 
                                className="w-full h-40 p-4 rounded-2xl border-none shadow-sm resize-none focus:ring-2 ring-blue-500"
                                placeholder="Как прошел визит?"
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                            ></textarea>
                            <button onClick={handleSubmit} className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg shadow-lg">Завершить</button>
                        </motion.div>
                    )}

                    {/* 6. ФИНАЛ */}
                    {step === 'done' && (
                        <motion.div key="done" className="h-full flex flex-col items-center justify-center text-center">
                            <div className="text-6xl mb-4">✅</div>
                            <h2 className="text-3xl font-bold">Готово!</h2>
                            <button onClick={() => navigate('/')} className="bg-gray-100 px-8 py-3 rounded-xl font-bold mt-8">На главную</button>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
};

// --- Helpers ---
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; 
  const dLat = deg2rad(lat2 - lat1); 
  const dLon = deg2rad(lon2 - lon1); 
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
}
function deg2rad(deg: number) { return deg * (Math.PI/180); }
