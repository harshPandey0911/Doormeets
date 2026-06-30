import React, { useState } from 'react';

const Counter = ({ value, onChange, min = 1 }) => (
  <div className="flex items-center gap-3">
    <button
      onClick={() => onChange(Math.max(min, value - 1))}
      className="w-10 h-10 rounded-lg border-2 border-gray-300 text-gray-600 flex items-center justify-center font-bold hover:border-orange-400 transition-colors"
    >−</button>
    <span className="font-bold text-gray-800 w-8 text-center text-lg">{value}</span>
    <button
      onClick={() => onChange(value + 1)}
      className="w-10 h-10 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold hover:bg-orange-600 transition-colors shadow-sm"
    >+</button>
  </div>
);

const VStep7Finalize = ({ quoteData, updateQuoteData, onBack, onSubmit, submitting }) => {
  const [painters, setPainters] = useState(quoteData.painters || 2);
  const [startDate, setStartDate] = useState(quoteData.startDate || new Date().toISOString().split('T')[0]);
  const [pMode, setPMode] = useState(quoteData.pMode || 'assembly');
  const [discountPct, setDiscountPct] = useState(quoteData.discountPct || 0);

  const { finalEstimate = 0, measurements = {} } = quoteData;
  const { totalPaint = 0, totalPrimer = 0, totalPutty = 0 } = measurements;

  const baseServiceFee = finalEstimate - (totalPaint + totalPrimer + totalPutty);
  const materialsCost = totalPaint + totalPrimer + totalPutty;
  
  const discountAmount = finalEstimate * (discountPct / 100);
  const grandTotal = finalEstimate - discountAmount;

  // Approximate duration: 1 day for every ₹10,000 of base fee per painter
  const estDays = Math.max(1, Math.ceil(baseServiceFee / 10000 / painters));

  const handleSubmit = () => {
    updateQuoteData({ painters, startDate, pMode, discountPct, estDays, grandTotal });
    onSubmit({
      ...quoteData,
      painters,
      startDate,
      pMode,
      discountPct,
      estDays,
      grandTotal,
    });
  };

  return (
    <div className="space-y-6">
      {/* Hero Summary */}
      <div>
        <h2 className="text-2xl font-black text-gray-800 mb-1">Finalize Your Plan</h2>
        <p className="text-sm text-gray-500 mb-5">Review your painting project details and generate a professional quotation.</p>
        
        <div className="bg-white border-2 border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 text-2xl">
              ⏱️
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Estimated Work</p>
              <p className="text-lg font-black text-gray-800">{estDays} Day{estDays !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <span className="text-2xl opacity-80">✅</span>
        </div>
      </div>

      {/* Configuration Bento Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Number of Painters */}
        <div className="col-span-2 bg-white border-2 border-gray-200 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <label className="text-sm font-bold text-gray-700">Number of Painters</label>
            <span className="text-xl opacity-80">👷</span>
          </div>
          <div className="flex items-center justify-between">
            <Counter value={painters} onChange={setPainters} />
          </div>
        </div>

        {/* Start Date */}
        <div className="col-span-2 bg-white border-2 border-gray-200 p-5 rounded-2xl">
          <label className="text-sm font-bold text-gray-700 block mb-3">Preferred Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 focus:border-orange-500 outline-none font-bold text-gray-700 transition-colors"
          />
        </div>

        {/* P-Mode */}
        <div className="col-span-1 bg-white border-2 border-gray-200 p-5 rounded-2xl">
          <label className="text-sm font-bold text-gray-700 block mb-3">P-Mode Style</label>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setPMode('assembly')}
              className={`text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                pMode === 'assembly' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Assembly
            </button>
            <button
              onClick={() => setPMode('basic')}
              className={`text-left px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                pMode === 'basic' ? 'bg-orange-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Basic
            </button>
          </div>
        </div>

        {/* Discount */}
        <div className="col-span-1 bg-white border-2 border-gray-200 p-5 rounded-2xl flex flex-col justify-between">
          <label className="text-sm font-bold text-gray-700">Discount %</label>
          <div className="flex items-center gap-2 border-b-2 border-gray-200 focus-within:border-orange-500 transition-colors py-2">
            <input
              type="number"
              min="0"
              max="100"
              value={discountPct}
              onChange={e => setDiscountPct(parseFloat(e.target.value) || 0)}
              className="w-full bg-transparent border-none outline-none text-3xl font-black text-gray-800 p-0"
              placeholder="0"
            />
            <span className="text-2xl text-gray-400 font-bold">%</span>
          </div>
        </div>
      </div>

      {/* Trust Banner */}
      <div className="relative w-full h-32 rounded-2xl overflow-hidden shadow-sm">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDM4d2zajkifug-_OIB_qEo_SpaLFTDrv7RVhEHmwZAyogjBpff0eHOVtIvoMUENZ6ULI86Lbs2M2ks-qDU5TwkqTQ4u-kxVHQY_NPP9p-Db2fPf1D9YecM32gKdeCohVVtPmTKvIUBepv9_ucyIIn5cVunW05q-GzBcmm1Q2h6Tldv_hBgg1HSXkqVQV_pizoNmFxzg0wiuymwIjlEE3TW5_mqX0Tupc0xmpWFrgH51XDgZSfx6PyWaWkTQLdiYHVM2XPhADrZ1JM"
          alt="Professional Painters"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-end p-4">
          <p className="text-white font-bold text-sm tracking-wide">🏆 Certified UrbanPaint Professionals</p>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="bg-gray-100 rounded-3xl p-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-bold text-gray-600">Base Service Fee</span>
          <span className="text-sm font-black text-gray-800">₹{baseServiceFee.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-bold text-gray-600">Materials & Equipment</span>
          <span className="text-sm font-black text-gray-800">₹{materialsCost.toLocaleString()}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-bold text-green-600">Discount ({discountPct}%)</span>
            <span className="text-sm font-black text-green-600">-₹{discountAmount.toLocaleString()}</span>
          </div>
        )}
        <div className="h-px bg-gray-300 w-full my-4"></div>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-1">Grand Total</p>
            <p className="text-3xl font-black text-gray-900">₹{grandTotal.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-500">Inc. Taxes</p>
          </div>
        </div>
      </div>

      {/* Final Action CTA */}
      <div className="flex gap-3 pb-8">
        <button onClick={onBack} className="px-5 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all">← Back</button>
        <button
          onClick={handleSubmit}
          disabled={submitting || grandTotal <= 0}
          className={`flex-1 py-4 rounded-2xl text-white font-bold text-base transition-all flex items-center justify-center gap-2 shadow-xl shadow-orange-200 ${
            submitting || grandTotal <= 0
              ? 'bg-orange-300 cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-600 hover:scale-[1.02]'
          }`}
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <span className="text-xl">📄</span> Generate Quotation
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default VStep7Finalize;
