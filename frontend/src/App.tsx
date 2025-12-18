import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
    // Инициализация через SDK (убирает warning "WebApp is declared but not read")
    try {
        // Сообщаем Телеграму, что приложение готово
        WebApp.ready();
        
        // Растягиваем на весь экран
        WebApp.expand(); 

        // Настраиваем цвета шапки под тему пользователя
        // Используем параметры темы, если они доступны
        const theme = WebApp.themeParams;
        if (theme) {
            WebApp.setHeaderColor(theme.secondary_bg_color || '#ffffff');
            WebApp.setBackgroundColor(theme.bg_color || '#F3F4F6');
        }

        // Отключаем вертикальные свайпы (закрытие), если версия позволяет
        if (WebApp.isVersionAtLeast('7.7')) {
            WebApp.disableVerticalSwipes();
        }
        
    } catch (e) {
        console.warn('Telegram SDK init warning (Running in browser mode):', e);
    }
  }, []);

  // Если Splash активен - показываем его
  if (isSplashVisible) {
    return <SplashPage onFinish={() => setSplashVisible(false)} />;
  }

  return (
    <Router>
      <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/work" element={<WorkHubPage />} />
            <Route path="/knowledge" element={<KnowledgeBasePage />} />
            <Route path="/admin" element={<AdminPage />} />
            
            <Route path="/facilities" element={<FacilitiesListPage />} />
            <Route path="/facilities/new" element={<NewFacilityPage />} />
            <Route path="/facilities/:id" element={<FacilityPage />} />
            
            <Route path="/visit" element={<VisitWizard />} />
            <Route path="/orders" element={<OrderPage />} />
            
            <Route path="/my-orders" element={<MyOrdersPage />} />
            <Route path="/visits-history" element={<VisitsHistoryPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
      </Layout>
    </Router>
  );
}

export default App;