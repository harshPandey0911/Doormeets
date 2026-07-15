import React, { useState, useEffect } from 'react';
import { FiCheckCircle, FiShield, FiAlertCircle, FiPackage, FiX, FiInfo } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { configService } from '../../../../services/configService';

const PaymentVerificationModal = ({ isOpen, onClose, booking, onPayOnline }) => {
  const [isOnlinePaymentEnabled, setIsOnlinePaymentEnabled] = useState(true);
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await configService.getSettings();
        if (res.success && res.settings) {
          setIsOnlinePaymentEnabled(res.settings.isOnlinePaymentEnabled !== false);
        }
      } catch (error) {
        console.error('Error fetching payment config:', error);
      } finally {
        setConfigLoading(false);
      }
    };

    if (isOpen) {
      fetchConfig();
    }
  }, [isOpen]);

  if (!isOpen || !booking) return null;

  // --- 1. Total & Breakdown Calculations ---
  const isPlanBenefit = booking.paymentMethod === 'plan_benefit';
  const bill = booking.bill;

  // Base Logic (Services)
  const originalBase = bill ? (bill.originalServiceBase || 0) : (parseFloat(booking.basePrice) || 0);

  // Extra Services
  const allBillServices = bill?.services || [];
  const services = allBillServices.filter(s => !s.isOriginal);
  const originalServiceFromBill = allBillServices.find(s => s.isOriginal);

  let extraServiceBase = 0;
  let extraServiceGST = 0;

  services.forEach(s => {
    const qty = parseFloat(s.quantity) || 1;
    const base = (parseFloat(s.price) || 0) * qty;
    const gst = parseFloat(s.gstAmount) || 0;
    extraServiceBase += base;
    extraServiceGST += gst;
  });

  const totalServiceBase = originalBase + extraServiceBase;

  // Parts & Custom Items
  const parts = bill?.parts || [];
  const customItems = bill?.customItems || [];

  let partsBase = 0;
  let partsGST = 0;

  parts.forEach(p => {
    const qty = parseFloat(p.quantity) || 1;
    partsBase += ((parseFloat(p.price) || 0) * qty);
    partsGST += (parseFloat(p.gstAmount) || 0);
  });

  customItems.forEach(c => {
    const qty = parseFloat(c.quantity) || 1;
    partsBase += ((parseFloat(c.price) || 0) * qty);
    partsGST += (parseFloat(c.gstAmount) || 0);
  });

  // Tax Logic — when no bill exists, use the stored tax from booking (GST is already included in customer price)
  const originalGST = bill ? (bill.originalGST || 0) : (parseFloat(booking.tax) || 0);
  const totalGST = originalGST + extraServiceGST + partsGST;

  // Instant Booking Markup
  const instantMarkup = parseFloat(booking.instantMarkupCharged) || 0;

  // Final Total
  const finalTotal = bill?.grandTotal || (booking.finalAmount || 0);

  const isCashPayment = booking.paymentMethod === 'pay_at_home' || booking.paymentMethod === 'cash';

  // --- 2. Identity Helpers ---
  const categoryName = booking.serviceCategory || 'General';
  const brandName = booking.brandName || booking.bookedItems?.[0]?.sectionTitle || '';
  const serviceName = booking.serviceName || 'Service Request';

  const CategoryIcon = booking.categoryIcon ? (
    <img src={booking.categoryIcon} alt={categoryName} className="w-full h-full object-cover" />
  ) : (
    <span className="text-2xl font-black uppercase text-white">{categoryName.charAt(0)}</span>
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: "spring", bounce: 0.3 }}
          className="bg-card-bg w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col border border-border-color"
        >
          {/* Header */}
          <div className="relative bg-slate-900 border-b border-slate-800 p-5 shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <FiX className="w-5 h-5 text-white/80" />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-14 h-14 bg-brand rounded-2xl flex items-center justify-center shadow-lg shadow-teal-500/30 mb-3 text-white overflow-hidden border-2 border-slate-800">
                {CategoryIcon}
              </div>
              <h3 className="text-white font-bold text-lg">Payment Verification</h3>
              <p className="text-slate-400 text-xs mt-1">Review bill and complete payment</p>
            </div>
          </div>

          <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
            {/* Booking Identity Card */}
            <div className="bg-light-bg rounded-2xl p-4 border border-border-color mb-5 relative overflow-hidden">
              <div className="flex flex-col gap-1 relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-md">
                    {categoryName}
                  </span>
                  {brandName && (
                    <div className="flex items-center gap-1 bg-card-bg border border-border-color px-2 py-0.5 rounded-md">
                      {booking.brandIcon && <img src={booking.brandIcon} alt={brandName} className="w-3 h-3 object-contain" />}
                      <span className="text-[10px] font-bold uppercase tracking-wider text-secondary-text">
                        {brandName}
                      </span>
                    </div>
                  )}
                </div>
                <h4 className="text-lg font-bold text-dark-text leading-tight">
                  {serviceName}
                </h4>
                <p className="text-xs text-secondary-text font-mono mt-1">
                  ID: #{booking.bookingNumber || booking._id?.slice(-8).toUpperCase()}
                </p>
              </div>
              <FiPackage className="absolute -bottom-2 -right-2 w-16 h-16 text-divider/40 rotate-[-15deg] z-0" />
            </div>

            {/* Bill Details */}
            <div className="space-y-4">
              {(() => {
                const amountAlreadyPaid = (booking.paymentStatus === 'paid' || booking.paymentStatus === 'SUCCESS' || booking.paymentStatus === 'success') 
                  ? ((booking.basePrice || 0) + (booking.tax || 0)) 
                  : 0;
                const netAmountPayable = Math.max(0, finalTotal - amountAlreadyPaid);

                return (
                  <div className="flex justify-between items-end border-b border-border-color pb-2">
                    <div>
                      <p className="text-xs font-bold text-secondary-text uppercase tracking-wide">Net Amount Payable</p>
                      {amountAlreadyPaid > 0 && (
                        <p className="text-[10px] text-secondary-text/80 font-bold mt-0.5">
                          Total Bill: ₹{finalTotal.toFixed(2)} | Already Paid: -₹{amountAlreadyPaid.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <p className="text-3xl font-bold text-brand font-mono">
                      ₹{netAmountPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                );
              })()}

              {/* 1. Services */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FiCheckCircle className="w-3.5 h-3.5 text-brand" />
                  <span className="text-xs font-bold text-secondary-text uppercase tracking-wide">Services</span>
                </div>
                <div className="space-y-2 pl-1">
                  <div className="flex justify-between text-xs text-dark-text">
                    <span>{originalServiceFromBill?.name || booking.serviceName || 'Service'}</span>
                    {isPlanBenefit ? (
                      <div className="flex items-center gap-1.5">
                        <span className="line-through text-secondary-text">₹{(originalBase + originalGST).toFixed(2)}</span>
                        <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 rounded">FREE</span>
                      </div>
                    ) : (
                      <span className="font-medium font-mono">₹{(originalBase + originalGST).toFixed(2)}</span>
                    )}
                  </div>
                  {services.map((s, idx) => (
                    <div key={idx} className="flex justify-between text-xs text-dark-text">
                      <span>{s.name} x {s.quantity}</span>
                      <span className="font-medium font-mono">₹{(s.total || (s.price * s.quantity)).toFixed(2)}</span>
                    </div>
                  ))}
                  {(originalGST + extraServiceGST) > 0 && (
                    <div className="flex justify-between text-xs text-secondary-text border-t border-dashed border-border-color pt-1 mt-1">
                      <span>GST (18%)</span>
                      <span className="font-mono">₹{(originalGST + extraServiceGST).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs font-bold text-dark-text pt-1">
                    <span>Total Service</span>
                    <span>₹{(totalServiceBase + originalGST + extraServiceGST).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* 2. Parts */}
              {(parts.length > 0 || customItems.length > 0) && (
                <div>
                  <div className="flex items-center gap-2 mb-2 mt-4">
                    <FiPackage className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-xs font-bold text-secondary-text uppercase tracking-wide">Parts & Materials</span>
                  </div>
                  <div className="space-y-2 pl-1">
                    {parts.map((p, idx) => (
                      <div key={`p-${idx}`} className="flex justify-between text-xs text-dark-text">
                        <span>{p.name} <span className="text-secondary-text">x{p.quantity}</span></span>
                        <span className="font-medium font-mono">₹{(p.price * p.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    {customItems.map((c, idx) => (
                      <div key={`c-${idx}`} className="flex justify-between text-xs text-dark-text">
                        <span>{c.name} <span className="text-secondary-text">x{c.quantity}</span></span>
                        <span className="font-medium font-mono">₹{(c.price * c.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs text-secondary-text border-t border-dashed border-border-color pt-1 mt-1">
                      <span>GST (18%)</span>
                      <span className="font-mono">₹{partsGST.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-dark-text pt-1">
                      <span>Total Parts</span>
                      <span>₹{(partsBase + partsGST).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Visiting Charges */}
              {(booking.visitingCharges > 0 || bill?.visitingCharges > 0) && (
                <div className="mt-4 pt-2 border-t border-border-color">
                  <div className="flex justify-between text-xs font-bold text-dark-text">
                    <span className="flex items-center gap-2 uppercase tracking-wide">
                      <FiInfo className="w-3.5 h-3.5 text-blue-400" /> Visiting Charges
                    </span>
                    <span className="font-mono">₹{(bill?.visitingCharges || booking.visitingCharges || 0).toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* 4. Transport Charges */}
              {(bill?.transportCharges > 0) && (
                <div className="mt-2 pt-2 border-t border-border-color">
                  <div className="flex justify-between text-xs font-bold text-dark-text">
                    <span className="flex items-center gap-2 uppercase tracking-wide">
                      <FiPackage className="w-3.5 h-3.5 text-blue-400" /> Transport Charges
                    </span>
                    <span className="font-mono">₹{(bill.transportCharges).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-8 space-y-3">
              {booking.paymentStatus === 'success' ? (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-card-bg rounded-full flex items-center justify-center text-green-500 shadow-sm shrink-0 border border-border-color">
                    <FiCheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-green-500 font-bold text-sm">Payment Verified</p>
                    <p className="text-secondary-text text-xs">Transaction completed successfully.</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Online Pay - CONDITIONALLY RENDERED */}
                  {!isCashPayment && !configLoading && isOnlinePaymentEnabled ? (
                    <button
                      onClick={onPayOnline}
                      className="w-full py-3.5 rounded-xl bg-brand text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all hover:bg-brand-light"
                    >
                      Pay Online Securely
                    </button>
                  ) : (
                    !isCashPayment && !configLoading && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">
                        <FiAlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-tight">
                           Online payment temporarily unavailable. Please pay by cash.
                        </p>
                      </div>
                    )
                  )}

                  {!isCashPayment && (
                    <div className="relative py-2 text-center">
                      <span className="bg-card-bg px-2 text-[10px] font-bold text-secondary-text relative z-10 uppercase tracking-wider">OR</span>
                      <div className="absolute top-1/2 left-0 right-0 h-px bg-border-color z-0"></div>
                    </div>
                  )}

                  {/* Cash Code */}
                  {isCashPayment && !(booking.customerConfirmationOTP || booking.paymentOtp) && (
                    <div className="bg-light-bg border border-border-color rounded-xl p-4 text-center">
                      <p className="text-xs font-bold text-dark-text mb-1">Paying in Cash</p>
                      <p className="text-[10px] text-secondary-text leading-normal">
                        Please pay ₹{finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })} in cash to the professional. Once they initiate collection, the verification OTP will appear here.
                      </p>
                    </div>
                  )}

                  {(booking.customerConfirmationOTP || booking.paymentOtp) && (
                    <div className="bg-light-bg border border-border-color rounded-xl p-4 text-center">
                      <p className="text-xs font-bold text-dark-text mb-2">Paying Cash? Share Code</p>
                      <div className="bg-card-bg border-2 border-dashed border-border-color rounded-lg py-2 px-4 inline-block mb-1">
                        <span className="text-2xl font-bold font-mono text-dark-text tracking-[0.2em]">
                          {booking.customerConfirmationOTP || booking.paymentOtp || '....'}
                        </span>
                      </div>
                      <p className="text-[10px] text-secondary-text mt-1">Share with professional to confirm cash payment</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PaymentVerificationModal;
