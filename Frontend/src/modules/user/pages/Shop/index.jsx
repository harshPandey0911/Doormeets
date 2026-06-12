import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiClock, FiMapPin, FiCheckCircle, FiXCircle, FiLoader, FiCalendar, FiChevronRight, FiShoppingBag, FiBox } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { themeColors } from '../../../../theme';
import NotificationBell from '../../components/common/NotificationBell';
import { motion, AnimatePresence } from 'framer-motion';
import { bookingService } from '../../../../services/bookingService';

const UserShopPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();

    // Listen for real-time updates
    window.addEventListener('userBookingsUpdated', fetchBookings);
    return () => {
      window.removeEventListener('userBookingsUpdated', fetchBookings);
    };
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getUserBookings({});
      if (response.success) {
        setBookings(response.data || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const activeStatuses = ['pending', 'confirmed', 'in_progress', 'in-progress', 'journey_started', 'visited', 'awaiting_payment'];
  const historyStatuses = ['completed', 'cancelled', 'rejected', 'work_done'];

  const activeServices = bookings.filter(b => activeStatuses.includes(b.status));
  const historyServices = bookings.filter(b => historyStatuses.includes(b.status));

  const displayedServices = activeTab === 'active' ? activeServices : historyServices;

  const getStatusColor = (status) => {
    if (activeStatuses.includes(status)) return 'bg-blue-50 text-blue-600 border-blue-100';
    if (status === 'completed' || status === 'work_done') return 'bg-green-50 text-green-600 border-green-100';
    if (status === 'cancelled' || status === 'rejected') return 'bg-red-50 text-red-600 border-red-100';
    return 'bg-gray-50 text-gray-600 border-gray-100';
  };

  const getStatusLabel = (status) => {
    if (!status) return 'Unknown';
    switch (status) {
      case 'in_progress':
      case 'in-progress':
        return 'In Progress';
      case 'journey_started': return 'On The Way';
      case 'visited': return 'Arrived';
      case 'awaiting_payment': return 'Request Accepted';
      case 'work_done': return 'Work Completed';
      default: return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen pb-24 relative bg-white">
      {/* Refined Premium Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at top, #FFFFFF 0%, #F8F9FA 100%)'
          }}
        />
        {/* Elegant Dot Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(${themeColors?.brand?.teal || '#B33A35'} 0.8px, transparent 0.8px)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Modern Glassmorphism Header */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/40 border-b border-black/[0.03] px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-black/[0.02]"
            >
              <FiArrowLeft className="w-5 h-5 text-gray-800" />
            </button>
            <div className="flex items-center gap-2">
              <FiShoppingBag className="w-5 h-5 text-purple-500" />
              <h1 className="text-xl font-extrabold text-gray-900">My Shop</h1>
            </div>
          </div>
          <NotificationBell />
        </header>

        {/* Tabs */}
        <div className="flex bg-white border-b border-gray-200 sticky top-[73px] z-30">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-3.5 text-sm font-bold border-b-2 transition-all duration-200 ${activeTab === 'active'
              ? 'border-purple-500 text-purple-600 bg-purple-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
          >
            Active Services
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3.5 text-sm font-bold border-b-2 transition-all duration-200 ${activeTab === 'history'
              ? 'border-purple-500 text-purple-600 bg-purple-50/50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
          >
            History
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 animate-pulse">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <div className="h-3 w-20 bg-gray-200 rounded"></div>
                      <div className="h-5 w-40 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
                  </div>
                  <div className="pt-4 border-t border-gray-50">
                    <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : displayedServices.length === 0 ? (
            <div className="text-center py-20 px-6">
              <div className="bg-purple-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-5 border border-purple-100 shadow-sm">
                <FiBox className="w-8 h-8 text-purple-300" />
              </div>
              <p className="text-gray-900 font-bold text-lg mb-2">No {activeTab === 'active' ? 'Active' : 'Past'} Services</p>
              <p className="text-sm text-gray-500 max-w-[250px] mx-auto leading-relaxed">
                {activeTab === 'active' 
                  ? "You don't have any ongoing services at the moment."
                  : "You haven't completed any services yet."}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {displayedServices.map((service, index) => (
                <motion.div
                  key={service._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-[20px] shadow-sm p-5 border border-gray-100 active:scale-[0.98] transition-all cursor-pointer overflow-hidden relative group hover:shadow-md hover:border-purple-200"
                  onClick={() => navigate(`/user/booking/${service._id}`)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 pr-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-300"></span>
                        #{service.bookingNumber || service._id.substring(0, 8)}
                      </p>
                      <h3 className="font-extrabold text-gray-900 leading-tight text-[15px] group-hover:text-purple-600 transition-colors">
                        {service.serviceName || 'Service Request'}
                      </h3>
                      {service.bookedItems && service.bookedItems.length > 0 && (
                        <p className="text-xs font-medium text-gray-500 mt-1 line-clamp-1">
                          {service.bookedItems.map(item => item.card?.title || item.title).join(', ')}
                        </p>
                      )}
                    </div>
                    <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusColor(service.status)}`}>
                      {getStatusLabel(service.status)}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-bold text-gray-500">
                    <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                      <FiCalendar className="w-3.5 h-3.5 text-purple-500" />
                      <span>{formatDate(service.scheduledDate)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-purple-600 hover:text-purple-700">
                      <span>View Details</span>
                      <FiChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserShopPage;
