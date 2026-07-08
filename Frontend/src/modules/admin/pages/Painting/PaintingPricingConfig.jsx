import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiSave, FiRefreshCw, FiDroplet, FiTool, FiFileText, FiEdit3, FiWind, FiGrid, FiStar, FiLayout, FiLayers } from 'react-icons/fi';
import api from '../../../../services/api';

const UTILITY_META = [
  { key: 'doors',   label: 'Doors',   icon: FiLayout, desc: 'Standard doors & entry doors' },
  { key: 'grills',  label: 'Grills',  icon: FiGrid,   desc: 'Window grills & safety grills' },
  { key: 'windows', label: 'Windows', icon: FiWind,   desc: 'Window frames & panels' },
  { key: 'panels',  label: 'Panels',  icon: FiLayers, desc: 'Decorative panels & boards' },
];

const ADDL_SERVICES_META = [
  { key: 'waterproofing',    label: 'Waterproofing',    icon: FiDroplet,  unit: 'sqft' },
  { key: 'pop_repair',       label: 'POP Repair',       icon: FiTool,     unit: 'sqft' },
  { key: 'wallpaper_removal',label: 'Wallpaper Removal',icon: FiFileText, unit: 'wall' },
  { key: 'texture_painting', label: 'Texture Painting', icon: FiEdit3,    unit: 'wall' },
  { key: 'deep_cleaning',    label: 'Deep Cleaning',    icon: FiWind,     unit: 'room' },
  { key: 'putty_work',       label: 'Putty Work',       icon: FiLayers,   unit: 'sqft' },
  { key: 'enamel_painting',  label: 'Enamel Painting',  icon: FiStar,     unit: 'sqft' },
];
const DEFAULT_UTILITIES = {
  doors:   { enamelRate: 120, addlRate: 80 },
  grills:  { enamelRate: 90,  addlRate: 60 },
  windows: { enamelRate: 100, addlRate: 70 },
  panels:  { enamelRate: 150, addlRate: 100 },
};

const DEFAULT_ADDL_SERVICES = {
  waterproofing:    { rate: 15 },
  pop_repair:       { rate: 22 },
  wallpaper_removal:{ rate: 500 },
  texture_painting: { rate: 800 },
  deep_cleaning:    { rate: 350 },
  putty_work:       { rate: 12 },
  enamel_painting:  { rate: 30 },
};

