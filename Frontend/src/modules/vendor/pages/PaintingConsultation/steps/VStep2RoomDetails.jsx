import React, { useState } from 'react';

const REPAIR_TYPES = [
  { id: 'paint_only',       label: 'Paint Only',       icon: '🎨', desc: 'Direct paint application' },
  { id: 'primer',           label: 'Primer + Paint',   icon: '🪣', desc: 'Primer base coat first' },
  { id: 'putty_primer',     label: 'Putty + Primer',   icon: '🧱', desc: 'Full surface preparation' },
];

export const ADDL_SERVICES_OPTIONS = [
  { id: 'waterproofing',    label: 'Waterproofing',    icon: '💧', rate: 15,  unit: 'sqft' },
  { id: 'pop_repair',       label: 'POP Repair',       icon: '🔨', rate: 22,  unit: 'sqft' },
  { id: 'wallpaper_removal',label: 'Wallpaper Removal',icon: '📜', rate: 500, unit: 'wall' },
  { id: 'texture_painting', label: 'Texture Painting', icon: '🖌️', rate: 800, unit: 'wall' },
  { id: 'deep_cleaning',    label: 'Deep Cleaning',    icon: '🧹', rate: 350, unit: 'room' },
  { id: 'putty_work',       label: 'Putty Work',       icon: '🧱', rate: 12,  unit: 'sqft' },
  { id: 'enamel_painting',  label: 'Enamel Painting',  icon: '✨', rate: 30,  unit: 'sqft' },
];

