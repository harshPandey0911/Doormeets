import React, { useState } from 'react';

const VStep2RoomMeasurements = ({ quoteData, updateQuoteData, onNext, onBack }) => {
  const [rooms, setRooms] = useState(quoteData.rooms || []);
  const [activeRoom, setActiveRoom] = useState(0);

  const updateWall = (roomIdx, wallIdx, field, value) => {
    const updated = [...rooms];
    updated[roomIdx] = { ...updated[roomIdx], walls: [...updated[roomIdx].walls] };
    updated[roomIdx].walls[wallIdx] = { ...updated[roomIdx].walls[wallIdx], [field]: value };
    setRooms(updated);
  };

  const addWall = (roomIdx) => {
    const updated = [...rooms];
    const wallCount = updated[roomIdx].walls.length;
    updated[roomIdx] = {
      ...updated[roomIdx],
      walls: [...updated[roomIdx].walls, { name: `Wall ${wallCount + 1}`, length: '', height: '10', deductions: 0 }],
    };
    setRooms(updated);
  };

  const removeWall = (roomIdx, wallIdx) => {
    const updated = [...rooms];
    if (updated[roomIdx].walls.length > 1) {
      updated[roomIdx] = {
        ...updated[roomIdx],
        walls: updated[roomIdx].walls.filter((_, i) => i !== wallIdx),
      };
      setRooms(updated);
    }
  };

  const toggleCeiling = (roomIdx) => {
    const updated = [...rooms];
    updated[roomIdx] = { ...updated[roomIdx], ceilingIncluded: !updated[roomIdx].ceilingIncluded };
    setRooms(updated);
  };

  // Calculate area for a room
  const getRoomArea = (room) => {
    const wallArea = room.walls.reduce((acc, w) => {
      const l = parseFloat(w.length) || 0;
      const h = parseFloat(w.height) || 0;
      const d = parseFloat(w.deductions) || 0;
      return acc + (l * h) - d;
    }, 0);
    return Math.max(0, wallArea);
  };

  const totalArea = rooms.reduce((acc, r) => acc + getRoomArea(r), 0);

  const handleNext = () => {
    // Save measurements with calculated areas
    const measured = rooms.map(r => ({
      ...r,
      netArea: getRoomArea(r),
    }));
    updateQuoteData({ rooms: measured });
    onNext();
  };

  const currentRoom = rooms[activeRoom];

  return (
    <div className="space-y-5">
      {/* Room Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {rooms.map((room, idx) => (
          <button
            key={idx}
            onClick={() => setActiveRoom(idx)}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
              activeRoom === idx
                ? 'bg-orange-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {room.name}
          </button>
        ))}
      </div>

      {/* Active Room Measurements */}
      {currentRoom && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-lg">{currentRoom.name}</h3>
            <span className="text-xs bg-orange-100 text-orange-600 px-3 py-1 rounded-full font-bold">
              {getRoomArea(currentRoom).toFixed(0)} sq ft
            </span>
          </div>

          {/* Walls */}
          <div className="space-y-3">
            {currentRoom.walls.map((wall, wIdx) => (
              <div key={wIdx} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-700">{wall.name}</span>
                  {currentRoom.walls.length > 1 && (
                    <button
                      onClick={() => removeWall(activeRoom, wIdx)}
                      className="text-red-400 hover:text-red-600 text-xs font-bold"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-500 font-semibold mb-1 uppercase">Length (ft)</label>
                    <input
                      type="number"
                      value={wall.length}
                      onChange={e => updateWall(activeRoom, wIdx, 'length', e.target.value)}
                      placeholder="0"
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-orange-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 font-semibold mb-1 uppercase">Height (ft)</label>
                    <input
                      type="number"
                      value={wall.height}
                      onChange={e => updateWall(activeRoom, wIdx, 'height', e.target.value)}
                      placeholder="10"
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-orange-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 font-semibold mb-1 uppercase">Deduct (sqft)</label>
                    <input
                      type="number"
                      value={wall.deductions}
                      onChange={e => updateWall(activeRoom, wIdx, 'deductions', e.target.value)}
                      placeholder="0"
                      className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-orange-400"
                    />
                  </div>
                </div>
                <p className="text-right text-xs text-gray-400 mt-2">
                  Area: {Math.max(0, (parseFloat(wall.length) || 0) * (parseFloat(wall.height) || 0) - (parseFloat(wall.deductions) || 0)).toFixed(0)} sq ft
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={() => addWall(activeRoom)}
            className="w-full py-2.5 border-2 border-dashed border-orange-300 rounded-xl text-orange-500 font-bold text-sm hover:bg-orange-50 transition-colors"
          >
            + Add Wall
          </button>

          {/* Ceiling Toggle */}
          <div
            className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
              currentRoom.ceilingIncluded ? 'border-orange-400 bg-orange-50' : 'border-gray-200'
            }`}
            onClick={() => toggleCeiling(activeRoom)}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">⬆️</span>
              <div>
                <p className="font-bold text-sm text-gray-800">Include Ceiling</p>
                <p className="text-xs text-gray-500">Add ceiling painting for this room</p>
              </div>
            </div>
            <div className={`relative inline-flex w-12 h-6 rounded-full transition-all ${
              currentRoom.ceilingIncluded ? 'bg-orange-500' : 'bg-gray-200'
            }`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                currentRoom.ceilingIncluded ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </div>
          </div>
        </div>
      )}

      {/* Total Area Summary */}
      <div className="bg-gray-800 rounded-2xl p-5 text-white flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Total Paintable Area</p>
          <p className="text-2xl font-black mt-0.5">{totalArea.toFixed(0)} sq ft</p>
          <p className="text-xs opacity-60 mt-0.5">{rooms.length} room(s)</p>
        </div>
        <span className="text-3xl opacity-40">📐</span>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="px-6 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all"
        >
          ← Back
        </button>
        <button
          onClick={handleNext}
          className="flex-1 py-4 rounded-2xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all"
        >
          Next: Additional Services →
        </button>
      </div>
    </div>
  );
};

export default VStep2RoomMeasurements;
