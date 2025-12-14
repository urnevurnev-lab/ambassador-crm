import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Loader2, Lock, Unlock } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { PageHeader } from '../components/PageHeader';
import { VisitForm } from '../components/activities/VisitForm';
import { ContactForm } from '../components/activities/ContactForm';
import { OpenShiftForm } from '../components/activities/OpenShiftForm';

interface Facility { id: number; name: string; address: string; lat: number; lng: number; }
interface Product { id: number; flavor: string; line: string; sku: string; }
interface Activity { id: number; code: string; name: string; description?: string; }

// Этапы визита
type Step = 'select' | 'lock' | 'activity' | 'form' | 'summary' | 'done';

export const VisitWizard = () => {
    const [step, setStep] = useState<Step>('select');
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    
    const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    const [deviceLocation, setDeviceLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [comment, setComment] = useState('');
    const [contacts, setContacts] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [cups, setCups] = useState('');
    
    const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [loading, setLoading] = useState(true);
    const [showGhostButton, setShowGhostButton] = useState(false);
    const [isInputFocused, setIsInputFocused] = useState(false);
    
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preselectedId = searchParams.get('facilityId');
    const smartEntry = searchParams.get('smart') === '1';

    // 1. Загрузка данных
    useEffect(() => {
        const loadData = async () => {
            try {
                const [facRes, prodRes, actRes] = await Promise.all([
                    apiClient.get<Facility[]>('/api/facilities'),
                    apiClient.get<Product[]>('/api/products'),
                    apiClient.get<Activity[]>('/api/activities')
                ]);
                
                setFacilities(facRes.data);
                setProducts(prodRes.data);
                setActivities(actRes.data);

                // ЛОГИКА АВТО-ВЫБОРА И ЗАМКА
                if (preselectedId) {
                    const found = facRes.data.find(f => f.id === Number(preselectedId));
                    if (found) {
                        handleFacilitySelect(found, { smart: smartEntry });
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
    }, [preselectedId, smartEntry]);

    const handleFacilitySelect = (facility: Facility, opts?: { smart?: boolean }) => {
        setSelectedFacility(facility);
        setGeoStatus('idle');
        setDeviceLocation(null);

        if (opts?.smart) {
            setStep('activity');
            checkGeo({ facility, autoProceed: true });
        } else {
            setStep('lock');
        }
    };

    // 2. Проверка GPS
    const bindLocation = () => {
        if (!selectedFacility) return;
        if (!navigator.geolocation) {
            WebApp.showAlert('Геолокация недоступна');
            return;
        }
        setGeoStatus('loading');
        setShowGhostButton(false);

        setTimeout(() => {
            if (geoStatus === 'loading') {
                setShowGhostButton(true);
            }
        }, 5000);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setDeviceLocation({ lat: latitude, lng: longitude });
                try {
                    await apiClient.patch(`/api/facilities/${selectedFacility.id}`, {
                        lat: latitude,
                        lng: longitude,
                    });
                    const updated = { ...selectedFacility, lat: latitude, lng: longitude };
                    setSelectedFacility(updated);
                    WebApp.HapticFeedback.notificationOccurred('success');
                    WebApp.showAlert('Координаты точки обновлены! Продолжаем визит.');
                    setGeoStatus('success');
                    setStep('activity');
                } catch (e) {
                    WebApp.showAlert('Не удалось обновить координаты');
                    setGeoStatus('error');
                }
            },
            () => {
                WebApp.showAlert('Не удалось получить геопозицию');
                setGeoStatus('error');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const checkGeo = (options?: { facility?: Facility; autoProceed?: boolean }) => {
        const targetFacility = options?.facility || selectedFacility;
        if (!targetFacility) return;
        
        // Если координаты точки не заданы — позволяем привязать их вручную
        if (!targetFacility.lat || !targetFacility.lng) {
            setGeoStatus('error'); 
            if (options?.autoProceed) setStep('lock');
            return;
        }

        setGeoStatus('loading');

        if (!navigator.geolocation) {
            setGeoStatus('error');
            if (options?.autoProceed) setStep('lock');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setDeviceLocation({ lat: latitude, lng: longitude });
                const dist = getDistanceFromLatLonInKm(latitude, longitude, targetFacility.lat, targetFacility.lng);
                
                // 150 метров
                if (dist < 0.15) {
                    WebApp.HapticFeedback.notificationOccurred('success');
                    setGeoStatus('success');
                    if (options?.autoProceed) {
                        setStep('activity');
                    } else {
                        setTimeout(() => setStep('activity'), 1200); 
                    }
                } else {
                    WebApp.HapticFeedback.notificationOccurred('error');
                    setGeoStatus('error');
                    if (options?.autoProceed) setStep('lock');
                }
            },
            () => {
                setGeoStatus('error');
                if (options?.autoProceed) setStep('lock');
            },
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
        if (selectedFacility?.lat && selectedFacility?.lng && !deviceLocation) {
            WebApp.showAlert('Подтвердите геопозицию перед отправкой');
            setStep('lock');
            return;
        }
        if (!deviceLocation) {
            WebApp.showAlert('Не удалось получить координаты. Включите GPS.');
            return;
        }
        const payload: any = {
            facilityId: selectedFacility.id,
            activityId: selectedActivity.id,
            type: selectedActivity.code || 'VISIT',
            productsAvailable: selectedProducts,
            lat: deviceLocation.lat,
            lng: deviceLocation.lng,
            comment: comment
        };

        // Собираем специфичные данные по активности
        if (selectedActivity.code === 'visit') {
            payload.data = {
                contacts,
                products: selectedProducts,
            };
        } else if (selectedActivity.code === 'tasting' || selectedActivity.code === 'b2b') {
            payload.data = {
                contacts,
                note: comment,
            };
        } else if (selectedActivity.code === 'open_shift') {
            payload.data = {
                startTime,
                endTime,
                cups: cups ? Number(cups) : null,
            };
        }
        try {
            const res = await apiClient.post('/api/visits', payload);
            if (res.data?.alert) {
                WebApp.showAlert(res.data.alert);
            }
            WebApp.HapticFeedback.notificationOccurred('success');
            window.dispatchEvent(new Event('visit:created'));
            setStep('done');
        } catch (e) {
            const msg = (e as any)?.response?.data?.message;
            WebApp.showAlert(Array.isArray(msg) ? msg.join(', ') : msg || 'Ошибка отправки');
        }
    };

    // --- RENDER ---
    return (
        <div className="h-full bg-[#F8F9FA] flex flex-col">
            <PageHeader title="Визит" back={step === 'select'} />
            
            <div className={`flex-grow pt-[calc(env(safe-area-inset-top)+60px)] ${isInputFocused ? 'pb-64' : 'pb-10'} px-4 relative overflow-hidden`}>
                <AnimatePresence mode="wait">
                    
                    {/* 1. ВЫБОР (если не пришли с карты) */}
                    {step === 'select' && (
                        <motion.div key="select" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-3">
                            <h2 className="text-xl font-bold mb-2">Выберите заведение</h2>
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Поиск заведения..."
                                className="w-full bg-white p-3 rounded-2xl border border-gray-200 shadow-sm focus:ring-2 ring-blue-500"
                            />
                            {loading ? <Loader2 className="animate-spin mx-auto"/> : 
                             facilities
                                .filter(f => {
                                    const term = searchTerm.toLowerCase().trim();
                                    if (!term) return true;
                                    return f.name.toLowerCase().includes(term) || f.address.toLowerCase().includes(term);
                                })
                                .map(f => (
                                    <div key={f.id} onClick={() => handleFacilitySelect(f)} className="bg-white p-4 rounded-2xl shadow-sm flex justify-between items-center active:scale-95 transition">
                                        <div>
                                            <div className="font-bold">{f.name}</div>
                                            <div className="text-xs text-gray-500">{f.address}</div>
                                        </div>
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

                            {geoStatus === 'error' && (
                                <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4">
                                    <div className="text-red-500 font-bold mb-2">
                                        {selectedFacility.lat ? 'Вы далеко от точки!' : 'У точки нет координат!'}
                                    </div>
                                    <p className="text-xs text-gray-500 mb-4 max-w-[200px]">
                                        Если вы действительно находитесь в заведении, обновите его координаты.
                                    </p>
                                    
                                    <button 
                                        onClick={bindLocation}
                                        className="bg-blue-100 text-blue-700 px-6 py-3 rounded-xl font-bold text-sm mb-4 active:scale-95 transition"
                                    >
                                        📍 Я здесь! Привязать геолокацию
                                    </button>
                                    
                                    <button onClick={() => checkGeo()} className="text-gray-400 text-sm underline">
                                        Попробовать проверить еще раз
                                    </button>
                                </div>
                            )}
                            {geoStatus === 'success' && <div className="text-green-600 font-bold mb-4">Доступ открыт!</div>}

                            {geoStatus !== 'success' && (
                                <>
                                    <button onClick={() => checkGeo()} className="w-full max-w-xs bg-black text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition">
                                        📍 Открыть смену
                                    </button>
                                    {showGhostButton && (
                                        <button
                                            onClick={() => {
                                                WebApp.showAlert('Сделайте фото фасада для отчёта');
                                                setGeoStatus('success');
                                                setStep('activity');
                                            }}
                                            className="mt-3 w-full max-w-xs border border-gray-300 text-gray-700 py-3 rounded-2xl font-semibold text-sm active:scale-95 transition bg-white/70"
                                        >
                                            Я на месте, но GPS не ловит
                                        </button>
                                    )}
                                </>
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
                            {selectedActivity.code === 'visit' ? (
                                <VisitForm
                                    products={products}
                                    selectedProducts={selectedProducts}
                                    onToggleProduct={(id) => setSelectedProducts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                                    contacts={contacts}
                                    onContactsChange={setContacts}
                                    comment={comment}
                                    onCommentChange={setComment}
                                    onSubmit={() => setStep('summary')}
                                />
                            ) : selectedActivity.code === 'tasting' || selectedActivity.code === 'b2b' ? (
                                <ContactForm
                                    contacts={contacts}
                                    onContactsChange={setContacts}
                                    comment={comment}
                                    onCommentChange={setComment}
                                    onSubmit={() => setStep('summary')}
                                    title={selectedActivity.code === 'tasting' ? 'Дегустация' : 'B2B Визит'}
                                />
                            ) : selectedActivity.code === 'open_shift' ? (
                                <OpenShiftForm
                                    startTime={startTime}
                                    endTime={endTime}
                                    cups={cups}
                                    comment={comment}
                                    onChange={(field, value) => {
                                        if (field === 'startTime') setStartTime(value);
                                        if (field === 'endTime') setEndTime(value);
                                        if (field === 'cups') setCups(value);
                                        if (field === 'comment') setComment(value);
                                    }}
                                    onSubmit={() => setStep('summary')}
                                />
                            ) : null}
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
                                onFocus={() => setIsInputFocused(true)}
                                onBlur={() => setIsInputFocused(false)}
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
