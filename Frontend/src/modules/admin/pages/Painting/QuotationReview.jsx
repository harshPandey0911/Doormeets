import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FiArrowLeft, FiUser, FiHome, FiCamera, FiPackage, FiActivity,
  FiPlus, FiTrash2, FiPercent, FiDollarSign, FiEdit2, FiCheckSquare,
  FiAlertCircle, FiClock, FiCheck, FiX, FiLayers
} from 'react-icons/fi';
import * as paintingService from '../../services/paintingService';

const QuotationReview = ({ quotationId, onBack }) => {
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Reference tables loaded from DB
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [labourRates, setLabourRates] = useState([]);

  // Local state for interactive editing (recalculates via dryRun PUT)
  const [editState, setEditState] = useState(null);

  // Approval Checklist
  const [checklist, setChecklist] = useState({
    measurements: false,
    products: false,
    labour: false,
    gst: false,
    charges: false,
    photos: false
  });

  // Remarks / Notes
  const [adminRemarks, setAdminRemarks] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // Modals for actions
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [revisionReason, setRevisionReason] = useState('');

  // Version Comparison modal
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [compareV1, setCompareV1] = useState(1);
  const [compareV2, setCompareV2] = useState(1);

  useEffect(() => {
    loadQuotationDetails();
    loadReferenceData();
  }, [quotationId]);

  const loadQuotationDetails = async () => {
    try {
      setLoading(true);
      const res = await paintingService.getQuotationById(quotationId);
      if (res.success && res.data) {
        setQuotation(res.data);
        setEditState(res.data);
        setAdminRemarks(res.data.review?.adminRemarks || '');
        setInternalNotes(res.data.review?.internalNotes || '');
      } else {
        toast.error('Quotation not found');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load quotation details');
    } finally {
      setLoading(false);
    }
  };

  const loadReferenceData = async () => {
    try {
      const [brandRes, productRes, rateRes] = await Promise.all([
        paintingService.getBrands(),
        paintingService.getProducts(),
        paintingService.getLabourRates()
      ]);
      if (brandRes.success) setBrands(brandRes.data);
      if (productRes.success) setProducts(productRes.data);
      if (rateRes.success) setLabourRates(rateRes.data);
    } catch (err) {
      console.error('Error loading reference lists:', err);
    }
  };

  // Perform dynamic dryRun recalculations on editState changes
  const triggerRecalculate = async (updatedState) => {
    try {
      // Create request payload
      const payload = {
        property: updatedState.property,
        products: updatedState.products.map(p => ({
          productId: p.productId._id || p.productId,
          selectedPackSize: p.selectedPackSize,
          appliedArea: p.appliedArea,
          quantityRequired: p.quantityRequired
        })),
        labour: updatedState.labour.map(l => ({
          labourRateId: l.labourRateId._id || l.labourRateId,
          area: l.area,
          pricePerSqFt: l.pricePerSqFt,
          workType: l.workType
        })),
        additionalCharges: updatedState.additionalCharges,
        discount: updatedState.discount,
        gstPercentage: updatedState.gst?.gstPercentage || 18,
        remarks: updatedState.remarks,
        attachments: updatedState.attachments,
        dryRun: true
      };

      const res = await paintingService.updateQuotation(quotationId, payload, true);
      if (res.success && res.data) {
        setEditState(res.data);
      }
    } catch (err) {
      console.error('Recalculation failed:', err);
      toast.error('Failed to update calculations');
    }
  };

  // Update a product selection row in editState
  const handleProductChange = (index, key, val) => {
    const updatedProducts = [...editState.products];
    if (key === 'productId') {
      const matchedProd = products.find(p => p._id === val);
      if (matchedProd) {
        updatedProducts[index] = {
          ...updatedProducts[index],
          productId: matchedProd,
          productName: matchedProd.productName,
          productCode: matchedProd.productCode,
          productType: matchedProd.productType,
          unitPrice: matchedProd.price,
          coverage: matchedProd.coverage?.value || 1,
          selectedPackSize: matchedProd.availablePackSizes?.[0] || { size: 1, unit: 'Litre' }
        };
      }
    } else if (key === 'packSizeIndex') {
      const prod = updatedProducts[index].productId;
      const sizeObj = prod.availablePackSizes?.[val];
      if (sizeObj) {
        updatedProducts[index].selectedPackSize = sizeObj;
      }
    } else if (key === 'quantityRequired') {
      updatedProducts[index].quantityRequired = Number(val);
    } else if (key === 'appliedArea') {
      updatedProducts[index].appliedArea = Number(val);
    }

    const updatedState = { ...editState, products: updatedProducts };
    setEditState(updatedState);
    triggerRecalculate(updatedState);
  };

  // Add a product row
  const addProductRow = () => {
    const defaultProduct = products[0];
    if (!defaultProduct) return;

    const newRow = {
      productId: defaultProduct,
      productName: defaultProduct.productName,
      productCode: defaultProduct.productCode,
      productType: defaultProduct.productType,
      selectedPackSize: defaultProduct.availablePackSizes?.[0] || { size: 1, unit: 'Litre' },
      coverage: defaultProduct.coverage?.value || 1,
      unitPrice: defaultProduct.price,
      quantityRequired: 1,
      quantityPurchased: 1,
      subtotal: defaultProduct.price,
      appliedArea: 100
    };

    const updatedState = { ...editState, products: [...editState.products, newRow] };
    setEditState(updatedState);
    triggerRecalculate(updatedState);
  };

  // Remove a product row
  const removeProductRow = (index) => {
    const updatedProducts = editState.products.filter((_, i) => i !== index);
    const updatedState = { ...editState, products: updatedProducts };
    setEditState(updatedState);
    triggerRecalculate(updatedState);
  };

  // Update a labour row
  const handleLabourChange = (index, key, val) => {
    const updatedLabour = [...editState.labour];
    if (key === 'labourRateId') {
      const matchedRate = labourRates.find(r => r._id === val);
      if (matchedRate) {
        updatedLabour[index] = {
          ...updatedLabour[index],
          labourRateId: matchedRate,
          workType: matchedRate.workType,
          pricePerSqFt: matchedRate.pricePerSqft
        };
      }
    } else if (key === 'workType') {
      updatedLabour[index].workType = val;
    } else if (key === 'pricePerSqFt') {
      updatedLabour[index].pricePerSqFt = Number(val);
    } else if (key === 'area') {
      updatedLabour[index].area = Number(val);
    }

    const updatedState = { ...editState, labour: updatedLabour };
    setEditState(updatedState);
    triggerRecalculate(updatedState);
  };

  // Add a labour row
  const addLabourRow = () => {
    const defaultRate = labourRates[0];
    if (!defaultRate) return;

    const newRow = {
      labourRateId: defaultRate,
      workType: defaultRate.workType,
      pricePerSqFt: defaultRate.pricePerSqft,
      area: 100,
      subtotal: defaultRate.pricePerSqft * 100
    };

    const updatedState = { ...editState, labour: [...editState.labour, newRow] };
    setEditState(updatedState);
    triggerRecalculate(updatedState);
  };

  // Remove a labour row
  const removeLabourRow = (index) => {
    const updatedLabour = editState.labour.filter((_, i) => i !== index);
    const updatedState = { ...editState, labour: updatedLabour };
    setEditState(updatedState);
    triggerRecalculate(updatedState);
  };

  // Update Additional Charges
  const handleAdditionalChargeChange = (index, key, val) => {
    const updatedCharges = [...editState.additionalCharges];
    updatedCharges[index][key] = key === 'amount' ? Number(val) : val;

    const updatedState = { ...editState, additionalCharges: updatedCharges };
    setEditState(updatedState);
    triggerRecalculate(updatedState);
  };

  const addAdditionalChargeRow = () => {
    const newCharge = { title: 'New Service', amount: 0, remarks: '' };
    const updatedState = { ...editState, additionalCharges: [...editState.additionalCharges, newCharge] };
    setEditState(updatedState);
    triggerRecalculate(updatedState);
  };

  const removeAdditionalChargeRow = (index) => {
    const updatedCharges = editState.additionalCharges.filter((_, i) => i !== index);
    const updatedState = { ...editState, additionalCharges: updatedCharges };
    setEditState(updatedState);
    triggerRecalculate(updatedState);
  };

  // Update Discount
  const handleDiscountChange = (key, val) => {
    const updatedDiscount = { ...editState.discount, [key]: key === 'value' ? Number(val) : val };
    const updatedState = { ...editState, discount: updatedDiscount };
    setEditState(updatedState);
    triggerRecalculate(updatedState);
  };

  // Update GST Percentage
  const handleGstChange = (val) => {
    const updatedGst = { ...editState.gst, gstPercentage: Number(val) };
    const updatedState = { ...editState, gst: updatedGst };
    setEditState(updatedState);
    triggerRecalculate(updatedState);
  };

  // --- Actions ---

  const handleStartReview = async () => {
    try {
      setActionLoading(true);
      const res = await paintingService.startReview(quotationId);
      if (res.success) {
        toast.success('Review session started.');
        loadQuotationDetails();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to start review');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      const payload = {
        property: editState.property,
        products: editState.products.map(p => ({
          productId: p.productId._id || p.productId,
          selectedPackSize: p.selectedPackSize,
          appliedArea: p.appliedArea,
          quantityRequired: p.quantityRequired
        })),
        labour: editState.labour.map(l => ({
          labourRateId: l.labourRateId._id || l.labourRateId,
          area: l.area,
          pricePerSqFt: l.pricePerSqFt,
          workType: l.workType
        })),
        additionalCharges: editState.additionalCharges,
        discount: editState.discount,
        gstPercentage: editState.gst?.gstPercentage || 18,
        remarks: editState.remarks,
        attachments: editState.attachments,
        reviewRemarks: adminRemarks,
        internalNotes,
        dryRun: false
      };

      const res = await paintingService.updateQuotation(quotationId, payload, false);
      if (res.success) {
        toast.success('Changes saved successfully and version incremented.');
        loadQuotationDetails();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    // UI Validation Check
    if (Object.values(checklist).some(v => !v)) {
      toast.error('Please verify all items in the approval checklist first.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await paintingService.approveQuotation(quotationId, {
        adminRemarks,
        internalNotes
      });
      if (res.success) {
        toast.success('Quotation approved successfully! Locked as Read-only.');
        loadQuotationDetails();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to approve quotation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please supply a rejection reason.');
      return;
    }
    try {
      setActionLoading(true);
      const res = await paintingService.rejectQuotation(quotationId, rejectionReason, {
        adminRemarks,
        internalNotes
      });
      if (res.success) {
        toast.success('Quotation rejected. Sent back to Vendor.');
        setShowRejectModal(false);
        setRejectionReason('');
        loadQuotationDetails();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to reject quotation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevisionSubmit = async () => {
    if (!revisionReason.trim()) {
      toast.error('Please supply a revision request reason.');
      return;
    }
    try {
      setActionLoading(true);
      const res = await paintingService.requestRevision(quotationId, revisionReason, {
        adminRemarks,
        internalNotes
      });
      if (res.success) {
        toast.success('Revision request sent back to vendor.');
        setShowRevisionModal(false);
        setRevisionReason('');
        loadQuotationDetails();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to request revision');
    } finally {
      setActionLoading(false);
    }
  };

  // Check if read-only
  const isApproved = quotation?.status === 'ADMIN_APPROVED';
  const isReadOnly = isApproved || (quotation?.status !== 'SUBMITTED_TO_ADMIN' && quotation?.status !== 'UNDER_REVIEW');

  if (loading) {
    return <div className="p-8 text-center text-gray-500 font-medium">Loading Quotation details...</div>;
  }

  if (!quotation || !editState) {
    return <div className="p-8 text-center text-gray-500 font-medium">Quotation detail missing.</div>;
  }

  // Determine available comparison versions list
  const historyVersions = quotation.versions || [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 relative">
      {/* Read-Only Overlay/Banner */}
      {isApproved && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3">
          <FiCheckSquare className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-extrabold">This quotation is Approved & Locked (Read-Only).</span> No further edits can be saved. If revisions are required, a brand new quotation should be initialized.
          </div>
        </div>
      )}

      {/* Breadcrumb Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors border border-gray-200">
            <FiArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-black text-gray-900">Review Quotation</h2>
              <span className={`px-3 py-1 text-xs font-black tracking-wider uppercase rounded-full ${
                quotation.status === 'SUBMITTED_TO_ADMIN' ? 'bg-amber-100 text-amber-800' :
                quotation.status === 'UNDER_REVIEW' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                quotation.status === 'ADMIN_APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                quotation.status === 'ADMIN_REJECTED' ? 'bg-red-100 text-red-800' :
                quotation.status === 'REVISION_REQUESTED' ? 'bg-purple-100 text-purple-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {quotation.status.replace(/_/g, ' ')}
              </span>
              <span className="bg-gray-150 px-2 py-0.5 text-xs text-gray-600 font-bold rounded-lg border border-gray-200">
                v{quotation.currentVersion}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">ID: #{quotation._id} | Last updated: {new Date(quotation.updatedAt).toLocaleString()}</p>
          </div>
        </div>

        {/* Start Review trigger */}
        {quotation.status === 'SUBMITTED_TO_ADMIN' && (
          <button
            onClick={handleStartReview}
            disabled={actionLoading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-5 py-2.5 rounded-xl cursor-pointer text-sm shadow-md transition-all disabled:opacity-50"
          >
            <FiActivity className="w-4 h-4" /> Start Review
          </button>
        )}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column (Detailed configuration cards) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. Customer Information */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
              <FiUser className="text-blue-500" /> Customer Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-xs">Customer Name</p>
                <p className="font-extrabold text-gray-900 mt-0.5">{quotation.customerName || quotation.customerId?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-xs">Booking ID / Phone</p>
                <p className="font-extrabold text-gray-900 mt-0.5">{quotation.bookingId ? `#${quotation.bookingId}` : 'N/A'} | {quotation.customerPhone || quotation.customerId?.phone}</p>
              </div>
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-xs">Property Type</p>
                <p className="font-extrabold text-gray-900 mt-0.5">{quotation.property?.propertyType || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-xs">Address</p>
                <p className="font-extrabold text-gray-905 mt-0.5">
                  {quotation.consultationId?.address 
                    ? `${quotation.consultationId.address.addressLine || ''}, ${quotation.consultationId.address.city || ''}`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Inspection Summary */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
              <FiHome className="text-orange-500" /> Inspection Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm mb-4">
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-xs">Interior Area</p>
                <p className="font-extrabold text-gray-905 mt-0.5">{quotation.property?.interiorArea || 0} sqft</p>
              </div>
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-xs">Exterior Area</p>
                <p className="font-extrabold text-gray-905 mt-0.5">{quotation.property?.exteriorArea || 0} sqft</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-xs">Wall Condition & Notes</p>
                <p className="text-gray-700 mt-1 font-medium">{quotation.vendorNotes || 'No specific notes added by the inspector.'}</p>
              </div>
            </div>

            {/* Photos */}
            {quotation.attachments?.inspectionPhotos?.length > 0 && (
              <div>
                <p className="text-gray-400 font-semibold uppercase tracking-wider text-xs mb-2">Inspection Photos</p>
                <div className="flex flex-wrap gap-3">
                  {quotation.attachments.inspectionPhotos.map((url, i) => (
                    <a href={url} target="_blank" rel="noreferrer" key={i} className="group relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                      <img src={url} alt={`Inspection ${i + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <FiCamera className="text-white w-4 h-4" />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 3. Products */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FiPackage className="text-purple-500" /> Material & Products
              </h3>
              {!isReadOnly && (
                <button
                  onClick={addProductRow}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  <FiPlus /> Add Product
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-600">
                <thead className="text-xs text-gray-400 uppercase bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-3 py-2.5">Brand</th>
                    <th className="px-3 py-2.5">Product</th>
                    <th className="px-3 py-2.5 w-24">Pack Size</th>
                    <th className="px-3 py-2.5 w-24">Quantity (L/Kg)</th>
                    <th className="px-3 py-2.5 text-right w-24">Unit Price</th>
                    <th className="px-3 py-2.5 text-right w-28">Subtotal</th>
                    {!isReadOnly && <th className="px-3 py-2.5 w-12 text-center"></th>}
                  </tr>
                </thead>
                <tbody>
                  {editState.products.map((item, index) => {
                    const activeProd = products.find(p => p._id === (item.productId._id || item.productId));
                    return (
                      <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                        {/* Brand Select */}
                        <td className="px-3 py-2.5 min-w-[120px]">
                          {isReadOnly ? (
                            <span className="font-extrabold text-gray-800">
                              {brands.find(b => b._id === (item.productId?.brandId || activeProd?.brandId))?.name || 'Brand'}
                            </span>
                          ) : (
                            <select
                              value={activeProd?.brandId || ''}
                              onChange={(e) => {
                                // Find first product of chosen brand to swap
                                const brandProds = products.filter(p => p.brandId === e.target.value);
                                if (brandProds.length > 0) {
                                  handleProductChange(index, 'productId', brandProds[0]._id);
                                }
                              }}
                              className="w-full bg-transparent outline-none border border-gray-200 rounded-lg py-1 px-1.5 font-semibold text-gray-700 focus:border-blue-500"
                            >
                              {brands.map(b => (
                                <option key={b._id} value={b._id}>{b.name}</option>
                              ))}
                            </select>
                          )}
                        </td>

                        {/* Product Select */}
                        <td className="px-3 py-2.5 min-w-[150px]">
                          {isReadOnly ? (
                            <div className="font-extrabold text-gray-800">
                              {item.productName}
                              <p className="text-[10px] text-gray-400 font-normal">{item.productCode} ({item.productType})</p>
                            </div>
                          ) : (
                            <select
                              value={item.productId._id || item.productId}
                              onChange={(e) => handleProductChange(index, 'productId', e.target.value)}
                              className="w-full bg-transparent outline-none border border-gray-200 rounded-lg py-1 px-1.5 font-semibold text-gray-700 focus:border-blue-500"
                            >
                              {products
                                .filter(p => p.brandId === (activeProd?.brandId || p.brandId))
                                .map(p => (
                                  <option key={p._id} value={p._id}>{p.productName} ({p.productType})</option>
                                ))
                              }
                            </select>
                          )}
                        </td>

                        {/* Pack Size Select */}
                        <td className="px-3 py-2.5">
                          {isReadOnly ? (
                            <span className="font-bold text-gray-700">{item.selectedPackSize?.size} {item.selectedPackSize?.unit}</span>
                          ) : (
                            <select
                              value={activeProd?.availablePackSizes?.findIndex(s => s.size === item.selectedPackSize?.size) ?? 0}
                              onChange={(e) => handleProductChange(index, 'packSizeIndex', e.target.value)}
                              className="w-full bg-transparent outline-none border border-gray-200 rounded-lg py-1 px-1 font-semibold text-gray-700 focus:border-blue-500"
                            >
                              {activeProd?.availablePackSizes?.map((sizeObj, idx) => (
                                <option key={idx} value={idx}>{sizeObj.size} {sizeObj.unit}</option>
                              )) || <option value="0">1 Litre</option>}
                            </select>
                          )}
                        </td>

                        {/* Quantity input */}
                        <td className="px-3 py-2.5">
                          {isReadOnly ? (
                            <span className="font-bold text-gray-700">{item.quantityRequired}</span>
                          ) : (
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={item.quantityRequired}
                              onChange={(e) => handleProductChange(index, 'quantityRequired', e.target.value)}
                              className="w-full bg-transparent outline-none border border-gray-200 rounded-lg py-1 px-1.5 font-bold text-gray-800 text-center"
                            />
                          )}
                        </td>

                        {/* Unit Price */}
                        <td className="px-3 py-2.5 text-right font-semibold text-gray-700">
                          ₹{item.unitPrice}
                        </td>

                        {/* Subtotal */}
                        <td className="px-3 py-2.5 text-right font-extrabold text-gray-900">
                          ₹{item.subtotal}
                        </td>

                        {/* Delete Row */}
                        {!isReadOnly && (
                          <td className="px-3 py-2.5 text-center">
                            <button onClick={() => removeProductRow(index)} className="p-1 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer">
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {editState.products.length === 0 && (
                    <tr>
                      <td colSpan="7" className="text-center py-6 text-gray-400 italic">No products added.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Labour */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FiLayers className="text-teal-500" /> Labour Configuration
              </h3>
              {!isReadOnly && (
                <button
                  onClick={addLabourRow}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  <FiPlus /> Add Labour
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-600">
                <thead className="text-xs text-gray-400 uppercase bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-3 py-2.5">Work Type</th>
                    <th className="px-3 py-2.5 w-28 text-right">Area (sqft)</th>
                    <th className="px-3 py-2.5 w-28 text-right">Rate (₹/sqft)</th>
                    <th className="px-3 py-2.5 text-right w-32">Subtotal</th>
                    {!isReadOnly && <th className="px-3 py-2.5 w-12 text-center"></th>}
                  </tr>
                </thead>
                <tbody>
                  {editState.labour.map((item, index) => (
                    <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                      {/* Work Type Input */}
                      <td className="px-3 py-2.5">
                        {isReadOnly ? (
                          <span className="font-extrabold text-gray-850">{item.workType}</span>
                        ) : (
                          <input
                            type="text"
                            value={item.workType}
                            onChange={(e) => handleLabourChange(index, 'workType', e.target.value)}
                            className="bg-transparent border border-gray-200 rounded-lg py-1 px-2 font-semibold text-gray-700 w-full outline-none focus:border-blue-500"
                          />
                        )}
                      </td>

                      {/* Area */}
                      <td className="px-3 py-2.5">
                        {isReadOnly ? (
                          <div className="text-right font-bold text-gray-700">{item.area}</div>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            value={item.area}
                            onChange={(e) => handleLabourChange(index, 'area', e.target.value)}
                            className="bg-transparent border border-gray-200 rounded-lg py-1 px-1 text-right font-bold text-gray-700 w-full outline-none focus:border-blue-500"
                          />
                        )}
                      </td>

                      {/* Rate */}
                      <td className="px-3 py-2.5">
                        {isReadOnly ? (
                          <div className="text-right font-bold text-gray-700">₹{item.pricePerSqFt}</div>
                        ) : (
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={item.pricePerSqFt}
                            onChange={(e) => handleLabourChange(index, 'pricePerSqFt', e.target.value)}
                            className="bg-transparent border border-gray-200 rounded-lg py-1 px-1 text-right font-bold text-gray-700 w-full outline-none focus:border-blue-500"
                          />
                        )}
                      </td>

                      {/* Subtotal */}
                      <td className="px-3 py-2.5 text-right font-extrabold text-gray-905">
                        ₹{item.subtotal}
                      </td>

                      {/* Delete Labour Row */}
                      {!isReadOnly && (
                        <td className="px-3 py-2.5 text-center">
                          <button onClick={() => removeLabourRow(index)} className="p-1 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer">
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {editState.labour.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-6 text-gray-400 italic">No labour costs configured.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. Additional Charges */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FiDollarSign className="text-pink-500" /> Additional Charges
              </h3>
              {!isReadOnly && (
                <button
                  onClick={addAdditionalChargeRow}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  <FiPlus /> Add Charge
                </button>
              )}
            </div>

            <div className="space-y-3">
              {editState.additionalCharges.map((item, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 border-b border-gray-50 pb-3 sm:pb-0 sm:border-none">
                  {/* Title */}
                  <div className="flex-1 w-full">
                    {isReadOnly ? (
                      <span className="font-extrabold text-gray-800">{item.title}</span>
                    ) : (
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => handleAdditionalChargeChange(index, 'title', e.target.value)}
                        placeholder="Transportation, furniture protection..."
                        className="w-full bg-transparent border border-gray-200 rounded-lg py-1 px-2 font-semibold text-gray-700 outline-none focus:border-blue-500"
                      />
                    )}
                  </div>

                  {/* Remarks */}
                  <div className="flex-1 w-full">
                    {isReadOnly ? (
                      <span className="text-xs text-gray-500 font-medium">{item.remarks}</span>
                    ) : (
                      <input
                        type="text"
                        value={item.remarks}
                        onChange={(e) => handleAdditionalChargeChange(index, 'remarks', e.target.value)}
                        placeholder="Remarks..."
                        className="w-full bg-transparent border border-gray-200 rounded-lg py-1 px-2 text-xs text-gray-600 outline-none focus:border-blue-500"
                      />
                    )}
                  </div>

                  {/* Amount */}
                  <div className="w-full sm:w-36 flex items-center gap-2">
                    {isReadOnly ? (
                      <span className="font-extrabold text-gray-900 ml-auto">₹{item.amount}</span>
                    ) : (
                      <>
                        <span className="text-gray-400 font-bold">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={item.amount}
                          onChange={(e) => handleAdditionalChargeChange(index, 'amount', e.target.value)}
                          className="w-full bg-transparent border border-gray-200 rounded-lg py-1 px-2 font-bold text-gray-850 text-right outline-none focus:border-blue-500"
                        />
                      </>
                    )}
                  </div>

                  {/* Remove Charge */}
                  {!isReadOnly && (
                    <button onClick={() => removeAdditionalChargeRow(index)} className="p-1 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer">
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {editState.additionalCharges.length === 0 && (
                <div className="text-center py-4 text-gray-400 italic text-sm">No additional charges.</div>
              )}
            </div>
          </div>

          {/* 6 & 7. Discount & GST */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Discount Card */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-md font-extrabold text-gray-850 flex items-center gap-2">
                <FiPercent className="text-amber-500" /> Apply Discount
              </h3>
              <div className="flex gap-2">
                {['NONE', 'FLAT', 'PERCENTAGE'].map((type) => (
                  <button
                    key={type}
                    disabled={isReadOnly}
                    onClick={() => handleDiscountChange('type', type)}
                    className={`flex-1 text-xs font-black py-2 rounded-xl border transition-all ${
                      editState.discount?.type === type
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {editState.discount?.type !== 'NONE' && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-1.5 focus-within:border-blue-500">
                    <span className="font-extrabold text-gray-400">{editState.discount?.type === 'FLAT' ? '₹' : '%'}</span>
                    <input
                      type="number"
                      min="0"
                      disabled={isReadOnly}
                      value={editState.discount?.value || 0}
                      onChange={(e) => handleDiscountChange('value', e.target.value)}
                      className="w-full bg-transparent outline-none font-extrabold text-gray-800 p-0 text-sm"
                    />
                  </div>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={editState.discount?.reason || ''}
                    onChange={(e) => handleDiscountChange('reason', e.target.value)}
                    placeholder="Reason/Coupon code..."
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500 text-gray-700"
                  />
                </div>
              )}
            </div>

            {/* GST Card */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-md font-extrabold text-gray-850 flex items-center gap-2 mb-3">
                  <FiDollarSign className="text-cyan-500" /> GST Percentage
                </h3>
                <p className="text-xs text-gray-400 font-semibold mb-3">Adjust the tax rate percentage applied to the final subtotal amount.</p>
              </div>

              <div className="flex items-center gap-3 border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-blue-500">
                <input
                  type="number"
                  min="0"
                  max="100"
                  disabled={isReadOnly}
                  value={editState.gst?.gstPercentage || 18}
                  onChange={(e) => handleGstChange(e.target.value)}
                  className="w-full bg-transparent outline-none font-extrabold text-gray-800 p-0 text-sm"
                />
                <span className="font-extrabold text-gray-400">%</span>
              </div>
            </div>
          </div>

          {/* 9 & 10. Remarks and Notes */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-800">Remarks & Internal Notes</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Admin Remarks (Visible to Vendor)</label>
                <textarea
                  disabled={isReadOnly}
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="Notes, corrections required, or feedback for the vendor..."
                  className="w-full min-h-[100px] border border-gray-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-blue-500 text-gray-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Internal Notes (Admins Only)</label>
                <textarea
                  disabled={isReadOnly}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Private comments, audit findings, or admin-only discussion..."
                  className="w-full min-h-[100px] border border-gray-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-blue-500 text-gray-700"
                />
              </div>
            </div>
          </div>

          {/* Checklist Card */}
          {!isReadOnly && (
            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-extrabold text-amber-800 flex items-center gap-2">
                <FiCheckSquare /> Approval Checklist
              </h3>
              <p className="text-xs text-amber-700/80 font-bold">You must verify each of the following components before the "Approve" action will be unlocked.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.keys(checklist).map((key) => {
                  const label = 
                    key === 'measurements' ? 'Measurements verified' :
                    key === 'products' ? 'Products verified' :
                    key === 'labour' ? 'Labour verified' :
                    key === 'gst' ? 'GST verified' :
                    key === 'charges' ? 'Additional charges verified' : 'Inspection photos reviewed';
                  return (
                    <label key={key} className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={checklist[key]}
                        onChange={(e) => setChecklist(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="w-5 h-5 rounded-lg border-gray-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-sm font-extrabold text-gray-800">{label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* 8. Version History timeline */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FiClock className="text-blue-500" /> Version History & Timeline
              </h3>
              {historyVersions.length > 1 && (
                <button
                  onClick={() => {
                    setCompareV1(historyVersions[historyVersions.length - 2]?.version || 1);
                    setCompareV2(historyVersions[historyVersions.length - 1]?.version || 2);
                    setShowCompareModal(true);
                  }}
                  className="text-xs font-extrabold text-blue-600 bg-blue-50 border border-blue-100 px-3.5 py-1.5 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  Compare Versions
                </button>
              )}
            </div>

            <div className="relative border-l border-gray-200 ml-4 pl-6 space-y-6">
              {historyVersions.map((v, idx) => (
                <div key={idx} className="relative">
                  {/* Dot */}
                  <span className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white bg-blue-500 shadow-sm flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  </span>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-extrabold text-gray-905">Version {v.version}</span>
                      <span className="px-2 py-0.5 bg-gray-100 text-[10px] text-gray-500 font-black tracking-wider uppercase rounded-md">
                        {v.changeSummary}
                      </span>
                      <span className="text-[10px] text-gray-400 font-semibold">{new Date(v.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 font-semibold">
                      Author: <span className="font-extrabold text-gray-700">{v.changedByName}</span> ({v.changedByType})
                    </p>
                    <p className="text-xs font-bold text-blue-600 mt-1.5">
                      Grand Total: ₹{v.snapshot?.summary?.grandTotal} | Products: {v.snapshot?.products?.length || 0} items
                    </p>
                  </div>
                </div>
              ))}
              {historyVersions.length === 0 && (
                <div className="text-gray-400 text-sm italic py-2">No historical snapshots saved yet. Timeline begins upon vendor submission.</div>
              )}
            </div>
          </div>

        </div>

        {/* Right column (Sticky Summary Panel) */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 space-y-6">
            
            {/* Sticky summary panel */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-md p-6 space-y-5">
              <h3 className="text-md font-black text-gray-900 border-b border-gray-100 pb-3 uppercase tracking-wider">Quotation Summary</h3>
              
              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-400">Material Cost</span>
                  <span className="text-gray-800">₹{editState.summary?.materialCost || 0}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-400">Labour Cost</span>
                  <span className="text-gray-800">₹{editState.summary?.labourCost || 0}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-400">Additional Charges</span>
                  <span className="text-gray-800">₹{editState.summary?.additionalCharges || 0}</span>
                </div>
                {editState.summary?.discount > 0 && (
                  <div className="flex justify-between font-semibold text-red-600">
                    <span>Discount ({editState.discount?.type})</span>
                    <span>-₹{editState.summary.discount}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-400">GST ({editState.gst?.gstPercentage || 18}%)</span>
                  <span className="text-gray-850">₹{editState.summary?.gst || 0}</span>
                </div>

                <div className="border-t border-gray-100 pt-4 flex justify-between items-baseline">
                  <span className="text-md font-black text-gray-800">Grand Total</span>
                  <span className="text-2xl font-black text-blue-600">₹{editState.summary?.grandTotal || 0}</span>
                </div>
              </div>

              {/* Action Buttons Panel */}
              <div className="space-y-3 pt-3">
                {/* Save Changes button (updates and records a version) */}
                {!isReadOnly && (
                  <button
                    onClick={handleSaveChanges}
                    disabled={saving || actionLoading}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl cursor-pointer shadow-md transition-all disabled:opacity-50 text-sm"
                  >
                    {saving ? 'Saving changes...' : 'Save Draft Changes'}
                  </button>
                )}

                {/* Final Decision buttons */}
                {!isReadOnly && (
                  <>
                    <button
                      onClick={handleApprove}
                      disabled={saving || actionLoading || Object.values(checklist).some(v => !v)}
                      className={`w-full flex items-center justify-center gap-2 text-white font-extrabold py-3 rounded-xl cursor-pointer shadow-md transition-all text-sm ${
                        Object.values(checklist).some(v => !v)
                          ? 'bg-gray-300 cursor-not-allowed shadow-none'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      <FiCheck className="w-4 h-4" /> Approve Quotation
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setShowRevisionModal(true)}
                        disabled={saving || actionLoading}
                        className="flex items-center justify-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-extrabold py-2.5 rounded-xl cursor-pointer text-xs transition-all disabled:opacity-50"
                      >
                        Request Revision
                      </button>

                      <button
                        onClick={() => setShowRejectModal(true)}
                        disabled={saving || actionLoading}
                        className="flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-extrabold py-2.5 rounded-xl cursor-pointer text-xs transition-all disabled:opacity-50"
                      >
                        Reject Quote
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Audit Log Card */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider border-b border-gray-50 pb-2">Audit Logs</h3>
              <div className="space-y-3.5 text-xs">
                {quotation.reviewedAt && (
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-gray-400">Reviewed At:</span>
                    <span className="text-right text-gray-700 font-bold">
                      {new Date(quotation.reviewedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {quotation.approvedAt && (
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-gray-400">Approved At:</span>
                    <span className="text-right text-gray-750 font-bold">
                      {new Date(quotation.approvedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {quotation.rejectedAt && (
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-gray-400">Rejected At:</span>
                    <span className="text-right text-gray-750 font-bold">
                      {new Date(quotation.rejectedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {quotation.revisionRequestedAt && (
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-gray-400">Revision Req:</span>
                    <span className="text-right text-gray-750 font-bold">
                      {new Date(quotation.revisionRequestedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-gray-400">Current Status:</span>
                  <span className="text-right font-black text-blue-600">{quotation.status}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* --- Action Modals --- */}

      {/* Rejection Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h4 className="text-md font-extrabold text-red-750 flex items-center gap-2"><FiAlertCircle /> Reject Quotation</h4>
                <button onClick={() => setShowRejectModal(false)} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer"><FiX className="w-5 h-5 text-gray-500" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Rejection Reason (Mandatory, visible to Vendor)</label>
                  <textarea
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Enter reason for rejecting this quotation..."
                    className="w-full min-h-[120px] border border-gray-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-red-500 text-gray-750"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-3">
                <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold cursor-pointer hover:bg-gray-50">Cancel</button>
                <button onClick={handleRejectSubmit} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md">Reject Quote</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Revision Modal */}
      <AnimatePresence>
        {showRevisionModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <h4 className="text-md font-extrabold text-purple-750 flex items-center gap-2"><FiEdit2 /> Request Quotation Revision</h4>
                <button onClick={() => setShowRevisionModal(false)} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer"><FiX className="w-5 h-5 text-gray-500" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Revision Reason (Mandatory, visible to Vendor)</label>
                  <textarea
                    required
                    value={revisionReason}
                    onChange={(e) => setRevisionReason(e.target.value)}
                    placeholder="Enter what vendor needs to adjust or recalculate in the quotation..."
                    className="w-full min-h-[120px] border border-gray-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-purple-500 text-gray-750"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-3">
                <button onClick={() => setShowRevisionModal(false)} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold cursor-pointer hover:bg-gray-50">Cancel</button>
                <button onClick={handleRevisionSubmit} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md">Request Revision</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Version Comparison Modal */}
      <AnimatePresence>
        {showCompareModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden p-6 space-y-4 max-h-[90vh] flex flex-col">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3 flex-shrink-0">
                <h4 className="text-lg font-black text-gray-900 flex items-center gap-2"><FiClock /> Version Comparison</h4>
                <button onClick={() => setShowCompareModal(false)} className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer"><FiX className="w-5 h-5 text-gray-500" /></button>
              </div>

              {/* Version Selectors */}
              <div className="flex gap-4 items-center bg-gray-50 p-3 rounded-xl border border-gray-200 flex-shrink-0 text-sm font-bold text-gray-700">
                <div className="flex items-center gap-2">
                  <span>Compare Old:</span>
                  <select value={compareV1} onChange={(e) => setCompareV1(Number(e.target.value))} className="border border-gray-200 rounded-lg p-1.5 font-bold">
                    {historyVersions.map(v => (
                      <option key={v.version} value={v.version}>v{v.version} ({v.changeSummary})</option>
                    ))}
                  </select>
                </div>
                <span>→</span>
                <div className="flex items-center gap-2">
                  <span>Compare New:</span>
                  <select value={compareV2} onChange={(e) => setCompareV2(Number(e.target.value))} className="border border-gray-200 rounded-lg p-1.5 font-bold">
                    {historyVersions.map(v => (
                      <option key={v.version} value={v.version}>v{v.version} ({v.changeSummary})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Comparison Contents */}
              <div className="overflow-y-auto flex-1 space-y-6 py-4">
                {(() => {
                  const s1 = historyVersions.find(v => v.version === compareV1)?.snapshot;
                  const s2 = historyVersions.find(v => v.version === compareV2)?.snapshot;
                  if (!s1 || !s2) {
                    return <div className="text-gray-400 italic text-center py-10">Select valid versions to compare.</div>;
                  }

                  const differences = [];

                  // Compare Property
                  if (s1.property?.interiorArea !== s2.property?.interiorArea) {
                    differences.push({ label: 'Property Interior Area', oldVal: `${s1.property?.interiorArea} sqft`, newVal: `${s2.property?.interiorArea} sqft` });
                  }
                  if (s1.property?.exteriorArea !== s2.property?.exteriorArea) {
                    differences.push({ label: 'Property Exterior Area', oldVal: `${s1.property?.exteriorArea} sqft`, newVal: `${s2.property?.exteriorArea} sqft` });
                  }

                  // Compare products count / values
                  const lengthDiff = (s1.products?.length || 0) !== (s2.products?.length || 0);
                  if (lengthDiff) {
                    differences.push({ label: 'Products count', oldVal: s1.products?.length || 0, newVal: s2.products?.length || 0 });
                  }
                  s2.products?.forEach((p2, idx) => {
                    const p1 = s1.products?.[idx];
                    if (p1) {
                      if (p1.productCode !== p2.productCode) {
                        differences.push({ label: `Product #${idx + 1} Code`, oldVal: p1.productCode, newVal: p2.productCode });
                      }
                      if (p1.selectedPackSize?.size !== p2.selectedPackSize?.size) {
                        differences.push({ label: `Product #${idx + 1} Pack Size`, oldVal: `${p1.selectedPackSize?.size} ${p1.selectedPackSize?.unit}`, newVal: `${p2.selectedPackSize?.size} ${p2.selectedPackSize?.unit}` });
                      }
                      if (p1.quantityRequired !== p2.quantityRequired) {
                        differences.push({ label: `Product #${idx + 1} Quantity`, oldVal: p1.quantityRequired, newVal: p2.quantityRequired });
                      }
                      if (p1.subtotal !== p2.subtotal) {
                        differences.push({ label: `Product #${idx + 1} Subtotal`, oldVal: `₹${p1.subtotal}`, newVal: `₹${p2.subtotal}` });
                      }
                    }
                  });

                  // Compare Labour
                  if ((s1.labour?.length || 0) !== (s2.labour?.length || 0)) {
                    differences.push({ label: 'Labour config count', oldVal: s1.labour?.length || 0, newVal: s2.labour?.length || 0 });
                  }
                  s2.labour?.forEach((l2, idx) => {
                    const l1 = s1.labour?.[idx];
                    if (l1) {
                      if (l1.workType !== l2.workType) {
                        differences.push({ label: `Labour #${idx + 1} Work Type`, oldVal: l1.workType, newVal: l2.workType });
                      }
                      if (l1.pricePerSqFt !== l2.pricePerSqFt) {
                        differences.push({ label: `Labour #${idx + 1} Rate`, oldVal: `₹${l1.pricePerSqFt}/sqft`, newVal: `₹${l2.pricePerSqFt}/sqft` });
                      }
                      if (l1.area !== l2.area) {
                        differences.push({ label: `Labour #${idx + 1} Area`, oldVal: `${l1.area} sqft`, newVal: `${l2.area} sqft` });
                      }
                    }
                  });

                  // Additional charges
                  if (s1.additionalCharges?.length !== s2.additionalCharges?.length) {
                    differences.push({ label: 'Additional Charges Count', oldVal: s1.additionalCharges?.length || 0, newVal: s2.additionalCharges?.length || 0 });
                  }
                  s2.additionalCharges?.forEach((c2, idx) => {
                    const c1 = s1.additionalCharges?.[idx];
                    if (c1) {
                      if (c1.title !== c2.title || c1.amount !== c2.amount) {
                        differences.push({ label: `Charge #${idx + 1}`, oldVal: `${c1.title} (₹${c1.amount})`, newVal: `${c2.title} (₹${c2.amount})` });
                      }
                    }
                  });

                  // Discount, GST & summary costs
                  if (s1.discount?.type !== s2.discount?.type || s1.discount?.value !== s2.discount?.value) {
                    differences.push({ label: 'Discount', oldVal: `${s1.discount?.type}: ${s1.discount?.value}`, newVal: `${s2.discount?.type}: ${s2.discount?.value}` });
                  }
                  if (s1.gst?.gstPercentage !== s2.gst?.gstPercentage) {
                    differences.push({ label: 'GST Percentage', oldVal: `${s1.gst?.gstPercentage}%`, newVal: `${s2.gst?.gstPercentage}%` });
                  }
                  if (s1.summary?.materialCost !== s2.summary?.materialCost) {
                    differences.push({ label: 'Material Cost Summary', oldVal: `₹${s1.summary?.materialCost}`, newVal: `₹${s2.summary?.materialCost}` });
                  }
                  if (s1.summary?.labourCost !== s2.summary?.labourCost) {
                    differences.push({ label: 'Labour Cost Summary', oldVal: `₹${s1.summary?.labourCost}`, newVal: `₹${s2.summary?.labourCost}` });
                  }
                  if (s1.summary?.additionalCharges !== s2.summary?.additionalCharges) {
                    differences.push({ label: 'Additional Charges Summary', oldVal: `₹${s1.summary?.additionalCharges}`, newVal: `₹${s2.summary?.additionalCharges}` });
                  }
                  if (s1.summary?.grandTotal !== s2.summary?.grandTotal) {
                    differences.push({ label: 'Grand Total Summary', oldVal: `₹${s1.summary?.grandTotal}`, newVal: `₹${s2.summary?.grandTotal}` });
                  }

                  return (
                    <div className="space-y-4">
                      {differences.length === 0 ? (
                        <div className="text-gray-500 font-bold py-10 text-center">No differences found between v{compareV1} and v{compareV2}.</div>
                      ) : (
                        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white divide-y divide-gray-100">
                          {differences.map((diff, i) => (
                            <div key={i} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm font-semibold">
                              <span className="text-gray-500">{diff.label}</span>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="bg-red-50 text-red-700 border border-red-100 rounded-lg px-2.5 py-1 font-bold text-xs line-through">
                                  {diff.oldVal}
                                </span>
                                <span>→</span>
                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg px-2.5 py-1 font-bold text-xs">
                                  {diff.newVal}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-3 flex-shrink-0">
                <button onClick={() => setShowCompareModal(false)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-md">Close Comparison</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default QuotationReview;
