import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBriefcase, FiStar, FiCheckCircle, FiChevronRight, FiInfo, FiActivity } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { vendorTheme as themeColors } from '../../../../theme';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import vendorService from '../../services/vendorService';
import { vendorAuthService } from '../../../../services/authService';
import LogoLoader from '../../../../components/common/LogoLoader';

const MyServices = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [overallRating, setOverallRating] = useState(() => {
    const stored = JSON.parse(localStorage.getItem('vendorData') || '{}');
    return stored.rating || 0;
  });

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
        const [servicesRes, profileRes] = await Promise.allSettled([
          vendorService.getMyServices(),
          vendorAuthService.getProfile()
        ]);

        if (servicesRes.status === 'fulfilled' && servicesRes.value?.success) {
          setServices(servicesRes.value.data || []);
        }

        if (profileRes.status === 'fulfilled' && profileRes.value?.success) {
          const ratingVal = profileRes.value.vendor?.rating ?? 0;
          setOverallRating(ratingVal);
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

      <main className="px-3.5 py-4 max-w-lg mx-auto">
        {/* Stats Header */}
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <div className="bg-white rounded-md p-2.5 border border-gray-100 shadow-2xs">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Total Expertise</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-gray-900">{services.length}</span>
              <span 
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                style={{
                  backgroundColor: `${themeColors.button}15`,
                  color: themeColors.button
                }}
              >
                Categories
              </span>
            </div>
          </div>
          <div 
            onClick={() => navigate('/vendor/my-ratings')}
            className="bg-white rounded-md p-2.5 border border-gray-100 shadow-2xs cursor-pointer hover:border-amber-200 transition-all active:scale-95"
          >
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Overall Rating</p>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-gray-900">
                {Number(overallRating || 0).toFixed(1)}
              </span>
              <FiStar className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
            <h2 className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400">Authorized Portfolios</h2>
          </div>
        </div>

        {/* Services List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mb-3" style={{ borderColor: `${themeColors.button} transparent ${themeColors.button} ${themeColors.button}` }}></div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Loading Portfolio...</p>
          </div>
        ) : services.length === 0 ? (
          <div className="bg-white rounded-md p-6 text-center border border-gray-100 shadow-2xs mb-4">
            <div className="w-14 h-14 mx-auto mb-4 bg-gray-50 rounded-md flex items-center justify-center text-gray-300">
              <FiBriefcase className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-800 mb-1">No Services Yet</h3>
            <p className="text-[11px] text-gray-500 font-semibold">Contact admin to get assigned categories</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {services.map((service, index) => (
              <motion.div
                key={service.id || index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="group relative bg-white rounded-md p-0.5 border border-gray-100 shadow-2xs hover:shadow-xs transition-all duration-300"
              >
                <div className="flex p-2.5 gap-2.5">
                  {/* Service Image/Icon */}
                  <div className="relative w-14 h-14 rounded-md overflow-hidden shrink-0 shadow-2xs">
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
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h3 className="text-xs md:text-sm font-bold text-gray-900 truncate tracking-tight">{service.title}</h3>
                          <span className="shrink-0 text-[8px] font-bold uppercase tracking-wide text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                            {service.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.5 rounded-md shrink-0">
                          <span className="text-[9px] font-bold text-amber-600">{service.stats.rating}</span>
                          <FiStar className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5 leading-normal font-medium">
                        {service.description || `High-quality ${service.title} services for your professional needs.`}
                      </p>
                    </div>
 
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex gap-2.5">
                        <div className="flex items-baseline gap-1">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Jobs</span>
                          <span className="text-xs font-bold text-gray-800">{service.stats.totalJobs}</span>
                        </div>
                        <div className="w-[1px] h-3.5 bg-gray-200 self-center" />
                        <div className="flex items-baseline gap-1">
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Done</span>
                          <span className="text-xs font-bold text-orange-600">{service.stats.completedJobs}</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => navigate(`/vendor/jobs?category=${service.title}`)}
                        className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-orange-500 hover:text-white transition-all duration-200 active:scale-95 border border-gray-100"
                      >
                        <FiChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Info Card */}
        <div className="mt-5 p-4 bg-red-50/60 rounded-md border border-red-100 shadow-2xs">
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-md bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
              <FiInfo className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <h4 className="text-xs md:text-sm font-bold text-red-900">Need more categories?</h4>
              <p className="text-[10px] md:text-xs text-red-700 mt-1 font-medium leading-relaxed">
                Your service portfolio is managed by the administrator. To add new skills or service categories, please raise a support ticket.
              </p>
              <button 
                onClick={() => navigate('/vendor/support')}
                className="mt-2 text-[10px] font-bold uppercase tracking-widest text-red-700 underline"
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
