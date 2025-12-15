import React from 'react';
import { motion } from 'framer-motion';

interface FacilityRatingProps {
    score: number;
}

export const FacilityRating: React.FC<FacilityRatingProps> = ({ score }) => {
    // Circle config
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    // We want a semi-circle (180 degrees), so effective circumference is half?
    // Actually, let's do a full ring but partial fill.
    // Or easier: standard SVG donut.

    // Let's replicate the design: A gauge from left to right (180deg).
    // SVG Path for arc.

    // Simple approach: Full circle, stroke-dasharray.
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (score / 100) * circumference;

    const color = score > 80 ? 'text-green-500' : 'text-orange-500';

    return (
        <div className="bg-white p-4 rounded-[30px] shadow-sm border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="text-xs text-gray-400 uppercase font-bold mb-2 z-10 text-center">Наполненность точки</div>

            <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Track */}
                    <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="#f3f4f6"
                        strokeWidth="10"
                    />
                    {/* Indicator */}
                    <motion.circle
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke="currentColor"
                        strokeWidth="10"
                        strokeDasharray={circumference}
                        strokeLinecap="round"
                        className={score > 80 ? 'text-green-500' : 'text-orange-500'}
                    />
                </svg>

                <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className={`text-3xl font-black ${color}`}>
                        {score}%
                    </span>
                </div>
            </div>

            <div className="text-[10px] text-center text-gray-400 mt-2 max-w-[80%] mx-auto leading-tight">
                {score > 80 ? 'Отличные показатели!' : 'Требуется внимание к ассортименту'}
            </div>
        </div>
    );
};
