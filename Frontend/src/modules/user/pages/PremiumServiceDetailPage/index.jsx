import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiHeart, FiShare2, FiShield, FiStar, FiClock, FiCheckCircle, FiSliders, FiInfo, FiUpload, FiPlus, FiMinus, FiX, FiFolder, FiChevronDown, FiChevronUp, FiChevronLeft, FiChevronRight, FiCheck, FiAward, FiSmile, FiShoppingBag } from 'react-icons/fi';
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
  const { addToCart, updateItem, removeItem, cartCount, cartItems = [] } = useCart();

  const [service, setService] = useState(location.state?.service || null);
  const brand = location.state?.brand || null;
  const category = location.state?.category || null;

  const [pageBlocks, setPageBlocks] = useState([]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [activeItemDescModal, setActiveItemDescModal] = useState(null);
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
    } else if (service?.iconUrl) {
      rawImages = [service.iconUrl];
    } else {
      rawImages = [getDetailDummyImage(service?.title)];
    }
    return rawImages.map(img => ({ url: toAssetUrl(img), type: 'image' }));
  }, [service, pageBlocks]);

  // Auto-scroll images every 3 seconds if not playing a video
  useEffect(() => {
    if (serviceImages.length <= 1) return;
    const isVideo = serviceImages[activeImageIndex]?.type === 'video';
    if (isVideo && isPlaying) return;

    const timer = setInterval(() => {
      setActiveImageIndex((prev) => (prev + 1) % serviceImages.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [serviceImages, activeImageIndex, isPlaying]);

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
  const [activeCategoryModal, setActiveCategoryModal] = useState(null);

  const handleIncreaseSubItem = async (subItem) => {
    // Sync with local page selections
    const groupId = activeCategoryModal?._id?.toString();
    if (groupId) {
      const updatedSelections = { ...customSelectedItems };
      updatedSelections[groupId] = [subItem._id?.toString()];
      setCustomSelectedItems(updatedSelections);
      setIsCustomizing(true);
      setSelectedPackage(null);
    }

    const existing = cartItems.find(entry => entry.title === subItem.title && String(getCartItemServiceId(entry)) === String(service?._id || service?.id));
    if (existing) {
      await updateItem(existing._id || existing.id, (existing.serviceCount || 1) + 1);
    } else {
      const cartData = buildCartItemData({ service, category, brand });
      cartData.title = subItem.title;
      cartData.price = subItem.price;
      cartData.unitPrice = subItem.price;
      cartData.originalPrice = subItem.originalPrice || subItem.price;
      if (cartData.card) {
        cartData.card.title = subItem.title;
        cartData.card.price = subItem.price;
        cartData.card.originalPrice = subItem.originalPrice || subItem.price;
        cartData.card.description = subItem.description || '';
      }
      await addToCart(cartData);
    }
  };

  const handleDecreaseSubItem = async (subItem) => {
    const existing = cartItems.find(entry => entry.title === subItem.title && String(getCartItemServiceId(entry)) === String(service?._id || service?.id));
    if (!existing) return;
    
    const newCount = (existing.serviceCount || 1) - 1;
    if (newCount <= 0) {
      await removeItem(existing._id || existing.id);
      // Remove or set to skip locally
      const groupId = activeCategoryModal?._id?.toString();
      if (groupId) {
        const updatedSelections = { ...customSelectedItems };
        updatedSelections[groupId] = ['skip'];
        setCustomSelectedItems(updatedSelections);
      }
    } else {
      await updateItem(existing._id || existing.id, newCount);
    }
  };

  const handleIncreaseQuantity = async (itemId) => {
    const item = cartItems.find((entry) => (entry._id === itemId || entry.id === itemId));
    if (!item) return;
    await updateItem(item._id || item.id, (item.serviceCount || 1) + 1);
  };

  const handleDecreaseQuantity = async (itemId) => {
    const item = cartItems.find((entry) => (entry._id === itemId || entry.id === itemId));
    if (!item) return;
    if ((item.serviceCount || 1) <= 1) {
      await removeItem(item._id || item.id);
    } else {
      await updateItem(item._id || item.id, (item.serviceCount || 1) - 1);
    }
  };

  useEffect(() => {
    setIsCustomizing(false);
    if (!selectedPackage) {
      setCustomSelectedItems({});
    }
  }, [selectedPackage]);

  useEffect(() => {
    if (!isCustomizing && selectedPackage && selectedPackage.includedItems) {
      const initial = {};
      selectedPackage.includedItems.forEach(item => {
        if (item.serviceGroupId) {
          initial[item.serviceGroupId.toString()] = item.selectedItemId ? [item.selectedItemId.toString()] : [];
        }
      });
      setCustomSelectedItems(initial);
    }
  }, [isCustomizing, selectedPackage]);

  // Variants state
  const [variants, setVariants] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState([]);
  const [showVariantPopup, setShowVariantPopup] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});

  const toggleVariant = useCallback((variant) => {
    setSelectedVariants(prev => {
      const isSelected = prev.some(v => (v._id || v.title) === (variant._id || variant.title));
      if (isSelected) return prev.filter(v => (v._id || v.title) !== (variant._id || variant.title));
      return [...prev, { ...variant, quantity: 1 }];
    });
  }, []);

  const updateVariantQuantity = useCallback((variant, change) => {
    setSelectedVariants(prev => {
      const existingIndex = prev.findIndex(v => (v._id || v.title) === (variant._id || variant.title));
      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = (updated[existingIndex].quantity || 1) + change;
        if (newQty <= 0) {
          return prev.filter(v => (v._id || v.title) !== (variant._id || variant.title));
        } else {
          updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
          return updated;
        }
      } else if (change > 0) {
        return [...prev, { ...variant, quantity: 1 }];
      }
      return prev;
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

  const variantExtraTotal = selectedVariants.reduce((sum, v) => sum + (Number(v.extraPrice) || 0) * (v.quantity || 1), 0);
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

  const renderVariantsList = () => {
    if (variants.length === 0) return null;
    return (
      <div className="space-y-4 w-full px-0">
        <div className="space-y-3.5">
          {variants.map((variant, idx) => {
            const selectedEntry = selectedVariants.find(v => (v._id || v.title) === (variant._id || variant.title));
            const isSelected = !!selectedEntry;
            const qty = selectedEntry?.quantity || 0;
             return (
              <div
                key={variant._id || idx}
                className={`p-2 rounded-2xl flex items-center justify-between transition-all select-none border-2`}
                style={{
                  backgroundColor: isSelected ? 'rgba(179, 58, 53, 0.03)' : 'var(--card-bg)',
                  borderColor: 'var(--border)'
                }}
              >
                <div className="flex gap-3 items-center flex-1 pr-2 min-w-0">
                  {variant.iconUrl ? (
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-white shrink-0 border" style={{ borderColor: 'var(--border)' }}>
                      <img src={toAssetUrl(variant.iconUrl)} alt={variant.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-gray-50 dark:bg-zinc-800 border shrink-0 flex items-center justify-center text-2xl shadow-sm" style={{ borderColor: 'var(--border)' }}>
                      📦
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-semibold text-[12px]" style={{ color: 'var(--text-primary)' }}>{variant.title}</h4>
                    {variant.description && (
                      <p className="text-[10px] leading-relaxed max-w-xl mt-0.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                        {variant.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 gap-2.5 ml-2">
                  <div className="text-right">
                    <div className="font-semibold text-[12px] text-[#B33A35] dark:text-[#D56C67]">
                      ₹{(variant.extraPrice || 0) * (qty || 1)}
                    </div>
                    {qty > 1 && (
                      <div className="text-[9px] text-gray-400 mt-0.5">₹{variant.extraPrice} × {qty}</div>
                    )}
                  </div>
                  {isSelected ? (
                    <div className="flex items-center gap-0 rounded-xl bg-[#B33A35] text-white shadow-sm overflow-hidden border border-[#B33A35]">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); updateVariantQuantity(variant, -1); }}
                        className="w-7.5 h-7.5 flex items-center justify-center text-white text-xs font-semibold hover:bg-[#9E2E2A] transition-colors cursor-pointer"
                      >
                        −
                      </button>
                      <span className="w-7.5 h-7.5 flex items-center justify-center text-xs font-semibold text-white">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); updateVariantQuantity(variant, 1); }}
                        className="w-7.5 h-7.5 flex items-center justify-center text-white text-xs font-semibold hover:bg-[#9E2E2A] transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); updateVariantQuantity(variant, 1); }}
                      className="px-4 py-1.5 rounded-xl border-2 border-[#B33A35] text-[#B33A35] hover:bg-red-50/50 dark:hover:bg-red-950/20 text-xs font-semibold transition-all cursor-pointer"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const [uploadingFiles, setUploadingFiles] = useState({});
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [includedModalItems, setIncludedModalItems] = useState([]);
  const [includedModalTitle, setIncludedModalTitle] = useState('');
  const [expandedFaqIndex, setExpandedFaqIndex] = useState(null);

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
    if (service.serviceType === 'package_base') {
      if (selectedPackage && !isCustomizing) {
        // Otherwise, show the discounted combo package price
        basePrice = selectedPackage.price || 0;
      } else {
        // If user is customizing, or no package is selected, price is strictly the sum of selected items!
        let sumPrice = 0;
        Object.keys(customSelectedItems).forEach(groupId => {
          const selectedVal = customSelectedItems[groupId];
          const selectedIds = Array.isArray(selectedVal)
            ? selectedVal
            : (selectedVal ? [selectedVal.toString()] : []);

          selectedIds.forEach(selectedId => {
            if (selectedId && selectedId !== 'skip') {
              const group = service.serviceGroups?.find(g => g._id?.toString() === groupId);
              const selectedItem = group?.items?.find(i => i._id?.toString() === selectedId.toString());
              if (selectedItem) {
                sumPrice += Number(selectedItem.price || 0);
              }
            }
          });
        });
        basePrice = sumPrice;
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

  const getCartItemServiceId = (item) => {
    if (!item) return null;
    if (typeof item.serviceId === 'object' && item.serviceId) {
      return item.serviceId._id || item.serviceId.id;
    }
    return item.serviceId || item.id || item._id;
  };

  const getAddedPackageCount = (pkgTitle) => {
    if (!cartItems) return 0;
    const matchedItem = cartItems.find(item => {
      const sId = getCartItemServiceId(item);
      if (sId !== (service?._id || service?.id)) return false;
      const pkgField = item.dynamicFields?.find(f => f.name === 'Selected Package');
      return pkgField?.value === pkgTitle;
    });
    return matchedItem ? (matchedItem.serviceCount || 1) : 0;
  };

  const handleSelectPackage = async (pkg) => {
    if (!service) return;

    // Check if it is already added - if so, we can just do nothing or toggle select
    const addedCount = getAddedPackageCount(pkg.title);
    if (addedCount > 0) {
      return; // Already added
    }

    const dynamicFieldsPayload = [];
    dynamicFieldsPayload.push({
      name: 'Selected Package',
      label: 'Selected Package',
      value: pkg.title
    });

    if (pkg.includedItems && service.serviceGroups) {
      pkg.includedItems.forEach(incItem => {
        const groupId = incItem.serviceGroupId?.toString();
        const group = service.serviceGroups.find(g => g._id?.toString() === groupId);
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

    const cartData = buildCartItemData({ service, category, brand });
    cartData.card.title = `${service.title} - ${pkg.title}`;
    if (pkg.duration) cartData.card.duration = pkg.duration;
    
    // Set package price
    cartData.price = pkg.price;
    cartData.unitPrice = pkg.price;
    const baseOriginalPrice = Number(pkg.originalPrice || pkg.price || 0);
    cartData.originalPrice = baseOriginalPrice;
    if (cartData.card) {
      cartData.card.price = pkg.price;
      cartData.card.originalPrice = baseOriginalPrice;
    }
    cartData.dynamicFields = dynamicFieldsPayload;

    const response = await addToCart(cartData);
    if (response?.success) {
      toast.success(`${pkg.title} added to cart!`);
    }
  };

  const handleAdd = async () => {
    if (!service) return;

    // If variants exist, they select them inline directly on the page
    if (false && service?.serviceType !== 'image_base' && variants.length > 0 && !showVariantPopup) {
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
        value: selectedVariants.map(v => `${v.title} (x${v.quantity || 1})${v.extraPrice > 0 ? ` (+₹${v.extraPrice * (v.quantity || 1)})` : ''}`).join(', ')
      });
    }

    const cartData = buildCartItemData({ service, category, brand });
    if (service?.serviceType === 'package_base') {
      if (selectedPackage && !isCustomizing) {
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
              const selectedVal = customSelectedItems[groupId];
              const selectedIds = Array.isArray(selectedVal)
                ? selectedVal
                : (selectedVal ? [selectedVal.toString()] : []);

              if (selectedIds.includes('skip')) {
                dynamicFieldsPayload.push({
                  name: `Group: ${group.title}`,
                  label: group.title,
                  value: 'Skipped ("I don\'t need this")'
                });
              } else if (selectedIds.length > 0) {
                const itemTitles = [];
                selectedIds.forEach(id => {
                  const selectedItem = group.items?.find(i => i._id?.toString() === id.toString());
                  if (selectedItem) {
                    itemTitles.push(`${selectedItem.title} (₹${selectedItem.price})`);
                  }
                });
                if (itemTitles.length > 0) {
                  dynamicFieldsPayload.push({
                    name: `Group: ${group.title}`,
                    label: group.title,
                    value: itemTitles.join(', ')
                  });
                }
              }
            }
          });
        }
      } else {
        cartData.card.title = `${service.title} - Customized Items`;
        dynamicFieldsPayload.push({
          name: 'Selected Package',
          label: 'Selected Package',
          value: 'None (Custom Options Selection)'
        });
        if (service.serviceGroups) {
          service.serviceGroups.forEach(group => {
            const groupId = group._id?.toString();
            const selectedVal = customSelectedItems[groupId];
            const selectedIds = Array.isArray(selectedVal)
              ? selectedVal
              : (selectedVal ? [selectedVal.toString()] : []);

            if (selectedIds.includes('skip')) {
              dynamicFieldsPayload.push({
                name: `Group: ${group.title}`,
                label: group.title,
                value: 'Skipped ("I don\'t need this")'
              });
            } else if (selectedIds.length > 0) {
              const itemTitles = [];
              selectedIds.forEach(id => {
                const selectedItem = group.items?.find(i => i._id?.toString() === id.toString());
                if (selectedItem) {
                  itemTitles.push(`${selectedItem.title} (₹${selectedItem.price})`);
                }
              });
              if (itemTitles.length > 0) {
                dynamicFieldsPayload.push({
                  name: `Group: ${group.title}`,
                  label: group.title,
                  value: itemTitles.join(', ')
                });
              }
            }
          });
        }
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
  const renderBlockContent = (block, isMobile = false) => {
    if (!block) return null;
    const data = block.data || {};
    switch (block.blockType) {
      case 'whats_included': {
        const itemsList = data.items || [];
        const limit = isMobile ? 2 : 4;
        const visibleItems = itemsList.slice(0, limit);
        const hasMore = itemsList.length > limit;
        return (
          <div className="lg:p-6 lg:bg-white lg:dark:bg-zinc-900 lg:border lg:border-gray-100 lg:dark:border-zinc-800 lg:rounded-3xl lg:shadow-[0_4px_20px_rgba(0,0,0,0.01)] h-full flex flex-col justify-start w-full">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <FiCheckCircle className="text-green-500 w-5 h-5 shrink-0" />
                <h4 className="text-sm lg:text-base font-black text-slate-800 dark:text-zinc-200">{data.title || "What's Included"}</h4>
              </div>
              <div className="space-y-3">
                {visibleItems.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start p-3.5 bg-slate-50/50 dark:bg-zinc-800/30 rounded-2xl border border-slate-100 dark:border-zinc-800 transition-all hover:bg-slate-50">
                    <FiCheckCircle className="text-emerald-500 w-4 h-4 shrink-0 mt-0.5" />
                    <span className="text-xs font-semibold text-slate-650 dark:text-zinc-350 leading-relaxed">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {hasMore && (
              <button
                type="button"
                onClick={() => {
                  setIncludedModalItems(itemsList);
                  setIncludedModalTitle(data.title || "What's Included");
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline mt-2 self-start cursor-pointer transition-all"
              >
                Show more (+{itemsList.length - limit})
              </button>
            )}
          </div>
        );
      }
      case 'process':
      case 'how_it_works':
        return (
          <div className="lg:p-5 lg:bg-white lg:dark:bg-zinc-900 lg:border lg:border-gray-100 lg:dark:border-zinc-800 lg:rounded-3xl lg:shadow-[0_4px_20px_rgba(0,0,0,0.01)] h-full w-full">
            <div className="flex items-center gap-2">
              <FiClock className="text-amber-500 w-4 h-4 shrink-0" />
              <h4 className="text-sm lg:text-base font-black text-slate-800 dark:text-zinc-200">{data.title || 'How it works'}</h4>
            </div>
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 mt-3.5 pb-4">
              {(data.steps || []).map((step, idx) => {
                const title = typeof step === 'object' ? step.title : step;
                const desc = typeof step === 'object' ? step.desc : '';
                return (
                  <div key={idx} className="flex gap-3 items-start text-[10px]">
                    <span className="text-[#B33A35] text-xs font-black shrink-0 mt-0.5">{idx + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 dark:text-zinc-200">{title}</div>
                      {desc && <p className="text-gray-400 mt-0.5 leading-normal">{desc}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      case 'warranty':
        return (
          <div className="lg:p-5 lg:bg-white lg:dark:bg-zinc-900 lg:border lg:border-gray-100 lg:dark:border-zinc-800 lg:rounded-3xl lg:shadow-[0_4px_20px_rgba(0,0,0,0.01)] h-full w-full">
            <div className="flex items-center gap-2">
              <FiShield className="text-blue-500 w-4 h-4 shrink-0" />
              <h4 className="text-sm lg:text-base font-black text-slate-800 dark:text-zinc-200">{data.duration || ''} Warranty</h4>
            </div>
            <p className="text-[10px] text-gray-400 leading-relaxed font-normal">
              {data.description}
            </p>
          </div>
        );
      case 'please_note':
        return (
          <div className="lg:p-5 lg:bg-white lg:dark:bg-zinc-900 lg:border lg:border-gray-100 lg:dark:border-zinc-800 lg:rounded-3xl lg:shadow-[0_4px_20px_rgba(0,0,0,0.01)] h-full w-full">
            <div className="flex items-center gap-2">
              <FiInfo className="text-amber-500 w-4 h-4 shrink-0" />
              <h4 className="text-sm lg:text-base font-black text-slate-800 dark:text-zinc-200">{data.title || 'Please Note'}</h4>
            </div>
            <ul className="list-inside list-disc space-y-1 text-[10px] leading-relaxed font-normal text-gray-400">
              {(data.notes || []).map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          </div>
        );
      case 'reviews':
        return (
          <div className="lg:p-5 lg:bg-white lg:dark:bg-zinc-900 lg:border lg:border-gray-100 lg:dark:border-zinc-800 lg:rounded-3xl lg:shadow-[0_4px_20px_rgba(0,0,0,0.01)] h-full w-full">
            <div className="flex items-center gap-2">
              <FiStar className="text-purple-500 w-4 h-4 shrink-0" />
              <h4 className="text-sm lg:text-base font-black text-slate-800 dark:text-zinc-200">User feedback</h4>
            </div>
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {(data.reviews || []).map((rev, idx) => (
                <div key={idx} className="border-b last:border-0 pb-2 last:pb-0 text-[10px]">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">{rev.userName || 'Anonymous'}</span>
                    <span className="text-gray-400 text-[9px]">{rev.rating || 5}★</span>
                  </div>
                  <p className="text-gray-400 mt-1 leading-normal">{rev.comment}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'before_after':
        return (
          <div className="lg:p-5 lg:bg-white lg:dark:bg-zinc-900 lg:border lg:border-gray-100 lg:dark:border-zinc-800 lg:rounded-3xl lg:shadow-[0_4px_20px_rgba(0,0,0,0.01)] h-full w-full">
            {data.title && <h4 className="text-sm lg:text-base font-black text-slate-800 dark:text-zinc-200">{data.title}</h4>}
            <div className="grid grid-cols-2 gap-4">
              {data.beforeImage && (
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border" style={{ borderColor: 'var(--border)' }}>
                  <img src={toAssetUrl(data.beforeImage)} alt="Before" className="w-full h-full object-cover" />
                  <span className="absolute top-2 right-2 bg-black/70 text-white text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-lg backdrop-blur-xs">Before</span>
                </div>
              )}
              {data.afterImage && (
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 border" style={{ borderColor: 'var(--border)' }}>
                  <img src={toAssetUrl(data.afterImage)} alt="After" className="w-full h-full object-cover" />
                  <span className="absolute top-2 right-2 bg-green-600/90 text-white text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-lg shadow-sm">After</span>
                </div>
              )}
            </div>
          </div>
        );
      case 'heading_text':
        return (
          <div className="lg:p-5 lg:bg-white lg:dark:bg-zinc-900 lg:border lg:border-gray-100 lg:dark:border-zinc-800 lg:rounded-3xl lg:shadow-[0_4px_20px_rgba(0,0,0,0.01)] h-full w-full">
            <h4 className="text-sm lg:text-base font-black text-slate-800 dark:text-zinc-200">{data.heading}</h4>
            <p className="text-[10px] text-gray-400 leading-relaxed font-normal whitespace-pre-line">{data.text}</p>
          </div>
        );
      case 'image_gallery': {
        const imagesList = data.images || [];
        const total = imagesList.length;
        const visibleImages = imagesList.slice(0, 6);
        return (
          <div className="lg:p-5 lg:bg-white lg:dark:bg-zinc-900 lg:border lg:border-gray-100 lg:dark:border-zinc-800 lg:rounded-3xl lg:shadow-[0_4px_20px_rgba(0,0,0,0.01)] h-full w-full">
            <h4 className="text-sm lg:text-base font-black text-slate-800 dark:text-zinc-200">Gallery</h4>
            <div className="grid grid-cols-3 gap-2">
              {visibleImages.map((img, imgIdx) => {
                const isLast = imgIdx === 5 && total > 6;
                return (
                  <div
                    key={imgIdx}
                    onClick={() => {
                      setLightboxImages(imagesList.map(toAssetUrl));
                      setLightboxIndex(imgIdx);
                    }}
                    className="aspect-square rounded-2xl overflow-hidden bg-gray-100 border cursor-pointer relative group"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <img src={toAssetUrl(img)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    {isLast && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-base font-black">
                        +{total - 5}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
      case 'faq':
        return (
          <div className="lg:p-6 lg:bg-white lg:dark:bg-zinc-900 lg:border lg:border-gray-100 lg:dark:border-zinc-800 lg:rounded-3xl lg:shadow-[0_4px_20px_rgba(0,0,0,0.01)] h-full w-full">
            <h4 className="text-sm lg:text-base font-black text-slate-800 dark:text-zinc-200">FAQ</h4>
            <div className="space-y-3">
              {(data.faqs || []).map((faq, idx) => {
                const isOpen = expandedFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="border-b last:border-b-0 border-gray-100 dark:border-zinc-800 pb-3 last:pb-0 transition-all duration-200"
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedFaqIndex(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between gap-3 text-left py-2 focus:outline-none cursor-pointer group"
                    >
                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 transition-colors group-hover:text-[#B33A35]">
                        {faq.question}
                      </span>
                      <span className="p-1 rounded-full bg-slate-50 dark:bg-zinc-800 shrink-0 text-slate-500 transition-transform duration-200">
                        {isOpen ? <FiChevronUp className="w-3.5 h-3.5" /> : <FiChevronDown className="w-3.5 h-3.5" />}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="mt-2 text-[11px] leading-relaxed font-semibold text-slate-500 dark:text-zinc-400 pl-1 transition-all">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-auto pb-12 lg:pb-16" style={{ backgroundColor: 'var(--background)' }}>
      {/* 1. MOBILE FLOW */}
      <div className="lg:hidden">
        {/* Header Image Section with Full-Bleed style on mobile */}
        <div
          className="relative w-full h-[180px] md:h-[320px] lg:h-[460px] overflow-hidden bg-gray-100 shadow-sm select-none"
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
          className="absolute left-4 top-4 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 dark:bg-zinc-900/90 text-slate-900 dark:text-zinc-100 shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <FiArrowLeft className="w-3.5 h-3.5" />
        </button>


        {/* Progress Bar / Dots (Dynamic: shows only if more than 1 image) */}
        {serviceImages.length > 1 && (
          <div className="absolute bottom-4 left-5 flex gap-1.5 z-20">
            {serviceImages.map((_, dotIdx) => (
              <button
                key={dotIdx}
                type="button"
                onClick={() => setActiveImageIndex(dotIdx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${activeImageIndex === dotIdx ? 'w-8 bg-brand' : 'w-2 bg-white/40 hover:bg-white/60'
                  }`}
                aria-label={`Go to slide ${dotIdx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-lg lg:max-w-2xl px-5 pt-4 md:pt-6 pb-4">
        {/* Title, Rating, and Description */}
        <div className="space-y-2">
          <h1 className="text-base font-semibold tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
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
          <div className="mt-5 md:mt-8 space-y-3 md:space-y-4">
            <h2 className="text-base font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Service Categories
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {service.serviceGroups.map((group, idx) => {
                const colors = cardColors[idx % cardColors.length];
                return group.iconUrl ? (
                  <div
                    key={group._id || idx}
                    onClick={() => setActiveCategoryModal(group)}
                    className="relative rounded-xl overflow-hidden cursor-pointer select-none transition-all duration-200 hover:scale-[1.04] hover:shadow-md"
                    style={{ minHeight: '76px', borderColor: 'var(--border)', border: '1px solid var(--border)' }}
                  >
                    <img
                      src={toAssetUrl(group.iconUrl)}
                      alt={group.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="relative z-10 flex flex-col justify-end h-full p-2" style={{ minHeight: '76px' }}>
                      <span className="text-[10px] font-black text-white tracking-tight leading-tight line-clamp-2 drop-shadow">
                        {group.title}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    key={group._id || idx}
                    onClick={() => setActiveCategoryModal(group)}
                    className="flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all duration-200 hover:scale-[1.04] hover:shadow-md cursor-pointer select-none"
                    style={{
                      backgroundColor: colors.bg,
                      borderColor: colors.border,
                      minHeight: '76px'
                    }}
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/90 flex items-center justify-center mb-1 shadow-sm shrink-0">
                      <span className="text-xs font-black" style={{ color: colors.text }}>
                        {group.title ? group.title[0].toUpperCase() : 'S'}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold tracking-tight leading-tight line-clamp-2" style={{ color: colors.text }}>
                      {group.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Service Variants styled like the features grid */}


        {/* Pricing / Duration Base */}

        {service?.serviceType === 'minute_base' && (
          <section className="mt-5 md:mt-8 py-4 px-4 rounded-3xl" style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
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
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${selectedDuration === mins ? 'border-brand font-semibold shadow-sm' : ''
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
        {false && service?.serviceType === 'package_base' && service?.packages?.length > 0 && (
          <section className="mt-5 md:mt-8 space-y-3 md:space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Packages</h2>
            </div>
            <div className="space-y-3">
              {service.packages.filter(p => !p.title?.toLowerCase().includes('combo') && !p.title?.toLowerCase().includes('packege combo') && p.title !== 'Combos Packages').map((pkg, idx) => {
                const addedCount = getAddedPackageCount(pkg.title);
                const isPkgSelected = selectedPackage?.title === pkg.title;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (selectedPackage?.title === pkg.title && !isCustomizing) {
                        setSelectedPackage(null);
                      } else {
                        setSelectedPackage(pkg);
                        setIsCustomizing(false);
                      }
                    }}
                    className={`p-4 rounded-[24px] border-2 cursor-pointer transition-all flex items-center justify-between ${
                      addedCount > 0
                        ? 'border-emerald-500/30'
                        : isPkgSelected 
                        ? 'border-brand' 
                        : 'border-border-color hover:border-gray-300'
                    }`}
                    style={
                      addedCount > 0
                        ? { backgroundColor: 'rgba(16,185,129,0.04)' }
                        : isPkgSelected
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
                      {pkg.description && <p className="text-[11px] font-normal leading-relaxed animate-fade-in" style={{ color: 'var(--text-secondary)' }}>{pkg.description}</p>}
                      
                      {pkg.allowUserEdit !== false && pkg.includedItems?.length > 0 && (addedCount > 0 || isPkgSelected) && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPackage(pkg);
                            setIsCustomizing(true);
                            const el = document.getElementById('customize-package-section');
                            if (el) {
                              el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                          }}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 underline mt-2 inline-block cursor-pointer"
                        >
                          edit your packages
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col items-end shrink-0 gap-2">
                      <div className="text-right">
                        <div className="font-semibold text-sm text-brand">₹{pkg.price}</div>
                        {pkg.originalPrice && <div className="text-[11px] text-gray-400 line-through">₹{pkg.originalPrice}</div>}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (addedCount > 0) {
                            toast.success(`${pkg.title} is already in your cart!`);
                          } else {
                            handleSelectPackage(pkg);
                          }
                        }}
                        className={`text-xs font-semibold px-4 py-1.5 rounded-full border transition-all ${
                          addedCount > 0
                            ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                            : isPkgSelected
                            ? 'text-white'
                            : 'hover:bg-brand/5'
                        }`}
                        style={
                          addedCount > 0
                            ? {}
                            : isPkgSelected
                            ? { backgroundColor: 'var(--primary)', borderColor: 'var(--primary)' }
                            : { borderColor: 'var(--primary)', color: 'var(--primary)', backgroundColor: 'transparent' }
                        }
                      >
                        {addedCount > 0 ? 'Added ✓' : 'Select'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Package Included Items List Section */}
        {service?.serviceType === 'package_base' && (
          (selectedPackage && selectedPackage.includedItems && selectedPackage.includedItems.length > 0) ||
          (!selectedPackage && Object.keys(customSelectedItems).some(groupId => {
            const val = customSelectedItems[groupId];
            return val && val.length > 0 && !val.includes('skip');
          }))
        ) && (
          <section id="customize-package-section" className="mt-5 md:mt-8 space-y-4 md:space-y-6 scroll-mt-24">
            <div className="border-b pb-4" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-[17px] font-bold" style={{ color: 'var(--text-primary)' }}>
                {selectedPackage ? "Package Includes" : "Your Customized Selection"}
              </h2>
            </div>
            
            <div className="py-1 space-y-3">
              <div className="grid grid-cols-1 gap-2">
                {selectedPackage ? (
                  selectedPackage.includedItems.map((incItem, i) => {
                    const groupId = incItem.serviceGroupId?.toString();
                    const selectedVal = customSelectedItems[groupId];
                    const selectedIds = Array.isArray(selectedVal)
                      ? selectedVal
                      : (selectedVal ? [selectedVal.toString()] : []);
                    
                    let displayItemTitle = incItem.selectedItemTitle;
                    if (selectedIds.includes('skip')) {
                      displayItemTitle = 'Skipped ("I don\'t need this")';
                    } else if (selectedIds.length > 0) {
                      const group = service.serviceGroups?.find(g => g._id?.toString() === groupId);
                      const matched = group?.items?.find(item => item._id?.toString() === selectedIds[0]);
                      if (matched) {
                        displayItemTitle = matched.title;
                      }
                    }

                    return (
                      <div key={i} className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>
                          {incItem.serviceGroupTitle}:{' '}
                          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{displayItemTitle}</span>
                        </span>
                      </div>
                    );
                  })
                ) : (
                  service.serviceGroups.map((group, i) => {
                    const groupId = group._id?.toString();
                    const selectedVal = customSelectedItems[groupId];
                    const selectedIds = Array.isArray(selectedVal)
                      ? selectedVal
                      : (selectedVal ? [selectedVal.toString()] : []);
                    
                    if (selectedIds.length === 0 || selectedIds.includes('skip')) return null;
                    
                    const matched = group.items?.find(item => item._id?.toString() === selectedIds[0]);
                    if (!matched) return null;

                    return (
                      <div key={i} className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>
                          {group.title}:{' '}
                          <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{matched.title} (₹{matched.price})</span>
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        )}

        {/* Subscriptions Section */}
        {service?.serviceType === 'subscription_base' && service?.packages?.length > 0 && (
          <section className="mt-5 md:mt-8 space-y-3 md:space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>Choose Subscription Plan</h2>
            </div>
            <div className="space-y-4">
              {service.packages.map((pkg, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`p-5 rounded-[28px] border-2 cursor-pointer transition-all flex flex-col gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.01)] ${selectedPackage?.title === pkg.title ? 'border-[#B33A35] shadow-[0_8px_30px_rgba(179,58,53,0.08)]' : 'border-border-color hover:border-red-200'
                    }`}
                  style={
                    selectedPackage?.title === pkg.title
                      ? { backgroundColor: 'rgba(179, 58, 53, 0.03)' }
                      : { backgroundColor: 'var(--card-bg)' }
                  }
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-base leading-tight text-[#B33A35]">{pkg.title}</h3>
                        {pkg.isPopular && <span className="text-[9px] font-bold uppercase bg-[#B33A35] text-white px-2.5 py-0.5 rounded-full">Recommended Plan</span>}
                      </div>
                      <div className="text-[11px] font-semibold text-gray-500 flex items-center gap-1"><FiClock /> Validity: {pkg.duration || '30 Days'}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-extrabold text-lg text-[#B33A35]">₹{pkg.price}</div>
                      {pkg.originalPrice && <div className="text-xs text-gray-400 line-through">₹{pkg.originalPrice}</div>}
                    </div>
                  </div>
 
                  {/* Predefined benefits displays */}
                  <div className="grid grid-cols-2 gap-2 p-3 bg-red-50/10 dark:bg-[#B33A35]/5 rounded-2xl border border-red-100/10 dark:border-[#B33A35]/10 text-xs font-semibold text-gray-700 dark:text-zinc-300">
                    <div className="flex items-center gap-1.5">
                      <FiCheckCircle className="text-[#B33A35] shrink-0 w-3.5 h-3.5" />
                      <span>{pkg.visitsCredits || 4} Visits {pkg.visitFrequency ? `(${pkg.visitFrequency})` : 'Included'}</span>
                    </div>
                    {pkg.bookingDiscount > 0 && (
                      <div className="flex items-center gap-1.5">
                        <FiCheckCircle className="text-[#B33A35] shrink-0 w-3.5 h-3.5" />
                        <span>{pkg.bookingDiscount}% Extra Discount</span>
                      </div>
                    )}
                    {pkg.freeInspection && (
                      <div className="flex items-center gap-1.5">
                        <FiCheckCircle className="text-[#B33A35] shrink-0 w-3.5 h-3.5" />
                        <span>Free Inspection/Checkup</span>
                      </div>
                    )}
                    {pkg.prioritySupport && (
                      <div className="flex items-center gap-1.5">
                        <FiCheckCircle className="text-[#B33A35] shrink-0 w-3.5 h-3.5" />
                        <span>Priority Support</span>
                      </div>
                    )}
                    {pkg.memberPricing && (
                      <div className="flex items-center gap-1.5">
                        <FiCheckCircle className="text-[#B33A35] shrink-0 w-3.5 h-3.5" />
                        <span>Special Member Prices</span>
                      </div>
                    )}
                  </div>
 
                  {pkg.description && <p className="text-[11px] font-normal leading-relaxed text-gray-500">{pkg.description}</p>}
 
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      className={`text-xs font-bold px-5 py-1.5 rounded-full border transition-all ${selectedPackage?.title === pkg.title
                        ? 'text-white bg-[#B33A35] border-[#B33A35]'
                        : 'text-[#B33A35] border-[#B33A35] hover:bg-red-50/50'
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

        {renderVariantsList()}

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
                        {isSelected && variant.iconUrl && (
                          <span
                            className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4.5 h-4.5 rounded-full text-[9px] font-bold shadow-md z-10"
                            style={{ backgroundColor: 'var(--primary)', color: '#fff' }}
                          >
                            ✓
                          </span>
                        )}
                        {variant.iconUrl ? (
                          <div className="w-11 h-11 rounded-lg overflow-hidden border border-white/20 mb-1 flex-shrink-0 bg-white shadow-sm">
                            <img src={toAssetUrl(variant.iconUrl)} alt={variant.title} className="w-full h-full object-cover" />
                          </div>
                        ) : (
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
                        )}
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
          {/* Mobile Dynamic Blocks Renderer */}
          {/* Mobile Dynamic Blocks Renderer */}
          <div className="flex flex-col gap-2.5 w-full mt-10 pb-24">
            {pageBlocks.filter(b => b.isVisible && b.blockType !== 'banner_slider').map((block, idx, arr) => (
              <div key={idx} className="w-full">
                {renderBlockContent(block, true)}
                {idx < arr.length - 1 && (
                  <div className="border-b border-gray-100 dark:border-zinc-850 mt-5 mb-2.5 w-full" />
                )}
              </div>
            ))}
          </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t px-4 pb-[calc(env(safe-area-inset-bottom)+6px)] pt-2 backdrop-blur-xl" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 rounded-[20px] border px-3.5 py-2 shadow-[0_12px_30px_rgba(255,159,69,0.08)]" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
          <div>
            <div className="text-[10px] font-normal tracking-[0.05em]" style={{ color: 'var(--text-muted)' }}>
              Price {service.serviceType === 'minute_base' && `(${selectedDuration} Mins)`}
              {selectedVariants.length > 0 && ` + ${selectedVariants.length} add-on${selectedVariants.length > 1 ? 's' : ''}`}
            </div>
            <PriceTag price={finalPrice} originalPrice={service.originalPrice} className="mt-0.5" />
          </div>
          <button type="button" onClick={handleAdd} className="rounded-xl bg-gradient-to-r from-brand to-brand-dark px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition-transform hover:scale-[1.02]">
            {service.serviceType === 'image_base' ? 'Add Selected' : (variants.length > 0 ? 'Select & Add' : 'Add to cart')}
          </button>
        </div>
      </div>
      </div>

      <div className="hidden lg:block w-full max-w-[1280px] mx-auto px-6 pt-28 pb-6 font-sans">
        {/* Top Navbar */}
        <div className="mb-6">
          <Navbar 
            locationLabel={currentCity?.name || 'Select location'} 
            cartCount={cartCount} 
            onSearchClick={() => { }} 
            onLocationClick={() => navigate('/user/home')} 
          />
        </div>

        {/* Hero Section Grid */}
        <div className="grid grid-cols-12 gap-8 items-start mb-8 mt-8">
          {/* Left: Main Image/Video & Thumbnails */}
          <div className="col-span-8 space-y-4">
            <div className="relative w-full aspect-[1.8/1] rounded-3xl overflow-hidden shadow-sm border" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
              {serviceImages[activeImageIndex]?.type === 'video' ? (
                <video
                  ref={videoRef}
                  src={serviceImages[activeImageIndex]?.url}
                  autoPlay
                  muted
                  loop
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                <img
                  src={serviceImages[activeImageIndex]?.url}
                  alt={service.title}
                  className="h-full w-full object-cover transition-all duration-300"
                />
              )}
            </div>

            {/* Thumbnail Carousel */}
            {serviceImages.length > 1 && (
              <div className="flex items-center gap-3 justify-center">
                <button
                  onClick={() => setActiveImageIndex(prev => (prev - 1 + serviceImages.length) % serviceImages.length)}
                  className="p-1.5 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                  {serviceImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`w-16 h-12 rounded-xl overflow-hidden border-2 transition-all relative ${
                        activeImageIndex === idx ? 'border-[#B33A35] scale-105' : 'hover:border-gray-300'
                      }`}
                      style={activeImageIndex !== idx ? { borderColor: 'var(--border)' } : {}}
                    >
                      {img.type === 'video' ? (
                        <div className="w-full h-full relative bg-black flex items-center justify-center">
                          <video src={img.url} className="w-full h-full object-cover opacity-60" muted />
                          <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] bg-black/30">
                            ▶
                          </span>
                        </div>
                      ) : (
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      )}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setActiveImageIndex(prev => (prev + 1) % serviceImages.length)}
                  className="p-1.5 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                >
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right: Title, Badge, Star, Description & Features Grid */}
          <div className="col-span-4 space-y-5 pt-2">
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: 'rgba(179, 58, 53, 0.08)', color: '#B33A35' }}>
                {category?.title || 'Mens and kids salon'}
              </span>
              <h1 className="text-3xl font-black leading-tight" style={{ color: 'var(--text-primary)' }}>
                {service.title ? service.title.charAt(0).toUpperCase() + service.title.slice(1).toLowerCase() : ''}
              </h1>
              <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                <FiStar className="fill-amber-400 text-amber-400 w-4 h-4" />
                <span className="font-extrabold" style={{ color: 'var(--text-primary)' }}>{service.rating || "4.5"}</span>
                <span style={{ color: 'var(--text-muted)' }}>({service.reviewCount ? `${service.reviewCount} reviews` : "1.2k reviews"})</span>
              </div>
              <p className="text-sm leading-relaxed font-normal pt-2" style={{ color: 'var(--text-secondary)' }}>
                {service.description}
              </p>
            </div>


            {(!service.packages || service.packages.length === 0) && (!variants || variants.length === 0) && (
              <div className="pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleAdd}
                  className="w-full py-4 rounded-2xl font-black text-white text-xs shadow-lg transition-transform hover:scale-[1.01] uppercase tracking-wider cursor-pointer"
                  style={{ background: 'linear-gradient(to right, var(--primary), var(--primary-dark, #e08a30))' }}
                >
                  Add to Cart
                </button>
              </div>
            )}

            {/* CART Sidebar widget */}
            <div className="border rounded-[28px] p-6 shadow-sm space-y-6 mt-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
              <h4 className="text-xs font-black uppercase tracking-wider border-b pb-3" style={{ color: 'var(--text-muted)', borderColor: 'var(--border)' }}>Cart</h4>
              
              {cartItems.length > 0 ? (
                <div className="space-y-6">
                  {/* Cart Items List */}
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                    {cartItems.map((item, index) => {
                      const itemPrice = Number(item.price || 0);
                      return (
                        <div key={item._id || index} className="flex justify-between items-center gap-4">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{item.title}</p>
                          </div>
                          
                          {/* Quantity pill selector */}
                          <div className="flex items-center gap-2 border border-violet-200 dark:border-zinc-700 bg-violet-50/50 dark:bg-zinc-800/40 rounded-lg px-2.5 py-0.5 shrink-0">
                            <button 
                              onClick={() => handleDecreaseQuantity(item._id || item.id)} 
                              className="text-[#B33A35] font-extrabold text-sm hover:scale-110 active:scale-95 cursor-pointer px-1"
                            >
                              -
                            </button>
                            <span className="text-slate-800 dark:text-white font-extrabold text-xs">{item.serviceCount}</span>
                            <button 
                              onClick={() => handleIncreaseQuantity(item._id || item.id)} 
                              className="text-[#B33A35] font-extrabold text-xs hover:scale-110 active:scale-95 cursor-pointer px-1"
                            >
                              +
                            </button>
                          </div>

                          <span className="text-xs font-bold shrink-0 min-w-[50px] text-right" style={{ color: 'var(--text-primary)' }}>
                            ₹{itemPrice}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Red checkout/view cart button */}
                  <button
                    onClick={() => navigate('/user/cart')}
                    className="w-full py-4 bg-[#B33A35] hover:bg-[#9E2E2A] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-[#B33A35]/15 transition-all flex items-center justify-between px-6 cursor-pointer active:scale-[0.98]"
                  >
                    <span className="text-sm font-black">₹{cartItems.reduce((acc, item) => acc + Number(item.price || 0), 0)}</span>
                    <span className="h-4 w-[1px] bg-white/30 mx-2" />
                    <span className="uppercase tracking-wider flex items-center gap-1.5">View Cart <FiShoppingBag /></span>
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiShoppingBag className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>No items in your cart</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Service Categories Section */}
        {service?.serviceType === 'package_base' && service?.serviceGroups?.length > 0 && (
          <div className="grid grid-cols-12 gap-8 items-center py-6 border-y mb-8" style={{ borderColor: 'var(--border)' }}>
            <div className="col-span-3">
              <h2 className="text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>
                Service Categories
              </h2>
            </div>
            <div className="col-span-9 flex flex-wrap items-center gap-3 py-2">
              {service.serviceGroups.map((group, idx) => {
                const colors = cardColors[idx % cardColors.length];
                return (
                  <div
                    key={group._id || idx}
                    onClick={() => setActiveCategoryModal(group)}
                    className="flex items-center gap-4 rounded-2xl border transition-all duration-200 hover:scale-[1.02] cursor-pointer select-none overflow-hidden min-w-[220px]"
                    style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
                  >
                    {group.iconUrl ? (
                      <div className="w-14 h-14 shrink-0 overflow-hidden">
                        <img src={toAssetUrl(group.iconUrl)} alt={group.title} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0 ml-4" style={{ backgroundColor: 'rgba(179, 58, 53, 0.08)' }}>
                        <span className="text-sm font-black" style={{ color: '#B33A35' }}>
                          {group.title ? group.title[0].toUpperCase() : 'S'}
                        </span>
                      </div>
                    )}
                    <div className={group.iconUrl ? 'py-3 pr-4' : 'pr-4'}>
                      <h4 className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>{group.title}</h4>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Custom selection available</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}



        {/* Two-Column Split Layout or Full Width Grid */}
        {false && service?.serviceType === 'package_base' && service?.packages?.length > 0 ? (
          <div className="grid grid-cols-12 gap-8 items-start mb-12">
            {/* Left Column: Packages and Variants */}
            <div className="col-span-8 space-y-8">
              {/* Packages Section */}
              <div className="space-y-4">
                <h2 className="text-base font-extrabold text-slate-800">Packages</h2>
                <div className="space-y-4">
                  {service.packages.filter(p => !p.title?.toLowerCase().includes('combo') && !p.title?.toLowerCase().includes('packege combo') && p.title !== 'Combos Packages').map((pkg, idx) => {
                    const addedCount = getAddedPackageCount(pkg.title);
                    const isPkgSelected = selectedPackage?.title === pkg.title;
                    return (
                      <div
                        key={idx}
                        className={`p-6 rounded-[28px] border-2 flex items-center justify-between transition-all bg-white ${
                          addedCount > 0
                            ? 'border-emerald-500/30 shadow-[0_4px_20px_rgba(16,185,129,0.02)]'
                            : isPkgSelected
                            ? 'border-[#B33A35] shadow-[0_4px_20px_rgba(179,58,53,0.02)]'
                            : 'border-gray-100'
                        }`}
                      >
                        <div className="flex gap-4 items-start flex-1 pr-4">
                          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                            <img
                              src={serviceImages[0]?.url || 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=150'}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-extrabold text-sm text-slate-800">{pkg.title}</h3>
                              {pkg.isPopular && (
                                <span className="text-[9px] font-black uppercase bg-[#B33A35] text-white px-2 py-0.5 rounded-full">
                                  Popular
                                </span>
                              )}
                            </div>
                            {pkg.description && (
                              <p className="text-[11px] text-gray-500 leading-relaxed max-w-xl">
                                {pkg.description}
                              </p>
                            )}
                            {pkg.allowUserEdit !== false && pkg.includedItems?.length > 0 && (addedCount > 0 || isPkgSelected) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPackage(pkg);
                                  setIsCustomizing(true);
                                }}
                                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline mt-2 block cursor-pointer"
                              >
                                Edit your package
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end shrink-0 gap-3">
                          <div className="text-right">
                            <div className="font-extrabold text-sm text-[#B33A35]">₹{pkg.price}</div>
                            {pkg.originalPrice && <div className="text-xs text-gray-400 line-through">₹{pkg.originalPrice}</div>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSelectPackage(pkg)}
                            className={`px-5 py-2 rounded-full border text-xs font-black transition-all ${
                              addedCount > 0
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-[#B33A35] text-[#B33A35] hover:bg-red-50/50'
                            }`}
                          >
                            {addedCount > 0 ? 'Added ✓' : 'Select'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Sidebar Panels */}
            <div className="col-span-4 space-y-4">
              {pageBlocks.filter(b => b.isVisible && b.blockType !== 'banner_slider').map((block, idx) => (
                <div key={idx}>
                  {renderBlockContent(block)}
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Full Width Layout when NO Packages */
          <div className="flex flex-col gap-8 mb-12 w-full">
            {service?.serviceType === 'minute_base' && (
              <section className="py-5 px-5 rounded-3xl border transition-colors" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
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
                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${selectedDuration === mins ? 'font-semibold shadow-xs' : ''
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
            {renderVariantsList()}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-start">
              {/* Left Column */}
              <div className="flex flex-col gap-6">
                {pageBlocks
                  .filter(b => b.isVisible && b.blockType !== 'banner_slider')
                  .filter((_, idx) => idx % 2 === 0)
                  .map((block, idx) => (
                    <div key={idx}>
                      {renderBlockContent(block)}
                    </div>
                  ))}
              </div>
              {/* Right Column */}
              <div className="flex flex-col gap-6">
                {pageBlocks
                  .filter(b => b.isVisible && b.blockType !== 'banner_slider')
                  .filter((_, idx) => idx % 2 !== 0)
                  .map((block, idx) => (
                    <div key={idx}>
                      {renderBlockContent(block)}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>



      {/* Category Group details modal */}
      <AnimatePresence>
        {activeCategoryModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveCategoryModal(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 cursor-pointer"
            />
            {/* Centered Modal / Sheet */}
            <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4 pointer-events-none">
              <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="w-full max-w-md md:max-w-lg rounded-t-[32px] md:rounded-[32px] p-6 shadow-2xl border flex flex-col gap-5 max-h-[85vh] overflow-y-auto pointer-events-auto"
                style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
              >
                <div className="flex justify-between items-center border-b pb-3" style={{ borderColor: 'var(--border)' }}>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                    {activeCategoryModal.title} Options & Packages
                  </h3>
                  <button
                    onClick={() => setActiveCategoryModal(null)}
                    className="p-1.5 hover:bg-red-50/50 dark:hover:bg-zinc-800 rounded-full text-gray-500 cursor-pointer"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                {/* Items List */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Available Options:</h4>
                  <div className="space-y-3 max-h-[305px] md:max-h-[365px] overflow-y-auto pr-1">
                    {activeCategoryModal.items?.map((item) => {
                      const cartItem = cartItems.find(entry => entry.title === item.title && String(getCartItemServiceId(entry)) === String(service?._id || service?.id));
                      const qty = cartItem ? (cartItem.serviceCount || 1) : 0;
                      return item.imageUrl ? (
                        /* Image Card Layout */
                        <div
                          key={item._id}
                          className="rounded-2xl border overflow-hidden flex transition-all select-none h-[90px] md:h-[110px]"
                          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
                        >
                          {/* Left Image */}
                          <div className="w-24 md:w-28 shrink-0 overflow-hidden h-[90px] md:h-[110px]">
                            <img src={toAssetUrl(item.imageUrl)} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                          {/* Right Details */}
                          <div className="flex-1 p-2 md:p-3 flex flex-col justify-between gap-1 h-[90px] md:h-[110px]">
                            <div>
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div className="font-bold text-xs md:text-sm truncate" style={{ color: 'var(--text-primary)' }}>{item.title}</div>
                                {(item.description || item.duration) && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setActiveItemDescModal(item); }}
                                    className="text-gray-400 hover:text-[#B33A35] transition-colors cursor-pointer shrink-0"
                                  >
                                    <FiInfo className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs md:text-sm" style={{ color: 'var(--primary)' }}>₹{item.price}</span>
                              {qty > 0 ? (
                                <div className="flex items-center gap-1.5 md:gap-2 border border-violet-200 dark:border-zinc-700 bg-violet-50/50 dark:bg-zinc-800/40 rounded-lg px-1.5 md:px-2 py-0.5">
                                  <button onClick={(e) => { e.stopPropagation(); handleDecreaseSubItem(item); }} className="text-[#B33A35] font-extrabold text-xs md:text-sm hover:scale-110 active:scale-95 px-1 cursor-pointer">-</button>
                                  <span className="text-slate-800 dark:text-white font-extrabold text-[10px] md:text-xs">{qty}</span>
                                  <button onClick={(e) => { e.stopPropagation(); handleIncreaseSubItem(item); }} className="text-[#B33A35] font-extrabold text-xs md:text-sm hover:scale-110 active:scale-95 px-1 cursor-pointer">+</button>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleIncreaseSubItem(item); }}
                                  className="text-[9px] md:text-[10px] font-bold px-3 md:px-4 py-1 md:py-1.5 rounded-full border transition-colors cursor-pointer"
                                  style={{ backgroundColor: 'rgba(179, 58, 53, 0.08)', color: '#B33A35', borderColor: 'rgba(179, 58, 53, 0.2)' }}
                                >
                                  Add +
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Default Text Card Layout (no image) */
                        <div
                          key={item._id}
                          className="p-4 rounded-2xl border flex justify-between items-start gap-4 transition-all select-none"
                          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{item.title}</div>
                              {(item.description || item.duration) && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setActiveItemDescModal(item); }}
                                  className="text-gray-400 hover:text-[#B33A35] transition-colors cursor-pointer shrink-0"
                                >
                                  <FiInfo className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <span className="font-bold text-sm" style={{ color: 'var(--primary)' }}>₹{item.price}</span>
                            {qty > 0 ? (
                              <div className="flex items-center gap-2 border border-violet-200 dark:border-zinc-700 bg-violet-50/50 dark:bg-zinc-800/40 rounded-lg px-2 py-0.5 shrink-0">
                                <button onClick={(e) => { e.stopPropagation(); handleDecreaseSubItem(item); }} className="text-[#B33A35] font-extrabold text-sm hover:scale-110 active:scale-95 px-1.5 cursor-pointer">-</button>
                                <span className="text-slate-800 dark:text-white font-extrabold text-xs">{qty}</span>
                                <button onClick={(e) => { e.stopPropagation(); handleIncreaseSubItem(item); }} className="text-[#B33A35] font-extrabold text-sm hover:scale-110 active:scale-95 px-1.5 cursor-pointer">+</button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleIncreaseSubItem(item); }}
                                className="text-[10px] font-bold px-4 py-1.5 rounded-full border transition-colors cursor-pointer"
                                style={{ backgroundColor: 'rgba(179, 58, 53, 0.08)', color: '#B33A35', borderColor: 'rgba(179, 58, 53, 0.2)' }}
                              >
                                Add +
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}

        {/* Package Customization Modal/Bottom Sheet */}
        {isCustomizing && service?.serviceType === 'package_base' && selectedPackage && selectedPackage.allowUserEdit !== false && selectedPackage.includedItems && selectedPackage.includedItems.length > 0 && (
          <>
            {/* Backdrop */}
            <motion.div
              key="customise-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsCustomizing(false)}
            />
            {/* Bottom Sheet / Centered Card */}
            <motion.div
              key="customise-sheet"
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 lg:relative lg:inset-auto lg:z-50 lg:flex lg:items-center lg:justify-center"
              style={{
                position: 'fixed',
                zIndex: 999
              }}
            >
              {/* Desktop wrapper */}
              <div className="lg:fixed lg:inset-0 lg:flex lg:items-center lg:justify-center lg:p-4">
                <div 
                  className="w-full bg-white dark:bg-zinc-900 shadow-2xl p-6 relative overflow-hidden rounded-t-[32px] lg:rounded-[32px] max-h-[90vh] lg:max-h-[85vh] lg:max-w-md flex flex-col"
                  style={{ border: '1px solid var(--border)' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Drag Handle - Mobile Only */}
                  <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full mx-auto mb-4 lg:hidden shrink-0" />

                  {/* Header */}
                  <div className="flex justify-between items-start border-b pb-4 dark:border-zinc-800 shrink-0">
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white truncate max-w-[280px]">
                        {selectedPackage.title}
                      </h3>
                      <p className="text-[10px] text-gray-500 dark:text-zinc-400 mt-0.5">
                        Customize individual options inside this combo package
                      </p>
                    </div>
                    <button
                      onClick={() => setIsCustomizing(false)}
                      className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors text-gray-400 dark:text-zinc-500 shrink-0"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="overflow-y-auto py-4 space-y-6 flex-1 pr-1">
                    {(() => {
                      const renderedGroupIds = new Set();
                      return selectedPackage.includedItems.map((incItem, incIdx) => {
                        const groupId = incItem.serviceGroupId?.toString();
                        if (!groupId || renderedGroupIds.has(groupId)) return null;
                        renderedGroupIds.add(groupId);

                        const group = service.serviceGroups?.find(g => g._id?.toString() === groupId);
                        if (!group) return null;

                        const selectedList = Array.isArray(customSelectedItems[groupId])
                          ? customSelectedItems[groupId]
                          : (customSelectedItems[groupId] ? [customSelectedItems[groupId].toString()] : []);

                        return (
                          <div key={incIdx} className="space-y-3">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">
                              {group.title}
                            </h4>

                            <div className="space-y-2.5">
                              {group.items?.map((item) => {
                                const isSelected = selectedList.includes(item._id?.toString());
                                return (
                                  <div
                                    key={item._id}
                                    onClick={() => {
                                      setCustomSelectedItems(prev => ({
                                        ...prev,
                                        [groupId]: [item._id?.toString()]
                                      }));
                                    }}
                                    className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800/40 cursor-pointer transition-all border border-transparent hover:border-gray-100"
                                  >
                                    <div className="flex items-center gap-3">
                                      {/* Radio Icon */}
                                      <span
                                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                                          isSelected
                                            ? 'border-violet-600 dark:border-violet-500'
                                            : 'border-gray-300 dark:border-zinc-700'
                                        }`}
                                      >
                                        {isSelected && (
                                          <span className="w-2.5 h-2.5 rounded-full bg-violet-600 dark:bg-violet-500" />
                                        )}
                                      </span>
                                      <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                                        {item.title}
                                      </span>
                                    </div>
                                    <span className="text-xs font-bold text-gray-800 dark:text-zinc-200">
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
                                      [groupId]: ['skip']
                                    }));
                                  }}
                                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-red-50/20 dark:hover:bg-red-950/10 cursor-pointer transition-all"
                                >
                                  {/* Radio Icon */}
                                  <span
                                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                                      selectedList.includes('skip')
                                        ? 'border-red-500'
                                        : 'border-gray-300 dark:border-zinc-700'
                                    }`}
                                  >
                                    {selectedList.includes('skip') && (
                                      <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                    )}
                                  </span>
                                  <span className="text-xs font-bold text-red-500 dark:text-red-400">
                                    I don't need {group.title.toLowerCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>

                  {/* Done Button */}
                  <div className="pt-4 border-t dark:border-zinc-800 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsCustomizing(false)}
                      className="w-full py-3.5 rounded-2xl font-bold text-white text-xs shadow-lg transition-transform hover:scale-[1.01]"
                      style={{ backgroundColor: '#B33A35' }}
                    >
                      Done Customize
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* LIGHTBOX MODAL */}
      {lightboxIndex >= 0 && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center select-none" onClick={() => setLightboxIndex(-1)}>
          <button
            onClick={() => setLightboxIndex(-1)}
            className="absolute top-6 right-6 text-white text-3xl font-bold bg-white/10 hover:bg-white/20 w-12 h-12 rounded-full flex items-center justify-center transition-colors"
          >
            ×
          </button>
          <div className="relative max-w-4xl max-h-[85vh] px-4 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {lightboxIndex > 0 && (
              <button
                onClick={() => setLightboxIndex(prev => prev - 1)}
                className="absolute left-4 z-10 text-white text-3xl font-black bg-black/40 hover:bg-black/60 w-12 h-12 rounded-full flex items-center justify-center transition-colors"
              >
                ‹
              </button>
            )}
            <img src={lightboxImages[lightboxIndex]} alt="" className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl transition-transform duration-200" />
            {lightboxIndex < lightboxImages.length - 1 && (
              <button
                onClick={() => setLightboxIndex(prev => prev + 1)}
                className="absolute right-4 z-10 text-white text-3xl font-black bg-black/40 hover:bg-black/60 w-12 h-12 rounded-full flex items-center justify-center transition-colors"
              >
                ›
              </button>
            )}
          </div>
          <div className="mt-4 text-white/60 text-xs font-semibold">
            {lightboxIndex + 1} / {lightboxImages.length}
          </div>
        </div>
      )}
      {/* WHAT'S INCLUDED DETAIL MODAL */}
      <AnimatePresence>
        {includedModalItems.length > 0 && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIncludedModalItems([])}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="fixed inset-0 m-auto w-[90%] max-w-lg h-fit max-h-[80vh] bg-white dark:bg-zinc-900 rounded-3xl z-50 shadow-2xl p-6 flex flex-col gap-4 border dark:border-zinc-800"
            >
              <div className="flex justify-between items-center border-b pb-3 dark:border-zinc-800 shrink-0">
                <h3 className="text-base font-black text-slate-800 dark:text-zinc-150">
                  {includedModalTitle}
                </h3>
                <button
                  onClick={() => setIncludedModalItems([])}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-850 rounded-full text-gray-500 transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3 overflow-y-auto pr-1 py-1 flex-1">
                {includedModalItems.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start p-3.5 bg-slate-50/50 dark:bg-zinc-800/30 rounded-2xl border border-slate-100 dark:border-zinc-800">
                    <FiCheckCircle className="text-emerald-500 w-4 h-4 shrink-0 mt-0.5" />
                    <span className="text-xs font-semibold text-slate-650 dark:text-zinc-350 leading-relaxed">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ITEM DESCRIPTION DETAIL MODAL */}
      <AnimatePresence>
        {activeItemDescModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveItemDescModal(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] cursor-pointer"
            />
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 inset-x-0 md:inset-0 md:m-auto w-full md:max-w-sm h-fit max-h-[85vh] z-[999] shadow-2xl p-6 flex flex-col gap-4 border overflow-y-auto pointer-events-auto rounded-t-[32px] md:rounded-[32px]"
              style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}
            >
              <div className="flex justify-between items-center border-b pb-3 shrink-0" style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>
                  {activeItemDescModal.title} Info
                </h3>
                <button
                  onClick={() => setActiveItemDescModal(null)}
                  className="p-1 hover:bg-gray-150 dark:hover:bg-zinc-800 rounded-full text-gray-500 transition-colors cursor-pointer"
                >
                  <FiX className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3 overflow-y-auto pr-1 py-1 flex-1 text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {activeItemDescModal.duration && (
                  <div className="flex items-center gap-1.5 font-bold" style={{ color: 'var(--text-primary)' }}>
                    <FiClock className="text-[#B33A35]" /> {activeItemDescModal.duration}
                  </div>
                )}
                <p className="whitespace-pre-wrap">{activeItemDescModal.description}</p>
                <div className="pt-2 border-t font-black text-sm" style={{ color: '#B33A35', borderColor: 'var(--border)' }}>
                  Price: ₹{activeItemDescModal.price}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PremiumServiceDetailPage;
