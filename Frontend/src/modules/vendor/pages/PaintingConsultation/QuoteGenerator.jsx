import React, { useState } from 'react';
import { generateQuote } from '../../services/paintingConsultationService';
import { toast } from 'react-hot-toast';

const QuoteGenerator = ({ consultation, onQuoteGenerated, onCancel }) => {
  const wizardData = consultation?.wizardData || {};
  const userRooms = wizardData.rooms || [];

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    customerName: consultation?.userId?.name || '',
    customerPhone: consultation?.userId?.phone || '',
    timeline: '3-5 Days',
    finishing: 'Premium Emulsion',
    vendorNotes: '',
    discount: 0,
  });

  // Room measurements — prefilled from user wizard data
  const [rooms, setRooms] = useState(
    userRooms.length > 0
      ? userRooms.map(r => ({
          name: r.name || 'Room',
          sqft: r.netArea || parseFloat(r.length || 0) * parseFloat(r.width || 0) || 0,
          paintType: r.paintTier || 'PREMIUM',
          paintCost: 0,
          laborCost: 0,
        }))
      : [{ name: 'Living Room', sqft: 0, paintType: 'PREMIUM', paintCost: 0, laborCost: 0 }]
  );

  // Additional Services
  const [additionalServices, setAdditionalServices] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const updateRoom = (idx, field, val) => {
    const updated = [...rooms];
    updated[idx] = { ...updated[idx], [field]: val };
    // Auto-calc costs
    const sqft = parseFloat(updated[idx].sqft) || 0;
    updated[idx].paintCost = sqft * 12;
    updated[idx].laborCost = sqft * 8;
    setRooms(updated);
  };

  const addRoom = () => {
    setRooms([...rooms, { name: 'Room', sqft: 0, paintType: 'PREMIUM', paintCost: 0, laborCost: 0 }]);
  };

  const removeRoom = (idx) => {
    if (rooms.length > 1) setRooms(rooms.filter((_, i) => i !== idx));
  };

  const addService = () => {
    setAdditionalServices([...additionalServices, { name: '', unit: 'sqft', quantity: 0, cost: 0 }]);
  };

  const updateService = (idx, field, val) => {
    const updated = [...additionalServices];
    updated[idx] = { ...updated[idx], [field]: val };
    setAdditionalServices(updated);
  };

  const removeService = (idx) => {
    setAdditionalServices(additionalServices.filter((_, i) => i !== idx));
  };

  // Calculations
  const basePaintCost = rooms.reduce((acc, r) => acc + (parseFloat(r.sqft) || 0) * 12, 0);
  const materialsCost = rooms.reduce((acc, r) => acc + (parseFloat(r.sqft) || 0) * 3, 0);
  const labourCost = rooms.reduce((acc, r) => acc + (parseFloat(r.sqft) || 0) * 8, 0);
  const additionalCost = additionalServices.reduce((acc, s) => acc + (parseFloat(s.cost) || 0), 0);
  const subtotal = basePaintCost + materialsCost + additionalCost;
  const discountAmount = parseFloat(formData.discount) || 0;
  const gst = (subtotal - discountAmount) * 0.18;
  const grandTotal = subtotal - discountAmount + gst;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!consultation?._id) return;

    try {
      setLoading(true);

      const payload = {
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        interiorArea: rooms.reduce((acc, r) => acc + (parseFloat(r.sqft) || 0), 0),
        exteriorArea: 0,
        timeline: formData.timeline,
        finishing: formData.finishing,
        vendorNotes: formData.vendorNotes,
        rooms: rooms.map(r => ({
          name: r.name,
          sqft: parseFloat(r.sqft) || 0,
          paintType: r.paintType,
          paintCost: (parseFloat(r.sqft) || 0) * 12,
          laborCost: (parseFloat(r.sqft) || 0) * 8,
          subtotal: (parseFloat(r.sqft) || 0) * 20,
        })),
        additionalServices,
        calculation: {
          paintCost: basePaintCost,
          puttyCost: 0,
          primerCost: materialsCost,
          labourCost,
          additionalServicesCost: additionalCost,
          discount: discountAmount,
          gst,
          grandTotal
        }
      };

      await generateQuote(consultation._id, payload);
      toast.success('Quote generated and sent to user!');
      if (onQuoteGenerated) onQuoteGenerated();
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate quote');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-5 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-lg">Generate Bill & Quote</h2>
          <p className="text-gray-400 text-xs mt-0.5">{consultation?.propertyType} • {consultation?.address?.fullAddress || 'Address on file'}</p>
        </div>
        {onCancel && (
          <button onClick={onCancel} className="text-gray-400 hover:text-white text-sm">✕</button>
        )}
      </div>

      {/* User's wizard data summary */}
      {userRooms.length > 0 && (
        <div className="bg-orange-50 border-b border-orange-100 px-5 py-3">
          <p className="text-xs font-semibold text-orange-700 mb-1">📋 User's Requirements</p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="bg-white px-2 py-1 rounded-full text-gray-700 border border-gray-200">
              {userRooms.length} Room(s)
            </span>
            <span className="bg-white px-2 py-1 rounded-full text-gray-700 border border-gray-200">
              {wizardData.paintBrand?.replace('_', ' ') || 'Asian Paints'}
            </span>
            {wizardData.numberOfPainters && (
              <span className="bg-white px-2 py-1 rounded-full text-gray-700 border border-gray-200">
                {wizardData.numberOfPainters} Painters
              </span>
            )}
            {wizardData.grandTotal > 0 && (
              <span className="bg-white px-2 py-1 rounded-full text-orange-700 border border-orange-200 font-semibold">
                User Estimate: ₹{wizardData.grandTotal}
              </span>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        {/* Customer Info */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Customer Name</label>
            <input type="text" name="customerName" value={formData.customerName} onChange={handleChange}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-orange-400" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Phone</label>
            <input type="text" name="customerPhone" value={formData.customerPhone} onChange={handleChange}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-orange-400" />
          </div>
        </div>

        {/* Timeline & Finishing */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Timeline</label>
            <select name="timeline" value={formData.timeline} onChange={handleChange}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-orange-400 bg-white">
              <option>1-2 Days</option>
              <option>3-5 Days</option>
              <option>1 Week</option>
              <option>2 Weeks</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Finishing Type</label>
            <select name="finishing" value={formData.finishing} onChange={handleChange}
              className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-orange-400 bg-white">
              <option>Standard Emulsion</option>
              <option>Premium Emulsion</option>
              <option>Luxury Finish</option>
              <option>Distemper</option>
            </select>
          </div>
        </div>

        {/* Room-by-Room Measurements */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-700">📐 Room-by-Room Measurements</h3>
            <button type="button" onClick={addRoom} className="text-xs text-orange-500 font-bold hover:text-orange-600">
              + Add Room
            </button>
          </div>
          <div className="space-y-2">
            {rooms.map((room, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={room.name}
                    onChange={e => updateRoom(idx, 'name', e.target.value)}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-semibold bg-white focus:outline-none focus:border-orange-400"
                    placeholder="Room name"
                  />
                  <input
                    type="number"
                    value={room.sqft}
                    onChange={e => updateRoom(idx, 'sqft', e.target.value)}
                    className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-semibold bg-white focus:outline-none focus:border-orange-400 text-center"
                    placeholder="sq ft"
                  />
                  <span className="text-xs text-gray-400">sq ft</span>
                  {rooms.length > 1 && (
                    <button type="button" onClick={() => removeRoom(idx)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
                  )}
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>Paint: ₹{((parseFloat(room.sqft) || 0) * 12).toFixed(0)}</span>
                  <span>Labour: ₹{((parseFloat(room.sqft) || 0) * 8).toFixed(0)}</span>
                  <span className="font-semibold text-gray-700">= ₹{((parseFloat(room.sqft) || 0) * 20).toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Services */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-700">🔧 Additional Services</h3>
            <button type="button" onClick={addService} className="text-xs text-orange-500 font-bold hover:text-orange-600">
              + Add New Item
            </button>
          </div>
          {additionalServices.length === 0 && (
            <p className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3 border border-dashed border-gray-200 text-center">
              No additional services. Click "+ Add New Item" to add.
            </p>
          )}
          {additionalServices.map((svc, idx) => (
            <div key={idx} className="bg-gray-50 rounded-xl p-3 border border-gray-200 mb-2 flex items-center gap-2">
              <input type="text" value={svc.name} onChange={e => updateService(idx, 'name', e.target.value)}
                placeholder="Service name" className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white" />
              <input type="number" value={svc.quantity} onChange={e => updateService(idx, 'quantity', e.target.value)}
                placeholder="Qty" className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white text-center" />
              <input type="number" value={svc.cost} onChange={e => updateService(idx, 'cost', e.target.value)}
                placeholder="₹" className="w-20 border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white text-center" />
              <button type="button" onClick={() => removeService(idx)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
            </div>
          ))}
        </div>

        {/* On-site Notes */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">📝 On-site Notes</label>
          <textarea
            name="vendorNotes"
            value={formData.vendorNotes}
            onChange={handleChange}
            rows={3}
            placeholder="Any observations from the site visit..."
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-400 resize-none"
          />
        </div>

        {/* Discount */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Discount (₹)</label>
          <input type="number" name="discount" value={formData.discount} onChange={handleChange}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-orange-400" />
        </div>

        {/* 3-Category Quote Summary */}
        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
          <h3 className="font-bold text-sm text-gray-700 mb-3">Quote Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>🎨 Base Painting</span>
              <span className="font-semibold text-gray-800">₹{basePaintCost.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>🪣 Materials (Primer/Putty)</span>
              <span className="font-semibold text-gray-800">₹{materialsCost.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>👷 Labour</span>
              <span className="font-semibold text-gray-800">₹{labourCost.toFixed(0)}</span>
            </div>
            {additionalCost > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>🔧 Additional Services</span>
                <span className="font-semibold text-gray-800">₹{additionalCost.toFixed(0)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span className="font-semibold">-₹{discountAmount.toFixed(0)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>GST (18%)</span>
              <span className="font-semibold text-gray-800">₹{gst.toFixed(0)}</span>
            </div>
            <div className="border-t border-gray-300 pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-bold text-gray-800">Grand Total</span>
                <span className="font-black text-xl text-orange-600">₹{grandTotal.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 py-4 rounded-2xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              loading ? 'bg-orange-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-200'
            }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>📤 Generate & Send</>
            )}
          </button>
          <button
            type="button"
            className="px-6 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all"
          >
            📄 Preview PDF
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuoteGenerator;
