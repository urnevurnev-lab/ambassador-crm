import React from 'react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, rightAction }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-end justify-between mb-6 pt-2 px-1"
    >
      <div>
        <h1 className="text-[34px] font-[800] text-black tracking-tight leading-none">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[15px] text-[#86868B] font-medium mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {rightAction && <div className="mb-1">{rightAction}</div>}
    </motion.div>
  );
};