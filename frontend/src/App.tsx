import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';

// --- ИМПОРТЫ СТРАНИЦ ---
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

// --- КОМПОНЕНТ ДЛЯ ОТЛОВА ОШИБОК (ERROR BOUNDARY) ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 min-h-screen flex flex-col justify-center">
          <h1 className="text-red-600 font-bold text-xl mb-2">Ошибка приложения!</h1>
          <p className="text-gray-700 text-sm mb-4">Пожалуйста, отправь скриншот разработчику.</p>
          <div className="bg-white p-3 rounded-xl border border-red-200 overflow-auto max-h-[300px]">
            <code className="text-xs text-red-500 font-mono break-all">
              {this.state.error?.toString()}
            </code>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 bg-red-600 text-white py-3 rounded-xl font-bold"
          >
            Перезагрузить
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- ОСНОВНОЙ КОМПОНЕНТ ---
function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Безопасная инициализация Telegram
    try {
        if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
            const tg = (window as any).Telegram.WebApp;
            tg.expand();
            tg.ready();
        }
    } catch (e) {
        console.error("Telegram init failed", e);
    }

    // Таймер сплеш-скрина
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SplashPage />;
  }

  return (
    <ErrorBoundary>
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
            
            {/* ВРЕМЕННО ОТКЛЮЧИЛ СЭМПЛЫ, ЧТОБЫ ЗАПУСТИТЬСЯ */}
            {/* <Route path="/samples" element={<SampleOrderWizard />} /> */}
            <Route path="/samples" element={<div className="p-10 text-center">Раздел на ремонте</div>} /> 
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
    </ErrorBoundary>
  );
}

export default App;