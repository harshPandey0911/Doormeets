import React, { useState, useEffect, useLayoutEffect, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { themeColors } from '../../../../theme';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import SearchBar from './components/SearchBar';
import ServiceCategories from './components/ServiceCategories';
import { publicCatalogService } from '../../../../services/catalogService';
import { bookingService } from '../../../../services/bookingService';
import { useCart } from '../../../../context/CartContext';
import { useCity } from '../../../../context/CityContext';
import { toast } from 'react-hot-toast';
import { registerFCMToken } from '../../../../services/pushNotificationService';
import { motion } from 'framer-motion';
import CategoryModal from './components/CategoryModal';
import SearchOverlay from './components/SearchOverlay';
import OfferBannerSlider from './components/OfferBannerSlider';
import GroupCategoryBottomSheet from './components/GroupCategoryBottomSheet';
import ServiceSectionWithRating from './components/ServiceSectionWithRating';

// Lazy load heavy components for better initial load performance
import PromoCarousel from './components/PromoCarousel';
// Lazy load OTHER heavy components
const NewAndNoteworthy = lazy(() => import('./components/NewAndNoteworthy'));
const MostBookedServices = lazy(() => import('./components/MostBookedServices'));
const CuratedServices = lazy(() => import('./components/CuratedServices'));
const Banner = lazy(() => import('./components/Banner'));
const ReferEarnSection = lazy(() => import('./components/ReferEarnSection'));
const CTABanner = lazy(() => import('./components/CTABanner'));
const TrustSection = lazy(() => import('./components/TrustSection'));
import userBannerService from '../../../../services/userBannerService';
import LogoLoader from '../../../../components/common/LogoLoader';
import AddressSelectionModal from '../Checkout/components/AddressSelectionModal';
import ScrapPromotionCard from './components/ScrapPromotionCard';
import FeaturedSection from '../../components/premium/FeaturedSection';
import PromoTicker from './components/PromoTicker';
import promoService from '../../../../services/promoService';
import QuoteApproval from '../PaintingConsultation/QuoteApproval';
import { getMyConsultations } from '../../services/paintingConsultationService';




const toAssetUrl = (url) => {
  if (!url) return '';
  const clean = url.replace('/api/upload', '/upload');
  if (clean.startsWith('http')) return clean;
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/api$/, '');
  return `${base}${clean.startsWith('/') ? '' : '/'}${clean}`;
};

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [address, setAddress] = useState(localStorage.getItem('currentAddress') || 'Select Location');
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [houseNumber, setHouseNumber] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLocationSupported, setIsLocationSupported] = useState(true);
  const [detectedCityName, setDetectedCityName] = useState(localStorage.getItem('currentCity') || null);


  const { cartCount, addToCart } = useCart();
  const { currentCity, cities, selectCity, loading: cityLoading } = useCity();

  // Clean up legacy storage keys on mount
  useEffect(() => {
    ['userAddress', 'detectedCity', 'user_formatted_address', 'user_city'].forEach(key => localStorage.removeItem(key));
  }, []);

  const [pendingQuotes, setPendingQuotes] = useState([]);
  const [fetchingQuotes, setFetchingQuotes] = useState(true);

  const fetchPendingQuotes = async () => {
    try {
      const response = await getMyConsultations();
      if (response.success && response.data) {
        const quotes = response.data.filter(c => c.status === 'QUOTE_GENERATED');
        setPendingQuotes(quotes);
      }
    } catch (err) {
      console.error('Error fetching pending quotes on home:', err);
    } finally {
      setFetchingQuotes(false);
    }
  };

  useEffect(() => {
    fetchPendingQuotes();
  }, []);

  // Sync detectedCityName with Address on mount/update if not already set
  useEffect(() => {
    if (address && address !== 'Select Location' && cities && cities.length > 0) {
      const foundCity = cities.find(c =>
        address.toLowerCase().includes(c.name.toLowerCase())
      );
      if (foundCity) {
        if (detectedCityName !== foundCity.name) {
          setDetectedCityName(foundCity.name);
          localStorage.setItem('currentCity', foundCity.name);
        }
      } else {
        // Address is present but doesn't contain any supported city name
        // Try to parse ANY city from the address string (e.g. "Bhopal")
        const parts = address.split(',').map(p => p.trim());
        // Usually city is 2nd or 3rd to last in Google address strings
        const cityCandidate = parts.length > 2 ? parts[parts.length - 3] : (parts.length > 1 ? parts[parts.length - 2] : parts[0]);

        if (detectedCityName !== cityCandidate) {
          setDetectedCityName(cityCandidate);
          localStorage.setItem('currentCity', cityCandidate);
        }
        setIsLocationSupported(false);
      }
    }
  }, [address, cities, detectedCityName]);

  // Validate city whenever detected name or cities list changes
  useEffect(() => {
    if (!detectedCityName || !cities || cities.length === 0) return;

    const matchedCity = cities.find(c =>
      c.name.toLowerCase() === detectedCityName.toLowerCase() ||
      c.name.toLowerCase().includes(detectedCityName.toLowerCase()) ||
      detectedCityName.toLowerCase().includes(c.name.toLowerCase())
    );

    if (matchedCity) {
      setIsLocationSupported(true);
      const matchedId = matchedCity._id || matchedCity.id;
      const currentId = currentCity?._id || currentCity?.id;

      if (!cityLoading && currentId && matchedId !== currentId) {
        selectCity(matchedCity);
        toast.success(`Location updated to ${matchedCity.name}`);
      }
    } else {
      setIsLocationSupported(false);
      if (currentCity) selectCity(null);
    }
  }, [detectedCityName, cities, currentCity, cityLoading]);


  const handleAddressSave = (savedHouseNumber, locationObj) => {
    if (locationObj) {
      const newAddress = locationObj.address;
      setAddress(newAddress);
      localStorage.setItem('currentAddress', newAddress);
      
      if (locationObj.lat && locationObj.lng) {
        localStorage.setItem('user_lat', locationObj.lat);
        localStorage.setItem('user_lng', locationObj.lng);
      }

      // Try to parse city from location object (Google Places)
      const components = locationObj.components || locationObj.address_components;
      let city = '';
      if (components) {
        const getComponent = (type) => components.find(c => c.types.includes(type))?.long_name || '';
        city = getComponent('locality') || getComponent('administrative_area_level_2');
      }

      // Fallback city parsing from address string if components failed
      if (!city && newAddress) {
        const parts = newAddress.split(',').map(p => p.trim());
        city = parts.length > 2 ? parts[parts.length - 3] : (parts.length > 1 ? parts[parts.length - 2] : parts[0]);
      }

      if (city) {
        setDetectedCityName(city);
        localStorage.setItem('currentCity', city);

        // Immediate update of selected city if supported
        if (cities && cities.length > 0) {
          const matchedCity = cities.find(c =>
            c.name.toLowerCase() === city.toLowerCase() ||
            c.name.toLowerCase().includes(city.toLowerCase()) ||
            city.toLowerCase().includes(c.name.toLowerCase())
          );
          if (matchedCity) {
            selectCity(matchedCity);
          } else {
            selectCity(null);
          }
        }

        toast.success(`Location set to ${city}`);
      }
    }
    setHouseNumber(savedHouseNumber);
    setIsAddressModalOpen(false);
  };

  // Auto-detect location on mount
  useEffect(() => {
    const autoDetectLocation = async () => {
      if (navigator.geolocation) {
        if (address === 'Select Location') {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                const { latitude, longitude } = position.coords;
                const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
                const response = await fetch(
                  `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
                );
                const data = await response.json();

                if (data.status === 'OK' && data.results.length > 0) {
                  const result = data.results[0];
                  const getComponent = (type) =>
                    result.address_components.find(c => c.types.includes(type))?.long_name || '';

                  const area = getComponent('sublocality_level_1') || getComponent('neighborhood') || getComponent('locality');
                  const city = getComponent('locality') || getComponent('administrative_area_level_2');
                  const state = getComponent('administrative_area_level_1');

                  const formattedAddress = `${area}, ${city}, ${state}`;
                  setAddress(formattedAddress);
                  localStorage.setItem('currentAddress', formattedAddress);
                  localStorage.setItem('user_lat', latitude);
                  localStorage.setItem('user_lng', longitude);

                  if (city) {
                    setDetectedCityName(city);
                    localStorage.setItem('currentCity', city);

                    // Immediate update of selected city if supported
                    if (cities && cities.length > 0) {
                      const matchedCity = cities.find(c =>
                        c.name.toLowerCase() === city.toLowerCase() ||
                        c.name.toLowerCase().includes(city.toLowerCase()) ||
                        city.toLowerCase().includes(c.name.toLowerCase())
                      );
                      if (matchedCity) {
                        selectCity(matchedCity);
                      } else {
                        selectCity(null);
                      }
                    }
                  }
                }
              } catch (error) {
                // Silent fail
              }
            },
            (error) => {
              console.log("GPS Error:", error);
            },
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            }
          );
        }
      }
    };

    autoDetectLocation();

    // Register FCM token for user to receive push notifications
    registerFCMToken('user', true).catch(err => {/* Silent fail */ });
  }, []);

  const [categories, setCategories] = useState([]);
  const [productBrands, setProductBrands] = useState([]); // New state for direct product listing
  const [homeContent, setHomeContent] = useState(null);
  const [offerBanners, setOfferBanners] = useState([]);
  const [activePromos, setActivePromos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Handle scroll separately (only when needed)
  useEffect(() => {
    if (location.state?.scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.state?.scrollToTop, location.pathname]);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [comingSoonCategory, setComingSoonCategory] = useState(null);
  const [groupCategorySheet, setGroupCategorySheet] = useState({ open: false, category: null });
  const [currentStackIndex, setCurrentStackIndex] = useState(0);
  const [pastServices, setPastServices] = useState([]);
  const [pastServicesLoading, setPastServicesLoading] = useState(false);

  const upcomingCategories = categories.filter(c => c.status === 'coming_soon');

  // Reset currentStackIndex if it goes out of bounds when categories change
  useEffect(() => {
    if (currentStackIndex >= upcomingCategories.length) {
      setCurrentStackIndex(0);
    }
  }, [upcomingCategories.length, currentStackIndex]);

  // Fetch categories and home content on mount (and when city changes)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const cityId = currentCity?._id || currentCity?.id;

        const response = await publicCatalogService.getHomeData(cityId);

        if (response.success) {
          if (response.categories) {
            const mappedCategories = response.categories.map(cat => ({
              id: cat.id,
              title: cat.title,
              slug: cat.slug,
              icon: toAssetUrl(cat.icon),
              hasSaleBadge: cat.hasSaleBadge,
              badge: cat.badge,
              categoryType: cat.categoryType || 'service',
              status: cat.status || 'active',
              interestedCount: cat.interestedCount || 0,
              isInterested: cat.isInterested || false,
              isGroupCategory: cat.isGroupCategory || false,
              mappedCategories: (cat.mappedCategories || []).map(mc => ({
                id: mc.id,
                title: mc.title,
                slug: mc.slug,
                icon: toAssetUrl(mc.icon)
              }))
            }));
            setCategories(mappedCategories);
          }

          if (response.homeContent) {
            setHomeContent(response.homeContent);
          }
        }

        // Fetch all product brands directly to show on home
        const brandsRes = await publicCatalogService.getBrands({ cityId });
        if (brandsRes.success) {
          const products = brandsRes.brands.filter(b => b.type === 'product');
          setProductBrands(products);
        }

        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    const fetchBanners = async () => {
      try {
        const response = await userBannerService.getActiveBanners();
        if (response.success) {
          setOfferBanners(response.data);
        }
      } catch (error) {
        console.error('Error fetching banners:', error);
      }
    };

    const fetchPromos = async () => {
      try {
        const response = await promoService.getActivePromos();
        if (response.success && Array.isArray(response.data)) {
          setActivePromos(response.data);
        }
      } catch (error) {
        console.error('Error fetching active promos:', error);
      }
    };

    fetchData();
    fetchBanners();
    fetchPromos();
  }, [currentCity]);
  // Fetch user bookings for "Order Again" section (highly optimized)
  useEffect(() => {
    const fetchPastOrders = async () => {
      try {
        const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
        if (!token) return;
        setPastServicesLoading(true);
        const res = await bookingService.getPastServices();
        if (res.success && Array.isArray(res.data)) {
          const mapped = res.data.map(item => ({
            ...item,
            image: toAssetUrl(item.image)
          }));
          setPastServices(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch past services for Order Again:", err);
      } finally {
        setPastServicesLoading(false);
      }
    };

    fetchPastOrders();
  }, []);

  // Open category modal from navigation state (e.g. from Cart 'Add Services')
  useEffect(() => {
    if (!loading && categories.length > 0 && (location.state?.openCategoryId || location.state?.openCategoryName)) {
      const targetId = location.state.openCategoryId;
      const targetName = location.state.openCategoryName;

      const cat = categories.find(c =>
        (targetId && (c.id === targetId || c._id === targetId)) ||
        (targetName && c.title === targetName)
      );

      if (cat) {
        handleCategoryClick(cat);
        // Clear state to prevent reopening on subsequent renders/refreshes
        window.history.replaceState({}, '', location.pathname);
      }
    }
  }, [loading, categories, location.state]);

  const handleSearch = (query) => {
    // Navigate to search results page
  };

  const handleCategoryClick = (category) => {
    if (!category) return;
    if (category.status === 'coming_soon') {
      setComingSoonCategory(category);
      return;
    }
    // If this is a group category, open the bottom sheet instead of navigating
    if (category.isGroupCategory && Array.isArray(category.mappedCategories) && category.mappedCategories.length > 0) {
      setGroupCategorySheet({ open: true, category });
      return;
    }
    const isPainting = category.slug === 'painting' || (category.title && category.title.toLowerCase() === 'painting');
    if (isPainting) {
      navigate('/user/painting');
      return;
    }
    navigate(`/user/category/${category.slug || category.id}`, { state: { category } });
  };

  const handlePromoClick = (promo) => {
    if (promo.targetCategoryId) {
      const cat = categories.find(c => (c.id === promo.targetCategoryId || c._id === promo.targetCategoryId));
      if (cat) {
        handleCategoryClick(cat);
        return;
      }
    }
    if (promo.route && !promo.slug) {
      if (promo.scrollToSection) {
        navigate(promo.route, {
          state: { scrollToSection: promo.scrollToSection }
        });
      } else {
        navigate(promo.route);
      }
    }
  };

  const handleServiceClick = (service) => {
    if (!service) return;
    if (service.targetCategoryId) {
      const cat = categories.find(c => (c.id === service.targetCategoryId || c._id === service.targetCategoryId));
      if (cat) {
        handleCategoryClick(cat);
        return;
      }
    }
    // Fallback if no targetCategoryId but has slug/title, we no longer navigate to slug
  };

  const handleAddClick = async (service) => {
    try {
      if (service.targetCategoryId) {
        const cat = categories.find(c => c.id === service.targetCategoryId);
        if (cat) {
          handleCategoryClick(cat);
          return;
        }
      }

      if (service.serviceId && service.categoryId) {
        const cartItemData = {
          serviceId: service.serviceId,
          categoryId: service.categoryId,
          title: service.title,
          description: service.subtitle || service.description || '',
          icon: service.image || '',
          category: service.category || 'Service',
          price: parseInt(service.price?.toString().replace(/,/g, '') || 0),
          originalPrice: service.originalPrice ? parseInt(service.originalPrice.toString().replace(/,/g, '')) : null,
          unitPrice: parseInt(service.price?.toString().replace(/,/g, '') || 0),
          serviceCount: 1,
          rating: service.rating || "4.8",
          reviews: service.reviews || "10k+",
          vendorId: service.vendorId || null,
          sectionId: service.sectionId || null // VITAL: Added for plan benefits
        };

        const response = await addToCart(cartItemData);
        if (response.success) {
          toast.success(`${service.title} added to cart!`);
          navigate('/user/cart');
        } else {
          toast.error(response.message || 'Failed to add to cart');
        }
      } else {
        if (service.targetCategoryId) {
          const cat = categories.find(c => (c.id === service.targetCategoryId || c._id === service.targetCategoryId));
          if (cat) {
            handleCategoryClick(cat);
          } else {
            toast.error('Unable to add this service to cart.');
          }
        } else {
          toast.error('Unable to add this service to cart.');
        }
      }
    } catch (error) {
      toast.error('Failed to add to cart. Please try again.');
    }
  };

  const handleReferClick = () => {
    navigate('/user/rewards');
  };

  const handleLocationClick = () => {
    setIsAddressModalOpen(true);
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  if (loading) {
    return <LogoLoader />;
  }

  return (
  <div className="min-h-screen pb-20 relative" style={{ backgroundColor: 'var(--background)' }}>
      {/* Group Category Bottom Sheet */}
      <GroupCategoryBottomSheet
        isOpen={groupCategorySheet.open}
        onClose={() => setGroupCategorySheet({ open: false, category: null })}
        category={groupCategorySheet.category}
        onCategoryClick={(childCat) => handleCategoryClick(childCat)}
      />
      {/* Refined Premium Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0"
          style={{
            background: 'var(--background)'
          }}
        />
        {/* Elegant Dot Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `radial-gradient(${themeColors?.brand?.teal || '#B33A35'} 0.8px, transparent 0.8px)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      <motion.div
        className="relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div
          variants={itemVariants}
          className="backdrop-blur-xl fixed top-0 left-0 right-0 z-50 border-b shadow-[0_1px_0px_rgba(255,255,255,0.04)] transition-all duration-300 w-full"
          style={{ backgroundColor: 'var(--background)', borderBottomColor: 'var(--border)' }}
        >
          <Header
            location={address}
            onLocationClick={handleLocationClick}
            onSearchClick={() => setIsSearchOpen(true)}
          />
        </motion.div>
 
        <main className="pt-[88px] md:pt-[100px] space-y-5 md:space-y-8 pb-24 max-w-[1600px] mx-auto w-full px-0 md:px-12">
          {!isLocationSupported ? (
            <div className="flex flex-col items-center justify-center pt-20 pb-10 px-6 text-center min-h-[60vh]">
              <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Not service available in your city
              </h2>
              <p className="text-gray-500 max-w-xs mx-auto mb-8 font-medium">
                Please fast! We are coming soon.
              </p>
              <button
                onClick={() => setIsAddressModalOpen(true)}
                className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold shadow-md hover:bg-primary-700 transition-all font-bold"
                style={{ backgroundColor: '#2874f0' }}
              >
                Change Location
              </button>
            </div>
          ) : (
            <>
              {/* Sliding Offer Banners */}
              {!isSearchOpen && (
                <OfferBannerSlider 
                  banners={homeContent?.banners && homeContent.banners.length > 0 
                    ? homeContent.banners.map(b => ({
                        ...b,
                        imageUrl: toAssetUrl(b.imageUrl),
                        link: b.link || b.slug || ''
                      }))
                    : offerBanners
                  } 
                />
              )}
 
              {/* Search Bar Section */}
              <div className="mt-5 px-3 md:px-5 max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto w-full flex md:hidden items-center">
                <div className="w-full">
                  <SearchBar onInputClick={() => setIsSearchOpen(true)} />
                </div>
              </div>

              {/* Painting Quote Approval Section */}
              {pendingQuotes.length > 0 && (
                <motion.div variants={itemVariants} className="px-3 md:px-5 max-w-lg lg:max-w-2xl mx-auto w-full mt-4">
                  <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-ping" />
                    🎨 Painting Quotes Awaiting Your Approval
                  </h3>
                  {pendingQuotes.map(consultation => (
                    <QuoteApproval
                      key={consultation._id}
                      consultation={consultation}
                      onActionComplete={fetchPendingQuotes}
                    />
                  ))}
                </motion.div>
              )}

              {/* Hero Section - Promo Carousel */}
              {homeContent?.isPromosVisible !== false && (
                <motion.section variants={itemVariants} className="relative z-0">
                  <PromoCarousel
                    promos={(homeContent?.promos || []).sort((a, b) => (a.order || 0) - (b.order || 0)).map(promo => ({
                      id: promo.id || promo._id,
                      title: promo.title || '',
                      subtitle: promo.subtitle || promo.description || '',
                      buttonText: promo.buttonText || 'Book now',
                      className: promo.gradientClass || 'from-[#00A6A6] to-[#008a8a]',
                      image: toAssetUrl(promo.imageUrl),
                      targetCategoryId: promo.targetCategoryId,
                      slug: promo.slug,
                      scrollToSection: promo.scrollToSection,
                      route: '/'
                    }))}
                    onPromoClick={handlePromoClick}
                  />
                </motion.section>
              )}

              {/* Trust Section */}
              {homeContent?.trustItems && homeContent.trustItems.length > 0 && (
                <motion.section variants={itemVariants}>
                  <Suspense fallback={<div className="h-10 bg-gray-50 animate-pulse rounded-xl mx-4 my-2" />}>
                    <TrustSection items={homeContent.trustItems} />
                  </Suspense>
                </motion.section>
              )}

              {/* Categories Section */}
              {homeContent?.isCategoriesVisible !== false && (
                <>
                  {/* Service Categories */}
                  <motion.section 
                    variants={itemVariants} 
                    className="relative overflow-hidden py-2"
                    style={{ backgroundColor: 'var(--background)' }}
                  >
                    <ServiceCategories
                      categories={categories.filter(c => c.isGroupCategory && c.categoryType === 'service' && c.status !== 'coming_soon')}
                      onCategoryClick={handleCategoryClick}
                      title="Categories"
                      subtitle="Premium Home Services"
                    />
                  </motion.section>
 
                  {/* Products & Materials Section */}
                  {categories.some(c => c.isGroupCategory && c.categoryType === 'product') && (
                    <motion.section 
                      variants={itemVariants} 
                      className="relative overflow-hidden py-2"
                      style={{ backgroundColor: 'var(--background)' }}
                    >
                      <ServiceCategories
                        categories={categories.filter(c => c.isGroupCategory && c.categoryType === 'product' && c.status !== 'coming_soon')}
                        onCategoryClick={handleCategoryClick}
                        title="Products & Materials"
                        subtitle="Quality building materials"
                      />
                    </motion.section>
                  )}
 
                </>
              )}

              {/* Popular Services Section */}
              {homeContent?.isPopularServicesVisible !== false && 
               Array.isArray(homeContent?.popularServices) && 
               homeContent.popularServices.length > 0 && (
                <motion.div variants={itemVariants}>
                  <ServiceSectionWithRating
                    title="Popular services"
                    subtitle="Most demanded home services"
                    compact={true}
                    services={homeContent.popularServices.map((service, index) => ({
                      id: service.id || service._id || index,
                      serviceId: service.serviceId || service.id || service._id,
                      categoryId: service.categoryId,
                      title: service.title,
                      rating: service.rating || "4.5",
                      reviews: service.reviews || "1.2k reviews",
                      price: service.price,
                      originalPrice: service.originalPrice,
                      discount: service.discount,
                      image: toAssetUrl(service.image),
                      slug: service.slug
                    }))}
                    onSeeAllClick={() => navigate('/user/categories')}
                    onServiceClick={(service) => {
                      if (service.categoryId) {
                        const cat = categories.find(c => c.id === service.categoryId);
                        if (cat) handleCategoryClick(cat);
                      } else {
                        navigate('/user/categories');
                      }
                    }}
                    onAddClick={handleAddClick}
                  />
                </motion.div>
              )}

              {/* Upcoming Categories Section (Replacing Smart Protect Blue Banner) */}
              {upcomingCategories.length > 0 && (() => {
                const activeCat = upcomingCategories[currentStackIndex] || upcomingCategories[0];
                return (
                  <motion.section variants={itemVariants} className="px-3 md:px-5 space-y-4 max-w-lg md:max-w-2xl lg:max-w-screen-xl mx-auto w-full">
                    <div className="flex items-center justify-between">
                      <h2
                        className="text-[17px] font-semibold tracking-tight"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Upcoming Services
                      </h2>
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full animate-pulse"
                        style={{ color: 'var(--primary)', backgroundColor: 'rgba(179,58,53,0.12)' }}
                      >
                        {upcomingCategories.length} Coming Soon
                      </span>
                    </div>

                    {/* Staggered Card Stack Container */}
                    <div className="relative pt-2">
                      
                      {/* Inner Stack Wrapper to align layers with the main card bottom */}
                      <div className="relative z-10">
                        {/* Third Layer Card (Deepest) */}
                        {upcomingCategories.length > 2 && (
                          <div className="absolute left-5 right-5 bottom-0 h-full bg-[#B33A35]/25 rounded-[24px] shadow-sm transform translate-y-3 z-0 pointer-events-none border border-white/5" />
                        )}
                        
                        {/* Second Layer Card (Middle) */}
                        {upcomingCategories.length > 1 && (
                          <div className="absolute left-2.5 right-2.5 bottom-0 h-full bg-[#B33A35]/50 rounded-[24px] shadow-md transform translate-y-1.5 z-10 pointer-events-none border border-white/10" />
                        )}

                        {/* Main Card (Top) */}
                        <div 
                          onClick={() => {
                            // Cycle on click
                            if (upcomingCategories.length > 1) {
                              setCurrentStackIndex((prev) => (prev + 1) % upcomingCategories.length);
                            } else {
                              handleCategoryClick(activeCat);
                            }
                          }}
                          className="w-full bg-gradient-to-r from-[#B33A35] to-[#9E2E2A] rounded-[24px] p-5 relative overflow-hidden shadow-[0_12px_28px_rgba(255,159,69,0.22)] border border-white/20 active:scale-[0.98] hover:scale-[1.01] transition-all duration-300 cursor-pointer z-20"
                        >
                          {/* Smooth glassmorphism-inspired highlights */}
                          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-white/30 to-transparent pointer-events-none" />
                          <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-[0.5px] pointer-events-none" />

                          {/* Diagonal glow shine */}
                          <div className="absolute -inset-y-12 -left-16 w-32 bg-white/10 blur-xl transform rotate-12 pointer-events-none" />

                          <div className="relative z-10 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-4">
                              {/* White Circle Container for Icon */}
                              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.06)] overflow-hidden shrink-0 border border-white/50">
                                {activeCat.icon ? (
                                  <img 
                                    src={activeCat.icon} 
                                    alt={activeCat.title} 
                                    className="w-9 h-9 object-contain"
                                  />
                                ) : (
                                  <div className="w-9 h-9 flex items-center justify-center bg-orange-50 rounded-full">
                                    <svg className="w-5 h-5 text-[#B33A35]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-0.5">
                                <h3 className="text-lg font-extrabold text-white tracking-tight leading-tight">
                                  {activeCat.title}
                                </h3>
                                <p className="text-orange-50 text-[11px] font-semibold opacity-90 leading-tight">
                                  Launching soon in {currentCity?.name || 'Indore'}
                                </p>
                              </div>
                            </div>

                            {/* Notify / Bell Button */}
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                handleCategoryClick(activeCat);
                              }}
                              className={`shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                                activeCat.isInterested
                                  ? 'bg-white text-green-500 shadow-md'
                                  : 'bg-white/25 hover:bg-white/35 text-white active:scale-95'
                              }`}
                            >
                              {activeCat.isInterested ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                              )}
                            </button>
                          </div>

                          {/* Lighter sub-bar inside the card */}
                          <div className="bg-black/10 rounded-[18px] p-3.5 mt-4 flex items-center justify-between text-white text-[11px] font-bold tracking-tight">
                            <div className="flex items-center gap-1.5 opacity-95">
                              <svg className="w-3.5 h-3.5 text-orange-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>Status: COMING SOON</span>
                            </div>
                            <div className="flex items-center gap-1.5 opacity-95">
                              <svg className="w-3.5 h-3.5 text-orange-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                              <span>{activeCat.interestedCount || 0} Interested</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Small Indicator Dots for Stack */}
                      {upcomingCategories.length > 1 && (
                        <div className="flex justify-center gap-1.5 mt-4 relative z-20">
                          {upcomingCategories.map((_, dotIdx) => (
                            <button
                              key={dotIdx}
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentStackIndex(dotIdx);
                              }}
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                currentStackIndex === dotIdx ? 'w-5 bg-[#B33A35]' : 'w-1.5 bg-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.section>
                );
              })()}

              {/* Order Again Section */}
              {!pastServicesLoading && pastServices.length > 0 && (
                <motion.section variants={itemVariants} className="px-3 md:px-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2
                      className="text-[17px] font-semibold tracking-tight"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Order again
                    </h2>
                    <button
                      onClick={() => navigate('/user/bookings')}
                      className="text-xs font-bold transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      see all
                    </button>
                  </div>

                  {/* Horizontal Scroll list of past services */}
                  <div 
                    className="flex gap-4 overflow-x-auto pb-3 -mx-3 px-3 md:-mx-5 md:px-5 no-scrollbar"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {pastServices.map((service, index) => {
                      return (
                        <div
                          key={service.id || index}
                          onClick={() => handleAddClick(service)}
                          className="flex-shrink-0 rounded-3xl p-5 lg:p-6 flex items-center justify-between w-[285px] lg:w-[340px] active:scale-[0.98] transition-all duration-300 cursor-pointer relative overflow-hidden"
                          style={{
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--border)',
                            boxShadow: 'var(--shadow)',
                          }}
                        >
                          {/* Inner Content (Left Side) */}
                          <div className="flex-1 min-w-0 pr-3 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3
                                className="text-xs lg:text-sm font-extrabold truncate leading-tight"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {service.title}
                              </h3>
                              <span
                                className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5"
                                style={{ color: 'var(--primary)', backgroundColor: 'rgba(179,58,53,0.12)' }}
                              >
                                ★ {service.rating}
                              </span>
                            </div>

                            <p className="text-[10px] lg:text-xs font-semibold truncate" style={{ color: 'var(--text-muted)' }}>
                              by {service.vendorName}
                            </p>

                            <div className="flex items-baseline gap-1.5 pt-1">
                              <span className="text-sm lg:text-base font-extrabold" style={{ color: 'var(--primary)' }}>
                                ₹{(service.price || 0).toLocaleString('en-IN')}
                              </span>
                              {service.originalPrice && service.originalPrice > service.price && (
                                <>
                                  <span className="text-[10px] line-through" style={{ color: 'var(--text-muted)' }}>
                                    ₹{service.originalPrice.toLocaleString('en-IN')}
                                  </span>
                                  <span className="text-[9px] font-extrabold text-green-500">
                                    {Math.round(((service.originalPrice - service.price) / service.originalPrice) * 100)}% off
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Service Icon/Visual (Right Side) */}
                          <div
                            className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden"
                            style={{ backgroundColor: 'rgba(179,58,53,0.08)', border: '1px solid rgba(179,58,53,0.12)' }}
                          >
                            {service.image ? (
                              <img
                                src={service.image}
                                alt={service.title}
                                className="w-12 h-12 lg:w-14 lg:h-14 object-contain"
                                loading="lazy"
                              />
                            ) : (
                              <svg className="w-8 h-8 lg:w-10 lg:h-10" style={{ color: 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.section>
              )}
              {/* ─── Featured Sections (Admin Curated) ─── */}
              {homeContent?.isFeaturedSectionsVisible !== false &&
                Array.isArray(homeContent?.featuredSections) &&
                homeContent.featuredSections.length > 0 &&
                homeContent.featuredSections
                  .filter(section => Array.isArray(section.items) && section.items.length > 0)
                  .map((section, idx) => (
                    <motion.div key={idx} variants={itemVariants}>
                      <FeaturedSection section={section} />
                    </motion.div>
                  ))
              }

              {/* Curated Services */}
              {homeContent?.isCuratedVisible !== false && (
                <motion.div variants={itemVariants}>
                  <Suspense fallback={<div className="h-40 bg-gray-50 animate-pulse rounded-xl mx-4" />}>
                    <CuratedServices
                      title={homeContent?.sectionHeaders?.curatedTitle}
                      subtitle={homeContent?.sectionHeaders?.curatedSubtitle}
                      services={(homeContent?.curated || []).sort((a, b) => (a.order || 0) - (b.order || 0)).map(item => ({
                        id: item.id || item._id,
                        title: item.title,
                        gif: toAssetUrl(item.gifUrl),
                        slug: item.slug,
                        targetCategoryId: item.targetCategoryId
                      }))}
                      onServiceClick={handleServiceClick}
                    />
                  </Suspense>
                </motion.div>
              )}

              {/* New & Noteworthy */}
              {homeContent?.isNoteworthyVisible !== false && (
                <motion.div variants={itemVariants}>
                  <Suspense fallback={<div className="h-40 bg-gray-50 animate-pulse rounded-xl mx-4" />}>
                    <NewAndNoteworthy
                      title={homeContent?.sectionHeaders?.noteworthyTitle}
                      services={(homeContent?.noteworthy || []).sort((a, b) => (a.order || 0) - (b.order || 0)).map(item => ({
                        id: item.id || item._id,
                        title: item.title,
                        image: toAssetUrl(item.imageUrl),
                        slug: item.slug,
                        targetCategoryId: item.targetCategoryId
                      }))}
                      onServiceClick={handleServiceClick}
                    />
                  </Suspense>
                </motion.div>
              )}

              {/* Most Booked */}
              {homeContent?.isBookedVisible !== false && (
                <motion.div variants={itemVariants}>
                  <Suspense fallback={<div className="h-40 bg-gray-50 animate-pulse rounded-xl mx-4" />}>
                    <MostBookedServices
                      title={homeContent?.sectionHeaders?.bookedTitle}
                      services={(homeContent?.booked || []).sort((a, b) => (a.order || 0) - (b.order || 0)).map(item => ({
                        id: item.id || item._id,
                        title: item.title,
                        rating: item.rating,
                        reviews: item.reviews,
                        price: item.price,
                        originalPrice: item.originalPrice,
                        discount: item.discount,
                        image: toAssetUrl(item.imageUrl),
                        targetCategoryId: item.targetCategoryId,
                        slug: item.slug
                      }))}
                      onServiceClick={handleServiceClick}
                      onAddClick={handleAddClick}
                    />
                  </Suspense>
                </motion.div>
              )}

              {/* CTA Banner */}
              {homeContent?.ctaBanner && homeContent.ctaBanner.title && (
                <motion.div variants={itemVariants}>
                  <Suspense fallback={<div className="h-32 bg-gray-50 animate-pulse rounded-xl mx-4 my-2" />}>
                    <CTABanner 
                      ctaBanner={homeContent.ctaBanner} 
                      onNavigate={(nav) => {
                        if (nav.targetCategoryId) {
                          const cat = categories.find(c => c.id === nav.targetCategoryId || c._id === nav.targetCategoryId);
                          if (cat) handleCategoryClick(cat);
                        } else if (nav.slug) {
                          navigate(`/${nav.slug}`);
                        }
                      }} 
                    />
                  </Suspense>
                </motion.div>
              )}

              {/* Dynamic Sections */}
              {homeContent?.isCategorySectionsVisible !== false && (homeContent?.categorySections || []).sort((a, b) => (a.order || 0) - (b.order || 0)).map((section, sIdx) => (
                <motion.div key={section._id || sIdx} variants={itemVariants}>
                  <Suspense fallback={<div className="h-40 bg-gray-50 animate-pulse rounded-xl mx-4" />}>
                    <ServiceSectionWithRating
                      title={section.title}
                      subtitle={section.subtitle}
                      services={section.cards?.map((card, cIdx) => {
                        const processedImage = toAssetUrl(card.imageUrl);
                        return {
                          id: card._id || cIdx,
                          title: card.title,
                          rating: card.rating || "4.8",
                          reviews: card.reviews || "10k+",
                          price: card.price,
                          originalPrice: card.originalPrice,
                          discount: card.discount,
                          image: processedImage,
                          targetCategoryId: card.targetCategoryId,
                          slug: card.slug
                        };
                      }) || []}
                      onSeeAllClick={() => {
                        if (section.seeAllTargetCategoryId) {
                          const cat = categories.find(c => (c.id === section.seeAllTargetCategoryId || c._id === section.seeAllTargetCategoryId));
                          if (cat) handleCategoryClick(cat);
                        }
                      }}
                      onServiceClick={(service) => handleServiceClick(service)}
                      onAddClick={handleAddClick}
                    />
                  </Suspense>
                </motion.div>
              ))}

            </>
          )}
        </main>
      </motion.div>

      {/* Bottom Navigation */}
      {!isAddressModalOpen && !groupCategorySheet.open && <BottomNav />}

      {/* Category Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        location={address}
        cartCount={cartCount}
        currentCity={currentCity}
      />

      {/* Search Overlay */}
      <SearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        categories={categories}
        onCategoryClick={handleCategoryClick}
      />

      {/* Address Selection Modal */}
      <AddressSelectionModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        houseNumber={houseNumber}
        onHouseNumberChange={setHouseNumber}
        onSave={handleAddressSave}
      />

      {comingSoonCategory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative border border-gray-100 flex flex-col items-center text-center">
            <button 
              onClick={() => setComingSoonCategory(null)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            
            <h3 className="text-xl font-extrabold text-gray-900 mb-2">
              {comingSoonCategory.title}
            </h3>
            
            <p className="text-sm text-gray-500 mb-6 font-medium">
              We are launching this category soon in your area. Click below to show your interest, and we'll notify you!
            </p>
            
            <button
              disabled={comingSoonCategory.isInterested}
              onClick={async () => {
                try {
                  const res = await publicCatalogService.registerInterest(comingSoonCategory.id || comingSoonCategory._id);
                  if (res.success) {
                    toast.success(res.message);
                    setCategories(prev => prev.map(c => 
                      c.id === comingSoonCategory.id 
                        ? { ...c, isInterested: true, interestedCount: (c.interestedCount || 0) + 1 }
                        : c
                    ));
                    setComingSoonCategory(prev => ({ ...prev, isInterested: true }));
                  } else {
                    toast.error(res.message || "Failed to register interest");
                  }
                } catch (err) {
                  console.error("Interest registration failed:", err);
                  const msg = err.response?.data?.message || "Authentication required. Please login first.";
                  toast.error(msg);
                }
              }}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold shadow-md transition-all ${
                comingSoonCategory.isInterested 
                  ? 'bg-green-500 text-white cursor-default shadow-none'
                  : 'bg-[#B33A35] text-white hover:bg-[#9E2E2A] hover:shadow-lg'
              }`}
              style={{ backgroundColor: comingSoonCategory.isInterested ? '#22c55e' : '#B33A35' }}
            >
              {comingSoonCategory.isInterested ? "✓ Interest Registered" : "I'm Interested!"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default Home;
