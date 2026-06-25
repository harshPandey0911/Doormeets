import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPackage, FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiChevronDown,
  FiChevronUp, FiStar, FiSearch, FiDollarSign, FiPercent, FiCheck,
  FiToggleLeft, FiToggleRight, FiClock, FiGrid, FiEye, FiRefreshCw,
  FiImage, FiLayers, FiList, FiArrowLeft, FiEyeOff
} from 'react-icons/fi';
import api from '../../../../services/api';
import toast from 'react-hot-toast';

// ─── Price Matrix Calculator ──────────────────────────────────────
const calcPriceMatrix = (pkg) => {
  const price = Number(pkg.price) || 0;
  const gstPct = Number(pkg.gstPercentage) || 18;
  const gstIncluded = pkg.gstIncluded !== false;
  const vendorPayout = Number(pkg.vendorPayout) || 0;

  let basePrice, gstAmount, finalPrice;
  if (gstIncluded) {
    finalPrice = price;
    gstAmount = Math.round((price * gstPct) / (100 + gstPct));
    basePrice = price - gstAmount;
  } else {
    basePrice = price;
    gstAmount = Math.round((price * gstPct) / 100);
    finalPrice = price + gstAmount;
  }
  const platformEarning = basePrice - vendorPayout;
  return { basePrice, gstAmount, finalPrice, platformEarning };
};

