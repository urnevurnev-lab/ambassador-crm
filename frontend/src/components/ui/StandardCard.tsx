import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

interface StandardCardProps extends Omit<HTMLMotionProps<'div'>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  variant?: 'light' | 'dark';
  color?: string;
  floating?: boolean;
  icon?: React.ElementType;
  illustration?: React.ReactNode;
  value?: React.ReactNode;
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
  floating,
  icon: Icon,
  illustration,
  value,
  action,
  showArrow,
  ...props
}) => {
  const isDark = variant === 'dark';
  const hasSubtitle = Boolean(subtitle);
  const shadowClass = floating === false ? 'shadow-sm' : 'shadow-md';

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className={cn(
        'w-full rounded-3xl border transition-all duration-200 relative overflow-hidden',
        shadowClass,
        isDark ? 'bg-[#111111] text-white border-[#1f1f1f]' : 'bg-white text-black border-gray-100',
        className
      )}
      {...props}
    >
      <div className="p-5">
        {(title || subtitle || Icon || showArrow) && (
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {title && hasSubtitle && (
                <div
                  className={cn(
                    'text-[11px] font-semibold uppercase tracking-widest mb-1',
                    isDark ? 'text-white/60' : 'text-gray-500',
                    titleClassName
                  )}
                >
                  {title}
                </div>
              )}
              {title && !hasSubtitle && (
                <div
                  className={cn(
                    'text-[16px] font-semibold text-black',
                    isDark && 'text-white',
                    titleClassName
                  )}
                >
                  {title}
                </div>
              )}
              {subtitle && (
                <div
                  className={cn(
                    'text-[18px] font-semibold leading-snug',
                    isDark ? 'text-white' : 'text-black',
                    subtitleClassName
                  )}
                >
                  {subtitle}
                </div>
              )}
            </div>
            {(Icon || showArrow) && (
              <div className="flex items-center gap-2">
                {Icon && (
                  <div
                    className={cn(
                      'p-2 rounded-2xl',
                      isDark ? 'bg-white/10 text-white' : 'bg-[#F5F5F7] text-black'
                    )}
                  >
                    <Icon size={18} strokeWidth={2} />
                  </div>
                )}
                {showArrow && (
                  <ChevronRight size={18} strokeWidth={2} className={isDark ? 'text-white/60' : 'text-gray-300'} />
                )}
              </div>
            )}
          </div>
        )}

        {value !== undefined && value !== null && (
          <div className="mt-3 text-[22px] font-semibold">
            {value}
          </div>
        )}

        {children && <div className={title || subtitle || value ? 'mt-4' : ''}>{children}</div>}
      </div>

      {action && (
        <div className={cn('px-5 pb-4 pt-4 border-t', isDark ? 'border-white/10' : 'border-gray-100')}>
          <div className="flex justify-end">{action}</div>
        </div>
      )}

      {illustration && (
        <div className="absolute top-4 right-4 pointer-events-none opacity-10">
          {illustration}
        </div>
      )}
    </motion.div>
  );
};
