import React, { useState } from 'react';

const GLOBAL_SERVICES = [
  { id: 'waterproofing',     label: 'Waterproofing',     icon: '💧', desc: 'Protect walls from moisture', rate: 15,  unit: 'sqft' },
  { id: 'pop_repair',        label: 'POP Repair',        icon: '🔨', desc: 'Fix plaster of paris surfaces', rate: 22, unit: 'sqft' },
  { id: 'wallpaper_removal', label: 'Wallpaper Removal', icon: '📜', desc: 'Clean removal of existing wallpaper', rate: 500, unit: 'wall' },
  { id: 'texture_painting',  label: 'Texture Painting',  icon: '🎨', desc: 'Decorative textured wall finish', rate: 800, unit: 'wall' },
  { id: 'deep_cleaning',     label: 'Deep Wall Cleaning',icon: '🧹', desc: 'Pre-paint preparation & cleaning', rate: 350, unit: 'room' },
  { id: 'primer_coating',    label: 'Primer Coating',    icon: '🪣', desc: 'Base primer for better adhesion', rate: 8,  unit: 'sqft' },
];

const Toggle = ({ checked, onChange }) => (
  <button type="button" onClick={() => onChange(!checked)}
    className={`relative inline-flex w-12 h-6 rounded-full transition-all flex-shrink-0 ${checked ? 'bg-orange-500' : 'bg-gray-200'}`}>
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
  </button>
);

const VStep4AdditionalServices = ({ quoteData, updateQuoteData, onNext, onBack }) => {
  const [services, setServices] = useState(
    quoteData.globalServices?.length > 0 ? quoteData.globalServices :
    GLOBAL_SERVICES.map(s => ({ id: s.id, enabled: false, quantity: 1, rate: s.rate, unit: s.unit }))
  );

  const toggle = (id) => setServices(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled, totalCost: !s.enabled ? s.quantity * s.rate : 0 } : s));
  const updateQty = (id, qty) => {
    const q = Math.max(1, parseInt(qty) || 1);
    setServices(prev => prev.map(s => s.id === id ? { ...s, quantity: q, totalCost: s.enabled ? q * s.rate : 0 } : s));
  };
  const updateRate = (id, rate) => {
    const r = parseFloat(rate) || 0;
    setServices(prev => prev.map(s => s.id === id ? { ...s, rate: r, totalCost: s.enabled ? s.quantity * r : 0 } : s));
  };

  const enabledServices = services.filter(s => s.enabled);
  const totalCost = enabledServices.reduce((acc, s) => acc + (s.totalCost || 0), 0);

  const handleNext = () => {
    updateQuoteData({ globalServices: services });
    onNext();
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Step 4 — Additional Services</p>
        <h3 className="text-xl font-bold text-gray-800">Additional Services</h3>
        <p className="text-sm text-gray-500 mt-1">Global additional works required across the property.</p>
      </div>

      <div className="space-y-3">
        {GLOBAL_SERVICES.map(meta => {
          const state = services.find(s => s.id === meta.id) || {};
          return (
            <div key={meta.id} className={`rounded-2xl border-2 overflow-hidden transition-all ${state.enabled ? 'border-orange-400 bg-orange-50 shadow-md shadow-orange-100' : 'border-gray-200 bg-white'}`}>
              {/* Header */}
              <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => toggle(meta.id)}>
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl ${state.enabled ? 'bg-orange-100' : 'bg-gray-100'}`}>
                    {meta.icon}
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${state.enabled ? 'text-white' : 'text-gray-800'}`}>{meta.label}</p>
                    <p className={`text-xs ${state.enabled ? 'text-white/80' : 'text-gray-500'}`}>{meta.desc}</p>
                  </div>
                </div>
                <Toggle checked={state.enabled} onChange={() => toggle(meta.id)} />
              </div>

              {/* Expanded controls */}
              {state.enabled && (
                <div className="border-t border-gray-100 px-4 py-3 bg-orange-50">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-white/80 font-semibold mb-1 uppercase">Qty ({meta.unit})</label>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(meta.id, (state.quantity || 1) - 1)} className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center font-bold hover:border-orange-400">−</button>
                        <span className="font-bold text-gray-800 w-8 text-center">{state.quantity || 1}</span>
                        <button onClick={() => updateQty(meta.id, (state.quantity || 1) + 1)} className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold hover:bg-orange-600">+</button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-white/80 font-semibold mb-1 uppercase">Rate (₹/{meta.unit})</label>
                      <input type="number" value={state.rate} onChange={e => updateRate(meta.id, e.target.value)}
                        className="w-full border-2 border-gray-200 rounded-xl px-3 py-1.5 text-sm font-semibold focus:outline-none focus:border-orange-400 bg-white" />
                    </div>
                  </div>
                  <div className="mt-2 text-right">
                    <span className="text-xs text-white/80">Subtotal: </span>
                    <span className="text-sm font-bold text-white">₹{(state.totalCost || 0).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Total */}
      {enabledServices.length > 0 && (
        <div className="bg-gray-800 rounded-2xl p-5 text-white flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider opacity-70">Total Additional Services</p>
            <p className="text-2xl font-black mt-1">₹{totalCost.toLocaleString()}</p>
            <p className="text-xs opacity-60 mt-0.5">{enabledServices.length} service(s) selected</p>
          </div>
          <span className="text-3xl opacity-30">🔧</span>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="px-6 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all">← Back</button>
        <button onClick={handleNext} className="flex-1 py-4 rounded-2xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all">
          Next: Generate Measurements →
        </button>
      </div>
    </div>
  );
};

export default VStep4AdditionalServices;
