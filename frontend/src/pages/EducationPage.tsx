import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, BookOpen, GraduationCap, X } from 'lucide-react';
import { Layout } from '../components/Layout';
import WebApp from '@twa-dev/sdk';

interface PageContent {
    title: string;
    subtitle: string;
    content: string;
    illustration: string;
    color: string;
}

const PAGES: PageContent[] = [
    {
        title: "Линейка Продуктов",
        subtitle: "Основы бренда",
        content: "Мы производим премиальные электронные испарители с уникальными вкусовыми профилями. Основные линейки: Classic, Exotic и Zero (без никотина). Каждый продукт проходит 5 стадий контроля качества.",
        illustration: "🧊",
        color: "bg-blue-500"
    },
    {
        title: "Мерчендайзинг",
        subtitle: "Золотая полка",
        content: "Правило 'Глаз-Рука': продукт должен находиться на уровне глаз покупателя. Всегда проверяй наличие тестеров и актуальность ценников. Маст-лист должен быть заполнен минимум на 80%.",
        illustration: "✨",
        color: "bg-purple-500"
    },
    {
        title: "Скрипты Продаж",
        subtitle: "Работа с возражениями",
        content: "Если клиент говорит 'Дорого', подчеркивай количество затяжек и премиальность компонентов. Если 'Нет места', предлагай компактные дисплеи или ротацию неходовых позиций.",
        illustration: "💬",
        color: "bg-teal-500"
    },
    {
        title: "Логистика",
        subtitle: "Сроки и расчеты",
        content: "Стандартный срок поставки — 48 часов. При заказе свыше 5 кг — доставка бесплатная. Всегда уточняй актуальные остатки у дистрибьютора перед закрытием сделки.",
        illustration: "🚚",
        color: "bg-orange-500"
    }
];

const EducationPage: React.FC = () => {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(0);

    const handleNext = () => {
        if (currentPage < PAGES.length - 1) {
            setCurrentPage(c => c + 1);
            WebApp.HapticFeedback.impactOccurred('medium');
        }
    };

    const handlePrev = () => {
        if (currentPage > 0) {
            setCurrentPage(c => c - 1);
            WebApp.HapticFeedback.impactOccurred('medium');
        }
    };

    return (
        <Layout>
            <div className="fixed inset-0 bg-[#0F172A] z-50 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-6 pt-12">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                            <BookOpen size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-white font-black text-lg">Education Hub</h1>
                            <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                                Страница {currentPage + 1} из {PAGES.length}
                            </p>
                        </div>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate('/')}
                        className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"
                    >
                        <X size={20} className="text-white" />
                    </motion.button>
                </div>

                {/* Book Container */}
                <div className="flex-1 relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentPage}
                            initial={{ opacity: 0, x: 100, rotateY: 45 }}
                            animate={{ opacity: 1, x: 0, rotateY: 0 }}
                            exit={{ opacity: 0, x: -100, rotateY: -45 }}
                            transition={{ type: "spring", damping: 20, stiffness: 100 }}
                            className="absolute inset-0 p-6"
                        >
                            <div className="h-full bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
                                {/* Visual Area */}
                                <div className={`${PAGES[currentPage].color} h-1/2 flex items-center justify-center relative overflow-hidden`}>
                                    <div className="absolute inset-0 opacity-20 flex flex-wrap gap-4 p-4">
                                        {Array.from({ length: 20 }).map((_, i) => (
                                            <GraduationCap key={i} size={40} className="text-white" />
                                        ))}
                                    </div>
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="text-[120px] z-10 drop-shadow-2xl"
                                    >
                                        {PAGES[currentPage].illustration}
                                    </motion.div>
                                </div>

                                {/* Content Area */}
                                <div className="flex-1 p-8 flex flex-col">
                                    <div>
                                        <span className="text-[11px] font-black text-blue-500 uppercase tracking-widest">
                                            {PAGES[currentPage].subtitle}
                                        </span>
                                        <h2 className="text-[32px] font-black text-slate-900 leading-tight mt-1">
                                            {PAGES[currentPage].title}
                                        </h2>
                                    </div>

                                    <p className="text-slate-500 font-bold text-lg mt-6 leading-relaxed flex-1">
                                        {PAGES[currentPage].content}
                                    </p>

                                    <div className="flex justify-between items-center pt-8">
                                        <button
                                            onClick={handlePrev}
                                            disabled={currentPage === 0}
                                            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${currentPage === 0 ? 'bg-slate-100 text-slate-300' : 'bg-slate-900 text-white active:scale-95'}`}
                                        >
                                            <ChevronLeft size={24} />
                                        </button>

                                        <div className="flex gap-1.5">
                                            {PAGES.map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1.5 rounded-full transition-all duration-300 ${i === currentPage ? 'w-8 bg-blue-500' : 'w-1.5 bg-slate-200'}`}
                                                />
                                            ))}
                                        </div>

                                        <button
                                            onClick={handleNext}
                                            disabled={currentPage === PAGES.length - 1}
                                            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${currentPage === PAGES.length - 1 ? 'bg-slate-100 text-slate-300' : 'bg-slate-900 text-white active:scale-95'}`}
                                        >
                                            <ChevronRight size={24} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer info */}
                <div className="p-8 text-center">
                    <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.3em]">
                        Swipe cards to read next chapter
                    </p>
                </div>
            </div>
        </Layout>
    );
};

export default EducationPage;
