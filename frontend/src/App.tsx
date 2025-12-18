import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';

// --- КОМПОНЕНТ ЛОВУШКИ ОШИБОК (Не удаляй его!) ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 min-h-screen flex flex-col justify-center items-center text-center">
          <h1 className="text-red-600 font-bold text-xl mb-2">ОШИБКА ЗАПУСКА</h1>
          <div className="bg-white p-4 rounded-xl border border-red-200 w-full overflow-auto text-left shadow-sm">
            <p className="text-xs text-red-500 font-mono break-all">
              {this.state.error?.toString()}
            </p>
          </div>
          <button onClick={() => window.location.reload()} className="mt-6 bg-red-600 text-white py-3 px-6 rounded-xl font-bold">
            Попробовать снова
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- ИМПОРТЫ ---
// Если какой-то файл не найден, сборка упадет в терминале.
// Если файл есть, но внутри ошибка - ErrorBoundary её поймает.
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
import SampleOrderWizard from './components/SampleOrderWizard';

// Обертка для страницы сэмплов
const SamplesPageWrapper = () => {
    const navigate = useNavigate();
    return <SampleOrderWizard isOpen={true} onClose={() => navigate(-1)} />;
};

function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
        if (WebApp.initDataUnsafe) {
            WebApp.expand();
            WebApp.ready();
        }
    } catch (e) {
        console.log('Telegram SDK not available');
    }
    // Таймер заставки
    setTimeout(() => setIsLoading(false), 2000);
  }, []);

  if (isLoading) return <SplashPage />;

  return (
    <ErrorBoundary>
        <Router>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/facilities/new" element={<NewFacilityPage />} />
            <Route path="/facilities/:id" element={<FacilityPage />} />
            <Route path="/facilities" element={<FacilitiesListPage />} />
            
            {/* Меню */}
            <Route path="/work" element={<WorkHubPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Процессы */}
            <Route path="/visit" element={<VisitWizard />} />
            <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
            <Route path="/visits-history" element={<VisitsHistoryPage />} />
            <Route path="/my-orders" element={<MyOrdersPage />} />
            <Route path="/samples" element={<SamplesPageWrapper />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
    </ErrorBoundary>
  );
}

export default App;
