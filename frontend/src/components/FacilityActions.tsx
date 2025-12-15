import React from 'react';
import { Camera, PackageCheck, ClipboardList, Play } from 'lucide-react';
import { motion } from 'framer-motion';

interface Activity { id: number; code: string; name: string; }
interface FacilityActionsProps {
    activities: Activity[];
    onStart: (code: string) => void;
}

const ICONS: Record<string, React.ElementType> = {
    'photo': Camera,
    'order': PackageCheck,
    'inventory': ClipboardList,
    'default': Play
};

export const FacilityActions: React.FC<FacilityActionsProps> = ({ activities, onStart }) => {
    return (
        <div className="space-y-3">
            <h3 className="font-bold text-[#1C1C1E] px-1 text-lg">Сценарии работы</h3>
            <div className="grid grid-cols-2 gap-3">
                {activities.map((act) => {
                    // Пытаемся угадать иконку по коду или имени
                    let Icon = ICONS['default'];
                    if (act.code.includes('photo') || act.name.toLowerCase().includes('фото')) Icon = ICONS['photo'];
                    else if (act.code.includes('order') || act.name.toLowerCase().includes('заказ')) Icon = ICONS['order'];
                    else if (act.code.includes('check') || act.name.toLowerCase().includes('инвент')) Icon = ICONS['inventory'];

                    return (
                        <motion.button
                            key={act.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onStart(act.code)}
                            className="bg-[#1C1C1E] p-4 rounded-[24px] flex flex-col items-start justify-between h-[120px] shadow-lg relative overflow-hidden group"
                        >
                            <div className="absolute right-[-10px] top-[-10px] bg-white/10 w-16 h-16 rounded-full blur-xl group-hover:bg-white/20 transition" />

                            <div className="bg-white/20 p-2 rounded-xl text-white">
                                <Icon size={24} />
                            </div>
                            <span className="text-white font-semibold text-left leading-tight text-sm">
                                {act.name}
                            </span>
                        </motion.button>
                    );
                })}
                {activities.length === 0 && (
                    <div className="col-span-2 text-center text-gray-400 py-8 bg-white rounded-3xl border border-gray-100 border-dashed">
                        Нет доступных сценариев
                    </div>
                )}
            </div>
        </div>
    );
};
