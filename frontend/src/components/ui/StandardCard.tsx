import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StandardCardProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  action?: React.ReactNode; // Например, кнопка или бейдж справа
}

export const StandardCard: React.FC<StandardCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  children,
  className = '',
  onClick,
  action,
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
        active:scale-[0.99]
        ${onClick ? 'cursor-pointer active:bg-gray-50' : ''}
        ${className}
      `}
    >
      {(title || Icon) && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 bg-slate-100 rounded-xl text-slate-600">
                <Icon size={20} strokeWidth={2} />
              </div>
            )}
            <div>
              {title && <h3 className="font-semibold text-slate-800 text-[15px] leading-tight">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}

      <div className="text-sm text-slate-600">
        {children}
      </div>
    </div>
  );
};
