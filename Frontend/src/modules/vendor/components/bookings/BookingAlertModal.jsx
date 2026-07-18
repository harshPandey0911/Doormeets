import React, { useState, useEffect } from 'react';
import { FiX, FiMapPin, FiClock, FiDollarSign, FiArrowRight, FiBell, FiAlertCircle, FiMinimize2, FiUsers, FiCheck } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { vendorTheme as themeColors } from '../../../../theme';
import { playAlertRing, stopAlertRing, playNotificationSound } from '../../../../utils/notificationSound';

const BookingAlertCard = ({ booking, onAccept, onReject, onAssign, maxSearchTimeMins = 1 }) => {
  const [isWaiting, setIsWaiting] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);

  // Calculate initial time
  const calculateInitialRemaining = () => {
    try {
      // Wave duration is 1 minute (60s)
      const start = new Date(booking.createdAt || booking.sentAt || Date.now()).getTime();
      const end = start + (60 * 1000); // 1 minute from creation/send time
      const left = Math.floor((end - Date.now()) / 1000);
      return Math.max(0, Math.min(60, left));
    } catch {
      return 60;
    }
  };

  const [timeLeft, setTimeLeft] = useState(calculateInitialRemaining());

  // Listen for user_waiting event
  useEffect(() => {
    const handleUserWaiting = (e) => {
      const data = e.detail;
      const bId = String(booking.id || booking._id);
      if (String(data.bookingId) === bId) {
        setIsWaiting(true);
        setTimeLeft(300); // Reset to 5 minutes
      }
    };

    window.addEventListener('vendorUserWaiting', handleUserWaiting);
    return () => window.removeEventListener('vendorUserWaiting', handleUserWaiting);
  }, [booking]);

  // Timer logic
  useEffect(() => {
    if (!booking) return;

    if (timeLeft <= 0) {
      if (!isWaiting) {
        onReject?.(booking.id || booking._id);
        window.dispatchEvent(new CustomEvent('removeVendorBooking', { detail: { id: booking.id || booking._id } }));
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isWaiting, booking, onReject]);

  const handleAction = async (actionFn, actionType) => {
    if (loadingAction) return;
    setLoadingAction(actionType);
    const bookingId = booking.id || booking._id;
    try {
      if (actionType === 'accept') {
        const isProduct = booking.serviceType === 'product' || booking.bookingType === 'product';
        if (isProduct) {
          const price = document.getElementById(`price-input-${bookingId}`)?.value;
          const note = document.getElementById(`note-input-${bookingId}`)?.value;
          await actionFn(bookingId, price, note);
        } else {
          await actionFn(bookingId);
        }
      } else {
        await actionFn(bookingId);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAction(null);
    }
  };

  const totalDurationSecs = isWaiting ? 300 : (Number(maxSearchTimeMins) || 1) * 60;
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const progress = (timeLeft / totalDurationSecs) * circumference;
  const dashoffset = circumference - progress;

  const isProduct = booking.serviceType === 'product' || booking.bookingType === 'product';

  const getBookingDisplayTitle = () => {
    if (booking.dynamicFields && booking.dynamicFields.length > 0) {
      const groupFields = booking.dynamicFields.filter(f => f.name && f.name.startsWith('Group:'));
      if (groupFields.length > 0) {
        const items = groupFields
          .map(f => {
            const val = String(f.value || '');
            if (val.toLowerCase().includes('skipped')) return null;
            return val.replace(/\s*\(₹\d+\)/gi, '');
          })
          .filter(Boolean);
        if (items.length > 0) {
          return items.join(', ');
        }
      }
    }
    if (booking.serviceType === 'product') {
      return booking.serviceName || booking.serviceId?.title;
    }
    return booking.serviceType || booking.serviceName || 'Service Request';
  };

  return (
    <div className="bg-white w-full sm:w-[320px] flex-none rounded-[2.5rem] overflow-y-auto max-h-[85vh] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] relative scrollbar-hide snap-center">
      {/* Header Section */}
      <div className={`relative h-24 flex flex-col items-center justify-center transition-colors duration-500 ${isWaiting ? 'bg-gradient-to-br from-indigo-600 to-purple-700' : (booking.assignedByAdmin ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-gradient-to-br from-teal-600 to-emerald-700')}`}>
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 4, repeat: Infinity }} className="absolute -top-10 -left-10 w-32 h-32 bg-white rounded-full" />
        </div>

        <div className="flex items-center gap-3 relative z-10 w-full px-4 justify-center">
          <div className="w-10 h-10 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 flex items-center justify-center shadow-md relative">
            {isWaiting ? <FiClock className="w-5 h-5 text-white animate-pulse" /> : <FiBell className="w-5 h-5 text-white animate-bounce" />}
          </div>
          <div>
            <h2 className="text-white text-lg font-black tracking-tight leading-none">
              {isWaiting ? 'USER IS WAITING' : (booking.assignedByAdmin ? 'Admin Assigned!' : 'New Order!')}
            </h2>
            <div className="text-[8px] font-black text-white/70 uppercase tracking-widest mt-1">
              {isWaiting ? 'Comparing quotes... 5:00' : (booking.assignedByAdmin ? 'Manual Assignment Required' : 'Action Required Immediately')}
            </div>
          </div>
        </div>
      </div>

      {/* Body Section */}
      <div className="px-5 py-4">
        <div className="flex justify-center -mt-10 mb-4 relative z-20">
          <div className="relative w-18 h-18 bg-white rounded-full flex items-center justify-center shadow-xl p-1">
            <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 60 60">
              <circle cx="30" cy="30" r={radius} fill="none" stroke="#F3F4F6" strokeWidth="4" />
              <motion.circle
                cx="30" cy="30" r={radius} fill="none"
                stroke={isWaiting ? '#7C3AED' : (timeLeft <= 10 ? '#EF4444' : '#059669')} strokeWidth="5"
                strokeDasharray={circumference} strokeDashoffset={dashoffset}
                strokeLinecap="round" className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="text-center mt-0.5">
              <span className={`text-xl font-black block leading-none ${isWaiting ? 'text-indigo-600' : (timeLeft <= 20 ? 'text-red-500' : 'text-emerald-600')}`}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>

        {isWaiting && (
          <div className="mb-4 bg-indigo-50 border border-indigo-100 p-3 rounded-2xl animate-pulse">
            <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest text-center">
              Customer asked you to wait 5 mins while they review other quotes
            </p>
          </div>
        )}

        {booking.assignedByAdmin && (
          <div className="mb-4 bg-blue-50 border border-blue-100 p-3 rounded-2xl">
            <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest text-center">
              🛡️ Assigned by Admin (1 min to respond)
            </p>
          </div>
        )}

        <div className="mb-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
              <span className="text-[10px] font-black tracking-widest text-gray-700 uppercase">
                {booking.serviceCategory || 'General Service'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
               <FiMapPin /> {booking.location?.distance || 'Nearby'}
            </div>
          </div>

          <div className="bg-white rounded-[1.2rem] p-4 border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
            <h4 className="text-[15px] font-black text-gray-900 leading-tight">
              {getBookingDisplayTitle()}
            </h4>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-bold text-gray-400">Customer:</span>
              <span className="text-[10px] font-black text-gray-800 uppercase">{booking.customerName}</span>
            </div>
            {(booking.deductionAmount > 0 || booking.requiredCredits > 0) && (
              <div className="flex items-center gap-2 mt-2 bg-red-50 p-2 rounded-lg border border-red-100">
                <span className="text-[10px] font-bold text-red-500">Deduction on Acceptance:</span>
                <span className="text-[12px] font-black text-red-600">{booking.requiredCredits || booking.deductionAmount} Credits</span>
              </div>
            )}
          </div>
        </div>

        {/* Bidding/Quote Input for Products */}
        {isProduct && (
          <div className="mb-5 space-y-3 p-4 bg-purple-50 rounded-2xl border border-purple-100 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <FiDollarSign className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-[10px] font-black text-purple-700 uppercase tracking-widest">Your Best Quote</span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 font-bold">₹</span>
              <input
                type="number"
                placeholder="Total Price"
                id={`price-input-${booking.id || booking._id}`}
                className="w-full bg-white border border-purple-200 rounded-xl py-2.5 pl-7 pr-3 text-sm font-black text-purple-900 placeholder:text-purple-200 outline-none focus:ring-2 focus:ring-purple-400 transition-all"
              />
            </div>
            <textarea
              placeholder="Note to customer (optional)"
              id={`note-input-${booking.id || booking._id}`}
              className="w-full bg-white border border-purple-200 rounded-xl py-2 px-3 text-[11px] font-medium text-gray-600 placeholder:text-gray-300 outline-none min-h-[60px] resize-none"
            />
          </div>
        )}

        {!isProduct && (
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 mb-6 text-xs space-y-2.5">
            <div className="flex items-start gap-2">
              <FiMapPin className="text-gray-400 w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-bold text-gray-800 leading-snug">{booking.location?.address || 'Address N/A'}</span>
            </div>
            <div className="flex items-start gap-2 pt-2 border-t border-gray-200/60">
              <FiClock className="text-gray-400 w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-bold text-gray-800">{booking.timeSlot?.date} at {booking.timeSlot?.time}</span>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            disabled={!!loadingAction}
            onClick={() => handleAction(onReject, 'reject')}
            className="flex-1 py-3.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-500 font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
          >
            {loadingAction === 'reject' ? '...' : 'Decline'}
          </button>
          
          {!isProduct && onAssign && (
            <button
              disabled={!!loadingAction}
              onClick={() => handleAction(onAssign, 'assign')}
              className="flex-1 py-3.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {loadingAction === 'assign' ? '...' : (
                <>
                  <FiUsers className="w-3.5 h-3.5" />
                  <span>Assign</span>
                </>
              )}
            </button>
          )}

          <button
            disabled={!!loadingAction}
            onClick={() => handleAction(onAccept, 'accept')}
            className={`py-3.5 rounded-xl text-white font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 ${isProduct ? 'flex-[2] bg-purple-600 shadow-purple-200' : 'flex-1 bg-gray-900 shadow-gray-200'}`}
          >
            {loadingAction === 'accept' ? 'Processing...' : (isProduct ? 'Send Quote' : 'Accept')}
          </button>
        </div>
      </div>
    </div>
  );
};

const BookingAlertModal = ({ isOpen, booking, bookings, onAccept, onReject, onAssign, onMinimize, maxSearchTimeMins = 1 }) => {
  const alertsArray = bookings || (booking ? [booking] : []);

  return (
    <AnimatePresence>
      {isOpen && alertsArray.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/80 backdrop-blur-md"
        >
          {onMinimize && (
            <button
              onClick={() => { stopAlertRing(); onMinimize(); }}
              className="absolute top-6 right-6 z-50 p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full text-white transition-all active:scale-95 border border-white/20"
            >
              <FiMinimize2 className="w-5 h-5" />
            </button>
          )}

          <div className="w-full overflow-x-auto snap-x snap-mandatory scrollbar-hide flex gap-4 px-8 items-center h-full">
            <div className="flex gap-4 m-auto">
              {alertsArray.map(b => (
                <BookingAlertCard
                  key={b.id || b._id}
                  booking={b}
                  onAccept={onAccept}
                  onReject={onReject}
                  onAssign={onAssign}
                  maxSearchTimeMins={maxSearchTimeMins}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BookingAlertModal;
