import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
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
      navigate('/user/painting', { replace: true });
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
  const [showComboEditModal, setShowComboEditModal] = useState(false);
  const [selectedServiceForPopup, setSelectedServiceForPopup] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState([]);
  const [activeSubId, setActiveSubId] = useState(null);
  const [titleHeight, setTitleHeight] = useState(150);
  const [boxHeight, setBoxHeight] = useState(200);

  // Measure title section height dynamically
  const titleRef = useCallback((node) => {
    if (node !== null) {
      const resizeObserver = new ResizeObserver(() => {
        setTitleHeight(node.offsetHeight || node.getBoundingClientRect().height || 150);
      });
      resizeObserver.observe(node);
    }
  }, []);

  // Measure select service box height dynamically
  const boxRef = useCallback((node) => {
    if (node !== null) {
      const resizeObserver = new ResizeObserver(() => {
        setBoxHeight(node.offsetHeight || node.getBoundingClientRect().height || 200);
      });
      resizeObserver.observe(node);
    }
  }, []);

  const isScrollingRef = useRef(false);

  // Set default active subcategory
  useEffect(() => {
    if (subCategories.length > 0 && !activeSubId) {
      setActiveSubId(String(subCategories[0].id || subCategories[0]._id));
    }
  }, [subCategories, activeSubId]);

  // Scroll spy effect
  useEffect(() => {
    const handleScrollSpy = () => {
      if (isScrollingRef.current) return;
      const scrollPosition = window.scrollY + 180; // offset for sticky header/navbar

      let currentActiveId = activeSubId;
      for (const sub of subCategories) {
        const id = String(sub.id || sub._id);
        const el = document.getElementById(`subcat-sec-${id}`);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            currentActiveId = id;
            break;
          }
        }
      }

      if (currentActiveId && currentActiveId !== activeSubId) {
        setActiveSubId(currentActiveId);
      }
    };

    window.addEventListener('scroll', handleScrollSpy, { passive: true });
    return () => window.removeEventListener('scroll', handleScrollSpy);
  }, [subCategories, activeSubId]);

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
            subCategoryId: (() => {
              const val = service.subCategoryId || (service.subCategory && (service.subCategory._id || service.subCategory.id));
              if (!val) return 'other';
              if (typeof val === 'object') {
                return String(val._id || val.id || val);
              }
              return String(val);
            })(),
            vendorId: service.vendorId,
            variants: service.variants || [],
            packages: service.packages || [],
            serviceGroups: service.serviceGroups || [],
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

      const subId = service.subCategoryId ? String(service.subCategoryId) : 'other';
      if (!groups[subId]) groups[subId] = [];
      groups[subId].push(service);
    });
    return groups;
  }, [services, search]);

  // Extract actual database packages (combos) from the loaded package-based services
  const generatedPackages = useMemo(() => {
    const list = [];
    services.forEach(service => {
      if (service.serviceType === 'package_base' && Array.isArray(service.packages)) {
        service.packages.forEach(pkg => {
          // Prevent duplicates by checking package _id
          if (!list.some(p => p.id === pkg._id || p.title === pkg.title)) {
            // Map backend package schema to match UI structure
            list.push({
              id: pkg._id || pkg.id,
              title: pkg.title,
              rating: pkg.rating || 4.8,
              reviews: pkg.reviewCount || '1.0k',
              price: pkg.price,
              originalPrice: pkg.originalPrice || pkg.price,
              discount: pkg.discountPercentage ? `${pkg.discountPercentage}% off *` : 'Special Combo *',
              description: pkg.description || 'Enjoy a complete customized service combo.',
              services: pkg.includedItems ? pkg.includedItems.map(item => ({
                id: item.selectedItemId,
                title: item.selectedItemTitle,
                description: item.selectedItemDescription,
                price: 0 // handled by parent package price
              })) : [],
              rawPackage: pkg, // keep references for cart actions
              parentService: service
            });
          }
        });
      }
    });
    return list;
  }, [services]);

  // Scroll to subcategory helper
  const handleScrollToSub = (subId) => {
    const element = document.getElementById(`subcat-sec-${subId}`);
    if (element) {
      isScrollingRef.current = true;
      setActiveSubId(subId); // Ensure active category updates immediately
      
      const yOffset = -110; // offset for the fixed navbar/header
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      
      window.scrollTo({
        top: y,
        behavior: 'smooth'
      });

      // Clear flag after smooth scroll is complete
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
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

  const handleAdd = async (service, priceMultiplier = 1) => {
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

    const cartData = buildCartItemData({ service, category: activeCategory });
    if (priceMultiplier !== 1) {
      cartData.price = Math.round(cartData.price * priceMultiplier);
      cartData.unitPrice = Math.round(cartData.unitPrice * priceMultiplier);
      if (cartData.card) {
        cartData.card.price = cartData.price;
      }
    }

    await addToCart(cartData);
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

  const comboCount = useMemo(() => {
    if (!generatedPackages || generatedPackages.length === 0) return 0;
    const counts = generatedPackages[0].services.map(s => quantities[s.id || s._id] || 0);
    return Math.min(...counts);
  }, [generatedPackages, quantities]);

  const handleIncreaseCombo = async () => {
    if (!generatedPackages || generatedPackages.length === 0) return;
    const totalPrice = generatedPackages[0].originalPrice;
    const bundlePrice = generatedPackages[0].price;
    const multiplier = totalPrice > 0 ? (bundlePrice / totalPrice) : 0.85;
    for (const s of generatedPackages[0].services) {
      const item = cartItems.find((entry) => getCartItemServiceId(entry) === (s.id || s._id));
      if (!item) {
        await handleAdd(s, multiplier);
      } else {
        await updateItem(item._id || item.id, (item.serviceCount || 1) + 1);
      }
    }
  };

  const handleDecreaseCombo = async () => {
    if (!generatedPackages || generatedPackages.length === 0) return;
    for (const s of generatedPackages[0].services) {
      const item = cartItems.find((entry) => getCartItemServiceId(entry) === (s.id || s._id));
      if (!item) continue;
      if ((item.serviceCount || 1) <= 1) {
        await removeItem(item._id || item.id);
      } else {
        await updateItem(item._id || item.id, (item.serviceCount || 1) - 1);
      }
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
      {/* Desktop Top Navbar */}
      <div className="hidden lg:block">
        <Navbar 
          locationLabel={currentCity?.name || 'Select location'} 
          cartCount={cartCount} 
          onSearchClick={() => { }} 
          onLocationClick={() => navigate('/user/account')} 
        />
      </div>

      {/* MOBILE ONLY BANNER COVER & HEADER BLOCK */}
      <div className="lg:hidden">
        {/* Dynamic Header / Cover Banner */}
        <div className="relative w-full h-[180px] md:h-[260px] overflow-hidden">
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
            className="absolute top-4 left-4 z-20 w-7 h-7 flex items-center justify-center rounded-full bg-white/90 dark:bg-zinc-900/90 text-slate-900 dark:text-zinc-100 shadow-md hover:scale-105 active:scale-95 transition-all"
          >
            <FiArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile Page Header Details */}
        <div className="px-4 mt-6">
          <h1 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
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
      </div>



      {/* MAIN CONTAINER CONTENT BRANCH */}
      {/* 1. MOBILE FLOW */}
      <main className="lg:hidden max-w-7xl mx-auto px-4 md:px-6 mt-6 relative z-10">
        {/* Mobile Subcategories Grid */}
        {subCategories.length > 0 && (
          <div className="mb-8">
            <div className="grid grid-cols-3 gap-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8">
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
                      <img src={subImage} alt={sub.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                    </div>
                    <span className="absolute bottom-2 left-0 right-0 px-2 text-[10px] md:text-xs font-black tracking-tight truncate text-white z-10">
                      {sub.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mobile Packages Section */}
        {generatedPackages.length > 0 && (
          <div className="mb-8 space-y-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Combos</h2>
            {generatedPackages.map((comboItem, comboIdx) => {
              // Check if package is already inside cart by matching dynamic field selected package value
              const matchedCartItem = cartItems.find(item => {
                const sId = getCartItemServiceId(item);
                if (sId !== (comboItem.parentService?.id || comboItem.parentService?._id)) return false;
                const pkgField = item.dynamicFields?.find(f => f.name === 'Selected Package');
                return pkgField?.value === comboItem.title;
              });
              const addedCount = matchedCartItem ? (matchedCartItem.serviceCount || 0) : 0;

              const handleAddComboItem = async () => {
                if (addedCount > 0) {
                  toast.success(`${comboItem.title} is already in your cart!`);
                  return;
                }
                
                const dynamicFieldsPayload = [];
                dynamicFieldsPayload.push({
                  name: 'Selected Package',
                  label: 'Selected Package',
                  value: comboItem.title
                });

                if (comboItem.rawPackage?.includedItems && comboItem.parentService?.serviceGroups) {
                  comboItem.rawPackage.includedItems.forEach(incItem => {
                    const groupId = incItem.serviceGroupId?.toString();
                    const group = comboItem.parentService.serviceGroups.find(g => g._id?.toString() === groupId);
                    if (group) {
                      if (incItem.selectedItemId) {
                        const selectedItem = group.items?.find(i => i._id?.toString() === incItem.selectedItemId.toString());
                        if (selectedItem) {
                          dynamicFieldsPayload.push({
                            name: `Group: ${group.title}`,
                            label: group.title,
                            value: `${selectedItem.title} (₹${selectedItem.price})`
                          });
                        }
                      }
                    }
                  });
                }

                const cartData = buildCartItemData({ service: comboItem.parentService, category: activeCategory });
                cartData.card.title = `${comboItem.parentService.title} - ${comboItem.title}`;
                if (comboItem.rawPackage?.duration) cartData.card.duration = comboItem.rawPackage.duration;
                
                cartData.price = comboItem.price;
                cartData.unitPrice = comboItem.price;
                cartData.originalPrice = comboItem.originalPrice;
                if (cartData.card) {
                  cartData.card.price = comboItem.price;
                  cartData.card.originalPrice = comboItem.originalPrice;
                }
                cartData.dynamicFields = dynamicFieldsPayload;

                const response = await addToCart(cartData);
                if (response?.success) {
                  toast.success(`${comboItem.title} added to cart!`);
                }
              };

              const handleIncreaseComboItem = async () => {
                if (matchedCartItem) {
                  await updateItem(matchedCartItem._id || matchedCartItem.id, (matchedCartItem.serviceCount || 1) + 1);
                }
              };

              const handleDecreaseComboItem = async () => {
                if (matchedCartItem) {
                  if ((matchedCartItem.serviceCount || 1) <= 1) {
                    await removeItem(matchedCartItem._id || matchedCartItem.id);
                  } else {
                    await updateItem(matchedCartItem._id || matchedCartItem.id, (matchedCartItem.serviceCount || 1) - 1);
                  }
                }
              };

              return (
                <div key={comboItem.id || comboIdx} className="p-4 bg-[#FDF2F8] dark:bg-pink-950/20 border border-pink-100 dark:border-pink-900/40 rounded-3xl shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-pink-600 dark:text-pink-400">
                    <span className="px-2 py-0.5 rounded-full bg-pink-100 dark:bg-pink-900/30 text-[10px] uppercase">Special Combo</span>
                    <span>{comboItem.discount || 'Special Combo'}</span>
                  </div>
                  <div className="flex justify-between items-start mt-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-pink-200">{comboItem.title}</h3>
                      <p className="mt-1 text-xs text-slate-650 dark:text-zinc-400 leading-normal max-w-lg">{comboItem.description}</p>
                      
                      <ul className="space-y-1 mt-2.5">
                        {comboItem.services.map((s, idx) => (
                          <li key={idx} className="text-[10px] text-gray-500 dark:text-zinc-400 flex items-center gap-1.5">
                            <span className="w-1 h-1 bg-gray-400 dark:bg-zinc-650 rounded-full"></span>
                            <span>{s.title}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-base font-bold text-slate-900 dark:text-white">₹{comboItem.price}</span>
                        {comboItem.originalPrice > comboItem.price && (
                          <span className="text-xs text-slate-400 line-through">₹{comboItem.originalPrice}</span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 ml-4">
                      {addedCount > 0 ? (
                        <div className="w-[72px] h-[32px] bg-white dark:bg-zinc-800 border border-pink-200 rounded-xl text-[#B33A35] font-bold text-xs shadow-sm flex items-center justify-between px-1.5">
                          <button
                            onClick={handleDecreaseComboItem}
                            className="w-5 h-5 hover:bg-pink-50 dark:hover:bg-zinc-700 rounded-full flex items-center justify-center text-sm"
                          >
                            -
                          </button>
                          <span className="text-slate-800 dark:text-white font-extrabold">{addedCount}</span>
                          <button
                            onClick={handleIncreaseComboItem}
                            className="w-5 h-5 hover:bg-pink-50 dark:hover:bg-zinc-700 rounded-full flex items-center justify-center text-sm"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleAddComboItem}
                          className="px-4 py-2 rounded-2xl bg-pink-600 dark:bg-pink-700 text-white font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-md shadow-pink-200 dark:shadow-none"
                        >
                          Add Combo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}



        {/* Mobile Grouped Services List */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="h-6 w-36 rounded-md bg-gray-200 dark:bg-zinc-800" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2].map((j) => (
                    <div key={j} className="h-32 rounded-3xl bg-gray-100 dark:bg-zinc-900" />
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
                  <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{sub.title}</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
            {groupedServices['other'] && groupedServices['other'].length > 0 && (
              <div id="subcat-sec-other" className="space-y-4 scroll-mt-20">
                <h3 className="text-base md:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>General Services</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
          </div>
        )}
      </main>

      {/* 2. DESKTOP FLOW - Split screen layout */}
      <main className="hidden lg:grid grid-cols-12 gap-8 max-w-[1360px] mx-auto px-12 items-start relative z-10 pt-28">
        
        {/* Left Column (col-span-4) - Stretched to hold sticky child */}
        <aside className="col-span-4 flex flex-col gap-6 self-stretch">
          {/* Static Title & Description Section */}
          <div ref={titleRef}>
            <button
              onClick={() => navigate(-1)}
              className="mb-4 flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <FiArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
              {activeCategory?.title}
            </h1>
            <div className="flex items-center gap-2 mt-3">
              <span className="w-5 h-5 rounded-full bg-teal-600 flex items-center justify-center">
                <FiStar className="fill-white text-white w-3 h-3" />
              </span>
              <span className="text-sm font-bold text-gray-800 dark:text-zinc-200">4.80</span>
              <span className="text-sm text-gray-400 dark:text-zinc-500 font-medium">(9.3 M bookings)</span>
            </div>
            <p className="mt-4 text-[13px] text-gray-500 dark:text-zinc-400 leading-relaxed font-medium">
              {activeCategory?.description || `Our ${activeCategory?.title?.toLowerCase()} caters to everyone, providing a fun and comfortable atmosphere with premium, certified home expert styling and custom packages.`}
            </p>
          </div>

          {/* Sticky Select a Service Box (Sticks right below fixed navbar) */}
          <div 
            ref={boxRef}
            className="border border-gray-200 dark:border-zinc-800 rounded-3xl p-6 bg-white dark:bg-zinc-900 shadow-[0_4px_20px_rgba(0,0,0,0.02)]"
            style={{ position: 'sticky', top: '88px', zIndex: 20 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <h3 className="text-sm font-semibold text-slate-500 dark:text-zinc-400 whitespace-nowrap">Select a service</h3>
              <div className="h-[1px] bg-gray-200 dark:bg-zinc-800 flex-1"></div>
            </div>
            
            <div className="grid grid-cols-3 gap-x-3 gap-y-6">
              {subCategories.map((sub) => {
                const subId = String(sub.id || sub._id || '');
                const subImage = toAssetUrl(sub.iconUrl) || 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=150&auto=format&fit=crop&q=80';
                const isActive = String(activeSubId) === subId;
                return (
                  <button
                    key={subId}
                    onClick={() => {
                      setActiveSubId(subId);
                      handleScrollToSub(subId);
                    }}
                    className="flex flex-col items-center group cursor-pointer focus:outline-none"
                  >
                    <div className={`w-[72px] h-[72px] rounded-[18px] overflow-hidden flex items-center justify-center transition-all duration-200 ${
                      isActive 
                        ? 'ring-2 ring-slate-300 dark:ring-zinc-700 scale-105 shadow-md' 
                        : 'border border-gray-100 dark:border-zinc-800 group-hover:shadow-sm active:scale-95'
                    }`}>
                      <img src={subImage} alt={sub.title} className="w-full h-full object-cover" />
                    </div>
                    <span className={`text-[11.5px] mt-2.5 text-center leading-tight max-w-[85px] break-words transition-colors ${
                      isActive 
                        ? 'font-bold text-slate-900 dark:text-white' 
                        : 'font-medium text-gray-700 dark:text-zinc-400'
                    }`}>
                      {sub.title}
                    </span>
                    <span className="w-10 h-[2.5px] bg-slate-900 dark:bg-white rounded-full mt-1.5 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Right Column (col-span-8) - Top Banner and Bottom Split for Services & Cart */}
        <div className="col-span-8 flex flex-col gap-6 self-stretch">
          {/* Banner/Hero Image */}
          <div 
            className="w-full rounded-2xl overflow-hidden shadow-sm"
            style={{ height: `${titleHeight + boxHeight + 24}px` }}
          >
            <img
              src={activeCategory?.bannerImage || activeCategory?.icon || 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80'}
              alt={activeCategory?.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Under-banner 2-column content */}
          <div className="grid grid-cols-12 gap-6 items-start flex-1">
            
            {/* Services List (col-span-8) */}
            <section className="col-span-8 min-w-0 flex flex-col gap-6">


              {/* Desktop Packages Section */}
              {generatedPackages.length > 0 && (
                <div className="pb-8 border-b border-gray-200 dark:border-zinc-800 space-y-8">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Combos</h2>
                  {generatedPackages.map((comboItem, comboIdx) => {
                    // Check if package is already inside cart by matching dynamic field selected package value
                    const matchedCartItem = cartItems.find(item => {
                      const sId = getCartItemServiceId(item);
                      if (sId !== (comboItem.parentService?.id || comboItem.parentService?._id)) return false;
                      const pkgField = item.dynamicFields?.find(f => f.name === 'Selected Package');
                      return pkgField?.value === comboItem.title;
                    });
                    const addedCount = matchedCartItem ? (matchedCartItem.serviceCount || 0) : 0;

                    const handleAddComboItem = async () => {
                      if (addedCount > 0) {
                        toast.success(`${comboItem.title} is already in your cart!`);
                        return;
                      }
                      
                      const dynamicFieldsPayload = [];
                      dynamicFieldsPayload.push({
                        name: 'Selected Package',
                        label: 'Selected Package',
                        value: comboItem.title
                      });

                      if (comboItem.rawPackage?.includedItems && comboItem.parentService?.serviceGroups) {
                        comboItem.rawPackage.includedItems.forEach(incItem => {
                          const groupId = incItem.serviceGroupId?.toString();
                          const group = comboItem.parentService.serviceGroups.find(g => g._id?.toString() === groupId);
                          if (group) {
                            if (incItem.selectedItemId) {
                              const selectedItem = group.items?.find(i => i._id?.toString() === incItem.selectedItemId.toString());
                              if (selectedItem) {
                                dynamicFieldsPayload.push({
                                  name: `Group: ${group.title}`,
                                  label: group.title,
                                  value: `${selectedItem.title} (₹${selectedItem.price})`
                                });
                              }
                            }
                          }
                        });
                      }

                      const cartData = buildCartItemData({ service: comboItem.parentService, category: activeCategory });
                      cartData.card.title = `${comboItem.parentService.title} - ${comboItem.title}`;
                      if (comboItem.rawPackage?.duration) cartData.card.duration = comboItem.rawPackage.duration;
                      
                      cartData.price = comboItem.price;
                      cartData.unitPrice = comboItem.price;
                      cartData.originalPrice = comboItem.originalPrice;
                      if (cartData.card) {
                        cartData.card.price = comboItem.price;
                        cartData.card.originalPrice = comboItem.originalPrice;
                      }
                      cartData.dynamicFields = dynamicFieldsPayload;

                      const response = await addToCart(cartData);
                      if (response?.success) {
                        toast.success(`${comboItem.title} added to cart!`);
                      }
                    };

                    const handleIncreaseComboItem = async () => {
                      if (matchedCartItem) {
                        await updateItem(matchedCartItem._id || matchedCartItem.id, (matchedCartItem.serviceCount || 1) + 1);
                      }
                    };

                    const handleDecreaseComboItem = async () => {
                      if (matchedCartItem) {
                        if ((matchedCartItem.serviceCount || 1) <= 1) {
                          await removeItem(matchedCartItem._id || matchedCartItem.id);
                        } else {
                          await updateItem(matchedCartItem._id || matchedCartItem.id, (matchedCartItem.serviceCount || 1) - 1);
                        }
                      }
                    };

                    return (
                      <div key={comboItem.id || comboIdx} className="flex justify-between items-start py-2 border-b last:border-b-0 pb-6">
                        {/* Left Column: Info, Price, Tag, Bullet points */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[17px] font-bold text-slate-900 dark:text-white leading-snug">
                            {comboItem.title}
                          </h3>
                          
                          {/* Rating under title */}
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400 mt-1.5">
                            <span className="text-yellow-500">★</span>
                            <span className="font-bold text-gray-800 dark:text-zinc-200">{comboItem.rating || '4.80'}</span>
                            <span>({comboItem.reviews || '1.2k'} reviews)</span>
                          </div>

                          {/* Pricing with tag */}
                          <div className="flex items-center gap-2.5 mt-3">
                            <span className="text-base font-extrabold text-slate-900 dark:text-white">₹{comboItem.price}</span>
                            {comboItem.originalPrice > comboItem.price && (
                              <span className="text-sm text-slate-400 line-through">₹{comboItem.originalPrice}</span>
                            )}
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">• {comboItem.discount || 'Special Combo'}</span>
                          </div>

                          {/* Green Tag Banner */}
                          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-100/50 dark:border-emerald-900/30">
                            <span>🏷️</span>
                            <span>Special Bundle Deal</span>
                          </div>

                          {/* Dotted Divider line */}
                          <div className="w-full border-t border-dashed border-gray-200 dark:border-zinc-800 my-4" />

                          {/* Bullet points description */}
                          <ul className="space-y-1.5">
                            {comboItem.services.map((s, idx) => (
                              <li key={idx} className="text-xs text-gray-500 dark:text-zinc-400 flex items-center gap-2">
                                <span className="w-1 h-1 bg-gray-400 dark:bg-zinc-600 rounded-full flex-shrink-0"></span>
                                <span>{s.title}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Right Column: Rounded Cover Image with Absolute ADD Button */}
                        <div className="relative w-[120px] h-[120px] ml-6 flex-shrink-0 overflow-visible">
                          <div className="w-full h-full rounded-2xl overflow-hidden bg-gray-50 dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800">
                            <img 
                              src={comboItem.parentService?.image || activeCategory?.bannerImage || activeCategory?.icon || 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=300'} 
                              alt={comboItem.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          
                          {/* Absolute Add Button centered at the bottom overlap */}
                          <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-[84px] h-[34px] z-10">
                            {addedCount > 0 ? (
                              <div className="w-full h-full bg-violet-50 dark:bg-zinc-800 border border-violet-200 dark:border-zinc-700 rounded-xl text-[#B33A35] font-bold text-xs shadow-md flex items-center justify-between px-2">
                                <button
                                  onClick={handleDecreaseComboItem}
                                  className="w-6 h-6 hover:bg-violet-100 dark:hover:bg-zinc-700 rounded-full flex items-center justify-center text-base"
                                >
                                  -
                                </button>
                                <span className="text-slate-800 dark:text-white font-extrabold">{addedCount}</span>
                                <button
                                  onClick={handleIncreaseComboItem}
                                  className="w-6 h-6 hover:bg-violet-100 dark:hover:bg-zinc-700 rounded-full flex items-center justify-center text-base"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={handleAddComboItem}
                                className="w-full h-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl text-slate-800 dark:text-white font-bold text-xs shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1"
                                style={{ color: '#B33A35' }}
                              >
                                <span>Add</span>
                                <span className="text-xs font-semibold">+</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Services Grouped */}
              {loading ? (
                <div className="space-y-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse space-y-4 py-6">
                      <div className="h-6 w-36 rounded-md bg-gray-200 dark:bg-zinc-800" />
                      <div className="space-y-4">
                        <div className="h-28 rounded-xl bg-gray-100 dark:bg-zinc-900" />
                        <div className="h-28 rounded-xl bg-gray-100 dark:bg-zinc-900" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  {subCategories.map((sub) => {
                    const subId = String(sub.id || sub._id || '');
                    const subServices = groupedServices[subId] || [];
                    if (subServices.length === 0) return null;
                    return (
                      <div key={subId} id={`subcat-sec-${subId}`} className="scroll-mt-24 pb-2">
                        <h3 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white pt-6 pb-4 border-b border-gray-200 dark:border-zinc-800 mb-1">{sub.title}</h3>
                        <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                          {subServices.map((service) => (
                            <div key={service.id} className="py-4">
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
                  {groupedServices['other'] && groupedServices['other'].length > 0 && (
                    <div id="subcat-sec-other" className="scroll-mt-24 pb-2">
                      <h3 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white pt-6 pb-4 border-b border-gray-200 dark:border-zinc-800 mb-1">General Services</h3>
                      <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {groupedServices['other'].map((service) => (
                          <div key={service.id} className="py-4">
                            <ServiceCard
                              key={service.id}
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
                  )}
                </div>
              )}
            </section>

            {/* Sticky Promise & Cart (col-span-4) */}
            <aside 
              className="col-span-4 space-y-6"
              style={{ position: 'sticky', top: '88px', alignSelf: 'start', height: 'fit-content' }}
            >
              {/* Buy More Save More Card */}
              <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <span className="text-xl font-bold">%</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white">Buy more save more</h4>
                  <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-0.5">15% off 2nd item onwards</p>
                </div>
              </div>

              {/* Safety Promise Card */}
              <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider border-b pb-2 dark:border-zinc-800">Doormeets Promise</h4>
                <ul className="space-y-3 text-xs text-gray-600 dark:text-zinc-400 font-bold">
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[10px]">✓</span>
                    <span>Verified Professionals</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[10px]">✓</span>
                    <span>Safe & Certified Chemicals</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[10px]">✓</span>
                    <span>Superior Quality Guarantee</span>
                  </li>
                </ul>
              </div>

              {/* Sticky Cart Summary */}
              <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
                {cartCount > 0 ? (
                  <div className="space-y-4 text-left">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b pb-2 dark:border-zinc-800">Cart</h4>
                    
                    {/* Cart Items List */}
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                      {cartItems.map((item, index) => {
                        const sId = getCartItemServiceId(item);
                        return (
                          <div key={item._id || index} className="flex justify-between items-center gap-2 py-1">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{item.title}</p>
                            </div>
                            
                            {/* Quantity pill selector */}
                            <div className="flex items-center gap-2 border border-violet-200 dark:border-zinc-700 bg-violet-50/50 dark:bg-zinc-800/40 rounded-lg px-2.5 py-0.5 shrink-0">
                              <button 
                                onClick={() => handleDecrease({ id: sId })} 
                                className="text-[#B33A35] font-extrabold text-xs hover:scale-110 active:scale-95"
                              >
                                -
                              </button>
                              <span className="text-slate-800 dark:text-white font-extrabold text-[11px] min-w-[10px] text-center">
                                {item.serviceCount || 1}
                              </span>
                              <button 
                                onClick={() => handleIncrease({ id: sId })} 
                                className="text-[#B33A35] font-extrabold text-xs hover:scale-110 active:scale-95"
                              >
                                +
                              </button>
                            </div>

                            {/* Price */}
                            <div className="text-right shrink-0 min-w-[60px]">
                              <p className="text-xs font-bold text-slate-900 dark:text-white">₹{item.price * (item.serviceCount || 1)}</p>
                              {item.originalPrice && item.originalPrice > item.price && (
                                <p className="text-[10px] text-gray-400 line-through">₹{item.originalPrice * (item.serviceCount || 1)}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Green Savings Banner */}
                    {cartOriginalTotal > cartTotal && (
                      <div className="bg-[#0f766e] text-white text-[11px] font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-sm">
                        <span>🏷️</span>
                        <span>Congratulations! ₹{cartOriginalTotal - cartTotal} saved so far!</span>
                      </div>
                    )}

                    {/* Unified checkout button */}
                    <button
                      onClick={() => navigate('/user/cart')}
                      className="w-full py-3 bg-[#B33A35] hover:bg-[#9E2E2A] text-white font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer text-xs flex items-center justify-between px-4"
                    >
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-extrabold">₹{cartTotal}</span>
                        {cartOriginalTotal > cartTotal && (
                          <span className="text-[10px] text-red-200 line-through">₹{cartOriginalTotal}</span>
                        )}
                      </div>
                      <div className="h-3.5 w-px bg-white/20 mx-2" />
                      <span className="font-extrabold uppercase tracking-wider text-[11px]">View Cart</span>
                    </button>

                  </div>
                ) : (
                  <div className="py-6 space-y-3 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center mx-auto text-gray-400">
                      🛒
                    </div>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 font-bold">No items in your cart</p>
                  </div>
                )}
              </div>
            </aside>
            
          </div>
        </div>
      </main>

      {/* Bottom Checkout / Cart Summary Bar - Mobile */}
      {cartCount > 0 && (
        <div className="lg:hidden">
          <BottomCheckoutBar
            total={cartTotal}
            originalTotal={cartOriginalTotal}
            buttonText="View Cart"
            onClick={() => navigate('/user/cart')}
          />
        </div>
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
            {/* Centered Modal */}
            <motion.div
              key="variant-sheet"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => {
                setShowVariantPopup(false);
                setSelectedServiceForPopup(null);
                setSelectedVariants([]);
              }}
            >
              <div
                className="w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
                style={{
                  backgroundColor: isDark ? '#0A0911' : '#FFFFFF',
                }}
                onClick={(e) => e.stopPropagation()}
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
              </div>
            </motion.div>
          </>
        )}

        {/* Customize Combo Package Modal */}
        {showComboEditModal && generatedPackages.length > 0 && (
          <>
            {/* Backdrop */}
            <motion.div
              key="combo-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowComboEditModal(false)}
            />
            {/* Centered Modal */}
            <motion.div
              key="combo-sheet"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setShowComboEditModal(false)}
            >
              <div 
                className="w-full max-w-md rounded-[32px] p-6 shadow-2xl space-y-6 relative overflow-hidden"
                style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)' }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex justify-between items-center pb-2">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Customize Combo Package
                    </h3>
                    <p className="text-[10px] text-gray-500 dark:text-zinc-400 mt-0.5">
                      Select or deselect items to include in your combo bundle
                    </p>
                  </div>
                  <button
                    onClick={() => setShowComboEditModal(false)}
                    className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-400 dark:text-zinc-500"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                {/* Services List inside Combo */}
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {generatedPackages[0].services.map((s) => {
                    const isInCart = (quantities[s.id || s._id] || 0) > 0;
                    const totalPrice = generatedPackages[0].originalPrice;
                    const bundlePrice = generatedPackages[0].price;
                    const multiplier = totalPrice > 0 ? (bundlePrice / totalPrice) : 0.85;

                    return (
                      <div 
                        key={s.id || s._id} 
                        className="flex justify-between items-center p-3 rounded-2xl border transition-all"
                        style={{
                          backgroundColor: isInCart ? 'rgba(16,185,129,0.02)' : 'transparent',
                          borderColor: isInCart ? 'rgba(16,185,129,0.15)' : 'var(--border)'
                        }}
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{s.title}</p>
                          <p className="text-[10px] text-gray-500 truncate">{s.description}</p>
                        </div>
                        
                        {/* Toggle button */}
                        <button
                          onClick={async () => {
                            const item = cartItems.find((entry) => getCartItemServiceId(entry) === (s.id || s._id));
                            if (item) {
                              await removeItem(item._id || item.id);
                              toast.success(`Removed ${s.title} from bundle`);
                            } else {
                              await handleAdd(s, multiplier);
                            }
                          }}
                          className={`text-[10px] font-extrabold px-3 py-1.5 rounded-xl border transition-all ${
                            isInCart
                              ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                              : 'border-slate-200 text-slate-700 dark:text-zinc-300 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800'
                          }`}
                        >
                          {isInCart ? 'Included ✓' : 'Add to bundle'}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Footer buttons */}
                <button
                  type="button"
                  onClick={() => setShowComboEditModal(false)}
                  className="w-full py-3.5 rounded-2xl font-bold text-white text-xs shadow-lg transition-transform hover:scale-[1.01]"
                  style={{ backgroundColor: '#B33A35' }}
                >
                  Done Customize
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
