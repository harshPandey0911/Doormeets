import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  FiPlus, FiEdit, FiTrash2, FiSearch, FiX, FiUpload, FiImage, 
  FiMove, FiInfo, FiChevronLeft, FiChevronRight, FiCopy, 
  FiEye, FiEyeOff, FiStar, FiCheck, FiFilter
} from 'react-icons/fi';
import * as paintingService from '../../services/paintingService';
import uploadToCloudinary from '../../../../utils/cloudinaryUpload';

const PaintProductsPage = ({ isNested = false }) => {
  // Data lists
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters state
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [recommendedFilter, setRecommendedFilter] = useState('all');
  const [vendorVisibleFilter, setVendorVisibleFilter] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);

  // Sorting
  const [sortBy, setSortBy] = useState('displayOrder');
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formValues, setFormValues] = useState({
    brandId: '',
    productName: '',
    productCode: '',
    sku: '',
    description: '',
    application: 'Interior',
    productType: 'Paint',
    category: 'Premium',
    finish: 'Matte',
    availablePackSizes: [{ size: '', unit: 'Litre' }],
    coverage: { value: '', unit: 'Sq.Ft/Litre' },
    price: '',
    taxPercentage: 18,
    warrantyYears: 0,
    washable: false,
    features: [],
    images: [],
    status: true,
    isFeatured: false,
    isRecommended: false,
    visibleToVendor: true,
    internalNotes: '',
    displayOrder: 0
  });

  // Auxiliary form helper states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Load paint brands for dropdowns
  const fetchBrands = async () => {
    try {
      const response = await paintingService.getBrands({ limit: 100 });
      if (response.success) {
        setBrands(response.data || []);
      }
    } catch (error) {
      console.error('Error loading paint brands:', error);
    }
  };

  // Load products list from server
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search: search.trim() || undefined,
        brandId: selectedBrand === 'all' ? undefined : selectedBrand,
        productType: selectedType === 'all' ? undefined : selectedType,
        application: selectedApplication === 'all' ? undefined : selectedApplication,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        status: statusFilter === 'all' ? undefined : statusFilter,
        isFeatured: featuredFilter === 'all' ? undefined : featuredFilter,
        isRecommended: recommendedFilter === 'all' ? undefined : recommendedFilter,
        visibleToVendor: vendorVisibleFilter === 'all' ? undefined : vendorVisibleFilter,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        sortBy,
        order: sortOrder
      };

      const response = await paintingService.getProducts(params);
      if (response.success) {
        setProducts(response.data || []);
        setTotalProducts(response.total || 0);
        setTotalPages(response.totalPages || 1);
      } else {
        toast.error(response.message || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Fetch products error:', error);
      toast.error('An error occurred loading product catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, selectedBrand, selectedType, selectedApplication, selectedCategory, statusFilter, featuredFilter, recommendedFilter, vendorVisibleFilter, sortBy, sortOrder]);

  // Debounce search/price filter inputs
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setPage(1);
      fetchProducts();
    }, 450);
    return () => clearTimeout(delayDebounce);
  }, [search, minPrice, maxPrice]);

  // Handle Sort Change on header click
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // Toggle inline switches
  const handleToggleStatus = async (product) => {
    try {
      const newStatus = !product.status;
      const response = await paintingService.updateProductStatus(product._id, newStatus);
      if (response.success) {
        toast.success(`Status updated successfully`);
        setProducts(products.map(p => p._id === product._id ? { ...p, status: newStatus } : p));
      } else {
        toast.error(response.message || 'Failed to toggle status');
      }
    } catch (error) {
      console.error('Status toggle error:', error);
      toast.error('Error toggling product status');
    }
  };

  const handleToggleFeature = async (product) => {
    try {
      const newFeatured = !product.isFeatured;
      const response = await paintingService.updateProductFeature(product._id, newFeatured);
      if (response.success) {
        toast.success(newFeatured ? 'Product marked as Featured' : 'Product removed from Featured');
        setProducts(products.map(p => p._id === product._id ? { ...p, isFeatured: newFeatured } : p));
      } else {
        toast.error(response.message || 'Failed to toggle featured status');
      }
    } catch (error) {
      console.error('Featured toggle error:', error);
      toast.error('Error toggling featured flag');
    }
  };

  const handleToggleRecommend = async (product) => {
    try {
      const newRecommend = !product.isRecommended;
      const response = await paintingService.updateProductRecommend(product._id, newRecommend);
      if (response.success) {
        toast.success(newRecommend ? 'Product marked as Recommended' : 'Product removed from Recommended');
        setProducts(products.map(p => p._id === product._id ? { ...p, isRecommended: newRecommend } : p));
      } else {
        toast.error(response.message || 'Failed to toggle recommended status');
      }
    } catch (error) {
      console.error('Recommended toggle error:', error);
      toast.error('Error toggling recommended flag');
    }
  };

  const handleToggleVendorVisibility = async (product) => {
    try {
      const newVisible = !product.visibleToVendor;
      const response = await paintingService.updateProductVendorVisibility(product._id, newVisible);
      if (response.success) {
        toast.success(newVisible ? 'Visible to vendors' : 'Hidden from vendors');
        setProducts(products.map(p => p._id === product._id ? { ...p, visibleToVendor: newVisible } : p));
      } else {
        toast.error(response.message || 'Failed to toggle vendor visibility');
      }
    } catch (error) {
      console.error('Vendor visible toggle error:', error);
      toast.error('Error toggling vendor visibility');
    }
  };

  // Duplicate Product Action
  const handleDuplicateProduct = (product) => {
    setEditingProduct(null); // Force creation behavior
    setFormValues({
      brandId: product.brandId?._id || product.brandId || '',
      productName: `${product.productName} (Copy)`,
      productCode: '', // Must be uniquely generated
      sku: '',         // Must be uniquely generated
      description: product.description || '',
      application: product.application || 'Interior',
      productType: product.productType || 'Paint',
      category: product.category || 'Premium',
      finish: product.finish || 'Matte',
      availablePackSizes: product.availablePackSizes?.map(p => ({ size: p.size, unit: p.unit })) || [{ size: '', unit: 'Litre' }],
      coverage: {
        value: product.coverage?.value || '',
        unit: product.coverage?.unit || 'Sq.Ft/Litre'
      },
      price: product.price || '',
      taxPercentage: product.taxPercentage !== undefined ? product.taxPercentage : 18,
      warrantyYears: product.warrantyYears !== undefined ? product.warrantyYears : 0,
      washable: !!product.washable,
      features: [...(product.features || [])],
      images: [...(product.images || [])],
      status: true, // Default to true
      isFeatured: !!product.isFeatured,
      isRecommended: !!product.isRecommended,
      visibleToVendor: !!product.visibleToVendor,
      internalNotes: product.internalNotes || '',
      displayOrder: products.length
    });
    setIsModalOpen(true);
    toast.success('Fields prefilled from duplicated product.');
  };

  // Open modal forms
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormValues({
      brandId: '',
      productName: '',
      productCode: '',
      sku: '',
      description: '',
      application: 'Interior',
      productType: 'Paint',
      category: 'Premium',
      finish: 'Matte',
      availablePackSizes: [{ size: '', unit: 'Litre' }],
      coverage: { value: '', unit: 'Sq.Ft/Litre' },
      price: '',
      taxPercentage: 18,
      warrantyYears: 0,
      washable: false,
      features: [],
      images: [],
      status: true,
      isFeatured: false,
      isRecommended: false,
      visibleToVendor: true,
      internalNotes: '',
      displayOrder: products.length
    });
    setNewFeatureText('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormValues({
      brandId: product.brandId?._id || product.brandId || '',
      productName: product.productName,
      productCode: product.productCode,
      sku: product.sku,
      description: product.description || '',
      application: product.application || 'Interior',
      productType: product.productType || 'Paint',
      category: product.category || 'Premium',
      finish: product.finish || 'Matte',
      availablePackSizes: product.availablePackSizes?.map(p => ({ size: p.size, unit: p.unit })) || [{ size: '', unit: 'Litre' }],
      coverage: {
        value: product.coverage?.value || '',
        unit: product.coverage?.unit || 'Sq.Ft/Litre'
      },
      price: product.price || '',
      taxPercentage: product.taxPercentage !== undefined ? product.taxPercentage : 18,
      warrantyYears: product.warrantyYears !== undefined ? product.warrantyYears : 0,
      washable: !!product.washable,
      features: [...(product.features || [])],
      images: [...(product.images || [])],
      status: product.status,
      isFeatured: !!product.isFeatured,
      isRecommended: !!product.isRecommended,
      visibleToVendor: !!product.visibleToVendor,
      internalNotes: product.internalNotes || '',
      displayOrder: product.displayOrder || 0
    });
    setNewFeatureText('');
    setIsModalOpen(true);
  };

  // Image Upload Gallery Handler
  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    try {
      setUploadingImage(true);
      const url = await uploadToCloudinary(file, 'painting_products');
      
      const newImage = {
        url,
        publicId: `painting_products/${Date.now()}`
      };

      setFormValues(prev => ({
        ...prev,
        images: [...prev.images, newImage]
      }));
      toast.success('Image uploaded and added to gallery!');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = (index) => {
    setFormValues(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Pack sizes dynamic array controllers
  const handleAddPackSize = () => {
    setFormValues(prev => ({
      ...prev,
      availablePackSizes: [...prev.availablePackSizes, { size: '', unit: 'Litre' }]
    }));
  };

  const handleRemovePackSize = (index) => {
    if (formValues.availablePackSizes.length === 1) {
      toast.error('At least one pack size is required');
      return;
    }
    setFormValues(prev => ({
      ...prev,
      availablePackSizes: prev.availablePackSizes.filter((_, i) => i !== index)
    }));
  };

  const handlePackSizeChange = (index, field, val) => {
    const list = [...formValues.availablePackSizes];
    list[index][field] = val;
    setFormValues(prev => ({ ...prev, availablePackSizes: list }));
  };

  // Feature tag helpers
  const handleAddFeature = () => {
    const text = newFeatureText.trim();
    if (!text) return;
    if (formValues.features.includes(text)) {
      toast.error('Feature already added');
      return;
    }
    setFormValues(prev => ({
      ...prev,
      features: [...prev.features, text]
    }));
    setNewFeatureText('');
  };

  const handleRemoveFeature = (feature) => {
    setFormValues(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature)
    }));
  };

  // Submit create/edit form
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!formValues.brandId) return toast.error('Please select a brand');
    if (!formValues.productName.trim()) return toast.error('Product Name is required');
    if (!formValues.productCode.trim()) return toast.error('Product Code is required');
    if (!formValues.sku.trim()) return toast.error('SKU is required');
    if (!formValues.price || parseFloat(formValues.price) <= 0) return toast.error('Price must be greater than zero');
    if (!formValues.coverage.value || parseFloat(formValues.coverage.value) <= 0) return toast.error('Coverage value must be greater than zero');
    
    for (const pack of formValues.availablePackSizes) {
      if (!pack.size || parseFloat(pack.size) <= 0) {
        return toast.error('Pack sizes must be greater than zero');
      }
    }

    try {
      setLoading(true);
      const payload = {
        ...formValues,
        productName: formValues.productName.trim(),
        productCode: formValues.productCode.trim().toUpperCase(),
        sku: formValues.sku.trim().toUpperCase(),
        price: parseFloat(formValues.price),
        coverage: {
          value: parseFloat(formValues.coverage.value),
          unit: formValues.coverage.unit.trim()
        },
        availablePackSizes: formValues.availablePackSizes.map(p => ({
          size: parseFloat(p.size),
          unit: p.unit.trim()
        }))
      };

      let response;
      if (editingProduct) {
        response = await paintingService.updateProduct(editingProduct._id, payload);
      } else {
        response = await paintingService.createProduct(payload);
      }

      if (response.success) {
        toast.success(editingProduct ? 'Paint product updated successfully' : 'Paint product created successfully');
        setIsModalOpen(false);
        fetchProducts();
      } else {
        toast.error(response.message || 'Validation error');
      }
    } catch (error) {
      console.error('Submit product error:', error);
      toast.error(error.response?.data?.message || 'An error occurred saving product');
    } finally {
      setLoading(false);
    }
  };

  // Deletion
  const handleDeleteProduct = async (product) => {
    if (!window.confirm(`Are you sure you want to delete ${product.productName}?`)) return;

    try {
      setLoading(true);
      const response = await paintingService.deleteProduct(product._id);
      if (response.success) {
        if (response.action === 'marked_inactive') {
          toast.success('Product is referenced in quotations. Marked Inactive instead of deleting.');
        } else {
          toast.success('Paint product soft-deleted successfully');
        }
        fetchProducts();
      } else {
        toast.error(response.message || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Delete product error:', error);
      toast.error('An error occurred during deletion');
    } finally {
      setLoading(false);
    }
  };

  // HTML5 Drag & drop row sorting
  const handleDragStart = (e, index) => {
    if (search || selectedBrand !== 'all' || selectedType !== 'all' || selectedApplication !== 'all' || selectedCategory !== 'all' || statusFilter !== 'all' || featuredFilter !== 'all' || recommendedFilter !== 'all' || vendorVisibleFilter !== 'all' || minPrice || maxPrice) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const list = [...products];
    const draggedItem = list[draggedIndex];
    list.splice(draggedIndex, 1);
    list.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setProducts(list);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    try {
      const ids = products.map(p => p._id);
      const response = await paintingService.reorderProducts(ids);
      if (response.success) {
        toast.success('Product sequence updated successfully');
      } else {
        toast.error(response.message || 'Failed to save product sequence');
        fetchProducts();
      }
    } catch (error) {
      console.error('Save product order error:', error);
      toast.error('An error occurred saving sequence');
      fetchProducts();
    }
  };

  const isDragAllowed = !search && selectedBrand === 'all' && selectedType === 'all' && selectedApplication === 'all' && selectedCategory === 'all' && statusFilter === 'all' && featuredFilter === 'all' && recommendedFilter === 'all' && vendorVisibleFilter === 'all' && !minPrice && !maxPrice;

  // Filter Active Brands for new product creations
  const activeBrands = brands.filter(b => b.status);

  return (
    <div className={isNested ? "space-y-6" : "max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6"}>
      {/* Header */}
      {!isNested ? (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Paint Products Catalog</h1>
            <p className="text-sm text-gray-500 mt-1">Configure and manage master paint products, pack sizes, coverage, and specifications.</p>
          </div>
          <button 
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            Add Paint Product
          </button>
        </div>
      ) : (
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Paint Products Catalog</h3>
            <p className="text-xs text-gray-400 mt-0.5">Manage pack sizes, coverage specs, and product listings.</p>
          </div>
          <button 
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            Add Product
          </button>
        </div>
      )}

      {/* Main filters bar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search catalog by name, code, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                <FiX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button 
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                showFiltersPanel ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FiFilter className="w-4 h-4" />
              Advanced Filters
            </button>
          </div>
        </div>

        {/* Extended filters drawer */}
        <AnimatePresence>
          {showFiltersPanel && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-gray-100 pt-4"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Brand</label>
                  <select 
                    value={selectedBrand} 
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-blue-500 cursor-pointer text-gray-700"
                  >
                    <option value="all">All Brands</option>
                    {brands.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Product Type</label>
                  <select 
                    value={selectedType} 
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-blue-500 cursor-pointer text-gray-700"
                  >
                    <option value="all">All Types</option>
                    <option value="Paint">Paint</option>
                    <option value="Primer">Primer</option>
                    <option value="Putty">Putty</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Application</label>
                  <select 
                    value={selectedApplication} 
                    onChange={(e) => setSelectedApplication(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-blue-500 cursor-pointer text-gray-700"
                  >
                    <option value="all">All Apps</option>
                    <option value="Interior">Interior</option>
                    <option value="Exterior">Exterior</option>
                    <option value="Universal">Universal</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category</label>
                  <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-blue-500 cursor-pointer text-gray-700"
                  >
                    <option value="all">All Categories</option>
                    <option value="Economy">Economy</option>
                    <option value="Premium">Premium</option>
                    <option value="Luxury">Luxury</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</label>
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-blue-500 cursor-pointer text-gray-700"
                  >
                    <option value="all">All Statuses</option>
                    <option value="true">Active Only</option>
                    <option value="false">Inactive Only</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Featured</label>
                  <select 
                    value={featuredFilter} 
                    onChange={(e) => setFeaturedFilter(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-blue-500 cursor-pointer text-gray-700"
                  >
                    <option value="all">All</option>
                    <option value="true">Featured Only</option>
                    <option value="false">Standard Only</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recommended</label>
                  <select 
                    value={recommendedFilter} 
                    onChange={(e) => setRecommendedFilter(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-blue-500 cursor-pointer text-gray-700"
                  >
                    <option value="all">All</option>
                    <option value="true">Recommended Only</option>
                    <option value="false">Non-Recommended</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Vendor Visible</label>
                  <select 
                    value={vendorVisibleFilter} 
                    onChange={(e) => setVendorVisibleFilter(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs outline-none focus:border-blue-500 cursor-pointer text-gray-700"
                  >
                    <option value="all">All</option>
                    <option value="true">Visible Only</option>
                    <option value="false">Hidden Only</option>
                  </select>
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Price Range (₹)</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="number" 
                      placeholder="Min" 
                      value={minPrice} 
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg p-1.5 text-xs outline-none focus:border-blue-500"
                    />
                    <span className="text-gray-400 text-xs">-</span>
                    <input 
                      type="number" 
                      placeholder="Max" 
                      value={maxPrice} 
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg p-1.5 text-xs outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Reorder instructions banner */}
      {isDragAllowed && products.length > 1 && (
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex items-center gap-2.5 text-xs text-blue-700">
          <FiInfo className="w-4 h-4 shrink-0 text-blue-600" />
          <span>Drag and drop rows using the <strong>handle icon (☰)</strong> to customize catalog display order.</span>
        </div>
      )}

      {/* Products table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[450px]">
        {loading && products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 gap-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-gray-400">Loading products...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center px-4">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 mb-4">
              <FiImage className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-gray-800 text-base">No Products Found</h3>
            <p className="text-sm text-gray-400 max-w-sm mt-1">Try tweaking filters or add a new painting product to the catalog.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/70 select-none">
                  {isDragAllowed && <th className="py-4 px-4 w-12 text-center">Order</th>}
                  <th className="py-4 px-4">Image</th>
                  <th className="py-4 px-4 cursor-pointer hover:bg-gray-100/50" onClick={() => handleSort('productName')}>Product Name {sortBy === 'productName' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                  <th className="py-4 px-4 cursor-pointer hover:bg-gray-100/50" onClick={() => handleSort('brand')}>Brand {sortBy === 'brand' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                  <th className="py-4 px-4">Type</th>
                  <th className="py-4 px-4">Application</th>
                  <th className="py-4 px-4">Category</th>
                  <th className="py-4 px-4">Pack Sizes</th>
                  <th className="py-4 px-4">Coverage</th>
                  <th className="py-4 px-4 cursor-pointer hover:bg-gray-100/50" onClick={() => handleSort('price')}>Price {sortBy === 'price' && (sortOrder === 'asc' ? '▲' : '▼')}</th>
                  <th className="py-4 px-4">Price / Sq.Ft</th>
                  <th className="py-4 px-4">Warranty</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-4 text-center">Featured</th>
                  <th className="py-4 px-4 text-center">Recom.</th>
                  <th className="py-4 px-4 text-center">Vendor</th>
                  <th className="py-4 px-4 text-center w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {products.map((product, index) => (
                  <tr 
                    key={product._id}
                    draggable={isDragAllowed}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`hover:bg-gray-50/50 transition-colors ${draggedIndex === index ? 'bg-blue-50/30' : ''}`}
                  >
                    {isDragAllowed && (
                      <td className="py-4 px-4 text-center">
                        <div className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-gray-100 rounded-lg inline-block text-gray-400 hover:text-gray-600 transition-colors">
                          <FiMove className="w-4 h-4" />
                        </div>
                      </td>
                    )}

                    <td className="py-4 px-4">
                      {product.images?.[0]?.url ? (
                        <img 
                          src={product.images[0].url} 
                          alt={product.productName} 
                          className="w-10 h-10 object-contain rounded-lg border border-gray-200 bg-white p-1"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                          <FiImage className="w-5 h-5" />
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900">{product.productName}</span>
                        <span className="text-[10px] font-mono text-gray-400">{product.productCode} • {product.sku}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-gray-800">{product.brandDetails?.name || product.brandId?.name || <span className="text-red-400 italic">Unknown Brand</span>}</td>
                    
                    <td className="py-4 px-4 text-gray-600">{product.productType}</td>
                    <td className="py-4 px-4 text-gray-600">{product.application}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                        product.category === 'Luxury' 
                          ? 'bg-purple-50 text-purple-700 border-purple-100'
                          : product.category === 'Premium'
                          ? 'bg-blue-50 text-blue-700 border-blue-100'
                          : 'bg-gray-50 text-gray-700 border-gray-100'
                      }`}>
                        {product.category}
                      </span>
                    </td>

                    <td className="py-4 px-4 max-w-xs truncate text-gray-600">
                      {product.availablePackSizes?.map(p => `${p.size} ${p.unit}`).join(', ')}
                    </td>

                    <td className="py-4 px-4 text-gray-600">{product.coverage?.value} {product.coverage?.unit}</td>

                    <td className="py-4 px-4 font-bold text-gray-900">₹{product.price?.toLocaleString()}</td>
                    
                    <td className="py-4 px-4 text-gray-500 font-medium">
                      {product.price && product.coverage?.value 
                        ? `₹${(product.price / product.coverage.value).toFixed(2)}/Sq.Ft` 
                        : '--'}
                    </td>

                    <td className="py-4 px-4 text-gray-600">{product.warrantyYears ? `${product.warrantyYears} Years` : 'No Warranty'}</td>

                    {/* Toggles */}
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(product)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          product.status ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          product.status ? 'translate-x-4' : 'translate-x-0'
                        }`} />
                      </button>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggleFeature(product)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          product.isFeatured ? 'bg-yellow-50 text-yellow-600' : 'text-gray-300 hover:bg-gray-100'
                        }`}
                        title="Toggle Featured"
                      >
                        <FiStar className={`w-4.5 h-4.5 ${product.isFeatured ? 'fill-yellow-500' : ''}`} />
                      </button>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggleRecommend(product)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          product.isRecommended ? 'bg-teal-50 text-teal-600' : 'text-gray-300 hover:bg-gray-100'
                        }`}
                        title="Toggle Recommended"
                      >
                        <FiCheck className="w-4.5 h-4.5" />
                      </button>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleToggleVendorVisibility(product)}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          product.visibleToVendor ? 'bg-blue-50 text-blue-600' : 'text-gray-300 hover:bg-gray-100'
                        }`}
                        title="Toggle Vendor Visibility"
                      >
                        {product.visibleToVendor ? <FiEye className="w-4.5 h-4.5" /> : <FiEyeOff className="w-4.5 h-4.5" />}
                      </button>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => handleOpenEditModal(product)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                          title="Edit"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDuplicateProduct(product)}
                          className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg cursor-pointer"
                          title="Duplicate"
                        >
                          <FiCopy className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-5 py-4 border-t border-gray-100 flex items-center justify-between select-none">
            <span className="text-xs text-gray-400 font-medium">
              Showing <strong className="text-gray-700">{((page - 1) * limit) + 1}</strong> to{' '}
              <strong className="text-gray-700">{Math.min(page * limit, totalProducts)}</strong> of{' '}
              <strong className="text-gray-700">{totalProducts}</strong> products
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                className={`p-2 border border-gray-200 rounded-xl transition-all cursor-pointer ${
                  page === 1 ? 'opacity-50 cursor-not-allowed bg-gray-50 text-gray-400' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center px-3 text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl">
                Page {page} of {totalPages}
              </div>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                className={`p-2 border border-gray-200 rounded-xl transition-all cursor-pointer ${
                  page === totalPages ? 'opacity-50 cursor-not-allowed bg-gray-50 text-gray-400' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{editingProduct ? 'Edit Paint Product' : 'Add New Paint Product'}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Define material pricing, pack sizes, and categories.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-gray-200 rounded-xl text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 overflow-hidden">
                {/* Form fields wrapper */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                
                {/* Brand selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Paint Brand <span className="text-red-500">*</span></label>
                    <select
                      required
                      value={formValues.brandId}
                      onChange={(e) => setFormValues({ ...formValues, brandId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-gray-50/30 cursor-pointer"
                    >
                      <option value="">Select Brand</option>
                      {/* For updates: allow existing brand ID even if inactive */}
                      {brands.map(b => {
                        const isInactive = !b.status;
                        const isCurrentSelection = editingProduct && (editingProduct.brandId?._id || editingProduct.brandId) === b._id;
                        if (isInactive && !isCurrentSelection) return null; // Hide other inactive brands
                        return (
                          <option key={b._id} value={b._id}>
                            {b.name} {isInactive ? '(Inactive)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Product Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      placeholder="e.g. Royale Luxury Emulsion"
                      required
                      value={formValues.productName}
                      onChange={(e) => setFormValues({ ...formValues, productName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-gray-50/30"
                    />
                  </div>
                </div>

                {/* Codes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Internal Product Code <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      placeholder="e.g. AP-ROY-MAT"
                      required
                      value={formValues.productCode}
                      onChange={(e) => setFormValues({ ...formValues, productCode: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-gray-50/30 font-mono uppercase"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">SKU Code <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      placeholder="e.g. SKU-APROYAL-01"
                      required
                      value={formValues.sku}
                      onChange={(e) => setFormValues({ ...formValues, sku: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-gray-50/30 font-mono uppercase"
                    />
                  </div>
                </div>

                {/* Dropdowns */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Application</label>
                    <select
                      value={formValues.application}
                      onChange={(e) => setFormValues({ ...formValues, application: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-gray-50/30 cursor-pointer"
                    >
                      <option value="Interior">Interior</option>
                      <option value="Exterior">Exterior</option>
                      <option value="Universal">Universal</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Product Type</label>
                    <select
                      value={formValues.productType}
                      onChange={(e) => setFormValues({ ...formValues, productType: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-gray-50/30 cursor-pointer"
                    >
                      <option value="Paint">Paint</option>
                      <option value="Primer">Primer</option>
                      <option value="Putty">Putty</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Category</label>
                    <select
                      value={formValues.category}
                      onChange={(e) => setFormValues({ ...formValues, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-gray-50/30 cursor-pointer"
                    >
                      <option value="Economy">Economy</option>
                      <option value="Premium">Premium</option>
                      <option value="Luxury">Luxury</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Finish</label>
                    <select
                      value={formValues.finish}
                      onChange={(e) => setFormValues({ ...formValues, finish: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-gray-50/30 cursor-pointer"
                    >
                      <option value="Matte">Matte</option>
                      <option value="Soft Sheen">Soft Sheen</option>
                      <option value="Satin">Satin</option>
                      <option value="Gloss">Gloss</option>
                      <option value="Textured">Textured</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Description</label>
                  <textarea 
                    rows="2"
                    placeholder="Enter basic details regarding this paint model..."
                    value={formValues.description}
                    onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-gray-50/30 resize-none"
                  />
                </div>

                {/* Available Pack Sizes */}
                <div className="space-y-2 border-t border-gray-50 pt-3">
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Available Pack Sizes <span className="text-red-500">*</span></label>
                    <button 
                      type="button" 
                      onClick={handleAddPackSize}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                    >
                      + Add Size
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {formValues.availablePackSizes.map((pack, idx) => (
                      <div key={idx} className="flex gap-3 items-center">
                        <input 
                          type="number" 
                          placeholder="Pack Size"
                          required
                          step="0.01"
                          value={pack.size}
                          onChange={(e) => handlePackSizeChange(idx, 'size', e.target.value)}
                          className="w-1/2 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-gray-50/30"
                        />
                        <select
                          value={pack.unit}
                          onChange={(e) => handlePackSizeChange(idx, 'unit', e.target.value)}
                          className="w-1/2 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-gray-50/30 cursor-pointer"
                        >
                          <option value="Litre">Litre</option>
                          <option value="Kg">Kg</option>
                        </select>
                        <button 
                          type="button" 
                          onClick={() => handleRemovePackSize(idx)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coverage & Pricing */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-50 pt-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Coverage <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        placeholder="Value (e.g. 120)"
                        required
                        step="0.1"
                        value={formValues.coverage.value}
                        onChange={(e) => setFormValues({
                          ...formValues,
                          coverage: { ...formValues.coverage, value: e.target.value }
                        })}
                        className="w-1/2 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-gray-50/30"
                      />
                      <select
                        value={formValues.coverage.unit}
                        onChange={(e) => setFormValues({
                          ...formValues,
                          coverage: { ...formValues.coverage, unit: e.target.value }
                        })}
                        className="w-1/2 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-gray-50/30 cursor-pointer"
                      >
                        <option value="Sq.Ft/Litre">Sq.Ft/Litre</option>
                        <option value="Sq.Ft/Bag">Sq.Ft/Bag</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Default Pack Price (₹) <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      placeholder="e.g. 450"
                      required
                      step="0.01"
                      value={formValues.price}
                      onChange={(e) => setFormValues({ ...formValues, price: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-gray-50/30"
                    />
                  </div>
                </div>

                {/* Tax & Warranty */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Tax Percentage (%)</label>
                    <input 
                      type="number" 
                      value={formValues.taxPercentage}
                      onChange={(e) => setFormValues({ ...formValues, taxPercentage: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-gray-50/30"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400">Warranty (Years)</label>
                    <input 
                      type="number" 
                      value={formValues.warrantyYears}
                      onChange={(e) => setFormValues({ ...formValues, warrantyYears: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-gray-50/30"
                    />
                  </div>

                  <div className="flex flex-col justify-end items-center h-full pb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Washable?</span>
                    <button
                      type="button"
                      onClick={() => setFormValues(prev => ({ ...prev, washable: !prev.washable }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        formValues.washable ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        formValues.washable ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Features list */}
                <div className="space-y-2 border-t border-gray-50 pt-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Special Features</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g. Anti Fungal, Low Odour"
                      value={newFeatureText}
                      onChange={(e) => setNewFeatureText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFeature())}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-gray-50/30"
                    />
                    <button 
                      type="button" 
                      onClick={handleAddFeature}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-sm font-semibold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  
                  {formValues.features.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1.5">
                      {formValues.features.map(f => (
                        <span key={f} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg border border-blue-100">
                          {f}
                          <button 
                            type="button" 
                            onClick={() => handleRemoveFeature(f)}
                            className="hover:bg-blue-100 p-0.5 rounded-full"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Image Gallery */}
                <div className="space-y-2 border-t border-gray-50 pt-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Product Images</label>
                  
                  <div className="grid grid-cols-4 gap-4">
                    {formValues.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl border border-gray-200 overflow-hidden bg-white p-1 group flex items-center justify-center">
                        <img src={img.url} alt="product asset" className="max-w-full max-h-full object-contain" />
                        <button 
                          type="button"
                          onClick={() => handleDeleteImage(idx)}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white rounded-2xl cursor-pointer"
                          title="Remove Image"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    
                    <label className="aspect-square border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-2xl flex flex-col items-center justify-center bg-gray-50/50 hover:bg-blue-50/10 cursor-pointer transition-all">
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageFileChange}
                        disabled={uploadingImage}
                      />
                      {uploadingImage ? (
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <div className="flex flex-col items-center text-gray-400">
                          <FiUpload className="w-5 h-5" />
                          <span className="text-[10px] font-bold mt-1">Upload</span>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Internal Notes */}
                <div className="space-y-1 border-t border-gray-50 pt-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Internal Notes</label>
                  <textarea 
                    rows="2"
                    placeholder="Enter internal pricing rules, logistics or memo..."
                    value={formValues.internalNotes}
                    onChange={(e) => setFormValues({ ...formValues, internalNotes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-gray-50/30 resize-none"
                  />
                </div>

                {/* Feature toggles */}
                <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-4">
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-semibold text-gray-800">Featured</span>
                    <button
                      type="button"
                      onClick={() => setFormValues(prev => ({ ...prev, isFeatured: !prev.isFeatured }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 mt-1 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        formValues.isFeatured ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        formValues.isFeatured ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-xs font-semibold text-gray-800">Recommended</span>
                    <button
                      type="button"
                      onClick={() => setFormValues(prev => ({ ...prev, isRecommended: !prev.isRecommended }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 mt-1 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        formValues.isRecommended ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        formValues.isRecommended ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-xs font-semibold text-gray-800">Vendor Visible</span>
                    <button
                      type="button"
                      onClick={() => setFormValues(prev => ({ ...prev, visibleToVendor: !prev.visibleToVendor }))}
                      className={`relative inline-flex h-5 w-9 shrink-0 mt-1 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        formValues.visibleToVendor ? 'bg-blue-500' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        formValues.visibleToVendor ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 border-t border-gray-100 p-4.5 bg-gray-50/50 shrink-0">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={uploadingImage}
                    className={`px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm transition-colors cursor-pointer ${
                      uploadingImage ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Save Product
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaintProductsPage;
