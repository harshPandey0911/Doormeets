import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiMapPin, FiClock, FiDollarSign, FiArrowRight, FiBell, FiAlertCircle, FiMinimize2 } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { vendorTheme as themeColors } from '../../../../theme';
import { playAlertRing, stopAlertRing } from '../../../../utils/notificationSound';

const BookingAlertModal = ({ isOpen, booking, onAccept, onReject, onMinimize, timeLeft: initialTimeLeft = 60 }) => {
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
          className="bg-white w-full max-w-sm rounded-[3rem] overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] relative"
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
          <div className="relative h-44 bg-gradient-to-br from-teal-600 to-emerald-700 flex flex-col items-center justify-center pt-4">
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
            <div className="relative z-10 mb-2">
              <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-[1.5rem] border border-white/20 flex items-center justify-center shadow-lg relative">
                <FiBell className="w-8 h-8 text-white animate-bounce" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
              </div>
            </div>

            <h2 className="relative z-10 text-white text-2xl font-black tracking-tight">New Order Alert!</h2>
            <div className="relative z-10 px-4 py-1 mt-1 bg-white/20 backdrop-blur-md rounded-full border border-white/10 text-[10px] font-bold text-white uppercase tracking-widest">
              Action Required Immediately
            </div>
          </div>

          {/* Body Section */}
          <div className="px-6 py-6">
            {/* Countdown Ring */}
            <div className="flex justify-center -mt-16 mb-6">
              <div className="relative w-28 h-28 bg-white rounded-full flex items-center justify-center shadow-2xl p-1">
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
                  <span className={`text-3xl font-black block leading-none ${timeLeft <= 10 ? 'text-red-500' : 'text-emerald-600'}`}>
                    {timeLeft}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Sec left</span>
                </div>
                {timeLeft <= 10 && (
                  <div className="absolute inset-0 rounded-full border-2 border-red-500/30 animate-ping" />
                )}
              </div>
            </div>

            <div className="text-center mb-6">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 block">Expected Earnings</span>
              <div className="text-4xl font-black text-gray-900 tracking-tighter">₹{(booking.vendorEarnings || ((booking.price || booking.finalAmount || booking.totalAmount || 0) * 0.9)).toFixed(0)}</div>
            </div>

            {/* Booking Card Details */}
            <div className="bg-gray-50 rounded-[2rem] p-5 border border-gray-100 space-y-4 mb-8">
              {/* Service Row */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-gray-100">
                  ⚡
                </div>
                <div>
                  <h4 className="text-lg font-black text-gray-900 leading-none">{booking.serviceType}</h4>
                  <p className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full inline-block mt-1">URGENT REQUEST</p>
                </div>
              </div>

              <div className="h-px bg-gray-200/50 w-full" />

              {/* Info Rows */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-white rounded-xl shadow-xs border border-gray-100">
                    <FiMapPin className="text-gray-400 w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Arrival Location</p>
                    <p className="text-sm font-bold text-gray-800 line-clamp-2">{booking.location?.address}</p>
                    <span className="text-[9px] font-black text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                      {booking.location?.distance || '2.5 km'} AWAY
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-white rounded-xl shadow-xs border border-gray-100">
                    <FiClock className="text-gray-400 w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Scheduled Time</p>
                    <p className="text-sm font-bold text-gray-800">
                      {booking.timeSlot?.date ? `${booking.timeSlot.date} • ` : ''}
                      {booking.timeSlot?.time || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  const id = booking.id || booking._id;
                  localStorage.removeItem(`alert_start_${id}`);
                  onAccept?.(id);
                }}
                className="w-full py-5 rounded-[1.5rem] bg-gray-900 hover:bg-gray-800 text-white font-black text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 group"
              >
                Accept & Claim Job
                <FiArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => {
                  const id = booking.id || booking._id;
                  localStorage.removeItem(`alert_start_${id}`);
                  onReject?.(id);
                }}
                className="w-full py-4 rounded-[1.5rem] bg-red-500 hover:bg-red-600 text-white font-bold text-sm shadow-lg active:scale-95 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <FiX className="w-5 h-5" />
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
