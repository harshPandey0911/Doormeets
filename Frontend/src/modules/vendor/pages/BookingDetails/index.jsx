import React, { useState, useEffect, useLayoutEffect } from 'react';
import api from '../../../../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import html2pdf from 'html2pdf.js';
import { FiMapPin, FiClock, FiDollarSign, FiUser, FiPhone, FiNavigation, FiArrowRight, FiEdit, FiCheckCircle, FiCreditCard, FiX, FiCheck, FiTool, FiXCircle, FiAward, FiPackage, FiAlertCircle, FiPlus, FiTrash2, FiFileText, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { vendorTheme as themeColors } from '../../../../theme';
import Header from '../../components/layout/Header';
import BottomNav from '../../components/layout/BottomNav';
import {
  getBookingById,
  updateBookingStatus,
  assignWorker as assignWorkerApi,
  startSelfJob,
  vendorReached,
  verifySelfVisit,
  completeSelfJob,
  requestCancel,
  cancelAccepted
} from '../../services/bookingService';
import vendorBillService from '../../../../services/vendorBillService';
import { CashCollectionModal, ConfirmDialog, WorkerPaymentModal, OtpVerificationModal, ReachedPhotoModal } from '../../components/common';
import VisitVerificationModal from '../../components/common/VisitVerificationModal';
// Import shared WorkCompletionModal from worker directory or move to shared
import WorkCompletionModal from '../../components/common/WorkCompletionModal';
// import BillingModal from '../../components/bookings/BillingModal'; // Consumed by page now
import vendorWalletService from '../../../../services/vendorWalletService';
import { vendorCatalogService, publicCatalogService } from '../../../../services/catalogService';
import { toast } from 'react-hot-toast';
import { useAppNotifications } from '../../../../hooks/useAppNotifications';
import { useLocationTracking } from '../../../../hooks/useLocationTracking';
import { configService } from '../../../../services/configService';

const getStateCode = (stateName) => {
  if (!stateName) return '00';
  const codes = {
    'chhattisgarh': '22',
    'madhya pradesh': '23',
    'haryana': '06',
    'delhi': '07',
    'maharashtra': '27',
    'uttar pradesh': '09',
    'karnataka': '29',
    'tamil nadu': '33',
    'west bengal': '19',
    'gujarat': '24',
    'rajasthan': '08'
  };
  return codes[stateName.toLowerCase().trim()] || '00';
};

const numberToWords = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '';
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  const convertLessThanOneThousand = (n) => {
    if (n === 0) return '';
    let temp = '';
    if (n >= 100) {
      temp += ones[Math.floor(n / 100)] + ' hundred ';
      n %= 100;
    }
    if (n >= 20) {
      temp += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      temp += ones[n] + ' ';
    }
    return temp.trim();
  };

  const convert = (n) => {
    if (n === 0) return 'zero';
    let words = '';
    if (Math.floor(n / 10000000) > 0) {
      words += convertLessThanOneThousand(Math.floor(n / 10000000)) + ' crore ';
      n %= 10000000;
    }
    if (Math.floor(n / 100000) > 0) {
      words += convertLessThanOneThousand(Math.floor(n / 100000)) + ' lakh ';
      n %= 100000;
    }
    if (Math.floor(n / 1000) > 0) {
      words += convertLessThanOneThousand(Math.floor(n / 1000)) + ' thousand ';
      n %= 1000;
    }
    words += convertLessThanOneThousand(n);
    return words.trim();
  };

  const rounded = parseFloat(num).toFixed(2);
  const parts = rounded.split('.');
  const integerPart = parseInt(parts[0]) || 0;
  const decimalPart = parseInt(parts[1]) || 0;

  let result = convert(integerPart);
  if (decimalPart > 0) {
    result += ' point ' + convert(decimalPart);
  }
  return result + ' only';
};

