import React, { useState } from 'react';

const PAINT_PRODUCTS_MAP = {
  ECONOMY: [{ id: 'e1', name: 'Tractor Emulsion', price: 2.20 }, { id: 'e2', name: 'Distemper Classic', price: 1.80 }],
  PREMIUM: [{ id: 'p1', name: 'Royale Luxury Emulsion', price: 4.50 }, { id: 'p2', name: 'Ultima Silk Finish', price: 3.80 }],
  LUXURY: [{ id: 'l1', name: 'Royale Shyne', price: 6.20 }, { id: 'l2', name: 'Apex Ultima Protek', price: 5.80 }],
};

const QuotationSummary = ({ wizardData, onBack, onContinue }) => {
  const [openRoom, setOpenRoom] = useState(null);
  const rooms = wizardData?.rooms || [];
  const additionalServices = wizardData?.additionalServices || [];

  // Calculate per-room costs
  const roomCosts = rooms.map(r => {
    const tier = r.paintTier || 'PREMIUM';
    const product = (PAINT_PRODUCTS_MAP[tier] || []).find(p => p.id === r.paintProduct);
    const area = r.netArea || (parseFloat(r.length) || 0) * (parseFloat(r.width) || 0) || 100;
    const paintCost = product ? product.price * area : area * 3.5;
    const laborCost = area * 1.2;
    return {
      name: r.name,
      area,
      paintCost: Math.round(paintCost),
      laborCost: Math.round(laborCost),
      subtotal: Math.round(paintCost + laborCost),
      productName: product?.name || 'Standard Emulsion',
    };
  });

  const totalRoomCost = roomCosts.reduce((acc, r) => acc + r.subtotal, 0);
  const totalAdditionalCost = additionalServices
    .filter(s => s.enabled)
    .reduce((acc, s) => acc + (s.estimatedCost || 0), 0);
  const totalArea = roomCosts.reduce((acc, r) => acc + r.area, 0);
  const completionDays = Math.max(2, Math.ceil(totalArea / 400));
  const grandTotal = totalRoomCost + totalAdditionalCost;

  // Material estimates
  const wallPaintLiters = Math.ceil(totalArea / 120);
  const primerLiters = Math.ceil(totalArea / 200);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white sticky top-0 z-40 border-b border-gray-200 h-16 flex items-center gap-3 px-4">
        {onBack && (
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <span className="text-orange-500 text-lg">←</span>
          </button>
        )}
        <h1 className="font-bold text-orange-600 text-lg">Quotation Summary</h1>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-5">
        {/* Orange Summary Banner */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Interior Estimate</p>
              <p className="text-3xl font-black mt-1">₹{grandTotal.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-80">Total Area</p>
              <p className="text-lg font-bold">{totalArea.toFixed(0)} sqft</p>
            </div>
          </div>
          <div className="flex gap-3 text-xs">
            <span className="bg-white/20 px-3 py-1 rounded-full">
              📅 ~{completionDays} Days
            </span>
            <span className="bg-white/20 px-3 py-1 rounded-full">
              🏠 {rooms.length} Room(s)
            </span>
          </div>
        </div>

        {/* Per-Room Breakdown Cards */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Room-wise Breakdown</h3>
          <div className="space-y-3">
            {roomCosts.map((rc, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setOpenRoom(openRoom === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-lg">
                      {rc.name === 'Living Room' ? '🛋️' : rc.name === 'Kitchen' ? '🍳' : rc.name === 'Bathroom' ? '🚿' : '🛏️'}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm text-gray-800">{rc.name}</p>
                      <p className="text-xs text-gray-400">{rc.area.toFixed(0)} sqft • {rc.productName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-orange-600">₹{rc.subtotal.toLocaleString()}</span>
                    <span className="text-gray-400 text-sm">{openRoom === idx ? '▲' : '▼'}</span>
                  </div>
                </button>

                {openRoom === idx && (
                  <div className="border-t border-gray-100 px-4 pb-3">
                    <div className="flex justify-between py-2 text-sm text-gray-600">
                      <span>Paint Cost</span>
                      <span className="font-semibold text-gray-800">₹{rc.paintCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 text-sm text-gray-600">
                      <span>Labor Cost</span>
                      <span className="font-semibold text-gray-800">₹{rc.laborCost.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Additional Services Summary */}
        {totalAdditionalCost > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Additional Services</h3>
            {additionalServices.filter(s => s.enabled).map((s, idx) => (
              <div key={idx} className="flex justify-between py-1.5 text-sm text-gray-600">
                <span className="capitalize">{s.name.replace(/_/g, ' ')}</span>
                <span className="font-semibold text-gray-800">₹{(s.estimatedCost || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        {/* Material Logistics */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Material Logistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-gray-800">{wallPaintLiters}L</p>
              <p className="text-xs text-gray-500 mt-1">Wall Paint</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-2xl font-black text-gray-800">{primerLiters}L</p>
              <p className="text-xs text-gray-500 mt-1">Primer</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 pb-10">
          <button onClick={onBack} className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all">
            ← Back
          </button>
          <button
            onClick={onContinue}
            className="flex-1 py-4 rounded-2xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all"
          >
            Continue to Summary →
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuotationSummary;
