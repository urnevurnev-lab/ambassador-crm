import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import apiClient from '../api/apiClient';
import WebApp from '@twa-dev/sdk';
import { useNavigate } from 'react-router-dom';

const formats = [
  { value: 'Лаунж', label: 'Лаунж' },
  { value: 'Магазин', label: 'Магазин' },
];

const NewFacilityPage: React.FC = () => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [format, setFormat] = useState(formats[0].value);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-100 rounded-xl p-3 text-sm"
            placeholder="Например: Мята Lounge"
          />
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
          <label className="text-sm font-semibold text-[#1C1C1E]">Адрес</label>
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
