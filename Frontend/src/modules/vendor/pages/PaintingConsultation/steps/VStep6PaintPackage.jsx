import React, { useState } from 'react';

const BRANDS = ['Asian Paints', 'Dulux', 'Berger', 'Nerolac'];

const UPGRADES = [
  { id: 'standard', label: 'STANDARD', name: 'Standard Emulsion', pricePerSqft: 0, desc: 'Basic matte finish. Good for low-traffic areas.' },
  { id: 'premium', label: 'PREMIUM', name: 'Semi-gloss Finish', pricePerSqft: 2, desc: 'Durable, easy to clean, and reflects light beautifully for a modern look.' },
  { id: 'luxury', label: 'LUXURY', name: 'Premium Matte', pricePerSqft: 5, desc: 'Non-reflective velvet finish that hides surface imperfections perfectly.' },
];

const VStep6PaintPackage = ({ quoteData, updateQuoteData, onNext, onBack }) => {
  const [brand, setBrand] = useState(quoteData.paintBrand || 'Asian Paints');
  const [upgradeId, setUpgradeId] = useState(quoteData.paintTier || 'standard');

  const { measurements = {} } = quoteData;
  const { interiorEstimate = 0, totalArea = 0, roomBreakdown = [], totalGlobalAddl = 0 } = measurements;

  const activeUpgrade = UPGRADES.find(u => u.id === upgradeId) || UPGRADES[0];
  const upgradeCost = totalArea * activeUpgrade.pricePerSqft;
  const grandTotal = interiorEstimate + upgradeCost;

  const [openAccordion, setOpenAccordion] = useState('interior');

  const toggleAccordion = (section) => {
    setOpenAccordion(prev => (prev === section ? null : section));
  };

  const handleNext = () => {
    updateQuoteData({
      paintBrand: brand,
      paintTier: upgradeId,
      paintFinish: activeUpgrade.name,
      finalEstimate: grandTotal,
      upgradeCost,
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Step 6 — Summary</p>
        <h3 className="text-xl font-bold text-gray-800">Select Paint Package</h3>
        <p className="text-sm text-gray-500 mt-1">Customize your painting project with premium brands and superior finishes.</p>
      </div>

      {/* Current Selection */}
      <div className="bg-white border-2 border-gray-200 p-4 rounded-xl flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Current Selection</p>
          <h2 className="text-lg font-bold text-gray-800">{activeUpgrade.name}</h2>
        </div>
        <div className="bg-orange-100 text-orange-600 p-3 rounded-xl flex items-center justify-center">
          <span className="text-2xl">🎨</span>
        </div>
      </div>

      {/* Select Brand */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3">Select Brand</h3>
        <div className="flex flex-wrap gap-2">
          {BRANDS.map(b => (
            <button
              key={b}
              onClick={() => setBrand(b)}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-all border-2 ${
                brand === b
                  ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-orange-300'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Upgrade Options */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3">Upgrade Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {UPGRADES.slice(1).map(u => (
            <div
              key={u.id}
              onClick={() => setUpgradeId(u.id)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                upgradeId === u.id
                  ? 'border-orange-400 bg-orange-50 shadow-md shadow-orange-100'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${upgradeId === u.id ? 'text-white' : 'text-gray-500'}`}>
                  {u.label}
                </span>
                <span className={`font-bold ${upgradeId === u.id ? 'text-white' : 'text-gray-800'}`}>+₹{(totalArea * u.pricePerSqft).toLocaleString()}</span>
              </div>
              <h4 className={`font-bold mb-1 ${upgradeId === u.id ? 'text-white' : 'text-gray-800'}`}>{u.name}</h4>
              <p className={`text-xs leading-relaxed ${upgradeId === u.id ? 'text-white/80' : 'text-gray-500'}`}>{u.desc}</p>
            </div>
          ))}
        </div>
        {upgradeId !== 'standard' && (
          <button
            onClick={() => setUpgradeId('standard')}
            className="mt-3 text-xs font-bold text-gray-500 hover:text-orange-500 transition-colors"
          >
            ← Downgrade to {UPGRADES[0].name} (Save ₹{upgradeCost.toLocaleString()})
          </button>
        )}
      </div>

      {/* Quotation Details Accordion */}
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3">Quotation Details</h3>
        <div className="space-y-3">
          
          {/* Interior Section */}
          <div className="bg-white rounded-xl overflow-hidden border-2 border-gray-200">
            <button
              onClick={() => toggleAccordion('interior')}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🏠</span>
                <span className="font-bold text-gray-800">Interior ({roomBreakdown.length} Rooms)</span>
              </div>
              <span className={`text-gray-400 font-bold transition-transform ${openAccordion === 'interior' ? 'rotate-180' : ''}`}>▼</span>
            </button>
            
            {openAccordion === 'interior' && (
              <div className="px-4 pb-4 space-y-3 border-t-2 border-gray-100 pt-3">
                {roomBreakdown.map((room, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 last:pb-0">
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{room.name}</p>
                      <p className="text-xs text-gray-500">{room.netArea.toFixed(0)} sq ft • Base Quote</p>
                    </div>
                    <span className="font-bold text-gray-800 text-sm">₹{room.subtotal.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Others Section */}
          {totalGlobalAddl > 0 && (
            <div className="bg-white rounded-xl overflow-hidden border-2 border-gray-200">
              <button
                onClick={() => toggleAccordion('others')}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🔧</span>
                  <span className="font-bold text-gray-800">Global Additional Services</span>
                </div>
                <span className={`text-gray-400 font-bold transition-transform ${openAccordion === 'others' ? 'rotate-180' : ''}`}>▼</span>
              </button>
              
              {openAccordion === 'others' && (
                <div className="px-4 pb-4 space-y-3 border-t-2 border-gray-100 pt-3">
                  {(quoteData.globalServices || []).filter(s => s.enabled).map((svc, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 last:pb-0">
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{svc.label}</p>
                        <p className="text-xs text-gray-500">{svc.quantity} {svc.unit}(s) @ ₹{svc.rate}/{svc.unit}</p>
                      </div>
                      <span className="font-bold text-gray-800 text-sm">₹{(svc.totalCost || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Upgrade Section */}
          {upgradeCost > 0 && (
            <div className="bg-orange-50 rounded-xl overflow-hidden border-2 border-orange-200 p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-xl">✨</span>
                <div>
                  <span className="font-bold text-orange-800 text-sm">Paint Upgrade</span>
                  <p className="text-xs text-orange-600">{activeUpgrade.name}</p>
                </div>
              </div>
              <span className="font-bold text-orange-700 text-sm">₹{upgradeCost.toLocaleString()}</span>
            </div>
          )}

        </div>
      </div>

      {/* Final Calculation Bento Card */}
      <div className="bg-orange-600 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-center md:text-left">
            <p className="text-xs font-bold opacity-90 uppercase tracking-widest mb-1">Total Estimated Quote</p>
            <h2 className="text-4xl font-black tracking-tight">₹{grandTotal.toLocaleString()}</h2>
          </div>
          <div className="flex flex-col gap-1 items-center md:items-end">
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">Inclusive of taxes</span>
            <p className="text-xs opacity-80 italic mt-1">Standard labor included</p>
          </div>
        </div>
        {/* Abstract background shapes */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-8 -mb-8 blur-xl"></div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="px-6 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all">← Back</button>
        <button onClick={handleNext} className="flex-1 py-4 rounded-2xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all">
          Next: Finalize Plan →
        </button>
      </div>
    </div>
  );
};

export default VStep6PaintPackage;
