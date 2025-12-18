import { useEffect, useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import SplashPage from './pages/SplashPage';
// Импортируй остальные страницы...
import MyOrdersPage from './pages/MyOrdersPage';
import MapPage from './pages/MapPage';
import ProfilePage from './pages/ProfilePage';

// 1. Строгая типизация окна (чтобы TS не ругался)
declare global {
  interface Window {
    Telegram: any;
  }
}

function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 2. Инициализация Telegram окружения
    const initTg = async () => {
      try {
        if (window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          
          tg.ready();       // Сообщаем, что приложение загрузилось
          tg.expand();      // Раскрываем на 100% высоты
          
          // Настраиваем цвета хедера под цвет приложения
          tg.setHeaderColor('#ffffff'); 
          tg.setBackgroundColor('#f9fafb'); // bg-gray-50
          
          // Блокируем вертикальный свайп, чтобы приложение не закрывалось случайно (актуально для последних версий)
          if (tg.disableVerticalSwipes) {
             tg.disableVerticalSwipes();
          }
        }
      } catch (error) {
        console.error('TG Init Error:', error);
      } finally {
        // Имитация загрузки ресурсов (уберем сплэш через 1.5 сек)
        setTimeout(() => setIsReady(true), 1500);
      }
    };

    initTg();
  }, []);

  if (!isReady) {
    return <SplashPage />;
  }

  // 3. Используем HashRouter вместо BrowserRouter
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<MyOrdersPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="profile" element={<ProfilePage />} />
          {/* Добавь остальные роуты сюда */}
          
          {/* Любой неизвестный путь кидает на главную */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;