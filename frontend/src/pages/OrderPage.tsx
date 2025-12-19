import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Minus, Search, ShoppingBag, Send, X, ChevronRight } from 'lucide-react';
import apiClient from '../api/apiClient';
import { Layout } from '../components/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import WebApp from '@twa-dev/sdk';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface Product {
  id: number;
  name: string;
  flavor: string;
  line: string;
  category: string;
  price: number;
  sku: string;
  isTopFlavor: boolean;
}

interface Distributor {
  id: number;
  name: string;
}

const OrderPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const facilityId = searchParams.get('facilityId');

  const [products, setProducts] = useState<Product[]>([]);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [facilityData, setFacilityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);

  const [activeCategory, setActiveCategory] = useState("Все");
  const [cart, setCart] = useState<{ [key: number]: number }>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isOrdering, setIsOrdering] = useState(false);
  const [contactName, setContactName] = useState("");
  const [selectedDistributorId, setSelectedDistributorId] = useState<number | null>(null);

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalWeightKg = (totalItems * 0.1).toFixed(1);

  useEffect(() => {
    if (totalItems > 0) {
      WebApp.enableClosingConfirmation();
    } else {
      WebApp.disableClosingConfirmation();
    }
    return () => {
      WebApp.disableClosingConfirmation();
    };
  }, [totalItems]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, distRes, facRes] = await Promise.all([
          apiClient.get('/api/products'),
          apiClient.get('/api/distributors'),
          facilityId ? apiClient.get(`/api/facilities/${facilityId}`) : Promise.resolve({ data: null })
        ]);

        const mappedProducts = (prodRes.data || []).map((p: any) => ({
          ...p,
          name: p.flavor || p.name,
          price: p.price || 0
        }));

        setProducts(mappedProducts);
        setDistributors(distRes.data || []);
        setFacilityData(facRes.data);

        if (distRes.data && distRes.data.length === 1) {
          setSelectedDistributorId(distRes.data[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [facilityId]);

  const recommendedGaps = useMemo(() => {
    if (!facilityData || !products.length) return [];
    const lastInventory = (facilityData.mustList as Record<string, boolean>) || {};
    return products.filter(p => p.isTopFlavor && !lastInventory[p.id]);
  }, [facilityData, products]);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.line || "Другое"));
    return ["Все", ...Array.from(cats).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCategory = activeCategory === "Все" || p.line === activeCategory;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, activeCategory, searchQuery]);

  const handleIncrement = (id: number) => {
    setCart(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    WebApp.HapticFeedback?.impactOccurred('light');
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
    WebApp.HapticFeedback?.impactOccurred('light');
  };

  const totalPrice = Object.entries(cart).reduce((sum, [id, count]) => {
    const product = products.find(p => p.id === Number(id));
    return sum + (product ? product.price * count : 0);
  }, 0);

  const handleCheckout = async () => {
    if (!contactName) {
      WebApp.showAlert("Укажите контактное лицо");
      return;
    }
    if (!selectedDistributorId) {
      WebApp.showAlert("Выберите дистрибьютора");
      return;
    }

    setIsOrdering(true);
    try {
      const items = Object.entries(cart).map(([id, quantity]) => {
        const p = products.find(prod => prod.id === Number(id));
        return { sku: p?.sku || '', quantity };
      });

      await apiClient.post('/api/orders', {
        facilityId: Number(facilityId),
        distributorId: Number(selectedDistributorId),
        contactName,
        items
      });

      WebApp.HapticFeedback?.notificationOccurred('success');
      WebApp.disableClosingConfirmation();
      WebApp.showAlert('Заказ отправлен дистрибьютору!');
      navigate(`/facility/${facilityId}`);
    } catch (e: any) {
      console.error(e);
      WebApp.showAlert('Ошибка: ' + (e.response?.data?.message || 'Не удалось отправить заказ'));
    } finally {
      setIsOrdering(false);
    }
  };

  if (loading) return (
    <Layout>
      <div className="flex flex-col items-center justify-center h-[60dvh] gap-4">
        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-gray-400 font-bold tracking-tight">Загрузка каталога...</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="min-h-screen px-5 pb-40 pt-6 space-y-8">
        <div className="flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-12 h-12 bg-white rounded-2xl border border-[#C6C6C8]/10 shadow-[0_8px_20px_rgba(0,0,0,0.05)] flex items-center justify-center"
          >
            <X size={24} className="text-gray-400" />
          </motion.button>
          <div>
            <h1 className="text-[28px] font-[900] text-gray-900 leading-none tracking-tight">
              {step === 1 ? "Маст-лист" : step === 2 ? "Каталог" : "Детали"}
            </h1>
            <p className="text-[12px] text-[#8E8E93] font-bold mt-1 uppercase tracking-wider opacity-70">Шаг {step} из 3</p>
          </div>
        </div>

        <div className="flex gap-2.5 px-1">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-2 flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]' : 'bg-gray-200 opacity-50'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="p-6 bg-blue-50 rounded-[32px] border border-blue-100/50 shadow-[0_10px_30px_rgba(59,130,246,0.05)]">
                <h3 className="text-blue-700 text-[17px] font-black flex items-center gap-2">
                  <ShoppingBag size={20} /> Топ-вкусы
                </h3>
                <p className="text-blue-600/70 text-[13px] mt-2 font-bold leading-relaxed">
                  Этих позиций не было при последнем визите. Рекомендуем добавить.
                </p>
              </div>

              <div className="space-y-3">
                {recommendedGaps.length > 0 ? recommendedGaps.map(p => (
                  <motion.div
                    key={p.id}
                    className="bg-white p-5 rounded-[28px] border border-[#C6C6C8]/10 shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 text-2xl">🧊</div>
                    <div className="flex-1">
                      <h3 className="text-[15px] font-black text-gray-900 leading-none">{p.flavor}</h3>
                      <p className="text-[12px] text-gray-400 font-bold mt-1.5">{p.line}</p>
                    </div>
                    <button
                      onClick={() => handleIncrement(p.id)}
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${cart[p.id] ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-[#F2F2F7] text-gray-400 border border-transparent active:border-blue-500/20'}`}
                    >
                      {cart[p.id] ? <span className="text-sm font-black">{cart[p.id]}</span> : <Plus size={24} />}
                    </button>
                  </motion.div>
                )) : (
                  <div className="text-center py-20 bg-[#F8F9FB] rounded-[40px] border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 font-black uppercase tracking-widest text-[13px]">Все вкусы в наличии!</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="relative">
                <Search className="absolute left-5 top-4.5 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Поиск по вкусу..."
                  className="w-full pl-14 pr-6 h-14 bg-white rounded-[24px] border border-[#C6C6C8]/10 shadow-[0_8px_20px_rgba(0,0,0,0.03)] outline-none focus:ring-4 focus:ring-blue-500/10 font-bold text-[15px] transition-all"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 -mx-5 px-5">
                {categories.map(c => (
                  <button key={c} onClick={() => { setActiveCategory(c); WebApp.HapticFeedback.impactOccurred('light'); }} className={`px-5 py-3 rounded-2xl text-[13px] font-black whitespace-nowrap transition-all border ${activeCategory === c ? 'bg-gray-900 text-white border-gray-900 shadow-xl shadow-gray-200' : 'bg-white text-gray-400 border-transparent shadow-sm'}`}>
                    {c}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {filteredProducts.map(p => {
                  const count = cart[p.id] || 0;
                  return (
                    <div key={p.id} className="bg-white p-5 rounded-[28px] border border-[#C6C6C8]/10 shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl">⚡️</div>
                      <div className="flex-1">
                        <h3 className="text-[15px] font-black text-gray-900 leading-none">{p.flavor}</h3>
                        <p className="text-[12px] text-gray-400 font-bold mt-1.5">{p.line} • {p.price} ₽</p>
                      </div>
                      <div className="flex items-center">
                        {count > 0 ? (
                          <div className="flex items-center bg-[#F2F2F7] p-1.5 rounded-2xl border border-transparent shadow-inner">
                            <motion.button whileTap={{ scale: 0.8 }} onClick={() => handleDecrement(p.id)} className="w-9 h-9 flex items-center justify-center bg-white rounded-xl shadow-sm"><Minus size={18} className="text-gray-400" /></motion.button>
                            <span className="w-10 text-center text-[15px] font-black text-gray-900">{count}</span>
                            <motion.button whileTap={{ scale: 0.8 }} onClick={() => handleIncrement(p.id)} className="w-9 h-9 flex items-center justify-center bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20 text-white"><Plus size={18} /></motion.button>
                          </div>
                        ) : (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleIncrement(p.id)}
                            className="px-6 py-3 bg-gray-900 text-white text-[12px] font-black rounded-2xl shadow-lg shadow-gray-200 active:bg-blue-600 transition-colors"
                          >
                            В корзину
                          </motion.button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-[12px] font-black text-[#8E8E93] uppercase tracking-widest px-1 mb-4">Данные получателя</h3>
                  <div className="bg-white p-6 rounded-[32px] border border-[#C6C6C8]/10 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
                    <input
                      type="text"
                      placeholder="Имя ЛПР"
                      className="w-full p-5 bg-[#F2F2F7]/50 rounded-[22px] outline-none font-black text-[15px] border-2 border-transparent focus:border-blue-500/20 focus:bg-white transition-all"
                      value={contactName}
                      onChange={e => setContactName(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-[12px] font-black text-[#8E8E93] uppercase tracking-widest px-1 mb-4">Дистрибьютор</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {distributors.map(d => (
                      <motion.button
                        key={d.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setSelectedDistributorId(d.id); WebApp.HapticFeedback.impactOccurred('medium'); }}
                        className={`p-6 rounded-[28px] border-2 text-left transition-all ${selectedDistributorId === d.id ? 'bg-blue-600 text-white border-blue-500 shadow-xl shadow-blue-500/20' : 'bg-white text-gray-900 border-[#C6C6C8]/10 shadow-sm'}`}
                      >
                        <p className="font-black text-[16px]">{d.name}</p>
                        <p className={`text-[12px] font-bold mt-1 ${selectedDistributorId === d.id ? 'text-white/70' : 'text-gray-400'}`}>Выбрать для отправки</p>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-7 bg-gray-900 rounded-[40px] text-white shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
                <div className="flex justify-between items-center mb-6">
                  <p className="text-[#8E8E93] text-[11px] font-[900] uppercase tracking-widest">Итоговый состав</p>
                  <div className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-black text-white/50">{totalItems} поз.</div>
                </div>

                <div className="space-y-3 max-h-[200px] overflow-y-auto no-scrollbar pr-1">
                  {Object.entries(cart).map(([id, qty]) => {
                    const p = products.find(prod => prod.id === Number(id));
                    return (
                      <div key={id} className="flex justify-between items-center text-[15px]">
                        <span className="text-white/80 font-bold truncate flex-1">{p?.flavor}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-white/30 font-black text-[12px]">{qty} x 100г</span>
                          <span className="font-black text-white ml-2 whitespace-nowrap">x{qty}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] font-bold text-white/40 uppercase tracking-tight">Общий вес:</span>
                    <span className="text-[20px] font-black text-blue-400">{totalWeightKg} кг</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-[13px] font-bold text-white/40 uppercase tracking-tight">Сумма заказа:</span>
                    <span className="text-[32px] font-black text-white leading-none">{totalPrice.toLocaleString()} ₽</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="fixed bottom-10 left-5 right-5 z-40">
          <div className="flex gap-4">
            {step > 1 && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => { setStep(step - 1); WebApp.HapticFeedback?.impactOccurred('medium'); }}
                className="flex-1 py-6 bg-white border border-[#C6C6C8]/20 text-[#8E8E93] font-black rounded-[30px] shadow-sm active:scale-95 transition-all text-[15px] uppercase tracking-wider"
              >
                Назад
              </motion.button>
            )}
            {step < 3 ? (
              <motion.button
                disabled={totalItems === 0}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setStep(step + 1); WebApp.HapticFeedback?.impactOccurred('medium'); }}
                className="flex-[2] py-6 bg-gray-900 text-white font-[900] rounded-[30px] shadow-[0_20px_40px_rgba(0,0,0,0.15)] active:scale-95 transition-all flex items-center justify-center gap-3 text-[15px] uppercase tracking-widest disabled:opacity-30"
              >
                Далее <ChevronRight size={18} strokeWidth={4} />
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCheckout}
                disabled={isOrdering || !contactName || !selectedDistributorId || totalItems === 0}
                className="flex-[3] py-6 bg-blue-600 text-white font-[900] rounded-[30px] shadow-[0_20px_40px_rgba(37,99,235,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 text-[15px] uppercase tracking-widest"
              >
                {isOrdering ? <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" /> : <><Send size={20} strokeWidth={3} /> <span>Оформить</span></>}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderPage;