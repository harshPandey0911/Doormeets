import React, { useState } from 'react';

const BRANDS = [
  { id: 'ASIAN_PAINTS', label: 'Asian Paints', icon: '🎨' },
  { id: 'DULUX', label: 'Dulux', icon: '🖌️' },
  { id: 'BERGER', label: 'Berger', icon: '🪣' },
];

const UPGRADES = [
  { id: 'LUXURY', label: 'Upgrade to Super Luxury Paint', desc: 'Superior shine and durability', extra: 2500, badge: 'LUXURY' },
  { id: 'PREMIUM', label: 'Upgrade to Luxury Washable Paint', desc: 'Easy to clean, long-lasting', extra: 1200, badge: 'PREMIUM' },
  { id: 'NONE', label: 'Plastic Emulsion', desc: 'Current standard selection', extra: 0, badge: 'CURRENT', current: true },
  { id: 'BASIC', label: 'Downgrade to Distemper', desc: 'Basic finish', extra: -800, badge: 'DOWNGRADE' },
];

const PAINT_PRODUCTS_MAP = {
  ECONOMY: [{ id: 'e1', name: 'Tractor Emulsion', price: 2.20 }, { id: 'e2', name: 'Distemper Classic', price: 1.80 }],
  PREMIUM: [{ id: 'p1', name: 'Royale Luxury Emulsion', price: 4.50 }, { id: 'p2', name: 'Ultima Silk Finish', price: 3.80 }],
  LUXURY: [{ id: 'l1', name: 'Royale Shyne', price: 6.20 }, { id: 'l2', name: 'Apex Ultima Protek', price: 5.80 }],
};

const Step4Summary = ({ wizardData, updateWizardData, goNext, goBack }) => {
  const [openSection, setOpenSection] = useState(null);

  const rooms = wizardData.rooms || [];
  const brand = wizardData.paintBrand || 'ASIAN_PAINTS';
  const upgradeOption = wizardData.upgradeOption || 'NONE';

  // Calculate total
  const roomsTotal = rooms.reduce((acc, r) => {
    const tier = r.paintTier || 'PREMIUM';
    const prod = (PAINT_PRODUCTS_MAP[tier] || []).find(p => p.id === r.paintProduct);
    return acc + (prod ? prod.price * (r.netArea || 100) : 800);
  }, 0);

  const upgradeExtra = UPGRADES.find(u => u.id === upgradeOption)?.extra || 0;
  const estimatedTotal = roomsTotal + upgradeExtra;

  const interiorTotal = rooms.reduce((acc, r) => {
    const tier = r.paintTier || 'PREMIUM';
    const prod = (PAINT_PRODUCTS_MAP[tier] || []).find(p => p.id === r.paintProduct);
    return acc + (prod ? prod.price * (r.netArea || 100) : 800);
  }, 0);

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Step 4 — Summary</h2>
        <p className="text-gray-500 text-sm mt-1">Review and finalize your paint selection.</p>
      </div>

      {/* Current Selection */}
      <div className="flex items-center gap-4 bg-white rounded-2xl border-2 border-gray-200 p-4">
        <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white text-xl">🖌️</div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">CURRENT SELECTION</p>
          <p className="font-bold text-gray-800">
            {rooms[0]?.paintProduct
              ? (PAINT_PRODUCTS_MAP[rooms[0]?.paintTier] || []).find(p => p.id === rooms[0]?.paintProduct)?.name || 'Standard Emulsion'
              : 'Standard Emulsion'}
          </p>
        </div>
      </div>

      {/* Select Brand */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2">Select Brand</h3>
        <div className="flex gap-2">
          {BRANDS.map(b => (
            <button
              key={b.id}
              onClick={() => updateWizardData({ paintBrand: b.id })}
              className={`flex-1 py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                brand === b.id
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Upgrade Options */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2">Upgrade Options</h3>
        <div className="space-y-2">
          {UPGRADES.map(u => (
            <div
              key={u.id}
              onClick={() => updateWizardData({ upgradeOption: u.id })}
              className={`flex items-start justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                upgradeOption === u.id && !u.current
                  ? 'border-orange-500 bg-orange-50'
                  : u.current
                  ? 'border-orange-300 bg-orange-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                  u.current ? 'bg-orange-500 text-white' : u.extra > 0 ? 'bg-gray-100' : 'bg-gray-100'
                }`}>
                  {u.current ? '✓' : u.extra > 0 ? '↑' : '↓'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`font-bold text-sm ${u.current ? 'text-orange-700' : 'text-gray-800'}`}>{u.label}</p>
                    {u.current && <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full">CURRENT SELECTION</span>}
                    {!u.current && u.badge !== 'DOWNGRADE' && <span className="text-xs bg-gray-800 text-white px-2 py-0.5 rounded-full">{u.badge}</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{u.desc}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                {u.extra !== 0 ? (
                  <>
                    <p className="text-xs text-gray-400">STARTS AT</p>
                    <p className={`font-bold text-sm ${u.extra > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
                      {u.extra > 0 ? '+' : ''}₹{Math.abs(u.extra).toLocaleString()}
                    </p>
                  </>
                ) : (
                  <p className="font-bold text-sm text-orange-600">₹{estimatedTotal.toFixed(0)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quotation Details Accordion */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2">Quotation Details</h3>
        <div className="space-y-2">
          {[
            { key: 'interior', label: '🏠 Interior', value: interiorTotal },
            { key: 'exterior', label: '🏢 Exterior', value: 0 },
            { key: 'others', label: '⋯ Others', value: 0 },
          ].map(({ key, label, value }) => (
            <div key={key} className="bg-white rounded-xl border border-gray-200">
              <button
                onClick={() => setOpenSection(openSection === key ? null : key)}
                className="w-full flex items-center justify-between px-4 py-3"
              >
                <span className="font-semibold text-sm text-gray-800">{label}</span>
                <div className="flex items-center gap-3">
                  {value > 0 && <span className="text-orange-600 font-bold text-sm">₹{value.toFixed(0)}</span>}
                  <span className="text-gray-400">{openSection === key ? '▲' : '▼'}</span>
                </div>
              </button>
              {openSection === key && (
                <div className="px-4 pb-3 border-t border-gray-100">
                  {key === 'interior' && rooms.map((r, idx) => (
                    <div key={idx} className="flex justify-between py-1.5 text-sm text-gray-600">
                      <span>{r.name}</span>
                      <span className="font-semibold text-gray-800">₹{(r.estimatedCost || 800).toFixed(0)}</span>
                    </div>
                  ))}
                  {key !== 'interior' && (
                    <p className="text-xs text-gray-400 py-2">No items selected yet.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Total Banner */}
      <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl p-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">TOTAL ESTIMATED QUOTE</p>
        <p className="text-4xl font-black mt-1">₹{(estimatedTotal + upgradeExtra).toFixed(0)}</p>
        <div className="flex gap-3 mt-2 text-xs opacity-90">
          <span className="bg-white/20 px-2 py-1 rounded-full">Inclusive of taxes</span>
          <span className="bg-white/20 px-2 py-1 rounded-full">Standard labor included</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pb-10">
        <button onClick={goBack} className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all">
          ← Back
        </button>
        <button
          onClick={() => { updateWizardData({ estimatedTotal: estimatedTotal + upgradeExtra }); goNext(); }}
          className="flex-1 py-4 rounded-2xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default Step4Summary;
