import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';
import { MapPin, Phone, User, X } from 'lucide-react';

type MeResponse = {
  fullName: string;
  birthDate?: string | null;
  tshirtSize?: string | null;
  cdekInfo?: { city?: string; address?: string; code?: string; phone?: string } | null;
};

const MyDataPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [me, setMe] = useState<MeResponse | null>(null);

  const [phone, setPhone] = useState('');
  const [cdekCity, setCdekCity] = useState('');
  const [cdekAddress, setCdekAddress] = useState('');
  const [cdekCode, setCdekCode] = useState('');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<MeResponse>('/api/users/me');
        if (!isMounted) return;
        const meData = res.data;
        setMe(meData);
        const cdek = meData?.cdekInfo || {};
        setPhone(cdek.phone || '');
        setCdekCity(cdek.city || '');
        setCdekAddress(cdek.address || '');
        setCdekCode(cdek.code || '');
      } catch (e) {
        toast.error('Не удалось загрузить профиль');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.patch('/api/users/me', {
        cdekInfo: {
          city: cdekCity,
          address: cdekAddress,
          code: cdekCode,
          phone,
        },
      });
      toast.success('Данные сохранены');
      navigate(-1);
    } catch (e) {
      toast.error('Не удалось сохранить данные');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-24 space-y-6">
      <PageHeader
        title="Мои данные"
        subtitle="СДЭК и контакты"
        rightAction={
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-black/5 border border-white/40 flex items-center justify-center text-black/60 active:scale-95 transition-transform"
            aria-label="Назад"
          >
            <X size={18} strokeWidth={2} />
          </button>
        }
      />

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-20 rounded-3xl bg-white/60 border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.10)] p-5 space-y-4">
            <div>
              <label className="text-[11px] text-black/50 font-semibold uppercase tracking-widest ml-1 flex items-center gap-1">
                <User size={12} /> ФИО
              </label>
              <input
                value={me?.fullName || ''}
                readOnly
                className="w-full mt-2 px-4 py-3.5 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/30 text-[15px] font-semibold text-black/70 outline-none"
              />
              <div className="mt-2 text-[11px] text-black/40">
                ФИО меняется через администратора.
              </div>
            </div>

            <div>
              <label className="text-[11px] text-black/50 font-semibold uppercase tracking-widest ml-1 flex items-center gap-1">
                <Phone size={12} /> Телефон
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full mt-2 px-4 py-3.5 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/30 text-[15px] font-medium text-black outline-none placeholder:text-black/30 focus:ring-4 focus:ring-black/5"
                placeholder="+7 999 000 00 00"
              />
            </div>

            <div>
              <label className="text-[11px] text-black/50 font-semibold uppercase tracking-widest ml-1 flex items-center gap-1">
                <MapPin size={12} /> СДЭК (ПВЗ)
              </label>
              <input
                value={cdekCity}
                onChange={(e) => setCdekCity(e.target.value)}
                className="w-full mt-2 px-4 py-3.5 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/30 text-[15px] font-medium text-black outline-none placeholder:text-black/30 focus:ring-4 focus:ring-black/5"
                placeholder="Город"
              />
              <input
                value={cdekAddress}
                onChange={(e) => setCdekAddress(e.target.value)}
                className="w-full mt-2 px-4 py-3.5 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/30 text-[15px] font-medium text-black outline-none placeholder:text-black/30 focus:ring-4 focus:ring-black/5"
                placeholder="Адрес ПВЗ"
              />
              <input
                value={cdekCode}
                onChange={(e) => setCdekCode(e.target.value)}
                className="w-full mt-2 px-4 py-3.5 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/30 text-[15px] font-medium text-black outline-none placeholder:text-black/30 focus:ring-4 focus:ring-black/5"
                placeholder="Код ПВЗ (если есть)"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 rounded-3xl bg-black text-white font-semibold shadow-[0_20px_60px_rgba(0,0,0,0.22)] disabled:opacity-40 active:scale-[0.99] transition-transform"
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </>
      )}
    </div>
  );
};

export default MyDataPage;

