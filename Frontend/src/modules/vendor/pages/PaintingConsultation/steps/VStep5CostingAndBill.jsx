import React, { useState } from 'react';

const VStep5CostingAndBill = ({ quoteData, updateQuoteData, onBack, onSubmit, submitting }) => {
  const rooms = quoteData.rooms || [];
  const additionalServices = (quoteData.additionalServices || []).filter(s => s.enabled);
  const paintRate = quoteData.paintRatePerSqft || 14;
  const totalArea = rooms.reduce((acc, r) => acc + (r.netArea || 0), 0);

  // Editable costs
  const [roomCosts, setRoomCosts] = useState(
    rooms.map(r => ({
      name: r.name,
      sqft: r.netArea || 0,
      paintCost: Math.round((r.netArea || 0) * paintRate),
      laborCost: Math.round((r.netArea || 0) * 8),
    }))
  );
  const [timeline, setTimeline] = useState(quoteData.timeline || '3-5 Days');
  const [finishing, setFinishing] = useState(quoteData.paintFinish || 'Premium Emulsion');
  const [painterName, setPainterName] = useState(quoteData.painterName || '');
  const [painterRating, setPainterRating] = useState(quoteData.painterRating || '4.8');
  const [vendorNotes, setVendorNotes] = useState(quoteData.vendorNotes || '');
  const [discount, setDiscount] = useState(0);

  const updateRoomCost = (idx, field, value) => {
    const updated = [...roomCosts];
    updated[idx] = { ...updated[idx], [field]: parseFloat(value) || 0 };
    setRoomCosts(updated);
  };

  // Calculations
  const basePaintingTotal = roomCosts.reduce((acc, r) => acc + r.paintCost + r.laborCost, 0);
  const additionalTotal = additionalServices.reduce((acc, s) => acc + (s.totalCost || 0), 0);
  const subtotal = basePaintingTotal + additionalTotal;
  const discountAmount = parseFloat(discount) || 0;
  const gst = Math.round((subtotal - discountAmount) * 0.18);
  const grandTotal = subtotal - discountAmount + gst;

  const handleSubmit = () => {
    const finalData = {
      ...quoteData,
      timeline,
      finishing,
      vendorNotes,
      painterDetails: {
        name: painterName || 'Expert Painter',
        rating: parseFloat(painterRating) || 4.8,
        badge: 'Pro-Level Artisan',
      },
      rooms: roomCosts.map((rc, idx) => ({
        name: rc.name,
        sqft: rc.sqft,
        paintType: quoteData.paintTier || 'PREMIUM',
        paintCost: rc.paintCost,
        laborCost: rc.laborCost,
        subtotal: rc.paintCost + rc.laborCost,
      })),
      additionalServices: additionalServices.map(s => ({
        name: s.name,
        quantity: s.quantity,
        cost: s.totalCost,
      })),
      calculation: {
        paintCost: roomCosts.reduce((acc, r) => acc + r.paintCost, 0),
        labourCost: roomCosts.reduce((acc, r) => acc + r.laborCost, 0),
        additionalServicesCost: additionalTotal,
        discount: discountAmount,
        gst,
        grandTotal,
      },
    };
    onSubmit(finalData);
  };

  return (
    <div className="space-y-6">
      {/* Timeline & Finishing */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Timeline</label>
          <select
            value={timeline}
            onChange={e => setTimeline(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 font-semibold text-gray-800 focus:outline-none focus:border-orange-400 bg-white text-sm"
          >
            <option>1-2 Days</option>
            <option>3-5 Days</option>
            <option>1 Week</option>
            <option>2 Weeks</option>
            <option>3+ Weeks</option>
          </select>
        </div>
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Finishing</label>
          <input
            type="text"
            value={finishing}
            onChange={e => setFinishing(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 font-semibold text-gray-800 focus:outline-none focus:border-orange-400 text-sm"
          />
        </div>
      </div>

      {/* Painter Details */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Assigned Painter</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-gray-500 font-semibold mb-1 uppercase">Name</label>
            <input
              type="text"
              value={painterName}
              onChange={e => setPainterName(e.target.value)}
              placeholder="e.g., Rajesh Kumar"
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-orange-400"
            />
          </div>
          <div>
            <label className="block text-[10px] text-gray-500 font-semibold mb-1 uppercase">Rating</label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="5"
              value={painterRating}
              onChange={e => setPainterRating(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-orange-400"
            />
          </div>
        </div>
      </div>

      {/* Room-by-Room Costs (Editable) */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Room-by-Room Costs</h3>
        <div className="space-y-3">
          {roomCosts.map((room, idx) => (
            <div key={idx} className="bg-white rounded-2xl border-2 border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-800">{room.name}</h4>
                <span className="text-xs text-gray-400">{room.sqft.toFixed(0)} sq ft</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-500 font-semibold mb-1 uppercase">Paint Cost (₹)</label>
                  <input
                    type="number"
                    value={room.paintCost}
                    onChange={e => updateRoomCost(idx, 'paintCost', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 font-semibold mb-1 uppercase">Labor Cost (₹)</label>
                  <input
                    type="number"
                    value={room.laborCost}
                    onChange={e => updateRoomCost(idx, 'laborCost', e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-orange-400"
                  />
                </div>
              </div>
              <div className="mt-2 text-right">
                <span className="text-xs text-gray-400">Subtotal: </span>
                <span className="text-sm font-bold text-orange-600">₹{(room.paintCost + room.laborCost).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Services Summary */}
      {additionalTotal > 0 && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Additional Services</h3>
          {additionalServices.map((s, idx) => (
            <div key={idx} className="flex justify-between text-sm py-1.5">
              <span className="text-gray-600">{s.name} (×{s.quantity})</span>
              <span className="font-semibold text-gray-800">₹{(s.totalCost || 0).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Vendor Notes */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">On-Site Notes for Customer</label>
        <textarea
          value={vendorNotes}
          onChange={e => setVendorNotes(e.target.value)}
          placeholder="Any observations from the home visit..."
          rows={3}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 resize-none"
        />
      </div>

      {/* Discount */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-4">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Discount (₹)</label>
        <input
          type="number"
          value={discount}
          onChange={e => setDiscount(e.target.value)}
          placeholder="0"
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-orange-400"
        />
      </div>

      {/* Final Bill Summary */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Final Bill Summary</p>
        <div className="mt-3 space-y-2">
          <div className="flex justify-between text-sm opacity-90">
            <span>🎨 Base Painting ({rooms.length} rooms)</span>
            <span className="font-semibold">₹{basePaintingTotal.toLocaleString()}</span>
          </div>
          {additionalTotal > 0 && (
            <div className="flex justify-between text-sm opacity-90">
              <span>🔧 Additional Services</span>
              <span className="font-semibold">₹{additionalTotal.toLocaleString()}</span>
            </div>
          )}
          {discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-200">
              <span>💰 Discount</span>
              <span className="font-semibold">-₹{discountAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-sm opacity-90">
            <span>📋 GST (18%)</span>
            <span className="font-semibold">₹{gst.toLocaleString()}</span>
          </div>
          <div className="border-t border-white/30 pt-3 mt-2">
            <div className="flex justify-between">
              <span className="font-bold">GRAND TOTAL</span>
              <span className="font-black text-3xl">₹{grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-6 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all"
        >
          ← Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || grandTotal <= 0}
          className={`flex-1 py-4 rounded-2xl text-white font-bold text-base transition-all flex items-center justify-center gap-2 ${
            submitting || grandTotal <= 0
              ? 'bg-orange-300 cursor-not-allowed'
              : 'bg-orange-500 hover:bg-orange-600 shadow-xl shadow-orange-200'
          }`}
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sending...
            </>
          ) : (
            <>📤 Generate & Send Quote</>
          )}
        </button>
      </div>
    </div>
  );
};

export default VStep5CostingAndBill;
