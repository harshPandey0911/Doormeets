import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiHeart, FiShare2, FiShield, FiStar, FiClock, FiCheckCircle, FiSliders, FiInfo, FiUpload } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import Navbar from '../../components/premium/Navbar';
import BottomCheckoutBar from '../../components/premium/BottomCheckoutBar';
import PriceTag from '../../components/premium/PriceTag';
import { buildCartItemData, toAssetUrl } from '../../components/premium/cartUtils';
import { useCart } from '../../../../context/CartContext';
import { useCity } from '../../../../context/CityContext';
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
  const cityId = currentCity?._id || currentCity?.id;
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart, cartCount } = useCart();

  const [service, setService] = useState(location.state?.service || null);
  const brand = location.state?.brand || null;
  const category = location.state?.category || null;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const serviceImages = useMemo(() => {
    if (Array.isArray(service?.images) && service.images.length > 0) {
      return service.images.map(img => toAssetUrl(img));
    }
    if (Array.isArray(service?.gallery) && service.gallery.length > 0) {
      return service.gallery.map(img => toAssetUrl(img));
    }
    if (service?.image) {
      return [toAssetUrl(service.image)];
    }
    return [getDetailDummyImage(service?.title)];
  }, [service]);

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

  const [pageBlocks, setPageBlocks] = useState([]);

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
        return processBlock.data.steps.map(s => s.title || s);
      }
    }
    return service?.steps || [];
  }, [service, pageBlocks]);

  const [fields, setFields] = useState([]);
  const [pricingRules, setPricingRules] = useState([]);
  const [dynamicAnswers, setDynamicAnswers] = useState({});
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [calculatedPrice, setCalculatedPrice] = useState(0);

  const [selectedDuration, setSelectedDuration] = useState(30);

  useEffect(() => {
    if (service?.serviceType === 'package_base' && service?.packages?.length > 0) {
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
    if (service.serviceType === 'package_base' && service.packages && service.packages.length > 0) {
      basePrice = selectedPackage?.price || 0;
    } else if (service.serviceType === 'dynamic_base') {
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
  }, [dynamicAnswers, pricingRules, service, selectedPackage, selectedDuration]);

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

    // Validate required fields
    // Validate required fields (only if shown to user)
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

    const cartData = buildCartItemData({ service, category, brand });
    if (service?.serviceType === 'package_base' && selectedPackage) {
      cartData.card.title = `${service.title} - ${selectedPackage.title}`;
      if (selectedPackage.duration) cartData.card.duration = selectedPackage.duration;
      dynamicFieldsPayload.push({
        name: 'Selected Package',
        label: 'Selected Package',
        value: selectedPackage.title
      });
    }
    if (service?.serviceType === 'minute_base') {
      cartData.card.duration = `${selectedDuration} Minutes`;
      dynamicFieldsPayload.push({
        name: 'Duration',
        label: 'Duration',
        value: `${selectedDuration} Minutes`
      });
    }
    cartData.price = calculatedPrice;
    cartData.unitPrice = calculatedPrice;
    if (cartData.card) {
      cartData.card.price = calculatedPrice;
    }
    cartData.dynamicFields = dynamicFieldsPayload;

    const response = await addToCart(cartData);
    if (response?.success) {
      toast.success('Added to cart');
    }
  };

  if (!service) {
    return (
      <div className="min-h-screen bg-white p-6">
        <Navbar locationLabel="Premium service" cartCount={cartCount} onSearchClick={() => { }} onLocationClick={() => navigate('/user/home')} />
        <div className="mx-auto max-w-3xl px-4 py-12 text-center">
          <div className="rounded-[28px] border border-dashed border-gray-200 bg-white p-10 shadow-sm">
            <h1 className="text-2xl font-semibold text-gray-900">Service not available</h1>
            <p className="mt-3 text-sm text-gray-500">Open this page from a brand or category service card so we can load the live service data.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-28">
      {/* Header Image Section with Full-Bleed style on mobile */}
      <div 
        className="relative w-full h-[320px] md:h-[460px] overflow-hidden bg-gray-100 shadow-sm select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <img
          src={serviceImages[activeImageIndex]}
          alt={service.title}
          className="h-full w-full object-cover transition-all duration-300"
          draggable="false"
        />
        {/* Soft Linear Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent pointer-events-none" />
        
        {/* Play Button Overlay (only if video exists) */}
        {(service.video || service.videoUrl) && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <button className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-lg text-gray-800 hover:scale-105 active:scale-95 transition-all">
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
          <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight leading-tight">
            {service.title ? service.title.charAt(0).toUpperCase() + service.title.slice(1).toLowerCase() : ''}
          </h1>
          
          <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-500">
            <FiStar className="fill-amber-400 text-amber-400" />
            <span className="text-gray-900 font-semibold">{service.rating || "4.5"}</span>
            <span>({service.reviews || "1.2k reviews"})</span>
          </div>

          <p className="text-sm text-gray-500 font-normal leading-relaxed pt-1">
            {service.description}
          </p>
        </div>

        {/* Grid of features (pastel color cards) */}
        {features.length > 0 && (
          <div className="mt-8">
            <div className="grid grid-cols-3 gap-3">
              {features.map((feature, idx) => {
                const colorScheme = cardColors[idx % cardColors.length];
                return (
                  <div
                    key={idx}
                    className="flex flex-col items-center justify-center p-4 rounded-2xl border text-center aspect-square shadow-[0_2px_8px_rgba(0,0,0,0.01)] transition-transform duration-200 hover:scale-[1.01]"
                    style={{
                      backgroundColor: colorScheme.bg,
                      borderColor: colorScheme.border
                    }}
                  >
                    <div className="w-10 h-10 flex items-center justify-center mb-2 text-gray-800">
                      <FiCheckCircle className="w-6 h-6 text-gray-700" />
                    </div>
                    <span className="text-[11px] font-semibold tracking-tight text-gray-800 leading-tight line-clamp-2">
                      {feature}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pricing / Duration Base */}
        {service?.serviceType === 'minute_base' && (
          <section className="mt-8 py-4 px-4 bg-orange-50/10 border border-orange-100 rounded-3xl">
            <h2 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <FiClock className="text-brand" /> Select Massage Duration
            </h2>
            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
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
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${selectedDuration === mins ? 'border-brand bg-orange-50 text-brand font-semibold shadow-sm' : 'border-gray-100 bg-white text-gray-700 hover:border-gray-200'}`}
                  >
                    <span className="text-xs font-semibold">{formatDurationText(mins)}</span>
                    <span className="text-xs mt-1 text-gray-400 font-medium">₹{currentDurationPrice.toFixed(0)}</span>
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
              <h2 className="text-[17px] font-semibold text-[#1f2937] tracking-tight">Packages</h2>
            </div>
            <div className="space-y-3">
              {service.packages.map((pkg, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`p-4 rounded-[24px] border-2 cursor-pointer transition-all flex items-center justify-between ${selectedPackage?.title === pkg.title ? 'border-brand bg-orange-50' : 'border-gray-100 bg-white hover:border-gray-200'}`}
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-gray-800 text-sm leading-tight">{pkg.title}</h3>
                      {pkg.isPopular && <span className="text-[9px] font-semibold uppercase bg-brand text-white px-2.5 py-0.5 rounded-full">Popular</span>}
                    </div>
                    {pkg.duration && <div className="text-[11px] font-semibold text-gray-400 mb-1.5 flex items-center gap-1"><FiClock /> {pkg.duration}</div>}
                    {pkg.description && <p className="text-[11px] text-gray-500 font-normal leading-relaxed">{pkg.description}</p>}
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
                          ? 'bg-brand border-brand text-white' 
                          : 'bg-white border-brand text-brand hover:bg-brand/5'
                      }`}
                    >
                      {selectedPackage?.title === pkg.title ? 'Selected' : 'Select'}
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
                <h2 className="text-xl font-normal text-gray-900">Custom Options</h2>
              </div>

              <div className="space-y-4">
                {fields.filter(f => f.showToUser !== false).map((field) => {
                  const value = dynamicAnswers[field.name] || '';
                  return (
                    <div key={field._id || field.name} className="space-y-1">
                      <label className="block text-xs font-semibold text-gray-700">
                        {field.label} {field.isRequired && <span className="text-red-500">*</span>}
                      </label>

                      {/* Render inputs based on type */}
                      {field.fieldType === 'text' && (
                        <input
                          type="text"
                          className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-1 focus:ring-orange-300 outline-none"
                          value={value}
                          onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [field.name]: e.target.value }))}
                          required={field.isRequired}
                        />
                      )}

                      {field.fieldType === 'number' && (
                        <input
                          type="number"
                          className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-1 focus:ring-orange-300 outline-none"
                          value={value}
                          onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [field.name]: e.target.value }))}
                          required={field.isRequired}
                        />
                      )}

                      {field.fieldType === 'textarea' && (
                        <textarea
                          className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-1 focus:ring-orange-300 outline-none"
                          rows={3}
                          value={value}
                          onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [field.name]: e.target.value }))}
                          required={field.isRequired}
                        />
                      )}

                      {field.fieldType === 'dropdown' && (
                        <select
                          className="w-full p-2.5 border border-gray-300 rounded-xl text-sm bg-white focus:ring-1 focus:ring-orange-300 outline-none"
                          value={value}
                          onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [field.name]: e.target.value }))}
                          required={field.isRequired}
                        >
                          <option value="">Select Option</option>
                          {(field.options || []).map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}

                      {field.fieldType === 'radio' && (
                        <div className="flex flex-wrap gap-3 pt-1">
                          {(field.options || []).map(opt => (
                            <label key={opt} className="flex items-center gap-1.5 text-sm text-gray-700 cursor-pointer">
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
                        <label className="flex items-center gap-2 py-1 text-sm text-gray-700 cursor-pointer">
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
                          className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-1 focus:ring-orange-300 outline-none"
                          value={value}
                          onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [field.name]: e.target.value }))}
                          required={field.isRequired}
                        />
                      )}

                      {field.fieldType === 'time' && (
                        <input
                          type="time"
                          className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-1 focus:ring-orange-300 outline-none"
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
                            <div className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-lg border border-gray-100">
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
                            className="flex-1 p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-1 focus:ring-orange-300 outline-none"
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
              {pageBlocks.filter(b => b.isVisible).map((block, i) => {
                const data = block.data || {};
                switch (block.blockType) {
                  case 'heading_text':
                    return (
                      <section key={i} className="mt-8 py-4 px-4 bg-gray-50/30 border border-gray-150 rounded-3xl">
                        <h2 className="text-xl font-semibold text-gray-900">{data.heading}</h2>
                        <p className="mt-2 text-sm leading-6 text-gray-600 whitespace-pre-line font-normal">{data.text}</p>
                      </section>
                    );
                  case 'warranty':
                    return (
                      <section key={i} className="mt-8 py-4 px-4 bg-orange-50 border border-orange-200 rounded-3xl text-gray-900">
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-orange-100/50 p-2.5 text-brand"><FiShield /></div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">{data.duration} Warranty</p>
                            <h3 className="text-lg font-semibold">{data.title}</h3>
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-gray-600 leading-relaxed font-normal">{data.description}</p>
                      </section>
                    );
                  case 'whats_included':
                    return (
                      <section key={i} className="mt-8 py-4 px-4 bg-orange-50 border border-orange-100 rounded-3xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Included</p>
                        <h2 className="mt-1 text-lg font-semibold text-gray-900">{data.title}</h2>
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
                      <section key={i} className="mt-8 py-4 px-4 bg-orange-50 border border-orange-100 rounded-3xl">
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Process</p>
                        <h2 className="mt-1 text-lg font-semibold text-gray-900">{data.title}</h2>
                        <div className="mt-4 space-y-3">
                          {(data.steps || []).map((step, idx) => (
                            <div key={idx} className="flex gap-4 rounded-2xl border border-red-100/30 bg-white p-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-brand to-brand-dark text-xs font-semibold text-white">{idx + 1}</div>
                              <div>
                                <div className="font-semibold text-gray-900 text-sm">{step.title}</div>
                                {step.desc && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed font-normal">{step.desc}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  case 'please_note':
                    return (
                      <section key={i} className="mt-8 py-4 px-4 bg-amber-50/30 border border-amber-100/50 rounded-3xl">
                        <div className="flex items-center gap-2">
                          <FiInfo className="text-amber-600 w-5 h-5" />
                          <h2 className="text-base font-semibold text-amber-900">{data.title}</h2>
                        </div>
                        <ul className="mt-3 list-inside list-disc space-y-1 text-xs text-amber-800 leading-relaxed font-normal">
                          {(data.notes || []).map((note, idx) => (
                            <li key={idx}>{note}</li>
                          ))}
                        </ul>
                      </section>
                    );
                  case 'faq':
                    return (
                      <section key={i} className="mt-8 py-4 px-4 bg-gray-50/20 border border-gray-150 rounded-3xl">
                        <h2 className="text-base font-semibold text-gray-900">FAQ</h2>
                        <div className="mt-4 space-y-3">
                          {(data.faqs || []).map((faq, idx) => (
                            <div key={idx} className="rounded-2xl border border-gray-100 p-3.5 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.005)]">
                              <h4 className="font-semibold text-gray-900 text-sm">{faq.question}</h4>
                              <p className="mt-1 text-xs text-gray-500 leading-relaxed font-normal">{faq.answer}</p>
                            </div>
                          ))}
                        </div>
                      </section>
                    );
                  default:
                    return null;
                }
              })}
            </div>
          ) : (
            <>
              <section className="mt-8 py-4 px-4 bg-orange-50 border border-orange-100 rounded-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Included</p>
                <h2 className="mt-1 text-lg font-semibold text-gray-900">What you get</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {features.length > 0 ? features.map((feature, idx) => (
                    <span key={idx} className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-brand border border-orange-200">
                      <FiCheckCircle /> {feature}
                    </span>
                  )) : <span className="text-xs text-gray-500">No included features listed.</span>}
                </div>
              </section>

              <section className="mt-8 py-4 px-4 bg-orange-50 border border-orange-100 rounded-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Process</p>
                <h2 className="mt-1 text-lg font-semibold text-gray-900">How it works</h2>
                <div className="mt-4 space-y-3">
                  {steps.length > 0 ? steps.map((step, index) => {
                    const stepTitle = typeof step === 'object' ? step.title : step;
                    const stepDesc = typeof step === 'object' ? step.desc : 'Smooth and transparent service delivery.';
                    return (
                      <div key={index} className="flex gap-4 rounded-2xl border border-red-100/30 bg-white p-3.5 shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-brand to-brand-dark text-xs font-semibold text-white">{index + 1}</div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{stepTitle}</div>
                          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed font-normal">{stepDesc}</p>
                        </div>
                      </div>
                    );
                  }) : <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-4 text-xs text-gray-500">No steps listed for this service.</div>}
                </div>
              </section>

              <section className="mt-8 py-4 px-4 bg-orange-50 border border-orange-100 rounded-3xl text-gray-900">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-orange-100/50 p-2.5 text-brand"><FiShield /></div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand">Professional badge</p>
                    <h3 className="text-base font-semibold">Verified Professional</h3>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed font-normal">Certified experts, clean work, and support-backed service experience.</p>
              </section>
            </>
          )}


          <section className="mt-3 py-2 px-1">
            <p className="text-xs font-normal tracking-[0.1em] text-gray-400">Reviews</p>
            <h2 className="text-base font-semibold text-[#111827] tracking-tight">User feedback</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-5 text-sm text-gray-500 md:col-span-3 font-normal">No reviews available yet.</div>
            </div>
          </section>
        </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-orange-100/50 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 rounded-[28px] border border-orange-100/60 bg-white px-4 py-3 shadow-[0_12px_30px_rgba(255,159,69,0.08)]">
          <div>
            <div className="text-[11px] font-normal tracking-[0.1em] text-gray-400">
              Price {service.serviceType === 'minute_base' && `(${selectedDuration} Mins)`}
            </div>
            <PriceTag price={calculatedPrice} originalPrice={service.originalPrice} className="mt-1" />
          </div>
          <button type="button" onClick={handleAdd} className="rounded-2xl bg-gradient-to-r from-brand to-brand-dark px-5 py-3 text-sm font-normal text-white shadow-lg shadow-orange-100/50 transition-transform hover:scale-[1.02]">
            Add to cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumServiceDetailPage;
