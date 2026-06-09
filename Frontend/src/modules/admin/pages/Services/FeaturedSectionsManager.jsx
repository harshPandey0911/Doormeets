import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiTrash2, FiEye, FiEyeOff, FiSave, FiChevronUp,
  FiChevronDown, FiSearch, FiCheck, FiStar, FiGrid, FiTag
} from 'react-icons/fi';
import { homeContentService } from '../../../../services/catalogService';
import toast from 'react-hot-toast';

// ─── Empty Section Template ──────────────────────────────────────────────────
const newSectionTemplate = () => ({
  _tempId: `temp-${Date.now()}`,
  sectionTitle: 'Top Brands',
  type: 'brand',
  isVisible: true,
  order: 0,
  items: []
});

// ─── Item Picker Modal ───────────────────────────────────────────────────────
const ItemPickerModal = ({ type, selectedIds, onClose, onSave }) => {
  const [search, setSearch] = useState('');
  const [availableItems, setAvailableItems] = useState([]);
  const [picked, setPicked] = useState(new Set(selectedIds));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    homeContentService.getAvailableItems(type).then(res => {
      if (res.success) setAvailableItems(res.items);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [type]);

  const filtered = availableItems.filter(item =>
    item.title.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id) => {
    setPicked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col"
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-800">
            Select {type === 'brand' ? 'Brands' : 'Categories'}
          </h3>
          <span className="text-xs text-gray-500">{picked.size} selected</span>
        </div>

        <div className="p-3 border-b">
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
            <FiSearch className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search..."
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No items found</div>
          ) : filtered.map(item => (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${
                picked.has(item.id) ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-gray-50'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {item.iconUrl
                  ? <img src={item.iconUrl} alt={item.title} className="w-7 h-7 object-contain" />
                  : <span className="text-sm font-bold text-gray-500">{item.title[0]}</span>
                }
              </div>
              <span className="flex-1 text-sm font-medium text-gray-700">{item.title}</span>
              {picked.has(item.id) && (
                <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                  <FiCheck className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave([...picked])}
            className="flex-1 py-2.5 bg-indigo-600 rounded-xl text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Apply ({picked.size})
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ─── Single Section Card ─────────────────────────────────────────────────────
const SectionCard = ({ section, index, total, availableItemsCache, onUpdate, onDelete, onMove }) => {
  const [pickerOpen, setPickerOpen] = useState(false);

  const selectedIds = section.items.map(i => i.refId);

  const handlePickerSave = (ids) => {
    // Merge: preserve existing orders, add new items
    const existingMap = new Map(section.items.map(i => [i.refId, i.order]));
    const newItems = ids.map((id, idx) => ({
      refId: id,
      order: existingMap.has(id) ? existingMap.get(id) : idx
    }));
    onUpdate({ items: newItems });
    setPickerOpen(false);
  };

  const updateItemOrder = (refId, newOrder) => {
    let order = parseInt(newOrder) || 0;
    if (order < 0) order = 0;
    onUpdate({
      items: section.items.map(i =>
        i.refId === refId ? { ...i, order } : i
      )
    });
  };

  const removeItem = (refId) => {
    onUpdate({ items: section.items.filter(i => i.refId !== refId) });
  };

  // Sort items by order for display
  const sortedItems = [...section.items].sort((a, b) => a.order - b.order);

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm"
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b bg-gray-50">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => onMove(index, 'up')}
              disabled={index === 0}
              className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"
            >
              <FiChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => onMove(index, 'down')}
              disabled={index === total - 1}
              className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"
            >
              <FiChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 space-y-2">
            <input
              type="text"
              value={section.sectionTitle}
              onChange={e => onUpdate({ sectionTitle: e.target.value })}
              className="w-full text-sm font-semibold bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              placeholder="Section title..."
            />
            <div className="flex items-center gap-2">
              <select
                value={section.type}
                onChange={e => onUpdate({ type: e.target.value, items: [] })}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              >
                <option value="brand">Brands</option>
                <option value="category">Categories</option>
              </select>
              <span className="text-xs text-gray-400">Order:</span>
              <input
                type="number"
                min="0"
                value={section.order}
                onChange={e => onUpdate({ order: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-14 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-center"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdate({ isVisible: !section.isVisible })}
              className={`p-2 rounded-xl transition-colors ${
                section.isVisible ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-100'
              }`}
              title={section.isVisible ? 'Visible' : 'Hidden'}
            >
              {section.isVisible ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />}
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-red-500 bg-red-50 rounded-xl hover:bg-red-100"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="p-4">
          {sortedItems.length === 0 ? (
            <div className="text-center py-4 text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
              No {section.type === 'brand' ? 'brands' : 'categories'} selected yet
            </div>
          ) : (
            <div className="space-y-2 mb-3">
              {sortedItems.map(item => {
                const meta = availableItemsCache[item.refId];
                return (
                  <div
                    key={item.refId}
                    className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2"
                  >
                    <div className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {meta?.iconUrl
                        ? <img src={meta.iconUrl} alt={meta.title} className="w-5 h-5 object-contain" />
                        : <span className="text-xs font-bold text-gray-400">{meta?.title?.[0] || '?'}</span>
                      }
                    </div>
                    <span className="flex-1 text-xs font-medium text-gray-700 truncate">
                      {meta?.title || item.refId}
                    </span>
                    <span className="text-xs text-gray-400">Pos:</span>
                    <input
                      type="number"
                      min="0"
                      value={item.order}
                      onChange={e => updateItemOrder(item.refId, e.target.value)}
                      className="w-12 text-xs border border-gray-200 rounded-lg px-2 py-1 text-center focus:outline-none"
                    />
                    <button
                      onClick={() => removeItem(item.refId)}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <FiTrash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={() => setPickerOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 border-2 border-dashed border-indigo-300 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <FiPlus className="w-3.5 h-3.5" />
            Select {section.type === 'brand' ? 'Brands' : 'Categories'}
          </button>
        </div>
      </motion.div>

      {pickerOpen && (
        <ItemPickerModal
          type={section.type}
          selectedIds={selectedIds}
          onClose={() => setPickerOpen(false)}
          onSave={handlePickerSave}
        />
      )}
    </>
  );
};

// ─── Main Manager Component ──────────────────────────────────────────────────
const FeaturedSectionsManager = ({ cityId }) => {
  const [sections, setSections] = useState([]);
  const [isFeaturedSectionsVisible, setIsFeaturedSectionsVisible] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  // Cache for item metadata (id -> { title, iconUrl })
  const [itemCache, setItemCache] = useState({});

  // Load existing featured sections
  useEffect(() => {
    homeContentService.get({ cityId }).then(res => {
      if (res.success) {
        const fs = res.homeContent.featuredSections || [];
        setSections(fs.map((s, i) => ({ ...s, _tempId: s._id || `loaded-${i}` })));
        setIsFeaturedSectionsVisible(res.homeContent.isFeaturedSectionsVisible ?? true);

        // Build cache from populated items
        const cache = {};
        fs.forEach(sec => {
          (sec.items || []).forEach(item => {
            if (item.refId && item.title) {
              cache[item.refId] = { title: item.title, iconUrl: item.iconUrl || '' };
            }
          });
        });
        setItemCache(cache);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [cityId]);

  // Refresh cache when items change
  const refreshCacheForType = useCallback(async (type) => {
    const res = await homeContentService.getAvailableItems(type);
    if (res.success) {
      const newCache = {};
      res.items.forEach(item => {
        newCache[item.id] = { title: item.title, iconUrl: item.iconUrl || '' };
      });
      setItemCache(prev => ({ ...prev, ...newCache }));
    }
  }, []);

  const addSection = () => {
    const tmpl = newSectionTemplate();
    tmpl.order = sections.length;
    setSections(prev => [...prev, tmpl]);
    refreshCacheForType('brand');
  };

  const updateSection = (tempId, changes) => {
    setSections(prev => prev.map(s =>
      s._tempId === tempId ? { ...s, ...changes } : s
    ));
    if (changes.type) refreshCacheForType(changes.type);
  };

  const deleteSection = (tempId) => {
    setSections(prev => prev.filter(s => s._tempId !== tempId));
  };

  const moveSection = (index, direction) => {
    setSections(prev => {
      const arr = [...prev];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= arr.length) return arr;
      [arr[index], arr[newIndex]] = [arr[newIndex], arr[index]];
      // Recompute order based on position
      return arr.map((s, i) => ({ ...s, order: i }));
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        isFeaturedSectionsVisible,
        featuredSections: sections.map((s, i) => ({
          sectionTitle: s.sectionTitle,
          type: s.type,
          isVisible: s.isVisible,
          order: s.order !== undefined ? s.order : i,
          items: s.items
        }))
      };
      const res = await homeContentService.update(payload, { cityId });
      if (res.success) {
        toast.success('Featured sections saved!');
      } else {
        toast.error('Save failed');
      }
    } catch {
      toast.error('Error saving sections');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <FiStar className="w-4 h-4 text-indigo-500" />
              Featured Sections
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              "Order Again" ke niche brands/categories sections manage karo
            </p>
          </div>
          <button
            onClick={() => setIsFeaturedSectionsVisible(v => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              isFeaturedSectionsVisible
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-gray-100 text-gray-500 border border-gray-200'
            }`}
          >
            {isFeaturedSectionsVisible ? <FiEye className="w-4 h-4" /> : <FiEyeOff className="w-4 h-4" />}
            {isFeaturedSectionsVisible ? 'All Visible' : 'All Hidden'}
          </button>
        </div>
      </div>

      {/* Sections List */}
      <AnimatePresence>
        {sections.map((section, index) => (
          <SectionCard
            key={section._tempId}
            section={section}
            index={index}
            total={sections.length}
            availableItemsCache={itemCache}
            onUpdate={(changes) => updateSection(section._tempId, changes)}
            onDelete={() => deleteSection(section._tempId)}
            onMove={(i, dir) => moveSection(i, dir)}
          />
        ))}
      </AnimatePresence>

      {sections.length === 0 && (
        <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <FiGrid className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm font-medium">No sections yet</p>
          <p className="text-xs mt-1">Add a section below to get started</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={addSection}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 border-2 border-dashed border-indigo-300 rounded-xl text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <FiPlus className="w-3.5 h-3.5" />
          Add Section
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 rounded-xl text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          <FiSave className="w-3.5 h-3.5" />
          {saving ? 'Saving...' : 'Save All'}
        </button>
      </div>
    </div>
  );
};

export default FeaturedSectionsManager;
