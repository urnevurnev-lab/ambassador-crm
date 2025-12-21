import React from 'react';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  back?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, rightAction }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-end justify-between gap-4 mb-6 pt-3 px-1"
    >
      <div>
        <h1 className="text-[28px] font-semibold text-black tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] text-black/50 font-medium mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {rightAction && <div className="mb-1">{rightAction}</div>}
    </motion.div>
  );
};
