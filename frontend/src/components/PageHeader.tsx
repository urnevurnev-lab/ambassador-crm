import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  back?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, rightAction, back }) => {
  const navigate = useNavigate();

  return (
    <div className="mb-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {back && (
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-soft active:scale-90 transition-transform"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-[28px] font-bold tracking-tight text-black leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[15px] text-[#86868B] font-medium mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {rightAction && (
          <div>
            {rightAction}
          </div>
        )}
      </div>
    </div>
  );
};