const PaintingPricingConfig = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [utilities, setUtilities] = useState(DEFAULT_UTILITIES);
  const [addlServices, setAddlServices] = useState(DEFAULT_ADDL_SERVICES);
  
  // Custom sqft, door, and window size pricing ranges
  const [sqftRanges, setSqftRanges] = useState([]);
  const [doorSizeRates, setDoorSizeRates] = useState([]);
  const [windowSizeRates, setWindowSizeRates] = useState([]);
  const [propertyLayouts, setPropertyLayouts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [wallBaseRate, setWallBaseRate] = useState(10);
  
  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/public/config');
      if (res.data?.success && res.data.settings) {
        const pr = res.data.settings.paintingRates || {};
        if (pr.utilities) {
          setUtilities(prev => ({
            ...prev,
            ...Object.fromEntries(
              Object.entries(pr.utilities).map(([k, v]) => [k, { ...prev[k], ...v }])
            )
          }));
        }
        if (pr.additionalServices) {
          setAddlServices(prev => ({
            ...prev,
            ...Object.fromEntries(
              Object.entries(pr.additionalServices).map(([k, v]) => [k, { ...prev[k], ...v }])
            )
          }));
        }
        setSqftRanges(pr.sqftRanges || []);
        setDoorSizeRates(pr.doorSizeRates || []);
        setWindowSizeRates(pr.windowSizeRates || []);
        setBrands(pr.brands || [
          { name: 'Asian Paints', standardRate: 12, premiumRate: 18, luxuryRate: 25 },
          { name: 'Dulux', standardRate: 11, premiumRate: 17, luxuryRate: 24 },
          { name: 'Berger', standardRate: 11, premiumRate: 16, luxuryRate: 23 }
        ]);
        setWallBaseRate(pr.wallBaseRate ?? 10);
        setPropertyLayouts(res.data.settings.propertyLayouts || []);
      }
    } catch (err) {
      console.error('Failed to fetch painting rates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/admin/settings', {
        paintingRates: {
          utilities,
          additionalServices: addlServices,
          sqftRanges,
          doorSizeRates,
          windowSizeRates,
          brands,
          wallBaseRate
        },
        propertyLayouts
      });
      toast.success('Painting pricing saved successfully!');
    } catch (err) {
      console.error('Failed to save painting rates:', err);
      toast.error('Failed to save pricing config');
    } finally {
      setSaving(false);
    }
  };

  const updateUtility = (key, field, value) => {
    setUtilities(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: Number(value) || 0 }
    }));
  };

  const updateService = (key, value) => {
    setAddlServices(prev => ({
      ...prev,
      [key]: { rate: Number(value) || 0 }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Quotation Pricing Config</h2>
          <p className="text-sm text-gray-500 mt-1">Manage all painting quotation rates from here. These rates are used by vendors when generating quotes.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchRates}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl text-sm font-semibold transition-colors cursor-pointer"
          >
            <FiRefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            <FiSave className="w-4 h-4" /> {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      {/* Wall Base Setup */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/>
            </svg>
            Wall Painting Base Setup
          </h3>
          <p className="text-xs text-gray-500 mt-1">Configure base painting rate per square foot (sqft).</p>
        </div>
        <div className="p-6">
          <div className="max-w-xs">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Wall Paint Base Rate (₹ / sqft)</label>
            <input
              type="number"
              min="0"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:border-blue-500 bg-slate-50"
              value={wallBaseRate}
              onChange={e => setWallBaseRate(Number(e.target.value))}
            />
          </div>
        </div>
      </div>



      {/* Section 1: Utility Rates */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 3v18"/>
            </svg>
            Utility Item Rates
          </h3>
          <p className="text-xs text-gray-500 mt-1">Enamel painting rates and additional service rates per utility item (doors, grills, windows, panels) calculated per sqft.</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {UTILITY_META.map(meta => {
              const Icon = meta.icon;
              return (
                <div key={meta.key} className="border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-xl border border-blue-100 text-blue-600">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{meta.label}</h4>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">{meta.desc}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Enamel Rate (₹/sqft)</label>
                      <input
                        type="number"
                        min="0"
                        value={utilities[meta.key]?.enamelRate ?? 0}
                        onChange={e => updateUtility(meta.key, 'enamelRate', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Addl. Service (₹/sqft)</label>
                      <input
                        type="number"
                        min="0"
                        value={utilities[meta.key]?.addlRate ?? 0}
                        onChange={e => updateUtility(meta.key, 'addlRate', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 2: Additional Room Services Rates */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
            Additional Room Services Rates
          </h3>
          <p className="text-xs text-gray-500 mt-1">Per-room additional services — waterproofing, POP repair, texture work, etc. These rates appear in the vendor quote wizard.</p>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Service</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4 text-right">Rate (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {ADDL_SERVICES_META.map(svc => {
                  const Icon = svc.icon;
                  return (
                    <tr key={svc.key} className="hover:bg-gray-50/50">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-gray-800">{svc.label}</span>
                        </div>
                      </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 uppercase">
                        per {svc.unit}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <input
                        type="number"
                        min="0"
                        value={addlServices[svc.key]?.rate ?? 0}
                        onChange={e => updateService(svc.key, e.target.value)}
                        className="w-28 ml-auto px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold text-right focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section 3: Sqft base price range configurations */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.3 8.11 15.89 2.7a1 1 0 0 0-1.41 0L2.7 14.48a1 1 0 0 0 0 1.41l5.41 5.41a1 1 0 0 0 1.42 0L21.3 9.52a1 1 0 0 0 0-1.41zM16 8l-2-2M13 11l-2-2M10 14l-2-2M7 17l-2-2"/>
              </svg>
              Sqft Base Price Multiplier Ranges
            </h3>
            <p className="text-xs text-gray-500 mt-1">Configure pricing multipliers or adjustments for larger/smaller overall sqft areas.</p>
          </div>
          <button
            onClick={() => setSqftRanges([...sqftRanges, { minSqft: 0, maxSqft: 1000, rateMultiplier: 1.0 }])}
            className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold transition-all"
          >
            + Add Range
          </button>
        </div>

        <div className="p-6">
          {sqftRanges.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-xs italic">No sqft ranges set. Default rates will be used.</div>
          ) : (
            <div className="space-y-3">
              {sqftRanges.map((range, idx) => (
                <div key={idx} className="flex gap-4 items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex-1">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Min Sqft</label>
                    <input
                      type="number"
                      value={range.minSqft}
                      onChange={e => {
                        const updated = [...sqftRanges];
                        updated[idx].minSqft = Number(e.target.value);
                        setSqftRanges(updated);
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Max Sqft</label>
                    <input
                      type="number"
                      value={range.maxSqft}
                      onChange={e => {
                        const updated = [...sqftRanges];
                        updated[idx].maxSqft = Number(e.target.value);
                        setSqftRanges(updated);
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Rate Multiplier</label>
                    <input
                      type="number"
                      step="0.1"
                      value={range.rateMultiplier}
                      onChange={e => {
                        const updated = [...sqftRanges];
                        updated[idx].rateMultiplier = Number(e.target.value);
                        setSqftRanges(updated);
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold"
                    />
                  </div>
                  <button
                    onClick={() => setSqftRanges(sqftRanges.filter((_, i) => i !== idx))}
                    className="mt-4 p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* Section 4: Door Size Ranges & Prices */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="3" width="14" height="18" rx="2"/>
                <path d="M14 12h.01"/>
              </svg>
              Door Size Price Ranges
            </h3>
            <p className="text-xs text-gray-500 mt-1">Configure different pricing tiers for doors depending on their area (width x height).</p>
          </div>
          <button
            onClick={() => setDoorSizeRates([...doorSizeRates, { minSqft: 0, maxSqft: 30, price: 500 }])}
            className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold transition-all"
          >
            + Add Door Tier
          </button>
        </div>

        <div className="p-6">
          {doorSizeRates.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-xs italic">No custom door tiers set. Default flat rates will be used.</div>
          ) : (
            <div className="space-y-3">
              {doorSizeRates.map((range, idx) => (
                <div key={idx} className="flex gap-4 items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex-1">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Min Area (Sqft)</label>
                    <input
                      type="number"
                      value={range.minSqft}
                      onChange={e => {
                        const updated = [...doorSizeRates];
                        updated[idx].minSqft = Number(e.target.value);
                        setDoorSizeRates(updated);
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Max Area (Sqft)</label>
                    <input
                      type="number"
                      value={range.maxSqft}
                      onChange={e => {
                        const updated = [...doorSizeRates];
                        updated[idx].maxSqft = Number(e.target.value);
                        setDoorSizeRates(updated);
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Price (₹)</label>
                    <input
                      type="number"
                      value={range.price}
                      onChange={e => {
                        const updated = [...doorSizeRates];
                        updated[idx].price = Number(e.target.value);
                        setDoorSizeRates(updated);
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold"
                    />
                  </div>
                  <button
                    onClick={() => setDoorSizeRates(doorSizeRates.filter((_, i) => i !== idx))}
                    className="mt-4 p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section 5: Window Size Ranges & Prices */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 12h18M12 3v18"/>
              </svg>
              Window Size Price Ranges
            </h3>
            <p className="text-xs text-gray-500 mt-1">Configure different pricing tiers for windows depending on their area (width x height).</p>
          </div>
          <button
            onClick={() => setWindowSizeRates([...windowSizeRates, { minSqft: 0, maxSqft: 20, price: 300 }])}
            className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold transition-all"
          >
            + Add Window Tier
          </button>
        </div>

        <div className="p-6">
          {windowSizeRates.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-xs italic">No custom window tiers set. Default flat rates will be used.</div>
          ) : (
            <div className="space-y-3">
              {windowSizeRates.map((range, idx) => (
                <div key={idx} className="flex gap-4 items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <div className="flex-1">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Min Area (Sqft)</label>
                    <input
                      type="number"
                      value={range.minSqft}
                      onChange={e => {
                        const updated = [...windowSizeRates];
                        updated[idx].minSqft = Number(e.target.value);
                        setWindowSizeRates(updated);
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Max Area (Sqft)</label>
                    <input
                      type="number"
                      value={range.maxSqft}
                      onChange={e => {
                        const updated = [...windowSizeRates];
                        updated[idx].maxSqft = Number(e.target.value);
                        setWindowSizeRates(updated);
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Price (₹)</label>
                    <input
                      type="number"
                      value={range.price}
                      onChange={e => {
                        const updated = [...windowSizeRates];
                        updated[idx].price = Number(e.target.value);
                        setWindowSizeRates(updated);
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold"
                    />
                  </div>
                  <button
                    onClick={() => setWindowSizeRates(windowSizeRates.filter((_, i) => i !== idx))}
                    className="mt-4 p-2 text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section 6: Dynamic Property Layouts Configuration */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Dynamic Property Layouts
            </h3>
            <p className="text-xs text-gray-500 mt-1">Configure layout cards, images, tag details, and room characteristics shown to users.</p>
          </div>
          <button
            onClick={() => setPropertyLayouts([...propertyLayouts, { id: `BHK_${Date.now()}`, name: 'New BHK', tag: 'Standard', imageUrl: 'https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80', details: ['1 Bedroom', '1 Bathroom'] }])}
            className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold transition-all"
          >
            + Add Layout Card
          </button>
        </div>

        <div className="p-6">
          {propertyLayouts.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-xs italic">No property layouts set. Default local options will be displayed.</div>
          ) : (
            <div className="space-y-6">
              {propertyLayouts.map((layout, idx) => (
                <div key={idx} className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Layout ID (No spaces)</label>
                      <input
                        type="text"
                        value={layout.id}
                        onChange={e => {
                          const updated = [...propertyLayouts];
                          updated[idx].id = e.target.value;
                          setPropertyLayouts(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Name</label>
                      <input
                        type="text"
                        value={layout.name}
                        onChange={e => {
                          const updated = [...propertyLayouts];
                          updated[idx].name = e.target.value;
                          setPropertyLayouts(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Tag (Compact / Standard / Elite)</label>
                      <input
                        type="text"
                        value={layout.tag}
                        onChange={e => {
                          const updated = [...propertyLayouts];
                          updated[idx].tag = e.target.value;
                          setPropertyLayouts(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Image URL</label>
                      <input
                        type="text"
                        value={layout.imageUrl}
                        onChange={e => {
                          const updated = [...propertyLayouts];
                          updated[idx].imageUrl = e.target.value;
                          setPropertyLayouts(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Room Details (Comma separated list)</label>
                    <input
                      type="text"
                      value={(layout.details || []).join(', ')}
                      onChange={e => {
                        const updated = [...propertyLayouts];
                        updated[idx].details = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        setPropertyLayouts(updated);
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium"
                      placeholder="e.g. 1 Bedroom, 1 Living Room, 1 Kitchen"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => setPropertyLayouts(propertyLayouts.filter((_, i) => i !== idx))}
                      className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold transition-all"
                    >
                      Delete Card
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Save Bottom Bar */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          <FiSave className="w-4 h-4" /> {saving ? 'Saving Changes...' : 'Save All Pricing'}
        </button>
      </div>
    </div>
  );
};

export default PaintingPricingConfig;
