import React, { useEffect, useMemo, useState } from "react";
import { FiGrid, FiPlus, FiEdit2, FiTrash2, FiSave, FiChevronUp, FiChevronDown, FiX } from "react-icons/fi";
import DynamicIcon from "../../../../../components/DynamicIcon";
import { toast } from "react-hot-toast";
import CardShell from "../components/CardShell";
import Modal from "../components/Modal";
import { ensureIds, saveCatalog, slugify } from "../utils";
import { categoryService, serviceService, publicCatalogService } from "../../../../../services/catalogService";

const CombinedCategoriesPage = ({ catalog, setCatalog, selectedCity, cities = [] }) => {
  const [editingId, setEditingId] = useState(null);
  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    homeIconUrl: "",
    homeBadge: "",
    hasSaleBadge: false,
    showOnHome: true,
    status: "active",
    allCities: true,
    cityIds: [],
    mappedCategories: []
  });

  const categories = useMemo(() => {
    return (catalog.categories || []).sort((a, b) => (a.homeOrder || 0) - (b.homeOrder || 0));
  }, [catalog]);

  const combinedCategories = useMemo(() => {
    return categories.filter(c => c.isGroupCategory === true);
  }, [categories]);

  const standardCategories = useMemo(() => {
    return categories.filter(c => c.isGroupCategory !== true);
  }, [categories]);

  const editing = useMemo(() => {
    return combinedCategories.find(c => c.id === editingId) || null;
  }, [combinedCategories, editingId]);

  // Fetch categories from API on mount
  const fetchCategories = async () => {
    try {
      setFetching(true);
      const response = await categoryService.getAll({});
      if (response.success && response.categories) {
        const mapped = response.categories.map(cat => ({
          id: cat.id || String(cat._id),
          title: cat.title,
          slug: cat.slug,
          homeIconUrl: cat.homeIconUrl || "",
          homeBadge: cat.homeBadge || "",
          hasSaleBadge: cat.hasSaleBadge || false,
          showOnHome: cat.showOnHome !== false,
          categoryType: cat.categoryType || "service",
          status: cat.status || "active",
          homeOrder: cat.homeOrder || 0,
          cityIds: (cat.cityIds || []).filter(Boolean).map(id => (typeof id === 'object' ? (id._id || id.id || String(id)) : String(id))),
          isGroupCategory: cat.isGroupCategory || false,
          mappedCategories: (cat.mappedCategories || []).map(id => typeof id === 'object' ? (id._id || id.id || String(id)) : String(id)),
        }));

        const next = { ...catalog, categories: mapped };
        setCatalog(next);
        saveCatalog(next);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!editing) {
      setForm({
        title: "",
        slug: "",
        homeIconUrl: "",
        homeBadge: "",
        hasSaleBadge: false,
        showOnHome: true,
        status: "active",
        allCities: true,
        cityIds: [],
        mappedCategories: []
      });
      return;
    }
    const safe = editing;
    const existingCityIds = (safe.cityIds || []).filter(Boolean).map(id => typeof id === 'object' ? (id._id || id.id || String(id)) : String(id));
    setForm({
      title: safe.title || "",
      slug: safe.slug || "",
      homeIconUrl: safe.homeIconUrl || "",
      homeBadge: safe.homeBadge || "",
      hasSaleBadge: Boolean(safe.hasSaleBadge),
      showOnHome: safe.showOnHome !== false,
      status: safe.status || "active",
      allCities: existingCityIds.length === 0,
      cityIds: existingCityIds,
      mappedCategories: (safe.mappedCategories || [])
        .map(id => typeof id === 'object' ? (id._id || id.id || String(id)) : String(id))
        .filter(id => standardCategories.some(sc => sc.id === id)),
    });
  }, [editing, standardCategories]);

  const reset = () => {
    setEditingId(null);
    setForm({
      title: "",
      slug: "",
      homeIconUrl: "",
      homeBadge: "",
      hasSaleBadge: false,
      showOnHome: true,
      status: "active",
      allCities: true,
      cityIds: [],
      mappedCategories: []
    });
    setIsModalOpen(false);
  };

  const upsert = async () => {
    const titleVal = (form.title || '').trim();
    if (!titleVal || titleVal.length < 2) {
      toast.error('Box title must be at least 2 characters');
      return;
    }

    try {
      setLoading(true);

      // Determine homeOrder
      let homeOrder = 0;
      if (editingId) {
        const existing = combinedCategories.find(c => c.id === editingId);
        homeOrder = existing?.homeOrder || 0;
      } else {
        const maxOrder = Math.max(...categories.map(c => c.homeOrder || 0), 0);
        homeOrder = maxOrder + 1;
      }

      const finalCityIds = form.allCities ? [] : form.cityIds;

      const categoryData = {
        title: titleVal,
        slug: slugify(titleVal),
        homeIconUrl: form.homeIconUrl || null,
        homeBadge: form.homeBadge || null,
        hasSaleBadge: Boolean(form.hasSaleBadge),
        showOnHome: true,
        homeOrder,
        categoryType: "service",
        status: form.status,
        cityIds: finalCityIds,
        updateCityIds: finalCityIds,
        isGroupCategory: true,
        mappedCategories: form.mappedCategories || [],
      };

      let savedCategory;
      if (editingId) {
        const response = await categoryService.update(editingId, categoryData);
        if (response.success) {
          savedCategory = response.category;
        } else {
          throw new Error(response.message || 'Failed to update box');
        }
      } else {
        const response = await categoryService.create(categoryData);
        if (response.success) {
          savedCategory = response.category;
        } else {
          throw new Error(response.message || 'Failed to create box');
        }
      }

      // Automatically hide mapped standard categories from Home main grid (showOnHome: false)
      // to keep homepage clean
      if (form.mappedCategories && form.mappedCategories.length > 0) {
        await Promise.all(
          form.mappedCategories.map(catId =>
            categoryService.update(catId, { showOnHome: false })
          )
        );
      }

      toast.success(editingId ? "Combined category updated" : "Combined category created");
      reset();
      fetchCategories();
      publicCatalogService.invalidateCache();
    } catch (error) {
      console.error('Upsert combined category error:', error);
      const msg = error.response?.data?.message || error.message || 'Failed to save box';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this combined category? Subcategories will not be deleted, they will just be uncombined.")) return;

    try {
      setLoading(true);
      const response = await categoryService.delete(id);
      if (response.success) {
        toast.success("Combined category deleted");
        fetchCategories();
        publicCatalogService.invalidateCache();
      } else {
        throw new Error(response.message || "Failed to delete");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete combined category");
    } finally {
      setLoading(false);
    }
  };

  const moveOrder = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= combinedCategories.length) return;

    try {
      setLoading(true);
      const a = combinedCategories[index];
      const b = combinedCategories[targetIndex];

      await categoryService.updateOrder(a.id, b.homeOrder || targetIndex);
      await categoryService.updateOrder(b.id, a.homeOrder || index);

      toast.success("Order updated");
      fetchCategories();
      publicCatalogService.invalidateCache();
    } catch (error) {
      toast.error("Failed to reorder");
    } finally {
      setLoading(false);
    }
  };

  let filteredCombined = combinedCategories;
  if (selectedCity) {
    filteredCombined = filteredCombined.filter(c => {
      if (!c.cityIds || c.cityIds.length === 0) return true;
      return c.cityIds.some(id => String(id) === String(selectedCity));
    });
  }

  return (
    <div className="space-y-6">
      <CardShell icon={FiGrid}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Combined Categories Management</h2>
            <p className="text-xs text-gray-500 mt-1">
              Create combined category boxes for the home screen (typically 3, 6, or 9 boxes) and combine multiple categories inside each box.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold shadow hover:bg-blue-700 transition-all text-sm"
          >
            <FiPlus className="w-4 h-4" />
            <span>Add Category Box</span>
          </button>
        </div>

        {fetching ? (
          <div className="text-center py-8 text-gray-500">Loading combined categories...</div>
        ) : filteredCombined.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            No combined category boxes configured yet.
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-100 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-16">Order</th>
                  <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-20">Icon</th>
                  <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Box Name</th>
                  <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Combined Services</th>
                  <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-28 text-center">Status</th>
                  <th className="py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-32 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredCombined.map((c, index) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex flex-col items-center gap-1">
                        <button
                          disabled={index === 0}
                          onClick={() => moveOrder(index, 'up')}
                          className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                        >
                          <FiChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          disabled={index === filteredCombined.length - 1}
                          onClick={() => moveOrder(index, 'down')}
                          className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                        >
                          <FiChevronDown className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-10 w-10 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                        {c.homeIconUrl ? (
                          <DynamicIcon icon={c.homeIconUrl} alt={c.title} className="w-full h-full object-contain p-1" />
                        ) : (
                          <span className="text-gray-400 text-xs font-bold">{c.title?.[0]?.toUpperCase()}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-gray-900">{c.title}</div>
                      <div className="text-xs text-gray-400">/{c.slug}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1.5 max-w-md">
                        {(c.mappedCategories || []).map(childId => {
                          const childCat = standardCategories.find(sc => sc.id === childId);
                          return childCat ? (
                            <span key={childId} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold border border-blue-100">
                              {childCat.title}
                            </span>
                          ) : null;
                        })}
                        {(c.mappedCategories || []).length === 0 && (
                          <span className="text-xs text-red-500 font-semibold">⚠️ No categories combined yet</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase border ${
                        c.status === "active" ? "bg-green-50 border-green-200 text-green-700" :
                        c.status === "coming_soon" ? "bg-amber-50 border-amber-200 text-amber-700" :
                        "bg-gray-50 border-gray-200 text-gray-600"
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setEditingId(c.id);
                            setIsModalOpen(true);
                          }}
                          className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all"
                          title="Edit"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => remove(c.id)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all"
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
        title={editing ? "Edit Category Box" : "Add Category Box"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Box Name / Title</label>
            <input
              value={form.title}
              onChange={(e) => {
                const title = e.target.value;
                setForm(p => ({ ...p, title, slug: slugify(title) }));
              }}
              placeholder="e.g. Cleaning Services"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Box Icon / Image</label>
            <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-200">
              <div className="h-16 w-16 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                {form.homeIconUrl ? (
                  <DynamicIcon icon={form.homeIconUrl} alt="Preview" className="w-full h-full object-contain p-1" />
                ) : (
                  <div className="text-gray-400 text-[10px] font-bold">No Image</div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*,.svg"
                  disabled={uploadingIcon}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setUploadingIcon(true);
                      try {
                        const slug = form.slug || form.title?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                        const response = await serviceService.uploadImage(file, `Doormeets/${slug}/icons`);
                        if (response.success && response.imageUrl) {
                          setForm(p => ({ ...p, homeIconUrl: response.imageUrl }));
                          toast.success("Icon uploaded successfully");
                        }
                      } catch (err) {
                        toast.error("Failed to upload image");
                      } finally {
                        setUploadingIcon(false);
                      }
                    }
                  }}
                  className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
            <label className="block text-sm font-bold text-gray-700 mb-2">🏙️ City Availability</label>
            <div className="flex items-center gap-2 mb-2">
              <input
                id="allCitiesToggle"
                type="checkbox"
                checked={form.allCities}
                onChange={(e) => setForm(p => ({ ...p, allCities: e.target.checked, cityIds: e.target.checked ? [] : p.cityIds }))}
                className="h-4 w-4"
              />
              <label htmlFor="allCitiesToggle" className="text-xs font-semibold text-gray-700">
                Available in All Cities (no city restriction)
              </label>
            </div>
            {!form.allCities && (
              <div className="flex flex-wrap gap-1.5 mt-2">
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
                          cityIds: isSelected ? p.cityIds.filter(id => id !== cid) : [...p.cityIds, cid]
                        }));
                      }}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                        isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'
                      }`}
                    >
                      {city.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Box Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm(p => ({ ...p, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-xl bg-white text-sm"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="coming_soon">Coming Soon</option>
            </select>
          </div>

          {/* Mapped standard categories multi-select */}
          <div className="border border-blue-100 bg-blue-50/50 p-4 rounded-xl">
            <label className="block text-sm font-bold text-gray-900 mb-1.5">Combine Categories</label>
            <p className="text-xs text-gray-500 mb-3">Select the categories to combine inside this box widget:</p>
            <div className="max-h-48 overflow-y-auto space-y-1 bg-white border border-gray-200 rounded-lg p-2">
              {standardCategories.map(cat => {
                const isSelected = form.mappedCategories.includes(cat.id);
                return (
                  <div
                    key={cat.id}
                    onClick={() => {
                      setForm(p => ({
                        ...p,
                        mappedCategories: isSelected
                          ? p.mappedCategories.filter(id => id !== cat.id)
                          : [...p.mappedCategories, cat.id]
                      }));
                    }}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                      isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    {cat.homeIconUrl && (
                      <img
                        src={cat.homeIconUrl?.startsWith('http') ? cat.homeIconUrl : `${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/api$/, '')}${cat.homeIconUrl}`}
                        alt={cat.title}
                        className="w-7 h-7 rounded object-cover flex-shrink-0"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <span className="text-sm font-medium text-gray-800">{cat.title}</span>
                  </div>
                );
              })}
            </div>
            {form.mappedCategories.length > 0 && (
              <p className="text-xs text-blue-600 font-bold mt-2">✓ {form.mappedCategories.length} categories combined</p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={upsert}
              disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold transition-all shadow hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FiSave className="w-4 h-4" />
              {loading ? "Saving..." : "Save Box"}
            </button>
            <button
              onClick={reset}
              className="px-5 py-2.5 border border-gray-300 rounded-xl font-medium hover:bg-gray-100 transition-all text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CombinedCategoriesPage;
