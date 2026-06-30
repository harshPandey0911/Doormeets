import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FiSave, FiRefreshCw, FiDroplet, FiTool, FiFileText, FiEdit3, FiWind, FiGrid, FiSparkles, FiLayout } from 'react-icons/fi';
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
  { key: 'enamel_painting',  label: 'Enamel Painting',  icon: FiSparkles, unit: 'sqft' },
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

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/public/config');
      if (res.data?.success && res.data.settings?.paintingRates) {
        const pr = res.data.settings.paintingRates;
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
        }
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

      {/* Section 1: Utility Rates */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <span className="text-lg">🚪</span> Utility Item Rates
          </h3>
          <p className="text-xs text-gray-500 mt-1">Enamel painting rates and additional service rates per utility item (doors, grills, windows, panels).</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {UTILITY_META.map(meta => {
              const Icon = meta.icon;
              return (
                <div key={meta.key} className="border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-xl border border-orange-100 text-orange-600">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800">{meta.label}</h4>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">{meta.desc}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Enamel Rate (₹/item)</label>
                      <input
                        type="number"
                        min="0"
                        value={utilities[meta.key]?.enamelRate ?? 0}
                        onChange={e => updateUtility(meta.key, 'enamelRate', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Addl. Service (₹/item)</label>
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
            <span className="text-lg">🔧</span> Additional Room Services Rates
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
