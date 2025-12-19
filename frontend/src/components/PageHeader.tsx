import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  backTo?: string;
  rightAction?: React.ReactNode;
  back?: boolean; // Синоним для простоты
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, backTo, rightAction, back }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) navigate(backTo);
    else navigate(-1);
  };

  return (
    <div className="flex items-center justify-between py-2 mb-2">
      <div className="flex items-center gap-3">
        {(back || backTo) && (
          <button 
            onClick={handleBack}
            className="w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center text-gray-700 shadow-sm border border-white/50 active:scale-95 transition-transform"
          >
            <ChevronLeft size={22} className="relative right-[1px]" />
          </button>
        )}
        
        <h1 className="text-2xl font-extrabold text-gray-900 leading-none tracking-tight">
          {title}
        </h1>
      </div>
      
      <div>{rightAction}</div>
    </div>
  );
};