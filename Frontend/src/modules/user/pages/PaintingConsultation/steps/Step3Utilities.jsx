import React from 'react';

const UTILITIES = [
  { type: 'DOORS', label: 'Doors', icon: '🚪', iconEmoji: true },
  { type: 'GRILLS', label: 'Grills', icon: '⊞', iconEmoji: false },
  { type: 'WINDOWS', label: 'Windows', icon: '🪟', iconEmoji: true },
  { type: 'PANELS', label: 'Panels', icon: '▦', iconEmoji: false },
];

const Step3Utilities = ({ wizardData, updateWizardData, goNext, goBack }) => {
  const utilities = wizardData.utilities || [];

  const updateUtility = (type, field, val) => {
    const updated = utilities.map(u => u.type === type ? { ...u, [field]: val } : u);
    updateWizardData({ utilities: updated });
  };

  const toggleSelected = (type) => {
    const u = utilities.find(u => u.type === type);
    updateUtility(type, 'selected', !u?.selected);
  };

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Utilities Selection</h2>
        <p className="text-gray-500 text-sm mt-1">Select the specific items that require painting or maintenance.</p>
      </div>

      {/* Preview Image */}
      <div className="relative w-full h-36 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
        <div className="absolute inset-0 flex items-center justify-center opacity-20 text-6xl">🚪</div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 p-4">
          <p className="text-white font-bold text-sm">Itemized Planning</p>
        </div>
      </div>

      {/* Utility Cards */}
      <div className="space-y-3">
        {UTILITIES.map(({ type, label, icon }) => {
          const util = utilities.find(u => u.type === type) || {};
          const isSelected = util.selected;

          return (
            <div
              key={type}
              className={`bg-white rounded-2xl border-2 transition-all ${
                isSelected ? 'border-orange-400 shadow-md shadow-orange-100' : 'border-gray-200'
              }`}
            >
              {/* Card Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => toggleSelected(type)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                      isSelected ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                    }`}
                  >
                    {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                  <span className="font-bold text-gray-800">{label}</span>
                </div>
                <span className="text-2xl">{icon}</span>
              </div>

              {/* Card Body */}
              <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                {/* Enamel Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Enamel Painting?</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${!util.enamelPainting ? 'text-gray-800' : 'text-gray-400'}`}>NO</span>
                    <button
                      onClick={() => updateUtility(type, 'enamelPainting', !util.enamelPainting)}
                      className={`relative inline-flex w-12 h-6 rounded-full transition-all ${
                        util.enamelPainting ? 'bg-orange-500' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${util.enamelPainting ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                    <span className={`text-xs font-semibold ${util.enamelPainting ? 'text-orange-600' : 'text-gray-400'}`}>YES</span>
                  </div>
                </div>

                {/* Additional Service Radio */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Additional Service</p>
                    <p className="text-xs text-gray-400">Cost per item basis</p>
                  </div>
                  <button
                    onClick={() => updateUtility(type, 'additionalService', !util.additionalService)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      util.additionalService ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                    }`}
                  >
                    {util.additionalService && <div className="w-2 h-2 rounded-full bg-white" />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Note */}
      <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl p-3">
        <span className="text-orange-500 mt-0.5">ℹ️</span>
        <p className="text-xs text-gray-600">
          Selected utilities will be calculated based on standard dimensions. Specific onsite requirements may vary the final quote.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-2 pb-10">
        <button onClick={goBack} className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all">
          ← Back
        </button>
        <button
          onClick={goNext}
          className="flex-1 py-4 rounded-2xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default Step3Utilities;
