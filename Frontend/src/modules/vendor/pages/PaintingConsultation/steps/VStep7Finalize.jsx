import React, { useState } from 'react';
import { FiCheck } from 'react-icons/fi';

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

  const [addExterior, setAddExterior] = useState(false);
  const [addInterior, setAddInterior] = useState(false);
  const [addOther, setAddOther] = useState(false);
  const [otherText, setOtherText] = useState('');

  const { finalEstimate = 0, measurements = {} } = quoteData;
  const { totalPaint = 0, totalPrimer = 0, totalPutty = 0 } = measurements;

  const baseServiceFee = finalEstimate - (totalPaint + totalPrimer + totalPutty);
  const materialsCost = totalPaint + totalPrimer + totalPutty;
  
  const discountAmount = finalEstimate * (discountPct / 100);
  const grandTotal = finalEstimate - discountAmount;

  // Approximate duration: 1 day for every ₹10,000 of base fee per painter
  const estDays = Math.max(1, Math.ceil(baseServiceFee / 10000 / painters));

  const handleSubmit = () => {
    if (grandTotal <= 0) {
      toast.error('Quotation total is ₹0. Please go back to enter surface measurements or add labor rates first.');
      return;
    }

    const extraNotesParts = [];
    if (addExterior) extraNotesParts.push('Added Exterior Painting');
    if (addInterior) extraNotesParts.push('Added Interior Painting');
    if (addOther && otherText.trim()) extraNotesParts.push(`Other: ${otherText.trim()}`);
    
    const extraNotes = extraNotesParts.length > 0 ? `Additional Scopes: ${extraNotesParts.join(', ')}` : '';

    updateQuoteData({ painters, startDate, pMode, discountPct, estDays, grandTotal, extraNotes });
    onSubmit({
      ...quoteData,
      painters,
      startDate,
      pMode,
      discountPct,
      estDays,
      grandTotal,
      extraNotes
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
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">Estimated Duration</p>
              <p className="text-sm font-black text-gray-850">{estDays} Working Days</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-405">Based on layout size</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Date Selection */}
        <div className="col-span-2 bg-white border-2 border-gray-200 p-5 rounded-2xl flex flex-col justify-between">
          <label className="text-sm font-bold text-gray-700 mb-2">Preferred Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-xl font-black text-gray-800 p-0 cursor-pointer"
          />
        </div>

        {/* Number of Painters */}
        <div className="col-span-1 bg-white border-2 border-gray-200 p-5 rounded-2xl flex flex-col justify-between">
          <label className="text-sm font-bold text-gray-700 mb-2">No. of Painters</label>
          <Counter value={painters} onChange={setPainters} min={1} />
        </div>

        {/* Pricing Mode */}
        <div className="col-span-1 bg-white border-2 border-gray-200 p-5 rounded-2xl flex flex-col justify-between">
          <label className="text-sm font-bold text-gray-700 mb-2">P-Mode Style</label>
          <div className="flex gap-2">
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
        <div className="col-span-2 bg-white border-2 border-gray-200 p-5 rounded-2xl flex flex-col justify-between">
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
        </div>
      </div>

      {/* Dynamic Additional Scope Add-ons */}
      <div className="bg-white border-2 border-gray-200 p-5 rounded-2xl space-y-4">
        <div>
          <h4 className="text-sm font-bold text-gray-800">Add Additional Requirements / Scopes</h4>
          <p className="text-[11px] text-gray-400 mt-0.5">Customize and expand the scope of the painting quote.</p>
        </div>
        
        <div className="space-y-2.5">
          {/* Show Add Exterior option if original was Interior Only */}
          {quoteData.scope === 'interior' && (
            <div 
              onClick={() => setAddExterior(!addExterior)}
              className={`p-3.5 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                addExterior 
                  ? 'border-orange-500 bg-orange-50/50' 
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                addExterior ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300'
              }`}>
                {addExterior && <FiCheck className="w-3.5 h-3.5 text-white stroke-[3px]" />}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-850">Add Exterior Painting</p>
                <p className="text-[10px] text-gray-500">balconies, building exterior</p>
              </div>
            </div>
          )}

          {/* Show Add Interior option if original was Exterior Only */}
          {quoteData.scope === 'exterior' && (
            <div 
              onClick={() => setAddInterior(!addInterior)}
              className={`p-3.5 rounded-xl border transition-all flex items-center gap-3 cursor-pointer ${
                addInterior 
                  ? 'border-orange-500 bg-orange-50/50' 
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                addInterior ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300'
              }`}>
                {addInterior && <FiCheck className="w-3.5 h-3.5 text-white stroke-[3px]" />}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-855">Add Interior Painting</p>
                <p className="text-[10px] text-gray-500">walls, ceilings inside</p>
              </div>
            </div>
          )}

          {/* Other Requirement option (always visible) */}
          <div 
            onClick={() => setAddOther(!addOther)}
            className={`p-3.5 rounded-xl border transition-all flex flex-col gap-3.5 cursor-pointer ${
              addOther 
                ? 'border-orange-500 bg-orange-50/50' 
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                addOther ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300'
              }`}>
                {addOther && <FiCheck className="w-3.5 h-3.5 text-white stroke-[3px]" />}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-855">Add Custom / Other Requirement</p>
                <p className="text-[10px] text-gray-500">waterproofing, repair works, etc.</p>
              </div>
            </div>
            
            {addOther && (
              <div className="w-full space-y-1.5" onClick={e => e.stopPropagation()}>
                <textarea
                  rows={2}
                  value={otherText}
                  onChange={e => setOtherText(e.target.value)}
                  placeholder="Describe custom requirement..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-orange-500 bg-white resize-none font-medium text-gray-800"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Final Action CTA */}
      <div className="flex gap-3 pb-8">
        <button onClick={onBack} className="px-5 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all">← Back</button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={`flex-1 py-4 rounded-2xl text-white font-bold text-base transition-all flex items-center justify-center gap-2 shadow-xl shadow-orange-200 ${
            submitting
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
