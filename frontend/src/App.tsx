import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import SplashPage from './pages/SplashPage';
import Dashboard from './pages/Dashboard';
// Импортируй остальные страницы по мере необходимости
// import AdminPage from './pages/AdminPage';

// Типизация для Telegram WebApp (чтобы TS не ругался)
declare global {
  interface Window {
    Telegram: any;
  }
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false); // Заглушка, позже подключишь реальную проверку

  useEffect(() => {
    // 1. Инициализация Telegram
    const tg = window.Telegram.WebApp;
    tg.expand(); // Раскрываем на весь экран
    tg.ready();  // Сообщаем Telegram, что приложение готово

    // 2. Эмуляция проверки авторизации (заменишь на свой API запрос)
    const initApp = async () => {
      try {
        // Здесь будет await checkAuth();
        // Имитация задержки (чтобы увидеть твой красивый Splash)
        await new Promise(resolve => setTimeout(resolve, 2000)); 
        setIsAuth(true); // Пока считаем, что все ок
      } catch (error) {
        console.error("Initialization failed", error);
      } finally {
        setIsLoading(false); // ВАЖНО: Это должно сработать всегда
      }
    };

    initApp();
  }, []);

  // 3. Пока грузимся — показываем ТОЛЬКО Splash
  if (isLoading) {
    return <SplashPage />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          {/* Добавь свои роуты сюда */}
          {/* <Route path="admin" element={<AdminPage />} /> */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;