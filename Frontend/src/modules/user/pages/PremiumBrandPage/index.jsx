import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiClock, FiHeart, FiShare2, FiShield, FiStar, FiX, FiPlus, FiCheckCircle } from 'react-icons/fi';
import Navbar from '../../components/premium/Navbar';
import ServiceCard from '../../components/premium/ServiceCard';
import PriceTag from '../../components/premium/PriceTag';
import { buildCartItemData, toAssetUrl } from '../../components/premium/cartUtils';
import { useCity } from '../../../../context/CityContext';
import { useCart } from '../../../../context/CartContext';
import { useTheme } from '../../../../context/ThemeContext';
import { publicCatalogService } from '../../../../services/catalogService';
import { bookingService } from '../../../../services/bookingService';
import { toast } from 'react-hot-toast';
import api from '../../../../services/api';

const pastelPalettes = [
  { bg: '#FEFBE8', border: '#FEF08A', text: '#854D0E', darkBg: '#59522B', darkBorder: '#7A703C', darkText: '#FEF08A' }, // Yellow
  { bg: '#FAE8FF', border: '#F5D0FE', text: '#86198F', darkBg: '#593461', darkBorder: '#794785', darkText: '#F5D0FE' }, // Purple
  { bg: '#FFE4E6', border: '#FECDD3', text: '#9F1239', darkBg: '#693541', darkBorder: '#8E4858', darkText: '#FECDD3' }, // Rose
  { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534', darkBg: '#2A5C3D', darkBorder: '#3D8055', darkText: '#BBF7D0' }, // Green
  { bg: '#E0F2FE', border: '#BAE6FD', text: '#075985', darkBg: '#264E72', darkBorder: '#376F9F', darkText: '#BAE6FD' }, // Blue
  { bg: '#EEF2FF', border: '#C7D2FE', text: '#3730A3', darkBg: '#343A7C', darkBorder: '#4E57B8', darkText: '#C7D2FE' }  // Indigo
];

const PremiumBrandPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentCity } = useCity();
  const { isDark } = useTheme();
  const { cartCount, cartItems, addToCart, updateItem, removeItem } = useCart();

  const [brand, setBrand] = useState(location.state?.vendor || null);
  const [services, setServices] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Variants popup states
  const [showVariantPopup, setShowVariantPopup] = useState(false);
  const [selectedServiceForPopup, setSelectedServiceForPopup] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState([]);

  useEffect(() => {
    const loadBrand = async () => {
      try {
        const brandRes = await publicCatalogService.getBrandBySlug(slug, currentCity?._id || currentCity?.id);
        if (brandRes?.success) {
          setBrand(brandRes.brand || brandRes.data || brandRes);
        }
      } catch (error) {
        console.error('Brand load error', error);
      }
    };

    if (!brand) loadBrand();
  }, [brand, currentCity, slug]);

  useEffect(() => {
    const loadServices = async () => {
      try {
        if (!brand) return;
        const brandId = brand.id || brand._id;
        const serviceRes = await publicCatalogService.getServices({ brandId, cityId: currentCity?._id || currentCity?.id });
        if (serviceRes?.success && Array.isArray(serviceRes.services)) {
          setServices(serviceRes.services.map((service, index) => ({
            id: service.id || service._id || `brand-service-${index}`,
            title: service.title,
            description: service.description || 'Premium service by verified professionals.',
            image: toAssetUrl(service.icon || service.image),
            rating: service.rating || 4.8,
            reviews: service.reviewCount || 120,
            price: service.discountPrice || service.basePrice || service.price || 0,
            originalPrice: service.basePrice || null,
            features: service.features || [],
            steps: service.steps || [],
            vendorId: service.vendorId || brand.vendorId,
            brandId
          })));
        } else {
          setServices([]);
        }

        try {
          const ratingRes = await bookingService.getRatings({ brandId });
          const ratingList = ratingRes?.data || ratingRes?.reviews || ratingRes?.ratings || [];
          if (Array.isArray(ratingList) && ratingList.length) {
            setReviews(ratingList.map((item, index) => ({
              id: item.id || item._id || `review-${index}`,
              name: item.userName || item.user?.name || item.customerName || 'User',
              rating: item.rating || 5,
              comment: item.comment || item.review || item.message || 'Great service',
            })));
          }
        } catch (ratingError) {
          setReviews([]);
        }
      } catch (error) {
        console.error('Brand services load error', error);
        setServices([]);
        setReviews([]);
      }
    };

    loadServices();
  }, [brand, currentCity]);

  const heroImage = brand?.coverImage || brand?.image || services[0]?.image || '';
  const topServices = services.slice(0, 2);

  const toggleVariant = (variant) => {
    setSelectedVariants(prev => {
      const isSelected = prev.some(v => (v._id || v.title) === (variant._id || variant.title));
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

    const cartData = buildCartItemData({ service: selectedServiceForPopup, brand });
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
      const cityId = currentCity?._id || currentCity?.id;
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

    const response = await addToCart(buildCartItemData({ service, brand }));
    if (response?.success) {
      toast.success('Added to cart');
    }
  };

  const getCartItemServiceId = (item) => {
    if (!item) return null;
    if (typeof item.serviceId === 'object' && item.serviceId) {
      return item.serviceId._id || item.serviceId.id;
    }
    return item.serviceId || item.id || item._id;
  };

  const quantities = useMemo(() => {
    const map = {};
    cartItems.forEach((item) => {
      const id = getCartItemServiceId(item);
      if (id) map[id] = item.serviceCount || 1;
    });
    return map;
  }, [cartItems]);

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

  const serviceCards = useMemo(() => services, [services]);

  if (!brand) {
    return <div className="min-h-screen bg-white p-6">Loading brand...</div>;
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: 'var(--background)' }}>
      {/* Full width Cover Image (Spans edge-to-edge) */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] md:h-[400px] overflow-hidden">
        {heroImage ? (
          <img src={heroImage} alt={brand.title || brand.businessName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-purple-50 to-white dark:from-gray-800 dark:to-gray-900 text-gray-400">No brand image available</div>
        )}
        
        {/* Floating controls positioned at top-4 */}
        <button 
          type="button" 
          onClick={() => navigate(-1)} 
          className="absolute left-4 top-4 z-10 w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-900 shadow-md border border-gray-100 hover:scale-105 active:scale-95 transition-all"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>
 
        <div className="absolute right-4 top-4 z-10 flex gap-2">
          <button className="w-10 h-10 rounded-full bg-black/35 text-white flex items-center justify-center backdrop-blur-md hover:scale-105 active:scale-95 transition-all">
            <FiHeart className="w-4 h-4" />
          </button>
          <button className="w-10 h-10 rounded-full bg-black/35 text-white flex items-center justify-center backdrop-blur-md hover:scale-105 active:scale-95 transition-all">
            <FiShare2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {/* Brand details section below the image */}
        <div className="mb-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.24em]" style={{ color: 'var(--primary)' }}>Brand page</p>
          <h1 className="mt-1 text-2xl font-semibold md:text-3xl" style={{ color: 'var(--text-primary)' }}>{brand.title || brand.businessName}</h1>
          <p className="mt-2 max-w-2xl text-xs md:text-sm" style={{ color: 'var(--text-secondary)' }}>{brand.description || brand.tagline || 'Premium service partner with trusted technicians and transparent pricing.'}</p>
          
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}><FiStar className="text-amber-300" /> {brand.rating || 4.8}</span>
            <span className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}><FiClock /> 30-45 min</span>
            <span className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium border" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}><FiShield /> Verified</span>
          </div>
        </div>

        <section className="mt-6 rounded-[30px] border p-5 shadow-[0_18px_60px_rgba(17,24,39,0.04)]" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}>
          <div className="mb-4 flex items-end justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.24em]" style={{ color: 'var(--primary)' }}>Top services</p>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Starts from</h2>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {topServices.map((service) => (
              <button 
                key={service.id} 
                type="button" 
                onClick={() => navigate(`/user/service/${service.id}`, { state: { service, brand } })} 
                className="rounded-3xl border p-4 text-left shadow-sm transition hover:-translate-y-1"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border" style={{ borderColor: 'var(--border)' }}>
                    <img src={service.image} alt={service.title} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold line-clamp-1" style={{ color: 'var(--text-primary)' }}>{service.title}</div>
                    <div className="mt-1 text-xs line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{service.description}</div>
                    <PriceTag price={service.price} originalPrice={service.originalPrice} className="mt-2" />
                  </div>
                </div>
                <div className="mt-3 inline-flex rounded-2xl bg-gradient-to-r from-[#B33A35] to-[#9E2E2A] px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-500/10">View details</div>
              </button>
            ))}
          </div>
          {topServices.length === 0 ? <div className="rounded-3xl border border-dashed p-5 text-sm" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)', color: 'var(--text-muted)' }}>No services available for this brand.</div> : null}
        </section>

        <section className="mt-6 space-y-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.24em]" style={{ color: 'var(--text-muted)' }}>All services</p>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Choose and add</h2>
          </div>
          <div className="grid gap-4">
            {serviceCards.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                quantity={quantities[service.id] || 0}
                onAdd={handleAdd}
                onIncrease={handleIncrease}
                onDecrease={handleDecrease}
                onOpen={() => navigate(`/user/service/${service.id}`, { state: { service, brand } })}
              />
            ))}
          </div>
          {serviceCards.length === 0 ? <div className="rounded-3xl border border-dashed p-5 text-sm" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)', color: 'var(--text-muted)' }}>No services available right now.</div> : null}
        </section>

        <section className="mt-8 rounded-[30px] border p-5 shadow-[0_18px_60px_rgba(17,24,39,0.04)]" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}>
          <div className="mb-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.24em]" style={{ color: 'var(--text-muted)' }}>Reviews</p>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>What users say</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-3xl border p-4" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)' }}>
                <div className="flex items-center justify-between">
                  <div className="font-semibold" style={{ color: 'var(--text-primary)' }}>{review.name}</div>
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}><FiStar /> {review.rating}</span>
                </div>
                <p className="mt-3 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>{review.comment}</p>
              </div>
            ))}
          </div>
          {reviews.length === 0 ? <div className="rounded-3xl border border-dashed p-5 text-sm" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card-bg)', color: 'var(--text-muted)' }}>No reviews available yet.</div> : null}
        </section>
      </div>

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

export default PremiumBrandPage;
