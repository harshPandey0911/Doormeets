import React from 'react';
import { requestConsultation } from '../../services/paintingConsultationService';
import { toast } from 'react-hot-toast';

const FinalizeBooking = ({ wizardData, updateWizardData, onBack, onSuccess, propertyType }) => {
  const [submitting, setSubmitting] = React.useState(false);
  const {
    numberOfPainters = 2,
    preferredStartDate = '',
    pModeStyle = 'ASSEMBLY',
    discount = 0,
    estimatedTotal = 0,
    rooms = [],
    bookingType = 'INSTANT',
    scheduledSlot = { date: null, timeSlot: '' }
  } = wizardData;

  const totalArea = rooms.reduce((acc, r) => acc + (r.netArea || 0), 0);
  const estimatedWorkDays = Math.max(2, Math.ceil(totalArea / 400));
  const baseFee = estimatedTotal * 0.82;
  const materialsFee = estimatedTotal * 0.18;
  const discountAmount = (estimatedTotal * discount) / 100;
  const grandTotal = estimatedTotal - discountAmount;

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      const payload = {
        propertyType: propertyType || '2BHK',
        address: {
          street: '', city: '', state: '', pincode: '',
          fullAddress: 'Address on file'
        },
        bookingType: bookingType || 'INSTANT',
        scheduledSlot: bookingType === 'SCHEDULED' ? scheduledSlot : undefined,
        wizardData: { ...wizardData, grandTotal, estimatedWorkDays }
      };
      await requestConsultation(payload);
      const successMsg = bookingType === 'SCHEDULED'
        ? `📅 Inspection scheduled for ${scheduledSlot?.timeSlot}! Vendors are being notified.`
        : '🎉 Booking submitted! Vendors near you are being notified.';
      toast.success(successMsg);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white sticky top-0 z-40 border-b border-gray-200 h-16 flex items-center gap-3 px-4">
        {onBack && (
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <span className="text-orange-500 text-lg">←</span>
          </button>
        )}
        <h1 className="font-bold text-orange-600 text-lg">Finalize Booking</h1>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-5">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Confirm Your Plan</h2>
          <p className="text-sm text-gray-500 mt-1">Review final details and schedule your painting project.</p>
        </div>

        {/* Booking Type Banner */}
        <div className={`flex items-center gap-3 rounded-2xl p-4 border-2 ${
          bookingType === 'SCHEDULED'
            ? 'bg-indigo-50 border-indigo-200'
            : 'bg-orange-50 border-orange-200'
        }`}>
          <span className="text-2xl">{bookingType === 'SCHEDULED' ? '📅' : '⚡'}</span>
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${
              bookingType === 'SCHEDULED' ? 'text-indigo-600' : 'text-orange-600'
            }`}>
              {bookingType === 'SCHEDULED' ? 'Scheduled Inspection' : 'Instant Booking'}
            </p>
            <p className="text-sm font-semibold text-gray-800">
              {bookingType === 'SCHEDULED' && scheduledSlot?.timeSlot
                ? `${new Date(scheduledSlot.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · ${scheduledSlot.timeSlot}`
                : 'A vendor will be assigned within 2–4 hours'}
            </p>
          </div>
        </div>

        {/* Estimated Work Days */}
        <div className="flex items-center justify-between bg-white rounded-2xl border-2 border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <span className="text-orange-500 text-xl">⏱️</span>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Estimated Duration</p>
              <p className="text-3xl font-black text-gray-900">{estimatedWorkDays} Days</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">{totalArea.toFixed(0)} sqft</p>
            <p className="text-xs text-gray-400">{rooms.length} Room(s)</p>
          </div>
        </div>

        {/* Number of Painters */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="font-bold text-gray-700">Number of Painters</p>
            <span className="text-xl">👷</span>
          </div>
          <div className="flex items-center gap-5 mt-3">
            <button
              onClick={() => updateWizardData({ numberOfPainters: Math.max(1, numberOfPainters - 1) })}
              className="w-14 h-14 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-xl hover:border-orange-400 transition-all flex items-center justify-center"
            >
              −
            </button>
            <span className="text-4xl font-black text-gray-900 flex-1 text-center">{numberOfPainters}</span>
            <button
              onClick={() => updateWizardData({ numberOfPainters: numberOfPainters + 1 })}
              className="w-14 h-14 rounded-2xl bg-orange-500 text-white font-bold text-xl hover:bg-orange-600 transition-all flex items-center justify-center shadow-lg shadow-orange-200"
            >
              +
            </button>
          </div>
        </div>

        {/* Preferred Start Date */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-5">
          <label className="block font-bold text-gray-700 mb-3">📅 Preferred Start Date</label>
          <input
            type="date"
            value={preferredStartDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => updateWizardData({ preferredStartDate: e.target.value })}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-semibold focus:outline-none focus:border-orange-400 text-lg"
          />
        </div>

        {/* P-Mode Style & Discount */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">P-Mode Style</p>
            <div className="space-y-2">
              {['ASSEMBLY', 'BASIC'].map(mode => (
                <button
                  key={mode}
                  onClick={() => updateWizardData({ pModeStyle: mode })}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                    pModeStyle === mode ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {mode.charAt(0) + mode.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-gray-200 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Discount %</p>
            <div className="flex items-center gap-2 mt-4">
              <input
                type="number"
                min="0"
                max="30"
                value={discount}
                onChange={e => updateWizardData({ discount: parseFloat(e.target.value) || 0 })}
                className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-3 text-3xl font-black text-center focus:outline-none focus:border-orange-400"
              />
              <span className="text-gray-400 font-bold text-xl">%</span>
            </div>
          </div>
        </div>

        {/* Cost Summary */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Cost Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Base Service Fee</span>
              <span className="font-semibold text-gray-800">₹{baseFee.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Materials & Equipment</span>
              <span className="font-semibold text-gray-800">₹{materialsFee.toFixed(0)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-orange-600">
                <span>Discount ({discount}%)</span>
                <span className="font-semibold">-₹{discountAmount.toFixed(0)}</span>
              </div>
            )}
          </div>
          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between">
              <span className="font-bold text-gray-800">GRAND TOTAL</span>
              <span className="font-black text-orange-600 text-2xl">₹{grandTotal.toFixed(0)}</span>
            </div>
            <p className="text-xs text-gray-400 text-right mt-0.5">Inc. Taxes</p>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`w-full py-4 rounded-2xl text-white font-bold text-base transition-all flex items-center justify-center gap-2 ${
            submitting ? 'bg-orange-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 shadow-xl shadow-orange-200'
          }`}
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating Quotation...
            </>
          ) : (
            <>📄 Generate Quotation</>
          )}
        </button>

        <button onClick={onBack} className="w-full py-3 rounded-2xl border-2 border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition-all">
          ← Back
        </button>
      </div>
    </div>
  );
};

export default FinalizeBooking;
