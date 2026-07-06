import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  FiSettings, FiSliders, FiDollarSign, FiPlusCircle, FiActivity, 
  FiClock, FiSave, FiAlertCircle, FiTrendingUp, FiLayers, FiList, 
  FiUserCheck, FiCopy, FiRepeat
} from 'react-icons/fi';
import api from '../../../../services/api';

const SURFACES = ['Concrete', 'POP', 'Gypsum', 'Brick', 'Cement Plaster', 'Wood', 'Metal'];
const CATEGORIES = ['Economy', 'Premium', 'Luxury', 'Texture', 'Waterproof'];
const CONDITIONS = ['Excellent', 'Good', 'Average', 'Poor', 'Cracked', 'Damp', 'Peeling', 'Seepage'];

const PaintingSettingsPage = () => {
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('general'); // 'general', 'materials', 'coverage', 'pack', 'labour', 'coats', 'booking', 'vendor', 'history'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile Editor Settings State
  const [profileForm, setProfileForm] = useState({
    profileName: '',
    profileCode: '',
    isDefault: false
  });
  
  // Configuration settings snapshot state
  const [snapshot, setSnapshot] = useState({
    gstPercentage: 18,
    defaultWarrantyYears: 2,
    quotationValidityDays: 30,
    companyMarginPercent: 15,
    currency: 'INR',
    areaUnit: 'sqft',
    primerBuffer: 10,
    puttyBuffer: 10,
    paintBuffer: 10,
    textureBuffer: 10,
    waterproofingBuffer: 10,
    materialBufferPercent: 10,
    wastagePercent: 5,
    coverageBufferPercent: 10,
    roundingMethod: 'ROUND_UP',
    customBufferPercent: 0,
    activeLabourMethod: 'PER_SQFT',
    minArea: 50,
    maxArea: 50000,
    minLabourCharge: 1000,
    minMaterialCharge: 1000,
    emergencyBookingPremiumPercent: 20,
    expressBookingPremiumPercent: 15,
    mandatoryPhotos: false,
    mandatoryMeasurements: false,
    mandatoryBeforeImages: false,
    mandatoryAfterImages: false,
    mandatorySelfie: false,
    mandatoryUniform: false,
    mandatoryOtp: false,
    mandatoryMaterialUsage: false,
    coverageRules: [],
    coatRules: [],
    futureRules: {}
  });

  // Simulator State
  const [simInputs, setSimInputs] = useState({
    area: 1200,
    paintCategory: 'Premium',
    surfaceType: 'POP',
    condition: 'Good',
    labourMethod: 'PER_SQFT'
  });
  const [simResults, setSimResults] = useState({
    materialCost: 0,
    labourCost: 0,
    gstAmount: 0,
    grandTotal: 0
  });

  // History timeline log state
  const [history, setHistory] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/painting/settings/profiles');
      if (res.data?.success && res.data.data.length > 0) {
        setProfiles(res.data.data);
        handleSelectProfile(res.data.data[0]);
      } else {
        // If no settings exist, mock list
        setProfiles([]);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load settings profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProfile = async (prof) => {
    setActiveProfile(prof);
    setProfileForm({
      profileName: prof.profileName,
      profileCode: prof.profileCode,
      isDefault: prof.isDefault
    });

    if (prof.activeVersionId?.snapshot) {
      setSnapshot(prof.activeVersionId.snapshot);
    } else {
      // Fetch details from backend
      try {
        const res = await api.get(`/admin/painting/settings/profiles/${prof._id}`);
        if (res.data?.success && res.data.data?.activeVersionId?.snapshot) {
          setSnapshot(res.data.data.activeVersionId.snapshot);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchHistory(prof._id);
  };

  const fetchHistory = async (profId) => {
    try {
      const res = await api.get(`/admin/painting/settings/profiles/${profId}/history`);
      if (res.data?.success) {
        setHistory(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/painting/settings/profiles', {
        profileName: profileForm.profileName,
        profileCode: profileForm.profileCode,
        isDefault: profileForm.isDefault,
        snapshot: snapshot
      });

      if (res.data?.success) {
        toast.success('Settings profile created successfully');
        setShowCreateModal(false);
        fetchProfiles();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to create profile');
    }
  };

  const handleSaveSnapshotDraft = async () => {
    if (!activeProfile) return;
    try {
      setSaving(true);
      const res = await api.put(`/admin/painting/settings/profiles/${activeProfile._id}/snapshot`, {
        snapshot,
        changeSummary: `Modified draft snapshot rules for section: ${activeTab}`
      });

      if (res.data?.success) {
        toast.success('Draft modifications saved locally');
        // Refresh profiles to load updated snapshot ids
        const refRes = await api.get('/admin/painting/settings/profiles');
        if (refRes.data?.success) {
          setProfiles(refRes.data.data);
          const current = refRes.data.data.find(p => p._id === activeProfile._id);
          if (current) handleSelectProfile(current);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to save draft details');
    } finally {
      setSaving(false);
    }
  };

  const handleWorkflowTransition = async (action) => {
    if (!activeProfile) return;
    try {
      const res = await api.post(`/admin/painting/settings/profiles/${activeProfile._id}/workflow`, {
        action,
        notes: `Executed workflow change: ${action}`
      });
      if (res.data?.success) {
        toast.success(`Workflow transition successful: ${action}`);
        fetchProfiles();
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to process workflow transition');
    }
  };

  const handleRollback = async (targetVersion) => {
    if (!activeProfile) return;
    if (!window.confirm(`Are you sure you want to rollback this profile configuration draft to version ${targetVersion}?`)) return;
    try {
      const res = await api.post(`/admin/painting/settings/profiles/${activeProfile._id}/rollback`, {
        targetVersion,
        reason: 'Restoring working settings from audit log history'
      });
      if (res.data?.success) {
        toast.success(`Restored draft settings from version ${targetVersion}`);
        fetchProfiles();
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to rollback settings');
    }
  };

  // Live Simulator Calculations
  useEffect(() => {
    const area = Number(simInputs.area) || 0;
    const margin = Number(snapshot.companyMarginPercent) || 0;
    
    // Simulate material required (standard: area / coverage * coats)
    const baseCoverage = 90; // Default POP surface coverage
    const paintLiters = (area / baseCoverage) * 2;
    const materialBaseVal = paintLiters * 250; // Premium brand estimated rate
    
    // Simulate labor rate
    const laborRate = 18; // standard labour rate estimation
    const laborBaseVal = area * laborRate;
    
    const marginAmount = (materialBaseVal + laborBaseVal) * (margin / 100);
    const taxableTotal = materialBaseVal + laborBaseVal + marginAmount;
    
    const gstPct = Number(snapshot.gstPercentage) || 0;
    const gstAmount = taxableTotal * (gstPct / 100);
    const grandTotal = taxableTotal + gstAmount;

    setSimResults({
      materialCost: materialBaseVal,
      labourCost: laborBaseVal + marginAmount,
      gstAmount: gstAmount,
      grandTotal: grandTotal
    });
  }, [simInputs, snapshot]);

  // Rounding preview panel calculations helper
  const getRoundingPreviews = (val) => {
    const floatVal = parseFloat(val) || 18.2;
    return {
      required: `${floatVal} L`,
      roundUp: `${Math.ceil(floatVal)} L`,
      nearestPack: `${Math.round(floatVal)} L`,
      customBuffer: `${(floatVal * 1.05).toFixed(1)} L`
    };
  };

  const roundPreviews = getRoundingPreviews(18.2);

  return (
    <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 space-y-6">
      
      {/* Header Profile Switcher and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-0.5">Active Settings Profile</span>
            <select
              value={activeProfile?._id || ''}
              onChange={e => {
                const selected = profiles.find(p => p._id === e.target.value);
                if (selected) handleSelectProfile(selected);
              }}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-extrabold bg-white text-gray-800 outline-none cursor-pointer"
            >
              {profiles.map(p => (
                <option key={p._id} value={p._id}>{p.profileName} {p.isDefault ? '[Default]' : ''}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${
              activeProfile?.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
              activeProfile?.status === 'APPROVED' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
              'bg-amber-50 text-amber-600 border border-amber-100'
            }`}>
              {activeProfile?.status || 'Draft'}
            </span>
            <span className="text-xs font-bold text-gray-400 font-mono">
              Version: {activeProfile?.currentVersion || 1}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 self-start md:self-center select-none">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            Create Profile
          </button>
          
          {activeProfile?.status === 'DRAFT' && (
            <button
              onClick={() => handleWorkflowTransition('SUBMIT')}
              className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md"
            >
              Submit For Review
            </button>
          )}

          {activeProfile?.status === 'SUBMIT_FOR_REVIEW' && (
            <>
              <button
                onClick={() => handleWorkflowTransition('REVIEW')}
                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md"
              >
                Mark Reviewed
              </button>
            </>
          )}

          {activeProfile?.status === 'REVIEWED' && (
            <button
              onClick={() => handleWorkflowTransition('APPROVE')}
              className="px-3 py-2 bg-[#E85D3F] hover:bg-[#E85D3F]/90 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md"
            >
              Approve Settings
            </button>
          )}

          {activeProfile?.status === 'APPROVED' && (
            <button
              onClick={() => handleWorkflowTransition('PUBLISH')}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md"
            >
              Publish version
            </button>
          )}
        </div>
      </div>

      {/* Main Settings Tabs & Workspaces */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left tabs menu */}
        <div className="space-y-1 bg-gray-50/50 p-2.5 rounded-2xl border border-gray-150 self-start">
          {[
            { id: 'general', label: 'General Settings', icon: FiSettings },
            { id: 'materials', label: 'Material Rules', icon: FiSliders },
            { id: 'coverage', label: 'Coverage Rules', icon: FiLayers },
            { id: 'pack', label: 'Pack Rounding', icon: FiRepeat },
            { id: 'labour', label: 'Labour costing', icon: FiDollarSign },
            { id: 'coats', label: 'Coat rules', icon: FiList },
            { id: 'booking', label: 'Booking Rules', icon: FiTrendingUp },
            { id: 'vendor', label: 'Vendor Validation', icon: FiUserCheck },
            { id: 'history', label: 'Timeline History', icon: FiClock }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all text-left cursor-pointer ${
                  active 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10' 
                    : 'text-gray-600 hover:bg-gray-100/70'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Center Config Form Forms Workspace */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-gray-150 rounded-2xl p-6 bg-white shadow-sm space-y-5">
            
            {activeTab === 'general' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">General Specifications</h4>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-gray-400 uppercase text-[9px]">GST Percentage (%)</label>
                    <input 
                      type="number"
                      value={snapshot.gstPercentage}
                      onChange={e => setSnapshot({ ...snapshot, gstPercentage: Number(e.target.value) })}
                      className="border border-gray-250 rounded-xl p-3 text-gray-700 outline-none font-bold text-center"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-gray-400 uppercase text-[9px]">Warranty Period (Years)</label>
                    <input 
                      type="number"
                      value={snapshot.defaultWarrantyYears}
                      onChange={e => setSnapshot({ ...snapshot, defaultWarrantyYears: Number(e.target.value) })}
                      className="border border-gray-250 rounded-xl p-3 text-gray-700 outline-none font-bold text-center"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-gray-400 uppercase text-[9px]">Quotation Validity (Days)</label>
                    <input 
                      type="number"
                      value={snapshot.quotationValidityDays}
                      onChange={e => setSnapshot({ ...snapshot, quotationValidityDays: Number(e.target.value) })}
                      className="border border-gray-250 rounded-xl p-3 text-gray-700 outline-none font-bold text-center"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-gray-400 uppercase text-[9px]">Company Profit Margin (%)</label>
                    <input 
                      type="number"
                      value={snapshot.companyMarginPercent}
                      onChange={e => setSnapshot({ ...snapshot, companyMarginPercent: Number(e.target.value) })}
                      className="border border-gray-250 rounded-xl p-3 text-gray-700 outline-none font-bold text-center"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'materials' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">Material wastage coefficients</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-gray-400 uppercase text-[9px]">Paint Buffer (%)</label>
                    <input 
                      type="number"
                      value={snapshot.paintBuffer}
                      onChange={e => setSnapshot({ ...snapshot, paintBuffer: Number(e.target.value) })}
                      className="border border-gray-250 rounded-xl p-3 text-gray-700 outline-none font-bold text-center"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-gray-400 uppercase text-[9px]">Material Buffer (%)</label>
                    <input 
                      type="number"
                      value={snapshot.materialBufferPercent}
                      onChange={e => setSnapshot({ ...snapshot, materialBufferPercent: Number(e.target.value) })}
                      className="border border-gray-250 rounded-xl p-3 text-gray-700 outline-none font-bold text-center"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-2">
                    <label className="font-bold text-gray-400 uppercase text-[9px]">General Wastage Percent (%)</label>
                    <input 
                      type="number"
                      value={snapshot.wastagePercent}
                      onChange={e => setSnapshot({ ...snapshot, wastagePercent: Number(e.target.value) })}
                      className="border border-gray-250 rounded-xl p-3 text-gray-700 outline-none font-bold text-center"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'coverage' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">Material Coverage Grid</h4>
                <p className="text-[10px] text-gray-400 font-bold leading-relaxed">Configures surface coverage multipliers dynamically per surface type and quality variables.</p>
                
                <div className="overflow-x-auto border border-gray-100 rounded-xl">
                  <table className="w-full text-left text-xs font-semibold">
                    <thead>
                      <tr className="bg-gray-50 text-gray-400 border-b border-gray-150 uppercase text-[9px] tracking-wider select-none">
                        <th className="p-3">Surface</th>
                        <th className="p-3">Tier</th>
                        <th className="p-3">Condition</th>
                        <th className="p-3 text-center w-24">Coverage (sqft/L)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {SURFACES.map((surf, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="p-3 font-bold text-gray-800">{surf}</td>
                          <td className="p-3 text-gray-500">Premium</td>
                          <td className="p-3 text-gray-500">Good</td>
                          <td className="p-3">
                            <input 
                              type="number"
                              defaultValue={85}
                              className="w-16 border border-gray-250 rounded-lg p-1 text-center font-bold text-gray-700 outline-none focus:border-blue-500"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'pack' && (
              <div className="space-y-5">
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">Pack Rounding Configurations</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5 text-xs">
                    <label className="font-bold text-gray-400 uppercase text-[9px]">Rounding Method</label>
                    <select
                      value={snapshot.roundingMethod}
                      onChange={e => setSnapshot({ ...snapshot, roundingMethod: e.target.value })}
                      className="border border-gray-250 rounded-xl p-3 text-gray-750 font-bold bg-white outline-none cursor-pointer"
                    >
                      <option value="ROUND_UP">Round Up</option>
                      <option value="ROUND_DOWN">Round Down</option>
                      <option value="NEAREST_PACK">Nearest Pack</option>
                      <option value="CUSTOM_BUFFER">Custom Buffer</option>
                    </select>
                  </div>
                </div>

                {/* Rounding Visual Example */}
                <div className="p-4 border border-gray-150 rounded-2xl bg-gray-50/50 space-y-3">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Visual Example Simulation</span>
                  
                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                    <div className="bg-white p-2.5 rounded-xl border border-gray-100 text-center flex-1 shadow-sm">
                      <span className="text-[9px] text-gray-400 block font-bold uppercase">Required Liters</span>
                      <span className="text-sm font-extrabold text-gray-800">{roundPreviews.required}</span>
                    </div>
                    <div className="text-gray-400">➔</div>
                    <div className={`p-2.5 rounded-xl border text-center flex-1 shadow-sm ${snapshot.roundingMethod === 'ROUND_UP' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-100 text-gray-500'}`}>
                      <span className="text-[9px] block font-bold uppercase">Round Up</span>
                      <span className="text-sm font-extrabold">{roundPreviews.roundUp}</span>
                    </div>
                    <div className={`p-2.5 rounded-xl border text-center flex-1 shadow-sm ${snapshot.roundingMethod === 'NEAREST_PACK' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-100 text-gray-500'}`}>
                      <span className="text-[9px] block font-bold uppercase">Nearest Pack</span>
                      <span className="text-sm font-extrabold">{roundPreviews.nearestPack}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'labour' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">Labour calculation metrics</h4>
                <p className="text-[10px] text-gray-400 font-bold leading-relaxed">Select the default method used to quote labor prices. Future algorithms support other options without schema edits.</p>
                
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'PER_SQFT', name: 'Per Sq.Ft Metric', desc: 'Labour rate multiplies total paintable area.' },
                    { id: 'PER_ROOM', name: 'Per Room Flat', desc: 'Labour rate assigns flat cost per room.' },
                    { id: 'PER_DAY', name: 'Daily Wages', desc: 'Labour rate tracks daily counts.' },
                    { id: 'PER_TEAM', name: 'Team Contract', desc: 'Labour cost maps to teams sizes.' }
                  ].map(method => {
                    const active = snapshot.activeLabourMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSnapshot({ ...snapshot, activeLabourMethod: method.id })}
                        className={`p-4 border text-left rounded-xl transition-all cursor-pointer flex flex-col justify-between h-28 shadow-sm ${
                          active 
                            ? 'border-blue-500 bg-blue-50/30' 
                            : 'border-gray-150 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-xs font-black text-gray-800">{method.name}</span>
                        <span className="text-[10px] text-gray-400 font-semibold leading-relaxed mt-2">{method.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'coats' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">Coat requirements per paint tier</h4>
                
                <div className="overflow-x-auto border border-gray-100 rounded-xl">
                  <table className="w-full text-left text-xs font-semibold">
                    <thead>
                      <tr className="bg-gray-50 text-gray-400 border-b border-gray-150 uppercase text-[9px] tracking-wider select-none">
                        <th className="p-3">Paint Tier</th>
                        <th className="p-3 text-center">Primer Coats</th>
                        <th className="p-3 text-center">Paint Coats</th>
                        <th className="p-3 text-center">Finish Coats</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {CATEGORIES.map((cat, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="p-3 font-bold text-gray-800">{cat} Paint</td>
                          <td className="p-3 text-center">
                            <input type="number" defaultValue={1} className="w-12 border border-gray-250 rounded-lg p-1 text-center font-bold" />
                          </td>
                          <td className="p-3 text-center">
                            <input type="number" defaultValue={2} className="w-12 border border-gray-250 rounded-lg p-1 text-center font-bold" />
                          </td>
                          <td className="p-3 text-center">
                            <input type="number" defaultValue={2} className="w-12 border border-gray-250 rounded-lg p-1 text-center font-bold" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'booking' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">Booking Area constraints</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-gray-400 uppercase text-[9px]">Min Booking Area (sqft)</label>
                    <input 
                      type="number"
                      value={snapshot.minArea}
                      onChange={e => setSnapshot({ ...snapshot, minArea: Number(e.target.value) })}
                      className="border border-gray-250 rounded-xl p-3 text-gray-700 outline-none font-bold text-center"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-gray-400 uppercase text-[9px]">Max Booking Area (sqft)</label>
                    <input 
                      type="number"
                      value={snapshot.maxArea}
                      onChange={e => setSnapshot({ ...snapshot, maxArea: Number(e.target.value) })}
                      className="border border-gray-250 rounded-xl p-3 text-gray-700 outline-none font-bold text-center"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'vendor' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">Vendor inspection validation settings</h4>
                <p className="text-[10px] text-gray-400 font-bold leading-relaxed">Toggle verification constraints mandated during vendor inspection and quote compilation steps.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 select-none">
                  {[
                    { key: 'mandatoryPhotos', label: 'Mandate Photos Upload' },
                    { key: 'mandatoryMeasurements', label: 'Mandate Wall Dimensions' },
                    { key: 'mandatoryBeforeImages', label: 'Mandate Before Images' },
                    { key: 'mandatoryOtp', label: 'Mandate OTP Verification' }
                  ].map(rule => (
                    <label key={rule.key} className="p-3 border border-gray-150 hover:bg-gray-50/50 rounded-xl flex justify-between items-center text-xs font-bold text-gray-700 cursor-pointer">
                      <span>{rule.label}</span>
                      <input 
                        type="checkbox"
                        checked={snapshot[rule.key]}
                        onChange={() => setSnapshot({ ...snapshot, [rule.key]: !snapshot[rule.key] })}
                        className="rounded text-blue-600 border-gray-200 w-4.5 h-4.5 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">Version Timeline Audit Log</h4>
                
                {history.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No historical configurations archived.</p>
                ) : (
                  <div className="relative border-l border-gray-200 pl-4 ml-2 space-y-6">
                    {history.map((ver, idx) => (
                      <div key={idx} className="relative text-xs">
                        <div className="absolute -left-[21px] top-0 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white" />
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-extrabold text-gray-800 block text-xs">Version {ver.version} [{ver.status}]</span>
                            <span className="text-[10px] font-bold text-gray-400 mt-0.5 block">Updated by: {ver.createdBy?.name || 'Admin'}</span>
                          </div>
                          {ver.status !== 'PUBLISHED' && (
                            <button
                              onClick={() => handleRollback(ver.version)}
                              className="px-2.5 py-1 border border-blue-200 text-blue-600 hover:bg-blue-50 font-bold rounded-lg text-[9px] uppercase tracking-wider transition-all cursor-pointer"
                            >
                              Restore Draft
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed mt-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                          {ver.changeSummary || 'No change summary notes recorded.'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Save Buttons Bar */}
            {activeTab !== 'history' && (
              <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold">
                  <FiAlertCircle className="w-4 h-4 text-orange-400" />
                  <span>Draft modifications must be saved to apply.</span>
                </div>
                <button
                  disabled={saving}
                  onClick={handleSaveSnapshotDraft}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  <FiSave className="w-4 h-4" /> Save Configuration Draft
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Right Live Sandbox Simulator Panel */}
        <div className="space-y-6">
          <div className="p-5 border border-gray-150 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-950 text-white space-y-4 shadow-lg sticky top-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 block border-b border-white/10 pb-2">
              Quotation Sandbox Calculator
            </span>

            <div className="space-y-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-400 uppercase text-[9px] opacity-75">Area (sqft)</label>
                <input 
                  type="number"
                  value={simInputs.area}
                  onChange={e => setSimInputs({ ...simInputs, area: Number(e.target.value) })}
                  className="border border-white/10 rounded-lg p-2 bg-white/5 text-white text-center font-bold outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-bold text-gray-400 uppercase text-[9px] opacity-75">Paint Category</label>
                <select
                  value={simInputs.paintCategory}
                  onChange={e => setSimInputs({ ...simInputs, paintCategory: e.target.value })}
                  className="border border-white/10 rounded-lg p-2 bg-gray-900 text-white font-bold outline-none cursor-pointer"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="h-px bg-white/10 my-4" />

            <div className="space-y-3.5 text-xs font-semibold">
              <div className="flex justify-between items-center">
                <span className="opacity-70">Estimated Materials:</span>
                <span className="font-extrabold">₹{simResults.materialCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-70">Labour + Margin:</span>
                <span className="font-extrabold">₹{simResults.labourCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="opacity-70">GST (18%):</span>
                <span className="font-extrabold">₹{simResults.gstAmount.toLocaleString()}</span>
              </div>
              
              <div className="border-t border-white/20 pt-4 mt-2">
                <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest block mb-0.5">Grand Total Quote</span>
                <span className="text-2xl font-black">₹{simResults.grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Create profile modal dialog */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-2xl max-w-md w-full space-y-4"
            >
              <div className="flex justify-between items-center">
                <h4 className="text-base font-extrabold text-gray-800 tracking-tight">Create Settings Profile</h4>
                <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateProfile} className="space-y-4 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-gray-400 uppercase text-[9px]">Profile Name</label>
                  <input 
                    type="text"
                    required
                    value={profileForm.profileName}
                    onChange={e => setProfileForm({ ...profileForm, profileName: e.target.value })}
                    className="border border-gray-250 rounded-xl p-3 text-gray-700 outline-none font-bold"
                    placeholder="e.g. Commercial Default"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-gray-400 uppercase text-[9px]">Profile Code</label>
                  <input 
                    type="text"
                    required
                    value={profileForm.profileCode}
                    onChange={e => setProfileForm({ ...profileForm, profileCode: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                    className="border border-gray-250 rounded-xl p-3 text-gray-700 font-mono outline-none"
                    placeholder="e.g. COMMERCIAL_DEFAULT"
                  />
                </div>
                <label className="flex items-center gap-2 font-bold text-gray-700 select-none cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={profileForm.isDefault}
                    onChange={() => setProfileForm({ ...profileForm, isDefault: !profileForm.isDefault })}
                    className="rounded border-gray-200 text-blue-600 w-4 h-4 cursor-pointer"
                  />
                  <span>Mark as default config profile</span>
                </label>

                <div className="pt-2 flex gap-2 justify-end">
                  <button 
                    type="button" 
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md"
                  >
                    Create Profile
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default PaintingSettingsPage;
