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

        {/* Category Hero Card */}
        <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden mb-5">
          <div
            className="h-28 flex items-center justify-center relative"
            style={{ background: `linear-gradient(135deg, ${themeColors.button}22, ${themeColors.button}11)` }}
          >
            {category.imageUrl ? (
              <img src={category.imageUrl} alt={category.title} className="h-20 w-20 object-contain rounded-2xl shadow-lg" />
            ) : (
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: `linear-gradient(135deg, ${themeColors.button}44, ${themeColors.button}22)` }}
              >
                <FiGrid className="w-10 h-10" style={{ color: themeColors.button }} />
              </div>
            )}
          </div>
          <div className="px-5 py-4">
            <h2 className="text-xl font-black text-gray-900">{category.title || 'Category'}</h2>
            {category.description && (
              <p className="text-sm text-gray-500 mt-1">{category.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2.5 py-1 bg-teal-50 text-teal-700 text-xs font-black rounded-lg uppercase tracking-wider">
                Service Category
              </span>
              <span className="px-2.5 py-1 bg-gray-50 text-gray-500 text-xs font-semibold rounded-lg">
                {brands.length} {brands.length === 1 ? 'Brand' : 'Brands'} available
              </span>
            </div>
          </div>
        </div>

        {/* Brands Section */}
        <div className="flex items-center gap-2 mb-4 px-1">
          <div className="w-1 h-5 rounded-full" style={{ background: themeColors.button }} />
          <h3 className="text-base font-black text-gray-800">Brands & Types</h3>
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
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col items-center text-center gap-2 relative cursor-pointer hover:shadow-md hover:border-[#9634f7] transition-all"
              >
                {/* Popular badge */}
                {brand.isPopular && (
                  <span
                    className="absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-black rounded uppercase tracking-wider text-white"
                    style={{ background: themeColors.button }}
                  >
                    Popular
                  </span>
                )}
                {brand.isFeatured && !brand.isPopular && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-black bg-amber-500 text-white rounded uppercase tracking-wider">
                    Featured
                  </span>
                )}

                {/* Brand Icon */}
                <div className="w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center bg-gray-50 border border-gray-100">
                  {brand.iconUrl ? (
                    <img src={brand.iconUrl} alt={brand.title} className="w-full h-full object-cover" />
                  ) : (
                    <FiAward className="w-6 h-6 text-gray-400" />
                  )}
                </div>

                {/* Title */}
                <h4 className="font-black text-gray-900 text-sm leading-tight line-clamp-2">{brand.title}</h4>

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
                    <span className="text-xs font-black text-gray-700">{brand.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Services Modal */}
      {selectedBrand && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
          <div className="bg-white w-full sm:max-w-md h-[80vh] sm:h-auto sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col animate-slideUp sm:animate-fadeIn shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100" style={{ background: `linear-gradient(135deg, ${themeColors.button}11, transparent)` }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex items-center justify-center p-1">
                  {selectedBrand.iconUrl ? (
                    <img src={selectedBrand.iconUrl} alt={selectedBrand.title} className="w-full h-full object-contain" />
                  ) : (
                    <FiAward className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg">{selectedBrand.title}</h3>
                  <p className="text-xs text-gray-500 font-medium">Services & Pricing Details</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedBrand(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto flex-1 bg-gray-50/50">
              {isLoadingServices ? (
                <div className="flex justify-center py-10"><LogoLoader /></div>
              ) : services.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <FiTag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 font-bold text-sm">No services configured</p>
                  <p className="text-gray-400 text-xs mt-1">Admin has not set up pricing for {selectedBrand.title} yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {services.map(service => (
                    <div key={service.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 relative overflow-hidden">
                      {/* Decorative accent */}
                      <div className="absolute top-0 left-0 w-1 h-full" style={{ background: themeColors.button }} />
                      
                      <div className="flex justify-between items-start mb-3">
                        <div className="pl-2">
                          <h4 className="font-bold text-gray-900 text-[15px]">{service.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            {service.duration && (
                              <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{service.duration} mins</span>
                            )}
                            {service.warranty && (
                              <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{service.warranty} warranty</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-dashed border-gray-200">
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                          <p className="text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">Customer Pays</p>
                          <p className="text-lg font-black text-gray-900">₹{service.priceDetails?.finalCustomerPrice}</p>
                        </div>
                        <div className="rounded-xl p-3 border" style={{ background: `${themeColors.button}08`, borderColor: `${themeColors.button}22` }}>
                          <p className="text-[10px] uppercase font-bold mb-1 tracking-wider" style={{ color: themeColors.button }}>Your Profit</p>
                          <p className="text-lg font-black" style={{ color: themeColors.button }}>₹{service.priceDetails?.vendorProfit}</p>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100">
                        <FiCheckCircle className="w-3.5 h-3.5" />
                        <span>Ready to accept bookings for this service</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryDetail;
