import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { Search, BookOpen, ChevronRight, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface Article {
    id: number;
    title: string;
    category: string;
    readTime: string;
}

const MOCK_ARTICLES: Article[] = [
    { id: 1, title: 'Стандарты выкладки продукции', category: 'Мерчандайзинг', readTime: '5 мин' },
    { id: 2, title: 'Скрипты общения с барменами', category: 'Продажи', readTime: '3 мин' },
    { id: 3, title: 'Презентация новинок 2025', category: 'Продукт', readTime: '10 мин' },
    { id: 4, title: 'Как заполнять отчетность', category: 'Инструкции', readTime: '2 мин' },
];

const KnowledgeBasePage: React.FC = () => {
    const [search, setSearch] = useState('');
    const [articles] = useState<Article[]>(MOCK_ARTICLES);

    // In future: useEffect to fetch from /api/knowledge

    const filteredArticles = articles.filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Layout>
            <PageHeader title="База Знаний" />

            <div className="pt-[calc(env(safe-area-inset-top)+60px)] px-4 pb-32 space-y-4">

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

                {/* Content */}
                <div className="space-y-3">
                    {filteredArticles.map((article, index) => (
                        <motion.div
                            key={article.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Link to={`#`} className="block"> {/* In future: /knowledge/${article.id} */}
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

                {filteredArticles.length === 0 && (
                    <div className="text-center py-10 text-gray-400 flex flex-col items-center">
                        <BookOpen size={48} className="mb-3 opacity-20" />
                        <div>Ничего не найдено</div>
                    </div>
                )}

            </div>
        </Layout>
    );
};

export default KnowledgeBasePage;
