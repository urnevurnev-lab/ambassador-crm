import { useEffect } from 'react';
import WebApp from '@twa-dev/sdk';

interface MainButtonProps {
  text: string;
  onClick: () => void;
  isVisible?: boolean;
  isLoading?: boolean;
  isActive?: boolean;
  color?: string;
  textColor?: string;
}

export const TelegramMainButton = ({
  text,
  onClick,
  isVisible = true,
  isLoading = false,
  isActive = true,
  color = '#2481cc',
  textColor = '#ffffff'
}: MainButtonProps) => {
  useEffect(() => {
    const mainButton = (WebApp as any)?.MainButton;
    if (!mainButton?.setText || !mainButton?.setParams) return;

    try {
      mainButton.setText(text);
      mainButton.setParams({
        color,
        text_color: textColor,
        is_active: isActive,
        is_visible: isVisible,
      });

      if (isLoading) mainButton.showProgress?.();
      else mainButton.hideProgress?.();

      const handleClick = () => {
        WebApp.HapticFeedback?.impactOccurred?.('light');
        onClick();
      };

      mainButton.onClick?.(handleClick);

      if (isVisible) mainButton.show?.();
      else mainButton.hide?.();

      return () => {
        mainButton.offClick?.(handleClick);
        mainButton.hide?.();
      };
    } catch (e) {
      console.warn('Telegram MainButton unavailable:', e);
      return;
    }
  }, [text, onClick, isVisible, isLoading, isActive, color, textColor]);

  return null;
};
