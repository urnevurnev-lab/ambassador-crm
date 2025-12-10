import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TelegramNavigator } from './components/TelegramNavigator';

// Импортируем все страницы
import Dashboard from './pages/Dashboard';
import MapPage from './pages/MapPage';
import OrderPage from './pages/OrderPage';
import FacilityPage from './pages/FacilityPage';
import FacilitiesListPage from './pages/FacilitiesListPage';

// ИСПРАВЛЕННАЯ СТРОКА: Используем named import { AdminDashboard }
import { AdminDashboard } from './pages/admin/AdminDashboard'; 
// Убедитесь, что у вас есть заглушка для страниц, которых еще нет
const NotFound = () => <div>404 | Страница не найдена</div>; 

const App: React.FC = () => {
  return (
    // Оборачиваем все приложение в BrowserRouter для роутинга
    <BrowserRouter>
      <TelegramNavigator />
      <div className="App">
        <Routes>
          {/* Главная страница */}
          <Route path="/" element={<Dashboard />} />
          
          {/* Основные страницы приложения */}
          <Route path="/map" element={<MapPage />} />
          <Route path="/orders" element={<OrderPage />} />
          <Route path="/facility/:id" element={<FacilityPage />} />
          <Route path="/facilities" element={<FacilitiesListPage />} />
          
          {/* Админ-панель: ИСПРАВЛЕНО */}
          <Route path="/admin" element={<AdminDashboard />} />
          
          {/* Обработка несуществующих маршрутов */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

export default App;