const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex w-12 h-6 rounded-full transition-all flex-shrink-0 ${checked ? 'bg-[#ff6600]' : 'bg-gray-200'}`}
  >
    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
  </button>
);

const Counter = ({ value, onChange, min = 0 }) => (
  <div className="flex items-center gap-3">
    <button
      onClick={() => onChange(Math.max(min, value - 1))}
      className="w-8 h-8 rounded-full border-2 border-orange-200 text-orange-600 flex items-center justify-center font-bold hover:border-orange-500 hover:text-white hover:bg-orange-500 transition-colors"
    >−</button>
    <span className="font-bold text-gray-800 w-6 text-center">{value}</span>
    <button
      onClick={() => onChange(value + 1)}
      className="w-8 h-8 rounded-full bg-[#a33e00] text-white flex items-center justify-center font-bold hover:bg-[#823100] transition-colors shadow-md shadow-[#a33e00]/20"
    >+</button>
  </div>
);

const calculateWallNetArea = (wall) => {
  const area = (parseFloat(wall.height) || 0) * (parseFloat(wall.width) || 0);
  
  const windowDeduct = (wall.windows || []).reduce((acc, w) => acc + ((parseFloat(w.width) || 0) * (parseFloat(w.height) || 0)), 0);
  const doorDeduct = (wall.doors || []).reduce((acc, d) => acc + ((parseFloat(d.width) || 0) * (parseFloat(d.height) || 0)), 0);
  const wardrobeDeduct = (wall.wardrobes || []).reduce((acc, w) => acc + ((parseFloat(w.width) || 0) * (parseFloat(w.height) || 0)), 0);
  
  return Math.max(0, area - windowDeduct - doorDeduct - wardrobeDeduct);
};

const DeductionList = ({ label, icon, items, onChange, hint }) => {
  const list = items || [];
  const addItem = () => onChange([...list, { width: '', height: '' }]);
  const removeItem = (idx) => onChange(list.filter((_, i) => i !== idx));
  const updateItem = (idx, field, val) => {
    const updated = [...list];
    updated[idx] = { ...updated[idx], [field]: val };
    onChange(updated);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl border border-gray-200">{icon}</div>
          <div>
            <p className="text-sm font-semibold text-gray-700">{label}</p>
            <p className="text-xs text-gray-400">{hint}</p>
          </div>
        </div>
        <button onClick={addItem} className="px-3 py-1 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 border border-orange-500 transition-colors shadow-sm">
          + Add
        </button>
      </div>
      {list.length > 0 && (
        <div className="space-y-2 mt-3 pt-3 border-t border-gray-100">
          {list.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input type="number" placeholder="W (ft)" value={item.width} onChange={e => updateItem(idx, 'width', e.target.value)} className="w-1/2 border border-gray-200 rounded px-2 py-1.5 text-xs font-semibold focus:outline-none focus:border-orange-400" />
              <span className="text-gray-400 text-xs">x</span>
              <input type="number" placeholder="H (ft)" value={item.height} onChange={e => updateItem(idx, 'height', e.target.value)} className="w-1/2 border border-gray-200 rounded px-2 py-1.5 text-xs font-semibold focus:outline-none focus:border-orange-400" />
              <button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 ml-1 text-lg leading-none p-1 rounded hover:bg-red-50">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const WallCard = ({ wall, wIdx, removeWall, updateWall }) => {
  const [expanded, setExpanded] = useState(!wall.saved);

  const netArea = calculateWallNetArea(wall);

  const toggleExpand = () => setExpanded(!expanded);
  const saveWall = () => {
    updateWall(wIdx, 'saved', true);
    setExpanded(false);
  };

  if (!expanded) {
    return (
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 flex items-center justify-between cursor-pointer hover:border-gray-300 transition-colors" onClick={toggleExpand}>
        <div>
          <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <span className="text-orange-500">📐</span> {wall.name}
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            {wall.width || 0}ft × {wall.height || 0}ft • {(wall.doors||[]).length+(wall.windows||[]).length+(wall.wardrobes||[]).length} Deductions
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-black text-gray-800">{netArea.toFixed(0)} sq ft</p>
          <p className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Saved</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-2xl border-2 border-orange-200 p-4 space-y-4 shadow-sm relative">
      <div className="flex items-center justify-between border-b border-gray-200 pb-3">
        <h4 className="font-bold text-gray-800 text-lg flex items-center gap-2">
          <span className="text-orange-500">📐</span> {wall.name}
        </h4>
        <div className="flex items-center gap-3">
          <button onClick={() => removeWall(wIdx)} className="text-red-400 text-xs font-bold hover:text-red-600">Remove</button>
          <button onClick={toggleExpand} className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300">
            ▲
          </button>
        </div>
      </div>

      {/* Dimensions */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-gray-500 font-semibold mb-1 uppercase">Length (ft)</label>
          <input
            type="number"
            value={wall.width}
            onChange={e => updateWall(wIdx, 'width', e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-orange-400 bg-white"
            placeholder="0.0"
          />
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 font-semibold mb-1 uppercase">Height (ft)</label>
          <input
            type="number"
            value={wall.height}
            onChange={e => updateWall(wIdx, 'height', e.target.value)}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-orange-400 bg-white"
            placeholder="10.0"
          />
        </div>
      </div>

      {/* Windows & Doors */}
      <div className="space-y-3 pt-2">
        <h4 className="font-bold text-gray-800 text-sm">Windows & Doors</h4>
        
        <DeductionList 
          label="Windows" 
          icon="🪟" 
          hint="Add custom dimensions" 
          items={wall.windows} 
          onChange={v => updateWall(wIdx, 'windows', v)} 
        />

        <DeductionList 
          label="Doors" 
          icon="🚪" 
          hint="Add custom dimensions" 
          items={wall.doors} 
          onChange={v => updateWall(wIdx, 'doors', v)} 
        />

        <DeductionList 
          label="Wardrobe / Fixed Furniture" 
          icon="🗄️" 
          hint="Add custom dimensions" 
          items={wall.wardrobes} 
          onChange={v => updateWall(wIdx, 'wardrobes', v)} 
        />
      </div>

      {/* Surface Conditions */}
      <div className="space-y-3 pt-2">
        <h4 className="font-bold text-gray-800 text-sm">Surface Conditions</h4>
        
        <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-sm space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div>
              <p className="text-sm font-semibold text-gray-700">Dampness Treatment</p>
              <p className="text-xs text-gray-400">Recommended for moisture protection</p>
            </div>
            <Toggle
              checked={wall.surfaceCondition?.dampness || false}
              onChange={v => updateWall(wIdx, 'surfaceCondition', { ...wall.surfaceCondition, dampness: v })}
            />
          </div>
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-sm font-semibold text-gray-700">Crack Filling</p>
              <p className="text-xs text-gray-400">Fix minor structural surface cracks</p>
            </div>
            <Toggle
              checked={wall.surfaceCondition?.crackFilling || false}
              onChange={v => updateWall(wIdx, 'surfaceCondition', { ...wall.surfaceCondition, crackFilling: v })}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-2">
        <button
          onClick={saveWall}
          className="w-full bg-[#a33e00] text-white py-3.5 rounded-xl font-bold shadow-md shadow-[#a33e00]/20 hover:bg-[#823100] transition-colors flex items-center justify-between px-6"
        >
          <span className="flex items-center gap-2"><span className="text-lg">💾</span> Save Wall Details</span>
          <span className="bg-black/20 px-3 py-1 rounded-full text-xs font-black">Current Wall: {netArea.toFixed(0)} sq ft</span>
        </button>
      </div>
    </div>
  );
};


const VStep2RoomDetails = ({ quoteData, updateQuoteData, onNext, onBack }) => {
  const [rooms, setRooms] = useState(quoteData.rooms || []);
  const [activeTab, setActiveTab] = useState(0);
  const [showAddlServices, setShowAddlServices] = useState(false);

  const selectedRooms = rooms.filter(r => r.selected);

  const updateRoom = (roomIdx, updates) => {
    const updated = [...rooms];
    const realIdx = rooms.indexOf(selectedRooms[roomIdx]);
    updated[realIdx] = { ...updated[realIdx], ...updates };
    setRooms(updated);
  };

  const updateWall = (roomIdx, wallIdx, field, val) => {
    const room = { ...selectedRooms[roomIdx] };
    const walls = [...room.walls];
    walls[wallIdx] = { ...walls[wallIdx], [field]: val };
    updateRoom(roomIdx, { walls });
  };

  const addWall = (roomIdx) => {
    const room = selectedRooms[roomIdx];
    const newWall = { name: `Wall ${room.walls.length + 1}`, height: '10', width: '', doors: [], windows: [], wardrobes: [], surfaceCondition: { dampness: false, crackFilling: false }, saved: false };
    updateRoom(roomIdx, { walls: [...room.walls, newWall] });
  };

  const removeWall = (roomIdx, wallIdx) => {
    const room = selectedRooms[roomIdx];
    updateRoom(roomIdx, { walls: room.walls.filter((_, i) => i !== wallIdx) });
  };

  const toggleAdditionalService = (roomIdx, svcId) => {
    const room = selectedRooms[roomIdx];
    const existing = room.additionalServices || [];
    const already = existing.find(s => s.id === svcId);
    let updated;
    if (already) {
      updated = existing.filter(s => s.id !== svcId);
    } else {
      const meta = ADDL_SERVICES_OPTIONS.find(s => s.id === svcId);
      updated = [...existing, { id: svcId, label: meta.label, enabled: true, quantity: 1, rate: meta.rate, unit: meta.unit }];
    }
    updateRoom(roomIdx, { additionalServices: updated });
  };

  const isServiceEnabled = (room, svcId) => (room.additionalServices || []).some(s => s.id === svcId);

  const handleNext = () => {
    updateQuoteData({ rooms });
    onNext();
  };

  if (selectedRooms.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No rooms selected. Go back and select rooms.</p>
        <button onClick={onBack} className="mt-4 text-orange-500 font-bold">← Back</button>
      </div>
    );
  }

  const room = selectedRooms[activeTab];

  // Calculate net paintable area for current room based on wall specifics
  let roomWallArea = 0;
  room.walls.forEach(w => {
    roomWallArea += calculateWallNetArea(w);
  });
  const ceilingArea = room.ceiling?.included ? (parseFloat(room.ceiling.length) || 0) * (parseFloat(room.ceiling.width) || 0) : 0;
  const netArea = roomWallArea + ceilingArea;

  return (
    <div className="space-y-5">
      {/* Room Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {selectedRooms.map((r, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all ${
              activeTab === idx ? 'bg-[#a33e00] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-2 border-gray-200'
            }`}
          >
            {r.name}
          </button>
        ))}
      </div>

      {/* Net Area Badge */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div>
          <p className="text-xs font-bold text-orange-700 uppercase tracking-widest mb-1">📐 Total Room Net Area</p>
          <p className="text-xs text-gray-500">Walls + Ceiling − Deductions</p>
        </div>
        <span className="text-2xl font-black text-orange-600 bg-white px-4 py-2 rounded-xl shadow-sm border border-orange-100">{netArea.toFixed(0)} sq ft</span>
      </div>

      {/* Walls List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1">
          <h4 className="font-bold text-gray-800 text-sm uppercase tracking-wider">Wall Specifications</h4>
        </div>
        {room.walls.map((wall, wIdx) => (
          <WallCard 
            key={wIdx} 
            wall={wall} 
            wIdx={wIdx} 
            removeWall={(idx) => removeWall(activeTab, idx)} 
            updateWall={(idx, field, val) => updateWall(activeTab, idx, field, val)} 
          />
        ))}
        <button onClick={() => addWall(activeTab)} className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 font-bold text-sm hover:border-orange-500 hover:text-white hover:bg-orange-500 transition-colors">
          + Add Another Wall
        </button>
      </div>

      {/* Ceiling */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-gray-800 flex items-center gap-2"><span className="text-xl">⬆️</span> Ceiling Options</h4>
          <Toggle checked={room.ceiling?.included || false} onChange={v => updateRoom(activeTab, { ceiling: { ...room.ceiling, included: v } })} />
        </div>
        {room.ceiling?.included && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-[10px] text-gray-500 font-semibold mb-1 uppercase">Length (ft)</label>
              <input type="number" value={room.ceiling.length || ''} onChange={e => updateRoom(activeTab, { ceiling: { ...room.ceiling, length: e.target.value } })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-orange-400" placeholder="0.0" />
            </div>
            <div>
              <label className="block text-[10px] text-gray-500 font-semibold mb-1 uppercase">Width (ft)</label>
              <input type="number" value={room.ceiling.width || ''} onChange={e => updateRoom(activeTab, { ceiling: { ...room.ceiling, width: e.target.value } })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-orange-400" placeholder="0.0" />
            </div>
          </div>
        )}
      </div>

      {/* Repair Type */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-5 space-y-4 shadow-sm">
        <h4 className="font-bold text-gray-800 flex items-center gap-2"><span className="text-xl">🛠️</span> Select Repair Type</h4>
        <div className="space-y-3">
          {REPAIR_TYPES.map(rt => (
            <div
              key={rt.id}
              onClick={() => updateRoom(activeTab, { repairType: rt.id })}
              className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                room.repairType === rt.id ? 'border-orange-400 bg-orange-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-2xl">{rt.icon}</span>
              <div className="flex-1">
                <p className={`font-bold text-sm ${room.repairType === rt.id ? 'text-white' : 'text-gray-800'}`}>{rt.label}</p>
                <p className={`text-xs ${room.repairType === rt.id ? 'text-white/80' : 'text-gray-500'}`}>{rt.desc}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                room.repairType === rt.id ? 'bg-[#ff6600] border-[#ff6600]' : 'border-gray-300'
              }`}>
                {room.repairType === rt.id && <span className="text-white text-[10px]">✓</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Services per Room */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm">
        <button 
          onClick={() => setShowAddlServices(!showAddlServices)}
          className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🔧</span>
            <h4 className="font-bold text-gray-800">Additional Room Services</h4>
          </div>
          <span className={`text-gray-400 font-bold transition-transform ${showAddlServices ? 'rotate-180' : ''}`}>▼</span>
        </button>
        
        {showAddlServices && (
          <div className="px-5 pb-5 space-y-3 border-t-2 border-gray-100 pt-4">
            {ADDL_SERVICES_OPTIONS.map(svc => {
              const enabled = isServiceEnabled(room, svc.id);
              return (
                <div
                  key={svc.id}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    enabled ? 'border-orange-300 bg-orange-50 shadow-sm' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{svc.icon}</span>
                    <div>
                      <p className={`font-semibold text-sm ${enabled ? 'text-white' : 'text-gray-700'}`}>{svc.label}</p>
                      <p className={`text-xs ${enabled ? 'text-white/80' : 'text-gray-400'}`}>₹{svc.rate}/{svc.unit}</p>
                    </div>
                  </div>
                  <Toggle checked={enabled} onChange={() => toggleAdditionalService(activeTab, svc.id)} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-4 border-t border-gray-100">
        <button onClick={onBack} className="px-6 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all">
          ← Back
        </button>
        <button onClick={handleNext} className="flex-1 py-4 rounded-2xl bg-[#a33e00] text-white font-bold text-sm hover:bg-[#823100] shadow-lg shadow-[#a33e00]/20 transition-all">
          Next: Utilities Selection →
        </button>
      </div>
    </div>
  );
};

export default VStep2RoomDetails;
