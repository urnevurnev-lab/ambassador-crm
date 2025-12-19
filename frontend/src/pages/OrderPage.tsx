import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Minus, Search, ShoppingBag, Send, X, ChevronRight } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { StandardCard } from '../components/ui/StandardCard';
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
      navigate(`/facilities/${facilityId}`);
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
        <p className="text-gray-400 font-medium tracking-tight">Загрузка каталога...</p>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="min-h-screen px-4 pb-32 pt-4 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-xl border border-gray-100 shadow-sm">
            <X size={20} className="text-gray-400" />
          </button>
          <PageHeader title={step === 1 ? "Маст-лист" : step === 2 ? "Каталог" : "Финальный шаг"} />
        </div>

        <div className="flex gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1.5 flex-1 rounded-full bg-blue-600 transition-opacity duration-300 ${step >= s ? 'opacity-100' : 'opacity-10'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 text-left">
              <div className="p-5 bg-blue-50 rounded-[28px] border border-blue-100/50">
                <h3 className="text-blue-700 font-bold flex items-center gap-2">
                  <ShoppingBag size={18} /> Рекомендации
                </h3>
                <p className="text-blue-600/70 text-xs mt-1 font-medium leading-relaxed">
                  Этих "Топ-вкусов" не обнаружено при последнем визите. Рекомендуем добавить в заказ.
                </p>
              </div>

              <div className="space-y-3">
                {recommendedGaps.length > 0 ? recommendedGaps.map(p => (
                  <StandardCard
                    key={p.id}
                    title={p.flavor}
                    subtitle={p.line}
                    color="white"
                    floating={false}
                    action={
                      <button
                        onClick={() => handleIncrement(p.id)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${cart[p.id] ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-300 border border-gray-100'}`}
                      >
                        {cart[p.id] ? <span className="text-sm font-black">{cart[p.id]}</span> : <Plus size={20} />}
                      </button>
                    }
                  />
                )) : (
                  <div className="text-center py-12 text-gray-400 font-bold border-2 border-dashed border-gray-100 rounded-[30px]">
                    Все топ-вкусы в наличии!
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 text-left">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Поиск товара..."
                  className="w-full pl-11 pr-4 h-12 bg-white rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {categories.map(c => (
                  <button key={c} onClick={() => setActiveCategory(c)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${activeCategory === c ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-100'}`}>
                    {c}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                {filteredProducts.map(p => {
                  const count = cart[p.id] || 0;
                  return (
                    <StandardCard key={p.id} title={p.flavor} subtitle={`${p.line} • ${p.price} ₽`} color="white" floating={false}>
                      <div className="flex justify-end gap-3 mt-4">
                        {count > 0 ? (
                          <div className="flex items-center gap-3 bg-gray-50 p-1 px-3 rounded-xl border border-gray-100">
                            <button onClick={() => handleDecrement(p.id)} className="p-1"><Minus size={16} className="text-gray-400" /></button>
                            <span className="text-sm font-bold text-gray-900">{count}</span>
                            <button onClick={() => handleIncrement(p.id)} className="p-1"><Plus size={16} className="text-blue-600" /></button>
                          </div>
                        ) : (
                          <button onClick={() => handleIncrement(p.id)} className="px-4 py-2 bg-gray-50 text-gray-400 text-xs font-bold rounded-xl border border-gray-100 active:bg-blue-50">
                            Добавить
                          </button>
                        )}
                      </div>
                    </StandardCard>
                  )
                })}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 text-left">
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Детали заказа</h3>
                <StandardCard title="Контакт ЛПР" color="white" floating={false}>
                  <input
                    type="text"
                    placeholder="Имя и Фамилия"
                    className="w-full mt-4 p-4 bg-gray-50 rounded-2xl outline-none font-bold border border-gray-100 focus:ring-2 focus:ring-blue-500/20"
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                  />
                </StandardCard>

                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 mt-6">Дистрибьютор</h3>
                <div className="grid grid-cols-1 gap-2">
                  {distributors.map(d => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDistributorId(d.id)}
                      className={`p-4 rounded-2xl border text-left transition-all ${selectedDistributorId === d.id ? 'bg-blue-600 text-white border-blue-700 shadow-lg shadow-blue-200' : 'bg-white text-gray-900 border-gray-100'}`}
                    >
                      <p className="font-bold">{d.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5 bg-gray-900 rounded-[30px] text-white">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-4">Резюме</p>
                <div className="space-y-2 max-h-[150px] overflow-y-auto no-scrollbar pr-1 text-left">
                  {Object.entries(cart).map(([id, qty]) => {
                    const p = products.find(prod => prod.id === Number(id));
                    return (
                      <div key={id} className="flex justify-between items-center text-sm">
                        <span className="opacity-70 truncate flex-1">{p?.flavor}</span>
                        <span className="font-bold ml-4 whitespace-nowrap">x{qty}</span>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-end">
                  <span className="text-xs font-medium opacity-50">Итого:</span>
                  <span className="text-2xl font-black">{totalPrice.toLocaleString()} ₽</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="fixed bottom-24 left-4 right-4 z-40">
          <div className="flex gap-3">
            {step > 1 && (
              <button onClick={() => { setStep(step - 1); WebApp.HapticFeedback?.impactOccurred('medium'); }} className="flex-1 py-4 bg-white border border-gray-100 text-gray-400 font-bold rounded-2xl shadow-sm active:scale-95 transition-all">
                Назад
              </button>
            )}
            {step < 3 ? (
              <button onClick={() => { setStep(step + 1); WebApp.HapticFeedback?.impactOccurred('medium'); }} className="flex-[2] py-4 bg-black text-white font-bold rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                Далее <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={handleCheckout}
                disabled={isOrdering || !contactName || !selectedDistributorId || totalItems === 0}
                className="flex-[3] py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
              >
                {isOrdering ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <><Send size={18} /> <span>Отправить</span></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderPage;