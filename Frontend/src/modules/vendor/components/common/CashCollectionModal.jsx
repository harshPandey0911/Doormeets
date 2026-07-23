import React, { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2, FiCreditCard, FiClock, FiCheck, FiDollarSign, FiPlusCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

/**
 * CashCollectionModal
 * A unified component for collecting cash payments with support for extra items/services.
 */
const CashCollectionModal = ({
  isOpen,
  onClose,
  booking,
  onConfirm,
  onInitiateOTP,
  loading
}) => {
  const [extraItems, setExtraItems] = useState([]);
  const [step, setStep] = useState('summary'); // 'summary' or 'otp'
  const [otp, setOtp] = useState(['', '', '', '']);
  const [submitting, setSubmitting] = useState(false);

  // Fix potential undefined issue
  const safeExtraItems = Array.isArray(extraItems) ? extraItems : [];

  // Calculate base amount - For plan_benefit, base is ALWAYS 0 (covered by plan)
  const baseAmount = (() => {
    if (booking?.paymentMethod === 'plan_benefit') {
      return 0;
    }

    const rawFinal = booking?.finalAmount || parseFloat(booking?.price) || 0;
    const existingExtras = booking?.workDoneDetails?.items || [];
    const existingExtrasTotal = existingExtras.reduce((sum, item) => sum + (parseFloat(item.price || 0) * (item.qty || 1)), 0);
    return (booking?.customerConfirmationOTP || booking?.paymentOtp)
      ? Math.max(0, rawFinal - existingExtrasTotal)
      : rawFinal;
  })();

  const totalExtra = safeExtraItems.reduce((sum, item) => sum + (parseFloat(item.price || 0) * (item.qty || 1)), 0);
  const finalTotal = baseAmount + totalExtra;

  useEffect(() => {
    if (isOpen) {
      const pStatus = booking?.paymentStatus?.toLowerCase() || '';
      const isOnline = booking?.paymentMethod === 'online' || booking?.paymentMethod === 'Qr online';
      if (booking?.cashCollected || pStatus === 'collected_by_vendor') {
        onClose();
        return;
      }
      if ((pStatus === 'success' || pStatus === 'paid') && !isOnline) {
        onClose();
        return;
      }

      const hasOTP = booking?.customerConfirmationOTP || booking?.paymentOtp;

      if (hasOTP) {
        setStep('otp');
        if (booking.workDoneDetails?.items && booking.workDoneDetails.items.length > 0) {
          setExtraItems(booking.workDoneDetails.items);
        }
      } else {
        setStep('summary');
        setExtraItems([]);
        setOtp(['', '', '', '']);
      }
      setSubmitting(false);
    }
  }, [isOpen, booking?.id, booking?.customerConfirmationOTP, booking?.paymentOtp, booking?.paymentStatus]);

  const handleAddItem = () => {
    setExtraItems([...extraItems, { title: '', price: '', qty: 1 }]);
  };

  const handleUpdateItem = (index, field, value) => {
    const newItems = [...extraItems];
    newItems[index][field] = value;
    setExtraItems(newItems);
  };

  const handleRemoveItem = (index) => {
    setExtraItems(extraItems.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const otpValue = otp.join('');
    if (otpValue.length === 4 && !submitting && !loading && step === 'otp') {
      handleVerify();
    }
  }, [otp]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 3) {
      const nextInput = document.getElementById(`modal-otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleInputFocus = (e) => {
    setTimeout(() => {
      e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const handleSendOTP = async () => {
    for (const item of extraItems) {
      if (!item.title || !item.price || parseFloat(item.price) <= 0) {
        toast.error('Please provide title and price for all extra items');
        return;
      }
    }

    const isPlanBenefit = booking?.paymentMethod === 'plan_benefit';
    const hasExtras = extraItems.length > 0 && totalExtra > 0;

    if (isPlanBenefit && !hasExtras) {
      setSubmitting(true);
      try {
        await onConfirm(0, [], '0000');
        onClose();
        toast.success('Bill finalized successfully!');
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Failed to finalize');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setSubmitting(true);
    try {
      await onInitiateOTP(finalTotal, extraItems);
      setStep('otp');
      toast.success('OTP sent to customer');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 4) {
      toast.error('Please enter 4-digit OTP');
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm(finalTotal, extraItems, otpString);
      onClose();
      toast.success('Payment recorded successfully');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
      {/* Modal Container */}
      <div className="bg-white w-full max-w-xs sm:max-w-sm rounded-[20px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 flex-shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{step === 'summary' ? 'Collect Cash' : 'Verify OTP'}</h3>
            <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider mt-0.5">
              {step === 'summary' ? 'Review Bill & Send OTP' : 'Enter Customer Code'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-3">
          {step === 'summary' ? (
            <>
              {/* Base Amount Section */}
              {booking?.paymentMethod === 'plan_benefit' ? (
                <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100/50 relative overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-emerald-800">Base Service Cost</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-emerald-600/60 line-through font-medium">₹{(booking?.finalAmount || parseFloat(booking?.price) || 0).toLocaleString()}</span>
                      <span className="text-[10px] font-black text-emerald-600 bg-white/80 px-1.5 py-0.5 rounded border border-emerald-100">FREE ✓</span>
                    </div>
                  </div>
                  <p className="text-[10px] font-medium text-emerald-700">Covered by customer's membership plan</p>
                </div>
              ) : (
                <div className="bg-red-50/30 rounded-xl p-3 border border-red-100">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-xs font-bold text-red-900">Booking Amount</span>
                    <span className="text-base font-black text-red-600">₹{baseAmount.toLocaleString()}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 font-medium">Original service booking amount</p>
                </div>
              )}

              {/* Extra Items Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Extra Services / Items</h4>
                  <button
                    onClick={handleAddItem}
                    className="flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-md hover:bg-red-100 transition-colors"
                  >
                    <FiPlus className="w-3 h-3 text-red-600" />
                    Add Extra
                  </button>
                </div>

                {extraItems.length === 0 ? (
                  <div className="text-center py-4 border-2 border-dashed border-gray-100 rounded-xl">
                    <p className="text-[11px] text-gray-400">No extra charges added yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {extraItems.map((item, index) => (
                      <div key={index} className="flex gap-1.5 items-start animate-in slide-in-from-right-2 duration-200">
                        <div className="flex-1 space-y-1.5">
                          <input
                            type="text"
                            placeholder="Service name"
                            className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-red-400 transition-all"
                            value={item.title}
                            onChange={(e) => handleUpdateItem(index, 'title', e.target.value)}
                          />
                          <div className="flex gap-1.5">
                            <div className="relative flex-1">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                              <input
                                type="number"
                                placeholder="Price"
                                className="w-full pl-6 pr-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-red-400"
                                value={item.price}
                                onChange={(e) => handleUpdateItem(index, 'price', e.target.value)}
                              />
                            </div>
                            <div className="w-16">
                              <input
                                type="number"
                                placeholder="Qty"
                                className="w-full px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-red-400"
                                value={item.qty}
                                onChange={(e) => handleUpdateItem(index, 'qty', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-md mt-0.5"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-2 text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-2 text-red-600">
                <FiClock className="w-6 h-6 animate-pulse" />
              </div>
              <h4 className="font-bold text-sm text-gray-900 mb-1">Enter Confirmation Code</h4>
              <p className="text-[11px] text-gray-500 mb-4 px-2">
                Ask customer for 4-digit code sent to their phone for <span className="font-bold text-gray-900">₹{finalTotal.toLocaleString()}</span>.
              </p>

              <div className="flex gap-2 justify-center mb-4">
                {[0, 1, 2, 3].map((i) => (
                  <input
                    key={i}
                    id={`modal-otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    value={otp[i]}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onFocus={handleInputFocus}
                    className="w-10 h-12 border-2 border-gray-100 rounded-xl text-center text-xl font-bold focus:border-red-500 focus:outline-none bg-gray-50 transition-all"
                    maxLength={1}
                  />
                ))}
              </div>

              <button
                onClick={() => setStep('summary')}
                className="text-xs font-bold text-red-600 hover:underline"
              >
                Back to Edit Bill
              </button>
            </div>
          )}

          {/* Final Summary */}
          <div className="bg-gray-900 rounded-xl p-3.5 text-white shadow-md relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-1 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                <span>Payment Summary</span>
                <span>Total Due</span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xl font-black tracking-tight">₹{finalTotal.toLocaleString()}</p>
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-[9px] font-bold rounded border border-red-500/30">
                  CASH COLLECTION
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex-shrink-0">
          {step === 'summary' ? (
            <button
              onClick={handleSendOTP}
              disabled={submitting || loading}
              className="w-full py-2.5 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 hover:brightness-105"
              style={{
                background: booking?.paymentMethod === 'plan_benefit' && extraItems.length === 0
                  ? 'linear-gradient(135deg, #10B981, #059669)'
                  : 'linear-gradient(135deg, #E85D3F 0%, #d44d31 100%)',
                boxShadow: booking?.paymentMethod === 'plan_benefit' && extraItems.length === 0
                  ? '0 4px 12px rgba(16, 185, 129, 0.3)'
                  : '0 4px 12px rgba(232, 93, 63, 0.3)',
              }}
            >
              {submitting ? 'Processing...' : (
                booking?.paymentMethod === 'plan_benefit' && extraItems.length === 0
                  ? 'Finalize Bill'
                  : 'Send OTP to User'
              )}
              <FiArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleVerify}
              disabled={submitting || loading}
              className="w-full py-2.5 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 hover:brightness-105"
              style={{
                background: 'linear-gradient(135deg, #10B981, #059669)',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}
            >
              {submitting ? 'Verifying...' : 'Verify & Record Cash'}
              <FiCheck className="w-4 h-4" />
            </button>
          )}
          <p className="text-[9px] text-gray-400 text-center italic mt-2">
            {step === 'summary'
              ? (booking?.paymentMethod === 'plan_benefit' && extraItems.length === 0
                ? 'No extra charges. Clicking will finalize the bill immediately.'
                : 'Clicking will finalize the bill and send a 4-digit code to the customer.')
              : 'Enter the code provided by the customer to finalize the transaction.'}
          </p>
        </div>
      </div>
    </div>
  );
};

// Internal icon for button
const FiArrowRight = ({ className }) => (
  <svg className={className} stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

export default CashCollectionModal;
