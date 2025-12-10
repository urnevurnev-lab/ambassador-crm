import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronRight, Check, Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { useNavigate } from 'react-router-dom';

const PLACES = [
    { id: 1, name: 'Coffeeline', coords: { lat: 55.7558, lng: 37.6173 } },
    { id: 2, name: 'Мята Lounge', coords: { lat: 55.76, lng: 37.62 } },
    { id: 3, name: 'Hookah Place', coords: { lat: 55.75, lng: 37.63 } },
];

export const VisitWizard = () => {
    const [step, setStep] = useState(1);
    const [selectedPlace, setSelectedPlace] = useState<any>(null);
    const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const navigate = useNavigate();

    const handleSelectPlace = (place: any) => {
        setSelectedPlace(place);
        setStep(2);
        checkGeo(place.coords);
    };

    const checkGeo = (targetCoords: { lat: number, lng: number }) => {
        setGeoStatus('loading');

        if (!navigator.geolocation) {
            setGeoStatus('error');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const dist = getDistanceFromLatLonInKm(latitude, longitude, targetCoords.lat, targetCoords.lng);

                // DEV MODE: Always success if localhost
                const isDev = import.meta.env.DEV;

                // 0.2 km = 200m
                if (dist < 0.2 || isDev) {
                    if (WebApp.HapticFeedback) WebApp.HapticFeedback.notificationOccurred('success');
                    setTimeout(() => {
                        setGeoStatus('success');
                        setStep(3);
                    }, 1500); // Fake delay for UX
                } else {
                    if (WebApp.HapticFeedback) WebApp.HapticFeedback.notificationOccurred('error');
                    setGeoStatus('error');
                }
            },
            () => setGeoStatus('error')
        );
    };

    const submit = () => {
        if (WebApp.HapticFeedback) WebApp.HapticFeedback.notificationOccurred('success');
        navigate('/');
    };

    // Haversine Algo
    function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2 - lat1);  // deg2rad below
        var dLon = deg2rad(lon2 - lon1);
        var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
            ;
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c; // Distance in km
        return d;
    }

    function deg2rad(deg: number) {
        return deg * (Math.PI / 180)
    }

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
            scale: 0.9
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 300 : -300,
            opacity: 0,
            scale: 0.9
        })
    };

    return (
        <div className="h-full flex flex-col pt-4 overflow-hidden relative">
            <header className="flex items-center mb-6 px-1">
                <button onClick={() => navigate('/')} className="mr-4 p-2 bg-white rounded-full shadow-sm">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold">Новый визит</h1>
            </header>

            <div className="flex-1 relative">
                <AnimatePresence initial={false} custom={step}>
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            className="absolute inset-0"
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            custom={1}
                        >
                            <h2 className="text-2xl font-bold mb-4 px-1">Выберите заведение</h2>
                            <div className="space-y-3">
                                {PLACES.map(place => (
                                    <button key={place.id} onClick={() => handleSelectPlace(place)} className="w-full text-left bg-white p-5 rounded-[24px] shadow-sm flex items-center justify-between active:scale-95 transition-transform">
                                        <div className="flex items-center">
                                            <div className="p-3 bg-blue-50 text-ios-blue rounded-2xl mr-4">
                                                <MapPin size={24} />
                                            </div>
                                            <div>
                                                <span className="font-bold text-lg">{place.name}</span>
                                                <div className="text-xs text-gray-400">0.5 км</div>
                                            </div>
                                        </div>
                                        <ChevronRight className="text-gray-300" />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            className="absolute inset-0 flex flex-col items-center justify-center text-center"
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            custom={1}
                        >
                            {geoStatus === 'loading' && (
                                <>
                                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-4 animate-pulse">
                                        <Loader2 size={40} className="text-ios-blue animate-spin" />
                                    </div>
                                    <h2 className="text-xl font-bold mb-2">Проверяем геопозицию...</h2>
                                    <p className="text-gray-500">Пожалуйста, подождите</p>
                                </>
                            )}
                            {geoStatus === 'error' && (
                                <>
                                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
                                        <AlertCircle size={40} className="text-red-500" />
                                    </div>
                                    <h2 className="text-xl font-bold mb-2">Вы слишком далеко</h2>
                                    <p className="text-gray-500 mb-6 px-10">Подойдите ближе к заведению, чтобы начать визит.</p>
                                    <button onClick={() => setStep(1)} className="bg-gray-200 text-gray-900 px-6 py-3 rounded-xl font-bold">
                                        Попробовать другое
                                    </button>
                                    <button onClick={() => checkGeo(selectedPlace.coords)} className="mt-4 text-ios-blue font-semibold">
                                        Повторить проверку
                                    </button>
                                </>
                            )}
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            className="absolute inset-0"
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            custom={1}
                        >
                            <div className="flex items-center space-x-3 mb-6 bg-green-50 p-4 rounded-[24px] text-green-700">
                                <div className="bg-white p-2 rounded-full">
                                    <Check size={20} />
                                </div>
                                <span className="font-bold">Визит активен</span>
                            </div>

                            <h3 className="font-bold text-lg mb-4">Чек-лист задач</h3>
                            <div className="space-y-3 mb-8">
                                {['Проверить выкладку', 'Сделать фото полки', 'Провести дегустацию'].map((task, i) => (
                                    <div key={i} className="bg-white p-4 rounded-2xl flex items-center shadow-sm">
                                        <div className="w-6 h-6 rounded-full border-2 border-gray-200 mr-3"></div>
                                        <span className="font-medium">{task}</span>
                                    </div>
                                ))}
                            </div>

                            <button onClick={submit} className="w-full bg-ios-blue text-white py-4 rounded-[24px] font-bold shadow-lg shadow-blue-500/30 active:scale-95 transition-transform">
                                Завершить визит
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
