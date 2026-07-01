import React, { useState } from 'react';

const BRANDS = [
  { id: 'ASIAN_PAINTS', label: 'Asian Paints', icon: '🎨', tagline: 'India\'s #1 Paint Brand' },
  { id: 'DULUX', label: 'Dulux', icon: '🖌️', tagline: 'Premium Quality Coatings' },
  { id: 'BERGER', label: 'Berger', icon: '🪣', tagline: 'Trusted Since 1923' },
];

const UPGRADES = [
  { id: 'LUXURY', label: 'Super Luxury Paint', desc: 'Superior shine, anti-fungal, stain-guard technology', extra: 2500, badge: 'LUXURY', icon: '✨' },
  { id: 'PREMIUM', label: 'Luxury Washable Paint', desc: 'Easy to clean, long-lasting, low VOC', extra: 1200, badge: 'PREMIUM', icon: '🌟' },
  { id: 'NONE', label: 'Plastic Emulsion', desc: 'Current standard selection — good coverage & value', extra: 0, badge: 'CURRENT', current: true, icon: '✓' },
  { id: 'BASIC', label: 'Distemper', desc: 'Budget-friendly basic finish', extra: -800, badge: 'SAVE', icon: '↓' },
];

const BrandAndUpgrades = ({ wizardData, updateWizardData, onBack, onContinue }) => {
  const brand = wizardData?.paintBrand || 'ASIAN_PAINTS';
  const upgradeOption = wizardData?.upgradeOption || 'NONE';
  const estimatedTotal = wizardData?.estimatedTotal || 0;

  const upgradeExtra = UPGRADES.find(u => u.id === upgradeOption)?.extra || 0;
  const adjustedTotal = estimatedTotal + upgradeExtra;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white sticky top-0 z-40 border-b border-gray-200 h-16 flex items-center gap-3 px-4">
        {onBack && (
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <span className="text-orange-500 text-lg">←</span>
          </button>
        )}
        <h1 className="font-bold text-orange-600 text-lg">Brand & Upgrades</h1>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Select Paint Brand</h2>
          <p className="text-sm text-gray-500 mt-1">Choose your preferred brand and explore upgrade options.</p>
        </div>

        {/* Brand Selection */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Paint Brand</h3>
          <div className="space-y-2">
            {BRANDS.map(b => (
              <button
                key={b.id}
                onClick={() => updateWizardData({ paintBrand: b.id })}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                  brand === b.id
                    ? 'border-orange-500 bg-orange-50 shadow-md shadow-orange-100'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                  brand === b.id ? 'bg-orange-500 text-white' : 'bg-gray-100'
                }`}>
                  {b.icon}
                </div>
                <div className="flex-1">
                  <p className={`font-bold ${brand === b.id ? 'text-orange-700' : 'text-gray-800'}`}>{b.label}</p>
                  <p className="text-xs text-gray-500">{b.tagline}</p>
                </div>
                {brand === b.id && (
                  <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold">
                    ✓
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Upgrade Options */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Upgrade Options</h3>
          <div className="space-y-2">
            {UPGRADES.map(u => (
              <div
                key={u.id}
                onClick={() => updateWizardData({ upgradeOption: u.id })}
                className={`flex items-start justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  upgradeOption === u.id
                    ? u.current
                      ? 'border-orange-400 bg-orange-50'
                      : 'border-orange-500 bg-orange-50 shadow-md shadow-orange-100'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                    upgradeOption === u.id ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {u.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`font-bold text-sm ${upgradeOption === u.id ? 'text-orange-700' : 'text-gray-800'}`}>
                        {u.label}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        u.current
                          ? 'bg-orange-500 text-white'
                          : u.badge === 'SAVE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-800 text-white'
                      }`}>
                        {u.badge}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{u.desc}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  {u.extra !== 0 ? (
                    <>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Difference</p>
                      <p className={`font-bold text-sm ${u.extra > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        {u.extra > 0 ? '+' : ''}₹{Math.abs(u.extra).toLocaleString()}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-gray-400 font-semibold">Included</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Total Banner */}
        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-2xl p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Adjusted Estimate</p>
          <p className="text-4xl font-black mt-1">₹{adjustedTotal.toLocaleString()}</p>
          <div className="flex gap-3 mt-2 text-xs opacity-90">
            <span className="bg-white/20 px-2 py-1 rounded-full">Brand: {BRANDS.find(b => b.id === brand)?.label}</span>
            <span className="bg-white/20 px-2 py-1 rounded-full">{UPGRADES.find(u => u.id === upgradeOption)?.label}</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pb-10">
          <button onClick={onBack} className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all">
            ← Back
          </button>
          <button
            onClick={() => {
              updateWizardData({ estimatedTotal: adjustedTotal });
              if (onContinue) onContinue();
            }}
            className="flex-1 py-4 rounded-2xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all"
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
};

export default BrandAndUpgrades;
