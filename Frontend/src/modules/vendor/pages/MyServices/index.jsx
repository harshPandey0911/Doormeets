import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBriefcase, FiStar, FiCheckCircle, FiChevronRight, FiInfo, FiActivity } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { vendorTheme as themeColors } from '../../../../theme';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import vendorService from '../../services/vendorService';
import LogoLoader from '../../../../components/common/LogoLoader';

const MyServices = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useLayoutEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    const bgStyle = themeColors.backgroundGradient;

    if (html) html.style.background = bgStyle;
    if (body) body.style.background = bgStyle;
    if (root) root.style.background = bgStyle;

    return () => {
      if (html) html.style.background = '';
      if (body) body.style.background = '';
      if (root) root.style.background = '';
    };
  }, []);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        const res = await vendorService.getMyServices();
        if (res.success) {
          setServices(res.data || []);
        }
      } catch (error) {
        console.error('Error loading services:', error);
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  return (
    <div className="min-h-screen pb-24" style={{ background: themeColors.backgroundGradient }}>
      <Header title="My Services" showBack={true} />

      <main className="px-4 py-6 max-w-lg mx-auto">
        {/* Stats Header */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/60 backdrop-blur-md rounded-2xl p-3 border border-white/40 shadow-sm">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Total Expertise</p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-semibold text-gray-900">{services.length}</span>
              <span 
                className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${themeColors.button}15`,
                  color: themeColors.button
                }}
              >
                Categories
              </span>
            </div>
          </div>
          <div className="bg-white/60 backdrop-blur-md rounded-2xl p-3 border border-white/40 shadow-sm">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Overall Rating</p>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-semibold text-gray-900">
                {services.length > 0 
                  ? (services.reduce((acc, s) => acc + s.stats.rating, 0) / services.length).toFixed(1) 
                  : '0.0'}
              </span>
              <FiStar className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
            <h2 className="text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-400">Authorized Portfolios</h2>
          </div>
        </div>

        {/* Services List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mb-4" style={{ borderColor: `${themeColors.button} transparent ${themeColors.button} ${themeColors.button}` }}></div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading Portfolio...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-12 text-center border border-white/40 shadow-xl">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300">
              <FiBriefcase className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Services Yet</h3>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Contact admin to get assigned categories</p>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((service, index) => (
              <motion.div
                key={service.id || index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="group relative bg-white/80 backdrop-blur-lg rounded-2xl p-0.5 border border-white/40 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex p-3 gap-3">
                  {/* Service Image/Icon */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-sm">
                    <img 
                      src={service.imageUrl || service.iconUrl || 'https://via.placeholder.com/150'} 
                      alt={service.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
 
                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 truncate tracking-tight">{service.title}</h3>
                          <span className="shrink-0 text-[8px] font-semibold uppercase tracking-wide text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                            {service.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded shrink-0">
                          <span className="text-[9px] font-semibold text-amber-600">{service.stats.rating}</span>
                          <FiStar className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5 leading-normal font-medium">
                        {service.description || `High-quality ${service.title} services for your professional needs.`}
                      </p>
                    </div>
 
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex gap-3">
                        <div className="flex items-baseline gap-1">
                          <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-tighter">Jobs</span>
                          <span className="text-xs font-semibold text-gray-800">{service.stats.totalJobs}</span>
                        </div>
                        <div className="w-[1px] h-3.5 bg-gray-200 self-center" />
                        <div className="flex items-baseline gap-1">
                          <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-tighter">Done</span>
                          <span className="text-xs font-semibold text-orange-600">{service.stats.completedJobs}</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => navigate(`/vendor/jobs?category=${service.title}`)}
                        className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-orange-500 hover:text-white transition-all duration-200 active:scale-95 border border-gray-100"
                      >
                        <FiChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Info Card */}
        <div className="mt-10 p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
              <FiInfo className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-900">Need more categories?</h4>
              <p className="text-[10px] text-blue-700 mt-1 font-medium leading-relaxed">
                Your service portfolio is managed by the administrator. To add new skills or service categories, please raise a support ticket.
              </p>
              <button 
                onClick={() => navigate('/vendor/support')}
                className="mt-3 text-[10px] font-semibold uppercase tracking-widest text-blue-600 underline"
              >
                Open Support Ticket
              </button>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default MyServices;
