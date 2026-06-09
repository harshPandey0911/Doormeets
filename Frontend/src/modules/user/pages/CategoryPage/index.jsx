import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { publicCatalogService } from '../../../../services/catalogService';
import { FiArrowLeft, FiMapPin, FiShield, FiInfo, FiPlus, FiLayers, FiCheckCircle } from 'react-icons/fi';
import { useCart } from '../../../../context/CartContext';
import { toast } from 'react-hot-toast';

const toAssetUrl = (url) => {
  if (!url) return '';
  const clean = url.replace('/api/upload', '/upload');
  if (clean.startsWith('http')) return clean;
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/api$/, '');
  return `${base}${clean.startsWith('/') ? '' : '/'}${clean}`;
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
  <div onClick={() => onClick(brand)} className="flex flex-col items-center cursor-pointer group active:scale-95 transition-all relative">
    <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-2 group-hover:bg-gray-100 transition-colors shadow-sm overflow-hidden border border-gray-100 relative">
      {brand.icon ? (
        <img src={toAssetUrl(brand.icon)} alt={brand.title} className="w-14 h-14 object-contain group-hover:scale-110 transition-transform" loading="lazy" />
      ) : (
        <FiLayers className="w-8 h-8 text-gray-300" />
      )}
      {brand.badge && (
        <span className="absolute top-0 right-0 bg-purple-100 text-purple-700 text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg">
          {brand.badge}
        </span>
      )}
    </div>
    <p className="text-[11px] font-black text-gray-900 text-center leading-tight line-clamp-1 px-1">{brand.title}</p>
    <div className="flex flex-col items-center mt-0.5">
      <span className="text-[10px] font-bold text-emerald-600">₹{brand.price || 0}</span>
      <div className="flex items-center gap-1">
        <span className="text-[8px] font-medium text-gray-400 truncate max-w-[70px]">by {brand.vendor?.businessName || brand.vendor?.name || 'Pro'}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onInfoClick(brand.vendor); }}
          className="text-blue-500 hover:text-blue-600 transition-colors"
        >
          <FiInfo className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  </div>
);

