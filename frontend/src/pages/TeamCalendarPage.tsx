import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Cake, ChevronLeft, User } from 'lucide-react';
import { Layout } from '../components/Layout';
import apiClient from '../api/apiClient';

interface UserData {
    id: number;
    fullName: string;
    birthDate: string | null;
    telegramId: string;
}

const TeamCalendarPage: React.FC = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/api/users')
            .then(res => setUsers(res.data || []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const getUpcomingBirthdays = () => {
        const today = new Date();
        return users
            .filter(u => u.birthDate)
            .map(u => {
                const bday = new Date(u.birthDate!);
                const currentYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());

                // If birthday already passed this year, look at next year
                if (currentYearBday < today) {
                    currentYearBday.setFullYear(today.getFullYear() + 1);
                }

                return { ...u, nextBirthday: currentYearBday };
            })
            .sort((a, b) => a.nextBirthday.getTime() - b.nextBirthday.getTime());
    };

    const upcoming = getUpcomingBirthdays();

    return (
        <Layout>
            <div className="px-5 pb-32 pt-12 space-y-8 bg-[#F8F9FB] min-h-screen">
                <div className="flex items-center gap-4">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate(-1)}
                        className="w-12 h-12 bg-white rounded-2xl border border-[#C6C6C8]/10 shadow-[0_8px_20px_rgba(0,0,0,0.05)] flex items-center justify-center text-gray-400"
                    >
                        <ChevronLeft size={24} />
                    </motion.button>
                    <h1 className="text-[28px] font-[900] text-[#000000] tracking-tight leading-none">
                        Календарь Команды
                    </h1>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                ) : upcoming.length > 0 ? (
                    <div className="space-y-6">
                        <div className="bg-blue-600 p-8 rounded-[40px] text-white shadow-[0_20px_40px_rgba(37,99,235,0.2)] relative overflow-hidden">
                            <Cake size={120} className="absolute -right-8 -bottom-8 opacity-20 rotate-12" />
                            <div className="relative z-10">
                                <h2 className="text-[32px] font-black leading-tight">Ближайший праздник</h2>
                                <p className="text-white/70 font-bold mt-2">Не забудь поздравить коллегу!</p>

                                <div className="mt-8 flex items-center gap-4 bg-white/10 p-4 rounded-3xl border border-white/10 backdrop-blur-sm">
                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl">
                                        {upcoming[0].fullName[0]}
                                    </div>
                                    <div>
                                        <p className="font-black text-lg">{upcoming[0].fullName}</p>
                                        <p className="text-white/60 text-sm font-bold uppercase tracking-widest">
                                            {upcoming[0].nextBirthday.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[12px] font-black text-[#8E8E93] uppercase tracking-widest px-1">Грядущие события</h3>
                            {upcoming.map((user, idx) => (
                                <motion.div
                                    key={user.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-white p-5 rounded-[28px] border border-[#C6C6C8]/10 shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex items-center gap-4"
                                >
                                    <div className="w-12 h-12 bg-[#F2F2F7]/50 rounded-2xl flex items-center justify-center text-blue-500">
                                        <User size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black text-[15px] text-gray-900">{user.fullName}</h4>
                                        <p className="text-[12px] text-gray-400 font-bold mt-1">
                                            {user.nextBirthday.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-500 shadow-sm">
                                        <Cake size={20} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-[40px] border border-[#C6C6C8]/10 shadow-sm px-8">
                        <div className="w-20 h-20 bg-[#F2F2F7] rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6">🎂</div>
                        <h3 className="text-gray-900 font-black text-xl">Календарь пуст</h3>
                        <p className="text-gray-400 font-bold mt-2">Похоже, никто еще не указал свой день рождения в профиле.</p>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default TeamCalendarPage;
