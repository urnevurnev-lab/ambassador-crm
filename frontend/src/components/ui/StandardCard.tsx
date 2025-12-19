import React, { useMemo } from 'react';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export type CardColorTheme = 'blue' | 'purple' | 'coral' | 'teal' | 'white' | 'dark';

interface StandardCardProps {
  title: string;
  subtitle?: string;
  value?: string | number;
  color?: CardColorTheme;
  illustration?: React.ReactNode;
  icon?: LucideIcon;
  children?: React.ReactNode;
  action?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  showArrow?: boolean;
  floating?: boolean;
}

export const StandardCard: React.FC<StandardCardProps> = ({
  title, subtitle, value, color = 'white', illustration, icon: Icon,
  children, action, onClick, className = "", showArrow = false, floating = true
}) => {
  const isClickable = !!onClick;
  const isWhite = color === 'white';
  const isColored = !isWhite && color !== 'dark';

  // Random duration for anti-gravity effect to make it look more natural
  const floatingDuration = useMemo(() => 3 + Math.random() * 2, []);
  const floatingDelay = useMemo(() => Math.random() * 2, []);

  const themes: Record<CardColorTheme, string> = {
    white: 'bg-white text-gray-900 shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-gray-100',
    dark: 'bg-[#1c1c1e] text-white shadow-xl border border-white/10',
    blue: 'bg-gradient-to-br from-[#0052D4] to-[#6FB1FC] text-white shadow-[0_12px_30px_-6px_rgba(0,82,212,0.4)]',
    purple: 'bg-gradient-to-br from-[#654ea3] to-[#eaafc8] text-white shadow-[0_12px_30px_-6px_rgba(101,78,163,0.4)]',
    coral: 'bg-gradient-to-br from-[#FF512F] to-[#DD2476] text-white shadow-[0_12px_30px_-6px_rgba(255,81,47,0.4)]',
    teal: 'bg-gradient-to-br from-[#11998e] to-[#38ef7d] text-white shadow-[0_12px_30px_-6px_rgba(17,153,142,0.4)]',
  };

  return (
    <motion.div
      initial={floating && isColored ? { y: 0 } : false}
      animate={floating && isColored ? { y: [0, -6, 0] } : { y: 0 }}
      transition={
        floating && isColored
          ? {
            duration: floatingDuration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: floatingDelay
          }
          : undefined
      }
      whileTap={isClickable ? { scale: 0.96 } : undefined}
      whileHover={isClickable ? { y: -2 } : undefined}
      onClick={onClick}
      className={`
        relative overflow-hidden rounded-[30px] p-6 flex flex-col 
        transition-all duration-300 
        ${themes[color]} 
        ${isClickable ? 'cursor-pointer active:brightness-95' : ''} 
        ${className}
      `}
    >
      {/* Смысловые Иллюстрации (Large, semi-transparent) */}
      {illustration && (
        <div className="absolute -right-6 -bottom-6 opacity-[0.15] pointer-events-none transform -rotate-12 scale-125">
          {illustration}
        </div>
      )}

      <div className="relative z-10 flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={`p-2.5 rounded-2xl ${isWhite ? 'bg-gray-100 text-gray-500' : 'bg-white/20 backdrop-blur-md text-white border border-white/10'}`}>
              <Icon size={20} />
            </div>
          )}
          {value !== undefined && (
            <div className={`px-3 py-1 rounded-xl text-[12px] font-bold backdrop-blur-md ${isWhite ? 'bg-gray-100 text-gray-500' : 'bg-white/20 text-white border border-white/10'}`}>
              {value}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {action}
          {showArrow && <ChevronRight size={20} className={isWhite ? 'text-gray-300' : 'text-white/70'} />}
        </div>
      </div>

      <div className="relative z-10 mt-auto">
        <h3 className="text-[20px] font-extrabold leading-tight tracking-tight drop-shadow-sm">{title}</h3>
        {subtitle && <p className="text-[14px] font-medium mt-1 opacity-80 leading-snug">{subtitle}</p>}
      </div>

      {children && (
        <div className={`relative z-10 mt-5 pt-4 border-t ${isWhite ? 'border-gray-100' : 'border-white/10'}`}>
          {children}
        </div>
      )}
    </motion.div>
  );
};