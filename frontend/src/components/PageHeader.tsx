import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  back?: boolean;
  onBack?: () => void;
  rightContent?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, back, onBack, rightContent, className = '' }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 bg-[#F8F9FA]/90 backdrop-blur-md border-b border-gray-200/50 ${className}`}>
      {/* Safe area top inset */}
      <div className="h-[env(safe-area-inset-top)] w-full" />

      <div className="flex items-center px-4 h-14 relative">
        {back && (
          <button
            onClick={handleBack}
            className="mr-3 p-2 -ml-2 rounded-full hover:bg-gray-200/50 transition active:scale-95 text-[#007AFF]"
          >
            <ArrowLeft size={22} />
          </button>
        )}

        <h1 className="text-[17px] font-semibold text-[#1C1C1E] flex-grow truncate text-center pr-8 leading-snug">
          {title}
        </h1>

        {rightContent && (
          <div className="absolute right-4 top-0 bottom-0 flex items-center">
            {rightContent}
          </div>
        )}
      </div>
    </div>
  );
};
