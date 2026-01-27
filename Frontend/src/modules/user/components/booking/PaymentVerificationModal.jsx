import React from 'react';
import { FiCheckCircle, FiShield, FiAlertCircle, FiPackage, FiPlusCircle, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const PaymentVerificationModal = ({ isOpen, onClose, booking, onPayOnline }) => {
  if (!isOpen || !booking) return null;

  const baseAmount = parseFloat(booking.basePrice) || 0;
  const discount = parseFloat(booking.discount) || 0;
  const tax = parseFloat(booking.tax) || 0;
  const convenienceFee = parseFloat(booking.visitationFee || booking.visitingCharges) || 0;

  // Extra items added by worker/vendor
  const extraItems = booking.workDoneDetails?.items || [];
  const extraTotal = extraItems.reduce((sum, item) => sum + (parseFloat(item.price) * (item.qty || 1)), 0);

  const finalTotal = (booking.finalAmount !== undefined && booking.finalAmount !== null)
    ? booking.finalAmount
    : (baseAmount - discount + tax + convenienceFee + extraTotal);

  const isPlanBenefit = booking.paymentMethod === 'plan_benefit';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="relative h-24 bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center shrink-0">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full -translate-x-10 -translate-y-10" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full translate-x-10 translate-y-10" />
            </div>
            <div className="relative z-10 text-center flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
                <FiShield className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-white font-black text-lg tracking-tight">Payment & Verification</h3>
            </div>
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={onClose}
                title="Minimize"
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-md transition-colors border border-white/20"
              >
                <div className="w-5 h-1 bg-white rounded-full opacity-60"></div>
              </button>
              <button
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-md transition-colors border border-white/20"
              >
                <FiX className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar">
            {/* Price Breakdown Section */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-end mb-2">
                <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider">Total Payable</h4>
                <p className="text-2xl font-black text-gray-900">₹{finalTotal.toLocaleString()}</p>
              </div>

              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Base Amount</span>
                  {isPlanBenefit ? (
                    <div className="flex items-center gap-2">
                      <span className="line-through text-gray-400 text-xs">₹{baseAmount.toLocaleString()}</span>
                      <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">FREE</span>
                    </div>
                  ) : (
                    <span className="font-bold text-gray-800">₹{baseAmount.toLocaleString()}</span>
                  )}
                </div>

                {(tax > 0 || isPlanBenefit) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tax</span>
                    {isPlanBenefit ? (
                      <div className="flex items-center gap-2">
                        <span className="line-through text-gray-400 text-xs">₹{tax.toLocaleString()}</span>
                        <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">FREE</span>
                      </div>
                    ) : (
                      <span className="font-bold text-gray-800">+₹{tax.toLocaleString()}</span>
                    )}
                  </div>
                )}

                {(convenienceFee > 0 || isPlanBenefit) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Convenience Fee</span>
                    {isPlanBenefit ? (
                      <div className="flex items-center gap-2">
                        <span className="line-through text-gray-400 text-xs">₹{convenienceFee.toLocaleString()}</span>
                        <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">FREE</span>
                      </div>
                    ) : (
                      <span className="font-bold text-gray-800">+₹{convenienceFee.toLocaleString()}</span>
                    )}
                  </div>
                )}

                {discount > 0 && !isPlanBenefit && (
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>Discount</span>
                    <span>-₹{discount.toLocaleString()}</span>
                  </div>
                )}

                {extraItems.length > 0 && (
                  <div className="pt-3 border-t border-gray-200 mt-2 space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Extra Services Added</p>
                    {extraItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-gray-700">
                        <span className="flex items-center gap-1.5">
                          <FiPackage className="w-3 h-3 text-teal-600" />
                          {item.title} <span className="text-[10px] text-gray-400">x{item.qty || 1}</span>
                        </span>
                        <span className="font-bold font-mono">₹{(item.price * (item.qty || 1)).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-3 border-t-2 border-dashed border-gray-200 mt-2 flex justify-between items-center">
                  <span className="text-sm font-black text-gray-900">Total Amount</span>
                  <span className="text-xl font-black text-teal-700">₹{finalTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <h4 className="text-xs font-black text-gray-900 uppercase mb-3">Finalize Payment</h4>

            <div className="space-y-4">
              {booking.paymentStatus === 'success' ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center shadow-inner">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-emerald-100">
                    <FiCheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h4 className="text-lg font-black text-emerald-900 mb-1">Payment Successful!</h4>
                  <p className="text-xs text-emerald-600 font-medium">Your online payment of ₹{finalTotal.toLocaleString()} has been verified.</p>
                </div>
              ) : (
                <>
                  {/* Option 2: Online */}
                  <button
                    onClick={onPayOnline}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-700 text-white font-black flex items-center justify-center gap-3 shadow-xl shadow-teal-200 active:scale-[0.98] transition-all hover:shadow-teal-300 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                    <span className="relative">Pay Online Now</span>
                    <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-black tracking-tight">FAST & SECURE</span>
                  </button>

                  <div className="relative py-1 text-center">
                    <span className="text-[10px] text-gray-400 font-bold bg-white px-3 relative z-10 uppercase tracking-widest">OR</span>
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-100 z-0"></div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center relative overflow-hidden">
                    <p className="text-sm font-black text-slate-800 mb-1 tracking-tight">Cash Payment</p>
                    <p className="text-[10px] text-slate-500 mb-3 opacity-80 leading-relaxed">
                      Pay cash to the professional. Share this code to complete validation:
                    </p>

                    {(booking.customerConfirmationOTP || booking.paymentOtp) && (
                      <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl p-3 mb-2 flex flex-col items-center justify-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Verification Code</span>
                        <span className="text-3xl font-mono font-black text-slate-800 tracking-widest">
                          {booking.customerConfirmationOTP || booking.paymentOtp}
                        </span>
                      </div>
                    )}

                    <p className="text-[10px] text-slate-400 italic">
                      Only pay after work satisfaction.
                    </p>
                  </div>
                </>
              )}
            </div>

            <button onClick={onClose} className="w-full mt-6 py-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest">
              Close Details
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PaymentVerificationModal;
