import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';

// Импорт страниц (убедись, что файлы существуют, мы их сейчас обновим)
import Dashboard from './pages/Dashboard';
import MapPage from './pages/MapPage';
import MyOrdersPage from './pages/MyOrdersPage';
import ProfilePage from './pages/ProfilePage';
import FacilitiesListPage from './pages/FacilitiesListPage';
import FacilityPage from './pages/FacilityPage';
import NewFacilityPage from './pages/NewFacilityPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          {/* Главная страница (Меню) */}
          <Route path="/" element={<Dashboard />} />
          
          {/* Основные разделы таб-бара */}
          <Route path="/map" element={<MapPage />} />
          <Route path="/my-orders" element={<MyOrdersPage />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Внутренние страницы */}
          <Route path="/facilities" element={<FacilitiesListPage />} />
          <Route path="/facilities/new" element={<NewFacilityPage />} />
          <Route path="/facilities/:id" element={<FacilityPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;