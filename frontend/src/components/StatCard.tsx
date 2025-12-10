import { motion } from 'framer-motion';

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ReactNode;
}

export const StatCard = ({ title, value, subtitle, icon }: StatCardProps) => {
    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass rounded-3xl p-5 shadow-sm"
        >
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
                {icon && <div className="text-ios-blue">{icon}</div>}
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            {subtitle && <div className="text-xs text-gray-400 mt-1">{subtitle}</div>}
        </motion.div>
    );
};
