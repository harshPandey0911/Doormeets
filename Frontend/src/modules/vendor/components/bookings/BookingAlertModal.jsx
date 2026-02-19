import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiMapPin, FiClock, FiDollarSign, FiArrowRight, FiBell, FiAlertCircle, FiMinimize2, FiUsers } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { vendorTheme as themeColors } from '../../../../theme';
import { playAlertRing, stopAlertRing } from '../../../../utils/notificationSound';

const BookingAlertModal = ({ isOpen, booking, onAccept, onReject, onAssign, onMinimize, timeLeft: initialTimeLeft = 60 }) => {
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft);

  useEffect(() => {
    if (isOpen) {
      setTimeLeft(initialTimeLeft);
    }
  }, [isOpen, initialTimeLeft]);

  // Handle countdown and sound
  // Handle countdown and sound persistence
  useEffect(() => {
    if (!isOpen || !booking) {
      stopAlertRing();
      return;
    }

    const bookingId = booking.id || booking._id;
    const storageKey = `alert_start_${bookingId}`;
    let startTime = parseInt(localStorage.getItem(storageKey));

    if (!startTime) {
      // First time showing this alert, set start time
      startTime = Date.now();
      localStorage.setItem(storageKey, startTime.toString());
      setTimeLeft(initialTimeLeft);
    } else {
      // Resume timer
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const remaining = initialTimeLeft - elapsedSeconds;

      if (remaining <= 0) {
        // Expired while away/refreshing
        setTimeLeft(0);
        stopAlertRing();
        onReject?.(bookingId);
        localStorage.removeItem(storageKey);
        return;
      }
      setTimeLeft(remaining);
    }

    // Start alarm sound (looping)
    playAlertRing(true);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        // Calculate fresh every tick to be accurate
        const currentElapsed = Math.floor((Date.now() - startTime) / 1000);
        const currentRemaining = initialTimeLeft - currentElapsed;

        if (currentRemaining <= 0) {
          clearInterval(timer);
          stopAlertRing(); // Stop sound on timeout
          onReject?.(bookingId);
          localStorage.removeItem(storageKey);
          return 0;
        }
        return currentRemaining;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
      stopAlertRing(); // Ensure sound stops on unmount/cleanup
      // We do NOT remove storageKey here, so it persists on refresh
      // Only remove on accept/reject/expire actions (handled by parent or expiring)
    };
  }, [isOpen, booking, onReject, initialTimeLeft]);



  if (!isOpen || !booking) return null;

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const progress = (timeLeft / 60) * circumference;
  const dashoffset = circumference - progress;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 40 }}
          className="bg-white w-full max-w-sm rounded-[3rem] overflow-y-auto max-h-[90vh] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] relative scrollbar-hide"
        >
          {/* Minimize Button */}
          {onMinimize && (
            <button
              onClick={() => {
                stopAlertRing();
                onMinimize();
              }}
              className="absolute top-4 right-4 z-50 p-2 bg-black/20 hover:bg-black/30 backdrop-blur-md rounded-full text-white transition-all active:scale-95"
              title="Minimize Alert"
            >
              <FiMinimize2 className="w-5 h-5" />
            </button>
          )}
          {/* Header Section */}
          <div className="relative h-32 bg-gradient-to-br from-teal-600 to-emerald-700 flex flex-col items-center justify-center pt-2">
            {/* Animated background elements */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-10 -left-10 w-40 h-40 bg-white rounded-full"
              />
              <motion.div
                animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute -bottom-10 -right-10 w-48 h-48 bg-white rounded-full"
              />
            </div>

            {/* Notification Icon Badge */}
            <div className="relative z-10 mb-1">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 flex items-center justify-center shadow-lg relative">
                <FiBell className="w-6 h-6 text-white animate-bounce" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
              </div>
            </div>

            <h2 className="relative z-10 text-white text-xl font-black tracking-tight">New Order Alert!</h2>
            <div className="relative z-10 px-3 py-0.5 mt-1 bg-white/20 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-bold text-white uppercase tracking-widest">
              Action Required Immediately
            </div>
          </div>

          {/* Body Section */}
          <div className="px-6 py-5">
            {/* Countdown Ring */}
            <div className="flex justify-center -mt-12 mb-4">
              <div className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl p-0.5">
                <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r={radius}
                    fill="none"
                    stroke="#F3F4F6"
                    strokeWidth="5"
                  />
                  <motion.circle
                    cx="40"
                    cy="40"
                    r={radius}
                    fill="none"
                    stroke={timeLeft <= 10 ? '#EF4444' : '#059669'}
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
                <div className="text-center">
                  <span className={`text-2xl font-black block leading-none ${timeLeft <= 10 ? 'text-red-500' : 'text-emerald-600'}`}>
                    {timeLeft}
                  </span>
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Sec left</span>
                </div>
                {timeLeft <= 10 && (
                  <div className="absolute inset-0 rounded-full border-2 border-red-500/30 animate-ping" />
                )}
              </div>
            </div>

            <div className="flex items-center justify-center gap-8 mb-6 bg-emerald-50/50 py-3 rounded-2xl border border-emerald-100/50">
              <div className="text-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] mb-1 block">Travel Distance</span>
                <div className="text-2xl font-black text-emerald-600 tracking-tight flex items-center gap-1 justify-center">
                  <FiMapPin className="w-4 h-4" />
                  {booking.location?.distance || (booking.distance ? (String(booking.distance).includes('km') ? booking.distance : `${booking.distance} km`) : 'Near You')}
                </div>
              </div>
              <div className="w-px h-10 bg-gray-200" />
              <div className="text-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] mb-1 block">Expected Earnings</span>
                <div className="text-2xl font-black text-gray-900 tracking-tight uppercase">
                  ₹{Number((booking.vendorEarnings > 0 ? booking.vendorEarnings : (booking.price > 0 ? booking.price : (booking.finalAmount > 0 ? booking.finalAmount * 0.9 : 0))) || 0).toFixed(0)}
                </div>
              </div>
            </div>

            {/* Booking Card Details */}
            <div className="bg-gray-50 rounded-[1.5rem] p-4 border border-gray-100 space-y-3 mb-6">
              {/* Service Row */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm border border-gray-100">
                  ⚡
                </div>
                <div>
                  <h4 className="text-base font-black text-gray-900 leading-none">{booking.serviceType}</h4>
                  <p className="text-[9px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full inline-block mt-0.5">URGENT REQUEST</p>
                </div>
              </div>

              <div className="h-px bg-gray-200/50 w-full" />

              {/* Info Rows */}
              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <div className="p-1 bg-white rounded-lg shadow-xs border border-gray-100">
                    <FiMapPin className="text-gray-400 w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Arrival Location</p>
                    <p className="text-xs font-bold text-gray-800 line-clamp-1">
                      {booking.location?.address || booking.address?.addressLine1 || 'Address not available'}
                    </p>
                    <span className="text-[8px] font-black text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                      {booking.location?.distance || (booking.distance ? `${booking.distance} km` : 'Near you')}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="p-1 bg-white rounded-lg shadow-xs border border-gray-100">
                    <FiClock className="text-gray-400 w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Scheduled Time</p>
                    <p className="text-xs font-bold text-gray-800">
                      {booking.timeSlot?.date || (booking.scheduledDate ? new Date(booking.scheduledDate).toLocaleDateString() : '')}
                      {(booking.timeSlot?.date || booking.scheduledDate) ? ' • ' : ''}
                      {booking.timeSlot?.time || booking.scheduledTime || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  const id = booking.id || booking._id;
                  localStorage.removeItem(`alert_start_${id}`);
                  onAccept?.(id);
                }}
                className="w-full py-4 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 group"
              >
                Accept Only
                <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => {
                  const id = booking.id || booking._id;
                  localStorage.removeItem(`alert_start_${id}`);
                  onAssign?.(id);
                }}
                className="w-full py-4 rounded-2xl text-white font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 group"
                style={{ background: themeColors.button }}
              >
                Accept & Assign
                <FiUsers className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>

              <button
                onClick={() => {
                  const id = booking.id || booking._id;
                  localStorage.removeItem(`alert_start_${id}`);
                  onReject?.(id);
                }}
                className="w-full py-3 rounded-2xl bg-red-50 to-red-100 border border-red-100 text-red-500 font-bold text-xs active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <FiX className="w-4 h-4" />
                Decline Order
              </button>
            </div>
          </div>

          {/* Subtle decoration bottom */}
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-teal-50 rounded-full blur-2xl opacity-60 pointer-events-none" />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default BookingAlertModal;
