import React, { useEffect, useState } from 'react';
import WebApp from '@twa-dev/sdk';
import apiClient from '../api/apiClient';

interface SplashPageProps {
  onFinish: () => void;
}

const SplashPage: React.FC<SplashPageProps> = ({ onFinish }) => {
  const [status, setStatus] = useState<'checking' | 'granted' | 'denied'>('checking');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isMounted = true;
    let finishTimer: ReturnType<typeof setTimeout> | undefined;

    const initData = (WebApp as unknown as { initData?: string }).initData;

    const toErrorMessage = (e: unknown) => {
      const maybeResponse = e as { response?: { status?: number; data?: unknown } };
      const data = maybeResponse.response?.data;

      if (data && typeof data === 'object' && 'message' in data) {
        const msg = (data as { message?: unknown }).message;
        if (typeof msg === 'string') return msg;
        if (Array.isArray(msg)) {
          const parts = msg.filter((item): item is string => typeof item === 'string');
          if (parts.length) return parts.join(', ');
        }
      }

      if (maybeResponse.response?.status) {
        return `Ошибка сервера (${maybeResponse.response.status})`;
      }

      if (e && typeof e === 'object' && 'message' in e) {
        const msg = (e as { message?: unknown }).message;
        if (typeof msg === 'string' && msg.trim()) return msg;
      }

      return 'Не удалось подключиться к серверу';
    };

    const checkAccess = async () => {
      setStatus('checking');
      setError('');

      if (!initData) {
        setStatus('granted');
        finishTimer = setTimeout(() => {
          if (isMounted) onFinish();
        }, 300);
        return;
      }

      try {
        await apiClient.get('/api/users/me');
        if (!isMounted) return;
        setStatus('granted');
        finishTimer = setTimeout(() => {
          if (isMounted) onFinish();
        }, 900);
      } catch (e) {
        if (!isMounted) return;
        setStatus('denied');
        setError(toErrorMessage(e));
      }
    };

    checkAccess();

    return () => {
      isMounted = false;
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, [attempt, onFinish]);

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
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setAttempt((prev) => prev + 1)}
              style={{
                padding: '16px 24px', backgroundColor: '#fff', color: '#000',
                border: '1px solid rgba(0,0,0,0.15)', borderRadius: 16, fontWeight: 'bold', fontSize: 14,
                boxShadow: '0 10px 20px rgba(0,0,0,0.06)'
              }}
            >
              ПОВТОРИТЬ
            </button>
            <button
              onClick={() => {
                try {
                  WebApp.close?.();
                } catch (e) {
                  console.warn(e);
                }
              }}
              style={{
                padding: '16px 24px', backgroundColor: '#000', color: '#fff',
                border: 'none', borderRadius: 16, fontWeight: 'bold', fontSize: 14,
                boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
              }}
            >
              ЗАКРЫТЬ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SplashPage;
