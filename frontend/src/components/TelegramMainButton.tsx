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
    WebApp.MainButton.setText(text);
    WebApp.MainButton.setParams({
      color,
      text_color: textColor,
      is_active: isActive,
      is_visible: isVisible,
    });

    if (isLoading) WebApp.MainButton.showProgress();
    else WebApp.MainButton.hideProgress();

    const handleClick = () => {
      WebApp.HapticFeedback.impactOccurred('light');
      onClick();
    };

    WebApp.MainButton.onClick(handleClick);

    if (isVisible) WebApp.MainButton.show();
    else WebApp.MainButton.hide();

    return () => {
      WebApp.MainButton.offClick(handleClick);
      WebApp.MainButton.hide();
    };
  }, [text, onClick, isVisible, isLoading, isActive, color, textColor]);

  return null;
};
