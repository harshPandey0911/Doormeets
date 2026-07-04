import React, { useState, useEffect } from "react";
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiSearch } from "react-icons/fi";
import { toast } from "react-hot-toast";
import CardShell from "../components/CardShell";
import Modal from "../components/Modal";
import { vendorCatalogService, categoryService, serviceService } from "../../../../../services/catalogService";
import api from "../../../../../services/api";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  basePrice: z.number().min(0, "Price must be non-negative"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  serviceIds: z.array(z.string()).optional(),
  customerPrice: z.number().min(0).optional(),
  vendorPayoutBase: z.number().min(0).optional()
});

const VendorServicesPage = ({ selectedCity }) => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [globalSettings, setGlobalSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    basePrice: "",
    description: "",
    categoryId: "",
    serviceIds: [],
    customerPrice: "",
    vendorPayoutBase: ""
  });

  // Fetch global settings to calculate GST splits on preview
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/settings/general');
        if (res.data && res.data.success) {
          setGlobalSettings(res.data.settings);
        }
      } catch (e) {
        // Fallback standard rates
        setGlobalSettings({
          commissionPercentage: 25,
          vendorCgstPercentage: 2.5,
          vendorSgstPercentage: 2.5
        });
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    loadServices();
    loadCategories();
    loadServicesList();
  }, []);

  const loadServicesList = async () => {
    try {
      const response = await serviceService.getAll();
      if (response.success) {
        setServicesList(response.services || []);
      }
    } catch (error) {
      console.error("Failed to load services list:", error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await categoryService.getAll();
      if (response.success) {
        setCategories(response.categories || []);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const loadServices = async () => {
    try {
      setFetching(true);
      const response = await vendorCatalogService.getAllServices();
      if (response.success) {
        setServices(response.services || []);
      }
    } catch (error) {
      console.error("Failed to load vendor services:", error);
      toast.error("Failed to load services");
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    const data = {
      name: form.name,
      basePrice: Number(form.customerPrice || form.basePrice || 0),
      description: form.description,
      categoryId: form.categoryId,
      serviceIds: form.serviceIds || [],
      customerPrice: Number(form.customerPrice || 0),
      vendorPayoutBase: Number(form.vendorPayoutBase || 0)
    };

    const result = schema.safeParse(data);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    if (data.vendorPayoutBase > data.customerPrice) {
      toast.error("Vendor payout cannot be greater than customer price");
      return;
    }

    try {
      setLoading(true);
      if (editingId) {
        const response = await vendorCatalogService.updateService(editingId, result.data);
        if (response.success) {
          toast.success("Service updated");
          loadServices();
          reset();
        }
      } else {
        const response = await vendorCatalogService.createService(result.data);
        if (response.success) {
          toast.success("Service created");
          loadServices();
          reset();
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error(error.response?.data?.message || "Failed to save service");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    try {
      setLoading(true);
      const response = await vendorCatalogService.deleteService(id);
      if (response.success) {
        toast.success("Service deleted");
        loadServices();
      }
    } catch (error) {
      toast.error("Failed to delete service");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setEditingId(null);
    setForm({
      name: "",
      basePrice: "",
      description: "",
      categoryId: "",
      serviceIds: [],
      customerPrice: "",
      vendorPayoutBase: ""
    });
    setIsModalOpen(false);
  };

  const openEdit = (svc) => {
    setEditingId(svc._id || svc.id);
    setForm({
      name: svc.name,
      basePrice: svc.customerPrice || svc.basePrice || svc.price || 0,
      description: svc.description || "",
      categoryId: svc.categoryId?._id || svc.categoryId || "",
      serviceIds: (svc.serviceIds || []).map(id => id._id || id),
      customerPrice: svc.customerPrice || svc.price || svc.basePrice || 0,
      vendorPayoutBase: svc.vendorPayoutBase || svc.price || svc.basePrice || 0
    });
    setIsModalOpen(true);
  };

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");

  const filteredServices = services.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategoryFilter === "All" ||
      (s.categoryId?._id === selectedCategoryFilter) ||
      (s.categoryId === selectedCategoryFilter) ||
      (s.categoryId?.id === selectedCategoryFilter); // Handle populated or raw ID
      
    let matchesCity = true;
    if (selectedCity) {
      const catId = s.categoryId?._id || s.categoryId;
      const parentCategory = categories.find(c => String(c.id || c._id) === String(catId));
      if (!parentCategory) {
        matchesCity = false;
      } else {
        const catCityIds = parentCategory.cityIds || [];
        if (catCityIds.length === 0) {
          matchesCity = false;
        } else {
          matchesCity = catCityIds.some(id => String(id) === String(selectedCity) || (id._id && String(id._id) === String(selectedCity)));
        }
      }
    }
    
    return matchesSearch && matchesCategory && matchesCity;
  });

  const getSplitsPreview = () => {
    const custPrice = parseFloat(form.customerPrice) || 0;
    const commPct = globalSettings?.commissionPercentage ?? 25;
    const cgstPct = globalSettings?.vendorCgstPercentage ?? 2.5;
    const sgstPct = globalSettings?.vendorSgstPercentage ?? 2.5;

    const platformCommissionAmount = (custPrice * commPct) / 100;
    const vendorCgstAmount = (custPrice * cgstPct) / 100;
    const vendorSgstAmount = (custPrice * sgstPct) / 100;
    const netVendorShare = custPrice - platformCommissionAmount + vendorCgstAmount + vendorSgstAmount;
    const adminGrossShare = platformCommissionAmount;
    
    // Taxable base and GST calculation for Platform Share
    const adminTaxableEarning = adminGrossShare / 1.18;
    const platformGstAmount = adminGrossShare - adminTaxableEarning;

    return {
      adminGrossShare,
      platformGstAmount,
      adminTaxableEarning,
      vendorCgstAmount,
      vendorSgstAmount,
      platformCommissionAmount,
      netVendorShare
    };
  };

  return (
    <div className="space-y-6">
      <CardShell title="Vendor Services Catalog" icon={FiPlus}>
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
          <div className="flex gap-4 w-full sm:w-auto flex-1">
            <div className="relative w-full sm:w-64">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="w-full sm:w-48">
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="All">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id || cat._id} value={cat.id || cat._id}>{cat.title}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            onClick={() => { reset(); setIsModalOpen(true); }}
            className="px-4 py-2 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 flex items-center gap-2 shrink-0"
          >
            <FiPlus /> Add Service
          </button>
        </div>

        {fetching ? (
          <div className="text-center py-8">Loading...</div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No services found.</div>
        ) : (
          <div className="overflow-x-auto border rounded-xl bg-white shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50 text-left border-b">
                <tr>
                  <th className="p-3.5 text-xs font-bold text-gray-500 uppercase">Category</th>
                  <th className="p-3.5 text-xs font-bold text-gray-500 uppercase">Name</th>
                  <th className="p-3.5 text-xs font-bold text-gray-500 uppercase">Linked Services</th>
                  <th className="p-3.5 text-xs font-bold text-gray-500 uppercase">Cust. Price</th>
                  <th className="p-3.5 text-xs font-bold text-gray-500 uppercase">Vendor Base</th>
                  <th className="p-3.5 text-xs font-bold text-gray-500 uppercase">Description</th>
                  <th className="p-3.5 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700">
                {filteredServices.map((s) => (
                  <tr key={s._id || s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 bg-violet-50 text-violet-700 border border-violet-100 rounded-full text-xs font-bold">
                        {s.categoryId?.title || "N/A"}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold text-gray-800">
                      <div className="flex flex-col">
                        <span>{s.name}</span>
                        {s.isVendorCreated && s.vendorId && (
                          <span className="text-[10px] text-purple-600 font-extrabold uppercase mt-1">
                            Added by: {s.vendorId.businessName || s.vendorId.name || 'Vendor'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {s.serviceIds && s.serviceIds.length > 0 ? (
                          s.serviceIds.map((srv, i) => (
                            <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold">
                              {srv.title || srv.name || srv}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 italic text-xs">All Category Services</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3.5 font-bold text-emerald-600">₹{s.customerPrice || s.price || 0}</td>
                    <td className="p-3.5 font-bold text-indigo-600">₹{s.vendorPayoutBase || s.price || 0}</td>
                    <td className="p-3.5 text-sm text-gray-500 truncate max-w-xs">{s.description || "—"}</td>
                    <td className="p-3.5 text-right flex justify-end gap-2">
                      <button onClick={() => openEdit(s)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(s._id || s.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardShell>

      <Modal isOpen={isModalOpen} onClose={reset} title={editingId ? "Edit Vendor Service Addon" : "Add Vendor Service Addon"}>
        <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm(p => ({ ...p, categoryId: e.target.value, serviceIds: [] }))}
                className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id || cat._id} value={cat.id || cat._id}>
                    {cat.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Addon Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. 10m Extension Wire"
              />
            </div>
          </div>

          {/* Service mapping selector */}
          {form.categoryId && (
            <div className="border border-gray-100 rounded-xl p-3 bg-gray-50/50">
              <label className="block text-xs font-bold text-gray-700 mb-2">🎯 Apply specifically to Services:</label>
              <div className="max-h-32 overflow-y-auto space-y-1.5 pr-2">
                {servicesList.filter(s => String(s.categoryId?._id || s.categoryId) === String(form.categoryId)).map(srv => {
                  const srvId = srv._id || srv.id;
                  const isChecked = form.serviceIds.includes(srvId);
                  return (
                    <label key={srvId} className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer hover:text-gray-900">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => setForm(p => ({
                          ...p,
                          serviceIds: isChecked ? p.serviceIds.filter(id => id !== srvId) : [...p.serviceIds, srvId]
                        }))}
                        className="accent-primary-600 rounded"
                      />
                      {srv.title}
                    </label>
                  );
                })}
                {servicesList.filter(s => String(s.categoryId?._id || s.categoryId) === String(form.categoryId)).length === 0 && (
                  <span className="text-xs text-gray-400 italic">No services configured under this category. Addon will apply to all.</span>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Customer Price (₹) *</label>
              <input
                type="number"
                min="0"
                value={form.customerPrice}
                onChange={(e) => setForm(p => ({ ...p, customerPrice: e.target.value }))}
                className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 font-bold"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Vendor Payout Base (₹) *</label>
              <input
                type="number"
                min="0"
                value={form.vendorPayoutBase}
                onChange={(e) => setForm(p => ({ ...p, vendorPayoutBase: e.target.value }))}
                className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 font-bold"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
              rows={2}
            />
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-md text-sm"
          >
            {loading ? "Saving..." : "Save Addon Item"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default VendorServicesPage;
