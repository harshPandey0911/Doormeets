import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  FiFolder, FiPackage, FiPercent, FiFileText, FiPlus, FiEdit, FiTrash2, 
  FiSave, FiX, FiSearch, FiLayers, FiCheckCircle, FiDollarSign, FiClock, FiGrid, FiImage 
} from 'react-icons/fi';
import * as paintingService from '../../services/paintingService';
import uploadToCloudinary from '../../../../utils/cloudinaryUpload';
import ConsultationDashboard from './ConsultationDashboard';
import PaintingPricingConfig from './PaintingPricingConfig';

const PaintingManagement = ({ defaultTab = 'brands' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // States for lists
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [rates, setRates] = useState([]);
  const [quotations, setQuotations] = useState([]);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Form Modal States
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('brand'); // 'brand' | 'product' | 'rate' | 'quotation'
  const [editingId, setEditingId] = useState(null);

  // Form states
  const [brandForm, setBrandForm] = useState({ name: '', logo: '', description: '', status: true });
  const [productForm, setProductForm] = useState({
    brandId: '', application: 'INTERIOR', productType: 'PAINT', paintName: '',
    category: 'NOT_APPLICABLE', finish: '', unit: '1L', price: '', coverage: '',
    warranty: '', washable: false, status: true
  });
  const [rateForm, setRateForm] = useState({
    workType: 'FRESH', application: 'INTERIOR', includes: [], pricePerSqft: '', status: true
  });
  const [quoteForm, setQuoteForm] = useState({
    customerName: '', customerPhone: '', interiorArea: 0, exteriorArea: 0,
    interiorPaintId: '', exteriorPaintId: '', labourId: '', discount: 0, gstPercentage: 18
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploadingLogo(true);
      const url = await uploadToCloudinary(file, 'painting_brands');
      setBrandForm(prev => ({ ...prev, logo: url }));
      toast.success('Logo uploaded successfully!');
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'brands') {
        const res = await paintingService.getBrands();
        if (res.success) setBrands(res.data);
      } else if (activeTab === 'products') {
        const [pRes, bRes] = await Promise.all([
          paintingService.getProducts(),
          paintingService.getBrands()
        ]);
        if (pRes.success) setProducts(pRes.data);
        if (bRes.success) setBrands(bRes.data);
      } else if (activeTab === 'rates') {
        const res = await paintingService.getLabourRates();
        if (res.success) setRates(res.data);
      } else if (activeTab === 'quotations') {
        const [qRes, pRes, rRes] = await Promise.all([
          paintingService.getQuotations(),
          paintingService.getProducts(),
          paintingService.getLabourRates()
        ]);
        if (qRes.success) setQuotations(res => qRes.data);
        if (pRes.success) setProducts(pRes.data);
        if (rRes.success) setRates(rRes.data);
      }
    } catch (error) {
      console.error('Failed to load painting management data:', error);
      toast.error('Failed to fetch records');
    } finally {
      setLoading(false);
    }
  };

  // Handlers for Brand
  const handleBrandSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await paintingService.updateBrand(editingId, brandForm);
        if (res.success) toast.success('Brand updated successfully');
      } else {
        const res = await paintingService.createBrand(brandForm);
        if (res.success) toast.success('Brand created successfully');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEditBrand = (brand) => {
    setBrandForm({ name: brand.name, logo: brand.logo || '', description: brand.description || '', status: brand.status });
    setEditingId(brand._id);
    setModalType('brand');
    setShowModal(true);
  };

  const handleDeleteBrand = async (id) => {
    if (!window.confirm('Are you sure you want to delete this brand and all its products?')) return;
    try {
      await paintingService.deleteBrand(id);
      toast.success('Brand deleted successfully');
      loadData();
    } catch (err) {
      toast.error('Failed to delete brand');
    }
  };

  // Handlers for Product
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...productForm, price: Number(productForm.price), coverage: Number(productForm.coverage) };
      if (editingId) {
        const res = await paintingService.updateProduct(editingId, payload);
        if (res.success) toast.success('Product updated successfully');
      } else {
        const res = await paintingService.createProduct(payload);
        if (res.success) toast.success('Product created successfully');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEditProduct = (prod) => {
    setProductForm({
      brandId: prod.brandId?._id || prod.brandId,
      application: prod.application,
      productType: prod.productType,
      paintName: prod.paintName,
      category: prod.category || 'NOT_APPLICABLE',
      finish: prod.finish || '',
      unit: prod.unit || '1L',
      price: prod.price,
      coverage: prod.coverage,
      warranty: prod.warranty || '',
      washable: prod.washable || false,
      status: prod.status
    });
    setEditingId(prod._id);
    setModalType('product');
    setShowModal(true);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await paintingService.deleteProduct(id);
      toast.success('Product deleted');
      loadData();
    } catch (err) {
      toast.error('Failed to delete product');
    }
  };

  // Handlers for Labour Rates
  const handleRateSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...rateForm, pricePerSqft: Number(rateForm.pricePerSqft) };
      if (editingId) {
        const res = await paintingService.updateLabourRate(editingId, payload);
        if (res.success) toast.success('Labour rate updated');
      } else {
        const res = await paintingService.createLabourRate(payload);
        if (res.success) toast.success('Labour rate created');
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEditRate = (rate) => {
    setRateForm({
      workType: rate.workType,
      application: rate.application,
      includes: rate.includes || [],
      pricePerSqft: rate.pricePerSqft,
      status: rate.status
    });
    setEditingId(rate._id);
    setModalType('rate');
    setShowModal(true);
  };

  const handleDeleteRate = async (id) => {
    if (!window.confirm('Delete this labour rate?')) return;
    try {
      await paintingService.deleteLabourRate(id);
      toast.success('Labour rate deleted');
      loadData();
    } catch (err) {
      toast.error('Failed to delete rate');
    }
  };

  // Handlers for Quotations
  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const res = await paintingService.updateQuotation(editingId, quoteForm);
        if (res.success) {
          toast.success('Quotation updated successfully!');
        }
      } else {
        const res = await paintingService.createQuotation(quoteForm);
        if (res.success) {
          toast.success('Quotation generated successfully!');
        }
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEditQuotation = (quote) => {
    setQuoteForm({
      customerName: quote.customerName,
      customerPhone: quote.customerPhone,
      interiorArea: quote.interiorArea || '',
      exteriorArea: quote.exteriorArea || '',
      interiorPaintId: quote.interiorPaintId?._id || quote.interiorPaintId || '',
      exteriorPaintId: quote.exteriorPaintId?._id || quote.exteriorPaintId || '',
      labourId: quote.labourId?._id || quote.labourId || '',
      discount: quote.calculation?.discount || '',
      gstPercentage: quote.gstPercentage || 18
    });
    setEditingId(quote._id);
    setModalType('quotation');
    setShowModal(true);
  };

  const handleDeleteQuotation = async (id) => {
    if (!window.confirm('Delete this quotation record?')) return;
    try {
      await paintingService.deleteQuotation(id);
      toast.success('Quotation deleted');
      loadData();
    } catch (err) {
      toast.error('Failed to delete quotation');
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    if (activeTab === 'brands') {
      setBrandForm({ name: '', logo: '', description: '', status: true });
      setModalType('brand');
    } else if (activeTab === 'products') {
      setProductForm({
        brandId: brands[0]?._id || '', application: 'INTERIOR', productType: 'PAINT', paintName: '',
        category: 'NOT_APPLICABLE', finish: '', unit: '1L', price: '', coverage: '',
        warranty: '', washable: false, status: true
      });
      setModalType('product');
    } else if (activeTab === 'rates') {
      setRateForm({ workType: 'FRESH', application: 'INTERIOR', includes: [], pricePerSqft: '', status: true });
      setModalType('rate');
    } else if (activeTab === 'quotations') {
      setQuoteForm({
        customerName: '', customerPhone: '', interiorArea: '', exteriorArea: '',
        interiorPaintId: '', exteriorPaintId: '', labourId: '', discount: '', gstPercentage: 18
      });
      setModalType('quotation');
    }
    setShowModal(true);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 sm:px-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painting Management</h1>
          <p className="text-sm text-gray-500">Configure brands, product prices, coverage, labor rates, and generate custom quotations.</p>
        </div>
        {activeTab !== 'consultations' && activeTab !== 'pricing' && (
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
          >
            <FiPlus className="w-5 h-5" />
            Add New {activeTab === 'brands' ? 'Brand' : activeTab === 'products' ? 'Product' : activeTab === 'rates' ? 'Labour Rate' : 'Quotation'}
          </button>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: 'brands', label: 'Paint Brands', icon: FiGrid },
          { id: 'products', label: 'Paint Products & Putty/Primer', icon: FiPackage },
          { id: 'rates', label: 'Labour Rates', icon: FiPercent },
          { id: 'quotations', label: 'Painting Quotations', icon: FiFileText },
          { id: 'pricing', label: 'Pricing Config', icon: FiDollarSign },
          { id: 'consultations', label: 'Live Consultations', icon: FiFileText }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm border-b-2 transition-all cursor-pointer ${
                isActive 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-6">
            {/* 1. BRANDS TAB */}
            {activeTab === 'brands' && (
              <div className="space-y-4">
                {brands.length === 0 ? (
                  <div className="text-center py-20 text-gray-400">No brands found. Click "Add New Brand" to start.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {brands.map(brand => (
                      <div key={brand._id} className="border border-gray-100 p-5 rounded-2xl hover:shadow-md transition-shadow relative">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            {brand.logo ? (
                              <img src={brand.logo} alt={brand.name} className="w-12 h-12 object-contain rounded-lg border border-gray-100 p-1" />
                            ) : (
                              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center font-bold text-blue-600 text-lg">
                                {brand.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <h3 className="font-bold text-gray-900">{brand.name}</h3>
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                brand.status 
                                  ? 'bg-green-50 text-green-700 border-green-100' 
                                  : 'bg-red-50 text-red-700 border-red-100'
                              }`}>
                                {brand.status ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 min-h-[40px] mt-2">{brand.description || 'No description provided.'}</p>
                        <div className="flex justify-end gap-2 border-t border-gray-50 pt-3 mt-3">
                          <button onClick={() => handleEditBrand(brand)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer">
                            <FiEdit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteBrand(brand._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. PRODUCTS TAB */}
            {activeTab === 'products' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-gray-50 pb-4 mb-4">
                  <div className="relative w-full sm:max-w-xs">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search paints, primers..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none">
                      <option value="all">All Brands</option>
                      {brands.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none">
                      <option value="all">All Types</option>
                      <option value="PAINT">Paint</option>
                      <option value="PUTTY">Putty</option>
                      <option value="PRIMER">Primer</option>
                    </select>
                  </div>
                </div>

                {products.length === 0 ? (
                  <div className="text-center py-20 text-gray-400">No products configured. Click "Add New Product" to start.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 text-xs font-bold text-gray-400 uppercase tracking-wider">
                          <th className="py-3 px-4">Brand</th>
                          <th className="py-3 px-4">Product Name</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Appl.</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4 text-right">Price</th>
                          <th className="py-3 px-4 text-right">Coverage</th>
                          <th className="py-3 px-4 text-right">Price/Sqft</th>
                          <th className="py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 text-sm">
                        {products
                          .filter(p => {
                            const nameMatch = p.paintName.toLowerCase().includes(searchQuery.toLowerCase());
                            const brandMatch = filterBrand === 'all' || (p.brandId?._id || p.brandId) === filterBrand;
                            const typeMatch = filterType === 'all' || p.productType === filterType;
                            return nameMatch && brandMatch && typeMatch;
                          })
                          .map(p => (
                            <tr key={p._id} className="hover:bg-gray-50/50">
                              <td className="py-3.5 px-4 font-bold text-gray-900">{p.brandId?.name || 'Unknown'}</td>
                              <td className="py-3.5 px-4 font-medium text-gray-800">{p.paintName}</td>
                              <td className="py-3.5 px-4">
                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                                  p.productType === 'PAINT' ? 'bg-purple-50 text-purple-700' :
                                  p.productType === 'PUTTY' ? 'bg-orange-50 text-orange-700' : 'bg-teal-50 text-teal-700'
                                }`}>
                                  {p.productType}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-xs font-semibold text-gray-600">{p.application}</td>
                              <td className="py-3.5 px-4 text-xs text-gray-500">{p.category?.replace('_', ' ')}</td>
                              <td className="py-3.5 px-4 text-right font-bold text-gray-900">₹{p.price} <span className="text-[10px] text-gray-400 font-normal">/ {p.unit}</span></td>
                              <td className="py-3.5 px-4 text-right font-semibold text-gray-700">{p.coverage} <span className="text-[10px] text-gray-400 font-normal">sqft</span></td>
                              <td className="py-3.5 px-4 text-right font-bold text-blue-600">₹{(p.price / p.coverage).toFixed(2)}</td>
                              <td className="py-3.5 px-4">
                                <div className="flex gap-2">
                                  <button onClick={() => handleEditProduct(p)} className="p-1 text-blue-600 hover:bg-blue-50 rounded cursor-pointer">
                                    <FiEdit className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => handleDeleteProduct(p._id)} className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer">
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
              </div>
            )}

            {/* 3. LABOUR RATES TAB */}
            {activeTab === 'rates' && (
              <div className="space-y-4">
                {rates.length === 0 ? (
                  <div className="text-center py-20 text-gray-400">No labour rates configured. Click "Add New Labour Rate" to start.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rates.map(rate => (
                      <div key={rate._id} className="border border-gray-100 p-5 rounded-2xl hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-bold text-gray-900 text-base">{rate.workType} Wall</h3>
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            rate.status ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                          }`}>
                            {rate.status ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="space-y-2 mt-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500 font-medium">Application</span>
                            <span className="font-bold text-gray-700">{rate.application}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 font-medium">Labour Price</span>
                            <span className="font-extrabold text-blue-600 text-base">₹{rate.pricePerSqft} / sqft</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-50">
                          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Includes:</span>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {rate.includes && rate.includes.length > 0 ? (
                              rate.includes.map(inc => (
                                <span key={inc} className="px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-600 rounded text-[10px] font-bold">
                                  {inc}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-400 italic">Labour only</span>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 border-t border-gray-50 pt-3 mt-3">
                          <button onClick={() => handleEditRate(rate)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer">
                            <FiEdit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteRate(rate._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 4. QUOTATIONS TAB */}
            {activeTab === 'quotations' && (
              <div className="space-y-4">
                {quotations.length === 0 ? (
                  <div className="text-center py-20 text-gray-400">No generated quotations found. Click "Add New Quotation" to calculate.</div>
                ) : (
                  <div className="space-y-6">
                    {quotations.map(quote => (
                      <div key={quote._id} className="border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-shadow">
                        <div className="flex flex-col md:flex-row justify-between gap-4 border-b border-gray-100 pb-4 mb-4">
                          <div>
                            <h3 className="font-extrabold text-gray-900 text-lg">{quote.customerName}</h3>
                            <p className="text-xs text-gray-500">{quote.customerPhone}</p>
                          </div>
                          <div className="flex md:items-end flex-col">
                            <span className="text-xs text-gray-400">Created: {new Date(quote.createdAt).toLocaleDateString()}</span>
                            <span className="text-xl font-extrabold text-blue-600 mt-1">₹{quote.calculation?.grandTotal}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Area Config</span>
                            <div className="font-semibold text-gray-800 mt-1">
                              {quote.interiorArea > 0 && <div>Interior: {quote.interiorArea} sqft</div>}
                              {quote.exteriorArea > 0 && <div>Exterior: {quote.exteriorArea} sqft</div>}
                            </div>
                          </div>
                          <div>
                            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Paint Selected</span>
                            <div className="font-semibold text-gray-800 mt-1">
                              {quote.interiorPaintId && <div>Int: {quote.interiorPaintId.paintName}</div>}
                              {quote.exteriorPaintId && <div>Ext: {quote.exteriorPaintId.paintName}</div>}
                            </div>
                          </div>
                          <div>
                            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Labour Configuration</span>
                            <div className="font-semibold text-gray-800 mt-1">
                              {quote.labourId ? `${quote.labourId.workType} Wall (₹${quote.labourId.pricePerSqft}/sqft)` : 'N/A'}
                            </div>
                          </div>
                          <div className="flex justify-end items-center gap-2">
                            <button onClick={() => handleEditQuotation(quote)} className="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-bold cursor-pointer">
                              <FiEdit className="w-4 h-4" /> Edit
                            </button>
                            <button onClick={() => handleDeleteQuotation(quote._id)} className="flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold cursor-pointer">
                              <FiTrash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        </div>

                        {/* Cost breakdown drawer */}
                        <div className="bg-gray-50 rounded-xl p-4 mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
                          <div>
                            <div className="text-gray-400">Paint Cost</div>
                            <div className="font-bold text-gray-800 mt-0.5">₹{quote.calculation?.paintCost}</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Putty Cost</div>
                            <div className="font-bold text-gray-800 mt-0.5">₹{quote.calculation?.puttyCost}</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Primer Cost</div>
                            <div className="font-bold text-gray-800 mt-0.5">₹{quote.calculation?.primerCost}</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Labour Cost</div>
                            <div className="font-bold text-gray-800 mt-0.5">₹{quote.calculation?.labourCost}</div>
                          </div>
                          <div>
                            <div className="text-gray-400">GST</div>
                            <div className="font-bold text-gray-800 mt-0.5">₹{quote.calculation?.gst}</div>
                          </div>
                          <div>
                            <div className="text-gray-400">Net Discount</div>
                            <div className="font-bold text-red-600 mt-0.5">-₹{quote.calculation?.discount}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 5. PRICING CONFIG TAB */}
            {activeTab === 'pricing' && (
              <PaintingPricingConfig />
            )}

            {/* 6. CONSULTATIONS TAB */}
            {activeTab === 'consultations' && (
              <ConsultationDashboard />
            )}
          </div>
        )}
      </div>

      {/* FORM MODALS */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">
                  {editingId ? 'Edit' : 'Add New'} {
                    modalType === 'brand' ? 'Paint Brand' :
                    modalType === 'product' ? 'Paint Product' :
                    modalType === 'rate' ? 'Labour Rate' : 'Painting Quotation'
                  }
                </h3>
                <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer">
                  <FiX className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Form Content */}
              <div className="overflow-y-auto p-6 flex-1">
                {/* BRAND FORM */}
                {modalType === 'brand' && (
                  <form id="brandForm" onSubmit={handleBrandSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Brand Name</label>
                      <input 
                        type="text" 
                        required 
                        value={brandForm.name}
                        onChange={(e) => setBrandForm({...brandForm, name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                        placeholder="e.g. Asian Paints, JSW"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Brand Logo</label>
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                          {brandForm.logo ? (
                            <img src={brandForm.logo} alt="Preview" className="w-full h-full object-contain p-1" />
                          ) : (
                            <FiImage className="text-gray-400 w-6 h-6" />
                          )}
                        </div>
                        <label className="cursor-pointer px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors text-sm shadow-sm">
                          <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                          {uploadingLogo ? "Uploading..." : "Upload Logo"}
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                      <textarea 
                        value={brandForm.description}
                        onChange={(e) => setBrandForm({...brandForm, description: e.target.value})}
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 resize-none"
                        placeholder="Enter brand details..."
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="brandStatus"
                        checked={brandForm.status}
                        onChange={(e) => setBrandForm({...brandForm, status: e.target.checked})}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="brandStatus" className="text-sm font-semibold text-gray-700">Active</label>
                    </div>
                  </form>
                )}

                {/* PRODUCT FORM */}
                {modalType === 'product' && (
                  <form id="productForm" onSubmit={handleProductSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Brand</label>
                        <select 
                          required
                          value={productForm.brandId}
                          onChange={(e) => setProductForm({...productForm, brandId: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 outline-none"
                        >
                          <option value="">Select Brand</option>
                          {brands.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Product Type</label>
                        <select 
                          required
                          value={productForm.productType}
                          onChange={(e) => setProductForm({...productForm, productType: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 outline-none"
                        >
                          <option value="PAINT">Paint</option>
                          <option value="PUTTY">Putty</option>
                          <option value="PRIMER">Primer</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Application</label>
                        <select 
                          required
                          value={productForm.application}
                          onChange={(e) => setProductForm({...productForm, application: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 outline-none"
                        >
                          <option value="INTERIOR">Interior</option>
                          <option value="EXTERIOR">Exterior</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                        <select 
                          required
                          value={productForm.category}
                          onChange={(e) => setProductForm({...productForm, category: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 outline-none"
                        >
                          <option value="NOT_APPLICABLE">Not Applicable</option>
                          <option value="ECONOMY">Economy</option>
                          <option value="PREMIUM">Premium</option>
                          <option value="SUPER_LUXURY">Super Luxury</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Paint / Item Name</label>
                      <input 
                        type="text" 
                        required 
                        value={productForm.paintName}
                        onChange={(e) => setProductForm({...productForm, paintName: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                        placeholder="e.g. PIXA, ORUS, PUTTY"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Finish</label>
                        <input 
                          type="text" 
                          value={productForm.finish}
                          onChange={(e) => setProductForm({...productForm, finish: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                          placeholder="Matte / Glossy"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Unit</label>
                        <input 
                          type="text" 
                          required 
                          value={productForm.unit}
                          onChange={(e) => setProductForm({...productForm, unit: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                          placeholder="e.g. 1L, 40KG"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Warranty</label>
                        <input 
                          type="text" 
                          value={productForm.warranty}
                          onChange={(e) => setProductForm({...productForm, warranty: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                          placeholder="e.g. 3 yrs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₹)</label>
                        <input 
                          type="number" 
                          required 
                          min="0"
                          value={productForm.price}
                          onChange={(e) => setProductForm({...productForm, price: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                          placeholder="325"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Coverage (sqft / unit)</label>
                        <input 
                          type="number" 
                          required 
                          min="1"
                          value={productForm.coverage}
                          onChange={(e) => setProductForm({...productForm, coverage: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                          placeholder="50"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="washable"
                          checked={productForm.washable}
                          onChange={(e) => setProductForm({...productForm, washable: e.target.checked})}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="washable" className="text-sm font-semibold text-gray-700">Washable</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="productStatus"
                          checked={productForm.status}
                          onChange={(e) => setProductForm({...productForm, status: e.target.checked})}
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="productStatus" className="text-sm font-semibold text-gray-700">Active</label>
                      </div>
                    </div>
                  </form>
                )}

                {/* LABOUR RATE FORM */}
                {modalType === 'rate' && (
                  <form id="rateForm" onSubmit={handleRateSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Work Type</label>
                        <select 
                          required
                          value={rateForm.workType}
                          onChange={(e) => setRateForm({...rateForm, workType: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 outline-none"
                        >
                          <option value="FRESH">Fresh</option>
                          <option value="REGULAR">Regular</option>
                          <option value="EXTERIOR">Exterior</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Application</label>
                        <select 
                          required
                          value={rateForm.application}
                          onChange={(e) => setRateForm({...rateForm, application: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 outline-none"
                        >
                          <option value="INTERIOR">Interior</option>
                          <option value="EXTERIOR">Exterior</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Price Per Sqft (₹)</label>
                      <input 
                        type="number" 
                        required 
                        min="0"
                        value={rateForm.pricePerSqft}
                        onChange={(e) => setRateForm({...rateForm, pricePerSqft: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                        placeholder="8"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Includes Consumables</label>
                      <div className="flex gap-4">
                        {['PUTTY', 'PRIMER', 'PAINT'].map(item => (
                          <div key={item} className="flex items-center gap-1.5">
                            <input 
                              type="checkbox"
                              id={`include_${item}`}
                              checked={rateForm.includes.includes(item)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setRateForm({...rateForm, includes: [...rateForm.includes, item]});
                                } else {
                                  setRateForm({...rateForm, includes: rateForm.includes.filter(i => i !== item)});
                                }
                              }}
                              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor={`include_${item}`} className="text-sm font-semibold text-gray-700">{item}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </form>
                )}

                {/* QUOTATION FORM */}
                {modalType === 'quotation' && (
                  <form id="quoteForm" onSubmit={handleQuoteSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Customer Name</label>
                        <input 
                          type="text" 
                          required 
                          value={quoteForm.customerName}
                          onChange={(e) => setQuoteForm({...quoteForm, customerName: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                          placeholder="Enter customer name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                        <input 
                          type="text" 
                          required 
                          value={quoteForm.customerPhone}
                          onChange={(e) => setQuoteForm({...quoteForm, customerPhone: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                          placeholder="e.g. 9876543210"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Interior Area (Sqft)</label>
                        <input 
                          type="number" 
                          min="0"
                          value={quoteForm.interiorArea}
                          onChange={(e) => setQuoteForm({...quoteForm, interiorArea: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                          placeholder="e.g. 4000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Exterior Area (Sqft)</label>
                        <input 
                          type="number" 
                          min="0"
                          value={quoteForm.exteriorArea}
                          onChange={(e) => setQuoteForm({...quoteForm, exteriorArea: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                          placeholder="e.g. 2000"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Interior Paint product</label>
                        <select 
                          value={quoteForm.interiorPaintId}
                          onChange={(e) => setQuoteForm({...quoteForm, interiorPaintId: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 outline-none"
                        >
                          <option value="">Select Paint</option>
                          {products.filter(p => p.productType === 'PAINT' && p.application === 'INTERIOR').map(p => (
                            <option key={p._id} value={p._id}>{p.brandId?.name} - {p.paintName} (₹{p.price})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Exterior Paint product</label>
                        <select 
                          value={quoteForm.exteriorPaintId}
                          onChange={(e) => setQuoteForm({...quoteForm, exteriorPaintId: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 outline-none"
                        >
                          <option value="">Select Paint</option>
                          {products.filter(p => p.productType === 'PAINT' && p.application === 'EXTERIOR').map(p => (
                            <option key={p._id} value={p._id}>{p.brandId?.name} - {p.paintName} (₹{p.price})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Labour Rate Config</label>
                        <select 
                          required
                          value={quoteForm.labourId}
                          onChange={(e) => setQuoteForm({...quoteForm, labourId: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 outline-none"
                        >
                          <option value="">Select Labour Rate</option>
                          {rates.map(r => (
                            <option key={r._id} value={r._id}>{r.workType} ({r.application}) - ₹{r.pricePerSqft}/sqft</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Flat Discount (₹)</label>
                        <input 
                          type="number" 
                          min="0"
                          value={quoteForm.discount}
                          onChange={(e) => setQuoteForm({...quoteForm, discount: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                          placeholder="e.g. 500"
                        />
                      </div>
                    </div>
                  </form>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 border border-gray-200 hover:bg-gray-100 font-semibold text-sm rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form={
                    modalType === 'brand' ? 'brandForm' :
                    modalType === 'product' ? 'productForm' :
                    modalType === 'rate' ? 'rateForm' : 'quoteForm'
                  }
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer"
                >
                  Save & Generate
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaintingManagement;
