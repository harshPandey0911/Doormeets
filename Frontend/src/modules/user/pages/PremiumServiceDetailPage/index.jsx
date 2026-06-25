import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiHeart, FiShare2, FiShield, FiStar, FiClock, FiCheckCircle, FiSliders, FiInfo, FiUpload, FiPlus, FiMinus, FiX, FiFolder, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/premium/Navbar';
import BottomCheckoutBar from '../../components/premium/BottomCheckoutBar';
import PriceTag from '../../components/premium/PriceTag';
import { buildCartItemData, toAssetUrl } from '../../components/premium/cartUtils';
import { useCart } from '../../../../context/CartContext';
import { useCity } from '../../../../context/CityContext';
import { useTheme } from '../../../../context/ThemeContext';
import api from '../../../../services/api';

const getDetailDummyImage = (title) => {
  const t = (title || '').toLowerCase();
  if (t.includes('massage') || t.includes('spa') || t.includes('wellness') || t.includes('therapy')) {
    return 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop&q=80';
  }
  if (t.includes('screen') || t.includes('display') || t.includes('glass')) {
    return 'https://images.unsplash.com/photo-1597740985671-2a8a3b80502e?w=800&auto=format&fit=crop&q=80';
  }
  if (t.includes('motherboard') || t.includes('board') || t.includes('circuit') || t.includes('ic') || t.includes('repair')) {
    return 'https://images.unsplash.com/photo-1517059224940-d4af9eec41b7?w=800&auto=format&fit=crop&q=80';
  }
  if (t.includes('switch') || t.includes('socket') || t.includes('button') || t.includes('plug') || t.includes('board connection')) {
    return 'https://images.unsplash.com/photo-1558244661-d248897f7bc4?w=800&auto=format&fit=crop&q=80';
  }
  if (t.includes('cleaning') || t.includes('wash') || t.includes('service')) {
    return 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=800&auto=format&fit=crop&q=80';
};

const PremiumServiceDetailPage = () => {
  const { currentCity } = useCity();
  const { isDark } = useTheme();
  const cityId = currentCity?._id || currentCity?.id;
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();

  const [service, setService] = useState(location.state?.service || null);
  const brand = location.state?.brand || null;
  const category = location.state?.category || null;

  const [pageBlocks, setPageBlocks] = useState([]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = React.useRef(null);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  useEffect(() => {
    setIsPlaying(true);
  }, [activeImageIndex]);

  const serviceImages = useMemo(() => {
    if (pageBlocks.length > 0) {
      const bannerBlock = pageBlocks.find(b => b.blockType === 'banner_slider' && b.isVisible);
      if (bannerBlock?.data?.banners?.length > 0) {
        return bannerBlock.data.banners.map(item => {
          const itemUrl = typeof item === 'object' ? item.url : item;
          const itemType = typeof item === 'object' ? (item.type || 'image') : 'image';
          return { url: toAssetUrl(itemUrl), type: itemType };
        });
      }
    }
    let rawImages = [];
    if (Array.isArray(service?.images) && service.images.length > 0) {
      rawImages = service.images;
    } else if (Array.isArray(service?.gallery) && service.gallery.length > 0) {
      rawImages = service.gallery;
    } else if (service?.image) {
      rawImages = [service.image];
    } else {
      rawImages = [getDetailDummyImage(service?.title)];
    }
    return rawImages.map(img => ({ url: toAssetUrl(img), type: 'image' }));
  }, [service, pageBlocks]);

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || serviceImages.length <= 1) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;
    if (distance > minSwipeDistance) {
      setActiveImageIndex((prev) => (prev + 1) % serviceImages.length);
    } else if (distance < -minSwipeDistance) {
      setActiveImageIndex((prev) => (prev - 1 + serviceImages.length) % serviceImages.length);
    }
  };

  const cardColors = [
    { bg: '#FEFBE8', border: '#FEF08A', text: '#854D0E' }, // Yellow/Gold
    { bg: '#FAE8FF', border: '#F5D0FE', text: '#86198F' }, // Purple/Lavender
    { bg: '#FFE4E6', border: '#FECDD3', text: '#9F1239' }, // Rose/Pink
    { bg: '#FFF1F2', border: '#FEE2E2', text: '#991B1B' }, // Soft Red
    { bg: '#F0FDF4', border: '#BBF7D0', text: '#166534' }, // Green
    { bg: '#E0F2FE', border: '#BAE6FD', text: '#075985' }  // Light Blue
  ];

  const features = useMemo(() => {
    if (pageBlocks.length > 0) {
      const whatsIncluded = pageBlocks.find(b => b.blockType === 'whats_included');
      if (whatsIncluded?.data?.items?.length) {
        return whatsIncluded.data.items;
      }
    }
    return service?.features || [];
  }, [service, pageBlocks]);

  const steps = useMemo(() => {
    if (pageBlocks.length > 0) {
      const processBlock = pageBlocks.find(b => b.blockType === 'process');
      if (processBlock?.data?.steps?.length) {
        return processBlock.data.steps.map(s => s?.title || s);
      }
    }
    return service?.steps || [];
  }, [service, pageBlocks]);

  const [fields, setFields] = useState([]);
  const [pricingRules, setPricingRules] = useState([]);
  const [dynamicAnswers, setDynamicAnswers] = useState({});
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [customSelectedItems, setCustomSelectedItems] = useState({});
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [isCustomizing, setIsCustomizing] = useState(false);

  useEffect(() => {
    if (selectedPackage && selectedPackage.includedItems) {
      const initial = {};
      selectedPackage.includedItems.forEach(item => {
        if (item.serviceGroupId) {
          initial[item.serviceGroupId.toString()] = item.selectedItemId ? item.selectedItemId.toString() : '';
        }
      });
      setCustomSelectedItems(initial);
      setIsCustomizing(false);
    }
  }, [selectedPackage]);

  // Variants state
  const [variants, setVariants] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState([]);
  const [showVariantPopup, setShowVariantPopup] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleVariant = useCallback((variant) => {
    setSelectedVariants(prev => {
      const isSelected = prev.some(v => v._id === variant._id || v.title === variant.title);
      if (isSelected) return prev.filter(v => (v._id || v.title) !== (variant._id || variant.title));
      return [...prev, variant];
    });
  }, []);

  const groupedVariants = useMemo(() => {
    const groups = {};
    variants.forEach(v => {
      const cat = v.category || 'Other Add-ons';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(v);
    });
    return groups;
  }, [variants]);

  const variantExtraTotal = selectedVariants.reduce((sum, v) => sum + (Number(v.extraPrice) || 0), 0);
  const finalPrice = calculatedPrice + variantExtraTotal;

  const [selectedDuration, setSelectedDuration] = useState(30);

  useEffect(() => {
    if ((service?.serviceType === 'package_base' || service?.serviceType === 'subscription_base') && service?.packages?.length > 0) {
      const popular = service.packages.find(p => p.isPopular);
      setSelectedPackage(popular || service.packages[0]);
    }
    if (service?.serviceType === 'minute_base') {
      setSelectedDuration(Number(service.minimumMinutes) || 30);
    }
  }, [service?._id, service?.id]);

  const durationOptions = useMemo(() => {
    const minMins = Number(service?.minimumMinutes) || 30;
    const options = [minMins];
    [45, 60, 90, 120, 150, 180, 240].forEach(mins => {
      if (mins > minMins && !options.includes(mins)) {
        options.push(mins);
      }
    });
    return options.sort((a, b) => a - b);
  }, [service?._id, service?.id, service?.minimumMinutes]);

  const formatDurationText = (mins) => {
    if (mins < 60) return `${mins} Mins`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    if (rem === 0) return `${hrs} Hour${hrs > 1 ? 's' : ''}`;
    return `${hrs} Hr ${rem} Min`;
  };
  const [uploadingFiles, setUploadingFiles] = useState({});

  useEffect(() => {
    const fetchDynamicDetails = async () => {
      const sId = service?._id || service?.id || slug;
      if (!sId) return;
      try {
        const res = await api.get(`/public/services/${sId}/dynamic-details${cityId ? `?cityId=${cityId}` : ''}`);
        if (res.data.success) {
          if (res.data.service) {
            setService(prev => ({
              ...res.data.service,
              image: res.data.service.image || prev?.image
            }));
          }
          setFields(res.data.fields || []);
          setPricingRules(res.data.pricingRules || []);
          setPageBlocks(res.data.pageBlocks || []);
          setVariants(res.data.variants || []);

          const initialAnswers = {};
          (res.data.fields || []).forEach(f => {
            initialAnswers[f.name] = f.defaultValue || '';
          });
          setDynamicAnswers(initialAnswers);
        }
      } catch (err) {
        console.error("Error loading dynamic details", err);
      }
    };
    fetchDynamicDetails();
  }, [slug, cityId]);

  useEffect(() => {
    if (!service) return;

    let basePrice = 0;
    if (service.serviceType === 'package_base' && selectedPackage) {
      if (isCustomizing) {
        // If user is customizing, price is strictly the sum of selected items!
        let sumPrice = 0;
        Object.keys(customSelectedItems).forEach(groupId => {
          const selectedId = customSelectedItems[groupId];
          if (selectedId && selectedId !== 'skip') {
            const group = service.serviceGroups?.find(g => g._id?.toString() === groupId);
            const selectedItem = group?.items?.find(i => i._id?.toString() === selectedId.toString());
            if (selectedItem) {
              sumPrice += Number(selectedItem.price || 0);
            }
          }
        });
        basePrice = sumPrice;
      } else {
        // Otherwise, show the discounted combo package price
        basePrice = selectedPackage.price || 0;
      }
    } else if (service.serviceType === 'subscription_base' && service.packages && service.packages.length > 0) {
      basePrice = selectedPackage?.price || 0;
    } else if (service.serviceType === 'dynamic_base' || service.serviceType === 'image_base') {
      basePrice = 0;
    } else if (service.serviceType === 'minute_base') {
      const minPrice = Number(service.basePrice || service.price || 0);
      const minMins = Number(service.minimumMinutes || 30);
      const extraRatePer10Mins = Number(service.pricePerMinute || 0);
      if (selectedDuration <= minMins) {
        basePrice = minPrice;
      } else {
        const extraMins = selectedDuration - minMins;
        basePrice = minPrice + (extraRatePer10Mins * (extraMins / 10));
      }
    } else {
      basePrice = Number(service.basePrice || service.price || service.pricePerMinute || 0);
    }

    let price = basePrice;
    if (pricingRules.length === 0) {
      setCalculatedPrice(price);
      return;
    }

    const formulaRule = pricingRules.find(r => r.ruleType === 'formula');
    const conditionalRules = pricingRules.filter(r => r.ruleType === 'conditional');

    if (formulaRule && formulaRule.formulaString) {
      try {
        let formula = formulaRule.formulaString;
        const vars = { basePrice, ...dynamicAnswers };
        Object.keys(vars).forEach(key => {
          const val = parseFloat(vars[key]) || 0;
          const regex = new RegExp(`\\b${key}\\b`, 'g');
          formula = formula.replace(regex, val);
        });
        const safeFormula = formula.replace(/[^0-9\s+\-*/().]/g, '');
        const evaluated = new Function(`return (${safeFormula})`)();
        if (typeof evaluated === 'number' && !isNaN(evaluated)) {
          price = evaluated;
        }
      } catch (e) {
        console.error('Error evaluating formula:', e);
      }
    }

    conditionalRules.forEach(rule => {
      const userVal = dynamicAnswers[rule.fieldName];
      if (userVal === undefined) return;

      let isMatch = false;
      if (rule.operator === 'equals') {
        isMatch = String(userVal).toLowerCase() === String(rule.value).toLowerCase();
      } else if (rule.operator === 'greater_than') {
        isMatch = parseFloat(userVal) > parseFloat(rule.value);
      } else if (rule.operator === 'less_than') {
        isMatch = parseFloat(userVal) < parseFloat(rule.value);
      }

      if (isMatch) {
        if (rule.priceModifierType === 'add') {
          price += rule.modifierValue;
        } else if (rule.priceModifierType === 'multiply') {
          price *= rule.modifierValue;
        } else if (rule.priceModifierType === 'fixed') {
          price = rule.modifierValue;
        }
      }
    });

    setCalculatedPrice(Math.max(0, price));
  }, [dynamicAnswers, pricingRules, service, selectedPackage, customSelectedItems, selectedDuration, isCustomizing]);

  const handleFileUpload = async (fieldName, file) => {
    try {
      setUploadingFiles(prev => ({ ...prev, [fieldName]: true }));
      const { uploadToCloudinary } = await import('../../../../utils/cloudinaryUpload');
      const url = await uploadToCloudinary(file, 'user_bookings');
      if (url) {
        setDynamicAnswers(prev => ({
          ...prev,
          [fieldName]: url
        }));
        toast.success('File uploaded successfully!');
      } else {
        toast.error('Failed to upload file');
      }
    } catch (e) {
      console.error(e);
      toast.error('Upload failed');
    } finally {
      setUploadingFiles(prev => ({ ...prev, [fieldName]: false }));
    }
  };

  const fetchCurrentLocation = (fieldName) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locStr = `${position.coords.latitude}, ${position.coords.longitude}`;
          setDynamicAnswers(prev => ({ ...prev, [fieldName]: locStr }));
          toast.success('Location detected!');
        },
        (error) => {
          toast.error('Failed to get location');
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  const handleAdd = async () => {
    if (!service) return;

    // If variants exist and popup hasn't been shown yet, open the popup
    if (service?.serviceType !== 'image_base' && variants.length > 0 && !showVariantPopup) {
      setShowVariantPopup(true);
      return;
    }

    // Validate required fields
    const missingFields = fields.filter(f => f.showToUser !== false && f.isRequired && !dynamicAnswers[f.name]);
    if (missingFields.length > 0) {
      toast.error(`Please fill out required field: ${missingFields[0].label}`);
      return;
    }

    const dynamicFieldsPayload = Object.keys(dynamicAnswers)
      .filter(key => {
        const field = fields.find(f => f.name === key);
        return field && field.showToUser !== false;
      })
      .map(key => {
        const field = fields.find(f => f.name === key);
        return {
          fieldId: field?._id || field?.id,
          name: key,
          label: field?.label || key,
          value: dynamicAnswers[key]
        };
      });

    // Add selected variants to dynamic fields
    if (selectedVariants.length > 0) {
      dynamicFieldsPayload.push({
        name: 'Selected Variants',
        label: 'Selected Variants',
        value: selectedVariants.map(v => `${v.title}${v.extraPrice > 0 ? ` (+₹${v.extraPrice})` : ''}`).join(', ')
      });
    }

    const cartData = buildCartItemData({ service, category, brand });
    if (service?.serviceType === 'package_base' && selectedPackage) {
      cartData.card.title = `${service.title} - ${selectedPackage.title}`;
      if (selectedPackage.duration) cartData.card.duration = selectedPackage.duration;
      dynamicFieldsPayload.push({
        name: 'Selected Package',
        label: 'Selected Package',
        value: selectedPackage.title
      });
      if (selectedPackage.includedItems && service.serviceGroups) {
        selectedPackage.includedItems.forEach(incItem => {
          const groupId = incItem.serviceGroupId?.toString();
          const group = service.serviceGroups.find(g => g._id?.toString() === groupId);
          if (group) {
            const selectedId = customSelectedItems[groupId];
            if (selectedId === 'skip') {
              dynamicFieldsPayload.push({
                name: `Group: ${group.title}`,
                label: group.title,
                value: 'Skipped ("I don\'t need this")'
              });
            } else if (selectedId) {
              const selectedItem = group.items?.find(i => i._id?.toString() === selectedId.toString());
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
    }
    if (service?.serviceType === 'minute_base') {
      cartData.card.duration = `${selectedDuration} Minutes`;
      dynamicFieldsPayload.push({
        name: 'Duration',
        label: 'Duration',
        value: `${selectedDuration} Minutes`
      });
    }
    cartData.price = finalPrice;
    cartData.unitPrice = finalPrice;
    const baseOriginalPrice = Number(service.originalPrice || service.basePrice || service.price || 0);
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
      navigate('/user/cart');
    }
  };

  if (!service) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--background)' }}>
        <Navbar locationLabel="Premium service" cartCount={cartCount} onSearchClick={() => { }} onLocationClick={() => navigate('/user/home')} />
        <div className="mx-auto max-w-3xl px-4 py-12 text-center">
          <div className="rounded-[28px] border border-dashed border-border-color bg-card-bg p-10 shadow-sm" style={{ borderColor: 'var(--border)' }}>
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>Service not available</h1>
            <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>Open this page from a brand or category service card so we can load the live service data.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header Image Section with Full-Bleed style on mobile */}
      <div 
        className="relative w-full h-[320px] md:h-[460px] overflow-hidden bg-gray-100 shadow-sm select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {serviceImages[activeImageIndex]?.type === 'video' ? (
          <video
            ref={videoRef}
            src={serviceImages[activeImageIndex]?.url}
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover cursor-pointer"
            onClick={togglePlay}
          />
        ) : (
          <img
            src={serviceImages[activeImageIndex]?.url}
            alt={service.title}
            className="h-full w-full object-cover transition-all duration-300"
            draggable="false"
          />
        )}
        {/* Soft Linear Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />
        
        {/* Play Button Overlay (only if video is paused/exists) */}
        {serviceImages[activeImageIndex]?.type === 'video' && !isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <button 
              onClick={togglePlay}
              className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-lg text-gray-800 hover:scale-105 active:scale-95 transition-all"
            >
              <svg className="w-6 h-6 fill-current ml-0.5 text-gray-800" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          </div>
        )}

        {/* Back Button Overlay */}
        <button
          onClick={() => navigate(-1)}
          className="absolute left-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md text-gray-700 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <FiArrowLeft className="w-5 h-5" />
        </button>

        {/* Heart & Share Overlay */}
        <div className="absolute right-5 top-5 flex gap-2 z-20">
          <button className="rounded-full bg-black/20 p-2.5 backdrop-blur text-white hover:bg-black/30"><FiHeart /></button>
          <button className="rounded-full bg-black/20 p-2.5 backdrop-blur text-white hover:bg-black/30"><FiShare2 /></button>
        </div>

        {/* Progress Bar / Dots (Dynamic: shows only if more than 1 image) */}
        {serviceImages.length > 1 && (
          <div className="absolute bottom-4 left-5 flex gap-1.5 z-20">
            {serviceImages.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={() => setActiveImageIndex(dotIdx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  activeImageIndex === dotIdx ? 'w-8 bg-brand' : 'w-2 bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Go to slide ${dotIdx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-lg lg:max-w-2xl px-5 pt-6 pb-4">
        {/* Title, Rating, and Description */}
        <div className="space-y-2">
          <h1 className="text-[22px] font-semibold tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
            {service.title ? service.title.charAt(0).toUpperCase() + service.title.slice(1).toLowerCase() : ''}
          </h1>
          
          <div className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            <FiStar className="fill-amber-400 text-amber-400" />
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{service.rating || "4.5"}</span>
            <span>({service.reviewCount ? `${service.reviewCount} reviews` : "1.2k reviews"})</span>
          </div>

          <p className="text-sm font-normal leading-relaxed pt-1" style={{ color: 'var(--text-secondary)' }}>
            {service.description}
          </p>
        </div>

        {/* Service Groups Grid (e.g. Haircut, Massage, Shave etc.) */}
        {service?.serviceType === 'package_base' && service?.serviceGroups?.length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-[17px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Service Categories
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {service.serviceGroups.map((group, idx) => {
                const colors = cardColors[idx % cardColors.length];
                return (
                  <div
                    key={group._id || idx}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all duration-200 hover:scale-[1.02] shadow-[0_2px_8px_rgba(0,0,0,0.01)]"
                    style={{
                      backgroundColor: colors.bg,
                      borderColor: colors.border,
                      minHeight: '100px'
                    }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/90 flex items-center justify-center mb-2 shadow-sm">
                      {group.iconUrl ? (
                        <img src={toAssetUrl(group.iconUrl)} alt={group.title} className="w-6 h-6 object-contain" />
                      ) : (
                        <span className="text-sm font-black" style={{ color: colors.text }}>
                          {group.title ? group.title[0].toUpperCase() : 'S'}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold tracking-tight leading-tight line-clamp-2" style={{ color: colors.text }}>
                      {group.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Service Variants styled like the features grid */}
        {variants.length > 0 && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="text-[17px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {service?.serviceType === 'image_base' ? 'Service Addon Categories' : 'Service Variants'}
                </h2>
              </div>
              {selectedVariants.length > 0 && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(255, 159, 69, 0.12)', color: 'var(--primary)' }}>
                  {selectedVariants.length} selected
                </span>
              )}
            </div>

            {service?.serviceType === 'image_base' ? (
              <div className="space-y-3">
                {Object.keys(groupedVariants).map((catName, groupIdx) => {
                  const catItems = groupedVariants[catName];
                  const isExpanded = expandedCategories[catName] !== false; // Default to true (expanded)
                  const selectedInGroup = catItems.filter(item => selectedVariants.some(v => (v._id || v.title) === (item._id || item.title)));

                  return (
                    <div key={catName} className="rounded-3xl border border-border-color overflow-hidden bg-card-bg shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]" style={{ borderColor: 'var(--border)' }}>
                      <button
                        type="button"
                        onClick={() => setExpandedCategories(prev => ({ ...prev, [catName]: !isExpanded }))}
                        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50/50 to-transparent hover:from-gray-50 text-left outline-none cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                            <FiFolder className="w-4 h-4" />
                          </span>
                          <div>
                            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{catName}</h3>
                            <p className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                              {catItems.length} addon{catItems.length > 1 ? 's' : ''} available
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                          {selectedInGroup.length > 0 && (
                            <span className="text-[9px] font-bold bg-green-50 text-green-600 px-2 py-0.5 rounded-full border border-green-100">
                              {selectedInGroup.length} Selected
                            </span>
                          )}
                          <span className="text-gray-400">
                            {isExpanded ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                          </span>
                        </div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t overflow-hidden"
                            style={{ borderColor: 'var(--border)' }}
                          >
                            <div className="p-4 grid grid-cols-3 gap-2.5 items-stretch bg-gray-50/20">
                              {catItems.map((variant, idx) => {
                                const isSelected = selectedVariants.some(v => (v._id || v.title) === (variant._id || variant.title));
                                const colorScheme = cardColors[(groupIdx + idx) % cardColors.length];
                                return (
                                  <button
                                    key={variant._id || idx}
                                    type="button"
                                    onClick={() => toggleVariant(variant)}
                                    className="flex flex-col items-center justify-between p-3 rounded-2xl border text-center w-full min-h-[110px] shadow-[0_2px_8px_rgba(0,0,0,0.01)] transition-all duration-200 hover:scale-[1.01] active:scale-95 cursor-pointer relative"
                                    style={{
                                      backgroundColor: colorScheme.bg,
                                      borderColor: isSelected ? 'var(--primary)' : colorScheme.border,
                                      borderWidth: isSelected ? '2px' : '1px'
                                    }}
                                  >
                                    <div className="flex items-center justify-center mb-1">
                                      <span
                                        className="flex items-center justify-center w-5.5 h-5.5 rounded-full border-2 text-[10px] font-black transition-all"
                                        style={isSelected
                                          ? { borderColor: 'var(--primary)', backgroundColor: 'var(--primary)', color: '#fff' }
                                          : { borderColor: colorScheme.text, color: colorScheme.text }
                                        }
                                      >
                                        {isSelected ? '✓' : <FiPlus />}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-bold tracking-tight leading-tight line-clamp-2 my-1 flex-1 flex items-center justify-center" style={{ color: colorScheme.text }}>
                                      {variant.title}
                                    </span>
                                    <span
                                      className="text-[9px] font-black px-2 py-0.5 rounded-full transition-all shrink-0"
                                      style={isSelected
                                        ? { color: '#fff', backgroundColor: 'var(--primary)' }
                                        : { color: colorScheme.text, backgroundColor: 'rgba(255,255,255,0.7)' }
                                      }
                                    >
                                      {variant.extraPrice > 0 ? `+₹${variant.extraPrice}` : 'Free'}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 items-stretch">
                {variants.map((variant, idx) => {
                  const isSelected = selectedVariants.some(v => (v._id || v.title) === (variant._id || variant.title));
                  const colorScheme = cardColors[idx % cardColors.length];
                  return (
                    <button
                      key={variant._id || idx}
                      type="button"
                      onClick={() => {
                        toggleVariant(variant);
                        setShowVariantPopup(false);
                      }}
                      className="flex flex-col items-center justify-between p-3 rounded-2xl border text-center w-full min-h-[120px] shadow-[0_2px_8px_rgba(0,0,0,0.01)] transition-transform duration-200 hover:scale-[1.01] active:scale-95 cursor-pointer relative"
                      style={{
                        backgroundColor: colorScheme.bg,
                        borderColor: isSelected ? 'var(--primary)' : colorScheme.border,
                        borderWidth: isSelected ? '2px' : '1px'
                      }}
                    >
                      <div className="flex items-center justify-center mb-1">
                        <span
                          className="flex items-center justify-center w-6 h-6 rounded-full border-2 text-xs font-black transition-all"
                          style={isSelected
                            ? { borderColor: 'var(--primary)', backgroundColor: 'var(--primary)', color: '#fff' }
                            : { borderColor: colorScheme.text, color: colorScheme.text }
                          }
                        >
                          {isSelected ? '✓' : <FiPlus />}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold tracking-tight leading-tight line-clamp-2 my-1 flex-1 flex items-center justify-center" style={{ color: colorScheme.text }}>
                        {variant.title}
                      </span>
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-all shrink-0"
                        style={isSelected
                          ? { color: '#fff', backgroundColor: 'var(--primary)' }
                          : { color: colorScheme.text, backgroundColor: 'rgba(255,255,255,0.6)' }
                        }
                      >
                        {variant.extraPrice > 0 ? `+₹${variant.extraPrice}` : 'Free'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Pricing / Duration Base */}

        {service?.serviceType === 'minute_base' && (
          <section className="mt-8 py-4 px-4 rounded-3xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
            <h2 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <FiClock className="text-brand" /> Select Massage Duration
            </h2>
            <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Standard base charge is <span className="font-semibold text-brand">₹{(service.basePrice || 0)} for {service.minimumMinutes || 30} Mins</span>. Extra duration will be charged at ₹{(service.pricePerMinute || 0)} per 10 Mins.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {durationOptions.map((mins) => {
                const minPrice = Number(service.basePrice || 0);
                const minMins = Number(service.minimumMinutes || 30);
                const extraRatePer10Mins = Number(service.pricePerMinute || 0);
                const currentDurationPrice = mins <= minMins
                  ? minPrice
                  : minPrice + (extraRatePer10Mins * ((mins - minMins) / 10));
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSelectedDuration(mins)}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                      selectedDuration === mins ? 'border-brand font-semibold shadow-sm' : ''
                    }`}
                    style={
                      selectedDuration === mins
                        ? { backgroundColor: 'rgba(255,159,69,0.12)', color: 'var(--primary)', borderColor: 'var(--primary)' }
                        : { backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)', borderColor: 'var(--border)' }
                    }
                  >
                    <span className="text-xs font-semibold">{formatDurationText(mins)}</span>
                    <span className="text-xs mt-1 font-medium" style={{ color: selectedDuration === mins ? 'var(--primary)' : 'var(--text-muted)' }}>₹{currentDurationPrice.toFixed(0)}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* Packages Section */}
        {service?.serviceType === 'package_base' && service?.packages?.length > 0 && (
          <section className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Packages</h2>
            </div>
            <div className="space-y-3">
              {service.packages.map((pkg, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`p-4 rounded-[24px] border-2 cursor-pointer transition-all flex items-center justify-between ${
                    selectedPackage?.title === pkg.title ? 'border-brand' : 'border-border-color hover:border-gray-300'
                  }`}
                  style={
                    selectedPackage?.title === pkg.title
                      ? { backgroundColor: 'rgba(255,159,69,0.1)' }
                      : { backgroundColor: 'var(--card-bg)' }
                  }
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-sm leading-tight" style={{ color: 'var(--text-primary)' }}>{pkg.title}</h3>
                      {pkg.isPopular && <span className="text-[9px] font-semibold uppercase bg-brand text-white px-2.5 py-0.5 rounded-full">Popular</span>}
                    </div>
                    {pkg.duration && <div className="text-[11px] font-semibold text-gray-400 mb-1.5 flex items-center gap-1"><FiClock /> {pkg.duration}</div>}
                    {pkg.description && <p className="text-[11px] font-normal leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{pkg.description}</p>}
                  </div>
                  
                  <div className="flex flex-col items-end shrink-0 gap-2">
                    <div className="text-right">
                      <div className="font-semibold text-sm text-brand">₹{pkg.price}</div>
                      {pkg.originalPrice && <div className="text-[11px] text-gray-400 line-through">₹{pkg.originalPrice}</div>}
                    </div>
                    <button
                      type="button"
                      className={`text-xs font-semibold px-4 py-1.5 rounded-full border transition-all ${
                        selectedPackage?.title === pkg.title 
                          ? 'text-white' 
                          : 'hover:bg-brand/5'
                      }`}
                      style={
                        selectedPackage?.title === pkg.title 
                          ? { backgroundColor: 'var(--primary)', borderColor: 'var(--primary)' }
                          : { borderColor: 'var(--primary)', color: 'var(--primary)', backgroundColor: 'transparent' }
                      }
                    >
                      {selectedPackage?.title === pkg.title ? 'Selected' : 'Select'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Package Customization Section */}
        {service?.serviceType === 'package_base' && selectedPackage && selectedPackage.allowUserEdit !== false && selectedPackage.includedItems && selectedPackage.includedItems.length > 0 && (
          <section className="mt-8 space-y-6">
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h2 className="text-[17px] font-bold" style={{ color: 'var(--text-primary)' }}>
                  Customize Package
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Customize individual options inside this combo package</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomizing(prev => !prev)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isCustomizing ? 'bg-violet-600' : 'bg-gray-200 dark:bg-zinc-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isCustomizing ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {isCustomizing ? (
              <div className="space-y-6">
                {(() => {
                  const renderedGroupIds = new Set();
                  return selectedPackage.includedItems.map((incItem, incIdx) => {
                    const groupId = incItem.serviceGroupId?.toString();
                    if (!groupId || renderedGroupIds.has(groupId)) return null;
                    renderedGroupIds.add(groupId);

                    const group = service.serviceGroups?.find(g => g._id?.toString() === groupId);
                    if (!group) return null;

                    const selectedId = customSelectedItems[groupId];

                    return (
                      <div key={incIdx} className="space-y-3">
                        <h3 className="text-[15px] font-bold text-gray-800 dark:text-zinc-100" style={{ color: 'var(--text-primary)' }}>
                          {group.title}
                        </h3>

                        <div className="space-y-3 pl-1">
                        {group.items?.map((item) => {
                          const isSelected = selectedId === item._id?.toString();
                          return (
                            <div
                              key={item._id}
                              onClick={() => {
                                setCustomSelectedItems(prev => ({
                                  ...prev,
                                  [groupId]: item._id?.toString()
                                }));
                              }}
                              className="flex items-center justify-between py-2 cursor-pointer group"
                            >
                              <div className="flex items-center gap-3">
                                <span 
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                                    isSelected 
                                      ? 'border-violet-600 dark:border-violet-500' 
                                      : 'border-gray-300 dark:border-zinc-700 group-hover:border-gray-400'
                                  }`}
                                >
                                  {isSelected && (
                                    <span className="w-2.5 h-2.5 rounded-full bg-violet-600 dark:bg-violet-500" />
                                  )}
                                </span>
                                <span className="text-[14px] font-medium text-gray-700 dark:text-zinc-300" style={{ color: 'var(--text-primary)' }}>
                                  {item.title}
                                </span>
                              </div>
                              <span className="text-[14px] font-bold text-gray-800 dark:text-zinc-200">
                                ₹{item.price}
                              </span>
                            </div>
                          );
                        })}

                        {group.allowSkip && (
                          <div
                            onClick={() => {
                              setCustomSelectedItems(prev => ({
                                ...prev,
                                [groupId]: 'skip'
                              }));
                            }}
                            className="flex items-center justify-between py-2 cursor-pointer group"
                          >
                            <div className="flex items-center gap-3">
                              <span 
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                                  selectedId === 'skip' 
                                    ? 'border-violet-600 dark:border-violet-500' 
                                    : 'border-gray-300 dark:border-zinc-700 group-hover:border-gray-400'
                                }`}
                              >
                                {selectedId === 'skip' && (
                                  <span className="w-2.5 h-2.5 rounded-full bg-violet-600 dark:bg-violet-500" />
                                )}
                              </span>
                              <span className="text-[14px] font-medium text-red-500 dark:text-red-400">
                                I don't need {group.title.toLowerCase()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
              </div>
            ) : (
              <div className="py-2 space-y-3">
                <p className="text-xs text-gray-500">This combo package standardly includes the following items at a discounted rate:</p>
                {selectedPackage.includedItems.map((incItem, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-semibold text-gray-600 dark:text-zinc-300">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{incItem.serviceGroupTitle}: <span className="font-bold text-gray-800 dark:text-zinc-100">{incItem.selectedItemTitle}</span></span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Subscriptions Section */}
        {service?.serviceType === 'subscription_base' && service?.packages?.length > 0 && (
          <section className="mt-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[17px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Choose Subscription Plan</h2>
            </div>
            <div className="space-y-4">
              {service.packages.map((pkg, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`p-5 rounded-[28px] border-2 cursor-pointer transition-all flex flex-col gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.01)] ${
                    selectedPackage?.title === pkg.title ? 'border-violet-500 shadow-[0_8px_30px_rgba(109,40,217,0.05)]' : 'border-border-color hover:border-violet-300'
                  }`}
                  style={
                    selectedPackage?.title === pkg.title
                      ? { backgroundColor: 'rgba(109,40,217,0.03)' }
                      : { backgroundColor: 'var(--card-bg)' }
                  }
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-base leading-tight text-violet-800">{pkg.title}</h3>
                        {pkg.isPopular && <span className="text-[9px] font-bold uppercase bg-violet-600 text-white px-2.5 py-0.5 rounded-full">Recommended Plan</span>}
                      </div>
                      <div className="text-[11px] font-semibold text-gray-500 flex items-center gap-1"><FiClock /> Validity: {pkg.duration || '30 Days'}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-extrabold text-lg text-violet-700">₹{pkg.price}</div>
                      {pkg.originalPrice && <div className="text-xs text-gray-400 line-through">₹{pkg.originalPrice}</div>}
                    </div>
                  </div>

                  {/* Predefined benefits displays */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-violet-50/30 rounded-2xl border border-violet-100/20 text-xs font-semibold text-gray-700">
                    <div className="flex items-center gap-1.5">
                      <FiCheckCircle className="text-violet-600 shrink-0 w-3.5 h-3.5" />
                      <span>{pkg.visitsCredits || 4} Visits {pkg.visitFrequency ? `(${pkg.visitFrequency})` : 'Included'}</span>
                    </div>
                    {pkg.bookingDiscount > 0 && (
                      <div className="flex items-center gap-1.5">
                        <FiCheckCircle className="text-violet-600 shrink-0 w-3.5 h-3.5" />
                        <span>{pkg.bookingDiscount}% Extra Discount</span>
                      </div>
                    )}
                    {pkg.freeInspection && (
                      <div className="flex items-center gap-1.5">
                        <FiCheckCircle className="text-violet-600 shrink-0 w-3.5 h-3.5" />
                        <span>Free Inspection/Checkup</span>
                      </div>
                    )}
                    {pkg.prioritySupport && (
                      <div className="flex items-center gap-1.5">
                        <FiCheckCircle className="text-violet-600 shrink-0 w-3.5 h-3.5" />
                        <span>Priority Support</span>
                      </div>
                    )}
                    {pkg.memberPricing && (
                      <div className="flex items-center gap-1.5">
                        <FiCheckCircle className="text-violet-600 shrink-0 w-3.5 h-3.5" />
                        <span>Special Member Prices</span>
                      </div>
                    )}
                  </div>

                  {pkg.description && <p className="text-[11px] font-normal leading-relaxed text-gray-500">{pkg.description}</p>}

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      className={`text-xs font-bold px-5 py-1.5 rounded-full border transition-all ${
                        selectedPackage?.title === pkg.title 
                          ? 'text-white bg-violet-600 border-violet-600' 
                          : 'text-violet-600 border-violet-600 hover:bg-violet-50'
                      }`}
                    >
                      {selectedPackage?.title === pkg.title ? 'Selected' : 'Select Plan'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

          {fields.filter(f => f.showToUser !== false).length > 0 && (
            <section className="mt-3 py-2 px-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="p-1.5 bg-orange-50 text-brand rounded-lg">
                  <FiSliders className="w-5 h-5" />
                </span>
                <h2 className="text-xl font-normal" style={{ color: 'var(--text-primary)' }}>Custom Options</h2>
              </div>

              <div className="space-y-4">
                {fields.filter(f => f.showToUser !== false).map((field) => {
                  const value = dynamicAnswers[field.name] || '';
                  return (
                    <div key={field._id || field.name} className="space-y-1">
                      <label className="block text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        {field.label} {field.isRequired && <span className="text-red-500">*</span>}
                      </label>

                      {/* Render inputs based on type */}
                      {field.fieldType === 'text' && (
                        <input
                          type="text"
                          className="w-full p-2.5 border rounded-xl text-sm focus:ring-1 focus:ring-orange-300 outline-none"
                          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                          value={value}
                          onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [field.name]: e.target.value }))}
                          required={field.isRequired}
                        />
                      )}

                      {field.fieldType === 'number' && (
                        <input
                          type="number"
                          className="w-full p-2.5 border rounded-xl text-sm focus:ring-1 focus:ring-orange-300 outline-none"
                          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                          value={value}
                          onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [field.name]: e.target.value }))}
                          required={field.isRequired}
                        />
                      )}

                      {field.fieldType === 'textarea' && (
                        <textarea
                          className="w-full p-2.5 border rounded-xl text-sm focus:ring-1 focus:ring-orange-300 outline-none"
                          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                          rows={3}
                          value={value}
                          onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [field.name]: e.target.value }))}
                          required={field.isRequired}
                        />
                      )}

                      {field.fieldType === 'dropdown' && (
                        <select
                          className="w-full p-2.5 border rounded-xl text-sm focus:ring-1 focus:ring-orange-300 outline-none"
                          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                          value={value}
                          onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [field.name]: e.target.value }))}
                          required={field.isRequired}
                        >
                          <option value="" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>Select Option</option>
                          {(field.options || []).map(opt => (
                            <option key={opt} value={opt} style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' }}>{opt}</option>
                          ))}
                        </select>
                      )}

                      {field.fieldType === 'radio' && (
                        <div className="flex flex-wrap gap-3 pt-1">
                          {(field.options || []).map(opt => (
                            <label key={opt} className="flex items-center gap-1.5 text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                              <input
                                type="radio"
                                name={field.name}
                                value={opt}
                                checked={value === opt}
                                onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [field.name]: e.target.value }))}
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      )}

                      {field.fieldType === 'checkbox' && (
                        <label className="flex items-center gap-2 py-1 text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                          <input
                            type="checkbox"
                            checked={!!value}
                            onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [field.name]: e.target.checked }))}
                          />
                          Enable this Option
                        </label>
                      )}

                      {field.fieldType === 'date' && (
                        <input
                          type="date"
                          className="w-full p-2.5 border rounded-xl text-sm focus:ring-1 focus:ring-orange-300 outline-none"
                          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                          value={value}
                          onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [field.name]: e.target.value }))}
                          required={field.isRequired}
                        />
                      )}

                      {field.fieldType === 'time' && (
                        <input
                          type="time"
                          className="w-full p-2.5 border rounded-xl text-sm focus:ring-1 focus:ring-orange-300 outline-none"
                          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                          value={value}
                          onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [field.name]: e.target.value }))}
                          required={field.isRequired}
                        />
                      )}

                      {/* File / Image Uploader with progress indicator */}
                      {(field.fieldType === 'image' || field.fieldType === 'file') && (
                        <div className="flex flex-col gap-2 pt-1">
                          <input
                            type="file"
                            accept={field.fieldType === 'image' ? 'image/*' : '*'}
                            disabled={uploadingFiles[field.name]}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleFileUpload(field.name, e.target.files[0]);
                              }
                            }}
                            className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-brand hover:file:bg-orange-100/50"
                          />
                          {uploadingFiles[field.name] && <p className="text-[10px] text-brand animate-pulse">Uploading file...</p>}
                          {value && (
                            <div className="flex items-center gap-2 p-1.5 rounded-lg border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                              <span className="text-[10px] text-green-700 font-bold bg-green-50 px-1.5 py-0.5 rounded border border-green-100">UPLOADED</span>
                              <a href={value} target="_blank" rel="noreferrer" className="text-xs text-orange-500 hover:underline truncate flex-1">{value}</a>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Location Picker */}
                      {field.fieldType === 'location' && (
                        <div className="flex gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="Latitude, Longitude coordinates"
                            className="flex-1 p-2.5 border rounded-xl text-sm focus:ring-1 focus:ring-orange-300 outline-none"
                            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                            value={value}
                            onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [field.name]: e.target.value }))}
                            required={field.isRequired}
                          />
                          <button
                            type="button"
                            onClick={() => fetchCurrentLocation(field.name)}
                            className="px-3 bg-orange-50 hover:bg-orange-100/50 text-brand rounded-xl text-xs font-semibold border border-orange-100"
                          >
                            Locate Me
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}


          {/* DYNAMIC PAGE BLOCKS */}
          {pageBlocks.length > 0 ? (
            <div className="mt-6 space-y-6">
              {pageBlocks.filter(b => b.isVisible && b.blockType !== 'banner_slider').map((block, i) => {
                const data = block.data || {};
                switch (block.blockType) {
                  case 'heading_text':
                    return (
                      <section key={i} className="mt-8 py-4 px-4 rounded-3xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                        <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{data.heading}</h2>
                        <p className="mt-2 text-sm leading-6 whitespace-pre-line font-normal" style={{ color: 'var(--text-secondary)' }}>{data.text}</p>
                      </section>
                    );
                  case 'image_gallery':
                    return (
                      <section key={i} className="mt-8 py-4 px-4 rounded-3xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                        <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Gallery</h2>
                        <div className="grid grid-cols-3 gap-2">
                          {(data.images || []).map((img, imgIdx) => (
                            <div key={imgIdx} className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border" style={{ borderColor: 'var(--border)' }}>
                              <img src={toAssetUrl(img)} alt="" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  case 'banner_slider':
                    return (
                      <section key={i} className="mt-8 overflow-hidden rounded-3xl">
                        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2">
                          {(data.banners || []).map((banner, bIdx) => (
                            <div key={bIdx} className="w-full aspect-[21/9] shrink-0 snap-start rounded-3xl overflow-hidden bg-gray-100 border" style={{ borderColor: 'var(--border)' }}>
                              <img src={toAssetUrl(banner)} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  case 'warranty':
                    return (
                      <section key={i} className="mt-8 py-4 px-4 rounded-3xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-orange-100/50 p-2.5 text-brand"><FiShield /></div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">{data.duration} Warranty</p>
                            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{data.title}</h3>
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-relaxed font-normal" style={{ color: 'var(--text-secondary)' }}>{data.description}</p>
                      </section>
                    );
                  case 'whats_included':
                    return (
                      <section key={i} className="mt-8 py-4 px-4 rounded-3xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Included</p>
                        <h2 className="mt-1 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{data.title}</h2>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {(data.items || []).map((item, idx) => (
                            <span key={idx} className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-brand border border-orange-200">
                              <FiCheckCircle /> {item}
                            </span>
                          ))}
                        </div>
                      </section>
                    );
                  case 'process':
                  case 'how_it_works':
                    return (
                      <section key={i} className="mt-8 py-4 px-4 rounded-3xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Process</p>
                        <h2 className="mt-1 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{data.title}</h2>
                        <div className="mt-4 space-y-3">
                          {(data.steps || []).map((step, idx) => {
                            if (!step) return null;
                            const title = typeof step === 'object' ? step.title : step;
                            const desc = typeof step === 'object' ? step.desc : '';
                            const imageUrl = typeof step === 'object' ? step.imageUrl : '';
                            return (
                              <div key={idx} className="flex gap-4 rounded-2xl border border-red-100/30 bg-white p-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.01)] items-center">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-brand to-brand-dark text-xs font-semibold text-white">{idx + 1}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-sm" style={{ color: '#111827' }}>{title}</div>
                                  {desc && <p className="text-xs mt-0.5 leading-relaxed font-normal" style={{ color: '#4b5563' }}>{desc}</p>}
                                </div>
                                {data.hasImages && imageUrl && (
                                  <img src={toAssetUrl(imageUrl)} alt="" className="w-12 h-12 rounded-xl object-cover border border-gray-100 shrink-0" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    );
                  case 'please_note':
                    return (
                      <section key={i} className="mt-8 py-4 px-4 rounded-3xl" style={{ backgroundColor: 'rgba(217,119,6,0.05)', border: '1px solid rgba(217,119,6,0.2)' }}>
                        <div className="flex items-center gap-2">
                          <FiInfo className="text-amber-600 w-5 h-5" />
                          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{data.title}</h2>
                        </div>
                        <ul className="mt-3 list-inside list-disc space-y-1 text-xs leading-relaxed font-normal" style={{ color: 'var(--text-secondary)' }}>
                          {(data.notes || []).map((note, idx) => (
                            <li key={idx}>{note}</li>
                          ))}
                        </ul>
                      </section>
                    );
                  case 'faq':
                    return (
                      <section key={i} className="mt-8 py-4 px-4 rounded-3xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                        <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>FAQ</h2>
                        <div className="mt-4 space-y-3">
                          {(data.faqs || []).map((faq, idx) => (
                            <div key={idx} className="rounded-2xl border p-3.5 shadow-[0_2px_8px_rgba(0,0,0,0.005)]" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
                              <h4 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{faq.question}</h4>
                              <p className="mt-1 text-xs leading-relaxed font-normal" style={{ color: 'var(--text-secondary)' }}>{faq.answer}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  case 'reviews':
                    return (
                      <section key={i} className="mt-8 py-4 px-4 rounded-3xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                        <h2 className="text-base font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Customer Reviews</h2>
                        <div className="space-y-3">
                          {[
                            { name: 'Rohan Sharma', rating: 5, comment: 'Excellent service! Highly professional and very clean work.' },
                            { name: 'Priya Patel', rating: 4, comment: 'Very polite and on time. Satisfied with the results.' }
                          ].slice(0, data.showCount || 5).map((rev, rIdx) => (
                            <div key={rIdx} className="p-3.5 rounded-2xl border" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-semibold text-xs text-gray-800 dark:text-zinc-100">{rev.name}</span>
                                <div className="flex items-center gap-0.5 text-xs text-amber-500">
                                  <FiStar className="fill-amber-500" />
                                  <span>{rev.rating}</span>
                                </div>
                              </div>
                              <p className="text-xs leading-relaxed font-normal" style={{ color: 'var(--text-secondary)' }}>{rev.comment}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  case 'brands':
                    return (
                      <section key={i} className="mt-8 py-4 px-4 rounded-3xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                        <h2 className="text-xs font-semibold uppercase tracking-[0.24em] text-brand mb-2">{data.title || 'Brands We Service'}</h2>
                        <div className="flex flex-wrap gap-2.5">
                          {(data.brandIds || []).map((brandId, bIdx) => (
                            <span key={bIdx} className="px-3.5 py-1.5 rounded-full border bg-white dark:bg-zinc-900 text-xs font-bold text-gray-700 dark:text-zinc-300" style={{ borderColor: 'var(--border)' }}>
                              {brandId}
                            </span>
                          ))}
                        </div>
                      </section>
                    );
                  case 'whats_not_included':
                    return (
                      <section key={i} className="mt-8 py-4 px-4 rounded-3xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-500">Not Included</p>
                        <h2 className="mt-1 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{data.title || "What's Not Included"}</h2>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {(data.items || []).map((item, idx) => (
                            <span key={idx} className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-red-500 border border-red-200">
                              <FiX className="w-3.5 h-3.5" /> {item}
                            </span>
                          ))}
                        </div>
                      </section>
                    );
                  case 'rate_card':
                    return (
                      <section key={i} className="mt-8 py-4 px-4 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-3" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                        <div>
                          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{data.linkLabel || 'Rate Card'}</h3>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Check standard rates for our services.</p>
                        </div>
                        {data.linkUrl && (
                          <a href={data.linkUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all">
                            {data.linkLabel || 'View Rate Card'}
                          </a>
                        )}
                      </section>
                    );
                  case 'comparison':
                    return (
                      <section key={i} className="mt-8 py-4 px-4 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-3" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                        <div>
                          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{data.title || 'Compare Plans'}</h3>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Compare parameters to choose the best option.</p>
                        </div>
                        {data.linkUrl && (
                          <a href={data.linkUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all">
                            {data.linkLabel || 'View Comparison'}
                          </a>
                        )}
                      </section>
                    );
                  case 'offer_image':
                    return (
                      <section key={i} className="mt-8 rounded-3xl overflow-hidden bg-gray-50 border border-gray-150 relative">
                        {data.linkUrl ? (
                          <a href={data.linkUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
                            <img src={toAssetUrl(data.imageUrl)} alt={data.altText || 'Special Offer'} className="w-full h-auto object-cover" />
                          </a>
                        ) : (
                          <img src={toAssetUrl(data.imageUrl)} alt={data.altText || 'Special Offer'} className="w-full h-auto object-cover" />
                        )}
                      </section>
                    );
                  default:
                    return null;
                }
              })}
            </div>
          ) : (
            <>
              <section className="mt-8 py-4 px-4 rounded-3xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Included</p>
                <h2 className="mt-1 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>What you get</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {features.length > 0 ? features.map((feature, idx) => (
                    <span key={idx} className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-brand border border-orange-200">
                      <FiCheckCircle /> {feature}
                    </span>
                  )) : <span className="text-xs text-gray-500">No included features listed.</span>}
                </div>
              </section>

              <section className="mt-8 py-4 px-4 rounded-3xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Process</p>
                <h2 className="mt-1 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>How it works</h2>
                <div className="mt-4 space-y-3">
                  {steps.length > 0 ? steps.map((step, index) => {
                    const stepTitle = typeof step === 'object' ? step.title : step;
                    const stepDesc = typeof step === 'object' ? step.desc : 'Smooth and transparent service delivery.';
                    return (
                      <div key={index} className="flex gap-4 rounded-2xl border border-red-100/30 bg-white p-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-brand to-brand-dark text-xs font-semibold text-white">{index + 1}</div>
                        <div>
                          <div className="font-semibold text-sm" style={{ color: '#111827' }}>{stepTitle}</div>
                          <p className="text-xs mt-0.5 leading-relaxed font-normal" style={{ color: '#4b5563' }}>{stepDesc}</p>
                        </div>
                      </div>
                    );
                  }) : <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-4 text-xs text-gray-500">No steps listed for this service.</div>}
                </div>
              </section>

              <section className="mt-8 py-4 px-4 rounded-3xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-orange-100/50 p-2.5 text-brand"><FiShield /></div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Professional badge</p>
                    <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Verified Professional</h3>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed font-normal" style={{ color: 'var(--text-secondary)' }}>Certified experts, clean work, and support-backed service experience.</p>
              </section>
            </>
          )}


          <section className="mt-3 py-2 px-1">
            <p className="text-xs font-normal tracking-[0.1em]" style={{ color: 'var(--text-muted)' }}>Reviews</p>
            <h2 className="text-base font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>User feedback</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-3xl border border-dashed p-5 text-sm md:col-span-3 font-normal" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>No reviews available yet.</div>
            </div>
          </section>
        </div>

      {/* Variant Selection Popup */}
      <AnimatePresence>
        {showVariantPopup && (
          <>
            {/* Backdrop */}
            <motion.div
              key="variant-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowVariantPopup(false)}
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
                  onClick={() => setShowVariantPopup(false)}
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
                  {variants.map((variant, idx) => {
                    const isSelected = selectedVariants.some(v => (v._id || v.title) === (variant._id || variant.title));
                    const color = cardColors[idx % cardColors.length];
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
                    <span className="font-semibold" style={{ color: isDark ? '#F8FAFC' : '#1F2937' }}>₹{calculatedPrice}</span>
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
                    <span className="font-bold text-base text-brand">₹{finalPrice}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAdd}
                  className="w-full py-3.5 rounded-2xl font-semibold text-white text-sm shadow-lg transition-transform hover:scale-[1.01]"
                  style={{ background: 'linear-gradient(to right, var(--primary), var(--primary-dark, #e08a30))' }}
                >
                  Add to Cart — ₹{finalPrice}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur-xl" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 rounded-[28px] border px-4 py-3 shadow-[0_12px_30px_rgba(255,159,69,0.08)]" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
          <div>
            <div className="text-[11px] font-normal tracking-[0.1em]" style={{ color: 'var(--text-muted)' }}>
              Price {service.serviceType === 'minute_base' && `(${selectedDuration} Mins)`}
              {selectedVariants.length > 0 && ` + ${selectedVariants.length} add-on${selectedVariants.length > 1 ? 's' : ''}`}
            </div>
            <PriceTag price={finalPrice} originalPrice={service.originalPrice} className="mt-1" />
          </div>
          <button type="button" onClick={handleAdd} className="rounded-2xl bg-gradient-to-r from-brand to-brand-dark px-5 py-3 text-sm font-normal text-white shadow-lg transition-transform hover:scale-[1.02]">
            {service.serviceType === 'image_base' ? 'Add Selected to Cart' : (variants.length > 0 ? 'Select & Add' : 'Add to cart')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumServiceDetailPage;
