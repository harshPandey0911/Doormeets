import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSettings, FiGrid, FiDollarSign, FiSave, FiUser, FiMail, FiTrash2, FiPlus, FiUsers, FiShield, FiFileText, FiMapPin, FiPhone, FiHeadphones, FiMessageCircle, FiEdit, FiLock, FiUnlock, FiX, FiVideo, FiUploadCloud, FiAward } from 'react-icons/fi';
import { getSettings, updateSettings, updateAdminProfile, getAdminProfile, getAllAdmins, createAdmin, deleteAdmin, updateAdminDetails, toggleAdminStatus } from '../../services/settingsService';
import { supportService } from '../../services/supportService';
import { cityService } from '../../services/cityService';
import CityManagement from '../Cities';
import DeletedAccountsDashboard from '../DeletedAccounts';
import CreditPackages from './CreditPackages';
import { toast } from 'react-hot-toast';

const AdminSettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    workerAutoAssignment: true,
  });

  const [financialSettings, setFinancialSettings] = useState({
    visitedCharges: 0,
    serviceGstPercentage: 18,
    vendorCgstPercentage: 2.5,
    vendorSgstPercentage: 2.5,
    partsGstPercentage: 18,
    servicePayoutPercentage: 90,
    partsPayoutPercentage: 100,
    vendorCashLimit: 10000,
    cancellationPenalty: 49,
    tdsPercentage: 1,
    platformFeePercentage: 1,
    maxSearchTime: 5,
    waveDuration: 60,
    searchRadius: 10,
    isOnlinePaymentEnabled: true,
    mcqTimeLimitMinutes: 30,
    loyaltyPointsEarningRate: 1,
    loyaltyPointsRedemptionRate: 1,
    vendorBusyBufferHours: 1,
    isInstantBookingEnabled: true,
    instantBookingMarkup: 99,
    instantBookingWaitTime: 45,
    instantBookingWindowHours: 4,
    showArrivalTime: true
  });

  // Billing Configuration State
  const [billingSettings, setBillingSettings] = useState({
    companyName: 'TodayMyDream',
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
    invoicePrefix: 'INV',
    sacCode: '998599',
    invoiceTitle: 'Convenience and Platform Fee'
  });
  const [billingLoading, setBillingLoading] = useState(false);

  // Support Settings State
  const [supportSettings, setSupportSettings] = useState({
    supportEmail: '',
    supportPhone: '',
    supportWhatsapp: '',
    privacyPolicy: ''
  });
  const [supportLoading, setSupportLoading] = useState(false);
  const [privacyLoading, setPrivacyLoading] = useState(false);

  // About Page Settings State
  const [aboutSettings, setAboutSettings] = useState({
    title: 'Welcome to Doormeets',
    subtitle: 'Your trusted partner for premium home and personal care services.',
    happyCustomers: '10K+',
    servicePartners: '500+',
    appRating: '4.8',
    mission: 'Doormeets is dedicated to revolutionizing how you experience home services. We connect you with top-tier professionals to deliver safe, reliable, and high-quality services right at your doorstep. We believe in making life simpler, one service at a time.',
    logoUrl: '',
    features: [
      { title: 'Expert Providers', description: 'Verified professionals for all your needs', iconName: 'FiUsers' },
      { title: 'Safe & Secure', description: 'Your safety is our top priority', iconName: 'FiShield' },
      { title: 'On-Time Service', description: 'Punctual delivery at your convenience', iconName: 'FiClock' },
      { title: 'Quality Assured', description: 'Service with 100% satisfaction guarantee', iconName: 'FiAward' }
    ],
    steps: [
      { title: 'Book Details', desc: 'Select service & schedule time', iconName: 'FiSmartphone' },
      { title: 'Get Matched', desc: 'We assign a top-rated pro', iconName: 'FiUsers' },
      { title: 'Relax', desc: 'Enjoy high-quality service', iconName: 'FiSmile' }
    ]
  });
  const [aboutLoading, setAboutLoading] = useState(false);

  // Cancellation Policy settings state
  const [cancellationSettings, setCancellationSettings] = useState({
    freeCancellationTitle: 'Free Cancellation',
    freeCancellationDesc: 'Until professional is assigned',
    lateFeeTitle: 'Late Fee',
    lateFeeDesc: 'If cancelled after assignment',
    stage1Title: 'Before Journey Start',
    stage1Desc: 'Any time before professional starts travel',
    stage1RefundText: 'Full Refund • No Fee',
    stage2Title: 'Journey Started',
    stage2Desc: 'When professional is on the way',
    stage2RefundText: '₹{penalty} Cancellation Penalty Applies',
    stage3Title: 'Professional Arrived',
    stage3Desc: 'When professional reaches your location',
    stage3RefundText: '₹{visitingCharges} Visiting Charges Apply',
    whyChargeTitle: 'Why do we charge a fee?',
    whyChargeSubtitle: 'To support our professionals time & effort',
    whyChargeDetails: 'Our service partners reserve their time exclusively for your booking and may travel significant distances. The cancellation fee compensates them for their lost time and travel expenses if a confirmed booking is cancelled last minute.',
    rescheduleTitle: 'Need to change plans?',
    rescheduleDesc: 'Instead of cancelling, you can reschedule your booking for free up to 2 hours before the service time.',
    rescheduleButtonLabel: 'Go Back to Booking'
  });
  const [cancellationLoading, setCancellationLoading] = useState(false);

  // User tickets support settings state
  const [userTickets, setUserTickets] = useState([]);
  const [selectedUserTicket, setSelectedUserTicket] = useState(null);
  const [userTicketReply, setUserTicketReply] = useState('');
  const [userTicketsLoading, setUserTicketsLoading] = useState(false);
  const [userTicketsFilter, setUserTicketsFilter] = useState('all');
  const [userTicketSending, setUserTicketSending] = useState(false);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    role: 'admin',
    assignedCity: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Admin Management State
  const [admins, setAdmins] = useState([]);
  const [cities, setCities] = useState([]); // State for cities
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', role: 'admin', cityId: '' }); // Added cityId
  const [adminLoading, setAdminLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [activeView, setActiveView] = useState('main'); // 'main', 'profile', 'financial', 'system', 'admins'
  const [activeLevelTab, setActiveLevelTab] = useState('L3');

  // Level configuration settings state
  const [levelConfigSettings, setLevelConfigSettings] = useState({
    L3: {
      badge: 'Bronze Partner',
      name: 'Level 3 (Beginner)',
      color: '#D97706',
      desc: 'You are currently on Level 3. Complete more jobs and maintain high ratings to upgrade your level.',
      customSteps: [
        'Complete at least 15 customer bookings',
        'Maintain minimum 4.2 customer rating',
        'Achieve 85%+ booking completion rate'
      ],
      targetJobs: 15,
      targetRating: 4.2,
      targetCompletionRate: 85
    },
    L2: {
      badge: 'Silver Partner',
      name: 'Level 2 (Professional)',
      color: '#0D9488',
      desc: 'Great job! You are a Level 2 partner. Keep providing excellent service to climb to the top Level 1.',
      customSteps: [
        'Complete at least 50 customer bookings',
        'Maintain minimum 4.7 customer rating',
        'Achieve 92%+ booking completion rate'
      ],
      targetJobs: 50,
      targetRating: 4.7,
      targetCompletionRate: 92
    },
    L1: {
      badge: 'Gold Elite Partner',
      name: 'Level 1 (Expert)',
      color: '#EAB308',
      desc: 'Congratulations! You are a Level 1 Elite partner. You receive the highest preference in matching and premium job bookings.',
      customSteps: [
        'Complete at least 10 bookings every month',
        'Maintain 4.7+ customer rating',
        'Zero safety violations or major complaints'
      ],
      targetJobs: 10,
      targetRating: 4.7,
      maintenanceDesc: 'Complete at least 10 bookings every month',
      violationDesc: 'Zero safety violations or major complaints'
    }
  });
  const [levelsLoading, setLevelsLoading] = useState(false);


  const isSuperAdmin = profile.role === 'super_admin';

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await getAdminProfile();
        if (res.success && res.data) {
          setProfile(prev => ({
            ...prev,
            email: res.data.email,
            name: res.data.name || 'Admin',
            role: res.data.role || 'admin',
            assignedCity: res.data.cityName || res.data.cityId?.name || ''
          }));
          const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
          const newData = { ...adminData, ...res.data };
          localStorage.setItem('adminData', JSON.stringify(newData));
        }
      } catch (error) {
        console.error('Error loading admin profile:', error);
      }
    };

    const loadSettings = () => {
      try {
        const adminSettings = JSON.parse(localStorage.getItem('adminSettings') || '{}');
        if (Object.keys(adminSettings).length > 0) {
          setSettings(prev => ({ ...prev, ...adminSettings }));
        }
      } catch (error) {
        console.error('Error loading admin settings:', error);
      }
    };

    const loadFinancialSettings = async () => {
      try {
        const res = await getSettings();
        if (res.success && res.settings) {
          setFinancialSettings({
            visitedCharges: res.settings.visitedCharges || 0,
            serviceGstPercentage: res.settings.serviceGstPercentage ?? 18,
            vendorCgstPercentage: res.settings.vendorCgstPercentage ?? 2.5,
            vendorSgstPercentage: res.settings.vendorSgstPercentage ?? 2.5,
            partsGstPercentage: res.settings.partsGstPercentage ?? 18,
            servicePayoutPercentage: res.settings.servicePayoutPercentage ?? 90,
            partsPayoutPercentage: res.settings.partsPayoutPercentage ?? 100,
            tdsPercentage: res.settings.tdsPercentage || 1,
            platformFeePercentage: res.settings.platformFeePercentage || 1,
            vendorCashLimit: res.settings.vendorCashLimit || 10000,
            cancellationPenalty: res.settings.cancellationPenalty !== undefined ? res.settings.cancellationPenalty : 49,
            searchRadius: res.settings.searchRadius || 10,
            isOnlinePaymentEnabled: res.settings.isOnlinePaymentEnabled !== undefined ? res.settings.isOnlinePaymentEnabled : true,
            mcqTimeLimitMinutes: res.settings.mcqTimeLimitMinutes !== undefined ? res.settings.mcqTimeLimitMinutes : 30,
            loyaltyPointsEarningRate: res.settings.loyaltyPointsEarningRate !== undefined ? res.settings.loyaltyPointsEarningRate : 1,
            loyaltyPointsRedemptionRate: res.settings.loyaltyPointsRedemptionRate !== undefined ? res.settings.loyaltyPointsRedemptionRate : 1,
            vendorBusyBufferHours: res.settings.vendorBusyBufferHours !== undefined ? res.settings.vendorBusyBufferHours : 1,
            isInstantBookingEnabled: res.settings.isInstantBookingEnabled !== undefined ? res.settings.isInstantBookingEnabled : true,
            instantBookingMarkup: res.settings.instantBookingMarkup !== undefined ? res.settings.instantBookingMarkup : 99,
            instantBookingWaitTime: res.settings.instantBookingWaitTime !== undefined ? res.settings.instantBookingWaitTime : 45,
            instantBookingWindowHours: res.settings.instantBookingWindowHours !== undefined ? res.settings.instantBookingWindowHours : 4,
            showArrivalTime: res.settings.showArrivalTime !== undefined ? res.settings.showArrivalTime : true
          });
          // Load billing settings
          setBillingSettings({
            companyName: res.settings.companyName || 'TodayMyDream',
            companyGSTIN: res.settings.companyGSTIN || '',
            companyPAN: res.settings.companyPAN || '',
            companyAddress: res.settings.companyAddress || '',
            companyCity: res.settings.companyCity || '',
            companyState: res.settings.companyState || '',
            companyPincode: res.settings.companyPincode || '',
            companyPhone: res.settings.companyPhone || '',
            companyEmail: res.settings.companyEmail || '',
            companyCIN: res.settings.companyCIN || '',
            companyWebsite: res.settings.companyWebsite || '',
            invoicePrefix: res.settings.invoicePrefix || 'INV',
            sacCode: res.settings.sacCode !== undefined && res.settings.sacCode !== null ? res.settings.sacCode : '998599',
            invoiceTitle: res.settings.invoiceTitle || 'Convenience and Platform Fee'
          });
          // Load support settings
          setSupportSettings({
            supportEmail: res.settings.supportEmail || '',
            supportPhone: res.settings.supportPhone || '',
            supportWhatsapp: res.settings.supportWhatsapp || '',
            privacyPolicy: res.settings.privacyPolicy || ''
          });
          // Load about settings
          if (res.settings.aboutPageConfig) {
            setAboutSettings({
              title: res.settings.aboutPageConfig.title || 'Welcome to Doormeets',
              subtitle: res.settings.aboutPageConfig.subtitle || 'Your trusted partner for premium home and personal care services.',
              happyCustomers: res.settings.aboutPageConfig.happyCustomers || '10K+',
              servicePartners: res.settings.aboutPageConfig.servicePartners || '500+',
              appRating: res.settings.aboutPageConfig.appRating || '4.8',
              mission: res.settings.aboutPageConfig.mission || 'Doormeets is dedicated to revolutionizing how you experience home services. We connect you with top-tier professionals to deliver safe, reliable, and high-quality services right at your doorstep. We believe in making life simpler, one service at a time.',
              logoUrl: res.settings.aboutPageConfig.logoUrl || '',
              features: res.settings.aboutPageConfig.features || [
                { title: 'Expert Providers', description: 'Verified professionals for all your needs', iconName: 'FiUsers' },
                { title: 'Safe & Secure', description: 'Your safety is our top priority', iconName: 'FiShield' },
                { title: 'On-Time Service', description: 'Punctual delivery at your convenience', iconName: 'FiClock' },
                { title: 'Quality Assured', description: 'Service with 100% satisfaction guarantee', iconName: 'FiAward' }
              ],
              steps: res.settings.aboutPageConfig.steps || [
                { title: 'Book Details', desc: 'Select service & schedule time', iconName: 'FiSmartphone' },
                { title: 'Get Matched', desc: 'We assign a top-rated pro', iconName: 'FiUsers' },
                { title: 'Relax', desc: 'Enjoy high-quality service', iconName: 'FiSmile' }
              ]
            });
          }
          // Load level config settings
          if (res.settings.cancellationPageConfig) {
            setCancellationSettings({
              freeCancellationTitle: res.settings.cancellationPageConfig.freeCancellationTitle || 'Free Cancellation',
              freeCancellationDesc: res.settings.cancellationPageConfig.freeCancellationDesc || 'Until professional is assigned',
              lateFeeTitle: res.settings.cancellationPageConfig.lateFeeTitle || 'Late Fee',
              lateFeeDesc: res.settings.cancellationPageConfig.lateFeeDesc || 'If cancelled after assignment',
              stage1Title: res.settings.cancellationPageConfig.stage1Title || 'Before Journey Start',
              stage1Desc: res.settings.cancellationPageConfig.stage1Desc || 'Any time before professional starts travel',
              stage1RefundText: res.settings.cancellationPageConfig.stage1RefundText || 'Full Refund • No Fee',
              stage2Title: res.settings.cancellationPageConfig.stage2Title || 'Journey Started',
              stage2Desc: res.settings.cancellationPageConfig.stage2Desc || 'When professional is on the way',
              stage2RefundText: res.settings.cancellationPageConfig.stage2RefundText || '₹{penalty} Cancellation Penalty Applies',
              stage3Title: res.settings.cancellationPageConfig.stage3Title || 'Professional Arrived',
              stage3Desc: res.settings.cancellationPageConfig.stage3Desc || 'When professional reaches your location',
              stage3RefundText: res.settings.cancellationPageConfig.stage3RefundText || '₹{visitingCharges} Visiting Charges Apply',
              whyChargeTitle: res.settings.cancellationPageConfig.whyChargeTitle || 'Why do we charge a fee?',
              whyChargeSubtitle: res.settings.cancellationPageConfig.whyChargeSubtitle || 'To support our professionals time & effort',
              whyChargeDetails: res.settings.cancellationPageConfig.whyChargeDetails || 'Our service partners reserve their time exclusively for your booking and may travel significant distances. The cancellation fee compensates them for their lost time and travel expenses if a confirmed booking is cancelled last minute.',
              rescheduleTitle: res.settings.cancellationPageConfig.rescheduleTitle || 'Need to change plans?',
              rescheduleDesc: res.settings.cancellationPageConfig.rescheduleDesc || 'Instead of cancelling, you can reschedule your booking for free up to 2 hours before the service time.',
              rescheduleButtonLabel: res.settings.cancellationPageConfig.rescheduleButtonLabel || 'Go Back to Booking'
            });
          }
          if (res.settings.levelConfig) {
            setLevelConfigSettings(res.settings.levelConfig);
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadProfile();
    loadSettings();
    loadFinancialSettings();
  }, []);

  const loadAdmins = async () => {
    try {
      console.log('Fetching admins list...');
      const res = await getAllAdmins();
      console.log('Admins fetched:', res);
      if (res.success) {
        setAdmins(res.data || []);
      }
    } catch (error) {
      console.error('Error loading admins:', error);
    }
  };

  // Fetch cities for dropdown
  const loadCities = async () => {
    try {
      const res = await cityService.getAll();
      if (res.success) {
        setCities(res.cities || []);
      }
    } catch (error) {
      console.error('Error loading cities:', error);
    }
  };

  // Load admins and cities when entering admin view
  useEffect(() => {
    if (isSuperAdmin && (activeView === 'admins' || admins.length === 0)) {
      loadAdmins();
      loadCities(); // Fetch cities as well
    }
  }, [isSuperAdmin, activeView]);

  const handleToggle = (key) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    localStorage.setItem('adminSettings', JSON.stringify(updated));
    window.dispatchEvent(new Event('adminSettingsUpdated'));
  };

  const handleFinancialChange = (e) => {
    const { name, value } = e.target;
    setFinancialSettings(prev => ({
      ...prev,
      [name]: Number(value)
    }));
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleFinancialSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateSettings(financialSettings);
      toast.success('Financial settings updated');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  // Handle billing settings change
  const handleBillingChange = (e) => {
    const { name, value } = e.target;
    // Auto-uppercase for specific fields
    const upperFields = ['companyGSTIN', 'companyPAN', 'invoicePrefix'];
    const newValue = upperFields.includes(name) ? value.toUpperCase() : value;
    setBillingSettings(prev => ({ ...prev, [name]: newValue }));
  };

  const validateBilling = () => {
    const {
      companyName, companyGSTIN, companyPAN, companyAddress,
      companyCity, companyState, companyPincode,
      companyPhone, companyEmail, invoicePrefix, sacCode, invoiceTitle
    } = billingSettings;

    if (!companyName?.trim()) return "Company Name is required";

    if (companyGSTIN?.trim()) {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(companyGSTIN.trim())) return "Invalid GSTIN format (e.g., 27ABCDE1234F1Z5)";
    }

    if (companyPAN?.trim()) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(companyPAN.trim())) return "Invalid PAN format (e.g., ABCDE1234F)";
    }

    if (!companyAddress?.trim()) return "Address is required";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!companyEmail || !emailRegex.test(companyEmail)) return "Invalid Email Address";

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!companyPhone || !phoneRegex.test(companyPhone)) return "Invalid Phone Number (must be 10 digits)";

    if (!companyCity?.trim()) return "City is required";
    if (!companyState?.trim()) return "State is required";

    const pincodeRegex = /^[1-9][0-9]{5}$/;
    if (!companyPincode || !pincodeRegex.test(companyPincode)) return "Invalid Pincode (must be 6 digits)";

    if (!invoicePrefix?.trim()) return "Invoice Prefix is required";

    return null;
  };

  // Save billing settings
  const handleBillingSave = async (e) => {
    e.preventDefault();

    const error = validateBilling();
    if (error) return toast.error(error);

    setBillingLoading(true);
    try {
      await updateSettings(billingSettings);
      toast.success('Billing settings updated');
    } catch (error) {
      toast.error('Failed to update billing settings');
    } finally {
      setBillingLoading(false);
    }
  };

  // Handle support settings change
  const handleSupportChange = (e) => {
    const { name, value } = e.target;
    setSupportSettings(prev => ({ ...prev, [name]: value }));
  };

  // Save support settings
  const handleSupportSave = async (e) => {
    e.preventDefault();

    const phoneRegex = /^[6-9]\d{9}$/;

    if (!supportSettings.supportPhone || !supportSettings.supportPhone.trim()) {
      return toast.error('Support Phone is required');
    }
    const phones = supportSettings.supportPhone.split(',').map(p => p.trim());
    for (const phone of phones) {
      if (!phoneRegex.test(phone)) {
        return toast.error('Each Support Phone number must be a valid 10-digit number (e.g. 9876543210)');
      }
    }

    if (!supportSettings.supportWhatsapp || !supportSettings.supportWhatsapp.trim()) {
      return toast.error('WhatsApp Support number is required');
    }
    if (!phoneRegex.test(supportSettings.supportWhatsapp.trim())) {
      return toast.error('WhatsApp Support must be a valid 10-digit number (e.g. 9876543210)');
    }

    setSupportLoading(true);
    try {
      await updateSettings(supportSettings);
      toast.success('Support settings updated');
    } catch (error) {
      toast.error('Failed to update support settings');
    } finally {
      setSupportLoading(false);
    }
  };

  // Fetch user tickets
  const fetchUserTickets = async () => {
    try {
      setUserTicketsLoading(true);
      const params = { role: 'user' };
      if (userTicketsFilter !== 'all') {
        params.status = userTicketsFilter;
      }
      const res = await supportService.getAllTickets(params);
      if (res.success) {
        setUserTickets(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load user tickets:', err);
    } finally {
      setUserTicketsLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === 'user-tickets') {
      fetchUserTickets();
    }
  }, [activeView, userTicketsFilter]);

  const handleUserTicketSelect = async (id) => {
    try {
      const res = await supportService.getTicketDetails(id);
      if (res.success) {
        setSelectedUserTicket(res.ticket);
      }
    } catch (err) {
      console.error('Failed to fetch user ticket details:', err);
      toast.error('Failed to load ticket details');
    }
  };

  const handleUserReply = async (e) => {
    e.preventDefault();
    if (!userTicketReply.trim() || !selectedUserTicket) return;

    try {
      setUserTicketSending(true);
      const res = await supportService.replyToTicket(selectedUserTicket._id, { message: userTicketReply });
      if (res.success) {
        toast.success('Reply sent successfully');
        setSelectedUserTicket(res.ticket);
        setUserTicketReply('');
        fetchUserTickets();
      }
    } catch (err) {
      console.error('Failed to reply to user ticket:', err);
      toast.error('Failed to send reply');
    } finally {
      setUserTicketSending(false);
    }
  };

  const handleUserTicketStatusChange = async (newStatus) => {
    if (!selectedUserTicket) return;
    try {
      const res = await supportService.updateTicketStatus(selectedUserTicket._id, newStatus);
      if (res.success) {
        toast.success(`Ticket marked as ${newStatus}`);
        setSelectedUserTicket(res.ticket);
        fetchUserTickets();
      }
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error('Failed to update status');
    }
  };

  // Handle about settings change
  const handleAboutChange = (e) => {
    const { name, value } = e.target;
    setAboutSettings(prev => ({ ...prev, [name]: value }));
  };

  // Save about settings
  const handleAboutSave = async (e) => {
    e.preventDefault();
    setAboutLoading(true);
    try {
      await updateSettings({ aboutPageConfig: aboutSettings });
      toast.success('About page settings updated');
    } catch (error) {
      toast.error('Failed to update about page settings');
    } finally {
      setAboutLoading(false);
    }
  };

  // Handle cancellation settings change
  const handleCancellationChange = (e) => {
    const { name, value } = e.target;
    setCancellationSettings(prev => ({ ...prev, [name]: value }));
  };

  // Save cancellation settings
  const handleCancellationSave = async (e) => {
    e.preventDefault();
    setCancellationLoading(true);
    try {
      await updateSettings({ cancellationPageConfig: cancellationSettings });
      toast.success('Cancellation policy settings updated');
    } catch (error) {
      toast.error('Failed to update cancellation policy settings');
    } finally {
      setCancellationLoading(false);
    }
  };

  // Save level configuration settings
  const handleLevelsSave = async (e) => {
    e.preventDefault();
    setLevelsLoading(true);
    try {
      await updateSettings({ levelConfig: levelConfigSettings });
      toast.success('Level configuration settings updated');
    } catch (error) {
      toast.error('Failed to update level configuration settings');
    } finally {
      setLevelsLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (profile.newPassword && profile.newPassword !== profile.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (profile.newPassword && !profile.currentPassword) {
      return toast.error('Current password required');
    }

    setProfileLoading(true);
    try {
      const updateData = { email: profile.email };
      if (profile.newPassword) {
        updateData.currentPassword = profile.currentPassword;
        updateData.newPassword = profile.newPassword;
      } else if (profile.currentPassword) {
        updateData.currentPassword = profile.currentPassword;
      }

      await updateAdminProfile(updateData);
      const adminData = JSON.parse(localStorage.getItem('adminUser') || '{}');
      adminData.email = profile.email;
      localStorage.setItem('adminUser', JSON.stringify(adminData));

      toast.success('Profile updated');
      setProfile(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    const isEdit = !!newAdmin.id;

    if (!newAdmin.name || !newAdmin.email) {
      return toast.error('Name and Email are required');
    }
    if (!isEdit && !newAdmin.password) {
      return toast.error('Password is required for new admin');
    }

    setAdminLoading(true);
    try {
      // Prepare payload
      const payload = { ...newAdmin };
      if (payload.cityId) {
        const cityObj = cities.find(c => (c._id || c.id) === payload.cityId);
        if (cityObj) payload.cityName = cityObj.name;
      } else {
        delete payload.cityId;
        payload.cityName = '';
      }

      if (isEdit) {
        await updateAdminDetails(newAdmin.id, payload);
        toast.success('Admin updated successfully');
      } else {
        await createAdmin(payload);
        toast.success('Admin created successfully');
      }
      setNewAdmin({ name: '', email: '', password: '', role: 'admin', cityId: '' });
      setShowAddAdmin(false);
      loadAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleEditClick = (admin) => {
    setNewAdmin({
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      password: '',
      cityId: admin.cityId?._id || admin.cityId || '' // Handle populated or raw ID
    });
    setShowAddAdmin(true);
  };

  const handleBlockAdmin = async (id, currentStatus) => {
    const action = currentStatus ? 'block' : 'unblock';
    if (!window.confirm(`Are you sure you want to ${action} this admin?`)) return;

    try {
      await toggleAdminStatus(id);
      toast.success(`Admin ${action}ed`);
      loadAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteAdmin = async (id, name) => {
    if (!window.confirm(`Delete admin "${name}"? This cannot be undone.`)) return;
    try {
      await deleteAdmin(id);
      toast.success('Admin deleted');
      loadAdmins();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  const [serviceMode, setServiceMode] = useState('multi');
  useEffect(() => {
    const config = JSON.parse(localStorage.getItem('adminServiceConfig') || '{}');
    setServiceMode(config.mode || 'multi');
  }, []);


  // Render Function for Main Settings Menu
  const renderMainMenu = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Profile Settings Card */}
      <div onClick={() => setActiveView('profile')}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group">
        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
          <FiUser className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">Profile Settings</h3>
        <p className="text-sm text-gray-500">Manage your personal account details and password</p>
      </div>

      {/* Financial Settings Card - Super Admin Only */}
      {isSuperAdmin && (
        <div onClick={() => setActiveView('financial')}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
            <FiDollarSign className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Financial Info</h3>
          <p className="text-sm text-gray-500">Configure charges, commissions, and billing details</p>
        </div>
      )}

      {/* System Settings Card - Super Admin Only */}
      {isSuperAdmin && (
        <div onClick={() => setActiveView('system')}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
            <FiSettings className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">System & Support</h3>
          <p className="text-sm text-gray-500">Manage auto-assignment and help contact info</p>
        </div>
      )}

      {/* City Management Card - Super Admin Only */}
      {isSuperAdmin && (
        <div onClick={() => setActiveView('cities')}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-teal-100 transition-colors">
            <FiMapPin className="w-6 h-6 text-teal-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">City Management</h3>
          <p className="text-sm text-gray-500">Manage operational cities and default location</p>
        </div>
      )}

      {/* Admin Management Card - Super Admin Only */}
      {isSuperAdmin && (
        <div onClick={() => setActiveView('admins')}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-amber-100 transition-colors">
            <FiUsers className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Manage Admins</h3>
          <p className="text-sm text-gray-500">Add, remove, and view all system administrators</p>
        </div>
      )}

      {/* About Page Settings Card - Super Admin Only */}
      {isSuperAdmin && (
        <div onClick={() => setActiveView('about')}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-12 h-12 bg-pink-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-pink-100 transition-colors">
            <FiFileText className="w-6 h-6 text-pink-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">About Page</h3>
          <p className="text-sm text-gray-500">Configure dynamically the "Welcome to Doormeets" about section texts and stats</p>
        </div>
      )}
      {/* Cancellation Policy Settings Card - Super Admin Only */}
      {isSuperAdmin && (
        <div onClick={() => setActiveView('cancellation-policy')}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-100 transition-colors">
            <FiFileText className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Cancellation Policy</h3>
          <p className="text-sm text-gray-500">Configure dynamically the cancellation rules, timeline stages, and FAQ content</p>
        </div>
      )}

      {/* User Tickets Card - Super Admin Only */}
      {isSuperAdmin && (
        <div onClick={() => setActiveView('user-tickets')}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
            <FiMessageCircle className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">User Tickets</h3>
          <p className="text-sm text-gray-500">View and respond to support chat tickets submitted by users</p>
        </div>
      )}

      {/* Deleted Accounts Dashboard Card - Super Admin Only */}
      {isSuperAdmin && (
        <div onClick={() => setActiveView('deleted')}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-100 transition-colors">
            <FiTrash2 className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Deleted Accounts</h3>
          <p className="text-sm text-gray-500">View deleted Users, Vendors, Workers, and Shop Owners and inspect their history</p>
        </div>
      )}

      {/* Credit Packages Card - Super Admin Only */}
      {isSuperAdmin && (
        <div onClick={() => setActiveView('credits')}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
            <FiDollarSign className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Credit Packages</h3>
          <p className="text-sm text-gray-500">Manage vendor credit packages for buying leads</p>
        </div>
      )}

      {/* SOS Alerts Settings Card */}
      <div onClick={() => navigate('/admin/sos-alerts')}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group">
        <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-red-100 transition-colors">
          <FiShield className="w-6 h-6 text-red-600 animate-pulse" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">SOS Alerts</h3>
        <p className="text-sm text-gray-500">View logged customer distress signals, live locations and resolution details</p>
      </div>

      {/* Level Settings Card - Super Admin Only */}
      {isSuperAdmin && (
        <div onClick={() => setActiveView('levels')}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-amber-100 transition-colors">
            <FiAward className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Level Settings</h3>
          <p className="text-sm text-gray-500">Configure dynamically the vendor level criteria, target jobs and upgrade steps</p>
        </div>
      )}

      {/* Privacy Policy Settings Card - Super Admin Only */}
      {isSuperAdmin && (
        <div onClick={() => setActiveView('privacy')}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer group">
          <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
            <FiShield className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Privacy & Data</h3>
          <p className="text-sm text-gray-500">Configure dynamically the user privacy policy and data agreement terms</p>
        </div>
      )}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

      {/* Header / Breadcrumb */}
      {activeView !== 'main' && (
        <button onClick={() => setActiveView('main')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-4 transition-colors">
          <span className="text-lg">←</span> Back to Settings
        </button>
      )}

      {activeView === 'main' && renderMainMenu()}

      <AnimatePresence mode="wait">

        {/* Profile View */}
        {activeView === 'profile' && (
          <motion.div key="profile" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <div className="max-w-2xl mx-auto bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : <FiUser />}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">{profile.name || 'Admin'}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      {isSuperAdmin && <FiShield className="text-amber-500" />}
                      {isSuperAdmin ? 'Super Admin' : 'Admin'} • {profile.email}
                    </p>
                    {profile.role !== 'super_admin' ? (
                      <span className="px-2 py-0.5 bg-teal-50 text-teal-700 text-[10px] font-bold rounded-lg border border-teal-100 flex items-center gap-1">
                        <FiMapPin className="w-2.5 h-2.5" />
                        {profile.assignedCity || 'Restricted Access'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-100">
                        Global Access
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input type="email" name="email" value={profile.email} onChange={handleProfileChange} required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
                </div>

                <div className="pt-6 border-t border-gray-100 space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Change Password</h3>
                  <div className="space-y-4">
                    <input type="password" name="currentPassword" value={profile.currentPassword} onChange={handleProfileChange}
                      placeholder="Current Password"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-all" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="password" name="newPassword" value={profile.newPassword} onChange={handleProfileChange}
                        placeholder="New Password"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-all" />
                      <input type="password" name="confirmPassword" value={profile.confirmPassword} onChange={handleProfileChange}
                        placeholder="Confirm New Password"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-all" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <button type="submit" disabled={profileLoading}
                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-70 shadow-lg shadow-blue-200 transition-all">
                    {profileLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSave className="w-5 h-5" />}
                    Update Profile
                  </button>
                </div>
              </form>
            </div>
          </motion.div >
        )}

        {/* Financial View */}
        {
          activeView === 'financial' && (
            <motion.div key="financial" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* General Financial Settings */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-fit">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FiDollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-800">Financial Configuration</h2>
                </div>

                <form onSubmit={handleFinancialSave} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Platform GST (%)</label>
                      <input type="number" name="serviceGstPercentage" value={financialSettings.serviceGstPercentage} onChange={handleFinancialChange}
                        min="0" max="100"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-500 transition-all font-bold text-gray-800" />
                      <p className="text-[10px] text-gray-400 mt-1">GST applied to Platform Commission</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Vendor CGST (%)</label>
                        <input type="number" name="vendorCgstPercentage" value={financialSettings.vendorCgstPercentage} onChange={handleFinancialChange}
                          min="0" max="100" step="0.1"
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-500 transition-all font-bold text-gray-800" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Vendor SGST (%)</label>
                        <input type="number" name="vendorSgstPercentage" value={financialSettings.vendorSgstPercentage} onChange={handleFinancialChange}
                          min="0" max="100" step="0.1"
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-500 transition-all font-bold text-gray-800" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Global Search Radius (Km)</label>
                      <input type="number" name="searchRadius" value={financialSettings.searchRadius} onChange={handleFinancialChange}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-green-500 transition-all font-bold text-gray-800" />
                      <p className="text-[10px] text-gray-400 mt-1">Default global search radius for hunting vendors (10 KM)</p>
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={loading}
                      className="px-6 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center gap-2 disabled:opacity-60 shadow-lg shadow-green-200">
                      {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSave className="w-4 h-4" />}
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>

              {/* Billing Information - Super Admin Only */}
              {isSuperAdmin && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-fit">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <FiFileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-800">Billing & Company Details</h2>
                      <p className="text-xs text-gray-500">For invoices and tax documents</p>
                    </div>
                  </div>

                  <form onSubmit={handleBillingSave} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Company Name</label>
                      <input type="text" name="companyName" value={billingSettings.companyName} onChange={handleBillingChange}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-500" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">GSTIN</label>
                        <input type="text" name="companyGSTIN" value={billingSettings.companyGSTIN} onChange={handleBillingChange}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-500 uppercase" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">PAN</label>
                        <input type="text" name="companyPAN" value={billingSettings.companyPAN} onChange={handleBillingChange}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-500 uppercase" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Full Address</label>
                      <textarea name="companyAddress" value={billingSettings.companyAddress} onChange={handleBillingChange} rows="2"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-500 resize-none" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Company Email</label>
                        <input type="email" name="companyEmail" value={billingSettings.companyEmail} onChange={handleBillingChange}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Company Phone</label>
                        <input type="text" name="companyPhone" value={billingSettings.companyPhone} onChange={handleBillingChange}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-500" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Company CIN</label>
                        <input type="text" name="companyCIN" value={billingSettings.companyCIN} onChange={handleBillingChange}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-500 uppercase" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Company Website</label>
                        <input type="text" name="companyWebsite" value={billingSettings.companyWebsite} onChange={handleBillingChange}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-500" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
                        <input type="text" name="companyCity" value={billingSettings.companyCity} onChange={handleBillingChange}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">State</label>
                        <input type="text" name="companyState" value={billingSettings.companyState} onChange={handleBillingChange}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Pincode</label>
                        <input type="text" name="companyPincode" value={billingSettings.companyPincode} onChange={handleBillingChange}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-500" />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 space-y-4">
                      <h4 className="text-xs font-bold text-gray-700">Invoice Settings</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Prefix</label>
                          <input type="text" name="invoicePrefix" value={billingSettings.invoicePrefix} onChange={handleBillingChange}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-500 uppercase" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Default SAC Code</label>
                          <input type="text" name="sacCode" value={billingSettings.sacCode} onChange={handleBillingChange}
                            placeholder="e.g. 998599"
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Invoice Item Title</label>
                          <input type="text" name="invoiceTitle" value={billingSettings.invoiceTitle} onChange={handleBillingChange}
                            placeholder="e.g. Convenience and Platform Fee"
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-indigo-500" />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button type="submit" disabled={billingLoading}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-60">
                        {billingLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSave className="w-4 h-4" />}
                        Update Billing
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </motion.div>
          )
        }

        {/* System & Support View */}
        {
          activeView === 'system' && (
            <motion.div key="system" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* System Settings */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-fit">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <FiSettings className="w-5 h-5 text-gray-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-800">System Preferences</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">Auto-Assign Workers</p>
                      <p className="text-xs text-gray-500 mt-1">Automatically find new worker if booking is rejected</p>
                    </div>
                    <button onClick={() => handleToggle('workerAutoAssignment')}
                      className={`relative w-12 h-7 rounded-full transition-all duration-300 ${settings.workerAutoAssignment ? 'bg-blue-600' : 'bg-gray-200'}`}>
                      <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${settings.workerAutoAssignment ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">Online Payments</p>
                      <p className="text-xs text-gray-500 mt-1">Enable digital payment methods for users</p>
                    </div>
                    <button onClick={() => {
                      const newValue = !financialSettings.isOnlinePaymentEnabled;
                      setFinancialSettings(prev => ({ ...prev, isOnlinePaymentEnabled: newValue }));
                      updateSettings({ isOnlinePaymentEnabled: newValue });
                    }}
                      className={`relative w-12 h-7 rounded-full transition-all duration-300 ${financialSettings.isOnlinePaymentEnabled ? 'bg-green-600' : 'bg-gray-200'}`}>
                      <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${financialSettings.isOnlinePaymentEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                    <div>
                      <p className="font-semibold text-gray-800">MCQ Test Time Limit (Minutes)</p>
                      <p className="text-xs text-gray-500 mt-1">Set the duration in minutes for the vendor MCQ training test</p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        name="mcqTimeLimitMinutes"
                        value={financialSettings.mcqTimeLimitMinutes || 30}
                        onChange={(e) => setFinancialSettings(prev => ({ ...prev, mcqTimeLimitMinutes: Number(e.target.value) }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-500 bg-white"
                        min="1"
                      />
                      <button
                        onClick={async () => {
                          try {
                            await updateSettings({ mcqTimeLimitMinutes: financialSettings.mcqTimeLimitMinutes });
                            toast.success('MCQ Time Limit updated successfully');
                          } catch (error) {
                            toast.error('Failed to update MCQ Time Limit');
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  {/* Vendor Busy Buffer Hours */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                    <div>
                      <p className="font-semibold text-gray-800">Vendor Job Buffer Time (Hours)</p>
                      <p className="text-xs text-gray-500 mt-1">
                        How many hours before a scheduled booking the vendor becomes busy and stops receiving new bookings. Default: 1 hour.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        name="vendorBusyBufferHours"
                        value={financialSettings.vendorBusyBufferHours ?? 1}
                        onChange={(e) => setFinancialSettings(prev => ({ ...prev, vendorBusyBufferHours: Number(e.target.value) }))}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-blue-500 bg-white"
                        min="0"
                        step="0.5"
                      />
                      <button
                        onClick={async () => {
                          try {
                            await updateSettings({ vendorBusyBufferHours: financialSettings.vendorBusyBufferHours });
                            toast.success('Vendor buffer time updated successfully');
                          } catch (error) {
                            toast.error('Failed to update vendor buffer time');
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                      >
                        Save
                      </button>
                    </div>
                    <p className="text-[11px] text-orange-600 font-medium">
                      e.g. Set to <strong>2</strong> → vendor marked busy 2 hours before an 8 PM booking (from 6 PM onwards)
                    </p>
                  </div>



                </div>
              </div>

              {/* Support Settings */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-fit">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FiHeadphones className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-800">Contact & Support</h2>
                </div>

                <form onSubmit={handleSupportSave} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Support Email</label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input type="email" name="supportEmail" value={supportSettings.supportEmail} onChange={handleSupportChange}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-all" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Support Phone</label>
                    <div className="relative">
                      <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input type="text" name="supportPhone" value={supportSettings.supportPhone} onChange={handleSupportChange}
                        placeholder="e.g. 9999999999, 8888888888"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-all" />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">To add multiple numbers, separate them with commas.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">WhatsApp Support</label>
                    <div className="relative">
                      <FiMessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input type="tel" name="supportWhatsapp" value={supportSettings.supportWhatsapp} onChange={handleSupportChange}
                        maxLength={10}
                        placeholder="e.g. 9876543210"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-all" />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={supportLoading}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2 disabled:opacity-60 shadow-lg shadow-blue-200">
                      {supportLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSave className="w-4 h-4" />}
                      Save Details
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )
        }

        {/* About Page Settings View */}
        {
          activeView === 'about' && (
            <motion.div key="about" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
              className="max-w-3xl mx-auto bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <FiFileText className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">About Page Config</h2>
                  <p className="text-xs text-gray-500">Customize the 'Welcome to Doormeets' screen contents</p>
                </div>
              </div>

              <form onSubmit={handleAboutSave} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Hero Title</label>
                  <input type="text" name="title" value={aboutSettings.title} onChange={handleAboutChange} required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none transition-all font-bold text-gray-800" />
                  <p className="text-[10px] text-gray-400 mt-1">Hint: Use the word "Doormeets" inside to apply the signature red gradient styling</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Hero Subtitle</label>
                  <input type="text" name="subtitle" value={aboutSettings.subtitle} onChange={handleAboutChange} required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none transition-all text-gray-700" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Custom Logo Image URL (Optional)</label>
                  <input type="text" name="logoUrl" value={aboutSettings.logoUrl || ''} onChange={handleAboutChange}
                    placeholder="e.g. https://domain.com/logo.png (leave blank for default app logo)"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none transition-all text-sm text-gray-800" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Happy Customers Stat</label>
                    <input type="text" name="happyCustomers" value={aboutSettings.happyCustomers} onChange={handleAboutChange} required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none transition-all font-mono font-bold text-center" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Service Partners Stat</label>
                    <input type="text" name="servicePartners" value={aboutSettings.servicePartners} onChange={handleAboutChange} required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none transition-all font-mono font-bold text-center" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">App Rating Stat</label>
                    <input type="text" name="appRating" value={aboutSettings.appRating} onChange={handleAboutChange} required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none transition-all font-mono font-bold text-center" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Our Mission Statement</label>
                  <textarea name="mission" value={aboutSettings.mission} onChange={handleAboutChange} required rows="4"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none transition-all text-sm text-gray-600 leading-relaxed resize-none" />
                </div>

                {/* Dynamic Features Configuration */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Why Choose Us Features (4 items)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aboutSettings.features?.map((feat, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                        <span className="text-xs font-bold text-pink-600 uppercase">Feature #{idx + 1}</span>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Title</label>
                          <input type="text" 
                            value={feat.title} 
                            onChange={(e) => {
                              const newFeats = [...aboutSettings.features];
                              newFeats[idx].title = e.target.value;
                              setAboutSettings(prev => ({ ...prev, features: newFeats }));
                            }}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded outline-none focus:border-pink-500 text-gray-800 font-medium" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Description</label>
                          <input type="text" 
                            value={feat.description} 
                            onChange={(e) => {
                              const newFeats = [...aboutSettings.features];
                              newFeats[idx].description = e.target.value;
                              setAboutSettings(prev => ({ ...prev, features: newFeats }));
                            }}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded outline-none focus:border-pink-500 text-gray-700" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Feather Icon Name</label>
                          <input type="text" 
                            value={feat.iconName} 
                            placeholder="e.g. FiUsers, FiShield, FiClock, FiAward"
                            onChange={(e) => {
                              const newFeats = [...aboutSettings.features];
                              newFeats[idx].iconName = e.target.value;
                              setAboutSettings(prev => ({ ...prev, features: newFeats }));
                            }}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded outline-none focus:border-pink-500 font-mono text-pink-600 font-bold" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dynamic How We Work Steps Configuration */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">How We Work Steps (3 items)</h3>
                  <div className="space-y-3">
                    {aboutSettings.steps?.map((step, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="col-span-3 -mb-1 flex justify-between">
                          <span className="text-xs font-bold text-pink-600 uppercase">Step #{idx + 1}</span>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Step Title</label>
                          <input type="text" 
                            value={step.title} 
                            onChange={(e) => {
                              const newSteps = [...aboutSettings.steps];
                              newSteps[idx].title = e.target.value;
                              setAboutSettings(prev => ({ ...prev, steps: newSteps }));
                            }}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded outline-none focus:border-pink-500 text-gray-800 font-medium" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Description</label>
                          <input type="text" 
                            value={step.desc} 
                            onChange={(e) => {
                              const newSteps = [...aboutSettings.steps];
                              newSteps[idx].desc = e.target.value;
                              setAboutSettings(prev => ({ ...prev, steps: newSteps }));
                            }}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded outline-none focus:border-pink-500 text-gray-700" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Feather Icon Name</label>
                          <input type="text" 
                            value={step.iconName} 
                            placeholder="e.g. FiSmartphone, FiUsers, FiSmile"
                            onChange={(e) => {
                              const newSteps = [...aboutSettings.steps];
                              newSteps[idx].iconName = e.target.value;
                              setAboutSettings(prev => ({ ...prev, steps: newSteps }));
                            }}
                            className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded outline-none focus:border-pink-500 font-mono text-pink-600 font-bold" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-50">
                  <button type="submit" disabled={aboutLoading}
                    className="px-8 py-3 bg-pink-600 text-white rounded-xl font-semibold hover:bg-pink-700 flex items-center gap-2 disabled:opacity-60 shadow-lg shadow-pink-100 transition-all">
                    {aboutLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSave className="w-5 h-5" />}
                    Save Config
                  </button>
                </div>
              </form>
            </motion.div>
          )
        }

        {/* Cancellation Policy Config View */}
        {
          activeView === 'cancellation-policy' && isSuperAdmin && (
            <motion.div key="cancellation-policy" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
              className="max-w-3xl mx-auto bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-100 rounded-lg">
                  <FiFileText className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Cancellation Policy Config</h2>
                  <p className="text-xs text-gray-500">Configure texts and info shown to customers on the Cancellation Policy page</p>
                </div>
              </div>

              <form onSubmit={handleCancellationSave} className="space-y-6">
                {/* Highlights section */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Key Highlights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Free Cancellation Title</label>
                      <input type="text" name="freeCancellationTitle" value={cancellationSettings.freeCancellationTitle} onChange={handleCancellationChange} required
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Free Cancellation Description</label>
                      <input type="text" name="freeCancellationDesc" value={cancellationSettings.freeCancellationDesc} onChange={handleCancellationChange} required
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Late Fee Title</label>
                      <input type="text" name="lateFeeTitle" value={cancellationSettings.lateFeeTitle} onChange={handleCancellationChange} required
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Late Fee Description</label>
                      <input type="text" name="lateFeeDesc" value={cancellationSettings.lateFeeDesc} onChange={handleCancellationChange} required
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm" />
                    </div>
                  </div>
                </div>

                {/* Timeline Stages section */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Cancellation Timeline Stages</h3>
                  
                  {/* Stage 1 */}
                  <div className="p-4 bg-gray-50 rounded-xl space-y-3 border border-gray-200">
                    <span className="text-xs font-bold text-green-600 uppercase">Stage 1 (Before Journey Start)</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Stage Title</label>
                        <input type="text" name="stage1Title" value={cancellationSettings.stage1Title} onChange={handleCancellationChange} required
                          className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Stage Description</label>
                        <input type="text" name="stage1Desc" value={cancellationSettings.stage1Desc} onChange={handleCancellationChange} required
                          className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Refund Text</label>
                        <input type="text" name="stage1RefundText" value={cancellationSettings.stage1RefundText} onChange={handleCancellationChange} required
                          className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* Stage 2 */}
                  <div className="p-4 bg-gray-50 rounded-xl space-y-3 border border-gray-200">
                    <span className="text-xs font-bold text-orange-600 uppercase">Stage 2 (Journey Started)</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Stage Title</label>
                        <input type="text" name="stage2Title" value={cancellationSettings.stage2Title} onChange={handleCancellationChange} required
                          className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Stage Description</label>
                        <input type="text" name="stage2Desc" value={cancellationSettings.stage2Desc} onChange={handleCancellationChange} required
                          className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Refund Text (use &#123;penalty&#125; for fee value)</label>
                        <input type="text" name="stage2RefundText" value={cancellationSettings.stage2RefundText} onChange={handleCancellationChange} required
                          className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* Stage 3 */}
                  <div className="p-4 bg-gray-50 rounded-xl space-y-3 border border-gray-200">
                    <span className="text-xs font-bold text-red-600 uppercase">Stage 3 (Professional Arrived)</span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Stage Title</label>
                        <input type="text" name="stage3Title" value={cancellationSettings.stage3Title} onChange={handleCancellationChange} required
                          className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Stage Description</label>
                        <input type="text" name="stage3Desc" value={cancellationSettings.stage3Desc} onChange={handleCancellationChange} required
                          className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded outline-none" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">Refund Text (use &#123;visitingCharges&#125; for fee value)</label>
                        <input type="text" name="stage3RefundText" value={cancellationSettings.stage3RefundText} onChange={handleCancellationChange} required
                          className="w-full px-3 py-1.5 text-xs bg-white border border-gray-200 rounded outline-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* FAQ section */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Fee FAQ / Explainer</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Section Title</label>
                      <input type="text" name="whyChargeTitle" value={cancellationSettings.whyChargeTitle} onChange={handleCancellationChange} required
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Section Subtitle</label>
                      <input type="text" name="whyChargeSubtitle" value={cancellationSettings.whyChargeSubtitle} onChange={handleCancellationChange} required
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">FAQ Description Text</label>
                      <textarea name="whyChargeDetails" value={cancellationSettings.whyChargeDetails} onChange={handleCancellationChange} required rows="4"
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm resize-none" />
                    </div>
                  </div>
                </div>

                {/* Reschedule section */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Rescheduling Alternative</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Alternative Title</label>
                      <input type="text" name="rescheduleTitle" value={cancellationSettings.rescheduleTitle} onChange={handleCancellationChange} required
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Button Label</label>
                      <input type="text" name="rescheduleButtonLabel" value={cancellationSettings.rescheduleButtonLabel} onChange={handleCancellationChange} required
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Alternative Description</label>
                      <textarea name="rescheduleDesc" value={cancellationSettings.rescheduleDesc} onChange={handleCancellationChange} required rows="3"
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm resize-none" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button type="submit" disabled={cancellationLoading}
                    className="px-8 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 flex items-center gap-2 disabled:opacity-60 shadow-lg shadow-red-100 transition-all">
                    {cancellationLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSave className="w-5 h-5" />}
                    Save Policy Settings
                  </button>
                </div>
              </form>
            </motion.div>
          )
        }

        {/* User Tickets View */}
        {
          activeView === 'user-tickets' && isSuperAdmin && (
            <motion.div key="user-tickets" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[calc(100vh-140px)]">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <FiMessageCircle className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">User Support Tickets</h2>
                    <p className="text-sm text-gray-500">Total {userTickets.length} user tickets found</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <select 
                    value={userTicketsFilter}
                    onChange={(e) => setUserTicketsFilter(e.target.value)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-gray-50 outline-none animate-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting_on_user">Waiting on User</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {/* Left side list */}
                <div className="w-1/3 border-r border-gray-100 overflow-y-auto">
                  {userTicketsLoading ? (
                    <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div></div>
                  ) : userTickets.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">No tickets found</div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {userTickets.map(ticket => (
                        <div 
                          key={ticket._id}
                          onClick={() => handleUserTicketSelect(ticket._id)}
                          className={`p-4 cursor-pointer hover:bg-gray-50/50 transition-colors ${selectedUserTicket?._id === ticket._id ? 'bg-indigo-50/30 border-l-4 border-indigo-500' : ''}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-gray-400">#{ticket.ticketNumber}</span>
                            <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              ticket.status === 'resolved' || ticket.status === 'closed' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {ticket.status.replace('_', ' ')}
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-800 text-sm truncate">{ticket.subject}</h4>
                          <p className="text-xs text-gray-500 mt-1 truncate">By: {ticket.creator?.name || 'Unknown User'}</p>
                          <span className="text-[9px] text-gray-400 block mt-1">{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right side chat */}
                <div className="flex-1 flex flex-col bg-gray-50/30 overflow-hidden">
                  {selectedUserTicket ? (
                    <>
                      {/* Ticket Detail Info Header */}
                      <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800 text-sm">{selectedUserTicket.subject}</h3>
                          <p className="text-xs text-gray-500">User: {selectedUserTicket.creator?.name} ({selectedUserTicket.creator?.email || 'No email'})</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUserTicketStatusChange('resolved')}
                            className="px-3 py-1 bg-green-600 text-white rounded text-xs font-semibold hover:bg-green-700 cursor-pointer"
                          >
                            Mark Resolved
                          </button>
                          <button
                            onClick={() => handleUserTicketStatusChange('closed')}
                            className="px-3 py-1 bg-gray-600 text-white rounded text-xs font-semibold hover:bg-gray-700 cursor-pointer"
                          >
                            Close Ticket
                          </button>
                        </div>
                      </div>

                      {/* Messages List */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {selectedUserTicket.messages.map((msg, idx) => {
                          const isAdmin = msg.sender === 'admin';
                          return (
                            <div key={idx} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[70%] rounded-xl px-4 py-2 text-sm shadow-sm ${
                                isAdmin 
                                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                                  : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                              }`}>
                                <span className="text-[9px] font-semibold block mb-0.5 opacity-85">
                                  {isAdmin ? 'You (Admin)' : selectedUserTicket.creator?.name || 'User'}
                                </span>
                                <p className="break-words">{msg.message}</p>
                                <span className="text-[8px] block text-right mt-1 opacity-60">
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Message Input form */}
                      {selectedUserTicket.status !== 'closed' ? (
                        <form onSubmit={handleUserReply} className="p-4 bg-white border-t border-gray-100 flex gap-2">
                          <input 
                            type="text"
                            required
                            placeholder="Type a reply..."
                            value={userTicketReply}
                            onChange={(e) => setUserTicketReply(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                          />
                          <button 
                            type="submit" 
                            disabled={userTicketSending}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 cursor-pointer"
                          >
                            {userTicketSending ? 'Sending...' : 'Send'}
                          </button>
                        </form>
                      ) : (
                        <div className="p-4 bg-gray-100 text-center text-xs text-gray-500 font-semibold">
                          This ticket is closed.
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                      Select a ticket from the left panel to start chat support.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        }

        {/* City Management View */}
        {
          activeView === 'cities' && (
            <motion.div key="cities" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <CityManagement />
            </motion.div>
          )
        }

        {/* Deleted Accounts Dashboard View */}
        {
          activeView === 'deleted' && (
            <motion.div key="deleted" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <DeletedAccountsDashboard />
            </motion.div>
          )
        }

        {/* Admin Management View - Super Admin Only */}
        {
          activeView === 'admins' && isSuperAdmin && (
            <motion.div key="admins" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <FiUsers className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Admin Management</h2>
                      <p className="text-sm text-gray-500">Total {admins.length} administrators found</p>
                    </div>
                  </div>
                </div>

                {/* Add/Edit Admin Form */}
                <AnimatePresence>
                  {showAddAdmin && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-b border-gray-100 bg-amber-50/50">
                      <form onSubmit={handleCreateAdmin} className="p-6">
                        <h3 className="text-sm font-bold text-gray-800 mb-4">{newAdmin.id ? 'Edit Administrator' : 'Create New Administrator'}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4"> {/* Increased columns */}
                          <input type="text" placeholder="Full Name" value={newAdmin.name} onChange={e => setNewAdmin(p => ({ ...p, name: e.target.value }))}
                            className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" />
                          <input type="email" placeholder="Email Address" value={newAdmin.email} onChange={e => setNewAdmin(p => ({ ...p, email: e.target.value }))}
                            className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" />
                          <input type="password" placeholder={newAdmin.id ? "Password (leave blank to keep)" : "Password"} value={newAdmin.password} onChange={e => setNewAdmin(p => ({ ...p, password: e.target.value }))}
                            className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" />

                          {/* Role Selection */}
                          <select value={newAdmin.role} onChange={e => setNewAdmin(p => ({ ...p, role: e.target.value }))}
                            className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200">
                            <option value="admin">Admin</option>
                            <option value="super_admin">Super Admin</option>
                            <option value="city_admin">City Admin</option>
                          </select>

                          {/* City Selection */}
                          <select value={newAdmin.cityId} onChange={e => setNewAdmin(p => ({ ...p, cityId: e.target.value }))}
                            className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200">
                            <option value="">All Cities (Global)</option>
                            {cities.map(city => (
                              <option key={city._id} value={city._id}>
                                {city.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex justify-end gap-3 mt-4">
                          <button type="button" onClick={() => setShowAddAdmin(false)} className="px-6 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 font-medium text-sm">
                            Cancel
                          </button>
                          <button type="submit" disabled={adminLoading}
                            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-60 font-medium text-sm">
                            {adminLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (newAdmin.id ? 'Update Admin' : 'Create Admin')}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Admins Table List */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-100">
                        <th className="px-6 py-4 font-semibold">Administrator</th>
                        <th className="px-6 py-4 font-semibold">Role</th>
                        <th className="px-6 py-4 font-semibold">Assigned City</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {admins.map((admin) => (
                        <tr key={admin._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center font-bold text-gray-600 shadow-sm border border-white">
                                {admin.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-800 text-sm">{admin.name}</p>
                                <p className="text-xs text-gray-500">{admin.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${admin.role === 'super_admin'
                              ? 'bg-amber-50 text-amber-700 border-amber-100'
                              : admin.role === 'city_admin' ? 'bg-teal-50 text-teal-700 border-teal-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                              }`}>
                              {admin.role === 'super_admin' ? 'Super Admin' : admin.role === 'city_admin' ? 'City Admin' : 'Admin'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {admin.cityId ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                                {admin.cityId.name || 'Unknown City'}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">All Cities</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`flex items-center gap-1.5 text-xs font-medium ${admin.isActive !== false ? 'text-green-600' : 'text-red-500'}`}>
                              <span className={`w-2 h-2 rounded-full ${admin.isActive !== false ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              {admin.isActive !== false ? 'Active' : 'Blocked'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {admin._id !== profile.id && admin.email !== 'admin@admin.com' && (
                              <div className="flex justify-end gap-2">
                                <button onClick={() => handleEditClick(admin)}
                                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                  title="Edit Admin">
                                  <FiEdit className="w-4 h-4" />
                                </button>

                                <button onClick={() => handleBlockAdmin(admin._id, admin.isActive !== false)}
                                  className={`p-2 text-gray-400 rounded-lg transition-all ${admin.isActive !== false ? 'hover:text-amber-600 hover:bg-amber-50' : 'hover:text-green-600 hover:bg-green-50'
                                    }`}
                                  title={admin.isActive !== false ? "Block Admin" : "Unblock Admin"}>
                                  {admin.isActive !== false ? <FiLock className="w-4 h-4" /> : <FiUnlock className="w-4 h-4" />}
                                </button>

                                <button onClick={() => handleDeleteAdmin(admin._id, admin.name)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="Delete Admin">
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {admins.length === 0 && (
                        <tr>
                          <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                            <FiUsers className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No administrators found</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )
        }

        {/* Credit Packages View */}
        {activeView === 'credits' && isSuperAdmin && (
          <motion.div key="credits" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <CreditPackages />
          </motion.div>
        )}

        {/* Level Settings View */}
        {activeView === 'levels' && isSuperAdmin && (
          <motion.div key="levels" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <div className="max-w-3xl mx-auto bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <FiAward className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Vendor Levels Config</h2>
                  <p className="text-xs text-gray-500">Configure target requirements and upgrade steps dynamically</p>
                </div>
              </div>

              {/* Tabs for Levels */}
              <div className="flex gap-2 mb-6 border-b border-gray-100 pb-3">
                {['L3', 'L2', 'L1'].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setActiveLevelTab(lvl)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                      activeLevelTab === lvl
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {lvl === 'L3' ? 'Level 3 (Beginner)' : lvl === 'L2' ? 'Level 2 (Professional)' : 'Level 1 (Expert)'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleLevelsSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Badge Title</label>
                    <input
                      type="text"
                      value={levelConfigSettings[activeLevelTab].badge}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLevelConfigSettings((prev) => ({
                          ...prev,
                          [activeLevelTab]: { ...prev[activeLevelTab], badge: val }
                        }));
                      }}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-amber-500 transition-all font-bold text-gray-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Level Name</label>
                    <input
                      type="text"
                      value={levelConfigSettings[activeLevelTab].name}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLevelConfigSettings((prev) => ({
                          ...prev,
                          [activeLevelTab]: { ...prev[activeLevelTab], name: val }
                        }));
                      }}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-amber-500 transition-all font-bold text-gray-800 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Badge Color Hex Code</label>
                    <input
                      type="text"
                      value={levelConfigSettings[activeLevelTab].color}
                      onChange={(e) => {
                        const val = e.target.value;
                        setLevelConfigSettings((prev) => ({
                          ...prev,
                          [activeLevelTab]: { ...prev[activeLevelTab], color: val }
                        }));
                      }}
                      required
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-amber-500 transition-all font-bold text-gray-800 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Level Description</label>
                  <textarea
                    value={levelConfigSettings[activeLevelTab].desc}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLevelConfigSettings((prev) => ({
                        ...prev,
                        [activeLevelTab]: { ...prev[activeLevelTab], desc: val }
                      }));
                    }}
                    required
                    rows="2"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-amber-500 transition-all font-bold text-gray-800 text-xs mb-4"
                  />

                  <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/80">
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-xs font-black text-amber-900 uppercase tracking-wider">
                        Level Upgrade Steps (Shown in Ticket Card)
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setLevelConfigSettings(prev => {
                            const current = prev[activeLevelTab].customSteps || [];
                            return {
                              ...prev,
                              [activeLevelTab]: {
                                ...prev[activeLevelTab],
                                customSteps: [...current, '']
                              }
                            };
                          });
                        }}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-extrabold transition-all shadow-xs"
                      >
                        + Add Step
                      </button>
                    </div>

                    <div className="space-y-2">
                      {(levelConfigSettings[activeLevelTab].customSteps || []).map((stepText, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 font-extrabold text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={stepText}
                            placeholder={`Step ${idx + 1} description...`}
                            onChange={(e) => {
                              const val = e.target.value;
                              setLevelConfigSettings(prev => {
                                const list = [...(prev[activeLevelTab].customSteps || [])];
                                list[idx] = val;
                                return {
                                  ...prev,
                                  [activeLevelTab]: {
                                    ...prev[activeLevelTab],
                                    customSteps: list
                                  }
                                };
                              });
                            }}
                            className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-amber-500 text-xs font-semibold text-gray-800"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setLevelConfigSettings(prev => {
                                const list = (prev[activeLevelTab].customSteps || []).filter((_, i) => i !== idx);
                                return {
                                  ...prev,
                                  [activeLevelTab]: {
                                    ...prev[activeLevelTab],
                                    customSteps: list
                                  }
                                };
                              });
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg text-xs font-bold transition-all"
                            title="Delete Step"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide mb-4">Requirements & Targets</h3>
                  
                  {activeLevelTab !== 'L1' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1.5">Target Completed Bookings</label>
                        <input
                          type="number"
                          value={levelConfigSettings[activeLevelTab].targetJobs}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setLevelConfigSettings((prev) => ({
                              ...prev,
                              [activeLevelTab]: { ...prev[activeLevelTab], targetJobs: val }
                            }));
                          }}
                          required
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-amber-500 transition-all font-bold text-gray-800 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1.5">Min Customer Rating (0 - 5)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={levelConfigSettings[activeLevelTab].targetRating}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setLevelConfigSettings((prev) => ({
                              ...prev,
                              [activeLevelTab]: { ...prev[activeLevelTab], targetRating: val }
                            }));
                          }}
                          required
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-amber-500 transition-all font-bold text-gray-800 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1.5">Min Completion Rate (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={levelConfigSettings[activeLevelTab].targetCompletionRate}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setLevelConfigSettings((prev) => ({
                              ...prev,
                              [activeLevelTab]: { ...prev[activeLevelTab], targetCompletionRate: val }
                            }));
                          }}
                          required
                          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-amber-500 transition-all font-bold text-gray-800 text-xs"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1.5">Min Customer Rating (0 - 5)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="5"
                            value={levelConfigSettings.L1.targetRating}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setLevelConfigSettings((prev) => ({
                                ...prev,
                                L1: { ...prev.L1, targetRating: val }
                              }));
                            }}
                            required
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-amber-500 transition-all font-bold text-gray-800 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1.5">Monthly Jobs Target (Volume Info)</label>
                          <input
                            type="number"
                            value={levelConfigSettings.L1.targetJobs}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setLevelConfigSettings((prev) => ({
                                ...prev,
                                L1: { ...prev.L1, targetJobs: val }
                              }));
                            }}
                            required
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-amber-500 transition-all font-bold text-gray-800 text-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1.5">Maintenance Description Text</label>
                          <input
                            type="text"
                            value={levelConfigSettings.L1.maintenanceDesc}
                            onChange={(e) => {
                              const val = e.target.value;
                              setLevelConfigSettings((prev) => ({
                                ...prev,
                                L1: { ...prev.L1, maintenanceDesc: val }
                              }));
                            }}
                            required
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-amber-500 transition-all font-bold text-gray-800 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1.5">Violations / Safety Rules Text</label>
                          <input
                            type="text"
                            value={levelConfigSettings.L1.violationDesc}
                            onChange={(e) => {
                              const val = e.target.value;
                              setLevelConfigSettings((prev) => ({
                                ...prev,
                                L1: { ...prev.L1, violationDesc: val }
                              }));
                            }}
                            required
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-amber-500 transition-all font-bold text-gray-800 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100 font-bold text-xs uppercase tracking-wider">
                  <button
                    type="submit"
                    disabled={levelsLoading}
                    className="px-6 py-2.5 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 flex items-center gap-2 disabled:opacity-60 shadow-lg shadow-amber-200 text-xs font-bold"
                  >
                    {levelsLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSave className="w-4 h-4" />}
                    Save Level Config
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* Privacy Policy View */}
        {activeView === 'privacy' && isSuperAdmin && (
          <motion.div key="privacy" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <div className="max-w-3xl mx-auto bg-white rounded-xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <FiShield className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Privacy Policy & Data Agreement</h2>
                  <p className="text-xs text-gray-500">Configure dynamically the user privacy policy and data agreement terms</p>
                </div>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                setPrivacyLoading(true);
                try {
                  await updateSettings({ privacyPolicy: supportSettings.privacyPolicy });
                  toast.success('Privacy Policy updated successfully');
                } catch (error) {
                  toast.error('Failed to update Privacy Policy');
                } finally {
                  setPrivacyLoading(false);
                }
              }} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 font-bold">Privacy Policy Terms</label>
                  <textarea
                    value={supportSettings.privacyPolicy}
                    onChange={(e) => setSupportSettings(prev => ({ ...prev, privacyPolicy: e.target.value }))}
                    required
                    rows="15"
                    placeholder="Enter full privacy agreement content here..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-indigo-500 transition-all font-semibold text-gray-800 text-xs leading-relaxed"
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={privacyLoading}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-60 shadow-lg shadow-indigo-200 text-xs font-bold uppercase tracking-wider"
                  >
                    {privacyLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiSave className="w-4 h-4" />}
                    Save Policy
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

      </AnimatePresence >

    </motion.div >
  );
};
export default AdminSettings;
