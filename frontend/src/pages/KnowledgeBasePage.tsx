import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { StandardCard } from '../components/ui/StandardCard';
import { Book, ChevronRight, FileText, Search, BarChart3, Gift, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Импорты наших новых блоков
import SampleOrderWizard from '../components/SampleOrderWizard';
import { FlavorRatingView } from '../components/FlavorRatingView';
import { BirthdayCalendar } from '../components/BirthdayCalendar';

// Типы для статей (оставляем старое)
interface Article {
    id: number;
    title: string;
    category: string;
}

const KnowledgeBasePage: React.FC = () => {
    // Состояние навигации внутри страницы
    const [view, setView] = useState<'menu' | 'abc' | 'birthdays'>('menu');
    const [isSampleWizardOpen, setSampleWizardOpen] = useState(false);
    
    // Поиск по статьям
    const [searchTerm, setSearchTerm] = useState('');

    const articles: Article[] = [
        { id: 1, category: 'Скрипты', title: 'Приветствие и презентация' },
        { id: 2, category: 'Продукты', title: 'Описание линейки Bliss' },
        { id: 3, category: 'Регламент', title: 'Правила внешнего вида' },
    ];

    const filteredArticles = articles.filter(a => a.title.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <Layout>
            <AnimatePresence mode="wait">
                
                {/* 1. ГЛАВНОЕ МЕНЮ БАЗЫ */}
                {view === 'menu' && (
                    <motion.div 
                        key="menu"
                        initial={{ opacity: 0, x: -20 }} 
                        animate={{ opacity: 1, x: 0 }} 
                        className="pt-2 px-4 pb-32 space-y-4"
                    >
                        <PageHeader title="База знаний" />

                        {/* --- НОВЫЕ БЛОКИ (ТОП) --- */}
                        <div className="grid grid-cols-2 gap-3">
                            <button 
                                onClick={() => setView('abc')}
                                className="col-span-2 bg-gradient-to-r from-gray-900 to-gray-800 text-white p-5 rounded-[24px] shadow-lg flex items-center justify-between active:scale-98 transition-transform"
                            >
                                <div className="flex flex-col items-start">
                                    <span className="text-2xl mb-1">📊</span>
                                    <span className="font-bold text-lg">ABC Анализ</span>
                                    <span className="text-gray-400 text-xs mt-1">Топ вкусов HoReCa</span>
                                </div>
                                <ChevronRight className="text-gray-500" />
                            </button>

                            <button 
                                onClick={() => setSampleWizardOpen(true)}
                                className="bg-white p-4 rounded-[24px] border border-gray-200 shadow-sm flex flex-col justify-between h-32 active:scale-95 transition-transform"
                            >
                                <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center">
                                    <Package size={20} />
                                </div>
                                <div className="text-left">
                                    <span className="font-bold text-gray-900 block leading-tight">Заказ пробников</span>
                                    <span className="text-[10px] text-gray-400">Для себя</span>
                                </div>
                            </button>

                            <button 
                                onClick={() => setView('birthdays')}
                                className="bg-white p-4 rounded-[24px] border border-gray-200 shadow-sm flex flex-col justify-between h-32 active:scale-95 transition-transform"
                            >
                                <div className="w-10 h-10 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center">
                                    <Gift size={20} />
                                </div>
                                <div className="text-left">
                                    <span className="font-bold text-gray-900 block leading-tight">Дни рождения</span>
                                    <span className="text-[10px] text-gray-400">Календарь</span>
                                </div>
                            </button>
                        </div>

                        {/* --- ПОИСК И СТАТЬИ --- */}
                        <div className="mt-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 ml-1">Материалы</h3>
                            <div className="relative mb-4">
                                <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="Поиск инструкций..." 
                                    className="w-full bg-white rounded-2xl pl-11 pr-4 py-3 shadow-sm border border-gray-100 text-sm outline-none focus:ring-2 focus:ring-black/5"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                {filteredArticles.map(article => (
                                    <StandardCard 
                                        key={article.id} 
                                        title={article.title} 
                                        subtitle={article.category}
                                        icon={FileText}
                                        showArrow={true}
                                        onClick={() => alert("Открыть статью (в разработке)")}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 2. ПОД-ЭКРАНЫ */}
                {view === 'abc' && (
                    <motion.div key="abc" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <FlavorRatingView onBack={() => setView('menu')} />
                    </motion.div>
                )}

                {view === 'birthdays' && (
                    <motion.div key="birthdays" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <BirthdayCalendar onBack={() => setView('menu')} />
                    </motion.div>
                )}

            </AnimatePresence>

            {/* МОДАЛКА ЗАКАЗА ПРОБНИКОВ */}
            <SampleOrderWizard isOpen={isSampleWizardOpen} onClose={() => setSampleWizardOpen(false)} />
        </Layout>
    );
};

export default KnowledgeBasePage;