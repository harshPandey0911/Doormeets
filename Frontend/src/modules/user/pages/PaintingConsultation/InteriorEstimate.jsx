import React from 'react';

const InteriorEstimate = ({ wizardData, onContinue, onBack }) => {
  const rooms = wizardData?.rooms || [];

  // Calculate per-room costs
  const roomsWithCosts = rooms.map(r => {
    const sqft = r.netArea || (parseFloat(r.length) || 0) * (parseFloat(r.width) || 0) || 100;
    const paintCost = sqft * 4.5;
    const laborCost = sqft * 8;
    return {
      name: r.name || 'Room',
      sqft,
      paintCost,
      laborCost,
      subtotal: paintCost + laborCost,
    };
  });

  const totalArea = roomsWithCosts.reduce((acc, r) => acc + r.sqft, 0);
  const estimatedTotal = roomsWithCosts.reduce((acc, r) => acc + r.subtotal, 0);
  const estimatedDays = Math.max(2, Math.ceil(totalArea / 400));

  // Material logistics
  const wallPaintLiters = Math.ceil((totalArea * 2) / 130); // 2 coats, ~130 sqft/liter
  const primerLiters = Math.ceil(totalArea / 150); // ~150 sqft/liter

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
          )}
          <h2 className="text-xl font-bold text-gray-900">Interior Estimate</h2>
        </div>
        <button className="text-gray-400 hover:text-gray-600">🔗</button>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-5">
        {/* Summary Banner */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">ESTIMATED TOTAL</p>
          <p className="text-4xl font-black mt-1">₹{estimatedTotal.toFixed(0)}</p>
          <div className="flex gap-4 mt-3 text-xs opacity-90">
            <div>
              <p className="opacity-70">Total Area</p>
              <p className="font-bold">{totalArea.toFixed(0)} sq ft</p>
            </div>
            <div>
              <p className="opacity-70">Est. Completion</p>
              <p className="font-bold">{estimatedDays} Days</p>
            </div>
          </div>
        </div>

        {/* Room Breakdown Cards */}
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-3">Room Breakdown</h3>
          <div className="space-y-3">
            {roomsWithCosts.map((room, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-gray-800">{room.name}</p>
                    <p className="text-xs text-gray-500">{room.sqft.toFixed(0)} sq ft</p>
                  </div>
                  <p className="font-black text-orange-600 text-lg">₹{room.subtotal.toFixed(0)}</p>
                </div>
                <div className="flex gap-4 text-xs">
                  <div className="flex-1 bg-orange-50 rounded-lg p-2 text-center">
                    <p className="text-gray-500">Paint Cost</p>
                    <p className="font-bold text-gray-800">₹{room.paintCost.toFixed(0)}</p>
                  </div>
                  <div className="flex-1 bg-blue-50 rounded-lg p-2 text-center">
                    <p className="text-gray-500">Labor Cost</p>
                    <p className="font-bold text-gray-800">₹{room.laborCost.toFixed(0)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Material Logistics */}
        <div>
          <h3 className="text-sm font-bold text-gray-700 mb-3">Material Logistics</h3>
          <div className="space-y-2">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-xl">🪣</div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-semibold uppercase">WALL PAINT</p>
                <p className="text-xl font-black text-gray-800">{wallPaintLiters} Liters</p>
                <p className="text-xs text-gray-400 mt-0.5">Assumes 2 coats over {totalArea.toFixed(0)} sq ft area.</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-xl">🫙</div>
              <div className="flex-1">
                <p className="text-xs text-gray-500 font-semibold uppercase">PRIMER</p>
                <p className="text-xl font-black text-gray-800">{primerLiters} Liters</p>
                <p className="text-xs text-gray-400 mt-0.5">Assumes high-adhesion base layer.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        {onContinue && (
          <button
            onClick={onContinue}
            className="w-full py-4 rounded-2xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all"
          >
            Continue to Summary →
          </button>
        )}
      </div>
    </div>
  );
};

export default InteriorEstimate;
