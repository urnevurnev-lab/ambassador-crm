import { useEffect, useMemo, useState } from 'react';
import { Check, MapPin, Minus, Package, Phone, Plus, User, X } from 'lucide-react';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface Product {
  id: number;
  line: string;
  flavor: string;
}

interface MeResponse {
  fullName: string;
  cdekInfo?: { city?: string; address?: string; code?: string; phone?: string } | null;
}

interface UserData {
  phone: string;
  cdekCity: string;
  cdekAddress: string;
  cdekCode: string;
}

export default function SampleOrderWizard({ isOpen, onClose }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<number, number>>({});
  const [me, setMe] = useState<MeResponse | null>(null);
  const [userData, setUserData] = useState<UserData>({
    phone: '',
    cdekCity: '',
    cdekAddress: '',
    cdekCode: '',
  });

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoading(true);

    Promise.all([apiClient.get<Product[]>('/api/products'), apiClient.get<MeResponse>('/api/users/me')])
      .then(([productsRes, meRes]) => {
        if (!isMounted) return;
        const meData = meRes.data;
        setProducts(productsRes.data || []);
        setMe(meData);
        const cdek = meData?.cdekInfo || {};
        setUserData({
          phone: cdek.phone || '',
          cdekCity: cdek.city || '',
          cdekAddress: cdek.address || '',
          cdekCode: cdek.code || '',
        });
      })
      .catch(() => toast.error('Не удалось загрузить данные'))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    products.forEach((product) => {
      const key = product.line || 'Другое';
      if (!groups[key]) groups[key] = [];
      groups[key].push(product);
    });
    Object.values(groups).forEach((items) => items.sort((a, b) => a.flavor.localeCompare(b.flavor)));
    return Object.fromEntries(Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)));
  }, [products]);

  const totalItems = useMemo(() => Object.values(cart).reduce((a, b) => a + b, 0), [cart]);
  const totalWeightKg = useMemo(() => (totalItems * 0.1).toFixed(1), [totalItems]);

  const selectedByLine = useMemo(() => {
    const productById = new Map(products.map((p) => [p.id, p]));
    const groups: Record<string, Array<{ id: number; flavor: string; qty: number }>> = {};

    Object.entries(cart).forEach(([id, qty]) => {
      const pid = Number(id);
      const product = productById.get(pid);
      if (!product) return;
      const key = product.line || 'Другое';
      if (!groups[key]) groups[key] = [];
      groups[key].push({ id: pid, flavor: product.flavor, qty });
    });

    Object.values(groups).forEach((items) => items.sort((a, b) => a.flavor.localeCompare(b.flavor)));
    return Object.fromEntries(Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)));
  }, [cart, products]);

  const updateCart = (id: number, delta: number) => {
    setCart((prev) => {
      const nextVal = (prev[id] || 0) + delta;
      if (nextVal <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: nextVal };
    });
  };

  const handleClose = () => {
    setStep(1);
    setCart({});
    onClose();
  };

  const handleSend = async () => {
    if (!userData.phone || !userData.cdekCity || !userData.cdekAddress) {
      toast.error('Заполните телефон и адрес СДЭК');
      return;
    }

    if (totalItems <= 0) {
      toast.error('Выберите хотя бы один вкус');
      return;
    }

    setLoading(true);
    try {
      await apiClient.patch('/api/users/me', {
        cdekInfo: {
          city: userData.cdekCity,
          address: userData.cdekAddress,
          code: userData.cdekCode,
          phone: userData.phone,
        },
      });

      await apiClient.post('/api/samples', {
        items: Object.entries(cart).map(([productId, quantity]) => ({
          productId: Number(productId),
          quantity,
        })),
      });

      toast.success('Заказ пробников оформлен');
      handleClose();
    } catch (e) {
      toast.error('Ошибка отправки');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={handleClose}
        aria-label="Закрыть"
      />

      <div
        className="relative z-10 w-full max-w-md rounded-t-[32px] sm:rounded-[32px] bg-white/80 backdrop-blur-2xl border border-white/30 shadow-2xl overflow-hidden"
        style={{ paddingBottom: 'calc(18px + var(--tg-safe-area-bottom))' }}
      >
        <div className="px-5 pt-5 pb-4 border-b border-white/30 bg-white/70 backdrop-blur-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black/5 border border-white/40 flex items-center justify-center text-black/60">
              <Package size={18} strokeWidth={1.5} />
            </div>
            <div>
              <div className="text-[12px] font-semibold uppercase tracking-widest text-black/40">
                {step === 1 ? 'Шаг 1 из 2' : 'Шаг 2 из 2'}
              </div>
              <div className="text-[18px] font-semibold text-black leading-tight">
                {step === 1 ? 'Заказать пробники' : 'Подтверждение'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-10 h-10 rounded-2xl bg-black/5 border border-white/40 flex items-center justify-center text-black/60 active:scale-95 transition-transform"
            aria-label="Закрыть"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <div className="max-h-[82dvh] overflow-y-auto px-5 pt-4 pb-32 no-scrollbar">
          {step === 1 && (
            <div className="space-y-6">
              {loading && products.length === 0 ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-20 rounded-3xl bg-white/60 border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
                    />
                  ))}
                </div>
              ) : (
                Object.entries(groupedProducts).map(([line, items]) => (
                  <div key={line} className="space-y-2">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/45 px-1">
                      {line}
                    </div>
                    <div className="space-y-2">
                      {items.map((product) => {
                        const count = cart[product.id] || 0;
                        return (
                          <div
                            key={product.id}
                            className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-4 flex items-center justify-between gap-4"
                          >
                            <div className="min-w-0">
                              <div className="text-[14px] font-semibold text-black truncate">{product.flavor}</div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => updateCart(product.id, -1)}
                                disabled={count <= 0}
                                className="w-9 h-9 rounded-2xl bg-black/5 border border-white/40 flex items-center justify-center text-black/60 disabled:opacity-30 active:scale-95 transition-transform"
                                aria-label="Уменьшить"
                              >
                                <Minus size={16} strokeWidth={2} />
                              </button>
                              <div className="w-8 text-center text-[14px] font-semibold text-black/80">{count}</div>
                              <button
                                type="button"
                                onClick={() => updateCart(product.id, 1)}
                                className="w-9 h-9 rounded-2xl bg-black text-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
                                aria-label="Добавить"
                              >
                                <Plus size={16} strokeWidth={2} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.08)] p-5 space-y-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/45">
                  Итог заказа
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[14px] font-semibold text-black/80">{totalItems} позиций</div>
                  <div className="px-3 py-1.5 rounded-2xl text-[12px] font-semibold bg-black/5 border border-white/40 text-black/60">
                    {totalWeightKg} кг
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {Object.entries(selectedByLine).map(([line, items]) => (
                  <div
                    key={line}
                    className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.08)] p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/45">
                        {line}
                      </div>
                      <div className="px-2.5 py-1.5 rounded-2xl text-[11px] font-semibold bg-black/5 border border-white/40 text-black/60">
                        {items.reduce((sum, item) => sum + item.qty, 0)} шт
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between gap-3">
                          <div className="min-w-0 text-[13px] font-semibold text-black/75 truncate">{item.flavor}</div>
                          <div className="text-[12px] font-semibold text-black/50 shrink-0">{item.qty}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.08)] p-5 space-y-4">
                <div>
                  <label className="text-[11px] text-black/50 font-semibold uppercase tracking-widest ml-1 flex items-center gap-1">
                    <User size={12} /> Получатель
                  </label>
                  <input
                    value={me?.fullName || ''}
                    readOnly
                    className="w-full mt-2 px-4 py-3.5 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/30 text-[15px] font-semibold text-black/70 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-black/50 font-semibold uppercase tracking-widest ml-1 flex items-center gap-1">
                    <MapPin size={12} /> Адрес СДЭК (ПВЗ)
                  </label>
                  <input
                    value={userData.cdekCity}
                    onChange={(e) => setUserData({ ...userData, cdekCity: e.target.value })}
                    className="w-full mt-2 px-4 py-3.5 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/30 text-[15px] font-medium text-black outline-none placeholder:text-black/30 focus:ring-4 focus:ring-black/5"
                    placeholder="Город"
                  />
                  <input
                    value={userData.cdekAddress}
                    onChange={(e) => setUserData({ ...userData, cdekAddress: e.target.value })}
                    className="w-full mt-2 px-4 py-3.5 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/30 text-[15px] font-medium text-black outline-none placeholder:text-black/30 focus:ring-4 focus:ring-black/5"
                    placeholder="Улица, дом, ПВЗ"
                  />
                  <input
                    value={userData.cdekCode}
                    onChange={(e) => setUserData({ ...userData, cdekCode: e.target.value })}
                    className="w-full mt-2 px-4 py-3.5 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/30 text-[15px] font-medium text-black outline-none placeholder:text-black/30 focus:ring-4 focus:ring-black/5"
                    placeholder="Код ПВЗ (если есть)"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-black/50 font-semibold uppercase tracking-widest ml-1 flex items-center gap-1">
                    <Phone size={12} /> Телефон
                  </label>
                  <input
                    value={userData.phone}
                    onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                    className="w-full mt-2 px-4 py-3.5 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/30 text-[15px] font-medium text-black outline-none placeholder:text-black/30 focus:ring-4 focus:ring-black/5"
                    placeholder="+7 999 000 00 00"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 px-5 pt-4 bg-white/70 backdrop-blur-2xl border-t border-white/30">
          {step === 1 ? (
            <button
              type="button"
              onClick={() => {
                if (totalItems <= 0) return toast.error('Выберите хотя бы один вкус');
                setStep(2);
              }}
              disabled={loading}
              className="w-full bg-black text-white font-semibold py-4 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.22)] disabled:opacity-40 active:scale-[0.99] transition-transform"
            >
              Далее • {totalItems} поз. • {totalWeightKg} кг
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 bg-black/5 border border-white/40 text-black/60 font-semibold py-4 rounded-3xl active:scale-[0.99] transition-transform"
              >
                Назад
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={loading}
                className="flex-[2] bg-black text-white font-semibold py-4 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.22)] flex items-center justify-center gap-2 disabled:opacity-40 active:scale-[0.99] transition-transform"
              >
                {loading ? 'Отправка...' : <>
                  Подтвердить <Check size={18} />
                </>}
              </button>
            </div>
          )}
          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}

