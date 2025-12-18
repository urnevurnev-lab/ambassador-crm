import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Minus, Search, ShoppingCart } from 'lucide-react';
import { PageHeader } from '../components/PageHeader'; // Обрати внимание: именованный импорт
import { StandardCard } from '../components/ui/StandardCard';
import apiClient from '../api/apiClient';

// Тип товара из базы
interface Product {
  id: number;
  name: string;      // Иногда поле называется name
  flavor: string;    // Иногда flavor
  line: string;
  category: string;
  price: number;
}

const OrderPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Все");
  const [cart, setCart] = useState<{ [key: number]: number }>({});
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Загружаем реальные товары при старте
  useEffect(() => {
    apiClient.get('/api/products')
      .then(res => {
        // Приводим данные к единому виду (если в базе flavor, а мы хотим name)
        const mapped = (res.data || []).map((p: any) => ({
          ...p,
          name: p.flavor || p.name, // Используем flavor как имя, если name нет
          price: p.price || 0
        }));
        setProducts(mapped);
      })
      .catch(err => console.error("Ошибка загрузки товаров:", err))
      .finally(() => setLoading(false));
  }, []);

  // Получаем список категорий из товаров
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.line || "Другое"));
    return ["Все", ...Array.from(cats).sort()];
  }, [products]);

  // Фильтрация
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCategory = activeCategory === "Все" || p.line === activeCategory;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, activeCategory, searchQuery]);

  // Управление корзиной
  const handleIncrement = (id: number) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const handleDecrement = (id: number) => {
    setCart(prev => {
      const newCount = (prev[id] || 0) - 1;
      if (newCount <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: newCount };
    });
  };

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, count]) => {
    const product = products.find(p => p.id === Number(id));
    return sum + (product ? product.price * count : 0);
  }, 0);

  return (
    <div className="min-h-screen bg-[#F3F4F6] pb-32">
      {/* Шапка: Портфель (или Каталог) */}
      <PageHeader title="Каталог" />

      {/* Поиск */}
      <div className="px-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Поиск аромата..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
          />
        </div>
      </div>

      {/* Линейки (Категории) */}
      <div className="px-4 mb-6 overflow-x-auto no-scrollbar">
        <div className="flex gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                ${activeCategory === cat 
                  ? 'bg-black text-white shadow-md' 
                  : 'bg-white text-gray-600 border border-gray-200'}
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Список */}
      <div className="px-4 flex flex-col gap-3">
        {loading ? (
             <div className="text-center py-10 text-gray-400">Загрузка товаров...</div>
        ) : filteredProducts.map(product => {
          const count = cart[product.id] || 0;
          
          return (
            <StandardCard
              key={product.id}
              title={product.name}
              subtitle={`${product.line} • ${product.price} ₽`}
              // Плюсик или счетчик справа
              action={
                count > 0 ? (
                  <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDecrement(product.id); }}
                      className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm active:scale-90 transition-transform"
                    >
                      <Minus size={16} className="text-gray-600" />
                    </button>
                    <span className="w-8 text-center font-bold text-gray-900 text-sm">{count}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleIncrement(product.id); }}
                      className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-md shadow-sm active:scale-90 transition-transform"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleIncrement(product.id); }}
                    className="p-2 bg-gray-100 rounded-full text-gray-600 active:bg-black active:text-white transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                )
              }
            />
          );
        })}
        
        {!loading && filteredProducts.length === 0 && (
          <div className="text-center text-gray-400 py-10">
            Ничего не найдено
          </div>
        )}
      </div>

      {/* Нижняя кнопка "Оформить" */}
      {totalItems > 0 && (
        <div className="fixed bottom-safe left-4 right-4 z-40 mb-20 animate-fade-in">
          <button 
            className="w-full bg-black text-white p-4 rounded-2xl shadow-xl flex items-center justify-between active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 px-3 py-1 rounded-lg font-bold text-sm">
                {totalItems} шт
              </div>
              <span className="font-bold">В корзину</span>
            </div>
            <div className="font-bold text-lg">
              {totalPrice.toLocaleString()} ₽
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default OrderPage;