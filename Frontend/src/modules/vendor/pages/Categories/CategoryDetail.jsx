import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useLocation } from 'react-router-dom';
import { FiGrid, FiStar, FiTag, FiAward, FiX, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { vendorTheme as themeColors } from '../../../../theme';
import Header from '../../components/layout/Header';
import { vendorCategoryService } from '../../services/vendorCategoryService';
import LogoLoader from '../../../../components/common/LogoLoader';

const CategoryDetail = () => {
  const { categoryId } = useParams();
  const location = useLocation();
  const category = location.state?.category || {};

  const [brands, setBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [services, setServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        setIsLoading(true);
        const res = await vendorCategoryService.getCategoryBrands(categoryId);
        if (res.success) {
          const fetchedBrands = res.brands || [];
          setBrands(fetchedBrands);
          if (fetchedBrands.length === 0) {
            setIsLoadingServices(true);
            try {
              const resServices = await vendorCategoryService.getBrandServices(categoryId, 'null');
              if (resServices.success) {
                setServices(resServices.services || []);
              }
            } catch (err) {
              console.error('Failed to fetch brand-less services:', err);
            } finally {
              setIsLoadingServices(false);
            }
          }
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load brands');
      } finally {
        setIsLoading(false);
      }
    };
    fetchBrands();
  }, [categoryId]);

  const handleBrandClick = async (brand) => {
    setSelectedBrand(brand);
    setIsLoadingServices(true);
    setServices([]);
    
    try {
      const res = await vendorCategoryService.getBrandServices(categoryId, brand.id);
      if (res.success) {
        setServices(res.services || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load services for this brand');
    } finally {
      setIsLoadingServices(false);
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: themeColors.backgroundGradient }}>
      <Header title={category.title || 'Category Details'} showBack={true} />

      <main className="px-3.5 pt-3 max-w-lg mx-auto">

        {/* Category Hero Section (Horizontal Layout) */}
        <div className="flex items-center gap-3 mb-4 bg-white rounded-md p-3 border border-gray-100 shadow-2xs">
          {/* Left Side: Image/Icon */}
          <div className="w-12 h-12 rounded-md overflow-hidden flex items-center justify-center bg-brand/10 border border-brand/20 flex-shrink-0 shadow-2xs">
            {category.imageUrl ? (
              <img src={category.imageUrl} alt={category.title} className="w-full h-full object-cover" />
            ) : (
              <FiGrid className="w-6 h-6 text-brand" />
            )}
          </div>

          {/* Right Side: Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xs md:text-sm font-bold text-gray-950 leading-tight truncate">{category.title || 'Category'}</h2>
            {category.description && (
              <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1 font-medium">{category.description}</p>
            )}
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="px-1.5 py-0.5 bg-brand/10 text-brand text-[9px] font-bold rounded-md uppercase tracking-wider">
                Service Category
              </span>
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-bold rounded-md">
                {brands.length} {brands.length === 1 ? 'Brand' : 'Brands'} available
              </span>
            </div>
          </div>
        </div>

        {/* Brands Section */}
        <div className="flex items-center gap-1.5 mb-3 px-0.5">
          <div className="w-1 h-4 rounded-md" style={{ background: themeColors.button }} />
          <h3 className="text-xs md:text-sm font-bold text-gray-800">
            {brands.length > 0 ? 'Brands & Types' : 'Services & Pricing'}
          </h3>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><LogoLoader /></div>
        ) : brands.length === 0 ? (
          isLoadingServices ? (
            <div className="flex justify-center py-16"><LogoLoader /></div>
          ) : services.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-md border border-dashed border-gray-200 p-6 shadow-2xs">
              <FiTag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-600 font-bold text-sm">No services configured</p>
              <p className="text-gray-400 text-xs mt-0.5 font-medium">Admin has not set up pricing or services for this category yet.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {services.map(service => (
                <div key={service.id} className="bg-white rounded-md p-2.5 shadow-2xs border border-gray-100 relative overflow-hidden text-left">
                  {/* Decorative accent */}
                  <div className="absolute top-0 left-0 w-1 h-full" style={{ background: themeColors.button }} />
                  
                  <div className="flex justify-between items-start">
                    <div className="pl-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-gray-900 text-xs md:text-sm">{service.title}</h4>
                        <span className="inline-flex items-center gap-1 text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                          <FiCheckCircle className="w-2.5 h-2.5" />
                          Active
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {service.duration && (
                          <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">{service.duration} mins</span>
                        )}
                        {service.warranty && (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">{service.warranty} warranty</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Compact Price Info Row */}
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-dashed border-gray-100">
                    <div className="bg-gray-50 rounded-md p-1.5 flex items-center justify-between border border-gray-100">
                      <span className="text-[9px] font-bold text-gray-400">Customer Pays</span>
                      <span className="text-xs font-bold text-gray-800">₹{service.priceDetails?.finalCustomerPrice}</span>
                    </div>
                    <div className="rounded-md p-1.5 flex items-center justify-between border" style={{ background: `${themeColors.button}08`, borderColor: `${themeColors.button}15` }}>
                      <span className="text-[9px] font-bold" style={{ color: themeColors.button }}>Your Profit</span>
                      <span className="text-xs font-bold" style={{ color: themeColors.button }}>₹{service.priceDetails?.vendorProfit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {brands.map((brand) => (
              <div
                key={brand.id}
                onClick={() => handleBrandClick(brand)}
                className="bg-white rounded-md p-2.5 border border-gray-100 shadow-2xs flex flex-col items-center text-center gap-1.5 relative cursor-pointer hover:shadow-xs hover:border-orange-500 transition-all"
              >
                {/* Popular badge */}
                {brand.isPopular && (
                  <span
                    className="absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[8px] font-bold rounded-md uppercase tracking-wider text-white"
                    style={{ background: themeColors.button }}
                  >
                    Popular
                  </span>
                )}
                {brand.isFeatured && !brand.isPopular && (
                  <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[8px] font-bold bg-amber-500 text-white rounded-md uppercase tracking-wider">
                    Featured
                  </span>
                )}

                {/* Brand Icon */}
                <div className="w-9 h-9 rounded-md overflow-hidden flex items-center justify-center bg-gray-50 border border-gray-100 shadow-2xs mt-1">
                  {brand.iconUrl ? (
                    <img src={brand.iconUrl} alt={brand.title} className="w-full h-full object-cover" />
                  ) : (
                    <FiAward className="w-4 h-4 text-gray-400" />
                  )}
                </div>

                {/* Title */}
                <h4 className="font-bold text-gray-900 text-xs leading-tight line-clamp-2">{brand.title}</h4>

                {/* Badge label */}
                {brand.badge && (
                  <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold rounded-md">
                    {brand.badge}
                  </span>
                )}

                {/* Rating */}
                {brand.rating > 0 && (
                  <div className="flex items-center gap-1 text-amber-500">
                    <FiStar className="w-3 h-3 fill-amber-400" />
                    <span className="text-[10px] font-bold text-gray-700">{brand.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Services Full Page View */}
      {selectedBrand && createPortal(
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col h-full w-full animate-fadeIn">
          {/* Header */}
          <div className="flex items-center gap-2.5 p-3.5 border-b border-gray-100 bg-white">
            <button 
              onClick={() => setSelectedBrand(null)}
              className="p-1 hover:bg-gray-100 rounded-md text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-white rounded-md shadow-2xs border border-gray-100 overflow-hidden flex items-center justify-center p-1">
                {selectedBrand.iconUrl ? (
                  <img src={selectedBrand.iconUrl} alt={selectedBrand.title} className="w-full h-full object-contain" />
                ) : (
                  <FiAward className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-xs md:text-sm">{selectedBrand.title}</h3>
                <p className="text-[10px] text-gray-500 font-bold">Services & Pricing Details</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-3.5 overflow-y-auto flex-1 bg-gray-50/50">
            {isLoadingServices ? (
              <div className="flex justify-center py-10"><LogoLoader /></div>
            ) : services.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-md border border-gray-100 shadow-2xs p-4">
                <FiTag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-600 font-bold text-xs">No services configured</p>
                <p className="text-gray-400 text-[10px] mt-0.5 font-medium">Admin has not set up pricing for {selectedBrand.title} yet.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {services.map(service => (
                  <div key={service.id} className="bg-white rounded-md p-2.5 shadow-2xs border border-gray-100 relative overflow-hidden">
                    {/* Decorative accent */}
                    <div className="absolute top-0 left-0 w-1 h-full" style={{ background: themeColors.button }} />
                    
                    <div className="flex justify-between items-start">
                      <div className="pl-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-gray-900 text-xs md:text-sm">{service.title}</h4>
                          <span className="inline-flex items-center gap-1 text-[8px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100">
                            <FiCheckCircle className="w-2.5 h-2.5" />
                            Active
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {service.duration && (
                            <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">{service.duration} mins</span>
                          )}
                          {service.warranty && (
                            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md">{service.warranty} warranty</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Compact Price Info Row */}
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-dashed border-gray-100">
                      <div className="bg-gray-50 rounded-md p-1.5 flex items-center justify-between border border-gray-100">
                        <span className="text-[9px] font-bold text-gray-400">Customer Pays</span>
                        <span className="text-xs font-bold text-gray-800">₹{service.priceDetails?.finalCustomerPrice}</span>
                      </div>
                      <div className="rounded-md p-1.5 flex items-center justify-between border" style={{ background: `${themeColors.button}08`, borderColor: `${themeColors.button}15` }}>
                        <span className="text-[9px] font-bold" style={{ color: themeColors.button }}>Your Profit</span>
                        <span className="text-xs font-bold" style={{ color: themeColors.button }}>₹{service.priceDetails?.vendorProfit}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default CategoryDetail;
