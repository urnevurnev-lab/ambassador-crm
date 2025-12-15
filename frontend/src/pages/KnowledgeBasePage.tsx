import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { Search, ChevronRight, FileText, TrendingUp, ShoppingBag, FlaskConical, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { SampleOrderWizard } from '../components/SampleOrderWizard';

interface Article {
    id: number;
    title: string;
    category: string;
    readTime: string;
}

interface RatingItem {
    id: number;
    flavor: string;
    score: number;
}
type RatingData = Record<string, RatingItem[]>;

const MOCK_ARTICLES: Article[] = [
    { id: 1, title: 'Стандарты выкладки продукции', category: 'Мерчандайзинг', readTime: '5 мин' },
    { id: 2, title: 'Скрипты общения с барменами', category: 'Продажи', readTime: '3 мин' },
    { id: 3, title: 'Презентация новинок 2025', category: 'Продукт', readTime: '10 мин' },
];

const RatingWidget = () => {
    const [data, setData] = useState<RatingData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/api/samples/analytics')
            .then(res => setData(res.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="h-40 bg-gray-50 rounded-2xl animate-pulse" />;
    if (!data) return null;

    return (
        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                    <TrendingUp size={16} />
                </div>
                <h3 className="font-bold text-lg text-[#1C1C1E]">ABC Рейтинг вкусов</h3>
            </div>

            <div className="space-y-6">
                {Object.entries(data).map(([line, items]) => (
                    <div key={line}>
                        <div className="text-xs font-bold text-gray-400 uppercase mb-2 tracking-wider">{line}</div>
                        <div className="space-y-3">
                            {items.slice(0, 3).map((item, idx) => (
                                <div key={item.id} className="relative">
                                    <div className="flex justify-between text-sm mb-1 z-10 relative">
                                        <span className="font-medium text-[#1C1C1E]">{idx + 1}. {item.flavor}</span>
                                        <span className="font-bold text-gray-900">{item.score}</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, (item.score / (items[0].score || 1)) * 100)}%` }}
                                            className="h-full bg-gradient-to-r from-orange-400 to-red-400 rounded-full"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const KnowledgeBasePage: React.FC = () => {
    const [search, setSearch] = useState('');
    const [articles] = useState<Article[]>(MOCK_ARTICLES);
    const [isSampleWizardOpen, setSampleWizardOpen] = useState(false);

    const filteredArticles = articles.filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Layout>
            <PageHeader title="База Знаний" />

            <div className="pt-[calc(env(safe-area-inset-top)+60px)] px-4 pb-32 space-y-6">

                {/* Rating Widget */}
                <RatingWidget />

                {/* Sample Order CTA */}
                <motion.div
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSampleWizardOpen(true)}
                    className="relative overflow-hidden rounded-[24px] p-6 text-white shadow-xl cursor-pointer group"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1C1C1E] to-[#2C2C2E] z-0" />
                    <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 group-hover:rotate-0 transition duration-500">
                        <FlaskConical size={120} />
                    </div>

                    <div className="relative z-10 flex flex-col items-start gap-4">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                            <ShoppingBag size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-1">Заказ пробников</h3>
                            <p className="text-white/60 text-sm max-w-[200px]">Оформите заявку на пробники для ваших заведений</p>
                        </div>
                        <button className="bg-white text-black px-5 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition">
                            Оформить заказ
                        </button>
                    </div>
                </motion.div>

                {/* Search */}
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2 sticky top-[60px] z-20">
                    <Search size={20} className="text-gray-400" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Поиск материалов..."
                        className="flex-1 text-sm outline-none placeholder:text-gray-400"
                    />
                </div>

                {/* Articles */}
                <div className="space-y-3">
                    {filteredArticles.map((article, index) => (
                        <motion.div
                            key={article.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Link to={`#`} className="block">
                                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm active:scale-98 transition flex items-center justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-[#1C1C1E] line-clamp-2 leading-snug">{article.title}</div>
                                            <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-500">{article.category}</span>
                                                <span>• {article.readTime}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-gray-300" />
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                <div className="text-center pt-8 opacity-40">
                    <a href={`${apiClient.defaults.baseURL}/samples/export`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-medium">
                        <Download size={12} /> Скачать Excel (Производство)
                    </a>
                </div>
            </div>

            <SampleOrderWizard
                isOpen={isSampleWizardOpen}
                onClose={() => setSampleWizardOpen(false)}
            />
        </Layout>
    );
};

export default KnowledgeBasePage;
