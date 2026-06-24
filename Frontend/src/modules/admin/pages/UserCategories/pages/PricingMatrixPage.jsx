import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiSettings, FiPercent } from 'react-icons/fi';
import api from '../../../../../services/api';
import { cityService } from '../../../services/cityService';

const PricingMatrixPage = ({ selectedCity, filterTemplateId, filterTemplateCode }) => {
  const isMinuteBased = filterTemplateCode === 'MINUTE_BASED';
  const isSubscription = filterTemplateCode === 'SUBSCRIPTION_BASED';
  const [pricings, setPricings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [brands, setBrands] = useState([]);
  const [cities, setCities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPricing, setCurrentPricing] = useState(null);

  const [globalSettings, setGlobalSettings] = useState(null);
  const [formData, setFormData] = useState({
    categoryId: '',
    subCategoryId: '',
    serviceId: '',
    brandId: '',
    cityId: '',
    customerPrice: '',
    pricePerMinute: '',
    minimumMinutes: 30,
    validityDays: 30,
    visitsCredits: 4,
    gstPercentage: 18,
    gstIncluded: true,
    platformCommission: 20,
    l1Commission: 10,
    l2Commission: 15,
    l3Commission: 20,
    isActive: true,
    packageTitle: ''
  });

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

      if (settingsRes?.data?.success) {
        setGlobalSettings(settingsRes.data.settings);
      }

      let parsedCities = [];
      if (Array.isArray(cityRes)) parsedCities = cityRes;
      else if (cityRes?.cities) parsedCities = cityRes.cities;
      else if (cityRes?.data) parsedCities = cityRes.data;
      setCities(parsedCities);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const handleOpenModal = (pricing = null) => {
    setCurrentPricing(pricing);
    
    // Resolve global commission settings with fallbacks
    const globalPlat = globalSettings?.commissionPercentage ?? 20;
    const globalL1 = globalSettings?.commissionRates?.level1 ?? 10;
    const globalL2 = globalSettings?.commissionRates?.level2 ?? 15;
    const globalL3 = globalSettings?.commissionRates?.level3 ?? 20;

    if (pricing) {
      setFormData({
        categoryId: pricing.categoryId?._id || '',
        subCategoryId: pricing.subCategoryId?._id || '',
        serviceId: pricing.serviceId?._id || '',
        brandId: pricing.brandId?._id || '',
        cityId: pricing.cityId?._id || pricing.cityId || '',
        customerPrice: pricing.customerPrice || '',
        pricePerMinute: pricing.pricePerMinute || '',
        minimumMinutes: pricing.minimumMinutes || 30,
        validityDays: pricing.validityDays || 30,
        visitsCredits: pricing.visitsCredits || 4,
        gstPercentage: pricing.gstPercentage ?? 18,
        gstIncluded: pricing.gstIncluded ?? true,
        platformCommission: pricing.platformCommission ?? globalPlat,
        l1Commission: pricing.l1Commission ?? globalL1,
        l2Commission: pricing.l2Commission ?? globalL2,
        l3Commission: pricing.l3Commission ?? globalL3,
        isActive: pricing.isActive ?? true,
        packageTitle: pricing.packageTitle || ''
      });
    } else {
      const defaultCatId = filterTemplateId
        ? (categories.find(c => String(c.templateId || c.template) === String(filterTemplateId))?._id || categories.find(c => String(c.templateId || c.template) === String(filterTemplateId))?.id || '')
        : '';
      setFormData({
        categoryId: defaultCatId,
        subCategoryId: '',
        serviceId: '',
        brandId: '',
        cityId: '',
        customerPrice: '',
        pricePerMinute: '',
        minimumMinutes: 30,
        validityDays: 30,
        visitsCredits: 4,
        gstPercentage: 18,
        gstIncluded: true,
        platformCommission: globalPlat,
        l1Commission: globalL1,
        l2Commission: globalL2,
        l3Commission: globalL3,
        isActive: true,
        packageTitle: ''
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
        // Brand checks based on Category settings (enableBrands and brandRequired)
        if (selectedCategory.enableBrands && selectedCategory.brandRequired && !formData.brandId) {
          alert("Brand is required for this category!");
          return;
        }
      }

      const payload = {
        ...formData,
        // Send optional brandId as null if brand is disabled
        brandId: (selectedCategory?.enableBrands !== false && formData.brandId) ? formData.brandId : null,
        // For MINUTE_BASED: customerPrice is the base charge, pricePerMinute is the extra rate per 10 mins
        customerPrice: Number(formData.customerPrice || 0),
        pricePerMinute: isMinuteBased ? Number(formData.pricePerMinute || 0) : null,
        minimumMinutes: isMinuteBased ? Number(formData.minimumMinutes || 30) : null,
        validityDays: isSubscription ? Number(formData.validityDays || 30) : null,
        visitsCredits: isSubscription ? Number(formData.visitsCredits || 4) : null,
        packageTitle: isSubscription ? formData.packageTitle || null : null,
        pricingType: isMinuteBased ? 'per_minute' : (isSubscription ? 'subscription' : 'fixed'),
        gstPercentage: Number(formData.gstPercentage),
        platformCommission: Number(formData.platformCommission),
        l1Commission: Number(formData.l1Commission),
        l2Commission: Number(formData.l2Commission),
        l3Commission: Number(formData.l3Commission)
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

  // Dynamic calculations helper
  const getCalculations = () => {
    const cp = Number(formData.customerPrice) || 0;
    const gstPct = Number(formData.gstPercentage) || 0;
    const gstInc = formData.gstIncluded;
    const pCommPct = Number(formData.platformCommission) || 0;
    const l1Pct = Number(formData.l1Commission) || 0;
    const l2Pct = Number(formData.l2Commission) || 0;
    const l3Pct = Number(formData.l3Commission) || 0;

    let totalCustomerPay = 0;
    let vendorShareInclusive = 0;
    let platformFeeInclusive = 0;

    if (gstInc) {
      totalCustomerPay = cp;
      platformFeeInclusive = cp * (pCommPct / 100);
      vendorShareInclusive = cp - platformFeeInclusive;
    } else {
      const platformBase = cp * (pCommPct / 100);
      const vendorBase = cp - platformBase;
      const platformGST = platformBase * (gstPct / 100);
      const vendorGST = vendorBase * 0.05; // 5% Vendor GST (2.5% CGST + 2.5% SGST)

      platformFeeInclusive = platformBase + platformGST;
      vendorShareInclusive = vendorBase + vendorGST;
      totalCustomerPay = platformFeeInclusive + vendorShareInclusive;
    }

    const platformTaxableBase = platformFeeInclusive / (1 + (gstPct / 100));
    const platformGstAmount = platformFeeInclusive - platformTaxableBase;

    const vendorTaxableBase = vendorShareInclusive / (1 + 0.05);
    const vendorGstAmount = vendorShareInclusive - vendorTaxableBase;

    const totalTaxableAmount = platformTaxableBase + vendorTaxableBase;
    const totalGstAmount = platformGstAmount + vendorGstAmount;

    const cgstAmount = (platformGstAmount / 2) + (vendorGstAmount / 2);
    const sgstAmount = (platformGstAmount / 2) + (vendorGstAmount / 2);

    const l1CommAmount = vendorShareInclusive * (l1Pct / 100);
    const l2CommAmount = vendorShareInclusive * (l2Pct / 100);
    const l3CommAmount = vendorShareInclusive * (l3Pct / 100);

    const payoutL1 = vendorShareInclusive - l1CommAmount;
    const payoutL2 = vendorShareInclusive - l2CommAmount;
    const payoutL3 = vendorShareInclusive - l3CommAmount;

    const profitL1 = platformTaxableBase + l1CommAmount;
    const profitL2 = platformTaxableBase + l2CommAmount;
    const profitL3 = platformTaxableBase + l3CommAmount;

    return {
      taxableAmount: totalTaxableAmount,
      gstAmount: totalGstAmount,
      cgstAmount,
      sgstAmount,
      platformCommissionAmount: platformFeeInclusive,
      vendorShare: vendorShareInclusive,
      l1CommAmount,
      l2CommAmount,
      l3CommAmount,
      payoutL1,
      payoutL2,
      payoutL3,
      profitL1,
      profitL2,
      profitL3,
      totalCustomerPay,
      platformTaxableBase,
      vendorTaxableBase
    };
  };

  const calcs = getCalculations();

  let filteredPricings = selectedCity
    ? pricings.filter(prc => prc.cityId?._id === selectedCity || prc.cityId === selectedCity)
    : pricings;

  if (filterTemplateId) {
    filteredPricings = filteredPricings.filter(prc => {
      const catId = prc.categoryId?._id || prc.categoryId;
      const category = categories.find(c => (c.id === catId || c._id === catId));
      return category && String(category.templateId || category.template) === String(filterTemplateId);
    });
  }

  const filteredCategoriesForForm = filterTemplateId
    ? categories.filter(c => String(c.templateId || c.template) === String(filterTemplateId))
    : categories;

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Pricing Matrix</h2>
          <p className="text-sm text-gray-500">Manage deep hierarchy pricing combinations with commission logic</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 font-semibold transition-all"
          >
            <FiPlus /> Add Pricing config
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading pricing...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-semibold text-gray-600">Hierarchy</th>
                <th className="p-4 font-semibold text-gray-600">City</th>
                <th className="p-4 font-semibold text-gray-600">Price (Customer pays)</th>
                <th className="p-4 font-semibold text-gray-600">Taxable Base</th>
                <th className="p-4 font-semibold text-gray-600">Platform Comm</th>
                <th className="p-4 font-semibold text-gray-600 bg-green-50">Admin profit (L1/L2/L3)</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPricings.map(prc => {
                const calculations = prc.calculations || {};
                const displayPrice = prc.gstIncluded ? prc.customerPrice : prc.customerPrice * (1 + (prc.gstPercentage || 18) / 100);
                const displayTaxable = prc.gstIncluded ? prc.customerPrice / (1 + (prc.gstPercentage || 18) / 100) : prc.customerPrice;
                const displayPlatComm = displayTaxable * ((prc.platformCommission || 15) / 100);
                const profL1 = displayPlatComm + (displayTaxable * ((prc.l1Commission || 5) / 100));
                const profL2 = displayPlatComm + (displayTaxable * ((prc.l2Commission || 8) / 100));
                const profL3 = displayPlatComm + (displayTaxable * ((prc.l3Commission || 10) / 100));

                return (
                  <tr key={prc._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-gray-800">
                        {prc.serviceId?.title} {prc.packageTitle ? `(${prc.packageTitle})` : ''}
                      </div>
                      <div className="text-xs text-gray-500">
                        {prc.categoryId?.title} {prc.subCategoryId ? `> ${prc.subCategoryId.title}` : ''} {prc.brandId ? `> ${prc.brandId.title}` : ''}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${prc.cityId ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                        {prc.cityId?.name || 'Global'}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-gray-800">
                      ₹{(displayPrice || 0).toFixed(2)}
                      {prc.pricingType === 'subscription' && (
                        <span className="block text-[10px] text-blue-600 font-bold mt-0.5">{prc.visitsCredits || 4} Visits / {prc.validityDays || 30} Days</span>
                      )}
                      <span className="text-[10px] block text-gray-400 font-semibold">{prc.gstIncluded ? 'GST Inc.' : 'GST Exc.'} ({prc.gstPercentage}%)</span>
                    </td>
                    <td className="p-4 text-blue-600 font-medium">₹{(displayTaxable || 0).toFixed(2)}</td>
                    <td className="p-4 text-purple-600 font-medium">₹{(displayPlatComm || 0).toFixed(2)} ({prc.platformCommission}%)</td>
                    <td className="p-4 bg-green-50 font-bold text-green-700">
                      ₹{profL1.toFixed(2)} / ₹{profL2.toFixed(2)} / ₹{profL3.toFixed(2)}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${prc.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {prc.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => handleOpenModal(prc)} className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"><FiEdit2 /></button>
                        <button onClick={() => handleDelete(prc._id)} className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[95vh] flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">{currentPricing ? 'Edit Pricing Config' : 'Add Pricing Config'}</h3>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="pricing-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">City Availability</label>
                    <select
                      className="w-full p-2.5 border border-gray-300 rounded-lg outline-none text-sm font-semibold"
                      value={formData.cityId}
                      onChange={(e) => setFormData({...formData, cityId: e.target.value})}
                    >
                      <option value="">All Cities (Global Pricing)</option>
                      {cities.map(city => <option key={city._id || city.id} value={city._id || city.id}>{city.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Category</label>
                    <select
                      className="w-full p-2.5 border border-gray-300 rounded-lg outline-none text-sm font-semibold"
                      value={formData.categoryId}
                      onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                      required
                    >
                      <option value="">Select Category</option>
                      {filteredCategoriesForForm.map(cat => <option key={cat.id || cat._id} value={cat.id || cat._id}>{cat.title}</option>)}
                    </select>
                  </div>
                  {(() => {
                    const selectedCategory = categories.find(cat => (cat.id || cat._id) === formData.categoryId);
                    const hasSubCategory = selectedCategory ? (selectedCategory.hasSubCategory !== false) : true;
                    if (!hasSubCategory) return null;

                    return (
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">SubCategory</label>
                        <select
                          className="w-full p-2.5 border border-gray-300 rounded-lg outline-none text-sm font-semibold"
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
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Service</label>
                    <select
                      className="w-full p-2.5 border border-gray-300 rounded-lg outline-none text-sm font-semibold"
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
                            return srv.categoryId?._id === formData.categoryId || srv.categoryId === formData.categoryId;
                          }
                        })
                        .map(srv => <option key={srv._id || srv.id} value={srv._id || srv.id}>{srv.title}</option>)}
                    </select>
                  </div>
                  {(() => {
                    const selectedCategory = categories.find(cat => (cat.id || cat._id) === formData.categoryId);
                    // Brand field is ONLY visible if the category explicitly enables brands
                    const showBrandField = selectedCategory ? (selectedCategory.enableBrands === true) : false;
                    if (!showBrandField) return null;

                    return (
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Brand</label>
                        <select
                          className="w-full p-2.5 border border-gray-300 rounded-lg outline-none text-sm font-semibold"
                          value={formData.brandId}
                          onChange={(e) => setFormData({...formData, brandId: e.target.value})}
                          required={selectedCategory.brandRequired === true}
                        >
                          <option value="">Select Brand {selectedCategory.brandRequired ? '(Required)' : '(Optional)'}</option>
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

                {/* Price fields — adapt based on template type */}
                {isMinuteBased ? (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">⏱</span>
                      <span className="text-xs font-bold text-blue-700 uppercase">Minute Based Pricing</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-blue-600 mb-1 uppercase">Base Charge (₹)</label>
                        <input
                          type="number"
                          className="w-full p-2.5 border border-blue-300 rounded-lg outline-none text-sm font-bold bg-white"
                          value={formData.customerPrice}
                          onChange={(e) => setFormData({...formData, customerPrice: e.target.value})}
                          required
                          min="0"
                          placeholder="e.g. 300"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-blue-600 mb-1 uppercase">Minimum Minutes</label>
                        <input
                          type="number"
                          className="w-full p-2.5 border border-blue-300 rounded-lg outline-none text-sm font-bold bg-white"
                          value={formData.minimumMinutes}
                          onChange={(e) => setFormData({...formData, minimumMinutes: parseInt(e.target.value) || 30})}
                          required
                          min="1"
                          placeholder="e.g. 30"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-blue-600 mb-1 uppercase">Extra Rate (₹/10 min)</label>
                        <input
                          type="number"
                          className="w-full p-2.5 border border-blue-300 rounded-lg outline-none text-sm font-bold bg-white"
                          value={formData.pricePerMinute}
                          onChange={(e) => setFormData({...formData, pricePerMinute: e.target.value})}
                          required
                          min="0"
                          placeholder="e.g. 100"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-blue-600 font-semibold">
                      Explanation: Customer pays a base charge of ₹{formData.customerPrice || 0} for the first {formData.minimumMinutes || 30} minutes. Every extra 10 minutes will cost ₹{formData.pricePerMinute || 0}.
                    </p>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-blue-200">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">GST (%)</label>
                        <input
                          type="number"
                          className="w-full p-2.5 border border-gray-300 rounded-lg outline-none text-sm font-semibold"
                          value={formData.gstPercentage}
                          onChange={(e) => setFormData({...formData, gstPercentage: e.target.value})}
                          required min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">GST Type</label>
                        <select
                          className="w-full p-2.5 border border-gray-300 rounded-lg outline-none text-sm font-semibold"
                          value={formData.gstIncluded ? 'true' : 'false'}
                          onChange={(e) => setFormData({...formData, gstIncluded: e.target.value === 'true'})}
                        >
                          <option value="true">GST Included</option>
                          <option value="false">GST Excluded</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : isSubscription ? (
                  <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">💳</span>
                      <span className="text-xs font-bold text-violet-700 uppercase">Subscription Pricing</span>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-violet-600 mb-1 uppercase">Select Subscription Plan *</label>
                      <select
                        className="w-full p-2.5 border border-violet-300 rounded-lg outline-none text-sm font-semibold bg-white"
                        value={formData.packageTitle || ''}
                        onChange={(e) => {
                          const selectedServiceObj = services.find(s => (s._id || s.id) === formData.serviceId);
                          const servicePackages = selectedServiceObj?.packages || [];
                          const selectedPkg = servicePackages.find(p => p.title === e.target.value);
                          setFormData({
                            ...formData,
                            packageTitle: e.target.value,
                            validityDays: selectedPkg ? (parseInt(selectedPkg.duration) || 30) : 30,
                            visitsCredits: selectedPkg ? (selectedPkg.visitsCredits || 4) : 4,
                            customerPrice: selectedPkg ? selectedPkg.price : ''
                          });
                        }}
                        required
                      >
                        <option value="">-- Choose Plan --</option>
                        {(() => {
                          const selectedServiceObj = services.find(s => (s._id || s.id) === formData.serviceId);
                          const servicePackages = selectedServiceObj?.packages || [];
                          return servicePackages.map((pkg, pIdx) => (
                            <option key={pIdx} value={pkg.title}>{pkg.title}</option>
                          ));
                        })()}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3 p-3 bg-violet-50/50 border border-violet-100 rounded-lg">
                      <div>
                        <label className="block text-xs font-bold text-violet-600 mb-1 uppercase">Subscription Price (₹) *</label>
                        <input
                          type="number"
                          className="w-full p-2.5 border border-violet-300 rounded-lg outline-none text-sm font-bold bg-white"
                          value={formData.customerPrice}
                          onChange={(e) => setFormData({...formData, customerPrice: e.target.value})}
                          required
                          min="0"
                          placeholder="e.g. 999"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-violet-600 mb-1 uppercase">Original Price (₹)</label>
                        <input
                          type="number"
                          className="w-full p-2.5 border border-violet-300 rounded-lg outline-none text-sm font-semibold bg-white text-gray-500 line-through"
                          value={formData.originalPrice || ''}
                          onChange={(e) => setFormData({...formData, originalPrice: e.target.value})}
                          min="0"
                          placeholder="e.g. 1499"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-violet-200">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">GST (%)</label>
                        <input
                          type="number"
                          className="w-full p-2.5 border border-gray-300 rounded-lg outline-none text-sm font-semibold"
                          value={formData.gstPercentage}
                          onChange={(e) => setFormData({...formData, gstPercentage: e.target.value})}
                          required min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">GST Type</label>
                        <select
                          className="w-full p-2.5 border border-gray-300 rounded-lg outline-none text-sm font-semibold"
                          value={formData.gstIncluded ? 'true' : 'false'}
                          onChange={(e) => setFormData({...formData, gstIncluded: e.target.value === 'true'})}
                        >
                          <option value="true">GST Included</option>
                          <option value="false">GST Excluded</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Customer Price (₹)</label>
                      <input
                        type="number"
                        className="w-full p-2.5 border border-gray-300 rounded-lg outline-none text-base font-bold"
                        value={formData.customerPrice}
                        onChange={(e) => setFormData({...formData, customerPrice: e.target.value})}
                        required min="0" placeholder="e.g. 1000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">GST (%)</label>
                      <input
                        type="number"
                        className="w-full p-2.5 border border-gray-300 rounded-lg outline-none text-sm font-semibold"
                        value={formData.gstPercentage}
                        onChange={(e) => setFormData({...formData, gstPercentage: e.target.value})}
                        required min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">GST Type</label>
                      <select
                        className="w-full p-2.5 border border-gray-300 rounded-lg outline-none text-sm font-semibold"
                        value={formData.gstIncluded ? 'true' : 'false'}
                        onChange={(e) => setFormData({...formData, gstIncluded: e.target.value === 'true'})}
                      >
                        <option value="true">GST Included</option>
                        <option value="false">GST Excluded</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Platform Comm %</label>
                    <input
                      type="number"
                      className="w-full p-2.5 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg outline-none text-sm font-semibold cursor-not-allowed"
                      value={formData.platformCommission}
                      readOnly
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">L1 Commission %</label>
                    <input
                      type="number"
                      className="w-full p-2.5 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg outline-none text-sm font-semibold cursor-not-allowed"
                      value={formData.l1Commission}
                      readOnly
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">L2 Commission %</label>
                    <input
                      type="number"
                      className="w-full p-2.5 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg outline-none text-sm font-semibold cursor-not-allowed"
                      value={formData.l2Commission}
                      readOnly
                      disabled
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">L3 Commission %</label>
                    <input
                      type="number"
                      className="w-full p-2.5 border border-gray-200 bg-gray-50 text-gray-500 rounded-lg outline-none text-sm font-semibold cursor-not-allowed"
                      value={formData.l3Commission}
                      readOnly
                      disabled
                    />
                  </div>
                  <p className="col-span-2 sm:col-span-4 text-[10px] text-gray-400 font-medium mt-1">
                    * These rates are read-only and automatically sync with the global <span className="font-bold">Commission & Fee Management</span> settings.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl mt-4">
                  <h4 className="text-xs font-bold text-slate-800 mb-4 uppercase tracking-wider">Live Split Calculation Details</h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Taxes column */}
                    <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                      <div className="text-xs font-bold uppercase text-slate-500">Tax Calculations</div>
                      <div className="flex justify-between items-center text-sm border-b pb-1.5">
                        <span className="text-slate-500">Customer Pay</span>
                        <span className="font-bold text-slate-800">₹{calcs.totalCustomerPay.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">Taxable Amount</span>
                        <span className="font-bold text-slate-800">₹{calcs.taxableAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">CGST ({(formData.gstPercentage / 2)}%)</span>
                        <span className="font-semibold text-gray-600">₹{calcs.cgstAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500">SGST ({(formData.gstPercentage / 2)}%)</span>
                        <span className="font-semibold text-gray-600">₹{calcs.sgstAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm font-bold border-t pt-1.5 mt-1">
                        <span className="text-slate-700">Total GST ({formData.gstPercentage}%)</span>
                        <span className="text-slate-700">₹{calcs.gstAmount.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Vendor payout column */}
                    <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm col-span-2">
                      <div className="text-xs font-bold uppercase text-slate-500">Vendor & Platform Commission Splits</div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 border-r border-gray-100 pr-4">
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>Platform Fee ({formData.platformCommission}%)</span>
                            <span className="font-semibold">₹{calcs.platformCommissionAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs text-gray-500 pb-2 border-b">
                            <span>Vendor Share (Base)</span>
                            <span className="font-semibold">₹{calcs.vendorShare.toFixed(2)}</span>
                          </div>
                          <div className="pt-2 text-xs font-bold text-blue-600">Commissions & Final Payouts</div>
                          <div className="text-xs flex justify-between text-gray-600">
                            <span>L1 Payout (₹{calcs.l1CommAmount.toFixed(1)} / {formData.l1Commission}%)</span>
                            <span className="font-bold text-green-600">₹{calcs.payoutL1.toFixed(1)}</span>
                          </div>
                          <div className="text-xs flex justify-between text-gray-600">
                            <span>L2 Payout (₹{calcs.l2CommAmount.toFixed(1)} / {formData.l2Commission}%)</span>
                            <span className="font-bold text-green-600">₹{calcs.payoutL2.toFixed(1)}</span>
                          </div>
                          <div className="text-xs flex justify-between text-gray-600">
                            <span>L3 Payout (₹{calcs.l3CommAmount.toFixed(1)} / {formData.l3Commission}%)</span>
                            <span className="font-bold text-green-600">₹{calcs.payoutL3.toFixed(1)}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-xs font-bold text-blue-700">Admin Net Profit</div>
                          <div className="text-xs flex justify-between text-gray-700 font-semibold mt-1">
                            <span>Admin Profit (L1 Vendor)</span>
                            <span className="text-blue-700 font-bold">₹{calcs.profitL1.toFixed(1)}</span>
                          </div>
                          <div className="text-xs flex justify-between text-gray-700 font-semibold">
                            <span>Admin Profit (L2 Vendor)</span>
                            <span className="text-blue-700 font-bold">₹{calcs.profitL2.toFixed(1)}</span>
                          </div>
                          <div className="text-xs flex justify-between text-gray-700 font-semibold">
                            <span>Admin Profit (L3 Vendor)</span>
                            <span className="text-blue-700 font-bold">₹{calcs.profitL3.toFixed(1)}</span>
                          </div>
                        </div>
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
                    <span className="text-sm font-semibold text-gray-700">Active pricing rule</span>
                  </label>
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-gray-100 flex gap-3 justify-end bg-gray-50">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2.5 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-bold">Cancel</button>
              <button type="submit" form="pricing-form" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-bold shadow-md hover:shadow-lg">Save Pricing Config</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingMatrixPage;
