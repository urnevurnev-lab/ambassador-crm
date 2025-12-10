import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import apiClient from '../api/apiClient';
import { ShoppingCart, Send, ChevronDown, ChevronUp, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// --- ИНТЕРФЕЙСЫ ---
interface Facility {
  id: number;
  name: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
}

interface Product {
  id: number;
  sku: string;
  line: string;
  flavor: string;
}

interface Distributor {
  id: number;
  fullName: string;
  chatId: string;
}

const getCleanFlavorName = (line: string, flavor: string) => {
  if (!line || !flavor) return flavor;
  const escapedLine = line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^${escapedLine}\\s*`, 'i');
  let cleaned = flavor.replace(regex, '').trim();
  cleaned = cleaned.replace(/\(Tobacco\)/i, '').trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

// --- ТИПЫ КОРЗИНЫ ---
interface CartItem {
  product: Product;
  quantity: number;
}

// --- КОМПОНЕНТ ---
const OrderPage: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | null>(null);
  const [selectedDistributorId, setSelectedDistributorId] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [updatingGps, setUpdatingGps] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  // --- Загрузка данных (Сохранена рабочая логика) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [facRes, prodRes, distRes] = await Promise.all([
          apiClient.get<Facility[]>('/api/facilities'),
          apiClient.get<Product[]>('/api/products'),
          apiClient.get<Distributor[]>('/api/distributors'),
        ]);

        const validFacilities = facRes.data.filter(f => f.name && f.address);

        setFacilities(validFacilities);
        setProducts(prodRes.data);
        setDistributors(distRes.data.filter(d => d.fullName)); // Только с именем
      } catch (err) {
        console.error("Data loading error:", err);
        setMessage("❌ Ошибка загрузки данных. Проверьте Backend и Proxy.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
  // --- Функции Корзины (Сохранена рабочая логика) ---
  const handleQuantityChange = (product: Product, delta: number) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + delta;
        if (newQuantity <= 0) {
          return prevCart.filter((item) => item.product.id !== product.id);
        }
        return prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQuantity } : item
        );
      } else if (delta > 0) {
        return [...prevCart, { product, quantity: delta }];
      }
      return prevCart;
    });
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // --- Отправка Заказа (Сохранена рабочая логика) ---
  const handleSendOrder = async () => {
    if (!selectedFacilityId || !selectedDistributorId || cart.length === 0) {
      setMessage("Пожалуйста, выберите заведение, дистрибьютора и добавьте товары.");
      return;
    }

    setLoading(true);
    setMessage(null);

    const orderData: {
      facilityId: number;
      distributorId: number;
      items: { sku: string; quantity: number }[];
    } = {
      facilityId: selectedFacilityId,
      distributorId: selectedDistributorId,
      items: cart.map(item => ({
        sku: item.product.sku,
        quantity: item.quantity,
      })),
    };

    try {
      await apiClient.post('/api/orders', orderData);
      setMessage(`✅ Заказ на ${totalItems} позиций успешно отправлен Дистрибьютору!`);
      setCart([]);
    } catch (error) {
      console.error("Order submission error:", error);
      setMessage("❌ Ошибка при отправке заказа. Проверьте сеть и токен бота.");
    } finally {
      setLoading(false);
    }
  };

  // --- Рендеринг Каталога: Группировка Товаров ---
  const groupedProducts = products.reduce((acc, product) => {
    acc[product.line] = acc[product.line] || [];
    acc[product.line].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  if (loading && totalItems === 0) {
    return <Layout><div className="text-center mt-8 text-indigo-600">Загрузка данных...</div></Layout>;
  }

  return (
    <Layout>
      <div className="min-h-screen">
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#F2F3F7]">
          <div className="px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3 flex items-center">
            <Link to="/" className="mr-3 text-gray-600">
              <ArrowLeft />
            </Link>
            <h2 className="text-3xl font-extrabold text-[#1C1C1E]">Новый Заказ</h2>
          </div>
        </div>

        <div className="p-4 pt-[calc(env(safe-area-inset-top)+60px)] pb-32 space-y-6">
          {/* Секция 1: Выбор Заведения и Дистрибьютора */}
          <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white p-4 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] space-y-3 border border-gray-100"
          >
            <select
              className="w-full p-3 border border-gray-200 rounded-2xl bg-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
              value={selectedFacilityId || ''}
              onChange={(e) => setSelectedFacilityId(Number(e.target.value))}
            >
              <option value="" disabled>-- Выберите Заведение --</option>
              {facilities.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.address.substring(0, 30)}...)
                </option>
              ))}
            </select>
            {selectedFacilityId && (
              <button
                onClick={async () => {
                  setUpdatingGps(true);
                  if (!navigator.geolocation) {
                    setMessage('GPS недоступен');
                    setUpdatingGps(false);
                    return;
                  }
                  navigator.geolocation.getCurrentPosition(
                    async (pos) => {
                      try {
                        await apiClient.patch(`/api/facilities/${selectedFacilityId}/fix-location`, {
                          lat: pos.coords.latitude,
                          lng: pos.coords.longitude,
                        });
                        setMessage('📍 Геопозиция обновлена');
                      } catch (e) {
                        setMessage('Ошибка обновления геопозиции');
                      } finally {
                        setUpdatingGps(false);
                      }
                    },
                    () => {
                      setMessage('Не удалось получить GPS');
                      setUpdatingGps(false);
                    },
                    { enableHighAccuracy: true }
                  );
                }}
                className="text-xs text-indigo-600 underline"
                disabled={updatingGps}
              >
                {updatingGps ? 'Обновление...' : '📍 Обновить геопозицию'}
              </button>
            )}

            <select
              className="w-full p-3 border border-gray-200 rounded-2xl bg-white shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150"
              value={selectedDistributorId || ''}
              onChange={(e) => setSelectedDistributorId(Number(e.target.value))}
            >
              <option value="" disabled>-- Выберите Дистрибьютора --</option>
              {distributors.map(d => (
                <option key={d.id} value={d.id}>
                  {d.fullName}
                </option>
              ))}
            </select>
          </motion.div>

          {/* Секция 2: Каталог Товаров */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold border-b pb-2 text-gray-800">Каталог ({products.length} SKUs)</h3>
            
            {Object.entries(groupedProducts).map(([line, prods]) => (
              <motion.div 
                  key={line} 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white p-4 rounded-3xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-100"
              >
                <h4 className="text-xl font-bold mb-4 text-indigo-700">{line}</h4>
                <div className="space-y-3">
                  {prods.map(product => {
                    const item = cart.find(i => i.product.id === product.id);
                    const quantity = item?.quantity || 0;
                    const flavor = getCleanFlavorName(product.line, product.flavor);
                    return (
                      <div key={product.sku} className="flex justify-between items-center py-3 px-3 bg-white rounded-2xl border border-gray-100 shadow-[0_1px_6px_rgba(0,0,0,0.06)]">
                        <div className="flex flex-col">
                            <span className="font-medium text-gray-800">{flavor}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            className="p-1 bg-gray-100 rounded-full text-gray-600 disabled:opacity-30 transition duration-150"
                            onClick={() => handleQuantityChange(product, -1)}
                            disabled={quantity === 0}
                          >
                            <ChevronDown size={20} />
                          </motion.button>
                          <span className="w-6 text-center font-bold text-lg text-gray-800">{quantity}</span>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            className="p-1 bg-indigo-100 rounded-full text-indigo-600 transition duration-150"
                            onClick={() => handleQuantityChange(product, 1)}
                          >
                            <ChevronUp size={20} />
                          </motion.button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Сообщения */}
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl font-semibold flex items-center shadow-sm ${message.startsWith('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
            >
              <AlertCircle size={20} className="mr-3" />
              {message}
            </motion.div>
          )}
        </div>

        {/* Секция 3: Фиксированная Корзина (Bottom Bar) */}
        {totalItems > 0 && (
          <motion.div 
            initial={{ y: 100 }} 
            animate={{ y: 0 }} 
            className="fixed bottom-20 left-0 right-0 p-4 z-20" // Поднят над BottomTab
          >
            <div className="max-w-xl mx-auto bg-white/95 backdrop-blur shadow-lg border border-gray-200 rounded-2xl p-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                className="w-full flex justify-between items-center p-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-md disabled:opacity-50 transition duration-200"
                onClick={handleSendOrder}
                disabled={loading || !selectedFacilityId || !selectedDistributorId}
              >
                <div className="flex items-center">
                  <ShoppingCart size={24} className="mr-3" />
                  <span>{totalItems} поз.</span>
                </div>
                <span>{loading ? 'Отправка...' : 'Отправить Заказ'}</span>
                <Send size={24} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
};

export default OrderPage;
