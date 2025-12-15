import React from 'react';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface FacilityRatingProps {
    score: number;
}

export const FacilityRating: React.FC<FacilityRatingProps> = ({ score }) => {
    const data = [{ name: 'Rating', value: score, fill: score > 80 ? '#22c55e' : '#f97316' }];

    return (
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center h-full relative overflow-hidden">
            <div className="text-xs text-gray-400 uppercase font-bold mb-1 z-10 text-center">Наполненность точки нашим продуктом</div>

            <div className="w-full h-[120px] relative z-10 -my-2">
                <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                        innerRadius="80%"
                        outerRadius="100%"
                        barSize={10}
                        data={data}
                        startAngle={180}
                        endAngle={0}
                    >
                        <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                        <RadialBar background dataKey="value" cornerRadius={10} />
                    </RadialBarChart>
                </ResponsiveContainer>
                {/* Центральное число */}
                <div className="absolute inset-0 flex items-center justify-center pt-8">
                    <span className={`text-3xl font-black ${score > 80 ? 'text-green-500' : 'text-orange-500'}`}>
                        {score}%
                    </span>
                </div>
            </div>

            <div className="text-[10px] text-center text-gray-400 mt-1 max-w-[80%] mx-auto leading-tight">
                {score > 80 ? 'Отличные показатели!' : 'Требуется внимание к ассортименту'}
            </div>
        </div>
    );
};
