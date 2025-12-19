import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from '../components/Layout';
import apiClient from '../api/apiClient';
import WebApp from '@twa-dev/sdk';
import { useNavigate } from 'react-router-dom';
import { MapPin, Loader2, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const NewFacilityPage: React.FC = () => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [facilities, setFacilities] = useState<{ id: number; name: string; address: string }[]>([]);
  const navigate = useNavigate();

  useEffect(() => { detectLocation(); }, []);
  useEffect(() => {
    apiClient.get('/api/facilities').then((res) => setFacilities(res.data || []));
  }, []);

  const nameSuggestions = useMemo(() => {
    const term = name.trim().toLowerCase();
    if (term.length < 2) return [];
    return facilities.filter((f) => f.name?.toLowerCase().includes(term)).slice(0, 5);
  }, [facilities, name]);

  const detectLocation = async () => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ru`
          );
          const data = await resp.json();
          // Упрощенная логика адреса для примера
          setAddress(data.display_name || `${latitude}, ${longitude}`);
        } catch (e) { console.error(e); }
        finally { setGeoLoading(false); }
      },
      () => setGeoLoading(false)
    );
  };

  const handleSubmit = async () => {
    if (name.trim().length < 2) {
      WebApp.showAlert('Введите название');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post('/api/facilities', { name, address });
      WebApp.HapticFeedback?.notificationOccurred('success');
      navigate(`/facilities/${res.data.id}`);
    } catch (e) {
      WebApp.showAlert('Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="bg-[#F8F9FE] min-h-screen px-4 pb-24 pt-4 space-y-6">

        {/* Хедер */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-extrabold text-gray-900">Новая точка</h1>
        </div>

        {/* Карточка с формой */}
        <div className="bg-white rounded-[28px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 space-y-5">

          {/* Название */}
          <div className="space-y-2 relative">
            <label className="text-xs font-bold text-gray-400 uppercase ml-1">Название</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setTimeout(() => setNameFocused(false), 200)}
              className="w-full bg-gray-50 rounded-2xl px-4 py-3.5 text-gray-900 font-medium border border-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              placeholder="Например: Мята Lounge"
            />
            {/* Подсказки */}
            {nameFocused && nameSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                {nameSuggestions.map(f => (
                  <div key={f.id} className="px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <div className="font-bold text-sm text-gray-800">{f.name}</div>
                    <div className="text-xs text-gray-400">{f.address}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Адрес */}
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-xs font-bold text-gray-400 uppercase">Адрес</label>
              <button
                onClick={detectLocation}
                className="text-xs font-bold text-blue-600 flex items-center gap-1 active:opacity-60"
              >
                {geoLoading ? <Loader2 size={12} className="animate-spin" /> : <MapPin size={12} />}
                Геопозиция
              </button>
            </div>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-gray-50 rounded-2xl px-4 py-3.5 text-gray-900 font-medium border border-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
              placeholder="Улица, дом..."
            />
          </div>

        </div>

        {/* Кнопка Сохранить */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-4 rounded-[24px] bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-lg shadow-[0_10px_30px_rgba(37,99,235,0.4)] disabled:opacity-70 disabled:shadow-none"
        >
          {loading ? 'Создаем...' : 'Создать точку'}
        </motion.button>

      </div>
    </Layout>
  );
};

export default NewFacilityPage;