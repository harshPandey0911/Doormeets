import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

const GenerateQuote = ({ consultation, onBack, onSubmit }) => {
  const wizardData = consultation?.wizardData || {};
  const userRooms = wizardData.rooms || [];

  const [rooms, setRooms] = useState(
    userRooms.map(r => ({
      name: r.name || 'Room',
      sqft: r.netArea || (parseFloat(r.length) || 0) * (parseFloat(r.width) || 0) || 0,
      paintType: r.paintTier || 'PREMIUM',
      finish: r.finish || 'MATT',
      paintCost: 0,
      laborCost: 0,
      subtotal: 0,
    }))
  );
  const [additionalServices, setAdditionalServices] = useState([
    { name: 'Waterproofing', unit: 'sqft', quantity: 0, cost: 0 },
  ]);
  const [timeline, setTimeline] = useState('3-5 Days');
  const [finishing, setFinishing] = useState('Premium Emulsion');
  const [vendorNotes, setVendorNotes] = useState('');
  const [painterName, setPainterName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updateRoom = (idx, updates) => {
    const updated = [...rooms];
    updated[idx] = { ...updated[idx], ...updates };
    updated[idx].subtotal = (parseFloat(updated[idx].paintCost) || 0) + (parseFloat(updated[idx].laborCost) || 0);
    setRooms(updated);
  };

  const addService = () => {
    setAdditionalServices([...additionalServices, { name: '', unit: 'sqft', quantity: 0, cost: 0 }]);
  };

  const removeService = (idx) => {
    setAdditionalServices(additionalServices.filter((_, i) => i !== idx));
  };

  const updateService = (idx, updates) => {
    const updated = [...additionalServices];
    updated[idx] = { ...updated[idx], ...updates };
    setAdditionalServices(updated);
  };

  const basePaintingTotal = rooms.reduce((acc, r) => acc + (r.subtotal || 0), 0);
  const additionalTotal = additionalServices.reduce((acc, s) => acc + (parseFloat(s.cost) || 0), 0);
  const grandTotal = basePaintingTotal + additionalTotal;

  const handleSubmit = async () => {
    if (grandTotal <= 0) {
      toast.error('Please enter cost details before submitting.');
      return;
    }
    try {
      setSubmitting(true);
      const quoteData = {
        rooms,
        additionalServices: additionalServices.filter(s => s.name && s.cost > 0),
        timeline,
        finishing,
        vendorNotes,
        painterDetails: { name: painterName || 'Expert Painter', rating: 4.8, badge: 'Pro-Level Artisan' },
        calculation: {
          paintCost: rooms.reduce((acc, r) => acc + (parseFloat(r.paintCost) || 0), 0),
          labourCost: rooms.reduce((acc, r) => acc + (parseFloat(r.laborCost) || 0), 0),
          additionalServicesCost: additionalTotal,
          grandTotal,
        },
      };
      if (onSubmit) await onSubmit(quoteData);
      toast.success('✅ Quote generated and sent to customer!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate quote.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white sticky top-0 z-40 border-b border-gray-200 h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <span className="text-orange-500 text-lg">←</span>
            </button>
          )}
          <h1 className="font-bold text-orange-600 text-lg">Generate Quote & Bill</h1>
        </div>
      </div>

      <div className="px-4 py-5 max-w-2xl mx-auto space-y-6">
        {/* Customer Info Banner */}
        <div className="bg-gray-800 rounded-2xl p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Customer</p>
          <p className="text-lg font-bold mt-1">{consultation?.userId?.name || 'Customer'} — {consultation?.propertyType}</p>
          <p className="text-sm opacity-80 mt-0.5">{consultation?.address?.city || 'Location pending'}</p>
          {userRooms.length > 0 && (
            <p className="text-xs mt-2 opacity-70">{userRooms.length} room(s) • {wizardData.paintBrand?.replace('_', ' ') || 'Brand TBD'}</p>
          )}
        </div>

        {/* Timeline & Finishing */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Timeline</label>
            <input
              type="text"
              value={timeline}
              onChange={e => setTimeline(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 font-semibold text-gray-800 focus:outline-none focus:border-orange-400"
            />
          </div>
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Finishing Type</label>
            <input
              type="text"
              value={finishing}
              onChange={e => setFinishing(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 font-semibold text-gray-800 focus:outline-none focus:border-orange-400"
            />
          </div>
        </div>

        {/* Painter Name */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Assigned Painter Name</label>
          <input
            type="text"
            value={painterName}
            onChange={e => setPainterName(e.target.value)}
            placeholder="e.g., Rajesh Kumar"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 font-semibold text-gray-800 focus:outline-none focus:border-orange-400"
          />
        </div>

        {/* Room-by-Room Inputs */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Room-by-Room Costs</h3>
          <div className="space-y-3">
            {rooms.map((room, idx) => (
              <div key={idx} className="bg-white rounded-2xl border-2 border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-gray-800">{room.name}</h4>
                  <span className="text-xs text-gray-400">{room.sqft.toFixed(0)} sqft</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Paint Cost (₹)</label>
                    <input
                      type="number"
                      value={room.paintCost || ''}
                      onChange={e => updateRoom(idx, { paintCost: e.target.value })}
                      placeholder="0"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-orange-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Labor Cost (₹)</label>
                    <input
                      type="number"
                      value={room.laborCost || ''}
                      onChange={e => updateRoom(idx, { laborCost: e.target.value })}
                      placeholder="0"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-orange-400"
                    />
                  </div>
                </div>
                {room.subtotal > 0 && (
                  <div className="mt-2 text-right">
                    <span className="text-xs text-gray-400">Subtotal: </span>
                    <span className="text-sm font-bold text-orange-600">₹{room.subtotal.toLocaleString()}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Additional Services */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Additional Services</h3>
          <div className="space-y-2">
            {additionalServices.map((svc, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center gap-2">
                <input
                  type="text"
                  value={svc.name}
                  onChange={e => updateService(idx, { name: e.target.value })}
                  placeholder="Service name"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                />
                <input
                  type="number"
                  value={svc.cost || ''}
                  onChange={e => updateService(idx, { cost: e.target.value })}
                  placeholder="₹ Cost"
                  className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm text-right font-semibold focus:outline-none focus:border-orange-400"
                />
                <button
                  onClick={() => removeService(idx)}
                  className="w-8 h-8 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addService}
            className="w-full mt-2 py-2.5 border-2 border-dashed border-orange-300 rounded-xl text-orange-500 font-bold text-sm hover:bg-orange-50 transition-colors"
          >
            + Add Service Item
          </button>
        </div>

        {/* Vendor Notes */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">On-Site Notes</label>
          <textarea
            value={vendorNotes}
            onChange={e => setVendorNotes(e.target.value)}
            placeholder="Any observations from the home visit..."
            rows={3}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 resize-none"
          />
        </div>

        {/* Quote Summary */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Quote Summary</p>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-sm opacity-90">
              <span>Base Painting</span>
              <span className="font-semibold">₹{basePaintingTotal.toLocaleString()}</span>
            </div>
            {additionalTotal > 0 && (
              <div className="flex justify-between text-sm opacity-90">
                <span>Additional Services</span>
                <span className="font-semibold">₹{additionalTotal.toLocaleString()}</span>
              </div>
            )}
            <div className="border-t border-white/30 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-bold">GRAND TOTAL</span>
                <span className="font-black text-2xl">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`flex-1 py-4 rounded-2xl text-white font-bold text-base transition-all flex items-center justify-center gap-2 ${
              submitting ? 'bg-orange-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 shadow-xl shadow-orange-200'
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
    </div>
  );
};

export default GenerateQuote;
