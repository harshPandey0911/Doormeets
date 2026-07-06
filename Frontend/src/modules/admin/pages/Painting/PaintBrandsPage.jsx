import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  FiPlus, FiEdit, FiTrash2, FiSearch, FiX, FiUpload, FiImage, 
  FiMove, FiInfo, FiChevronLeft, FiChevronRight 
} from 'react-icons/fi';
import * as paintingService from '../../services/paintingService';
import uploadToCloudinary from '../../../../utils/cloudinaryUpload';

const PaintBrandsPage = ({ isNested = false }) => {
  // State variables
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalBrands, setTotalBrands] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [formValues, setFormValues] = useState({
    name: '',
    code: '',
    description: '',
    logo: { url: '', publicId: '' },
    status: true,
    displayOrder: 0
  });

  // Logo uploading states
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoFile, setLogoFile] = useState(null);

  // Drag and drop states for reordering
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Fetch brands
  const fetchBrands = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter
      };
      
      const response = await paintingService.getBrands(params);
      if (response.success) {
        setBrands(response.data || []);
        setTotalBrands(response.total || 0);
        setTotalPages(response.totalPages || 1);
      } else {
        toast.error(response.message || 'Failed to fetch brands');
      }
    } catch (error) {
      console.error('Fetch brands error:', error);
      toast.error('Failed to load paint brands');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, [page, statusFilter]);

  // Debounced search trigger
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setPage(1);
      fetchBrands();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [search]);

  // Handle Enable/Disable Status toggle
  const handleToggleStatus = async (brand) => {
    try {
      const newStatus = !brand.status;
      const response = await paintingService.updateBrandStatus(brand._id, newStatus);
      if (response.success) {
        toast.success(`Brand status updated to ${newStatus ? 'Active' : 'Inactive'}`);
        // Optimistic state update
        setBrands(brands.map(b => b._id === brand._id ? { ...b, status: newStatus } : b));
      } else {
        toast.error(response.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Toggle status error:', error);
      toast.error('An error occurred updating brand status');
    }
  };

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setEditingBrand(null);
    setFormValues({
      name: '',
      code: '',
      description: '',
      logo: { url: '', publicId: '' },
      status: true,
      displayOrder: brands.length // default displayOrder
    });
    setLogoFile(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (brand) => {
    setEditingBrand(brand);
    setFormValues({
      name: brand.name,
      code: brand.code,
      description: brand.description || '',
      logo: brand.logo || { url: '', publicId: '' },
      status: brand.status,
      displayOrder: brand.displayOrder || 0
    });
    setLogoFile(null);
    setIsModalOpen(true);
  };

  // Handle logo file upload
  const handleLogoFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setLogoFile(file);
    try {
      setUploadingLogo(true);
      // Folder category "painting_brands"
      const uploadResultUrl = await uploadToCloudinary(file, 'painting_brands');
      
      // Since uploadToCloudinary returns string URL directly in standard helpers:
      setFormValues(prev => ({
        ...prev,
        logo: {
          url: uploadResultUrl,
          publicId: `painting_brands/${Date.now()}` // Mock public ID if helper only returns URL string
        }
      }));
      toast.success('Logo uploaded successfully!');
    } catch (error) {
      console.error('Logo upload error:', error);
      toast.error('Failed to upload brand logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Delete uploaded logo
  const handleDeleteLogo = () => {
    setFormValues(prev => ({
      ...prev,
      logo: { url: '', publicId: '' }
    }));
    setLogoFile(null);
  };

  // Submit Brand Add / Edit Form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formValues.name.trim()) {
      toast.error('Brand Name is required');
      return;
    }
    if (!formValues.code.trim()) {
      toast.error('Brand Code is required');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: formValues.name.trim(),
        code: formValues.code.trim().toUpperCase(),
        description: formValues.description.trim(),
        logo: formValues.logo,
        status: formValues.status,
        displayOrder: formValues.displayOrder
      };

      let response;
      if (editingBrand) {
        response = await paintingService.updateBrand(editingBrand._id, payload);
      } else {
        response = await paintingService.createBrand(payload);
      }

      if (response.success) {
        toast.success(editingBrand ? 'Paint brand updated successfully' : 'Paint brand created successfully');
        setIsModalOpen(false);
        fetchBrands();
      } else {
        toast.error(response.message || 'Validation failed');
      }
    } catch (error) {
      console.error('Submit brand form error:', error);
      toast.error(error.response?.data?.message || 'An error occurred saving paint brand');
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete Brand
  const handleDeleteBrand = async (brandId) => {
    if (!window.confirm('Are you sure you want to delete this paint brand?')) return;

    try {
      setLoading(true);
      const response = await paintingService.deleteBrand(brandId);
      if (response.success) {
        if (response.action === 'marked_inactive') {
          toast.success('Brand is in use. Marked as Inactive instead of deleting.');
        } else {
          toast.success('Paint brand deleted successfully');
        }
        fetchBrands();
      } else {
        toast.error(response.message || 'Failed to delete brand');
      }
    } catch (error) {
      console.error('Delete brand error:', error);
      toast.error('An error occurred during deletion');
    } finally {
      setLoading(false);
    }
  };

  // HTML5 Drag and Drop Handlers for Reordering
  const handleDragStart = (e, index) => {
    // Only allow drag if no search or status filter is active
    if (search || statusFilter !== 'all') {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    // Rearrange locally in array
    const updatedBrands = [...brands];
    const draggedItem = updatedBrands[draggedIndex];
    updatedBrands.splice(draggedIndex, 1);
    updatedBrands.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setBrands(updatedBrands);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    try {
      // Save display order to database
      const ids = brands.map(brand => brand._id);
      const response = await paintingService.reorderBrands(ids);
      if (response.success) {
        toast.success('Brand sequence updated successfully');
      } else {
        toast.error(response.message || 'Failed to save brand sequence');
        fetchBrands(); // reload original order
      }
    } catch (error) {
      console.error('Save display order error:', error);
      toast.error('An error occurred saving brand sequence');
      fetchBrands();
    }
  };

  // Determine if drag is active
  const isDragAllowed = !search && statusFilter === 'all';

  return (
    <div className={isNested ? "space-y-6" : "max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6"}>
      {/* Header section */}
      {!isNested ? (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Paint Brand Management</h1>
            <p className="text-sm text-gray-500 mt-1">Configure and manage master paint brands for quotations and products.</p>
          </div>
          <button 
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            Add Paint Brand
          </button>
        </div>
      ) : (
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Paint Brands Catalog</h3>
            <p className="text-xs text-gray-400 mt-0.5">Manage master brands and listings.</p>
          </div>
          <button 
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            Add Brand
          </button>
        </div>
      )}

      {/* Filter and search controls */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search paint brands by name..."
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

        <div className="flex items-center gap-3 w-full sm:w-auto self-stretch sm:self-auto justify-end">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:inline">Status:</span>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 outline-none hover:bg-gray-100 focus:border-blue-500 transition-all cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Drag & drop hints */}
      {isDragAllowed && brands.length > 1 && (
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex items-center gap-2.5 text-xs text-blue-700">
          <FiInfo className="w-4 h-4 shrink-0 text-blue-600" />
          <span>Drag and drop rows using the <strong>handle icon (☰)</strong> to customize the display order.</span>
        </div>
      )}

      {/* Brand listing table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
        {loading && brands.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 gap-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-gray-400">Loading brands...</span>
          </div>
        ) : brands.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center px-4">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 mb-4">
              <FiImage className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-gray-800 text-base">No Paint Brands Found</h3>
            <p className="text-sm text-gray-400 max-w-sm mt-1">
              {search || statusFilter !== 'all' 
                ? 'Try adjusting your search criteria or filter options.'
                : 'Get started by creating your first paint brand database record.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50/70 select-none">
                  {isDragAllowed && <th className="py-4 px-4 w-12 text-center">Order</th>}
                  <th className="py-4 px-5">Logo</th>
                  <th className="py-4 px-5">Brand Name</th>
                  <th className="py-4 px-5">Code</th>
                  <th className="py-4 px-5">Description</th>
                  <th className="py-4 px-5 text-center">Products</th>
                  <th className="py-4 px-5 text-center">Status</th>
                  <th className="py-4 px-5">Created Date</th>
                  <th className="py-4 px-5 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {brands.map((brand, index) => (
                  <tr 
                    key={brand._id}
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
                    
                    <td className="py-4 px-5">
                      {brand.logo?.url ? (
                        <img 
                          src={brand.logo.url} 
                          alt={brand.name} 
                          className="w-10 h-10 object-contain rounded-lg border border-gray-200 bg-white p-1" 
                        />
                      ) : (
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center font-bold text-blue-600 text-sm">
                          {brand.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-5 font-semibold text-gray-900">{brand.name}</td>
                    
                    <td className="py-4 px-5">
                      <span className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-lg font-mono text-xs font-bold uppercase">
                        {brand.code}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-gray-500 max-w-xs truncate">
                      {brand.description || <span className="text-gray-300 italic">No description</span>}
                    </td>

                    <td className="py-4 px-5 text-center font-bold text-gray-700">
                      {brand.productsCount || 0}
                    </td>

                    <td className="py-4 px-5 text-center">
                      <button
                        onClick={() => handleToggleStatus(brand)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          brand.status ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                        title={brand.status ? 'Click to deactivate' : 'Click to activate'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            brand.status ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>

                    <td className="py-4 px-5 text-gray-500 whitespace-nowrap">
                      {brand.createdAt ? new Date(brand.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      }) : '--'}
                    </td>

                    <td className="py-4 px-5">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleOpenEditModal(brand)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Brand"
                        >
                          <FiEdit className="w-4.5 h-4.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteBrand(brand._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Brand"
                        >
                          <FiTrash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="bg-white px-5 py-4 border-t border-gray-100 flex items-center justify-between select-none">
            <span className="text-xs text-gray-400 font-medium">
              Showing <strong className="text-gray-700">{((page - 1) * limit) + 1}</strong> to{' '}
              <strong className="text-gray-700">{Math.min(page * limit, totalBrands)}</strong> of{' '}
              <strong className="text-gray-700">{totalBrands}</strong> brands
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

      {/* Add / Edit Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{editingBrand ? 'Edit Paint Brand' : 'Add New Paint Brand'}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Please provide brand specifications below.</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-gray-200 rounded-xl text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 overflow-hidden">
                {/* Form fields wrapper */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Brand Logo Uploader */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Brand Logo</label>
                  {formValues.logo?.url ? (
                    <div className="relative w-32 h-32 rounded-2xl border border-gray-200 overflow-hidden bg-white p-2 group flex items-center justify-center">
                      <img src={formValues.logo.url} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                      <button 
                        type="button"
                        onClick={handleDeleteLogo}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white rounded-2xl cursor-pointer"
                        title="Remove Logo"
                      >
                        <FiTrash2 className="w-6 h-6" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full h-32 border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-2xl flex flex-col items-center justify-center bg-gray-50/50 hover:bg-blue-50/10 cursor-pointer transition-all">
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleLogoFileChange}
                        disabled={uploadingLogo}
                      />
                      {uploadingLogo ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-7 h-7 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs text-gray-400 font-medium">Uploading logo...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-gray-400">
                          <FiUpload className="w-6 h-6" />
                          <span className="text-xs font-semibold text-gray-700">Upload Brand Logo</span>
                          <span className="text-[10px] text-gray-400">PNG, JPG, SVG up to 2MB</span>
                        </div>
                      )}
                    </label>
                  )}
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Brand Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      placeholder="e.g. Asian Paints"
                      required
                      value={formValues.name}
                      onChange={(e) => setFormValues({...formValues, name: e.target.value})}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-gray-50/30"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Internal Brand Code <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      placeholder="e.g. ASIAN"
                      required
                      value={formValues.code}
                      onChange={(e) => setFormValues({...formValues, code: e.target.value.toUpperCase()})}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono uppercase bg-gray-50/30"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Description</label>
                  <textarea 
                    rows="3"
                    placeholder="Enter brand details, history, or specific characteristics..."
                    value={formValues.description}
                    onChange={(e) => setFormValues({...formValues, description: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-gray-50/30 resize-none"
                  />
                </div>

                {/* Status and sorting */}
                <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-gray-800">Status</span>
                    <span className="text-xs text-gray-400">Set brand to active or inactive</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormValues(prev => ({ ...prev, status: !prev.status }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      formValues.status ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        formValues.status ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Form actions */}
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
                    disabled={uploadingLogo}
                    className={`px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm transition-colors cursor-pointer ${
                      uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Save Brand
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

export default PaintBrandsPage;
