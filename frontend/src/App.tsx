import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';

import { Layout } from './components/Layout';
import SplashPage from './pages/SplashPage';

// Страницы
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
import NewFacilityPage from './pages/NewFacilityPage';
import OrderPage from './pages/OrderPage';

function App() {
  const [isSplashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    // Пытаемся инициализировать Telegram, но не роняем приложение если не вышло
    try {
        if (typeof window !== 'undefined' && (window as any).Telegram) {
            WebApp.expand();
            WebApp.ready();
        }
    } catch (e) {
        console.warn('Telegram SDK init warning:', e);
    }
  }, []);

  // Если Splash активен - показываем его и передаем функцию завершения
  if (isSplashVisible) {
    return <SplashPage onFinish={() => setSplashVisible(false)} />;
  }

  return (
    <Router>
      <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            
            {/* Основные разделы меню */}
            <Route path="/orders" element={<OrderPage />} /> {/* Портфель */}
            <Route path="/facilities" element={<FacilitiesListPage />} /> {/* База */}
            <Route path="/admin" element={<AdminPage />} /> {/* Админка */}
            
            {/* Дополнительные страницы */}
            <Route path="/facilities/new" element={<NewFacilityPage />} />
            <Route path="/facilities/:id" element={<FacilityPage />} />
            <Route path="/visit" element={<VisitWizard />} />
            <Route path="/my-orders" element={<MyOrdersPage />} />
            <Route path="/visits-history" element={<VisitsHistoryPage />} />
            <Route path="/knowledge" element={<KnowledgeBasePage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/work" element={<WorkHubPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
      </Layout>
    </Router>
  );
}

export default App;