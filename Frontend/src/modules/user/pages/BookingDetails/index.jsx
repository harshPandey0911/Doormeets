import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import html2pdf from 'html2pdf.js';
import useAppNotifications from '../../../../hooks/useAppNotifications';
import { themeColors } from '../../../../theme';
import { MdQrCode } from 'react-icons/md';
import {
  FiArrowLeft,
  FiMapPin,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiLoader,
  FiCalendar,
  FiDollarSign,
  FiPackage,
  FiEdit2,
  FiPhone,
  FiMail,
  FiKey,
  FiStar,
  FiAward,
  FiX,
  FiUser,
  FiChevronRight,
  FiChevronDown,
  FiChevronUp,
  FiSearch,
  FiHome,
  FiAlertCircle,
  FiFileText
} from 'react-icons/fi';
import { bookingService } from '../../../../services/bookingService';
import { paymentService } from '../../../../services/paymentService';
import { cartService } from '../../../../services/cartService';
import RatingModal from '../../components/booking/RatingModal';
import PaymentVerificationModal from '../../components/booking/PaymentVerificationModal';
import { ConfirmDialog } from '../../../../components/common';
import ReviewCard from '../../components/booking/ReviewCard';
import NotificationBell from '../../components/common/NotificationBell';
import { apiCache } from '../../../../utils/apiCache';
import { configService } from '../../../../services/configService';
import { downloadInvoice } from '../../utils/invoiceGenerator';


const toAssetUrl = (url) => {
  if (!url) return '';
  const clean = url.replace('/api/upload', '/upload');
  if (clean.startsWith('http')) return clean;
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/api$/, '');
  return `${base}${clean.startsWith('/') ? '' : '/'}${clean}`;
};

