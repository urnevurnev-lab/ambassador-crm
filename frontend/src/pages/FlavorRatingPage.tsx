import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import apiClient from '../api/apiClient';
import toast from 'react-hot-toast';
import { Search, TrendingUp, X } from 'lucide-react';

type FlavorRatingResponse = Record<string, Array<{ id: number; flavor: string; score: number }>>;

const FlavorRatingPage: React.FC = () => {
  const navigate = useNavigate();
  const [rating, setRating] = useState<FlavorRatingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedLines, setExpandedLines] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get<FlavorRatingResponse>('/api/samples/analytics');
        if (isMounted) setRating(res.data || {});
      } catch (e) {
        toast.error('Не удалось загрузить рейтинг ароматов');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const maxScore = useMemo(() => {
    if (!rating) return 0;
    const all = Object.values(rating).flat();
    return all.reduce((max, item) => Math.max(max, item.score || 0), 0);
  }, [rating]);

  const filteredRating = useMemo(() => {
    if (!rating) return null;
    const term = search.trim().toLowerCase();
    if (!term) return rating;

    return Object.fromEntries(
      Object.entries(rating)
        .map(([line, items]) => [line, items.filter((item) => item.flavor.toLowerCase().includes(term))] as const)
        .filter(([, items]) => items.length > 0)
    );
  }, [rating, search]);

  const hasData = Boolean(filteredRating && Object.keys(filteredRating).length > 0);

  return (
    <div className="pb-24 space-y-6">
      <PageHeader
        title="Рейтинг ароматов"
        subtitle="Must-лист по факту встречаемости"
        rightAction={
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-black/5 border border-white/40 flex items-center justify-center text-black/60 active:scale-95 transition-transform"
            aria-label="Назад"
          >
            <X size={18} strokeWidth={2} />
          </button>
        }
      />

      <div className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.10)] p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-black/50">Аналитика</div>
            <div className="mt-2 text-[15px] font-semibold text-black">Частота на полке</div>
            <div className="mt-1 text-[12px] text-black/50">
              Цифра справа — сколько раз аромат встречался в отчетах по точкам.
            </div>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-black/5 border border-white/40 flex items-center justify-center text-black/60 shrink-0">
            <TrendingUp size={18} strokeWidth={1.5} />
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30">
            <Search size={18} strokeWidth={1.5} />
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по вкусу"
            className="w-full bg-white/70 backdrop-blur-xl h-[52px] rounded-3xl pl-11 pr-4 text-[15px] font-medium shadow-[0_10px_30px_rgba(0,0,0,0.08)] border border-white/30 outline-none placeholder:text-black/30"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-24 rounded-3xl bg-white/60 border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
            />
          ))}
        </div>
      ) : !hasData ? (
        <div className="rounded-3xl bg-white/45 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.08)] p-6 text-center">
          <p className="text-sm text-black/50">Пока нет данных для рейтинга</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(filteredRating!).map(([line, items]) => {
            const expanded = Boolean(expandedLines[line]);
            const visible = expanded ? items : items.slice(0, 10);
            const hasMore = items.length > 10;
            return (
              <div
                key={line}
                className="rounded-3xl bg-white/60 backdrop-blur-xl border border-white/30 shadow-[0_10px_30px_rgba(0,0,0,0.10)] p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[12px] font-semibold uppercase tracking-widest text-black/45">Линейка</div>
                    <div className="mt-1 text-[16px] font-semibold text-black truncate">{line}</div>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-2xl text-[11px] font-semibold bg-black/5 border border-white/40 text-black/60">
                    {items.length} вкусов
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {visible.map((item) => {
                    const pct = maxScore > 0 ? Math.max(6, Math.round((item.score / maxScore) * 100)) : 0;
                    return (
                      <div key={item.id} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 text-[13px] font-semibold text-black/80 truncate">{item.flavor}</div>
                          <div className="text-[12px] font-semibold text-black/50 shrink-0">{item.score}</div>
                        </div>
                        <div className="h-2 rounded-full bg-black/5 border border-white/40 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#007AFF] to-[#00C2FF]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {hasMore && (
                  <button
                    onClick={() =>
                      setExpandedLines((prev) => ({
                        ...prev,
                        [line]: !prev[line],
                      }))
                    }
                    className="mt-4 w-full rounded-3xl bg-black/5 border border-white/40 py-3 text-[13px] font-semibold text-black/60 active:scale-[0.99] transition-transform"
                  >
                    {expanded ? 'Свернуть' : 'Показать все'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FlavorRatingPage;

