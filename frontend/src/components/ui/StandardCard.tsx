import React from 'react';
import { ChevronRight, type LucideIcon } from 'lucide-react';

interface StandardCardProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  children?: React.ReactNode; // Сделал необязательным (для карточек меню)
  className?: string;
  onClick?: () => void;
  action?: React.ReactNode; // Твой "плюсик" или бейдж
  showArrow?: boolean; // Добавил флаг для автоматической стрелочки
}

export const StandardCard: React.FC<StandardCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  children,
  className = '',
  onClick,
  action,
  showArrow = false, // По умолчанию стрелки нет, но мы её включим где надо
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white
        rounded-2xl
        shadow-sm
        border border-gray-200
        p-4
        w-full
        transition-all
        duration-200
        ${onClick ? 'cursor-pointer active:scale-[0.98] active:bg-gray-50' : ''}
        ${className}
      `}
    >
      {/* Шапка карточки */}
      {(title || Icon) && (
        <div className={`flex items-center justify-between ${children ? 'mb-3' : ''}`}>
          <div className="flex items-center gap-3 overflow-hidden">
            {Icon && (
              <div className="flex-shrink-0 p-2.5 bg-slate-50 rounded-xl text-slate-600">
                <Icon size={20} strokeWidth={2} />
              </div>
            )}
            <div className="min-w-0">
              {title && <h3 className="font-bold text-gray-900 text-[15px] leading-tight truncate">{title}</h3>}
              {subtitle && <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>
          
          {/* Правая часть: либо твой action (плюсик), либо стрелочка */}
          <div className="flex items-center pl-2">
            {action}
            {showArrow && !action && (
              <ChevronRight size={18} className="text-gray-300 ml-1" />
            )}
          </div>
        </div>
      )}

      {/* Контент (если есть) */}
      {children && (
        <div className="text-sm text-slate-600">
          {children}
        </div>
      )}
    </div>
  );
};