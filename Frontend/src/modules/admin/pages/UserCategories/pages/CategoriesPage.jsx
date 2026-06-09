import React, { useEffect, useMemo, useState } from "react";
import { FiGrid, FiPlus, FiEdit2, FiTrash2, FiSave, FiChevronUp, FiChevronDown, FiMove, FiX } from "react-icons/fi";
import { toast } from "react-hot-toast";
import CardShell from "../components/CardShell";
import Modal from "../components/Modal";
import ModeSelector from "../components/ModeSelector";
import { ensureIds, saveCatalog, slugify, toAssetUrl } from "../utils";

import { categoryService, serviceService, professionService, publicCatalogService } from "../../../../../services/catalogService";
import { z } from "zod";

// Define Zod schema
const categorySchema = z.object({
  title: z.string().min(2, "Category title must be at least 2 characters"),
  slug: z.string().optional(),
  homeIconUrl: z.string().optional(),
  homeBadge: z.string().optional(),
  hasSaleBadge: z.boolean(),
  showOnHome: z.boolean(),
  hasBrands: z.boolean().default(true),
  hasSubCategory: z.boolean().default(true),
  hasBrand: z.boolean().default(true),
  categoryType: z.enum(["service", "product"]).default("service"),
  status: z.enum(["active", "inactive", "coming_soon"]).default("active"),
});