export default function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isWorker = localStorage.getItem('role') === 'worker' || window.location.pathname.startsWith('/worker');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPayWorkerModalOpen, setIsPayWorkerModalOpen] = useState(false);
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isWorkDoneModalOpen, setIsWorkDoneModalOpen] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [isReachedModalOpen, setIsReachedModalOpen] = useState(false);
  const [reachedLoading, setReachedLoading] = useState(false);

  // Accordion Expand/Collapse states
  const [isOrderSummaryExpanded, setIsOrderSummaryExpanded] = useState(false);
  const [isCustomerInfoExpanded, setIsCustomerInfoExpanded] = useState(false);
  const [isLocationExpanded, setIsLocationExpanded] = useState(false);
  const [isPreferredTimeExpanded, setIsPreferredTimeExpanded] = useState(false);
  const [isPaymentSummaryExpanded, setIsPaymentSummaryExpanded] = useState(false);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(false);

  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [addonSearch, setAddonSearch] = useState('');
  const [addonCatalog, setAddonCatalog] = useState([]);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [existingBill, setExistingBill] = useState(null);
  const [addonLoading, setAddonLoading] = useState(false);
  const [activeAddonTab, setActiveAddonTab] = useState('services'); // 'services' or 'addons'
  const [categoryServices, setCategoryServices] = useState([]);

  const [companyDetails, setCompanyDetails] = useState({
    companyName: 'Doormeeets',
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
    vendorSgstPercentage: 2.5,
    sacCode: '998599'
  });

  const [supportPhone, setSupportPhone] = useState('');

  // Fetch public support phone from admin settings
  useEffect(() => {
    configService.getSettings().then(res => {
      if (res?.settings?.supportPhone) setSupportPhone(res.settings.supportPhone);
    }).catch(() => { });
  }, []);

  useEffect(() => {
    if (isAddonModalOpen) {
      const loadAddonData = async () => {
        try {
          setAddonLoading(true);
          const [servicesRes, partsRes, billRes, catServicesRes] = await Promise.all([
            vendorBillService.getServiceCatalog().catch(() => ({ success: false })),
            vendorBillService.getPartsCatalog().catch(() => ({ success: false })),
            vendorBillService.getBill(id).catch(() => ({ success: false })),
            booking?.categoryId ? publicCatalogService.getServices({ categoryId: booking.categoryId?._id || booking.categoryId }).catch(() => ({ success: false })) : Promise.resolve({ success: true, data: [] })
          ]);

          const services = (servicesRes?.services || []).map(s => ({
            ...s,
            price: s.customerPrice !== undefined ? s.customerPrice : s.price,
            isPart: false
          }));
          const parts = (partsRes?.parts || []).map(p => ({
            ...p,
            price: p.customerPrice !== undefined ? p.customerPrice : p.price,
            isPart: true
          }));
          setAddonCatalog([...services, ...parts]);

          if (catServicesRes && catServicesRes.success && catServicesRes.services) {
            let mappedCatServices = [];
            catServicesRes.services.forEach(s => {
              if (s.packages && s.packages.length > 0) {
                // Package based service - add each package
                s.packages.forEach(pkg => {
                  mappedCatServices.push({
                    _id: s.id + '_' + pkg.title.replace(/\s+/g, '-'), // Fake unique ID
                    name: pkg.title,
                    price: pkg.price || pkg.originalPrice || 0,
                    isPart: false,
                    isCategoryService: true
                  });
                });
              } else if (s.variants && s.variants.length > 0) {
                // Has variants
                s.variants.forEach(v => {
                  mappedCatServices.push({
                    _id: s.id + '_' + v._id,
                    name: s.title + ' - ' + v.name,
                    price: v.extraPrice || v.price || s.basePrice || 0,
                    isPart: false,
                    isCategoryService: true
                  });
                });
              } else {
                // Normal service
                mappedCatServices.push({
                  _id: s.id,
                  name: s.title || s.name,
                  price: s.basePrice || s.price || 0,
                  isPart: false,
                  isCategoryService: true
                });
              }
            });
            setCategoryServices(mappedCatServices);
          }

          if (billRes && billRes.success && billRes.bill) {
            setExistingBill(billRes.bill);
            const savedAddons = (billRes.bill.services || [])
              .filter(s => !s.isOriginal)
              .map(s => ({
                catalogId: s.catalogId?._id || s.catalogId,
                name: s.name,
                price: s.price,
                quantity: s.quantity || 1,
                note: s.note || '',
                isPart: false
              }));
            const savedParts = (billRes.bill.parts || [])
              .map(p => ({
                catalogId: p.catalogId?._id || p.catalogId,
                name: p.name,
                price: p.price,
                quantity: p.quantity || 1,
                note: p.note || '',
                isPart: true
              }));
            setSelectedAddons([...savedAddons, ...savedParts]);
          } else {
            setExistingBill(null);
            setSelectedAddons([]);
          }
        } catch (err) {
          console.error("Failed to load addons data:", err);
          toast.error("Failed to load catalog services");
        } finally {
          setAddonLoading(false);
        }
      };
      loadAddonData();
    }
  }, [isAddonModalOpen, id, booking]);

  const handleSaveAddons = async () => {
    try {
      setAddonLoading(true);
      const services = selectedAddons.filter(a => !a.isPart).map(s => {
        const isValidId = /^[0-9a-fA-F]{24}$/.test(s.catalogId);
        if (!isValidId) {
          const { catalogId, ...rest } = s;
          return rest;
        }
        return s;
      });
      const parts = selectedAddons.filter(a => a.isPart);

      const res = await vendorBillService.createOrUpdateBill(id, {
        services: services,
        parts: [...(existingBill?.parts || []).filter(p => !p.catalogId), ...parts],
        customItems: existingBill?.customItems || [],
        transportCharges: existingBill?.transportCharges || 0,
        applyPartsGST: existingBill?.applyPartsGST !== undefined ? existingBill?.applyPartsGST : true
      });

      if (res.success) {
        toast.success("Add-on services saved successfully!");
        setIsAddonModalOpen(false);
        loadBooking(); // Reload details to show updated totals
      } else {
        toast.error(res.message || "Failed to save add-ons");
      }
    } catch (err) {
      console.error("Failed to save addons:", err);
      toast.error("Failed to save add-on services");
    } finally {
      setAddonLoading(false);
    }
  };

  const handleRemoveService = async (serviceToRemove) => {
    try {
      toast.loading("Removing service...");
      const updatedServices = services.filter(s => s._id !== serviceToRemove._id && s.name !== serviceToRemove.name);

      const res = await vendorBillService.createOrUpdateBill(id, {
        services: updatedServices,
        parts: existingBill?.parts || [],
        customItems: existingBill?.customItems || [],
        transportCharges: existingBill?.transportCharges || 0,
        applyPartsGST: existingBill?.applyPartsGST !== undefined ? existingBill?.applyPartsGST : true
      });

      toast.dismiss();
      if (res.success) {
        toast.success("Service removed successfully!");
        loadBooking();
      } else {
        toast.error(res.message || "Failed to remove service");
      }
    } catch (err) {
      toast.dismiss();
      console.error("Failed to remove service:", err);
      toast.error("Failed to remove service");
    }
  };

  const handleToggleAddon = (item) => {
    setSelectedAddons(prev => {
      const exists = prev.find(a => a.catalogId === item._id);
      if (exists) {
        return prev.filter(a => a.catalogId !== item._id);
      }
      return [...prev, {
        catalogId: item._id,
        name: item.name,
        price: item.price,
        quantity: 1,
        note: '',
        isPart: !!item.isPart
      }];
    });
  };

  const handleUpdateAddonQty = (catalogId, delta) => {
    setSelectedAddons(prev => prev.map(a => {
      if (a.catalogId === catalogId) {
        return { ...a, quantity: Math.max(1, a.quantity + delta) };
      }
      return a;
    }));
  };

  const handleUpdateAddonNote = (catalogId, noteText) => {
    setSelectedAddons(prev => prev.map(a => {
      if (a.catalogId === catalogId) {
        return { ...a, note: noteText };
      }
      return a;
    }));
  };

  const getFilteredList = () => {
    if (activeAddonTab === 'services') {
      return categoryServices.filter(s => s.name.toLowerCase().includes(addonSearch.toLowerCase()));
    } else {
      return addonCatalog.filter(s => {
        const catIdMatch = String(s.categoryId?._id || s.categoryId || '') === String(booking?.categoryId || '');
        const catNameMatch = String(s.categoryId?.title || '').toLowerCase() === String(booking?.serviceCategory || '').toLowerCase();
        const isCategoryMatch = catIdMatch || catNameMatch;
        const isSearchMatch = s.name.toLowerCase().includes(addonSearch.toLowerCase());
        return isCategoryMatch && isSearchMatch;
      });
    }
  };
  const filteredListToRender = getFilteredList();


  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
    type: 'warning'
  });

  const [canCancel, setCanCancel] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/public/config');
        if (response.data?.success && response.data?.settings) {
          setCompanyDetails({
            companyName: response.data.settings.companyName || 'Doormeeets',
            companyGSTIN: response.data.settings.companyGSTIN || '',
            companyPAN: response.data.settings.companyPAN || '',
            companyAddress: response.data.settings.companyAddress || '',
            companyCity: response.data.settings.companyCity || '',
            companyState: response.data.settings.companyState || '',
            companyPincode: response.data.settings.companyPincode || '',
            companyPhone: response.data.settings.companyPhone || '',
            companyEmail: response.data.settings.companyEmail || '',
            companyCIN: response.data.settings.companyCIN || '',
            companyWebsite: response.data.settings.companyWebsite || '',
            vendorCgstPercentage: response.data.settings.vendorCgstPercentage || 2.5,
            vendorSgstPercentage: response.data.settings.vendorSgstPercentage || 2.5,
            sacCode: response.data.settings.sacCode || '998599'
          });
        }
      } catch (error) {
        console.error('Failed to fetch public settings for vendor:', error);
      }
    };
    fetchSettings();
  }, []);

  const handleDownloadInvoice = async () => {
    if (!booking) return;

    // Use grandTotal from existingBill if available, else booking.finalAmount / booking.totalAmount
    const grandTotalVal = existingBill?.grandTotal || booking.finalAmount || booking.totalAmount || 0;

    const cgstRate = companyDetails.vendorCgstPercentage || 2.5;
    const sgstRate = companyDetails.vendorSgstPercentage || 2.5;
    const totalGstRate = cgstRate + sgstRate;

    const taxableValue = parseFloat((grandTotalVal / (1 + (totalGstRate / 100))).toFixed(2));
    const cgstAmount = parseFloat((taxableValue * (cgstRate / 100)).toFixed(2));
    const sgstAmount = parseFloat((taxableValue * (sgstRate / 100)).toFixed(2));

    const formattedDate = new Date(booking.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const custName = booking.userId?.name || 'Rohit Bisen';
    const invoiceNum = `PIM${booking.bookingNumber}`;

    const addr1 = booking.address?.addressLine1 || '';
    const addr2 = booking.address?.addressLine2 || '';
    const cityVal = booking.address?.city || '';
    const stateVal = booking.address?.state || '';
    const pinVal = booking.address?.pincode || '';
    const landVal = booking.address?.landmark || '';

    const custStateCode = getStateCode(stateVal);

    // Vendor details
    const vendorNameVal = booking.vendorId?.businessName || booking.vendorId?.name || 'Som Prakash Sahu';
    const vendorGSTINVal = booking.vendorId?.gstin || 'N/A';
    const vendorAddressVal = booking.vendorId?.address || 'Indore, Madhya Pradesh';
    const vendorStateVal = booking.vendorId?.state || stateVal;
    const vendorStateCode = getStateCode(vendorStateVal);

    const invoiceHtml = `
      <div style="font-family: Arial, sans-serif; padding: 40px; color: #333; line-height: 1.4; max-width: 800px; margin: 0 auto; background: #fff; box-sizing: border-box;">
        <!-- Header -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <tr>
            <td style="vertical-align: top;">
              <!-- Typographic Logo -->
              <div style="font-weight: bold; font-size: 22px; color: #000; letter-spacing: -0.5px; text-transform: lowercase; display: inline-flex; align-items: center;">
                <span style="background: #000; color: #fff; padding: 2px 6px; margin-right: 4px; border-radius: 4px; font-size: 15px; font-weight: 800; text-transform: uppercase;">dm</span>${companyDetails.companyName.toLowerCase().replace('doormeeets', 'doormeets')}
              </div>
              <div style="font-size: 11px; color: #555; margin-top: 10px; line-height: 1.5;">
                <strong>${companyDetails.companyName}</strong><br/>
                ${companyDetails.companyAddress || 'Raipur, Chhattisgarh'}<br/>
                ${companyDetails.companyCity ? `${companyDetails.companyCity}, ` : ''}${companyDetails.companyState} - ${companyDetails.companyPincode}<br/>
                Email: ${companyDetails.companyEmail}<br/>
                Telephone: ${companyDetails.companyPhone}<br/>
                ${companyDetails.companyGSTIN ? `GSTIN: ${companyDetails.companyGSTIN}<br/>` : ''}
                ${companyDetails.companyCIN ? `CIN: ${companyDetails.companyCIN}<br/>` : ''}
                ${companyDetails.companyWebsite || `www.${companyDetails.companyName.toLowerCase().replace('doormeeets', 'doormeets')}.com`}
              </div>
            </td>
            <td style="text-align: right; vertical-align: top; width: 400px;">
              <h1 style="font-size: 18px; font-weight: 800; color: #000; margin: 0; text-transform: uppercase; line-height: 1.3;">
                TAX INVOICE/ORIGINAL TAX INVOICE<br/>
                <span style="font-size: 14px; font-weight: 600; color: #555;">(UC PARTNER INVOICE)</span>
              </h1>
            </td>
          </tr>
        </table>

        <!-- Customer & Service Provider Details -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 35px; font-size: 12px; border-top: 1px solid #eee; border-bottom: 1px solid #eee; padding: 20px 0;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding: 15px 20px 15px 0; border-right: 1px solid #f0f0f0;">
              <div style="margin-bottom: 12px;">
                <span style="color: #666; display: block; font-size: 10px; text-transform: uppercase; font-weight: 700; margin-bottom: 2px;">Customer Name</span>
                <span style="font-size: 13px; font-weight: bold; color: #111;">${custName}</span>
              </div>

              <div style="margin-bottom: 12px;">
                <span style="color: #666; display: block; font-size: 10px; text-transform: uppercase; font-weight: 700; margin-bottom: 2px;">Invoice no.</span>
                <span style="font-size: 13px; font-weight: bold; color: #111;">${invoiceNum}</span>
              </div>

              <div style="margin-bottom: 12px;">
                <span style="color: #666; display: block; font-size: 10px; text-transform: uppercase; font-weight: 700; margin-bottom: 2px;">Delivery Address</span>
                <span style="font-size: 12px; color: #444; line-height: 1.4; display: block;">
                  ${addr1}<br/>
                  ${addr2 && addr2.trim().toLowerCase() !== `${cityVal}, ${stateVal}`.trim().toLowerCase() && addr2.trim().toLowerCase() !== `${cityVal}`.trim().toLowerCase() ? addr2 + '<br/>' : ''}
                  ${cityVal}, ${stateVal} - ${pinVal}<br/>
                  ${landVal ? 'Landmark: ' + landVal : ''}
                </span>
              </div>

              <div style="margin-bottom: 12px;">
                <span style="color: #666; display: block; font-size: 10px; text-transform: uppercase; font-weight: 700; margin-bottom: 2px;">Invoice Date</span>
                <span style="font-size: 12px; color: #111;">${formattedDate}</span>
              </div>

              <div style="margin-bottom: 12px;">
                <span style="color: #666; display: block; font-size: 10px; text-transform: uppercase; font-weight: 700; margin-bottom: 2px;">State Name & Code</span>
                <span style="font-size: 12px; color: #111;">${stateVal} (${custStateCode})</span>
              </div>

              <div style="margin-bottom: 12px;">
                <span style="color: #666; display: block; font-size: 10px; text-transform: uppercase; font-weight: 700; margin-bottom: 2px;">Place of Supply</span>
                <span style="font-size: 12px; color: #111;">${stateVal} (${custStateCode})</span>
              </div>

              ${booking.userGstNumber ? `
              <div style="margin-top: 12px; border-top: 1px dashed #eee; pt: 8px;">
                <span style="color: #666; display: block; font-size: 10px; text-transform: uppercase; font-weight: 700; margin-bottom: 2px;">Customer GSTIN</span>
                <span style="font-size: 12px; font-weight: bold; color: #111;">${booking.userGstNumber}</span>
              </div>
              ` : ''}
            </td>
            <td style="width: 50%; vertical-align: top; padding: 15px 0 15px 20px;">
              <div style="color: #000; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 15px; letter-spacing: 0.5px;">DELIVERY SERVICE PROVIDER</div>

              <div style="margin-bottom: 12px;">
                <span style="color: #666; display: block; font-size: 10px; text-transform: uppercase; font-weight: 700; margin-bottom: 2px;">Business GSTIN</span>
                <span style="font-size: 13px; font-weight: bold; color: #111;">${vendorGSTINVal}</span>
              </div>

              <div style="margin-bottom: 12px;">
                <span style="color: #666; display: block; font-size: 10px; text-transform: uppercase; font-weight: 700; margin-bottom: 2px;">Business Name</span>
                <span style="font-size: 12px; color: #111;">${vendorNameVal}</span>
              </div>

              <div style="margin-bottom: 12px;">
                <span style="color: #666; display: block; font-size: 10px; text-transform: uppercase; font-weight: 700; margin-bottom: 2px;">Address</span>
                <span style="font-size: 12px; color: #444; line-height: 1.4; display: block;">
                  ${vendorAddressVal}
                </span>
              </div>

              <div>
                <span style="color: #666; display: block; font-size: 10px; text-transform: uppercase; font-weight: 700; margin-bottom: 2px;">State Name & Code</span>
                <span style="font-size: 12px; color: #111;">${vendorStateVal} ${vendorStateCode}</span>
              </div>
            </td>
          </tr>
        </table>

        <!-- Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 12px;">
          <thead>
            <tr style="border-bottom: 2px solid #333; border-top: 2px solid #333;">
              <th style="text-align: left; padding: 10px 5px; font-weight: 800; text-transform: uppercase;">Items</th>
              <th style="text-align: right; padding: 10px 5px; font-weight: 800; text-transform: uppercase; width: 300px;">Taxable Value</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 20px 5px; vertical-align: top;">
                <span style="font-size: 14px; font-weight: bold; color: #111; display: block; margin-bottom: 4px;">
                  Service Charges - ${booking.serviceName}
                </span>
                <span style="color: #666;">SAC: ${companyDetails.sacCode}</span>
              </td>
              <td style="text-align: right; padding: 20px 5px; vertical-align: top;">
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                  <tr>
                    <td style="text-align: left; color: #666; padding: 3px 0;">Gross Amount</td>
                    <td style="text-align: right; font-weight: bold; color: #111;">Rs. ${grandTotalVal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="text-align: left; color: #666; padding: 10px 0 3px 0; font-weight: bold; border-top: 1px dashed #eee;">Taxable Value</td>
                    <td style="text-align: right; font-weight: bold; color: #111; padding: 10px 0 3px 0; border-top: 1px dashed #eee;">Rs. ${taxableValue.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="text-align: right; font-size: 10px; color: #777; font-style: italic; padding-bottom: 12px;">
                      (${numberToWords(taxableValue)})
                    </td>
                  </tr>
                  <tr>
                    <td style="text-align: left; color: #666; padding: 3px 0; border-top: 1px dashed #eee; padding-top: 10px;">CGST @${cgstRate}%</td>
                    <td style="text-align: right; font-weight: bold; color: #111; padding: 3px 0; border-top: 1px dashed #eee; padding-top: 10px;">Rs. ${cgstAmount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="text-align: right; font-size: 10px; color: #777; font-style: italic; padding-bottom: 8px;">
                      (${numberToWords(cgstAmount)})
                    </td>
                  </tr>
                  <tr>
                    <td style="text-align: left; color: #666; padding: 3px 0; border-top: 1px dashed #eee; padding-top: 10px;">SGST @${sgstRate}%</td>
                    <td style="text-align: right; font-weight: bold; color: #111; padding: 3px 0; border-top: 1px dashed #eee; padding-top: 10px;">Rs. ${sgstAmount.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="text-align: right; font-size: 10px; color: #777; font-style: italic; padding-bottom: 8px;">
                      (${numberToWords(sgstAmount)})
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr style="border-top: 2px solid #333; border-bottom: 2px solid #333; font-size: 14px; font-weight: 900;">
              <td style="padding: 15px 5px; text-transform: uppercase;">TOTAL AMOUNT</td>
              <td style="text-align: right; padding: 15px 5px; color: #000; font-size: 16px;">Rs. ${grandTotalVal.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <!-- Signature Section -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 40px; font-size: 10px; color: #666; line-height: 1.5;">
          <tr>
            <td style="vertical-align: bottom; font-style: italic; width: 60%;">
              Under reverse charge applicability:<br/>
              1. This invoice is issued on behalf of the Service Provider. UC acts in the capacity of an Electronic Commerce operator as per Section 9(5) of the CGST Act, 2017.<br/>
              2. This invoice has been signed by UC only for limited purposes of complying as an Electronic Commerce Operator.
            </td>
            <td style="text-align: right; vertical-align: top; width: 40%;">
              <div style="border-bottom: 1px solid #ccc; height: 45px; margin-bottom: 8px;"></div>
              Signature of supplier/authorized representative
            </td>
          </tr>
        </table>
      </div>
    `;

    const opt = {
      margin: 10,
      filename: `UC-PartnerInvoice-${booking.bookingNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(invoiceHtml).set(opt).save();
  };

  useEffect(() => {
    if (!booking?.acceptedAt) {
      setCanCancel(false);
      return;
    }

    const checkWindow = () => {
      const acceptedTime = new Date(booking.acceptedAt).getTime();
      const timeDiffMs = Date.now() - acceptedTime;
      const twoMinutesMs = 2 * 60 * 1000;
      // Show cancel button if accepted within last 2 minutes and in confirmatory status
      const isCancellableStatus = ['confirmed', 'accepted', 'assigned'].includes(booking.status?.toLowerCase());
      setCanCancel(timeDiffMs < twoMinutesMs && isCancellableStatus);
    };

    checkWindow();
    const interval = setInterval(checkWindow, 1000);

    return () => clearInterval(interval);
  }, [booking?.acceptedAt, booking?.status]);

  useLayoutEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    const bgStyle = themeColors.backgroundGradient;

    if (html) html.style.background = bgStyle;
    if (body) body.style.background = bgStyle;
    if (root) root.style.background = bgStyle;

    return () => {
      if (html) html.style.background = '';
      if (body) body.style.background = '';
      if (root) root.style.background = '';
    };
  }, []);

  const loadBooking = async () => {
    try {
      setLoading(true);
      let billData = null;

      const [bookingRes, billRes] = await Promise.all([
        getBookingById(id),
        vendorBillService.getBill(id).catch(() => ({ success: false }))
      ]);

      const apiData = bookingRes.data || bookingRes;
      if (billRes && billRes.success) {
        billData = billRes.bill;
      }

      // Map API response to Component State structure
      const mappedBooking = {
        ...apiData,
        bill: billData || apiData.bill, // Prioritize fetched bill
        id: apiData._id || apiData.id,
        user: apiData.userId || apiData.user || { name: apiData.customerName || 'Customer', phone: apiData.customerPhone || 'Hidden' },
        customerName: apiData.userId?.name || apiData.customerName || 'Customer',
        customerPhone: apiData.userId?.phone || apiData.customerPhone || 'Hidden',
        serviceType: apiData.serviceId?.title || apiData.serviceName || apiData.serviceType || 'Service',
        items: apiData.bookedItems || [],
        location: {
          address: (() => {
            const a = apiData.address;
            if (!a) return 'Address not available';
            if (typeof a === 'string') return a;
            return `${a.addressLine2 ? a.addressLine2 + ', ' : ''}${a.addressLine1 || ''}, ${a.city || ''}`;
          })(),
          lat: apiData.address?.lat || 0,
          lng: apiData.address?.lng || 0,
          distance: apiData.distance ? `${apiData.distance.toFixed(1)} km` : 'N/A'
        },
        // Price Breakdown
        basePrice: parseFloat(apiData.basePrice || 0),
        tax: parseFloat(apiData.tax || (apiData.paymentMethod === 'plan_benefit' ? (apiData.basePrice || 0) * 0.18 : 0)),
        visitingCharges: parseFloat(apiData.visitingCharges || apiData.visitationFee || (apiData.paymentMethod === 'plan_benefit' ? 49 : 0)),
        discount: parseFloat(apiData.discount || 0),
        platformCommission: parseFloat(apiData.adminCommission || apiData.platformFee || apiData.commission || 0),
        finalAmount: parseFloat(apiData.finalAmount || 0),
        vendorEarnings: parseFloat(
          billData?.vendorTotalEarning ||
          apiData.vendorEarnings ||
          (apiData.paymentMethod === 'plan_benefit'
            ? (Number(apiData.basePrice || 0) * 0.7) // Fallback: 70% share from base
            : (apiData.finalAmount ? apiData.finalAmount - (apiData.commission || 0) : 0)
          )
        ),

        // Display Price (Vendor Earnings by default as requested)
        price: (apiData.vendorEarnings || (apiData.finalAmount ? apiData.finalAmount - (apiData.commission || 0) : 0)).toFixed(2),

        timeSlot: {
          date: apiData.scheduledDate ? new Date(apiData.scheduledDate).toLocaleDateString() : 'Today',
          time: apiData.scheduledTime || apiData.timeSlot?.start ? `${apiData.timeSlot.start} - ${apiData.timeSlot.end}` : 'Flexible'
        },
        status: apiData.status,
        description: apiData.description || apiData.notes || 'No description provided',
        assignedTo: apiData.isSelfJob
          ? { name: 'You (Self)' }
          : apiData.workerId
            ? { name: apiData.workerId.name, phone: apiData.workerId.phone }
            : null,
        workerResponse: apiData.workerResponse,
        workerResponseAt: apiData.workerResponseAt,
        paymentMethod: apiData.paymentMethod,
        paymentStatus: apiData.paymentStatus,
        cashCollected: apiData.cashCollected || false,
        workerPaymentStatus: apiData.workerPaymentStatus,
        finalSettlementStatus: apiData.finalSettlementStatus
      };

      setBooking(mappedBooking);
    } catch (error) {
      // Error loading booking
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooking();
    window.addEventListener('vendorJobsUpdated', loadBooking);

    return () => {
      window.removeEventListener('vendorJobsUpdated', loadBooking);
    };
  }, [id]);


  // ADDED: Socket for Live Location Tracking in Details Page
  const socket = useAppNotifications('vendor'); // Get socket

  // Optimized Live Location Tracking with distance filter and heading
  const isTrackingActive = booking?.status === 'journey_started' || booking?.status === 'visited';
  useLocationTracking(socket, id, isTrackingActive, {
    distanceFilter: 10, // Only emit when moved 10+ meters
    interval: 3000,     // Minimum 3s between emissions
    enableHighAccuracy: true
  });

  // Listen for Real-Time Booking Updates (e.g. Online Payment)
  useEffect(() => {
    if (socket && id) {
      const handleBookingUpdate = (data) => {
        // Check if update is for this booking
        if (data.bookingId === id || data.relatedId === id || data._id === id) {

          // Update local state to trigger effects immediately
          setBooking(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              ...data, // Merge updates
              status: data.status || prev.status,
              paymentStatus: data.paymentStatus || prev.paymentStatus
            };
          });

          // Also trigger a full reload to be safe/sync
          window.dispatchEvent(new Event('vendorJobsUpdated'));

          // Check if this update is a payment success, if so, trigger reload for fresh state
          const isPaymentSuccess =
            data.paymentStatus === 'SUCCESS' ||
            data.paymentStatus === 'paid' ||
            data.type === 'payment_success';

          if (isPaymentSuccess) {
            toast.success('Online Payment Received!');
            setTimeout(() => window.location.reload(), 1500);
          }
        }
      };

      socket.on('booking_updated', handleBookingUpdate);
      socket.on('payment_success', handleBookingUpdate);

      // Listen for booking cancellation by user — redirect vendor immediately
      const handleBookingCancelled = (data) => {
        if (data.bookingId === id || data.bookingId === booking?._id || data.bookingId === booking?.id) {
          toast.error(data.message || 'This booking has been cancelled by the customer.');
          // Update local state to show cancelled status
          setBooking(prev => prev ? { ...prev, status: 'cancelled' } : prev);
          // Redirect to dashboard after short delay
          setTimeout(() => {
            navigate('/vendor/dashboard');
          }, 2000);
        }
      };
      socket.on('booking_cancelled', handleBookingCancelled);

      return () => {
        socket.off('booking_updated', handleBookingUpdate);
        socket.off('payment_success', handleBookingUpdate);
        socket.off('booking_cancelled', handleBookingCancelled);
      };
    }
  }, [socket, id]);

  const handleVerifyVisit = async () => {
    const otp = otpInput.join('');
    if (otp.length !== 4) return toast.error('Enter 4-digit OTP');

    setActionLoading(true);

    if (!navigator.geolocation) {
      toast.error('Geolocation required for verification');
      setActionLoading(false);
      return;
    }

    // Robust Geolocation Helper - PERMISSIVE MODE
    const getPosition = () => {
      return new Promise((resolve, reject) => {
        // FASTEST STRATEGY: Prefer Wi-Fi/Cell (Low Accuracy) + Cached Positions
        // Detailed GPS is often blocked indoors where vendors verify arrival
        const options = {
          enableHighAccuracy: false, // Critical fix: Disable GPS requirement
          timeout: 30000,            // 30s timeout
          maximumAge: Infinity       // Accept any valid cached position
        };

        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            console.warn("Standard geo failed, trying high accuracy as last resort...", error);
            // Emergency fallback: Try GPS if Wi-Fi location fails (rare)
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
            );
          },
          options
        );
      });
    };

    try {
      const position = await getPosition();
      const location = { lat: position.coords.latitude, lng: position.coords.longitude };
      await verifySelfVisit(id, otp, location);
      toast.success('Visit Verified');
      setIsVisitModalOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Geo Error:", error);
      if (error.code === 1) toast.error('Location permission denied');
      else if (error.code === 2) toast.error('Location unavailable. Check GPS.');
      else if (error.code === 3) toast.error('Location timeout. Move to better signal area.');
      else toast.error('Failed to get location');
    } finally {
      setActionLoading(false);
    }
  };
  const getAvailableStatuses = (currentStatus, booking) => {
    // Check payment status
    const workerPaymentDone = booking?.workerPaymentStatus === 'PAID';
    const finalSettlementDone = booking?.finalSettlementStatus === 'DONE';
    const isSelfJob = booking?.assignedTo?.name === 'You (Self)';

    const statusFlow = {
      'confirmed': ['assigned', 'visited', 'journey_started'],
      'assigned': ['visited', 'journey_started'],
      'journey_started': ['visited'],
      'visited': ['in_progress', 'work_done'],
      'in_progress': ['work_done'],
      'work_done': ['completed', 'final_settlement'],
      'final_settlement': ['completed'],
      'completed': [],
    };
    return statusFlow[currentStatus] || [];
  };

  const canPayWorker = (booking) => {
    if (isWorker) return false;
    // If assigned to self, no worker payment needed
    if (booking?.assignedTo?.name === 'You (Self)') return false;

    // Allow payment ONLY if booking is completed (Vendor Approved)
    const validStatus = booking?.status === 'completed';
    return validStatus && booking?.workerPaymentStatus !== 'PAID';
  };

  const canDoFinalSettlement = (booking) => {
    // Check if payment is already done (Online SUCCESS or Cash COLLECTED)
    // Robust check for various status strings (case-insensitive)
    const pStatus = booking?.paymentStatus?.toLowerCase() || '';
    const isPaid = pStatus === 'success' || pStatus === 'paid' || pStatus === 'completed' || booking?.cashCollected;

    const status = booking?.status?.toLowerCase() || '';
    const isWorkDone = status === 'work_done' || status === 'completed' || status === 'worker_paid';

    // Check worker payment (enforce worker is paid before vendor can finalize unless doing job self)
    const isSelfJob = booking?.assignedTo?.name === 'You (Self)';
    const handleWorkerCheck = isSelfJob || booking?.workerPaymentStatus === 'PAID';

    return isWorkDone && isPaid && handleWorkerCheck && booking?.finalSettlementStatus !== 'DONE';
  };

  const handleStatusChange = async (newStatus) => {
    if (!booking) return;

    const availableStatuses = getAvailableStatuses(booking.status, booking);
    if (!availableStatuses.includes(newStatus)) {
      toast.error(`Cannot change status from ${booking.status} to ${newStatus}. Please follow the proper flow.`);
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Update Status',
      message: `Are you sure you want to change status to ${newStatus.replace('_', ' ')}?`,
      type: 'info',
      onConfirm: async () => {
        setLoading(true);
        try {
          await updateBookingStatus(id, newStatus);
          window.dispatchEvent(new Event('vendorJobsUpdated'));
          toast.success(`Status updated to ${newStatus.replace('_', ' ')} successfully!`);
          loadBooking();
        } catch (error) {
          console.error('Error updating status:', error);
          toast.error('Failed to update status. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleCancelBooking = async () => {
    const requiresRequest = !canCancel;

    if (requiresRequest) {
      const reason = window.prompt('Please enter the reason for requesting cancellation:');
      if (reason === null) return; // Vendor cancelled
      if (!reason.trim()) {
        toast.error('Cancellation reason is required');
        return;
      }

      setLoading(true);
      try {
        await requestCancel(id, reason);
        toast.success('Cancellation request submitted successfully.');
        window.dispatchEvent(new Event('vendorJobsUpdated'));
        loadBooking();
      } catch (error) {
        console.error('Error requesting cancellation:', error);
        toast.error(error.response?.data?.message || 'Failed to submit cancellation request.');
      } finally {
        setLoading(false);
      }
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Cancel Booking',
      message: 'Are you sure you want to cancel this booking? This will return the booking to the search pool. This action cannot be undone.',
      type: 'danger',
      onConfirm: async () => {
        setLoading(true);
        try {
          const response = await cancelAccepted(id);
          if (response.success) {
            toast.success('Booking cancelled successfully.');
            window.dispatchEvent(new Event('vendorJobsUpdated'));
            loadBooking();
          } else {
            toast.error(response.message || 'Failed to cancel booking.');
          }
        } catch (error) {
          console.error('Error cancelling booking:', error);
          toast.error(error.response?.data?.message || 'Failed to cancel booking.');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handlePayWorkerClick = () => {
    setIsPayWorkerModalOpen(true);
  };

  const handlePayWorkerSubmit = async (payoutData) => {
    const { amount, notes, transactionId, screenshot, paymentMethod } = payoutData;

    try {
      setPaySubmitting(true);
      const res = await vendorWalletService.payWorker(
        booking.id || booking._id,
        amount,
        notes,
        transactionId,
        screenshot,
        paymentMethod
      );

      if (res.success) {
        toast.success(res.message || 'Payment recorded successfully');
        setIsPayWorkerModalOpen(false);
        // Refresh booking data
        loadBooking();
      } else {
        toast.error(res.message || 'Failed to record payment');
      }
    } catch (error) {
      toast.error('Failed to process payment');
    } finally {
      setPaySubmitting(false);
    }
  };

  const handleFinalSettlement = async () => {
    if (!booking) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Final Settlement',
      message: 'Mark final settlement as done? This will allow you to complete the booking.',
      type: 'warning',
      onConfirm: async () => {
        setLoading(true);
        try {
          await updateBookingStatus(id, booking.status, {
            finalSettlementStatus: 'DONE'
          });
          window.dispatchEvent(new Event('vendorJobsUpdated'));
          toast.success('Final settlement marked as done!');
          loadBooking();
        } catch (error) {
          console.error('Error updating settlement:', error);
          toast.error('Failed to update settlement. Please try again.');
        } finally {
          setLoading(false);
        }
      }
    });
  };



  const handleCollectCashClick = () => {
    setIsCashModalOpen(true);
  };

  const handleCashCollectionConfirm = async (amount, extras, code) => {
    try {
      const res = await vendorWalletService.confirmCashCollection(id, amount, code, extras);
      if (res.success) {
        toast.success('Payment verified successfully!');
        window.location.reload();
      }
      return res;
    } catch (error) {
      console.error('Verify OTP error:', error);
      toast.error('Verification failed');
      throw error;
    }
  };

  const canCollectCash = (booking) => {
    // Hide if already collected or paid online
    if (booking?.cashCollected || booking?.paymentStatus === 'collected_by_vendor') {
      return false;
    }

    // Cash can be collected when booking is completed/work_done and payment was cash/at home
    const isSelfJob = booking?.assignedTo?.name === 'You (Self)' || isWorker;
    const validStatus = isSelfJob
      ? (booking?.status === 'work_done' || booking?.status === 'completed')
      : booking?.status === 'completed';

    if (!validStatus) return false;

    // CRITICAL FIX: Allow bill preparation for Plan Benefit bookings
    // Even if base is pre-paid (SUCCESS), vendor must generate final bill (for extras etc.)
    if (booking?.paymentMethod === 'plan_benefit') {
      return true;
    }

    const pStatus = booking?.paymentStatus?.toLowerCase() || '';
    if (pStatus === 'success' || pStatus === 'paid' || pStatus === 'completed') {
      return false;
    }

    // IMPORTANT: Only for Cash/Pay at Home methods OR Online if not paid yet.
    return (
      booking?.paymentMethod === 'cash' ||
      booking?.paymentMethod === 'pay_at_home' ||
      booking?.paymentMethod === 'online'
    );
  };



  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: themeColors.backgroundGradient }}>
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  const handleCallUser = () => {
    const phone = booking.user?.phone || booking.customerPhone;
    const isPhoneHidden = !phone || phone === 'Hidden' || phone === 'Phone hidden';
    if (isPhoneHidden) {
      // Call customer care when real phone is hidden (journey not started yet)
      const carePhone = supportPhone || '+919999999999';
      window.location.href = `tel:${carePhone}`;
    } else {
      window.location.href = `tel:${phone}`;
    }
  };

  const handleViewTimeline = () => {
    navigate(isWorker ? `/worker/booking/${booking.id || booking._id || id}/timeline` : `/vendor/booking/${booking.id || booking._id || id}/timeline`);
  };

  const handleAssignWorker = () => {
    navigate(isWorker ? `/worker/booking/${booking.id}/assign-worker` : `/vendor/booking/${booking.id}/assign-worker`);
  };

  const handleAssignToSelf = async () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Assign to Self',
      message: 'Are you sure you want to do this job yourself?',
      type: 'info',
      onConfirm: async () => {
        setLoading(true);
        try {
          const response = await assignWorkerApi(id, 'SELF');
          if (response && response.success) {
            toast.success('Assigned to yourself successfully');
            window.dispatchEvent(new Event('vendorJobsUpdated'));
            window.location.reload();
          } else {
            throw new Error(response?.message || 'Failed to assign');
          }
        } catch (error) {
          console.error('Error assigning to self:', error);
          toast.error(error.response?.data?.message || error.message || 'Failed to assign to yourself');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const isStartJourneyDisabled = () => {
    if (!booking || !booking.scheduledDate) return false;
    if (booking.bookingType === 'instant' || booking.scheduledTime === 'ASAP') return false;

    try {
      const schedDateObj = new Date(booking.scheduledDate);
      const timeStr = booking.scheduledTime || "";
      const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);

      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const ampm = timeMatch[3];

        if (ampm) {
          if (ampm.toUpperCase() === 'PM' && hours < 12) {
            hours += 12;
          }
          if (ampm.toUpperCase() === 'AM' && hours === 12) {
            hours = 0;
          }
        }

        schedDateObj.setHours(hours, minutes, 0, 0);
      }

      const now = new Date();
      const diffMs = schedDateObj.getTime() - now.getTime();
      const oneHourInMs = 60 * 60 * 1000;

      return diffMs > oneHourInMs;
    } catch (e) {
      console.error("Error checking journey start time:", e);
      return false;
    }
  };

  const handleStartJourney = async () => {
    // If self-job, call the start API first
    if (booking.assignedTo?.name === 'You (Self)' || isWorker) {
      try {
        setLoading(true);
        await startSelfJob(id);
        toast.success('Journey Started');
        // Refresh to update status
        const response = await getBookingById(id);
        const apiData = response.data || response;
        setBooking(prev => ({ ...prev, status: apiData.status }));
      } catch (error) {
        console.error('Error starting self journey:', error);
        toast.error('Failed to start journey');
        return;
      } finally {
        setLoading(false);
      }
    }

    navigate(isWorker ? `/worker/booking/${booking.id || id}/map` : `/vendor/booking/${booking.id || id}/map`);
  };





  const verifyAndCompleteJob = async (photos) => {
    const isPaid = booking?.paymentStatus === 'success' || booking?.paymentStatus === 'paid' || booking?.paymentStatus === 'completed' || booking?.cashCollected;
    const pendingAddonAmount = booking && booking.finalAmount > booking.totalAmount ? (booking.finalAmount - booking.totalAmount) : 0;
    const hasUnpaidAddon = isPaid && pendingAddonAmount > 0;

    if (hasUnpaidAddon) {
      setIsWorkDoneModalOpen(false);
      setConfirmDialog({
        isOpen: true,
        title: 'Collect Cash?',
        message: `Addon payment of ₹${pendingAddonAmount.toFixed(2)} is pending. Have you collected this cash from the customer?`,
        type: 'warning',
        onConfirm: async () => {
          setConfirmDialog(prev => { return { ...prev, isOpen: false }; });
          setActionLoading(true);
          try {
            // 1. Collect addon cash
            await api.post(`/vendors/bookings/${id}/self/addon-payment/collect-cash`);

            // 2. Complete job
            await completeSelfJob(id, { workPhotos: photos || [] });
            toast.success('Cash collected and work marked done successfully!');
            window.location.reload();
          } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to complete job');
          } finally {
            setActionLoading(false);
          }
        }
      });
      return;
    }

    try {
      setActionLoading(true);
      await completeSelfJob(id, { workPhotos: photos || [] });
      toast.success('Work marked done');
      setIsWorkDoneModalOpen(false);
      loadBooking();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete job');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteWork = verifyAndCompleteJob;

  const handleApproveWork = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Approve Work',
      message: 'Approve the work done by the worker? This will mark the job as completed and enable payout.',
      type: 'success',
      onConfirm: async () => {
        setLoading(true);
        try {
          await updateBookingStatus(id, 'completed');
          window.dispatchEvent(new Event('vendorJobsUpdated'));
          toast.success('Work Approved! You can now pay the worker.');
          window.location.reload();
        } catch (error) {
          console.error('Error approving work:', error);
          toast.error('Failed to approve work');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // --- Payment Breakdown Calculations ---
  // Default values from booking (fallback)
  const isPlanBenefit = booking?.paymentMethod === 'plan_benefit';
  const bill = booking?.bill;

  // Base Logic (Services)
  const originalBase = bill ? (bill.originalServiceBase || 0) : (parseFloat(booking?.basePrice) || 0);

  // Extra Services & Parts from vendor bill (if available)
  const allBillServices = bill?.services || [];
  const services = allBillServices.filter(s => !s.isOriginal);
  const originalServiceFromBill = allBillServices.find(s => s.isOriginal);
  const parts = bill?.parts || [];
  const customItems = bill?.customItems || [];

  let extraServiceBase = 0;
  let extraServiceGST = 0;
  services.forEach(s => {
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

  // Tax Logic — when no bill exists, use the stored tax from booking (GST is already included in customer price)
  const originalGST = bill ? (bill.originalGST || 0) : (parseFloat(booking?.tax) || 0);
  const totalGST = originalGST + extraServiceGST + partsGST;

  // Instant Booking Markup
  const instantMarkup = parseFloat(booking?.instantMarkupCharged) || 0;

  // Final Total from bill or booking
  const finalTotal = bill?.grandTotal || (booking?.finalAmount || 0);
  const hasBill = !!bill;
  const isAddonPending = booking && (booking.paymentStatus === 'success' || booking.paymentStatus === 'paid' || booking.paymentStatus === 'completed') && (booking.finalAmount > booking.totalAmount);

  // --- Bidding / Journey / Timeline derived fields ---
  const isSelfJob = booking?.isSelfJob === true || (booking?.assignedAt && !booking?.workerId);
  const statusMap = {
    'requested': 1,
    'searching': 1,
    'confirmed': 2,
    'assigned': 3,
    'journey_started': 4,
    'visited': 5,
    'in_progress': 5,
    'work_done': 7,
    'completed': 8,
  };
  const isActuallyPaid = booking?.isWorkerPaid || booking?.workerPaymentStatus === 'PAID' || booking?.workerPaymentStatus === 'SUCCESS';
  const isSettled = booking?.finalSettlementStatus === 'DONE';

  let currentStage = statusMap[booking?.status] || 2;
  if (booking?.status === 'completed') {
    if (!isSelfJob) {
      currentStage = 11;
    } else {
      if (isSettled) currentStage = 11;
      else currentStage = 9;
    }
  }

  const timelineStages = [
    {
      id: 1,
      title: 'Booking Requested',
      icon: FiClock,
      description: 'Booking request received',
      timestamp: booking?.createdAt
    },
    {
      id: 2,
      title: (booking?.isBidding && booking?.status === 'bidding') ? 'User Comparing Quotes' : 'Booking Accepted',
      icon: (booking?.isBidding && booking?.status === 'bidding') ? FiClock : FiCheck,
      description: (booking?.isBidding && booking?.status === 'bidding')
        ? 'User is comparing quotes. Waiting for choices.'
        : 'You accepted the booking',
      timestamp: booking?.acceptedAt
    },
    {
      id: 3,
      title: 'Assigned',
      icon: FiUser,
      description: booking?.assignedTo ? `Assigned to ${booking.assignedTo.name}` : 'Waiting for worker assignment',
      timestamp: booking?.assignedAt
    },
    {
      id: 4,
      title: 'Journey Started',
      icon: FiMapPin,
      description: booking?.isSelfJob ? 'You started journey' : (booking?.assignedTo ? 'Worker started journey' : 'Waiting for journey start'),
      timestamp: booking?.startedAt
    },
    {
      id: 5,
      title: 'Visited Site',
      icon: FiMapPin,
      description: 'Arrived at location',
      timestamp: booking?.arrivedAt || booking?.visitedAt
    },
    {
      id: 6,
      title: 'Work Done',
      icon: FiTool,
      description: 'Service work completed',
      timestamp: booking?.workDoneAt
    },
    {
      id: 7,
      title: booking?.isSelfJob ? 'Payment Collected' : 'Work Approved',
      icon: FiCheckCircle,
      description: 'Payment processed and work approved',
      timestamp: booking?.completedAt
    }
  ];

  return (
    <div className="min-h-screen pb-20" style={{ background: themeColors.backgroundGradient }}>
      <Header title="Booking Details" />

      <main className="px-4 py-6">
        {/* Cancelled Booking Banner */}
        {booking.status?.toLowerCase() === 'cancelled' && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-4 text-xs font-bold flex items-center gap-2">
            <FiXCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>This booking has been cancelled.</span>
          </div>
        )}

        {/* Payment Warning Banner */}
        {booking.paymentMethod === 'online' && !['success', 'paid', 'completed'].includes(booking.paymentStatus?.toLowerCase() || '') && booking.status?.toLowerCase() !== 'cancelled' && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-4 text-xs font-bold flex items-center gap-2 animate-pulse">
            <FiAlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>PAYMENT PENDING: Customer chose Online payment but has not paid yet. Please verify payment before starting work.</span>
          </div>
        )}

        {/* COD Split Payment Banner */}
        {booking.paymentMethod === 'pay_at_home' && booking.codAdvanceAmount > 0 && booking.status?.toLowerCase() !== 'cancelled' && (
          <div className="bg-yellow-50 border border-yellow-250 text-yellow-800 px-4 py-3 rounded-2xl mb-4 text-xs font-bold flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <FiAlertCircle className="w-4 h-4 shrink-0 text-yellow-600" />
              <span>
                {booking.paymentStatus === 'partially_paid'
                  ? `COD ADVANCE PAID: Customer has paid advance ₹${booking.codAdvanceAmount} online.`
                  : `COD ADVANCE PENDING: Customer needs to pay advance ₹${booking.codAdvanceAmount} online.`
                }
              </span>
            </div>
            <p className="text-[10px] text-gray-500 font-medium ml-6">
              Remaining Amount: ₹{Math.max(0, booking.finalAmount - booking.codAdvanceAmount).toFixed(2)} (NOT PAID YET).
            </p>
          </div>
        )}

        {/* Bidding Section */}
        {booking.status?.toLowerCase() === 'bidding' && !booking.vendorId && (
          <>
            {!booking.hasSubmittedBid ? (
              <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-3xl p-6 mb-6 shadow-xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16 blur-2xl"></div>
                <h3 className="text-xl font-bold mb-2">Submit Your Quote</h3>
                <p className="text-sm text-purple-100 mb-6 font-medium">
                  This category requires bidding. Enter your best price to get hired.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-purple-200 mb-1">Your Price (₹)</label>
                    <div className="relative">
                      <FiDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-300" />
                      <input
                        type="number"
                        placeholder="Enter total price"
                        className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 pl-12 pr-4 text-white font-bold placeholder:text-white/40 focus:bg-white/20 focus:border-white/40 outline-none transition-all"
                        id="bidPriceInput"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-purple-200 mb-1">Notes to Customer (Optional)</label>
                    <textarea
                      placeholder="e.g. Price includes delivery"
                      className="w-full bg-white/10 border border-white/20 rounded-2xl py-4 px-4 text-white font-medium placeholder:text-white/40 focus:bg-white/20 focus:border-white/40 outline-none transition-all min-h-[100px]"
                      id="bidNoteInput"
                    />
                  </div>
                  <button
                    onClick={async () => {
                      const price = document.getElementById('bidPriceInput').value;
                      const note = document.getElementById('bidNoteInput').value;
                      if (!price) return toast.error('Please enter a price');

                      try {
                        const { submitBid } = await import('../../services/bookingService');
                        await submitBid(id, price, note);
                        toast.success('Bid submitted successfully!');
                        window.location.reload();
                      } catch (err) {
                        toast.error(err.response?.data?.message || 'Failed to submit bid');
                      }
                    }}
                    className="w-full py-4 bg-white text-indigo-700 rounded-2xl font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                  >
                    Send Quote
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white border-2 border-indigo-100 rounded-3xl p-6 mb-6 shadow-sm flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
                  <FiCheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Quote Sent!</h3>
                <p className="text-sm text-gray-500 mb-4">You have already submitted your best price. Waiting for customer choice.</p>
                <div className="bg-indigo-50 px-6 py-3 rounded-2xl">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 block mb-1">Your Quote</span>
                  <span className="text-3xl font-bold text-indigo-600">₹{booking.myBid?.price}</span>
                </div>
              </div>
            )}
          </>
        )}
        {/* Service Type Card */}
        <div
          className="bg-white rounded-xl p-4 mb-4 shadow-md"
          style={{
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Service Type</p>
              <p className="text-base font-semibold text-gray-800">
                {booking.serviceType}
              </p>
            </div>
             <div className="flex flex-col items-end gap-1 shrink-0">
              <div
                className="w-24 py-1 rounded-full text-xs font-semibold flex items-center justify-center text-center"
                style={{
                  background: `${themeColors.button}15`,
                  color: themeColors.button,
                }}
              >
                {booking.status}
              </div>
              {booking.assignedTo?.name === 'You (Self)' && (
                <span className="w-24 py-1 rounded-full text-[9px] font-bold text-green-600 bg-green-50 border border-green-100 uppercase tracking-wider flex items-center justify-center text-center">
                  Personal Job
                </span>
              )}
            </div>
          </div>
        </div>

        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-md mb-4 overflow-hidden" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
          <div
            onClick={() => setIsCustomerInfoExpanded(!isCustomerInfoExpanded)}
            className="p-4 bg-gray-50/50 flex items-center justify-between cursor-pointer border-b border-gray-100"
          >
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <FiUser className="w-4 h-4" style={{ color: themeColors.icon }} />
              Customer Information
            </h3>
            {isCustomerInfoExpanded ? (
              <FiChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <FiChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
          {isCustomerInfoExpanded && (
            <div className="p-4">
              {/* Customer Contact row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${themeColors.icon}15` }}
                  >
                    <FiUser className="w-5 h-5" style={{ color: themeColors.icon }} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{booking.user?.name || booking.customerName || 'Customer'}</p>
                    {(() => {
                      const phone = booking.user?.phone || booking.customerPhone;
                      const isHidden = !phone || phone === 'Hidden' || phone === 'Phone hidden';
                      return (
                        <p className="text-sm text-gray-600">
                          {isHidden ? (
                            <span className="text-xs text-amber-600 font-medium">📞 Available after journey starts</span>
                          ) : phone}
                        </p>
                      );
                    })()}
                  </div>
                </div>
                <button
                  onClick={handleCallUser}
                  className="flex flex-col items-center gap-0.5 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  style={{ backgroundColor: `${themeColors.button}15` }}
                >
                  <FiPhone className="w-5 h-5" style={{ color: themeColors.button }} />
                  {(() => {
                    const phone = booking.user?.phone || booking.customerPhone;
                    const isHidden = !phone || phone === 'Hidden' || phone === 'Phone hidden';
                    return isHidden ? (
                      <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wide leading-none">Care</span>
                    ) : null;
                  })()}
                </button>
              </div>

              {/* Address Divider */}
              <div className="w-full h-px bg-gray-100 my-4"></div>

              {/* Address details */}
              <div className="flex items-start gap-3 mb-3">
                <FiMapPin className="w-5 h-5 mt-0.5" style={{ color: themeColors.icon }} />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">Address</p>
                  <p className="font-semibold text-gray-800">{booking.location.address}</p>
                  <p className="text-sm text-gray-500 mt-1">{booking.location.distance} away</p>
                </div>
              </div>

              {/* Map Embed */}
              <div className="w-full h-48 rounded-lg overflow-hidden mb-3 bg-gray-200 relative group cursor-pointer" onClick={() => navigate(isWorker ? `/worker/booking/${booking.id}/map` : `/vendor/booking/${booking.id}/map`)}>
                {(() => {
                  const hasCoordinates = booking.location.lat && booking.location.lng && booking.location.lat !== 0 && booking.location.lng !== 0;
                  const mapQuery = hasCoordinates
                    ? `${booking.location.lat},${booking.location.lng}`
                    : encodeURIComponent(booking.location.address);

                  return (
                    <>
                      <iframe
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{ border: 0, pointerEvents: 'none' }}
                        src={`https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`}
                        allowFullScreen
                        tabIndex="-1"
                      ></iframe>
                      <div className="absolute inset-0 bg-transparent group-hover:bg-black/5 transition-colors flex items-center justify-center">
                        <span className="bg-white/90 px-3 py-1 rounded-full text-xs font-medium text-gray-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          View Full Map
                        </span>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Maps Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => navigate(isWorker ? `/worker/booking/${booking.id || id}/map` : `/vendor/booking/${booking.id || id}/map`)}
                  className="flex-1 py-3 rounded-xl font-bold border flex items-center justify-center gap-2 transition-all active:scale-95 bg-white text-sm"
                  style={{
                    borderColor: themeColors.button,
                    color: themeColors.button,
                  }}
                >
                  <FiMapPin className="w-4 h-4" />
                  View Map
                </button>
                <button
                  onClick={() => {
                    const hasCoords = booking.location.lat && booking.location.lng;
                    const dest = hasCoords
                      ? `${booking.location.lat},${booking.location.lng}`
                      : encodeURIComponent(booking.location.address);
                    window.location.href = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm text-sm"
                  style={{
                    background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                  }}
                >
                  <FiNavigation className="w-4 h-4" />
                  Directions
                </button>
              </div>
            </div>
          )}
        </div>



        {/* Booked Items Details */}
        {booking.items && booking.items.length > 0 && (
          <div
            className="bg-white rounded-xl mb-4 shadow-md overflow-hidden"
            style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
          >
            <div
              onClick={() => setIsOrderSummaryExpanded(!isOrderSummaryExpanded)}
              className="flex items-center justify-between p-4 bg-gray-50/50 border-b border-gray-100 cursor-pointer active:bg-gray-100 transition-colors"
            >
              <p className="text-sm font-bold text-gray-700">Order Summary</p>
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
              <div className="p-4">

                {/* Service Category */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
                    style={{ backgroundColor: `${themeColors.button}15`, border: `1px solid ${themeColors.button}25` }}>
                    {booking.categoryIcon ? (
                      <img src={booking.categoryIcon} alt="" className="w-5 h-5 object-contain" />
                    ) : (
                      <FiTool className="w-4 h-4" style={{ color: themeColors.button }} />
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Service Category</p>
                    <p className="text-sm font-bold text-gray-800">{booking.serviceCategory || booking.serviceType || 'Service'}</p>
                  </div>
                </div>

                {/* Brand */}
                {(() => {
                  const brandName = booking.brandName || booking.items?.[0]?.brandName;
                  const brandIcon = booking.brandIcon || booking.items?.[0]?.brandIcon;
                  if (!brandName) return null;
                  return (
                    <div className="flex items-center gap-3 mb-3 pt-3 border-t border-dashed border-gray-100">
                      <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100 overflow-hidden">
                        {brandIcon ? (
                          <img src={brandIcon} alt={brandName} className="w-6 h-6 object-contain" />
                        ) : (
                          <span className="text-base font-bold text-slate-400">{brandName.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Brand</p>
                        <p className="text-sm font-bold text-gray-800">{brandName}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Service Cards */}
                <div className="pt-3 border-t border-dashed border-gray-100 space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Services</p>
                  {booking.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start bg-gray-50 rounded-xl p-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded border"
                            style={{ color: themeColors.button, backgroundColor: `${themeColors.button}10`, borderColor: `${themeColors.button}25` }}>
                            ×{item.quantity}
                          </span>
                          <span className="text-sm font-semibold text-gray-900 truncate">{item.card?.title || 'Service Item'}</span>
                        </div>
                        {item.card?.subtitle && <p className="text-xs text-gray-400 mt-0.5 ml-8 line-clamp-1">{item.card.subtitle}</p>}
                        {item.card?.duration && <p className="text-xs text-gray-400 mt-0.5 ml-8">⏱ {item.card.duration}</p>}
                      </div>
                      <div className="text-right ml-3 shrink-0">
                        <p className="text-sm font-bold text-gray-900">₹{((item.card?.price || 0) * (item.quantity || 1)).toLocaleString()}</p>
                        {item.quantity > 1 && <p className="text-xs text-gray-400">₹{item.card?.price || 0} each</p>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Billing Breakdown - Only show if Payment Invoice Card is NOT visible */}
                {!(['work_done', 'completed'].includes(booking.status?.toLowerCase()) || booking.paymentStatus === 'success' || booking.cashCollected) && (
                  <div className="pt-4 border-t border-dashed border-gray-100 space-y-2 text-xs mt-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Billing Breakdown</p>

                    <div className="flex justify-between text-gray-500">
                      <span>Base Amount</span>
                      <span className="font-semibold text-gray-800">₹{(booking.basePrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>

                    {(booking.instantMarkupCharged || booking.instantMarkup || booking.instantBookingMarkup) > 0 && (
                      <div className="flex justify-between text-gray-500">
                        <span>Instant Booking Fee</span>
                        <span className="font-semibold text-gray-800">₹{(booking.instantMarkupCharged || booking.instantMarkup || booking.instantBookingMarkup || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}

                    {booking.paymentMethod === 'plan_benefit' ? (
                      <div className="flex justify-between text-gray-500">
                        <span>Visiting Charges</span>
                        <span className="text-emerald-500 font-bold text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">FREE</span>
                      </div>
                    ) : (() => {
                      const baseAmt = Number(booking.basePrice || 0);
                      const instantFee = Number(booking.instantMarkupCharged || booking.instantMarkup || booking.instantBookingMarkup || 0);
                      const taxAmt = Number(booking.tax || 0);
                      const discountAmt = Number(booking.discount || 0);
                      const grandTotal = Number(booking.finalAmount || 0);
                      const directValue = Number(booking.visitingCharges || booking.visitationFee || booking.visitingFee || 0);
                      const derivedValue = grandTotal - (baseAmt + instantFee + taxAmt - discountAmt);
                      const finalVisitingCharges = directValue > 0 ? directValue : (derivedValue > 0 ? derivedValue : 0);
                      if (finalVisitingCharges > 0) {
                        return (
                          <div className="flex justify-between text-gray-500">
                            <span>Visiting Charges</span>
                            <span className="font-semibold text-gray-800">₹{finalVisitingCharges.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {(booking.tax || booking.cgst || booking.sgst) > 0 && (
                      <div className="flex justify-between text-gray-500">
                        <span>Taxes & GST</span>
                        <span className="font-semibold text-gray-800">₹{(booking.tax || ((booking.cgst || 0) + (booking.sgst || 0))).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}

                    {booking.discount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Discount</span>
                        <span>-₹{(booking.discount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-gray-500 pt-1 border-t border-gray-100">
                      <span>Payment Method</span>
                      <span className="font-bold text-gray-800 uppercase text-[10px] tracking-wider">
                        {booking.paymentMethod === 'plan_benefit' ? 'Membership Benefit' : (booking.paymentMethod || 'Online')}
                      </span>
                    </div>

                    <div className="flex justify-between text-gray-800 pt-2.5 mt-1 border-t-2 border-gray-200 text-sm">
                      <span className="font-bold">Grand Total</span>
                      <span className="font-bold text-base" style={{ color: themeColors.button }}>₹{(booking.finalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Time Slot */}
        <div className="bg-white rounded-xl shadow-md mb-4 overflow-hidden" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
          <div
            onClick={() => setIsPreferredTimeExpanded(!isPreferredTimeExpanded)}
            className="p-4 bg-gray-50/50 flex items-center justify-between cursor-pointer border-b border-gray-100"
          >
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <FiClock className="w-4 h-4" style={{ color: themeColors.icon }} />
              Preferred Time
            </h3>
            {isPreferredTimeExpanded ? (
              <FiChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <FiChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
          {isPreferredTimeExpanded && (
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${themeColors.icon}15` }}>
                <FiClock className="w-5 h-5" style={{ color: themeColors.icon }} />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{booking.timeSlot.date}</p>
                <p className="text-sm text-gray-600">{booking.timeSlot.time}</p>
              </div>
            </div>
          )}
        </div>

        {/* Payment Invoice Card - Light Header Style */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 mb-4">
          <div
            onClick={() => setIsPaymentSummaryExpanded(!isPaymentSummaryExpanded)}
            className="bg-slate-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between cursor-pointer active:bg-gray-100 transition-colors"
          >
            <div>
              <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest mb-0.5">TOTAL INVOICE AMOUNT</p>
              <h2 className="text-xl font-bold text-gray-900">₹{finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
            </div>
            <div className="flex items-center gap-2">
              {isPlanBenefit && (
                <span className="bg-amber-500/10 text-amber-700 border border-amber-500/20 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide">
                  Plan Covered
                </span>
              )}
              {isPaymentSummaryExpanded ? (
                <FiChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <FiChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>

          {isPaymentSummaryExpanded && (
            <div className="p-4 space-y-4 text-sm">
              {/* Services Section */}
              <div>
                <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-2 pb-1.5 border-b border-gray-100">
                  <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-[10px]"><FiTool /></span>
                  Services
                </h4>
                <div className="space-y-2.5 pl-1">
                  <div className="flex justify-between items-start text-gray-600 text-xs">
                    <div>
                      <span className="font-semibold text-gray-800">{booking.serviceCategory || booking.serviceType || 'Service'}</span>
                      <p className="text-[9px] text-gray-400 font-medium mt-0.5">Taxes included</p>
                    </div>
                    {isPlanBenefit ? (
                      <div className="flex items-center gap-1.5">
                        <span className="line-through text-gray-400 text-xs font-mono">₹{(originalBase + originalGST).toFixed(2)}</span>
                        <span className="text-emerald-600 font-bold text-[9px] bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100">FREE</span>
                      </div>
                    ) : (
                      <span className="font-semibold text-gray-900 font-mono">₹{(originalBase + originalGST).toFixed(2)}</span>
                    )}
                  </div>

                  {services.map((s, i) => (
                    <div key={i} className="flex justify-between items-start text-gray-600 text-xs">
                      <div>
                        <span className="font-semibold text-gray-800">{s.name} x {s.quantity}</span>
                        <p className="text-[9px] text-gray-400 font-medium mt-0.5">Taxes included</p>
                      </div>
                      <span className="font-mono text-gray-900">₹{(s.total || ((parseFloat(s.price) || 0) * (parseFloat(s.quantity) || 1))).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

                {/* Instant Booking Fee */}
                {instantMarkup > 0 && (
                  <div className="pt-2 border-t border-dashed border-gray-100 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span className="flex items-center gap-1">⚡ Instant Booking Fee</span>
                      <span className="font-bold text-gray-900 font-mono">₹{instantMarkup.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Grand Total Row */}
                <div className="pt-2.5 mt-1 border-t-2 border-gray-200 flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-800">Grand Total</span>
                  <span className="font-bold text-sm" style={{ color: themeColors.button }}>
                    ₹{finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Parts Section */}
                {(parts.length > 0 || customItems.length > 0) && (
                  <div>
                    <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                      <span className="w-6 h-6 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center text-xs"><FiPackage /></span>
                      Parts & Material
                    </h4>
                    <div className="space-y-2 pl-2">
                      {parts.map((p, i) => (
                        <div key={`p-${i}`} className="flex justify-between text-gray-600">
                          <span>{p.name} x {p.quantity}</span>
                          <span className="font-mono">₹{(p.price * p.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      {customItems.map((c, i) => (
                        <div key={`c-${i}`} className="flex justify-between text-gray-600">
                          <div>
                            <span>{c.name} x {c.quantity}</span>
                            {c.hsnCode && <p className="text-[9px] text-gray-400">HSN: {c.hsnCode}</p>}
                          </div>
                          <span className="font-mono">₹{(c.price * c.quantity).toFixed(2)}</span>
                        </div>
                      ))}

                      {/* Parts GST */}
                      <div className="flex justify-between text-xs text-gray-500 border-t border-dashed border-gray-100 pt-1 mt-1">
                        <span>Parts GST (18%)</span>
                        <span className="font-mono">₹{partsGST.toFixed(2)}</span>
                      </div>

                      {/* Parts Subtotal */}
                      <div className="flex justify-between font-bold text-gray-800 pt-1">
                        <span>Total Parts</span>
                        <span>₹{(partsBase + partsGST).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Visiting Charges */}
                {(booking.visitingCharges > 0 || bill?.visitingCharges > 0) && (
                  <div>
                    <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                      <span className="w-6 h-6 rounded-full bg-gray-50 text-gray-600 flex items-center justify-center text-xs"><FiClock /></span>
                      Visiting Charges
                    </h4>
                    <div className="flex justify-between pl-2 font-bold text-gray-800">
                      <span>Visiting Price</span>
                      <span>₹{(bill?.visitingCharges || booking.visitingCharges || 0).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                {/* Transport Charges */}
                {bill?.transportCharges > 0 && (
                  <div className="mt-4">
                    <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                      <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs"><FiPackage /></span>
                      Transport Charges
                    </h4>
                    <div className="flex justify-between pl-2 font-bold text-gray-800">
                      <span>Transport/Travel</span>
                      <span>₹{(bill.transportCharges).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
          )}

              {/* Vendor Earnings Footer Removed per User Request */}
            </div>

        {/* Booking Timeline - Dropdown Accordion */}
          <div className="bg-white rounded-xl shadow-md mb-4 overflow-hidden" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
            <div
              onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
              className="p-4 bg-gray-50/50 flex items-center justify-between cursor-pointer border-b border-gray-100 active:bg-gray-100 transition-colors"
            >
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <FiClock className="w-4 h-4" style={{ color: themeColors.icon }} />
                Booking Timeline
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Status: {booking?.status}
                </span>
                {isTimelineExpanded ? (
                  <FiChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <FiChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>

            {isTimelineExpanded && (
              <div className="p-5">
                <div className="relative">
                  {timelineStages.map((stage, index) => {
                    const IconComponent = stage.icon;
                    const isCompleted = stage.id < currentStage;
                    const isCurrent = stage.id === currentStage;
                    const isPending = stage.id > currentStage;

                    // Render stage if it has a timestamp or is current or completed in history
                    // For a cleaner look in the dropdown, we show all stages but highlight appropriately
                    return (
                      <div key={stage.id} className="relative pb-6 last:pb-0">
                        {/* Vertical line link */}
                        {index < timelineStages.length - 1 && (
                          <div
                            className="absolute left-5 top-9 w-0.5 h-full -translate-x-1/2"
                            style={{
                              background: isCompleted ? themeColors.button : '#E5E7EB',
                            }}
                          />
                        )}

                        {/* Stage Node */}
                        <div className="flex items-start gap-4">
                          {/* Icon Node */}
                          <div
                            className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isCompleted || isCurrent ? 'bg-white' : 'bg-gray-50'
                              }`}
                            style={{
                              border: `2px solid ${isCompleted || isCurrent ? themeColors.button : '#E5E7EB'}`,
                              boxShadow: isCurrent ? `0 0 0 3px ${themeColors.button}15` : 'none',
                            }}
                          >
                            {isCompleted ? (
                              <FiCheck className="w-4 h-4" style={{ color: themeColors.button }} />
                            ) : (
                              <IconComponent
                                className="w-4 h-4"
                                style={{
                                  color: isCurrent ? themeColors.button : '#9CA3AF',
                                }}
                              />
                            )}
                          </div>

                          {/* Content details */}
                          <div className="flex-1 pt-0.5">
                            <h4
                              className={`text-sm font-bold ${isCompleted || isCurrent ? 'text-gray-800' : 'text-gray-400'
                                }`}
                            >
                              {stage.title}
                            </h4>
                            <p className="text-xs text-gray-500 mt-0.5">{stage.description}</p>

                            {/* Completed Timestamp */}
                            {stage.timestamp && (
                              <p className="text-[10px] text-gray-400 font-mono mt-1">
                                {new Date(stage.timestamp).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>


          {/* Work Photos (after completion) */}
          {booking.workPhotos && booking.workPhotos.length > 0 && booking.assignedTo?.name !== 'You (Self)' && (
            <div className="bg-white rounded-xl p-4 mb-4 shadow-md border-t-4 border-green-500">
              <p className="text-sm font-semibold text-gray-700 mb-3">Work Evidence (Photos)</p>
              <div className="grid grid-cols-2 gap-2">
                {booking.workPhotos.map((photo, index) => (
                  <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100 border relative group">
                    <img
                      src={photo.replace('/api/upload', 'http://localhost:5000/upload')}
                      alt={`Work evidence ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => window.open(photo.replace('/api/upload', 'http://localhost:5000/upload'), '_blank')}
                        className="bg-white text-gray-900 px-3 py-1 rounded-full text-xs font-bold"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Approval/Reject Buttons */}
              {booking.status === 'work_done' && booking.workerPaymentStatus !== 'PAID' && booking.assignedTo?.name !== 'You (Self)' && !isWorker && (
                <div className="flex gap-3 mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setConfirmDialog({
                        isOpen: true,
                        title: 'Reject Work',
                        message: 'Reject work? This will notify the worker to fix issues.',
                        type: 'warning',
                        onConfirm: () => {
                          toast.error('Work Marked as Rejected');
                          // Add actual reject logic here if available
                        }
                      });
                    }}
                    className="flex-1 py-3 bg-white text-red-600 rounded-xl font-bold text-sm active:scale-95 transition-transform border border-red-200 shadow-sm"
                  >
                    <FiX className="inline w-4 h-4 mr-1" /> Reject Work
                  </button>
                  <button
                    onClick={handleApproveWork}
                    className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold text-sm shadow-md shadow-green-200 active:scale-95 transition-transform"
                  >
                    <FiCheckCircle className="inline w-4 h-4 mr-1" /> Approve Work
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Worker & Job Status Card (Enhanced) */}
          {booking.assignedTo && booking.assignedTo?.name !== 'You (Self)' && (
            <div className="bg-white rounded-2xl p-5 mb-5 shadow-lg border border-gray-100">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center">
                    <FiUser className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{booking.assignedTo.name}</h3>
                    <p className="text-xs text-gray-500 font-medium">Service Partner</p>
                  </div>
                </div>

                {/* Call Button */}
                {booking.assignedTo?.phone && (
                  <a href={`tel:${booking.assignedTo.phone}`} className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 hover:bg-green-100 transition-colors">
                    <FiPhone className="w-5 h-5" />
                  </a>
                )}
              </div>

              {/* Status Section - Premium Design */}
              <div className="rounded-2xl p-6 relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
                  boxShadow: 'inset 0 0 40px rgba(74, 222, 128, 0.05)'
                }}>

                {/* Decorative background blur */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>

                <div className="flex justify-between items-center mb-6 relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-xs font-bold text-green-800 uppercase tracking-widest">Live Status</span>
                  </div>
                  {booking.workerAcceptedAt && (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/60 border border-green-100/50 backdrop-blur-sm shadow-sm">
                      <FiClock className="w-3 h-3 text-green-600" />
                      <span className="text-[10px] text-green-700 font-bold font-mono">
                        {new Date(booking.workerAcceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Status Display */}
                {!booking.workerResponse || booking.workerResponse === 'PENDING' ? (
                  <div className="flex items-center gap-4 text-amber-600 bg-white/80 backdrop-blur-md p-4 rounded-xl border border-amber-100 shadow-sm relative z-10">
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                      <FiClock className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-gray-900">Awaiting Acceptance</p>
                      <p className="text-xs text-amber-700/80 font-medium mt-0.5">Worker has not responded yet</p>
                    </div>
                  </div>
                ) : booking.workerResponse === 'ACCEPTED' ? (
                  <div className="space-y-6 relative z-10">
                    {/* Progress Steps Visual - Pro Design */}
                    <div className="relative px-2">
                      {/* Track Line */}
                      <div className="absolute left-6 right-6 top-[15px] h-1.5 bg-gray-100/80 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(16,185,129,0.3)]" style={{
                          width: booking.status === 'completed' || booking.status === 'work_done' ? '100%' :
                            booking.status === 'in_progress' || booking.status === 'visited' ? '66%' :
                              booking.status === 'journey_started' ? '33%' : '0%'
                        }}>
                          <div className="w-full h-full bg-white/20 animate-[shimmer_2s_infinite]"></div>
                        </div>
                      </div>

                      <div className="flex justify-between items-start relative">
                        {/* Accepted Step */}
                        <div className="flex flex-col items-center gap-2 group cursor-default">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-green-200 ring-4 ring-white z-10 transition-transform group-hover:scale-110 duration-300">
                            <FiCheck className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-[10px] font-bold text-emerald-800 tracking-wide uppercase bg-white/50 px-2 py-0.5 rounded-full backdrop-blur-sm">Accepted</span>
                        </div>

                        {/* Started Step */}
                        <div className="flex flex-col items-center gap-2 group cursor-default">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white z-10 transition-all duration-500 group-hover:scale-110 ${['journey_started', 'visited', 'in_progress', 'work_done', 'completed'].includes(booking.status) ? 'bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-green-200' : 'bg-white text-gray-300 border-2 border-dashed border-gray-200'}`}>
                            <FiNavigation className="w-4 h-4" />
                          </div>
                          <span className={`text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full backdrop-blur-sm transition-colors ${['journey_started', 'visited', 'in_progress', 'work_done', 'completed'].includes(booking.status) ? 'text-emerald-800 bg-white/50' : 'text-gray-400'}`}>On Way</span>
                        </div>

                        {/* Working Step */}
                        <div className="flex flex-col items-center gap-2 group cursor-default">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white z-10 transition-all duration-500 group-hover:scale-110 ${['visited', 'in_progress', 'work_done', 'completed'].includes(booking.status) ? 'bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-green-200' : 'bg-white text-gray-300 border-2 border-dashed border-gray-200'}`}>
                            <FiTool className="w-4 h-4" />
                          </div>
                          <span className={`text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full backdrop-blur-sm transition-colors ${['visited', 'in_progress', 'work_done', 'completed'].includes(booking.status) ? 'text-emerald-800 bg-white/50' : 'text-gray-400'}`}>Working</span>
                        </div>

                        {/* Done Step */}
                        <div className="flex flex-col items-center gap-2 group cursor-default">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white z-10 transition-all duration-500 group-hover:scale-110 ${['work_done', 'completed'].includes(booking.status) ? 'bg-gradient-to-br from-green-400 to-emerald-600 text-white shadow-green-200' : 'bg-white text-gray-300 border-2 border-dashed border-gray-200'}`}>
                            <FiCheckCircle className="w-4 h-4" />
                          </div>
                          <span className={`text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded-full backdrop-blur-sm transition-colors ${['work_done', 'completed'].includes(booking.status) ? 'text-emerald-800 bg-white/50' : 'text-gray-400'}`}>Done</span>
                        </div>
                      </div>
                    </div>

                    {/* Clear Text Status with Glass Effect */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow duration-300">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${booking.status === 'journey_started' ? 'bg-blue-50 text-blue-600' :
                        booking.status === 'in_progress' ? 'bg-orange-50 text-orange-600' :
                          ['work_done', 'completed'].includes(booking.status) ? 'bg-green-50 text-green-600' :
                            'bg-gray-100 text-gray-500'
                        }`}>
                        {booking.status === 'journey_started' ? <FiNavigation className="w-6 h-6 drop-shadow-sm" /> :
                          booking.status === 'in_progress' ? <FiTool className="w-6 h-6 animate-pulse drop-shadow-sm" /> :
                            ['work_done', 'completed'].includes(booking.status) ? <FiCheckCircle className="w-6 h-6 drop-shadow-sm" /> :
                              <FiCheck className="w-6 h-6 text-gray-400" />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-base tracking-tight mb-0.5">
                          {booking.status === 'journey_started' ? 'Worker is On the Way' :
                            booking.status === 'visited' ? 'Worker Reached Location' :
                              booking.status === 'in_progress' ? 'Work In Progress' :
                                ['work_done', 'completed'].includes(booking.status) ? 'Work Completed' :
                                  'Worker Accepted Job'}
                        </p>
                        <p className="text-xs text-gray-500 font-medium">
                          {booking.status === 'journey_started' ? 'Tracking is active. Monitor live location.' :
                            booking.status === 'visited' ? 'Waiting for OTP verification to start work.' :
                              booking.status === 'in_progress' ? 'Service is currently being performed.' :
                                ['work_done', 'completed'].includes(booking.status) ? 'Service marked as done. Pending final checks.' :
                                  'Worker is preparing to start the journey.'}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                    <FiXCircle className="w-5 h-5" />
                    <div className="flex-1">
                      <p className="font-bold text-sm">Request Declined</p>
                      <p className="text-[10px] opacity-80">Worker is unavailable.</p>
                    </div>
                    <button onClick={handleAssignWorker} className="px-3 py-1 bg-white border border-red-200 rounded shadow-sm text-xs font-bold text-red-600 hover:bg-red-50">
                      Reassign
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Collection Section */}
          {canCollectCash(booking) && (
            <div
              className="bg-white rounded-2xl mb-4 overflow-hidden shadow-lg border-none relative group"
              style={{
                boxShadow: booking.paymentMethod === 'plan_benefit'
                  ? '0 10px 30px -5px rgba(16, 185, 129, 0.2)'
                  : '0 10px 30px -5px rgba(249, 115, 22, 0.2)',
              }}
            >
              {/* Top Accent Gradient */}
              <div className={`h-2 bg-gradient-to-r ${booking.paymentMethod === 'plan_benefit' ? 'from-emerald-400 to-teal-600' : 'from-orange-400 to-orange-600'}`} />

              <div className="p-3.5">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-inner ${booking.paymentMethod === 'plan_benefit' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-500'}`}>
                    <FiCreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 leading-tight">
                      {booking.paymentMethod === 'plan_benefit' ? 'Prepare Final Bill' : 'Collect Payment'}
                    </h3>
                    <p className="text-[10px] text-gray-500 font-semibold tracking-wide uppercase">
                      {booking.paymentMethod === 'plan_benefit' ? 'Add extra charges if any' : 'Step 1: Finish Settlement'}
                    </p>
                  </div>
                </div>

                {booking.paymentMethod === 'plan_benefit' ? (
                  /* Plan Benefit UI */
                  <div className="bg-emerald-50/20 rounded-xl p-3 mb-3.5 border border-emerald-100/30">
                    <div className="flex items-center gap-2 mb-2">
                      <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                      <span className="font-bold text-xs text-emerald-800">Base Service Covered by Plan</span>
                    </div>
                    <p className="text-xs text-gray-650 leading-relaxed">
                      The base service fee is covered by customer's membership. You can add extra charges for parts or additional work.
                    </p>
                  </div>
                ) : (
                  /* Normal Cash Collection UI */
                  <div className="bg-orange-50/20 rounded-xl p-3 mb-3.5 border border-orange-100/30">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-600">
                        {booking.paymentMethod === 'pay_at_home' && booking.paymentStatus === 'partially_paid'
                          ? 'Remaining Amount to Collect'
                          : 'Amount to Collect'
                        }
                      </span>
                      <span className="text-xl font-bold text-orange-600">
                        ₹{(() => {
                          const total = booking.finalAmount || parseFloat(booking.price) || 0;
                          if (booking.paymentMethod === 'pay_at_home' && booking.paymentStatus === 'partially_paid') {
                            return Math.max(0, total - (booking.codAdvanceAmount || 0)).toLocaleString();
                          }
                          return total.toLocaleString();
                        })()}
                      </span>
                    </div>
                    {booking.paymentMethod === 'pay_at_home' && booking.codAdvanceAmount > 0 && (
                      <div className="flex justify-between items-center mt-2 text-[10px] text-green-600 font-semibold border-t border-dashed border-orange-200/20 pt-2">
                        <span>Paid COD Advance</span>
                        <span>₹{booking.codAdvanceAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="mt-2 flex items-start gap-1.5 text-[10px] text-orange-700/80 leading-relaxed">
                      <FiClock className="w-3 h-3 mt-0.5" />
                      <span>
                        {booking.paymentMethod === 'pay_at_home' && booking.paymentStatus === 'partially_paid'
                          ? `COD Advance (₹${booking.codAdvanceAmount}) is paid. Remaining payment is not paid yet.`
                          : `Customer chose ${booking.paymentMethod?.replace('_', ' ') || 'Cash'} payment. Please verify collection to proceed.`
                        }
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2 w-full">
                  <button
                    onClick={() => setIsCashModalOpen(true)}
                    disabled={loading}
                    className="w-full py-2.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md text-xs"
                    style={{
                      background: 'linear-gradient(135deg, #E85D3F 0%, #d44d31 100%)',
                      boxShadow: '0 4px 12px rgba(232, 93, 63, 0.2)'
                    }}
                  >
                    <FiDollarSign className="w-4 h-4" />
                    {booking.paymentMethod === 'plan_benefit' ? 'Prepare/Edit Final Bill' : 'Collect Cash'}
                  </button>

                  {(booking?.customerConfirmationOTP || booking?.paymentOtp) && (
                    <button
                      onClick={() => setIsOtpModalOpen(true)}
                      disabled={loading}
                      className="w-full py-4 rounded-xl font-bold bg-green-600 text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
                      style={{ background: 'linear-gradient(135deg, #10B981, #059669)' }}
                    >
                      <FiCheckCircle className="w-5 h-5" />
                      Enter OTP
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Online Payment Done State */}
          {['success', 'paid', 'completed'].includes(booking?.paymentStatus?.toLowerCase() || '') && booking?.status !== 'completed' && (
            <div className="bg-white rounded-2xl mb-4 overflow-hidden shadow-lg border-none relative group"
              style={{ boxShadow: '0 10px 30px -5px rgba(16, 185, 129, 0.2)' }}
            >
              <div className="h-2 bg-gradient-to-r from-green-400 to-green-600" />
              <div className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-500 shadow-inner">
                    <FiCheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 leading-tight">Paid Online</h3>
                    <p className="text-xs text-green-600 font-bold uppercase tracking-wider">Payment Verified</p>
                  </div>
                </div>
                <div className="mt-4 bg-green-50/50 rounded-xl p-3 border border-green-100">
                  <p className="text-xs text-green-800 font-medium">Customer has paid ₹{booking.finalAmount.toLocaleString()} online via Razorpay. No cash collection needed.</p>
                </div>
              </div>
            </div>
          )}

          {/* Worker Payment Button */}
          {canPayWorker(booking) && (
            <div
              id="worker-payment-section"
              className="bg-white rounded-2xl p-5 mb-4 shadow-md border-l-4 border-green-500"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                  <FiDollarSign className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-800">Worker Payout</h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Service complete. Pay {booking.assignedTo?.name}'s share to close this booking.
              </p>
              <button
                onClick={handlePayWorkerClick}
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-md hover:brightness-105"
                style={{
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                }}
              >
                <FiCheckCircle className="w-5 h-5" />
                Pay Worker
              </button>
            </div>
          )}

          {/* Cash Collection Approval Button */}
          {booking.status === 'work_done' && booking.paymentMethod === 'pay_at_home' && booking.paymentStatus === 'pending' && (
            <div className="bg-amber-50 rounded-2xl mb-4 overflow-hidden shadow-sm border border-amber-200 relative">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-inner">
                    <FiCheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Cash Collection</h3>
                    <p className="text-xs text-amber-700 font-medium tracking-wide">User requested to pay by cash</p>
                  </div>
                </div>
                <button
                  onClick={handleConfirmCash}
                  disabled={loading}
                  className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 hover:brightness-105 bg-amber-600 shadow-md"
                >
                  <FiCheckCircle className="w-5 h-5" />
                  Confirm Cash Collected
                </button>
              </div>
            </div>
          )}

          {/* Final Settlement Button (Improved UI) */}
          {canDoFinalSettlement(booking) && (
            <div
              className="bg-white rounded-2xl mb-4 overflow-hidden shadow-lg border-none relative"
              style={{
                boxShadow: '0 10px 30px -5px rgba(139, 92, 246, 0.15)',
              }}
            >
              <div className="h-2 bg-gradient-to-r from-violet-400 to-indigo-600" />

              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-500 shadow-inner">
                    <FiCheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Finish Job</h3>
                    <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">Step 2: Close Booking</p>
                  </div>
                </div>

                <div className="bg-violet-50/50 rounded-2xl p-4 mb-6 border border-violet-100/50">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <FiCheck className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <span className="text-sm text-gray-700 font-medium">Payment Verified</span>
                      <p className="text-xs text-gray-500 mt-0.5">Payment has been successfully recorded. You can now close this booking.</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleFinalSettlement}
                  disabled={loading}
                  className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 hover:brightness-105"
                  style={{
                    background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                    boxShadow: '0 8px 16px -4px rgba(139, 92, 246, 0.4)',
                  }}
                >
                  <FiCheckCircle className="w-5 h-5" />
                  Close Booking & Finalize
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {booking.cancelRequestStatus === 'pending' && booking.status !== 'cancelled' ? (
              <div className="w-full py-4 rounded-xl font-bold text-sm bg-amber-50 text-amber-700 border border-amber-200 text-center animate-pulse mb-1">
                Cancellation Request Pending Admin Approval
              </div>
            ) : (
              !['cancelled', 'completed', 'work_done'].includes(booking.status?.toLowerCase()) && (
                <button
                  onClick={handleCancelBooking}
                  className="w-full py-2.5 rounded-lg font-bold text-xs text-red-600 border border-red-200 bg-red-50/50 hover:bg-red-50 flex items-center justify-center gap-2 transition-all active:scale-95 mb-1"
                >
                  <FiXCircle className="w-4 h-4 text-red-500 animate-pulse" />
                  {canCancel ? 'Cancel Booking (Direct)' : 'Request Cancellation'}
                </button>
              )
            )}



            {booking.status === 'awaiting_payment' && ['online', 'razorpay'].includes(booking.paymentMethod) && !booking.assignedTo && (
              <div className="w-full p-4 rounded-xl text-center text-amber-700 bg-amber-50 border border-amber-200 font-semibold text-sm">
                ⏳ Waiting for Customer Payment...
                <p className="text-xs font-normal text-amber-600 mt-1">Once the customer completes the online payment, you can assign workers and start the job.</p>
              </div>
            )}

            {(booking.status === 'confirmed' || booking.status === 'accepted' || (booking.assignedTo && booking.workerResponse === 'rejected')) && (
              <div className="flex gap-2.5 mt-2.5">
                <button
                  onClick={handleAssignToSelf}
                  className="flex-1 py-2.5 rounded-lg font-semibold text-xs border transition-all active:scale-95"
                  style={{
                    borderColor: themeColors.button,
                    color: themeColors.button,
                    background: 'white',
                  }}
                >
                  Do it Myself
                </button>
                <button
                  onClick={handleAssignWorker}
                  className="flex-1 py-2.5 rounded-lg font-semibold text-xs text-white transition-all active:scale-95 px-4"
                  style={{
                    background: themeColors.button,
                    boxShadow: `0 4px 12px ${themeColors.button}30`,
                  }}
                >
                  {booking.workerResponse === 'rejected' ? 'Reassign' : 'Assign'}
                </button>
              </div>
            )}

            {/* Self-Job Operational Buttons */}
            {(booking.assignedTo?.name === 'You (Self)' || isWorker) && (
              <div className="space-y-3 pt-2">
                {booking.status === 'awaiting_payment' && ['online', 'razorpay'].includes(booking.paymentMethod) && (
                  <div className="w-full p-4 rounded-xl text-center text-amber-700 bg-amber-50 border border-amber-200 font-semibold text-sm">
                    ⏳ Waiting for Customer Payment...
                    <p className="text-xs font-normal text-amber-600 mt-1">Once the customer completes the online payment, you will be notified and can start the journey.</p>
                  </div>
                )}

                {(booking.status === 'confirmed' || booking.status === 'accepted' || booking.status === 'assigned') && (() => {
                  const disabled = isStartJourneyDisabled();
                  return (
                    <div className="w-full">
                      <button
                        onClick={handleStartJourney}
                        disabled={disabled}
                        className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-400' : 'bg-gradient-to-r from-green-500 to-green-600 hover:brightness-105'}`}
                        style={disabled ? { boxShadow: 'none', background: '#9CA3AF' } : {
                          background: 'linear-gradient(135deg, #10B981, #059669)',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                        }}
                      >
                        <FiNavigation className="w-5 h-5" />
                        Start Journey
                      </button>
                      {disabled && (
                        <p className="text-[11px] text-amber-600 font-semibold text-center mt-1.5 bg-amber-50 py-1.5 px-2.5 rounded-lg border border-amber-100">
                          🔒 Journey can only be started 1 hour before the scheduled time.
                        </p>
                      )}
                    </div>
                  );
                })()}

                {booking.status === 'journey_started' && (
                  <button
                    onClick={() => setIsReachedModalOpen(true)}
                    className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                    }}
                  >
                    <FiMapPin className="w-5 h-5" />
                    Arrived (Arrived at customer's site)
                  </button>
                )}

                {(booking.status === 'visited' || booking.status === 'in_progress') && (
                  booking.isConsultation ? (
                    <button
                      onClick={() => {
                        if (booking.consultationId) {
                          navigate(`/vendor/painting-consultations?consultationId=${booking.consultationId}`);
                        } else {
                          navigate('/vendor/painting-consultations');
                        }
                      }}
                      className="w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg bg-gradient-to-r from-orange-500 to-orange-600 hover:brightness-105"
                      style={{
                        boxShadow: '0 4px 12px rgba(249, 115, 22, 0.4)',
                      }}
                    >
                      <FiFileText className="w-5 h-5" />
                      Create/Generate Quotation
                    </button>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setIsAddonModalOpen(true)}
                        className="flex-1 py-4 rounded-xl font-bold bg-white text-blue-600 border-2 border-blue-200 flex items-center justify-center gap-2 transition-all active:scale-95 shadow-sm"
                      >
                        <FiPlus className="w-5 h-5" />
                        Add-on
                      </button>
                      <button
                        onClick={() => setIsWorkDoneModalOpen(true)}
                        className="flex-[2] py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
                        style={{
                          background: 'linear-gradient(135deg, #10B981, #059669)',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                        }}
                      >
                        <FiCheckCircle className="w-5 h-5" />
                        Work Done
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
      </main>


      {/* Cash Collection / OTP Modal */}
      <CashCollectionModal
        isOpen={isCashModalOpen}
        onClose={() => setIsCashModalOpen(false)}
        booking={booking}
        onConfirm={handleCashCollectionConfirm}
        onInitiateOTP={async (amt, items) => {
          return await vendorWalletService.initiateCashCollection(id, amt, items);
        }}
        loading={loading}
      />

      <OtpVerificationModal
        isOpen={isOtpModalOpen}
        onClose={() => setIsOtpModalOpen(false)}
        onVerify={async (otp) => {
          try {
            const amount = booking.finalAmount || 0;
            const extras = booking.workDoneDetails?.items || [];
            await handleCashCollectionConfirm(amount, extras, otp);
          } catch (err) {
            console.error("OTP verification error:", err);
          }
        }}
        loading={loading}
      />

      {/* Pay Worker Modal */}
      <WorkerPaymentModal
        isOpen={isPayWorkerModalOpen}
        onClose={() => setIsPayWorkerModalOpen(false)}
        workerName={booking.assignedTo?.name}
        amountDue={booking.vendorEarnings * 0.9} // Estimation or based on your rule (90% to worker)
        onConfirm={handlePayWorkerSubmit}
        loading={paySubmitting}
      />

      {/* Visit OTP Modal */}
      <VisitVerificationModal
        isOpen={isVisitModalOpen}
        onClose={() => setIsVisitModalOpen(false)}
        bookingId={id}
        onSuccess={() => window.location.reload()}
      />

      {/* Arrival Photo Modal */}
      <ReachedPhotoModal
        isOpen={isReachedModalOpen}
        onClose={() => setIsReachedModalOpen(false)}
        onComplete={async (photos) => {
          try {
            setReachedLoading(true);
            await vendorReached(id, photos);
            setIsReachedModalOpen(false);
            setIsVisitModalOpen(true);
          } catch (err) {
            console.error('Failed to notify reached:', err);
            toast.error('Failed to verify arrival');
          } finally {
            setReachedLoading(false);
          }
        }}
        loading={reachedLoading}
      />

      {/* Unified Worker Completion Modal - REUSABLE COMPONENT */}
      <WorkCompletionModal
        isOpen={isWorkDoneModalOpen}
        onClose={() => setIsWorkDoneModalOpen(false)}
        job={booking}
        onComplete={async (photos) => {
          await verifyAndCompleteJob(photos);
        }}
        loading={actionLoading}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => { return { ...prev, isOpen: false }; })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
      />

      {/* Add-on Services Modal */}
      <AnimatePresence>
        {isAddonModalOpen && (
          <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" style={{ zIndex: 100 }}>
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Add Extra Services</h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">Category: {booking?.serviceCategory}</p>
                </div>
                <button
                  onClick={() => setIsAddonModalOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-200 transition-colors text-gray-500"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex px-4 pt-4 pb-2 border-b border-gray-100 gap-2">
                <button
                  onClick={() => setActiveAddonTab('services')}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${activeAddonTab === 'services'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  Services
                </button>
                <button
                  onClick={() => setActiveAddonTab('addons')}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${activeAddonTab === 'addons'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  Add-ons
                </button>
              </div>

              <div className="p-4 border-b border-gray-100">
                <input
                  type="text"
                  placeholder="Search matching services..."
                  value={addonSearch}
                  onChange={e => setAddonSearch(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[250px]">
                {addonLoading ? (
                  <div className="text-center py-12 text-sm text-gray-500 font-medium">Loading services...</div>
                ) : filteredListToRender.length === 0 ? (
                  <div className="text-center py-12 text-sm text-gray-500 font-medium">
                    No items found matching your search.
                  </div>
                ) : (
                  filteredListToRender.map(item => {
                    const selected = selectedAddons.find(a => a.catalogId === item._id);
                    return (
                      <div
                        key={item._id}
                        className={`p-4 rounded-2xl border transition-all ${selected ? 'bg-blue-50/40 border-blue-200' : 'bg-white border-gray-100 hover:border-gray-200'
                          }`}
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-bold text-gray-900 text-sm leading-snug">{item.name}</h4>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${item.isPart ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
                                {item.isPart ? 'Material / Part' : 'Addon Service'}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-blue-600">₹{item.price}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            {selected ? (
                              <div className="flex items-center gap-2 bg-blue-50 p-1 rounded-xl border border-blue-100">
                                <button
                                  onClick={() => handleUpdateAddonQty(item._id, -1)}
                                  className="w-7 h-7 flex items-center justify-center bg-white rounded-lg text-blue-600 shadow-sm border border-blue-100 font-bold hover:bg-blue-50"
                                >
                                  -
                                </button>
                                <span className="font-bold text-xs min-w-[16px] text-center text-blue-900">
                                  {selected.quantity}
                                </span>
                                <button
                                  onClick={() => handleUpdateAddonQty(item._id, 1)}
                                  className="w-7 h-7 flex items-center justify-center bg-blue-600 rounded-lg text-white font-bold hover:bg-blue-700"
                                >
                                  +
                                </button>
                                <button
                                  onClick={() => handleToggleAddon(item)}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded-lg ml-1"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleToggleAddon(item)}
                                className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-blue-600 hover:text-white font-bold text-xs transition-colors"
                              >
                                Add
                              </button>
                            )}
                          </div>
                        </div>

                        {selected && (
                          <div className="mt-3 pt-3 border-t border-dashed border-blue-100">
                            <textarea
                              placeholder="Write a note (e.g. Customer request details)..."
                              value={selected.note}
                              onChange={e => handleUpdateAddonNote(item._id, e.target.value)}
                              rows={2}
                              className="w-full bg-white border border-blue-100 rounded-lg px-2.5 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none text-gray-700"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                <button
                  onClick={() => setIsAddonModalOpen(false)}
                  className="flex-1 py-3 bg-white border border-gray-200 rounded-xl font-bold text-sm text-gray-700 active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAddons}
                  disabled={addonLoading}
                  className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold text-sm active:scale-95 transition-all disabled:opacity-50"
                >
                  {addonLoading ? 'Saving...' : 'Save Add-ons'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {(isAddonModalOpen || isCashModalOpen || isOtpModalOpen || isVisitModalOpen || isWorkDoneModalOpen || isReachedModalOpen) && (
        <style>{`
          nav {
            display: none !important;
          }
        `}</style>
      )}
      {!(isAddonModalOpen || isCashModalOpen || isOtpModalOpen || isVisitModalOpen || isWorkDoneModalOpen || isReachedModalOpen) && <BottomNav />}
    </div>
  );
}
