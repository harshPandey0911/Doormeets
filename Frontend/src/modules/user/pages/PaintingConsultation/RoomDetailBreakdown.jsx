import React, { useState } from 'react';

const SAMPLE_BREAKDOWN = {
  CEILING: [
    { product: 'Tractor Emulsion Matte', cost: 1512 },
  ],
  WALLS: [
    { product: 'Apcolyte Premium Emulsion', cost: 6360 },
  ],
  ADD_ONS: [
    { product: 'Tile Grouting', cost: 900 },
    { product: 'Brick Waterproofing', cost: 800 },
  ],
  OTHERS: [
    { product: 'Doors (Low Traffic)', cost: 294 },
  ],
};

const CATEGORY_META = {
  CEILING: { icon: '🖨', label: 'Ceiling', color: 'bg-blue-100 text-blue-700' },
  WALLS: { icon: '🧱', label: 'Walls', color: 'bg-orange-100 text-orange-700' },
  ADD_ONS: { icon: '🔧', label: 'Add-ons', color: 'bg-purple-100 text-purple-700' },
  OTHERS: { icon: '🚪', label: 'Others', color: 'bg-gray-100 text-gray-700' },
};

const RoomDetailBreakdown = ({ room, onDone, onBack }) => {
  const [expandedCategory, setExpandedCategory] = useState('WALLS');

  const roomName = room?.name || 'Living Room';
  const breakdown = room?.breakdown || SAMPLE_BREAKDOWN;

  // Group items by category
  const categories = Object.keys(CATEGORY_META);
  const roomTotal = categories.reduce((acc, cat) => {
    const items = breakdown[cat] || [];
    return acc + items.reduce((sum, item) => sum + (item.cost || 0), 0);
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-200 flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
        )}
        <h2 className="text-xl font-bold text-gray-900">Room Detail Breakdown</h2>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-5">
        {/* Room Title */}
        <div>
          <h3 className="text-2xl font-black text-gray-900">{roomName} Breakdown</h3>
          <p className="text-sm text-gray-500 mt-1">Cost breakdown by category for this room.</p>
        </div>

        {/* Category Accordion Items */}
        <div className="space-y-3">
          {categories.map(cat => {
            const meta = CATEGORY_META[cat];
            const items = breakdown[cat] || [];
            const catTotal = items.reduce((sum, item) => sum + (item.cost || 0), 0);
            const isOpen = expandedCategory === cat;

            if (items.length === 0) return null;

            return (
              <div key={cat} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => setExpandedCategory(isOpen ? null : cat)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${meta.color}`}>
                      {meta.icon}
                    </span>
                    <div className="text-left">
                      <p className="font-bold text-sm text-gray-800">{meta.label}</p>
                      <p className="text-xs text-gray-400">{items.length} item(s)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-orange-600">₹{catTotal.toLocaleString()}</span>
                    <span className="text-gray-400 text-sm">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </button>

                {/* Expanded Items */}
                {isOpen && (
                  <div className="border-t border-gray-100 px-4 pb-3">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-400" />
                          <p className="text-sm text-gray-700">{item.product}</p>
                        </div>
                        <p className="font-semibold text-sm text-gray-800">₹{item.cost.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Room Total */}
        <div className="bg-gray-800 rounded-2xl p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-80">TOTAL FOR THIS ROOM</p>
          <p className="text-3xl font-black mt-1">₹{roomTotal.toLocaleString()}</p>
        </div>

        {/* Done Button */}
        {onDone && (
          <button
            onClick={onDone}
            className="w-full py-4 rounded-2xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
};

export default RoomDetailBreakdown;