// ════════════════════════════════════════════════════════════════════
// SERVICE GROUP ITEM EDITOR (inline row for items within a group)
// ════════════════════════════════════════════════════════════════════
const GroupItemRow = ({ item, onUpdate, onDelete }) => {
  return (
    <div className="flex items-center gap-2 bg-white border border-gray-150 rounded-xl px-3 py-2">
      <input
        type="text"
        value={item.title}
        onChange={e => onUpdate({ ...item, title: e.target.value })}
        placeholder="Item title (e.g. Haircut for men)"
        className="flex-1 text-sm font-medium text-gray-800 focus:outline-none bg-transparent min-w-0"
      />
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-xs text-gray-400">₹</span>
        <input
          type="number"
          value={item.price}
          onChange={e => onUpdate({ ...item, price: Number(e.target.value) || 0 })}
          className="w-16 text-sm font-bold text-gray-800 focus:outline-none bg-gray-50 rounded-lg px-2 py-1 text-center border border-gray-200"
          min="0"
        />
      </div>
      <input
        type="text"
        value={item.duration || ''}
        onChange={e => onUpdate({ ...item, duration: e.target.value })}
        placeholder="30 min"
        className="w-16 text-xs text-gray-500 focus:outline-none bg-gray-50 rounded-lg px-2 py-1 text-center border border-gray-200"
      />
      <button onClick={onDelete} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
        <FiTrash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
// SERVICE GROUP EDITOR (one group card — e.g., "Haircut")
// ════════════════════════════════════════════════════════════════════
const ServiceGroupCard = ({ group, index, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) => {
  const [collapsed, setCollapsed] = useState(false);

  const addItem = () => {
    const newItem = {
      title: '',
      price: 0,
      description: '',
      duration: '',
      isActive: true
    };
    onUpdate({ ...group, items: [...(group.items || []), newItem] });
  };

  const updateItem = (idx, updatedItem) => {
    const items = [...(group.items || [])];
    items[idx] = updatedItem;
    onUpdate({ ...group, items });
  };

  const deleteItem = (idx) => {
    const items = (group.items || []).filter((_, i) => i !== idx);
    onUpdate({ ...group, items });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
    >
      {/* Group Header */}
      <div className="flex items-center gap-3 p-3.5 bg-gray-50 border-b">
        <div className="flex flex-col gap-0.5">
          <button onClick={onMoveUp} disabled={isFirst} className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20">
            <FiChevronUp className="w-3.5 h-3.5" />
          </button>
          <button onClick={onMoveDown} disabled={isLast} className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20">
            <FiChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0 border border-indigo-200">
          {group.iconUrl ? (
            <img src={group.iconUrl} alt="" className="w-6 h-6 object-contain rounded" />
          ) : (
            <FiGrid className="w-4 h-4 text-indigo-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={group.title}
            onChange={e => onUpdate({ ...group, title: e.target.value })}
            placeholder="Group name (e.g. Haircut)"
            className="w-full text-sm font-bold text-gray-800 bg-transparent focus:outline-none"
          />
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-gray-400">{(group.items || []).length} items</span>
            <button
              onClick={() => onUpdate({ ...group, allowSkip: !group.allowSkip })}
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded transition-colors ${
                group.allowSkip !== false
                  ? 'bg-green-50 text-green-600 border border-green-100'
                  : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}
            >
              {group.allowSkip !== false ? '✓ Skip allowed' : '✗ Required'}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <input
            type="text"
            value={group.iconUrl || ''}
            onChange={e => onUpdate({ ...group, iconUrl: e.target.value })}
            placeholder="Icon URL"
            className="w-24 text-[10px] bg-white border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-300 hidden sm:block"
          />
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <motion.div animate={{ rotate: collapsed ? 0 : 180 }}>
              <FiChevronDown className="w-4 h-4 text-gray-400" />
            </motion.div>
          </button>
          <button onClick={onDelete} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
            <FiTrash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Items List */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-1.5">
              {(group.items || []).length === 0 ? (
                <div className="text-center py-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  <p className="text-xs text-gray-400 font-medium">No items yet. Add options for this group.</p>
                </div>
              ) : (
                (group.items || []).map((item, idx) => (
                  <GroupItemRow
                    key={item._id || idx}
                    item={item}
                    onUpdate={(updated) => updateItem(idx, updated)}
                    onDelete={() => deleteItem(idx)}
                  />
                ))
              )}
              <button
                onClick={addItem}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 border-2 border-dashed border-indigo-300 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                <FiPlus className="w-3 h-3" /> Add Item
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ════════════════════════════════════════════════════════════════════
// PACKAGE EDITOR MODAL (create/edit package with included items)
// ════════════════════════════════════════════════════════════════════
const PackageEditorModal = ({ pkg, serviceGroups, onSave, onClose }) => {
  const [form, setForm] = useState({
    title: pkg?.title || '',
    description: pkg?.description || '',
    price: pkg?.price || 0,
    originalPrice: pkg?.originalPrice || '',
    discountPercentage: pkg?.discountPercentage || 0,
    duration: pkg?.duration || '',
    rating: pkg?.rating ?? 4.5,
    reviewCount: pkg?.reviewCount || '1.0k',
    isPopular: pkg?.isPopular || false,
    isActive: pkg?.isActive !== false,
    gstPercentage: pkg?.gstPercentage ?? 18,
    gstIncluded: pkg?.gstIncluded !== false,
    vendorPayout: pkg?.vendorPayout || 0,
    platformCommission: pkg?.platformCommission ?? 20,
    includedItems: pkg?.includedItems || []
  });

  const matrix = calcPriceMatrix(form);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Toggle a service group in the package
  const toggleGroup = (group) => {
    const existing = form.includedItems.find(
      i => String(i.serviceGroupId) === String(group._id)
    );
    if (existing) {
      // Remove
      handleChange('includedItems', form.includedItems.filter(
        i => String(i.serviceGroupId) !== String(group._id)
      ));
    } else {
      // Add with first item as default
      const firstItem = (group.items || [])[0];
      handleChange('includedItems', [
        ...form.includedItems,
        {
          serviceGroupId: group._id,
          serviceGroupTitle: group.title,
          selectedItemId: firstItem?._id || null,
          selectedItemTitle: firstItem?.title || '',
          selectedItemDescription: firstItem?.description || firstItem?.title || ''
        }
      ]);
    }
  };

  // Change selected item within an included group
  const changeSelectedItem = (groupId, item) => {
    handleChange('includedItems', form.includedItems.map(inc =>
      String(inc.serviceGroupId) === String(groupId)
        ? {
            ...inc,
            selectedItemId: item._id,
            selectedItemTitle: item.title,
            selectedItemDescription: item.description || item.title
          }
        : inc
    ));
  };

  // Update description for an included item
  const updateItemDescription = (groupId, desc) => {
    handleChange('includedItems', form.includedItems.map(inc =>
      String(inc.serviceGroupId) === String(groupId)
        ? { ...inc, selectedItemDescription: desc }
        : inc
    ));
  };

  // Auto-calculate discount percentage when prices change
  const autoCalcDiscount = () => {
    if (form.originalPrice && form.price && Number(form.originalPrice) > Number(form.price)) {
      const disc = Math.round(((form.originalPrice - form.price) / form.originalPrice) * 100);
      handleChange('discountPercentage', disc);
    }
  };

  // Auto-generate title from included groups
  const autoTitle = () => {
    const title = form.includedItems.map(i => i.serviceGroupTitle).filter(Boolean).join(' + ');
    if (title) handleChange('title', title);
  };

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error('Package title is required');
      return;
    }
    if (!form.price || Number(form.price) <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }
    if (form.includedItems.length === 0) {
      toast.error('Select at least one service group');
      return;
    }
    onSave({
      ...form,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
      discountPercentage: Number(form.discountPercentage) || 0,
      vendorPayout: Number(form.vendorPayout) || 0,
      gstPercentage: Number(form.gstPercentage) || 18,
      platformCommission: Number(form.platformCommission) || 20,
      _id: pkg?._id || undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white px-5 py-4 border-b flex items-center justify-between z-10">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <FiPackage className="w-4 h-4 text-emerald-600" />
            {pkg?._id ? 'Edit Package' : 'Create Package'}
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <FiX className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* ── Step 1: Select Service Groups ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-600">1. Select Service Groups *</label>
              <button onClick={autoTitle} className="text-[10px] font-semibold text-indigo-600 hover:underline">
                Auto-generate title
              </button>
            </div>
            <div className="space-y-2">
              {serviceGroups.length === 0 ? (
                <p className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3 text-center">
                  No service groups found. Create groups first in the "Service Groups" tab.
                </p>
              ) : (
                serviceGroups.map(group => {
                  const isIncluded = form.includedItems.some(
                    i => String(i.serviceGroupId) === String(group._id)
                  );
                  const includedItem = form.includedItems.find(
                    i => String(i.serviceGroupId) === String(group._id)
                  );

                  return (
                    <div key={group._id} className={`border rounded-xl overflow-hidden transition-all ${
                      isIncluded ? 'border-emerald-300 bg-emerald-50/30' : 'border-gray-200'
                    }`}>
                      <button
                        onClick={() => toggleGroup(group)}
                        className="w-full flex items-center gap-3 p-3 text-left"
                      >
                        <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          isIncluded ? 'bg-emerald-600 border-emerald-600' : 'border-gray-300'
                        }`}>
                          {isIncluded && <FiCheck className="w-3 h-3 text-white" />}
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          {group.iconUrl
                            ? <img src={group.iconUrl} alt="" className="w-5 h-5 object-contain" />
                            : <FiGrid className="w-3.5 h-3.5 text-gray-500" />
                          }
                        </div>
                        <span className="flex-1 text-sm font-semibold text-gray-800">{group.title}</span>
                        <span className="text-[10px] text-gray-400">{(group.items || []).length} items</span>
                      </button>

                      {/* Show item options when included */}
                      {isIncluded && (group.items || []).length > 0 && (
                        <div className="px-3 pb-3 pt-0 space-y-1 ml-11">
                          {(group.items || []).map(item => (
                            <button
                              key={item._id}
                              onClick={() => changeSelectedItem(group._id, item)}
                              className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors ${
                                String(includedItem?.selectedItemId) === String(item._id)
                                  ? 'bg-emerald-100 text-emerald-800 font-bold'
                                  : 'bg-white text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                                  String(includedItem?.selectedItemId) === String(item._id)
                                    ? 'border-emerald-600' : 'border-gray-300'
                                }`}>
                                  {String(includedItem?.selectedItemId) === String(item._id) && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                  )}
                                </span>
                                {item.title}
                              </span>
                              <span className="font-bold">₹{item.price}</span>
                            </button>
                          ))}
                          {/* Description for package card */}
                          <input
                            type="text"
                            value={includedItem?.selectedItemDescription || ''}
                            onChange={e => updateItemDescription(group._id, e.target.value)}
                            placeholder="Brief description for package card"
                            className="w-full text-[11px] bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 mt-1 focus:outline-none focus:ring-1 focus:ring-emerald-300 text-gray-500"
                          />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Step 2: Package Details ── */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-600">2. Package Details</label>
            <input
              type="text"
              value={form.title}
              onChange={e => handleChange('title', e.target.value)}
              placeholder="Package title (e.g. Haircut + Beard grooming + Massage)"
              className="w-full px-3 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <textarea
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="Brief description (optional)"
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
            />
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-gray-500 mb-0.5 block">Duration</label>
                <input type="text" value={form.duration} onChange={e => handleChange('duration', e.target.value)}
                  placeholder="2-3 hrs" className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 mb-0.5 block">Rating</label>
                <input type="number" value={form.rating} onChange={e => handleChange('rating', e.target.value)}
                  step="0.1" min="0" max="5" className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-500 mb-0.5 block">Reviews</label>
                <input type="text" value={form.reviewCount} onChange={e => handleChange('reviewCount', e.target.value)}
                  placeholder="1.2k" className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none" />
              </div>
            </div>
          </div>

          {/* ── Step 3: Price Matrix ── */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
            <h4 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
              <FiDollarSign className="w-4 h-4" /> Price Matrix
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-gray-600 mb-0.5 block">Customer Price ₹ *</label>
                <input type="number" value={form.price}
                  onChange={e => handleChange('price', e.target.value)}
                  onBlur={autoCalcDiscount}
                  className="w-full px-2 py-1.5 text-sm font-bold border border-gray-200 rounded-lg focus:outline-none bg-white" min="0" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-600 mb-0.5 block">Original Price ₹</label>
                <input type="number" value={form.originalPrice}
                  onChange={e => handleChange('originalPrice', e.target.value)}
                  onBlur={autoCalcDiscount}
                  placeholder="MRP" className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white" min="0" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-600 mb-0.5 block">Discount %</label>
                <input type="number" value={form.discountPercentage}
                  onChange={e => handleChange('discountPercentage', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white" min="0" max="100" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-600 mb-0.5 block">GST %</label>
                <input type="number" value={form.gstPercentage}
                  onChange={e => handleChange('gstPercentage', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white" min="0" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-600 mb-0.5 block">Vendor Payout ₹</label>
                <input type="number" value={form.vendorPayout}
                  onChange={e => handleChange('vendorPayout', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white" min="0" />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-600 mb-0.5 block">Commission %</label>
                <input type="number" value={form.platformCommission}
                  onChange={e => handleChange('platformCommission', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none bg-white" min="0" />
              </div>
            </div>

            {/* Breakdown */}
            <div className="mt-3 pt-3 border-t border-emerald-200 grid grid-cols-2 gap-1.5 text-xs">
              <div className="flex justify-between bg-white/60 rounded-lg px-2.5 py-1.5">
                <span className="text-gray-500">Base:</span>
                <span className="font-bold text-gray-800">₹{matrix.basePrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between bg-white/60 rounded-lg px-2.5 py-1.5">
                <span className="text-gray-500">GST:</span>
                <span className="font-bold text-gray-800">₹{matrix.gstAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between bg-white/60 rounded-lg px-2.5 py-1.5">
                <span className="text-gray-500">Vendor:</span>
                <span className="font-bold text-blue-700">₹{(Number(form.vendorPayout) || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between bg-white/60 rounded-lg px-2.5 py-1.5">
                <span className="text-gray-500">Platform:</span>
                <span className="font-bold text-emerald-700">₹{matrix.platformEarning.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex justify-between bg-emerald-600 text-white rounded-lg px-3 py-2 mt-2 text-sm">
              <span className="font-semibold">Final Price:</span>
              <span className="font-extrabold">₹{matrix.finalPrice.toLocaleString()}</span>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex gap-3">
            <button type="button" onClick={() => handleChange('isPopular', !form.isPopular)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border transition-all ${
                form.isPopular ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-gray-50 text-gray-500 border-gray-200'
              }`}
            >
              <FiStar className="w-3.5 h-3.5" /> {form.isPopular ? 'Popular ✓' : 'Mark Popular'}
            </button>
            <button type="button" onClick={() => handleChange('isActive', !form.isActive)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold border transition-all ${
                form.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-500 border-red-200'
              }`}
            >
              {form.isActive ? <FiEye className="w-3.5 h-3.5" /> : <FiEyeOff className="w-3.5 h-3.5" />}
              {form.isActive ? 'Active' : 'Inactive'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white px-5 py-4 border-t flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSubmit}
            className="flex-1 py-2.5 bg-emerald-600 rounded-xl text-sm font-semibold text-white hover:bg-emerald-700 flex items-center justify-center gap-2">
            <FiCheck className="w-4 h-4" /> {pkg?._id ? 'Update' : 'Create'} Package
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
// PACKAGE CARD (display in packages list)
// ════════════════════════════════════════════════════════════════════
const PackageCard = ({ pkg, onEdit, onDelete }) => {
  const matrix = calcPriceMatrix(pkg);
  return (
    <div className={`border rounded-2xl p-4 transition-all ${
      pkg.isActive !== false ? 'border-gray-200 bg-white' : 'border-red-100 bg-red-50/30 opacity-60'
    } ${pkg.isPopular ? 'ring-1 ring-amber-300 border-amber-200' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {pkg.discountPercentage > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full mb-1.5">
              🏷️ {pkg.discountPercentage}% off
            </span>
          )}
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-gray-800">{pkg.title}</h4>
            {pkg.isPopular && (
              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">⭐ Popular</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">★ {pkg.rating || 4.5}</span>
            <span className="text-[10px] text-gray-400">({pkg.reviewCount || '1.0k'} reviews)</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-extrabold text-gray-800">₹{Number(pkg.price).toLocaleString()}</span>
            {pkg.originalPrice && Number(pkg.originalPrice) > Number(pkg.price) && (
              <span className="text-xs line-through text-gray-400">₹{Number(pkg.originalPrice).toLocaleString()}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onEdit} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors">
            <FiEdit2 className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors">
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Included items breakdown */}
      {(pkg.includedItems || []).length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
          {pkg.includedItems.map((item, idx) => (
            <div key={idx} className="text-xs text-gray-500">
              <span className="font-bold text-gray-700">{item.serviceGroupTitle}:</span>{' '}
              {item.selectedItemDescription || item.selectedItemTitle}
            </div>
          ))}
        </div>
      )}

      {/* Price Matrix Mini */}
      <div className="mt-3 grid grid-cols-4 gap-1.5">
        <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center">
          <div className="text-[9px] text-gray-400">Base</div>
          <div className="text-[11px] font-bold text-gray-700">₹{matrix.basePrice.toLocaleString()}</div>
        </div>
        <div className="bg-gray-50 rounded-lg px-2 py-1.5 text-center">
          <div className="text-[9px] text-gray-400">GST</div>
          <div className="text-[11px] font-bold text-gray-600">₹{matrix.gstAmount.toLocaleString()}</div>
        </div>
        <div className="bg-blue-50 rounded-lg px-2 py-1.5 text-center">
          <div className="text-[9px] text-blue-400">Vendor</div>
          <div className="text-[11px] font-bold text-blue-700">₹{(Number(pkg.vendorPayout) || 0).toLocaleString()}</div>
        </div>
        <div className="bg-emerald-50 rounded-lg px-2 py-1.5 text-center">
          <div className="text-[9px] text-emerald-400">Platform</div>
          <div className="text-[11px] font-bold text-emerald-700">₹{matrix.platformEarning.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
// SERVICE DETAIL VIEW (Service Groups + Packages tabs)
// ════════════════════════════════════════════════════════════════════
const ServiceDetailView = ({ service, onBack, onRefresh }) => {
  const [activeTab, setActiveTab] = useState('groups'); // 'groups' | 'packages'
  const [serviceGroups, setServiceGroups] = useState(service.serviceGroups || []);
  const [packages, setPackages] = useState(service.packages || []);
  const [saving, setSaving] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null); // null | 'new' | package object
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Save service groups
  const saveGroups = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/admin/services/${service._id}`, { serviceGroups });
      if (res.data.success) {
        toast.success('Service Groups saved!');
        setHasUnsavedChanges(false);
        onRefresh();
      }
    } catch (err) {
      toast.error('Failed to save groups');
    } finally {
      setSaving(false);
    }
  };

  // Save packages
  const savePackages = async (updatedPkgs) => {
    setSaving(true);
    try {
      const res = await api.put(`/admin/services/${service._id}`, { packages: updatedPkgs });
      if (res.data.success) {
        toast.success('Packages saved!');
        setPackages(updatedPkgs);
        onRefresh();
      }
    } catch (err) {
      toast.error('Failed to save packages');
    } finally {
      setSaving(false);
    }
  };

  const addGroup = () => {
    const newGroup = {
      title: '',
      iconUrl: '',
      order: serviceGroups.length,
      items: [],
      allowSkip: true
    };
    const updated = [...serviceGroups, newGroup];
    setServiceGroups(updated);
    setHasUnsavedChanges(true);
  };

  const updateGroup = (idx, updated) => {
    const groups = [...serviceGroups];
    groups[idx] = updated;
    setServiceGroups(groups);
    setHasUnsavedChanges(true);
  };

  const deleteGroup = (idx) => {
    if (!window.confirm('Delete this service group and all its items?')) return;
    setServiceGroups(serviceGroups.filter((_, i) => i !== idx));
    setHasUnsavedChanges(true);
  };

  const moveGroup = (idx, direction) => {
    const arr = [...serviceGroups];
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= arr.length) return;
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    arr.forEach((g, i) => g.order = i);
    setServiceGroups(arr);
    setHasUnsavedChanges(true);
  };

  const handleSavePackage = (pkgData) => {
    let updated;
    if (pkgData._id) {
      updated = packages.map(p => p._id === pkgData._id ? { ...p, ...pkgData } : p);
    } else {
      const { _tempId, ...cleanPkg } = pkgData;
      updated = [...packages, cleanPkg];
    }
    savePackages(updated);
    setEditingPkg(null);
  };

  const handleDeletePackage = (pkgId) => {
    if (!window.confirm('Delete this package?')) return;
    const updated = packages.filter(p => p._id !== pkgId);
    savePackages(updated);
  };

  const categoryName = service.categoryId?.title || 'Uncategorized';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200">
            <FiArrowLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
            {service.iconUrl
              ? <img src={service.iconUrl} alt="" className="w-6 h-6 object-contain rounded" />
              : <FiPackage className="w-5 h-5 text-white" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-800 truncate">{service.title}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">{categoryName}</span>
              <span className="text-[10px] text-gray-400">{serviceGroups.length} groups · {packages.length} packages</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm flex gap-1">
        {[
          { id: 'groups', label: 'Service Groups', icon: FiLayers, count: serviceGroups.length },
          { id: 'packages', label: 'Packages', icon: FiPackage, count: packages.length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/15'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'groups' ? (
          <motion.div key="groups" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {serviceGroups.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <FiLayers className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-500">No service groups yet</p>
                <p className="text-xs text-gray-400 mt-1">Add groups like "Haircut", "Face care", "Massage" etc.</p>
              </div>
            ) : (
              serviceGroups.map((group, idx) => (
                <ServiceGroupCard
                  key={group._id || idx}
                  group={group}
                  index={idx}
                  onUpdate={(updated) => updateGroup(idx, updated)}
                  onDelete={() => deleteGroup(idx)}
                  onMoveUp={() => moveGroup(idx, 'up')}
                  onMoveDown={() => moveGroup(idx, 'down')}
                  isFirst={idx === 0}
                  isLast={idx === serviceGroups.length - 1}
                />
              ))
            )}

            <div className="flex gap-3">
              <button onClick={addGroup}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border-2 border-dashed border-indigo-300 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors">
                <FiPlus className="w-3.5 h-3.5" /> Add Service Group
              </button>
              <button onClick={saveGroups} disabled={saving || !hasUnsavedChanges}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white transition-colors ${
                  hasUnsavedChanges ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-300 cursor-not-allowed'
                }`}>
                <FiSave className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Groups'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="packages" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {packages.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                <FiPackage className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-500">No packages yet</p>
                <p className="text-xs text-gray-400 mt-1">Create combo packages like "Haircut + Beard grooming + Massage"</p>
              </div>
            ) : (
              packages.map((pkg, idx) => (
                <PackageCard
                  key={pkg._id || idx}
                  pkg={pkg}
                  onEdit={() => setEditingPkg(pkg)}
                  onDelete={() => handleDeletePackage(pkg._id)}
                />
              ))
            )}

            <button onClick={() => setEditingPkg('new')}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 border-2 border-dashed border-emerald-300 rounded-xl text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors">
              <FiPlus className="w-3.5 h-3.5" /> Create Package
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Package Editor Modal */}
      {editingPkg && (
        <PackageEditorModal
          pkg={editingPkg === 'new' ? null : editingPkg}
          serviceGroups={serviceGroups}
          onSave={handleSavePackage}
          onClose={() => setEditingPkg(null)}
        />
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════
// MAIN PAGE — Services List
// ════════════════════════════════════════════════════════════════════
const PackageBased = () => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedService, setSelectedService] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [srvRes, catRes] = await Promise.all([
        api.get('/admin/services'),
        api.get('/admin/categories')
      ]);
      const allServices = srvRes.data.services || [];
      const packageServices = allServices.filter(s => s.serviceType === 'package_base');
      setServices(packageServices);
      setCategories(catRes.data.categories || catRes.data.data || []);

      // If we had a selected service, refresh its data
      if (selectedService) {
        const refreshed = packageServices.find(s => s._id === selectedService._id);
        if (refreshed) setSelectedService(refreshed);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  }, [selectedService?._id]);

  useEffect(() => { fetchData(); }, []);

  const filtered = services.filter(s => {
    const matchSearch = !search || s.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCategory || (s.categoryId?._id || s.categoryId) === filterCategory;
    return matchSearch && matchCat;
  });

  const totalPackages = services.reduce((sum, s) => sum + (s.packages?.length || 0), 0);
  const totalGroups = services.reduce((sum, s) => sum + (s.serviceGroups?.length || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-medium">Loading services...</p>
        </div>
      </div>
    );
  }

  // If a service is selected, show its detail view
  if (selectedService) {
    return (
      <ServiceDetailView
        service={selectedService}
        onBack={() => setSelectedService(null)}
        onRefresh={fetchData}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 rounded-2xl p-5 text-white shadow-lg shadow-emerald-500/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold flex items-center gap-2">
              <FiPackage className="w-5 h-5" /> Package Based Services
            </h1>
            <p className="text-xs text-emerald-100 mt-1">Manage salon-style service groups and combo packages</p>
          </div>
          <button onClick={fetchData} className="p-2.5 bg-white/15 hover:bg-white/25 rounded-xl transition-colors" title="Refresh">
            <FiRefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2">
            <div className="text-[10px] text-emerald-200 font-medium">Services</div>
            <div className="text-lg font-extrabold">{services.length}</div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2">
            <div className="text-[10px] text-emerald-200 font-medium">Service Groups</div>
            <div className="text-lg font-extrabold">{totalGroups}</div>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2">
            <div className="text-[10px] text-emerald-200 font-medium">Packages</div>
            <div className="text-lg font-extrabold">{totalPackages}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
          <FiSearch className="w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search services..." className="flex-1 bg-transparent text-sm focus:outline-none" />
        </div>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
          className="bg-gray-50 border border-gray-200 text-gray-700 text-xs rounded-xl px-3 py-2.5 focus:outline-none font-semibold">
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat._id || cat.id} value={cat._id || cat.id}>{cat.title || cat.name}</option>
          ))}
        </select>
      </div>

      {/* Services Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <FiPackage className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-500">No package-based services found</p>
          <p className="text-xs text-gray-400 mt-1">Create services with type "package_base" from Management section</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(service => {
            const groups = service.serviceGroups || [];
            const pkgs = service.packages || [];
            const catName = service.categoryId?.title || 'Uncategorized';
            return (
              <motion.div
                key={service._id}
                whileHover={{ scale: 1.005 }}
                onClick={() => setSelectedService(service)}
                className="bg-white border border-gray-100 rounded-2xl p-4 cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                    {service.iconUrl
                      ? <img src={service.iconUrl} alt="" className="w-7 h-7 object-contain rounded" />
                      : <FiPackage className="w-5 h-5 text-white" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-800 truncate">{service.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">{catName}</span>
                      <span className="text-[10px] text-gray-400">{groups.length} groups</span>
                      <span className="text-[10px] text-gray-400">·</span>
                      <span className="text-[10px] text-gray-400">{pkgs.length} packages</span>
                    </div>
                  </div>
                  <FiChevronDown className="w-4 h-4 text-gray-300 -rotate-90 flex-shrink-0" />
                </div>

                {/* Groups preview */}
                {groups.length > 0 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {groups.map((g, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5 flex-shrink-0 border border-gray-100">
                        <div className="w-5 h-5 rounded bg-white flex items-center justify-center">
                          {g.iconUrl
                            ? <img src={g.iconUrl} alt="" className="w-4 h-4 object-contain" />
                            : <FiGrid className="w-3 h-3 text-gray-400" />
                          }
                        </div>
                        <span className="text-[10px] font-semibold text-gray-600">{g.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PackageBased;
