import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';

const MyOrdersPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pb-24 space-y-6">
      <PageHeader title="Заказы" subtitle="История и статусы" />

      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.10)] p-6 text-center">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-black/5 border border-white/40 flex items-center justify-center text-black/60">
          <ShoppingBag size={20} strokeWidth={1.5} />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-black">История скоро появится</h3>
        <p className="mt-2 text-sm text-black/50">
          Сейчас заказ можно оформить из карточки точки.
        </p>
        <button
          onClick={() => navigate('/work')}
          className="mt-6 w-full rounded-3xl bg-black text-white py-4 font-semibold shadow-[0_20px_50px_rgba(0,0,0,0.22)] active:scale-[0.99] transition-transform"
        >
          Перейти к точкам
        </button>
      </div>
    </div>
  );
};

export default MyOrdersPage;
