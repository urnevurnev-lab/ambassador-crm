import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  GraduationCap,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { StandardCard } from '../components/ui/StandardCard';
import { motion } from 'framer-motion';
import apiClient from '../api/apiClient';

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
          placeholder="Найти скрипт..."
          className="w-full bg-white h-14 pl-12 pr-4 rounded-[24px] border border-gray-100 text-base outline-none shadow-sm"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* КАТЕГОРИИ */}
      {!searchTerm && (
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <StandardCard
              title="Академия"
              subtitle="Курсы"
              color="purple"
              className="min-h-[100px]"
              illustration={<GraduationCap size={80} className="text-white opacity-10 absolute -right-2 -bottom-2" />}
            />
          </div>
          <StandardCard title="Скрипты" subtitle="Продажи" color="teal" className="h-28" />
          <StandardCard title="Видео" subtitle="Ворки" color="coral" className="h-28" />
        </div>
      )}

      {/* ПУБЛИКАЦИИ */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredPosts.map(p => (
          <StandardCard
            key={p.id}
            title={p.title}
            subtitle={p.category}
            color="white"
            floating={false}
            icon={p.category === 'FAQ' ? HelpCircle : BookOpen}
            action={<ChevronRight size={18} className="text-gray-300" />}
          />
        ))}
      </div>
    </div>
  );
};

export default KnowledgeBasePage;