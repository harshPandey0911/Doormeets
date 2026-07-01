import React, { useState } from 'react';

const PROPERTY_PRESETS = {
  '1BHK': { interior: ['Bedroom', 'Living Room', 'Kitchen', 'Bathroom'], exterior: false },
  '2BHK': { interior: ['Bedroom 1', 'Bedroom 2', 'Living Room', 'Kitchen', 'Bathroom 1', 'Bathroom 2', 'Balcony'], exterior: false },
  '3BHK': { interior: ['Bedroom 1', 'Bedroom 2', 'Bedroom 3', 'Living Room', 'Kitchen', 'Bathroom 1', 'Bathroom 2', 'Bathroom 3', 'Balcony 1', 'Balcony 2'], exterior: false },
  'Villa': { interior: ['Master Bedroom', 'Bedroom 2', 'Bedroom 3', 'Bedroom 4', 'Living Room', 'Library', 'Kitchen', 'Bathroom 1', 'Bathroom 2', 'Bathroom 3'], exterior: true },
};

const VStep1PropertyDetails = ({ quoteData, updateQuoteData, onNext }) => {
  const propertyType = quoteData.propertyType || '2BHK';
  const preset = PROPERTY_PRESETS[propertyType] || PROPERTY_PRESETS['2BHK'];

  const [scope, setScope] = useState(quoteData.scope || 'interior');
  const [selectedRooms, setSelectedRooms] = useState(
    quoteData.selectedRooms || preset.interior.map(name => ({ name, selected: true }))
  );
  const [customRoom, setCustomRoom] = useState('');

  const toggleRoom = (idx) => {
    const updated = [...selectedRooms];
    updated[idx].selected = !updated[idx].selected;
    setSelectedRooms(updated);
  };

  const addCustomRoom = () => {
    if (customRoom.trim()) {
      setSelectedRooms([...selectedRooms, { name: customRoom.trim(), selected: true }]);
      setCustomRoom('');
    }
  };

  const removeRoom = (idx) => {
    setSelectedRooms(selectedRooms.filter((_, i) => i !== idx));
  };

  const activeRooms = selectedRooms.filter(r => r.selected);

  const handleNext = () => {
    if (activeRooms.length === 0) return;
    updateQuoteData({
      scope,
      selectedRooms,
      rooms: activeRooms.map(r => ({
        name: r.name,
        walls: [
          { name: 'Wall 1', length: '', height: '10', deductions: 0 },
          { name: 'Wall 2', length: '', height: '10', deductions: 0 },
          { name: 'Wall 3', length: '', height: '10', deductions: 0 },
          { name: 'Wall 4', length: '', height: '10', deductions: 0 },
        ],
        ceilingIncluded: false,
      })),
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      {/* Scope Selection */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Painting Scope</h3>
        <div className="grid grid-cols-2 gap-3">
          {['interior', 'exterior', 'both'].filter(s => s !== 'exterior' || preset.exterior).map(s => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`py-4 rounded-2xl border-2 font-bold text-sm capitalize transition-all ${
                scope === s
                  ? 'border-orange-400 bg-orange-50 text-orange-700 shadow-md shadow-orange-100'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {s === 'both' ? '🏠 Interior + Exterior' : s === 'interior' ? '🏗️ Interior Only' : '🏡 Exterior Only'}
            </button>
          ))}
        </div>
      </div>

      {/* Room Selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Select Rooms</h3>
          <span className="text-xs text-orange-600 font-bold">{activeRooms.length} selected</span>
        </div>
        <div className="space-y-2">
          {selectedRooms.map((room, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                room.selected
                  ? 'border-orange-400 bg-orange-50'
                  : 'border-gray-200 bg-white'
              }`}
              onClick={() => toggleRoom(idx)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                  room.selected ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                }`}>
                  {room.selected && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <span className={`font-semibold text-sm ${room.selected ? 'text-orange-700' : 'text-gray-600'}`}>
                  {room.name}
                </span>
              </div>
              {!preset.interior.includes(room.name) && (
                <button
                  onClick={(e) => { e.stopPropagation(); removeRoom(idx); }}
                  className="text-red-400 hover:text-red-600 text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Add Custom Room */}
        <div className="flex gap-2 mt-3">
          <input
            type="text"
            value={customRoom}
            onChange={e => setCustomRoom(e.target.value)}
            placeholder="Add custom room..."
            className="flex-1 border-2 border-dashed border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
            onKeyDown={e => e.key === 'Enter' && addCustomRoom()}
          />
          <button
            onClick={addCustomRoom}
            disabled={!customRoom.trim()}
            className="px-4 py-2.5 bg-orange-500 text-white font-bold rounded-xl text-sm hover:bg-orange-600 disabled:opacity-40 transition-all"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-800 rounded-2xl p-5 text-white flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Selected</p>
          <p className="text-xl font-black mt-0.5">{activeRooms.length} Room(s)</p>
          <p className="text-xs opacity-60 mt-0.5 capitalize">{scope} painting</p>
        </div>
        <span className="text-3xl opacity-40">🏠</span>
      </div>

      {/* Next */}
      <button
        onClick={handleNext}
        disabled={activeRooms.length === 0}
        className="w-full py-4 rounded-2xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next: Wall Measurements →
      </button>
    </div>
  );
};

export default VStep1PropertyDetails;
