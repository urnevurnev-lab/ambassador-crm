import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Footprints, 
  BookOpen,   
  ShoppingBag, 
  Trophy,     
  Bell,
  MapPin,
  Sparkles
} from 'lucide-react';
import { StandardCard } from '../components/ui/StandardCard';
import { motion } from 'framer-motion';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const userName = "Амбассадор"; 

  return (
    <div className="space-y-6 pb-12">
      
      {/* ШАПКА */}
      <div className="pt-2 px-1 flex justify-between items-center">
        <div>
          <h1 className="text-[32px] font-extrabold text-gray-900 leading-none tracking-tight">
            Привет,<br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {userName}
            </span>
          </h1>
        </div>
        
        <motion.div 
           whileHover={{ rotate: 15, scale: 1.1 }}
           whileTap={{ scale: 0.9 }}
           onClick={() => navigate('/profile')}
           className="w-12 h-12 bg-white rounded-full border border-gray-100 flex items-center justify-center text-xl shadow-lg cursor-pointer"
        >
          😼
        </motion.div>
      </div>

      {/* --- ЖИВАЯ СЕТКА --- */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* 1. НАЧАТЬ ВИЗИТ (Синий) - delay={0} */}
        <div className="col-span-2 h-[170px]">
          <StandardCard
            title="Начать Визит"
            subtitle="Зафиксировать приход"
            color="blue"
            delay={0} // Начинает движение сразу
            onClick={() => navigate('/facilities/new')}
            className="h-full"
            illustration={
              <Footprints size={150} className="text-white drop-shadow-2xl" strokeWidth={1.5} />
            }
          />
        </div>

        {/* 2. БАЗА ЗНАНИЙ (Фиолетовый) - delay={1} */}
        <div className="h-[200px]">
          <StandardCard
            title="Знания"
            subtitle="Скрипты"
            color="purple"
            delay={1} // Чуть позже
            onClick={() => navigate('/knowledge')}
            className="h-full"
            illustration={
              <BookOpen size={120} className="text-white -rotate-12 translate-x-4" strokeWidth={1.5} />
            }
          />
        </div>

        {/* 3. ЗАКАЗЫ (Коралл) - delay={0.5} */}
        <div className="h-[200px]">
          <StandardCard
            title="Заказы"
            subtitle="История"
            value="12"
            color="coral"
            delay={0.5} // В другом ритме
            onClick={() => navigate('/my-orders')}
            className="h-full"
            illustration={
              <ShoppingBag size={120} className="text-white rotate-6 translate-x-3" strokeWidth={1.5} />
            }
          />
        </div>

        {/* 4. КАРТА (Белая) */}
        <div className="col-span-2 h-[110px]">
           <StandardCard
            title="Карта Территории"
            subtitle="Построить маршрут к точке"
            color="white"
            floating={false} // Белые не парят, чтобы не рябило
            onClick={() => navigate('/map')}
            className="h-full"
            showArrow
            illustration={
              <MapPin size={90} className="text-blue-500/10 rotate-12 -translate-y-2" />
            }
          />
        </div>
      </div>

      {/* ДОП. БЛОКИ */}
      <div className="grid grid-cols-2 gap-4">
         <StandardCard 
            title="Топ-3" 
            subtitle="Рейтинг"
            color="teal"
            delay={1.5}
            onClick={() => navigate('/profile')}
            illustration={<Trophy size={80} className="text-white/30 translate-x-4 translate-y-2" />}
         />
         <StandardCard 
            title="Задачи" 
            subtitle="Все чисто"
            color="white"
            floating={false}
            illustration={<Sparkles size={80} className="text-yellow-400/20 translate-x-2" />}
         />
      </div>
    </div>
  );
};

export default Dashboard;