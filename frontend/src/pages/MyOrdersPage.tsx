import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/PageHeader';
import { ChevronDown, ChevronUp, Package, Clock, XCircle, CheckCircle, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../api/apiClient';

interface OrderItem {
    id: number;
    quantity: number;
    product: {
        flavor: string;
        line: string;
        price: number;
    };
}

interface Order {
    id: number;
    status: 'PENDING' | 'SHIPPED' | 'REJECTED' | string;
    createdAt: string;
    facility: { name: string; address: string };
    items: OrderItem[];
}

export const MyOrdersPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        apiClient
            .get('/api/orders/my-history')
            .then((res) => setOrders(res.data || []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const toggleExpand = (id: number) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const getOrderTotal = (items: OrderItem[]) =>
        items.reduce((acc, item) => acc + (item.product.price || 0) * item.quantity, 0);

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
        });

    const formatMoney = (val: number) => new Intl.NumberFormat('ru-RU').format(val);

    return (
        <Layout>
            <div className="pt-2 px-4 pb-32 space-y-4">
                <PageHeader title="Мои заказы" back />

                {loading ? (
                    <div className="text-center text-gray-400 py-10">Загрузка истории...</div>
                ) : orders.length === 0 ? (
                    <div className="text-center text-gray-400 py-10">
                        <Package size={48} className="mx-auto mb-4 opacity-20" />
                        История пуста
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.map((order) => {
                            const total = getOrderTotal(order.items);
                            const isExpanded = expandedIds.has(order.id);

                            const statusConfig =
                                {
                                    PENDING: { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: Clock, label: 'В обработке' },
                                    SHIPPED: { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle, label: 'Принят' },
                                    APPROVED: { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle, label: 'Принят' },
                                    REJECTED: { color: 'text-red-500', bg: 'bg-red-50', icon: XCircle, label: 'Отклонен' },
                                }[order.status] || { color: 'text-gray-500', bg: 'bg-gray-50', icon: Clock, label: order.status };

                            const StatusIcon = statusConfig.icon;

                            return (
                                <motion.div
                                    layout
                                    key={order.id}
                                    className={`bg-white rounded-[24px] overflow-hidden shadow-sm border ${
                                        isExpanded ? 'border-gray-300' : 'border-gray-100'
                                    }`}
                                >
                                    <div
                                        onClick={() => toggleExpand(order.id)}
                                        className="p-5 flex items-center justify-between cursor-pointer active:bg-gray-50 transition-colors"
                                    >
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <div
                                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 ${statusConfig.bg} ${statusConfig.color}`}
                                                >
                                                    <StatusIcon size={10} />
                                                    {statusConfig.label}
                                                </div>
                                                <span className="text-xs text-gray-400 font-medium">
                                                    #{order.id} • {formatDate(order.createdAt)}
                                                </span>
                                            </div>
                                            <div className="font-bold text-[#1C1C1E] text-lg leading-tight mb-1">
                                                {order.facility.name}
                                            </div>
                                            <div className="text-xs text-gray-400 flex items-center gap-1">
                                                <MapPin size={10} />
                                                <span className="truncate max-w-[220px]">{order.facility.address}</span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div
                                                className={`text-lg font-bold ${
                                                    order.status === 'REJECTED' ? 'text-gray-300 line-through' : 'text-[#1C1C1E]'
                                                }`}
                                            >
                                                {formatMoney(total)} ₽
                                            </div>
                                            <div className="mt-1 flex justify-end text-gray-300">
                                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </div>
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="bg-gray-50 border-t border-gray-100"
                                            >
                                                <div className="p-5 space-y-3">
                                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                                                        Состав заказа
                                                    </div>
                                                    {order.items.map((item) => (
                                                        <div key={item.id} className="flex justify-between items-center text-sm">
                                                            <div>
                                                                <span className="font-medium text-[#1C1C1E]">{item.product.flavor}</span>
                                                                <span className="text-gray-400 ml-2 text-xs">({item.product.line})</span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-bold text-gray-600 bg-white px-2 py-0.5 rounded-md border border-gray-200 text-xs">
                                                                    {item.quantity} шт
                                                                </span>
                                                                <span className="w-16 text-right font-medium text-gray-500">
                                                                    {formatMoney((item.product.price || 0) * item.quantity)} ₽
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    <div className="border-t border-gray-200 mt-4 pt-3 flex justify-between items-center">
                                                        <span className="font-bold text-gray-500">Итого</span>
                                                        <span className="font-bold text-xl text-[#1C1C1E]">
                                                            {formatMoney(total)} ₽
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default MyOrdersPage;
