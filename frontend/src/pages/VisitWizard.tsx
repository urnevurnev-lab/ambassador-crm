import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { ChevronRight, Check, X, User, MessageSquare, Clipboard } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WebApp from '@twa-dev/sdk';

interface Product { id: number; flavor: string; line: string; category: string; }

const VisitWizard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const facilityId = searchParams.get('facilityId');
  const activityCode = searchParams.get('activity');

  const [loading, setLoading] = useState(true);
  const [visitId, setVisitId] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);

  // Step 1: Shelf Audit
  const [auditSelection, setAuditSelection] = useState<Set<number>>(new Set());

  // Step 2: Activity
  const [comment, setComment] = useState('');
  const [tastedSelection, setTastedSelection] = useState<Set<number>>(new Set());

  // Step 3: Contact
  const [contactName, setContactName] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Initial Load & Create Visit
  useEffect(() => {
    const init = async () => {
      try {
        // 1. Fetch Products
        const pRes = await apiClient.get('/api/products');
        setProducts(pRes.data);

        // 2. Create Visit Immediately
        const userId = WebApp.initDataUnsafe?.user?.id || 1; // Fallback for dev
        const vRes = await apiClient.post('/api/visits', {
          userId,
          facilityId: Number(facilityId),
          type: activityCode || 'UNKNOWN',
          userLat: parseFloat(sessionStorage.getItem('last_geo_lat') || '0'),
          userLng: parseFloat(sessionStorage.getItem('last_geo_lng') || '0'),
          data: {} // Empty initial data
        });
        setVisitId(vRes.data.id);
      } catch (e) {
        console.error(e);
        alert('Ошибка инициализации визита');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Helper to group by line
  const productsByLine = products.reduce((acc, p) => {
    if (!acc[p.line]) acc[p.line] = [];
    acc[p.line].push(p);
    return acc;
  }, {} as Record<string, Product[]>);

  const handleSaveAudit = async () => {
    if (!visitId) return;
    setLoading(true);
    try {
      await apiClient.patch(`/api/visits/${visitId}`, {
        productsAvailableIds: Array.from(auditSelection)
      });
      setStep(2);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSaveActivity = async () => {
    if (!visitId) return;
    setLoading(true);
    try {
      await apiClient.patch(`/api/visits/${visitId}`, {
        comment,
        productsTastedIds: Array.from(tastedSelection)
      });
      setStep(3);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleFinish = async () => {
    if (!visitId) return;
    setLoading(true);
    try {
      await apiClient.patch(`/api/visits/${visitId}`, {
        contactName,
        status: 'COMPLETED',
        endedAt: new Date()
      });
      navigate(-1); // Back to facility
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const toggleAudit = (id: number) => {
    const newSet = new Set(auditSelection);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setAuditSelection(newSet);
  };

  const toggleTasted = (id: number) => {
    const newSet = new Set(tastedSelection);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setTastedSelection(newSet);
  };

  if (loading && !visitId) return <div className="h-screen flex items-center justify-center text-white">Создание...</div>;

  return (
    <div className="min-h-screen bg-[#1C1C1E] text-white pb-safe">
      {/* Header */}
      <div className="pt-safe px-4 py-4 flex items-center gap-4 border-b border-white/10 bg-[#1C1C1E]/80 backdrop-blur-md sticky top-0 z-50">
        <button onClick={() => navigate(-1)}><X /></button>
        <div>
          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Шаг {step} из 3</div>
          <div className="font-bold text-lg">
            {step === 1 ? 'Аудит полки' : step === 2 ? 'Активность' : 'Завершение'}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-8">
        {step === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <p className="text-gray-400 text-sm mb-6">
              Отметьте вкусы, которые <span className="text-white font-bold">есть в наличии</span> (открытые банки в работе).
            </p>
            <div className="space-y-6">
              {Object.entries(productsByLine).map(([line, items]) => (
                <div key={line}>
                  <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 ml-1">{line}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {items.map(p => {
                      const isSelected = auditSelection.has(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => toggleAudit(p.id)}
                          className={`p-3 rounded-xl border transition active:scale-95 cursor-pointer flex items-center justify-between ${isSelected ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-white/5 border-white/10 text-gray-300'}`}
                        >
                          <span className="text-sm font-bold truncate pr-2">{p.flavor}</span>
                          {isSelected && <Check size={14} />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleSaveAudit} className="w-full bg-[#007AFF] py-4 rounded-2xl font-bold mt-8 shadow-lg shadow-blue-500/20 active:scale-95 transition">
              Далее
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            {/* Comment */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 mb-6">
              <div className="flex items-center gap-2 mb-2 text-gray-400">
                <MessageSquare size={16} /> <span className="text-xs font-bold uppercase">Комментарий</span>
              </div>
              <textarea
                value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Что было сделано..."
                className="w-full bg-transparent outline-none text-white min-h-[80px]"
              />
            </div>

            {/* Tasted Selection */}
            <div>
              <div className="flex items-center gap-2 mb-4 text-gray-400">
                <Clipboard size={16} /> <span className="text-xs font-bold uppercase">Что курили?</span>
              </div>
              <div className="space-y-6">
                {Object.entries(productsByLine).map(([line, items]) => (
                  <div key={line}>
                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 ml-1">{line}</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {items.map(p => {
                        const isSelected = tastedSelection.has(p.id);
                        return (
                          <div
                            key={p.id}
                            onClick={() => toggleTasted(p.id)}
                            className={`p-3 rounded-xl border transition active:scale-95 cursor-pointer flex items-center justify-between ${isSelected ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-white/5 border-white/10 text-gray-300'}`}
                          >
                            <span className="text-sm font-bold truncate pr-2">{p.flavor}</span>
                            {isSelected && <Check size={14} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleSaveActivity} className="w-full bg-[#007AFF] py-4 rounded-2xl font-bold mt-8 shadow-lg shadow-blue-500/20 active:scale-95 transition">
              Далее
            </button>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-gray-400">
                <User size={20} />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 uppercase font-bold">Контактное лицо</label>
                <input
                  value={contactName} onChange={e => setContactName(e.target.value)}
                  placeholder="Имя / Должность"
                  className="w-full bg-transparent text-lg font-bold outline-none placeholder:text-gray-600"
                />
              </div>
            </div>

            <button onClick={handleFinish} className="w-full bg-green-500 text-white py-4 rounded-2xl font-bold mt-8 shadow-lg shadow-green-500/20 active:scale-95 transition flex items-center justify-center gap-2">
              <Check /> Завершить визит
            </button>
          </motion.div>
        )}

      </div>
    </div>
  );
};

export default VisitWizard;
