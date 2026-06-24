import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import api from '../../../../../services/api';
import { serviceService } from '../../../../../services/catalogService';
import DynamicIcon from '../../../../../components/DynamicIcon';
import { toast } from 'react-hot-toast';

const SubCategoriesPage = ({ selectedCity, filterTemplateId }) => {
  const [subCategories, setSubCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSubCategory, setCurrentSubCategory] = useState(null);
  const [formData, setFormData] = useState({ categoryId: '', title: '', description: '', iconUrl: '', status: 'active', hasBrand: false });
  const [uploadingIcon, setUploadingIcon] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subRes, catRes] = await Promise.all([
        api.get('/admin/subcategories'),
        api.get('/admin/categories')
      ]);
      setSubCategories(subRes.data.data || subRes.data.subCategories || []);
      setCategories(catRes.data.categories || catRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const handleOpenModal = (subCat = null) => {
    setCurrentSubCategory(subCat);
    if (subCat) {
      setFormData({
        categoryId: subCat.categoryId?._id || '',
        title: subCat.title,
        description: subCat.description || '',
        iconUrl: subCat.iconUrl || '',
        status: subCat.status,
        hasBrand: subCat.hasBrand || false
      });
    } else {
      const firstFilteredCat = filterTemplateId
        ? (categories.find(c => String(c.templateId || c.template) === String(filterTemplateId))?._id || categories.find(c => String(c.templateId || c.template) === String(filterTemplateId))?.id || '')
        : '';
      setFormData({ categoryId: firstFilteredCat, title: '', description: '', iconUrl: '', status: 'active', hasBrand: false });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentSubCategory) {
        await api.put(`/admin/subcategories/${currentSubCategory._id}`, formData);
      } else {
        await api.post('/admin/subcategories', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving subcategory');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subcategory?')) {
      try {
        await api.delete(`/admin/subcategories/${id}`);
        fetchData();
      } catch (error) {
        alert('Error deleting subcategory');
      }
    }
  };

  let filteredSubCategories = subCategories;
  if (filterTemplateId) {
    filteredSubCategories = filteredSubCategories.filter(sub => {
      const parentCatId = sub.categoryId?._id || sub.categoryId;
      const parentCategory = categories.find(c => String(c._id) === String(parentCatId) || String(c.id) === String(parentCatId));
      return parentCategory && String(parentCategory.templateId || parentCategory.template) === String(filterTemplateId);
    });
  }
  if (selectedCity) {
    filteredSubCategories = filteredSubCategories.filter(sub => {
      const parentCatId = sub.categoryId?._id || sub.categoryId;
      const parentCategory = categories.find(c => String(c._id) === String(parentCatId) || String(c.id) === String(parentCatId));
      if (!parentCategory) return false; // Hide if parent category not found
      
      const catCityIds = parentCategory.cityIds || [];
      if (catCityIds.length === 0) return true; // Show if parent is "All Cities"
      
      return catCityIds.some(id => String(id) === String(selectedCity) || (id._id && String(id._id) === String(selectedCity)));
    });
  }

  const filteredCategoriesForForm = filterTemplateId
    ? categories.filter(c => String(c.templateId || c.template) === String(filterTemplateId))
    : categories;

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">SubCategories</h2>
        <button 
          onClick={() => handleOpenModal()} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <FiPlus /> Add SubCategory
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 font-semibold text-gray-600">Title</th>
                <th className="p-4 font-semibold text-gray-600">Icon</th>
                <th className="p-4 font-semibold text-gray-600">Parent Category</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubCategories.map((sub) => (
                <tr key={sub._id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="p-4">{sub.title}</td>
                  <td className="p-4 text-gray-600">
                    {sub.iconUrl ? <DynamicIcon icon={sub.iconUrl} className="w-8 h-8 object-contain rounded bg-gray-50 p-1 border" /> : <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">No</div>}
                  </td>
                  <td className="p-4 text-gray-600">{sub.categoryId?.title || 'Unknown'}</td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-1 rounded-full text-xs w-fit ${sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {sub.status}
                      </span>
                      {sub.hasBrand && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700 uppercase tracking-wider w-fit">
                          Brands Enabled
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 flex justify-end gap-2">
                    <button onClick={() => handleOpenModal(sub)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><FiEdit2 /></button>
                    <button onClick={() => handleDelete(sub._id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><FiTrash2 /></button>
                  </td>
                </tr>
              ))}
              {filteredSubCategories.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">No subcategories found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-800">{currentSubCategory ? 'Edit SubCategory' : 'Add SubCategory'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                  required
                >
                  <option value="">Select a Category</option>
                  {filteredCategoriesForForm.map(cat => (
                    <option key={cat.id || cat._id} value={cat.id || cat._id}>{cat.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="3"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Subcategory Icon / Image</label>
                <div className="flex items-center gap-4 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                  {/* Preview */}
                  <div className="h-16 w-16 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                    {formData.iconUrl ? (
                      <DynamicIcon icon={formData.iconUrl} alt="Preview" className="w-full h-full object-contain p-1" />
                    ) : (
                      <div className="text-gray-400 text-xs font-semibold text-center px-1">No Image</div>
                    )}
                  </div>
                  {/* Upload */}
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
                            const slug = formData.title?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'subcategory';
                            const folder = `Doormeets/subcategories/${slug}/icons`;
                            const response = await serviceService.uploadImage(file, folder);
                            if (response.success && response.imageUrl) {
                              setFormData((p) => ({ ...p, iconUrl: response.imageUrl }));
                              toast.success("Icon uploaded successfully");
                            } else {
                              toast.error("Upload failed");
                            }
                          } catch (error) {
                            toast.error("Failed to upload image");
                          } finally {
                            setUploadingIcon(false);
                          }
                        }
                      }}
                      className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                    {uploadingIcon ? (
                      <div className="text-xs text-blue-500 mt-1.5 font-medium">Uploading...</div>
                    ) : formData.iconUrl ? (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-xs text-green-600 font-medium">✓ Image uploaded</span>
                        <button
                          type="button"
                          onClick={() => setFormData((p) => ({ ...p, iconUrl: "" }))}
                          className="text-xs text-red-500 hover:text-red-700 ml-1"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 mt-1.5">JPG, PNG, SVG up to 5MB</div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 py-2">
                <input 
                  type="checkbox" 
                  id="hasBrand"
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  checked={formData.hasBrand}
                  onChange={(e) => setFormData({...formData, hasBrand: e.target.checked})}
                />
                <label htmlFor="hasBrand" className="text-sm font-medium text-gray-700 select-none cursor-pointer">
                  Has Brands (Is subcategory ke liye brand enable karein)
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubCategoriesPage;
