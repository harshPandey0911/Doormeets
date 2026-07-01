import React, { useState } from 'react';

const SERVICES = [
  { id: 'waterproofing', name: 'Waterproofing', description: 'Protect walls from moisture damage', icon: '💧', unitLabel: 'sq ft', costPerUnit: 15 },
  { id: 'pop_repair', name: 'POP Repair', description: 'Fix plaster of paris ceilings & walls', icon: '🔨', unitLabel: 'sq ft', costPerUnit: 22 },
  { id: 'wallpaper_removal', name: 'Wallpaper Removal', description: 'Clean removal of existing wallpaper', icon: '📜', unitLabel: 'wall(s)', costPerUnit: 500 },
  { id: 'texture_painting', name: 'Texture Painting', description: 'Decorative textured wall finishes', icon: '🎨', unitLabel: 'wall(s)', costPerUnit: 800 },
  { id: 'deep_cleaning', name: 'Deep Wall Cleaning', description: 'Pre-paint surface preparation & cleaning', icon: '🧹', unitLabel: 'room(s)', costPerUnit: 350 },
  { id: 'primer_coating', name: 'Primer Coating', description: 'Base primer for better paint adhesion', icon: '🪣', unitLabel: 'sq ft', costPerUnit: 8 },
  { id: 'putty_work', name: 'Putty Work', description: 'Wall putty for smooth finish', icon: '🧱', unitLabel: 'sq ft', costPerUnit: 12 },
];

const VStep3AdditionalServices = ({ quoteData, updateQuoteData, onNext, onBack }) => {
  const [services, setServices] = useState(
    quoteData.additionalServices ||
    SERVICES.map(s => ({ id: s.id, name: s.name, enabled: false, quantity: 1, costPerUnit: s.costPerUnit, totalCost: 0 }))
  );

  const toggleService = (id) => {
    setServices(prev => prev.map(s => {
      if (s.id === id) {
        const enabled = !s.enabled;
        return { ...s, enabled, totalCost: enabled ? s.quantity * s.costPerUnit : 0 };
      }
      return s;
    }));
  };

  const updateQuantity = (id, qty) => {
    setServices(prev => prev.map(s => {
      if (s.id === id) {
        const q = Math.max(1, parseInt(qty) || 1);
        return { ...s, quantity: q, totalCost: s.enabled ? q * s.costPerUnit : 0 };
      }
      return s;
    }));
  };

  const updateCost = (id, cost) => {
    setServices(prev => prev.map(s => {
      if (s.id === id) {
        const c = parseFloat(cost) || 0;
        return { ...s, costPerUnit: c, totalCost: s.enabled ? s.quantity * c : 0 };
      }
      return s;
    }));
  };

  const enabledServices = services.filter(s => s.enabled);
  const totalCost = enabledServices.reduce((acc, s) => acc + s.totalCost, 0);

  const handleNext = () => {
    updateQuoteData({ additionalServices: services });
    onNext();
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Additional Services</h3>
        <p className="text-sm text-gray-500">Toggle services needed. Adjust quantity & rate as per site visit.</p>
      </div>

      {/* Service Toggle Cards */}
      <div className="space-y-3">
        {SERVICES.map(svcMeta => {
          const state = services.find(s => s.id === svcMeta.id) || { enabled: false, quantity: 1, costPerUnit: svcMeta.costPerUnit };

          return (
            <div
              key={svcMeta.id}
              className={`bg-white rounded-2xl border-2 transition-all overflow-hidden ${
                state.enabled ? 'border-orange-400 shadow-md shadow-orange-100' : 'border-gray-200'
              }`}
            >
              {/* Toggle Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => toggleService(svcMeta.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                    state.enabled ? 'bg-orange-100' : 'bg-gray-100'
                  }`}>
                    {svcMeta.icon}
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${state.enabled ? 'text-orange-700' : 'text-gray-800'}`}>{svcMeta.name}</p>
                    <p className="text-xs text-gray-500">{svcMeta.description}</p>
                  </div>
                </div>
                <div className={`relative inline-flex w-12 h-6 rounded-full transition-all ${
                  state.enabled ? 'bg-orange-500' : 'bg-gray-200'
                }`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                    state.enabled ? 'translate-x-6' : 'translate-x-0'
                  }`} />
                </div>
              </div>

              {/* Quantity & Rate (visible when enabled) */}
              {state.enabled && (
                <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-gray-500 font-semibold mb-1 uppercase">Qty ({svcMeta.unitLabel})</label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(svcMeta.id, (state.quantity || 1) - 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center font-bold hover:border-orange-400 transition-colors"
                        >
                          −
                        </button>
                        <span className="font-bold text-gray-800 w-8 text-center">{state.quantity || 1}</span>
                        <button
                          onClick={() => updateQuantity(svcMeta.id, (state.quantity || 1) + 1)}
                          className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold hover:bg-orange-600 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 font-semibold mb-1 uppercase">Rate (₹/{svcMeta.unitLabel})</label>
                      <input
                        type="number"
                        value={state.costPerUnit}
                        onChange={e => updateCost(svcMeta.id, e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-1.5 text-sm font-semibold focus:outline-none focus:border-orange-400"
                      />
                    </div>
                  </div>
                  <div className="mt-2 text-right">
                    <span className="text-xs text-gray-400">Subtotal: </span>
                    <span className="text-sm font-bold text-orange-600">₹{(state.totalCost || 0).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      {enabledServices.length > 0 && (
        <div className="bg-gray-800 rounded-2xl p-5 text-white flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
              {enabledServices.length} Service(s) Selected
            </p>
            <p className="text-2xl font-black mt-1">₹{totalCost.toLocaleString()}</p>
          </div>
          <span className="text-3xl opacity-40">🔧</span>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-6 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          className="flex-1 py-4 rounded-2xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all"
        >
          Next: Materials & Colors →
        </button>
      </div>
    </div>
  );
};

export default VStep3AdditionalServices;
