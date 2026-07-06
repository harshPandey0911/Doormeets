import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { FiPercent, FiAward, FiTag, FiClock, FiMapPin, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { quoteAction } from '../../services/paintingConsultationService';

const QuoteApproval = ({ consultation, onActionComplete }) => {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const [processing, setProcessing] = useState(false);

  const quotation = consultation?.quotationId || {};
  const vendor = consultation?.vendorId || {};
  const painter = quotation?.painterDetails || {};
  const products = quotation?.products || [];
  const labour = quotation?.labour || [];
  const additionalCharges = quotation?.additionalCharges || [];
  const property = quotation?.property || {};

  const getRoomsCount = () => {
    if (property.rooms?.length) return property.rooms.length;
    if (consultation?.wizardData?.rooms?.length) return consultation.wizardData.rooms.length;
    const type = (quotation?.property?.propertyType || consultation?.propertyType || '').toUpperCase();
    if (type.includes('1BHK') || type.includes('1 BHK')) return 3;
    if (type.includes('2BHK') || type.includes('2 BHK')) return 4;
    if (type.includes('3BHK') || type.includes('3 BHK')) return 5;
    if (type.includes('4BHK') || type.includes('4 BHK')) return 6;
    if (type.includes('VILLA')) return 8;
    return 3;
  };

  const grandTotal = quotation?.summary?.grandTotal || quotation?.calculation?.grandTotal || 0;
  const materialCost = quotation?.summary?.materialCost || quotation?.calculation?.paintCost || 0;
  const labourCost = quotation?.summary?.labourCost || quotation?.calculation?.labourCost || 0;
  const additionalServicesCost = quotation?.summary?.additionalCharges || quotation?.calculation?.additionalServicesCost || 0;
  const gstAmount = quotation?.summary?.gst || quotation?.calculation?.gst || 0;

  const couponDiscountPercent = appliedCoupon ? appliedCoupon.discountPercent : 0;
  const couponDiscountAmount = (grandTotal * couponDiscountPercent) / 100;
  const loyaltyAmount = (grandTotal * loyaltyDiscount) / 100;
  const totalPayable = Math.max(0, grandTotal - couponDiscountAmount - loyaltyAmount);

  const handleApplyCoupon = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      toast.error('Please enter a coupon code.');
      return;
    }
    
    // Dynamically validate SUCCESS20 and WELCOME50/FLAT50
    if (code === 'SUCCESS20') {
      setAppliedCoupon({ code, discountPercent: 20 });
      toast.success('🎉 SUCCESS20 applied! 20% discount added.');
    } else if (code === 'WELCOME50' || code === 'FLAT50') {
      setAppliedCoupon({ code, discountPercent: 10 });
      toast.success(`🎉 ${code} applied! 10% discount added.`);
    } else {
      toast.error('Invalid or expired coupon code.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Coupon removed.');
  };

  const handleAction = async (action) => {
    try {
      setProcessing(true);
      await quoteAction(consultation._id, action, { 
        couponCode: appliedCoupon?.code || '', 
        loyaltyDiscount 
      });
      toast.success(action === 'ACCEPT' ? '🎉 Booking Confirmed!' : 'Quote declined');
      if (onActionComplete) onActionComplete();
    } catch (err) {
      console.error(err);
      toast.error('Action failed. Try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden mb-6 shadow-xl hover:shadow-2xl transition-all duration-300">
      {/* Premium Header Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-widest backdrop-blur-md">
            Action Required
          </span>
          <span className="text-white text-sm font-extrabold ml-1">New Quotation Received</span>
        </div>
        <span className="text-xs text-white/90 font-bold flex items-center gap-1">
          <FiClock className="animate-pulse" /> Just Now
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* Final Bill Amount Card */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-5 text-white relative overflow-hidden shadow-lg border border-white/5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl" />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Payable Amount</p>
          <p className="text-4xl font-black mt-1 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">
            ₹{totalPayable.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <FiInfo className="text-orange-400" /> Grand Total includes materials, labor & GST
          </p>
        </div>

        {/* Project Summary */}
        <div className="bg-slate-50 rounded-2xl p-5 space-y-4 border border-slate-100">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Project Details</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center bg-white p-3 rounded-xl border border-slate-100">
              <p className="text-2xl font-black text-slate-800">
                {getRoomsCount()}
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Rooms</p>
            </div>
            <div className="text-center bg-white p-3 rounded-xl border border-slate-100">
              <p className="text-2xl font-black text-slate-800">
                {quotation.estimatedWorkDays || consultation?.wizardData?.estimatedWorkDays || 3}
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Est. Days</p>
            </div>
            <div className="text-center bg-white p-3 rounded-xl border border-slate-100">
              <p className="text-base font-black text-orange-600 truncate pt-1">
                {products[0]?.brand?.replace('_', ' ') || consultation?.wizardData?.paintBrand?.replace('_', ' ') || 'ASIAN'}
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Brand</p>
            </div>
          </div>
        </div>

        {/* Painter & Supervisor Details */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Assigned Professional</h3>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-2xl overflow-hidden flex-shrink-0 border-2 border-white shadow-md">
              {painter.photoUrl ? (
                <img src={painter.photoUrl} alt={painter.name} className="w-full h-full object-cover" />
              ) : (
                <span>👷</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-slate-800 truncate">{painter.name || vendor.name || 'Pro Painter'}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-yellow-500 text-sm">★</span>
                <span className="text-xs font-bold text-slate-600">{painter.rating || vendor.rating || '4.8'}</span>
                <span className="text-[10px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-bold">
                  {painter.badge || 'Pro-Level Artisan'}
                </span>
              </div>
            </div>
          </div>
          {quotation.vendorNotes && (
            <div className="bg-orange-50/50 rounded-xl p-3.5 border border-orange-100/50">
              <p className="text-[10px] text-orange-800 font-black uppercase tracking-wider mb-0.5">Vendor notes:</p>
              <p className="text-xs text-slate-700 italic">"{quotation.vendorNotes}"</p>
            </div>
          )}
        </div>

        {/* Dynamic Billing Items List */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Itemized Quote Details</h3>
          
          <div className="divide-y divide-gray-100">
            {/* Materials snaps */}
            {products.length > 0 && (
              <div className="pb-3.5 space-y-2">
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Paint & Coatings</p>
                {products.map((p, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-1">
                    <span className="text-slate-600">{p.title || p.productName} ({p.liters || p.quantity} Liters)</span>
                    <span className="font-extrabold text-slate-800">₹{(p.cost || p.price || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Labour snaps */}
            {labour.length > 0 && (
              <div className="py-3.5 space-y-2">
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Labour Charges</p>
                {labour.map((l, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-1">
                    <span className="text-slate-600">{l.title || l.labourRateName} ({l.area || l.sqft} sqft @ ₹{l.rate || l.costPerSqft}/sqft)</span>
                    <span className="font-extrabold text-slate-800">₹{(l.cost || l.subtotal || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Additional charges */}
            {additionalCharges.length > 0 && (
              <div className="py-3.5 space-y-2">
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Additional Charges</p>
                {additionalCharges.map((ac, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-1">
                    <span className="text-slate-600">{ac.title || ac.name} {ac.remarks ? `(${ac.remarks})` : ''}</span>
                    <span className="font-extrabold text-slate-800">₹{(ac.cost || ac.amount || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Summary subtotals */}
            <div className="pt-3.5 space-y-2">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Material Cost</span>
                <span className="font-semibold text-slate-800">₹{materialCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Labour Cost</span>
                <span className="font-semibold text-slate-800">₹{labourCost.toLocaleString()}</span>
              </div>
              {additionalServicesCost > 0 && (
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Additional Charges</span>
                  <span className="font-semibold text-slate-800">₹{additionalServicesCost.toLocaleString()}</span>
                </div>
              )}
              {appliedCoupon && (
                <div className="flex justify-between text-xs text-green-600 font-bold">
                  <span>Coupon Discount ({appliedCoupon.code} - {appliedCoupon.discountPercent}%)</span>
                  <span>-₹{couponDiscountAmount.toFixed(0)}</span>
                </div>
              )}
              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-xs text-indigo-600 font-bold">
                  <span>Loyalty Discount ({loyaltyDiscount}%)</span>
                  <span>-₹{loyaltyAmount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-slate-600">
                <span>GST (18%)</span>
                <span className="font-semibold text-slate-800">₹{gstAmount.toLocaleString()}</span>
              </div>
              
              <div className="border-t border-dashed border-gray-200 pt-3 mt-1 flex justify-between items-center">
                <span className="text-sm font-extrabold text-slate-800">Final Price</span>
                <span className="text-2xl font-black text-orange-600">
                  ₹{totalPayable.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Discounts & Promotions inputs */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Discounts & Promotions</h3>

          {/* Coupon Code Input */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                disabled={appliedCoupon !== null}
                placeholder={appliedCoupon ? `Applied: ${appliedCoupon.code}` : "Enter coupon code (e.g. SUCCESS20)"}
                className="flex-1 border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-orange-400 uppercase disabled:bg-gray-50 disabled:text-gray-400"
              />
              {appliedCoupon ? (
                <button 
                  onClick={handleRemoveCoupon}
                  className="bg-red-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-red-600 transition-colors"
                >
                  Remove
                </button>
              ) : (
                <button 
                  onClick={handleApplyCoupon}
                  className="bg-orange-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-orange-600 transition-colors"
                >
                  Apply
                </button>
              )}
            </div>
          </div>

          {/* Loyalty Points Range Slider */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-700">Loyalty Points Discount</p>
              <span className="text-sm font-black text-orange-600">{loyaltyDiscount}% Off</span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="1"
              value={loyaltyDiscount}
              onChange={e => setLoyaltyDiscount(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #f97316 0%, #f97316 ${(loyaltyDiscount / 15) * 100}%, #e5e7eb ${(loyaltyDiscount / 15) * 100}%, #e5e7eb 100%)`
              }}
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
              <span>0%</span>
              <span>15%</span>
            </div>
            {loyaltyDiscount > 0 && (
              <p className="text-xs text-orange-600 font-bold mt-2">
                Save ₹{loyaltyAmount.toFixed(0)} extra with loyalty points!
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => handleAction('ACCEPT')}
            disabled={processing}
            className={`w-full py-4 rounded-2xl text-white font-bold text-base transition-all flex items-center justify-center gap-2 ${
              processing ? 'bg-orange-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 shadow-xl shadow-orange-500/20 active:scale-[0.98]'
            }`}
          >
            {processing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>✅ Confirm & Book Painting</>
            )}
          </button>
          <button
            onClick={() => handleAction('DECLINE')}
            disabled={processing}
            className="w-full py-3 rounded-2xl border-2 border-gray-150 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all active:scale-[0.98]"
          >
            Decline Quote
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuoteApproval;
