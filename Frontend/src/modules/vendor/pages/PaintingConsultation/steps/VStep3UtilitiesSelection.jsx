import React, { useState } from 'react';

const UTILITY_ITEMS = [
  { id: 'doors',   label: 'Doors',   icon: 'sensor_door', enamelRate: 120, addlRate: 80 },
  { id: 'grills',  label: 'Grills',  icon: 'grid_view',   enamelRate: 90,  addlRate: 60 },
  { id: 'windows', label: 'Windows', icon: 'window',       enamelRate: 100, addlRate: 70 },
  { id: 'panels',  label: 'Panels',  icon: 'dashboard',    enamelRate: 150, addlRate: 100 },
];

const VStep3UtilitiesSelection = ({ quoteData, updateQuoteData, onNext, onBack }) => {
  const [utilities, setUtilities] = useState(
    quoteData.utilities?.length > 0 ? quoteData.utilities :
    UTILITY_ITEMS.map(u => ({ id: u.id, selected: false, enamel: false, additionalService: false }))
  );

  const update = (id, field, val) => {
    setUtilities(prev => prev.map(u => u.id === id ? { ...u, [field]: val } : u));
  };

  const selectedCount = utilities.filter(u => u.selected).length;
  const enamelCount = utilities.filter(u => u.enamel).length;

  const handleNext = () => {
    updateQuoteData({ utilities });
    onNext();
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Step 3 — Utilities</p>
        <h3 className="text-xl font-bold text-gray-800">Utilities Selection</h3>
        <p className="text-sm text-gray-500 mt-1">Select the specific items that require painting or maintenance services.</p>
      </div>

      {/* Hero Image */}
      <div className="relative w-full h-36 rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnN94URec8lf2Q9cMB5rp5kxKG-PlyRaQyqNh-6m_7yp575MSpUQMPMe9OMtxY3PQ2yNfFFE132AN6DYLn-6f20QHL4Ws9H57W-df7AP9yt7twLAwzClLDWGYy9YASzaS1xHnS8l-EAvbm-5PUp0oFYBGaoENRvg-mL4Nj_WoYHW6yoqyB0gcJz5uAzegMX0swFwbnmiiqMj6JuYVzhSTUXkGkMIQh6zus6jSJkGLLhl59r4Nr3PriYfo5T9jOHSNbezB4vzuMYCU"
          alt="Itemized Planning"
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-3 left-4 z-20">
          <p className="text-white font-bold text-sm">Itemized Planning</p>
        </div>
      </div>

      {/* Utility Cards */}
      <div className="space-y-3">
        {UTILITY_ITEMS.map(meta => {
          const state = utilities.find(u => u.id === meta.id) || {};
          return (
            <div
              key={meta.id}
              className={`rounded-xl border-2 overflow-hidden transition-all ${
                state.selected ? 'border-orange-400 shadow-md shadow-orange-100' : 'border-gray-200 bg-white'
              }`}
            >
              {/* Card Header — Main Toggle */}
              <div
                className={`flex items-center justify-between p-4 cursor-pointer ${state.selected ? 'bg-orange-50' : 'bg-white'}`}
                onClick={() => update(meta.id, 'selected', !state.selected)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    state.selected ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                  }`}>
                    {state.selected && <span className="text-white text-[10px] font-bold">✓</span>}
                  </div>
                  <span className={`font-bold text-base ${state.selected ? 'text-white' : 'text-gray-800'}`}>{meta.label}</span>
                </div>
                <span className={`material-symbols-outlined text-xl ${state.selected ? 'text-white/80' : 'text-gray-400'}`}>{meta.icon}</span>
              </div>

              {/* Card Details — only when selected */}
              {state.selected && (
                <div className="border-t border-gray-100 bg-white px-4 py-3 space-y-3">
                  {/* Enamel Painting Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Enamel Painting?</p>
                      <p className="text-xs text-gray-400">₹{meta.enamelRate}/item · High gloss finish</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase ${!state.enamel ? 'text-orange-500' : 'text-gray-400'}`}>No</span>
                      <button
                        type="button"
                        onClick={() => update(meta.id, 'enamel', !state.enamel)}
                        className={`relative inline-flex w-12 h-6 rounded-full transition-all ${state.enamel ? 'bg-orange-500' : 'bg-gray-200'}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${state.enamel ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                      <span className={`text-[10px] font-bold uppercase ${state.enamel ? 'text-orange-500' : 'text-gray-400'}`}>Yes</span>
                    </div>
                  </div>

                  {/* Additional Service */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">Additional Service</p>
                      <p className="text-xs text-gray-400">₹{meta.addlRate}/item · Cost per item basis</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={state.additionalService || false}
                      onChange={e => update(meta.id, 'additionalService', e.target.checked)}
                      className="w-5 h-5 rounded accent-orange-500 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
        <span className="material-symbols-outlined text-amber-500 flex-shrink-0">info</span>
        <p className="text-xs text-amber-700">Selected utilities will be calculated based on standard dimensions. Specific onsite requirements may vary the final quote.</p>
      </div>

      {/* Summary */}
      {selectedCount > 0 && (
        <div className="bg-gray-800 rounded-2xl p-4 text-white flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-70">{selectedCount} utility item(s) selected</p>
            {enamelCount > 0 && <p className="text-xs opacity-60 mt-0.5">{enamelCount} with enamel painting</p>}
          </div>
          <span className="text-3xl opacity-30">🚪</span>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="px-6 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all">← Back</button>
        <button onClick={handleNext} className="flex-1 py-4 rounded-2xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all">
          Next: Additional Services →
        </button>
      </div>
    </div>
  );
};

export default VStep3UtilitiesSelection;
