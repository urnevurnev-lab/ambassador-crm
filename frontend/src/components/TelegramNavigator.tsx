import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';

// Перечень корневых маршрутов, где не требуется отображать кнопку Telegram "Назад".
const ROOT_ROUTES = ['/', '/map', '/orders', '/profile', '/facilities'];

export const TelegramNavigator = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // SDK может быть недоступен при открытии вне Telegram, не падаем в этом случае.
    const tg = (WebApp as any);
    if (!tg?.ready) {
      return;
    }

    tg.ready();
    tg.expand?.();

    const handleBackBtn = () => {
      navigate(-1);
    };

    const shouldShowButton = !ROOT_ROUTES.includes(location.pathname);

    if (shouldShowButton) {
      tg.BackButton?.show?.();
      tg.BackButton?.onClick?.(handleBackBtn);
    } else {
      tg.BackButton?.hide?.();
    }

    return () => {
      tg.BackButton?.offClick?.(handleBackBtn);
    };
  }, [location, navigate]);

  return null;
};
