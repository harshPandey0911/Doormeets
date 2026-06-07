import React, { useState, useEffect } from 'react';
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
          setBrands(res.brands || []);
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

      <main className="px-4 pt-4 max-w-lg mx-auto">

        {/* Category Hero Section (Horizontal Layout) */}
        <div className="flex items-center gap-4 mb-6">
          {/* Left Side: Image/Icon */}
          <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center bg-orange-50/80 border border-orange-100 flex-shrink-0 shadow-sm">
            {category.imageUrl ? (
              <img src={category.imageUrl} alt={category.title} className="w-12 h-12 object-contain" />
            ) : (
              <FiGrid className="w-8 h-8 text-orange-500" />
            )}
          </div>

          {/* Right Side: Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-950 leading-tight">{category.title || 'Category'}</h2>
            {category.description && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{category.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-bold rounded uppercase tracking-wider">
                Service Category
              </span>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-semibold rounded">
                {brands.length} {brands.length === 1 ? 'Brand' : 'Brands'} available
              </span>
            </div>
          </div>
        </div>

        {/* Brands Section */}
        <div className="flex items-center gap-2 mb-4 px-1">
          <div className="w-1 h-5 rounded-full" style={{ background: themeColors.button }} />
          <h3 className="text-base font-bold text-gray-800">Brands & Types</h3>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><LogoLoader /></div>
        ) : brands.length === 0 ? (
          <div className="text-center py-16 bg-white/70 rounded-3xl border border-white/40">
            <FiTag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">No brands listed yet</p>
            <p className="text-gray-400 text-sm mt-1">Admin will add brands for this category soon</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {brands.map((brand) => (
              <div
                key={brand.id}
                onClick={() => handleBrandClick(brand)}
                className="bg-white rounded-2xl p-3 border border-gray-100 shadow-sm flex flex-col items-center text-center gap-2 relative cursor-pointer hover:shadow-md hover:border-orange-500 transition-all"
              >
                {/* Popular badge */}
                {brand.isPopular && (
                  <span
                    className="absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider text-white"
                    style={{ background: themeColors.button }}
                  >
                    Popular
                  </span>
                )}
                {brand.isFeatured && !brand.isPopular && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-bold bg-amber-500 text-white rounded uppercase tracking-wider">
                    Featured
                  </span>
                )}

                {/* Brand Icon */}
                <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-gray-50 border border-gray-100">
                  {brand.iconUrl ? (
                    <img src={brand.iconUrl} alt={brand.title} className="w-full h-full object-cover" />
                  ) : (
                    <FiAward className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                {/* Title */}
                <h4 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{brand.title}</h4>

                {/* Badge label */}
                {brand.badge && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full">
                    {brand.badge}
                  </span>
                )}

                {/* Rating */}
                {brand.rating > 0 && (
                  <div className="flex items-center gap-1 text-amber-500">
                    <FiStar className="w-3 h-3 fill-amber-400" />
                    <span className="text-xs font-bold text-gray-700">{brand.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Services Full Page View */}
      {selectedBrand && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col h-full w-full animate-fadeIn">
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-white">
            <button 
              onClick={() => setSelectedBrand(null)}
              className="p-1 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex items-center justify-center p-1">
                {selectedBrand.iconUrl ? (
                  <img src={selectedBrand.iconUrl} alt={selectedBrand.title} className="w-full h-full object-contain" />
                ) : (
                  <FiAward className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base">{selectedBrand.title}</h3>
                <p className="text-xs text-gray-500 font-medium">Services & Pricing Details</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto flex-1 bg-gray-50/50">
            {isLoadingServices ? (
              <div className="flex justify-center py-10"><LogoLoader /></div>
            ) : services.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <FiTag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 font-bold text-sm">No services configured</p>
                <p className="text-gray-400 text-xs mt-1">Admin has not set up pricing for {selectedBrand.title} yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {services.map(service => (
                  <div key={service.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 relative overflow-hidden">
                    {/* Decorative accent */}
                    <div className="absolute top-0 left-0 w-1 h-full" style={{ background: themeColors.button }} />
                    
                    <div className="flex justify-between items-start">
                      <div className="pl-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-gray-900 text-[14px]">{service.title}</h4>
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                            <FiCheckCircle className="w-2.5 h-2.5" />
                            Active
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {service.duration && (
                            <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">{service.duration} mins</span>
                          )}
                          {service.warranty && (
                            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">{service.warranty} warranty</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Compact Price Info Row */}
                    <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2.5 border-t border-dashed border-gray-100">
                      <div className="bg-gray-50 rounded-lg p-2 flex items-center justify-between border border-gray-100">
                        <span className="text-[10px] font-semibold text-gray-400">Customer Pays</span>
                        <span className="text-xs font-bold text-gray-800">₹{service.priceDetails?.finalCustomerPrice}</span>
                      </div>
                      <div className="rounded-lg p-2 flex items-center justify-between border" style={{ background: `${themeColors.button}08`, borderColor: `${themeColors.button}15` }}>
                        <span className="text-[10px] font-bold" style={{ color: themeColors.button }}>Your Profit</span>
                        <span className="text-xs font-bold" style={{ color: themeColors.button }}>₹{service.priceDetails?.vendorProfit}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryDetail;
