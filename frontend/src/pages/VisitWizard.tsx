import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronRight, Check, Loader2, Lock, Unlock, Package } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { PageHeader } from '../components/PageHeader'; // Убедись, что создал этот компонент ранее

// Типы
interface Facility { id: number; name: string; address: string; lat: number; lng: number; }
interface Product { id: number; flavor: string; line: string; sku: string; }

export const VisitWizard = () => {
    const [step, setStep] = useState(1);
    const [facilities, setFacilities] = useState<Facility[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    
    const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
    
    const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [loading, setLoading] = useState(true);
    
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const preselectedId = searchParams.get('facilityId');

    // 1. Загрузка данных
    useEffect(() => {
        const loadData = async () => {
            try {
                const [facRes, prodRes] = await Promise.all([
                    apiClient.get<Facility[]>('/api/facilities'),
                    apiClient.get<Product[]>('/api/products')
                ]);
                
                // Фильтруем только те, у которых есть координаты
                const valid = facRes.data.filter(f => f.lat && f.lng);
                setFacilities(valid);
                setProducts(prodRes.data);

                // Если пришли с карты (preselectedId)
                if (preselectedId) {
                    const found = valid.find(f => f.id === Number(preselectedId));
                    if (found) {
                        setSelectedFacility(found);
                        setStep(2); // Сразу на экран "Замка"
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

    // 2. Гео-Локация (Механика Замка)
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
                
                // Дистанция открытия (200 метров)
                const UNLOCK_DISTANCE_KM = 0.2; 
                const isDev = import.meta.env.DEV; // В режиме разработки пускаем всегда

                if (dist < UNLOCK_DISTANCE_KM || isDev) {
                    WebApp.HapticFeedback.notificationOccurred('success');
                    setGeoStatus('success');
                    setTimeout(() => setStep(3), 1500); // Анимация успеха перед переходом
                } else {
                    WebApp.HapticFeedback.notificationOccurred('error');
                    setGeoStatus('error');
                }
            },
            () => setGeoStatus('error'),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // 3. Отправка визита
    const handleSubmit = async () => {
        if (!selectedFacility) return;
        
        try {
            await apiClient.post('/api/visits', {
                facilityId: selectedFacility.id,
                type: 'VISIT',
                productsAvailable: selectedProducts, // Отправляем ID продуктов
                lat: selectedFacility.lat, // Для истории
                lng: selectedFacility.lng
            });
            
            WebApp.HapticFeedback.notificationOccurred('success');
            // Показываем успех и выходим
            setStep(4);
        } catch (e) {
            WebApp.showAlert('Ошибка при отправке визита');
        }
    };

    // Хелпер дистанции
    function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
        const R = 6371; const dLat = deg2rad(lat2 - lat1); const dLon = deg2rad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
    function deg2rad(deg: number) { return deg * (Math.PI / 180) }

    // Рендер продуктов по линиям
    const groupedProducts = products.reduce((acc, p) => {
        (acc[p.line] = acc[p.line] || []).push(p);
        return acc;
    }, {} as Record<string, Product[]>);

    return (
        <div className="h-full bg-[#F8F9FA] flex flex-col">
            <PageHeader title="Новый визит" back />
            
            <div className="flex-grow pt-[calc(env(safe-area-inset-top)+60px)] pb-10 px-4 relative overflow-hidden">
                <AnimatePresence mode="wait">
                    
                    {/* ШАГ 1: ВЫБОР ЗАВЕДЕНИЯ (Если не выбрано) */}
                    {step === 1 && (
                        <motion.div key="step1" initial={{opacity:0, x: 20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-3">
                            <h2 className="text-xl font-bold mb-4">Где вы находитесь?</h2>
                            {loading ? <Loader2 className="animate-spin mx-auto text-gray-400"/> : 
                             facilities.map(f => (
                                <div key={f.id} onClick={() => { setSelectedFacility(f); setStep(2); }} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-95 transition">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shrink-0"><MapPin size={20}/></div>
                                        <div>
                                            <div className="font-bold truncate">{f.name}</div>
                                            <div className="text-xs text-gray-500 truncate">{f.address}</div>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-gray-300"/>
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {/* ШАГ 2: GEO-LOCK (ЗАМОК) */}
                    {step === 2 && selectedFacility && (
                        <motion.div key="step2" initial={{opacity:0, scale:0.9}} animate={{opacity:1, scale:1}} exit={{opacity:0, scale:0.9}} className="h-full flex flex-col items-center justify-center text-center">
                            
                            <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 transition-colors duration-500 ${geoStatus === 'success' ? 'bg-green-100 text-green-600' : geoStatus === 'error' ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-400'}`}>
                                {geoStatus === 'loading' ? <Loader2 size={64} className="animate-spin"/> :
                                 geoStatus === 'success' ? <Unlock size={64}/> :
                                 <Lock size={64}/>}
                            </div>

                            <h2 className="text-2xl font-bold mb-2">
                                {geoStatus === 'success' ? 'Доступ разрешен!' : selectedFacility.name}
                            </h2>
                            <p className="text-gray-500 mb-8 max-w-[250px] mx-auto">
                                {geoStatus === 'success' ? 'Вы находитесь на точке. Заполните отчет.' : 
                                 geoStatus === 'error' ? 'Вы слишком далеко от заведения. Подойдите ближе.' : 
                                 'Подтвердите геопозицию, чтобы начать визит.'}
                            </p>

                            {geoStatus !== 'success' && (
                                <button onClick={checkGeo} disabled={geoStatus === 'loading'} className="w-full max-w-xs bg-[#1C1C1E] text-white py-4 rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition flex items-center justify-center gap-2">
                                    {geoStatus === 'loading' ? 'Проверка...' : '📍 Я на месте'}
                                </button>
                            )}
                        </motion.div>
                    )}

                    {/* ШАГ 3: ПОЛКА (ТОВАРЫ) */}
                    {step === 3 && (
                        <motion.div key="step3" initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="space-y-6 pb-20">
                            <div className="flex items-center gap-3 bg-green-50 p-4 rounded-2xl text-green-700 mb-6">
                                <Unlock size={20}/> <span className="font-bold">Визит активен</span>
                            </div>

                            <h3 className="font-bold text-xl flex items-center gap-2"><Package size={20}/> Что на полке?</h3>
                            
                            {Object.entries(groupedProducts).map(([line, prods]) => (
                                <div key={line} className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100">
                                    <h4 className="font-bold text-gray-400 text-xs uppercase mb-3 tracking-wider">{line}</h4>
                                    <div className="space-y-2">
                                        {prods.map(p => {
                                            const isSelected = selectedProducts.includes(p.id);
                                            return (
                                                <div key={p.id} onClick={() => setSelectedProducts(prev => isSelected ? prev.filter(id => id !== p.id) : [...prev, p.id])} 
                                                     className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white'}`}>
                                                    <span className="font-medium text-sm">{p.flavor}</span>
                                                    {isSelected && <Check size={16} className="text-blue-600"/>}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}

                            <button onClick={handleSubmit} className="fixed bottom-6 left-4 right-4 bg-[#007AFF] text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/30 active:scale-95 transition z-50">
                                Завершить визит (+50 XP)
                            </button>
                        </motion.div>
                    )}

                     {/* ШАГ 4: УСПЕХ */}
                     {step === 4 && (
                        <motion.div key="step4" initial={{scale: 0.8, opacity:0}} animate={{scale:1, opacity:1}} className="h-full flex flex-col items-center justify-center">
                            <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center mb-6 shadow-lg animate-bounce">
                                <span className="text-4xl">🏆</span>
                            </div>
                            <h2 className="text-3xl font-bold mb-2">+50 XP</h2>
                            <p className="text-gray-500 mb-8">Отличная работа!</p>
                            <button onClick={() => navigate('/')} className="px-8 py-3 bg-gray-100 rounded-xl font-semibold">На главную</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
