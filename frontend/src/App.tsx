import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TelegramNavigator } from './components/TelegramNavigator';

// --- ИСПРАВЛЕНИЕ: Главные страницы грузим СРАЗУ, чтобы переключение было мгновенным ---
import Dashboard from './pages/Dashboard';
import MapPage from './pages/MapPage';
import OrderPage from './pages/OrderPage';
import FacilitiesListPage from './pages/FacilitiesListPage';
import FacilityPage from './pages/FacilityPage';
import { VisitWizard } from './pages/VisitWizard';

// Ленивая загрузка только для тяжелых/редких страниц
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
    <BrowserRouter>
      <TelegramNavigator />
      <div className="App">
        {/* Suspense теперь нужен только для редких роутов */}
        <Routes>
          {/* Главные страницы (мгновенная загрузка) */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/orders" element={<OrderPage />} />
          <Route path="/facility/:id" element={<FacilityPage />} />
          <Route path="/facilities" element={<FacilitiesListPage />} />
          <Route path="/visit" element={<VisitWizard />} />
          
          {/* Редкие страницы (с лоадером) */}
          <Route path="/facility/new" element={
            <Suspense fallback={<PageLoader />}>
              <NewFacilityPage />
            </Suspense>
          } />
          
          {/* Админ-панель */}
          <Route path="/admin" element={
            <Suspense fallback={<PageLoader />}>
              <AdminDashboard />
            </Suspense>
          } />
          <Route path="/admin/login" element={
            <Suspense fallback={<PageLoader />}>
              <AdminLogin />
            </Suspense>
          } />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
