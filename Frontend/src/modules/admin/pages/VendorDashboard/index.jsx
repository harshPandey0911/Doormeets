import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiImage, FiPlayCircle, FiPlus, FiEdit2, FiTrash2,
  FiLoader, FiRefreshCw, FiX, FiSave, FiYoutube, FiCheckCircle, FiMonitor, FiUpload
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import vendorDashboardService from '../../services/vendorDashboardService';
import { categoryService, subCategoryService, brandService } from '../../../../services/catalogService';

const LINK_TYPES = [
  { key: 'none', label: 'No Action' },
  { key: 'url', label: 'External URL / Web Link' },
  { key: 'category', label: 'Link to Category' },
  { key: 'subcategory', label: 'Link to Subcategory' },
];

const VendorDashboardManager = () => {
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    mediaType: 'image',
    imageUrl: '',
    videoUrl: '',
    videoSource: 'youtube',
    linkType: 'none',
    linkUrl: '',
    targetCategoryId: '',
    targetSubCategoryId: '',
    bgColor: '#F3F4F6',
    isActive: true,
    order: 0
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [dbRes, catRes, subRes] = await Promise.all([
        vendorDashboardService.get(),
        categoryService.getAll().catch(() => ({ success: false })),
        subCategoryService.getAll().catch(() => ({ success: false }))
      ]);

      if (dbRes.success) setBanners(dbRes.data?.banners || []);
      if (catRes.success) setCategories(catRes.categories || []);
      if (subRes.success) setSubCategories(subRes.data || subRes.subCategories || []);
    } catch {
      toast.error('Failed to load dashboard media and categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAdd = () => {
    setEditItem(null);
    setForm({
      title: '',
      subtitle: '',
      mediaType: 'image',
      imageUrl: '',
      videoUrl: '',
      videoSource: 'youtube',
      linkType: 'none',
      linkUrl: '',
      targetCategoryId: '',
      targetSubCategoryId: '',
      bgColor: '#F3F4F6',
      isActive: true,
      order: 0
    });
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      ...item,
      targetCategoryId: item.targetCategoryId || '',
      targetSubCategoryId: item.targetSubCategoryId || ''
    });
    setShowForm(true);
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const res = await brandService.uploadImage(file, 'vendor-dashboard');
      if (res.success) {
        setForm(f => ({ ...f, [field]: res.imageUrl }));
        toast.success('Media uploaded successfully!');
      } else {
        toast.error('Upload failed');
      }
    } catch (err) {
      toast.error('Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        ...form,
        targetCategoryId: form.linkType === 'category' && form.targetCategoryId ? form.targetCategoryId : null,
        targetSubCategoryId: form.linkType === 'subcategory' && form.targetSubCategoryId ? form.targetSubCategoryId : null,
        linkUrl: form.linkType === 'url' ? form.linkUrl : ''
      };

      const res = editItem 
        ? await vendorDashboardService.updateBanner(editItem._id, payload) 
        : await vendorDashboardService.addBanner(payload);

      if (res?.success) {
        toast.success(editItem ? 'Media item updated' : 'Media item added');
        setShowForm(false);
        await loadData();
      } else {
        toast.error(res?.message || 'Save failed');
      }
    } catch (err) {
      toast.error(err?.message || 'Error saving media settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this media item?')) return;
    try {
      setDeletingId(id);
      const res = await vendorDashboardService.deleteBanner(id);
      if (res?.success) {
        toast.success('Media item deleted');
        await loadData();
      } else {
        toast.error('Delete failed');
      }
    } catch {
      toast.error('Error deleting item');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center border border-orange-100 shrink-0">
            <FiMonitor className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800">Dashboard Management</h2>
            <p className="text-[10px] text-gray-400 mt-0.5">Publish and manage media banners, video instructions, and category highlights for vendors</p>
          </div>
        </div>
        <button
          onClick={loadData}
          className="p-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          title="Refresh"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Table/List Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <FiImage className="w-4 h-4 text-gray-500" />
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Dashboard Banners &amp; Media</span>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-700">{banners.length}</span>
          </div>
          {!showForm && (
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold rounded-lg transition-colors shadow-sm"
            >
              <FiPlus className="w-3.5 h-3.5" /> Add Banner / Video
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
              <div className="p-5 border-b border-gray-100 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                    {editItem ? 'Edit Media Banner' : 'Create Media Banner'}
                  </h3>
                  <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                    <FiX className="w-4 h-4" />
                  </button>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Media Type Select */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Media Format</label>
                    <select
                      value={form.mediaType}
                      onChange={e => setForm(f => ({ ...f, mediaType: e.target.value }))}
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-green-500 bg-white"
                    >
                      <option value="image">🖼️ Image Banner</option>
                      <option value="video">🎥 Video Guide / Promo</option>
                    </select>
                  </div>

                  <Field label="Banner Title" value={form.title} onChange={v => setForm(f => ({ ...f, title: v }))} placeholder="Title shown on vendor app..." />
                  <Field label="Subtitle / Description" value={form.subtitle} onChange={v => setForm(f => ({ ...f, subtitle: v }))} placeholder="Subtitle description text..." />

                  {/* Conditionally render fields based on Media Format */}
                  {form.mediaType === 'image' ? (
                    <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Image Banner Fields */}
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Banner Image</label>
                        <div className="mt-1.5 flex items-center gap-3">
                          <input
                            type="text"
                            value={form.imageUrl}
                            onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                            placeholder="Paste banner image URL here..."
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-green-500 bg-white"
                          />
                          <label className="cursor-pointer flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors text-xs shadow-sm whitespace-nowrap">
                            <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'imageUrl')} />
                            <FiUpload className="w-3.5 h-3.5" />
                            {uploading ? 'Uploading...' : 'Upload Image'}
                          </label>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Video Banner Fields */}
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Video Hosting</label>
                        <select
                          value={form.videoSource}
                          onChange={e => setForm(f => ({ ...f, videoSource: e.target.value }))}
                          className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-green-500 bg-white"
                        >
                          <option value="youtube">YouTube Embed Link</option>
                          <option value="cloudinary">Cloudinary Upload</option>
                          <option value="external">Direct Video Link URL</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          {form.videoSource === 'youtube' ? 'YouTube Video ID / URL' : 'Direct Video URL'}
                        </label>
                        <div className="mt-1 flex gap-2">
                          <input
                            type="text"
                            value={form.videoUrl}
                            onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
                            placeholder={form.videoSource === 'youtube' ? 'e.g. dQw4w9WgXcQ' : 'https://...'}
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-green-500 bg-white"
                          />
                          {form.videoSource !== 'youtube' && (
                            <label className="cursor-pointer flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors text-xs shadow-sm whitespace-nowrap">
                              <input type="file" className="hidden" accept="video/*" onChange={e => handleFileUpload(e, 'videoUrl')} />
                              <FiUpload className="w-3.5 h-3.5" />
                              {uploading ? 'Uploading...' : 'Upload Video'}
                            </label>
                          )}
                        </div>
                      </div>

                      {/* Video Thumbnail (Optional) */}
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Video Thumbnail Image (Optional)</label>
                        <div className="mt-1.5 flex items-center gap-3">
                          <input
                            type="text"
                            value={form.thumbnailUrl}
                            onChange={e => setForm(f => ({ ...f, thumbnailUrl: e.target.value }))}
                            placeholder="Paste thumbnail image URL here..."
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-green-500 bg-white"
                          />
                          <label className="cursor-pointer flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors text-xs shadow-sm whitespace-nowrap">
                            <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'thumbnailUrl')} />
                            <FiUpload className="w-3.5 h-3.5" />
                            {uploading ? 'Uploading...' : 'Upload Image'}
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Targets (Categories & Subcategories) */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">On Tap Navigation Target</label>
                    <select
                      value={form.linkType}
                      onChange={e => setForm(f => ({ ...f, linkType: e.target.value }))}
                      className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-green-500 bg-white"
                    >
                      {LINK_TYPES.map(t => (
                        <option key={t.key} value={t.key}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Conditional inputs depending on LinkType */}
                  {form.linkType === 'url' && (
                    <Field label="Custom Action URL Path" value={form.linkUrl} onChange={v => setForm(f => ({ ...f, linkUrl: v }))} placeholder="https://... or app://screen" />
                  )}

                  {form.linkType === 'category' && (
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Select Category Link</label>
                      <select
                        value={form.targetCategoryId}
                        onChange={e => setForm(f => ({ ...f, targetCategoryId: e.target.value }))}
                        className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-green-500 bg-white cursor-pointer"
                      >
                        <option value="">-- Choose Category --</option>
                        {categories.map(c => (
                          <option key={c.id || c._id} value={c.id || c._id}>{c.title}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {form.linkType === 'subcategory' && (
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Select Subcategory Link</label>
                      <select
                        value={form.targetSubCategoryId}
                        onChange={e => setForm(f => ({ ...f, targetSubCategoryId: e.target.value }))}
                        className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-green-500 bg-white cursor-pointer"
                      >
                        <option value="">-- Choose Subcategory --</option>
                        {subCategories.map(s => (
                          <option key={s._id || s.id} value={s._id || s.id}>{s.title}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Common Banner Fields */}
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

                  <ToggleField label="Visibility Status" value={form.isActive} onChange={v => setForm(f => ({ ...f, isActive: v }))} />
                </div>

                {/* Previews */}
                {form.mediaType === 'image' && form.imageUrl && (
                  <div className="mt-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Banner Image Preview</label>
                    <div className="mt-1 rounded-xl overflow-hidden max-h-36 flex items-center justify-center border border-gray-100" style={{ backgroundColor: form.bgColor }}>
                      <img src={form.imageUrl} alt="preview" className="h-full max-h-36 object-contain w-full" onError={e => { e.target.style.display = 'none'; }} />
                    </div>
                  </div>
                )}

                {form.mediaType === 'video' && form.videoSource === 'youtube' && form.videoUrl && (
                  <div className="mt-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">YouTube Preview</label>
                    <div className="mt-1 rounded-xl overflow-hidden aspect-video bg-black max-w-md">
                      <iframe
                        className="w-full h-full"
                        src={`https://www.youtube.com/embed/${form.videoUrl.replace('https://www.youtube.com/watch?v=', '').replace('https://youtu.be/', '')}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen title="preview"
                      />
                    </div>
                  </div>
                )}

                {/* Submit Action */}
                <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-5 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60 shadow-sm"
                  >
                    {saving ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiSave className="w-3.5 h-3.5" />}
                    Save Media Changes
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Media List Table */}
        {loading ? (
          <div className="p-12 text-center">
            <FiLoader className="w-6 h-6 animate-spin text-orange-500 mx-auto" />
            <p className="text-xs text-gray-400 mt-2">Fetching records...</p>
          </div>
        ) : banners.length === 0 ? (
          <div className="p-12 text-center bg-gray-50/20">
            <FiCheckCircle className="w-8 h-8 text-green-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-gray-600">No media banners created</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Click "Add Banner / Video" button above to publish one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Preview &amp; Info</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Media Format</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Link Destination</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Display Order</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {banners.map(item => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                    {/* Media Preview / Info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {item.mediaType === 'image' ? (
                          item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.title} className="w-12 h-8 rounded object-cover border border-gray-100 bg-gray-100" />
                          ) : (
                            <div className="w-12 h-8 rounded border border-dashed border-gray-200 flex items-center justify-center text-[8px] text-gray-400 bg-gray-50">No Img</div>
                          )
                        ) : (
                          item.thumbnailUrl ? (
                            <img src={item.thumbnailUrl} alt={item.title} className="w-12 h-8 rounded object-cover border border-gray-100 bg-gray-100" />
                          ) : (
                            <div className="w-12 h-8 rounded flex items-center justify-center bg-gray-900 border border-gray-800 text-[8px] text-red-500 font-bold uppercase shrink-0">Video</div>
                          )
                        )}
                        <div>
                          <p className="font-bold text-gray-900 text-xs">{item.title || 'Untitled Banner'}</p>
                          <p className="text-[10px] text-gray-400 max-w-[200px] truncate">{item.subtitle || '—'}</p>
                        </div>
                      </div>
                    </td>

                    {/* Media Type */}
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-gray-600 capitalize">
                        {item.mediaType === 'image' ? '🖼️ Image' : '🎥 Video'}
                      </span>
                    </td>

                    {/* Target Link destination */}
                    <td className="px-4 py-3">
                      {item.linkType === 'none' && <span className="text-xs text-gray-400 italic">None</span>}
                      {item.linkType === 'url' && <span className="text-xs font-semibold text-blue-600 truncate max-w-[120px] inline-block">{item.linkUrl || 'URL Link'}</span>}
                      {item.linkType === 'category' && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[9px] font-bold">
                          📂 {categories.find(c => (c.id || c._id) === item.targetCategoryId)?.title || 'Category Link'}
                        </span>
                      )}
                      {item.linkType === 'subcategory' && (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-100 rounded text-[9px] font-bold">
                          🏷️ {subCategories.find(s => (s.id || s._id) === item.targetSubCategoryId)?.title || 'Subcategory Link'}
                        </span>
                      )}
                    </td>

                    {/* Order */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600 font-semibold">{item.order ?? 0}</span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {item.isActive ? 'Active' : 'Hidden'}
                      </span>
                    </td>

                    {/* Actions */}
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
