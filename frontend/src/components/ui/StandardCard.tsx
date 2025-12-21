import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';

interface StandardCardProps extends HTMLMotionProps<'div'> {
  title?: any;
  subtitle?: any;
  children?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  variant?: 'light' | 'dark';
  // Backward compatibility props
  color?: string;
  floating?: boolean;
  icon?: React.ElementType;
  illustration?: React.ReactNode;
  value?: string;
  action?: React.ReactNode;
  showArrow?: boolean;
}

export const StandardCard: React.FC<StandardCardProps> = ({
  title,
  subtitle,
  children,
  className,
  titleClassName,
  subtitleClassName,
  variant = 'light',
  color,
  floating,
  icon: Icon,
  illustration,
  value,
  action,
  showArrow,
  ...props
}) => {

  const isDark = variant === 'dark';

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className={cn(
        'w-full rounded-[32px] p-6 shadow-soft relative overflow-hidden transition-all duration-200',
        isDark ? 'bg-[#111111] text-white' : 'bg-white text-black',
        className
      )}
      {...props}
    >
      {title && (
        <span
          className={cn(
            'block text-[13px] font-bold tracking-wide uppercase mb-1',
            isDark ? 'text-white/60' : 'text-[#86868B]',
            titleClassName
          )}
        >
          {title}
        </span>
      )}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          {subtitle && (
            <h3
              className={cn(
                'text-[24px] font-bold leading-tight mb-4',
                isDark ? 'text-white' : 'text-black',
                subtitleClassName
              )}
            >
              {subtitle}
            </h3>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "p-2 rounded-xl",
            isDark ? "bg-white/10 text-white" : "bg-[#F5F5F7] text-black"
          )}>
            <Icon size={20} />
          </div>
        )}
      </div>

      {value && (
        <div className="text-[20px] font-bold mb-4">{value}</div>
      )}

      {children}

      {action && (
        <div className="mt-6 pt-4 border-t border-[#F5F5F7] flex justify-end">
          {action}
        </div>
      )}

      {illustration && (
        <div className="absolute top-4 right-4 pointer-events-none opacity-20">
          {illustration}
        </div>
      )}
    </motion.div>

  );
};