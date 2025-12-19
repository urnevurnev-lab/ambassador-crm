import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  FileText, 
  PlayCircle,
  GraduationCap,
  HelpCircle
} from 'lucide-react';
import { StandardCard } from '../components/ui/StandardCard';
import { motion } from 'framer-motion';

const KnowledgeBasePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6 pb-24">
      
      {/* ЗАГОЛОВОК */}
      <div className="pt-2 px-1">
        <h1 className="text-3xl font-extrabold text-gray-900">База Знаний</h1>
        <p className="text-gray-400 font-medium">Учись и развивайся</p>
      </div>

      {/* ПОИСК (В стиле Apple) */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Найти скрипт или инструкцию..." 
          className="w-full bg-white h-12 pl-11 pr-4 rounded-[20px] shadow-sm border border-gray-100 text-sm focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* ГЛАВНЫЕ РАЗДЕЛЫ (Цветные карточки) */}
      <div className="grid grid-cols-2 gap-3">
        {/* ОБУЧЕНИЕ (Фиолетовый) */}
        <div className="col-span-2">
           <StandardCard 
             title="Академия" 
             subtitle="Курсы и тестирование"
             color="purple"
             illustration={<GraduationCap size={120} className="text-white opacity-20 -rotate-12 translate-x-4" />}
             showArrow
           />
        </div>

        {/* СКРИПТЫ (Тил/Зеленый) */}
        <div className="h-[180px]">
           <StandardCard 
             title="Скрипты" 
             subtitle="Продажи"
             color="teal"
             className="h-full"
             illustration={<FileText size={100} className="text-white opacity-20 rotate-6" />}
           />
        </div>

        {/* ВИДЕО (Розовый/Коралл) */}
        <div className="h-[180px]">
           <StandardCard 
             title="Видео" 
             subtitle="Уроки"
             color="coral"
             className="h-full"
             illustration={<PlayCircle size={100} className="text-white opacity-20 -rotate-6" />}
           />
        </div>
      </div>

      {/* СПИСОК СТАТЕЙ (Белые парящие карточки) */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900 px-2 mt-2">Популярное</h3>
        
        <StandardCard 
          title="F.A.Q." 
          subtitle="Частые вопросы амбассадоров"
          color="white"
          icon={HelpCircle}
          showArrow
        />
        <StandardCard 
          title="Гайд по продукции" 
          subtitle="Линейка 2025 года"
          color="white"
          icon={BookOpen}
          showArrow
        />
      </div>

    </div>
  );
};

export default KnowledgeBasePage;