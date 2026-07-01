import React, { useState } from 'react';

const ProjectOverview = ({ wizardData, onEditRoom, onAddRoom, onBack }) => {
  const rooms = wizardData?.rooms || [];
  const totalArea = rooms.reduce((acc, r) => acc + (r.netArea || (parseFloat(r.length) || 0) * (parseFloat(r.width) || 0) || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-200 flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-lg">←</button>
        )}
        <h2 className="text-xl font-bold text-gray-900">Project Overview</h2>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-5">
        {/* Title */}
        <div>
          <h3 className="text-2xl font-black text-gray-900">Your Rooms</h3>
          <p className="text-sm text-gray-500 mt-1">Manage and edit rooms in your project.</p>
        </div>

        {/* Room Cards */}
        {rooms.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center">
            <span className="text-4xl mb-3 block">🏠</span>
            <p className="text-gray-500 font-semibold">No rooms added yet.</p>
            <p className="text-xs text-gray-400 mt-1">Start by adding your first room.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room, idx) => {
              const sqft = room.netArea || (parseFloat(room.length) || 0) * (parseFloat(room.width) || 0) || 0;
              const repairLabel = room.repairType === 'PRIMER' ? 'Primer + 2 Coats' 
                : room.repairType === 'PUTTY' ? 'Putty + 2 Coats' : 'Retouch Only';

              return (
                <div key={idx} className="bg-white rounded-2xl border-2 border-gray-200 p-4 flex items-center justify-between hover:border-orange-300 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-xl">
                      {room.name === 'Living Room' ? '🛋️' : room.name === 'Kitchen' ? '🍳' : room.name === 'Bathroom' ? '🚿' : '🛏️'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{room.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm text-gray-600">{sqft.toFixed(0)} sq ft</span>
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">{repairLabel}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onEditRoom && onEditRoom(idx)}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-orange-100 hover:text-orange-500 transition-all"
                  >
                    ✏️
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add Another Room */}
        <button
          onClick={onAddRoom}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-orange-300 text-orange-500 font-bold text-sm hover:bg-orange-50 transition-all flex items-center justify-center gap-2"
        >
          <span className="text-lg">+</span> Add Another Room
        </button>

        {/* Total Estimated Area */}
        {rooms.length > 0 && (
          <div className="bg-gray-800 rounded-2xl p-5 text-white flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider opacity-80">Total Estimated Area</p>
              <p className="text-3xl font-black mt-1">{totalArea.toFixed(0)} sq ft</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-70">{rooms.length} Room(s)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectOverview;
