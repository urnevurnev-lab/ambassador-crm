import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StandardCard } from '../components/ui/StandardCard';
import { motion, AnimatePresence } from 'framer-motion';
import WebApp from '@twa-dev/sdk';
import apiClient from '../api/apiClient';

interface Facility {
  id: number;
  name: string;
  address: string;
  city: string | null;
  isVerified: boolean;
  daysSinceLastVisit: number | null;
  score: number;
}

interface Order {
  id: number;
  status: string;
  facility: { name: string };
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = WebApp.initDataUnsafe?.user;

  const [forgottenVenues, setForgottenVenues] = useState<Facility[]>([]);
  const [unverifiedVenues, setUnverifiedVenues] = useState<Facility[]>([]);
  const [rejectedOrders, setRejectedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      await new Promise(r => setTimeout(r, 600));
      const [facRes, orderRes] = await Promise.all([
        apiClient.get('/api/facilities'),
        apiClient.get('/api/orders/my-history')
      ]);

      const allFacs = facRes.data as Facility[];

      setForgottenVenues(allFacs
        .filter(f => f.isVerified && (f.daysSinceLastVisit === null || f.daysSinceLastVisit >= 7))
        .slice(0, 3));

      setUnverifiedVenues(allFacs.filter(f => !f.isVerified).slice(0, 2));
      setRejectedOrders((orderRes.data as Order[]).filter(o => o.status === 'REJECTED').slice(0, 2));

    } catch (error) {
      console.error("Sys.Err:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerify = async (id: number) => {
    try {
      await apiClient.patch(`/api/facilities/${id}`, { isVerified: true });
      fetchData();
      WebApp.HapticFeedback.notificationOccurred('success');
    } catch (error) {
      WebApp.HapticFeedback.notificationOccurred('error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-[#F5F5F7] border-t-black rounded-full"
        />
        <p className="text-[13px] font-bold text-[#86868B] uppercase tracking-wide">Loading Dashboard...</p>
      </div>
    );
  }

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center py-6 mt-4">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-black leading-tight">
            {getTimeGreeting()},<br />
            {user?.first_name || 'Partner'}
          </h1>
          <p className="text-[15px] text-[#86868B] font-medium mt-1">
            Here's what's happening today.
          </p>
        </div>

        <motion.div
          onClick={() => navigate('/profile')}
          whileTap={{ scale: 0.95 }}
          className="w-14 h-14 bg-white rounded-2xl shadow-soft flex items-center justify-center cursor-pointer overflow-hidden border border-white"
        >
          {user?.photo_url ? (
            <img src={user.photo_url} alt="User" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl text-[#86868B]">👤</span>
          )}
        </motion.div>
      </div>

      {/* Alerts - Dark Bento Style */}
      <AnimatePresence>
        {(forgottenVenues.length > 0 || rejectedOrders.length > 0 || unverifiedVenues.length > 0) && (
          <div className="space-y-4">
            {unverifiedVenues.map(venue => (
              <StandardCard
                key={`v-${venue.id}`}
                variant="dark"
                title="Action Required"
                subtitle="Verify Location"
              >
                <p className="text-[14px] text-white/70 mb-6 font-medium leading-normal">
                  {venue.name} — {venue.address}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleVerify(venue.id)}
                    className="flex-1 bg-white text-black text-[14px] font-bold py-3.5 rounded-2xl active:opacity-80 transition-opacity"
                  >
                    Confirm
                  </button>
                  <button className="flex-1 bg-white/10 text-white text-[14px] font-bold py-3.5 rounded-2xl active:opacity-80 transition-opacity">
                    Later
                  </button>
                </div>
              </StandardCard>
            ))}

            {rejectedOrders.map(order => (
              <StandardCard
                key={`o-${order.id}`}
                variant="dark"
                onClick={() => navigate('/my-orders')}
                title="System Alert"
                subtitle={`Order #${order.id} Rejected`}
                className="cursor-pointer"
              >
                <p className="text-[14px] text-white/70 font-medium">{order.facility.name}</p>
              </StandardCard>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Large Widget */}
        <div className="col-span-2">
          <StandardCard
            title="Overview"
            subtitle="Work Space"
            onClick={() => navigate('/work')}
            className="h-[200px] flex flex-col justify-end bg-gradient-to-br from-white to-[#F9F9FB]"
          >
            <div className="absolute top-6 right-6 text-5xl opacity-20">📍</div>
            <p className="text-[15px] font-medium text-[#86868B]">Manage Facilities & Map</p>
          </StandardCard>
        </div>

        {/* Small Widgets */}
        <StandardCard
          title="Analytics"
          subtitle="KPI Stats"
          onClick={() => navigate('/visits-history')}
          className="h-[180px] flex flex-col justify-end"
        >
          <p className="text-[13px] font-medium text-[#86868B]">Performance tracking</p>
        </StandardCard>

        <StandardCard
          title="Database"
          subtitle="Order Logs"
          onClick={() => navigate('/my-orders')}
          className="h-[180px] flex flex-col justify-end"
        >
          <p className="text-[13px] font-medium text-[#86868B]">History & status</p>
        </StandardCard>

        <div className="col-span-2">
          <StandardCard
            title="Schedule"
            subtitle="Team Calendar"
            onClick={() => navigate('/calendar')}
            className="flex items-center justify-between"
          >
            <p className="text-[15px] font-medium text-[#86868B]">View upcoming events</p>
            <div className="w-10 h-10 bg-[#F5F5F7] rounded-full flex items-center justify-center text-xl">📅</div>
          </StandardCard>
        </div>
      </div>

      {/* Forgotten Venues as a separate section */}
      {forgottenVenues.length > 0 && (
        <div className="space-y-4 pt-2">
          <h2 className="text-[13px] font-bold text-[#86868B] uppercase tracking-wide px-2">Needs Attention</h2>
          {forgottenVenues.map(venue => (
            <StandardCard
              key={`f-${venue.id}`}
              onClick={() => navigate(`/facility/${venue.id}`)}
              className="py-4 px-6 flex justify-between items-center cursor-pointer"
            >
              <div>
                <h3 className="text-[17px] font-bold text-black">{venue.name}</h3>
                <p className="text-[14px] font-medium text-[#86868B] mt-0.5">
                  Inactive: {venue.daysSinceLastVisit || '??'} Days
                </p>
              </div>
              <div className="w-10 h-10 bg-[#F5F5F7] rounded-full flex items-center justify-center">
                <span className="text-black font-bold">→</span>
              </div>
            </StandardCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;