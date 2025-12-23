import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { BookOpen, GraduationCap, ScrollText } from 'lucide-react';

const KnowledgeBasePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pb-24 space-y-6">
      <PageHeader title="Знания" subtitle="Стандарты, скрипты и обучение" />

      <button
        onClick={() => navigate('/education')}
        className="w-full rounded-3xl bg-black/75 backdrop-blur-xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.22)] p-6 text-left active:scale-[0.99] transition-transform"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/60">Education</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Быстрый курс</h3>
            <p className="mt-1 text-sm text-white/60">Основы продукта и мерчендайзинга</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white/80">
            <GraduationCap size={18} strokeWidth={1.5} />
          </div>
        </div>
      </button>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.10)] p-5">
          <div className="w-10 h-10 rounded-2xl bg-black/5 border border-white/40 flex items-center justify-center text-black/60">
            <ScrollText size={18} strokeWidth={1.5} />
          </div>
          <div className="mt-4 text-[15px] font-semibold text-black">Стандарты</div>
          <div className="mt-1 text-xs text-black/50">Чек-листы и правила</div>
        </div>
        <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.10)] p-5">
          <div className="w-10 h-10 rounded-2xl bg-black/5 border border-white/40 flex items-center justify-center text-black/60">
            <BookOpen size={18} strokeWidth={1.5} />
          </div>
          <div className="mt-4 text-[15px] font-semibold text-black">Скрипты</div>
          <div className="mt-1 text-xs text-black/50">Ответы на возражения</div>
        </div>
      </div>

      <div className="rounded-3xl bg-white/45 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.08)] p-6 text-center">
        <p className="text-sm text-black/50">
          Контент наполняется через админ-панель: каждый раздел — отдельный блок.
        </p>
      </div>
    </div>
  );
};

export default KnowledgeBasePage;
