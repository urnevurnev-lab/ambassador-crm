import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  FileText,
  PlayCircle,
  GraduationCap,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { StandardCard } from '../components/ui/StandardCard';
import { motion } from 'framer-motion';
import apiClient from '../api/apiClient';
import { Layout } from '../components/Layout';

interface Post {
  id: number;
  title: string;
  content: string;
  category: string;
}

const KnowledgeBasePage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/api/posts')
      .then(res => setPosts(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredPosts = posts.filter(p =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <Layout>
      <div className="space-y-6 pb-32 pt-4 px-4">
        {/* ЗАГОЛОВОК */}
        <div className="px-1">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Центр обучения</p>
            <h1 className="text-3xl font-black text-gray-900 leading-none">База Знаний</h1>
          </motion.div>
        </div>

        {/* ПОИСК */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="Найти скрипт или инструкцию..."
            className="w-full bg-white h-14 pl-12 pr-4 rounded-[24px] border border-gray-100 text-base focus:ring-4 focus:ring-blue-500/5 outline-none transition-all placeholder:text-gray-400 font-medium shadow-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* ГЛАВНЫЕ РАЗДЕЛЫ (Bento) */}
        {!searchTerm && (
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <StandardCard
                title="Академия"
                subtitle="Интерактивные курсы и тесты"
                color="purple"
                className="min-h-[120px]"
                illustration={<GraduationCap size={100} className="text-white opacity-10 absolute -right-4 -bottom-4" />}
                action={<ChevronRight size={20} className="text-white opacity-40" />}
              />
            </div>
            <StandardCard
              title="Скрипты"
              subtitle="Продажи"
              color="teal"
              className="h-32"
              illustration={<FileText size={80} className="text-white opacity-10 absolute -right-2 -bottom-2" />}
            />
            <StandardCard
              title="Видео"
              subtitle="Ворки"
              color="coral"
              className="h-32"
              illustration={<PlayCircle size={80} className="text-white opacity-10 absolute -right-2 -bottom-2" />}
            />
          </div>
        )}

        {/* СПИСОК СТАТЕЙ */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1 mt-6">
            {searchTerm ? `Результаты поиска (${filteredPosts.length})` : "Все статьи"}
          </h3>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-6 h-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map(p => (
              <StandardCard
                key={p.id}
                title={p.title}
                subtitle={p.category}
                color="white"
                floating={false}
                icon={p.category === 'FAQ' ? HelpCircle : BookOpen}
                action={<ChevronRight size={18} className="text-gray-300" />}
              />
            ))
          ) : (
            <div className="text-center py-12 text-gray-400 font-medium border-2 border-dashed border-gray-100 rounded-[30px]">
              Ничего не найдено
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default KnowledgeBasePage;