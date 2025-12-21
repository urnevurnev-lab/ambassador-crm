import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Briefcase, Car, Check, ChevronLeft, MapPin, Minus, Plus, Search, Timer, Wine, X } from 'lucide-react';
import apiClient from '../api/apiClient';
import WebApp from '@twa-dev/sdk';
import toast from 'react-hot-toast';

interface Facility {
  id: number;
  name: string;
  address: string;
}

interface Product {
  id: number;
  line: string;
  flavor: string;
}

type VisitScenario = 'transit' | 'checkup' | 'tasting' | 'b2b';

type ContactCard = {
  id: string;
  name: string;
  contact: string;
};

const createLocalId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return (crypto as Crypto).randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createEmptyContactCard = (): ContactCard => ({
  id: createLocalId(),
  name: '',
  contact: '',
});

const normalizeContactCards = (cards: ContactCard[]) =>
  cards
    .map((card) => ({
      ...card,
      name: card.name.trim(),
      contact: card.contact.trim(),
    }))
    .filter((card) => card.name.length > 0 || card.contact.length > 0);

const isVisitScenario = (value: string | null): value is VisitScenario => {
  return value === 'transit' || value === 'checkup' || value === 'tasting' || value === 'b2b';
};

const VISIT_SCENARIOS: Array<{
  code: VisitScenario;
  title: string;
  subtitle: string;
  Icon: React.ElementType;
}> = [
  { code: 'transit', title: 'Проезд', subtitle: 'Чек-ин и инвентарь', Icon: Car },
  { code: 'checkup', title: 'Открытая смена', subtitle: 'Время и чашки', Icon: Timer },
  { code: 'tasting', title: 'Дегустация', subtitle: 'Участники и фидбек', Icon: Wine },
  { code: 'b2b', title: 'B2B', subtitle: 'Переговоры и ЛПР', Icon: Briefcase },
];

const VISIT_TYPE_LABEL: Record<VisitScenario, string> = {
  transit: 'Проезд',
  checkup: 'Открытая смена',
  tasting: 'Дегустация',
  b2b: 'B2B',
};

