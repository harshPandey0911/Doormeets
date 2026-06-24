import React, { useEffect, useState, useMemo } from "react";
import { FiGrid, FiPlus, FiEdit2, FiTrash2, FiImage } from "react-icons/fi";
import { toast } from "react-hot-toast";
import CardShell from "../components/CardShell";
import Modal from "../components/Modal";
import BrandServicesModal from "../components/BrandServicesModal";
import { ensureIds, saveCatalog, slugify, toAssetUrl } from "../utils";
import { brandService, categoryService, subCategoryService } from "../../../../../services/catalogService";
import { z } from "zod";
import DynamicIcon from "../../../../../components/DynamicIcon";

// Zod schema for Brand Form
const brandSchema = z.object({
  title: z.string().min(2, "Brand title must be at least 2 characters"),
  categoryIds: z.array(z.string()).min(1, "Select at least one category"),
  subCategoryIds: z.array(z.string()).optional(),
  iconUrl: z.string().optional(),
  badge: z.string().optional(),
  order: z.number().min(0, "Order must be non-negative"),
});

const BrandsPage = ({ catalog, setCatalog, selectedCity, filterTemplateId }) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Connect to catalog state
  const services = catalog.services || []; // These are actually BRANDS
  const categories = catalog.categories || [];
  const [subCategories, setSubCategories] = useState([]);

  const [editingId, setEditingId] = useState(null);

  // UI State
  const [uploadingBrandIcon, setUploadingBrandIcon] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");

  // Form State
  const [form, setForm] = useState({
    title: "",
    iconUrl: "",
    badge: "",
    categoryIds: [],
    subCategoryIds: [],
    cityIds: [],
    order: 0,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);

  // Services Modal State
  const [isServicesModalOpen, setIsServicesModalOpen] = useState(false);
  const [selectedBrandForServices, setSelectedBrandForServices] = useState(null);

  const filteredCategoriesForForm = useMemo(() => {
    if (!filterTemplateId) return categories;
    return categories.filter(c => String(c.templateId || c.template) === String(filterTemplateId));
  }, [categories, filterTemplateId]);

  const activeServices = useMemo(() => {
    if (!filterTemplateId) return services;
    const templateCategoryIds = new Set(
      categories
        .filter(c => String(c.templateId || c.template) === String(filterTemplateId))
        .map(c => String(c.id || c._id))
    );
    return services.filter(s => {
      const brandCatIds = s.categoryIds || (s.categoryId ? [s.categoryId] : []);
      return brandCatIds.some(catId => templateCategoryIds.has(String(catId)));
    });
  }, [services, categories, filterTemplateId]);

  // Filter brands based on selected category
  const filteredBrands = useMemo(() => {
    if (selectedCategoryFilter === "all") return activeServices;

    return activeServices.filter(s => {
      const filterId = String(selectedCategoryFilter);
      // Check both categoryId (legacy) and categoryIds (array)
      if (s.categoryIds && s.categoryIds.length > 0) {
        return s.categoryIds.some(id => String(id) === filterId);
      }
      return String(s.categoryId) === filterId;
    });
  }, [activeServices, selectedCategoryFilter]);

  // Helper to extract string ID from various formats
  const getStrId = (item) => {
    if (!item) return null;
    if (typeof item === 'string') return item.trim();
    if (item.$oid) return item.$oid.trim();
    if (item._id) return typeof item._id === 'object' && item._id.$oid ? item._id.$oid.trim() : item._id.toString().trim();
    if (item.id) return item.id.toString().trim();
    return String(item).trim();
  };

  // Fetch data function
  const refreshData = async () => {
    try {
      // Only show full loading spinner if we don't have data yet
      if (!catalog.services || catalog.services.length === 0) {
        setFetching(true);
      }

      const params = { status: 'active' };
      if (selectedCity) params.cityId = selectedCity;

      // Fetch ALL categories for reliable resolution, but filtered services
      const [servicesRes, categoriesRes, subCategoriesRes] = await Promise.all([
        brandService.getAll(params),
        categoryService.getAll(),
        subCategoryService.getAll()
      ]);

      let mappedBrands = [];
      let mappedCategories = [];

      if (servicesRes.success) {
        mappedBrands = servicesRes.brands.map((svc, sIdx) => {
          const catIds = (svc.categoryIds || []).map(id => getStrId(id)).filter(Boolean);

          // if (sIdx < 3) {
          //   console.log(`[BrandDebug] ${svc.title}:`, { raw: svc.categoryIds, processed: catIds });
          // }
          const primaryCatId = getStrId(svc.categoryId);

          return {
            id: getStrId(svc.id || svc._id),
            title: svc.title,
            slug: svc.slug,
            categoryIds: catIds,
            subCategoryIds: (svc.subCategoryIds || []).map(id => getStrId(id)).filter(Boolean),
            categoryTitles: svc.categoryTitles || [],
            categoryId: primaryCatId || (catIds.length > 0 ? catIds[0] : null),
            iconUrl: svc.iconUrl || "",
            badge: svc.badge || "",
            routePath: svc.routePath || `/user/${svc.slug}`,
            page: svc.page || {},
            sections: svc.sections || [],
            cityIds: (svc.cityIds || []).map(id => getStrId(id)).filter(Boolean),
            order: svc.order !== undefined ? Number(svc.order) : 0,
          };
        });
      }

      if (categoriesRes.success) {
        mappedCategories = categoriesRes.categories.map(cat => ({
          id: getStrId(cat.id || cat._id) || "",
          title: cat.title,
          slug: cat.slug
        }));
      }

      if (subCategoriesRes && subCategoriesRes.success) {
        setSubCategories(subCategoriesRes.data || subCategoriesRes.subCategories || []);
      }

      setCatalog(prev => {
        const next = { ...prev, services: mappedBrands, categories: mappedCategories };
        saveCatalog(next);
        return next;
      });

      // Notify other components
      window.dispatchEvent(new Event("adminUserAppCatalogUpdated"));

    } catch (error) {
      console.error('Failed to fetch catalog data:', error);
      toast.error(`Failed to load data: ${error.response?.data?.message || error.message}`);
    } finally {
      setFetching(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity]);

  // Load form data when editing or changing city
  useEffect(() => {
    if (!editingId) {
      // In create mode, if selectedCity changes, update cityIds but preserve other fields
      const defaultCats = filterTemplateId
        ? (categories.find(c => String(c.templateId || c.template) === String(filterTemplateId)) ? [String(categories.find(c => String(c.templateId || c.template) === String(filterTemplateId)).id || categories.find(c => String(c.templateId || c.template) === String(filterTemplateId))._id)] : [])
        : [];
      setForm(prev => ({
        ...prev,
        categoryIds: defaultCats,
        cityIds: selectedCity ? [selectedCity] : [],
      }));
      return;
    }
    const service = services.find((s) => s.id === editingId);
    if (!service) return;
    setForm({
      title: service.title || "",
      iconUrl: service.iconUrl || "",
      badge: service.badge || "",
      categoryIds: service.categoryIds || (service.categoryId ? [service.categoryId] : []),
      subCategoryIds: service.subCategoryIds || [],
      cityIds: service.cityIds || [],
      order: service.order !== undefined ? Number(service.order) : 0,
    });
  }, [editingId, services, selectedCity]);

  const reset = () => {
    setEditingId(null);
    const defaultCats = filterTemplateId
      ? (categories.find(c => String(c.templateId || c.template) === String(filterTemplateId)) ? [String(categories.find(c => String(c.templateId || c.template) === String(filterTemplateId)).id || categories.find(c => String(c.templateId || c.template) === String(filterTemplateId))._id)] : [])
      : [];
    setForm({
      title: "",
      iconUrl: "",
      badge: "",
      categoryIds: defaultCats,
      subCategoryIds: [],
      cityIds: selectedCity ? [selectedCity] : [],
      order: 0,
    });
    setIsModalOpen(false);
  };

  const openServicesModal = (brand) => {
    setSelectedBrandForServices(brand);
    setIsServicesModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingBrandIcon(true);
      const response = await brandService.uploadImage(file);
      if (response.success) {
        setForm((prev) => ({ ...prev, iconUrl: response.imageUrl }));
        toast.success("Icon uploaded!");
      } else {
        toast.error("Upload failed");
      }
    } catch (error) {
      console.error("Upload error response:", error.response?.data || error);
      toast.error(`Upload failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setUploadingBrandIcon(false);
    }
  };

  const isSubmitting = React.useRef(false);

  const upsert = async () => {
    if (loading || isSubmitting.current) return;
    isSubmitting.current = true;

    try {
      // Validate inputs
      const validationResult = brandSchema.safeParse({
        title: (form.title || "").trim(),
        categoryIds: form.categoryIds || [],
        subCategoryIds: form.subCategoryIds || [],
        iconUrl: (form.iconUrl || "").trim(),
        badge: (form.badge || "").trim(),
        order: Number(form.order || 0),
      });

      if (!validationResult.success) {
        toast.error(validationResult.error.errors[0].message);
        isSubmitting.current = false;
        return;
      }

      const { title, categoryIds, subCategoryIds, iconUrl, badge, order } = validationResult.data;
      const slug = slugify(title);

      setLoading(true);

      const serviceData = {
        title,
        slug,
        categoryIds,
        subCategoryIds: subCategoryIds || [],
        iconUrl: iconUrl || null,
        badge: badge || null,
        // Add cityId if selected, using form state which is synchronized
        cityIds: form.cityIds,
        order,
        // Default empty structures for legacy compatibility
        page: { banners: [], paymentOffers: [], serviceCategoriesGrid: [] },
        sections: []
      };

      if (editingId) {
        // Update
        const response = await brandService.update(editingId, serviceData);
        if (!response.success) {
          throw new Error(response.message || 'Failed to update brand');
        }
      } else {
        // Create
        const response = await brandService.create(serviceData);
        if (!response.success) {
          throw new Error(response.message || 'Failed to create brand');
        }
      }

      // Refresh data from server to ensure consistency
      await refreshData();

      toast.success(editingId ? "Brand updated" : "Brand created");
      reset();
    } catch (error) {
      console.error('Upsert brand error:', error);
      const apiMessage = error.response?.data?.message;
      toast.error(apiMessage || error.message || 'Failed to save brand.');
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this brand?")) return;

    try {
      setLoading(true);
      const response = await brandService.delete(id);

      if (response.success) {
        await refreshData();
        toast.success("Brand deleted");
      } else {
        throw new Error(response.message || 'Failed to delete brand');
      }
    } catch (error) {
      console.error('Delete brand error:', error);
      toast.error(error.message || 'Failed to delete brand.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to standardise response format
  const mapBrandResponse = (brand) => ({
    id: brand.id,
    title: brand.title,
    slug: brand.slug,
    categoryIds: (brand.categoryIds || []).map(id => String(id)),
    categoryId: brand.categoryId ? String(brand.categoryId) : null,
    iconUrl: brand.iconUrl || "",
    badge: brand.badge || "",
    routePath: brand.routePath || `/user/${brand.slug}`,
    cityIds: brand.cityIds || [],
    order: brand.order !== undefined ? Number(brand.order) : 0,
  });

  return (
    <div className="space-y-6">
      <CardShell icon={FiGrid}>
        {fetching && (
          <div className="text-center py-4 text-gray-500">Loading brands...</div>
        )}

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">{services.length} brands in catalog</div>

          <button
            onClick={() => {
              reset();
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <FiPlus className="w-4 h-4" />
            <span>Add Brand</span>
          </button>
        </div>

        {/* Category Filter */}
        <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <label className="block text-sm font-bold text-gray-700 mb-2">Filter by Category</label>
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-medium text-gray-700 shadow-sm cursor-pointer"
              >
                <option value="all">All Categories</option>
                {filteredCategoriesForForm.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-500 whitespace-nowrap px-2">
              <strong>{filteredBrands.length}</strong> brands
            </div>
          </div>
        </div>

        {fetching && (!services || services.length === 0) ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">No brands found.</p>
            {selectedCategoryFilter !== "all" && (
              <button
                onClick={() => setSelectedCategoryFilter("all")}
                className="mt-2 text-primary-600 font-semibold text-sm hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-12">#</th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-20">Icon</th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Categories</th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Badge</th>
                  <th className="text-left py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="text-center py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-32">Services</th>
                  <th className="text-right py-4 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredBrands.map((s, idx) => {
                  const uniqueKey = s.id ? `${s.id}-${idx}` : `brand-${idx}`;
                  return (
                    <tr key={uniqueKey} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4 text-sm font-semibold text-gray-600">{idx + 1}</td>
                      <td className="py-4 px-4">
                        {s.iconUrl ? (
                           <DynamicIcon icon={s.iconUrl} alt={s.title} className="h-10 w-10 object-contain rounded-md border border-gray-200 bg-white p-1" />
                        ) : (
                          <div className="h-10 w-10 bg-gray-100 rounded-md border border-gray-200 flex items-center justify-center">
                            <FiImage className="text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-gray-900">{s.title || "Untitled"}</div>
                        <div className="text-xs text-gray-400">{s.slug}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1">
                          {(s.categoryTitles && s.categoryTitles.length > 0) ? (
                            s.categoryTitles.map((title, tIdx) => (
                              <span key={`t-${tIdx}`} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold border border-blue-100">
                                {title}
                              </span>
                            ))
                          ) : (s.categoryIds && s.categoryIds.length > 0) ? (
                            s.categoryIds.map((catId, cIdx) => {
                              const cleanCatId = String(catId).trim();
                              const cat = categories.find(c => String(c.id).trim() === cleanCatId);
                              const catKey = catId ? `cat-${catId}-${cIdx}` : `cat-${cIdx}`;
                              if (cat) {
                                return (
                                  <span key={catKey} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold border border-blue-100">
                                    {cat.title}
                                  </span>
                                );
                              }
                              return (
                                <span key={catKey} className="px-2 py-0.5 bg-red-50 text-red-700 rounded text-[10px] font-bold border border-red-100" title={`ID: ${cleanCatId}`}>
                                  Unknown ({cleanCatId.slice(-4)})
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-gray-400 italic text-xs">Uncategorized</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {s.badge ? (
                          <span className="inline-block px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-700 rounded">{s.badge}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="number"
                          min="0"
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          value={s.order !== undefined ? s.order : 0}
                          onChange={async (e) => {
                            const val = parseInt(e.target.value, 10);
                            const newOrder = isNaN(val) ? 0 : Math.max(0, val);
                            
                            // Optimistic UI update
                            setCatalog(prev => {
                              const updatedServices = prev.services.map(svc => 
                                svc.id === s.id ? { ...svc, order: newOrder } : svc
                              );
                              return { ...prev, services: updatedServices };
                            });

                            try {
                              const response = await brandService.update(s.id, {
                                title: s.title,
                                categoryIds: s.categoryIds,
                                subCategoryIds: s.subCategoryIds,
                                iconUrl: s.iconUrl,
                                badge: s.badge,
                                cityIds: s.cityIds,
                                order: newOrder
                              });
                              if (!response.success) {
                                throw new Error(response.message || 'Failed to update order');
                              }
                            } catch (err) {
                              console.error('Failed to update brand order inline:', err);
                              toast.error('Failed to save order change');
                              // Revert backend state
                              refreshData();
                            }
                          }}
                        />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => openServicesModal(s)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200 transition-colors"
                        >
                          <FiGrid className="w-3.5 h-3.5" />
                          Manage ({s.id ? 'Services' : 'Wait'})
                        </button>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingId(s.id);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => remove(s.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardShell>

      {/* Brand Form Modal */}
      <Modal isOpen={isModalOpen} onClose={reset} title={editingId ? "Edit Brand" : "Add New Brand"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Brand Name</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter brand name"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Categories (Select Logic)</label>
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-gray-50">
              {filteredCategoriesForForm.map((cat) => (
                <label key={cat.id} className="flex items-center space-x-2 p-1.5 hover:bg-gray-100 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.categoryIds.includes(String(cat.id))}
                    onChange={(e) => {
                      const catId = String(cat.id);
                      if (e.target.checked) {
                        setForm(prev => ({ ...prev, categoryIds: [...prev.categoryIds, catId] }));
                      } else {
                        setForm(prev => ({ ...prev, categoryIds: prev.categoryIds.filter((id) => id !== catId) }));
                      }
                    }}
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{cat.title}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">SubCategories (Optional)</label>
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-2 bg-gray-50">
              {subCategories
                .filter(sub => form.categoryIds.includes(String(sub.categoryId?._id || sub.categoryId || "")) && sub.hasBrand)
                .map((sub) => (
                <label key={sub._id || sub.id} className="flex items-center space-x-2 p-1.5 hover:bg-gray-100 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.subCategoryIds.includes(String(sub._id || sub.id))}
                    onChange={(e) => {
                      const subId = String(sub._id || sub.id);
                      if (e.target.checked) {
                        setForm(prev => ({ ...prev, subCategoryIds: [...prev.subCategoryIds, subId] }));
                      } else {
                        setForm(prev => ({ ...prev, subCategoryIds: prev.subCategoryIds.filter((id) => id !== subId) }));
                      }
                    }}
                    className="rounded text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">{sub.title}</span>
                </label>
              ))}
              {subCategories.filter(sub => form.categoryIds.includes(String(sub.categoryId?._id || sub.categoryId || ""))).length === 0 && (
                <span className="text-sm text-gray-500 italic p-1">No subcategories available for selected categories.</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Brand Icon</label>
            <div className="space-y-3">
              <textarea
                value={form.iconUrl?.startsWith('<svg') ? form.iconUrl : ''}
                onChange={(e) => setForm({ ...form, iconUrl: e.target.value })}
                placeholder="Paste raw SVG code here... OR upload an image below"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white font-mono text-xs"
                rows="2"
              />
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                  {form.iconUrl ? (
                    <DynamicIcon icon={form.iconUrl} alt="Preview" className="w-full h-full object-contain p-1" />
                  ) : (
                    <FiImage className="text-gray-400 w-6 h-6" />
                  )}
                </div>
                <label className="cursor-pointer px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors text-sm shadow-sm">
                  <input type="file" className="hidden" accept="image/*,.svg" onChange={handleFileUpload} />
                  {uploadingBrandIcon ? "Uploading..." : "Upload New Icon"}
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Badge (Optional)</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. Popular"
              value={form.badge}
              onChange={(e) => setForm({ ...form, badge: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Display Order (Minimum 0)</label>
            <input
              type="number"
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. 0"
              value={form.order}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setForm({ ...form, order: isNaN(val) ? 0 : Math.max(0, val) });
              }}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-4">
            <button
              onClick={reset}
              className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={upsert}
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Brand"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Services Management Modal */}
      {selectedBrandForServices && (
        <BrandServicesModal
          isOpen={isServicesModalOpen}
          onClose={() => {
            setIsServicesModalOpen(false);
            setSelectedBrandForServices(null);
          }}
          brand={selectedBrandForServices}
          subCategories={subCategories}
        />
      )}
    </div>
  );
};

export default BrandsPage;
