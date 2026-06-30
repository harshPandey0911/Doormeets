import React, { useState } from 'react';

const BRANDS = [
  { id: 'asian_paints', name: 'Asian Paints', tag: 'Most Popular', color: '#E8412D' },
  { id: 'berger', name: 'Berger Paints', tag: 'Value Pick', color: '#00599C' },
  { id: 'nerolac', name: 'Nerolac', tag: 'Premium', color: '#0072BB' },
  { id: 'dulux', name: 'Dulux', tag: 'International', color: '#1D4289' },
  { id: 'indigo', name: 'Indigo Paints', tag: 'Budget', color: '#3F51B5' },
];

const FINISHES = [
  { id: 'matt', name: 'Matt Finish', description: 'Non-reflective, hides imperfections', icon: '🟤' },
  { id: 'satin', name: 'Satin Finish', description: 'Slight sheen, easy to clean', icon: '✨' },
  { id: 'glossy', name: 'Glossy Finish', description: 'High shine, premium look', icon: '💎' },
  { id: 'metallic', name: 'Metallic Finish', description: 'Modern metallic shimmer', icon: '🪙' },
  { id: 'texture', name: 'Texture Finish', description: 'Decorative textured surface', icon: '🎨' },
];

const TIERS = [
  { id: 'economy', name: 'Economy', ratePerSqft: 8, description: 'Standard quality paint' },
  { id: 'standard', name: 'Standard', ratePerSqft: 14, description: 'Good quality paint' },
  { id: 'premium', name: 'Premium', ratePerSqft: 22, description: 'Superior finish & durability' },
  { id: 'luxury', name: 'Luxury', ratePerSqft: 35, description: 'Top-of-the-line paint' },
];

const VStep4Materials = ({ quoteData, updateQuoteData, onNext, onBack }) => {
  const [brand, setBrand] = useState(quoteData.paintBrand || 'asian_paints');
  const [finish, setFinish] = useState(quoteData.paintFinish || 'matt');
  const [tier, setTier] = useState(quoteData.paintTier || 'premium');
  const [colorCode, setColorCode] = useState(quoteData.colorCode || '#F5E6CC');

  const selectedTier = TIERS.find(t => t.id === tier);
  const totalArea = (quoteData.rooms || []).reduce((acc, r) => acc + (r.netArea || 0), 0);
  const estimatedPaintCost = totalArea * (selectedTier?.ratePerSqft || 14);

  const handleNext = () => {
    updateQuoteData({
      paintBrand: brand,
      paintFinish: finish,
      paintTier: tier,
      colorCode,
      paintRatePerSqft: selectedTier?.ratePerSqft || 14,
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Brand Selection */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Paint Brand</h3>
        <div className="space-y-2">
          {BRANDS.map(b => (
            <div
              key={b.id}
              onClick={() => setBrand(b.id)}
              className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                brand === b.id
                  ? 'border-orange-400 bg-orange-50 shadow-md shadow-orange-100'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: b.color }}>
                  {b.name.charAt(0)}
                </div>
                <div>
                  <p className={`font-bold text-sm ${brand === b.id ? 'text-orange-700' : 'text-gray-800'}`}>{b.name}</p>
                  <p className="text-xs text-gray-500">{b.tag}</p>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                brand === b.id ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
              }`}>
                {brand === b.id && <span className="text-white text-xs">✓</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Finish Type */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Finish Type</h3>
        <div className="grid grid-cols-2 gap-2">
          {FINISHES.map(f => (
            <button
              key={f.id}
              onClick={() => setFinish(f.id)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                finish === f.id
                  ? 'border-orange-400 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-lg">{f.icon}</span>
              <p className={`font-bold text-xs mt-1 ${finish === f.id ? 'text-orange-700' : 'text-gray-800'}`}>{f.name}</p>
              <p className="text-[10px] text-gray-500">{f.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Paint Tier */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Paint Quality Tier</h3>
        <div className="grid grid-cols-2 gap-2">
          {TIERS.map(t => (
            <button
              key={t.id}
              onClick={() => setTier(t.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                tier === t.id
                  ? 'border-orange-400 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className={`font-bold text-sm ${tier === t.id ? 'text-orange-700' : 'text-gray-800'}`}>{t.name}</p>
              <p className="text-xs text-gray-500">{t.description}</p>
              <p className="text-xs font-bold text-orange-600 mt-1">₹{t.ratePerSqft}/sq ft</p>
            </button>
          ))}
        </div>
      </div>

      {/* Color Preview */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Primary Color</h3>
        <div className="flex items-center gap-4 bg-white rounded-xl border-2 border-gray-200 p-4">
          <input
            type="color"
            value={colorCode}
            onChange={e => setColorCode(e.target.value)}
            className="w-16 h-12 rounded-lg border-2 border-gray-200 cursor-pointer"
          />
          <div>
            <p className="font-bold text-sm text-gray-800">Selected Color</p>
            <p className="text-xs text-gray-500 font-mono">{colorCode}</p>
          </div>
          <div className="ml-auto w-20 h-12 rounded-xl border border-gray-200" style={{ backgroundColor: colorCode }} />
        </div>
      </div>

      {/* Estimate */}
      <div className="bg-gray-800 rounded-2xl p-5 text-white flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Estimated Paint Cost</p>
          <p className="text-2xl font-black mt-0.5">₹{estimatedPaintCost.toLocaleString()}</p>
          <p className="text-xs opacity-60 mt-0.5">
            {totalArea.toFixed(0)} sq ft × ₹{selectedTier?.ratePerSqft}/sq ft
          </p>
        </div>
        <span className="text-3xl opacity-40">🎨</span>
      </div>

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
          Next: Costing & Bill →
        </button>
      </div>
    </div>
  );
};

export default VStep4Materials;