const CategoryPage = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const location = useLocation();
  const initialCategory = location.state?.category || null;

  const [category, setCategory] = useState(initialCategory);
  const [subCategories, setSubCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [services, setServices] = useState([]);
  const [view, setView] = useState('subcategories');
  const [loading, setLoading] = useState(false);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedServiceForType, setSelectedServiceForType] = useState(null);
  const { addToCart } = useCart();

  const handleAdd = async (service) => {
    if (!service) return;
    try {
      const price = service.discountPrice || service.basePrice || service.price || 0;
      const cartItemData = {
        serviceId: service.id || service._id,
        categoryId: category?.id,
        title: service.title,
        description: service.description || '',
        icon: toAssetUrl(service.icon || ''),
        category: category?.title,
        categoryTitle: category?.title || '',
        categoryIcon: toAssetUrl(category?.homeIconUrl || category?.iconUrl || ''),
        sectionId: selectedBrand?.id || service.brandId || null,
        sectionTitle: selectedBrand?.title || service.brand?.title || '',
        sectionIcon: toAssetUrl(selectedBrand?.iconUrl || selectedBrand?.icon || service.brand?.icon || ''),
        price: price,
        originalPrice: service.basePrice || null,
        unitPrice: price,
        serviceCount: 1,
        vendorId: service.vendorId || selectedBrand?.vendorId || null,
        isPriceDisclosed: service.isPriceDisclosed !== false,
        card: {
          title: service.title,
          subtitle: service.description || '',
          price: price,
          originalPrice: service.basePrice || null,
          duration: service.duration || '',
          description: service.description || '',
          imageUrl: toAssetUrl(service.icon || ''),
          features: service.features || []
        }
      };

      const response = await addToCart(cartItemData);
      if (response?.success) {
        toast.success('Added to cart');
      } else {
        toast.error(response?.message || 'Failed to add to cart');
      }
    } catch (err) {
      console.error('Add to cart failed', err);
      toast.error('Failed to add to cart');
    }
  };

  useEffect(() => {
    if (!category && slug) {
      // Try to resolve category by slug via public categories
      (async () => {
        try {
          const cityId = null;
          const res = await publicCatalogService.getCategories(cityId);
          if (res && res.success && res.categories) {
            const found = res.categories.find(c => (c.slug === slug) || (c.id === slug) || (c._id === slug));
            if (found) setCategory(found);
          }
        } catch (err) {
          console.error('Failed to load category list', err);
        }
      })();
    }
  }, [category, slug]);

  useEffect(() => {
    if (category) {
      fetchSubCategories();
    }
  }, [category]);

  const fetchSubCategories = async () => {
    try {
      setLoading(true);
      const response = await publicCatalogService.getSubCategories({ categoryId: category.id || category._id });
      if (response.success) {
        if (response.subCategories && response.subCategories.length > 0) {
          setSubCategories(response.subCategories);
          setView('subcategories');
        } else {
          setView('brands');
          fetchBrands();
        }
      }
    } catch (error) {
      console.error('Failed to load subcategories:', error);
      setView('brands');
      fetchBrands();
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async (subCatId = null) => {
    try {
      setLoading(true);
      const params = { categoryId: category.id || category._id };
      if (subCatId) params.subCategoryId = subCatId;
      const response = await publicCatalogService.getBrands(params);
      if (response.success) {
        const fetchedBrands = response.brands || [];
        setBrands(fetchedBrands);
        if (fetchedBrands.length === 0) {
          setView('services');
          fetchServices(null, subCatId);
        }
      }
    } catch (error) {
      console.error('Failed to load brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async (brandId, subCatId = null) => {
    try {
      setLoading(true);
      const params = { categoryId: category.id || category._id };
      if (brandId) params.brandId = brandId;
      if (subCatId || selectedSubCategory?.id || selectedSubCategory?._id) {
        params.subCategoryId = subCatId || selectedSubCategory?.id || selectedSubCategory?._id;
      }
      const response = await publicCatalogService.getServices(params);
      if (response.success) {
        setServices(response.services || []);
      }
    } catch (error) {
      console.error('Failed to load services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubCategoryClick = (subCat) => {
    setSelectedSubCategory(subCat);
    setView('brands');
    fetchBrands(subCat.id || subCat._id);
  };

  const handleBrandClick = (brand) => {
    setSelectedBrand(brand);
    setView('services');
    fetchServices(brand.id || brand._id);
  };

  const handleVendorInfo = (vendor) => {
    if (!vendor) return;
    const slug = vendor.slug || vendor.id || vendor._id;
    navigate(`/user/brand/${encodeURIComponent(slug)}`, { state: { vendor } });
  };

  const handleBackToSubCategories = () => {
    setView('subcategories');
    setSelectedSubCategory(null);
    setBrands([]);
  };

  const handleBackToBrands = () => {
    if (brands.length === 0) {
      setView('subcategories');
      setSelectedSubCategory(null);
    } else {
      setView('brands');
      setSelectedBrand(null);
    }
    setServices([]);
  };

  const handleBack = () => {
    if (view === 'services') {
      handleBackToBrands();
    } else if (view === 'brands') {
      handleBackToSubCategories();
    } else {
      navigate(-1);
    }
  };

  const handleServiceClick = (service) => {
    setSelectedServiceForType(service);
  };

  if (!category) return <div className="p-6">Loading category...</div>;

  if (category?.status === 'coming_soon') {
    return (
      <div className="min-h-screen bg-white">
        <div className="p-4 border-b">
          <button onClick={() => navigate(-1)} className="flex items-center gap-3">
            <FiArrowLeft className="w-5 h-5" />
            <span className="font-bold">Back</span>
          </button>
        </div>
        <div className="flex flex-col items-center justify-center p-6 text-center pt-24 max-w-sm mx-auto">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
            {category.title}
          </h1>
          
          <div className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            Coming Soon
          </div>
          
          <p className="text-gray-500 mb-8 font-medium">
            We are launching this category soon in your area. Click below to show your interest, and we'll notify you!
          </p>
          
          <button
            disabled={category.isInterested}
            onClick={async () => {
              try {
                const res = await publicCatalogService.registerInterest(category.id || category._id);
                if (res.success) {
                  toast.success(res.message);
                  setCategory(prev => ({ ...prev, isInterested: true, interestedCount: (prev.interestedCount || 0) + 1 }));
                } else {
                  toast.error(res.message || "Failed to register interest");
                }
              } catch (err) {
                console.error("Interest registration failed:", err);
                const msg = err.response?.data?.message || "Authentication required. Please login first.";
                toast.error(msg);
              }
            }}
            className={`w-full py-4 px-6 rounded-2xl font-bold shadow-md transition-all ${
              category.isInterested 
                ? 'bg-green-500 text-white cursor-default shadow-none'
                : 'bg-[#FF9F45] text-white hover:bg-[#FFB86C] hover:shadow-lg'
            }`}
            style={{ backgroundColor: category.isInterested ? '#22c55e' : '#FF9F45' }}
          >
            {category.isInterested ? "✓ Interest Registered" : "I'm Interested!"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="p-4 border-b">
        <button onClick={handleBack} className="flex items-center gap-3">
          <FiArrowLeft className="w-5 h-5" />
          <span className="font-bold">Back</span>
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <h1 className="text-xl font-bold">{category.title}</h1>
          {loading && <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin ml-auto"></div>}
        </div>

        {/* Content area */}
        {view === 'subcategories' ? (
          subCategories.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {subCategories.map((subCat) => (
                <SubCategoryCard key={subCat.id || subCat._id} subCategory={subCat} onClick={handleSubCategoryClick} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">No subcategories available</div>
          )
        ) : view === 'brands' ? (
          brands.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {brands.map((brand) => (
                <BrandCard key={brand.id || brand._id} brand={brand} onClick={handleBrandClick} onInfoClick={handleVendorInfo} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">No vendors available</div>
          )
        ) : (
          services.length > 0 ? (
            <div className="space-y-4">
              {services.map((svc) => (
                <div key={svc.id || svc._id} className="flex justify-between items-center p-3 border border-gray-100 rounded-xl">
                  <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-black text-gray-900 text-[15px] leading-snug">{svc.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {svc.isPriceDisclosed !== false ? (
                        <>
                          <span className="text-lg font-black text-emerald-600">₹{svc.discountPrice || svc.basePrice}</span>
                        </>
                      ) : (
                        <span className="text-sm font-black text-gray-400 uppercase tracking-tighter bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">Not Disclosed</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleAdd(svc)} className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-bold">
                    <FiPlus /> Add
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">Service unavailable</div>
          )
        )}
      </div>

      {/* vendor navigation handled via navigate to vendor page */}
    </div>
  );
};

export default CategoryPage;
