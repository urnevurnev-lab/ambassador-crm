import React, { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import apiClient from '../api/apiClient';

interface SplashPageProps {
  onFinish: () => void;
}

const SplashPage: React.FC<SplashPageProps> = ({ onFinish }) => {
  const [status, setStatus] = useState<'checking' | 'granted' | 'denied'>('checking');
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('DEBUG: SplashPage init');
    const checkAccess = async () => {
      try {
        const res = await apiClient.get('/api/users/me');
        console.log('DEBUG: Access OK', res.data);
        setStatus('granted');
        setTimeout(() => onFinish(), 2000);
      } catch (e: any) {
        console.warn('DEBUG: Access Fail', e);
        setStatus('denied');
        setError(e.response?.data?.message || 'Access Denied');
      }
    };
    checkAccess();
  }, [onFinish]);

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'white',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, color: 'black', fontFamily: 'sans-serif', textAlign: 'center'
    }}>
      <style>{`
        @keyframes spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
      `}</style>

      {status === 'checking' || status === 'granted' ? (
        <div>
          <div style={{
            width: 60, height: 60, border: '6px solid #f3f3f3', borderTop: '6px solid #d4af37',
            borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px'
          }} />
          <div style={{ fontWeight: '900', fontSize: 20, letterSpacing: 1 }}>ЗАГРУЗКА...</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>Проверка прав доступа</div>
        </div>
      ) : (
        <div style={{ padding: 30 }}>
          <div style={{ fontSize: 60, marginBottom: 20 }}>🔒</div>
          <h2 style={{ margin: '0 0 10px 0', fontSize: 24, fontWeight: '900' }}>ДОСТУП ОГРАНИЧЕН</h2>
          <p style={{ color: '#666', marginBottom: 30, fontSize: 16 }}>{error}</p>
          <button
            onClick={() => WebApp.close()}
            style={{
              padding: '16px 32px', backgroundColor: '#000', color: '#fff',
              border: 'none', borderRadius: 16, fontWeight: 'bold', fontSize: 14,
              boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
            }}
          >
            ЗАКРЫТЬ ПРИЛОЖЕНИЕ
          </button>
        </div>
      )}
    </div>
  );
};

export default SplashPage;