const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [booking, setBooking] = useState(() => {
    if (!id) return null;
    const cacheKey = `user:booking:${id}`;
    // Use getStale() — show even expired cache instantly (SWR: background refresh will update)
    const cached = apiCache.getStale(cacheKey);
    if (cached && cached.success) {
      const data = { ...cached.data };
      if (data.paymentMethod === 'plan_benefit') {
        if (!data.tax) data.tax = (data.basePrice || 0) * 0.18;
        if (!data.visitingCharges && !data.visitationFee) data.visitingCharges = 49;
      }
      return data;
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    if (!id) return true;
    const cacheKey = `user:booking:${id}`;
    // loading=true only if no cache at all (first visit) — stale cache counts as loaded
    const stale = apiCache.getStale(cacheKey);
    return !stale;
  });
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paying, setPaying] = useState(false);
  const [isOrderSummaryExpanded, setIsOrderSummaryExpanded] = useState(true);
  const [isLocationExpanded, setIsLocationExpanded] = useState(true);
  const [isPaymentSummaryExpanded, setIsPaymentSummaryExpanded] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { }
  });

  const [supportInfo, setSupportInfo] = useState({
    email: 'support@doormeets.com',
    phone: ''
  });

  const [companyDetails, setCompanyDetails] = useState({
    companyName: 'Doormeets',
    companyGSTIN: '',
    companyPAN: '',
    companyAddress: '',
    companyCity: '',
    companyState: '',
    companyPincode: '',
    companyPhone: '',
    companyEmail: '',
    companyCIN: '',
    companyWebsite: '',
    vendorCgstPercentage: 2.5,
    vendorSgstPercentage: 2.5
  });

  const [cancellationTimeLeft, setCancellationTimeLeft] = useState(true);
  const [cancelCountdown, setCancelCountdown] = useState(null);

  const handleDownloadInvoice = async () => {
    downloadInvoice(booking, companyDetails);
  };

  // Cancellation window real-time timer check
  useEffect(() => {
    if (!booking) return;

    const checkTime = () => {
      const createdTime = new Date(booking.createdAt).getTime();
      const elapsedMs = Date.now() - createdTime;
      const remainingMs = (3 * 60 * 1000) - elapsedMs;
      if (remainingMs > 0) {
        setCancelCountdown(Math.ceil(remainingMs / 1000));
      } else {
        setCancelCountdown(0);
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 1000); // Check every second for countdown
    return () => clearInterval(interval);
  }, [booking]);

  const formatTime = (seconds) => {
    if (seconds == null) return '';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const socket = useAppNotifications();

  // Fetch support settings via centralized cached configService
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const result = await configService.getSettings();
        const settings = result?.settings;
        if (settings) {
          const { supportEmail, supportPhone } = settings;
          setSupportInfo({
            email: supportEmail || 'help@doormeets.com',
            phone: supportPhone || '+919999999999'
          });
          setCompanyDetails({
            companyName: settings.companyName || 'Doormeeets',
            companyGSTIN: settings.companyGSTIN || '',
            companyPAN: settings.companyPAN || '',
            companyAddress: settings.companyAddress || '',
            companyCity: settings.companyCity || '',
            companyState: settings.companyState || '',
            companyPincode: settings.companyPincode || '',
            companyPhone: settings.companyPhone || '',
            companyEmail: settings.companyEmail || '',
            companyCIN: settings.companyCIN || '',
            companyWebsite: settings.companyWebsite || '',
            vendorCgstPercentage: settings.vendorCgstPercentage || 2.5,
            vendorSgstPercentage: settings.vendorSgstPercentage || 2.5,
            sacCode: (settings.sacCode !== undefined && settings.sacCode !== null) ? settings.sacCode : '998599',
            invoiceTitle: settings.invoiceTitle || 'Convenience and Platform Fee'
          });
        }
      } catch (error) {
        console.error('Failed to fetch support settings:', error);
        setSupportInfo({
          email: 'help@doormeets.com',
          phone: '+919999999999'
        });
      }
    };
    fetchSettings();
  }, []);

  // Function to load booking
  const loadBooking = async () => {
    try {
      const cacheKey = `user:booking:${id}`;
      // Only show skeleton if there's absolutely no cached data (stale included)
      const hasAnyCached = apiCache.getStale(cacheKey);
      if (!hasAnyCached) {
        setLoading(true);
      }
      // Don't set loading true on refresh to avoid flicker
      const response = await bookingService.getById(id);
      if (response.success) {
        const data = { ...response.data };
        // Calculate notional display values for plan_benefit
        if (data.paymentMethod === 'plan_benefit') {
          if (!data.tax) data.tax = (data.basePrice || 0) * 0.18;
          if (!data.visitingCharges && !data.visitationFee) data.visitingCharges = 49;
        }
        setBooking(data);
      } else {
        toast.error(response.message || 'Booking not found');
        navigate('/user/my-bookings', { replace: true });
      }
    } catch (error) {
      // Failed to load booking details
      // toast.error('Failed to load booking details'); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadBooking();
    }
  }, [id, navigate]);

  // Auto-show rating modal ONLY when booking is fully completed AND paid
  useEffect(() => {
    if (booking) {
      const isCompleted = ['completed', 'work_done'].includes(booking.status?.toLowerCase());
      const isPaid = ['success', 'paid', 'collected_by_vendor'].includes(booking.paymentStatus?.toLowerCase());
      const isRated = !!booking.rating;
      const isDismissed = localStorage.getItem(`rating_dismissed_${id}`);

      // Only show rating modal if work is done AND payment is verified
      if (isCompleted && isPaid && !isRated && !isDismissed) {
        setShowRatingModal(true);
      }
    }
  }, [booking, id]);

  // Track if we've shown the payment modal this session to prevent re-opening on data refresh


  // Handle Payment Modal Visibility - Auto-open on new payment request from vendor
  useEffect(() => {
    if (!booking) return;

    const isPaymentDone = booking.paymentStatus === 'success' || booking.cashCollected === true;

    // Track the latest OTP to detect a fresh payment request from the vendor
    const lastSeenOtp = sessionStorage.getItem(`last_seen_otp_${booking._id}`);
    const hasNewOtpRequest = booking.customerConfirmationOTP && booking.customerConfirmationOTP !== lastSeenOtp;

    // We also show if it was never shown and we have a pending payment request
    const hasShown = sessionStorage.getItem(`payment_modal_shown_${booking._id}`);

    if (!isPaymentDone && (hasNewOtpRequest || (!hasShown && (booking.customerConfirmationOTP || booking.qrPaymentInitiated)))) {
      setShowPaymentModal(true);
      sessionStorage.setItem(`payment_modal_shown_${booking._id}`, 'true');
      if (booking.customerConfirmationOTP) {
        sessionStorage.setItem(`last_seen_otp_${booking._id}`, booking.customerConfirmationOTP);
      }
    } else if (booking.qrPaymentInitiated === false && booking.customerConfirmationOTP && !isPaymentDone) {
      // Re-trigger if it switches from QR to Cash
      setShowPaymentModal(true);
    }
    // Close if payment becomes done
    else if (isPaymentDone) {
      setShowPaymentModal(false);
    }
  }, [booking]);

  // Socket Listener for Real-time Updates
  useEffect(() => {
    if (socket && id) {
      // Handler for booking updates
      const handleUpdate = (data) => {
        // Check if update relates to this booking
        if (data.bookingId === id || data.relatedId === id || data.data?.bookingId === id) {

          // Instant UI update for critical fields (status, OTPs, amounts)
          setBooking(prev => {
            if (!prev) return prev;
            const newData = { ...prev, ...(data.data || data) };

            // Calculate notional display values for plan_benefit
            if (newData.paymentMethod === 'plan_benefit') {
              if (!newData.tax) newData.tax = (newData.basePrice || 0) * 0.18;
              if (!newData.visitingCharges && !newData.visitationFee) newData.visitingCharges = 49;
            }
            return newData;
          });

          // Fetch full data to ensure consistency
          apiCache.invalidate(`user:booking:${id}`);
          loadBooking();

          if (data.message) {
            toast(data.message, { icon: '🔔' });
          }
        }
      };

      // Handler for payment_required event — auto-trigger Razorpay
      const handlePaymentRequired = (data) => {
        if (data.bookingId === id) {
          toast.success(data.message || 'Vendor accepted! Please pay to confirm.', { icon: '💳', duration: 5000 });
          // Reload booking to get latest status
          loadBooking();
          // Auto-trigger online payment after short delay (to ensure booking state is loaded)
          setTimeout(() => {
            handleOnlinePayment();
          }, 1500);
        }
      };

      socket.on('booking_updated', handleUpdate);
      socket.on('notification', handleUpdate);
      socket.on('payment_required', handlePaymentRequired);

      return () => {
        socket.off('booking_updated', handleUpdate);
        socket.off('notification', handleUpdate);
        socket.off('payment_required', handlePaymentRequired);
      };
    }
  }, [socket, id]);

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'accepted':
        return <FiCheckCircle className="w-5 h-5 text-green-500" />;
      case 'in_progress':
      case 'journey_started':
        return <FiLoader className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'visited':
        return <FiMapPin className="w-5 h-5 text-[#9E2E2A]" />;
      case 'completed':
        return <FiCheckCircle className="w-5 h-5 text-white" />;
      case 'cancelled':
        return <FiXCircle className="w-5 h-5 text-red-500" />;
      case 'awaiting_payment':
      case 'work_done':
        return <FiClock className="w-5 h-5 text-orange-500" />;
      case 'requested':
      case 'searching':
        return <FiSearch className="w-5 h-5 text-amber-500 animate-pulse" />;
      case 'bidding':
        return <FiDollarSign className="w-5 h-5 text-purple-500 animate-bounce" />;
      default:
        return <FiClock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'accepted':
        return { backgroundColor: '#F0FDF4', color: '#16A34A', borderColor: '#BBF7D0' };
      case 'in_progress':
      case 'journey_started':
        return { backgroundColor: '#EFF6FF', color: '#2563EB', borderColor: '#BFDBFE' };
      case 'visited':
        return { backgroundColor: '#FFF7ED', color: '#C2410C', borderColor: '#FFEDD5' };
      case 'completed':
        return { backgroundColor: '#B33A35', color: '#FFFFFF', borderColor: 'transparent' };
      case 'cancelled':
        return { backgroundColor: '#FEF2F2', color: '#EF4444', borderColor: '#FEE2E2' };
      case 'awaiting_payment':
      case 'work_done':
        return { backgroundColor: '#FEF3C7', color: '#D97706', borderColor: '#FDE68A' };
      case 'requested':
      case 'searching':
        return { backgroundColor: '#FFFBEB', color: '#D97706', borderColor: '#FDE68A' };
      case 'bidding':
        return { backgroundColor: '#FAF5FF', color: '#9333EA', borderColor: '#E9D5FF' };
      default:
        return { backgroundColor: '#F9FAFB', color: '#4B5563', borderColor: '#E5E7EB' };
    }
  };

  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
      case 'accepted': return 'Confirmed';
      case 'journey_started': return 'Agent En Route';
      case 'visited': return 'Agent Arrived';
      case 'in_progress': return 'In Progress';
      case 'work_done': return 'Work Done'; // Payment Pending
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'requested':
      case 'searching': return 'Finding Expert';
      case 'bidding': return 'Bidding in Progress';
      default: return status?.replace('_', ' ') || 'Pending';
    }
  };

  // ... (keep handle methods same) ...

  const handleCancelBooking = async () => {
    // Check if journey has started to determine if a fee applies
    const journeyStarted = ['journey_started', 'visited', 'in_progress'].includes(booking.status?.toLowerCase());
    const cancellationFee = booking.visitingCharges || 49;

    const modalTitle = journeyStarted ? 'Cancellation Fee Applies' : 'Cancel Booking';
    const modalMessage = journeyStarted
      ? `The service agent has already started their journey. Cancelling now will incur a fee of ₹${cancellationFee}, which will be deducted from your wallet or refund amount. Do you want to proceed?`
      : 'Are you sure you want to cancel this booking? You will receive a full refund if applicable. This action cannot be undone.';

    setConfirmDialog({
      isOpen: true,
      title: modalTitle,
      message: modalMessage,
      type: 'danger',
      onConfirm: async () => {
        try {
          const response = await bookingService.cancel(booking._id || booking.id, 'Cancelled by user');
          if (response.success) {
            toast.success('Booking cancelled successfully');
            loadBooking();
          } else {
            toast.error(response.message || 'Failed to cancel booking');
          }
        } catch (error) {
          toast.error('Failed to cancel booking. Please try again.');
        }
      }
    });
  };

  const handleOnlinePayment = async () => {
    if (paying) return;

    // If a Razorpay order already exists for this booking and hasn't been used, skip creating a new one
    if (booking.razorpayOrderId && !isAddonPending) {
      // Open Razorpay with existing order
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: Math.round((booking.finalAmount || 0) * 100),
        currency: 'INR',
        order_id: booking.razorpayOrderId,
        name: 'Doormeets',
        description: `Payment for ${booking.serviceName}`,
        handler: async function (response) {
          toast.loading('Verifying payment...');
          const verifyResponse = await paymentService.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
          toast.dismiss();

          if (verifyResponse.success) {
            toast.success('Payment successful!');
            window.location.reload();
          } else {
            toast.error('Payment verification failed');
          }
          setPaying(false);
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
          }
        },
        prefill: { name: 'User', contact: '' },
        theme: { color: themeColors.button }
      };
      setPaying(true);
      const razorpay = new window.Razorpay(options);
      razorpay.open();
      return;
    }

    try {
      setPaying(true);
      toast.loading('Creating payment order...');
      const orderResponse = await paymentService.createOrder(booking._id || booking.id, 'online');
      toast.dismiss();

      if (!orderResponse.success) {
        toast.error(orderResponse.message || 'Failed to create payment order');
        setPaying(false);
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: Math.round(orderResponse.data.amount * 100),
        currency: orderResponse.data.currency || 'INR',
        order_id: orderResponse.data.orderId,
        name: 'Doormeets',
        description: `Payment for ${booking.serviceName}`,
        handler: async function (response) {
          toast.loading('Verifying payment...');
          const verifyResponse = await paymentService.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          });
          toast.dismiss();

          if (verifyResponse.success) {
            toast.success('Payment successful!');
            loadBooking();
          } else {
            toast.error('Payment verification failed');
          }
          setPaying(false);
        },
        modal: {
          onhighlight: function () { },
          ondismiss: function () {
            setPaying(false);
          }
        },
        prefill: {
          name: 'User',
          contact: ''
        },
        theme: {
          color: themeColors.button
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to process payment');
      setPaying(false);
    }
  };

  const handlePayAtHome = async () => {
    try {
      toast.loading('Confirming request...');
      const response = await paymentService.confirmPayAtHome(booking._id || booking.id);
      toast.dismiss();

      if (response.success) {
        toast.success('Payment method selected!');
        setShowPaymentModal(false);
        loadBooking();
      } else {
        toast.error(response.message || 'Failed to confirm booking');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to process request');
    }
  };


  const handleRateSubmit = async (ratingData) => {
    try {
      const response = await bookingService.addReview(booking._id || booking.id, ratingData);
      if (response.success) {
        toast.success('Thank you for your feedback!');
        setShowRatingModal(false);
        loadBooking();
      } else {
        toast.error(response.message || 'Failed to submit review');
      }
    } catch (error) {
      if (error?.response?.data?.message === 'Booking already reviewed') {
        toast.success('Your feedback was already recorded!');
        setShowRatingModal(false);
        loadBooking();
      } else {
        toast.error('Failed to submit review');
      }
    }
  };


  const getAddressString = (address) => {
    if (typeof address === 'string') return address;
    if (address && typeof address === 'object') {
      return `${address.addressLine1 || ''}${address.addressLine2 ? `, ${address.addressLine2}` : ''}, ${address.city || ''}, ${address.state || ''} - ${address.pincode || ''}`;
    }
    return 'N/A';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-light-bg pb-32">
        {/* Skeleton Header */}
        <header className="bg-card-bg/80 backdrop-blur-md sticky top-0 z-40 border-b border-border-color">
          <div className="px-4 py-3">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-5 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </header>
        {/* Skeleton Body */}
        <main className="max-w-xl mx-auto px-4 py-6 space-y-6">
          <div className="bg-card-bg rounded-3xl p-6 shadow-sm border border-border-color h-24 animate-pulse"></div>
          <div className="bg-card-bg rounded-3xl p-6 shadow-sm border border-border-color h-32 animate-pulse"></div>
          <div className="bg-card-bg rounded-3xl p-6 shadow-sm border border-border-color h-48 animate-pulse"></div>
          <div className="bg-card-bg rounded-3xl p-6 shadow-sm border border-border-color h-64 animate-pulse"></div>
        </main>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center relative bg-light-bg">
        {/* Clean Theme Background */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0"
            style={{
              background: 'var(--background)'
            }}
          />
        </div>
        <div className="text-center relative z-10 px-6">
          <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6">
            <FiSearch className="w-10 h-10 text-gray-300" />
          </div>
          <p className="text-gray-500 font-bold">Booking not found</p>
          <button
            onClick={() => navigate('/user/my-bookings', { replace: true })}
            className="mt-6 px-8 py-3 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all"
          >
            Go to My Bookings
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // --- Payment Breakdown Calculations ---
  // Default values from booking (fallback)
  const isPlanBenefit = booking.paymentMethod === 'plan_benefit';
  const bill = booking.bill;

  // Base Logic (Services)
  // Use bill.originalServiceBase if available, else booking.basePrice
  const originalBase = bill ? (bill.originalServiceBase || 0) : (parseFloat(booking.basePrice) || 0);

  // Extra Services & Parts from vendor bill (if available)
  const allBillServices = bill?.services || [];
  const services = allBillServices.filter(s => !s.isOriginal);
  const originalServiceFromBill = allBillServices.find(s => s.isOriginal);
  const parts = bill?.parts || [];
  const customItems = bill?.customItems || [];

  let extraServiceBase = 0;
  let extraServiceGST = 0;
  services.forEach(s => {
    // s.price is UNIT BASE PRICE. s.total is INCLUSIVE.
    const qty = parseFloat(s.quantity) || 1;
    const base = (parseFloat(s.price) || 0) * qty;
    const gst = parseFloat(s.gstAmount) || 0;
    extraServiceBase += base;
    extraServiceGST += gst;
  });

  let partsBase = 0;
  let partsGST = 0;
  parts.forEach(p => {
    const qty = parseFloat(p.quantity) || 1;
    partsBase += ((parseFloat(p.price) || 0) * qty);
    partsGST += (parseFloat(p.gstAmount) || 0);
  });
  customItems.forEach(c => {
    const qty = parseFloat(c.quantity) || 1;
    partsBase += ((parseFloat(c.price) || 0) * qty);
    partsGST += (parseFloat(c.gstAmount) || 0);
  });

  // Use bill.originalGST if available — when no bill, use stored tax (GST already included in customer price)
  const originalGST = bill ? (bill.originalGST || 0) : (parseFloat(booking.tax) || 0);
  const totalGST = originalGST + extraServiceGST + partsGST;

  // Instant Booking Markup
  const instantMarkup = parseFloat(booking.instantMarkupCharged) || 0;

  // Final Total
  const hasBill = !!bill;
  const finalTotal = bill?.grandTotal || (booking.finalAmount || booking.totalAmount || 0);
  const isAddonPending = (booking.finalAmount || 0) > (booking.totalAmount || 0) && services.length > 0;

  // --------------------------------------

  return (
    <div className="min-h-screen pb-32 relative bg-light-bg text-dark-text font-['Inter']">
      {/* Clean Theme Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0"
          style={{
            background: 'var(--background)'
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Modern Glassmorphism Header */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-card-bg/40 border-b border-border-color w-full">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (location.key !== 'default') {
                    navigate(-1);
                  } else {
                    navigate('/user/my-bookings', { replace: true });
                  }
                }}
                className="w-10 h-10 bg-card-bg rounded-xl flex items-center justify-center shadow-sm border border-border-color"
              >
                <FiArrowLeft className="w-5 h-5 text-dark-text" />
              </button>
              <div className="flex-1">
                <h1 className="text-xl font-semibold text-dark-text tracking-tight">Booking Details</h1>
                <p className="text-[10px] text-secondary-text font-semibold uppercase tracking-widest mt-0.5">
                  ID: <span className="font-mono">{booking.bookingNumber || booking._id?.slice(-8).toUpperCase()}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-3 md:px-4 py-3 lg:grid lg:grid-cols-[1fr_380px] lg:gap-6 lg:items-start space-y-3 lg:space-y-0">
          {/* LEFT COLUMN: Main details, tracker, images, vendor info */}
          <div className="space-y-3">


            {/* Cancelled/Rejected status message */}
            {['cancelled', 'rejected'].includes(booking.status?.toLowerCase()) && (
              <div className="bg-red-50 rounded-md p-3 border border-red-100 flex items-center gap-2.5 text-red-700">
                <FiXCircle className="w-4 h-4 shrink-0" />
                <p className="font-medium text-xs">This booking has been {booking.status.toLowerCase()}.</p>
              </div>
            )}

            {/* Visual Progress Stepper */}
            {!['cancelled', 'rejected'].includes(booking.status?.toLowerCase()) && (
              <div className="bg-card-bg rounded-md px-3 py-2.5 shadow-sm border border-border-color overflow-hidden">
                <div className="flex justify-between relative">
                  {[
                    { label: 'Booked', icon: <FiCheckCircle className="w-3.5 h-3.5" />, active: true },
                    { label: 'Assigned', icon: '2', active: ['accepted', 'confirmed', 'assigned', 'journey_started', 'visited', 'in_progress', 'work_done', 'completed'].includes(booking.status?.toLowerCase()) },
                    { label: 'Started', icon: '3', active: ['journey_started', 'visited', 'in_progress', 'work_done', 'completed'].includes(booking.status?.toLowerCase()) },
                    { label: 'Done', icon: '4', active: ['work_done', 'completed'].includes(booking.status?.toLowerCase()) },
                  ].map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1 flex-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${step.active ? 'bg-[#B33A35] text-white shadow-sm' : 'bg-divider text-secondary-text'}`}>
                        {step.icon}
                      </div>
                      <p className={`text-[8px] font-bold uppercase tracking-wider text-center transition-colors ${step.active ? 'text-[#B33A35]' : 'text-secondary-text'}`}>{step.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Badge */}
            <div className="flex items-center justify-center">
              <div
                style={getStatusStyle(booking.status)}
                className="px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-xs border"
              >
                {getStatusIcon(booking.status)}
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">{getStatusLabel(booking.status)}</span>
              </div>
            </div>

            {/* Broadcast/Searching State Card */}
            {!booking.workerId && !booking.assignedTo && ['requested', 'searching', 'bidding'].includes(booking.status?.toLowerCase()) && (
              <div className="bg-card-bg rounded-md p-6 shadow-sm border border-border-color relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full -translate-y-16 translate-x-16 blur-3xl opacity-50 group-hover:opacity-80 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-md bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-sm">
                      <FiSearch className="w-6 h-6 text-amber-500 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-dark-text leading-tight">Finding Your Expert</h3>
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                        {booking.status?.toLowerCase() === 'bidding' ? 'Accepting Quotes' : 'Broadcast in Progress'}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-secondary-text mb-4 leading-relaxed font-medium">
                    {booking.status?.toLowerCase() === 'bidding'
                      ? "Vendors are now submitting their best prices for your request. View the quotes below and pick the best one!"
                      : "We've sent your request to all verified experts in your area. You'll be notified automatically as soon as someone accepts."}
                  </p>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs text-secondary-text bg-light-bg rounded-md p-3 border border-border-color">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping"></span>
                      <span>Waiting for quotes from nearby partners...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bids List Section */}
            {booking.status?.toLowerCase() === 'bidding' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Quotes Received</h3>
                  <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">LIVE</span>
                </div>
                <BidsList bookingId={id} onAccept={() => loadBooking()} />
              </div>
            )}

            {/* Service Partner Card — Enhanced */}
            {(booking.workerId || booking.assignedTo || booking.vendorId) && ['accepted', 'confirmed', 'assigned', 'journey_started', 'visited', 'in_progress', 'work_done'].includes(booking.status?.toLowerCase()) && (
              <div className="bg-card-bg rounded-md shadow-xs md:shadow-sm border border-border-color overflow-hidden">
                {/* Top bar */}
                <div className="px-3.5 md:px-5 py-2.5 md:py-3 flex justify-between items-center border-b border-border-color bg-light-bg/50">
                  {['journey_started', 'visited', 'in_progress'].includes(booking.status?.toLowerCase()) ? (
                    <div className="flex items-center gap-1.5 md:gap-2">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <p className="text-[10px] md:text-xs font-bold text-green-600 tracking-wider">LIVE TRACKING ACTIVE</p>
                    </div>
                  ) : (
                    <p className="text-[10px] md:text-xs font-bold text-secondary-text tracking-wider uppercase">Your Professional</p>
                  )}
                  <button
                    onClick={() => navigate(`/user/booking/${booking._id || booking.id}/track`)}
                    className="text-[10px] md:text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    Map View <FiChevronRight />
                  </button>
                </div>

                {/* Provider Info */}
                <div className="px-3.5 md:px-5 py-3 md:py-4 flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 rounded-md overflow-hidden bg-divider border border-border-color shrink-0 flex items-center justify-center">
                    {(booking.workerId?.profileImage || booking.workerId?.profilePhoto || booking.assignedTo?.profileImage || booking.assignedTo?.profilePhoto || booking.vendorId?.profileImage || booking.vendorId?.profilePhoto) ? (
                      <>
                        <img
                          src={toAssetUrl(booking.workerId?.profileImage || booking.workerId?.profilePhoto || booking.assignedTo?.profileImage || booking.assignedTo?.profilePhoto || booking.vendorId?.profileImage || booking.vendorId?.profilePhoto)}
                          alt="Professional"
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.querySelector('.fallback-icon').style.display = 'block'; }}
                        />
                        <FiUser className="w-5 h-5 md:w-7 md:h-7 text-secondary-text m-auto fallback-icon hidden" />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiUser className="w-5 h-5 md:w-7 md:h-7 text-secondary-text" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold md:font-bold text-dark-text text-sm md:text-base truncate">
                      {booking.workerId?.name || booking.assignedTo?.name || booking.vendorId?.name || 'Service Partner'}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5 md:mt-1">
                      <div className="flex items-center gap-1 bg-yellow-500/10 px-1.5 md:px-2 py-0.5 rounded-md border border-yellow-500/20">
                        <FiStar className="w-3 h-3 text-yellow-500 fill-current" />
                        <span className="text-[10px] md:text-xs font-bold text-yellow-500">
                          {(booking.workerId?.rating || booking.assignedTo?.rating || booking.vendorId?.rating || 0) > 0
                            ? (booking.workerId?.rating || booking.assignedTo?.rating || booking.vendorId?.rating).toFixed(1)
                            : 'New'}
                        </span>
                      </div>
                      <span className="text-[10px] md:text-xs text-secondary-text font-medium">• Verified</span>
                    </div>
                  </div>

                  {/* Call Button */}
                  {(() => {
                    const currentStatus = (booking.status || '').toLowerCase().replace(/_/g, ' ').trim();
                    const journeyActive = ['journey started', 'journey_started', 'journey', 'visited', 'in progress', 'in_progress', 'work done', 'work_done'].includes(currentStatus);
                    const vendorPhone = booking.workerId?.phone || booking.assignedTo?.phone || booking.vendorId?.phone;
                    if (journeyActive && vendorPhone) {
                      return (
                        <a
                          href={`tel:${vendorPhone}`}
                          className="w-9 h-9 md:w-11 md:h-11 bg-green-500/10 text-green-500 rounded-md flex items-center justify-center hover:bg-green-500/20 transition-colors active:scale-95 border border-green-500/20"
                        >
                          <FiPhone className="w-4 h-4 md:w-5 md:h-5" />
                        </a>
                      );
                    }
                    const carePhone = supportInfo.phone || '+919999999999';
                    return (
                      <a
                        href={`tel:${carePhone}`}
                        className="flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 md:px-3 md:py-2 bg-amber-500/10 text-amber-600 rounded-md hover:bg-amber-500/20 transition-colors active:scale-95 border border-amber-500/20"
                        title="Customer Care"
                      >
                        <FiPhone className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider">CARE</span>
                      </a>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Arrival OTP Card - Show during early stages until verified (Highly Compact & Non-Colorful) */}
            {(booking.arrivalOTP || booking.visitOtp) && ['confirmed', 'assigned', 'journey_started'].includes(booking.status?.toLowerCase()) && (
              <div className="relative overflow-hidden rounded-md border border-gray-100 bg-white p-4 mb-4 shadow-sm">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2.5 w-full mb-3">
                    <div className="w-9 h-9 rounded-md bg-teal-50 flex items-center justify-center border border-teal-100 shrink-0">
                      <FiMapPin className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-800 tracking-tight">Verification OTP</h3>
                      <p className="text-[10px] text-gray-400 font-medium">Share when professional reaches</p>
                    </div>
                  </div>

                  {/* OTP Display */}
                  <div className="flex justify-center gap-2 mb-3">
                    {String(booking.arrivalOTP || booking.visitOtp).split('').map((digit, idx) => (
                      <div
                        key={idx}
                        className="w-10 h-12 bg-gray-50 rounded-md flex items-center justify-center border border-gray-200 shadow-xs"
                      >
                        <span className="text-xl font-extrabold text-teal-600">{digit}</span>
                      </div>
                    ))}
                  </div>

                  <div className="w-full bg-gray-50 rounded-lg py-2 px-3 border border-gray-100">
                    <div className="flex items-center justify-center gap-1.5 text-gray-500 text-xs">
                      <span className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-pulse"></span>
                      <p className="font-semibold text-[10px]">Waiting for professional to reach your location</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Professional Arrived Notification - Only after OTP verified */}
            {booking?.status?.toLowerCase() === 'visited' && (
              <div className="relative overflow-hidden rounded-md border border-emerald-200 bg-emerald-50 active:scale-[0.98] transition-all">
                <div className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-md bg-emerald-100 flex items-center justify-center border border-emerald-200 shrink-0">
                    <FiCheckCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-emerald-800 tracking-tight">Professional Arrived</h3>
                    <p className="text-sm text-emerald-600 font-medium">Expert is at your location and starting the work.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Waiting for Vendor to initiate Payment */}
            {!booking.customerConfirmationOTP && ['work_done'].includes(booking.status?.toLowerCase()) && !booking.cashCollected && (
              <div className="bg-card-bg rounded-md p-6 shadow-lg border border-border-color mb-6 flex items-center gap-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-brand/5 rounded-full -translate-y-12 translate-x-12 blur-2xl"></div>
                <div className="w-12 h-12 rounded-md bg-brand/10 flex items-center justify-center shrink-0 border border-brand/20">
                  <FiLoader className="w-6 h-6 text-brand animate-spin" />
                </div>
                <div className="relative z-10">
                  <h3 className="font-bold text-dark-text">Finalizing Bill</h3>
                  <p className="text-sm text-secondary-text">Professional is finalizing payment details. Please wait a moment...</p>
                </div>
              </div>
            )}

            {/* Plan Covered Card - Show for plan_benefit bookings (before OTP is sent) */}
            {(booking.paymentStatus === 'plan_covered' || (booking.paymentMethod === 'plan_benefit' && booking.paymentStatus !== 'success')) &&
              ['visited', 'in_progress', 'work_done', 'completed'].includes(booking.status?.toLowerCase()) &&
              !booking.customerConfirmationOTP && (
                <div className="relative overflow-hidden rounded-md shadow-lg border border-emerald-100 mb-6">
                  <div className="absolute inset-0 bg-linear-to-br from-emerald-500 via-teal-600 to-green-700 opacity-95"></div>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.15)_0%,transparent_50%)]"></div>

                  <div className="relative z-10 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                        <FiCheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">
                          {booking.status?.toLowerCase() === 'work_done' ? 'Finalizing Bill' : 'Plan Benefit Active'}
                        </h3>
                        <p className="text-xs font-medium text-emerald-100">
                          {booking.status?.toLowerCase() === 'work_done' ? 'Vendor preparing final bill' : 'Base service covered by your plan'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white/15 backdrop-blur-sm rounded-md p-4 border border-white/20">
                      <div className="flex items-center gap-3 mb-2">
                        <FiCheckCircle className="w-5 h-5 text-emerald-200" />
                        <span className="font-bold text-white">Base Service Covered</span>
                      </div>
                      <p className="text-sm text-emerald-100 leading-relaxed">
                        Your base service fee is covered by your membership plan. {booking.status?.toLowerCase() === 'work_done' ? 'The vendor is preparing the final bill for any additional charges.' : 'You may only need to pay for extra parts or services.'}
                      </p>
                    </div>

                    {booking.status?.toLowerCase() === 'work_done' && (
                      <div className="mt-4 flex items-center justify-center gap-2 text-white/80">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium">Waiting for vendor to finalize...</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Payment Card - Show when work is done AND bill is finalized (OTP exists), paid, if online payment is pending, or if an addon is pending */}
            {(((booking.paymentMethod === 'online' || booking.paymentMethod === 'Qr online') && booking.paymentStatus?.toLowerCase() === 'pending') || booking.customerConfirmationOTP || booking.paymentStatus === 'success' || isAddonPending) && !booking.cashCollected && !['cancelled', 'rejected'].includes(booking.status?.toLowerCase()) && (
              <div
                onClick={() => { if (booking.customerConfirmationOTP) setShowPaymentModal(true); }}
                className={`relative overflow-hidden rounded-md shadow-xs border border-border-color p-3 bg-white dark:bg-zinc-900 ${booking.customerConfirmationOTP ? 'cursor-pointer' : ''}`}
              >
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center border shrink-0 ${booking.paymentStatus === 'success'
                    ? 'bg-green-500/10 border-green-500/20 text-green-600'
                    : 'bg-teal-500/10 border-teal-500/20 text-teal-600'
                    }`}>
                    {booking.paymentStatus === 'success' ? (
                      <FiCheckCircle className="w-4 h-4" />
                    ) : (
                      <FiDollarSign className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-xs md:text-sm font-bold text-dark-text tracking-tight">
                      {booking.paymentStatus === 'success' ? 'Payment Received' : 'Online Payment'}
                    </h3>
                    <p className="text-[11px] text-secondary-text font-medium leading-tight">
                      {booking.paymentStatus === 'success' ? 'Transaction verified successfully' : 'Complete your online payment'}
                    </p>
                  </div>
                </div>

                {/* Action Button for Online Payment - Only show if not paid */}
                {booking.paymentStatus !== 'success' && (
                  <>
                    <button
                      onClick={handleOnlinePayment}
                      className="w-full py-2 mb-2.5 bg-brand text-white rounded-md font-bold text-xs shadow-xs active:scale-95 transition-all hover:bg-brand-light flex items-center justify-center gap-2 group"
                    >
                      <FiDollarSign className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                      Pay Online Now
                      <FiChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {booking.customerConfirmationOTP && (
                      <div className="flex flex-col items-center mb-2.5">
                        <p className="text-[9px] font-bold text-secondary-text uppercase tracking-widest mb-1.5">Verification Code</p>
                        <div className="flex justify-center gap-1.5">
                          {String(booking.customerConfirmationOTP).split('').map((digit, idx) => (
                            <div
                              key={idx}
                              className="w-8 h-9 bg-light-bg rounded-[4px] flex items-center justify-center border border-border-color shadow-xs"
                            >
                              <span className="text-base font-bold text-dark-text">{digit}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-[8px] text-secondary-text mt-1.5 font-medium bg-light-bg border border-border-color px-2.5 py-0.5 rounded-[4px]">
                          Share this code with the professional ONLY after your satisfaction
                        </p>
                      </div>
                    )}
                  </>
                )}

                <div className="bg-light-bg rounded-md p-2.5 border border-border-color">
                  <div className="flex items-center gap-2 text-dark-text">
                    {booking.paymentStatus === 'success' ? (
                      <FiCheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                    ) : (
                      <FiClock className="w-4 h-4 text-teal-500 shrink-0" />
                    )}
                    <div className="text-[11px] leading-tight">
                      {booking.paymentStatus === 'success'
                        ? (
                          booking.paymentMethod === 'plan_benefit'
                            ? <p className="font-semibold">Covered by your Membership Plan</p>
                            : <p className="font-semibold">Booking completed successfully. Thank you for choosing us!</p>
                        )
                        : <p className="font-semibold">Total Amount: <span className="text-xs font-bold text-brand ml-1">₹{(booking.finalAmount || booking.totalAmount || 0).toLocaleString('en-IN')}</span></p>
                      }
                      {booking.paymentStatus !== 'success' && <p className="text-[9px] text-secondary-text mt-0.5">Pay online above or prepare cash for the professional.</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Location & Time Section */}
            <section className="space-y-3">
              {/* Dedicated Track Button - Only visible when journey started */}
              {['journey_started', 'visited', 'in_progress'].includes(booking.status?.toLowerCase()) && (
                <button
                  onClick={() => navigate(`/user/booking/${booking._id || booking.id}/track`)}
                  className="w-full py-2.5 bg-linear-to-r from-gray-900 to-gray-800 text-white rounded-md font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                    <FiMapPin className="w-3.5 h-3.5 text-white" />
                  </div>
                  Track Service Agent
                </button>
              )}

              <div className="bg-card-bg rounded-md shadow-xs border border-border-color overflow-hidden">
                <div
                  onClick={() => setIsLocationExpanded(!isLocationExpanded)}
                  className="px-3.5 py-2.5 border-b border-border-color bg-light-bg/50 flex items-center justify-between cursor-pointer active:bg-gray-50 transition-colors"
                >
                  <h3 className="font-semibold text-xs md:text-sm text-dark-text">Location & Schedule</h3>
                  {isLocationExpanded ? (
                    <FiChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <FiChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                {isLocationExpanded && (
                  <div className="p-3.5 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0 border border-teal-500/20">
                        <FiMapPin className="w-4 h-4 text-teal-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-secondary-text font-bold uppercase tracking-wider mb-0.5">Service Address</p>
                        <p className="text-xs font-medium text-dark-text leading-snug">{getAddressString(booking.address)}</p>
                      </div>
                    </div>
                    <div className="w-full h-px bg-divider"></div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
                        <FiCalendar className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-secondary-text font-bold uppercase tracking-wider mb-0.5">Slot</p>
                        <p className="text-xs font-medium text-dark-text">{formatDate(booking.scheduledDate)}</p>
                        <p className="text-xs text-secondary-text">{booking.scheduledTime || booking.timeSlot?.start || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>



            {/* Service Details (Order Summary Dropdown with dynamic Badges) - Only show if Payment Summary is NOT visible */}
            {!(['work_done', 'completed'].includes(booking.status?.toLowerCase()) || booking.paymentStatus === 'success' || booking.cashCollected) && (
              <section className="bg-card-bg rounded-md shadow-xs border border-border-color overflow-hidden">
                <div
                  onClick={() => setIsOrderSummaryExpanded(!isOrderSummaryExpanded)}
                  className="px-3.5 md:px-5 py-2.5 md:py-4 border-b border-border-color bg-light-bg/50 flex items-center justify-between cursor-pointer active:bg-gray-50 transition-colors"
                >
                  <h3 className="font-semibold text-xs md:text-sm text-dark-text">Order Summary</h3>
                  <div className="flex items-center gap-2">
                    {booking.bookingType === 'instant' ? (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs">
                        ⚡ Instant
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs">
                        📅 Scheduled
                      </span>
                    )}
                    {isOrderSummaryExpanded ? (
                      <FiChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <FiChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {isOrderSummaryExpanded && (
                  <div className="p-3 md:p-5 space-y-2.5 md:space-y-4 animate-in fade-in duration-200">
                    {/* 1. Service Category */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0 border border-teal-500/20 overflow-hidden">
                        {booking.categoryIcon ? (
                          <img src={booking.categoryIcon} alt="" className="w-6 h-6 object-contain" />
                        ) : (
                          <FiPackage className="w-5 h-5 text-teal-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-secondary-text uppercase tracking-widest">Service Category</p>
                        <p className="text-sm font-semibold text-dark-text">{booking.serviceCategory || booking.serviceName || 'Service'}</p>
                      </div>
                    </div>

                    {/* 2. Brand */}
                    {(() => {
                      const brandName = booking.brandName || booking.bookedItems?.[0]?.brandName;
                      const brandIcon = booking.brandIcon || booking.bookedItems?.[0]?.brandIcon;
                      if (!brandName) return null;
                      return (
                        <div className="flex items-center gap-3 pt-3 border-t border-dashed border-border-color">
                          <div className="w-10 h-10 rounded-xl bg-divider flex items-center justify-center shrink-0 border border-border-color overflow-hidden">
                            {brandIcon ? (
                              <img src={brandIcon} alt={brandName} className="w-7 h-7 object-contain" />
                            ) : (
                              <span className="text-lg font-black text-secondary-text">{brandName.charAt(0)}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-secondary-text uppercase tracking-widest">Brand</p>
                            <p className="text-sm font-semibold text-dark-text">{brandName}</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* 3. Service Cards */}
                    {booking.bookedItems && booking.bookedItems.length > 0 && (
                      <div className="pt-3 border-t border-dashed border-border-color space-y-2">
                        <p className="text-[10px] font-bold text-secondary-text uppercase tracking-widest mb-2">Services Booked</p>
                        {booking.bookedItems.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-start bg-light-bg rounded-xl p-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-teal-600 bg-teal-500/10 px-1.5 py-0.5 rounded border border-teal-500/20">×{item.quantity}</span>
                                <span className="text-sm font-semibold text-dark-text truncate">{item.card?.title || 'Service'}</span>
                              </div>
                              {item.card?.subtitle && <p className="text-xs text-secondary-text mt-0.5 ml-8 line-clamp-1">{item.card.subtitle}</p>}
                              {item.card?.duration && <p className="text-xs text-secondary-text mt-0.5 ml-8">⏱ {item.card.duration}</p>}
                            </div>
                            <span className="text-sm font-bold text-dark-text ml-3 shrink-0">₹{((item.card?.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 4. Detailed Pricing & Billing Info (Always show in dropdown) */}
                    <div className="pt-4 border-t border-dashed border-border-color space-y-2 text-xs">
                      <p className="text-[10px] font-bold text-secondary-text uppercase tracking-widest mb-2">Billing Breakdown</p>

                      <div className="flex justify-between text-secondary-text">
                        <span>Base Amount</span>
                        <span className="font-semibold text-dark-text">₹{(booking.basePrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>

                      {/* Instant Booking Fee Markup */}
                      {(booking.instantMarkupCharged || booking.instantMarkup || booking.instantBookingMarkup) > 0 && (
                        <div className="flex justify-between text-secondary-text">
                          <span>Instant Booking Fee</span>
                          <span className="font-semibold text-dark-text">₹{(booking.instantMarkupCharged || booking.instantMarkup || booking.instantBookingMarkup || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      {booking.paymentMethod === 'plan_benefit' ? (
                        <div className="flex justify-between text-secondary-text">
                          <span>Visiting Charges</span>
                          <span className="text-emerald-500 font-bold text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">FREE</span>
                        </div>
                      ) : (() => {
                        const baseAmt = Number(booking.basePrice || 0);
                        const instantFee = Number(booking.instantMarkupCharged || booking.instantMarkup || booking.instantBookingMarkup || 0);
                        const taxAmt = Number(booking.tax || ((booking.cgst || 0) + (booking.sgst || 0)) || 0);
                        const discountAmt = Number(booking.discount || 0);
                        const grandTotal = Number(booking.finalAmount || 0);

                        // Direct database key or mathematically derived remainder
                        const directValue = Number(booking.visitingCharges || booking.visitationFee || booking.visitingFee || booking.visitationCharges || 0);
                        const derivedValue = grandTotal - (baseAmt + instantFee + taxAmt - discountAmt);

                        if (directValue > 0) {
                          return (
                            <div className="flex justify-between text-secondary-text">
                              <span>Visiting Charges</span>
                              <span className="font-semibold text-dark-text">₹{directValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                          );
                        } else if (derivedValue > 0.01) {
                          return (
                            <div className="flex justify-between text-secondary-text">
                              <span>Additional Charges</span>
                              <span className="font-semibold text-dark-text">₹{derivedValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      {(booking.tax || booking.cgst || booking.sgst) > 0 && (
                        <div className="flex justify-between text-secondary-text">
                          <span>Taxes & GST</span>
                          <span className="font-semibold text-dark-text">₹{(booking.tax || ((booking.cgst || 0) + (booking.sgst || 0))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      {booking.discount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-medium">
                          <span>Discount Coupon</span>
                          <span>-₹{(booking.discount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-secondary-text pt-1 border-t border-gray-100">
                        <span>Payment Method</span>
                        <span className="font-bold text-dark-text uppercase text-[10px] tracking-wider">
                          {booking.paymentMethod === 'plan_benefit' ? 'Membership Benefit (Free)' : (booking.paymentMethod || 'Online')}
                        </span>
                      </div>

                      <div className="flex justify-between text-dark-text pt-2.5 mt-1 border-t-2 border-border-color text-sm">
                        <span className="font-bold">Grand Total</span>
                        <span className="font-black text-brand text-base">₹{(booking.finalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Payment Summary - Only show if payment is completed/collected, if a payment request is active (Work Done), or if a bill exists (e.g. addons added) */}
            {(hasBill || ['work_done', 'completed'].includes(booking.status?.toLowerCase()) || booking.paymentStatus === 'success' || booking.cashCollected) && (
              <section className="bg-card-bg rounded-md shadow-xs border border-border-color overflow-hidden">
                <div
                  onClick={() => setIsPaymentSummaryExpanded(!isPaymentSummaryExpanded)}
                  className="px-3.5 md:px-5 py-2.5 md:py-4 border-b border-border-color bg-light-bg/50 flex items-center justify-between cursor-pointer active:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${booking.paymentMethod === 'plan_benefit' ? 'bg-amber-500/10 text-amber-500' : 'bg-green-500/10 text-green-500'}`}>
                      {booking.paymentMethod === 'plan_benefit' ? (
                        <FiAward className="w-4 h-4" />
                      ) : (
                        <FiDollarSign className="w-4 h-4" />
                      )}
                    </div>
                    <h3 className="font-semibold text-xs md:text-sm text-dark-text">
                      {booking.paymentMethod === 'plan_benefit' ? 'Membership Benefit' : 'Payment Summary'}
                    </h3>
                  </div>
                  {isPaymentSummaryExpanded ? (
                    <FiChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <FiChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                {isPaymentSummaryExpanded && (
                  <>
                    <div className="p-3 md:p-5">

                      <div className="space-y-2.5 md:space-y-3 text-xs md:text-sm">
                        {hasBill ? (
                          // NEW DETAILED BREAKDOWN
                          <div className="space-y-2.5 md:space-y-4">
                            {/* Services Section */}
                            <div>
                              <h4 className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-secondary-text uppercase tracking-wide mb-1.5 md:mb-2">
                                <FiCheckCircle className="w-3.5 h-3.5" /> Services
                              </h4>
                              <div className="space-y-1.5 md:space-y-2 pl-1">
                                {/* Original Base */}
                                <div className="flex justify-between items-center text-secondary-text">
                                  <span>Original Booking : {originalServiceFromBill?.name || booking.serviceName || 'Service'}</span>
                                  {isPlanBenefit ? (
                                    <div className="flex items-center gap-2">
                                      <span className="line-through text-secondary-text opacity-50 text-xs">₹{(originalBase + originalGST).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                      <span className="text-emerald-500 font-bold text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">FREE</span>
                                    </div>
                                  ) : (
                                    <span className="font-medium text-dark-text">₹{(originalBase + originalGST).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                  )}
                                </div>

                                {/* Extra Services */}
                                {services.map((s, i) => (
                                  <div key={i} className="flex justify-between items-center text-secondary-text">
                                    <span>{s.name} <span className="text-secondary-text opacity-50 text-xs">x{s.quantity}</span></span>
                                    <span className="font-mono text-xs text-dark-text">₹{(parseFloat(s.total) || ((parseFloat(s.price) || 0) * (parseFloat(s.quantity) || 1))).toFixed(2)}</span>
                                  </div>
                                ))}

                                {/* Service Subtotal */}
                                <div className="flex justify-between font-bold text-dark-text pt-1 text-xs md:text-sm">
                                  <span>Total Service</span>
                                  <span>₹{(originalBase + extraServiceBase + originalGST + extraServiceGST).toFixed(2)}</span>
                                </div>

                                {instantMarkup > 0 && (
                                  <div className="flex justify-between items-center text-secondary-text pt-1.5 mt-1.5 border-t border-dashed border-border-color">
                                    <span className="flex items-center gap-1 text-xs">⚡ Instant Booking Fee</span>
                                    <span className="font-bold text-dark-text">₹{instantMarkup.toFixed(2)}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Parts Section */}
                            {(parts.length > 0 || customItems.length > 0) && (
                              <div>
                                <h4 className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-secondary-text uppercase tracking-wide mb-1.5 md:mb-2 mt-3 md:mt-4">
                                  <FiPackage className="w-3.5 h-3.5 text-orange-500" /> Parts & Material
                                </h4>
                                <div className="space-y-1.5 md:space-y-2 pl-1">
                                  {parts.map((p, i) => (
                                    <div key={`p-${i}`} className="flex justify-between items-center text-secondary-text">
                                      <span>{p.name} <span className="text-secondary-text opacity-50 text-xs">x{p.quantity}</span></span>
                                      <span className="font-mono text-xs text-dark-text">₹{(p.price * p.quantity).toFixed(2)}</span>
                                    </div>
                                  ))}
                                  {customItems.map((c, i) => (
                                    <div key={`c-${i}`} className="flex justify-between items-center text-secondary-text">
                                      <div>
                                        <span>{c.name} <span className="text-secondary-text opacity-50 text-xs">x{c.quantity}</span></span>
                                        {c.hsnCode && <span className="block text-[9px] text-secondary-text">HSN: {c.hsnCode}</span>}
                                      </div>
                                      <span className="font-mono text-xs text-dark-text">₹{(c.price * c.quantity).toFixed(2)}</span>
                                    </div>
                                  ))}

                                  {/* Parts Subtotal */}
                                  <div className="flex justify-between font-bold text-dark-text pt-1 text-xs md:text-sm">
                                    <span>Total Parts</span>
                                    <span>₹{(partsBase + partsGST).toFixed(2)}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Transport Charges */}
                            {bill?.transportCharges > 0 && (
                              <div className="mt-1.5 pt-1.5 border-t border-border-color">
                                <div className="flex justify-between text-xs font-bold text-secondary-text">
                                  <span className="flex items-center gap-2 uppercase tracking-wide">
                                    <FiPackage className="w-3.5 h-3.5 text-blue-400" /> Transport Charges
                                  </span>
                                  <span className="font-mono">₹{(bill.transportCharges).toFixed(2)}</span>
                                </div>
                              </div>
                            )}

                            {(booking.paymentMethod || booking.paymentStatus === 'success') && (
                              <div className="mt-1.5 pt-1.5 border-t border-border-color">
                                <div className="flex justify-between text-xs font-bold text-secondary-text">
                                  <span className="flex items-center gap-2 uppercase tracking-wide">
                                    {booking.paymentMethod === 'cash collected' ? <FiDollarSign className="text-emerald-500" /> : <MdQrCode className="text-blue-500" />}
                                    Payment Method
                                  </span>
                                  <span className={`${booking.paymentMethod === 'cash collected' ? 'text-emerald-500' : 'text-blue-500'} uppercase`}>
                                    {booking.paymentMethod === 'cash collected' ? 'Cash Collected' :
                                      booking.paymentMethod === 'Qr online' ? 'QR Online' :
                                        booking.paymentMethod === 'online' ? 'Online Paid' :
                                          booking.paymentMethod === 'plan_benefit' ? 'Plan Benefit' :
                                            booking.paymentMethod || 'Online'}
                                  </span>
                                </div>
                              </div>
                            )}

                            <div className="pt-2.5 md:pt-4 mt-1.5 md:mt-2 border-t-2 border-border-color flex justify-between items-center">
                              <span className="font-bold text-dark-text text-sm md:text-lg">Grand Total</span>
                              <span className="font-black text-brand text-base md:text-2xl">
                                ₹{finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                            {booking.paymentMethod === 'pay_at_home' && booking.codAdvanceAmount > 0 && (
                              <div className="mt-2 space-y-1.5 border-t border-dashed border-border-color pt-2 text-xs font-semibold">
                                <div className="flex justify-between items-center text-green-600">
                                  <span>Paid COD Advance</span>
                                  <span>-₹{booking.codAdvanceAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center text-[#B33A35] font-bold text-sm">
                                  <span>Amount Left (Pay at Home)</span>
                                  <span>₹{Math.max(0, finalTotal - booking.codAdvanceAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          // OLD SIMPLE BREAKDOWN (Fallback)
                          <>
                            {/* Base Items */}
                            <div className="flex justify-between items-center text-secondary-text">
                              <span>Base Price</span>
                              {booking.paymentMethod === 'plan_benefit' ? (
                                <div className="flex items-center gap-2">
                                  <span className="line-through text-secondary-text opacity-50 text-xs">₹{(booking.basePrice || 0).toLocaleString('en-IN')}</span>
                                  <span className="text-emerald-500 font-bold text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">FREE ✓</span>
                                </div>
                              ) : (
                                <span className="font-medium text-dark-text">₹{(booking.basePrice || 0).toLocaleString('en-IN')}</span>
                              )}
                            </div>

                            {booking.paymentMethod !== 'plan_benefit' && booking.discount > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-green-500">Discount</span>
                                <span className="font-medium text-green-500">-₹{booking.discount.toLocaleString('en-IN')}</span>
                              </div>
                            )}

                            {instantMarkup > 0 && (
                              <div className="flex justify-between items-center text-secondary-text pt-2 mt-2 border-t border-dashed border-border-color">
                                <span className="flex items-center gap-1 text-xs">⚡ Instant Booking Fee</span>
                                <span className="font-bold text-dark-text">₹{instantMarkup.toLocaleString('en-IN')}</span>
                              </div>
                            )}

                            {/* Extra Charges Section */}
                            {booking.extraCharges && booking.extraCharges.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-border-color">
                                <p className="text-xs font-bold text-secondary-text uppercase tracking-wide mb-2">Extra Charges</p>
                                <div className="bg-light-bg rounded-lg p-3 space-y-2 border border-border-color">
                                  {booking.extraCharges.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-secondary-text text-sm">
                                      <span className="flex items-center gap-2">
                                        <span className="text-xs font-bold bg-card-bg border border-border-color px-1.5 rounded text-secondary-text">x{item.quantity || 1}</span>
                                        <span>{item.name}</span>
                                      </span>
                                      <span className="font-medium">+₹{(item.total || item.price || 0).toLocaleString('en-IN')}</span>
                                    </div>
                                  ))}
                                  <div className="flex justify-between font-bold text-blue-500 pt-2 mt-2 border-t border-border-color">
                                    <span>Total Extras</span>
                                    <span>+₹{(booking.extraChargesTotal || 0).toLocaleString('en-IN')}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="pt-2.5 md:pt-4 mt-1.5 md:mt-2 border-t border-border-color flex justify-between items-center">
                              <span className="font-bold text-dark-text text-sm md:text-lg">Total Payable</span>
                              <span className="font-black text-dark-text text-base md:text-xl">
                                ₹{(booking.paymentMethod === 'plan_benefit'
                                  ? (booking.userPayableAmount || booking.extraChargesTotal || 0)
                                  : (booking.basePrice - booking.discount + (booking.extraChargesTotal || 0) + instantMarkup)
                                ).toLocaleString('en-IN')}
                              </span>
                            </div>
                            {booking.paymentMethod === 'pay_at_home' && booking.codAdvanceAmount > 0 && (
                              <div className="mt-2 space-y-1.5 border-t border-dashed border-border-color pt-2 text-xs font-semibold">
                                <div className="flex justify-between items-center text-green-600">
                                  <span>Paid COD Advance</span>
                                  <span>-₹{booking.codAdvanceAmount.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="flex justify-between items-center text-[#B33A35] font-bold text-sm">
                                  <span>Amount Left (Pay at Home)</span>
                                  <span>₹{Math.max(0, (booking.basePrice - booking.discount + (booking.extraChargesTotal || 0)) - booking.codAdvanceAmount).toLocaleString('en-IN')}</span>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Payment Status Footer */}
                    <div className="bg-light-bg px-3.5 md:px-5 py-2 md:py-3 border-t border-border-color flex justify-between items-center">
                      <span className="text-[10px] md:text-xs font-bold text-secondary-text uppercase tracking-wide">Payment Status</span>
                      <span className={`px-2 md:px-2.5 py-0.5 md:py-1 rounded-md text-[10px] md:text-xs font-bold capitalize ${['success', 'collected_by_vendor', 'paid'].includes(booking.paymentStatus?.toLowerCase()) ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                        booking.paymentStatus === 'pending' || booking.paymentStatus === 'plan_covered' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                        {['success', 'collected_by_vendor', 'paid', 'paid_online'].includes(booking.paymentStatus?.toLowerCase()) ? 'Paid' :
                          booking.paymentStatus === 'plan_covered' ? 'Processing Bill' :
                            booking.paymentStatus?.replace(/_/g, ' ') || 'Pending'}
                      </span>
                    </div>
                    {['completed', 'work_done'].includes(booking.status?.toLowerCase()) && !isAddonPending && (
                      <div className="bg-card-bg px-3 md:px-5 pb-3 md:pb-5 pt-2 md:pt-3 flex justify-center">
                        <button
                          onClick={handleDownloadInvoice}
                          className="w-full py-2 md:py-3 rounded-md font-bold text-xs md:text-sm text-white bg-green-600 hover:bg-green-700 flex items-center justify-center gap-1.5 md:gap-2 shadow-xs md:shadow-md active:scale-95 transition-transform"
                        >
                          <FiFileText className="w-4 h-4 md:w-5 md:h-5" />
                          Download Tax Invoice (PDF)
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            )}

            {/* Action Card for Awaiting Payment */}
            {(booking.status === 'awaiting_payment' || isAddonPending) && (
              <div className="bg-card-bg rounded-md shadow-sm border border-border-color p-6 space-y-4">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-brand/20">
                    <FiDollarSign className="w-8 h-8 text-brand" />
                  </div>
                  <h3 className="text-lg font-bold text-dark-text">
                    {isAddonPending ? 'Addon Payment Pending' : (['online', 'razorpay'].includes(booking.paymentMethod) ? 'Payment Required to Confirm' : 'Payment Required')}
                  </h3>
                  <p className="text-sm text-secondary-text">
                    {isAddonPending
                      ? `An addon of ₹${(booking.finalAmount - booking.totalAmount).toFixed(2)} has been added to your service. Please pay online below, or hand over the cash directly to the professional.`
                      : (['online', 'razorpay'].includes(booking.paymentMethod)
                        ? 'The professional has accepted your booking request. Please complete the online payment to confirm the slot and start the service.'
                        : 'The professional has completed the work. Please choose a payment method to verify and close your booking.')}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={handleOnlinePayment}
                    className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform bg-brand hover:bg-brand-light"
                  >
                    <FiDollarSign className="w-5 h-5" />
                    {isAddonPending ? `Pay Addon ₹${(booking.finalAmount - booking.totalAmount).toFixed(2)} Online` : 'Pay Online (Razorpay/UPI)'}
                  </button>

                  {isAddonPending ? (
                    <button
                      onClick={() => {
                        toast.success("You selected Cash. Please hand over the extra amount to the professional.");
                      }}
                      className="w-full py-4 rounded-md font-bold text-secondary-text bg-light-bg border border-border-color flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-card-bg"
                    >
                      <FiHome className="w-5 h-5" />
                      Pay Cash to Professional
                    </button>
                  ) : !['online', 'razorpay'].includes(booking.paymentMethod) && (
                    <button
                      onClick={handlePayAtHome}
                      className="w-full py-4 rounded-md font-bold text-secondary-text bg-light-bg border border-border-color flex items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-card-bg"
                    >
                      <FiHome className="w-5 h-5" />
                      Pay at Home (After Service)
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 md:gap-4">
              {/* Support */}
              <button
                onClick={() => {
                  const phone = supportInfo.phone || '+919999999999';
                  if (phone) {
                    const link = document.createElement('a');
                    link.href = `tel:${phone.replace(/[^\d+]/g, '')}`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  } else {
                    toast.error('Support phone number not available');
                  }
                }}
                className="col-span-1 flex flex-col items-center justify-center gap-1 md:gap-2 p-2.5 md:p-4 bg-card-bg border border-border-color rounded-md hover:bg-light-bg transition-colors active:scale-95 text-dark-text"
              >
                <FiPhone className="w-4 h-4 md:w-6 md:h-6 text-secondary-text" />
                <span className="text-xs md:text-sm font-bold">Call Support</span>
              </button>
              <button
                onClick={() => {
                  const email = supportInfo.email || 'help@doormeets.com';
                  const link = document.createElement('a');
                  link.href = `mailto:${email}`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="col-span-1 flex flex-col items-center justify-center gap-1 md:gap-2 p-2.5 md:p-4 bg-card-bg border border-border-color rounded-md hover:bg-light-bg transition-colors active:scale-95 text-dark-text"
              >
                <FiMail className="w-4 h-4 md:w-6 md:h-6 text-secondary-text" />
                <span className="text-xs md:text-sm font-bold">Email Help</span>
              </button>

              {/* Cancel */}
              {!['cancelled', 'completed', 'work_done'].includes(booking.status?.toLowerCase()) && (
                <div className="col-span-2 space-y-2">
                  {booking.bookingType === 'scheduled' ? (
                    cancelCountdown > 0 ? (
                      <button
                        onClick={handleCancelBooking}
                        className="w-full py-2.5 md:py-4 rounded-md font-bold text-xs md:text-sm transition-colors text-red-500 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 active:scale-95"
                      >
                        Cancel Booking ({formatTime(cancelCountdown)})
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate(`/user/reschedule-booking/${booking._id || booking.id}`)}
                        className="w-full py-2.5 md:py-4 rounded-md font-bold text-xs md:text-sm transition-colors text-brand bg-brand/10 border border-brand/20 hover:bg-brand/20 active:scale-95"
                      >
                        Reschedule Booking
                      </button>
                    )
                  ) : (
                    cancelCountdown > 0 && (
                      <button
                        onClick={handleCancelBooking}
                        className="w-full py-2.5 md:py-4 rounded-md font-bold text-xs md:text-sm transition-colors text-red-500 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 active:scale-95"
                      >
                        Cancel Booking ({formatTime(cancelCountdown)})
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            {/* Rate & Review (Conditional) */}
            <ReviewCard
              booking={booking}
              onWriteReview={() => setShowRatingModal(true)}
            />
          </div>

          {/* RIGHT COLUMN: Summary and Actions (Sidebar) */}
          {((booking.paymentStatus === 'pending' && booking.status !== 'cancelled') || (['confirmed', 'assigned'].includes(booking.status?.toLowerCase()) && booking.bookingType !== 'scheduled')) && (
            <div className="lg:sticky lg:top-24 space-y-3 md:space-y-6">
              {/* Booking Actions Sidebar panel */}
              <div className="bg-card-bg rounded-md p-3 md:p-5 border border-border-color shadow-xs md:shadow-sm space-y-2.5 md:space-y-4">
                <h3 className="text-[10px] md:text-sm font-bold uppercase tracking-wider text-secondary-text">Booking Actions</h3>

                {/* Payment Action */}
                {booking.paymentStatus === 'pending' && booking.status !== 'cancelled' && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    disabled={paying}
                    className="w-full py-2 md:py-3 bg-[#B33A35] text-white text-[10px] md:text-xs font-bold uppercase tracking-wider md:tracking-widest rounded-md hover:bg-[#9E2E2A] transition-all active:scale-[0.98]"
                  >
                    {paying ? 'Processing...' : (booking.paymentMethod === 'pay_at_home' && booking.codAdvanceAmount > 0) ? `⚡ Pay COD Advance (₹${booking.codAdvanceAmount})` : '⚡ Pay Booking Bill'}
                  </button>
                )}

                {/* Reschedule Option (Hidden for scheduled bookings here since it's above) */}
                {['confirmed', 'assigned'].includes(booking.status?.toLowerCase()) && booking.bookingType !== 'scheduled' && (
                  <button
                    onClick={() => navigate(`/user/reschedule-booking/${booking._id || booking.id}`)}
                    className="w-full py-2 md:py-3 border border-border-color text-dark-text hover:bg-divider text-[10px] md:text-xs font-bold uppercase tracking-wider md:tracking-widest rounded-md transition-all active:scale-[0.98]"
                  >
                    Reschedule Slot
                  </button>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Rating Modal */}
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            localStorage.setItem(`rating_dismissed_${id}`, 'true');
          }}
          onSubmit={handleRateSubmit}
          bookingName={booking.serviceName || booking.serviceCategory || 'Service'}
          workerName={booking.workerId?.name || (booking.assignedTo?.name === 'You (Self)' ? 'Service Provider' : (booking.assignedTo?.name || 'Worker'))}
        />

  {/* Payment Verification Modal */ }
        <PaymentVerificationModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          booking={booking}
          onPayOnline={handleOnlinePayment}
          onPayCash={handlePayAtHome}
        />

        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
          type={confirmDialog.type}
        />
      </div >
    </div >
  );
};

export default BookingDetails;

// --- Sub-components ---

const BidsList = ({ bookingId, onAccept }) => {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);

  const loadBids = async () => {
    try {
      const { bookingService } = await import('../../../../services/bookingService');
      const response = await bookingService.getBids(bookingId);
      if (response.success) {
        setBids(response.bids || []);
      }
    } catch (error) {
      console.error('Failed to load bids:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBids();
    // Refresh every 10 seconds or use socket
    const interval = setInterval(loadBids, 10000);
    return () => clearInterval(interval);
  }, [bookingId]);

  const handleAccept = async (bidId) => {
    if (!window.confirm('Are you sure you want to accept this quote?')) return;

    setAcceptingId(bidId);
    try {
      const { bookingService } = await import('../../../../services/bookingService');
      const response = await bookingService.acceptBid(bidId);
      if (response.success) {
        toast.success('Quote accepted! Your booking is confirmed.');
        onAccept();
      }
    } catch (error) {
      toast.error('Failed to accept quote');
    } finally {
      setAcceptingId(null);
    }
  };

  if (loading) return <div className="text-center py-4 text-secondary-text font-bold text-xs animate-pulse">Fetching quotes...</div>;
  if (bids.length === 0) return (
    <div className="bg-card-bg rounded-3xl p-8 border border-border-color text-center">
      <FiLoader className="w-8 h-8 text-brand/35 mx-auto mb-3 animate-spin" />
      <p className="text-xs font-bold text-secondary-text uppercase tracking-widest">Waiting for vendors to quote...</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {bids.map(bid => (
        <div key={bid._id} className="bg-card-bg rounded-3xl p-5 shadow-sm border border-border-color flex items-center gap-4 transition-all">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-light-bg border border-border-color shrink-0">
            {bid.vendorId?.profilePicture ? (
              <img src={bid.vendorId.profilePicture} alt={bid.vendorId.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-secondary-text">
                <FiUser className="w-6 h-6" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h4 className="font-black text-dark-text truncate">{bid.vendorId?.businessName || bid.vendorId?.name}</h4>
              <div className="flex items-center gap-0.5 text-xs font-black text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded-md border border-yellow-500/20">
                <FiStar className="w-2.5 h-2.5 fill-current" />
                <span>{bid.vendorId?.rating || '4.5'}</span>
              </div>
            </div>
            {bid.note && <p className="text-[10px] text-secondary-text font-medium truncate mb-2">"{bid.note}"</p>}
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-brand">₹{bid.price}</span>
              <span className="text-[9px] text-secondary-text font-bold uppercase tracking-tighter">Total Price</span>
            </div>
          </div>

          <button
            onClick={() => handleAccept(bid._id)}
            disabled={acceptingId !== null}
            className={`px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 ${acceptingId === bid._id ? 'bg-divider text-secondary-text' : 'bg-brand text-white shadow-lg shadow-brand/10'
              }`}
          >
            {acceptingId === bid._id ? 'Wait...' : 'Accept'}
          </button>
        </div>
      ))}
    </div>
  );
};

