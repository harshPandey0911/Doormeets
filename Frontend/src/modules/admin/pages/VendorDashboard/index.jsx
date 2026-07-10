import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid, FiPlus, FiTrash2, FiSave, FiEdit2, FiImage, FiPlayCircle, FiLoader, FiCheckCircle
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import vendorDashboardService from '../../services/vendorDashboardService';
import { categoryService, subCategoryService, brandService } from '../../../../services/catalogService';
import Modal from '../../components/Modal';
import CardShell from '../UserCategories/components/CardShell';
import ToggleSwitch from '../UserCategories/components/ToggleSwitch';

const VendorDashboardManager = () => {
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form state matching catalog style exactly
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
      toast.error('Failed to load dashboard banners');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setEditingId(null);
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
    setIsModalOpen(false);
  };

  const openAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item._id);
    setForm({
      ...item,
      targetCategoryId: item.targetCategoryId || '',
      targetSubCategoryId: item.targetSubCategoryId || ''
    });
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      setUploadProgress(10);
      const isVideo = file.type.startsWith('video');
      const response = await brandService.uploadImage(file, isVideo ? 'videos' : 'banners', (progress) => {
        setUploadProgress(progress || 40);
      });
      if (response.success) {
        if (isVideo) {
          setForm(p => ({
            ...p,
            mediaType: 'video',
            videoUrl: response.imageUrl,
            videoSource: 'cloudinary',
            imageUrl: ''
          }));
        } else {
          setForm(p => ({
            ...p,
            mediaType: 'image',
            imageUrl: response.imageUrl,
            videoUrl: ''
          }));
        }
        toast.success("File uploaded successfully!");
      } else {
        toast.error("Upload failed");
      }
    } catch (err) {
      toast.error("Error uploading file");
    } finally {
      setUploading(false);
      setUploadProgress(0);
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

      const res = editingId 
        ? await vendorDashboardService.updateBanner(editingId, payload) 
        : await vendorDashboardService.addBanner(payload);

      if (res?.success) {
        toast.success(editingId ? 'Banner updated' : 'Banner added');
        resetForm();
        await loadData();
      } else {
        toast.error(res?.message || 'Save failed');
      }
    } catch (err) {
      toast.error('Error saving banner settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this banner?')) return;
    try {
      const res = await vendorDashboardService.deleteBanner(id);
      if (res?.success) {
        toast.success('Banner deleted');
        await loadData();
      } else {
        toast.error('Delete failed');
      }
    } catch {
      toast.error('Error deleting banner');
    }
  };

  return (
    <div className="space-y-6">
      {/* Home Banners Shell */}
      <CardShell icon={FiGrid} title="Vendor Home Banners">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-500">Add, edit, or remove banner media shown on vendor app homepage</div>
          <button
            type="button"
            onClick={openAdd}
            className="px-4 py-2 rounded-xl text-white text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
            style={{ background: 'linear-gradient(to right, #2874F0, #1e5fd4)' }}
          >
            <FiPlus className="w-4 h-4" />
            <span>Add Banner</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <FiLoader className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
            <p className="text-xs text-gray-400 mt-2">Loading banners...</p>
          </div>
        ) : banners.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">No home banners added yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-12">#</th>
                  <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-24">Media</th>
                  <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Format</th>
                  <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Title Text</th>
                  <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Redirect Target</th>
                  <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-32 text-center">Status</th>
                  <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-24 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {banners.map((b, idx) => (
                  <tr key={b._id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 text-sm font-semibold text-gray-600">{idx + 1}</td>
                    <td className="py-4 px-4">
                      {b.mediaType === 'video' ? (
                        <div className="h-14 w-14 bg-gray-900 rounded-lg flex items-center justify-center border border-gray-200 overflow-hidden relative">
                          <FiPlayCircle className="w-6 h-6 text-white absolute" />
                        </div>
                      ) : b.imageUrl ? (
                        <img src={b.imageUrl} alt="Banner" className="h-14 w-14 object-cover rounded-lg border border-gray-200" />
                      ) : (
                        <div className="h-14 w-14 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-400">No img</div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 capitalize">
                      {b.mediaType === 'video' ? '🎥 Video' : '🖼️ Image'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-gray-900 text-sm">{b.title || "—"}</div>
                      <div className="text-xs text-gray-400">{b.subtitle}</div>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {b.linkType === 'category' ? (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold border border-blue-100">
                          📂 {categories.find(c => (c.id || c._id) === b.targetCategoryId)?.title || 'Category'}
                        </span>
                      ) : b.linkType === 'subcategory' ? (
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-bold border border-purple-100">
                          🏷️ {subCategories.find(s => (s.id || s._id) === b.targetSubCategoryId)?.title || 'Subcategory'}
                        </span>
                      ) : b.linkType === 'url' ? (
                        <span className="text-xs font-semibold text-blue-500 truncate max-w-[120px] inline-block">{b.linkUrl}</span>
                      ) : (
                        <span className="text-gray-400 italic">None</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-sm font-semibold text-gray-600">{b.order ?? 0}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        b.isActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {b.isActive ? 'Visible' : 'Hidden'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(b)}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          title="Edit"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(b._id)}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardShell>

      {/* Modal Form styled exactly like User Catalog Add Banner Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={resetForm}
        title={editingId ? "Edit Banner" : "Add Banner"}
      >
        <div className="space-y-4">
          {/* File Picker */}
          <div>
            <label className="block text-base font-bold text-gray-900 mb-2">Image / Video File</label>
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*,video/*"
                disabled={uploading}
                onChange={handleFileUpload}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 disabled:opacity-50"
              />
              
              {uploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-blue-600 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      Uploading...
                    </div>
                  </div>
                </div>
              )}

              {/* Show preview after upload */}
              {!uploading && (form.imageUrl || form.videoUrl) && (
                <div className="relative inline-block group border border-gray-200 rounded-lg p-1.5 shadow-sm bg-gray-50">
                  {form.mediaType === 'video' ? (
                    <video src={form.videoUrl} className="h-28 w-auto rounded object-cover" controls />
                  ) : (
                    <img src={form.imageUrl} alt="Preview" className="h-28 w-auto object-cover rounded" />
                  )}
                  <button
                    onClick={() => setForm(p => ({ ...p, imageUrl: '', videoUrl: '' }))}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove media"
                  >
                    <FiTrash2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Text input */}
          <div>
            <label className="block text-base font-bold text-gray-900 mb-2">Text (optional)</label>
            <input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="e.g. Winter offers"
            />
          </div>

          {/* Subtitle / Description input */}
          <div>
            <label className="block text-base font-bold text-gray-900 mb-2">Subtitle / Info (optional)</label>
            <input
              value={form.subtitle}
              onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="e.g. Up to 50% Off on subscriptions"
            />
          </div>

          {/* Redirect Container */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
            <h4 className="text-xs font-bold text-gray-700 tracking-wide uppercase">Redirect to...</h4>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">1. LINK ACTION TYPE</label>
              <select
                value={form.linkType}
                onChange={e => setForm(p => ({ ...p, linkType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {LINK_TYPES.map(t => (
                  <option key={t.key} value={t.key}>{t.label}</option>
                ))}
              </select>
            </div>

            {form.linkType === 'category' && (
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">2. SELECT CATEGORY</label>
                <select
                  value={form.targetCategoryId}
                  onChange={e => setForm(p => ({ ...p, targetCategoryId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
                <label className="block text-xs font-bold text-gray-500 mb-1.5">2. SELECT SUBCATEGORY</label>
                <select
                  value={form.targetSubCategoryId}
                  onChange={e => setForm(p => ({ ...p, targetSubCategoryId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">-- Choose Subcategory --</option>
                  {subCategories.map(s => (
                    <option key={s._id || s.id} value={s._id || s.id}>{s.title}</option>
                  ))}
                </select>
              </div>
            )}

            {form.linkType === 'url' && (
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">2. CUSTOM REDIRECT LINK / URL</label>
                <input
                  value={form.linkUrl}
                  onChange={e => setForm(p => ({ ...p, linkUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://... or app://screen"
                />
              </div>
            )}
          </div>

          {/* Display Order input */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-base font-bold text-gray-900 mb-2">Display Order</label>
              <input
                type="number"
                value={form.order}
                onChange={e => setForm(p => ({ ...p, order: Number(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                placeholder="e.g. 0"
              />
            </div>
            
            <div>
              <label className="block text-base font-bold text-gray-900 mb-2">Active Status</label>
              <div className="mt-1 flex items-center gap-2">
                <ToggleSwitch
                  checked={form.isActive}
                  onChange={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                />
                <span className="text-xs text-gray-500 font-semibold">{form.isActive ? 'Visible' : 'Hidden'}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons styled exactly like catalog modal */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={uploading || saving}
              className={`flex-1 py-3.5 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg ${
                (uploading || saving) ? 'opacity-50 cursor-not-allowed bg-gray-400' : ''
              }`}
              style={{ backgroundColor: (uploading || saving) ? '#cbd5e1' : '#2874F0' }}
            >
              {(uploading || saving) ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : <FiSave className="w-5 h-5" />}
              <span>{editingId ? "Update Banner" : "Add Banner"}</span>
            </button>
            <button
              onClick={resetForm}
              className="px-6 py-3.5 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-all border border-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VendorDashboardManager;
