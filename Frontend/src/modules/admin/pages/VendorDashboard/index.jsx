import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiImage, FiPlayCircle, FiBell, FiLink, FiPlus, FiEdit2, FiTrash2,
  FiLoader, FiRefreshCw, FiX, FiSave, FiYoutube, FiCheckCircle, FiMonitor
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import vendorDashboardService from '../../services/vendorDashboardService';

// ─── Section Tab Config ────────────────────────────────────────────────────────
const TABS = [
  { key: 'banners',       label: 'Banners',       icon: FiImage,       color: 'orange' },
  { key: 'videos',        label: 'Videos',        icon: FiPlayCircle,  color: 'red'    },
  { key: 'announcements', label: 'Announcements', icon: FiBell,        color: 'blue'   },
  { key: 'quickLinks',    label: 'Quick Links',   icon: FiLink,        color: 'purple' },
];

const TAB_COLORS = {
  orange: { active: 'bg-orange-500 text-white border-orange-500', badge: 'bg-orange-50 text-orange-700', hover: 'hover:bg-orange-50/50' },
  red:    { active: 'bg-red-500 text-white border-red-500',    badge: 'bg-red-50 text-red-700',       hover: 'hover:bg-red-50/50'    },
  blue:   { active: 'bg-blue-500 text-white border-blue-500',   badge: 'bg-blue-50 text-blue-700',     hover: 'hover:bg-blue-50/50'   },
  purple: { active: 'bg-purple-500 text-white border-purple-500', badge: 'bg-purple-50 text-purple-700', hover: 'hover:bg-purple-50/50' },
};

const BLANK = {
  banner: { title: '', subtitle: '', imageUrl: '', linkUrl: '', linkType: 'none', bgColor: '#F97316', isActive: true, order: 0 },
  video:  { title: '', description: '', videoUrl: '', thumbnailUrl: '', videoSource: 'youtube', isActive: true, order: 0 },
  announcement: { title: '', body: '', type: 'info', isActive: true, expiresAt: '', order: 0 },
  quickLink: { label: '', icon: 'link', linkUrl: '', bgColor: '#F97316', isActive: true, order: 0 },
};

const ANNOUNCE_TYPES = ['info', 'warning', 'success', 'urgent'];
const ANNOUNCE_BADGES = {
  info: 'bg-blue-50 text-blue-700 border-blue-100',
  warning: 'bg-amber-50 text-amber-700 border-amber-100',
  success: 'bg-green-50 text-green-700 border-green-100',
  urgent: 'bg-red-50 text-red-700 border-red-100'
};

