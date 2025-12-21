import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, List, Search, Plus } from 'lucide-react';
import apiClient from '../api/apiClient';

interface Facility {
  id: number;
  name: string;
  address: string;
  city: string | null;
  score: number;
  isVerified: boolean;
  daysSinceLastVisit: number | null;
}


const WorkHubPage: React.FC = () => {
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const res = await apiClient.get('/api/facilities');
        setFacilities(res.data);
      } catch (err) {
        console.error("Link_Err:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFacilities();
  }, []);

  const filtered = facilities.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pb-24 animate-in fade-in duration-700">
      <div className="flex justify-between items-center py-6">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-black">Work Hub</h1>
          <p className="text-[15px] text-[#86868B] font-medium">Facility management</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/facility/new')}
          className="w-12 h-12 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg active:opacity-90"
        >
          <Plus size={24} />
        </motion.button>
      </div>

      {/* SEARCH BAR SOFT STYLE */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868B]" size={20} />
        <input
          type="text"
          placeholder="Search location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white rounded-[24px] h-[54px] pl-12 pr-4 shadow-soft text-[16px] outline-none border-2 border-transparent focus:border-black/5 transition-all"
        />
      </div>

      {/* VIEW SELECTOR */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <button className="bg-black text-white h-[44px] rounded-full text-[14px] font-bold flex items-center justify-center gap-2">
          <List size={18} /> List View
        </button>
        <button className="bg-white text-black h-[44px] rounded-full text-[14px] font-bold flex items-center justify-center gap-2 shadow-soft opacity-60">
          <MapPin size={18} /> Map View
        </button>
      </div>

      {/* FACILITY LIST */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10">
            <div className="w-8 h-8 border-4 border-white border-t-black rounded-full animate-spin mx-auto mb-2" />
            <span className="text-[13px] font-bold text-[#86868B] uppercase tracking-wide">Syncing...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[32px] shadow-soft">
            <p className="text-[15px] font-medium text-[#86868B]">No matches found</p>
          </div>
        ) : (
          filtered.map((facility) => (
            <motion.div
              key={facility.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/facility/${facility.id}`)}
              className="bg-white rounded-[32px] p-6 shadow-soft cursor-pointer border border-transparent hover:border-black/5 transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-[18px] font-bold text-black leading-tight">
                  {facility.name}
                </h3>
                <div className={`text-[11px] font-bold px-3 py-1 rounded-full ${facility.isVerified ? 'bg-[#F5F5F7] text-black' : 'bg-black text-white'}`}>
                  {facility.isVerified ? 'VERIFIED' : 'PENDING'}
                </div>
              </div>

              <p className="text-[14px] font-medium text-[#86868B] mb-5 line-clamp-1">
                {facility.address}
              </p>

              <div className="flex justify-between items-center pt-4 border-t border-[#F5F5F7]">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-wide">Last Visit</span>
                  <span className="text-[15px] text-black font-bold">
                    {facility.daysSinceLastVisit !== null ? `${facility.daysSinceLastVisit}d ago` : 'None'}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[11px] font-bold text-[#86868B] uppercase tracking-wide">Score</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-black" />
                    <span className="text-[15px] text-black font-bold">
                      {facility.score}%
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default WorkHubPage;