import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin } from 'react-icons/fi';
import api from '../../../../../services/api';
import { cityService } from '../../../services/cityService';

const PricingMatrixPage = () => {
  const [pricings, setPricings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [brands, setBrands] = useState([]);
  const [cities, setCities] = useState([]);
  const [cityFilter, setCityFilter] = useState('');
  
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
        basePrice: pricing.basePrice,
        gstPercentage: pricing.gstPercentage,
        vendorProfit: pricing.vendorProfit,
        isActive: pricing.isActive
      });
    } else {
      setFormData({ 
        categoryId: '', subCategoryId: '', serviceId: '', brandId: '', cityId: '',
        basePrice: '', gstPercentage: globalGst, vendorProfit: '', isActive: true 
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

      const payload = {
        ...formData,
        basePrice: Number(formData.basePrice),
        gstPercentage: Number(formData.gstPercentage),
        vendorProfit: Number(formData.vendorProfit)
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
  const previewGstAmount = formData.basePrice ? (Number(formData.basePrice) * Number(formData.gstPercentage)) / 100 : 0;
  const previewFinalPrice = formData.basePrice ? Number(formData.basePrice) + previewGstAmount + Number(formData.vendorProfit || 0) : 0;

  const filteredPricings = cityFilter
    ? pricings.filter(prc => prc.cityId?._id === cityFilter || prc.cityId === cityFilter)
    : pricings;

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Pricing Matrix</h2>
          <p className="text-sm text-gray-500">Manage deep hierarchy pricing combinations</p>
        </div>
        <div className="flex items-center gap-3">
          {cities.length > 0 && (
            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm cursor-pointer"
            >
              <option value="">All Cities / Global</option>
              {cities.map(city => (
                <option key={city._id || city.id} value={city._id || city.id}>{city.name}</option>
              ))}
            </select>
          )}
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
                <th className="p-4 font-semibold text-gray-600">Base Price</th>
                <th className="p-4 font-semibold text-gray-600">GST %</th>
                <th className="p-4 font-semibold text-gray-600">Vendor Profit</th>
                <th className="p-4 font-semibold text-gray-600 bg-green-50">Final Price (User)</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPricings.map((prc) => (
                <tr key={prc._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="text-sm font-medium text-gray-800">{prc.serviceId?.title} {prc.brandId ? `- ${prc.brandId.title}` : ''}</div>
                    <div className="text-xs text-gray-500">{prc.categoryId?.title} {prc.subCategoryId ? `> ${prc.subCategoryId.title}` : ''}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${prc.cityId ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                      {prc.cityId?.name || 'All Cities (Global)'}
                    </span>
                  </td>
                  <td className="p-4">₹{prc.basePrice}</td>
                  <td className="p-4">{prc.gstPercentage}%</td>
                  <td className="p-4 text-blue-600 font-medium">₹{prc.vendorProfit}</td>
                  <td className="p-4 bg-green-50 font-bold text-green-700">₹{prc.finalCustomerPrice}</td>
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

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (₹)</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({...formData, basePrice: e.target.value})}
                      required
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GST (%)</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.gstPercentage}
                      onChange={(e) => setFormData({...formData, gstPercentage: e.target.value})}
                      required
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Profit (₹)</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.vendorProfit}
                      onChange={(e) => setFormData({...formData, vendorProfit: e.target.value})}
                      required
                      min="0"
                    />
                  </div>
                </div>

                <div className="bg-slate-100 p-4 rounded-lg mt-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-500">Calculated Final Price (Shown to User):</p>
                    <div className="text-xs text-slate-400 mt-1">
                      Base ({formData.basePrice || 0}) + GST ({previewGstAmount.toFixed(2)}) + Profit ({formData.vendorProfit || 0})
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    ₹{previewFinalPrice.toFixed(2)}
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
