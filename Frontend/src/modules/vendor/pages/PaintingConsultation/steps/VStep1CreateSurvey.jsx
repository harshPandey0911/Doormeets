import React, { useState } from 'react';

const BHK_PRESETS = {
  '1BHK':  ['Bedroom', 'Living Room', 'Kitchen', 'Bathroom'],
  '2BHK':  ['Bedroom 1', 'Bedroom 2', 'Living Room', 'Kitchen', 'Bathroom 1', 'Bathroom 2', 'Balcony'],
  '3BHK':  ['Bedroom 1', 'Bedroom 2', 'Bedroom 3', 'Living Room', 'Kitchen', 'Bathroom 1', 'Bathroom 2', 'Bathroom 3', 'Balcony 1'],
  'Villa': ['Master Bedroom', 'Bedroom 2', 'Bedroom 3', 'Bedroom 4', 'Living Room', 'Library', 'Kitchen', 'Bathroom 1', 'Bathroom 2', 'Terrace'],
};

const SCOPES = [
  { id: 'interior', label: 'Interior Only', icon: '🏗️', desc: 'Walls, Ceilings inside' },
  { id: 'exterior', label: 'Exterior Only', icon: '🏡', desc: 'Outer facades & elevations' },
  { id: 'both',     label: 'Interior + Exterior', icon: '🏠', desc: 'Full property painting' },
];

const ROOM_ICONS = {
  'Bedroom': '🛏️', 'Bedroom 1': '🛏️', 'Bedroom 2': '🛏️', 'Bedroom 3': '🛏️',
  'Bedroom 4': '🛏️', 'Master Bedroom': '🛏️',
  'Living Room': '🛋️', 'Kitchen': '🍳', 'Bathroom': '🚿',
  'Bathroom 1': '🚿', 'Bathroom 2': '🚿', 'Bathroom 3': '🚿',
  'Balcony': '🌿', 'Balcony 1': '🌿', 'Library': '📚',
  'Terrace': '☀️', 'Study Room': '📖', 'Dining Room': '🍽️',
};

const defaultRoom = (name) => ({
  name,
  selected: true,
  walls: [
    { name: 'Wall 1', height: '10', width: '' },
    { name: 'Wall 2', height: '10', width: '' },
    { name: 'Wall 3', height: '10', width: '' },
    { name: 'Wall 4', height: '10', width: '' },
  ],
  ceiling: { included: false, length: '', width: '' },
  windows: 1,
  doors: 1,
  wardrobes: 0,
  repairType: 'paint_only',
  surfaceCondition: { dampness: false, grossFilling: false },
  paintingAssessment: false,
  additionalServices: [],
});

const VStep1CreateSurvey = ({ quoteData, updateQuoteData, onNext }) => {
  const propertyType = quoteData.propertyType || '2BHK';
  const preset = BHK_PRESETS[propertyType] || BHK_PRESETS['2BHK'];

  const [scope, setScope] = useState(quoteData.scope || 'interior');
  const [rooms, setRooms] = useState(() => {
    if (quoteData.rooms && quoteData.rooms.length > 0) return quoteData.rooms;
    return preset.map(defaultRoom);
  });
  const [customRoomName, setCustomRoomName] = useState('');

  const toggleRoom = (idx) => {
    const updated = [...rooms];
    updated[idx] = { ...updated[idx], selected: !updated[idx].selected };
    setRooms(updated);
  };

  const addCustomRoom = () => {
    const name = customRoomName.trim();
    if (!name) return;
    setRooms([...rooms, defaultRoom(name)]);
    setCustomRoomName('');
  };

  const removeRoom = (idx) => {
    if (rooms.length > 1) setRooms(rooms.filter((_, i) => i !== idx));
  };

  const selected = rooms.filter(r => r.selected);

  const handleNext = () => {
    if (selected.length === 0) return;
    updateQuoteData({ scope, rooms });
    onNext();
  };

  const handleScopeChange = (newScope) => {
    setScope(newScope);
    setRooms(prevRooms => {
      let updated = prevRooms.map(room => {
        const nameLower = room.name.toLowerCase();
        const isExteriorRoom = nameLower.includes('balcony') || nameLower.includes('terrace') || nameLower.includes('exterior') || nameLower.includes('outer');
        
        if (newScope === 'interior') {
          return { ...room, selected: !isExteriorRoom };
        } else if (newScope === 'exterior') {
          return { ...room, selected: isExteriorRoom };
        } else {
          return { ...room, selected: true };
        }
      });

      if (newScope === 'exterior' && !updated.some(r => r.selected)) {
        const hasExterior = updated.some(r => r.name === 'Exterior');
        if (hasExterior) {
          updated = updated.map(r => r.name === 'Exterior' ? { ...r, selected: true } : r);
        } else {
          updated.push(defaultRoom('Exterior'));
        }
      }
      return updated;
    });
  };

  return (
    <div className="space-y-6 pb-4">

      {/* Scope Selection */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Painting Scope</h3>
        <div className="space-y-2">
          {SCOPES.filter(s => s.id === scope).map(s => (
            <div
              key={s.id}
              onClick={() => handleScopeChange(s.id)}
              className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                scope === s.id ? 'border-orange-400 bg-orange-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{s.icon}</span>
                <div>
                  <p className={`font-bold text-sm ${scope === s.id ? 'text-white' : 'text-gray-800'}`}>{s.label}</p>
                  <p className={`text-xs ${scope === s.id ? 'text-white/80' : 'text-gray-500'}`}>{s.desc}</p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                scope === s.id ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
              }`}>
                {scope === s.id && <span className="text-white text-[10px]">✓</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Room Selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Rooms to Paint</h3>
          <span className="text-xs font-bold text-white bg-orange-500 px-3 py-1 rounded-full shadow-sm">
            {selected.length} selected
          </span>
        </div>

        <div className="space-y-2">
          {rooms.map((room, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                room.selected ? 'border-orange-400 bg-orange-50' : 'border-gray-200 bg-white'
              }`}
              onClick={() => toggleRoom(idx)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  room.selected ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                }`}>
                  {room.selected && <span className="text-white text-xs font-bold">✓</span>}
                </div>
                <span className="text-lg">{ROOM_ICONS[room.name] || '🚪'}</span>
                <p className={`font-semibold text-sm ${room.selected ? 'text-white' : 'text-gray-700'}`}>
                  {room.name}
                </p>
              </div>
              {!preset.includes(room.name) && (
                <button
                  onClick={e => { e.stopPropagation(); removeRoom(idx); }}
                  className="text-red-400 hover:text-red-600 text-xs font-bold px-2"
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
            value={customRoomName}
            onChange={e => setCustomRoomName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustomRoom()}
            placeholder="Add another room (e.g., Study Room)..."
            className="flex-1 border-2 border-dashed border-orange-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-orange-400"
          />
          <button
            onClick={addCustomRoom}
            disabled={!customRoomName.trim()}
            className="px-4 py-2.5 bg-orange-500 text-white font-bold rounded-xl text-sm hover:bg-orange-600 disabled:opacity-40 transition-all"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-800 rounded-2xl p-5 text-white flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Survey Ready</p>
          <p className="text-xl font-black mt-0.5">{selected.length} Room(s)</p>
          <p className="text-xs opacity-60 mt-0.5 capitalize">{scope.replace('_', ' ')} painting</p>
        </div>
        <span className="text-4xl opacity-30">🏠</span>
      </div>

      <button
        onClick={handleNext}
        disabled={selected.length === 0}
        className="w-full py-4 rounded-2xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next: Measure Surfaces →
      </button>
    </div>
  );
};

export default VStep1CreateSurvey;
