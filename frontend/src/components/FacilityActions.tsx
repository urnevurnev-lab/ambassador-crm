import React from 'react';
import { motion } from 'framer-motion';
import {
    Briefcase,
    Car,
    ChevronRight,
    ClipboardList,
    GraduationCap,
    Wine
} from 'lucide-react';

interface Activity { id: number; code: string; name: string; }
interface FacilityActionsProps {
    activities: Activity[];
    onStart: (code: string) => void;
    className?: string;
    showHeader?: boolean;
}

const getPalette = (code: string) => {
    const normalized = (code || '').toLowerCase();
    // Настраиваем цвета и иконки под каждый тип
    if (normalized === 'checkup') return { bg: 'bg-emerald-100', text: 'text-emerald-700', Icon: ClipboardList };
    if (normalized === 'transit') return { bg: 'bg-blue-100', text: 'text-blue-700', Icon: Car };
    if (normalized === 'training') return { bg: 'bg-purple-100', text: 'text-purple-700', Icon: GraduationCap };
    if (normalized === 'tasting') return { bg: 'bg-rose-100', text: 'text-rose-700', Icon: Wine };
    return { bg: 'bg-gray-100', text: 'text-gray-700', Icon: Briefcase };
};

export const FacilityActions: React.FC<FacilityActionsProps> = ({
    activities,
    onStart,
    className = '',
    showHeader = true
}) => {
    return (
        <div className={`space-y-3 ${className}`}>
            {showHeader && (
                <div className="px-1">
                    <h3 className="font-bold text-[#1C1C1E] text-lg">Сценарии</h3>
                </div>
            )}
            
            <div className="flex flex-col gap-3">
                {activities.map((act) => {
                    const { bg, text, Icon } = getPalette(act.code);
                    
                    return (
                        <motion.button
                            key={act.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onStart(act.code)}
                            className="w-full bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex items-center justify-between group active:border-blue-200 transition-all"
                        >
                            <div className="flex items-center gap-4">
                                {/* Иконка */}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bg} ${text}`}>
                                    <Icon size={24} />
                                </div>
                                
                                {/* Текст */}
                                <div className="text-left">
                                    <div className="font-bold text-[#1C1C1E] text-[15px]">{act.name}</div>
                                    <div className="text-xs text-gray-400 mt-0.5">Начать выполнение</div>
                                </div>
                            </div>

                            {/* Стрелка */}
                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#1C1C1E] group-hover:text-white transition-colors">
                                <ChevronRight size={18} />
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};
