import React from 'react';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export type CardColorTheme = 'blue' | 'purple' | 'coral' | 'teal' | 'white' | 'dark';

interface StandardCardProps {
  // Основной контент
  title: string;
  subtitle?: string;
  value?: string | number;
  
  // Визуал
  color?: CardColorTheme;
  illustration?: React.ReactNode; // Большая фоновая картинка
  icon?: LucideIcon;              // Маленькая иконка рядом с текстом
  
  // Слоты и Действия
  children?: React.ReactNode;
  action?: React.ReactNode;       // Например, бейдж с рейтингом
  onClick?: () => void;
  
  // Настройки
  className?: string;
  showArrow?: boolean;
  floating?: boolean; 
  delay?: number;
}

export const StandardCard: React.FC<StandardCardProps> = ({
  title,
  subtitle,
  value,
  color = 'white',
  illustration,
  icon: Icon,
  children,
  action,
  onClick,
  className = "",
  showArrow = false,
  floating = true,
  delay = 0,
}) => {
  const isClickable = !!onClick;
  const isWhite = color === 'white';
  const isColored = !isWhite && color !== 'dark';

  // Палитра тем
  const themes: Record<CardColorTheme, string> = {
    white:  'bg-white text-gray-900 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100',
    dark:   'bg-[#1c1c1e] text-white shadow-lg border border-white/10',
    blue:   'bg-gradient-to-br from-[#0052D4] via-[#4364F7] to-[#6FB1FC] text-white shadow-[0_8px_25px_rgba(67,100,247,0.4)]',
    purple: 'bg-gradient-to-br from-[#654ea3] to-[#eaafc8] text-white shadow-[0_8px_25px_rgba(101,78,163,0.35)]',
    coral:  'bg-gradient-to-br from-[#FF512F] to-[#DD2476] text-white shadow-[0_8px_25px_rgba(221,36,118,0.35)]',
    teal:   'bg-gradient-to-br from-[#11998e] to-[#38ef7d] text-white shadow-[0_8px_25px_rgba(17,153,142,0.35)]',
  };

  const selectedTheme = themes[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ 
        opacity: 1, 
        y: floating && isColored ? [0, -3, 0] : 0 
      }}
      transition={{ 
        y: {
          duration: 5, 
          repeat: Infinity, 
          ease: "easeInOut", 
          delay: delay
        },
        default: { duration: 0.4 }
      }}
      whileTap={isClickable ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`
        relative overflow-hidden
        rounded-[26px] 
        p-5
        flex flex-col
        transition-all duration-300 ease-out
        ${selectedTheme}
        ${isClickable ? 'cursor-pointer active:opacity-90' : ''}
        ${className}
      `}
    >
      {/* 1. ФОНОВЫЕ ЭФФЕКТЫ */}
      {illustration && (
        <div className="absolute -right-4 -bottom-5 opacity-20 pointer-events-none transform rotate-[-10deg] scale-105 drop-shadow-xl filter contrast-125">
          {illustration}
        </div>
      )}

      {isColored && (
         <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
      )}
      
      {/* Стеклянный блик сверху */}
      <div className="absolute top-0 left-0 right-0 h-2/3 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

      {/* 2. ВЕРХНЯЯ ЧАСТЬ (Header) */}
      <div className="relative z-10 flex justify-between items-start mb-2">
         {/* Левая часть: Иконка или Value */}
         <div className="flex items-center gap-2">
            {Icon && (
              <div className={`
                p-2 rounded-xl flex items-center justify-center
                ${isWhite ? 'bg-gray-100 text-gray-500' : 'bg-white/20 text-white'}
              `}>
                <Icon size={18} strokeWidth={2} />
              </div>
            )}
            
            {value && (
               <div className={`
                 inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-extrabold backdrop-blur-md shadow-sm uppercase tracking-wide
                 ${isWhite ? 'bg-gray-100/80 text-gray-500' : 'bg-white/25 text-white border border-white/20'}
               `}>
                 {value}
               </div>
            )}
         </div>

         {/* Правая часть: Action или Стрелка */}
         <div className="flex items-center gap-2">
            {action}
            
            {showArrow && (
               <div className={`p-1 rounded-full ${isColored ? 'bg-white/20' : 'bg-gray-100'}`}>
                  <ChevronRight size={16} className={isWhite ? 'text-gray-400' : 'text-white'} />
               </div>
            )}
         </div>
      </div>

      {/* 3. ТЕКСТ (Body) */}
      <div className="relative z-10 mt-auto pointer-events-none">
        <h3 className={`text-[18px] font-extrabold leading-tight tracking-tight drop-shadow-sm ${isWhite ? 'text-gray-900' : 'text-white'}`}>
          {title}
        </h3>
        
        {subtitle && (
          <p className={`text-[13px] font-semibold mt-1 line-clamp-2 ${isWhite ? 'text-gray-400' : 'text-white/80'}`}>
            {subtitle}
          </p>
        )}
      </div>

      {/* 4. ДОП. КОНТЕНТ (Children) */}
      {children && (
        <div className={`relative z-10 mt-4 pt-3 ${isWhite ? 'border-t border-gray-100' : 'border-t border-white/10'}`}>
          {children}
        </div>
      )}
    </motion.div>
  );
};