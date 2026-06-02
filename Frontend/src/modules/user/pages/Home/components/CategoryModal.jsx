import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { FiX, FiLayers, FiArrowLeft, FiPlus, FiCheck, FiInfo, FiShield, FiMapPin, FiStar, FiUser, FiCheckCircle } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';
import { themeColors } from '../../../../../theme';
import { publicCatalogService } from '../../../../../services/catalogService';
import { useCart } from '../../../../../context/CartContext';
import { toast } from 'react-hot-toast';

const toAssetUrl = (url) => {
  if (!url) return '';
  const clean = url.replace('/api/upload', '/upload');
  if (clean.startsWith('http')) return clean;
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/api$/, '');
  return `${base}${clean.startsWith('/') ? '' : '/'}${clean}`;
};

const VendorInfoModal = ({ isOpen, onClose, vendor }) => {
  if (!isOpen || !vendor) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[10001] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.9, y: 20, opacity: 0 }}
          className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header Image/Background */}
          <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
             <button 
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
             >
               <FiX className="w-5 h-5" />
             </button>
          </div>

          <div className="px-6 pb-8 -mt-12 relative text-center">
            {/* Profile Photo */}
            <div className="inline-block p-1.5 bg-white rounded-full shadow-lg mb-4">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-white">
                {vendor.profilePhoto ? (
                  <img src={toAssetUrl(vendor.profilePhoto)} alt={vendor.businessName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-50">
                    <FiUser className="w-10 h-10 text-blue-300" />
                  </div>
                )}
              </div>
            </div>

            <h3 className="text-xl font-black text-gray-900 mb-1">{vendor.businessName || vendor.name}</h3>
            
            {/* Verification Badge */}
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full border border-green-100 text-[11px] font-bold uppercase tracking-wider">
                <FiShield className="w-3.5 h-3.5" />
                VERIFIED VENDOR
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <div className="flex items-center justify-center gap-1 text-amber-500 mb-0.5">
                  <FiStar className="w-4 h-4 fill-current" />
                  <span className="font-black text-lg">{vendor.rating || '4.8'}</span>
                </div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Rating</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                <div className="font-black text-lg text-blue-600 mb-0.5">{vendor.totalJobs || '50'}+</div>
                <p className="text-[10px] text-gray-400 font-bold uppercase">Jobs Done</p>
              </div>
            </div>

            {/* Info List */}
            <div className="space-y-3 text-left">
              <div className="flex items-start gap-3">
                <div className="mt-1 w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                  <FiMapPin className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Location</p>
                  <p className="text-sm font-bold text-gray-700 line-clamp-2">
                    {vendor.address?.city || 'Indore'}, {vendor.address?.state || 'MP'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="mt-1 w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <FiCheckCircle className="w-4 h-4 text-teal-500" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase">Service Level</p>
                  <p className="text-sm font-bold text-gray-700">Premium Professional</p>
                </div>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="w-full mt-8 py-3.5 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-gray-800 active:scale-95 transition-all"
            >
              Got it
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const SubCategoryCard = ({ subCategory, onClick }) => (
  <div 
    onClick={() => onClick(subCategory)}
    className="group flex flex-col items-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
  >
    <div className="w-20 h-20 rounded-[24px] bg-gray-50 border border-gray-100 shadow-sm flex items-center justify-center mb-2 overflow-hidden relative group-hover:border-[#9634f7] group-hover:shadow-md transition-all">
      <div className="absolute inset-0 bg-gradient-to-tr from-[#9634f7] to-[#1fd8d1] opacity-0 group-hover:opacity-10 transition-opacity" />
      {subCategory.iconUrl ? (
        <img src={toAssetUrl(subCategory.iconUrl)} alt={subCategory.title} className="w-full h-full object-cover" />
      ) : (
        <FiLayers className="w-8 h-8 text-gray-300 group-hover:text-[#9634f7] transition-colors" />
      )}
    </div>
    <div className="text-center">
      <h3 className="text-xs font-bold text-gray-800 line-clamp-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#9634f7] group-hover:to-[#1fd8d1] transition-all">
        {subCategory.title}
      </h3>
    </div>
  </div>
);

const BrandCard = ({ brand, onClick, onInfoClick }) => (
  <div
    onClick={() => onClick(brand)}
    className="flex flex-col items-center cursor-pointer group active:scale-95 transition-all relative"
  >
    <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-2 group-hover:bg-gray-100 transition-colors shadow-sm overflow-hidden border border-gray-100 relative">
      {brand.icon ? (
        <img
          src={toAssetUrl(brand.icon)}
          alt={brand.title}
          className="w-14 h-14 object-contain group-hover:scale-110 transition-transform"
          loading="lazy"
        />
      ) : (
        <FiLayers className="w-8 h-8 text-gray-300" />
      )}
      {brand.badge && (
        <span className="absolute top-0 right-0 bg-purple-100 text-purple-700 text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg">
          {brand.badge}
        </span>
      )}
    </div>
    <p className="text-[11px] font-black text-gray-900 text-center leading-tight line-clamp-1 px-1">
      {brand.title}
    </p>
    <div className="flex flex-col items-center mt-0.5">
      <span className="text-[10px] font-bold text-emerald-600">₹{brand.price || 0}</span>
      <div className="flex items-center gap-1">
        <span className="text-[8px] font-medium text-gray-400 truncate max-w-[70px]">
          by {brand.vendor?.businessName || brand.vendor?.name || 'Pro'}
        </span>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onInfoClick(brand.vendor);
          }}
          className="text-blue-500 hover:text-blue-600 transition-colors"
        >
          <FiInfo className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  </div>
);

