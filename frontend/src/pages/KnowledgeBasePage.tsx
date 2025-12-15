import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { Search, ChevronRight, FileText, TrendingUp, ShoppingBag, Leaf, Clock, Download, ArrowLeft, BookOpen, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { SampleOrderWizard } from '../components/SampleOrderWizard';
import { FlavorRatingView } from '../components/FlavorRatingView';
import ReactMarkdown from 'react-markdown';

interface Post {
    id: number;
    title: string;
    content: string;
    readTime?: string;
    category: string;
    imageUrl?: string;
}

type ViewState = 'menu' | 'rating' | 'learning' | 'article';

const KnowledgeBasePage: React.FC = () => {
    const [view, setView] = useState<ViewState>('menu');
    const [isSampleWizardOpen, setSampleWizardOpen] = useState(false);

    // Dynamic Posts State
    const [posts, setPosts] = useState<Post[]>([]);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');

    // Fetch posts when entering "learning" view
    useEffect(() => {
        if (view === 'learning') {
            const fetchPosts = async () => {
                setLoading(true);
                try {
                    const res = await apiClient.get('/api/posts?category=KNOWLEDGE');
                    setPosts(res.data);

                    // Optional: If only one post (e.g. Brand Book), open it immediately
                    // if (res.data.length === 1) {
                    //     setSelectedPost(res.data[0]);
                    //     setView('article');
                    // }
                } catch (e) {
                    console.error("Failed to fetch posts", e);
                } finally {
                    setLoading(false);
                }
            };
            fetchPosts();
        }
    }, [view]);

    const filteredPosts = posts.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

    const openArticle = (post: Post) => {
        setSelectedPost(post);
        setView('article');
    };

    // --- RENDERERS ---

    const renderMenu = () => (
        <div className="space-y-4 pt-[20px]">
            {/* 1. ABC Analysis */}
            <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => setView('rating')}
                className="relative overflow-hidden rounded-[30px] p-6 h-[160px] shadow-lg cursor-pointer group"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-600 z-0" />
                <div className="absolute top-[-20px] right-[-20px] opacity-20 rotate-12 group-hover:rotate-0 transition duration-500">
                    <TrendingUp size={140} className="text-white" />
                </div>

                <div className="relative z-10 flex flex-col justify-between h-full text-white">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold">ABC Анализ</h3>
                        <p className="text-white/80 text-sm">Рейтинг популярности вкусов</p>
                    </div>
                </div>
            </motion.div>

            {/* 2. Learning Base (Dynamic) */}
            <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => setView('learning')}
                className="relative overflow-hidden rounded-[30px] p-6 h-[160px] shadow-lg cursor-pointer group"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 z-0" />
                <div className="absolute bottom-[-20px] right-[-20px] opacity-20 rotate-[-12deg] group-hover:rotate-0 transition duration-500">
                    <BookOpen size={140} className="text-white" />
                </div>

                <div className="relative z-10 flex flex-col justify-between h-full text-white">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold">База знаний</h3>
                        <p className="text-white/80 text-sm">Материалы и скрипты</p>
                    </div>
                </div>
            </motion.div>

            {/* 3. Sample Order */}
            <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => setSampleWizardOpen(true)}
                className="relative overflow-hidden rounded-[30px] p-6 h-[160px] shadow-lg cursor-pointer group"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-[#1C1C1E] to-[#3a3a3c] z-0" />
                <div className="absolute bottom-[-10px] right-[-10px] opacity-10 rotate-[-12deg] group-hover:rotate-0 transition duration-500">
                    <Leaf size={140} className="text-white" />
                </div>

                <div className="relative z-10 flex flex-col justify-between h-full text-white">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                        <ShoppingBag size={24} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold">Заказ пробников</h3>
                        <p className="text-white/60 text-sm">Оформить заявку</p>
                    </div>
                </div>
            </motion.div>

            {/* 4. Coming Soon */}
            <div className="bg-gray-50 rounded-[30px] p-6 border border-gray-100 flex items-center gap-4 opacity-60">
                <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center text-gray-400">
                    <Clock size={20} />
                </div>
                <div className="text-gray-400 font-medium">
                    Скоро появятся новые разделы...
                </div>
            </div>

            <div className="text-center pt-8 opacity-40">
                <a href={`${apiClient.defaults.baseURL}/samples/export`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-medium text-gray-400">
                    <Download size={12} /> Скачать отчет (Excel)
                </a>
            </div>
        </div>
    );

    const renderLearning = () => (
        <div className="pt-[20px]">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => setView('menu')}
                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-[#1C1C1E] active:scale-95 transition"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold text-[#1C1C1E]">База обучения</h1>
            </div>

            {/* Search */}
            <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-2 mb-6 sticky top-[80px] z-20">
                <Search size={20} className="text-gray-400" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Поиск..."
                    className="flex-1 text-sm outline-none placeholder:text-gray-400"
                />
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center text-gray-400 py-10">Загрузка...</div>
            ) : filteredPosts.length === 0 ? (
                <div className="text-center text-gray-400 py-10 flex flex-col items-center gap-2">
                    <AlertCircle />
                    Нет статей
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredPosts.map((post, index) => (
                        <motion.div
                            key={post.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => openArticle(post)}
                        >
                            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm active:scale-98 transition flex items-center justify-between cursor-pointer">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-[#1C1C1E] line-clamp-2 leading-snug">{post.title}</div>
                                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                                            <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-500">{post.category}</span>
                                            <span>• {post.readTime || '5 мин'}</span>
                                        </div>
                                    </div>
                                </div>
                                <ChevronRight size={20} className="text-gray-300" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderArticle = () => {
        if (!selectedPost) return null;
        return (
            <div className="pt-[20px]">
                {/* Article Header */}
                <div className="flex items-center gap-4 mb-6 sticky top-[0px] z-20 bg-[#F2F1F6] py-2">
                    <button
                        onClick={() => setView('learning')}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-[#1C1C1E] active:scale-95 transition shrink-0"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex-1 overflow-hidden">
                        <h2 className="font-bold text-[#1C1C1E] truncate">{selectedPost.title}</h2>
                        <div className="text-xs text-gray-400 flex items-center gap-2">
                            <span>{selectedPost.readTime || 'Чтение'}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[32px] shadow-sm mb-10 prose prose-sm max-w-none">
                    <ReactMarkdown>{selectedPost.content}</ReactMarkdown>
                </div>
            </div>
        );
    };

    return (
        <Layout>
            {/* Headers are handled inside views for better control, or we can have a main one */}
            {view === 'menu' && <PageHeader title="База Знаний" />}

            <div className={`px-4 pb-32 ${view === 'menu' ? 'pt-[calc(env(safe-area-inset-top)+60px)]' : 'pt-[calc(env(safe-area-inset-top))]'}`}>
                <AnimatePresence mode="wait">
                    {view === 'menu' && (
                        <motion.div key="menu" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            {renderMenu()}
                        </motion.div>
                    )}
                    {view === 'rating' && (
                        <motion.div key="rating" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                            <FlavorRatingView onBack={() => setView('menu')} />
                        </motion.div>
                    )}
                    {view === 'learning' && (
                        <motion.div key="learning" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                            {renderLearning()}
                        </motion.div>
                    )}
                    {view === 'article' && (
                        <motion.div key="article" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                            {renderArticle()}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <SampleOrderWizard
                isOpen={isSampleWizardOpen}
                onClose={() => setSampleWizardOpen(false)}
            />
        </Layout>
    );
};

export default KnowledgeBasePage;
