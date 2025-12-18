import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';

// Импорт страниц
import Dashboard from './pages/Dashboard';
import FacilitiesListPage from './pages/FacilitiesListPage';
import MapPage from './pages/MapPage';
import ProfilePage from './pages/ProfilePage';
import FacilityPage from './pages/FacilityPage';
import VisitWizard from './pages/VisitWizard';
import WorkHubPage from './pages/WorkHubPage';
import AdminPage from './pages/AdminPage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import VisitsHistoryPage from './pages/VisitsHistoryPage';
import MyOrdersPage from './pages/MyOrdersPage';
import SplashPage from './pages/SplashPage';
import NewFacilityPage from './pages/NewFacilityPage';
// Если у тебя SampleOrderWizard это компонент, а не страница, проверь путь.
// Если это страница - раскомментируй и используй.
// import SampleOrderWizard from './components/SampleOrderWizard';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Инициализация Telegram
    if (WebApp.initDataUnsafe) {
        WebApp.expand(); // Раскрыть на весь экран
        WebApp.ready();  // Сообщить телеграму, что приложение готово
    }

    // 2. Имитация загрузки данных (чтобы юзер увидел Splash)
    const timer = setTimeout(() => {
      setIsLoading(false); // <--- ВОТ ЭТО УБИРАЕТ БЕЛЫЙ ЭКРАН
    }, 2000); // 2 секунды заставки

    return () => clearTimeout(timer);
  }, []);

  // Если загрузка идет — показываем ТОЛЬКО Сплеш (на весь экран)
  if (isLoading) {
    return <SplashPage />;
  }

  // Когда загрузка прошла — показываем Роутер и Приложение
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/facilities" element={<FacilitiesListPage />} />
        <Route path="/facilities/new" element={<NewFacilityPage />} />
        <Route path="/facilities/:id" element={<FacilityPage />} />
        <Route path="/map" element={<MapPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/visit" element={<VisitWizard />} />
        <Route path="/work" element={<WorkHubPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
        <Route path="/visits-history" element={<VisitsHistoryPage />} />
        <Route path="/my-orders" element={<MyOrdersPage />} />
        {/* Заглушка для сэмплов, если нет файла страницы */}
        <Route path="/samples" element={<WorkHubPage />} /> 
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;