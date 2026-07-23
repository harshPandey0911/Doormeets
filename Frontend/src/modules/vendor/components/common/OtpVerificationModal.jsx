import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiShield } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const OtpVerificationModal = ({ isOpen, onClose, onVerify, loading }) => {
  const [otp, setOtp] = useState('');
  const inputRef = useRef(null);
  const isSubmittedRef = useRef(false);
  const onVerifyRef = useRef(onVerify);

  // Keep latest onVerify in a ref so useEffect doesn't depend on inline function identity
  useEffect(() => {
    onVerifyRef.current = onVerify;
  }, [onVerify]);

  useEffect(() => {
    if (isOpen) {
      setOtp('');
      isSubmittedRef.current = false;
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      isSubmittedRef.current = false;
    }
  }, [isOpen]);

  useEffect(() => {
    if (otp.length === 4 && !isSubmittedRef.current && !loading) {
      isSubmittedRef.current = true;
      if (onVerifyRef.current) {
        onVerifyRef.current(otp);
      }
    }
  }, [otp, loading]);

  // Handle loading state changes (reset guard if request failed so user can retry)
  const prevLoading = useRef(loading);
  useEffect(() => {
    if (prevLoading.current && !loading && isOpen) {
      isSubmittedRef.current = false;
      setOtp('');
      inputRef.current?.focus();
    }
    prevLoading.current = loading;
  }, [loading, isOpen]);

  const handleChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
    if (val.length < 4) {
      isSubmittedRef.current = false;
    }
    setOtp(val);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-xs sm:max-w-xs rounded-[20px] overflow-hidden shadow-2xl relative"
        >
          {/* Header */}
          <div
            className="relative h-24 flex flex-col items-center justify-center p-3"
            style={{ background: 'linear-gradient(135deg, #b33a35 0%, #8c2a26 100%)' }}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-50 p-1.5 bg-black/20 hover:bg-black/30 backdrop-blur-md rounded-lg text-white transition-all active:scale-95"
            >
              <FiX className="w-4 h-4" />
            </button>

            <div className="w-9 h-9 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center shadow-xs mb-1.5">
              <FiShield className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-white text-base font-bold tracking-tight">Payment Verification</h2>
          </div>

          {/* Body */}
          <div className="px-5 py-5">
            <div className="text-center mb-4">
              <p className="text-gray-500 text-xs font-medium">
                Enter the 4-digit code sent to the customer
              </p>
            </div>

            <div className="flex justify-center mb-5">
              <input
                ref={inputRef}
                type="number"
                value={otp}
                onChange={handleChange}
                disabled={loading}
                placeholder="0000"
                className="w-full text-center bg-gray-50/80 border border-gray-200 rounded-xl py-2.5 text-2xl font-black tracking-[0.4em] text-gray-900 outline-none focus:ring-2 focus:ring-[#b33a35]/20 focus:border-[#b33a35] transition-all placeholder:text-gray-200"
              />
            </div>

            <div className="flex justify-center">
              {loading ? (
                <div className="text-[#b33a35] text-xs font-bold animate-pulse">Verifying...</div>
              ) : (
                <div className="text-[10px] text-center text-gray-400">
                  Auto-verifying on entry
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default OtpVerificationModal;
