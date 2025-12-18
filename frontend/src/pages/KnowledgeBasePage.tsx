import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { Book, ChevronRight, FileText, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- ИСПРАВЛЕННЫЙ ИМПОРТ ---
// Убираем фигурные скобки, так как в SampleOrderWizard теперь 'export default'
import SampleOrderWizard from '../components/SampleOrderWizard'; 

interface Article {
    id: number;
    title: string;
    category: string;
    content?: string;
}

const KnowledgeBasePage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

    // Mock Data
    const articles: Article[] = [
        { id: 1, category: 'Скрипты', title: 'Приветствие и презентация' },
        { id: 2, category: 'Скрипты', title: 'Работа с возражениями' },
        { id: 3, category: 'Продукты', title: 'Описание линейки Bliss' },
        { id: 4, category: 'Продукты', title: 'Описание линейки White Line' },
        { id: 5, category: 'Регламент', title: 'Правила внешнего вида' },
        { id: 6, category: 'Регламент', title: 'Отчетность в CRM' },
    ];

    const filtered = articles.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <Layout>
            <div className="pt-4 px-4 pb-32 space-y-4">
                <PageHeader title="База Знаний" back />

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Поиск..." 
                        className="w-full bg-white rounded-2xl pl-12 pr-4 py-3 shadow-sm border border-gray-100 text-sm outline-none focus:ring-2 ring-blue-100"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Categories / List */}
                <div className="space-y-3">
                    {filtered.map(article => (
                        <motion.div
                            key={article.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedArticle(article)}
                            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#1C1C1E] text-sm">{article.title}</h3>
                                    <p className="text-xs text-gray-400">{article.category}</p>
                                </div>
                            </div>
                            <ChevronRight size={18} className="text-gray-300" />
                        </motion.div>
                    ))}
                </div>

                {/* Article Modal (Заглушка) */}
                <AnimatePresence>
                    {selectedArticle && (
                        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none">
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/40 pointer-events-auto"
                                onClick={() => setSelectedArticle(null)}
                            />
                            <motion.div 
                                initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                                className="bg-white w-full sm:w-[90%] sm:rounded-2xl rounded-t-[30px] p-6 h-[80vh] relative z-10 pointer-events-auto flex flex-col"
                            >
                                <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 shrink-0" />
                                <h2 className="text-2xl font-bold mb-2">{selectedArticle.title}</h2>
                                <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-md self-start mb-6">{selectedArticle.category}</span>
                                <div className="flex-1 overflow-y-auto text-gray-600 leading-relaxed">
                                    <p>Здесь будет полный текст статьи...</p>
                                    <p className="mt-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                                </div>
                                <button onClick={() => setSelectedArticle(null)} className="mt-4 w-full bg-gray-100 py-3 rounded-xl font-bold text-gray-600">Закрыть</button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </Layout>
    );
};

export default KnowledgeBasePage;