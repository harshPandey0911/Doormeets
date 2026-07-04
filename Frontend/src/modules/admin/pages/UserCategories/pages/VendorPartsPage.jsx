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
  hsnCode: z.string().optional(),
  basePrice: z.number().min(0, "Price must be non-negative"),
  description: z.string().optional(),
  categoryId: z.string().min(1, "Category is required"),
  serviceIds: z.array(z.string()).optional(),
  customerPrice: z.number().min(0).optional(),
  vendorPayoutBase: z.number().min(0).optional()
});

const VendorPartsPage = ({ selectedCity }) => {
  const [parts, setParts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [globalSettings, setGlobalSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    hsnCode: "",
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
    loadData();
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

  const loadData = async () => {
    try {
      setFetching(true);
      const [partsRes, catsRes] = await Promise.all([
        vendorCatalogService.getAllParts(),
        categoryService.getAll({ status: 'active' })
      ]);

      if (partsRes.success) {
        setParts(partsRes.parts || []);
      }
      if (catsRes.success) {
        setCategories(catsRes.categories || []);
      }
    } catch (error) {
      console.error("Failed to load catalog data:", error);
      toast.error("Failed to load data");
    } finally {
      setFetching(false);
    }
  };

  const handleSave = async () => {
    const data = {
      name: form.name,
      hsnCode: form.hsnCode,
      basePrice: Number(form.customerPrice || form.basePrice || 0),
      description: form.description,
      categoryId: form.categoryId || undefined,
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
        const response = await vendorCatalogService.updatePart(editingId, result.data);
        if (response.success) {
          toast.success("Part updated");
          loadData();
          reset();
        }
      } else {
        const response = await vendorCatalogService.createPart(result.data);
        if (response.success) {
          toast.success("Part created");
          loadData();
          reset();
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error(error.response?.data?.message || "Failed to save part");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this part?")) return;
    try {
      setLoading(true);
      const response = await vendorCatalogService.deletePart(id);
      if (response.success) {
        toast.success("Part deleted");
        loadData();
      }
    } catch (error) {
      toast.error("Failed to delete part");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setEditingId(null);
    setForm({
      name: "",
      hsnCode: "",
      basePrice: "",
      description: "",
      categoryId: "",
      serviceIds: [],
      customerPrice: "",
      vendorPayoutBase: ""
    });
    setIsModalOpen(false);
  };

  const openEdit = (part) => {
    setEditingId(part._id || part.id);
    setForm({
      name: part.name,
      hsnCode: part.hsnCode || "",
      basePrice: part.customerPrice || part.basePrice || part.price || 0,
      description: part.description || "",
      categoryId: part.categoryId?._id || part.categoryId || "",
      serviceIds: (part.serviceIds || []).map(id => id._id || id),
      customerPrice: part.customerPrice || part.price || part.basePrice || 0,
      vendorPayoutBase: part.vendorPayoutBase || part.price || part.basePrice || 0
    });
    setIsModalOpen(true);
  };

  const filteredParts = parts.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategoryFilter === "All" ||
      (s.categoryId?._id === selectedCategoryFilter) ||
      (s.categoryId === selectedCategoryFilter); // Handle populated or raw ID
      
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
      <CardShell title="Vendor Parts Catalog" icon={FiPlus}>
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-6">
          <div className="flex gap-4 w-full sm:w-auto flex-1">
            <div className="relative w-full sm:w-64">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search parts..."
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
                  <option key={cat.id} value={cat.id}>{cat.title}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => { reset(); setIsModalOpen(true); }}
            className="px-4 py-2 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 flex items-center gap-2 shrink-0"
          >
            <FiPlus /> Add Part
          </button>
        </div>

        {fetching ? (
          <div className="text-center py-8">Loading...</div>
        ) : filteredParts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No parts found matching filters.</div>
        ) : (
          <div className="overflow-x-auto border rounded-xl bg-white shadow-sm">
            <table className="w-full">
              <thead className="bg-gray-50 text-left border-b">
                <tr>
                  <th className="p-3.5 text-xs font-bold text-gray-500 uppercase">Category</th>
                  <th className="p-3.5 text-xs font-bold text-gray-500 uppercase">HSN</th>
                  <th className="p-3.5 text-xs font-bold text-gray-500 uppercase">Name</th>
                  <th className="p-3.5 text-xs font-bold text-gray-500 uppercase">Linked Services</th>
                  <th className="p-3.5 text-xs font-bold text-gray-500 uppercase">Cust. Price</th>
                  <th className="p-3.5 text-xs font-bold text-gray-500 uppercase">Vendor Base</th>
                  <th className="p-3.5 text-xs font-bold text-gray-500 uppercase">Description</th>
                  <th className="p-3.5 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700">
                {filteredParts.map((s) => (
                  <tr key={s._id || s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3.5">
                      {s.categoryId?.title ? (
                        <span className="px-2.5 py-1 bg-violet-50 text-violet-700 border border-violet-100 rounded-full text-xs font-bold">
                          {s.categoryId.title}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Uncategorized</span>
                      )}
                    </td>
                    <td className="p-3.5 font-medium text-xs text-gray-500">{s.hsnCode || "—"}</td>
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

      <Modal isOpen={isModalOpen} onClose={reset} title={editingId ? "Edit Vendor Part Addon" : "Add Vendor Part Addon"}>
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
                  <option key={cat.id || cat._id} value={cat.id || cat._id}>{cat.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Part Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. Copper Pipe (1m)"
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
              <label className="block text-xs font-bold text-gray-700 mb-1">HSN Number (Optional)</label>
              <input
                value={form.hsnCode}
                onChange={(e) => setForm(p => ({ ...p, hsnCode: e.target.value }))}
                className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. 8415"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Cust. Price *</label>
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
                <label className="block text-xs font-bold text-gray-700 mb-1">Vendor Base *</label>
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
            {loading ? "Saving..." : "Save Part Item"}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default VendorPartsPage;
