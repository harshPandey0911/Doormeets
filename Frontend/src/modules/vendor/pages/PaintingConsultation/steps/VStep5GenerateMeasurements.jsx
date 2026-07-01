import React, { useMemo } from 'react';

// Default fallback values if admin hasn't set them yet
const DEFAULT_PAINT_RATE = 10;
const DEFAULT_LABOUR_RATE = 8;
const DEFAULT_PRIMER_RATE = 4;
const DEFAULT_PUTTY_RATE = 5;
const PAINT_COVERAGE        = 12;  // sqft per litre
const PRIMER_COVERAGE       = 14;
const PUTTY_COVERAGE_KG     = 3;   // sqft per kg

const VStep5GenerateMeasurements = ({ quoteData, updateQuoteData, onNext, onBack, paintingRates }) => {
  const rooms = (quoteData.rooms || []).filter(r => r.selected);
  const globalServices = (quoteData.globalServices || []).filter(s => s.enabled);

  const wallBaseRate = paintingRates?.wallBaseRate ?? DEFAULT_PAINT_RATE;
  const labourRate = DEFAULT_LABOUR_RATE; 
  const primerRate = paintingRates?.additionalServices?.enamel_painting?.rate ?? DEFAULT_PRIMER_RATE;
  const puttyRate = paintingRates?.additionalServices?.putty_work?.rate ?? DEFAULT_PUTTY_RATE;

  const roomBreakdown = useMemo(() => rooms.map(room => {
    let wallArea = 0;
    let deductions = 0;
    
    (room.walls || []).forEach(w => {
      wallArea += (parseFloat(w.height) || 0) * (parseFloat(w.width) || 0);
      
      // Calculate custom doors and windows area deductions using size rates
      const windowArea = (w.windows || []).reduce((acc, win) => {
        const wSqft = (parseFloat(win.width) || 0) * (parseFloat(win.height) || 0);
        let customPrice = (paintingRates?.utilities?.windows?.enamelRate ?? 100) * wSqft;
        return acc + wSqft;
      }, 0);

      const doorArea = (w.doors || []).reduce((acc, door) => {
        const dSqft = (parseFloat(door.width) || 0) * (parseFloat(door.height) || 0);
        let customPrice = (paintingRates?.utilities?.doors?.enamelRate ?? 120) * dSqft;
        return acc + dSqft;
      }, 0);

      const wardrobeArea = (w.wardrobes || []).reduce((acc, ward) => acc + ((parseFloat(ward.width) || 0) * (parseFloat(ward.height) || 0)), 0);
      
      deductions += windowArea + doorArea + wardrobeArea;
    });

    const ceilingArea = room.ceiling?.included
      ? (parseFloat(room.ceiling.length) || 0) * (parseFloat(room.ceiling.width) || 0)
      : 0;
      
    const netArea = Math.max(0, wallArea + ceilingArea - deductions);

    // Apply dynamic sqft base area rate multiplier if configured
    let dynamicMultiplier = 1.0;
    if (paintingRates?.sqftRanges?.length > 0) {
      const match = paintingRates.sqftRanges.find(r => netArea >= r.minSqft && netArea <= r.maxSqft);
      if (match) {
        dynamicMultiplier = match.rateMultiplier;
      }
    }

    const repairType = room.repairType || 'paint_only';
    const hasPrimer = ['primer', 'putty_primer'].includes(repairType);
    const hasPutty  = repairType === 'putty_primer';

    const paintCost   = netArea * wallBaseRate * dynamicMultiplier;
    const labourCost  = netArea * labourRate * dynamicMultiplier;
    const primerCost  = hasPrimer ? netArea * primerRate * dynamicMultiplier : 0;
    const puttyCost   = hasPutty  ? netArea * puttyRate * dynamicMultiplier : 0;
    const addlServicesCost = (room.additionalServices || []).reduce((acc, s) => acc + (s.rate || 0) * (s.quantity || 1), 0);

    return {
      name: room.name,
      netArea,
      paintCost,
      labourCost,
      primerCost,
      puttyCost,
      addlServicesCost,
      subtotal: paintCost + labourCost + primerCost + puttyCost + addlServicesCost,
      paintLitres:   (netArea / PAINT_COVERAGE).toFixed(1),
      primerLitres:  hasPrimer ? (netArea / PRIMER_COVERAGE).toFixed(1) : '—',
      puttyKg:       hasPutty  ? (netArea / PUTTY_COVERAGE_KG).toFixed(1) : '—',
    };
  }), [rooms, paintingRates]);

  const totalArea       = roomBreakdown.reduce((acc, r) => acc + r.netArea, 0);
  const totalPaint      = roomBreakdown.reduce((acc, r) => acc + r.paintCost, 0);
  const totalLabour     = roomBreakdown.reduce((acc, r) => acc + r.labourCost, 0);
  const totalPrimer     = roomBreakdown.reduce((acc, r) => acc + r.primerCost, 0);
  const totalPutty      = roomBreakdown.reduce((acc, r) => acc + r.puttyCost, 0);
  const totalRoomAddl   = roomBreakdown.reduce((acc, r) => acc + r.addlServicesCost, 0);

  const utilitiesCost = (quoteData.utilities || []).filter(u => u.selected).reduce((acc, u) => {
    const adminUtilRates = paintingRates?.utilities?.[u.id];
    const enamelRate = adminUtilRates?.enamelRate ?? 120;
    const addlRate = adminUtilRates?.addlRate ?? 80;
    let totalSqft = 0;
    rooms.forEach(r => {
      (r.walls || []).forEach(w => {
        if (u.id === 'doors' && w.doors) {
          w.doors.forEach(d => {
            totalSqft += (parseFloat(d.width) || 0) * (parseFloat(d.height) || 0);
          });
        } else if (u.id === 'windows' && w.windows) {
          w.windows.forEach(win => {
            totalSqft += (parseFloat(win.width) || 0) * (parseFloat(win.height) || 0);
          });
        }
      });
    });
    if (totalSqft === 0) {
      const defaultSqftMap = { doors: 21, windows: 12, grills: 15, panels: 10 };
      totalSqft = defaultSqftMap[u.id] || 10;
    }
    const enamelCost = u.enamel ? (enamelRate * totalSqft) : 0;
    const addlCost = u.additionalService ? (addlRate * totalSqft) : 0;
    return acc + enamelCost + addlCost;
  }, 0);

  const totalGlobalAddl = globalServices.reduce((acc, s) => acc + (s.totalCost || 0), 0) + utilitiesCost;
  const interiorEstimate = totalPaint + totalLabour + totalPrimer + totalPutty + totalRoomAddl + totalGlobalAddl;

  const totalPaintLitres  = (totalArea / PAINT_COVERAGE).toFixed(1);
  const totalPrimerLitres = (totalArea / PRIMER_COVERAGE).toFixed(1);
  const totalPuttyKg      = (totalArea / PUTTY_COVERAGE_KG).toFixed(1);

  const handleNext = () => {
    updateQuoteData({
      measurements: {
        totalArea,
        totalPaint,
        totalLabour,
        totalPrimer,
        totalPutty,
        totalGlobalAddl,
        interiorEstimate,
        roomBreakdown,
      },
    });
    onNext();
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Step 5 — Measurements</p>
        <h3 className="text-xl font-bold text-gray-800">Generate Measurements</h3>
        <p className="text-sm text-gray-500 mt-1">Auto-calculated from your inputs. Review before selecting paint.</p>
      </div>

      {/* Interior Estimate Hero */}
      <div className="relative bg-gradient-to-br from-[#a33e00] to-[#823100] rounded-2xl p-5 text-white overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full -ml-6 -mb-6" />
        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-wider opacity-80">Interior Estimate</p>
          <p className="text-3xl font-black mt-1">₹{interiorEstimate.toLocaleString()}</p>
          <div className="flex gap-4 mt-3">
            <div>
              <p className="text-xs opacity-70">Total Area</p>
              <p className="font-bold">{totalArea.toFixed(0)} sq ft</p>
            </div>
            <div>
              <p className="text-xs opacity-70">Rooms</p>
              <p className="font-bold">{rooms.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Room Breakdown */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h4 className="font-bold text-gray-700 text-sm">Room Breakdown</h4>
        </div>
        <div className="divide-y divide-gray-100">
          {roomBreakdown.map((rb, idx) => (
            <div key={idx} className="px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-gray-800 text-sm">{rb.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{rb.netArea.toFixed(0)} sq ft</p>
                </div>
                <p className="font-bold text-[#a33e00] text-sm">₹{rb.subtotal.toLocaleString()}</p>
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                <span className="text-[10px] bg-orange-50 text-orange-700 px-2.5 py-1 rounded-md font-semibold border border-orange-100">
                  Paint ₹{rb.paintCost.toFixed(0)}
                </span>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md font-semibold border border-gray-200">
                  Labour ₹{rb.labourCost.toFixed(0)}
                </span>
                {rb.primerCost > 0 && (
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-md font-semibold border border-blue-100">
                    Primer ₹{rb.primerCost.toFixed(0)}
                  </span>
                )}
                {rb.puttyCost > 0 && (
                  <span className="text-[10px] bg-purple-50 text-purple-600 px-2.5 py-1 rounded-md font-semibold border border-purple-100">
                    Putty ₹{rb.puttyCost.toFixed(0)}
                  </span>
                )}
                {rb.addlServicesCost > 0 && (
                  <span className="text-[10px] bg-green-50 text-green-600 px-2.5 py-1 rounded-md font-semibold border border-green-100">
                    Services ₹{rb.addlServicesCost.toFixed(0)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Subtotals */}
        <div className="px-5 py-4 bg-gray-50 border-t-2 border-gray-200 space-y-2">
          {[
            { label: '🎨 Paint', value: totalPaint },
            { label: '👷 Labour', value: totalLabour },
            totalPrimer > 0 ? { label: '🪣 Primer', value: totalPrimer } : null,
            totalPutty > 0 ? { label: '🧱 Putty', value: totalPutty } : null,
            totalRoomAddl > 0 ? { label: '🔧 Room Services', value: totalRoomAddl } : null,
            totalGlobalAddl > 0 ? { label: '🌐 Global Services', value: totalGlobalAddl } : null,
          ].filter(Boolean).map((row, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-gray-600 font-semibold">{row.label}</span>
              <span className="font-bold text-gray-800">₹{row.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Material Logistics */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-5 shadow-sm">
        <h4 className="font-bold text-gray-700 text-sm mb-3">📦 Material Logistics</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gradient-to-b from-orange-50 to-white rounded-xl p-3 text-center border border-orange-100 shadow-sm">
            <p className="text-xs font-bold text-orange-600 mb-1 uppercase tracking-wider">Paint</p>
            <p className="font-black text-gray-800 text-xl">{totalPaintLitres}</p>
            <p className="text-[10px] font-bold text-gray-400">LITRES</p>
          </div>
          <div className="bg-gradient-to-b from-blue-50 to-white rounded-xl p-3 text-center border border-blue-100 shadow-sm">
            <p className="text-xs font-bold text-blue-600 mb-1 uppercase tracking-wider">Primer</p>
            <p className="font-black text-gray-800 text-xl">{totalPrimerLitres}</p>
            <p className="text-[10px] font-bold text-gray-400">LITRES</p>
          </div>
          <div className="bg-gradient-to-b from-purple-50 to-white rounded-xl p-3 text-center border border-purple-100 shadow-sm">
            <p className="text-xs font-bold text-purple-600 mb-1 uppercase tracking-wider">Putty</p>
            <p className="font-black text-gray-800 text-xl">{totalPuttyKg}</p>
            <p className="text-[10px] font-bold text-gray-400">KG</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} className="px-6 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all">← Back</button>
        <button onClick={handleNext} className="flex-1 py-4 rounded-2xl bg-[#a33e00] text-white font-bold text-sm hover:bg-[#823100] shadow-lg shadow-[#a33e00]/20 transition-all">
          Next: Select Paint Package →
        </button>
      </div>
    </div>
  );
};

export default VStep5GenerateMeasurements;
