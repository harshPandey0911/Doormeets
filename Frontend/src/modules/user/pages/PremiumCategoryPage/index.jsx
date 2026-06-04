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

  useEffect(() => {
    const loadCategory = async () => {
      try {
        const cityId = currentCity?._id || currentCity?.id;
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
  }, [currentCity, slug]);

  useEffect(() => {
    // Split loading: 1) fetch subcategories when category changes
    const loadSubCategories = async () => {
      if (!activeCategory) return;
      try {
        const categoryId = activeCategory.id || activeCategory._id;
        const subRes = await publicCatalogService.getSubCategories({ categoryId });
        if (subRes?.success) {
          setSubCategories(subRes.subCategories || []);
          // Only set active subcategory if none selected or it belongs to a different category
          if (!activeSubCategory) {
            setActiveSubCategory(subRes.subCategories?.[0] || null);
          } else {
            // if currently selected subcategory is not part of this category, reset to first
            const exists = (subRes.subCategories || []).some(sc => String(sc.id || sc._id) === String(activeSubCategory.id || activeSubCategory._id));
            if (!exists) setActiveSubCategory(subRes.subCategories?.[0] || null);
          }
        } else {
          setSubCategories([]);
          setActiveSubCategory(null);
        }
      } catch (error) {
        console.error('Failed to load subcategories', error);
        setSubCategories([]);
        setActiveSubCategory(null);
      }
    };

    loadSubCategories();
  }, [activeCategory, currentCity]);

  // 2) Fetch brands when category or activeSubCategory changes
  useEffect(() => {
    const loadBrands = async () => {
      if (!activeCategory) return;
      try {
        const categoryId = activeCategory.id || activeCategory._id;
        const subCatId = activeSubCategory?.id || activeSubCategory?._id || '';

        const brandRes = await publicCatalogService.getBrands({ 
          categoryId, 
          subCategoryId: subCatId, 
          cityId: currentCity?._id || currentCity?.id 
        });

        if (brandRes?.success) {
          const rawBrands = brandRes.brands || [];
          const filtered = rawBrands.filter((brand) => {
            if (subCatId) {
              if (brand.subCategoryId && String(brand.subCategoryId) === String(subCatId)) return true;
              if (brand.subCategory && String(brand.subCategory._id || brand.subCategory.id) === String(subCatId)) return true;
            }
            const catIdStr = String(categoryId);
            if (!catIdStr) return false;
            if (brand.categoryId && String(brand.categoryId) === catIdStr) return true;
            if (brand.category && (String(brand.category._id || brand.category.id) === catIdStr)) return true;
            if (Array.isArray(brand.categoryIds) && brand.categoryIds.map(String).includes(catIdStr)) return true;
            return false;
          });

          const mapped = filtered.map((brand) => ({
            id: brand.id || brand._id,
            title: brand.title,
            slug: brand.slug || brand.title?.toLowerCase().replace(/\s+/g, '-'),
            rating: brand.rating || 4.8,
            subtitle: brand.type === 'service' ? 'Services' : 'Parts',
            image: toAssetUrl(brand.iconUrl || brand.icon)
          }));
          setBrands(mapped);
          
          // Only change active brand if none selected or the currently selected one is not in the new list
          if (mapped.length > 0) {
            const stillExists = activeBrand && mapped.some(b => String(b.id) === String(activeBrand.id));
            if (!stillExists) {
              setActiveBrand(mapped[0]);
            }
          } else {
            setActiveBrand(null);
          }
        } else {
          setBrands([]);
          setActiveBrand(null);
        }
      } catch (error) {
        console.error('Category brands load error', error);
        setBrands([]);
        setActiveBrand(null);
      }
    };

    loadBrands();
  }, [activeCategory, currentCity, activeSubCategory]);

  // 3) Fetch services when category, activeSubCategory, or activeBrand changes
  useEffect(() => {
    const loadServices = async () => {
      if (!activeCategory) return;
      try {
        const categoryId = activeCategory.id || activeCategory._id;
        const subCatId = activeSubCategory?.id || activeSubCategory?._id || '';
        const brandId = activeBrand?.id || activeBrand?._id || '';

        const serviceRes = await publicCatalogService.getServices({ 
          categoryId, 
          subCategoryId: subCatId, 
          brandId,
          cityId: currentCity?._id || currentCity?.id 
        });

        if (serviceRes?.success) {
          let rawServices = (serviceRes.services || []);
          if (activeSubCategory) {
            rawServices = rawServices.filter(s => {
              if (!s) return false;
              if (s.subCategoryId && String(s.subCategoryId) === String(activeSubCategory.id || activeSubCategory._id)) return true;
              if (s.subCategory && String(s.subCategory._id || s.subCategory.id) === String(activeSubCategory.id || activeSubCategory._id)) return true;
              return (s.categoryId && String(s.categoryId) === String(categoryId));
            });
          }

          setServices(rawServices.map((service, index) => ({
            id: service.id || service._id || `service-${index}`,
            title: service.title,
            description: service.description || 'Premium service with trusted experts.',
            image: toAssetUrl(service.icon || service.image),
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
        console.error('Category services load error', error);
        setServices([]);
      }
    };

    loadServices();
  }, [activeCategory, currentCity, activeSubCategory, activeBrand]);

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f7f1ff_0%,#ffffff_38%,#ffffff_100%)] pb-28">
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
                <button key={category.id || category.slug} type="button" onClick={() => setActiveCategory(category)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all ${activeCategory?.id === category.id ? 'bg-linear-to-r from-purple-600 to-fuchsia-500 text-white shadow-lg shadow-purple-200' : 'bg-white text-gray-700 border border-gray-200'}`}>
                  {category.title}
                </button>
              ))}
            </div>
            {activeCategory?.status !== 'coming_soon' && !subCategories.length ? <div className="mt-3 rounded-[20px] border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-500">No subcategories available.</div> : null}
          </div>

          {activeCategory?.status === 'coming_soon' ? (
            <div className="flex flex-col items-center justify-center p-8 text-center rounded-[30px] border border-amber-100 bg-white shadow-[0_18px_60px_rgba(245,158,11,0.08)] py-16">
              <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              
              <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                {activeCategory.title}
              </h1>
              
              <div className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                Coming Soon
              </div>
              
              <p className="text-gray-500 max-w-sm mb-8 font-medium">
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
                className={`w-full max-w-xs py-4 px-6 rounded-2xl font-bold shadow-md transition-all ${
                  activeCategory.isInterested 
                    ? 'bg-green-500 text-white cursor-default shadow-none'
                    : 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg'
                }`}
                style={{ backgroundColor: activeCategory.isInterested ? '#22c55e' : '#2874f0' }}
              >
                {activeCategory.isInterested ? "✓ Interest Registered" : "I'm Interested!"}
              </button>
            </div>
          ) : (
            <>
              <div className="hidden items-center gap-3 rounded-[28px] border border-gray-100 bg-white px-4 py-3 shadow-sm lg:flex">
            <SearchBar value={search} onChange={setSearch} placeholder="Search services inside this category" />
            <button type="button" className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm transition hover:border-purple-200 hover:bg-purple-50">
              <FiFilter />
              Filter
            </button>
            <button type="button" onClick={() => navigate('/user/cart')} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm transition hover:border-purple-200 hover:bg-purple-50">
              <FiShoppingBag />
              Cart
            </button>
          </div>

          <div className="rounded-[30px] border border-purple-100 bg-white p-4 shadow-[0_18px_60px_rgba(124,58,237,0.08)]">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-purple-400">Subcategories</p>
                <h3 className="text-2xl font-black text-gray-900">{activeCategory?.title}</h3>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(subCategories.length ? subCategories : [{ title: 'All' }]).map((sub) => (
                <button
                  key={sub.id || sub._id || sub.title}
                  type="button"
                  onClick={() => setActiveSubCategory(sub)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all ${activeSubCategory?.id === sub.id ? 'bg-linear-to-r from-purple-600 to-fuchsia-500 text-white shadow-lg shadow-purple-200' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'}`}
                >
                  {sub.title}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-gray-100 bg-white p-4 shadow-[0_18px_60px_rgba(17,24,39,0.06)]">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-gray-400">Brands</p>
                <h3 className="text-xl font-black text-gray-900">Top options in this category</h3>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {brands.map((brand) => (
                <BrandCard key={brand.id || brand.slug} brand={brand} active={(activeBrand?.id || activeBrand?.slug) === (brand.id || brand.slug)} onClick={() => setActiveBrand(brand)} />
              ))}
            </div>
            {!brands.length ? <div className="mt-3 rounded-[20px] border border-dashed border-gray-200 bg-white p-4 text-sm text-gray-500">No brands available.</div> : null}
          </div>

          <div className="space-y-4">
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
          </div>
        </>
      )}
        </section>
      </div>


    </div>
  );
};

export default PremiumCategoryPage;
