import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import apiClient from '../api/apiClient';
import WebApp from '@twa-dev/sdk';
import { useNavigate } from 'react-router-dom';
import { MapPin, Loader2 } from 'lucide-react';

const formats = [
  { value: 'Лаунж', label: 'Лаунж' },
  { value: 'Магазин', label: 'Магазин' },
];

const NewFacilityPage: React.FC = () => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [format, setFormat] = useState(formats[0].value);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [facilities, setFacilities] = useState<{ id: number; name: string; address: string }[]>([]);
  const navigate = useNavigate();

  // Auto-detect location on page load
  useEffect(() => {
    detectLocation();
  }, []);

  // Load existing facilities for smart suggestions (avoid duplicates)
  useEffect(() => {
    apiClient
      .get('/api/facilities')
      .then((res) => setFacilities(res.data || []))
      .catch((e) => console.error('Failed to load facilities for suggestions', e));
  }, []);

  const nameSuggestions = useMemo(() => {
    const term = name.trim().toLowerCase();
    if (term.length < 2) return [];
    return facilities
      .filter((f) => f.name?.toLowerCase().includes(term))
      .slice(0, 6);
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
          const city = data.address?.city || data.address?.town || data.address?.village || '';
          const region = data.address?.state || '';
          const road = data.address?.road || '';
          const houseNumber = data.address?.house_number || '';

          // Build address string
          let addrParts = [];
          if (city) addrParts.push(city);
          if (region && region !== city) addrParts.push(region);
          if (road) addrParts.push(road);
          if (houseNumber) addrParts.push(houseNumber);

          if (addrParts.length > 0) {
            setAddress(addrParts.join(', '));
          }
        } catch (e) {
          console.error('Geocoding error:', e);
        } finally {
          setGeoLoading(false);
        }
      },
      () => setGeoLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async () => {
    if (name.trim().length < 2 || address.trim().length < 5) {
      WebApp.showAlert('Заполните название и адрес');
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post('/api/facilities', { name, address, format });
      const facilityId = res.data?.facility?.id || res.data?.id;
      WebApp.HapticFeedback?.notificationOccurred('success');
      if (facilityId) navigate(`/facility/${facilityId}`);
      else navigate('/facilities');
    } catch (e: any) {
      WebApp.HapticFeedback?.notificationOccurred('error');
      const msg =
        e?.response?.data?.message === 'Такое заведение уже есть'
          ? 'Это заведение уже есть в базе'
          : 'Ошибка сохранения';
      WebApp.showAlert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <PageHeader title="Новое заведение" back />
      <div className="bg-[#F8F9FA] min-h-screen pt-[calc(env(safe-area-inset-top)+60px)] px-4 pb-24 space-y-5">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <label className="text-sm font-semibold text-[#1C1C1E]">Название</label>
          <div className="relative">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setTimeout(() => setNameFocused(false), 150)}
              className="w-full bg-gray-100 rounded-xl p-3 text-sm"
              placeholder="Например: Мята Lounge"
            />

            {nameFocused && nameSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden z-20">
                <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Похожие заведения в базе
                </div>
                <div className="max-h-[240px] overflow-y-auto">
                  {nameSuggestions.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        WebApp.HapticFeedback?.impactOccurred('light');
                        navigate(`/facility/${f.id}`);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition"
                    >
                      <div className="font-semibold text-sm text-[#1C1C1E]">{f.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5 truncate">{f.address}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-[#1C1C1E]">Адрес</label>
            <button
              type="button"
              onClick={detectLocation}
              disabled={geoLoading}
              className="flex items-center gap-1.5 text-xs text-[#007AFF] font-medium active:opacity-70 transition disabled:opacity-50"
            >
              {geoLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Определяем...</span>
                </>
              ) : (
                <>
                  <MapPin size={14} />
                  <span>Определить</span>
                </>
              )}
            </button>
          </div>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-gray-100 rounded-xl p-3 text-sm"
            placeholder="Город, улица, дом"
          />
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <label className="text-sm font-semibold text-[#1C1C1E]">Формат</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full bg-gray-100 rounded-xl p-3 text-sm"
          >
            {formats.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#007AFF] text-white py-4 rounded-2xl font-semibold shadow-lg shadow-blue-500/20 active:scale-[0.98] transition disabled:opacity-60"
        >
          {loading ? 'Сохраняем...' : 'Сохранить'}
        </button>
      </div>
    </Layout>
  );
};

export default NewFacilityPage;