const CategoriesPage = ({ catalog, setCatalog, selectedCity, cities = [] }) => {
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [professions, setProfessions] = useState([]);


  const [form, setForm] = useState({
    title: "",
    slug: "",
    homeIconUrl: "",
    homeBadge: "",
    hasSaleBadge: false,
    hasBrands: true,
    hasSubCategory: true,
    hasBrand: true,
    showOnHome: true,
    categoryType: "service",
    professionId: "",
    status: "active",
    allCities: true,        // true = available in all cities
    cityIds: [],            // specific city IDs when allCities is false
  });
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);

  const [interestedModalOpen, setInterestedModalOpen] = useState(false);
  const [interestedUsers, setInterestedUsers] = useState([]);
  const [interestedCategoryTitle, setInterestedCategoryTitle] = useState("");
  const [loadingInterested, setLoadingInterested] = useState(false);

  const categories = (catalog.categories || []).sort((a, b) => (a.homeOrder || 0) - (b.homeOrder || 0));
  const editing = useMemo(() => categories.find((c) => c.id === editingId) || null, [categories, editingId]);

  // Fetch categories from API on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setFetching(true);
        const params = {};

        const response = await categoryService.getAll(params);
        const profRes = await professionService.getAll();
        
        if (profRes.success) {
          setProfessions(profRes.data || []);
        }

        if (response.success && response.categories) {
          // Map backend format to frontend format
          const mappedCategories = response.categories.map(cat => ({
            id: cat.id,
            title: cat.title,
            slug: cat.slug,
            homeIconUrl: cat.homeIconUrl || "",
            homeBadge: cat.homeBadge || "",
            hasSaleBadge: cat.hasSaleBadge || false,
            hasBrands: cat.hasBrands ?? true,
            hasSubCategory: cat.hasSubCategory ?? true,
            hasBrand: cat.hasBrand ?? true,
            showOnHome: cat.showOnHome !== false,
            categoryType: cat.categoryType || "service",
            vendorId: cat.vendorId || null,
            status: cat.status || "active",
            interestedCount: cat.interestedCount || 0,
            cityIds: (cat.cityIds || []).map(id => (typeof id === 'object' ? (id._id || id.id || String(id)) : String(id))),
          }));

          // Update catalog with fetched categories
          const next = { ...catalog, categories: mappedCategories };
          setCatalog(next);
          saveCatalog(next); // Also save to localStorage for backward compatibility
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        toast.error('Failed to load categories. Using cached data.');
      } finally {
        setFetching(false);
      }
    };

    fetchCategories();
  }, []); // Fetch once on mount

  useEffect(() => {
    if (!editing) {
      setForm({
        title: "",
        slug: "",
        homeIconUrl: "",
        homeBadge: "",
        hasSaleBadge: false,
        hasBrands: true,
        hasSubCategory: true,
        hasBrand: true,
        showOnHome: true,
        categoryType: "service",
        professionId: "",
        status: "active",
        allCities: true,
        cityIds: [],
      });
      return;
    }
    const safe = ensureIds({ ...catalog, categories: [editing] }).categories[0];
    const existingCityIds = (safe.cityIds || []).map(id => (typeof id === 'object' ? (id._id || id.id || String(id)) : String(id)));
    setForm({
      title: safe.title || "",
      slug: safe.slug || "",
      homeIconUrl: safe.homeIconUrl || "",
      homeBadge: safe.homeBadge || "",
      hasSaleBadge: Boolean(safe.hasSaleBadge),
      hasBrands: safe.hasBrands ?? true,
      hasSubCategory: safe.hasSubCategory ?? true,
      hasBrand: safe.hasBrand ?? true,
      showOnHome: safe.showOnHome !== false,
      categoryType: safe.categoryType || "service",
      professionId: "",
      status: safe.status || "active",
      allCities: existingCityIds.length === 0,
      cityIds: existingCityIds,
    });
  }, [editing]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const reset = () => {
    setEditingId(null);
    setForm({
      title: "",
      slug: "",
      homeIconUrl: "",
      homeBadge: "",
      hasSaleBadge: false,
      hasBrands: true,
      hasSubCategory: true,
      hasBrand: true,
      showOnHome: true,
      categoryType: "service",
      professionId: "",
      status: "active",
      allCities: true,
      cityIds: [],
    });
    setIsModalOpen(false);
  };

  const handleShowInterested = async (categoryId) => {
    try {
      setLoadingInterested(true);
      setInterestedModalOpen(true);
      setInterestedUsers([]);
      
      const response = await categoryService.getInterestedUsers(categoryId);
      if (response.success) {
        setInterestedUsers(response.interestedUsers || []);
        setInterestedCategoryTitle(response.categoryTitle || "Category");
      } else {
        toast.error(response.message || "Failed to load interested users");
      }
    } catch (error) {
      console.error("Fetch interested users error:", error);
      toast.error("Failed to fetch interested users");
    } finally {
      setLoadingInterested(false);
    }
  };

  const upsert = async () => {
    // Validate form with Zod
    const validationResult = categorySchema.safeParse({
      title: form.title.trim(),
      slug: slugify(form.title.trim()), // derived
      homeIconUrl: form.homeIconUrl.trim(),
      homeBadge: form.homeBadge.trim(),
      hasSaleBadge: Boolean(form.hasSaleBadge),
      hasBrands: Boolean(form.hasBrands),
      hasSubCategory: Boolean(form.hasSubCategory),
      hasBrand: Boolean(form.hasBrand),
      showOnHome: Boolean(form.showOnHome),
      categoryType: form.categoryType,
      status: form.status,
    });

    if (!validationResult.success) {
      // Show first error in toast
      const firstError = validationResult.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    const { title, slug, homeIconUrl, homeBadge, hasSaleBadge, hasBrands, hasSubCategory, hasBrand, showOnHome, categoryType, status } = validationResult.data;

    try {
      setLoading(true);

      // Determine homeOrder for new categories
      let homeOrder = 0;
      if (editingId && editingId.startsWith('ucat-')) {
        // New category - find the highest order and add 1
        const maxOrder = Math.max(...categories.map(c => c.homeOrder || 0), 0);
        homeOrder = maxOrder + 1;
      } else if (editingId) {
        // Existing category - keep current order
        const existingCategory = categories.find(c => c.id === editingId);
        homeOrder = existingCategory?.homeOrder || 0;
      } else {
        // New category (fallback)
        const maxOrder = Math.max(...categories.map(c => c.homeOrder || 0), 0);
        homeOrder = maxOrder + 1;
      }

      // Determine cityIds from form
      const finalCityIds = form.allCities ? [] : form.cityIds;

      const categoryData = {
        title,
        slug,
        homeIconUrl: homeIconUrl || null,
        homeBadge: homeBadge || null,
        hasSaleBadge,
        hasBrands,
        hasSubCategory,
        hasBrand,
        showOnHome,
        homeOrder,
        categoryType,
        status,
        cityIds: finalCityIds,
        updateCityIds: finalCityIds,
      };

      if (editingId && !editingId.startsWith('ucat-')) {
        const existingCat = categories.find(c => c.id === editingId);
        if (selectedCity && !form.allCities && form.cityIds.length === 0) {
          categoryData.cityIds = [selectedCity];
          categoryData.updateCityIds = [selectedCity];
        }
      }

      const mapSavedCategory = (cat) => ({
        id: cat.id,
        title: cat.title,
        slug: cat.slug,
        homeIconUrl: cat.homeIconUrl || "",
        homeBadge: cat.homeBadge || "",
        hasSaleBadge: cat.hasSaleBadge || false,
        hasBrands: cat.hasBrands ?? true,
        hasSubCategory: cat.hasSubCategory ?? true,
        hasBrand: cat.hasBrand ?? true,
        showOnHome: cat.showOnHome !== false,
        homeOrder: cat.homeOrder || 0,
        categoryType: cat.categoryType || "service",
        vendorId: cat.vendorId || null,
        status: cat.status || "active",
        interestedCount: cat.interestedCount || 0,
        cityIds: (cat.cityIds || []).map(id => (typeof id === 'object' ? (id._id || id.id || String(id)) : String(id))),
      });

      let savedCategory;
      if (editingId && editingId.startsWith('ucat-')) {
        const response = await categoryService.create(categoryData);
        if (response.success) {
          savedCategory = mapSavedCategory(response.category);
        } else {
          throw new Error(response.message || 'Failed to create category');
        }
      } else if (editingId) {
        const response = await categoryService.update(editingId, categoryData);
        if (response.success) {
          savedCategory = mapSavedCategory(response.category);
        } else {
          throw new Error(response.message || 'Failed to update category');
        }
      } else {
        const response = await categoryService.create(categoryData);
        if (response.success) {
          savedCategory = mapSavedCategory(response.category);
        } else {
          throw new Error(response.message || 'Failed to create category');
        }
      }

      // Link to Profession if selected
      if (form.professionId && savedCategory) {
        const prof = professions.find(p => (p.id || p._id) === form.professionId);
        if (prof) {
          const catIds = prof.categories ? prof.categories.map(c => c._id || c) : [];
          if (!catIds.includes(savedCategory.id)) {
            await professionService.update(prof.id || prof._id, { 
              categories: [...catIds, savedCategory.id] 
            });
            setProfessions(professions.map(p => (p.id || p._id) === form.professionId ? { ...p, categories: [...catIds, savedCategory.id] } : p));
          }
        }
      }

      // Update local state
      const next = ensureIds(catalog);
      const exists = next.categories.find((c) => c.id === editingId || c.id === savedCategory.id);

      if (exists && editingId) {
        next.categories = next.categories.map((c) =>
          (c.id === editingId || c.id === savedCategory.id) ? savedCategory : c
        );
      } else {
        next.categories = [...next.categories, savedCategory];
      }

      setCatalog(next);
      saveCatalog(next);
      publicCatalogService.invalidateCache();
      toast.success(editingId ? "Category updated successfully" : "Category created successfully");
      reset();
    } catch (error) {
      console.error('Upsert category error:', error);
      const apiMessage = error.response?.data?.message;
      toast.error(apiMessage || error.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this category?")) return;

    if (id.startsWith('ucat-')) {
      const next = { ...catalog, categories: categories.filter((c) => c.id !== id) };
      setCatalog(next);
      saveCatalog(next);
      publicCatalogService.invalidateCache();
      if (editingId === id) reset();
      return;
    }

    try {
      setLoading(true);
      const response = await categoryService.delete(id);

      if (response.success) {
        const next = { ...catalog, categories: categories.filter((c) => c.id !== id) };
        setCatalog(next);
        saveCatalog(next);
        publicCatalogService.invalidateCache();
        if (editingId === id) reset();
        toast.success("Category deleted successfully");
      } else {
        throw new Error(response.message || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Delete category error:', error);
      toast.error(error.message || 'Failed to delete category. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (categoryId, newStatus) => {
    try {
      const category = categories.find(c => c.id === categoryId);
      if (!category) return;

      const response = await categoryService.update(categoryId, {
        status: newStatus,
        updateCityIds: category.cityIds || (selectedCity ? [selectedCity] : [])
      });

      if (response.success) {
        const next = ensureIds(catalog);
        next.categories = next.categories.map(c => 
          c.id === categoryId ? { ...c, status: newStatus } : c
        );
        setCatalog(next);
        saveCatalog(next);
        publicCatalogService.invalidateCache();
        toast.success(`Status updated to ${newStatus === 'active' ? 'Active' : newStatus === 'coming_soon' ? 'Coming Soon' : 'Deactive'}`);
      } else {
        throw new Error(response.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Update status error:', error);
      toast.error(error.message || 'Failed to update status');
    }
  };

  const moveCategoryUp = async (categoryId, currentIndex) => {
    if (currentIndex === 0) return;

    try {
      setLoading(true);
      const category = categories[currentIndex];
      const previousCategory = categories[currentIndex - 1];

      await categoryService.updateOrder(category.id, currentIndex - 1);
      await categoryService.updateOrder(previousCategory.id, currentIndex);

      const updatedCategories = [...categories];
      [updatedCategories[currentIndex], updatedCategories[currentIndex - 1]] =
        [updatedCategories[currentIndex - 1], updatedCategories[currentIndex]];

      setCatalog(prev => ({ ...prev, categories: updatedCategories }));
      saveCatalog({ ...catalog, categories: updatedCategories });
      publicCatalogService.invalidateCache();

      toast.success("Category moved up successfully");
    } catch (error) {
      console.error('Move category up error:', error);
      toast.error('Failed to reorder category');
    } finally {
      setLoading(false);
    }
  };

  const moveCategoryDown = async (categoryId, currentIndex) => {
    if (currentIndex === categories.length - 1) return;

    try {
      setLoading(true);
      const category = categories[currentIndex];
      const nextCategory = categories[currentIndex + 1];

      await categoryService.updateOrder(category.id, currentIndex + 1);
      await categoryService.updateOrder(nextCategory.id, currentIndex);

      const updatedCategories = [...categories];
      [updatedCategories[currentIndex], updatedCategories[currentIndex + 1]] =
        [updatedCategories[currentIndex + 1], updatedCategories[currentIndex]];

      setCatalog(prev => ({ ...prev, categories: updatedCategories }));
      saveCatalog({ ...catalog, categories: updatedCategories });
      publicCatalogService.invalidateCache();

      toast.success("Category moved down successfully");
    } catch (error) {
      console.error('Move category down error:', error);
      toast.error('Failed to reorder category');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const draggedIndex = draggedItem;

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedItem(null);
      return;
    }

    const newCategories = [...categories];
    const [draggedCategory] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(dropIndex, 0, draggedCategory);

    const bulkUpdates = newCategories.map((cat, index) =>
      categoryService.updateOrder(cat.id, index)
    );

    Promise.all(bulkUpdates)
      .then(() => {
        setCatalog(prev => ({ ...prev, categories: newCategories }));
        saveCatalog({ ...catalog, categories: newCategories });
        publicCatalogService.invalidateCache();
        toast.success("Categories reordered successfully");
      })
      .catch((error) => {
        console.error('Bulk reorder error:', error);
        toast.error('Failed to reorder categories');
      })
      .finally(() => {
        setDraggedItem(null);
      });
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const filteredCategories = selectedCity
    ? categories.filter(c => {
        if (!c.cityIds || c.cityIds.length === 0) return false;
        return c.cityIds.some(id => String(id) === String(selectedCity) || String(id._id) === String(selectedCity));
      })
    : categories;

  return (
    <div className="space-y-6">
      <CardShell icon={FiGrid}>
        {fetching && (
          <div className="text-center py-4 text-gray-500">Loading categories...</div>
        )}



        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">{filteredCategories.length} categories</div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReorderModal(true)}
              disabled={categories.length < 2}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold transition-all flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiMove className="w-4 h-4" />
              <span>Reorder</span>
            </button>
            <button
              onClick={() => {
                reset();
                setIsModalOpen(true);
              }}
              className="px-4 py-2 text-white rounded-lg font-semibold transition-all flex items-center gap-2 shadow-md hover:shadow-lg relative z-10"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#2874F0',
                border: 'none',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#1e5fd4'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#2874F0'}
            >
              <FiPlus className="w-4 h-4" style={{ display: 'block', color: '#ffffff' }} />
              <span>Add Category</span>
            </button>
          </div>
        </div>

        {filteredCategories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {selectedCity ? 'No categories for this city. Try "All Cities" or add one.' : 'No categories yet'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700 w-12">#</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700 w-20">Icon</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Cities</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-gray-700">Badge</th>
                  <th className="text-center py-3 px-4 text-sm font-bold text-gray-700 w-20">
                    Order
                    <button
                      onClick={() => setShowReorderModal(true)}
                      className="ml-2 text-purple-600 hover:text-purple-800 text-xs"
                      title="Bulk reorder"
                    >
                      <FiMove className="w-3 h-3 inline" />
                    </button>
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-bold text-gray-700 w-32">Status</th>
                  <th className="text-center py-3 px-4 text-sm font-bold text-gray-700 w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((c, idx) => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 text-sm font-semibold text-gray-600">{idx + 1}</td>
                    <td className="py-4 px-4">
                      {c.homeIconUrl ? (
                        <img src={toAssetUrl(c.homeIconUrl)} alt={c.title} className="h-10 w-10 object-contain rounded bg-gray-50 border border-gray-100" />
                      ) : (
                        <div className="h-12 w-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                          <span className="text-xs text-gray-400">No icon</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{c.title || "Untitled"}</span>
                          {c.vendorId && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white shadow-sm" title={c.vendorId.name || 'Vendor'}>
                              {c.vendorId.businessName || c.vendorId.name || 'Vendor Created'}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{c.slug || "—"}</div>
                      </div>
                    </td>
                    {/* Cities column */}
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {(!c.cityIds || c.cityIds.length === 0)
                          ? <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">All Cities</span>
                          : c.cityIds.map(cid => (
                              <span key={cid} className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                {(cities.find(ci => (ci._id || ci.id) === cid) || {}).name || cid.slice(-4)}
                              </span>
                            ))
                        }
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {c.homeBadge ? (
                        <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded">{c.homeBadge}</span>
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                      <div className="mt-1 flex flex-col gap-1">
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-semibold rounded uppercase tracking-wider ${c.hasSubCategory !== false ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                          {c.hasSubCategory !== false ? 'Subcategory' : 'No Subcategory'}
                        </span>
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-semibold rounded uppercase tracking-wider ${c.hasBrand !== false ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                          {c.hasBrand !== false ? 'Brand' : 'No Brand'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => moveCategoryUp(c.id, idx)}
                          disabled={idx === 0 || loading}
                          className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move Up"
                        >
                          <FiChevronUp className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-semibold text-gray-600 mx-1">{idx + 1}</span>
                        <button
                          onClick={() => moveCategoryDown(c.id, idx)}
                          disabled={idx === categories.length - 1 || loading}
                          className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Move Down"
                        >
                          <FiChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <select
                        value={c.status || "active"}
                        onChange={(e) => handleStatusChange(c.id, e.target.value)}
                        className={`px-2 py-1 text-xs font-bold rounded border border-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          c.status === "active" ? "bg-green-500 text-white focus:ring-green-500" :
                          c.status === "coming_soon" ? "bg-amber-500 text-white focus:ring-amber-500" :
                          "bg-gray-300 text-gray-700 focus:ring-gray-400"
                        }`}
                      >
                        <option value="active" className="bg-white text-gray-800">ACTIVE</option>
                        <option value="inactive" className="bg-white text-gray-800">DEACTIVE</option>
                        <option value="coming_soon" className="bg-white text-gray-800">COMING SOON</option>
                      </select>
                      {c.status === "coming_soon" && (
                        <button
                          onClick={() => handleShowInterested(c.id)}
                          className="text-[10px] text-blue-600 hover:text-blue-800 hover:underline mt-1 font-bold block mx-auto cursor-pointer focus:outline-none"
                        >
                          {c.interestedCount || 0} Interested
                        </button>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingId(c.id);
                            setIsModalOpen(true);
                          }}
                          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          title="Edit"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => remove(c.id)}
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
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

      <Modal
        isOpen={isModalOpen}
        onClose={reset}
        title={editing ? "Edit Category" : "Add Category"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-base font-bold text-gray-900 mb-2">Title</label>
            <input
              value={form.title}
              onChange={(e) => {
                const title = e.target.value;
                setForm((p) => ({ ...p, title, slug: slugify(title) }));
              }}
              placeholder="e.g. Electricity, Salon for Women"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-base font-bold text-gray-900 mb-2">Link to Profession (Optional)</label>
            <select
              value={form.professionId}
              onChange={(e) => setForm((p) => ({ ...p, professionId: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Select a Profession --</option>
              {professions.map((prof) => (
                <option key={prof._id || prof.id} value={prof._id || prof.id}>
                  {prof.name}
                </option>
              ))}
            </select>
          </div>

          {/* City Assignment */}
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <label className="block text-base font-bold text-gray-900 mb-3">🏙️ City Availability</label>
            <div className="flex items-center gap-3 mb-3">
              <input
                id="allCitiesToggle"
                type="checkbox"
                checked={form.allCities}
                onChange={(e) => setForm(p => ({ ...p, allCities: e.target.checked, cityIds: e.target.checked ? [] : p.cityIds }))}
                className="h-4 w-4 accent-green-600"
              />
              <label htmlFor="allCitiesToggle" className="text-sm font-semibold text-gray-800">
                Available in All Cities (no city restriction)
              </label>
            </div>
            {!form.allCities && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 mb-2">Select which cities this category is available in:</p>
                <div className="flex flex-wrap gap-2">
                  {cities.map(city => {
                    const cid = city._id || city.id;
                    const isSelected = form.cityIds.includes(cid);
                    return (
                      <button
                        key={cid}
                        type="button"
                        onClick={() => {
                          setForm(p => ({
                            ...p,
                            cityIds: isSelected
                              ? p.cityIds.filter(id => id !== cid)
                              : [...p.cityIds, cid]
                          }));
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        {isSelected ? '✓ ' : ''}{city.name}
                      </button>
                    );
                  })}
                </div>
                {form.cityIds.length === 0 && (
                  <p className="text-xs text-amber-600 font-semibold">⚠️ Select at least one city, or enable "All Cities"</p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-base font-bold text-gray-900 mb-2">Category Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Deactive</option>
              <option value="coming_soon">Coming Soon</option>
            </select>
          </div>

          <div>
            <label className="block text-base font-bold text-gray-900 mb-2">Home Icon</label>
            <div className="space-y-3">
              <input
                type="file"
                accept="image/*"
                disabled={uploadingIcon}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setUploadingIcon(true);
                    try {
                      const categorySlug = form.slug || form.title?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                      const folder = `Doormeets/${categorySlug}/icons`;
                      const response = await serviceService.uploadImage(file, folder);
                      if (response.success && response.imageUrl) {
                        setForm((p) => ({ ...p, homeIconUrl: response.imageUrl }));
                        toast.success("Icon uploaded successfully");
                      } else {
                        toast.error("Upload failed");
                      }
                    } catch (error) {
                      console.error('Category icon upload error:', error);
                      toast.error("Failed to upload image");
                    } finally {
                      setUploadingIcon(false);
                    }
                  }
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {uploadingIcon && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span className="text-sm font-medium">Uploading...</span>
                </div>
              )}
              {form.homeIconUrl && !uploadingIcon && (
                <img src={toAssetUrl(form.homeIconUrl)} alt="Icon Preview" className="h-16 w-16 object-cover rounded-lg border border-gray-200" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-base font-bold text-gray-900 mb-2">Home Badge (optional)</label>
              <input
                value={form.homeBadge}
                onChange={(e) => setForm((p) => ({ ...p, homeBadge: e.target.value }))}
                placeholder="NEW / SALE / etc."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-center gap-3 pt-8">
              <input
                id="hasSaleBadge"
                type="checkbox"
                checked={form.hasSaleBadge}
                onChange={(e) => setForm((p) => ({ ...p, hasSaleBadge: e.target.checked }))}
                className="h-4 w-4"
              />
              <label htmlFor="hasSaleBadge" className="text-base font-semibold text-gray-800">
                Show sale badge on home card
              </label>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              id="hasSubCategory"
              type="checkbox"
              checked={form.hasSubCategory}
              onChange={(e) => setForm((p) => ({ ...p, hasSubCategory: e.target.checked }))}
              className="h-4 w-4"
            />
            <label htmlFor="hasSubCategory" className="text-base font-semibold text-gray-800">
              Has Subcategory
            </label>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              id="hasBrand"
              type="checkbox"
              checked={form.hasBrand}
              onChange={(e) => setForm((p) => ({ ...p, hasBrand: e.target.checked }))}
              className="h-4 w-4"
            />
            <label htmlFor="hasBrand" className="text-base font-semibold text-gray-800">
              Has Brand
            </label>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              id="showOnHome"
              type="checkbox"
              checked={form.showOnHome}
              onChange={(e) => setForm((p) => ({ ...p, showOnHome: e.target.checked }))}
              className="h-4 w-4"
            />
            <label htmlFor="showOnHome" className="text-base font-semibold text-gray-800">
              Show this category on home
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={upsert}
              disabled={loading}
              className="flex-1 py-3.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSave className="w-5 h-5" />
              {loading ? "Saving..." : (editing ? "Update Category" : "Add Category")}
            </button>
            <button
              onClick={reset}
              className="px-6 py-3.5 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-all border border-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Reorder Categories Modal */}
      <Modal
        isOpen={showReorderModal}
        onClose={() => setShowReorderModal(false)}
        title="Reorder Categories"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Drag and drop categories to reorder them. The new order will be saved automatically.
          </p>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {categories.map((category, index) => (
              <div
                key={category.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`
                  flex items-center gap-3 p-3 border rounded-lg cursor-move transition-all
                  ${draggedItem === index ? 'opacity-50 bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:border-blue-300'}
                  ${draggedItem !== null && draggedItem !== index ? 'hover:bg-gray-50' : ''}
                `}
              >
                <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full text-sm font-semibold text-gray-600">
                  {index + 1}
                </div>

                {category.homeIconUrl ? (
                  <img
                    src={toAssetUrl(category.homeIconUrl)}
                    alt={category.title}
                    className="w-8 h-8 object-contain rounded"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-xs text-gray-500">?</span>
                  </div>
                )}

                <div className="flex-1">
                  <div className="font-medium text-gray-900">{category.title}</div>
                  <div className="text-sm text-gray-500">{category.slug}</div>
                </div>

                <FiMove className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={() => setShowReorderModal(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* Interested Users Modal */}
      <Modal
        isOpen={interestedModalOpen}
        onClose={() => setInterestedModalOpen(false)}
        title={`Interested Users - ${interestedCategoryTitle}`}
      >
        <div className="space-y-4">
          {loadingInterested ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
              <span className="text-sm text-gray-500 font-medium">Loading interested users...</span>
            </div>
          ) : interestedUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 font-medium">
              No users have registered interest in this category yet.
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              <p className="text-sm text-gray-600 font-semibold mb-2">
                Total {interestedUsers.length} user{interestedUsers.length > 1 ? 's' : ''} interested:
              </p>
              {interestedUsers.map((user, index) => (
                <div
                  key={user._id || user.id || index}
                  className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white hover:shadow-sm transition-all"
                >
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-base shadow-inner">
                    {user.profilePhoto ? (
                      <img
                        src={toAssetUrl(user.profilePhoto)}
                        alt={user.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      user.name ? user.name.slice(0, 2).toUpperCase() : 'U'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-gray-900 truncate">{user.name || 'Unnamed User'}</h4>
                    <p className="text-xs text-gray-500 truncate">{user.email || 'No email provided'}</p>
                    <p className="text-xs text-gray-700 font-semibold mt-0.5">{user.phone || 'No phone number'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <button
              onClick={() => setInterestedModalOpen(false)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CategoriesPage;
