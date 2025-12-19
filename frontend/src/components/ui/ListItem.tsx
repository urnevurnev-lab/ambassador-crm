import React from 'react';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface ListItemProps {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    action?: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

export const ListItem: React.FC<ListItemProps> = ({
    title, subtitle, icon: Icon, action, onClick, className = ""
}) => {
    return (
        <motion.div
            whileTap={onClick ? { backgroundColor: 'rgba(0,0,0,0.05)', scale: 0.98 } : undefined}
            onClick={onClick}
            className={`
        flex items-center gap-4 p-4 bg-white rounded-2xl border border-[#C6C6C8]/30
        transition-colors duration-200 cursor-pointer active:bg-gray-50
        ${className}
      `}
        >
            {Icon && (
                <div className="w-10 h-10 rounded-xl bg-[#F2F2F7] flex items-center justify-center text-[#8E8E93]">
                    <Icon size={22} />
                </div>
            )}

            <div className="flex-1 min-w-0">
                <h4 className="text-[16px] font-semibold text-[#000000] truncate">{title}</h4>
                {subtitle && <p className="text-[13px] text-[#8E8E93] truncate">{subtitle}</p>}
            </div>

            <div className="flex items-center gap-2">
                {action}
                <ChevronRight size={18} className="text-[#C6C6C8]" />
            </div>
        </motion.div>
    );
};
