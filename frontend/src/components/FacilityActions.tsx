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
    title?: string;
    description?: string;
    className?: string;
    showHeader?: boolean;
}

const stripEmoji = (text: string) =>
    text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();

const getPalette = (code: string) => {
    const normalized = (code || '').toLowerCase();
    if (normalized === 'checkup') return { tone: 'bg-emerald-50 text-emerald-600 border border-emerald-100', Icon: ClipboardList };
    if (normalized === 'transit') return { tone: 'bg-blue-50 text-blue-600 border border-blue-100', Icon: Car };
    if (normalized === 'training') return { tone: 'bg-purple-50 text-purple-600 border border-purple-100', Icon: GraduationCap };
    if (normalized === 'tasting') return { tone: 'bg-rose-50 text-rose-600 border border-rose-100', Icon: Wine };
    return { tone: 'bg-gray-50 text-gray-600 border border-gray-100', Icon: Briefcase };
};

export const FacilityActions: React.FC<FacilityActionsProps> = ({
    activities,
    onStart,
    title = 'Сценарии работы',
    description = 'Выберите сценарий',
    className = '',
    showHeader = true
}) => {
    return (
        <div className={`space-y-4 ${className}`}>
            {showHeader && (
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-[#1C1C1E] text-lg">{title}</h3>
                    <span className="text-[11px] text-gray-500">{description}</span>
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activities.map((act) => {
                    const { tone, Icon } = getPalette(act.code);
                    const cleanName = stripEmoji(act.name) || act.name;

                    return (
                        <motion.button
                            key={act.id}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => onStart(act.code)}
                            className="w-full bg-white border border-gray-200 shadow-sm rounded-2xl p-4 flex items-center justify-between gap-3 active:scale-[0.98] transition-all text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${tone}`}>
                                    <Icon size={20} />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-sm text-[#1C1C1E] leading-snug">{cleanName}</p>
                                    <p className="text-[11px] text-gray-500">Стартовать сценарий</p>
                                </div>
                            </div>
                            <ChevronRight size={16} className="text-gray-300 shrink-0" />
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};
