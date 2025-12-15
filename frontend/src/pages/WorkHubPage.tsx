import React from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { Store, ShoppingCart, MapPin, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const WorkHubPage: React.FC = () => {
    return (
        <Layout>
            <PageHeader title="Работа" />

            <div className="bg-[#F2F2F7] min-h-screen pt-[calc(env(safe-area-inset-top)+80px)] px-4 pb-32 space-y-4">

                {/* 1. База Заведений (Base of Facilities) */}
                <Link to="/facilities/list" className="block">
                    <motion.div
                        whileTap={{ scale: 0.98 }}
                        className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-200 relative overflow-hidden group h-[200px] flex flex-col justify-between"
                    >
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 p-6 opacity-5 text-[#1C1C1E] transition-opacity group-hover:opacity-10">
                            <Store size={120} />
                        </div>

                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-[#1C1C1E] rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform">
                                <Store size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-[#1C1C1E] leading-tight">
                                База<br />Заведений
                            </h2>
                            <p className="text-gray-400 text-sm mt-1 font-medium">
                                Визиты, проверки, история
                            </p>
                        </div>

                        <div className="flex justify-end">
                            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-[#1C1C1E]">
                                <ArrowRight size={20} />
                            </div>
                        </div>
                    </motion.div>
                </Link>

                {/* 2. Оформление Заказа (Quick Order) */}
                <Link to="/orders" className="block">
                    <motion.div
                        whileTap={{ scale: 0.98 }}
                        className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-200 relative overflow-hidden group h-[200px] flex flex-col justify-between"
                    >
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 p-6 opacity-5 text-blue-600 transition-opacity group-hover:opacity-10">
                            <ShoppingCart size={120} />
                        </div>

                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                                <ShoppingCart size={24} />
                            </div>
                            <h2 className="text-2xl font-bold text-[#1C1C1E] leading-tight">
                                Оформить<br />Заказ
                            </h2>
                            <p className="text-gray-400 text-sm mt-1 font-medium">
                                Быстрый заказ без визита
                            </p>
                        </div>

                        <div className="flex justify-end">
                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                                <ArrowRight size={20} />
                            </div>
                        </div>
                    </motion.div>
                </Link>

                <div className="text-center pt-8">
                    <p className="text-xs text-gray-300">Выберите режим работы</p>
                </div>

            </div>
        </Layout>
    );
};

export default WorkHubPage;