const VisitWizard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedFacilityId = Number(searchParams.get('facilityId')) || null;
  const preselectedTypeRaw = searchParams.get('type');
  const preselectedType = isVisitScenario(preselectedTypeRaw) ? preselectedTypeRaw : null;

  const [step, setStep] = useState(() => {
    if (!preselectedFacilityId) return 0;
    if (!preselectedType) return 1;
    return 2;
  });
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [facilityId, setFacilityId] = useState<number | null>(preselectedFacilityId);
  const [visitType, setVisitType] = useState<VisitScenario | null>(preselectedType);
  const [search, setSearch] = useState('');
  const [checkInConfirmed, setCheckInConfirmed] = useState(false);
  const [inventory, setInventory] = useState<Record<number, boolean>>({});
  const [comment, setComment] = useState('');
  const [shiftStartTime, setShiftStartTime] = useState('');
  const [shiftEndTime, setShiftEndTime] = useState('');
  const [shiftCups, setShiftCups] = useState('');
  const [tastingGuestCards, setTastingGuestCards] = useState<ContactCard[]>(() =>
    preselectedType === 'tasting' ? [createEmptyContactCard()] : []
  );
  const [tastingNote, setTastingNote] = useState('');
  const [b2bCards, setB2bCards] = useState<ContactCard[]>(() =>
    preselectedType === 'b2b' ? [createEmptyContactCard()] : []
  );
  const [b2bNote, setB2bNote] = useState('');
  const [sampleUsage, setSampleUsage] = useState<Record<number, number>>({});
  const [sampleUsageSearch, setSampleUsageSearch] = useState('');
  const [sampleUsageLine, setSampleUsageLine] = useState('');
  const [loadingFacilities, setLoadingFacilities] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      WebApp.enableClosingConfirmation?.();
    } catch (e) {
      console.warn('ClosingConfirmation enable failed:', e);
    }
    return () => {
      try {
        WebApp.disableClosingConfirmation?.();
      } catch (e) {
        console.warn('ClosingConfirmation disable failed:', e);
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadFacilities = async () => {
      setLoadingFacilities(true);
      try {
        const res = await apiClient.get<Facility[]>('/api/facilities');
        if (isMounted) setFacilities(res.data || []);
      } catch (e) {
        toast.error('Не удалось загрузить список точек');
      } finally {
        if (isMounted) setLoadingFacilities(false);
      }
    };
    loadFacilities();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const needsProducts =
      (visitType === 'transit' && step >= 3) ||
      ((visitType === 'tasting' || visitType === 'b2b') && step >= 2);

    if (!needsProducts) return;
    if (products.length > 0) return;
    let isMounted = true;
    const loadProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await apiClient.get<Product[]>('/api/products');
        if (isMounted) setProducts(res.data || []);
      } catch (e) {
        toast.error('Не удалось загрузить список продуктов');
      } finally {
        if (isMounted) setLoadingProducts(false);
      }
    };
    loadProducts();
    return () => {
      isMounted = false;
    };
  }, [step, products.length, visitType]);

  const filteredFacilities = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return facilities;
    return facilities.filter((facility) =>
      [facility.name, facility.address].some((value) => value?.toLowerCase().includes(term))
    );
  }, [facilities, search]);

  const groupedProducts = useMemo(() => {
    return products.reduce<Record<string, Product[]>>((acc, product) => {
      const key = product.line || 'Другое';
      if (!acc[key]) acc[key] = [];
      acc[key].push(product);
      return acc;
    }, {});
  }, [products]);

  const filteredSampleUsageGroups = useMemo(() => {
    const term = sampleUsageSearch.trim().toLowerCase();
    const baseGroups =
      sampleUsageLine && sampleUsageLine !== 'all'
        ? { [sampleUsageLine]: groupedProducts[sampleUsageLine] || [] }
        : groupedProducts;

    if (!term) return baseGroups;

    return Object.fromEntries(
      Object.entries(baseGroups)
        .map(([line, items]) => [line, items.filter((item) => item.flavor.toLowerCase().includes(term))] as const)
        .filter(([, items]) => items.length > 0)
    );
  }, [groupedProducts, sampleUsageSearch, sampleUsageLine]);

  const updateSampleUsage = (productId: number, delta: number) => {
    setSampleUsage((prev) => {
      const next = { ...prev };
      const nextVal = (next[productId] || 0) + delta;
      if (nextVal <= 0) {
        delete next[productId];
      } else {
        next[productId] = nextVal;
      }
      return next;
    });
  };

  useEffect(() => {
    if (sampleUsageLine) return;
    const lines = Object.keys(groupedProducts);
    if (lines.length === 0) return;
    setSampleUsageLine(lines.sort((a, b) => a.localeCompare(b))[0]);
  }, [groupedProducts, sampleUsageLine]);

  const selectedFacility = useMemo(() => {
    return facilities.find((facility) => facility.id === facilityId) || null;
  }, [facilities, facilityId]);

  useEffect(() => {
    if (visitType === 'tasting') {
      setTastingGuestCards((prev) => (prev.length ? prev : [createEmptyContactCard()]));
    }
    if (visitType === 'b2b') {
      setB2bCards((prev) => (prev.length ? prev : [createEmptyContactCard()]));
    }
  }, [visitType]);

  const tastingGuestsCount = useMemo(() => normalizeContactCards(tastingGuestCards).length, [tastingGuestCards]);
  const b2bContactsCount = useMemo(() => normalizeContactCards(b2bCards).length, [b2bCards]);
  const sampleUsageTotal = useMemo(() => Object.values(sampleUsage).reduce((sum, value) => sum + (value || 0), 0), [sampleUsage]);

  const scenarioSteps = useMemo(() => {
    switch (visitType) {
      case 'transit':
        return ['Чек-ин', 'Инвентарь', 'Отчет'];
      case 'checkup':
        return ['Смена', 'Отчет'];
      case 'tasting':
        return ['Дегустация', 'Отчет'];
      case 'b2b':
        return ['B2B', 'Отчет'];
      default:
        return [];
    }
  }, [visitType]);

  const steps = useMemo(() => {
    return ['Точка', 'Активность', ...scenarioSteps];
  }, [scenarioSteps]);

  useEffect(() => {
    if (step > steps.length - 1) setStep(steps.length - 1);
  }, [step, steps.length]);

  const isLastStep = step === steps.length - 1;
  const currentStep = steps[step] ?? steps[0];

  const canProceed = useMemo(() => {
    if (step === 0) return Boolean(facilityId);
    if (step === 1) return Boolean(visitType);
    if (visitType === 'transit' && currentStep === 'Чек-ин') return checkInConfirmed;
    return true;
  }, [step, facilityId, checkInConfirmed, currentStep, visitType]);

  const handleSubmit = async () => {
    if (!facilityId) {
      toast.error('Выберите точку');
      setStep(0);
      return;
    }

    if (!visitType) {
      toast.error('Выберите активность');
      setStep(1);
      return;
    }

    setSubmitting(true);
    try {
      const telegramUser = WebApp.initDataUnsafe?.user;
      const userId = telegramUser?.id ? String(telegramUser.id) : '1';

      const scenarioData: Record<string, unknown> = { comment };
      const cleanedSampleUsage = Object.fromEntries(
        Object.entries(sampleUsage)
          .map(([key, value]) => [key, Number(value) || 0] as const)
          .filter(([, value]) => value > 0)
      );
      if ((visitType === 'tasting' || visitType === 'b2b') && Object.keys(cleanedSampleUsage).length > 0) {
        scenarioData.sampleUsage = cleanedSampleUsage;
      }

      if (visitType === 'transit') {
        scenarioData.checkInConfirmed = checkInConfirmed;
        scenarioData.inventory = inventory;
      }

      if (visitType === 'checkup') {
        scenarioData.shift = {
          startTime: shiftStartTime,
          endTime: shiftEndTime,
          cups: Number(shiftCups) || 0,
        };
      }

      if (visitType === 'tasting') {
        const normalized = normalizeContactCards(tastingGuestCards);
        scenarioData.guests = normalized
          .map((card) => card.name || card.contact)
          .filter(Boolean);
        scenarioData.guestCards = normalized.map((card) => ({
          name: card.name,
          contact: card.contact,
          facility: selectedFacility?.name || '',
          facilityId,
        }));
        scenarioData.note = tastingNote;
      }

      if (visitType === 'b2b') {
        const normalized = normalizeContactCards(b2bCards);
        scenarioData.contacts = normalized.map((card) => ({
          name: card.name,
          contact: card.contact,
          facility: selectedFacility?.name || '',
          facilityId,
        }));
        scenarioData.note = b2bNote;
      }

      await apiClient.post('/api/visits', {
        facilityId,
        type: visitType,
        userId,
        status: 'COMPLETED',
        scenarioData,
      });

      WebApp.HapticFeedback?.notificationOccurred('success');
      toast.success('Отчет отправлен');
      navigate(`/facilities/${facilityId}`);
    } catch (e) {
      toast.error('Ошибка при отправке отчета');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      <PageHeader
        title="Визит"
        subtitle={`Шаг ${
          preselectedFacilityId && preselectedType && step >= 2 && scenarioSteps.length > 0 ? step - 1 : step + 1
        } из ${
          preselectedFacilityId && preselectedType && step >= 2 && scenarioSteps.length > 0 ? scenarioSteps.length : steps.length
        }`}
        rightAction={
          <button
            onClick={() => navigate(-1)}
            className="text-sm font-semibold text-gray-500"
          >
            Закрыть
          </button>
        }
      />

      {step === 0 && (
        <div className="space-y-4">
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <MapPin size={16} strokeWidth={1.5} />
            </div>
            <input
              type="text"
              placeholder="Найдите точку"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white h-[52px] rounded-3xl pl-11 pr-4 text-[15px] font-medium shadow-sm border border-gray-100 outline-none placeholder:text-gray-300"
            />
          </div>

          {loadingFacilities ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-20 rounded-3xl bg-white border border-gray-100 shadow-sm" />
              ))}
            </div>
          ) : filteredFacilities.length === 0 ? (
            <div className="text-center text-gray-500">Ничего не найдено</div>
          ) : (
            <div className="space-y-3">
              {filteredFacilities.map((facility) => (
                <button
                  key={facility.id}
                  onClick={() => {
                    setFacilityId(facility.id);
                    setVisitType(null);
                    setStep(1);
                    WebApp.HapticFeedback?.impactOccurred('light');
                  }}
                  className={`w-full text-left rounded-3xl border shadow-sm p-5 transition-all ${
                    facilityId === facility.id
                      ? 'border-black bg-black text-white'
                      : 'border-gray-100 bg-white text-gray-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-[16px] font-semibold">
                        {facility.name}
                      </h3>
                      <p className="text-[12px] text-gray-400 mt-1">
                        {facility.address}
                      </p>
                    </div>
                    {facilityId === facility.id && (
                      <div className="w-8 h-8 rounded-2xl bg-white/10 flex items-center justify-center">
                        <Check size={16} strokeWidth={2} />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-500">Точка</div>
            <div className="text-lg font-semibold text-black mt-2">
              {selectedFacility?.name || 'Не выбрано'}
            </div>
            <div className="text-sm text-gray-500 mt-1">{selectedFacility?.address || '—'}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {VISIT_SCENARIOS.map(({ code, title, subtitle, Icon }) => {
              const selected = visitType === code;
              return (
                <button
                  key={code}
                  onClick={() => {
                    setVisitType(code);
                    setStep(2);
                    WebApp.HapticFeedback?.impactOccurred('light');
                  }}
                  className={`rounded-3xl border p-4 text-left transition-all active:scale-[0.99] ${
                    selected ? 'border-black bg-black text-white' : 'border-gray-100 bg-white text-gray-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[15px] font-semibold">{title}</div>
                      <div className={`mt-1 text-[12px] ${selected ? 'text-white/70' : 'text-gray-500'}`}>
                        {subtitle}
                      </div>
                    </div>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                      selected ? 'bg-white/10' : 'bg-[#F5F5F7] text-gray-600'
                    }`}>
                      <Icon size={18} strokeWidth={1.5} className={selected ? 'text-white/80' : ''} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {currentStep === 'Чек-ин' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-500">Точка</div>
            <div className="text-lg font-semibold text-black mt-2">
              {selectedFacility?.name || '—'}
            </div>
            <div className="text-sm text-gray-500 mt-1">{selectedFacility?.address || '—'}</div>
          </div>

          <button
            onClick={() => setCheckInConfirmed((prev) => !prev)}
            className={`w-full rounded-3xl border shadow-sm p-5 text-left transition-all ${
              checkInConfirmed ? 'border-black bg-black text-white' : 'border-gray-200 bg-white text-gray-900'
            }`}
          >
            <div className="text-[15px] font-semibold">
              {checkInConfirmed ? 'Чек-ин подтвержден' : 'Подтвердить чек-ин'}
            </div>
            <div className={`text-[12px] mt-1 ${checkInConfirmed ? 'text-white/70' : 'text-gray-500'}`}>
              Подтвердите присутствие вручную
            </div>
          </button>
        </div>
      )}

      {currentStep === 'Смена' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 space-y-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-500">Начало смены</div>
              <input
                type="time"
                value={shiftStartTime}
                onChange={(e) => setShiftStartTime(e.target.value)}
                className="mt-2 w-full bg-[#F5F5F7] rounded-2xl px-4 py-3.5 text-gray-900 font-medium border border-gray-100 focus:bg-white focus:ring-2 focus:ring-black/5 outline-none transition-all"
              />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-500">Конец смены</div>
              <input
                type="time"
                value={shiftEndTime}
                onChange={(e) => setShiftEndTime(e.target.value)}
                className="mt-2 w-full bg-[#F5F5F7] rounded-2xl px-4 py-3.5 text-gray-900 font-medium border border-gray-100 focus:bg-white focus:ring-2 focus:ring-black/5 outline-none transition-all"
              />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-500">Сколько чашек отдали?</div>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={shiftCups}
                onChange={(e) => setShiftCups(e.target.value)}
                placeholder="Например, 25"
                className="mt-2 w-full bg-[#F5F5F7] rounded-2xl px-4 py-3.5 text-gray-900 font-medium border border-gray-100 focus:bg-white focus:ring-2 focus:ring-black/5 outline-none transition-all"
              />
            </div>
          </div>
        </div>
      )}

      {currentStep === 'Дегустация' && (
        <div className="space-y-4">
          <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.10)] p-5">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-black/50">Гости</div>
              <div className="mt-2 text-[15px] font-semibold text-black">Карточки участников</div>
              <div className="mt-1 text-[12px] text-black/50">Добавьте гостя на каждую карточку</div>
            </div>

            <div className="mt-4 space-y-3">
              {tastingGuestCards.length === 0 ? (
                <button
                  onClick={() => setTastingGuestCards([createEmptyContactCard()])}
                  className="w-full rounded-3xl border border-white/30 bg-white/70 backdrop-blur-xl shadow-sm px-4 py-4 text-left active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[14px] font-semibold text-black">Добавить первого гостя</div>
                    <Plus size={18} strokeWidth={2} className="text-black/50" />
                  </div>
                </button>
              ) : (
                tastingGuestCards.map((card, index) => (
                  <div
                    key={card.id}
                    className="rounded-3xl border border-white/30 bg-white/70 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[12px] font-semibold uppercase tracking-widest text-black/40">
                        Гость {index + 1}
                      </div>
                      <button
                        onClick={() =>
                          setTastingGuestCards((prev) => prev.filter((item) => item.id !== card.id))
                        }
                        className="w-9 h-9 rounded-2xl bg-black/5 border border-white/40 flex items-center justify-center text-black/50 active:scale-95 transition-transform"
                        aria-label="Удалить гостя"
                      >
                        <X size={16} strokeWidth={2} />
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3">
                      <input
                        value={card.name}
                        onChange={(e) =>
                          setTastingGuestCards((prev) =>
                            prev.map((item) => (item.id === card.id ? { ...item, name: e.target.value } : item))
                          )
                        }
                        placeholder="Имя гостя"
                        className="w-full bg-white/70 backdrop-blur-xl rounded-2xl px-4 py-3.5 text-[15px] font-medium text-black border border-white/30 outline-none placeholder:text-black/30 focus:ring-4 focus:ring-black/5"
                      />
                      <input
                        value={card.contact}
                        onChange={(e) =>
                          setTastingGuestCards((prev) =>
                            prev.map((item) =>
                              item.id === card.id ? { ...item, contact: e.target.value } : item
                            )
                          )
                        }
                        placeholder="Контакт (телефон / Telegram)"
                        className="w-full bg-white/70 backdrop-blur-xl rounded-2xl px-4 py-3.5 text-[15px] font-medium text-black border border-white/30 outline-none placeholder:text-black/30 focus:ring-4 focus:ring-black/5"
                      />
                      <div className="rounded-2xl bg-black/5 border border-white/40 px-4 py-3 text-[12px] text-black/60">
                        <div className="flex items-start gap-2">
                          <MapPin size={14} strokeWidth={1.5} className="mt-0.5 text-black/35" />
                          <div className="min-w-0">
                            <div className="text-[10px] font-semibold uppercase tracking-widest text-black/40">
                              Заведение
                            </div>
                            <div className="mt-1 text-[13px] font-semibold text-black/70 truncate">
                              {selectedFacility?.name || '—'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

	            <button
	              onClick={() => setTastingGuestCards((prev) => [...prev, createEmptyContactCard()])}
	              className="mt-4 w-full rounded-3xl bg-black/5 border border-white/40 py-3.5 text-[13px] font-semibold text-black/70 flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
	            >
	              <Plus size={16} strokeWidth={2} className="text-black/60" />
	              Добавить гостя
	            </button>
	          </div>

	          <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.10)] p-5">
	            <div className="flex items-start justify-between gap-4">
	              <div>
	                <div className="text-xs font-semibold uppercase tracking-widest text-black/50">Пробники</div>
	                <div className="mt-2 text-[15px] font-semibold text-black">Что курили</div>
	                <div className="mt-1 text-[12px] text-black/50">
	                  Отметьте вкусы — так мы сможем считать остаток пробников.
	                </div>
	              </div>
	              <div className="px-3 py-1.5 rounded-2xl text-[12px] font-semibold bg-black/5 border border-white/40 text-black/60 shrink-0">
	                {sampleUsageTotal}×
	              </div>
	            </div>

	            <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
	              <button
	                onClick={() => setSampleUsageLine('all')}
	                className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap border transition ${
	                  sampleUsageLine === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white/70 border-white/30 text-black/55'
	                }`}
	              >
	                Все
	              </button>
	              {Object.keys(groupedProducts)
	                .sort((a, b) => a.localeCompare(b))
	                .map((line) => (
	                  <button
	                    key={line}
	                    onClick={() => setSampleUsageLine(line)}
	                    className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap border transition ${
	                      sampleUsageLine === line ? 'bg-gray-900 text-white border-gray-900' : 'bg-white/70 border-white/30 text-black/55'
	                    }`}
	                  >
	                    {line}
	                  </button>
	                ))}
	            </div>

	            <div className="relative mt-3">
	              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30">
	                <Search size={18} strokeWidth={1.5} />
	              </div>
	              <input
	                value={sampleUsageSearch}
	                onChange={(e) => setSampleUsageSearch(e.target.value)}
	                placeholder="Поиск по вкусу"
	                className="w-full bg-white/70 backdrop-blur-xl h-[48px] rounded-3xl pl-11 pr-4 text-[14px] font-medium shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-white/30 outline-none placeholder:text-black/30"
	              />
	            </div>

	            <div className="mt-4 space-y-4">
	              {loadingProducts ? (
	                <div className="space-y-3 animate-pulse">
	                  {[1, 2, 3].map((item) => (
	                    <div
	                      key={item}
	                      className="h-16 rounded-3xl bg-white/60 border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
	                    />
	                  ))}
	                </div>
	              ) : products.length === 0 ? (
	                <div className="text-center text-sm text-black/50">Нет списка вкусов</div>
	              ) : Object.entries(filteredSampleUsageGroups).every(([, items]) => items.length === 0) ? (
	                <div className="text-center text-sm text-black/50">Ничего не найдено</div>
	              ) : (
	                Object.entries(filteredSampleUsageGroups)
	                  .filter(([, items]) => items.length > 0)
	                  .map(([line, items]) => (
	                    <div key={line} className="space-y-2">
	                      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/45 px-1">
	                        {line}
	                      </div>
	                      <div className="space-y-2">
	                        {items.map((product) => {
	                          const count = sampleUsage[product.id] || 0;
	                          return (
	                            <div
	                              key={product.id}
	                              className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-4 flex items-center justify-between gap-4"
	                            >
	                              <div className="min-w-0 text-[14px] font-semibold text-black/80 truncate">
	                                {product.flavor}
	                              </div>
	                              <div className="flex items-center gap-2 shrink-0">
	                                <button
	                                  onClick={() => updateSampleUsage(product.id, -1)}
	                                  disabled={count <= 0}
	                                  className="w-9 h-9 rounded-2xl bg-black/5 border border-white/40 flex items-center justify-center text-black/60 disabled:opacity-30 active:scale-95 transition-transform"
	                                  aria-label="Уменьшить"
	                                >
	                                  <Minus size={16} strokeWidth={2} />
	                                </button>
	                                <div className="w-8 text-center text-[14px] font-semibold text-black/80">
	                                  {count}
	                                </div>
	                                <button
	                                  onClick={() => updateSampleUsage(product.id, 1)}
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
	          </div>

	          <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.10)] p-5">
	            <div className="text-xs font-semibold uppercase tracking-widest text-black/50">Итог мероприятия</div>
	            <textarea
	              value={tastingNote}
              onChange={(e) => setTastingNote(e.target.value)}
              placeholder="Коротко: как прошла дегустация, что понравилось, договоренности"
              className="mt-3 w-full bg-white/70 backdrop-blur-xl rounded-2xl p-4 text-[15px] font-medium outline-none border border-white/30 focus:ring-4 focus:ring-black/5 placeholder:text-black/30"
              rows={4}
            />
          </div>
        </div>
      )}

      {currentStep === 'B2B' && (
        <div className="space-y-4">
          <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.10)] p-5">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-black/50">Контакты</div>
              <div className="mt-2 text-[15px] font-semibold text-black">Карточки ЛПР / партнеров</div>
              <div className="mt-1 text-[12px] text-black/50">Одна карточка — один контакт</div>
            </div>

            <div className="mt-4 space-y-3">
              {b2bCards.length === 0 ? (
                <button
                  onClick={() => setB2bCards([createEmptyContactCard()])}
                  className="w-full rounded-3xl border border-white/30 bg-white/70 backdrop-blur-xl shadow-sm px-4 py-4 text-left active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[14px] font-semibold text-black">Добавить первый контакт</div>
                    <Plus size={18} strokeWidth={2} className="text-black/50" />
                  </div>
                </button>
              ) : (
                b2bCards.map((card, index) => (
                  <div
                    key={card.id}
                    className="rounded-3xl border border-white/30 bg-white/70 backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[12px] font-semibold uppercase tracking-widest text-black/40">
                        Контакт {index + 1}
                      </div>
                      <button
                        onClick={() => setB2bCards((prev) => prev.filter((item) => item.id !== card.id))}
                        className="w-9 h-9 rounded-2xl bg-black/5 border border-white/40 flex items-center justify-center text-black/50 active:scale-95 transition-transform"
                        aria-label="Удалить контакт"
                      >
                        <X size={16} strokeWidth={2} />
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3">
                      <input
                        value={card.name}
                        onChange={(e) =>
                          setB2bCards((prev) =>
                            prev.map((item) => (item.id === card.id ? { ...item, name: e.target.value } : item))
                          )
                        }
                        placeholder="Имя / должность"
                        className="w-full bg-white/70 backdrop-blur-xl rounded-2xl px-4 py-3.5 text-[15px] font-medium text-black border border-white/30 outline-none placeholder:text-black/30 focus:ring-4 focus:ring-black/5"
                      />
                      <input
                        value={card.contact}
                        onChange={(e) =>
                          setB2bCards((prev) =>
                            prev.map((item) =>
                              item.id === card.id ? { ...item, contact: e.target.value } : item
                            )
                          )
                        }
                        placeholder="Контакт (телефон / Telegram)"
                        className="w-full bg-white/70 backdrop-blur-xl rounded-2xl px-4 py-3.5 text-[15px] font-medium text-black border border-white/30 outline-none placeholder:text-black/30 focus:ring-4 focus:ring-black/5"
                      />
                      <div className="rounded-2xl bg-black/5 border border-white/40 px-4 py-3 text-[12px] text-black/60">
                        <div className="flex items-start gap-2">
                          <MapPin size={14} strokeWidth={1.5} className="mt-0.5 text-black/35" />
                          <div className="min-w-0">
                            <div className="text-[10px] font-semibold uppercase tracking-widest text-black/40">
                              Заведение
                            </div>
                            <div className="mt-1 text-[13px] font-semibold text-black/70 truncate">
                              {selectedFacility?.name || '—'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

	            <button
	              onClick={() => setB2bCards((prev) => [...prev, createEmptyContactCard()])}
	              className="mt-4 w-full rounded-3xl bg-black/5 border border-white/40 py-3.5 text-[13px] font-semibold text-black/70 flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
	            >
	              <Plus size={16} strokeWidth={2} className="text-black/60" />
	              Добавить контакт
	            </button>
	          </div>

	          <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.10)] p-5">
	            <div className="flex items-start justify-between gap-4">
	              <div>
	                <div className="text-xs font-semibold uppercase tracking-widest text-black/50">Пробники</div>
	                <div className="mt-2 text-[15px] font-semibold text-black">Что курили</div>
	                <div className="mt-1 text-[12px] text-black/50">
	                  Отметьте вкусы — так мы сможем считать остаток пробников.
	                </div>
	              </div>
	              <div className="px-3 py-1.5 rounded-2xl text-[12px] font-semibold bg-black/5 border border-white/40 text-black/60 shrink-0">
	                {sampleUsageTotal}×
	              </div>
	            </div>

	            <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
	              <button
	                onClick={() => setSampleUsageLine('all')}
	                className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap border transition ${
	                  sampleUsageLine === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white/70 border-white/30 text-black/55'
	                }`}
	              >
	                Все
	              </button>
	              {Object.keys(groupedProducts)
	                .sort((a, b) => a.localeCompare(b))
	                .map((line) => (
	                  <button
	                    key={line}
	                    onClick={() => setSampleUsageLine(line)}
	                    className={`px-4 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap border transition ${
	                      sampleUsageLine === line ? 'bg-gray-900 text-white border-gray-900' : 'bg-white/70 border-white/30 text-black/55'
	                    }`}
	                  >
	                    {line}
	                  </button>
	                ))}
	            </div>

	            <div className="relative mt-3">
	              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30">
	                <Search size={18} strokeWidth={1.5} />
	              </div>
	              <input
	                value={sampleUsageSearch}
	                onChange={(e) => setSampleUsageSearch(e.target.value)}
	                placeholder="Поиск по вкусу"
	                className="w-full bg-white/70 backdrop-blur-xl h-[48px] rounded-3xl pl-11 pr-4 text-[14px] font-medium shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-white/30 outline-none placeholder:text-black/30"
	              />
	            </div>

	            <div className="mt-4 space-y-4">
	              {loadingProducts ? (
	                <div className="space-y-3 animate-pulse">
	                  {[1, 2, 3].map((item) => (
	                    <div
	                      key={item}
	                      className="h-16 rounded-3xl bg-white/60 border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
	                    />
	                  ))}
	                </div>
	              ) : products.length === 0 ? (
	                <div className="text-center text-sm text-black/50">Нет списка вкусов</div>
	              ) : Object.entries(filteredSampleUsageGroups).every(([, items]) => items.length === 0) ? (
	                <div className="text-center text-sm text-black/50">Ничего не найдено</div>
	              ) : (
	                Object.entries(filteredSampleUsageGroups)
	                  .filter(([, items]) => items.length > 0)
	                  .map(([line, items]) => (
	                    <div key={line} className="space-y-2">
	                      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/45 px-1">
	                        {line}
	                      </div>
	                      <div className="space-y-2">
	                        {items.map((product) => {
	                          const count = sampleUsage[product.id] || 0;
	                          return (
	                            <div
	                              key={product.id}
	                              className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.06)] p-4 flex items-center justify-between gap-4"
	                            >
	                              <div className="min-w-0 text-[14px] font-semibold text-black/80 truncate">
	                                {product.flavor}
	                              </div>
	                              <div className="flex items-center gap-2 shrink-0">
	                                <button
	                                  onClick={() => updateSampleUsage(product.id, -1)}
	                                  disabled={count <= 0}
	                                  className="w-9 h-9 rounded-2xl bg-black/5 border border-white/40 flex items-center justify-center text-black/60 disabled:opacity-30 active:scale-95 transition-transform"
	                                  aria-label="Уменьшить"
	                                >
	                                  <Minus size={16} strokeWidth={2} />
	                                </button>
	                                <div className="w-8 text-center text-[14px] font-semibold text-black/80">
	                                  {count}
	                                </div>
	                                <button
	                                  onClick={() => updateSampleUsage(product.id, 1)}
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
	          </div>

	          <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.10)] p-5">
	            <div className="text-xs font-semibold uppercase tracking-widest text-black/50">Итог мероприятия</div>
	            <textarea
	              value={b2bNote}
              onChange={(e) => setB2bNote(e.target.value)}
              placeholder="Что обсудили, договоренности, следующие шаги"
              className="mt-3 w-full bg-white/70 backdrop-blur-xl rounded-2xl p-4 text-[15px] font-medium outline-none border border-white/30 focus:ring-4 focus:ring-black/5 placeholder:text-black/30"
              rows={4}
            />
          </div>
        </div>
      )}

      {currentStep === 'Инвентарь' && (
        <div className="space-y-6">
          {loadingProducts ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-24 rounded-3xl bg-white border border-gray-100 shadow-sm" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center text-gray-500">Нет товаров для проверки</div>
          ) : (
            Object.entries(groupedProducts).map(([line, items]) => (
              <div key={line} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                <div className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-4">
                  {line}
                </div>
                <div className="space-y-2">
                  {items.map((product) => {
                    const selected = Boolean(inventory[product.id]);
                    return (
                      <button
                        key={product.id}
                        onClick={() =>
                          setInventory((prev) => ({
                            ...prev,
                            [product.id]: !prev[product.id],
                          }))
                        }
                        className={`w-full flex items-center justify-between rounded-2xl border px-4 py-3 transition-all ${
                          selected
                            ? 'border-black bg-black text-white'
                            : 'border-gray-100 bg-[#F5F5F7] text-gray-900'
                        }`}
                      >
                        <span className="text-sm font-medium">{product.flavor}</span>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          selected ? 'bg-white/10' : 'bg-gray-200'
                        }`}>
                          <Check size={14} strokeWidth={2} className={selected ? 'text-white' : 'text-gray-400'} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {currentStep === 'Отчет' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-500">Комментарий</div>
            <textarea
              className="w-full bg-[#F5F5F7] rounded-2xl p-4 text-[15px] font-medium outline-none mt-4 border border-gray-100 focus:bg-white"
              placeholder="Что важно отметить после визита?"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
            <div className="text-xs font-semibold uppercase tracking-widest text-gray-500">Итог</div>
            <div className="mt-3 text-sm text-gray-600 space-y-2">
              <div>Точка: {selectedFacility?.name || '—'}</div>
              <div>Активность: {visitType ? VISIT_TYPE_LABEL[visitType] : '—'}</div>
              {visitType === 'transit' && (
                <>
                  <div>Чек-ин: {checkInConfirmed ? 'Подтвержден' : 'Не подтвержден'}</div>
                  <div>Позиций отмечено: {Object.values(inventory).filter(Boolean).length}</div>
                </>
              )}
              {visitType === 'checkup' && (
                <>
                  <div>Смена: {shiftStartTime || '—'} – {shiftEndTime || '—'}</div>
                  <div>Чашек: {shiftCups ? `${shiftCups}` : '—'}</div>
                </>
              )}
              {visitType === 'tasting' && (
                <div>Участников: {tastingGuestsCount}</div>
              )}
              {visitType === 'b2b' && (
                <div>Контактов: {b2bContactsCount}</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        {step > 0 && (
          <button
            onClick={() => setStep((prev) => prev - 1)}
            className="flex-1 py-3 rounded-3xl border border-gray-200 text-gray-700 font-semibold flex items-center justify-center gap-2"
          >
            <ChevronLeft size={16} strokeWidth={2} />
            Назад
          </button>
        )}
        <button
          onClick={() => {
            if (isLastStep) {
              handleSubmit();
            } else {
              setStep((prev) => prev + 1);
            }
          }}
          disabled={!canProceed || submitting}
          className="flex-[2] py-3 rounded-3xl bg-black text-white font-semibold disabled:opacity-60"
        >
          {isLastStep ? (submitting ? 'Отправка...' : 'Отправить') : 'Далее'}
        </button>
      </div>
    </div>
  );
};

export default VisitWizard;
