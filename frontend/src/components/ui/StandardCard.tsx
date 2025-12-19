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
    white: 'bg-white text-[#000000] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] border border-[#C6C6C8]/20',
    dark: 'bg-[#1C1C1E] text-white shadow-elevated border border-white/10',
    blue: 'bg-white text-[#000000] shadow-[0_20px_40px_-10px_rgba(0,122,255,0.1)] border border-[#007AFF]/10',
    purple: 'bg-white text-[#000000] shadow-[0_20px_40px_-10px_rgba(88,86,214,0.1)] border border-[#5856D6]/10',
    coral: 'bg-white text-[#000000] shadow-[0_20px_40px_-10px_rgba(255,45,85,0.1)] border border-[#FF2D55]/10',
    teal: 'bg-white text-[#000000] shadow-[0_20px_40px_-10px_rgba(48,176,199,0.1)] border border-[#30B0C7]/10',
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
        relative overflow-hidden rounded-[24px] p-5 flex flex-col 
        transition-all duration-300 
        ${themes[color]} 
        ${isClickable ? 'cursor-pointer active:scale-[0.98]' : ''} 
        ${className}
      `}
    >
      {/* Смысловые Иллюстрации (Large, semi-transparent) */}
      {illustration && (
        <div className="absolute -right-2 -bottom-2 pointer-events-none z-0">
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
        <h3 className="text-[22px] font-extrabold leading-tight tracking-tight">{title}</h3>
        {subtitle && <p className="text-[14px] text-[#8E8E93] font-medium mt-1 leading-snug">{subtitle}</p>}
      </div>

      {children && (
        <div className={`relative z-10 mt-5 pt-4 border-t ${isWhite ? 'border-gray-100' : 'border-white/10'}`}>
          {children}
        </div>
      )}
    </motion.div>
  );
};