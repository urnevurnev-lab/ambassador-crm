import WebApp from '@twa-dev/sdk';
import { Link } from 'react-router-dom';

export const ProfilePage = () => {
    const user = WebApp.initDataUnsafe.user;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 px-1">Мой профиль</h1>

            {/* User Card */}
            <div className="bg-white p-6 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden shadow-md">
                    {user?.photo_url ? (
                        <img src={user.photo_url} alt="Ava" className="w-full h-full object-cover" />
                    ) : (
                        <span>{user?.first_name?.charAt(0) || 'A'}</span>
                    )}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{user?.first_name || 'Амбассадор'}</h2>
                    <p className="text-gray-400 text-sm font-medium">@{user?.username || 'username'}</p>
                </div>
            </div>

            {/* Action Menu */}
            <div className="bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden">
                <button className="w-full p-5 border-b border-gray-100 flex justify-between items-center active:bg-gray-50 transition">
                    <span className="font-bold text-gray-700">💰 История выплат</span>
                    <span className="text-gray-300">›</span>
                </button>
                <button className="w-full p-5 border-b border-gray-100 flex justify-between items-center active:bg-gray-50 transition">
                    <span className="font-bold text-gray-700">📚 База знаний</span>
                    <span className="text-gray-300">›</span>
                </button>
                <Link to="/admin-login" className="w-full p-5 border-b border-gray-100 flex justify-between items-center active:bg-gray-50 transition">
                    <span className="font-bold text-blue-600">🔐 Админ-панель</span>
                    <span className="text-gray-300">›</span>
                </Link>
                <button className="w-full p-5 flex justify-between items-center text-red-500 active:bg-red-50 transition">
                    <span className="font-bold">Выйти</span>
                </button>
            </div>
        </div>
    );
};
