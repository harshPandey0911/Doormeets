import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin } from 'react-icons/fi';
import api from '../../../../../services/api';
import { cityService } from '../../../services/cityService';

const PricingMatrixPage = ({ selectedCity }) => {
  const [pricings, setPricings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [brands, setBrands] = useState([]);
  const [cities, setCities] = useState([]);

  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPricing, setCurrentPricing] = useState(null);
  
  const [formData, setFormData] = useState({ 
    categoryId: '', 
    subCategoryId: '', 
    serviceId: '', 
    brandId: '', 
    cityId: '',
    basePrice: '',
    gstPercentage: 18,
    vendorProfit: '',
    isActive: true 
  });
  const [globalGst, setGlobalGst] = useState(18);
  const [vendorCgstRate, setVendorCgstRate] = useState(2.5);
  const [vendorSgstRate, setVendorSgstRate] = useState(2.5);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prcRes, catRes, subRes, srvRes, brndRes, cityRes, settingsRes] = await Promise.all([
        api.get('/admin/pricing'),
        api.get('/admin/categories'),
        api.get('/admin/subcategories'),
        api.get('/admin/services'),
        api.get('/admin/brands'),
        cityService.getAll(),
        api.get('/admin/settings').catch(() => null)
      ]);
      setPricings(prcRes.data.data || prcRes.data.pricings || []);
      setCategories(catRes.data.categories || catRes.data.data || []);
      setSubCategories(subRes.data.data || subRes.data.subCategories || []);
      setServices(srvRes.data.services || []);
      setBrands(brndRes.data.brands || []);

      let parsedCities = [];
      if (Array.isArray(cityRes)) parsedCities = cityRes;
      else if (cityRes?.cities) parsedCities = cityRes.cities;
      else if (cityRes?.data) parsedCities = cityRes.data;
      setCities(parsedCities);

      if (settingsRes?.data?.settings) {
        setGlobalGst(settingsRes.data.settings.serviceGstPercentage ?? 18);
        setVendorCgstRate(settingsRes.data.settings.vendorCgstPercentage ?? 2.5);
        setVendorSgstRate(settingsRes.data.settings.vendorSgstPercentage ?? 2.5);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const handleOpenModal = (pricing = null) => {
    setCurrentPricing(pricing);
    if (pricing) {
      setFormData({
        categoryId: pricing.categoryId?._id || '',
        subCategoryId: pricing.subCategoryId?._id || '',
        serviceId: pricing.serviceId?._id || '',
        brandId: pricing.brandId?._id || '',
        cityId: pricing.cityId?._id || pricing.cityId || '',
        finalCustomerPrice: pricing.finalCustomerPrice || pricing.basePrice || '',
        vendorLevel: 10,
        isActive: pricing.isActive
      });
    } else {
      setFormData({ 
        categoryId: '', subCategoryId: '', serviceId: '', brandId: '', cityId: '',
        finalCustomerPrice: '', vendorLevel: 10, isActive: true 
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const selectedCategory = categories.find(cat => (cat.id || cat._id) === formData.categoryId);
      if (selectedCategory) {
        if (selectedCategory.hasSubCategory !== false && !formData.subCategoryId) {
          alert("Subcategory is required for this category!");
          return;
        }
        if (selectedCategory.hasBrand !== false && !formData.brandId) {
          alert("Brand is required for this category!");
          return;
        }
      }

      const total = Number(formData.finalCustomerPrice);
      const payload = {
        ...formData,
        basePrice: total,
        gstPercentage: 0,
        vendorProfit: 0,
        finalCustomerPrice: total
      };

      if (currentPricing) {
        await api.put(`/admin/pricing/${currentPricing._id}`, payload);
      } else {
        await api.post('/admin/pricing', payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || 
                     (error.response?.data?.errors && error.response.data.errors[0]?.msg) || 
                     'Error saving pricing matrix';
      alert(errMsg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this pricing configuration?')) {
      try {
        await api.delete(`/admin/pricing/${id}`);
        fetchData();
      } catch (error) {
        alert('Error deleting pricing');
      }
    }
  };

  // Compute calculated fields for preview
  const totalBill = Number(formData.finalCustomerPrice || 0);
  const platformFee = totalBill * 0.20;
  const vendorShare = totalBill * 0.80;
  
  const vendorTaxFactor = (Number(vendorCgstRate) + Number(vendorSgstRate)) / 100;
  const platformGstFactor = globalGst / 100;
  
  const govtTax = platformFee ? (vendorShare * vendorTaxFactor) + ((platformFee - (vendorShare * vendorTaxFactor)) * platformGstFactor / (1 + platformGstFactor)) : 0;
  const adminBaseFee = platformFee - govtTax;
  const commissionAmount = vendorShare * (Number(formData.vendorLevel) / 100);
  const vendorNet = vendorShare - commissionAmount;
  const adminNet = adminBaseFee + commissionAmount;

  const filteredPricings = selectedCity
    ? pricings.filter(prc => prc.cityId?._id === selectedCity || prc.cityId === selectedCity)
    : pricings;

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Pricing Matrix</h2>
          <p className="text-sm text-gray-500">Manage deep hierarchy pricing combinations</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleOpenModal()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <FiPlus /> Add Pricing config
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-semibold text-gray-600">Hierarchy</th>
                <th className="p-4 font-semibold text-gray-600">City</th>
                <th className="p-4 font-semibold text-gray-600">Customer Bill</th>
                <th className="p-4 font-semibold text-gray-600">Vendor Share (80%)</th>
                <th className="p-4 font-semibold text-gray-600">Platform Fee (20%)</th>
                <th className="p-4 font-semibold text-gray-600 bg-green-50">Admin Net (est. L1)</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPricings.map(prc => (
                <tr key={prc._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold text-gray-800">{prc.serviceId?.title}</div>
                    <div className="text-xs text-gray-500">{prc.categoryId?.title} {prc.subCategoryId ? `> ${prc.subCategoryId.title}` : ''}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${prc.cityId ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                      {prc.cityId?.name || 'All Cities (Global)'}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-gray-800">₹{prc.finalCustomerPrice || prc.basePrice}</td>
                  <td className="p-4 text-blue-600 font-medium">₹{((prc.finalCustomerPrice || prc.basePrice) * 0.8).toFixed(2)}</td>
                  <td className="p-4 text-purple-600 font-medium">₹{((prc.finalCustomerPrice || prc.basePrice) * 0.2).toFixed(2)}</td>
                  <td className="p-4 bg-green-50 font-bold text-green-700">
                    ₹{(((prc.finalCustomerPrice || prc.basePrice) * 0.2 * 0.8474) + ((prc.finalCustomerPrice || prc.basePrice) * 0.8 * 0.1)).toFixed(2)}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${prc.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {prc.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 flex justify-end gap-2">
                    <button onClick={() => handleOpenModal(prc)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><FiEdit2 /></button>
                    <button onClick={() => handleDelete(prc._id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><FiTrash2 /></button>
                  </td>
                </tr>
              ))}
              {filteredPricings.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-gray-500">No pricing combinations defined yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">{currentPricing ? 'Edit Pricing Config' : 'Add Pricing Config'}</h3>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="pricing-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City Availability</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.cityId}
                      onChange={(e) => setFormData({...formData, cityId: e.target.value})}
                    >
                      <option value="">All Cities (Global Pricing)</option>
                      {cities.map(city => <option key={city._id || city.id} value={city._id || city.id}>{city.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.categoryId}
                      onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => <option key={cat.id || cat._id} value={cat.id || cat._id}>{cat.title}</option>)}
                    </select>
                  </div>
                  {(() => {
                    const selectedCategory = categories.find(cat => (cat.id || cat._id) === formData.categoryId);
                    const hasSubCategory = selectedCategory ? (selectedCategory.hasSubCategory !== false) : true;
                    if (!hasSubCategory) return null;

                    return (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SubCategory</label>
                        <select 
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          value={formData.subCategoryId}
                          onChange={(e) => setFormData({...formData, subCategoryId: e.target.value})}
                          required={hasSubCategory}
                        >
                          <option value="">Select SubCategory</option>
                          {subCategories
                            .filter(sub => !formData.categoryId || sub.categoryId?._id === formData.categoryId || sub.categoryId === formData.categoryId)
                            .map(sub => <option key={sub._id} value={sub._id}>{sub.title}</option>)}
                        </select>
                      </div>
                    );
                  })()}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                    <select 
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.serviceId}
                      onChange={(e) => setFormData({...formData, serviceId: e.target.value})}
                      required
                    >
                      <option value="">Select Service</option>
                      {services
                        .filter(srv => {
                          const selectedCategory = categories.find(cat => (cat.id || cat._id) === formData.categoryId);
                          const hasSubCategory = selectedCategory ? (selectedCategory.hasSubCategory !== false) : true;
                          if (hasSubCategory) {
                            return !formData.subCategoryId || srv.subCategoryId?._id === formData.subCategoryId || srv.subCategoryId === formData.subCategoryId;
                          } else {
                            // If category doesn't have subcategory, only match by categoryId
                            return srv.categoryId?._id === formData.categoryId || srv.categoryId === formData.categoryId;
                          }
                        })
                        .map(srv => <option key={srv._id || srv.id} value={srv._id || srv.id}>{srv.title}</option>)}
                    </select>
                  </div>
                  {(() => {
                    const selectedCategory = categories.find(cat => (cat.id || cat._id) === formData.categoryId);
                    const hasBrand = selectedCategory ? (selectedCategory.hasBrand !== false) : true;
                    if (!hasBrand) return null;

                    return (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                        <select 
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                          value={formData.brandId}
                          onChange={(e) => setFormData({...formData, brandId: e.target.value})}
                          required={hasBrand}
                        >
                          <option value="">Select Brand</option>
                          {brands
                            .filter(brnd => !formData.categoryId || 
                              (brnd.categoryId && (brnd.categoryId?._id === formData.categoryId || brnd.categoryId === formData.categoryId)) || 
                              (brnd.categoryIds && brnd.categoryIds.some(c => (c?._id || c) === formData.categoryId))
                            )
                            .map(brnd => <option key={brnd._id || brnd.id} value={brnd._id || brnd.id}>{brnd.title}</option>)}
                        </select>
                      </div>
                    );
                  })()}
                </div>

                <hr className="my-4" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Customer Price (₹)</label>
                    <input 
                      type="number" 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg font-bold"
                      value={formData.finalCustomerPrice}
                      onChange={(e) => setFormData({...formData, finalCustomerPrice: e.target.value})}
                      required
                      min="0"
                      placeholder="e.g. 1000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preview Vendor Level Commission</label>
                    <select 
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.vendorLevel}
                      onChange={(e) => setFormData({...formData, vendorLevel: e.target.value})}
                    >
                      <option value="10">Level 1 (10% Commission)</option>
                      <option value="15">Level 2 (15% Commission)</option>
                      <option value="20">Level 3 (20% Commission)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl mt-4">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Live Split Calculation</h4>
                  
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    {/* Left Column */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm border-b pb-2">
                        <span className="text-slate-500">Total Customer Bill</span>
                        <span className="font-bold text-slate-800">₹{totalBill.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Platform Fee (20%)</span>
                        <span className="font-semibold text-purple-600">₹{platformFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Vendor Share (80%)</span>
                        <span className="font-semibold text-blue-600">₹{vendorShare.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-t pt-2 mt-2">
                        <span className="text-slate-500">L{formData.vendorLevel === '10' ? '1' : formData.vendorLevel === '15' ? '2' : '3'} Commission ({formData.vendorLevel}%) <br/><span className="text-xs italic">deducted from Vendor Share</span></span>
                        <span className="font-semibold text-red-500">-₹{commissionAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-3 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center text-sm mb-2">
                        <span className="text-slate-500 text-xs uppercase font-bold">Net Payouts</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Govt Taxes (Est.)</span>
                        <span className="font-semibold text-orange-500">₹{govtTax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Vendor Net Earnings</span>
                        <span className="font-bold text-green-600 text-lg">₹{vendorNet.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Admin Net Profit</span>
                        <span className="font-bold text-blue-700 text-lg">₹{adminNet.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>


                <div className="mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-3 justify-end bg-gray-50">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
              <button type="submit" form="pricing-form" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save Pricing Config</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingMatrixPage;
