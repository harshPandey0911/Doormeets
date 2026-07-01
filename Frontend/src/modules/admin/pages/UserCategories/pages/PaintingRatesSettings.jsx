import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiSave, FiPlus, FiTrash2, FiSettings, FiActivity } from 'react-icons/fi';
import api from '../../../../../services/api';

const DEFAULT_RATES = {
  wallBaseRate: 10,
  brands: [
    { name: 'Asian Paints', standardRate: 12, premiumRate: 18, luxuryRate: 25 },
    { name: 'Dulux', standardRate: 11, premiumRate: 17, luxuryRate: 24 },
    { name: 'Berger', standardRate: 11, premiumRate: 16, luxuryRate: 23 },
    { name: 'Nerolac', standardRate: 10, premiumRate: 15, luxuryRate: 22 }
  ],
  utilities: {
    doors: { enamelRate: 120, addlRate: 80 },
    grills: { enamelRate: 90, addlRate: 60 },
    windows: { enamelRate: 100, addlRate: 70 },
    panels: { enamelRate: 150, addlRate: 100 }
  },
  additionalServices: {
    waterproofing: { rate: 15 },
    pop_repair: { rate: 22 },
    wallpaper_removal: { rate: 500 },
    texture_painting: { rate: 800 },
    deep_cleaning: { rate: 350 },
    putty_work: { rate: 12 },
    enamel_painting: { rate: 30 }
  }
};

