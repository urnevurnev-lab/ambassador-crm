import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  backTo?: string;
  rightAction?: React.ReactNode;
}

// ВАЖНО: export const
export const PageHeader: React.FC<PageHeaderProps> = ({ title, backTo, rightAction }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="sticky top-0 z-40 bg-[#F3F4F6]/95 backdrop-blur-sm px-1 py-3 mb-2 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button 
          onClick={handleBack}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-700 shadow-sm border border-gray-200 active:scale-95 transition-transform"
        >
          <ChevronLeft size={22} className="relative right-[1px]" />
        </button>
        
        <h1 className="text-xl font-bold text-gray-900 leading-none pt-0.5">
          {title}
        </h1>
      </div>
      
      <div>{rightAction}</div>
    </div>
  );
};