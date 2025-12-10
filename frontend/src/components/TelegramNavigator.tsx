import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import WebApp from '@twa-dev/sdk';

// Перечень корневых маршрутов, где не требуется отображать кнопку Telegram "Назад".
const ROOT_ROUTES = ['/', '/map', '/orders', '/profile', '/facilities'];

export const TelegramNavigator = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    WebApp.ready();
    WebApp.expand();

    const handleBackBtn = () => {
      navigate(-1);
    };

    const shouldShowButton = !ROOT_ROUTES.includes(location.pathname);

    if (shouldShowButton) {
      WebApp.BackButton.show();
      WebApp.BackButton.onClick(handleBackBtn);
    } else {
      WebApp.BackButton.hide();
    }

    return () => {
      WebApp.BackButton.offClick(handleBackBtn);
    };
  }, [location, navigate]);

  return null;
};
