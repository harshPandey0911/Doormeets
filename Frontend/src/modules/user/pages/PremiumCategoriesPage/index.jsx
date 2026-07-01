import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiShoppingBag } from 'react-icons/fi';
import Navbar from '../../components/premium/Navbar';
import SearchBar from '../../components/premium/SearchBar';
import { useCity } from '../../../../context/CityContext';
import { useCart } from '../../../../context/CartContext';
import { publicCatalogService } from '../../../../services/catalogService';
import { toAssetUrl } from '../../components/premium/cartUtils';

const PremiumCategoriesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentCity } = useCity();
  const { cartCount } = useCart();

  const [query, setQuery] = useState('');
  const [categoriesWithSubs, setCategoriesWithSubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCategoriesAndSubs = async () => {
      try {
        setLoading(true);
        const cityId = currentCity?._id || currentCity?.id;
        const categoriesRes = await publicCatalogService.getCategories(cityId);

        if (categoriesRes?.success && Array.isArray(categoriesRes.categories)) {
          const mapped = categoriesRes.categories.map((cat) => ({
            id: cat.id || cat._id,
            title: cat.title,
            slug: cat.slug || cat.title?.toLowerCase().replace(/\s+/g, '-'),
            icon: toAssetUrl(cat.icon || cat.homeIconUrl),
            status: cat.status || 'active',
            hasSubCategory: cat.hasSubCategory !== false,
          }));

          const activeCats = mapped.filter((cat) => cat.status !== 'coming_soon');

          // Fetch subcategories or services for all active categories in parallel
          const withSubs = await Promise.all(
            activeCats.map(async (cat) => {
              try {
                if (cat.hasSubCategory === false) {
                  const servicesRes = await publicCatalogService.getServices({ categoryId: cat.id });
                  return {
                    ...cat,
                    subCategories: [],
                    services: servicesRes?.success && Array.isArray(servicesRes.services) ? servicesRes.services : [],
                  };
                }

                const subRes = await publicCatalogService.getSubCategories({ categoryId: cat.id });
                const subCategories = subRes?.success && Array.isArray(subRes.subCategories) ? subRes.subCategories : [];

                if (subCategories.length === 0) {
                  const servicesRes = await publicCatalogService.getServices({ categoryId: cat.id });
                  return {
                    ...cat,
                    subCategories: [],
                    services: servicesRes?.success && Array.isArray(servicesRes.services) ? servicesRes.services : [],
                  };
                }

                return {
                  ...cat,
                  subCategories,
                  services: [],
                };
              } catch (err) {
                console.error(`Error loading details for ${cat.title}:`, err);
                return { ...cat, subCategories: [], services: [] };
              }
            })
          );

          setCategoriesWithSubs(withSubs);
        }
      } catch (error) {
        console.error('Error fetching categories list:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCategoriesAndSubs();
  }, [currentCity]);

  // Smooth scroll to selected category from home page
  useEffect(() => {
    if (!loading && location.state?.category) {
      const catId = location.state.category.id || location.state.category._id;
      setTimeout(() => {
        const element = document.getElementById(`category-${catId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
      // Clear state
      window.history.replaceState({}, '', location.pathname);
    }
  }, [loading, location.state, location.pathname]);

  // Filter categories, subcategories, and services based on search query
  const filteredData = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return categoriesWithSubs;

    return categoriesWithSubs
      .map((cat) => {
        // Match either category title, its subcategory titles, or its service titles
        const matchesCat = cat.title.toLowerCase().includes(term);
        const filteredSubs = (cat.subCategories || []).filter((sub) =>
          sub.title.toLowerCase().includes(term)
        );
        const filteredServices = (cat.services || []).filter((svc) =>
          svc.title.toLowerCase().includes(term)
        );

        if (matchesCat || filteredSubs.length > 0 || filteredServices.length > 0) {
          return {
            ...cat,
            // If the category itself matched but no children matched, keep all children.
            // Otherwise, filter to only the matching children.
            subCategories: filteredSubs.length > 0 ? filteredSubs : cat.subCategories,
            services: filteredServices.length > 0 ? filteredServices : cat.services,
          };
        }
        return null;
      })
      .filter(Boolean);
  }, [categoriesWithSubs, query]);

  const handleSubCategoryClick = (category, subCategory) => {
    const isPainting = category.slug === 'painting' || (category.title && category.title.toLowerCase() === 'painting');
    if (isPainting) {
      navigate('/user/painting-consultation');
      return;
    }
    navigate(`/user/category/${category.slug || category.id}`, {
      state: { category, subCategory }
    });
  };

  const handleServiceClick = (category, service) => {
    const isPainting = category.slug === 'painting' || (category.title && category.title.toLowerCase() === 'painting');
    if (isPainting) {
      navigate('/user/painting-consultation');
      return;
    }
    navigate(`/user/category/${category.slug || category.id}`, {
      state: { category, selectedService: service }
    });
  };

  const getSubDummyImage = (title) => {
    const t = (title || '').toLowerCase();
    if (t.includes('ac') || t.includes('conditioner')) return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=150&auto=format&fit=crop&q=80';
    if (t.includes('washing') || t.includes('machine') || t.includes('dryer')) return 'https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?w=150&auto=format&fit=crop&q=80';
    if (t.includes('tv') || t.includes('television') || t.includes('screen')) return 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=150&auto=format&fit=crop&q=80';
    if (t.includes('plumb') || t.includes('leak') || t.includes('pipe')) return 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=150&auto=format&fit=crop&q=80';
    if (t.includes('clean') || t.includes('dust') || t.includes('sofa')) return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=150&auto=format&fit=crop&q=80';
    if (t.includes('pest') || t.includes('insect') || t.includes('ant')) return 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=150&auto=format&fit=crop&q=80';
    return 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=150&auto=format&fit=crop&q=80';
  };

  return (
    <div className="min-h-screen bg-light-bg pb-28 w-full overflow-x-hidden">
      {/* Premium Navbar */}
      <Navbar
        locationLabel={currentCity?.name || 'Select location'}
        cartCount={cartCount}
        onSearchClick={() => {}}
        onLocationClick={() => navigate('/user/home')}
      />

      <main className="mx-auto max-w-5xl px-4 pt-[76px] pb-4">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-orange-50/10 transition-colors"
            >
              <FiArrowLeft className="w-6 h-6 text-dark-text" />
            </button>
            <h1 className="text-2xl font-semibold text-dark-text">All Categories</h1>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search categories or subcategories..."
          />
        </div>

        {/* Categories & Subcategories List */}
        {loading ? (
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="h-6 w-48 bg-orange-50/50 rounded-md" />
                <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex flex-col items-center space-y-2">
                      <div className="w-20 h-20 bg-orange-50/30 rounded-2xl" />
                      <div className="h-4 w-16 bg-orange-50/30 rounded" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {filteredData.map((category) => (
              <div key={category.id} id={`category-${category.id}`} className="space-y-3 scroll-mt-24">
                {/* Category Header */}
                <div className="flex justify-between items-center px-1">
                  <h2 className="text-base font-semibold text-dark-text tracking-tight">
                    {category.title}
                  </h2>
                  <button
                    onClick={() => {
                      const isPainting = category.slug === 'painting' || (category.title && category.title.toLowerCase() === 'painting');
                      if (isPainting) {
                        navigate('/user/painting-consultation');
                      } else {
                        navigate(`/user/category/${category.slug || category.id}`, { state: { category } });
                      }
                    }}
                    className="text-xs font-semibold text-brand hover:text-brand-dark transition-colors"
                  >
                    See all
                  </button>
                </div>

                {/* Subcategory Grid or Services Grid */}
                {category.subCategories && category.subCategories.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3.5 sm:grid-cols-4 md:grid-cols-5 py-1 px-1">
                    {category.subCategories.map((sub, index) => (
                      <motion.button
                        key={sub.id || sub._id}
                        onClick={() => handleSubCategoryClick(category, sub)}
                        whileTap={{ scale: 0.95 }}
                        className="flex flex-col items-center p-3.5 bg-card-bg border border-border-color rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-orange-200 transition-all duration-300 group cursor-pointer"
                      >
                        {/* Image directly rendered with rounded corners */}
                        <img
                          src={toAssetUrl(sub.iconUrl) || getSubDummyImage(sub.title)}
                          alt={sub.title}
                          className="w-16 h-16 object-cover rounded-xl mb-2.5 transition-transform duration-300 group-hover:scale-105"
                        />
                        {/* Subcategory Title */}
                        <span className="text-[11px] font-normal text-secondary-text text-center line-clamp-2 transition-colors duration-200 group-hover:text-orange-500">
                          {sub.title ? sub.title.charAt(0).toUpperCase() + sub.title.slice(1).toLowerCase() : ''}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                ) : category.services && category.services.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3.5 sm:grid-cols-4 md:grid-cols-5 py-1 px-1">
                    {category.services.map((service, index) => (
                      <motion.button
                        key={service.id || service._id}
                        onClick={() => handleServiceClick(category, service)}
                        whileTap={{ scale: 0.95 }}
                        className="flex flex-col items-center p-3.5 bg-card-bg border border-border-color rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-orange-200 transition-all duration-300 group cursor-pointer"
                      >
                        <img
                          src={toAssetUrl(service.iconUrl || service.icon) || getSubDummyImage(service.title)}
                          alt={service.title}
                          className="w-16 h-16 object-cover rounded-xl mb-2.5 transition-transform duration-300 group-hover:scale-105"
                        />
                        <span className="text-[11px] font-normal text-secondary-text text-center line-clamp-2 transition-colors duration-200 group-hover:text-orange-500">
                          {service.title}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[24px] border border-dashed border-border-color bg-card-bg p-6 text-sm text-secondary-text text-center">
                    No services or subcategories available.
                  </div>
                )}
              </div>
            ))}

            {filteredData.length === 0 && (
              <div className="rounded-[28px] border border-dashed border-border-color bg-card-bg p-8 text-sm text-secondary-text text-center">
                No matching categories found.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default PremiumCategoriesPage;