const CategoryModal = React.memo(({ isOpen, onClose, category, location, cartCount, currentCity }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [isClosing, setIsClosing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const [view, setView] = useState('subcategories'); // 'subcategories' | 'brands' | 'services'
  const [subCategories, setSubCategories] = useState([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [services, setServices] = useState([]); // Sub-services
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);

  const cityId = currentCity?._id || currentCity?.id;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIsClosing(false);
      // Reset state on close
      setTimeout(() => {
        setView('subcategories');
        setSelectedSubCategory(null);
        setSubCategories([]);
        setSelectedBrand(null);
        setBrands([]);
        setServices([]);
        setIsRedirecting(false);
      }, 300);
    } else if (category?.id) {
      const hasSubCategory = category.hasSubCategory !== false;
      const hasBrand = category.hasBrand !== false;

      if (category.initialBrand) {
        // Direct to brand services if initialBrand is provided (from search)
        const brand = category.initialBrand;
        setSelectedBrand(brand);
        setView('services');
        fetchServices(brand.id || brand._id);
      } else {
        if (hasSubCategory) {
          setView('subcategories');
          fetchSubCategories();
        } else if (hasBrand) {
          setView('brands');
          fetchBrands();
        } else {
          setView('services');
          fetchServices();
        }
      }
    }
  }, [isOpen, category?.id, cityId]);

  const fetchSubCategories = async () => {
    try {
      setLoading(true);
      const response = await publicCatalogService.getSubCategories({
        categoryId: category.id
      });
      if (response.success) {
        if (response.subCategories && response.subCategories.length > 0) {
          setSubCategories(response.subCategories);
          setView('subcategories');
        } else {
          // Fallback if no subcategories (backward compatible/safety fallback)
          if (category.hasBrand !== false) {
            setView('brands');
            fetchBrands();
          } else {
            setView('services');
            fetchServices();
          }
        }
      }
    } catch (error) {
      console.error("Failed to load subcategories:", error);
      if (category.hasBrand !== false) {
        setView('brands');
        fetchBrands();
      } else {
        setView('services');
        fetchServices();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async (subCatId = null) => {
    try {
      setLoading(true);
      const params = {
        categoryId: category.id,
        cityId: cityId
      };
      if (subCatId) params.subCategoryId = subCatId;
      
      const response = await publicCatalogService.getBrands(params);
      if (response.success) {
        setBrands(response.brands || []);
      }
    } catch (error) {
      console.error("Failed to load brands:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async (brandId = null, subCatId = null) => {
    try {
      setLoading(true);
      const params = {
        cityId: cityId,
        categoryId: category?.id
      };
      if (brandId) params.brandId = brandId;
      if (subCatId || selectedSubCategory?.id || selectedSubCategory?._id) {
        params.subCategoryId = subCatId || selectedSubCategory?.id || selectedSubCategory?._id;
      }
      
      const response = await publicCatalogService.getServices(params);
      if (response.success) {
        setServices(response.services || []);
      }
    } catch (error) {
      console.error("Failed to load services:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubCategoryClick = (subCat) => {
    setSelectedSubCategory(subCat);
    const hasBrand = category.hasBrand !== false;
    if (hasBrand) {
      setView('brands');
      fetchBrands(subCat.id || subCat._id);
    } else {
      setView('services');
      fetchServices(null, subCat.id || subCat._id);
    }
  };

  const handleBrandClick = (brand) => {
    setSelectedBrand(brand);
    setView('services');
    fetchServices(brand.id || brand._id);
  };
  
  const handleVendorInfo = (vendor) => {
    if (vendor) {
      setSelectedVendor(vendor);
      setIsVendorModalOpen(true);
    } else {
      toast.error('Vendor details not available');
    }
  };

  const handleBackToSubCategories = () => {
    setView('subcategories');
    setSelectedSubCategory(null);
    setBrands([]);
    setServices([]);
  };

  const handleBackToBrands = () => {
    setView('brands');
    setSelectedBrand(null);
    setServices([]);
  };
  const [selectedServiceForType, setSelectedServiceForType] = useState(null);

  const handleServiceClick = (service) => {
    setSelectedServiceForType(service);
  };

  const handleBookingTypeSelect = async (isConsultation) => {
    const service = selectedServiceForType;
    if (!service) return;
    
    // Add to cart logic
    try {
      const cartItemData = {
        serviceId: service.id || service._id,
        categoryId: category?.id,
        title: isConsultation ? `${service.title} (Consultation)` : service.title,
        description: service.description || '',
        icon: toAssetUrl(service.icon || ''),
        category: category?.title,
        categoryTitle: category?.title || '', // Explicit field
        categoryIcon: toAssetUrl(category?.homeIconUrl || category?.iconUrl || ''), // Explicit field
        // Brand info — stored as sectionTitle/sectionIcon for booking flow
        sectionId: selectedBrand?.id || selectedBrand?._id || null, // VITAL: Added for plan benefits
        sectionTitle: selectedBrand?.title || '',
        sectionIcon: toAssetUrl(selectedBrand?.iconUrl || selectedBrand?.icon || ''),
        price: service.discountPrice || service.basePrice,
        originalPrice: service.discountPrice ? service.basePrice : null,
        unitPrice: service.discountPrice || service.basePrice,
        serviceCount: 1,
        rating: "4.8",
        reviews: "1k+",
        vendorId: service.vendorId || selectedBrand?.vendorId || null,
        isPriceDisclosed: service.isPriceDisclosed !== false,
        isConsultation,
        card: {
          title: isConsultation ? `${service.title} (Consultation)` : service.title,
          subtitle: service.description || '',
          price: service.discountPrice || service.basePrice,
          originalPrice: service.discountPrice ? service.basePrice : null,
          duration: service.duration || '',
          description: service.description || '',
          imageUrl: toAssetUrl(service.icon || ''),
          features: service.features || []
        }
      };

      const response = await addToCart(cartItemData);
      if (response.success) {
        setIsRedirecting(true);
        setTimeout(() => {
          navigate('/user/cart');
        }, 1200);
      } else {
        toast.error(response.message || 'Failed to add to cart');
      }
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  if (!isOpen && !isClosing) return null;
  if (!mounted) return null;

  const modalContent = (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998]"
              onClick={onClose}
              style={{
                position: 'fixed',
                willChange: 'opacity',
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            />

            {/* Modal Container */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[9999]"
              style={{
                position: 'fixed',
                willChange: 'transform',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              {/* Close Button */}
              <div className="absolute -top-12 right-4 z-[60]">
                <button
                  onClick={onClose}
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-50 transition-colors"
                >
                  <FiX className="w-6 h-6 text-gray-800" />
                </button>
              </div>

              <div className="bg-white rounded-t-3xl max-h-[90vh] overflow-y-auto min-h-[50vh]">
                {isRedirecting ? (
                  <div className="flex flex-col items-center justify-center min-h-[40vh] py-12">
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6"
                    >
                      <FiCheck className="w-10 h-10 text-green-500" />
                    </motion.div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Service Added!</h3>
                    <p className="text-gray-500 text-sm">Proceeding to checkout...</p>
                  </div>
                ) : (
                  <div className="px-4 py-6">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                      {view === 'services' && (category?.hasBrand !== false || category?.hasSubCategory !== false) && (
                        <button
                          onClick={() => {
                            if (category?.hasBrand !== false) {
                              handleBackToBrands();
                            } else {
                              handleBackToSubCategories();
                            }
                          }}
                          className="p-1 rounded-full hover:bg-gray-100"
                        >
                          <FiArrowLeft className="w-6 h-6 text-gray-800" />
                        </button>
                      )}
                      {view === 'brands' && category?.hasSubCategory !== false && (
                        <button
                          onClick={handleBackToSubCategories}
                          className="p-1 rounded-full hover:bg-gray-100"
                        >
                          <FiArrowLeft className="w-6 h-6 text-gray-800" />
                        </button>
                      )}
                      <div>
                        <h1 className="text-xl font-bold text-gray-900">
                          {view === 'subcategories' ? (category?.title || 'Categories') :
                           view === 'brands' ? (selectedSubCategory?.title || category?.title || 'Brands') : 
                           (selectedBrand?.title || 'Services')}
                        </h1>
                        {view === 'services' && <p className="text-xs text-gray-500">Select a service to add</p>}
                      </div>
                      {loading && <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin ml-auto"></div>}
                    </div>

                    {/* Content */}
                    {loading && (view === 'subcategories' ? subCategories.length === 0 : view === 'brands' ? brands.length === 0 : services.length === 0) ? (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 animate-pulse">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div key={i} className="flex flex-col items-center">
                            <div className="w-20 h-20 bg-gray-200 rounded-2xl mb-2"></div>
                            <div className="h-3 w-16 bg-gray-200 rounded"></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        {view === 'subcategories' ? (
                          // SubCategories Grid
                          subCategories.length > 0 ? (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                              {subCategories.map((subCat) => (
                                <SubCategoryCard 
                                  key={subCat.id || subCat._id} 
                                  subCategory={subCat} 
                                  onClick={handleSubCategoryClick} 
                                />
                              ))}
                            </div>
                          ) : null
                        ) : view === 'brands' ? (
                          // Brands Grid
                          brands.length > 0 ? (
                            <div className="space-y-8">
                              {/* Services Section */}
                              {brands.filter(b => b.type === 'service').length > 0 && (
                                <div>
                                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                                    Available Services
                                  </h3>
                                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                    {brands.filter(b => b.type === 'service').map((brand) => (
                                      <BrandCard 
                                        key={brand.id || brand._id} 
                                        brand={brand} 
                                        onClick={handleBrandClick} 
                                        onInfoClick={handleVendorInfo}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Products Section */}
                              {brands.filter(b => b.type === 'product').length > 0 && (
                                <div>
                                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    Products & Materials
                                  </h3>
                                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                    {brands.filter(b => b.type === 'product').map((brand) => (
                                      <BrandCard 
                                        key={brand.id || brand._id} 
                                        brand={brand} 
                                        onClick={handleBrandClick} 
                                        onInfoClick={handleVendorInfo}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-16 px-4">
                              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FiMapPin className="w-8 h-8 text-gray-300" />
                              </div>
                              <h3 className="text-lg font-black text-gray-900 mb-1">No Vendors Available</h3>
                              <p className="text-sm text-gray-500 max-w-[200px] mx-auto leading-tight">
                                There are no active vendors in your area right now.
                              </p>
                            </div>
                          )
                        ) : (
                          // Services List
                          services.length > 0 ? (
                            <div className="space-y-4">
                              {services.map((svc) => (
                                <div key={svc.id || svc._id} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl hover:shadow-md transition-shadow">
                                  <div className="flex-1 pr-4">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <h3 className="font-black text-gray-900 text-[15px] leading-snug">{svc.title}</h3>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">by {svc.vendor?.businessName || svc.vendor?.name || 'Pro'}</span>
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleVendorInfo(svc.vendor);
                                          }}
                                          className="text-blue-500 hover:text-blue-600 transition-colors"
                                        >
                                          <FiInfo className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {svc.isPriceDisclosed !== false ? (
                                        <>
                                          <span className="text-lg font-black text-emerald-600">₹{svc.discountPrice || svc.basePrice}</span>
                                          {(svc.discountPrice > 0 && svc.discountPrice < svc.basePrice) && (
                                            <span className="text-xs text-gray-400 line-through font-bold opacity-60">₹{svc.basePrice}</span>
                                          )}
                                        </>
                                      ) : (
                                        <span className="text-sm font-black text-gray-400 uppercase tracking-tighter bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">Not Disclosed</span>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleServiceClick(svc)}
                                    className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-green-100"
                                  >
                                    <FiPlus /> Add
                                  </button>
                                </div>
                              ))}
                              
                              {/* Bottom Disclaimer */}
                              <div className="mt-8 pt-4 border-t border-gray-50 flex items-start gap-3 bg-gray-50/50 p-4 rounded-2xl">
                                <div className="mt-0.5 text-gray-400">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <p className="text-[11px] text-rose-500 font-normal italic leading-snug">
                                  * It is a base price only, additional charges may be applicable after service
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-16 px-4">
                              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FiShield className="w-8 h-8 text-gray-300" />
                              </div>
                              <h3 className="text-lg font-black text-gray-900 mb-1">Service Unavailable</h3>
                              <p className="text-sm text-gray-500 max-w-[200px] mx-auto leading-tight">
                                This service is currently not available due to no online vendors.
                              </p>
                            </div>
                          )
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <VendorInfoModal 
        isOpen={isVendorModalOpen} 
        onClose={() => setIsVendorModalOpen(false)} 
        vendor={selectedVendor} 
      />

      {/* Booking Type Selection Modal */}
      <AnimatePresence>
        {selectedServiceForType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000] flex items-end justify-center sm:items-center p-4"
            onClick={() => setSelectedServiceForType(null)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative"
            >
              <div className="absolute top-4 right-4 z-[10001]">
                <button
                  onClick={() => setSelectedServiceForType(null)}
                  className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
                >
                  <FiX className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="p-6">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <FiMapPin className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Choose Booking Type</h3>
                <p className="text-sm text-gray-500 mb-6">How would you like to proceed with this service?</p>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setSelectedServiceForType(null);
                      handleBookingTypeSelect(false);
                    }}
                    className="w-full flex items-start gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-blue-500 hover:bg-blue-50 transition-all active:scale-[0.98] group"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                      <FiShield className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-gray-900 group-hover:text-blue-700">Book Full Service</h4>
                      <p className="text-xs text-gray-500">Get the complete repair or installation done right now.</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedServiceForType(null);
                      handleBookingTypeSelect(true);
                    }}
                    className="w-full flex items-start gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-teal-500 hover:bg-teal-50 transition-all active:scale-[0.98] group"
                  >
                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                      <FiInfo className="w-5 h-5 text-teal-600" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-bold text-gray-900 group-hover:text-teal-700">Book Consultant</h4>
                      <p className="text-xs text-gray-500">Need expert advice or inspection first? Hire a consultant.</p>
                    </div>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  return createPortal(modalContent, document.body);
});

CategoryModal.displayName = 'CategoryModal';
export default CategoryModal;
