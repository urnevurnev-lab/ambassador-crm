import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Car, ChevronRight, ClipboardList, GraduationCap, Wine } from 'lucide-react';

interface Activity { id: number; code: string; name: string; }
interface FacilityActionsProps { activities: Activity[]; onStart: (code: string) => void; showHeader?: boolean; }

const getPalette = (code: string) => {
    if (code === 'checkup') return { bg: 'bg-emerald-100', text: 'text-emerald-700', Icon: ClipboardList };
    if (code === 'transit') return { bg: 'bg-blue-100', text: 'text-blue-700', Icon: Car };
    if (code === 'training') return { bg: 'bg-purple-100', text: 'text-purple-700', Icon: GraduationCap };
    if (code === 'tasting') return { bg: 'bg-rose-100', text: 'text-rose-700', Icon: Wine };
    return { bg: 'bg-gray-100', text: 'text-gray-700', Icon: Briefcase };
};

export const FacilityActions: React.FC<FacilityActionsProps> = ({ activities, onStart, showHeader }) => (
    <div className="space-y-3">
        {showHeader && <h3 className="font-bold text-lg px-1">Сценарии</h3>}
        {activities.map(act => {
            const { bg, text, Icon } = getPalette(act.code);
            return (
                <motion.button key={act.id} whileTap={{ scale: 0.98 }} onClick={() => onStart(act.code)} className="w-full bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bg} ${text}`}><Icon size={24}/></div>
                        <div className="text-left"><div className="font-bold text-[#1C1C1E]">{act.name}</div><div className="text-xs text-gray-400">Начать</div></div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400"><ChevronRight size={18}/></div>
                </motion.button>
            );
        })}
    </div>
);