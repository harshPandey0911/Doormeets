import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FiSettings, FiSliders, FiDollarSign, FiPlusCircle, FiActivity,
  FiClock, FiSave, FiAlertCircle, FiTrendingUp, FiLayers, FiList,
  FiUserCheck, FiCopy, FiRepeat, FiX, FiTrash2, FiPlus
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
    consultationFee: 0,
    consultationDuration: '45 - 60 Minutes physical survey',
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

  const [newCoatRule, setNewCoatRule] = useState({
    category: 'Economy',
    defaultPrimerCoats: 1,
    defaultPaintCoats: 2,
    defaultFinishCoats: 2
  });

  const handleUpdateCoatRule = (idx, field, val) => {
    const rules = [...(snapshot.coatRules || [])];
    rules[idx] = { ...rules[idx], [field]: Number(val) || 0 };
    setSnapshot({ ...snapshot, coatRules: rules });
  };

  const handleDeleteCoatRule = (idx) => {
    const rules = (snapshot.coatRules || []).filter((_, i) => i !== idx);
    setSnapshot({ ...snapshot, coatRules: rules });
    toast.success('Coat rule deleted from draft');
  };

  const handleCreateCoatRule = () => {
    const exists = (snapshot.coatRules || []).some(r => r.category === newCoatRule.category);
    if (exists) {
      toast.error(`A coat rule for category ${newCoatRule.category} already exists.`);
      return;
    }
    const rules = [...(snapshot.coatRules || []), newCoatRule];
    setSnapshot({ ...snapshot, coatRules: rules });
    setNewCoatRule({
      category: 'Economy',
      defaultPrimerCoats: 1,
      defaultPaintCoats: 2,
      defaultFinishCoats: 2
    });
    toast.success('Coat rule added to draft snapshot');
  };



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





  return (
    <div className="bg-white rounded-2xl border border-gray-150 shadow-sm p-6 space-y-6">

      {/* Header Profile Switcher and Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-0.5">Active Settings Profile</span>
            <span className="text-sm font-extrabold text-gray-800 bg-gray-50 border border-gray-150 px-3 py-1.5 rounded-xl">{activeProfile?.profileName || 'Default System Profile'}</span>
          </div>

          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${activeProfile?.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
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
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all text-left cursor-pointer ${active
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
        <div className="lg:col-span-3 space-y-6">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
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
                    <label className="font-bold text-gray-400 uppercase text-[9px]">Primer Buffer (%)</label>
                    <input
                      type="number"
                      value={snapshot.primerBuffer}
                      onChange={e => setSnapshot({ ...snapshot, primerBuffer: Number(e.target.value) })}
                      className="border border-gray-250 rounded-xl p-3 text-gray-700 outline-none font-bold text-center"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-gray-400 uppercase text-[9px]">Putty Buffer (%)</label>
                    <input
                      type="number"
                      value={snapshot.puttyBuffer}
                      onChange={e => setSnapshot({ ...snapshot, puttyBuffer: Number(e.target.value) })}
                      className="border border-gray-250 rounded-xl p-3 text-gray-700 outline-none font-bold text-center"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-gray-400 uppercase text-[9px]">Texture Buffer (%)</label>
                    <input
                      type="number"
                      value={snapshot.textureBuffer}
                      onChange={e => setSnapshot({ ...snapshot, textureBuffer: Number(e.target.value) })}
                      className="border border-gray-250 rounded-xl p-3 text-gray-700 outline-none font-bold text-center"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-bold text-gray-400 uppercase text-[9px]">Waterproofing Buffer (%)</label>
                    <input
                      type="number"
                      value={snapshot.waterproofingBuffer}
                      onChange={e => setSnapshot({ ...snapshot, waterproofingBuffer: Number(e.target.value) })}
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
                </div>
              </div>
            )}

            {activeTab === 'labour' && (
              <div className="space-y-4">
                {/* Labor Coat Cost Multipliers */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Labor Cost Multipliers Per Coat</h4>
                    <p className="text-[10px] text-gray-450 font-bold leading-relaxed mt-1">Define labor cost adjustment multipliers for different numbers of coats (e.g. 1 coat is typically cheaper, while 3+ coats cost more).</p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(coat => {
                      const multipliers = snapshot.laborCoatMultipliers || { coat1: 0.6, coat2: 1.0, coat3: 1.3, coat4: 1.6 };
                      const fieldKey = 'coat' + coat;
                      const val = multipliers[fieldKey] !== undefined ? multipliers[fieldKey] : (coat === 1 ? 0.6 : coat === 2 ? 1.0 : coat === 3 ? 1.3 : 1.6);
                      return (
                        <div key={coat} className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{coat} Coat{coat > 1 ? 's' : ''} Multiplier</label>
                          <input
                            type="number"
                            step="0.05"
                            min="0"
                            value={val}
                            onChange={e => {
                              const updatedMap = { ...multipliers };
                              updatedMap[fieldKey] = parseFloat(e.target.value) || 0;
                              setSnapshot({
                                ...snapshot,
                                laborCoatMultipliers: updatedMap
                              });
                            }}
                            className="border border-gray-150 rounded-xl px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:border-blue-500 bg-white"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'coats' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Coat requirements per paint tier</h4>
                  <span className="text-[10px] bg-blue-50 text-blue-600 font-extrabold px-2 py-0.5 rounded">
                    {(snapshot.coatRules || []).length} Rules Defined
                  </span>
                </div>

                <div className="overflow-x-auto border border-gray-100 rounded-xl">
                  <table className="w-full text-left text-xs font-semibold">
                    <thead>
                      <tr className="bg-gray-50 text-gray-400 border-b border-gray-150 uppercase text-[9px] tracking-wider select-none">
                        <th className="p-3">Paint Tier</th>
                        <th className="p-3 text-center">Primer Coats</th>
                        <th className="p-3 text-center">Paint Coats</th>
                        <th className="p-3 text-center">Finish Coats</th>
                        <th className="p-3 text-center w-12">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(!snapshot.coatRules || snapshot.coatRules.length === 0) ? (
                        <tr>
                          <td colSpan="5" className="p-4 text-center text-gray-400 italic">No coat rules found. Add one below.</td>
                        </tr>
                      ) : (
                        snapshot.coatRules.map((rule, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="p-3 font-bold text-gray-800">{rule.category}</td>
                            <td className="p-3">
                              <div className="flex justify-center">
                                <input
                                  type="number"
                                  value={rule.defaultPrimerCoats || 0}
                                  onChange={e => handleUpdateCoatRule(idx, 'defaultPrimerCoats', e.target.value)}
                                  className="w-12 border border-gray-250 rounded-lg p-1 text-center font-bold text-gray-700 outline-none focus:border-blue-500"
                                />
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex justify-center">
                                <input
                                  type="number"
                                  value={rule.defaultPaintCoats || 0}
                                  onChange={e => handleUpdateCoatRule(idx, 'defaultPaintCoats', e.target.value)}
                                  className="w-12 border border-gray-250 rounded-lg p-1 text-center font-bold text-gray-700 outline-none focus:border-blue-500"
                                />
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex justify-center">
                                <input
                                  type="number"
                                  value={rule.defaultFinishCoats || 0}
                                  onChange={e => handleUpdateCoatRule(idx, 'defaultFinishCoats', e.target.value)}
                                  className="w-12 border border-gray-250 rounded-lg p-1 text-center font-bold text-gray-700 outline-none focus:border-blue-500"
                                />
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex justify-center">
                                <button
                                  onClick={() => handleDeleteCoatRule(idx)}
                                  className="p-1 hover:bg-red-50 text-red-500 rounded transition-all cursor-pointer"
                                >
                                  <FiTrash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Add Coat Rule Form */}
                <div className="p-4 border border-gray-150 rounded-2xl bg-gray-50/50 space-y-3">
                  <span className="text-[10px] font-black text-gray-450 uppercase tracking-wider block">Add Coat Rule</span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                    <div className="flex flex-col gap-1 col-span-2 sm:col-span-1.5">
                      <label className="font-bold text-gray-400 uppercase text-[8px]">Category</label>
                      <select
                        value={newCoatRule.category}
                        onChange={e => setNewCoatRule({ ...newCoatRule, category: e.target.value })}
                        className="border border-gray-200 bg-white rounded-lg p-2 font-bold text-gray-700 outline-none"
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-gray-400 uppercase text-[8px]">Primer Coats</label>
                      <input
                        type="number"
                        value={newCoatRule.defaultPrimerCoats}
                        onChange={e => setNewCoatRule({ ...newCoatRule, defaultPrimerCoats: Number(e.target.value) || 0 })}
                        className="border border-gray-200 bg-white rounded-lg p-2 font-bold text-gray-750 text-center outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-gray-400 uppercase text-[8px]">Paint Coats</label>
                      <input
                        type="number"
                        value={newCoatRule.defaultPaintCoats}
                        onChange={e => setNewCoatRule({ ...newCoatRule, defaultPaintCoats: Number(e.target.value) || 0 })}
                        className="border border-gray-200 bg-white rounded-lg p-2 font-bold text-gray-750 text-center outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-gray-400 uppercase text-[8px]">Finish Coats</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={newCoatRule.defaultFinishCoats}
                          onChange={e => setNewCoatRule({ ...newCoatRule, defaultFinishCoats: Number(e.target.value) || 0 })}
                          className="border border-gray-200 bg-white rounded-lg p-2 font-bold text-gray-750 text-center w-full outline-none"
                        />
                        <button
                          onClick={handleCreateCoatRule}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all cursor-pointer shadow flex items-center justify-center shrink-0 w-10"
                        >
                          <FiPlus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'booking' && (
              <div className="space-y-6">
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

                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">Consultation Fee & Duration Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-bold text-gray-400 uppercase text-[9px]">Consultation Fee (₹)</label>
                      <input
                        type="number"
                        value={snapshot.consultationFee !== undefined ? snapshot.consultationFee : 0}
                        onChange={e => setSnapshot({ ...snapshot, consultationFee: Number(e.target.value) })}
                        className="border border-gray-250 rounded-xl p-3 text-gray-700 outline-none font-bold text-center"
                        placeholder="e.g. 0 for Free"
                      />
                      <p className="text-[10px] text-gray-400 font-bold mt-1">Configure the amount charged to users upfront for booking a painting site consultation. Set to 0 for Free.</p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="font-bold text-gray-400 uppercase text-[9px]">Estimate Duration / Time</label>
                      <input
                        type="text"
                        value={snapshot.consultationDuration || ''}
                        onChange={e => setSnapshot({ ...snapshot, consultationDuration: e.target.value })}
                        className="border border-gray-250 rounded-xl p-3 text-gray-700 outline-none font-bold"
                        placeholder="e.g. 45 - 60 Minutes physical survey"
                      />
                      <p className="text-[10px] text-gray-400 font-bold mt-1">Estimated duration shown to users for the site inspection (e.g. '45 - 60 Minutes physical survey').</p>
                    </div>
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
