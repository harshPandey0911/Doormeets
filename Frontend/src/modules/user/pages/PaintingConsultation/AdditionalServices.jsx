import React from 'react';

const SERVICES = [
  {
    id: 'waterproofing',
    name: 'Waterproofing',
    description: 'Protect walls from moisture damage',
    icon: '💧',
    unitLabel: 'sq ft',
    costPerUnit: 15,
  },
  {
    id: 'pop_repair',
    name: 'POP Repair',
    description: 'Fix plaster of paris ceilings & walls',
    icon: '🔨',
    unitLabel: 'sq ft',
    costPerUnit: 22,
  },
  {
    id: 'wallpaper_removal',
    name: 'Wallpaper Removal',
    description: 'Clean removal of existing wallpaper',
    icon: '📜',
    unitLabel: 'wall(s)',
    costPerUnit: 500,
  },
  {
    id: 'texture_painting',
    name: 'Texture Painting',
    description: 'Decorative textured wall finishes',
    icon: '🎨',
    unitLabel: 'wall(s)',
    costPerUnit: 800,
  },
  {
    id: 'deep_cleaning',
    name: 'Deep Wall Cleaning',
    description: 'Pre-paint surface preparation & cleaning',
    icon: '🧹',
    unitLabel: 'room(s)',
    costPerUnit: 350,
  },
];

const AdditionalServices = ({ wizardData, updateWizardData, onBack, onContinue }) => {
  const services = (wizardData?.additionalServices && wizardData.additionalServices.length > 0) 
    ? wizardData.additionalServices 
    : SERVICES.map(s => ({
        name: s.id,
        enabled: false,
        quantity: 1,
        estimatedCost: 0,
      }));

  const updateService = (id, updates) => {
    let currentServices = [...services];
    if (!currentServices.find(s => s.name === id)) {
      currentServices.push({ name: id, enabled: false, quantity: 1, estimatedCost: 0 });
    }

    const updated = currentServices.map(s => {
      if (s.name === id) {
        const merged = { ...s, ...updates };
        const meta = SERVICES.find(sv => sv.id === id);
        merged.estimatedCost = merged.enabled ? (merged.quantity || 1) * (meta?.costPerUnit || 0) : 0;
        return merged;
      }
      return s;
    });
    updateWizardData({ additionalServices: updated });
  };

  const selectedCount = services.filter(s => s.enabled).length;
  const runningTotal = services.reduce((acc, s) => acc + (s.estimatedCost || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white sticky top-0 z-40 border-b border-gray-200 h-16 flex items-center gap-3 px-4">
        {onBack && (
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <span className="text-orange-500 text-lg">←</span>
          </button>
        )}
        <h1 className="font-bold text-orange-600 text-lg">Additional Services</h1>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-5">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Add-on Services</h2>
          <p className="text-sm text-gray-500 mt-1">Select additional services for your painting project.</p>
        </div>

        {/* Service Toggle Cards */}
        <div className="space-y-3">
          {SERVICES.map(svc => {
            const state = services.find(s => s.name === svc.id) || { enabled: false, quantity: 1 };

            return (
              <div
                key={svc.id}
                className={`bg-white rounded-2xl border-2 transition-all overflow-hidden ${
                  state.enabled ? 'border-orange-400 shadow-md shadow-orange-100' : 'border-gray-200'
                }`}
              >
                {/* Toggle Header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer"
                  onClick={() => updateService(svc.id, { enabled: !state.enabled })}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                      state.enabled ? 'bg-orange-100' : 'bg-gray-100'
                    }`}>
                      {svc.icon}
                    </div>
                    <div>
                      <p className={`font-bold text-sm ${state.enabled ? 'text-orange-700' : 'text-gray-800'}`}>{svc.name}</p>
                      <p className="text-xs text-gray-500">{svc.description}</p>
                    </div>
                  </div>
                  <button
                    className={`relative inline-flex w-12 h-6 rounded-full transition-all ${
                      state.enabled ? 'bg-orange-500' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                      state.enabled ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Quantity Input (visible when enabled) */}
                {state.enabled && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Quantity ({svc.unitLabel})</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateService(svc.id, { quantity: Math.max(1, (state.quantity || 1) - 1) })}
                          className="w-8 h-8 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center font-bold hover:border-orange-400 transition-colors"
                        >
                          −
                        </button>
                        <span className="font-bold text-gray-800 w-6 text-center">{state.quantity || 1}</span>
                        <button
                          onClick={() => updateService(svc.id, { quantity: (state.quantity || 1) + 1 })}
                          className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold hover:bg-orange-600 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 text-right">
                      <span className="text-xs text-gray-400">Est. Cost: </span>
                      <span className="text-sm font-bold text-orange-600">
                        ₹{((state.quantity || 1) * svc.costPerUnit).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Summary Footer */}
        {selectedCount > 0 && (
          <div className="bg-gray-800 rounded-2xl p-5 text-white flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">
                {selectedCount} Service(s) Selected
              </p>
              <p className="text-2xl font-black mt-1">₹{runningTotal.toLocaleString()}</p>
            </div>
            <span className="text-3xl opacity-40">🔧</span>
          </div>
        )}

        {/* Save & Continue */}
        <button
          onClick={onContinue}
          className="w-full py-4 rounded-2xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all"
        >
          Save & Continue →
        </button>
      </div>
    </div>
  );
};

export default AdditionalServices;
