import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import apiClient from '../api/apiClient';
import WebApp from '@twa-dev/sdk';
import toast from 'react-hot-toast';

interface FacilitySuggestion {
  id: number;
  name: string;
  address: string;
}

const NewFacilityPage: React.FC = () => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [facilities, setFacilities] = useState<FacilitySuggestion[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    apiClient
      .get<FacilitySuggestion[]>('/api/facilities')
      .then((res) => setFacilities(res.data || []))
      .catch(() => toast.error('Не удалось загрузить список точек'));
  }, []);

  const nameSuggestions = useMemo(() => {
    const term = name.trim().toLowerCase();
    if (term.length < 2) return [];
    return facilities.filter((f) => f.name?.toLowerCase().includes(term)).slice(0, 5);
  }, [facilities, name]);

  const handleSubmit = async () => {
    if (name.trim().length < 2) {
      toast.error('Введите название');
      return;
    }
    if (address.trim().length < 3) {
      toast.error('Введите адрес');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post('/api/facilities', { name, address });
      const createdId = res.data?.facility?.id ?? res.data?.id;
      WebApp.HapticFeedback?.notificationOccurred('success');
      toast.success('Точка создана');
      if (createdId) {
        navigate(`/facilities/${createdId}`);
      } else {
        navigate('/work');
      }
    } catch (e) {
      toast.error('Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="Новая точка"
        subtitle="Создание объекта"
        rightAction={
          <button onClick={() => navigate(-1)} className="text-sm font-semibold text-gray-500">
            Закрыть
          </button>
        }
      />

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5">
        <div className="space-y-2 relative">
          <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Название</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setTimeout(() => setNameFocused(false), 200)}
            className="w-full bg-[#F5F5F7] rounded-2xl px-4 py-3.5 text-gray-900 font-medium border border-gray-100 focus:bg-white focus:ring-2 focus:ring-black/5 outline-none transition-all"
            placeholder="Например: Мята Lounge"
          />
          {nameFocused && nameSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-md border border-gray-100 z-50 overflow-hidden">
              {nameSuggestions.map((facility) => (
                <button
                  key={facility.id}
                  onClick={() => {
                    setName(facility.name);
                    setAddress(facility.address);
                  }}
                  className="w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50"
                >
                  <div className="font-semibold text-sm text-gray-800">{facility.name}</div>
                  <div className="text-xs text-gray-400">{facility.address}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase ml-1">Адрес</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-[#F5F5F7] rounded-2xl px-4 py-3.5 text-gray-900 font-medium border border-gray-100 focus:bg-white focus:ring-2 focus:ring-black/5 outline-none transition-all"
            placeholder="Улица, дом..."
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-4 rounded-3xl bg-black text-white font-semibold text-base shadow-md disabled:opacity-60"
      >
        {loading ? 'Создаем...' : 'Создать точку'}
      </button>
    </div>
  );
};

export default NewFacilityPage;
