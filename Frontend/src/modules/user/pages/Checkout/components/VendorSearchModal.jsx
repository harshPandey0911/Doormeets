import React, { useEffect, useState, useRef } from 'react';
import { themeColors } from '../../../../../theme';
import { FiClock, FiStar, FiChevronRight, FiCheck, FiX, FiUser, FiAlertCircle } from 'react-icons/fi';

const VendorSearchModal = ({ 
  isOpen, 
  onClose, 
  currentStep, 
  acceptedVendor, 
  onRetry, 
  bids = [], 
  onSelectBid, 
  onWait,
  onCancelSearch,
  bookingDeadline,
  maxSearchTimeMinutes = 10 // Total search time from settings (default 10 min)
}) => {
  const [dots, setDots] = useState('.');
  const [timeLeft, setTimeLeft] = useState('');
  const [searchTimeLeft, setSearchTimeLeft] = useState('');
  const [viewMode, setViewMode] = useState('searching'); // 'searching' | 'single_quote' | 'multi_quote'
  const [activeBidIndex, setActiveBidIndex] = useState(0);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const searchStartRef = useRef(null);

  // Track search start time
  useEffect(() => {
    if (isOpen && (currentStep === 'searching' || currentStep === 'waiting')) {
      if (!searchStartRef.current) {
        searchStartRef.current = Date.now();
      }
    }
    if (!isOpen) {
      searchStartRef.current = null;
    }
  }, [isOpen, currentStep]);

  // Sync viewMode with bids and currentStep
  useEffect(() => {
    if (currentStep === 'searching' || currentStep === 'waiting') {
      if (bids.length === 0) {
        setViewMode('searching');
      } else if (bids.length === 1 && viewMode !== 'multi_quote') {
        setViewMode('single_quote');
      }
    }
  }, [bids.length, currentStep]);

  // Animation for searching dots
  useEffect(() => {
    if (isOpen && viewMode === 'searching') {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '.' : prev + '.');
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isOpen, viewMode]);

  // Total search time countdown
  useEffect(() => {
    if (!isOpen || (currentStep !== 'searching' && currentStep !== 'waiting')) return;

    const totalSearchMs = maxSearchTimeMinutes * 60 * 1000;

    const interval = setInterval(() => {
      const now = Date.now();
      const startTime = searchStartRef.current || now;
      const elapsed = now - startTime;
      const remaining = totalSearchMs - elapsed;

      if (remaining <= 0) {
        setSearchTimeLeft('00:00');
        clearInterval(interval);
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setSearchTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, currentStep, maxSearchTimeMinutes]);

  // Timer Countdown for multi-quote deadline
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const targetTime = viewMode === 'multi_quote' ? (bookingDeadline || Date.now() + 300000) : (Date.now() + 60000);
      const end = new Date(targetTime).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('00:00');
        clearInterval(interval);
      } else {
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, bookingDeadline, viewMode]);

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = async () => {
    setCancelLoading(true);
    try {
      if (onCancelSearch) {
        await onCancelSearch();
      }
    } finally {
      setCancelLoading(false);
      setShowCancelConfirm(false);
    }
  };

  if (!isOpen) return null;

  const currentBid = bids[activeBidIndex] || bids[0];
  const isSearching = currentStep === 'searching' || currentStep === 'waiting';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all duration-300">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden transform transition-all relative">

        {/* Close/Minimize Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-30 p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-all active:scale-95"
        >
          <FiX strokeWidth={3} />
        </button>

        {/* SEARCHING RADAR VIEW */}
        {isSearching && viewMode === 'searching' && (
          <div className="flex flex-col items-center justify-center pt-10 pb-8 px-6 min-h-[480px]">
            {/* Radar Animation */}
            <div className="relative w-52 h-52 flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded-full border-2 opacity-20 animate-ping" style={{ borderColor: themeColors.brand.teal, animationDuration: '3s' }}></div>
              <div className="absolute inset-4 rounded-full border opacity-40 animate-ping" style={{ borderColor: themeColors.brand.teal, animationDuration: '3s', animationDelay: '0.6s' }}></div>
              <div className="absolute inset-0 rounded-full animate-spin-slow opacity-30" style={{ background: `conic-gradient(transparent 180deg, ${themeColors.brand.teal})`, animationDuration: '4s' }}></div>
              <div className="relative z-10 w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center p-1">
                <div className="w-full h-full rounded-full flex items-center justify-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${themeColors.brand.teal}15, ${themeColors.brand.teal}05)` }}>
                  <div className="w-3 h-3 rounded-full shadow-lg animate-pulse" style={{ backgroundColor: themeColors.brand.teal }}></div>
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center relative z-20 px-4 mb-3">
              <h3 className="text-xl font-normal text-gray-900 mb-2 italic uppercase tracking-tight">Searching Experts</h3>
              <p className="text-gray-400 text-[10px] font-normal uppercase tracking-[0.2em]">Finding nearby professionals{dots}</p>
            </div>

            {/* Search Time Countdown */}
            <div className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 rounded-2xl border border-gray-100 mb-5">
              <FiClock className="w-3.5 h-3.5 text-gray-400 animate-pulse" />
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                Search expires in{' '}
                <span className="text-gray-800 font-bold tabular-nums">{searchTimeLeft || `${maxSearchTimeMinutes}:00`}</span>
              </span>
            </div>

            {/* Total Search Info */}
            <p className="text-[10px] text-gray-300 font-normal mb-6 uppercase tracking-widest text-center">
              Up to {maxSearchTimeMinutes} min search window
            </p>

            {/* Cancel Search Button */}
            <button
              onClick={handleCancelClick}
              className="w-full py-3.5 rounded-2xl border-2 border-red-100 bg-red-50/60 text-red-500 text-xs font-semibold uppercase tracking-widest transition-all active:scale-95 hover:bg-red-50 flex items-center justify-center gap-2"
            >
              <FiX className="w-4 h-4" strokeWidth={2.5} />
              Cancel Search
            </button>
          </div>
        )}

        {/* SINGLE QUOTE VIEW (SS1 style) */}
        {isSearching && viewMode === 'single_quote' && currentBid && (
          <div className="flex flex-col">
            <div className="h-44 bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] flex flex-col items-center justify-center p-6 text-white relative">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 border border-white/30 shadow-xl">
                <span className="text-3xl font-normal text-white">$</span>
              </div>
              <h3 className="text-2xl font-normal italic tracking-tight">New Quote Received!</h3>
              <p className="text-[10px] font-normal uppercase tracking-widest text-white/77 mt-1">Vendor is ready to work</p>
            </div>

            <div className="px-8 pt-10 pb-8 bg-white -mt-6 rounded-t-[2.5rem] relative z-10">
              <div className="bg-gray-50 rounded-[2rem] p-5 flex items-center gap-4 border border-gray-100 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center text-[#7C3AED] shadow-sm border border-gray-100"><FiUser className="w-7 h-7" /></div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg leading-none">{currentBid.businessName}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="flex items-center gap-1 text-xs font-normal text-yellow-500"><FiStar className="fill-current" /> {currentBid.rating || '4.8'}</span>
                    <span className="text-[10px] font-normal text-gray-400 uppercase tracking-widest border-l pl-2 border-gray-200">Verified Expert</span>
                  </div>
                </div>
              </div>

              <div className="text-center mb-8">
                <p className="text-[10px] font-normal text-gray-400 uppercase tracking-[0.2em] mb-2">Service Charge</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-5xl font-normal text-[#7C3AED] tracking-tighter">₹{currentBid.price}</span>
                  <span className="px-3 py-1 bg-indigo-50 text-[#7C3AED] text-[10px] font-normal uppercase rounded-full">Total</span>
                </div>
              </div>

              {/* ACTION BUTTONS GRID */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => onRetry()} 
                    className="py-4 bg-[#FFF1F1] text-[#FF4D4D] rounded-2xl font-normal text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center"
                  >
                    Decline
                  </button>
                  <button 
                    onClick={() => {
                      if (onWait) onWait();
                      setViewMode('multi_quote');
                    }}
                    className="py-4 bg-teal-50 text-teal-600 rounded-2xl font-normal text-xs uppercase tracking-widest border border-teal-100 transition-all active:scale-95 flex items-center justify-center"
                  >
                    Wait (5 min)
                  </button>
                </div>
                <button 
                  onClick={() => onSelectBid(currentBid.bidId || currentBid.id)}
                  className="w-full py-5 bg-[#4F46E5] text-white rounded-2xl font-normal text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/30 transition-all active:scale-95"
                >
                  Accept & Book
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MULTI QUOTE VIEW */}
        {isSearching && viewMode === 'multi_quote' && (
          <div className="flex flex-col pt-12 pb-8 px-6 min-h-[520px]">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-normal text-gray-900 mb-1 italic">Choice is Yours</h3>
              <div className="flex items-center justify-center gap-2 text-teal-600 font-normal text-xs uppercase tracking-widest">
                <FiClock className="animate-pulse" />
                <span>Expires in {timeLeft}</span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 -mr-1 custom-scrollbar">
              <div className="space-y-4 pb-4">
                {bids.map((bid, index) => (
                  <div key={bid.id || index} className="group bg-gray-50 hover:bg-white p-4 rounded-[2rem] border border-gray-100 hover:border-teal-100 hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-[#4F46E5] flex items-center justify-center text-white font-normal text-lg">{bid.businessName?.charAt(0)}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">{bid.businessName}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-[10px] font-normal text-yellow-500"><FiStar className="fill-current" /> {bid.rating || '4.8'}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-normal text-gray-900">₹{bid.price}</div>
                        <button onClick={() => onSelectBid(bid.bidId || bid.id)} className="mt-1 text-[9px] font-normal uppercase text-teal-600 hover:text-teal-700 flex items-center gap-1">Book <FiChevronRight /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ACCEPTED STATE */}
        {currentStep === 'accepted' && acceptedVendor && (
          <div className="flex flex-col items-center pt-14 pb-10 px-8 bg-white w-full h-full min-h-[480px]">
            <div className="w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-teal-500/20 bg-gradient-to-br from-teal-500 to-emerald-600"><FiCheck className="w-12 h-12 text-white" strokeWidth={3} /></div>
            <h3 className="text-3xl font-normal text-gray-900 mb-2 italic uppercase">Booked!</h3>
            <p className="text-gray-400 text-[10px] text-center mb-10 px-4 font-normal uppercase tracking-widest leading-loose">Preparing for your service</p>
            <div className="w-full bg-gray-50 rounded-[2.5rem] p-6 border border-gray-100 mb-10 relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="font-semibold text-xl text-gray-900 mb-1">{acceptedVendor.businessName}</h4>
                <div className="flex items-center gap-2 mt-3"><span className="bg-white px-3 py-1 rounded-full border border-gray-100 text-[10px] font-normal text-teal-600 uppercase">Confirmed</span></div>
              </div>
            </div>
            <button onClick={onClose} className="w-full py-5 bg-black text-white rounded-[2rem] font-normal text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95">Go to Details</button>
          </div>
        )}

        {/* FAILED STATE */}
        {currentStep === 'failed' && (
          <div className="flex flex-col items-center pt-14 pb-10 px-8 bg-white w-full h-full min-h-[480px]">
            <div className="w-24 h-24 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-red-500/20 bg-gradient-to-br from-red-500 to-rose-600"><FiX className="w-12 h-12 text-white" strokeWidth={3} /></div>
            <h3 className="text-3xl font-normal text-gray-900 mb-2 italic uppercase">No Vendors!</h3>
            <p className="text-gray-500 text-xs text-center mb-10 px-4 font-normal leading-relaxed">
              We couldn't find any available professionals for your request at the moment.
            </p>
            <div className="w-full space-y-3">
              <button 
                onClick={() => {
                  onClose();
                  setTimeout(() => window.location.reload(), 500);
                }} 
                className="w-full py-5 bg-black text-white rounded-[2rem] font-normal text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95"
              >
                Back to Details
              </button>
            </div>
          </div>
        )}

        {/* CANCEL CONFIRM OVERLAY */}
        {showCancelConfirm && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm rounded-[2.5rem] px-8 py-10">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-5">
              <FiAlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Cancel Search?</h3>
            <p className="text-sm text-gray-500 text-center mb-8 leading-relaxed">
              Your booking request will be cancelled and you'll be returned to checkout.
            </p>
            <div className="w-full space-y-3">
              <button
                onClick={handleConfirmCancel}
                disabled={cancelLoading}
                className="w-full py-4 bg-red-500 text-white rounded-2xl font-semibold text-sm uppercase tracking-wider transition-all active:scale-95 disabled:opacity-60"
              >
                {cancelLoading ? 'Cancelling...' : 'Yes, Cancel Search'}
              </button>
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="w-full py-4 bg-gray-50 text-gray-700 rounded-2xl font-semibold text-sm uppercase tracking-wider transition-all active:scale-95"
              >
                Keep Searching
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default VendorSearchModal;
