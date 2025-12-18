import React from 'react';
import { Layout } from '../components/Layout';
import { Book, Droplet, BarChart2, Package, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const WorkHubPage: React.FC = () => {
    const menuItems = [
        { 
            title: "База Знаний", 
            subtitle: "Скрипты и гайды", 
            icon: Book, 
            color: "bg-blue-50 text-blue-600",
            link: "/knowledge-base" 
        },
        { 
            title: "Заказ Сэмплов", 
            subtitle: "Пробники для точек", 
            icon: Droplet, 
            color: "bg-purple-50 text-purple-600",
            link: "/samples" 
        },
        { 
            title: "ABC Анализ", 
            subtitle: "Аналитика продаж", 
            icon: BarChart2, 
            color: "bg-orange-50 text-orange-600",
            link: "/analytics" 
        },
        // Если нужна Админка здесь (как запасной вход)
        // { title: "Админ Панель", subtitle: "Управление", icon: Package, color: "bg-gray-100 text-gray-700", link: "/admin" }
    ];

    return (
        <Layout>
            <div className="pt-6 px-4 pb-32 space-y-6">
                <h1 className="text-3xl font-bold text-[#1C1C1E]">Рабочий<br/>Хаб</h1>

                {/* Поиск (визуальный) */}
                <div className="relative">
                    <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Найти документ или инструмент..." 
                        className="w-full bg-white rounded-2xl pl-12 pr-4 py-3 shadow-sm border border-gray-100 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                </div>

                {/* Сетка меню */}
                <div className="grid grid-cols-2 gap-4">
                    {menuItems.map((item, idx) => (
                        <Link to={item.link} key={idx} className="contents">
                            <motion.div 
                                whileTap={{ scale: 0.98 }}
                                className="bg-white p-5 rounded-[24px] shadow-sm border border-gray-100 flex flex-col justify-between h-[160px] relative overflow-hidden"
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${item.color}`}>
                                    <item.icon size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-[#1C1C1E] leading-tight mb-1">{item.title}</h3>
                                    <p className="text-xs text-gray-400 font-medium">{item.subtitle}</p>
                                </div>
                                {/* Декор на фоне */}
                                <div className={`absolute -right-4 -bottom-4 opacity-5 ${item.color.replace('bg-', 'text-')}`}>
                                    <item.icon size={80} />
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </Layout>
    );
};

export default WorkHubPage;