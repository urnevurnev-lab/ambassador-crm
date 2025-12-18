import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import SplashPage from './pages/SplashPage';
import Dashboard from './pages/Dashboard';

// Типизация, чтобы TypeScript не ругался
declare global {
  interface Window {
    Telegram: any;
  }
}

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Безопасная инициализация
    const initApp = async () => {
      try {
        // 1. Пробуем инициализировать Telegram (безопасно)
        if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          tg.ready();  // Сообщаем, что приложение готово
          tg.expand(); // Раскрываем на весь экран
          
          // Отключаем вертикальные свайпы (чтобы не закрывалось случайно)
          if (tg.disableVerticalSwipes) {
            tg.disableVerticalSwipes(); 
          }
        }
        
        // 2. Имитация загрузки данных / Auth
        await new Promise(resolve => setTimeout(resolve, 2500));
        
      } catch (e) {
        console.error("Ошибка инициализации:", e);
      } finally {
        // 3. ЭТО ГЛАВНОЕ: Убираем лоадер в любом случае
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  if (isLoading) {
    return <SplashPage />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          {/* Если есть другие страницы, добавь их здесь */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
