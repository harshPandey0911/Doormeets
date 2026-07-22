import React, { useState, useEffect, useLayoutEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSave, FiX, FiLink, FiUserPlus, FiSearch, FiChevronDown, FiCamera, FiUpload, FiMapPin } from 'react-icons/fi';
import AddressSelectionModal from '../../../user/pages/Checkout/components/AddressSelectionModal';
import { vendorTheme as themeColors } from '../../../../theme';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import { createWorker, updateWorker, getWorkerById, linkWorker } from '../../services/workerService';
import { vendorCategoryService } from '../../services/vendorCategoryService';
import { toast } from 'react-hot-toast';
import { z } from "zod";

// Zod schemas
const addWorkerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().regex(/^\d{10}$/, "Enter valid 10-digit phone number"),
  serviceCategories: z.array(z.string()).min(1, "Select at least one category"),
  aadhar: z.object({
    number: z.string().regex(/^\d{12}$/, "Aadhar must be 12 digits"),
    // document: z.any() 
  }),
  // address: z.any().optional() // Make address optional or strict as needed
});

const editWorkerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().regex(/^\d{10}$/, "Enter valid 10-digit phone number"),
  serviceCategories: z.array(z.string()).min(1, "Select at least one category"),
});

const AddEditWorker = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'link'
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    aadhar: {
      number: '',
      document: '' // Base64 string ideally
    },
    serviceCategories: [],
    address: {
      addressLine1: '',
      city: '',
      state: '',
      pincode: ''
    },
    status: 'active',
    profilePhoto: '', // URL
  });

  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [aadharFrontFile, setAadharFrontFile] = useState(null);
  const [aadharBackFile, setAadharBackFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

  const [linkPhone, setLinkPhone] = useState('');

  const [errors, setErrors] = useState({});

  useLayoutEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    const bgStyle = themeColors.backgroundGradient;

    if (html) html.style.background = bgStyle;
    if (body) body.style.background = bgStyle;
    if (root) root.style.background = bgStyle;

    return () => {
      if (html) html.style.background = '';
      if (body) body.style.background = '';
      if (root) root.style.background = '';
    };
  }, []);

  useEffect(() => {
    const initData = async () => {
      try {
        const catRes = await vendorCategoryService.getCategories();
        if (catRes.success) {
          console.log('Loaded Categories:', catRes.categories || []);
          setCategories(catRes.categories || []);
        }

        if (isEdit) {
          setLoading(true);
          const res = await getWorkerById(id);
          if (res.success) {
            const w = res.data;
            setFormData({
              name: w.name || '',
              phone: w.phone || '',
              email: w.email || '',
              aadhar: {
                number: w.aadhar?.number || '',
                frontDocument: w.aadhar?.frontDocument || w.aadhar?.document || '',
                backDocument: w.aadhar?.backDocument || '',
                document: w.aadhar?.document || ''
              },
              serviceCategories: w.serviceCategories || (w.serviceCategory ? [w.serviceCategory] : []),
              address: {
                addressLine1: w.address?.addressLine1 || '',
                city: w.address?.city || '',
                state: w.address?.state || '',
                pincode: w.address?.pincode || ''
              },
              status: w.status || 'active',
              profilePhoto: w.profilePhoto || ''
            });

            if (w.profilePhoto) {
              setPhotoPreview(w.profilePhoto);
            }
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Init error:', error);
        toast.error('Failed to load data');
        setLoading(false);
      }
    };
    initData();
  }, [id, isEdit]);

  // Upload file helper
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    let baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    if (!baseUrl) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        baseUrl = 'http://localhost:5000';
      } else {
        baseUrl = window.location.origin;
      }
    }
    baseUrl = baseUrl.replace(/\/api$/, '');
    const response = await fetch(`${baseUrl}/api/image/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'Upload failed');
    return data.imageUrl;
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleAadharChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }
      setAadharFile(file);
    }
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const toggleCategory = (val) => {
    setFormData(prev => {
      const serviceCategories = prev.serviceCategories.includes(val)
        ? prev.serviceCategories.filter(c => c !== val)
        : [...prev.serviceCategories, val];

      return {
        ...prev,
        serviceCategories
      };
    });
  };

  const handleAddressSave = (houseNumber, location) => {
    let city = '';
    let state = '';
    let pincode = '';
    let addressLine2 = '';

    if (location.components) {
      location.components.forEach(comp => {
        if (comp.types.includes('locality')) city = comp.long_name;
        if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
        if (comp.types.includes('postal_code')) pincode = comp.long_name;
        if (comp.types.includes('sublocality')) addressLine2 = comp.long_name;
      });
    }

    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        addressLine1: houseNumber,
        addressLine2: addressLine2,
        city: city,
        state: state,
        pincode: pincode,
        fullAddress: location.address
      }
    }));
    setIsAddressModalOpen(false);
  };

  // toggleSkill removed


  const handleSubmit = async () => {
    // Zod Validation depending on mode
    const schema = isEdit ? editWorkerSchema : addWorkerSchema;

    // Construct validation object
    const validationData = {
      name: formData.name,
      phone: formData.phone,
      serviceCategories: formData.serviceCategories,
      ...(isEdit ? {} : { aadhar: { number: formData.aadhar.number } })
    };

    const validationResult = schema.safeParse(validationData);

    if (!validationResult.success) {
      toast.error(validationResult.error.errors[0].message);
      return;
    }

    // Additional manual check for Aadhar doc on 'new'
    if (!isEdit && !formData.aadhar.frontDocument && !aadharFrontFile) {
      toast.error("Aadhar Front Side document is required");
      return;
    }
    if (!isEdit && !formData.aadhar.backDocument && !aadharBackFile) {
      toast.error("Aadhar Back Side document is required");
      return;
    }

    try {
      setLoading(true);
      setUploading(true);

      let photoUrl = formData.profilePhoto;
      let aadharFrontUrl = formData.aadhar.frontDocument;
      let aadharBackUrl = formData.aadhar.backDocument;

      // Upload photo if selected
      if (photoFile) {
        try {
          photoUrl = await uploadFile(photoFile);
        } catch (err) {
          console.error('Photo upload failed:', err);
          toast.error('Failed to upload profile photo');
          setLoading(false);
          setUploading(false);
          return;
        }
      }

      // Upload Aadhar Front if selected
      if (aadharFrontFile) {
        try {
          aadharFrontUrl = await uploadFile(aadharFrontFile);
        } catch (err) {
          console.error('Aadhar Front upload failed:', err);
          toast.error('Failed to upload Aadhar Front Side');
          setLoading(false);
          setUploading(false);
          return;
        }
      }

      // Upload Aadhar Back if selected
      if (aadharBackFile) {
        try {
          aadharBackUrl = await uploadFile(aadharBackFile);
        } catch (err) {
          console.error('Aadhar Back upload failed:', err);
          toast.error('Failed to upload Aadhar Back Side');
          setLoading(false);
          setUploading(false);
          return;
        }
      }

      // Clean payload
      const payload = {
        ...formData,
        profilePhoto: photoUrl,
        aadhar: {
          ...formData.aadhar,
          frontDocument: aadharFrontUrl || 'pending_upload',
          backDocument: aadharBackUrl || 'pending_upload',
          document: aadharFrontUrl || aadharBackUrl || 'pending_upload'
        }
      };

      if (!payload.aadhar.document && !isEdit) {
        // Should have been caught by validation, but double check
        // If still empty and no file, maybe error?
        // For now let backend handle it or user re-try
      }

      if (isEdit) {
        await updateWorker(id, payload);
        toast.success('Worker updated');
      } else {
        await createWorker(payload);
        toast.success('Worker added');
      }
      window.dispatchEvent(new Event('vendorWorkersUpdated'));
      navigate('/vendor/workers');
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const handleLinkWorker = async () => {
    if (!linkPhone.trim() || linkPhone.length < 10) {
      toast.error('Enter valid phone number');
      return;
    }
    try {
      setLoading(true);
      await linkWorker(linkPhone);
      toast.success('Worker linked successfully!');
      window.dispatchEvent(new Event('vendorWorkersUpdated'));
      navigate('/vendor/workers');
    } catch (error) {
      console.error('Link error:', error);
      toast.error(error.response?.data?.message || 'Failed to link worker');
    } finally {
      setLoading(false);
    }
  };

  // selectedCategoriesData and allAvailableSkills removed as they are no longer needed

  return (
    <div className="min-h-screen pb-20" style={{ background: themeColors.backgroundGradient }}>
      <Header title={isEdit ? 'Edit Worker' : 'Add Worker'} />

      <main className="px-3.5 py-4 max-w-lg mx-auto">

        {/* Tabs for Add New vs Link */}
        {!isEdit && (
          <div className="flex bg-white rounded-md p-1 mb-4 shadow-2xs border border-gray-100">
            <button
              onClick={() => setActiveTab('new')}
              className={`flex-1 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'new'
                ? 'text-white shadow-xs'
                : 'text-gray-500 hover:bg-gray-50'
                }`}
              style={{
                background: activeTab === 'new' ? themeColors.button : 'transparent'
              }}
            >
              <FiUserPlus className="w-3.5 h-3.5" />
              Create New
            </button>
            <button
              onClick={() => setActiveTab('link')}
              className={`flex-1 py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${activeTab === 'link'
                ? 'text-white shadow-xs'
                : 'text-gray-500 hover:bg-gray-50'
                }`}
              style={{
                background: activeTab === 'link' ? themeColors.button : 'transparent'
              }}
            >
              <FiLink className="w-3.5 h-3.5" />
              Link Existing
            </button>
          </div>
        )}

        {/* Link Existing Mode */}
        {activeTab === 'link' && !isEdit && (
          <div className="bg-white rounded-md p-4 shadow-2xs border border-gray-100 text-center space-y-3">
            <div
              className="w-12 h-12 rounded-md flex items-center justify-center mx-auto mb-1"
              style={{ background: `${themeColors.button}15` }}
            >
              <FiSearch className="w-6 h-6" style={{ color: themeColors.button }} />
            </div>
            <h3 className="text-base font-bold text-gray-800">Add Existing Worker</h3>
            <p className="text-xs text-gray-500">
              Enter the phone number of a registered worker to add them to your team.
            </p>

            <div className="pt-1">
              <input
                type="tel"
                value={linkPhone}
                onChange={(e) => setLinkPhone(e.target.value)}
                placeholder="Enter 10-digit mobile number"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-100 text-center text-sm font-medium tracking-wide"
                maxLength={10}
              />
            </div>

            <button
              onClick={handleLinkWorker}
              disabled={loading}
              className="w-full py-2.5 text-white rounded-md font-bold text-xs shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5 mt-3"
              style={{
                background: themeColors.button,
                boxShadow: `0 4px 12px ${themeColors.button}30`
              }}
            >
              {loading ? 'Processing...' : 'Find & Add Worker'}
            </button>
          </div>
        )}

        {/* Create / Edit Mode */}
        {(activeTab === 'new' || isEdit) && (
          <div className="space-y-4">

            {/* Profile Photo Upload */}
            <div className="flex flex-col items-center justify-center mb-1">
              <div className="relative group">
                <div
                  className="w-20 h-20 rounded-md overflow-hidden border-2 border-white shadow-2xs bg-gray-100"
                >
                  {photoPreview || formData.profilePhoto ? (
                    <img
                      src={photoPreview || formData.profilePhoto}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                      <FiUserPlus className="w-7 h-7" />
                    </div>
                  )}
                </div>

                <label
                  htmlFor="worker-photo-upload"
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-md cursor-pointer shadow-2xs transition-transform active:scale-95 hover:scale-105"
                  style={{ background: themeColors.button }}
                >
                  <FiCamera className="w-3.5 h-3.5 text-white" />
                  <input
                    id="worker-photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </label>
              </div>
              <p className="text-gray-400 text-[10px] mt-1.5 font-bold">Add Profile Photo</p>
            </div>

            {/* Basic Info */}
            <div className="bg-white rounded-md p-3.5 shadow-2xs border border-gray-100 space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Details</h4>

              <div className="space-y-2.5">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Full Name *"
                  className={`w-full px-3.5 py-2 bg-gray-50 rounded-md border text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 ${errors.name ? 'border-red-500' : 'border-gray-100'}`}
                />

                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Mobile Number *"
                  className={`w-full px-3.5 py-2 bg-gray-50 rounded-md border text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 ${errors.phone ? 'border-red-500' : 'border-gray-100'}`}
                  maxLength={10}
                />

                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Email Address (Optional)"
                  className={`w-full px-3.5 py-2 bg-gray-50 rounded-md border text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 ${errors.email ? 'border-red-500' : 'border-gray-100'}`}
                />
              </div>
            </div>

            {/* Address Info */}
            <div className="bg-white rounded-md p-3.5 shadow-2xs border border-gray-100 space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Address</h4>

              <div className="p-2.5 bg-gray-50 rounded-md border border-gray-100">
                <p className="text-xs font-medium text-gray-700">
                  {formData.address?.fullAddress ||
                    (formData.address?.addressLine1 ? `${formData.address.addressLine1}, ${formData.address.city}` : 'No address set')
                  }
                </p>
              </div>

              <button
                onClick={() => setIsAddressModalOpen(true)}
                className="w-full py-2 bg-blue-50 text-blue-600 rounded-md font-bold text-xs border border-blue-100 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <FiMapPin className="w-3.5 h-3.5" />
                Select Address on Map
              </button>
            </div>

            {/* Work Profile */}
            <div className="bg-white rounded-md p-3.5 shadow-2xs border border-gray-100 space-y-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Work Profile</h4>

              {/* Category Dropdown */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 mb-1 block uppercase tracking-wide">Category</label>
                <div className="relative">
                  <button
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className="w-full px-3.5 py-2 bg-gray-50 rounded-md border border-gray-100 flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-100 text-xs"
                  >
                    <span className={`font-medium truncate ${formData.serviceCategories.length > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                      {formData.serviceCategories.length > 0
                        ? `${formData.serviceCategories.length} Selected`
                        : 'Select Categories'}
                    </span>
                    <FiChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isCategoryOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10 bg-transparent"
                        onClick={() => setIsCategoryOpen(false)}
                      />
                      <div className="absolute z-20 w-full mt-1.5 bg-white rounded-md shadow-xl border border-gray-100 max-h-56 overflow-y-auto">
                        {categories.length > 0 ? (
                          categories.map((cat, index) => {
                            const catKey = cat._id || cat.id || cat.title || index;
                            const catTitle = typeof cat === 'string' ? cat : (cat.title || cat.name || '');
                            return (
                              <button
                                key={catKey}
                                onClick={() => {
                                  toggleCategory(catTitle);
                                }}
                                className="w-full text-left px-3.5 py-2 hover:bg-gray-50 font-medium text-xs text-gray-700 border-b border-gray-50 last:border-0 flex items-center justify-between"
                              >
                                {catTitle}
                                {formData.serviceCategories.includes(catTitle) && (
                                  <div className="w-2 h-2 rounded-full bg-green-500" />
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-3.5 py-2 text-gray-400 text-xs">No categories found</div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Selected Categories Tags */}
                {formData.serviceCategories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formData.serviceCategories.map((cat, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-bold border border-blue-100"
                      >
                        {cat}
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleCategory(cat); }}
                          className="ml-1.5 text-blue-500 hover:text-red-500 focus:outline-none"
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {errors.serviceCategories && <p className="text-red-500 text-[10px] mt-1">Required</p>}
              </div>

            </div>

            {/* Documents (Simplified) */}
            {
              !isEdit && (
                <div className="bg-white rounded-md p-3.5 shadow-2xs border border-gray-100 space-y-2.5">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Identity Proof (Aadhar)</h4>
                  <input
                    type="text"
                    value={formData.aadhar.number}
                    onChange={(e) => handleInputChange('aadhar.number', e.target.value)}
                    placeholder="Aadhar Number *"
                    className={`w-full px-3.5 py-2 bg-gray-50 rounded-md border text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 ${errors['aadhar.number'] ? 'border-red-500' : 'border-gray-100'}`}
                    maxLength={12}
                  />

                  {/* File Upload Grid (Front & Back) */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Front Side Upload */}
                    <div className="border-2 border-dashed border-gray-200 rounded-md p-2.5 text-center transition-colors hover:border-blue-300 bg-gray-50 flex flex-col justify-center items-center min-h-[90px] overflow-hidden">
                      <input
                        id="worker-aadhar-front-upload"
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error('File size should be less than 5MB');
                              return;
                            }
                            setAadharFrontFile(file);
                          }
                        }}
                      />
                      <label htmlFor="worker-aadhar-front-upload" className="cursor-pointer flex flex-col items-center w-full min-w-0 px-1 overflow-hidden">
                        {aadharFrontFile ? (
                          <div className="flex flex-col items-center w-full min-w-0 overflow-hidden">
                            <div className="flex items-center justify-center gap-1 text-green-600 font-medium w-full min-w-0 overflow-hidden">
                              <FiUpload className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate text-[10px] font-bold min-w-0 block">{aadharFrontFile.name}</span>
                            </div>
                            <span className="text-[9px] text-gray-400 mt-0.5 font-medium">Front Side</span>
                          </div>
                        ) : formData.aadhar?.frontDocument && formData.aadhar.frontDocument !== 'data:image/png;base64,placeholder' ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <p className="text-green-600 font-bold text-xs">Front Uploaded</p>
                            <span className="text-[10px] text-blue-500 underline font-semibold">Update</span>
                          </div>
                        ) : (
                          <>
                            <FiUpload className="w-5 h-5 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-700 font-bold">Front Side</span>
                            <span className="text-[9px] text-gray-400 mt-0.5">Upload Front (Max 5MB)</span>
                          </>
                        )}
                      </label>
                    </div>

                    {/* Back Side Upload */}
                    <div className="border-2 border-dashed border-gray-200 rounded-md p-2.5 text-center transition-colors hover:border-blue-300 bg-gray-50 flex flex-col justify-center items-center min-h-[90px] overflow-hidden">
                      <input
                        id="worker-aadhar-back-upload"
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              toast.error('File size should be less than 5MB');
                              return;
                            }
                            setAadharBackFile(file);
                          }
                        }}
                      />
                      <label htmlFor="worker-aadhar-back-upload" className="cursor-pointer flex flex-col items-center w-full min-w-0 px-1 overflow-hidden">
                        {aadharBackFile ? (
                          <div className="flex flex-col items-center w-full min-w-0 overflow-hidden">
                            <div className="flex items-center justify-center gap-1 text-green-600 font-medium w-full min-w-0 overflow-hidden">
                              <FiUpload className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="truncate text-[10px] font-bold min-w-0 block">{aadharBackFile.name}</span>
                            </div>
                            <span className="text-[9px] text-gray-400 mt-0.5 font-medium">Back Side</span>
                          </div>
                        ) : formData.aadhar?.backDocument && formData.aadhar.backDocument !== 'data:image/png;base64,placeholder' ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <p className="text-green-600 font-bold text-xs">Back Uploaded</p>
                            <span className="text-[10px] text-blue-500 underline font-semibold">Update</span>
                          </div>
                        ) : (
                          <>
                            <FiUpload className="w-5 h-5 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-700 font-bold">Back Side</span>
                            <span className="text-[9px] text-gray-400 mt-0.5">Upload Back (Max 5MB)</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                  {errors['aadhar.document'] && <p className="text-red-500 text-[10px] mt-1">Document is required</p>}
                </div>
              )
            }

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-2.5 text-white rounded-md font-bold text-xs uppercase tracking-wider shadow-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
              style={{
                background: themeColors.button,
                boxShadow: `0 4px 12px ${themeColors.button}30`
              }}
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Details' : 'Create Worker')}
            </button>
          </div>
        )}
      </main >

      <AddressSelectionModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        address={formData.address?.fullAddress || ''}
        houseNumber={formData.address?.addressLine1 || ''}
        onHouseNumberChange={(val) => handleInputChange('address.addressLine1', val)}
        onSave={handleAddressSave}
      />

      <BottomNav />
    </div >
  );
};

export default AddEditWorker;
