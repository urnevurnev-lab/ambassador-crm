import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import apiClient from '../api/apiClient';
import { CheckCircle2, Camera } from 'lucide-react';
import WebApp from '@twa-dev/sdk';

// Компоненты форм (можно вынести, но для удобства держим здесь)
const CheckupForm = ({ onChange }: { onChange: (data: any) => void }) => (
  <div className="space-y-4">
    <div className="bg-white p-5 rounded-[30px] border border-gray-100">
      <h4 className="font-bold mb-3 text-sm">Наличие товара</h4>
      {['Black Line', 'White Line', 'Cigar'].map(line => (
        <div key={line} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
          <span className="text-sm text-gray-700">{line}</span>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="w-5 h-5 rounded text-black focus:ring-black"
              onChange={(e) => onChange({ [line]: e.target.checked })} />
            <span className="text-xs text-gray-400">Есть</span>
          </label>
        </div>
      ))}
    </div>
  </div>
);

const TrainingForm = ({ onChange }: { onChange: (data: any) => void }) => (
  <div className="space-y-4">
    <div className="bg-white p-5 rounded-[30px] border border-gray-100">
      <h4 className="font-bold mb-3 text-sm">Чек-лист обучения</h4>
      <label className="flex items-center gap-3 py-2">
        <input type="checkbox" className="w-5 h-5" onChange={(e) => onChange({ topic1: e.target.checked })} />
        <span className="text-sm">История бренда рассказана</span>
      </label>
      <label className="flex items-center gap-3 py-2">
        <input type="checkbox" className="w-5 h-5" onChange={(e) => onChange({ topic2: e.target.checked })} />
        <span className="text-sm">Технология забивки показана</span>
      </label>
    </div>
    <div className="bg-white p-5 rounded-[30px] border border-gray-100 flex items-center justify-center h-32 border-dashed border-2 border-gray-200 text-gray-400 gap-2">
      <Camera size={24} />
      <span className="text-sm font-medium">Фото команды (обязательно)</span>
    </div>
  </div>
);

const DefaultForm = ({ onChange }: { onChange: (data: any) => void }) => (
  <div className="bg-white p-5 rounded-[30px] border border-gray-100">
    <textarea
      className="w-full h-32 p-3 text-sm border border-gray-200 rounded-[20px] outline-none focus:border-black"
      placeholder="Комментарий к визиту..."
      onChange={(e) => onChange({ comment: e.target.value })}
    ></textarea>
  </div>
);

export const VisitWizard: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const facilityId = params.get('facilityId');
  const activityCode = params.get('activity');

  const [facility, setFacility] = useState<{ name: string } | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (facilityId) {
      apiClient.get(`/api/facilities/${facilityId}`).then(res => setFacility(res.data.facility));
    }
  }, [facilityId]);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    // Достаем геопозицию, если сохраняли её на предыдущем шаге
    const lat = sessionStorage.getItem('last_geo_lat');
    const lng = sessionStorage.getItem('last_geo_lng');

    try {
      await apiClient.post('/api/visits', {
        facilityId: Number(facilityId),
        type: activityCode || 'UNKNOWN',
        data: formData, // JSON с данными форм
        comment: formData.comment || 'Визит завершен',
        userLat: lat ? parseFloat(lat) : undefined,
        userLng: lng ? parseFloat(lng) : undefined
      });

      WebApp.showAlert('Визит успешно сохранен!');
      navigate('/');
    } catch (e) {
      console.error(e);
      WebApp.showAlert('Ошибка отправки отчета');
      setSubmitting(false);
    }
  };

  const updateForm = (newData: any) => setFormData((prev: any) => ({ ...prev, ...newData }));

  return (
    <Layout>
      <PageHeader title={facility?.name || 'Визит'} back />

      <div className="pt-[calc(env(safe-area-inset-top)+60px)] px-4 pb-32">

        {/* Заголовок активности */}
        <div className="mb-6">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Сценарий</div>
          <h2 className="text-2xl font-bold text-[#1C1C1E]">
            {activityCode === 'checkup' ? 'Проверка полки' :
              activityCode === 'training' ? 'Обучение персонала' :
                activityCode === 'tasting' ? 'Дегустация' : 'Свободный визит'}
          </h2>
        </div>

        {/* Динамическая форма */}
        <div className="space-y-6">
          {activityCode === 'checkup' ? <CheckupForm onChange={updateForm} /> :
            activityCode === 'training' ? <TrainingForm onChange={updateForm} /> :
              <DefaultForm onChange={updateForm} />
          }
        </div>

        {/* Кнопка завершения */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-50 pb-[calc(env(safe-area-inset-bottom)+20px)]">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full h-14 bg-[#1C1C1E] text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-70"
          >
            {submitting ? 'Отправка...' : 'Завершить визит'} <CheckCircle2 size={20} />
          </button>
        </div>

      </div>
    </Layout>
  );
};

export default VisitWizard;
