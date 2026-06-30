import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiShoppingBag, FiPlus, FiMinus, FiPlay, FiStar, FiX, FiCheckCircle } from 'react-icons/fi';
import Navbar from '../../components/premium/Navbar';
import SearchBar from '../../components/premium/SearchBar';
import SidebarCategory from '../../components/premium/SidebarCategory';
import ServiceCard from '../../components/premium/ServiceCard';
import BottomCheckoutBar from '../../components/premium/BottomCheckoutBar';
import { buildCartItemData, toAssetUrl } from '../../components/premium/cartUtils';
import { useCity } from '../../../../context/CityContext';
import { useCart } from '../../../../context/CartContext';
import { publicCatalogService } from '../../../../services/catalogService';
import { useTheme } from '../../../../context/ThemeContext';
import api from '../../../../services/api';

const getServiceDummyImage = (title) => {
  const t = (title || '').toLowerCase();
  if (t.includes('massage') || t.includes('spa') || t.includes('wellness') || t.includes('therapy')) {
    return 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=500&auto=format&fit=crop&q=80';
  }
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

// Pastel card backgrounds for subcategories
const pastelPalettes = [
  { bg: '#FEFBE8', border: '#FEF08A', text: '#854D0E', darkBg: '#59522B', darkBorder: '#7A703C', darkText: '#FEF08A' }, // Yellow
  { bg: '#FAE8FF', border: '#F5D0FE', text: '#86198F', darkBg: '#593461', darkBorder: '#794785', darkText: '#F5D0FE' }, // Purple
  { bg: '#FFE4E6', border: '#FECDD3', text: '#9F1239', darkBg: '#693541', darkBorder: '#8E4858', darkText: '#FECDD3' }, // Rose
  { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', darkBg: '#2A5C3D', darkBorder: '#3D8055', darkText: '#BBF7D0' }, // Green
  { bg: '#E0F2FE', border: '#BAE6FD', text: '#075985', darkBg: '#264E72', darkBorder: '#376F9F', darkText: '#BAE6FD' }, // Blue
  { bg: '#EEF2FF', border: '#C7D2FE', text: '#3730A3', darkBg: '#343A7C', darkBorder: '#4E57B8', darkText: '#C7D2FE' }  // Indigo
];

const PremiumCategoryPage = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const location = useLocation();
  const { currentCity } = useCity();
  const { isDark } = useTheme();
  const { cartCount, cartItems, addToCart, updateItem, removeItem } = useCart();

  // Redirect painting category to the painting consultation flow
  useEffect(() => {
    if (slug === 'painting' || (slug && slug.toLowerCase() === 'painting')) {
      navigate('/user/painting-consultation', { replace: true });
    }
  }, [slug, navigate]);

  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(location.state?.category || null);
  const [subCategories, setSubCategories] = useState([]);
  const [services, setServices] = useState([]);

  // Loading states
  const [loading, setLoading] = useState(true);

  // Variants popup states
  const [showVariantPopup, setShowVariantPopup] = useState(false);
  const [selectedServiceForPopup, setSelectedServiceForPopup] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState([]);

  const cityId = currentCity?._id || currentCity?.id;
  const activeCategoryId = activeCategory?.id || activeCategory?._id;

  // Load parent categories
  useEffect(() => {
    const loadCategory = async () => {
      try {
        const homeRes = await publicCatalogService.getHomeData(cityId);
        if (homeRes?.success && Array.isArray(homeRes.categories)) {
          const mapped = homeRes.categories.map((cat) => ({
            id: cat.id || cat._id,
            title: cat.title,
            slug: cat.slug || cat.title?.toLowerCase().replace(/\s+/g, '-'),
            icon: toAssetUrl(cat.icon || cat.homeIconUrl),
            bannerImage: toAssetUrl(cat.bannerImage) || '',
            description: cat.description || '',
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

  // Load Subcategories and Services in Category
  useEffect(() => {
    if (!activeCategoryId) return;

    const loadCategoryData = async () => {
      try {
        setLoading(true);
        // Load subcategories
        const subRes = await publicCatalogService.getSubCategories({ categoryId: activeCategoryId });
        const subs = subRes?.success && Array.isArray(subRes.subCategories) ? subRes.subCategories : [];
        setSubCategories(subs);

        // Load all services inside category
        const serviceRes = await publicCatalogService.getServices({
          categoryId: activeCategoryId,
          cityId
        });

        if (serviceRes?.success && Array.isArray(serviceRes.services)) {
          const mappedServices = serviceRes.services.map((service, index) => ({
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
            subCategoryId: service.subCategoryId || (service.subCategory && (service.subCategory._id || service.subCategory.id)),
            vendorId: service.vendorId,
            variants: service.variants || [],
            serviceType: service.serviceType || 'package_base',
            workflow: service.workflow || null
          }));
          setServices(mappedServices);
        } else {
          setServices([]);
        }
      } catch (err) {
        console.error("Error loading category details:", err);
      } finally {
        setLoading(false);
      }
    };

    loadCategoryData();
  }, [activeCategoryId, cityId]);

  const getCartItemServiceId = (item) => {
    if (!item) return null;
    if (typeof item.serviceId === 'object' && item.serviceId) {
      return item.serviceId._id || item.serviceId.id;
    }
    return item.serviceId || item.id || item._id;
  };

  // Build quantities map
  const quantities = useMemo(() => {
    const map = {};
    cartItems.forEach((item) => {
      const id = getCartItemServiceId(item);
      if (id) map[id] = item.serviceCount || 1;
    });
    return map;
  }, [cartItems]);

  // Group services by Subcategory ID
  const groupedServices = useMemo(() => {
    const groups = {};
    services.forEach((service) => {
      if (search.trim()) {
        const matches = service.title.toLowerCase().includes(search.toLowerCase()) || 
                        service.description.toLowerCase().includes(search.toLowerCase());
        if (!matches) return;
      }

      const subId = service.subCategoryId || 'other';
      if (!groups[subId]) groups[subId] = [];
      groups[subId].push(service);
    });
    return groups;
  }, [services, search]);

  // Generate dynamic package bundles for preview
  const generatedPackages = useMemo(() => {
    if (services.length < 2) return [];
    // Bundle top services into packages
    const topServices = services.slice(0, 3);
    const totalPrice = topServices.reduce((sum, s) => sum + s.price, 0);
    const bundlePrice = Math.round(totalPrice * 0.85); // 15% off
    return [
      {
        id: 'pkg-combo-1',
        title: topServices.map(s => s.title.split(' ')[0]).join(' + ') + ' Bundle',
        rating: 4.8,
        reviews: '1.2k',
        price: bundlePrice,
        originalPrice: totalPrice,
        discount: '10% off *',
        services: topServices,
        description: `Enjoy a complete premium combo containing ${topServices.map(s => s.title.toLowerCase()).join(', ')}.`
      }
    ];
  }, [services]);

  // Scroll to subcategory helper
  const handleScrollToSub = (subId) => {
    const element = document.getElementById(`subcat-sec-${subId}`);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const toggleVariant = (variant) => {
    setSelectedVariants(prev => {
      const isSelected = prev.some(v => v._id === variant._id || v.title === variant.title);
      if (isSelected) return prev.filter(v => (v._id || v.title) !== (variant._id || variant.title));
      return [...prev, variant];
    });
  };

  const handleConfirmVariants = async () => {
    if (!selectedServiceForPopup) return;

    const dynamicFieldsPayload = [];
    if (selectedVariants.length > 0) {
      dynamicFieldsPayload.push({
        name: 'Selected Variants',
        label: 'Selected Variants',
        value: selectedVariants.map(v => `${v.title}${v.extraPrice > 0 ? ` (+₹${v.extraPrice})` : ''}`).join(', ')
      });
    }

    const cartData = buildCartItemData({ service: selectedServiceForPopup, category: activeCategory });
    const variantExtraTotal = selectedVariants.reduce((sum, v) => sum + (Number(v.extraPrice) || 0), 0);
    const finalPrice = selectedServiceForPopup.price + variantExtraTotal;

    cartData.price = finalPrice;
    cartData.unitPrice = finalPrice;
    const baseOriginalPrice = Number(selectedServiceForPopup.originalPrice || selectedServiceForPopup.price || 0);
    cartData.originalPrice = baseOriginalPrice > 0 ? (baseOriginalPrice + variantExtraTotal) : finalPrice;
    if (cartData.card) {
      cartData.card.price = finalPrice;
      cartData.card.originalPrice = cartData.originalPrice;
    }
    cartData.dynamicFields = dynamicFieldsPayload;

    const response = await addToCart(cartData);
    if (response?.success) {
      toast.success('Added to cart');
      setShowVariantPopup(false);
      setSelectedServiceForPopup(null);
      setSelectedVariants([]);
    }
  };

  const handleAdd = async (service) => {
    try {
      const sId = service.id || service._id;
      const res = await api.get(`/public/services/${sId}/dynamic-details${cityId ? `?cityId=${cityId}` : ''}`);
      if (res.data.success && Array.isArray(res.data.variants) && res.data.variants.length > 0) {
        const serviceWithVariants = {
          ...service,
          variants: res.data.variants
        };
        setSelectedServiceForPopup(serviceWithVariants);
        setSelectedVariants([]);
        setShowVariantPopup(true);
        return;
      }
    } catch (err) {
      console.error("Error fetching service variants:", err);
    }

    await addToCart(buildCartItemData({ service, category: activeCategory }));
    toast.success(`${service.title} added to cart!`);
  };

  const handleIncrease = async (service) => {
    const item = cartItems.find((entry) => getCartItemServiceId(entry) === service.id);
    if (!item) return handleAdd(service);
    await updateItem(item._id || item.id, (item.serviceCount || 1) + 1);
  };

  const handleDecrease = async (service) => {
    const item = cartItems.find((entry) => getCartItemServiceId(entry) === service.id);
    if (!item) return;
    if ((item.serviceCount || 1) <= 1) {
      await removeItem(item._id || item.id);
    } else {
      await updateItem(item._id || item.id, (item.serviceCount || 1) - 1);
    }
  };

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (item.price * (item.serviceCount || 1)), 0);
  }, [cartItems]);

  const cartOriginalTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + ((item.originalPrice || item.price) * (item.serviceCount || 1)), 0);
  }, [cartItems]);

  return (
    <div className="min-h-screen pb-40 w-full bg-[var(--background)] text-[var(--text-primary)] transition-colors duration-300">
      {/* Dynamic Header / Cover Banner */}
      <div className="relative w-full h-[260px] md:h-[350px] overflow-hidden">
        {/* Cover Image */}
        <img
          src={activeCategory?.bannerImage || activeCategory?.icon || 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80'}
          alt={activeCategory?.title}
          className="w-full h-full object-cover filter brightness-[0.85] dark:brightness-75 transition-all duration-300"
        />

        {/* Diagonal Gradient Cover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

        {/* Float Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-20 p-2.5 rounded-full bg-white/90 dark:bg-zinc-900/90 text-slate-900 dark:text-zinc-100 shadow-md hover:scale-105 active:scale-95 transition-all"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>


      </div>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 md:px-6 mt-6 relative z-10">
        
        {/* Category Description block in normal flow */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {activeCategory?.title}
          </h1>

          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-amber-500">
            <FiStar className="fill-amber-500 w-4 h-4" />
            <span>4.5</span>
            <span style={{ color: 'var(--border)' }}>|</span>
            <span style={{ color: 'var(--text-secondary)' }}>1.2k reviews</span>
          </div>

          <p className="mt-3 text-xs md:text-sm leading-relaxed font-normal" style={{ color: 'var(--text-secondary)' }}>
            {activeCategory?.description || `Our ${activeCategory?.title?.toLowerCase()} caters to everyone, providing a fun and comfortable atmosphere with premium, certified home expert styling and custom packages tailored for you.`}
          </p>
        </div>

        {/* Subcategories Grid Cards */}
        {subCategories.length > 0 && (
          <div className="mb-8">
            <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
              {subCategories.map((sub, index) => {
                const color = pastelPalettes[index % pastelPalettes.length];
                const subImage = toAssetUrl(sub.iconUrl) || 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=150&auto=format&fit=crop&q=80';
                return (
                  <button
                    key={sub.id || sub._id}
                    onClick={() => handleScrollToSub(sub.id || sub._id)}
                    className="relative flex flex-col items-center justify-center rounded-2xl border transition-all hover:scale-[1.02] active:scale-95 text-center aspect-square shadow-sm overflow-hidden p-0"
                    style={{
                      backgroundColor: isDark ? color.darkBg : color.bg,
                      borderColor: isDark ? color.darkBorder : color.border,
                    }}
                  >
                    <div className="absolute inset-0 w-full h-full">
                      <img
                        src={subImage}
                        alt={sub.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                    </div>
                    <span 
                      className="absolute bottom-2 left-0 right-0 px-2 text-[10px] md:text-xs font-black tracking-tight truncate text-white z-10"
                    >
                      {sub.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Packages Section */}
        {generatedPackages.length > 0 && (
          <div className="mb-8 p-5 bg-[#FDF2F8] dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/40 rounded-3xl shadow-sm">
            <div className="flex items-center gap-1.5 text-xs font-bold text-pink-600 dark:text-pink-400">
              <span className="px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/30 text-[10px] uppercase">Special Combo</span>
              <span>10% off *</span>
            </div>
            
            <div className="flex justify-between items-start mt-3">
              <div>
                <h3 className="text-[15px] font-bold text-slate-800 dark:text-pink-200">
                  {generatedPackages[0].title}
                </h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-zinc-400 leading-normal max-w-lg">
                  {generatedPackages[0].description}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900 dark:text-white">₹{generatedPackages[0].price}</span>
                  <span className="text-xs text-slate-400 line-through">₹{generatedPackages[0].originalPrice}</span>
                </div>
              </div>
              
              <button
                onClick={() => {
                  generatedPackages[0].services.forEach(s => handleAdd(s));
                }}
                className="px-5 py-2.5 rounded-2xl bg-pink-600 dark:bg-pink-700 text-white font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-md shadow-pink-200 dark:shadow-none"
              >
                Add Combo
              </button>
            </div>
          </div>
        )}

        {/* Search inside Category */}
        <div className="mb-6">
          <SearchBar value={search} onChange={setSearch} placeholder={`Search inside ${activeCategory?.title || 'category'}`} />
        </div>

        {/* Grouped Services List */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse space-y-4">
                <div 
                  className="h-6 w-36 rounded-md" 
                  style={{ backgroundColor: isDark ? '#232733' : '#E5E7EB' }}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map((j) => (
                    <div 
                      key={j} 
                      className="h-32 rounded-3xl" 
                      style={{ backgroundColor: isDark ? '#11141B' : '#F1F5F9' }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {subCategories.map((sub) => {
              const subServices = groupedServices[sub.id || sub._id] || [];
              if (subServices.length === 0) return null;

              return (
                <div key={sub.id || sub._id} id={`subcat-sec-${sub.id || sub._id}`} className="space-y-4 scroll-mt-20">
                  <h3 className="text-base md:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    {sub.title}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subServices.map((service) => (
                      <div key={service.id} className="relative group">
                        <ServiceCard
                          service={service}
                          quantity={quantities[service.id] || 0}
                          onAdd={handleAdd}
                          onIncrease={handleIncrease}
                          onDecrease={handleDecrease}
                          onOpen={() => navigate(`/user/service/${service.id}`, { state: { service, category: activeCategory } })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Other / Uncategorized services */}
            {groupedServices['other'] && groupedServices['other'].length > 0 && (
              <div id="subcat-sec-other" className="space-y-4 scroll-mt-20">
                <h3 className="text-base md:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  General Services
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupedServices['other'].map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      quantity={quantities[service.id] || 0}
                      onAdd={handleAdd}
                      onIncrease={handleIncrease}
                      onDecrease={handleDecrease}
                      onOpen={() => navigate(`/user/service/${service.id}`, { state: { service, category: activeCategory } })}
                    />
                  ))}
                </div>
              </div>
            )}

            {services.length === 0 && (
              <div className="py-12 text-center rounded-[30px] border border-dashed border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <p className="text-sm text-slate-400 dark:text-zinc-500">No services available in this category.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Bottom Checkout / Cart Summary Bar */}
      {cartCount > 0 && (
        <BottomCheckoutBar
          total={cartTotal}
          originalTotal={cartOriginalTotal}
          buttonText="View Cart"
          onClick={() => navigate('/user/cart')}
        />
      )}

      {/* Variant Selection Popup Bottom Sheet */}
      <AnimatePresence>
        {showVariantPopup && selectedServiceForPopup && (
          <>
            {/* Backdrop */}
            <motion.div
              key="variant-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => {
                setShowVariantPopup(false);
                setSelectedServiceForPopup(null);
                setSelectedVariants([]);
              }}
            />
            {/* Bottom Sheet */}
            <motion.div
              key="variant-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-[28px] shadow-2xl pb-[env(safe-area-inset-bottom)]"
              style={{
                backgroundColor: isDark ? '#0A0911' : '#FFFFFF',
                borderTop: `1px solid ${isDark ? '#232733' : '#slate-100'}`
              }}
            >
              {/* Header */}
              <div 
                className="flex items-center justify-between px-5 pt-5 pb-4 border-b"
                style={{ borderColor: isDark ? '#232733' : '#F1F5F9' }}
              >
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: isDark ? '#F8FAFC' : '#1F2937' }}>Select Variants</h3>
                  <p className="text-xs mt-0.5" style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>Optional add-ons for this service</p>
                </div>
                <button
                  onClick={() => {
                    setShowVariantPopup(false);
                    setSelectedServiceForPopup(null);
                    setSelectedVariants([]);
                  }}
                  className="w-9 h-9 flex items-center justify-center rounded-full"
                  style={{
                    backgroundColor: isDark ? '#11141B' : '#F8F9FA',
                    color: isDark ? '#CBD5E1' : '#6B7280'
                  }}
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Variant Grid */}
              <div className="px-5 py-4 max-h-[50vh] overflow-y-auto">
                <div className="grid grid-cols-3 gap-3 items-stretch">
                  {(selectedServiceForPopup.variants || []).filter(v => v.isActive !== false).map((variant, idx) => {
                    const isSelected = selectedVariants.some(v => (v._id || v.title) === (variant._id || variant.title));
                    const color = pastelPalettes[idx % pastelPalettes.length];
                    return (
                      <button
                        key={variant._id || idx}
                        type="button"
                        onClick={() => toggleVariant(variant)}
                        className="flex flex-col items-center justify-between p-2 rounded-xl border text-center w-full min-h-[96px] shadow-[0_1px_4px_rgba(0,0,0,0.01)] transition-transform duration-200 hover:scale-[1.01] active:scale-95 cursor-pointer relative"
                        style={{
                          backgroundColor: color.bg,
                          borderColor: isSelected ? 'var(--primary)' : color.border,
                          borderWidth: isSelected ? '2px' : '1px'
                        }}
                      >
                        <div className="flex items-center justify-center mb-0.5">
                          <span
                            className="flex items-center justify-center w-5 h-5 rounded-full border-[1.5px] text-[9px] font-bold transition-all"
                            style={isSelected
                              ? { borderColor: 'var(--primary)', backgroundColor: 'var(--primary)', color: '#fff' }
                              : { borderColor: color.text, color: color.text }
                            }
                          >
                            {isSelected ? '✓' : <FiPlus className="w-2.5 h-2.5" />}
                          </span>
                        </div>
                        <span 
                          className="text-[10px] font-bold tracking-tight leading-tight line-clamp-1 my-0.5 flex-1 flex items-center justify-center" 
                          style={{ color: color.text }}
                        >
                          {variant.title}
                        </span>
                        <span
                          className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full transition-all shrink-0"
                          style={isSelected
                            ? { color: '#fff', backgroundColor: 'var(--primary)' }
                            : { color: color.text, backgroundColor: 'rgba(255,255,255,0.6)' }
                          }
                        >
                          {variant.extraPrice > 0 ? `+₹${variant.extraPrice}` : 'Free'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Price Breakdown + Confirm */}
              <div 
                className="px-5 pt-3 pb-6 border-t"
                style={{ borderColor: isDark ? '#232733' : '#F1F5F9' }}
              >
                {/* Price Preview */}
                <div 
                  className="mb-4 p-3 rounded-2xl text-xs space-y-1"
                  style={{ backgroundColor: isDark ? '#11141B' : '#F8F9FA' }}
                >
                  <div className="flex justify-between" style={{ color: isDark ? '#CBD5E1' : '#6B7280' }}>
                    <span>Base price</span>
                    <span className="font-semibold" style={{ color: isDark ? '#F8FAFC' : '#1F2937' }}>₹{selectedServiceForPopup.price}</span>
                  </div>
                  {selectedVariants.map((v, i) => (
                    <div key={i} className="flex justify-between" style={{ color: isDark ? '#CBD5E1' : '#6B7280' }}>
                      <span>{v.title}</span>
                      <span className="font-semibold text-brand">+₹{v.extraPrice}</span>
                    </div>
                  ))}
                  <div 
                    className="flex justify-between pt-1 border-t" 
                    style={{
                      borderColor: isDark ? '#232733' : '#E5E7EB',
                      color: isDark ? '#F8FAFC' : '#1F2937'
                    }}
                  >
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-base text-brand">
                      ₹{selectedServiceForPopup.price + selectedVariants.reduce((sum, v) => sum + (Number(v.extraPrice) || 0), 0)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConfirmVariants}
                  className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm shadow-lg transition-transform hover:scale-[1.01]"
                  style={{ background: 'linear-gradient(to right, var(--primary), var(--primary-dark, #e08a30))' }}
                >
                  Add to Cart — ₹{selectedServiceForPopup.price + selectedVariants.reduce((sum, v) => sum + (Number(v.extraPrice) || 0), 0)}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PremiumCategoryPage;
