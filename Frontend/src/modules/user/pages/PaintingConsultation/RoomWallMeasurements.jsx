import React, { useState } from 'react';

const DEFAULT_SUBTRACTIONS = {
  WINDOW: { label: 'Standard Window', icon: '🪟', defaultLength: 3, defaultWidth: 4 },
  DOOR: { label: 'Standard Door', icon: '🚪', defaultLength: 3, defaultWidth: 7 },
};

const RoomWallMeasurements = ({ room, onUpdateRoom, onBack, onSave }) => {
  const roomName = room?.name || 'Living Room';
  const walls = room?.walls || [
    { wallName: 'Wall 1', length: '', height: '', windows: 1, doors: 0, conditions: { dampness: false, crackFilling: false }, netArea: 0 },
    { wallName: 'Wall 2', length: '', height: '', windows: 0, doors: 1, conditions: { dampness: false, crackFilling: false }, netArea: 0 },
    { wallName: 'Wall 3', length: '', height: '', windows: 1, doors: 0, conditions: { dampness: false, crackFilling: false }, netArea: 0 },
    { wallName: 'Wall 4', length: '', height: '', windows: 0, doors: 0, conditions: { dampness: false, crackFilling: false }, netArea: 0 },
  ];

  const [activeWallIdx, setActiveWallIdx] = useState(0);
  const wall = walls[activeWallIdx] || walls[0];

  const calculateNetArea = (w) => {
    const l = parseFloat(w.length) || 0;
    const h = parseFloat(w.height) || 0;
    const grossArea = l * h;
    const windowArea = (w.windows || 0) * DEFAULT_SUBTRACTIONS.WINDOW.defaultLength * DEFAULT_SUBTRACTIONS.WINDOW.defaultWidth;
    const doorArea = (w.doors || 0) * DEFAULT_SUBTRACTIONS.DOOR.defaultLength * DEFAULT_SUBTRACTIONS.DOOR.defaultWidth;
    return Math.max(0, grossArea - windowArea - doorArea);
  };

  const updateWall = (updates) => {
    const updatedWalls = [...walls];
    updatedWalls[activeWallIdx] = { ...updatedWalls[activeWallIdx], ...updates };
    updatedWalls[activeWallIdx].netArea = calculateNetArea(updatedWalls[activeWallIdx]);
    if (onUpdateRoom) onUpdateRoom({ walls: updatedWalls });
  };

  const addWall = () => {
    const newWall = {
      wallName: `Wall ${walls.length + 1}`,
      length: '', height: '',
      windows: 0, doors: 0,
      conditions: { dampness: false, crackFilling: false },
      netArea: 0
    };
    if (onUpdateRoom) onUpdateRoom({ walls: [...walls, newWall] });
    setActiveWallIdx(walls.length);
  };

  const totalNetArea = walls.reduce((acc, w) => acc + calculateNetArea(w), 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white sticky top-0 z-40 border-b border-gray-200 h-16 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <span className="text-orange-500 text-lg">←</span>
            </button>
          )}
          <h1 className="font-bold text-orange-600 text-lg">{roomName}</h1>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <span className="text-gray-500">🖌️</span>
        </button>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-5">
        {/* Wall Selection */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">Select Wall</h2>
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {walls.map((w, idx) => (
              <button
                key={idx}
                onClick={() => setActiveWallIdx(idx)}
                className={`flex-shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeWallIdx === idx
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {w.wallName}
              </button>
            ))}
            <button
              onClick={addWall}
              className="flex-shrink-0 w-12 h-12 border-2 border-dashed border-orange-300 rounded-xl text-orange-500 flex items-center justify-center hover:bg-orange-50 transition-colors"
            >
              +
            </button>
          </div>
        </div>

        {/* Wall Dimensions Card */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-orange-500 text-lg">📐</span>
            <h3 className="font-bold text-gray-800">Wall Dimensions</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 px-1">Length (ft)</label>
              <input
                type="number"
                value={wall.length}
                onChange={e => updateWall({ length: e.target.value })}
                placeholder="12.0"
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-semibold focus:outline-none focus:border-orange-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1 px-1">Height (ft)</label>
              <input
                type="number"
                value={wall.height}
                onChange={e => updateWall({ height: e.target.value })}
                placeholder="10.0"
                className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 font-semibold focus:outline-none focus:border-orange-400 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Windows & Doors */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3">Windows & Doors</h3>
          <div className="space-y-3">
            {/* Window Counter */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-xl">🪟</div>
                <div>
                  <p className="font-bold text-gray-800">Standard Window</p>
                  <p className="text-xs text-gray-500">3ft x 4ft (12 sq ft)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateWall({ windows: Math.max(0, (wall.windows || 0) - 1) })}
                  className="w-10 h-10 rounded-full border-2 border-orange-400 text-orange-500 flex items-center justify-center font-bold hover:bg-orange-500 hover:text-white transition-all"
                >
                  −
                </button>
                <span className="text-lg font-black text-gray-900 w-6 text-center">{wall.windows || 0}</span>
                <button
                  onClick={() => updateWall({ windows: (wall.windows || 0) + 1 })}
                  className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-200"
                >
                  +
                </button>
              </div>
            </div>

            {/* Door Counter */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-xl">🚪</div>
                <div>
                  <p className="font-bold text-gray-800">Standard Door</p>
                  <p className="text-xs text-gray-500">3ft x 7ft (21 sq ft)</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateWall({ doors: Math.max(0, (wall.doors || 0) - 1) })}
                  className="w-10 h-10 rounded-full border-2 border-orange-400 text-orange-500 flex items-center justify-center font-bold hover:bg-orange-500 hover:text-white transition-all"
                >
                  −
                </button>
                <span className="text-lg font-black text-gray-900 w-6 text-center">{wall.doors || 0}</span>
                <button
                  onClick={() => updateWall({ doors: (wall.doors || 0) + 1 })}
                  className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-200"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Surface Conditions */}
        <div>
          <h3 className="font-bold text-gray-900 mb-3">Surface Conditions</h3>
          <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
            {/* Dampness Treatment */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <p className="font-semibold text-sm text-gray-800">Dampness Treatment</p>
                <p className="text-xs text-gray-400">Recommended for moisture protection</p>
              </div>
              <button
                onClick={() => updateWall({ conditions: { ...wall.conditions, dampness: !wall.conditions?.dampness } })}
                className={`relative inline-flex w-12 h-6 rounded-full transition-all ${
                  wall.conditions?.dampness ? 'bg-orange-500' : 'bg-gray-200'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                  wall.conditions?.dampness ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Crack Filling */}
            <div className="flex items-center justify-between p-4">
              <div>
                <p className="font-semibold text-sm text-gray-800">Crack Filling</p>
                <p className="text-xs text-gray-400">Fix minor structural surface cracks</p>
              </div>
              <button
                onClick={() => updateWall({ conditions: { ...wall.conditions, crackFilling: !wall.conditions?.crackFilling } })}
                className={`relative inline-flex w-12 h-6 rounded-full transition-all ${
                  wall.conditions?.crackFilling ? 'bg-orange-500' : 'bg-gray-200'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                  wall.conditions?.crackFilling ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Save Wall Details Button */}
        <button
          onClick={onSave}
          className="w-full py-4 bg-orange-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all active:scale-[0.98]"
        >
          💾 Save Wall Details
        </button>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 px-4 py-4 grid grid-cols-2 gap-3 z-50">
        <button
          onClick={onBack}
          className="py-3 border-2 border-orange-400 text-orange-500 font-bold rounded-xl flex items-center justify-center gap-1 hover:bg-orange-50 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onSave}
          className="py-3 bg-orange-500 text-white font-bold rounded-xl flex items-center justify-center gap-1 hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all"
        >
          Next Room →
        </button>
      </nav>

      {/* Floating Net Area Bubble */}
      {wall.length && wall.height && (
        <div className="fixed bottom-24 right-4 z-30">
          <div className="bg-gray-800 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-xl animate-bounce">
            <span className="text-orange-300">🖌️</span>
            <span className="text-xs font-bold">Current Wall: {calculateNetArea(wall).toFixed(0)} sq ft</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomWallMeasurements;
