import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { FiArrowLeft, FiShoppingCart, FiTrash2, FiMinus, FiPlus, FiPhone, FiHome, FiClock, FiEdit2, FiCheckCircle, FiInfo, FiSliders } from 'react-icons/fi';
import { MdStar } from 'react-icons/md';
import { toast } from 'react-hot-toast';
import { themeColors } from '../../../../theme';
import AddressSelectionModal from './components/AddressSelectionModal';
import TimeSlotModal from './components/TimeSlotModal';
import VendorSearchModal from './components/VendorSearchModal';
import api from '../../../../services/api';
import { bookingService } from '../../../../services/bookingService';
import { paymentService } from '../../../../services/paymentService';
import { cartService } from '../../../../services/cartService';
import { configService } from '../../../../services/configService';
import { getPlans } from '../../services/planService';
import { userAuthService } from '../../../../services/authService';
import { promoService } from '../../../../services/promoService';
import { voucherService } from '../../../../services/voucherService';
import { useCart } from '../../../../context/CartContext';
import LiveBookingCard from '../../components/booking/LiveBookingCard';

const toAssetUrl = (url) => {
  if (!url) return '';
  const clean = url.replace('/api/upload', '/upload');
  if (clean.startsWith('http')) return clean;
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/api$/, '');
  return `${base}${clean.startsWith('/') ? '' : '/'}${clean}`;
};

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const category = location.state?.category || null;
  const plan = location.state?.plan || null;
  const { fetchCart: fetchCartGlobal, clearCart: clearCartGlobal, removeCategoryItems: removeCategoryGlobal } = useCart();

  const [cartItems, setCartItems] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);
  const [address, setAddress] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [addressDetails, setAddressDetails] = useState(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [userPhone, setUserPhone] = useState('');

  // Custom Contact State (for this booking only)
  const [contactDetails, setContactDetails] = useState({ name: '', phone: '' });
  const [showContactModal, setShowContactModal] = useState(false);

  // Optional GST Number State
  const [userGstNumber, setUserGstNumber] = useState('');

  // New state for vendor search flow
  const [currentStep, setCurrentStep] = useState('details'); // 'details' | 'searching' | 'waiting' | 'accepted' | 'payment'
  const [acceptedVendor, setAcceptedVendor] = useState(null);
  const [bookingRequest, setBookingRequest] = useState(null);
  const [searchingVendors, setSearchingVendors] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' | 'pay_at_home'
  const [bids, setBids] = useState([]); // Array to collect multiple vendor responses

  // Promo Code States
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  const [selectedTime, setSelectedTime] = useState(null);
  const [visitedFee, setVisitedFee] = useState(0);
  const [gstPercentage, setGstPercentage] = useState(18);
  const [bookingType, setBookingType] = useState('instant'); // 'instant' | 'scheduled'

  // Dynamic Builder States
  const [dynamicFieldsConfig, setDynamicFieldsConfig] = useState([]);
  const [pricingRules, setPricingRules] = useState([]);
  const [serviceWorkflow, setServiceWorkflow] = useState(null);
  const [dynamicAnswers, setDynamicAnswers] = useState({});
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [loyaltyRedemptionRate, setLoyaltyRedemptionRate] = useState(1);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletInputVal, setWalletInputVal] = useState('');
  const [maxWalletUsagePercentage, setMaxWalletUsagePercentage] = useState(30);
  const [isInstantBookingEnabled, setIsInstantBookingEnabled] = useState(true);
  const [instantBookingMarkup, setInstantBookingMarkup] = useState(99);
  const [instantBookingWaitTime, setInstantBookingWaitTime] = useState(45);
  const [showArrivalTime, setShowArrivalTime] = useState(true);
  const [instantBookingWindowHours, setInstantBookingWindowHours] = useState(4);
  const [codAdvancePercentage, setCodAdvancePercentage] = useState(0);
  const [maxSearchTimeMinutes, setMaxSearchTimeMinutes] = useState(1); // From admin settings (1 min default)

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }

    setPromoLoading(true);
    setPromoError('');
    try {
      const firstItem = cartItems[0];
      const serviceId = typeof firstItem?.serviceId === 'object'
        ? firstItem.serviceId._id || firstItem.serviceId.id
        : firstItem?.serviceId || firstItem?._id;

      const quantity = firstItem?.serviceCount || 1;

      // 1. Try standard Promo Code validation
      try {
        const response = await promoService.applyPromo(
          promoCode.trim().toUpperCase(),
          serviceId,
          itemTotal,
          quantity
        );

        if (response.success) {
          setAppliedPromo(response.data);
          toast.success(response.message || 'Promo code applied!');
          setPromoLoading(false);
          return;
        }
      } catch (promoErr) {
        // If it's a validation error (like service not matching), throw to display it
        if (promoErr.message && !promoErr.message.includes('Invalid or inactive')) {
          throw promoErr;
        }
      }

      // 2. Try Gift Voucher redemption if promo code was invalid/not found
      const response = await voucherService.redeemVoucher(
        promoCode.trim().toUpperCase(),
        serviceId,
        itemTotal,
        quantity
      );

      if (response.success) {
        if (response.data.type === 'wallet') {
          // Instantly credited wallet!
          toast.success(response.message || `₹${response.data.value} added to your wallet balance!`);
          setPromoCode('');
          setPromoError('');
        } else {
          // Discount voucher applied!
          setAppliedPromo({
            code: response.data.code,
            discountType: response.data.discountType,
            discountValue: response.data.discountValue,
            discountAmount: response.data.discountAmount
          });
          toast.success(response.message || 'Gift voucher applied!');
        }
      } else {
        setPromoError(response.message || 'Failed to apply voucher');
        toast.error(response.message || 'Failed to apply voucher');
      }
    } catch (error) {
      const msg = error.message || 'Invalid promo or gift voucher code';
      setPromoError(msg);
      toast.error(msg);
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError('');
    toast.success('Promo code removed');
  };

  // Check if Razorpay is loaded (defer to avoid blocking initial render)
  useEffect(() => {
    // Defer Razorpay check until after page load
    const checkRazorpay = () => {
      if (window.Razorpay) {
        setRazorpayLoaded(true);
      } else {
        // Retry after a short delay (non-blocking)
        setTimeout(checkRazorpay, 100);
      }
    };

    // Use requestIdleCallback if available, otherwise setTimeout
    if (window.requestIdleCallback) {
      window.requestIdleCallback(checkRazorpay, { timeout: 200 });
    } else {
      setTimeout(checkRazorpay, 100);
    }
  }, []);

  // Load user data and cart
  useEffect(() => {
    const loadUserData = () => {
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        if (userData.phone) {
          setUserPhone(userData.phone);
        }
        // Initialize contact details for editing
        setContactDetails({
          name: userData.name || '',
          phone: userData.phone || ''
        });
      }
    };
    loadUserData();

    // Refresh on focus to catch updates from profile page
    window.addEventListener('focus', loadUserData);
    return () => window.removeEventListener('focus', loadUserData);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        if (plan) {
          setCartItems([{
            id: plan.id,
            name: plan.name,
            price: plan.price,
            description: plan.description,
            isPlan: true,
            serviceCount: 1
          }]);

          // Still need config and address for plan checkout
          const response = await userAuthService.getCheckoutData();
          if (response.success) {
            setVisitedFee(0); // Plans usually have 0 visitor fee
            setGstPercentage(response.settings?.serviceGstPercentage || 18);
            setLoyaltyPoints(response.user?.loyaltyPoints || 0);
            setWalletBalance(response.user?.wallet?.balance || 0);
            setMaxWalletUsagePercentage(response.settings?.maxWalletUsagePercentage !== undefined ? response.settings.maxWalletUsagePercentage : 30);
            setLoyaltyRedemptionRate(response.settings?.loyaltyPointsRedemptionRate || 1);
            const instantEnabled = response.settings?.isInstantBookingEnabled ?? true;
            setIsInstantBookingEnabled(instantEnabled);
            if (!instantEnabled) {
              setBookingType('scheduled');
            }
            setInstantBookingMarkup(response.settings?.instantBookingMarkup ?? 99);
            setInstantBookingWaitTime(response.settings?.instantBookingWaitTime ?? 45);
            setShowArrivalTime(response.settings?.showArrivalTime ?? true);
            setInstantBookingWindowHours(response.settings?.instantBookingWindowHours ?? 4);
            setCodAdvancePercentage(response.settings?.codAdvancePercentage || 0);
            // waveDuration is in seconds (e.g. 60 = 1 min); convert to minutes for frontend countdown
            setMaxSearchTimeMinutes(Math.max(1, Math.round((response.settings?.waveDuration || 60) / 60)));

            if (response.user?.addresses?.length > 0) {
              const defaultAddr = response.user.addresses.find(a => a.isDefault) || response.user.addresses[0];
              setAddress(defaultAddr.addressLine1);
              setHouseNumber(defaultAddr.addressLine2 || '');
              setAddressDetails({
                address: defaultAddr.addressLine1,
                lat: defaultAddr.lat,
                lng: defaultAddr.lng,
                type: defaultAddr.type,
                city: defaultAddr.city,
                state: defaultAddr.state,
                pincode: defaultAddr.pincode
              });
            }
          }
        } else {
          const response = await userAuthService.getCheckoutData();
          if (response.success) {
            // Set Config
            setVisitedFee(response.settings?.visitedCharges || 29);
            setGstPercentage(response.settings?.serviceGstPercentage || 18);
            setLoyaltyPoints(response.user?.loyaltyPoints || 0);
            setWalletBalance(response.user?.wallet?.balance || 0);
            setMaxWalletUsagePercentage(response.settings?.maxWalletUsagePercentage !== undefined ? response.settings.maxWalletUsagePercentage : 30);
            setLoyaltyRedemptionRate(response.settings?.loyaltyPointsRedemptionRate || 1);
            const instantEnabled = response.settings?.isInstantBookingEnabled ?? true;
            setIsInstantBookingEnabled(instantEnabled);
            if (!instantEnabled) {
              setBookingType('scheduled');
            }
            setInstantBookingMarkup(response.settings?.instantBookingMarkup ?? 99);
            setInstantBookingWaitTime(response.settings?.instantBookingWaitTime ?? 45);
            setShowArrivalTime(response.settings?.showArrivalTime ?? true);
            setInstantBookingWindowHours(response.settings?.instantBookingWindowHours ?? 4);
            setCodAdvancePercentage(response.settings?.codAdvancePercentage || 0);
            // waveDuration is in seconds (e.g. 60 = 1 min); convert to minutes for frontend countdown
            setMaxSearchTimeMinutes(Math.max(1, Math.round((response.settings?.waveDuration || 60) / 60)));

            // Set Addresses
            if (response.user?.addresses?.length > 0) {
              const defaultAddr = response.user.addresses.find(a => a.isDefault) || response.user.addresses[0];
              setAddress(defaultAddr.addressLine1);
              setHouseNumber(defaultAddr.addressLine2 || '');
              setAddressDetails({
                address: defaultAddr.addressLine1,
                lat: defaultAddr.lat,
                lng: defaultAddr.lng,
                type: defaultAddr.type,
                city: defaultAddr.city,
                state: defaultAddr.state,
                pincode: defaultAddr.pincode
              });
            }

            // Set Cart Items
            let items = response.cartItems || [];
            console.log('[DEBUG] getCheckoutData items:', JSON.stringify(items, null, 2));
            if (category) {
              const normalizedCategory = category.toLowerCase().trim();
              items = items.filter(item => {
                const itemCat = (item.category || 'Other').toLowerCase().trim();
                return itemCat === normalizedCategory;
              });
            }
            setCartItems(items);

            // Fetch dynamic fields if there are items
            if (items.length > 0) {
              const firstItem = items[0];
              const serviceId = (firstItem.serviceId && typeof firstItem.serviceId === 'object')
                ? (firstItem.serviceId._id || firstItem.serviceId.id)
                : (firstItem.serviceId || firstItem.id || firstItem._id);
              
              if (serviceId) {
                try {
                  const detailsRes = await api.get(`/public/services/${serviceId}/dynamic-details`);
                  if (detailsRes.data.success) {
                    setDynamicFieldsConfig((detailsRes.data.fields || []).filter(f => f.showToUser !== false));
                    setPricingRules(detailsRes.data.pricingRules || []);
                    setServiceWorkflow(detailsRes.data.workflow || null);

                    // Initialize dynamic field answers
                    const initialAnswers = {};
                    (detailsRes.data.fields || []).filter(f => f.showToUser !== false).forEach(f => {
                      const existingAnswer = firstItem.dynamicFields?.find(df => df.name === f.name);
                      initialAnswers[f.name] = existingAnswer ? existingAnswer.value : (f.defaultValue || '');
                    });
                    setDynamicAnswers(initialAnswers);
                  }
                } catch (detailsErr) {
                  console.error('Error fetching dynamic service details:', detailsErr);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to load checkout data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [category, plan]);

  useEffect(() => {
    if (!loading && cartItems.length === 0 && currentStep === 'details' && !searchingVendors && !showVendorModal) {
      navigate('/user/home', { replace: true });
    }
  }, [loading, cartItems.length, currentStep, searchingVendors, showVendorModal, navigate]);

  const loadCart = async () => {
    try {
      setLoading(true);
      const response = await cartService.getCart();
      if (response.success) {
        let items = response.data || [];
        if (category) {
          const normalizedCategory = category.toLowerCase().trim();
          items = items.filter(item => {
            const itemCat = (item.category || 'Other').toLowerCase().trim();
            return itemCat === normalizedCategory;
          });
        }
        setCartItems(items);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  const cartCount = cartItems.length;

  const handleBack = () => {
    navigate(-1);
  };

  const handleQuantityChange = async (itemId, change) => {
    try {
      const item = cartItems.find(i => (i._id || i.id) === itemId);
      if (!item) return;

      const newCount = Math.max(1, (item.serviceCount || 1) + change);
      const response = await cartService.updateItem(itemId, newCount);

      if (response.success) {
        // Refresh global cart badge
        fetchCartGlobal();

        // Reload cart and filter by category
        const cartResponse = await cartService.getCart();
        if (cartResponse.success) {
          let items = cartResponse.data || [];
          if (category) {
            const normalizedCategory = category.toLowerCase().trim();
            items = items.filter(item => {
              const itemCat = (item.category || 'Other').toLowerCase().trim();
              return itemCat === normalizedCategory;
            });
          }
          setCartItems(items);
        }
      } else {
        toast.error(response.message || 'Failed to update quantity');
      }
    } catch (error) {
      toast.error('Failed to update quantity');
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      const response = await cartService.removeItem(itemId);
      if (response.success) {
        toast.success('Item removed');
        // Refresh global cart badge
        fetchCartGlobal();
        loadCart();
      } else {
        toast.error(response.message || 'Failed to remove item');
      }
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };



  const getAddressComponent = (type) => {
    return addressDetails?.components?.find(c => c.types.includes(type))?.long_name || '';
  };

  const handleProceed = async () => {
    // Validation
    if (bookingType === 'instant') {
      if (!addressDetails) {
        setShowAddressModal(true);
        return;
      }
    } else {
      if (!addressDetails || !selectedDate || !selectedTime) {
        if (!addressDetails) setShowAddressModal(true);
        else if (!selectedDate || !selectedTime) setShowTimeSlotModal(true);
        return;
      }
    }

    try {
      setShowVendorModal(true);
      setCurrentStep('searching');

      const firstItem = cartItems[0];
      if (!firstItem) {
        toast.error('Your cart is empty');
        return;
      }
      const serviceId = typeof firstItem.serviceId === 'object'
        ? firstItem.serviceId._id || firstItem.serviceId.id
        : firstItem.serviceId;

      const bookedItemsData = cartItems.map(item => ({
        brandName: item.sectionTitle || item.brand || '',
        brandIcon: item.sectionIcon || null,
        card: {
          title: item.card?.title || item.title,
          subtitle: item.card?.subtitle || item.description || '',
          price: item.card?.price || item.price || 0,
          originalPrice: item.card?.originalPrice || item.originalPrice || null,
          duration: item.card?.duration || item.duration || '',
          description: item.card?.description || item.description || '',
          imageUrl: item.card?.imageUrl || item.icon || '',
          features: item.card?.features || []
        },
        quantity: item.serviceCount || 1
      }));

      // Calculate Scheduled Data for Instant
      let finalDate = selectedDate;
      let finalTime = selectedTime;
      let finalTimeSlot = {
        start: selectedTime,
        end: getTimeSlots().find(slot => slot.value === selectedTime)?.end || selectedTime
      };

      if (bookingType === 'instant') {
        const now = new Date();
        finalDate = now;
        finalTime = "ASAP";
        finalTimeSlot = { start: "Now", end: "45 mins" };
      }
      const dynamicFieldsPayload = Object.keys(dynamicAnswers).map(key => {
        const field = dynamicFieldsConfig.find(f => f.name === key);
        return {
          fieldId: field?._id || field?.id,
          name: key,
          label: field?.label || key,
          value: dynamicAnswers[key]
        };
      });

      const response = await bookingService.create({
        bookingType, // 'instant' or 'scheduled'
        serviceId,
        address: {
          type: addressDetails?.type || 'home',
          addressLine1: addressDetails?.addressLine1 || address,
          addressLine2: houseNumber,
          city: addressDetails?.city || getAddressComponent('locality') || getAddressComponent('administrative_area_level_2') || 'City',
          state: addressDetails?.state || getAddressComponent('administrative_area_level_1') || 'State',
          pincode: addressDetails?.pincode || getAddressComponent('postal_code') || '000000',
          lat: addressDetails?.lat,
          lng: addressDetails?.lng
        },
        scheduledDate: finalDate, // Date object
        scheduledTime: bookingType === 'instant' ? "ASAP" : (getTimeSlots().find(slot => slot.value === finalTime)?.display || finalTime),
        timeSlot: finalTimeSlot,
        isConsultation: firstItem.isConsultation || false,
        amount: amountToPay,

        // Pass Full Breakdown to Backend
        basePrice: totalOriginalPrice,
        discount: savings + promoDiscount,
        tax: taxesAndFee,
        visitationFee: finalVisitedFee,
        promoCode: appliedPromo ? appliedPromo.code : null,

        // Metadata for better data capture
        serviceCategory: firstItem.categoryTitle || firstItem.category || 'General',
        categoryIcon: firstItem.categoryIcon || firstItem.icon || null,
        brandName: firstItem.sectionTitle || firstItem.brand || '',
        brandIcon: firstItem.sectionIcon || null,

        contactDetails: {
          name: contactDetails.name,
          phone: contactDetails.phone.length === 10 && !contactDetails.phone.includes('+') ? `+91${contactDetails.phone}` : contactDetails.phone
        },

        userGstNumber: userGstNumber.trim() || null,

        paymentMethod: amountToPay === 0 ? 'plan_benefit' : paymentMethod,
        redeemLoyaltyPoints: useLoyaltyPoints,
        applyWallet: walletDiscount > 0,
        walletAmountRequested: walletDiscount,
        bookedItems: bookedItemsData,
        dynamicFields: dynamicFieldsPayload
      });

      if (response.success) {
        setBookingRequest(response.data);

        // If the backend returns an assigned vendor immediately (rare but possible)
        if (response.data.vendorId && (response.data.status === 'ACCEPTED' || response.data.status === 'ASSIGNED')) {
          setCurrentStep('accepted');
          setAcceptedVendor({
            ...(response.data.vendorId || {}),
            price: response.data.finalAmount || amountToPay,
            distance: 'within 5km', // default
            estimatedTime: '15-30 min'
          });
          setSearchingVendors(false); // Finished search
        } else {
          // Normal flow: Entered pooling/searching
          setCurrentStep('waiting'); // Waiting for vendor acceptance
          // Keep searchingVendors = true to disable buttons and show progress
        }
      }
    } catch (error) {
      toast.error('Failed to initiate booking request. Please try again.');
      setShowVendorModal(false);
      setSearchingVendors(false);
    }
  };


  // Listen for real-time vendor acceptance
  useEffect(() => {
    if (currentStep !== 'waiting' || !bookingRequest) return;

    const socketUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') || 'http://localhost:5000';
    const socket = io(socketUrl, {
      auth: { token: localStorage.getItem('accessToken') },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
    });

    socket.on('connect_error', (err) => {
    });

    socket.on('new_bid_received', (data) => {
      if (data.bookingId === bookingRequest._id) {
        setBids(prev => {
          if (prev.some(b => b.bidId === data.bidId)) return prev;
          const newBid = {
            id: data.bidId,
            bidId: data.bidId,
            vendorId: data.vendor.id,
            name: data.vendor.name,
            businessName: data.vendor.businessName,
            rating: data.vendor.rating,
            price: data.price,
            distance: data.vendor.distance || 'Nearby',
            estimatedTime: '15-30 min'
          };
          return [...prev, newBid];
        });
        toast.success(`New quote from ${data.vendor.businessName}!`, { icon: '💰' });
      }
    });

    socket.on('booking_accepted', (data) => {
      if (data.bookingId === bookingRequest._id) {
        const vendorData = {
          id: data.vendor.id,
          name: data.vendor.name || 'Vendor',
          businessName: data.vendor.businessName || 'Service Provider',
          rating: 4.8,
          distance: 'Nearby',
          estimatedTime: '15-20 mins',
          price: bookingRequest.amount
        };
        setAcceptedVendor(vendorData);
        setCurrentStep('accepted');
        setSearchingVendors(false);
        toast.success(`${vendorData.businessName} accepted!`);
        setTimeout(() => {
          setShowVendorModal(false);
          navigate(`/user/booking/${bookingRequest._id}`, { replace: true });
        }, 2000);
      }
    });

    socket.on('booking_search_failed', (data) => {
      if (String(data.bookingId) === String(bookingRequest?._id)) {
        setSearchingVendors(false);
        setCurrentStep('failed');
        toast.error(data.message || 'No vendors available at the moment.');
      }
    });

    socket.on('booking_updated', (data) => {
      if (String(data.bookingId) === String(bookingRequest?._id)) {
        if (data.status === 'no_vendors' || data.status === 'rejected' || data.status === 'cancelled') {
          setSearchingVendors(false);
          setCurrentStep('failed');
          toast.error(data.message || 'All vendors are currently unavailable.');
        } else if (data.status === 'pending_admin') {
          setSearchingVendors(false);
          setShowVendorModal(false);
          toast.success('Request sent to Admin for manual assignment!', { icon: '🛡️' });
          navigate(`/user/booking/${bookingRequest._id}`, { replace: true });
        }
      }
    });

    // --- FALLBACK: POLLING CHECK ---
    // If socket fails for any reason, poll the booking status every 3 seconds
    const pollInterval = setInterval(async () => {
      if (currentStep === 'waiting' && bookingRequest?._id) {
        try {
          const response = await bookingService.getById(bookingRequest._id);
          if (response.success) {
            const status = response.data.status;
            if (status === 'no_vendors' || status === 'rejected' || status === 'cancelled') {
              console.log('[Checkout] Polling detected failure status:', status);
              setSearchingVendors(false);
              setCurrentStep('failed');
              clearInterval(pollInterval);
            } else if (status === 'pending_admin') {
              console.log('[Checkout] Polling detected pending_admin status');
              setSearchingVendors(false);
              setShowVendorModal(false);
              clearInterval(pollInterval);
              toast.success('Request sent to Admin for manual assignment!', { icon: '🛡️' });
              navigate(`/user/booking/${bookingRequest._id}`, { replace: true });
            } else if (status === 'accepted' || status === 'assigned') {
              // Also handle success via polling as fallback
              console.log('[Checkout] Polling detected success status:', status);
              const vendor = response.data.vendorId;
              if (vendor) {
                setAcceptedVendor({
                  id: vendor._id || vendor.id,
                  name: vendor.name,
                  businessName: vendor.businessName,
                  price: response.data.finalAmount
                });
                setCurrentStep('accepted');
                setSearchingVendors(false);
                clearInterval(pollInterval);
                setTimeout(() => {
                  setShowVendorModal(false);
                  navigate(`/user/booking/${bookingRequest._id}`, { replace: true });
                }, 2000);
              }
            }
          }
        } catch (err) {
          console.error('[Checkout] Polling error:', err);
        }
      }
    }, 3000);

    return () => {
      clearInterval(pollInterval);
      socket.disconnect();
    };
  }, [currentStep, bookingRequest]);

  // Search for nearby vendors
  const handleSearchVendors = async () => {
    try {
      // Validate required fields
      if (bookingType === 'scheduled') {
        if (!selectedDate || !selectedTime) {
          toast.error('Please select time slot');
          return;
        }
        if (!addressDetails) {
          toast.error('Please select address');
          return;
        }
      } else {
        // Instant
        if (!addressDetails) {
          toast.error('Please select address');
          return;
        }
      }

      if (cartItems.length === 0 && !bookingRequest) {
        toast.error('Cart is empty');
        return;
      }

      // Open modal and start searching
      setShowVendorModal(true);
      setCurrentStep('searching');
      setSearchingVendors(true);

      // Get first service
      const firstItem = cartItems[0];
      if (!firstItem.serviceId) {
        toast.error('Service information missing. Please try again.');
        setCurrentStep('details');
        setSearchingVendors(false);
        setShowVendorModal(false);
        return;
      }

      // Prepare address object
      const addressObj = {
        type: 'home',
        addressLine1: address,
        addressLine2: houseNumber,
        city: addressDetails?.city || getAddressComponent('locality') || getAddressComponent('administrative_area_level_2') || 'City',
        state: addressDetails?.state || getAddressComponent('administrative_area_level_1') || 'State',
        pincode: addressDetails?.pincode || getAddressComponent('postal_code') || '123456',

        landmark: addressDetails?.landmark || '',
        lat: addressDetails?.lat || null,
        lng: addressDetails?.lng || null
      };

      // Prepare time slot
      let finalDate = selectedDate;
      let finalTimeDisplay = selectedTime;
      let timeSlotObj = {
        start: selectedTime,
        end: getTimeSlots().find(slot => slot.value === selectedTime)?.end || selectedTime
      };

      if (bookingType === 'instant') {
        finalDate = new Date();
        finalTimeDisplay = "ASAP";
        timeSlotObj = { start: "Now", end: "45 mins" };
      } else {
        finalTimeDisplay = getTimeSlots().find(slot => slot.value === selectedTime)?.display || selectedTime;
      }

      // Create booking request
      toast.loading('Searching for nearby vendors...');

      // Ensure serviceId is a string (handle populated cart data)
      const serviceId = typeof firstItem.serviceId === 'object'
        ? firstItem.serviceId._id || firstItem.serviceId.id
        : firstItem.serviceId;

      // Prepare bookedItems array matching Service catalog structure
      // Prepare bookedItems array matching Service catalog structure
      const bookedItemsData = cartItems.map(item => ({
        brandName: item.sectionTitle || item.brand || '',
        brandIcon: item.sectionIcon || null,
        card: {
          title: item.card?.title || item.title || 'Unknown Service',
          subtitle: item.card?.subtitle || item.description || '',
          price: item.card?.price || item.price || 0,
          originalPrice: item.card?.originalPrice || item.originalPrice || null,
          duration: item.card?.duration || item.duration || '',
          description: item.card?.description || item.description || '',
          imageUrl: item.card?.imageUrl || item.icon || '',
          features: item.card?.features || []
        },
        quantity: item.serviceCount || 1
      }));



      const itemDynamicFields = firstItem.dynamicFields || [];
      const dynamicFieldsPayload = [
        ...itemDynamicFields.map(df => ({
          fieldId: df.fieldId || null,
          name: df.name,
          label: df.label,
          value: df.value
        })),
        ...Object.keys(dynamicAnswers).map(key => {
          const field = dynamicFieldsConfig.find(f => f.name === key);
          return {
            fieldId: field?._id || field?.id,
            name: key,
            label: field?.label || key,
            value: dynamicAnswers[key]
          };
        })
      ];

      const bookingResponse = await bookingService.create({
        bookingType, // 'instant' or 'scheduled'
        serviceId: serviceId,
        address: addressObj,
        scheduledDate: finalDate.toISOString(),
        scheduledTime: finalTimeDisplay,
        timeSlot: timeSlotObj,
        // userNotes: null, // Removed per request
        paymentMethod: amountToPay === 0 ? 'plan_benefit' : paymentMethod,
        amount: amountToPay,
        redeemLoyaltyPoints: useLoyaltyPoints,
        applyWallet: walletDiscount > 0,
        walletAmountRequested: walletDiscount,

        // Pass Full Breakdown to Backend
        basePrice: totalOriginalPrice,
        discount: savings + promoDiscount,
        tax: taxesAndFee,
        visitationFee: finalVisitedFee,
        promoCode: appliedPromo ? appliedPromo.code : null,

        // Metadata for better data capture
        serviceCategory: firstItem.categoryTitle || firstItem.category || 'General',
        categoryIcon: firstItem.categoryIcon || firstItem.icon || null,
        brandName: firstItem.sectionTitle || firstItem.brand || '',
        brandIcon: firstItem.sectionIcon || null,
        isConsultation: firstItem.isConsultation || false,

        bookedItems: bookedItemsData,
        dynamicFields: dynamicFieldsPayload
      });

      if (!bookingResponse.success) {
        toast.dismiss();
        toast.error(bookingResponse.message || 'Failed to search for vendors');
        setCurrentStep('details');
        setSearchingVendors(false);
        setShowVendorModal(false);
        return;
      }

      const booking = bookingResponse.data;
      setBookingRequest(booking);
      toast.dismiss();

      // Clear cart immediately as search starts (consumes items)
      try {
        if (category) {
          await removeCategoryGlobal(category);
        } else {
          await clearCartGlobal();
        }
        setCartItems([]);
      } catch (err) {
        console.error('Failed to clear cart after search start', err);
      }

      // If no vendors found, route immediately to admin details
      if (bookingResponse.noVendorsFound) {
        toast.dismiss();
        setSearchingVendors(false);
        setShowVendorModal(false);
        toast.success('No immediate professionals found. Request sent to Admin for manual assignment!', { icon: '🛡️' });
        navigate(`/user/booking/${booking._id}`, { replace: true });
      } else {
        // Move to waiting state - alerts sent to nearby vendors
        setCurrentStep('waiting');
        toast.success('Finding nearby vendors... Alerts sent to vendors within 10km!');
      }

      // REMOVED local setCartItems([]) - The summary should remain visible while searching
      // The cart is already cleared in server database by the backend and previous API call.

    } catch (error) {
      toast.dismiss();
      console.error('Search vendors error:', error);
      toast.error('Failed to search for vendors. Please try again.');
      setCurrentStep('details');
      setSearchingVendors(false);
      setShowVendorModal(false);
    }
  };

  // Cancel ongoing vendor search
  const handleCancelSearch = async () => {
    try {
      if (bookingRequest?._id) {
        await bookingService.cancel(bookingRequest._id, 'User cancelled search');
      }
    } catch (err) {
      console.error('[Checkout] Cancel search error:', err);
    } finally {
      setSearchingVendors(false);
      setCurrentStep('details');
      setShowVendorModal(false);
      setBookingRequest(null);
      setAcceptedVendor(null);
      setBids([]);
      // Reload cart so user can re-book
      await loadCart();
    }
  };

  // Proceed to payment after vendor acceptance
  const handleOnlinePayment = async () => {
    try {
      if (!acceptedVendor || !bookingRequest) {
        toast.error('No vendor selected or booking not created');
        return;
      }

      // Create Razorpay order
      toast.loading('Creating payment order...');
      const orderResponse = await paymentService.createOrder(bookingRequest._id, paymentMethod);

      if (!orderResponse.success) {
        toast.dismiss();
        toast.error(orderResponse.message || 'Failed to create payment order');
        return;
      }

      toast.dismiss();

      // Get Razorpay key
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        toast.error('Razorpay key not configured');
        return;
      }

      if (!window.Razorpay) {
        toast.error('Razorpay SDK not loaded');
        return;
      }

      const options = {
        key: razorpayKey,
        amount: orderResponse.data.amount * 100,
        currency: orderResponse.data.currency || 'INR',
        order_id: orderResponse.data.orderId,
        name: 'Doormeets',
        description: `Payment for ${bookingRequest.serviceName || 'service'}`,
        handler: async function (response) {
          try {
            toast.loading('Verifying payment...');
            const verifyResponse = await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });

            toast.dismiss();

            if (verifyResponse.success) {
              toast.success('Payment successful!');

              // Clear cart (or just category items)
              try {
                if (category) {
                  await removeCategoryGlobal(category);
                } else {
                  await clearCartGlobal();
                }
                setCartItems([]);
              } catch (error) {
              }

              // Navigate to booking confirmation
              navigate(`/user/booking-confirmation/${bookingRequest._id}`, {
                replace: true
              });
            } else {
              toast.error(verifyResponse.message || 'Payment verification failed');
            }
          } catch (error) {
            toast.dismiss();
            toast.error('Failed to verify payment');
          }
        },
        prefill: {
          name: contactDetails.name || JSON.parse(localStorage.getItem('userData'))?.name || 'User',
          email: JSON.parse(localStorage.getItem('userData'))?.email || '',
          contact: contactDetails.phone || userPhone
        },
        theme: {
          color: themeColors.button
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        toast.dismiss();
        toast.error(`Payment failed: ${response.error.description || 'Unknown error'}`);
      });
      razorpay.open();

    } catch (error) {
      toast.dismiss();
      toast.error('Failed to process payment');
    }
  };

  const handlePayAtHome = async () => {
    try {
      if (!bookingRequest) return;
      toast.loading('Confirming booking...');
      const response = await paymentService.confirmPayAtHome(bookingRequest._id);
      toast.dismiss();

      if (response.success) {
        toast.success('Booking confirmed!');
        // Clear cart (or just category items)
        try {
          if (category) {
            await removeCategoryGlobal(category);
          } else {
            await clearCartGlobal();
          }
          setCartItems([]);
        } catch (error) {
        }
        // Navigate to booking confirmation
        navigate(`/user/booking-confirmation/${bookingRequest._id}`, {
          replace: true
        });
      } else {
        toast.error(response.message || 'Failed to confirm booking');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to process request');
    }
  };

  const handlePayment = async () => {
    if (totalAmount === 0) {
      // Free booking covered by plan
      toast.success('Booking confirmed!');
      // Clear cart
      try {
        await clearCartGlobal();
        setCartItems([]);
      } catch (error) { }

      // Navigate
      if (bookingRequest) {
        navigate(`/user/booking-confirmation/${bookingRequest._id}`, { replace: true });
      }
    } else if (paymentMethod === 'online') {
      await handleOnlinePayment();
    } else {
      await handlePayAtHome();
    }
  };

  const handleAddressSave = async (savedHouseNumber, locationObj) => {
    setHouseNumber(savedHouseNumber);
    if (locationObj) {
      setAddress(locationObj.address);
      setAddressDetails(locationObj);
    }
    setShowAddressModal(false);

    // Save to profile
    if (locationObj) {
      try {
        const getComp = (type) => locationObj.components?.find(c => c.types.includes(type))?.long_name || '';

        const newAddress = {
          type: 'home',
          addressLine1: locationObj.address,
          addressLine2: savedHouseNumber,
          city: getComp('locality') || getComp('administrative_area_level_2') || 'City',
          state: getComp('administrative_area_level_1') || 'State',
          pincode: getComp('postal_code') || '000000',
          lat: locationObj.lat,
          lng: locationObj.lng,
          isDefault: true
        };

        const response = await userAuthService.getProfile();
        if (response.success && response.user) {
          const updatedAddresses = [newAddress]; // Always replace with single address
          await userAuthService.updateProfile({ addresses: updatedAddresses });
          toast.success('Address updated in profile!');
        }
      } catch (e) {
        console.error('Failed to save address to profile', e);
      }
    }

    if (bookingType === 'scheduled') {
      setShowTimeSlotModal(true);
    }
  };

  const handleTimeSlotSave = (date, time) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setShowTimeSlotModal(false);
  };

  const handleCartClick = () => {
    if (plan) return; // Disable cart click for plan
    navigate('/user/cart');
  };

  // Fetch plan upgrade details if applicable
  const [upgradePreview, setUpgradePreview] = useState(null);
  const isUpgrade = location.state?.isUpgrade;

  useEffect(() => {
    if (plan && isUpgrade) {
      const fetchUpgradeDetails = async () => {
        try {
          const res = await paymentService.getUpgradeDetails(plan.id);
          if (res.success) {
            setUpgradePreview(res.data);
          }
        } catch (error) {
          console.error(error);
          toast.error('Failed to calculate upgrade price');
        }
      };
      fetchUpgradeDetails();
    }
  }, [plan, isUpgrade]);

  const handlePlanPayment = async () => {
    try {
      if (!razorpayLoaded) {
        toast.error('Payment gateway not ready');
        return;
      }

      const response = await paymentService.createPlanOrder(plan.id);
      if (response.success) {
        const { orderId, amount, key } = response.data;

        const options = {
          key,
          amount: amount * 100,
          currency: 'INR',
          name: 'Doormeets',
          description: `Payment for ${plan.name} ${isUpgrade ? '(Upgrade)' : ''}`,
          order_id: orderId,
          handler: async (response) => {
            try {
              await paymentService.verifyPlanPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: plan.id
              });
              toast.success('Subscription activated successfully!');
              navigate('/user/home');
            } catch (e) {
              toast.error('Verification failed');
            }
          },
          prefill: {
            contact: userPhone
          },
          theme: {
            color: themeColors.primary
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (error) {
      console.error(error);
      toast.error('Payment initiation failed');
    }
  };

  // Fetch plan and user profile to determine discounts
  useEffect(() => {
    const fetchBenefits = async () => {
      try {
        const [plansRes, userRes] = await Promise.all([
          getPlans(),
          userAuthService.getProfile(), // Ensure we have latest status
        ]);

        if (plansRes.success && userRes.success && userRes.user?.plans?.isActive) {
          const userPlanName = userRes.user.plans.name;
          const activePlan = plansRes.data.find(p => p.name === userPlanName);

          if (activePlan) {
            setPlanBenefits({
              name: activePlan.name,
              freeCategories: activePlan.freeCategories || [],
              freeBrands: activePlan.freeBrands || [],
              freeServices: activePlan.freeServices || []
            });

          }
        }
      } catch (e) {
        console.error('Failed to load plan benefits', e);
      }
    };

    // Only fetch if not a plan purchase (standard checkout)
    if (!plan) {
      fetchBenefits();
    }
  }, [plan]);

  const [planBenefits, setPlanBenefits] = useState({ name: '', freeCategories: [], freeBrands: [], freeServices: [] });

  // Helper to normalize MongoDB IDs (handles strings, objects with _id, and $oid)
  const normalizeId = (id) => {
    if (!id) return null;
    if (typeof id === 'string') return id;
    if (id.$oid) return id.$oid;
    if (id._id) return normalizeId(id._id);
    return String(id);
  };

  // Calculate totals with Plan Benefits
  const calculateItemPrice = (item) => {
    if (plan) return item.price || 0; // Plan purchase

    const itemCatId = normalizeId(item.categoryId);
    const itemBrandId = normalizeId(item.brandId || item.sectionId);
    const itemServiceId = normalizeId(item.serviceId);

    // Check if free
    const isFreeCategory = itemCatId && planBenefits.freeCategories.some(cat => {
      return normalizeId(cat) === itemCatId;
    });

    const isFreeBrand = itemBrandId && planBenefits.freeBrands.some(brand => {
      return normalizeId(brand) === itemBrandId;
    });

    const isFreeService = itemServiceId && planBenefits.freeServices.some(svc => {
      return normalizeId(svc) === itemServiceId;
    });

    if (isFreeCategory || isFreeBrand || isFreeService) {
      return 0;
    }
    return item.price || 0;
  };

  const itemTotalBase = cartItems.reduce((sum, item) => sum + calculateItemPrice(item), 0);

  const evaluateLocalPricing = () => {
    let price = itemTotalBase;
    if (pricingRules.length === 0) return price;

    const formulaRule = pricingRules.find(r => r.ruleType === 'formula');
    const conditionalRules = pricingRules.filter(r => r.ruleType === 'conditional');

    if (formulaRule && formulaRule.formulaString) {
      try {
        let formula = formulaRule.formulaString;
        const vars = { basePrice: itemTotalBase, ...dynamicAnswers };
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
        console.error('Error evaluating local formula:', e);
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

    return Math.max(0, price);
  };

  const itemTotal = dynamicFieldsConfig.length > 0 ? evaluateLocalPricing() : itemTotalBase;
  // Calculate savings including Plan Savings
  const totalOriginalPrice = cartItems.reduce((sum, item) => {
    const original = (item.originalPrice || item.unitPrice || (item.price / (item.serviceCount || 1))) * (item.serviceCount || 1);
    // If priced 0, original is huge saving
    return sum + original;
  }, 0);

  const savings = Math.max(0, totalOriginalPrice - itemTotal);
  const taxesAndFee = 0; // GST is already included in the finalCustomerPrice from backend
  // Visited fee logic: if Total is 0 (All free), user might still pay visited fee?
  // User says "no payemtn". So maybe visited fee also waived? Or user pays visited fee?
  // "ask direct servicebooking" -> implies fully free.
  // Convenience fee is now fully removed per user request
  const finalVisitedFee = 0;

  const promoDiscount = appliedPromo ? appliedPromo.discountAmount : 0;
  const instantSurcharge = (bookingType === 'instant' && isInstantBookingEnabled) ? instantBookingMarkup : 0;
  const netBeforeLoyalty = Math.max(0, itemTotal - promoDiscount + taxesAndFee + finalVisitedFee + instantSurcharge);
  const pointsNeeded = Math.ceil(netBeforeLoyalty / loyaltyRedemptionRate);
  const maxLoyaltyRedeemable = Math.min(loyaltyPoints, pointsNeeded);
  const loyaltyDiscount = useLoyaltyPoints ? (maxLoyaltyRedeemable * loyaltyRedemptionRate) : 0;
  
  const netAfterLoyalty = Math.max(0, netBeforeLoyalty - loyaltyDiscount);
  const walletLimit = parseFloat((netAfterLoyalty * (maxWalletUsagePercentage / 100)).toFixed(2));
  const maxWalletRedeemable = Math.min(walletBalance, walletLimit);
  const parsedWalletInput = parseFloat(walletInputVal) || 0;
  const walletDiscount = Math.max(0, Math.min(parsedWalletInput, maxWalletRedeemable));
  
  const totalAmount = Math.max(0, netAfterLoyalty - walletDiscount);

  // Calculate total COD advance amount from cart items if set
  const customCodAdvanceSum = cartItems.reduce((sum, item) => {
    let itemCodAdvance = item.codAdvanceAmount || 0;
    
    if (!itemCodAdvance && item.serviceId) {
      if (item.serviceId.codAdvanceAmount) {
        itemCodAdvance = item.serviceId.codAdvanceAmount;
      } else if (Array.isArray(item.serviceId.packages)) {
        // Find selected package title from dynamicFields (for combo packages)
        const selectedPkgField = item.dynamicFields?.find(f => f.name === 'Selected Package' || f.label === 'Selected Package');
        const targetPkgTitle = selectedPkgField ? selectedPkgField.value : item.title;
        
        // Find matching package by title
        const matchedPkg = item.serviceId.packages.find(pkg => pkg.title === targetPkgTitle);
        if (matchedPkg && matchedPkg.codAdvanceAmount) {
          itemCodAdvance = matchedPkg.codAdvanceAmount;
        }
      }
    }
    
    // Also support checking packageId/comboId directly just in case
    if (!itemCodAdvance) {
      itemCodAdvance = item.packageId?.codAdvanceAmount || item.comboId?.codAdvanceAmount || 0;
    }
    
    const countVal = item.count || item.serviceCount || 1;
    return sum + (itemCodAdvance * countVal);
  }, 0);

  const baseTotalAmount = netAfterLoyalty;
  const baseAdvanceAmount = customCodAdvanceSum > 0 ? customCodAdvanceSum : Math.round(baseTotalAmount * (codAdvancePercentage / 100));
  const baseRemainingAmount = Math.max(0, baseTotalAmount - baseAdvanceAmount);

  const finalCodAdvanceAmount = Math.max(0, baseAdvanceAmount - walletDiscount);
  const unusedWalletDiscount = Math.max(0, walletDiscount - baseAdvanceAmount);
  const finalCodRemainingAmount = Math.max(0, baseRemainingAmount - unusedWalletDiscount);

  // If payment method is COD, the amount they pay online upfront is the advance amount
  const amountToPay = paymentMethod === 'pay_at_home' ? finalCodAdvanceAmount : totalAmount;

  console.log('[DEBUG] customCodAdvanceSum calculation:', {
    cartItems: cartItems.map(item => ({
      title: item.title,
      serviceIdExists: !!item.serviceId,
      serviceIdIsObject: typeof item.serviceId === 'object',
      serviceIdTitle: item.serviceId?.title,
      packagesLength: item.serviceId?.packages?.length,
      codAdvanceAmount: item.codAdvanceAmount,
      serviceIdCodAdvance: item.serviceId?.codAdvanceAmount
    })),
    customCodAdvanceSum,
    codAdvancePercentage,
    finalCodAdvanceAmount
  });

  // Helper for Free Plan Full Breakdown Display
  const displayTax = 0;
  const displayFee = 0;
  const displaySavings = totalAmount === 0 ? (totalOriginalPrice + displayTax + displayFee) : (savings + promoDiscount);

  // Date and time slot helper functions
  const getDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const getTimeSlots = () => {
    const allSlots = [
      { value: '09:00', end: '10:00', display: '9:00 AM' },
      { value: '10:00', end: '11:00', display: '10:00 AM' },
      { value: '11:00', end: '12:00', display: '11:00 AM' },
      { value: '12:00', end: '13:00', display: '12:00 PM' },
      { value: '13:00', end: '14:00', display: '1:00 PM' },
      { value: '14:00', end: '15:00', display: '2:00 PM' },
      { value: '15:00', end: '16:00', display: '3:00 PM' },
      { value: '16:00', end: '17:00', display: '4:00 PM' },
      { value: '17:00', end: '18:00', display: '5:00 PM' },
      { value: '18:00', end: '19:00', display: '6:00 PM' },
      { value: '19:00', end: '20:00', display: '7:00 PM' },
      { value: '20:00', end: '21:00', display: '8:00 PM' },
    ];

    // If today is selected, filter out past time slots
    const now = new Date();
    const isToday = selectedDate && selectedDate.toDateString() === now.toDateString();

    if (!isToday) {
      return allSlots;
    }

    // Use instantBookingWindowHours from admin settings as the buffer window
    // If user is in scheduled mode, add a 1-hour minimum buffer
    // If user is in instant mode, no need to filter (they book now)
    const currentHour = now.getHours();
    const bufferHours = instantBookingWindowHours > 0 ? instantBookingWindowHours : 4;
    const minHour = currentHour + bufferHours;

    return allSlots.filter(slot => {
      const slotHour = parseInt(slot.value.split(':')[0], 10);
      return slotHour >= minHour;
    });
  };

  const formatDate = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      day: days[date.getDay()],
      date: date.getDate(),
    };
  };



  const isDateSelected = (date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const isTimeSelected = (time) => {
    return selectedTime === time;
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-32 flex items-center justify-center" style={{ backgroundColor: 'var(--background)' }}>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4" style={{ borderColor: themeColors.button }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Loading checkout details...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0 && currentStep === 'details' && !searchingVendors && !showVendorModal) {
    return (
      <div className="min-h-screen pb-32" style={{ backgroundColor: 'var(--background)' }}>
        <header style={{ backgroundColor: 'var(--background)' }}>
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="p-1 rounded-full transition-colors"
                style={{ color: 'var(--text-primary)' }}
              >
                <FiArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-normal" style={{ color: 'var(--text-primary)' }}>Your cart</h1>
            </div>
          </div>
          <div className="border-b" style={{ borderColor: 'var(--border)' }}></div>
        </header>
        <main className="px-4 py-4">
          <div className="flex flex-col items-center justify-center py-20">
            <FiShoppingCart className="w-16 h-16 mb-4" style={{ color: 'var(--text-muted)' }} />
            <p className="text-lg font-normal" style={{ color: 'var(--text-secondary)' }}>Your cart is empty</p>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Add services to get started</p>
          </div>
        </main>
      </div>
    );
  }

  const handleSelectBid = async (bidId) => {
    try {
      toast.loading('Confirming vendor selection...');
      const response = await bookingService.acceptBid(bidId);
      toast.dismiss();

      if (response.success) {
        toast.success('Vendor confirmed!');
        const selectedBid = bids.find(b => b.bidId === bidId);
        setAcceptedVendor(selectedBid);
        setCurrentStep('accepted');

        setTimeout(() => {
          setShowVendorModal(false);
          navigate(`/user/booking-confirmation/${bookingRequest._id}`, { replace: true });
        }, 1500);
      } else {
        toast.error(response.message || 'Failed to select vendor');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to select vendor');
    }
  };

  const handleWait = () => {
    if (!bookingRequest?._id || bids.length === 0 || !socket) return;

    // Emit wait request to existing socket context
    socket.emit('user_wait_request', {
      bookingId: bookingRequest._id,
      vendorId: bids[0].vendorId
    });

    toast.success('Wait request sent to vendor. Searching for 5 mins.');
  };

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
          const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
          setDynamicAnswers(prev => ({ ...prev, [fieldName]: coords }));
          toast.success('Location coordinates captured!');
        },
        (error) => {
          toast.error('Failed to get current location. Please enter manually.');
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser.');
    }
  };

  return (
    <div className="min-h-screen pb-80" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <header className="border-b" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-1 rounded-full transition-colors"
            style={{ color: 'var(--text-primary)' }}
          >
            <FiArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-normal" style={{ color: 'var(--text-primary)' }}>
            {category ? `${category} Checkout` : 'Your cart'}
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4 lg:grid lg:grid-cols-[1fr_380px] lg:gap-8 lg:items-start">
        {/* LEFT COLUMN: Items and Options */}
        <div>
        {/* Savings Banner */}
        {savings > 0 && (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-green-200">
                <MdStar className="text-white w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-normal text-green-600 uppercase tracking-wider">Smart Choice!</p>
                <p className="text-sm font-normal text-slate-900">
                  You're saving ₹{savings.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
            <div className="bg-white px-3 py-1 rounded-full shadow-sm border border-green-100">
              <span className="text-[10px] font-normal text-green-600">BEST PRICE</span>
            </div>
          </div>
        )}

        {/* Cart Items */}
        <div className="space-y-4 mb-4">
          {cartItems.map((item) => {
            const brandName = item.brand || item.sectionTitle;
            const categoryName = item.categoryTitle || item.category;

            return (
              <div key={item._id} className="border rounded-xl p-4 shadow-sm relative overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
                {/* Brand Header */}
                {(brandName || categoryName) && (
                  <div className="flex items-center gap-2 mb-3 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
                    {item.sectionIcon ? (
                      <img src={toAssetUrl(item.sectionIcon)} className="w-5 h-5 rounded-md object-cover border" style={{ borderColor: 'var(--border)' }} alt="" />
                    ) : (
                      <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-normal" style={{ backgroundColor: 'var(--background)', color: 'var(--text-secondary)' }}>
                        {(brandName || "B").charAt(0)}
                      </div>
                    )}
                    <div className="flex flex-col leading-none">
                      {brandName && <span className="text-xs font-normal" style={{ color: 'var(--text-primary)' }}>{brandName}</span>}
                      {categoryName && <span className="text-[10px] font-medium uppercase tracking-wide mt-0.5" style={{ color: 'var(--text-secondary)' }}>{categoryName}</span>}
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 pr-4">
                    <h3 className="text-base font-normal mb-1 leading-snug" style={{ color: 'var(--text-primary)' }}>{item.title}</h3>
                    {item.description && (
                      <p className="text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{item.description}</p>
                    )}
                    {item.duration && (
                      <div className="flex items-center gap-1 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <FiClock className="w-3 h-3" />
                        {item.duration}
                      </div>
                    )}
                  </div>
                  {!item.isPlan && (
                    <div className="flex flex-col items-end gap-2">
                      <div
                        className="flex items-center rounded-xl border overflow-hidden"
                        style={{ borderColor: 'var(--primary)' }}
                      >
                        <button
                          onClick={() => handleQuantityChange(item._id, -1)}
                          className="w-8 h-8 flex items-center justify-center transition-all active:scale-90"
                          style={{ color: 'var(--primary)' }}
                        >
                          <FiMinus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{item.serviceCount || 1}</span>
                        <button
                          onClick={() => handleQuantityChange(item._id, 1)}
                          className="w-8 h-8 flex items-center justify-center transition-all active:scale-90"
                          style={{ color: 'var(--primary)' }}
                        >
                          <FiPlus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                  {!item.isPlan && (
                    <button
                      onClick={() => handleRemoveItem(item._id)}
                      className="absolute top-3 right-3 p-1.5 rounded-full transition-colors"
                      style={{ color: 'var(--primary)' }}
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-normal" style={{ color: 'var(--text-primary)' }}>
                    {item.isPriceDisclosed === false ? (
                      <span className="text-[11px] font-normal uppercase tracking-tighter px-2 py-0.5 rounded border" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>Not Disclosed</span>
                    ) : calculateItemPrice(item) === 0 ? (
                      <span className="text-green-600 font-semibold">Free</span>
                    ) : (
                      `₹${(item.price || 0).toLocaleString('en-IN')}`
                    )}
                  </span>
                  {calculateItemPrice(item) === 0 && (
                    <span className="text-[10px] font-normal bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                      WITH PLAN
                    </span>
                  )}
                  {calculateItemPrice(item) > 0 && (() => {
                    const unitPrice = item.unitPrice || (item.price / (item.serviceCount || 1));
                    const unitOriginalPrice = item.originalPrice || unitPrice;
                    const currentTotal = item.price;
                    const originalTotal = unitOriginalPrice * (item.serviceCount || 1);
                    if (originalTotal > currentTotal) {
                      return (
                        <span className="text-sm text-gray-400 line-through">
                          ₹{originalTotal.toLocaleString('en-IN')}
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Dynamic Fields Section */}
        {dynamicFieldsConfig.length > 0 && (
          <div className="border rounded-xl p-5 mb-4 shadow-sm" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <h3 className="text-sm font-normal mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <span className="p-1 bg-indigo-50 text-indigo-600 rounded">
                <FiSliders className="w-4 h-4" />
              </span>
              Service Details
            </h3>
            <div className="space-y-4">
              {dynamicFieldsConfig.map((field) => {
                const value = dynamicAnswers[field.name] || '';
                return (
                  <div key={field._id || field.name} className="space-y-1">
                    <label className="block text-xs font-normal" style={{ color: 'var(--text-secondary)' }}>
                      {field.label} {field.isRequired && <span className="text-red-500">*</span>}
                    </label>

                    {/* Render inputs based on type */}
                    {field.fieldType === 'text' && (
                      <input
                        type="text"
                        className="w-full p-2.5 border rounded-xl text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                        style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        value={value}
                        onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [field.name]: e.target.value }))}
                        required={field.isRequired}
                      />
                    )}

                    {field.fieldType === 'number' && (
                      <input
                        type="number"
                        className="w-full p-2.5 border rounded-xl text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                        style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        value={value}
                        onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [field.name]: e.target.value }))}
                        required={field.isRequired}
                      />
                    )}

                    {field.fieldType === 'textarea' && (
                      <textarea
                        className="w-full p-2.5 border rounded-xl text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                        style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        rows={3}
                        value={value}
                        onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [field.name]: e.target.value }))}
                        required={field.isRequired}
                      />
                    )}

                    {field.fieldType === 'dropdown' && (
                      <select
                        className="w-full p-2.5 border rounded-xl text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                        style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
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
                        className="w-full p-2.5 border rounded-xl text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                        style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        value={value}
                        onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [field.name]: e.target.value }))}
                        required={field.isRequired}
                      />
                    )}

                    {field.fieldType === 'time' && (
                      <input
                        type="time"
                        className="w-full p-2.5 border rounded-xl text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                        style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
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
                          className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        {uploadingFiles[field.name] && <p className="text-[10px] text-indigo-600 animate-pulse">Uploading file to Cloudinary...</p>}
                        {value && (
                          <div className="flex items-center gap-2 p-1.5 rounded-lg border" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
                            <span className="text-[10px] text-green-700 font-bold bg-green-50 px-1.5 py-0.5 rounded border border-green-150">UPLOADED</span>
                            <a href={value} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline truncate flex-1">{value}</a>
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
                          className="flex-1 p-2.5 border rounded-xl text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                          style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                          value={value}
                          onChange={(e) => setDynamicAnswers(prev => ({ ...prev, [field.name]: e.target.value }))}
                          required={field.isRequired}
                        />
                        <button
                          type="button"
                          onClick={() => fetchCurrentLocation(field.name)}
                          className="px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-semibold border border-indigo-150"
                        >
                          Locate Me
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="border rounded-lg p-4 mb-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiPhone className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{contactDetails.name || JSON.parse(localStorage.getItem('userData'))?.name || 'Verified Customer'}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{contactDetails.phone || userPhone || 'Loading...'}</p>
              </div>
            </div>
            <button
              onClick={() => setShowContactModal(true)}
              className="text-sm font-medium hover:underline"
              style={{ color: themeColors.button }}
            >
              Change
            </button>
          </div>
        </div>

        {/* Optional GST Number Input */}
        <div className="border rounded-lg p-4 mb-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>GST Number <span className="text-xs font-normal" style={{ color: 'var(--text-secondary)' }}>(Optional – for GST invoice)</span></p>
          </div>
          <input
            id="checkout-gst-number"
            type="text"
            placeholder="Enter GSTIN (e.g. 22AAAAA0000A1Z5)"
            value={userGstNumber}
            onChange={(e) => setUserGstNumber(e.target.value.toUpperCase())}
            maxLength={15}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ backgroundColor: 'var(--input-bg, #f9fafb)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          />
          {userGstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(userGstNumber) && (
            <p className="text-xs mt-1" style={{ color: '#f59e0b' }}>Please enter a valid 15-character GSTIN</p>
          )}
        </div>

        {/* Promo Code Application Panel */}
        <div className="border rounded-xl p-5 mb-4 shadow-sm" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <FiCheckCircle className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-normal" style={{ color: 'var(--text-primary)' }}>Promo Code</h3>
          </div>

          {appliedPromo ? (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-green-500 rounded-lg flex items-center justify-center text-white font-normal text-sm shrink-0">
                  %
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-normal tracking-wide uppercase" style={{ color: 'var(--text-primary)' }}>{appliedPromo.code}</span>
                    <span className="text-[10px] font-normal text-green-700 bg-green-100 px-2 py-0.5 rounded-full uppercase">APPLIED</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                    Saved ₹{appliedPromo.discountAmount} extra!
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemovePromo}
                className="text-xs font-normal text-red-600 hover:text-red-700 hover:underline px-2.5 py-1.5 rounded-lg transition-all"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Enter coupon code (e.g. FLAT50)"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value.toUpperCase());
                      setPromoError('');
                    }}
                    disabled={promoLoading}
                    className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-semibold placeholder:text-gray-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all uppercase"
                    style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={promoLoading || !promoCode.trim()}
                  className="px-5 py-2.5 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shrink-0 active:scale-95"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  {promoLoading ? 'Applying...' : 'Apply'}
                </button>
              </div>
              {promoError && (
                <p className="text-xs font-bold text-red-600 flex items-center gap-1 mt-1 pl-1">
                  <FiInfo className="w-3.5 h-3.5 shrink-0" />
                  {promoError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Wallet Balance Panel */}
        <div className="border rounded-xl p-5 mb-4 shadow-sm" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-50 text-emerald-500 rounded-xl text-lg shrink-0">
                  👛
                </span>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>User Wallet Balance</h3>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Available: ₹{walletBalance}
                  </p>
                </div>
              </div>
              {walletBalance > 0 && (
                <span className="text-[10px] text-gray-400 font-bold bg-slate-50 border px-2.5 py-1 rounded-xl">
                  Max Allowed: ₹{maxWalletRedeemable}
                </span>
              )}
            </div>

            {walletBalance > 0 ? (
              <div className="space-y-2 mt-1">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      min="0"
                      max={maxWalletRedeemable}
                      step="any"
                      placeholder="Enter amount to redeem"
                      value={walletInputVal}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setWalletInputVal('');
                          return;
                        }
                        const num = parseFloat(val);
                        if (num > maxWalletRedeemable) {
                          setWalletInputVal(maxWalletRedeemable.toString());
                          toast.error(`Maximum allowable wallet usage is ₹${maxWalletRedeemable}`);
                        } else if (num < 0) {
                          setWalletInputVal('0');
                        } else {
                          setWalletInputVal(val);
                        }
                      }}
                      className="w-full pl-7 pr-12 py-2.5 border rounded-xl text-sm font-semibold placeholder:text-gray-400 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setWalletInputVal(maxWalletRedeemable.toString())}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg transition-all"
                    >
                      MAX
                    </button>
                  </div>
                </div>
                {walletDiscount > 0 && (
                  <p className="text-xs text-green-600 font-bold pl-1 flex items-center gap-1">
                    <span>✓</span> Deducted from wallet: -₹{walletDiscount}
                  </p>
                )}
                {walletBalance > 0 && (
                  <p className="text-[10px] text-slate-400 pl-1">
                    (Max {maxWalletUsagePercentage}% usage per booking: ₹{walletLimit} max)
                  </p>
                )}
              </div>
            ) : (
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-dashed text-xs text-slate-400 font-semibold">
                <span>Wallet is empty</span>
                <span className="text-[10px] font-bold uppercase bg-gray-150 px-2 py-0.5 rounded">0 Balance</span>
              </div>
            )}
          </div>
        </div>

        {/* Loyalty Points Panel */}
        <div className="border rounded-xl p-5 mb-4 shadow-sm" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-amber-50 text-amber-500 rounded-xl text-lg shrink-0">
                🎁
              </span>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Loyalty Points</h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Balance: {loyaltyPoints} points (1 Point = ₹{loyaltyRedemptionRate})</p>
              </div>
            </div>
            {loyaltyPoints > 0 ? (
              <button
                type="button"
                onClick={() => setUseLoyaltyPoints(prev => !prev)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${useLoyaltyPoints ? 'bg-teal-600' : 'bg-gray-200 dark:bg-zinc-700'}`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${useLoyaltyPoints ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            ) : (
              <span className="text-[10px] text-gray-400 font-bold uppercase bg-gray-50 border px-2 py-0.5 rounded">0 Points</span>
            )}
          </div>
          {useLoyaltyPoints && maxLoyaltyRedeemable > 0 && (
            <div className="mt-2.5 pt-2.5 border-t border-dashed flex justify-between text-xs text-green-600 font-medium" style={{ borderColor: 'var(--border)' }}>
              <span>Points to redeem:</span>
              <span>-{maxLoyaltyRedeemable} points (Saved ₹{maxLoyaltyRedeemable * loyaltyRedemptionRate})</span>
            </div>
          )}
        </div>

        {/* Payment Method Selector */}
        <div className="border rounded-xl p-5 mb-4 shadow-sm" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">💰</span>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Payment Method</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Online Payment */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setPaymentMethod('online')}
                className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg border-2 transition-all w-full max-w-[160px] min-h-[80px] justify-center ${
                  paymentMethod === 'online'
                    ? 'border-red-600 bg-transparent'
                    : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 bg-transparent'
                }`}
              >
                <span className="text-base">📱</span>
                <span className="text-[11px] font-bold" style={{ color: paymentMethod === 'online' ? '#dc2626' : 'var(--text-secondary)' }}>Online Payment</span>
                <span className="text-[8px] text-gray-400 leading-none">UPI/Card/NetBank</span>
                {paymentMethod === 'online' && (
                  <span className="text-[8px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full mt-0.5">Selected ✓</span>
                )}
              </button>
            </div>

            {/* Cash on Delivery */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setPaymentMethod('pay_at_home')}
                className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg border-2 transition-all w-full max-w-[160px] min-h-[80px] justify-center ${
                  paymentMethod === 'pay_at_home'
                    ? 'border-red-600 bg-transparent'
                    : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 bg-transparent'
                }`}
              >
                <span className="text-base">💵</span>
                <span className="text-[11px] font-bold" style={{ color: paymentMethod === 'pay_at_home' ? '#dc2626' : 'var(--text-secondary)' }}>Pay At Home</span>
                <span className="text-[8px] text-gray-400 leading-none">Pay after service</span>
                {paymentMethod === 'pay_at_home' && (
                  <span className="text-[8px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full mt-0.5">Selected ✓</span>
                )}
              </button>
            </div>
          </div>
          {paymentMethod === 'pay_at_home' && (
            <div className="mt-3 bg-red-50/50 dark:bg-zinc-900/50 border border-red-100 dark:border-zinc-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="text-red-500 text-xs">ℹ️</span>
                <div className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 space-y-1">
                  <p className="leading-relaxed">
                    {finalCodAdvanceAmount > 0 ? (
                      <span>
                        As per booking rules, an advance payment of <strong className="text-red-600 font-extrabold">₹{finalCodAdvanceAmount}</strong> is required online to place this booking.
                      </span>
                    ) : (
                      <span>No advance payment is required for Pay At Home (COD).</span>
                    )}
                  </p>
                  <p className="text-[10px] text-gray-450 dark:text-gray-500 font-bold">
                    Remaining amount payable after service: <span className="text-gray-900 dark:text-gray-150">₹{finalCodRemainingAmount}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        </div>

        {/* RIGHT COLUMN: Sidebar (Sticky on Desktop) */}
        <div className="lg:sticky lg:top-24 space-y-6">
          {/* Booking Type Toggle (Desktop Sidebar View) */}
          <div className="hidden lg:block border rounded-xl p-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <span>🕒</span> Booking Schedule
            </h3>
            <div className="flex p-1 rounded-xl mb-1" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
              {isInstantBookingEnabled && (
                <button
                  onClick={() => setBookingType('instant')}
                  className="flex-1 py-2 text-xs font-normal rounded-lg transition-all flex items-center justify-center gap-1.5"
                  style={bookingType === 'instant'
                    ? { backgroundColor: '#fef9c3', color: '#854d0e', fontWeight: 600 }
                    : { color: 'var(--text-muted)' }}
                >
                  <span className="text-yellow-500">⚡</span> Instant
                  {instantBookingMarkup > 0 && (
                    <span className="text-[9px] font-bold bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded-full">
                      +₹{instantBookingMarkup}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={() => setBookingType('scheduled')}
                className="flex-1 py-2 text-xs font-normal rounded-lg transition-all flex items-center justify-center gap-1.5"
                style={bookingType === 'scheduled' ? { backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' } : { color: 'var(--text-muted)' }}
              >
                <span>📅</span> Slot Booking
              </button>
            </div>
            {bookingType === 'scheduled' && (
              <p className="text-[10px] text-center font-medium mt-1 mb-1" style={{ color: 'var(--text-muted)' }}>
                📅 Choose date & slot via Edit button below
              </p>
            )}
            {bookingType === 'instant' && isInstantBookingEnabled && (
              <p className="text-[10px] text-center text-yellow-700 font-medium mt-1 mb-1">
                ⚡ Priority Service{showArrivalTime ? `: Arrives in ~${instantBookingWaitTime} mins` : ''} · +₹{instantBookingMarkup}
              </p>
            )}

            {/* Address & Slot summary inside sidebar for Desktop */}
            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              {(houseNumber || addressDetails) ? (
                <div className="space-y-3">
                  {/* Address info */}
                  <div className="flex items-start gap-2.5">
                    <FiHome className="w-4 h-4 mt-0.5 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Address</p>
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {houseNumber ? `${houseNumber}, ` : ''}{address || 'Select Address'}
                      </p>
                    </div>
                    <button onClick={() => setShowAddressModal(true)} className="text-xs text-teal-600 font-semibold hover:underline">Edit</button>
                  </div>
                  {/* Time slot info */}
                  {bookingType === 'scheduled' && (
                    <div className="flex items-start gap-2.5">
                      <FiClock className="w-4 h-4 mt-0.5 text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Slot</p>
                        <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {selectedDate ? (() => {
                            const { day, date: dateNum } = formatDate(selectedDate);
                            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            const month = monthNames[selectedDate.getMonth()];
                            const timeStr = selectedTime && getTimeSlots().find(slot => slot.value === selectedTime)?.display ? ` • ${getTimeSlots().find(slot => slot.value === selectedTime).display}` : '';
                            return `${day}, ${dateNum} ${month}${timeStr}`;
                          })() : (
                            <span className="text-gray-400">Select Date & Time</span>
                          )}
                        </p>
                      </div>
                      <button onClick={() => setShowTimeSlotModal(true)} className="text-xs text-teal-600 font-semibold hover:underline">Edit</button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="w-full py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-semibold transition-all"
                >
                  + Add Delivery Address
                </button>
              )}
            </div>
          </div>

        {/* Payment Summary */}
        <div className="border-2 rounded-2xl p-5 mb-6 shadow-sm overflow-hidden relative" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
          {/* Decorative Background for Header */}
          <div className="absolute top-0 left-0 right-0 h-1" style={{ background: themeColors.gradient }}></div>

          <h3 className="text-lg font-normal mb-5 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <FiShoppingCart className="w-5 h-5" style={{ color: themeColors.button }} />
            Payment Summary
          </h3>

          <div className="space-y-3">
            {/* Original Price (before plan) */}
            <div className="flex justify-between items-center">
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Item Total</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                ₹{totalOriginalPrice.toLocaleString('en-IN')}
              </span>
            </div>

            {/* Discount Line */}
            {savings > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-green-600">Plan/Item Discount</span>
                <span className="text-sm font-medium text-green-600">-₹{savings.toLocaleString('en-IN')}</span>
              </div>
            )}

            {/* Promo Discount Line */}
            {appliedPromo && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-indigo-600 flex items-center gap-1">
                  <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-1.5 py-0.5 rounded uppercase">{appliedPromo.code}</span>
                  Promo Discount
                </span>
                <span className="text-sm font-bold text-indigo-600">-₹{appliedPromo.discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}

            {/* Upgrade Credit (for plan upgrades) */}
            {upgradePreview && upgradePreview.credit > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span className="text-sm font-medium">Plan Credit</span>
                <span className="text-sm font-bold">-₹{upgradePreview.credit.toLocaleString('en-IN')}</span>
              </div>
            )}

            {/* Loyalty Points Discount Row */}
            {loyaltyDiscount > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span className="text-sm font-medium">Loyalty Discount</span>
                <span className="text-sm font-bold">-₹{loyaltyDiscount.toLocaleString('en-IN')}</span>
              </div>
            )}

            {/* Wallet Balance Discount Row */}
            {walletDiscount > 0 && (
              <div className="flex justify-between items-center text-green-600">
                <span className="text-sm font-medium">Wallet Discount</span>
                <span className="text-sm font-bold">-₹{walletDiscount.toLocaleString('en-IN')}</span>
              </div>
            )}

            {/* Instant Booking Surcharge */}
            {instantSurcharge > 0 && (
              <div className="flex justify-between items-center" style={{ color: 'var(--text-primary)' }}>
                <span className="text-sm font-medium flex items-center gap-1">
                  <span className="text-yellow-500">⚡</span> Instant Booking Fee
                </span>
                <span className="text-sm font-bold text-yellow-600">+₹{instantSurcharge.toLocaleString('en-IN')}</span>
              </div>
            )}

            {/* Divider */}
            <div className="border-t pt-4 mt-2" style={{ borderColor: 'var(--border)' }}>
              <div className="flex justify-between items-center">
                <span className="text-base font-normal" style={{ color: 'var(--text-primary)' }}>Total Payable</span>
                <div className="flex flex-col items-end">
                  {totalAmount === 0 ? (
                    <>
                      <span className="text-sm font-medium text-gray-400 line-through">
                        ₹{Math.round(totalOriginalPrice + displayTax + displayFee).toLocaleString('en-IN')}
                      </span>
                      <span className="text-xl font-normal text-green-600">FREE</span>
                    </>
                  ) : (
                    <span className="text-xl font-normal" style={{ color: 'var(--text-primary)' }}>
                      ₹{totalAmount.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>

              {paymentMethod === 'pay_at_home' && totalAmount > 0 && finalCodAdvanceAmount > 0 && (
                <div className="mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-zinc-800 space-y-1.5 text-xs text-right">
                  <div className="flex justify-between text-gray-500 dark:text-gray-450">
                    <span>Pay Online (Advance):</span>
                    <span className="font-bold text-gray-900 dark:text-gray-150">₹{finalCodAdvanceAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-gray-550 dark:text-gray-450 font-bold">
                    <span>Pay at Home (COD):</span>
                    <span className="text-red-600">₹{finalCodRemainingAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Important Note regarding Base Price */}
        <div className="bg-blue-50/10 border border-blue-100/30 rounded-xl p-4 mb-4 flex items-start gap-4 shadow-sm">
          <div className="bg-blue-100/20 p-2 rounded-full shrink-0 mt-0.5">
            <FiInfo className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-normal text-blue-600 mb-1">Note</h4>
            <p className="text-sm leading-relaxed font-medium" style={{ color: 'var(--text-secondary)' }}>
              This is a base booking cost. Additional service cost is decided by the vendor after service bill preparation.
            </p>
          </div>
        </div>

        {/* Free Plan Benefit Card */}
        {totalAmount === 0 && (
          <div className="bg-linear-to-br from-green-50/10 to-emerald-100/10 border border-green-200/30 rounded-2xl p-5 mb-4 relative overflow-hidden">
            <div className="flex items-start gap-4 z-10 relative">
              <div className="bg-green-500 rounded-full p-2 shadow-lg shadow-green-200 shrink-0">
                <FiCheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-normal text-green-600 mb-1">Covered by {planBenefits.name}</h3>
                <p className="text-sm leading-relaxed font-medium opacity-90" style={{ color: 'var(--text-secondary)' }}>
                  You save <span className="font-normal">₹{Math.round(totalOriginalPrice + displayTax + displayFee).toLocaleString('en-IN')}</span> on this booking!
                  Your plan covers all costs.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation Policy */}
        <div className="border rounded-lg p-4 mb-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
          <h3 className="text-base font-normal mb-2" style={{ color: 'var(--text-primary)' }}>Cancellation policy</h3>
          <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>
            Free cancellations if done more than 12 hrs before the service or if a professional isn't assigned. A fee will be charged otherwise.
          </p>
          <button
            onClick={() => navigate('/user/cancellation-policy')}
            className="text-sm font-medium hover:underline"
            style={{ color: themeColors.button }}
          >
            Read full policy
          </button>
        </div>

        {/* Desktop Direct Action Button inside Sidebar */}
        <div className="hidden lg:block">
          <button
            onClick={plan ? handlePlanPayment :
              (houseNumber || addressDetails) ?
                (currentStep === 'payment' ? handlePayment : handleSearchVendors) :
                handleProceed}
            disabled={searchingVendors}
            className="w-full text-white py-4 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-lg shadow-teal-500/30"
            style={{ backgroundColor: themeColors.button }}
          >
            {searchingVendors ? 'Searching for vendors...' :
              currentStep === 'payment' ? (totalAmount === 0 ? 'Confirm Booking (Free)' : (paymentMethod === 'online' ? 'Proceed to Pay' : 'Confirm Booking')) :
                plan ? 'Proceed to Payment' :
                  bookingType === 'instant' ? '⚡ Book Instantly Now' :
                    (selectedDate && selectedTime && houseNumber ?
                      'Find Vendors for Slot' :
                      (houseNumber || addressDetails) ? 'Select Date & Time Slot' : 'Add address to proceed')}
          </button>
        </div>
        </div>
      </main>

      {/* Bottom Action Button (Mobile View Only) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t lg:hidden" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>

        {/* Booking Type Toggle */}
        <div className="px-4 pt-3 pb-0">
          <div className="flex p-1 rounded-xl mb-1" style={{ backgroundColor: 'var(--background)', border: '1px solid var(--border)' }}>
            {isInstantBookingEnabled && (
              <button
                onClick={() => setBookingType('instant')}
                className="flex-1 py-2 text-sm font-normal rounded-lg transition-all flex items-center justify-center gap-2"
                style={bookingType === 'instant'
                  ? { backgroundColor: '#fef9c3', color: '#854d0e', fontWeight: 600 }
                  : { color: 'var(--text-muted)' }}
              >
                <span className="text-yellow-500">⚡</span> Instant
                {instantBookingMarkup > 0 && (
                  <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full">
                    +₹{instantBookingMarkup}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setBookingType('scheduled')}
              className="flex-1 py-2 text-sm font-normal rounded-lg transition-all flex items-center justify-center gap-2"
              style={bookingType === 'scheduled' ? { backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' } : { color: 'var(--text-muted)' }}
            >
              <span>📅</span> Slot Booking
            </button>
          </div>
          {bookingType === 'scheduled' && (
            <p className="text-[10px] text-center font-medium mt-1 mb-1" style={{ color: 'var(--text-muted)' }}>
              📅 Choose a date & time slot below
            </p>
          )}
          {bookingType === 'instant' && isInstantBookingEnabled && (
            <p className="text-xs text-center text-yellow-700 font-medium mt-1 mb-1">
              ⚡ Priority Service{showArrivalTime ? `: Professional arrives in ~${instantBookingWaitTime} mins` : ''} · +₹{instantBookingMarkup} surcharge
            </p>
          )}
        </div>

        {/* Address and Slot Display */}
        <div className="px-4 pt-2 pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
          {(houseNumber || addressDetails) ? (
            <div className="space-y-2.5">
              {/* Address */}
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(0, 166, 166, 0.1)' }}>
                  <FiHome className="w-4 h-4" style={{ color: themeColors.button }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Address</p>
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {houseNumber ? `${houseNumber}, ` : ''}{address || 'Select Address'}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="p-1.5 rounded-full transition-colors shrink-0 mt-0.5"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <FiEdit2 className="w-4 h-4" />
                </button>
              </div>

              {/* Time Slot (Only for Scheduled) */}
              {bookingType === 'scheduled' && (
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(0, 166, 166, 0.1)' }}>
                    <FiClock className="w-4 h-4" style={{ color: themeColors.button }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>Time Slot</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {selectedDate ? (() => {
                        const { day, date: dateNum } = formatDate(selectedDate);
                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        const month = monthNames[selectedDate.getMonth()];
                        const timeStr = selectedTime && getTimeSlots().find(slot => slot.value === selectedTime)?.display ? ` • ${getTimeSlots().find(slot => slot.value === selectedTime).display}` : '';
                        return `${day}, ${dateNum} ${month}${timeStr}`;
                      })() : (
                        <span className="text-gray-400">Select Date & Time</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowTimeSlotModal(true)}
                    className="p-1.5 rounded-full transition-colors shrink-0 mt-0.5"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div
              onClick={() => setShowAddressModal(true)}
              className="flex items-center justify-between p-3 bg-red-50/10 border border-red-100/30 rounded-xl cursor-pointer active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <FiHome className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-normal text-red-600">Delivery Address Missing</p>
                  <p className="text-xs text-red-500">Please add address to see availability</p>
                </div>
              </div>
              <FiEdit2 className="w-4 h-4 text-red-400" />
            </div>
          )}
        </div>

        <div className="p-4">
          <button
            onClick={plan ? handlePlanPayment :
              (houseNumber || addressDetails) ?
                (currentStep === 'payment' ? handlePayment : handleSearchVendors) :
                handleProceed}
            disabled={searchingVendors}
            className="w-full text-white py-3 rounded-lg text-base font-semibold transition-colors disabled:opacity-50 shadow-lg shadow-teal-500/30"
            style={{ backgroundColor: themeColors.button }}
          >
            {searchingVendors ? 'Searching for vendors...' :
              currentStep === 'payment' ? (totalAmount === 0 ? 'Confirm Booking (Free)' : (paymentMethod === 'online' ? 'Proceed to Pay' : 'Confirm Booking')) :
                plan ? 'Proceed to Payment' :
                  bookingType === 'instant' ? '⚡ Book Instantly Now' :
                    (selectedDate && selectedTime && houseNumber ?
                      'Find Vendors for Slot' :
                      (houseNumber || addressDetails) ? 'Select Date & Time Slot' : 'Add address to proceed')}
          </button>
        </div>
      </div>

      {/* Live Booking Status Card (Visible when minimized) */}
      <LiveBookingCard key={bookingRequest?._id || 'default'} />

      {/* Vendor Search Modal */}
      <VendorSearchModal
        isOpen={showVendorModal}
        onClose={() => {
          setShowVendorModal(false);
          if (currentStep === 'accepted') {
            setCurrentStep('payment');
          } else if (currentStep === 'failed') {
            setCurrentStep('details');
          }
        }}
        currentStep={currentStep}
        acceptedVendor={acceptedVendor}
        bids={bids}
        onSelectBid={handleSelectBid}
        onWait={handleWait}
        onRetry={() => {
          setBids([]);
          handleSearchVendors();
        }}
        onCancelSearch={handleCancelSearch}
        bookingDeadline={bookingRequest?.biddingDeadline}
        maxSearchTimeMinutes={maxSearchTimeMinutes}
      />

      {/* Contact Details Edit Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl p-6 shadow-xl animate-scale-in border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Update Contact Details</h3>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>These details will be used for this booking only.</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Name</label>
                <input
                  type="text"
                  value={contactDetails.name}
                  onChange={(e) => setContactDetails(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full mt-1 p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>Phone Number</label>
                <div className="flex gap-2">
                  <span className="p-3 border rounded-xl font-medium select-none" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-muted)' }}>+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={contactDetails.phone?.replace('+91', '')?.replace(/^\+91/, '') || ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setContactDetails(prev => ({ ...prev, phone: val }));
                    }}
                    className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                    style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                    placeholder="9999999999"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setShowContactModal(false)}
                  className="py-3 rounded-xl font-bold transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (contactDetails.name.length < 2) {
                      toast.error('Please enter a valid name');
                      return;
                    }
                    if (!contactDetails.phone || contactDetails.phone.length < 10) {
                      toast.error('Please enter a valid 10-digit phone number');
                      return;
                    }
                    setShowContactModal(false);
                  }}
                  className="py-3 rounded-xl font-bold text-white shadow-lg shadow-teal-500/30 active:scale-95 transition-all"
                  style={{ backgroundColor: themeColors.button }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Address Selection Modal */}
      <AddressSelectionModal
        isOpen={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        address={address}
        houseNumber={houseNumber}
        onHouseNumberChange={setHouseNumber}
        onSave={handleAddressSave}
      />

      {/* Time Slot Modal */}
      <TimeSlotModal
        isOpen={showTimeSlotModal}
        onClose={() => setShowTimeSlotModal(false)}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onDateSelect={setSelectedDate}
        onTimeSelect={setSelectedTime}
        onSave={handleTimeSlotSave}
        getDates={getDates}
        getTimeSlots={getTimeSlots}
        formatDate={formatDate}
        isDateSelected={isDateSelected}
        isTimeSelected={isTimeSelected}
        instantBookingWindowHours={instantBookingWindowHours}
      />
    </div>
  );
};

export default Checkout;