export default function PaintingRatesSettings() {
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newBrand, setNewBrand] = useState({ name: '', standardRate: 10, premiumRate: 15, luxuryRate: 22 });

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/settings');
      if (response.data?.success && response.data?.settings?.paintingRates) {
        // Merge with defaults to ensure all fields exist
        const fetched = response.data.settings.paintingRates;
        setRates({
          wallBaseRate: fetched.wallBaseRate ?? DEFAULT_RATES.wallBaseRate,
          brands: fetched.brands || DEFAULT_RATES.brands,
          utilities: { ...DEFAULT_RATES.utilities, ...fetched.utilities },
          additionalServices: { ...DEFAULT_RATES.additionalServices, ...fetched.additionalServices }
        });
      }
    } catch (error) {
      console.error('Failed to load painting rates:', error);
      toast.error('Failed to load rates, using local defaults.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await api.put('/admin/settings', {
        paintingRates: rates
      });
      if (response.data?.success) {
        toast.success('Painting rates updated successfully!');
      } else {
        toast.error('Failed to update rates.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const updateUtility = (comp, field, value) => {
    setRates(prev => ({
      ...prev,
      utilities: {
        ...prev.utilities,
        [comp]: {
          ...prev.utilities[comp],
          [field]: Number(value)
        }
      }
    }));
  };

  const updateAddlService = (svc, value) => {
    setRates(prev => ({
      ...prev,
      additionalServices: {
        ...prev.additionalServices,
        [svc]: {
          ...prev.additionalServices[svc],
          rate: Number(value)
        }
      }
    }));
  };

  const updateBrandRate = (idx, field, value) => {
    const updatedBrands = [...rates.brands];
    updatedBrands[idx] = {
      ...updatedBrands[idx],
      [field]: field === 'name' ? value : Number(value)
    };
    setRates(prev => ({ ...prev, brands: updatedBrands }));
  };

  const handleAddBrand = () => {
    if (!newBrand.name.trim()) return toast.error('Enter brand name');
    setRates(prev => ({
      ...prev,
      brands: [...prev.brands, { ...newBrand }]
    }));
    setNewBrand({ name: '', standardRate: 10, premiumRate: 15, luxuryRate: 22 });
    toast.success('Brand added to list!');
  };

  const handleRemoveBrand = (idx) => {
    const updated = rates.brands.filter((_, i) => i !== idx);
    setRates(prev => ({ ...prev, brands: updated }));
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold">
        <FiActivity className="animate-spin text-4xl mx-auto mb-4 text-orange-500" />
        Loading config matrix...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Title Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">Centralized Library</span>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 mt-0.5">
            🎨 Painting Rates Configurations
          </h1>
          <p className="text-xs text-slate-400 mt-1">Configure per sqft dynamic pricing for wall painting, brands, doors, and windows.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-orange-500 text-white font-bold rounded-xl flex items-center gap-2 hover:bg-orange-600 active:scale-95 transition-all shadow-md shadow-orange-100 disabled:opacity-50"
        >
          <FiSave />
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Component Base Rates Panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Wall & Base Panel */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b">🧱 Wall Painting Base Setup</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Wall Paint Base Rate (₹ / sqft)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-orange-500 bg-slate-50"
                  value={rates.wallBaseRate}
                  onChange={e => setRates(prev => ({ ...prev, wallBaseRate: Number(e.target.value) }))}
                />
              </div>
            </div>
          </div>

          {/* Utilities Panel */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b">🚪 Component Utilities Rates</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="p-3 font-bold text-slate-500">Component</th>
                    <th className="p-3 font-bold text-slate-500">Enamel Painting Rate (₹ / sqft)</th>
                    <th className="p-3 font-bold text-slate-500">Prep / Addl Service Rate (₹ / sqft)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(rates.utilities).map(comp => (
                    <tr key={comp} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-700 capitalize">{comp}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          min="0"
                          className="w-28 p-2 border border-slate-200 rounded-lg text-sm bg-white font-semibold text-slate-800 outline-none"
                          value={rates.utilities[comp].enamelRate}
                          onChange={e => updateUtility(comp, 'enamelRate', e.target.value)}
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="number"
                          min="0"
                          className="w-28 p-2 border border-slate-200 rounded-lg text-sm bg-white font-semibold text-slate-800 outline-none"
                          value={rates.utilities[comp].addlRate}
                          onChange={e => updateUtility(comp, 'addlRate', e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Brands Tiers Config Panel */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">🏷️ Brands & Tier Multipliers</h3>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-extrabold px-2 py-0.5 rounded-full">ACTIVE BRANDS</span>
            </div>
            
            <div className="space-y-3">
              {rates.brands.map((b, idx) => (
                <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50">
                  <input
                    type="text"
                    className="p-2.5 border border-slate-200 rounded-lg text-xs bg-white font-bold text-slate-800 outline-none w-full md:w-36"
                    value={b.name}
                    onChange={e => updateBrandRate(idx, 'name', e.target.value)}
                  />
                  <div className="flex gap-2 items-center flex-wrap">
                    <div>
                      <span className="block text-[9px] font-extrabold text-slate-400 uppercase">Std (₹/sqft)</span>
                      <input
                        type="number"
                        className="p-2 border border-slate-200 rounded-lg text-xs bg-white w-16 text-center font-semibold"
                        value={b.standardRate}
                        onChange={e => updateBrandRate(idx, 'standardRate', e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="block text-[9px] font-extrabold text-slate-400 uppercase">Prem (₹/sqft)</span>
                      <input
                        type="number"
                        className="p-2 border border-slate-200 rounded-lg text-xs bg-white w-16 text-center font-semibold"
                        value={b.premiumRate}
                        onChange={e => updateBrandRate(idx, 'premiumRate', e.target.value)}
                      />
                    </div>
                    <div>
                      <span className="block text-[9px] font-extrabold text-slate-400 uppercase">Lux (₹/sqft)</span>
                      <input
                        type="number"
                        className="p-2 border border-slate-200 rounded-lg text-xs bg-white w-16 text-center font-semibold"
                        value={b.luxuryRate}
                        onChange={e => updateBrandRate(idx, 'luxuryRate', e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveBrand(idx)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors active:scale-90 self-end md:self-center"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Add New Brand Line */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl border border-dashed border-slate-200 bg-white mt-4">
                <input
                  type="text"
                  placeholder="New Brand (e.g. Nippon)"
                  className="p-2.5 border border-slate-200 rounded-lg text-xs bg-white font-bold text-slate-800 outline-none w-full md:w-36"
                  value={newBrand.name}
                  onChange={e => setNewBrand({ ...newBrand, name: e.target.value })}
                />
                <div className="flex gap-2 items-center flex-wrap">
                  <div>
                    <span className="block text-[9px] font-extrabold text-slate-400 uppercase">Std (₹)</span>
                    <input
                      type="number"
                      className="p-2 border border-slate-200 rounded-lg text-xs bg-white w-16 text-center"
                      value={newBrand.standardRate}
                      onChange={e => setNewBrand({ ...newBrand, standardRate: e.target.value })}
                    />
                  </div>
                  <div>
                    <span className="block text-[9px] font-extrabold text-slate-400 uppercase">Prem (₹)</span>
                    <input
                      type="number"
                      className="p-2 border border-slate-200 rounded-lg text-xs bg-white w-16 text-center"
                      value={newBrand.premiumRate}
                      onChange={e => setNewBrand({ ...newBrand, premiumRate: e.target.value })}
                    />
                  </div>
                  <div>
                    <span className="block text-[9px] font-extrabold text-slate-400 uppercase">Lux (₹)</span>
                    <input
                      type="number"
                      className="p-2 border border-slate-200 rounded-lg text-xs bg-white w-16 text-center"
                      value={newBrand.luxuryRate}
                      onChange={e => setNewBrand({ ...newBrand, luxuryRate: e.target.value })}
                    />
                  </div>
                </div>
                <button
                  onClick={handleAddBrand}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 active:scale-95 transition-all text-white font-bold rounded-lg text-xs flex items-center gap-1 shrink-0 self-end md:self-center"
                >
                  <FiPlus /> Add Brand
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Additional Services Rates Panel */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 pb-2 border-b">🛠️ Additional Services Rates</h3>
            
            <div className="space-y-4">
              {Object.keys(rates.additionalServices).map(svc => (
                <div key={svc} className="flex justify-between items-center gap-3">
                  <div>
                    <span className="block text-xs font-bold text-slate-700 capitalize">{svc.replace('_', ' ')}</span>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase">Per unit rate</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    className="w-24 p-2 border border-slate-200 rounded-lg text-xs bg-white font-bold text-slate-800 outline-none text-right"
                    value={rates.additionalServices[svc].rate}
                    onChange={e => updateAddlService(svc, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
