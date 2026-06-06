import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { FiFilter, FiSearch, FiShoppingBag } from 'react-icons/fi';
import Navbar from '../../components/premium/Navbar';
import SearchBar from '../../components/premium/SearchBar';
import SidebarCategory from '../../components/premium/SidebarCategory';
import BrandCard from '../../components/premium/BrandCard';
import ServiceCard from '../../components/premium/ServiceCard';
import BottomCheckoutBar from '../../components/premium/BottomCheckoutBar';
import { buildCartItemData, toAssetUrl } from '../../components/premium/cartUtils';
import { useCity } from '../../../../context/CityContext';
import { useCart } from '../../../../context/CartContext';
import { publicCatalogService } from '../../../../services/catalogService';

const getServiceDummyImage = (title) => {
  const t = (title || '').toLowerCase();
  if (t.includes('screen') || t.includes('display') || t.includes('glass')) {
    return 'https://images.unsplash.com/photo-1597740985671-2a8a3b80502e?w=300&auto=format&fit=crop&q=80';
  }
  if (t.includes('motherboard') || t.includes('board') || t.includes('circuit') || t.includes('ic') || t.includes('repair')) {
    return 'https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?w=300&auto=format&fit=crop&q=80';
  }
  if (t.includes('switch') || t.includes('socket') || t.includes('button') || t.includes('plug') || t.includes('board connection')) {
    return 'https://images.unsplash.com/photo-1558244661-d248897f7bc4?w=300&auto=format&fit=crop&q=80';
  }
  if (t.includes('battery') || t.includes('power') || t.includes('charging')) {
    return 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=300&auto=format&fit=crop&q=80';
  }
  if (t.includes('wire') || t.includes('wiring') || t.includes('cable')) {
    return 'https://images.unsplash.com/photo-1558244661-d248897f7bc4?w=300&auto=format&fit=crop&q=80';
  }
  if (t.includes('camera') || t.includes('lens')) {
    return 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&auto=format&fit=crop&q=80';
  }
  if (t.includes('fan') || t.includes('ac') || t.includes('cooler') || t.includes('conditioner')) {
    return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=300&auto=format&fit=crop&q=80';
  }
  if (t.includes('cleaning') || t.includes('wash') || t.includes('service')) {
    return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=300&auto=format&fit=crop&q=80';
};

const PremiumCategoryPage = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const location = useLocation();
  const { currentCity } = useCity();
  const { cartCount, cartItems, addToCart, updateItem, removeItem } = useCart();

  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(location.state?.category || null);
  const [subCategories, setSubCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [services, setServices] = useState([]);
  const [activeSubCategory, setActiveSubCategory] = useState(null);
  const [activeBrand, setActiveBrand] = useState(null);

  // Loading states to prevent flickering / blinking of empty placeholders
  const [subCategoriesLoading, setSubCategoriesLoading] = useState(true);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(true);

  console.log('--- RENDERING PremiumCategoryPage ---', {
    slug,
    currentCityId: currentCity?._id,
    categoriesCount: categories.length,
    activeCategory: activeCategory?.title,
    subCategoriesCount: subCategories.length,
    activeSubCategory: activeSubCategory?.title,
    brandsCount: brands.length,
    activeBrand: activeBrand?.title,
    servicesCount: services.length
  });

  const cityId = currentCity?._id || currentCity?.id;
  const activeCategoryId = activeCategory?.id || activeCategory?._id;
  const activeSubCategoryId = activeSubCategory?.id || activeSubCategory?._id;
  const activeBrandId = activeBrand?.id || activeBrand?._id;

  useEffect(() => {
    console.log('useEffect [loadCategory] triggered', { cityId, slug });
    const loadCategory = async () => {
      try {
        const homeRes = await publicCatalogService.getHomeData(cityId);
        if (homeRes?.success && Array.isArray(homeRes.categories)) {
          const mapped = homeRes.categories.map((cat) => ({
            id: cat.id || cat._id,
            title: cat.title,
            slug: cat.slug || cat.title?.toLowerCase().replace(/\s+/g, '-'),
            icon: toAssetUrl(cat.icon || cat.homeIconUrl),
            subtitle: cat.subtitle || 'Premium service',
            status: cat.status || 'active',
            interestedCount: cat.interestedCount || 0,
            isInterested: cat.isInterested || false
          }));
          setCategories(mapped);
          const found = mapped.find((item) => item.slug === slug || item.id === slug || item.title.toLowerCase() === String(slug).toLowerCase());
          if (found) setActiveCategory(found);
          else if (!activeCategory && mapped.length) setActiveCategory(mapped[0]);
        }
      } catch (error) {
        console.error('Category load error', error);
      }
    };

    loadCategory();
  }, [cityId, slug]);

  useEffect(() => {
    if (!activeCategoryId) return;

    const loadCategoryData = async () => {
      try {
        setSubCategoriesLoading(true);
        setBrandsLoading(true);
        setServicesLoading(true);

        // Parallel fetch subcategories and brands
        const [subRes, brandRes] = await Promise.all([
          publicCatalogService.getSubCategories({ categoryId: activeCategoryId }),
          publicCatalogService.getBrands({ categoryId: activeCategoryId, subCategoryId: '', cityId })
        ]);

        let defaultSub = null;
        let defaultBrand = null;

        if (subRes?.success && Array.isArray(subRes.subCategories)) {
          setSubCategories(subRes.subCategories);
          if (subRes.subCategories.length > 0) {
            defaultSub = subRes.subCategories[0];
          }
        } else {
          setSubCategories([]);
        }

        let mappedBrands = [];
        if (brandRes?.success && Array.isArray(brandRes.brands)) {
          const filtered = brandRes.brands.filter((brand) => {
            const catIdStr = String(activeCategoryId);
            if (brand.categoryId && String(brand.categoryId) === catIdStr) return true;
            if (brand.category && (String(brand.category._id || brand.category.id) === catIdStr)) return true;
            if (Array.isArray(brand.categoryIds) && brand.categoryIds.map(String).includes(catIdStr)) return true;
            return false;
          });
          mappedBrands = filtered.map((brand) => ({
            id: brand.id || brand._id,
            title: brand.title,
            slug: brand.slug || brand.title?.toLowerCase().replace(/\s+/g, '-'),
            rating: brand.rating || 4.8,
            subtitle: brand.type === 'service' ? 'Services' : 'Parts',
            image: toAssetUrl(brand.iconUrl || brand.icon)
          }));
          setBrands(mappedBrands);
          if (mappedBrands.length > 0) {
            defaultBrand = mappedBrands[0];
          }
        } else {
          setBrands([]);
        }

        // Set subcategory and brand states simultaneously to avoid multiple render cascades
        setActiveSubCategory(defaultSub);
        setActiveBrand(defaultBrand);

        // Fetch services with the resolved defaults immediately
        const serviceRes = await publicCatalogService.getServices({
          categoryId: activeCategoryId,
          subCategoryId: defaultSub ? (defaultSub.id || defaultSub._id) : '',
          brandId: defaultBrand ? defaultBrand.id : '',
          cityId
        });

        if (serviceRes?.success && Array.isArray(serviceRes.services)) {
          let rawServices = serviceRes.services;
          if (defaultSub) {
            const subIdStr = String(defaultSub.id || defaultSub._id);
            rawServices = rawServices.filter(s => {
              if (!s) return false;
              if (s.subCategoryId && String(s.subCategoryId) === subIdStr) return true;
              if (s.subCategory && String(s.subCategory._id || s.subCategory.id) === subIdStr) return true;
              return false;
            });
          }
          setServices(rawServices.map((service, index) => ({
            id: service.id || service._id || `service-${index}`,
            title: service.title,
            description: service.description || 'Premium service with trusted experts.',
            image: toAssetUrl(service.icon || service.image) || getServiceDummyImage(service.title),
            rating: service.rating || 4.8,
            reviews: service.reviewCount || 120,
            price: service.discountPrice || service.basePrice || service.price || 0,
            originalPrice: service.basePrice || null,
            features: service.features || [],
            brandId: service.brandId,
            vendorId: service.vendorId
          })));
        } else {
          setServices([]);
        }

      } catch (err) {
        console.error("Error loading category data in parallel:", err);
      } finally {
        setSubCategoriesLoading(false);
        setBrandsLoading(false);
        setServicesLoading(false);
      }
    };

    loadCategoryData();
  }, [activeCategoryId, cityId]);

  // Handle manual subcategory or brand selection changes after initial loading is done
  useEffect(() => {
    // Avoid double refetch during initial full category load
    if (!activeCategoryId || subCategoriesLoading) return;

    const refetchServices = async () => {
      try {
        setServicesLoading(true);
        const serviceRes = await publicCatalogService.getServices({
          categoryId: activeCategoryId,
          subCategoryId: activeSubCategoryId || '',
          brandId: activeBrandId || '',
          cityId
        });

        if (serviceRes?.success && Array.isArray(serviceRes.services)) {
          let rawServices = serviceRes.services;
          if (activeSubCategoryId) {
            const subIdStr = String(activeSubCategoryId);
            rawServices = rawServices.filter(s => {
              if (!s) return false;
              if (s.subCategoryId && String(s.subCategoryId) === subIdStr) return true;
              if (s.subCategory && String(s.subCategory._id || s.subCategory.id) === subIdStr) return true;
              return false;
            });
          }

          setServices(rawServices.map((service, index) => ({
            id: service.id || service._id || `service-${index}`,
            title: service.title,
            description: service.description || 'Premium service with trusted experts.',
            image: toAssetUrl(service.icon || service.image) || getServiceDummyImage(service.title),
            rating: service.rating || 4.8,
            reviews: service.reviewCount || 120,
            price: service.discountPrice || service.basePrice || service.price || 0,
            originalPrice: service.basePrice || null,
            features: service.features || [],
            brandId: service.brandId,
            vendorId: service.vendorId
          })));
        } else {
          setServices([]);
        }
      } catch (error) {
        console.error("Error refetching services:", error);
      } finally {
        setServicesLoading(false);
      }
    };

    refetchServices();
  }, [activeSubCategoryId, activeBrandId]);

  const quantities = useMemo(() => {
    const map = {};
    cartItems.forEach((item) => {
      const id = item.serviceId?.id || item.serviceId || item.id;
      map[id] = item.serviceCount || 1;
    });
    return map;
  }, [cartItems]);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const value = search.trim().toLowerCase();
      if (!value) return true;
      return service.title.toLowerCase().includes(value) || service.description.toLowerCase().includes(value);
    });
  }, [search, services]);

  const handleAdd = async (service) => {
    const response = await addToCart(buildCartItemData({ service, category: activeCategory, brand: activeBrand }));
    if (response?.success) {
      navigate('/user/cart');
    }
  };

  const handleIncrease = async (service) => {
    const item = cartItems.find((entry) => (entry.serviceId?.id || entry.serviceId || entry.id) === service.id);
    if (!item) return handleAdd(service);
    await updateItem(item._id || item.id, (item.serviceCount || 1) + 1);
  };

  const handleDecrease = async (service) => {
    const item = cartItems.find((entry) => (entry.serviceId?.id || entry.serviceId || entry.id) === service.id);
    if (!item) return;
    if ((item.serviceCount || 1) <= 1) {
      await removeItem(item._id || item.id);
    } else {
      await updateItem(item._id || item.id, (item.serviceCount || 1) - 1);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff8f1_0%,#ffffff_38%,#ffffff_100%)] pb-28">
      <Navbar locationLabel={currentCity?.name || 'Select location'} cartCount={cartCount} onSearchClick={() => {}} onLocationClick={() => navigate('/user/home')} />

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-4 lg:grid-cols-[280px_1fr] lg:px-6">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-3 rounded-[28px] border border-gray-100 bg-white p-4 shadow-[0_18px_60px_rgba(17,24,39,0.06)]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-gray-400">Categories</p>
              <h2 className="mt-1 text-xl font-black text-gray-900">Choose a service</h2>
            </div>
            <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
              {categories.map((category) => (
                <SidebarCategory
                  key={category.id || category.slug}
                  category={category}
                  active={(activeCategory?.id || activeCategory?.slug) === (category.id || category.slug)}
                  onClick={() => setActiveCategory(category)}
                />
              ))}
            </div>
            {categories.length === 0 ? <div className="rounded-[20px] border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-500">No categories available.</div> : null}
          </div>
        </aside>

        <section className="space-y-5">
          <div className="lg:hidden space-y-3">
            <SearchBar value={search} onChange={setSearch} placeholder="Search this category" />
            <div className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((category) => (
                <button key={category.id || category.slug} type="button" onClick={() => setActiveCategory(category)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all ${activeCategory?.id === category.id ? 'bg-gradient-to-r from-[#FF9F45] to-[#FFB86C] text-white shadow-lg shadow-orange-100' : 'bg-white text-gray-700 border border-gray-200'}`}>
                  {category.title}
                </button>
              ))}
            </div>
            {activeCategory?.status !== 'coming_soon' && !subCategoriesLoading && !subCategories.length ? <div className="mt-3 rounded-[20px] border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-500">No subcategories available.</div> : null}
          </div>

          {activeCategory?.status === 'coming_soon' ? (
            <div className="flex flex-col items-center justify-center p-5 text-center rounded-[30px] border border-amber-100 bg-white shadow-[0_12px_40px_rgba(255,159,69,0.06)] py-8 max-w-md mx-auto">
              <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              
              <h1 className="text-2xl font-extrabold text-gray-900 mb-1.5">
                {activeCategory.title}
              </h1>
              
              <div className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4">
                Coming Soon
              </div>
              
              <p className="text-sm text-gray-500 max-w-xs mb-5 font-medium leading-relaxed">
                We are launching this category soon in your area. Click below to show your interest, and we'll notify you!
              </p>
              
              <button
                disabled={activeCategory.isInterested}
                onClick={async () => {
                  try {
                    const res = await publicCatalogService.registerInterest(activeCategory.id || activeCategory._id);
                    if (res.success) {
                      toast.success(res.message);
                      setCategories(prev => prev.map(c => 
                        c.id === activeCategory.id 
                          ? { ...c, isInterested: true, interestedCount: (c.interestedCount || 0) + 1 }
                          : c
                      ));
                      setActiveCategory(prev => ({ ...prev, isInterested: true }));
                    } else {
                      toast.error(res.message || "Failed to register interest");
                    }
                  } catch (err) {
                    console.error("Interest registration failed:", err);
                    const msg = err.response?.data?.message || "Authentication required. Please login first.";
                    toast.error(msg);
                  }
                }}
                className={`w-full max-w-xs py-3 px-5 rounded-2xl font-bold shadow-md transition-all ${
                  activeCategory.isInterested 
                    ? 'bg-green-500 text-white cursor-default shadow-none'
                    : 'bg-[#FF9F45] text-white hover:bg-[#FFB86C] hover:shadow-lg'
                }`}
                style={{ backgroundColor: activeCategory.isInterested ? '#22c55e' : '#FF9F45' }}
              >
                {activeCategory.isInterested ? "✓ Interest Registered" : "I'm Interested!"}
              </button>
            </div>
          ) : (
            <>
              <div className="hidden items-center gap-3 rounded-[28px] border border-gray-100 bg-white px-4 py-3 shadow-sm lg:flex">
            <SearchBar value={search} onChange={setSearch} placeholder="Search services inside this category" />
            <button type="button" className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50">
              <FiFilter />
              Filter
            </button>
            <button type="button" onClick={() => navigate('/user/cart')} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm transition hover:border-orange-200 hover:bg-orange-50">
              <FiShoppingBag />
              Cart
            </button>
          </div>

          <div className="rounded-[30px] border border-orange-100 bg-white p-4 shadow-[0_18px_60px_rgba(255,159,69,0.08)]">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#FF9F45]">Subcategories</p>
                <h3 className="text-2xl font-black text-gray-900">{activeCategory?.title}</h3>
              </div>
            </div>
            {subCategoriesLoading ? (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-orange-50/50" />
                ))}
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {(subCategories.length ? subCategories : [{ title: 'All' }]).map((sub) => (
                  <button
                    key={sub.id || sub._id || sub.title}
                    type="button"
                    onClick={() => setActiveSubCategory(sub)}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all ${activeSubCategory?.id === sub.id ? 'bg-gradient-to-r from-[#FF9F45] to-[#FFB86C] text-white shadow-lg shadow-orange-100' : 'bg-orange-50 text-[#FF9F45] hover:bg-orange-100/50'}`}
                  >
                    {sub.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[30px] border border-gray-100 bg-white p-4 shadow-[0_18px_60px_rgba(17,24,39,0.06)]">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-gray-400">Brands</p>
                <h3 className="text-xl font-black text-gray-900">Top options in this category</h3>
              </div>
            </div>
            {brandsLoading ? (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 w-28 shrink-0 animate-pulse rounded-[24px] bg-gray-50/70 border border-gray-100" />
                ))}
              </div>
            ) : (
              <>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {brands.map((brand) => (
                    <BrandCard key={brand.id || brand.slug} brand={brand} active={(activeBrand?.id || activeBrand?.slug) === (brand.id || brand.slug)} onClick={() => setActiveBrand(brand)} />
                  ))}
                </div>
                {!brands.length ? <div className="mt-3 rounded-[20px] border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-500">No brands available.</div> : null}
              </>
            )}
          </div>

          <div className="space-y-4">
            {servicesLoading ? (
              [1, 2].map((i) => (
                <div key={i} className="h-32 w-full animate-pulse rounded-[24px] bg-gray-50/70 border border-gray-100" />
              ))
            ) : (
              <>
                {filteredServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    quantity={quantities[service.id] || 0}
                    onAdd={handleAdd}
                    onIncrease={handleIncrease}
                    onDecrease={handleDecrease}
                    onOpen={() => navigate(`/user/service/${service.id}`, { state: { service, category: activeCategory, brand: activeBrand } })}
                  />
                ))}
                {!filteredServices.length ? <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500">No services available.</div> : null}
              </>
            )}
          </div>
        </>
      )}
        </section>
      </div>


    </div>
  );
};

export default PremiumCategoryPage;
