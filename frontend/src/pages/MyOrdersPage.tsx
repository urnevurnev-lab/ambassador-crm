import React from 'react';
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  Truck 
} from 'lucide-react';
import { StandardCard } from '../components/ui/StandardCard';

const MyOrdersPage: React.FC = () => {
  return (
    <div className="space-y-5 pb-24">
      
      <div className="pt-2 px-1">
        <h1 className="text-3xl font-extrabold text-gray-900">Мои Заказы</h1>
        <p className="text-gray-400 font-medium">История операций</p>
      </div>

      {/* АКТИВНЫЙ ЗАКАЗ (Самый яркий - Оранжевый) */}
      <StandardCard 
        title="Заказ #12390" 
        subtitle="В пути • Ожидается завтра"
        value="В работе"
        color="coral"
        illustration={<Truck size={120} className="text-white opacity-20 translate-x-4" />}
      />

      {/* ИСТОРИЯ (Список белых карточек) */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900 px-2 mt-2">История</h3>

        <StandardCard 
          title="Заказ #12385" 
          subtitle="15 Декабря • Доставлен"
          value="4 500 ₽"
          color="white"
          icon={CheckCircle2}
          showArrow
          floating={false}
        />
        
        <StandardCard 
          title="Заказ #12340" 
          subtitle="10 Декабря • Доставлен"
          value="12 200 ₽"
          color="white"
          icon={CheckCircle2}
          showArrow
          floating={false}
        />

        <StandardCard 
          title="Заказ #12300" 
          subtitle="1 Декабря • Отменен"
          value="0 ₽"
          color="white"
          icon={Clock}
          showArrow
          floating={false}
        />
      </div>

    </div>
  );
};

export default MyOrdersPage;