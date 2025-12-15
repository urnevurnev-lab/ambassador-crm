import React from 'react';
import { Camera, ClipboardCheck, Store, Truck, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';

interface Activity { id: number; code: string; name: string; }
interface FacilityActionsProps {
    activities: Activity[];
    onStart: (code: string) => void;
}

const getIcon = (code: string, name: string) => {
    const lower = (code + name).toLowerCase();
    if (lower.includes('transit') || lower.includes('проезд')) return Truck;
    if (lower.includes('open') || lower.includes('смена')) return Store; // Changed logic
    if (lower.includes('tast') || lower.includes('дегустация')) return ClipboardCheck; // Placeholder
    if (lower.includes('b2b')) return Briefcase;
    return Camera;
};

const getColor = (code: string) => {
    if (code === 'transit') return 'bg-blue-50 text-blue-600';
    if (code === 'open_shift') return 'bg-purple-50 text-purple-600';
    if (code === 'tasting') return 'bg-orange-50 text-orange-600';
    return 'bg-gray-50 text-gray-700';
}

export const FacilityActions: React.FC<FacilityActionsProps> = ({ activities, onStart }) => {
    return (
        <div className="space-y-3">
            <h3 className="font-bold text-[#1C1C1E] px-1 text-lg">Сценарии работы</h3>
            <div className="grid grid-cols-2 gap-3">
                {activities.map((act) => {
                    const Icon = getIcon(act.code, act.name);
                    const colorClass = getColor(act.code);

                    return (
                        <motion.button
                            key={act.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onStart(act.code)}
                            className={`p-4 rounded-[30px] flex flex-col items-start justify-between min-h-[100px] relative overflow-hidden group border border-transparent hover:border-black/5 transition-all shadow-sm ${colorClass} bg-opacity-60`}
                        >
                            <div className="flex justify-between w-full mb-3">
                                <div className={`p-2 rounded-xl bg-white/60 backdrop-blur-sm`}>
                                    <Icon size={20} />
                                </div>
                            </div>

                            <div className="flex items-center justify-between w-full">
                                <span className="font-bold text-sm leading-tight text-left">
                                    {act.name}
                                </span>
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};
