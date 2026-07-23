import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPackage, FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiChevronDown,
  FiChevronUp, FiStar, FiSearch, FiDollarSign, FiPercent, FiCheck,
  FiClock, FiGrid, FiEye, FiRefreshCw, FiImage, FiLayers, FiList,
  FiArrowLeft, FiEyeOff, FiFolder, FiPlusCircle, FiChevronRight
} from 'react-icons/fi';
import api from '../../../../services/api';
import toast from 'react-hot-toast';
import { serviceService } from '../../../../services/catalogService';

// Price Matrix Calculator
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

const PackageBased = () => {
  // Main Navigation Tabs: 'main_cats' | 'sub_cats' | 'packages' | 'combos'
  const [activeTab, setActiveTab] = useState('main_cats');
  const [loading, setLoading] = useState(true);

  // Core Data Lists
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [services, setServices] = useState([]);

  // Selections
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState('');
  const [selectedSubCategoryIds, setSelectedSubCategoryIds] = useState([]);

  // Modals & Editors state
  const [editingMainCat, setEditingMainCat] = useState(null); // null | 'new' | category object
  const [editingSubCat, setEditingSubCat] = useState(null);   // null | 'new' | subcategory object
  const [editingServiceGroup, setEditingServiceGroup] = useState(null); // null | 'new' | group object
  const [editingCombo, setEditingCombo] = useState(null);     // null | 'new' | combo object

  // Form states
  const [mainCatForm, setMainCatForm] = useState({ title: '', status: 'active', homeIconUrl: '', homeBadge: '', sacCode: '', minWalletBalance: 0 });
  const [subCatForm, setSubCatForm] = useState({ categoryId: '', title: '', description: '', iconUrl: '', imageUrl: '', videoUrl: '', status: 'active' });
  const [comboForm, setComboForm] = useState({ title: '', description: '', price: '', originalPrice: '', discountPercentage: 0, duration: '', rating: 4.5, reviewCount: '1.0k', isPopular: false, isActive: true, includedItems: [], gstPercentage: 18, gstIncluded: true, vendorPayout: 0, allowUserEdit: true, codEnabled: true, codAdvanceAmount: 0 });

  // Media upload progress states
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, subRes, srvRes] = await Promise.all([
        api.get('/admin/categories'),
        api.get('/admin/subcategories'),
        api.get('/admin/services')
      ]);
      const allCats = catRes.data.categories || catRes.data.data || [];
      const packageCats = allCats.filter(cat => cat.templateId === '6a28fb25c692d0d224c480e2');
      setCategories(packageCats);

      const allSubCats = subRes.data.data || subRes.data.subCategories || [];
      const packageSubCats = allSubCats.filter(sub => {
        const parentId = sub.categoryId?._id || sub.categoryId;
        return packageCats.some(cat => String(cat.id || cat._id) === String(parentId));
      });
      setSubCategories(packageSubCats);
      
      const allServices = srvRes.data.services || [];
      const packageServices = allServices.filter(s => s.serviceType === 'package_base');
      setServices(packageServices);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to sync details');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Resolve current active Service from selected subcategory
  const activeService = useMemo(() => {
    if (!selectedSubCategoryId) return null;
    return services.find(s => String(s.subCategoryId?._id || s.subCategoryId) === String(selectedSubCategoryId));
  }, [services, selectedSubCategoryId]);

  // Filter Subcategories by Main Category (using SearchQuery if applicable)
  const filteredSubCategories = useMemo(() => {
    return subCategories.filter(s => {
      const matchesSearch = !searchQuery || s.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [subCategories, searchQuery]);

  // Handle Main Category Actions
  const handleOpenMainCat = (cat = null) => {
    if (cat) {
      setMainCatForm({
        _id: cat._id || cat.id,
        title: cat.title,
        status: cat.status || 'active',
        homeIconUrl: cat.homeIconUrl || '',
        homeBadge: cat.homeBadge || '',
        sacCode: cat.sacCode || '',
        minWalletBalance: cat.minWalletBalance || 0
      });
    } else {
      setMainCatForm({ title: '', status: 'active', homeIconUrl: '', homeBadge: '', sacCode: '', minWalletBalance: 0 });
    }
    setEditingMainCat(cat || 'new');
  };

  const handleSaveMainCat = async (e) => {
    e.preventDefault();
    try {
      if (mainCatForm._id) {
        await api.put(`/admin/categories/${mainCatForm._id}`, mainCatForm);
        toast.success('Main category updated!');
      } else {
        await api.post('/admin/categories', { ...mainCatForm, templateId: '6a28fb25c692d0d224c480e2' }); // Set to Page Template by default
        toast.success('Main category created!');
      }
      setEditingMainCat(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save Main Category');
    }
  };

  const handleDeleteMainCat = async (id) => {
    if (!window.confirm('Delete this main category?')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      toast.success('Deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete category');
    }
  };

  // Handle SubCategory (Category Level 2) Actions
  const handleOpenSubCat = (sub = null) => {
    if (sub) {
      setSubCatForm({
        _id: sub._id,
        categoryId: sub.categoryId?._id || sub.categoryId || '',
        title: sub.title,
        description: sub.description || '',
        iconUrl: sub.iconUrl || '',
        imageUrl: sub.imageUrl || '',
        videoUrl: sub.videoUrl || '',
        status: sub.status || 'active'
      });
    } else {
      const defaultCat = categories[0]?._id || '';
      setSubCatForm({ categoryId: defaultCat, title: '', description: '', iconUrl: '', imageUrl: '', videoUrl: '', status: 'active' });
    }
    setEditingSubCat(sub || 'new');
  };

  const handleSaveSubCat = async (e) => {
    e.preventDefault();
    try {
      if (subCatForm._id) {
        await api.put(`/admin/subcategories/${subCatForm._id}`, subCatForm);
        toast.success('Category updated successfully!');
      } else {
        await api.post('/admin/subcategories', subCatForm);
        toast.success('Category created successfully!');
      }
      setEditingSubCat(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save Category');
    }
  };

  const handleDeleteSubCat = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await api.delete(`/admin/subcategories/${id}`);
      toast.success('Deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete category');
    }
  };

  // Helper to upload media to Cloudinary
  const handleMediaUpload = async (file, type) => {
    const folder = `Doormeets/categories/${type}`;
    if (type === 'icon' || type === 'main_icon' || type === 'group_icon') setUploadingIcon(true);
    if (type === 'image') setUploadingImage(true);
    if (type === 'video') setUploadingVideo(true);

    try {
      const response = await serviceService.uploadImage(file, folder);
      if (response.success && response.imageUrl) {
        if (type === 'icon') setSubCatForm(p => ({ ...p, iconUrl: response.imageUrl }));
        if (type === 'image') setSubCatForm(p => ({ ...p, imageUrl: response.imageUrl }));
        if (type === 'video') setSubCatForm(p => ({ ...p, videoUrl: response.imageUrl }));
        if (type === 'main_icon') setMainCatForm(p => ({ ...p, homeIconUrl: response.imageUrl }));
        if (type === 'group_icon') setGroupForm(p => ({ ...p, iconUrl: response.imageUrl }));
        toast.success('File uploaded successfully');
      } else {
        toast.error('Upload failed');
      }
    } catch (error) {
      toast.error('Upload error');
    } finally {
      setUploadingIcon(false);
      setUploadingImage(false);
      setUploadingVideo(false);
    }
  };

  // Helper to upload image for a specific group item by index
  const [uploadingItemImageIdx, setUploadingItemImageIdx] = useState(null);
  const handleItemImageUpload = async (file, itemIdx) => {
    setUploadingItemImageIdx(itemIdx);
    try {
      const response = await serviceService.uploadImage(file, 'Doormeets/item_images');
      if (response.success && response.imageUrl) {
        handleUpdateItemInGroup(itemIdx, 'imageUrl', response.imageUrl);
        toast.success('Item image uploaded!');
      } else {
        toast.error('Upload failed');
      }
    } catch (error) {
      toast.error('Upload error');
    } finally {
      setUploadingItemImageIdx(null);
    }
  };


  // Initialize service under subcategory
  const handleInitializeService = async () => {
    if (!selectedSubCategoryId) return;
    try {
      const sub = subCategories.find(s => s._id === selectedSubCategoryId);
      if (!sub) return;
      
      const res = await api.post('/admin/services', {
        categoryId: sub.categoryId?._id || sub.categoryId,
        subCategoryId: sub._id,
        title: sub.title,
        serviceType: 'package_base',
        status: 'active'
      });
      if (res.data.success) {
        toast.success('Service Packages initialized successfully!');
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to initialize packages');
    }
  };

  // Service Group Management (Packages)
  const [groupForm, setGroupForm] = useState({ title: '', iconUrl: '', items: [], allowSkip: true });
  const [editingGroupIdx, setEditingGroupIdx] = useState(null);

  const handleOpenGroup = (idx = null) => {
    if (!activeService) return;
    if (idx !== null) {
      const group = activeService.serviceGroups[idx];
      setGroupForm({
        title: group.title,
        iconUrl: group.iconUrl || '',
        items: group.items || [],
        allowSkip: group.allowSkip !== false
      });
      setEditingGroupIdx(idx);
    } else {
      setGroupForm({ title: '', iconUrl: '', items: [], allowSkip: true });
      setEditingGroupIdx('new');
    }
    setEditingServiceGroup(true);
  };

  const handleSaveGroup = async (e) => {
    e.preventDefault();
    if (!groupForm.title.trim()) {
      toast.error('Group title is required');
      return;
    }

    // Validation: Vendor payout cannot exceed customer price
    for (let item of groupForm.items) {
      if (Number(item.vendorPayout || 0) > Number(item.price || 0)) {
        toast.error(`Vendor Payout (₹${item.vendorPayout}) cannot be greater than Customer Price (₹${item.price}) for item "${item.title}"`);
        return;
      }
    }

    const updatedGroups = [...(activeService.serviceGroups || [])];
    if (editingGroupIdx === 'new') {
      updatedGroups.push({ ...groupForm, order: updatedGroups.length });
    } else {
      updatedGroups[editingGroupIdx] = { ...updatedGroups[editingGroupIdx], ...groupForm };
    }

    try {
      const res = await api.put(`/admin/services/${activeService._id}`, { serviceGroups: updatedGroups });
      if (res.data.success) {
        toast.success('Options saved!');
        setEditingServiceGroup(false);
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to save service group');
    }
  };

  const handleDeleteGroup = async (idx) => {
    if (!window.confirm('Delete this service group and all its option items?')) return;
    const updatedGroups = activeService.serviceGroups.filter((_, i) => i !== idx);
    try {
      const res = await api.put(`/admin/services/${activeService._id}`, { serviceGroups: updatedGroups });
      if (res.data.success) {
        toast.success('Deleted successfully');
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to delete group');
    }
  };

  const handleAddItemToGroup = () => {
    setGroupForm(p => ({
      ...p,
      items: [...p.items, { title: '', price: 0, vendorPayout: 0, description: '', duration: '', imageUrl: '' }]
    }));
  };

  const handleUpdateItemInGroup = (idx, key, val) => {
    const list = [...groupForm.items];
    list[idx] = { ...list[idx], [key]: val };
    setGroupForm(p => ({ ...p, items: list }));
  };

  const handleRemoveItemFromGroup = (idx) => {
    setGroupForm(p => ({
      ...p,
      items: p.items.filter((_, i) => i !== idx)
    }));
  };

  // Combo Packages (Package Groups)
  const handleOpenCombo = (combo = null) => {
    if (combo) {
      // Find all subcategories where this combo is currently associated
      const associatedSubCatIds = [];
      services.forEach(srv => {
        if (srv.packages?.some(p => String(p._id) === String(combo._id))) {
          const subId = srv.subCategoryId?._id || srv.subCategoryId;
          if (subId) associatedSubCatIds.push(String(subId));
        }
      });

      setComboForm({
        _id: combo._id,
        title: combo.title,
        description: combo.description || '',
        price: combo.price,
        originalPrice: combo.originalPrice || '',
        discountPercentage: combo.discountPercentage || 0,
        duration: combo.duration || '',
        rating: combo.rating || 4.5,
        reviewCount: combo.reviewCount || '1.0k',
        isPopular: combo.isPopular || false,
        isActive: combo.isActive !== false,
        includedItems: combo.includedItems || [],
        gstPercentage: combo.gstPercentage ?? 18,
        gstIncluded: combo.gstIncluded !== false,
        vendorPayout: combo.vendorPayout || 0,
        allowUserEdit: combo.allowUserEdit !== false,
        codEnabled: combo.codEnabled !== false,
        codAdvanceAmount: combo.codAdvanceAmount || 0,
        targetSubCategoryIds: associatedSubCatIds.length > 0 ? associatedSubCatIds : [String(selectedSubCategoryId)]
      });
    } else {
      setComboForm({
        title: '',
        description: '',
        price: '',
        originalPrice: '',
        discountPercentage: 0,
        duration: '',
        rating: 4.5,
        reviewCount: '1.0k',
        isPopular: false,
        isActive: true,
        includedItems: [],
        gstPercentage: 18,
        gstIncluded: true,
        vendorPayout: 0,
        allowUserEdit: true,
        codEnabled: true,
        targetSubCategoryIds: selectedSubCategoryIds.length > 0 ? selectedSubCategoryIds.map(String) : (selectedSubCategoryId ? [String(selectedSubCategoryId)] : [])
      });
    }
    setEditingCombo(combo ? combo : 'new');
  };

  const handleSaveCombo = async (e) => {
    e.preventDefault();
    if (!comboForm.title.trim()) {
      toast.error('Combo title is required');
      return;
    }
    if (!comboForm.price || Number(comboForm.price) <= 0) {
      toast.error('Price is required');
      return;
    }
    if (!comboForm.targetSubCategoryIds || comboForm.targetSubCategoryIds.length === 0) {
      toast.error('At least one subcategory must be selected');
      return;
    }

    // Generate a unique 24-character hexadecimal BSON ObjectId for new combos
    const comboId = comboForm._id || [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');

    const newPkg = {
      _id: comboId,
      title: comboForm.title,
      description: comboForm.description,
      price: Number(comboForm.price),
      originalPrice: comboForm.originalPrice ? Number(comboForm.originalPrice) : null,
      discountPercentage: Number(comboForm.discountPercentage) || 0,
      duration: comboForm.duration || '',
      rating: Number(comboForm.rating) || 4.5,
      reviewCount: comboForm.reviewCount || '1.0k',
      isPopular: comboForm.isPopular || false,
      isActive: comboForm.isActive !== false,
      includedItems: comboForm.includedItems || [],
      gstPercentage: Number(comboForm.gstPercentage || 18),
      gstIncluded: comboForm.gstIncluded !== false,
      vendorPayout: Number(comboForm.vendorPayout || 0),
      allowUserEdit: comboForm.allowUserEdit !== false,
      codEnabled: comboForm.codEnabled !== false,
      codAdvanceAmount: Number(comboForm.codAdvanceAmount) || 0
    };

    try {
      const promises = [];

      // Save to all selected subcategories' services
      for (const subId of comboForm.targetSubCategoryIds) {
        const srv = services.find(s => String(s.subCategoryId?._id || s.subCategoryId) === String(subId));
        if (srv) {
          const updatedPackages = [...(srv.packages || [])];
          const idx = updatedPackages.findIndex(p => String(p._id) === String(comboId));
          if (idx !== -1) {
            updatedPackages[idx] = newPkg;
          } else {
            updatedPackages.push(newPkg);
          }
          promises.push(api.put(`/admin/services/${srv._id}`, { packages: updatedPackages }));
        }
      }

      // Remove from any deselected subcategories' services (if editing an existing combo)
      if (comboForm._id) {
        const deselectedServices = services.filter(srv => {
          const subId = srv.subCategoryId?._id || srv.subCategoryId;
          return !comboForm.targetSubCategoryIds.includes(String(subId)) && 
                 srv.packages?.some(p => String(p._id) === String(comboForm._id));
        });

        for (const srv of deselectedServices) {
          const updatedPackages = srv.packages.filter(p => String(p._id) !== String(comboForm._id));
          promises.push(api.put(`/admin/services/${srv._id}`, { packages: updatedPackages }));
        }
      }

      await Promise.all(promises);
      toast.success('Combo Package saved successfully across selected subcategories!');
      setEditingCombo(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save combo package');
    }
  };

  const handleToggleUserEdit = async (combo) => {
    const updatedPackages = activeService.packages.map(p => {
      if (String(p._id) === String(combo._id)) {
        return { ...p, allowUserEdit: p.allowUserEdit === false };
      }
      return p;
    });

    try {
      const res = await api.put(`/admin/services/${activeService._id}`, { packages: updatedPackages });
      if (res.data.success) {
        toast.success(`Customization ${combo.allowUserEdit === false ? 'enabled' : 'disabled'} for "${combo.title}"`);
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to update customization setting');
    }
  };

  const handleDeleteCombo = async (id) => {
    if (!window.confirm('Delete this combo package?')) return;
    const updated = activeService.packages.filter(p => p._id !== id);
    try {
      const res = await api.put(`/admin/services/${activeService._id}`, { packages: updated });
      if (res.data.success) {
        toast.success('Deleted successfully');
        fetchData();
      }
    } catch (err) {
      toast.error('Failed to delete package');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title Header */}
      <div className="flex items-center justify-between py-2 border-b border-gray-100">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <FiPackage className="w-5 h-5 text-emerald-600" /> Package-based Services
          </h1>
          <p className="text-xs text-gray-500 mt-1">Configure Main Categories, Subcategories, Options and Combos.</p>
        </div>
        <button onClick={fetchData} className="p-2 bg-gray-50 hover:bg-gray-100 border rounded-xl transition-colors" title="Sync Details">
          <FiRefreshCw className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Stepper Tabs Navigation */}
      <div className="bg-gray-50 p-1 rounded-2xl border flex gap-1">
        {[
          { id: 'main_cats', label: '1. Main Categories' },
          { id: 'sub_cats', label: '2. Subcategories' },
          { id: 'packages', label: '3. Packages / Options' },
          { id: 'combos', label: '4. Package Groups / Combos' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSearchQuery('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dynamic Tab Render Content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-medium">Syncing details...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: MAIN CATEGORIES */}
            {activeTab === 'main_cats' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-sm font-bold text-gray-700">Configure Main Categories (e.g. Salon)</h2>
                  <button
                    onClick={() => handleOpenMainCat()}
                    className="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700"
                  >
                    <FiPlus className="w-3.5 h-3.5" /> Add Category
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {categories.map(cat => (
                    <div key={cat._id || cat.id} className="border rounded-2xl p-4 flex items-center justify-between shadow-sm bg-gray-50/20">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border flex items-center justify-center shrink-0">
                          {cat.homeIconUrl ? (
                            <img src={cat.homeIconUrl} alt="" className="w-6 h-6 object-contain" />
                          ) : (
                            <FiGrid className="text-gray-400 w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-800">{cat.title}</h4>
                          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${cat.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{cat.status}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleOpenMainCat(cat)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors">
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteMainCat(cat._id || cat.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: SUBCATEGORIES */}
            {activeTab === 'sub_cats' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center gap-3">
                  <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border max-w-sm">
                    <FiSearch className="w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search categories..."
                      className="bg-transparent text-xs focus:outline-none w-full"
                    />
                  </div>
                  <button
                    onClick={() => handleOpenSubCat()}
                    className="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 shrink-0"
                  >
                    <FiPlus className="w-3.5 h-3.5" /> Add Category Level 2
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100 text-[11px] uppercase tracking-wider text-gray-500">
                        <th className="p-3.5 font-bold">Category Title</th>
                        <th className="p-3.5 font-bold">Parent (Main Category)</th>
                        <th className="p-3.5 font-bold">Media Coverage</th>
                        <th className="p-3.5 font-bold">Status</th>
                        <th className="p-3.5 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {filteredSubCategories.map(sub => {
                        const parent = categories.find(c => String(c._id || c.id) === String(sub.categoryId?._id || sub.categoryId));
                        return (
                          <tr key={sub._id} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="p-3.5 font-bold text-gray-800">{sub.title}</td>
                            <td className="p-3.5 text-gray-500 font-semibold">{parent?.title || 'Unknown parent'}</td>
                            <td className="p-3.5">
                              <div className="flex gap-2">
                                <span className={`px-2 py-0.5 rounded border ${sub.imageUrl ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-gray-50 text-gray-400'}`}>Image</span>
                                <span className={`px-2 py-0.5 rounded border ${sub.videoUrl ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-gray-50 text-gray-400'}`}>Video</span>
                              </div>
                            </td>
                            <td className="p-3.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sub.status === 'active' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700'}`}>{sub.status}</span>
                            </td>
                            <td className="p-3.5 flex justify-end gap-2">
                              <button onClick={() => handleOpenSubCat(sub)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><FiEdit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDeleteSubCat(sub._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><FiTrash2 className="w-3.5 h-3.5" /></button>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredSubCategories.length === 0 && (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-gray-400">No categories found. Create a Category to begin.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: INDIVIDUAL PACKAGES / OPTIONS */}
            {activeTab === 'packages' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Select Category / Subcategory</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                    {subCategories.map(sub => {
                      const isSelected = String(selectedSubCategoryId) === String(sub._id);
                      return (
                        <button
                          key={sub._id}
                          type="button"
                          onClick={() => setSelectedSubCategoryId(sub._id)}
                          className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all flex flex-col items-center justify-center gap-1.5 ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                              : 'bg-white hover:bg-gray-50 border-gray-100 text-gray-700'
                          }`}
                        >
                          <FiFolder className={`w-5 h-5 ${isSelected ? 'text-emerald-600' : 'text-gray-400'}`} />
                          <span className="truncate w-full">{sub.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedSubCategoryId ? (
                  activeService ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center border-b pb-3">
                        <div>
                          <h3 className="text-sm font-bold text-gray-800">Packages configured for "{activeService.title}"</h3>
                          <p className="text-[11px] text-gray-400 mt-0.5">Manage individual options (like Haircut, Massage) and set their prices below.</p>
                        </div>
                        <button
                          onClick={() => handleOpenGroup()}
                          className="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700"
                        >
                          <FiPlus className="w-3.5 h-3.5" /> Add Options Group
                        </button>
                      </div>

                      <div className="space-y-4 pt-2">
                        {activeService.serviceGroups?.map((group, idx) => (
                          <div key={group._id || idx} className="border rounded-2xl p-4 bg-gray-50/10 shadow-sm space-y-3">
                            <div className="flex justify-between items-center border-b pb-2">
                              <div className="flex items-center gap-2">
                                <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg font-bold text-xs">🛒</span>
                                <h4 className="text-sm font-bold text-gray-800">{group.title}</h4>
                                <span className="text-[10px] text-gray-400">({(group.items || []).length} choices)</span>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={() => handleOpenGroup(idx)} className="p-1.5 text-blue-500 hover:bg-blue-100 rounded-lg"><FiEdit2 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => handleDeleteGroup(idx)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg"><FiTrash2 className="w-3.5 h-3.5" /></button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {group.items?.map((item, itemIdx) => (
                                <div key={item._id || itemIdx} className="bg-white border rounded-xl p-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex justify-between items-center">
                                  <div className="min-w-0 pr-2">
                                    <p className="text-xs font-bold text-gray-800 truncate">{item.title}</p>
                                    <div className="flex gap-1.5 items-center mt-0.5 flex-wrap">
                                      {item.duration && <span className="text-[10px] text-gray-400">{item.duration}</span>}
                                      <span className="text-[10px] text-indigo-600 font-extrabold bg-indigo-50 px-1 py-0.25 rounded">Payout: ₹{item.vendorPayout || 0}</span>
                                    </div>
                                  </div>
                                  <span className="text-xs font-extrabold text-emerald-600 shrink-0">₹{item.price}</span>
                                </div>
                              ))}
                              {(!group.items || group.items.length === 0) && (
                                <p className="text-xs text-gray-400 col-span-3 py-1">No items configured in this group yet.</p>
                              )}
                            </div>
                          </div>
                        ))}
                        {(!activeService.serviceGroups || activeService.serviceGroups.length === 0) && (
                          <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed text-gray-400">
                            No service groups created yet. Click "Add Options Group" to start adding items.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-3xl bg-gray-50/50 max-w-lg mx-auto">
                      <FiPackage className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-sm font-bold text-gray-600">No Services Initialized Yet</h3>
                      <p className="text-xs text-gray-400 mt-1.5 max-w-sm mx-auto leading-normal">
                        To add packages, you must initialize the services database mapping for this subcategory first.
                      </p>
                      <button
                        onClick={handleInitializeService}
                        className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-emerald-700 transition-colors"
                      >
                        Initialize Packages Setup
                      </button>
                    </div>
                  )
                ) : (
                    <div className="text-center py-12 text-gray-400 font-medium">
                    Please select a Category/Subcategory from the dropdown above to manage options.
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: COMBO PACKAGES / PACKAGE GROUPS */}
            {activeTab === 'combos' && (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">Select Category / Subcategory (Choose where combos will apply)</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {subCategories.map(sub => {
                      const isSelected = selectedSubCategoryIds.includes(String(sub._id));
                      const toggleSub = () => {
                        let list = [...selectedSubCategoryIds];
                        if (isSelected) {
                          list = list.filter(id => id !== String(sub._id));
                        } else {
                          list.push(String(sub._id));
                        }
                        setSelectedSubCategoryIds(list);
                        // Backwards compatibility for single selector state
                        if (list.length > 0) {
                          setSelectedSubCategoryId(list[0]);
                        } else {
                          setSelectedSubCategoryId('');
                        }
                      };
                      return (
                        <label
                          key={sub._id}
                          className={`p-3 rounded-2xl border text-left font-bold text-xs transition-all flex items-center gap-3 cursor-pointer select-none ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                              : 'bg-white hover:bg-gray-50 border-gray-150 text-gray-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={toggleSub}
                            className="w-4 h-4 accent-emerald-600 cursor-pointer"
                          />
                          <div className="flex items-center gap-1.5 min-w-0">
                            <FiFolder className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-600' : 'text-gray-400'}`} />
                            <span className="truncate">{sub.title}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {selectedSubCategoryIds.length > 0 ? (
                  (() => {
                    // Combine all services matching the selected subcategories
                    const selectedServices = services.filter(s =>
                      selectedSubCategoryIds.includes(String(s.subCategoryId?._id || s.subCategoryId))
                    );
                    const allComboPackages = [];
                    selectedServices.forEach(s => {
                      if (s.packages) {
                        s.packages.forEach(pkg => {
                          if (!allComboPackages.some(p => String(p._id) === String(pkg._id))) {
                            allComboPackages.push({ ...pkg, parentServiceTitle: s.title, parentServiceId: s._id });
                          }
                        });
                      }
                    });

                    return (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b pb-3">
                          <div>
                            <h3 className="text-sm font-bold text-gray-800">Combo Package Groups ({allComboPackages.length})</h3>
                            <p className="text-[11px] text-gray-400 mt-0.5">Combine individual packages, apply discount prices, and manage them.</p>
                          </div>
                          <button
                            onClick={() => handleOpenCombo()}
                            className="px-3.5 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700"
                          >
                            <FiPlus className="w-3.5 h-3.5" /> Create Combo Package
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          {allComboPackages.map((pkg) => {
                            const matrix = calcPriceMatrix(pkg);
                            return (
                              <div key={pkg._id} className="border rounded-2xl p-4 bg-white shadow-sm hover:shadow-md transition-all space-y-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <h4 className="text-sm font-bold text-gray-800">{pkg.title}</h4>
                                      {pkg.isPopular && <span className="text-[9px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">⭐ Popular</span>}
                                    </div>
                                    <span className="text-xs font-extrabold text-emerald-600">₹{pkg.price}</span>
                                    {pkg.originalPrice && <span className="text-xs line-through text-gray-400 ml-1.5 font-semibold">₹{pkg.originalPrice}</span>}
                                    <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">
                                      {pkg.gstIncluded !== false ? 'GST Inc.' : 'GST Exc.'} ({pkg.gstPercentage || 18}%) | Payout: ₹{pkg.vendorPayout || 0} | COD: {pkg.codEnabled !== false ? `₹${pkg.codAdvanceAmount || 0} Adv` : 'Disabled'}
                                    </span>
                                  </div>
                                  <div className="flex gap-1.5">
                                    <button onClick={() => handleOpenCombo(pkg)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors"><FiEdit2 className="w-4 h-4" /></button>
                                    <button
                                      onClick={async () => {
                                        if (!window.confirm('Delete this combo package?')) return;
                                        try {
                                          // Delete from its specific parent service
                                          const parentSrv = services.find(s => String(s._id) === String(pkg.parentServiceId));
                                          if (parentSrv) {
                                            const updated = parentSrv.packages.filter(p => String(p._id) !== String(pkg._id));
                                            await api.put(`/admin/services/${parentSrv._id}`, { packages: updated });
                                            toast.success('Deleted successfully');
                                            fetchData();
                                          }
                                        } catch (err) {
                                          toast.error('Failed to delete package');
                                        }
                                      }}
                                      className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                    ><FiTrash2 className="w-4 h-4" /></button>
                                  </div>
                                </div>
                                <p className="text-[10px] text-gray-500">{pkg.description || 'No description provided.'}</p>
                                
                                <div className="border-t pt-2 space-y-1.5">
                                  <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-wider block">Included Service Levels:</span>
                                  {pkg.includedItems?.map((inc, i) => (
                                    <div key={i} className="flex justify-between text-xs text-gray-600 font-semibold bg-gray-50 p-2 rounded-lg border">
                                      <span>{inc.serviceGroupTitle}</span>
                                      <span className="text-[10px] text-emerald-600 font-extrabold">{inc.selectedItemTitle}</span>
                                    </div>
                                  ))}
                                </div>

                                <div className="flex items-center justify-between border-t pt-2 mt-1">
                                  <span className="text-[10px] font-bold text-gray-500 uppercase">Allow User to Edit Options:</span>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const parentSrv = services.find(s => String(s._id) === String(pkg.parentServiceId));
                                      if (parentSrv) {
                                        const updatedPackages = parentSrv.packages.map(p => {
                                          if (String(p._id) === String(pkg._id)) {
                                            return { ...p, allowUserEdit: p.allowUserEdit === false };
                                          }
                                          return p;
                                        });
                                        try {
                                          await api.put(`/admin/services/${parentSrv._id}`, { packages: updatedPackages });
                                          toast.success(`Customization status updated`);
                                          fetchData();
                                        } catch (e) {
                                          toast.error('Failed to update settings');
                                        }
                                      }
                                    }}
                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                      pkg.allowUserEdit !== false ? 'bg-emerald-500' : 'bg-gray-200'
                                    }`}
                                  >
                                    <span
                                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        pkg.allowUserEdit !== false ? 'translate-x-4' : 'translate-x-0'
                                      }`}
                                    />
                                  </button>
                                </div>

                                <div className="border-t pt-2 flex justify-between text-[11px] font-bold text-gray-500 bg-gray-50/50 p-2 rounded-xl">
                                  <span>Base: ₹{matrix.basePrice.toFixed(0)}</span>
                                  <span>GST: ₹{matrix.gstAmount.toFixed(0)}</span>
                                  <span className={matrix.platformEarning >= 0 ? "text-emerald-600" : "text-red-500"}>Profit: ₹{matrix.platformEarning.toFixed(0)}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="text-center py-12 text-gray-400 font-medium">
                    Please select a Category/Subcategory from the dropdown above to manage combo package groups.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* MODAL 1: ADD/EDIT MAIN CATEGORIES */}
      {editingMainCat && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between bg-gray-50">
              <h3 className="text-sm font-bold text-gray-800">{editingMainCat === 'new' ? 'Create Main Category' : 'Edit Main Category'}</h3>
              <button onClick={() => setEditingMainCat(null)} className="p-1.5 hover:bg-gray-200 rounded-lg"><FiX className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveMainCat} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Category Title *</label>
                <input
                  type="text"
                  required
                  value={mainCatForm.title}
                  onChange={e => setMainCatForm({ ...mainCatForm, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                  placeholder="e.g. Salon, AC service, Plumber"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Badge (Optional)</label>
                <input
                  type="text"
                  value={mainCatForm.homeBadge}
                  onChange={e => setMainCatForm({ ...mainCatForm, homeBadge: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                  placeholder="e.g. 20% OFF, NEW"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">SAC Code (Optional)</label>
                <input
                  type="text"
                  value={mainCatForm.sacCode}
                  onChange={e => setMainCatForm({ ...mainCatForm, sacCode: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                  placeholder="e.g. 998599"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Minimum Wallet Balance (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={mainCatForm.minWalletBalance}
                  onChange={e => setMainCatForm({ ...mainCatForm, minWalletBalance: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                  placeholder="e.g. 200"
                />
                <p className="text-[10px] text-gray-400 mt-1">Minimum amount (in ₹) vendor needs to accept bookings.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Icon / Image</label>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => e.target.files?.[0] && handleMediaUpload(e.target.files[0], 'main_icon')}
                    className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border file:border-gray-200 file:bg-gray-50 file:text-xs file:font-bold hover:file:bg-gray-100"
                  />
                  {uploadingIcon && <span className="text-[10px] text-blue-500 animate-pulse font-bold block">Uploading image...</span>}
                  {mainCatForm.homeIconUrl && (
                    <div className="flex items-center gap-2 border p-1.5 rounded-xl bg-gray-50">
                      <img src={mainCatForm.homeIconUrl} alt="" className="w-8 h-8 object-contain rounded bg-white border" />
                      <span className="text-[10px] text-gray-500 truncate flex-1">{mainCatForm.homeIconUrl}</span>
                    </div>
                  )}
                  <input
                    type="text"
                    value={mainCatForm.homeIconUrl}
                    onChange={e => setMainCatForm({ ...mainCatForm, homeIconUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                    placeholder="Or enter image URL: https://..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Status</label>
                <select
                  value={mainCatForm.status}
                  onChange={e => setMainCatForm({ ...mainCatForm, status: e.target.value })}
                  className="w-full p-2 border rounded-xl text-xs focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingMainCat(null)} className="flex-1 py-2 border rounded-xl text-xs font-semibold hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700">Save</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 2: ADD/EDIT CATEGORIES / SUBCATEGORIES */}
      {editingSubCat && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between bg-gray-50">
              <h3 className="text-sm font-bold text-gray-800">{editingMainCat === 'new' ? 'Create Category Level 2' : 'Edit Category Level 2'}</h3>
              <button onClick={() => setEditingSubCat(null)} className="p-1.5 hover:bg-gray-200 rounded-lg"><FiX className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveSubCat} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Parent (Main Category) *</label>
                <select
                  value={subCatForm.categoryId}
                  onChange={e => setSubCatForm({ ...subCatForm, categoryId: e.target.value })}
                  required
                  className="w-full p-2 border rounded-xl text-xs focus:outline-none"
                >
                  <option value="">-- Select Main Category --</option>
                  {categories.map(cat => (
                    <option key={cat._id || cat.id} value={cat._id || cat.id}>{cat.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={subCatForm.title}
                  onChange={e => setSubCatForm({ ...subCatForm, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                  placeholder="e.g. salon for kids and men"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Description</label>
                <textarea
                  value={subCatForm.description}
                  onChange={e => setSubCatForm({ ...subCatForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none resize-none"
                  placeholder="Description details..."
                />
              </div>

              {/* MEDIA UPLOADS SECTION */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t pt-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Subcategory Icon</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => e.target.files?.[0] && handleMediaUpload(e.target.files[0], 'icon')}
                    className="w-full text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-gray-100 file:font-semibold"
                  />
                  {uploadingIcon && <span className="text-[9px] text-blue-500 animate-pulse">Uploading...</span>}
                  {subCatForm.iconUrl && <span className="text-[9px] text-green-600 block mt-1 truncate">{subCatForm.iconUrl}</span>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Cover Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => e.target.files?.[0] && handleMediaUpload(e.target.files[0], 'image')}
                    className="w-full text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-gray-100 file:font-semibold"
                  />
                  {uploadingImage && <span className="text-[9px] text-blue-500 animate-pulse">Uploading...</span>}
                  {subCatForm.imageUrl && <span className="text-[9px] text-green-600 block mt-1 truncate">{subCatForm.imageUrl}</span>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1 uppercase">Cover Video</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={e => e.target.files?.[0] && handleMediaUpload(e.target.files[0], 'video')}
                    className="w-full text-[10px] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:bg-gray-100 file:font-semibold"
                  />
                  {uploadingVideo && <span className="text-[9px] text-blue-500 animate-pulse">Uploading...</span>}
                  {subCatForm.videoUrl && <span className="text-[9px] text-green-600 block mt-1 truncate">{subCatForm.videoUrl}</span>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Status</label>
                <select
                  value={subCatForm.status}
                  onChange={e => setSubCatForm({ ...subCatForm, status: e.target.value })}
                  className="w-full p-2 border rounded-xl text-xs focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditingSubCat(null)} className="flex-1 py-2 border rounded-xl text-xs font-semibold hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700">Save</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 3: ADD/EDIT OPTIONS GROUPS (serviceGroups) */}
      {editingServiceGroup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between bg-gray-50">
              <h3 className="text-sm font-bold text-gray-800">{editingGroupIdx === 'new' ? 'Add Options Group' : 'Edit Options Group'}</h3>
              <button onClick={() => setEditingServiceGroup(false)} className="p-1.5 hover:bg-gray-200 rounded-lg"><FiX className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveGroup} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Options Group Title *</label>
                <input
                  type="text"
                  required
                  value={groupForm.title}
                  onChange={e => setGroupForm({ ...groupForm, title: e.target.value })}
                  className="w-full px-3 py-2.5 border rounded-xl text-xs focus:outline-none font-semibold"
                  style={{ color: '#1f2937', backgroundColor: '#ffffff', borderColor: '#d1d5db' }}
                  placeholder="e.g. Haircut, Massage, Face care"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Group Icon / Image</label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      id="groupIconUpload"
                      accept="image/*"
                      onChange={e => e.target.files?.[0] && handleMediaUpload(e.target.files[0], 'group_icon')}
                      className="hidden"
                    />
                    <label
                      htmlFor="groupIconUpload"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-all hover:scale-[1.02] flex items-center gap-1.5"
                    >
                      <span>+ Upload Image</span>
                    </label>
                    {uploadingIcon && (
                      <span className="text-[10px] text-blue-500 animate-pulse font-bold">Uploading...</span>
                    )}
                  </div>
                  {groupForm.iconUrl && (
                    <div className="flex items-center gap-2 border p-1.5 rounded-xl bg-gray-50">
                      <img src={groupForm.iconUrl} alt="" className="w-8 h-8 object-contain rounded bg-white border" />
                      <span className="text-[10px] text-gray-500 truncate flex-1">{groupForm.iconUrl}</span>
                    </div>
                  )}
                  <input
                    type="text"
                    value={groupForm.iconUrl || ''}
                    onChange={e => setGroupForm({ ...groupForm, iconUrl: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                    style={{ color: '#1f2937', backgroundColor: '#ffffff', borderColor: '#d1d5db' }}
                    placeholder="Or enter image URL: https://..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  id="allowSkip"
                  checked={groupForm.allowSkip}
                  onChange={e => setGroupForm({ ...groupForm, allowSkip: e.target.checked })}
                  className="w-4 h-4 accent-emerald-600"
                />
                <label htmlFor="allowSkip" className="text-xs font-semibold text-gray-700 select-none cursor-pointer">Allow skip option ("I don't need this")</label>
              </div>

              {/* Items checklist */}
              <div className="space-y-3 border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Configure Sub-items & Prices</span>
                  <button type="button" onClick={handleAddItemToGroup} className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
                    + Add Item Option
                  </button>
                </div>

                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                  {groupForm.items.map((item, i) => (
                    <div key={i} className="p-3 border rounded-xl space-y-2 bg-gray-50/50 relative">
                      <button
                        type="button"
                        onClick={() => handleRemoveItemFromGroup(i)}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold text-xs"
                      >
                        Remove
                      </button>
                      <div className="grid grid-cols-3 gap-2 pr-12">
                        <input
                          type="text"
                          required
                          value={item.title}
                          onChange={e => handleUpdateItemInGroup(i, 'title', e.target.value)}
                          placeholder="Item Name (e.g. Haircut for men)"
                          className="px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none font-semibold"
                          style={{ backgroundColor: '#ffffff', color: '#1f2937', borderColor: '#d1d5db' }}
                        />
                        <input
                          type="number"
                          required
                          value={item.price}
                          onChange={e => handleUpdateItemInGroup(i, 'price', Number(e.target.value))}
                          placeholder="Price ₹"
                          className="px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none font-bold text-emerald-600"
                          style={{ backgroundColor: '#ffffff', color: '#10b981', borderColor: '#d1d5db' }}
                          min="0"
                        />
                        <input
                          type="number"
                          required
                          value={item.vendorPayout === 0 ? '' : item.vendorPayout}
                          onChange={e => handleUpdateItemInGroup(i, 'vendorPayout', Number(e.target.value) || 0)}
                          placeholder="Payout ₹"
                          className="px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none font-bold text-blue-600"
                          style={{ backgroundColor: '#ffffff', color: '#2563eb', borderColor: '#d1d5db' }}
                          min="0"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={item.duration || ''}
                          onChange={e => handleUpdateItemInGroup(i, 'duration', e.target.value)}
                          placeholder="Duration (e.g. 30 mins)"
                          className="px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none"
                          style={{ backgroundColor: '#ffffff', color: '#1f2937', borderColor: '#d1d5db' }}
                        />
                        <input
                          type="text"
                          value={item.description || ''}
                          onChange={e => handleUpdateItemInGroup(i, 'description', e.target.value)}
                          placeholder="Description / Note"
                          className="px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none"
                          style={{ backgroundColor: '#ffffff', color: '#1f2937', borderColor: '#d1d5db' }}
                        />
                      </div>
                      {/* Item Image Upload */}
                      <div className="pt-1 space-y-1.5">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Item Image (shown in options modal)</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            id={`itemImg_${i}`}
                            accept="image/*"
                            className="hidden"
                            onChange={e => e.target.files?.[0] && handleItemImageUpload(e.target.files[0], i)}
                          />
                          <label
                            htmlFor={`itemImg_${i}`}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1"
                          >
                            + Upload Image
                          </label>
                          {uploadingItemImageIdx === i && (
                            <span className="text-[10px] text-blue-500 animate-pulse font-bold">Uploading...</span>
                          )}
                        </div>
                        {item.imageUrl ? (
                          <div className="flex items-center gap-2 border p-1.5 rounded-lg bg-white">
                            <img src={item.imageUrl} alt="" className="w-8 h-8 object-cover rounded border" />
                            <span className="text-[9px] text-gray-400 truncate flex-1">{item.imageUrl}</span>
                            <button type="button" onClick={() => handleUpdateItemInGroup(i, 'imageUrl', '')} className="text-red-400 hover:text-red-600 text-[10px] font-bold">✕</button>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={item.imageUrl || ''}
                            onChange={e => handleUpdateItemInGroup(i, 'imageUrl', e.target.value)}
                            placeholder="Or paste image URL: https://..."
                            className="w-full px-2.5 py-1.5 border rounded-lg text-[10px] focus:outline-none"
                            style={{ backgroundColor: 'var(--background, #f9fafb)', color: 'var(--text-primary, #111827)', borderColor: 'var(--border, #e5e7eb)' }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  {groupForm.items.length === 0 && (
                    <p className="text-xs text-gray-400 py-3 text-center">Click "+ Add Item Option" to insert items like Haircuts, Shaves, etc.</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setEditingServiceGroup(false)} className="flex-1 py-2.5 border rounded-xl text-xs font-semibold hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700">Save Group</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* MODAL 4: ADD/EDIT COMBO PACKAGES */}
      {editingCombo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 border-b flex items-center justify-between bg-gray-50">
              <h3 className="text-sm font-bold text-gray-800">{editingCombo === 'new' ? 'Create Combo Package' : 'Edit Combo Package'}</h3>
              <button onClick={() => setEditingCombo(null)} className="p-1.5 hover:bg-gray-200 rounded-lg"><FiX className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveCombo} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
                <label className="text-xs font-bold text-gray-600 uppercase block mb-1">1. Included Packages / Options</label>
                {services.map(srv => {
                  const srvSubId = String(srv.subCategoryId?._id || srv.subCategoryId);
                  // Dynamic filter in real-time based on subcategories currently checked in the form below
                  if (!comboForm.targetSubCategoryIds?.includes(srvSubId)) {
                    return null;
                  }
                  if (!srv.serviceGroups || srv.serviceGroups.length === 0) return null;
                  return (
                    <div key={srv._id} className="space-y-2 border-l-2 border-emerald-500 pl-3 py-1 bg-gray-50/30 p-2 rounded-xl border border-gray-100">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">{srv.title}</span>
                      {srv.serviceGroups.map(group => (
                        <div key={group._id} className="border rounded-xl p-3 space-y-2 bg-white">
                          <span className="text-xs font-bold text-gray-800 block border-b pb-1">{group.title}</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                            {group.items?.map(item => {
                              const isItemIncluded = comboForm.includedItems.some(
                                inc => String(inc.selectedItemId) === String(item._id)
                              );

                              const toggleItem = () => {
                                let updatedIncluded;
                                if (isItemIncluded) {
                                  updatedIncluded = comboForm.includedItems.filter(i => String(i.selectedItemId) !== String(item._id));
                                } else {
                                  updatedIncluded = [...comboForm.includedItems, {
                                    serviceGroupId: group._id,
                                    serviceGroupTitle: group.title,
                                    selectedItemId: item._id,
                                    selectedItemTitle: item.title,
                                    selectedItemDescription: item.description || item.title || ''
                                  }];
                                }

                                // Calculate sum of all included items' prices
                                let sumPrice = 0;
                                updatedIncluded.forEach(inc => {
                                  let foundItm = null;
                                  for (const s of services) {
                                    const g = s.serviceGroups?.find(x => String(x._id) === String(inc.serviceGroupId));
                                    foundItm = g?.items?.find(i => String(i._id) === String(inc.selectedItemId));
                                    if (foundItm) break;
                                  }
                                  if (foundItm) {
                                    sumPrice += Number(foundItm.price || 0);
                                  }
                                });

                                setComboForm(p => ({
                                  ...p,
                                  includedItems: updatedIncluded,
                                  price: sumPrice,
                                  originalPrice: sumPrice
                                }));
                              };

                              return (
                                <label key={item._id} className="flex items-center gap-2 cursor-pointer select-none">
                                  <input
                                    type="checkbox"
                                    checked={isItemIncluded}
                                    onChange={toggleItem}
                                    className="w-4 h-4 accent-emerald-600 cursor-pointer"
                                  />
                                  <span className="text-xs text-gray-700 font-semibold">{item.title} (₹{item.price})</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3 border-t pt-3">
                <label className="text-xs font-bold text-gray-600 uppercase">2. Associated Subcategories</label>
                <p className="text-[10px] text-gray-400">Select all subcategories where this Combo Package should be displayed:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-150 max-h-[150px] overflow-y-auto">
                  {subCategories.map(sub => {
                    const isChecked = comboForm.targetSubCategoryIds?.includes(String(sub._id));
                    const toggleSub = () => {
                      let list = [...(comboForm.targetSubCategoryIds || [])];
                      let updatedIncluded = [...(comboForm.includedItems || [])];
                      
                      if (isChecked) {
                        // Deselecting: Remove subcategory ID from targets
                        list = list.filter(id => id !== String(sub._id));
                        
                        // Also remove any included items that belong to this deselected subcategory
                        // Find service matching deselected subcategory ID
                        const targetSrv = services.find(s => String(s.subCategoryId?._id || s.subCategoryId) === String(sub._id));
                        if (targetSrv) {
                          const groupIds = (targetSrv.serviceGroups || []).map(g => String(g._id));
                          updatedIncluded = updatedIncluded.filter(inc => !groupIds.includes(String(inc.serviceGroupId)));
                        }
                      } else {
                        // Selecting: Add subcategory ID to targets
                        list.push(String(sub._id));
                      }
                      
                      // Calculate new price sum
                      let sumPrice = 0;
                      updatedIncluded.forEach(inc => {
                        let foundItm = null;
                        for (const s of services) {
                          const g = s.serviceGroups?.find(x => String(x._id) === String(inc.serviceGroupId));
                          foundItm = g?.items?.find(i => String(i._id) === String(inc.selectedItemId));
                          if (foundItm) break;
                        }
                        if (foundItm) {
                          sumPrice += Number(foundItm.price || 0);
                        }
                      });

                      setComboForm(p => ({
                        ...p,
                        targetSubCategoryIds: list,
                        includedItems: updatedIncluded,
                        price: sumPrice,
                        originalPrice: sumPrice
                      }));
                    };
                    return (
                      <label key={sub._id} className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={toggleSub}
                          className="w-4 h-4 accent-emerald-600 cursor-pointer"
                        />
                        <span className="text-xs text-gray-700 font-semibold">{sub.title}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 border-t pt-3">
                <label className="text-xs font-bold text-gray-600 uppercase">3. Combo Package Details</label>
                <input
                  type="text"
                  required
                  value={comboForm.title}
                  onChange={e => setComboForm({ ...comboForm, title: e.target.value })}
                  placeholder="Combo Title (e.g. Haircut + Massage combo)"
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                />
                <textarea
                  value={comboForm.description}
                  onChange={e => setComboForm({ ...comboForm, description: e.target.value })}
                  rows={2}
                  placeholder="Short description..."
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none resize-none"
                />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 mb-0.5 uppercase">Price (Final Customer Charge) *</label>
                    <input
                      type="number"
                      required
                      value={comboForm.price}
                      onChange={e => setComboForm({ ...comboForm, price: e.target.value })}
                      placeholder="Discounted Price"
                      className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none font-bold text-emerald-600"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-0.5 uppercase">Original Price</label>
                    <input
                      type="number"
                      value={comboForm.originalPrice}
                      onChange={e => setComboForm({ ...comboForm, originalPrice: e.target.value })}
                      placeholder="Original Price"
                      className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-0.5 uppercase">GST (%)</label>
                    <input
                      type="number"
                      value={comboForm.gstPercentage}
                      onChange={e => setComboForm({ ...comboForm, gstPercentage: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-0.5 uppercase">GST Type</label>
                    <select
                      value={comboForm.gstIncluded ? 'true' : 'false'}
                      onChange={e => setComboForm({ ...comboForm, gstIncluded: e.target.value === 'true' })}
                      className="w-full p-2 border rounded-xl text-xs focus:outline-none font-semibold text-gray-700 bg-white"
                    >
                      <option value="true">GST Included</option>
                      <option value="false">GST Excluded</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 mb-0.5 uppercase">Vendor Payout (₹)</label>
                    <input
                      type="number"
                      value={comboForm.vendorPayout}
                      onChange={e => setComboForm({ ...comboForm, vendorPayout: e.target.value })}
                      placeholder="Payout to vendor"
                      className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none font-bold text-blue-600"
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="allowUserEdit"
                    checked={comboForm.allowUserEdit}
                    onChange={e => setComboForm(p => ({ ...p, allowUserEdit: e.target.checked }))}
                    className="w-4 h-4 accent-emerald-600 cursor-pointer"
                  />
                  <label htmlFor="allowUserEdit" className="text-xs font-bold text-gray-700 select-none cursor-pointer">
                    Allow user to edit package options on detail page
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t pt-3 mt-2">
                  <div className="flex items-center gap-2 py-2">
                    <input
                      type="checkbox"
                      id="codEnabled"
                      checked={comboForm.codEnabled}
                      onChange={e => setComboForm(p => ({ ...p, codEnabled: e.target.checked }))}
                      className="w-4 h-4 accent-emerald-600 cursor-pointer"
                    />
                    <label htmlFor="codEnabled" className="text-xs font-bold text-gray-750 select-none cursor-pointer">
                      COD (Pay at Home) Enabled
                    </label>
                  </div>
                  {comboForm.codEnabled && (
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 mb-0.5 uppercase">COD Advance Amount (₹)</label>
                      <input
                        type="number"
                        value={comboForm.codAdvanceAmount}
                        onChange={e => setComboForm({ ...comboForm, codAdvanceAmount: e.target.value })}
                        placeholder="e.g. 0 for no advance"
                        className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                        min="0"
                      />
                    </div>
                  )}
                </div>

                {/* Split Calculation Details Box */}
                {(() => {
                  const cp = Number(comboForm.price) || 0;
                  const gstPct = Number(comboForm.gstPercentage) || 18;
                  const gstInc = comboForm.gstIncluded !== false;
                  const vendorPayout = Number(comboForm.vendorPayout) || 0;

                  let basePrice, gstAmount, finalPrice;
                  if (gstInc) {
                    finalPrice = cp;
                    gstAmount = (cp * gstPct) / (100 + gstPct);
                    basePrice = cp - gstAmount;
                  } else {
                    basePrice = cp;
                    gstAmount = (cp * gstPct) / 100;
                    finalPrice = cp + gstAmount;
                  }
                  const platformEarning = basePrice - vendorPayout;

                  return (
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2 mt-2">
                      <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Live Split Calculation Details</div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Customer Pay:</span>
                            <span className="font-bold text-gray-800">₹{finalPrice.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Taxable Base:</span>
                            <span className="font-semibold text-gray-700">₹{basePrice.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-500">GST ({gstPct}%):</span>
                            <span className="font-semibold text-gray-700">₹{gstAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Platform Profit:</span>
                            <span className={`font-bold ${platformEarning >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              ₹{platformEarning.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between border-t pt-1 mt-1">
                            <span className="text-gray-600 font-bold">Wallet Deduction (COD):</span>
                            <span className="font-extrabold text-blue-600">
                              ₹{(finalPrice - vendorPayout).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setEditingCombo(null)} className="flex-1 py-2.5 border rounded-xl text-xs font-semibold hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700">Save Combo</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PackageBased;
