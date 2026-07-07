import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  FiPlus, FiEdit, FiTrash2, FiSave, FiX, FiUpload, FiImage, 
  FiMove, FiInfo, FiChevronDown, FiPlusCircle, FiMinusCircle, FiCopy
} from 'react-icons/fi';
import api from '../../../../services/api';
import uploadToCloudinary from '../../../../utils/cloudinaryUpload';

const DEFAULT_LAYOUTS = [
  { id: '1BHK', name: '1 BHK', tag: 'Compact', imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800', details: ['1 Bedroom, 1 Living Room', '1 Kitchen, 1 Bathroom'] },
  { id: '2BHK', name: '2 BHK', tag: 'Standard', imageUrl: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=800', details: ['2 Bedrooms, 1 Living Room', '1 Kitchen, 2 Bathrooms, 1 Balcony'] },
  { id: '3BHK', name: '3 BHK', tag: 'Premium', imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=800', details: ['3 Bedrooms, 1 Large Living Room', 'Modular Kitchen, 3 Bathrooms, 2 Balconies'] },
  { id: '4BHK', name: '4 BHK', tag: 'Luxury', imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=600', details: ['4 Bedrooms, 1 Large Living Room, 1 Dining Room', 'Modular Kitchen, 4 Bathrooms, 3 Balconies'] },
  { id: 'Villa', name: 'Villa', tag: 'Elite', imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=600', details: ['Multi-story, 4+ Bedrooms, Library', 'Exterior + Interior, Private Terrace'] },
  { id: 'Office_Commercial', name: 'Office / Commercial', tag: 'Commercial', imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600', details: ['Conference Rooms, Reception, Open Workspace', 'Low-VOC, Quick dry options available'] }
];

const PropertyLayoutsPage = () => {
  const [layouts, setLayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); // index in layouts list
  const [formValues, setFormValues] = useState({
    id: '',
    name: '',
    tag: '',
    imageUrl: '',
    details: ['']
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchLayouts();
  }, []);

  const fetchLayouts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/settings');
      if (res.data?.success && res.data?.settings?.propertyLayouts?.length > 0) {
        setLayouts(res.data.settings.propertyLayouts);
      } else {
        // Fallback to default lists
        setLayouts(DEFAULT_LAYOUTS);
      }
    } catch (error) {
      console.error('Error fetching global settings:', error);
      toast.error('Failed to load layouts settings, using defaults');
      setLayouts(DEFAULT_LAYOUTS);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (updatedLayouts) => {
    try {
      setSaving(true);
      const res = await api.put('/admin/settings', {
        propertyLayouts: updatedLayouts
      });
      if (res.data?.success) {
        toast.success('Property layouts saved successfully');
        setLayouts(updatedLayouts);
      } else {
        toast.error('Failed to save layouts settings');
      }
    } catch (error) {
      console.error('Save layouts error:', error);
      toast.error('An error occurred while saving configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingIndex(null);
    setFormValues({
      id: '',
      name: '',
      tag: '',
      imageUrl: '',
      details: ['']
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (idx) => {
    setEditingIndex(idx);
    const item = layouts[idx];
    setFormValues({
      id: item.id,
      name: item.name,
      tag: item.tag || '',
      imageUrl: item.imageUrl || '',
      details: item.details && item.details.length > 0 ? [...item.details] : ['']
    });
    setIsModalOpen(true);
  };

  const handleDuplicateLayout = (idx) => {
    const item = layouts[idx];
    setEditingIndex(null);
    setFormValues({
      id: `${item.id}_COPY`,
      name: `${item.name} (Copy)`,
      tag: item.tag || '',
      imageUrl: item.imageUrl || '',
      details: item.details && item.details.length > 0 ? [...item.details] : ['']
    });
    setIsModalOpen(true);
  };

  const handleDeleteLayout = (idx) => {
    if (!window.confirm('Are you sure you want to delete this property layout configuration?')) return;
    const updated = layouts.filter((_, i) => i !== idx);
    handleSaveSettings(updated);
  };

  // Image Upload Handlers
  const handleImageFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    try {
      setUploadingImage(true);
      const url = await uploadToCloudinary(file, 'painting_layouts');
      setFormValues(prev => ({
        ...prev,
        imageUrl: url
      }));
      toast.success('Layout preview image uploaded successfully!');
    } catch (error) {
      console.error('Layout image upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Details bullet items arrays
  const handleAddDetail = () => {
    setFormValues(prev => ({
      ...prev,
      details: [...prev.details, '']
    }));
  };

  const handleRemoveDetail = (index) => {
    if (formValues.details.length === 1) {
      toast.error('At least one details point is required');
      return;
    }
    setFormValues(prev => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== index)
    }));
  };

  const handleDetailChange = (index, value) => {
    const list = [...formValues.details];
    list[index] = value;
    setFormValues(prev => ({ ...prev, details: list }));
  };

  // Submit Modal forms
  const handleFormSubmit = (e) => {
    e.preventDefault();

    if (!formValues.id.trim()) return toast.error('Layout ID is required');
    if (!formValues.name.trim()) return toast.error('Layout Name is required');

    const cleanId = formValues.id.trim();
    
    // Uniqueness validation check
    const isIdDuplicate = layouts.some((item, idx) => item.id === cleanId && idx !== editingIndex);
    if (isIdDuplicate) return toast.error('A layout with this ID already exists');

    const newLayout = {
      id: cleanId,
      name: formValues.name.trim(),
      tag: formValues.tag.trim(),
      imageUrl: formValues.imageUrl,
      details: formValues.details.map(d => d.trim()).filter(Boolean)
    };

    let updatedList = [...layouts];
    if (editingIndex !== null) {
      updatedList[editingIndex] = newLayout;
    } else {
      updatedList.push(newLayout);
    }

    handleSaveSettings(updatedList);
    setIsModalOpen(false);
  };

  // Drag and drop sequencing
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const list = [...layouts];
    const draggedItem = list[draggedIndex];
    list.splice(draggedIndex, 1);
    list.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    setLayouts(list);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    handleSaveSettings(layouts);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
      {/* Tab Header Banner */}
      <div className="flex justify-between items-center border-b border-gray-150 pb-5">
        <div>
          <h3 className="text-lg font-bold text-gray-900">User Property Layouts</h3>
          <p className="text-xs text-gray-500 mt-1">Configure property layout options shown to users during quotation request (BHKs, Villa, etc.).</p>
        </div>
        <button 
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm transition-all cursor-pointer"
        >
          <FiPlus className="w-4 h-4" />
          Add Property Layout
        </button>
      </div>

      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex items-center gap-2.5 text-xs text-blue-700">
        <FiInfo className="w-4 h-4 shrink-0 text-blue-600" />
        <span>Drag and drop rows using the <strong>handle icon (☰)</strong> to reorder. Changes will save automatically on drop.</span>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-gray-400">Loading layouts settings...</span>
        </div>
      ) : layouts.length === 0 ? (
        <div className="text-center py-20">
          <FiImage className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No layouts configured. Click Add Layout to configure one.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-150 bg-gray-50/70 text-xs font-semibold text-gray-400 uppercase tracking-wider select-none">
                <th className="py-4 px-4 w-12 text-center">Order</th>
                <th className="py-4 px-4 w-24">Image</th>
                <th className="py-4 px-4">Layout ID</th>
                <th className="py-4 px-4">Layout Name</th>
                <th className="py-4 px-4">Tag</th>
                <th className="py-4 px-4">Specs Details</th>
                <th className="py-4 px-4 text-center w-36">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {layouts.map((item, idx) => (
                <tr 
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDragEnd={handleDragEnd}
                  className={`hover:bg-gray-50/50 transition-colors ${draggedIndex === idx ? 'bg-blue-50/30' : ''}`}
                >
                  <td className="py-4 px-4 text-center">
                    <div className="cursor-grab active:cursor-grabbing p-1.5 hover:bg-gray-100 rounded-lg inline-block text-gray-400 hover:text-gray-600 transition-colors">
                      <FiMove className="w-4 h-4" />
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-14 h-10 object-cover rounded-lg border border-gray-200 bg-white"
                      />
                    ) : (
                      <div className="w-14 h-10 bg-gray-50 rounded-lg border border-dashed border-gray-200 flex items-center justify-center text-gray-400">
                        <FiImage className="w-4 h-4" />
                      </div>
                    )}
                  </td>

                  <td className="py-4 px-4 font-mono font-bold text-gray-800">{item.id}</td>
                  <td className="py-4 px-4 font-semibold text-gray-900">{item.name}</td>
                  
                  <td className="py-4 px-4">
                    {item.tag ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        {item.tag}
                      </span>
                    ) : (
                      <span className="text-gray-300 italic text-xs">--</span>
                    )}
                  </td>

                  <td className="py-4 px-4 max-w-xs truncate text-gray-500 font-medium">
                    {item.details?.join(', ') || '--'}
                  </td>

                  <td className="py-4 px-4">
                    <div className="flex items-center justify-center gap-1.5">
                      <button 
                        onClick={() => handleOpenEditModal(idx)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
                        title="Edit"
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDuplicateLayout(idx)}
                        className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg cursor-pointer"
                        title="Duplicate"
                      >
                        <FiCopy className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteLayout(idx)}
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

      {/* Add / Edit modal popup */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] shadow-2xl border border-gray-100 overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="px-6 py-4.5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{editingIndex !== null ? 'Edit Property Layout' : 'Add Property Layout'}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Specify configuration keys and descriptions.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-gray-200 rounded-xl text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Form contents */}
              <form onSubmit={handleFormSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {/* Image banner */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Layout Preview Image</label>
                    <div className="flex items-center gap-4">
                      {formValues.imageUrl ? (
                        <div className="relative w-28 h-18 rounded-xl border border-gray-200 overflow-hidden bg-white group flex items-center justify-center shrink-0">
                          <img src={formValues.imageUrl} alt="layout preview" className="object-cover w-full h-full" />
                          <button 
                            type="button" 
                            onClick={() => setFormValues(prev => ({ ...prev, imageUrl: '' }))}
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white rounded-xl transition-all cursor-pointer"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="w-28 h-18 border border-dashed border-gray-200 hover:border-blue-400 rounded-xl bg-gray-50 flex flex-col items-center justify-center cursor-pointer transition-colors shrink-0">
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageFileChange} disabled={uploadingImage} />
                          {uploadingImage ? (
                            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <div className="flex flex-col items-center text-gray-400">
                              <FiUpload className="w-4 h-4" />
                              <span className="text-[9px] font-bold mt-1">Upload</span>
                            </div>
                          )}
                        </label>
                      )}
                      <div className="text-xs text-gray-400">
                        Upload a premium banner photo representing this house type (BHK, Villa, etc.).
                      </div>
                    </div>
                  </div>

                  {/* ID */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Layout ID (Internal Key) <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. 3BHK, Villa, Duplex"
                      value={formValues.id}
                      disabled={editingIndex !== null}
                      onChange={(e) => setFormValues({ ...formValues, id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-gray-50/30 disabled:opacity-60 disabled:cursor-not-allowed font-mono"
                    />
                  </div>

                  {/* Name */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Layout Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. 3 BHK Flat, Luxury Villa"
                      value={formValues.name}
                      onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-gray-50/30"
                    />
                  </div>

                  {/* Tag */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Badge Tag</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Premium, Elite, Compact"
                      value={formValues.tag}
                      onChange={(e) => setFormValues({ ...formValues, tag: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-gray-50/30"
                    />
                  </div>

                  {/* Details tags */}
                  <div className="space-y-2 pt-2 border-t border-gray-50">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">Specifications (Details bullet points) <span className="text-red-500">*</span></label>
                      <button 
                        type="button" 
                        onClick={handleAddDetail}
                        className="text-xs text-blue-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <FiPlusCircle className="w-3.5 h-3.5" /> Add Detail
                      </button>
                    </div>

                    <div className="space-y-2">
                      {formValues.details.map((detail, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <input 
                            type="text" 
                            required
                            placeholder="e.g. 3 Bedrooms, 1 Dining Room"
                            value={detail}
                            onChange={(e) => handleDetailChange(idx, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-gray-50/30"
                          />
                          <button 
                            type="button" 
                            onClick={() => handleRemoveDetail(idx)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                          >
                            <FiMinusCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Form Footer */}
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
                    disabled={uploadingImage || saving}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm transition-colors cursor-pointer"
                  >
                    Save Layout
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

export default PropertyLayoutsPage;
