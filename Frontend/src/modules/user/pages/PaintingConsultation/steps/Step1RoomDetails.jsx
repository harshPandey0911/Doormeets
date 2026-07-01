import React, { useState } from 'react';

const ROOM_TYPES = ['Bedroom', 'Master Bedroom', 'Living Room', 'Kitchen', 'Bathroom', 'Study Room', 'Dining Room', 'Hallway'];

const defaultRoom = {
  name: 'Bedroom',
  finishStyle: 'LIGHT',
  repairType: 'PRIMER',
  length: '',
  width: '',
  netArea: 0,
  subtractions: [
    { type: 'DOOR', length: 3, width: 7 },
    { type: 'WINDOW', length: 4, width: 4 },
  ],
  paintingNeeded: true,
  additionalServiceNeeded: false,
};

const RepairCard = ({ type, label, desc, icon, selected, onClick }) => (
  <div
    onClick={onClick}
    className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
      selected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-orange-300'
    }`}
  >
    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${selected ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
      <span className="text-lg">{icon}</span>
    </div>
    <div>
      <p className={`font-bold text-sm ${selected ? 'text-orange-700' : 'text-gray-800'}`}>{label}</p>
      <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
    </div>
  </div>
);

const Toggle = ({ value, onChange, label, desc }) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
        <span className="text-orange-500 text-sm">🖌️</span>
      </div>
      <div>
        <p className="font-semibold text-sm text-gray-800">{label}</p>
        {desc && <p className="text-xs text-gray-400">{desc}</p>}
      </div>
    </div>
    <button
      onClick={() => onChange(!value)}
      className={`relative inline-flex w-12 h-6 rounded-full transition-all ${value ? 'bg-orange-500' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${value ? 'translate-x-6' : 'translate-x-0'}`} />
    </button>
  </div>
);

const Step1RoomDetails = ({ wizardData, updateWizardData, goNext }) => {
  const rooms = wizardData.rooms.length > 0 ? wizardData.rooms : [{ ...defaultRoom }];
  const [activeRoomIdx, setActiveRoomIdx] = useState(0);
  const room = rooms[activeRoomIdx] || { ...defaultRoom };

  const updateRoom = (updates) => {
    const updated = [...rooms];
    updated[activeRoomIdx] = { ...updated[activeRoomIdx], ...updates };
    // Auto-calculate net area
    const l = parseFloat(updates.length ?? room.length) || 0;
    const w = parseFloat(updates.width ?? room.width) || 0;
    const subtractionArea = (updated[activeRoomIdx].subtractions || []).reduce(
      (acc, s) => acc + (parseFloat(s.length) || 0) * (parseFloat(s.width) || 0),
      0
    );
    updated[activeRoomIdx].netArea = Math.max(0, (l * w) - subtractionArea);
    updateWizardData({ rooms: updated });
  };

  const addRoom = () => {
    const newRooms = [...rooms, { ...defaultRoom, name: 'Room ' + (rooms.length + 1) }];
    updateWizardData({ rooms: newRooms });
    setActiveRoomIdx(newRooms.length - 1);
  };

  const addSubtraction = () => {
    updateRoom({ subtractions: [...(room.subtractions || []), { type: 'DOOR', length: 3, width: 7 }] });
  };

  const removeSubtraction = (idx) => {
    const subs = [...(room.subtractions || [])];
    subs.splice(idx, 1);
    updateRoom({ subtractions: subs });
  };

  const updateSubtraction = (idx, field, val) => {
    const subs = [...(room.subtractions || [])];
    subs[idx] = { ...subs[idx], [field]: val };
    updateRoom({ subtractions: subs });
  };

  const canProceed = room.length && room.width;

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Room Details</h2>
        <p className="text-gray-500 text-sm mt-1">Configure your space dimensions and preferences.</p>
      </div>

      {/* Room tabs */}
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
          <button
            onClick={addRoom}
            className="px-4 py-1.5 rounded-full text-sm font-semibold bg-gray-100 text-orange-500 border border-orange-200 whitespace-nowrap"
          >
            + Add Room
          </button>
        </div>
      )}

      {/* Room Type */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">ROOM TYPE</label>
        <select
          value={room.name}
          onChange={e => updateRoom({ name: e.target.value })}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-semibold focus:outline-none focus:border-orange-400 bg-white"
        >
          {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Finish Style */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">FINISH STYLE</label>
        <div className="flex rounded-xl border-2 border-gray-200 overflow-hidden">
          {['LIGHT', 'DARK'].map(fs => (
            <button
              key={fs}
              onClick={() => updateRoom({ finishStyle: fs })}
              className={`flex-1 py-3 text-sm font-bold transition-all ${
                room.finishStyle === fs ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {fs === 'LIGHT' ? '☀️ Light Finish' : '🌙 Dark Finish'}
            </button>
          ))}
        </div>
      </div>

      {/* Repair Type */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">REPAIR TYPE SELECTION</label>
        <div className="space-y-2">
          <RepairCard type="NON_PUTTY" label="Non-putty" desc="Minor retouching only." icon="✏️"
            selected={room.repairType === 'NON_PUTTY'} onClick={() => updateRoom({ repairType: 'NON_PUTTY' })} />
          <RepairCard type="PRIMER" label="Primer" desc="One coat of base primer." icon="🖌️"
            selected={room.repairType === 'PRIMER'} onClick={() => updateRoom({ repairType: 'PRIMER' })} />
          <RepairCard type="PUTTY" label="Putty" desc="Full surface leveling." icon="🔲"
            selected={room.repairType === 'PUTTY'} onClick={() => updateRoom({ repairType: 'PUTTY' })} />
        </div>
      </div>

      {/* Measurements */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-orange-500 text-lg">📐</span>
          <h3 className="font-bold text-gray-800">Measurements</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">LENGTH (FT)</label>
            <input
              type="number"
              value={room.length}
              onChange={e => updateRoom({ length: e.target.value })}
              placeholder="12"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-semibold focus:outline-none focus:border-orange-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">WIDTH (FT)</label>
            <input
              type="number"
              value={room.width}
              onChange={e => updateRoom({ width: e.target.value })}
              placeholder="10"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-semibold focus:outline-none focus:border-orange-400"
            />
          </div>
        </div>
        {room.netArea > 0 && (
          <div className="mt-3 p-2 bg-orange-50 rounded-lg text-center">
            <span className="text-xs text-gray-500">Net Paintable Area: </span>
            <span className="font-bold text-orange-600">{room.netArea.toFixed(1)} sq ft</span>
          </div>
        )}
      </div>

      {/* Subtraction Zones */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-red-500 text-lg">⊖</span>
          <h3 className="font-bold text-gray-800">Subtraction Zones</h3>
        </div>
        {(room.subtractions || []).map((sub, idx) => (
          <div key={idx} className="flex items-center gap-2 mb-2 bg-gray-50 rounded-xl p-3">
            <select
              value={sub.type}
              onChange={e => updateSubtraction(idx, 'type', e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-white"
            >
              <option value="DOOR">Door</option>
              <option value="WINDOW">Window</option>
              <option value="CUSTOM">Custom</option>
            </select>
            <input
              type="number"
              value={sub.length}
              onChange={e => updateSubtraction(idx, 'length', e.target.value)}
              className="w-14 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center"
              placeholder="L"
            />
            <span className="text-gray-400 text-sm">×</span>
            <input
              type="number"
              value={sub.width}
              onChange={e => updateSubtraction(idx, 'width', e.target.value)}
              className="w-14 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center"
              placeholder="W"
            />
            <span className="text-xs text-gray-400">ft</span>
            <button onClick={() => removeSubtraction(idx)} className="ml-auto text-red-400 hover:text-red-600 text-sm">✕</button>
          </div>
        ))}
        <button
          onClick={addSubtraction}
          className="w-full mt-2 py-2 border-2 border-dashed border-orange-300 rounded-xl text-orange-500 font-semibold text-sm hover:bg-orange-50 transition-all"
        >
          + Add Subtraction
        </button>
      </div>

      {/* Toggles */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-4">
        <Toggle
          value={room.paintingNeeded}
          onChange={val => updateRoom({ paintingNeeded: val })}
          label="Painting Needed?"
        />
        <Toggle
          value={room.additionalServiceNeeded}
          onChange={val => updateRoom({ additionalServiceNeeded: val })}
          label="Additional Service?"
        />
      </div>

      {rooms.length === 1 && (
        <button
          onClick={addRoom}
          className="w-full py-3 rounded-xl border-2 border-dashed border-orange-300 text-orange-500 font-bold text-sm hover:bg-orange-50 transition-all"
        >
          + Add Another Room
        </button>
      )}

      {/* Navigation */}
      <div className="flex gap-3 pt-2 pb-10">
        <button className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm opacity-50 cursor-not-allowed">
          ← Back
        </button>
        <button
          onClick={goNext}
          disabled={!canProceed}
          className={`flex-1 py-4 rounded-2xl text-white font-bold text-sm transition-all ${
            canProceed ? 'bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-200' : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default Step1RoomDetails;
