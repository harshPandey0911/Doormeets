import React, { useState } from 'react';

const TIERS = ['ECONOMY', 'PREMIUM', 'LUXURY'];

const PAINT_PRODUCTS = {
  ECONOMY: [
    { id: 'e1', name: 'Tractor Emulsion', price: 2.20, badges: ['Good Coverage', 'Budget Friendly'] },
    { id: 'e2', name: 'Distemper Classic', price: 1.80, badges: ['Matte Finish', 'Easy Apply'] },
  ],
  PREMIUM: [
    { id: 'p1', name: 'Royale Luxury Emulsion', price: 4.50, badges: ['Washable', 'Anti-bacterial'] },
    { id: 'p2', name: 'Ultima Silk Finish', price: 3.80, badges: ['High Sheen', 'Low VOC'] },
  ],
  LUXURY: [
    { id: 'l1', name: 'Royale Shyne', price: 6.20, badges: ['Super Premium', 'Anti-fungal', 'Washable'] },
    { id: 'l2', name: 'Apex Ultima Protek', price: 5.80, badges: ['Weather Proof', '10yr Warranty'] },
  ],
};

const FINISHES = ['MATT', 'SATIN', 'GLOSS'];

const COLORS = [
  { name: 'Warm Terracotta', hex: '#D2691E' },
  { name: 'Ocean Blue', hex: '#4A90D9' },
  { name: 'Sage Green', hex: '#87A878' },
  { name: 'Blush Pink', hex: '#F4A9B2' },
  { name: 'Steel Grey', hex: '#9EA8B3' },
  { name: 'Ivory White', hex: '#F5F0E8' },
  { name: 'Midnight Navy', hex: '#2C3E6B' },
  { name: 'Sunflower', hex: '#F5C518' },
  { name: 'Forest Green', hex: '#2D6A4F' },
  { name: 'Teal Mist', hex: '#3B7A8A' },
  { name: 'Royal Purple', hex: '#6B4FA0' },
  { name: 'Peach Cream', hex: '#FFCBA4' },
];

const Step2SelectPaint = ({ wizardData, updateWizardData, goNext, goBack }) => {
  const rooms = wizardData.rooms;
  const [activeRoomIdx, setActiveRoomIdx] = useState(0);
  const room = rooms[activeRoomIdx] || {};

  const updateRoomPaint = (updates) => {
    const updatedRooms = [...rooms];
    updatedRooms[activeRoomIdx] = { ...updatedRooms[activeRoomIdx], ...updates };
    // Update estimated cost
    const selectedProduct = (PAINT_PRODUCTS[updates.paintTier || room.paintTier] || [])
      .find(p => p.id === (updates.paintProduct || room.paintProduct));
    if (selectedProduct) {
      updatedRooms[activeRoomIdx].estimatedCost = selectedProduct.price * (room.netArea || 100);
    }
    updateWizardData({ rooms: updatedRooms });
  };

  const tier = room.paintTier || 'PREMIUM';
  const selectedProduct = (PAINT_PRODUCTS[tier] || []).find(p => p.id === room.paintProduct);

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Select Paint</h2>
        <p className="text-gray-500 text-sm mt-1">Choose paint for each room based on your preference.</p>
      </div>

      {/* Room selector */}
      {rooms.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {rooms.map((r, idx) => (
            <button
              key={idx}
              onClick={() => setActiveRoomIdx(idx)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                activeRoomIdx === idx ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      )}

      {/* Tier Tabs */}
      <div>
        <div className="flex rounded-xl border-2 border-gray-200 overflow-hidden">
          {TIERS.map(t => (
            <button
              key={t}
              onClick={() => updateRoomPaint({ paintTier: t, paintProduct: '' })}
              className={`flex-1 py-3 text-sm font-bold transition-all capitalize ${
                tier === t ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Paint Products */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2">Recommended Paints</h3>
        <div className="space-y-3">
          {(PAINT_PRODUCTS[tier] || []).map(product => (
            <div
              key={product.id}
              onClick={() => updateRoomPaint({ paintProduct: product.id })}
              className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                room.paintProduct === product.id
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 bg-white hover:border-orange-300'
              }`}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                🪣
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <p className="font-bold text-gray-800">{product.name}</p>
                  <span className="text-orange-600 font-bold text-sm ml-2">₹{product.price}/sq ft</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {product.badges.map(b => (
                    <span key={b} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{b}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Finish Selector */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 mb-2">Select Finish</h3>
        <div className="grid grid-cols-3 gap-2">
          {FINISHES.map(f => (
            <button
              key={f}
              onClick={() => updateRoomPaint({ finish: f })}
              className={`py-3 px-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                room.finish === f
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300'
              }`}
            >
              <div className={`w-8 h-8 rounded-full mx-auto mb-1.5 ${
                f === 'MATT' ? 'bg-gray-200' : f === 'SATIN' ? 'bg-gradient-to-br from-gray-100 to-gray-300' : 'bg-gradient-to-br from-white to-gray-200 border border-gray-300'
              }`} />
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Color Picker */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-700">Choose Color</h3>
          {room.color && (
            <span className="text-xs text-gray-500">
              Currently selected: <span className="font-bold text-orange-600">{room.color}</span>
            </span>
          )}
        </div>
        <div className="grid grid-cols-6 gap-2">
          {COLORS.map(color => (
            <button
              key={color.name}
              onClick={() => updateRoomPaint({ color: color.name })}
              title={color.name}
              className={`w-full aspect-square rounded-xl transition-all ${
                room.color === color.name ? 'ring-4 ring-orange-500 ring-offset-2 scale-110' : 'hover:scale-105'
              }`}
              style={{ backgroundColor: color.hex }}
            />
          ))}
        </div>
      </div>

      {/* Estimated Cost Footer */}
      {selectedProduct && room.netArea > 0 && (
        <div className="fixed bottom-12 left-0 right-0 z-10 px-4">
          <div className="max-w-lg mx-auto bg-white border border-gray-200 rounded-2xl shadow-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Estimated Cost</p>
              <p className="text-2xl font-black text-orange-600">₹{(selectedProduct.price * room.netArea).toFixed(0)}</p>
            </div>
            <button
              onClick={goNext}
              className="bg-orange-500 text-white font-bold px-5 py-3 rounded-xl text-sm hover:bg-orange-600 transition-all"
            >
              Apply to {room.name} →
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-2 pb-28">
        <button onClick={goBack} className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50">
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

export default Step2SelectPaint;
