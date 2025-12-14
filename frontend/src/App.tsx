import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TelegramNavigator } from './components/TelegramNavigator';

// Ленивая загрузка страниц
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MapPage = lazy(() => import('./pages/MapPage'));
const OrderPage = lazy(() => import('./pages/OrderPage'));
const FacilityPage = lazy(() => import('./pages/FacilityPage'));
const FacilitiesListPage = lazy(() => import('./pages/FacilitiesListPage'));
const NewFacilityPage = lazy(() => import('./pages/NewFacilityPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin').then((m) => ({ default: m.AdminLogin })));

const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-[#F8F9FA]">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#007AFF] border-t-transparent" />
  </div>
);

const NotFound = () => <div className="p-10 text-center">404 | Страница не найдена</div>; 

const App: React.FC = () => {
  return (
    // Оборачиваем все приложение в BrowserRouter для роутинга
    <BrowserRouter>
      <TelegramNavigator />
      <div className="App">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Главная страница */}
            <Route path="/" element={<Dashboard />} />
            
            {/* Основные страницы приложения */}
            <Route path="/map" element={<MapPage />} />
            <Route path="/orders" element={<OrderPage />} />
            <Route path="/facility/:id" element={<FacilityPage />} />
            <Route path="/facility/new" element={<NewFacilityPage />} />
            <Route path="/facilities" element={<FacilitiesListPage />} />
            
            {/* Админ-панель */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            
            {/* Обработка несуществующих маршрутов */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
};

export default App;
