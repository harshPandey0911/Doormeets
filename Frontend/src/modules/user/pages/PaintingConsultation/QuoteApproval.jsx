import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

const QuoteApproval = ({ consultation, onActionComplete }) => {
  const [couponCode, setCouponCode] = useState('');
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const [processing, setProcessing] = useState(false);

  const quotation = consultation?.quotationId || {};
  const vendor = consultation?.vendorId || {};
  const painter = quotation?.painterDetails || {};
  const rooms = quotation?.rooms || [];
  const calculation = quotation?.calculation || {};

  const grandTotal = calculation.grandTotal || 0;
  const loyaltyAmount = (grandTotal * loyaltyDiscount) / 100;
  const totalPayable = grandTotal - loyaltyAmount;

  const handleAction = async (action) => {
    try {
      setProcessing(true);
      // Import dynamically to avoid circular deps
      const { quoteAction } = await import('../../services/paintingConsultationService');
      await quoteAction(consultation._id, action, { couponCode, loyaltyDiscount });
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
    <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden mb-4 hover:shadow-lg transition-shadow">
      {/* Action Required Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-3 flex items-center gap-2">
        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold text-white uppercase tracking-wider">
          Action Required
        </span>
        <span className="text-white text-sm font-semibold ml-auto">New Quotation Received</span>
      </div>

      <div className="p-5 space-y-5">
        {/* Final Bill Amount Card */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Final Bill Amount</p>
          <p className="text-4xl font-black mt-1">₹{grandTotal.toLocaleString()}</p>
          <p className="text-xs opacity-70 mt-1">Includes materials & taxes</p>
        </div>

        {/* Project Summary */}
        <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Project Summary</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-2xl font-black text-gray-800">{rooms.length || consultation?.wizardData?.rooms?.length || 0}</p>
              <p className="text-xs text-gray-500">Rooms</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-gray-800">{quotation.timeline || '3-5'}</p>
              <p className="text-xs text-gray-500">Days</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-gray-800">{quotation.finishing || 'Premium'}</p>
              <p className="text-xs text-gray-500">Finish</p>
            </div>
          </div>
        </div>

        {/* Painter Details (Screen 8) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Painter Details</h3>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
              {painter.photoUrl ? (
                <img src={painter.photoUrl} alt={painter.name} className="w-full h-full object-cover" />
              ) : (
                <span>👷</span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-800">{painter.name || vendor.name || 'Professional Painter'}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-yellow-500 text-sm">★</span>
                <span className="text-sm font-semibold text-gray-600">{painter.rating || vendor.rating || '4.8'}</span>
                <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-semibold">
                  {painter.badge || 'Pro-Level Artisan'}
                </span>
              </div>
            </div>
          </div>
          {quotation.vendorNotes && (
            <div className="mt-3 bg-orange-50 rounded-xl p-3 border border-orange-100">
              <p className="text-xs text-gray-500 font-semibold mb-1">Vendor's Note:</p>
              <p className="text-sm text-gray-700 italic">"{quotation.vendorNotes}"</p>
            </div>
          )}
        </div>

        {/* Discounts & Promotions */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Discounts & Promotions</h3>

          {/* Coupon Code */}
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={e => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter coupon code"
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-orange-400 uppercase"
            />
            <button className="bg-orange-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-orange-600 transition-colors">
              Apply
            </button>
          </div>

          {/* Loyalty Points Slider */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">Loyalty Points Discount</p>
              <span className="text-sm font-bold text-orange-600">{loyaltyDiscount}%</span>
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
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0%</span>
              <span>15%</span>
            </div>
            {loyaltyDiscount > 0 && (
              <p className="text-xs text-orange-600 font-semibold mt-2">
                You save ₹{loyaltyAmount.toFixed(0)} with loyalty points!
              </p>
            )}
          </div>
        </div>

        {/* Itemized Quote Summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Quote Summary</h3>

          {rooms.map((r, idx) => (
            <div key={idx} className="flex justify-between text-sm py-1.5">
              <span className="text-gray-600">{r.name} ({r.sqft || 0} sqft)</span>
              <span className="font-semibold text-gray-800">₹{(r.subtotal || 0).toLocaleString()}</span>
            </div>
          ))}

          {calculation.additionalServicesCost > 0 && (
            <div className="flex justify-between text-sm py-1.5">
              <span className="text-gray-600">Additional Services</span>
              <span className="font-semibold text-gray-800">₹{calculation.additionalServicesCost.toLocaleString()}</span>
            </div>
          )}

          {calculation.woodEnamelCost > 0 && (
            <div className="flex justify-between text-sm py-1.5">
              <span className="text-gray-600">Wood & Enamel</span>
              <span className="font-semibold text-gray-800">₹{calculation.woodEnamelCost.toLocaleString()}</span>
            </div>
          )}

          {loyaltyDiscount > 0 && (
            <div className="flex justify-between text-sm py-1.5 text-orange-600">
              <span>Loyalty Discount ({loyaltyDiscount}%)</span>
              <span className="font-semibold">-₹{loyaltyAmount.toFixed(0)}</span>
            </div>
          )}

          {calculation.gst > 0 && (
            <div className="flex justify-between text-sm py-1.5">
              <span className="text-gray-600">GST</span>
              <span className="font-semibold text-gray-800">₹{calculation.gst.toLocaleString()}</span>
            </div>
          )}

          <div className="border-t border-gray-200 pt-3 mt-2">
            <div className="flex justify-between">
              <span className="font-bold text-gray-800">Total Payable</span>
              <span className="font-black text-orange-600 text-xl">₹{totalPayable.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => handleAction('ACCEPT')}
            disabled={processing}
            className={`w-full py-4 rounded-2xl text-white font-bold text-base transition-all flex items-center justify-center gap-2 ${
              processing ? 'bg-orange-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 shadow-xl shadow-orange-200'
            }`}
          >
            {processing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>✅ Confirm & Book</>
            )}
          </button>
          <button
            onClick={() => handleAction('DECLINE')}
            disabled={processing}
            className="w-full py-3 rounded-2xl border-2 border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition-all"
          >
            Decline Quote
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuoteApproval;
