import { useState, useEffect } from 'react'; // Убрал "React" из импорта
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';

import SplashPage from './pages/SplashPage';

// Страницы
import Dashboard from './pages/Dashboard';
import ProfilePage from './pages/ProfilePage';
import MyDataPage from './pages/MyDataPage';
import FacilityPage from './pages/FacilityPage';
import VisitWizard from './pages/VisitWizard';
import WorkHubPage from './pages/WorkHubPage';
import AdminPage from './pages/AdminPage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import FlavorRatingPage from './pages/FlavorRatingPage';
import VisitsHistoryPage from './pages/VisitsHistoryPage';
import MyOrdersPage from './pages/MyOrdersPage';
import NewFacilityPage from './pages/NewFacilityPage';
import OrderPage from './pages/OrderPage';
import EducationPage from './pages/EducationPage';
import TeamCalendarPage from './pages/TeamCalendarPage';

import { Layout } from './components/Layout';

function App() {
  const [isSplashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    try {
      WebApp.ready();
      WebApp.expand();
      const bgColor = '#F5F5F7';
      WebApp.setHeaderColor(bgColor);
      WebApp.setBackgroundColor(bgColor);
    } catch (e) { console.warn(e); }
  }, []);

  // Показываем Splash при загрузке
  if (isSplashVisible) {
    return <SplashPage onFinish={() => setSplashVisible(false)} />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          {/* Главная (Dashboard) */}
          <Route path="/" element={<Dashboard />} />

          {/* Основные разделы меню */}
          <Route path="/work" element={<WorkHubPage />} />
          <Route path="/knowledge" element={<KnowledgeBasePage />} />
          <Route path="/knowledge/rating" element={<FlavorRatingPage />} />
          <Route path="/education" element={<EducationPage />} />
          <Route path="/calendar" element={<TeamCalendarPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/data" element={<MyDataPage />} />

          {/* Работа с точками */}
          <Route path="/facilities" element={<Navigate to="/work" replace />} />
          <Route path="/facilities/new" element={<NewFacilityPage />} />
          <Route path="/facilities/:id" element={<FacilityPage />} />

          {/* Процессы */}
          <Route path="/visit" element={<VisitWizard />} />
          <Route path="/orders" element={<OrderPage />} />

          {/* Дополнительно */}
          <Route path="/my-orders" element={<MyOrdersPage />} />
          <Route path="/visits-history" element={<VisitsHistoryPage />} />
          <Route path="/admin" element={<AdminPage />} />

          {/* Если маршрут не найден - на главную */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