const VendorDashboardManager = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('banners');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await vendorDashboardService.get();
      if (res.success) setData(res.data);
    } catch {
      toast.error('Failed to load dashboard settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditItem(null);
    const blankMap = { banners: 'banner', videos: 'video', announcements: 'announcement', quickLinks: 'quickLink' };
    setForm({ ...BLANK[blankMap[activeTab]] });
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ ...item });
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      let res;
      if (activeTab === 'banners') {
        res = editItem ? await vendorDashboardService.updateBanner(editItem._id, form) : await vendorDashboardService.addBanner(form);
      } else if (activeTab === 'videos') {
        res = editItem ? await vendorDashboardService.updateVideo(editItem._id, form) : await vendorDashboardService.addVideo(form);
      } else if (activeTab === 'announcements') {
        res = editItem ? await vendorDashboardService.updateAnnouncement(editItem._id, form) : await vendorDashboardService.addAnnouncement(form);
      } else if (activeTab === 'quickLinks') {
        res = editItem ? await vendorDashboardService.updateQuickLink(editItem._id, form) : await vendorDashboardService.addQuickLink(form);
      }
      if (res?.success) {
        toast.success(editItem ? 'Updated successfully' : 'Added successfully');
        setShowForm(false);
        await load();
      } else {
        toast.error(res?.message || 'Save failed');
      }
    } catch (err) {
      toast.error(err?.message || 'Error saving data');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      setDeletingId(id);
      let res;
      if (activeTab === 'banners') res = await vendorDashboardService.deleteBanner(id);
      else if (activeTab === 'videos') res = await vendorDashboardService.deleteVideo(id);
      else if (activeTab === 'announcements') res = await vendorDashboardService.deleteAnnouncement(id);
      else if (activeTab === 'quickLinks') res = await vendorDashboardService.deleteQuickLink(id);
      if (res?.success) {
        toast.success('Deleted successfully');
        await load();
      } else {
        toast.error('Failed to delete');
      }
    } catch {
      toast.error('Error deleting item');
    } finally {
      setDeletingId(null);
    }
  };

  const currentItems = data ? (data[activeTab] || []) : [];
  const currentTab = TABS.find(t => t.key === activeTab);
  const tc = TAB_COLORS[currentTab?.color || 'orange'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Page Header */}
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center border border-orange-100 shrink-0">
            <FiMonitor className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800">Dashboard Management</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">Manage banners, announcements, guides, and links for vendor home screen</p>
          </div>
        </div>
        <button
          onClick={load}
          className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          title="Refresh"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs list */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-2">
        {TABS.map(tab => {
          const isActive = activeTab === tab.key;
          const colors = TAB_COLORS[tab.color];
          const count = data?.[tab.key]?.length ?? 0;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setShowForm(false); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
                isActive
                  ? colors.active
                  : `bg-white text-gray-600 border-gray-200 ${colors.hover}`
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20' : colors.badge}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Section List / Form Container */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table/List Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            {currentTab && <currentTab.icon className="w-4 h-4 text-gray-500" />}
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{currentTab?.label} list</span>
          </div>
          {!showForm && (
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold rounded-lg transition-colors shadow-sm"
            >
              <FiPlus className="w-3.5 h-3.5" /> Add New
            </button>
          )}
        </div>

        {/* Add/Edit Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-gray-100 overflow-hidden bg-gray-50/30"
            >
              <div className="p-5 border-b border-gray-100">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    {editItem ? `Edit ${currentTab?.label.slice(0, -1)}` : `Create ${currentTab?.label.slice(0, -1)}`}
                  </h3>
                  <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                    <FiX className="w-4 h-4" />
                  </button>
                </div>

                {/* Banner Forms */}
                {activeTab === 'banners' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="Enter banner title..." />
                    <Field label="Subtitle" value={form.subtitle} onChange={v => setForm(f => ({ ...f, subtitle: v }))} placeholder="Enter description/subtitle..." />
                    <Field label="Image URL" value={form.imageUrl} onChange={v => setForm(f => ({ ...f, imageUrl: v }))} placeholder="https://..." className="col-span-2" />
                    <Field label="Link Action URL" value={form.linkUrl} onChange={v => setForm(f => ({ ...f, linkUrl: v }))} placeholder="https://..." />
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">On Tap Action</label>
                      <select
                        value={form.linkType}
                        onChange={e => setForm(f => ({ ...f, linkType: e.target.value }))}
                        className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-green-500 bg-white"
                      >
                        <option value="none">No Action</option>
                        <option value="url">External Link</option>
                        <option value="training">Redirect to Training</option>
                        <option value="subscription">Redirect to Subscriptions</option>
                        <option value="earnings">Redirect to Wallet/Earnings</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Background</label>
                        <input
                          type="color"
                          value={form.bgColor}
                          onChange={e => setForm(f => ({ ...f, bgColor: e.target.value }))}
                          className="mt-1 w-12 h-8 rounded border border-gray-200 cursor-pointer"
                        />
                      </div>
                      <Field label="Order" value={form.order} onChange={v => setForm(f => ({ ...f, order: Number(v) }))} type="number" />
                    </div>
                    <ToggleField label="Status" value={form.isActive} onChange={v => setForm(f => ({ ...f, isActive: v }))} />
                  </div>
                )}

                {/* Video Forms */}
                {activeTab === 'videos' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Video Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="Enter video guide title..." />
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Video Source</label>
                      <select
                        value={form.videoSource}
                        onChange={e => setForm(f => ({ ...f, videoSource: e.target.value }))}
                        className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-green-500 bg-white"
                      >
                        <option value="youtube">YouTube Embed</option>
                        <option value="cloudinary">Cloudinary</option>
                        <option value="external">External Direct Link</option>
                      </select>
                    </div>
                    <Field
                      label={form.videoSource === 'youtube' ? 'YouTube Video ID' : 'Direct Link URL'}
                      value={form.videoUrl}
                      onChange={v => setForm(f => ({ ...f, videoUrl: v }))}
                      placeholder={form.videoSource === 'youtube' ? 'e.g. dQw4w9WgXcQ' : 'https://...'}
                      className="col-span-2"
                    />
                    <Field label="Description" value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} multiline className="col-span-2" placeholder="Brief info about video content..." />
                    <Field label="Thumbnail URL (Optional)" value={form.thumbnailUrl} onChange={v => setForm(f => ({ ...f, thumbnailUrl: v }))} placeholder="https://..." />
                    <Field label="Order" value={form.order} onChange={v => setForm(f => ({ ...f, order: Number(v) }))} type="number" />
                    <ToggleField label="Status" value={form.isActive} onChange={v => setForm(f => ({ ...f, isActive: v }))} />
                  </div>
                )}

                {/* Announcement Forms */}
                {activeTab === 'announcements' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Announcement Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="Important updates..." className="col-span-2" />
                    <Field label="Body / Message Content" value={form.body} onChange={v => setForm(f => ({ ...f, body: v }))} multiline className="col-span-2" placeholder="Write announcement details..." />
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Alert Type</label>
                      <select
                        value={form.type}
                        onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                        className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-green-500 bg-white"
                      >
                        {ANNOUNCE_TYPES.map(t => (
                          <option key={t} value={t}>{t.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Expires At (Optional)</label>
                      <input
                        type="datetime-local"
                        value={form.expiresAt ? form.expiresAt.substring(0, 16) : ''}
                        onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                        className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-green-500 bg-white"
                      />
                    </div>
                    <Field label="Order" value={form.order} onChange={v => setForm(f => ({ ...f, order: Number(v) }))} type="number" />
                    <ToggleField label="Status" value={form.isActive} onChange={v => setForm(f => ({ ...f, isActive: v }))} />
                  </div>
                )}

                {/* Quick Link Forms */}
                {activeTab === 'quickLinks' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Icon Label" value={form.label} onChange={v => setForm(f => ({ ...f, label: v }))} placeholder="e.g. Services" />
                    <Field label="Redirect / Screen Path" value={form.linkUrl} onChange={v => setForm(f => ({ ...f, linkUrl: v }))} placeholder="/profile, /orders, https://..." />
                    <Field label="Icon Key (React Icon)" value={form.icon} onChange={v => setForm(f => ({ ...f, icon: v }))} placeholder="e.g. FiUser, FiInfo" />
                    <div className="flex items-center gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Icon BG Color</label>
                        <input
                          type="color"
                          value={form.bgColor}
                          onChange={e => setForm(f => ({ ...f, bgColor: e.target.value }))}
                          className="mt-1 w-12 h-8 rounded border border-gray-200 cursor-pointer"
                        />
                      </div>
                      <Field label="Order" value={form.order} onChange={v => setForm(f => ({ ...f, order: Number(v) }))} type="number" />
                    </div>
                    <ToggleField label="Status" value={form.isActive} onChange={v => setForm(f => ({ ...f, isActive: v }))} />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-150 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60 shadow-sm"
                  >
                    {saving ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiSave className="w-3.5 h-3.5" />}
                    Save Changes
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content List Table/Grid */}
        {loading ? (
          <div className="p-12 text-center">
            <FiLoader className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
            <p className="text-xs text-gray-400 mt-2">Fetching records...</p>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="p-12 text-center bg-gray-50/20">
            <FiCheckCircle className="w-8 h-8 text-green-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-600">No settings configured</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Click "Add New" button above to publish details.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Preview/Info</th>
                  {activeTab === 'banners' && <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Action Type</th>}
                  {activeTab === 'videos' && <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Source</th>}
                  {activeTab === 'announcements' && <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Alert Type</th>}
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {currentItems.map(item => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                    {/* Preview / Info Column */}
                    <td className="px-4 py-3">
                      {activeTab === 'banners' && (
                        <div className="flex items-center gap-3">
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.title} className="w-12 h-8 rounded object-cover border border-gray-100 bg-gray-100" />
                          ) : (
                            <div className="w-12 h-8 rounded border border-dashed border-gray-200 flex items-center justify-center text-[8px] text-gray-400 bg-gray-50">No Img</div>
                          )}
                          <div>
                            <p className="font-bold text-gray-900 text-xs">{item.title || 'Untitled Banner'}</p>
                            <p className="text-[10px] text-gray-400">{item.subtitle || '—'}</p>
                          </div>
                        </div>
                      )}

                      {activeTab === 'videos' && (
                        <div className="flex items-center gap-3">
                          {item.thumbnailUrl ? (
                            <img src={item.thumbnailUrl} alt={item.title} className="w-12 h-8 rounded object-cover border border-gray-100 bg-gray-100" />
                          ) : (
                            <div className="w-12 h-8 rounded flex items-center justify-center bg-gray-900 border border-gray-800 text-[8px] text-red-500 font-bold uppercase shrink-0">Video</div>
                          )}
                          <div>
                            <p className="font-bold text-gray-900 text-xs">{item.title}</p>
                            <p className="text-[10px] text-gray-400 truncate max-w-[200px]">{item.description || '—'}</p>
                          </div>
                        </div>
                      )}

                      {activeTab === 'announcements' && (
                        <div>
                          <p className="font-bold text-gray-900 text-xs">{item.title}</p>
                          <p className="text-[10px] text-gray-400 truncate max-w-[250px]">{item.body || '—'}</p>
                        </div>
                      )}

                      {activeTab === 'quickLinks' && (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm" style={{ backgroundColor: item.bgColor || '#F97316' }}>
                            {item.label?.charAt(0) || 'L'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-xs">{item.label}</p>
                            <p className="text-[10px] text-gray-400">{item.linkUrl || '—'}</p>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Action / Source / Alert type Column */}
                    {activeTab === 'banners' && (
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-gray-600 capitalize">{item.linkType?.replace(/_/g, ' ') || 'None'}</span>
                      </td>
                    )}
                    {activeTab === 'videos' && (
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-gray-600 uppercase">{item.videoSource}</span>
                      </td>
                    )}
                    {activeTab === 'announcements' && (
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold border uppercase tracking-wider ${ANNOUNCE_BADGES[item.type] || 'bg-gray-100 text-gray-600'}`}>
                          {item.type}
                        </span>
                      </td>
                    )}

                    {/* Order Column */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600 font-semibold">{item.order ?? 0}</span>
                    </td>

                    {/* Status Column */}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {item.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </td>

                    {/* Action operations dropdown column */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          disabled={deletingId === item._id}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingId === item._id ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiTrash2 className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Fields Components ────────────────────────────────────────────────────────
const Field = ({ label, value, onChange, placeholder, type = 'text', multiline, className = '' }) => (
  <div className={className}>
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</label>
    {multiline ? (
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-green-500 resize-none bg-white"
      />
    ) : (
      <input
        type={type}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-green-500 bg-white"
      />
    )}
  </div>
);

const ToggleField = ({ label, value, onChange }) => (
  <div>
    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">{label}</label>
    <div className="mt-1.5 flex items-center gap-2">
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${value ? 'bg-green-600' : 'bg-gray-200'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
      <span className="text-[11px] text-gray-500 font-semibold">{value ? 'Visible (Active)' : 'Hidden (Draft)'}</span>
    </div>
  </div>
);

export default VendorDashboardManager;
