import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiClock, FiMapPin, FiCheckCircle, FiXCircle, FiLoader, FiCalendar, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { themeColors } from '../../../../theme';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import NotificationBell from '../../components/common/NotificationBell';
import { motion } from 'framer-motion';
import { bookingService } from '../../../../services/bookingService';
import api from '../../../../services/api';

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, confirmed, in-progress, completed, cancelled

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoading(true);
        const params = {};
        if (filter !== 'all') {
          params.status = filter;
        }
        
        // Fetch Service Bookings
        const response = await bookingService.getUserBookings(params);
        let serviceBookings = response.success ? (response.data || []) : [];

        // Sort by date
        const sorted = serviceBookings.sort((a, b) => 
          new Date(b.createdAt || b.scheduledDate) - new Date(a.createdAt || a.scheduledDate)
        );

        setBookings(sorted);

      } catch (error) {
        toast.error('Failed to load bookings. Please try again.');
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    loadBookings();

    // Listen for real-time updates
    window.addEventListener('userBookingsUpdated', loadBookings);

    return () => {
      window.removeEventListener('userBookingsUpdated', loadBookings);
    };
  }, [filter]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <FiCheckCircle className="w-3.5 h-3.5" />;
      case 'in_progress':
      case 'in-progress':
        return <FiLoader className="w-3.5 h-3.5 animate-spin" />;
      case 'journey_started':
      case 'visited':
        return <FiMapPin className="w-3.5 h-3.5 text-blue-500" />;
      case 'completed':
        return <FiCheckCircle className="w-3.5 h-3.5" />;
      case 'cancelled':
      case 'rejected':
        return <FiXCircle className="w-3.5 h-3.5" />;
      case 'awaiting_payment':
      default:
        return <FiClock className="w-3.5 h-3.5" />;
    }
  };

  const getStatusBorderColor = (status) => {
    switch (status) {
      case 'confirmed': return '!border-l-emerald-500';
      case 'in_progress':
      case 'in-progress':
      case 'journey_started':
      case 'visited':
        return '!border-l-[#FFB86C]';
      case 'completed': return '!border-l-[#FF9F45]';
      case 'cancelled':
      case 'rejected': return '!border-l-rose-500';
      case 'awaiting_payment': return '!border-l-amber-500';
      default: return '!border-l-gray-300';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-emerald-500 text-white border-transparent ring-emerald-500';
      case 'in_progress':
      case 'in-progress':
      case 'journey_started':
      case 'visited':
        return 'bg-[#FFB86C] text-white border-transparent ring-[#FFB86C]';
      case 'completed':
        return 'bg-gradient-to-r from-[#FF9F45] to-[#FFB86C] text-white border-transparent ring-[#FF9F45]';
      case 'cancelled':
      case 'rejected':
        return 'bg-rose-500 text-white border-transparent ring-rose-500';
      case 'awaiting_payment':
        return 'bg-amber-500 text-white border-transparent ring-amber-500';
      default:
        return 'bg-gray-500 text-white border-transparent ring-gray-500';
    }
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

  const handleBookingClick = (booking) => {
    navigate(`/user/booking/${booking._id || booking.id}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  const getAddressString = (address) => {
    if (typeof address === 'string') return address;
    if (address && typeof address === 'object') {
      const parts = [
        address.addressLine1,
        address.addressLine2,
        address.city
      ].filter(Boolean);
      return parts.join(', ');
    }
    return 'Detailed Address';
  };

  return (
    <div className="min-h-screen pb-24 relative bg-transparent">
      {/* Refined Brand Mesh Gradient Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0"
          style={{
            background: `
              radial-gradient(at 0% 0%, ${themeColors?.brand?.teal || '#347989'}25 0%, transparent 70%),
              radial-gradient(at 100% 0%, ${themeColors?.brand?.yellow || '#D68F35'}20 0%, transparent 70%),
              radial-gradient(at 100% 100%, ${themeColors?.brand?.orange || '#BB5F36'}15 0%, transparent 75%),
              radial-gradient(at 0% 100%, ${themeColors?.brand?.teal || '#347989'}10 0%, transparent 70%),
              radial-gradient(at 50% 50%, ${themeColors?.brand?.teal || '#347989'}03 0%, transparent 100%),
              #FFFFFF
            `
          }}
        />
        {/* Elegant Dot Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `radial-gradient(${themeColors?.brand?.teal || '#347989'} 0.8px, transparent 0.8px)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Modern Glassmorphism Header */}
        <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-transparent border-b border-black/[0.03] px-4 py-4 flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-black/[0.02]"
            >
              <FiArrowLeft className="w-5 h-5 text-gray-800" />
            </button>
            <h1 className="text-xl font-bold text-[#111827] tracking-tight">My Bookings</h1>
          </div>
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-black/[0.02] relative">
            <NotificationBell />
          </div>
        </header>

        {/* Filter Tabs */}
        <div className="bg-white border-b border-slate-100 fixed top-[72px] left-0 right-0 z-30 shadow-[0_4px_20px_-16px_rgba(0,0,0,0.1)] w-full">
          <div className="flex overflow-x-auto px-4 py-3 gap-2.5 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              { id: 'all', label: 'All Bookings' },
              { id: 'confirmed', label: 'Confirmed' },
              { id: 'in-progress', label: 'In Progress' },
              { id: 'completed', label: 'Completed' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 border ${filter === tab.id
                  ? 'border-transparent text-white shadow-lg shadow-blue-500/25 active:scale-95'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                style={filter === tab.id ? { backgroundColor: themeColors.button } : {}}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        <main className="px-4 pt-[150px] pb-5 max-w-lg mx-auto w-full">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm animate-pulse">
                  <div className="flex justify-between mb-4 border-b border-slate-100 pb-4">
                    <div className="space-y-2">
                      <div className="h-3 w-20 bg-slate-200 rounded"></div>
                      <div className="h-5 w-48 bg-slate-200 rounded"></div>
                    </div>
                    <div className="h-6 w-24 bg-slate-200 rounded-full"></div>
                  </div>
                  <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-4 mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                    <div className="space-y-1.5 py-1">
                      <div className="h-2.5 w-16 bg-slate-200 rounded"></div>
                      <div className="h-3.5 w-32 bg-slate-200 rounded"></div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                    <div className="space-y-1.5 py-1">
                      <div className="h-2.5 w-16 bg-slate-200 rounded"></div>
                      <div className="h-3.5 w-40 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                  <div className="flex justify-between pt-4 border-t border-slate-200">
                    <div className="space-y-1">
                      <div className="h-2.5 w-16 bg-slate-200 rounded"></div>
                      <div className="h-6 w-24 bg-slate-200 rounded"></div>
                    </div>
                    <div className="h-9 w-28 bg-slate-200 rounded-lg"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center px-6"
            >
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100 shadow-sm">
                <FiClock className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-slate-900 text-lg font-bold mb-2">No Bookings Found</h3>
              <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                {filter === 'all'
                  ? "Looks like you haven't booked any services yet. Explore our services to get started!"
                  : `You don't have any ${filter.replace('-', ' ')} bookings at the moment.`}
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1 }
                }
              }}
              className="space-y-4"
            >
              {bookings.map((booking) => (
                <motion.div
                  key={booking._id || booking.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { type: "spring", stiffness: 100, damping: 15 }
                    }
                  }}
                  onClick={() => handleBookingClick(booking)}
                  className={`group relative bg-white rounded-xl p-3 border border-slate-200 border-l-4 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] hover:shadow-[0_6px_16px_-6px_rgba(0,0,0,0.06)] hover:border-[#FF9F45]/30 active:scale-[0.99] transition-all duration-300 cursor-pointer overflow-hidden ${getStatusBorderColor(booking.status)}`}
                >
                  {/* Decorative Elements */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-slate-50 via-transparent to-transparent -z-0 opacity-35" />

                  {/* Header Section */}
                  <div className="relative z-10 flex items-start justify-between mb-2">
                    <div className="pr-3 flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[9px] font-bold text-slate-400">
                          #{booking.bookingNumber || (booking._id || booking.id).substring(0, 8)}
                        </span>
                        {booking.serviceCategory && (
                          <span className="text-[8px] font-bold text-[#FF9F45] bg-[#FF9F45]/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            {booking.serviceCategory}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-[#111827] leading-tight line-clamp-1 group-hover:text-[#FF9F45] transition-colors">
                        {(booking.serviceName || 'Service Request')}
                      </h3>

                      {booking.bookedItems && booking.bookedItems.length > 0 && (
                        <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {booking.bookedItems.map(item => item.card?.title || item.title).join(', ')}
                        </p>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className={`shrink-0 px-2 py-0.5 rounded-full border ring-1 ring-inset flex items-center gap-1 shadow-sm ${getStatusColor(booking.status)}`}>
                      {getStatusIcon(booking.status)}
                      <span className="text-[9px] font-bold uppercase tracking-wide">
                        {getStatusLabel(booking.status)}
                      </span>
                    </div>
                  </div>

                  {/* Inline Details Row */}
                  <div className="relative z-10 flex flex-wrap items-center gap-x-3 gap-y-1 mb-2.5 text-[11px] text-slate-500 border-t border-slate-100/80 pt-2">
                    <div className="flex items-center gap-1">
                      <FiCalendar className="w-3.5 h-3.5 text-[#FF9F45] shrink-0" />
                      <span className="font-semibold text-slate-700">{formatDate(booking.scheduledDate)}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-600">{booking.scheduledTime || booking.timeSlot?.start || 'N/A'}</span>
                    </div>
                    <div className="hidden sm:inline text-slate-300">|</div>
                    <div className="flex items-center gap-1 min-w-0 flex-1 sm:flex-initial">
                      <FiMapPin className="w-3.5 h-3.5 text-[#FFB86C] shrink-0" />
                      <span className="truncate max-w-[200px] sm:max-w-xs">{getAddressString(booking.address)}</span>
                    </div>
                  </div>

                  {/* Footer Section */}
                  <div className="relative z-10 flex items-center justify-between pt-2 border-t border-slate-100/80">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Payable:</span>
                      <p className="text-base font-bold text-[#111827] flex items-baseline gap-0.5">
                        <span className="text-xs font-semibold text-slate-400">₹</span>
                        {(booking.finalAmount || booking.totalAmount || 0).toLocaleString('en-IN')}
                      </p>
                    </div>

                    <button
                      className="flex items-center gap-1 pl-2.5 pr-2 py-1 rounded-lg bg-orange-50 border border-orange-100 text-[#FF9F45] font-bold text-[11px] hover:bg-[#FF9F45] hover:border-[#FF9F45] hover:text-white transition-all shadow-sm active:scale-95"
                    >
                      View Details
                      <FiChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};

export default MyBookings;

