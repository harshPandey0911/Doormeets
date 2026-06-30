import React from 'react';

const Step5Finalize = ({ wizardData, updateWizardData, goBack, onSubmit, submitting }) => {
  const { numberOfPainters = 2, preferredStartDate = '', pModeStyle = 'ASSEMBLY', discount = 0, estimatedTotal = 0, rooms = [] } = wizardData;

  const totalArea = rooms.reduce((acc, r) => acc + (r.netArea || 0), 0);
  const baseFee = estimatedTotal * 0.82;
  const materialsFee = estimatedTotal * 0.18;
  const discountAmount = (estimatedTotal * discount) / 100;
  const grandTotal = estimatedTotal - discountAmount;

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Finalize Your Plan</h2>
        <p className="text-gray-500 text-sm mt-1">Review your painting project details and generate a professional quotation.</p>
      </div>

      {/* Estimated Work Days */}
      <div className="flex items-center justify-between bg-white rounded-2xl border-2 border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <span className="text-orange-500 text-lg">⏱️</span>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-semibold">Estimated Work</p>
            <p className="text-xl font-black text-gray-900">{Math.max(2, Math.ceil(totalArea / 400))} Days</p>
          </div>
        </div>
        <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200">
          ⚙️
        </button>
      </div>

      {/* Number of Painters */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold text-gray-700">Number of Painters</p>
          <span className="text-orange-400 text-lg">👷</span>
        </div>
        <div className="flex items-center gap-4 mt-3">
          <button
            onClick={() => updateWizardData({ numberOfPainters: Math.max(1, numberOfPainters - 1) })}
            className="w-12 h-12 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-xl hover:border-orange-400 transition-all flex items-center justify-center"
          >
            −
          </button>
          <span className="text-3xl font-black text-gray-900 flex-1 text-center">{numberOfPainters}</span>
          <button
            onClick={() => updateWizardData({ numberOfPainters: numberOfPainters + 1 })}
            className="w-12 h-12 rounded-xl bg-orange-500 text-white font-bold text-xl hover:bg-orange-600 transition-all flex items-center justify-center shadow-lg shadow-orange-200"
          >
            +
          </button>
        </div>
      </div>

      {/* Preferred Start Date */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">Preferred Start Date</label>
        <div className="relative">
          <input
            type="date"
            value={preferredStartDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={e => updateWizardData({ preferredStartDate: e.target.value })}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-semibold focus:outline-none focus:border-orange-400"
          />
        </div>
      </div>

      {/* P-Mode Style & Discount */}
      <div className="grid grid-cols-2 gap-3">
        {/* P-Mode */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">P-MODE STYLE</p>
          <div className="space-y-2">
            {['ASSEMBLY', 'BASIC'].map(mode => (
              <button
                key={mode}
                onClick={() => updateWizardData({ pModeStyle: mode })}
                className={`w-full py-2 rounded-xl text-sm font-bold transition-all ${
                  pModeStyle === mode ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {mode.charAt(0) + mode.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Discount */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-500 mb-2">DISCOUNT %</p>
          <div className="flex items-center gap-2 mt-4">
            <input
              type="number"
              min="0"
              max="30"
              value={discount}
              onChange={e => updateWizardData({ discount: parseFloat(e.target.value) || 0 })}
              className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-2xl font-bold text-center focus:outline-none focus:border-orange-400"
            />
            <span className="text-gray-400 font-bold text-lg">%</span>
          </div>
        </div>
      </div>

      {/* Certified Banner */}
      <div className="relative w-full h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-700 to-gray-900">
        <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-10">🏆</div>
        <div className="absolute inset-0 flex items-end p-4">
          <p className="text-white font-bold text-sm">Certified UrbanPaint Professionals Guaranteed</p>
        </div>
      </div>

      {/* Cost Summary */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-4">
        <div className="space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Base Service Fee</span>
            <span className="font-semibold text-gray-800">₹{baseFee.toFixed(0)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Materials & Equipment</span>
            <span className="font-semibold text-gray-800">₹{materialsFee.toFixed(0)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span className="text-orange-600">Discount ({discount}%)</span>
              <span className="font-semibold text-orange-600">-₹{discountAmount.toFixed(0)}</span>
            </div>
          )}
          <div className="border-t border-gray-200 pt-3">
            <div className="flex justify-between">
              <span className="font-bold text-gray-800 text-sm">GRAND TOTAL</span>
              <span className="font-black text-orange-600 text-xl">₹{grandTotal.toFixed(0)}</span>
            </div>
            <p className="text-xs text-gray-400 text-right mt-0.5">Inc. Taxes</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="space-y-3 pb-10">
        <button
          onClick={() => {
            updateWizardData({ grandTotal, estimatedWorkDays: Math.max(2, Math.ceil(totalArea / 400)) });
            onSubmit();
          }}
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
            <>
              📄 Generate Quotation
            </>
          )}
        </button>
        <button onClick={goBack} className="w-full py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all">
          ← Back
        </button>
      </div>
    </div>
  );
};

export default Step5Finalize;
