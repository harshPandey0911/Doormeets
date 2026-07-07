import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { 
  FiCheck, FiArrowRight, FiArrowLeft, FiPlus, FiTrash2, 
  FiUploadCloud, FiInfo, FiDollarSign, FiPercent, FiEdit3, FiEye, FiFileText, FiAlertCircle 
} from 'react-icons/fi';
import { 
  getQuotationByConsultationId, 
  saveQuotationDraft, 
  updateQuotationDraft, 
  submitQuotationToAdmin, 
  getPaintingProducts, 
  getLabourRatesForVendor 
} from '../../services/paintingConsultationService';

const STEPS = [
  { label: 'Property Summary', icon: '🏠' },
  { label: 'Paint Brand', icon: '🎨' },
  { label: 'Paint Product', icon: '🖌️' },
  { label: 'Primer', icon: '🧪' },
  { label: 'Putty', icon: '🧱' },
  { label: 'Labour Rate', icon: '👷' },
  { label: 'Optional Charges', icon: '⚡' },
  { label: 'Review Quotation', icon: '📊' },
  { label: 'Submit to Admin', icon: '📤' }
];

const VendorQuoteWizard = ({ consultation, onBack, onComplete }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [quoteId, setQuoteId] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('DRAFT');

  // Master lists
  const [productsList, setProductsList] = useState([]);
  const [brandsList, setBrandsList] = useState([]);
  const [labourRatesList, setLabourRatesList] = useState([]);

  // Form State
  const [property, setProperty] = useState({
    propertyType: consultation?.propertyType || '2BHK',
    interiorArea: 0,
    exteriorArea: 0,
    ceilingArea: 0,
    balconyArea: 0,
    totalPaintableArea: 0
  });

  const [selectedBrand, setSelectedBrand] = useState('');
  
  // Selection keys map to productId and selectedPackSize
  const [selectedProducts, setSelectedProducts] = useState({
    interiorPaint: { productId: '', selectedPackSize: null },
    exteriorPaint: { productId: '', selectedPackSize: null },
    ceilingPaint: { productId: '', selectedPackSize: null },
    balconyPaint: { productId: '', selectedPackSize: null },
    interiorPrimer: { productId: '', selectedPackSize: null },
    exteriorPrimer: { productId: '', selectedPackSize: null },
    interiorPutty: { productId: '', selectedPackSize: null },
    exteriorPutty: { productId: '', selectedPackSize: null }
  });

  const [selectedLabour, setSelectedLabour] = useState({
    interiorLabour: '', // labourRateId
    exteriorLabour: ''  // labourRateId
  });

  const [additionalCharges, setAdditionalCharges] = useState([]);
  const [discount, setDiscount] = useState({
    type: 'NONE', // 'FLAT', 'PERCENTAGE', 'NONE'
    value: 0,
    reason: ''
  });

  const [remarks, setRemarks] = useState({
    vendorRemarks: '',
    customerRemarks: '',
    adminRemarks: ''
  });

  const [attachments, setAttachments] = useState({
    inspectionPhotos: [],
    beforePhotos: [],
    referenceImages: []
  });

  // Mock Upload state
  const [uploading, setUploading] = useState({
    inspectionPhotos: false,
    beforePhotos: false,
    referenceImages: false
  });

  // Automatically calculate total paintable area
  useEffect(() => {
    const total = 
      (Number(property.interiorArea) || 0) + 
      (Number(property.exteriorArea) || 0) + 
      (Number(property.ceilingArea) || 0) + 
      (Number(property.balconyArea) || 0);
    setProperty(prev => ({ ...prev, totalPaintableArea: total }));
  }, [property.interiorArea, property.exteriorArea, property.ceilingArea, property.balconyArea]);

  // Fetch initial master data and draft quote
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        // 1. Fetch products and labour rates
        const prodRes = await getPaintingProducts();
        const labRes = await getLabourRatesForVendor();

        let fetchedProducts = [];
        if (prodRes?.success) {
          fetchedProducts = prodRes.data;
          setProductsList(prodRes.data);
          
          // Extract unique brands
          const brandsMap = {};
          prodRes.data.forEach(p => {
            if (p.brandId && p.brandId._id) {
              brandsMap[p.brandId._id] = p.brandId;
            }
          });
          setBrandsList(Object.values(brandsMap));
        }

        if (labRes?.success) {
          setLabourRatesList(labRes.data);
        }

        // 2. Fetch existing quotation draft if any
        if (consultation?._id) {
          const quoteRes = await getQuotationByConsultationId(consultation._id);
          if (quoteRes?.success && quoteRes.data) {
            const q = quoteRes.data;
            setQuoteId(q._id);
            setCurrentStatus(q.status);
            setIsReadOnly(q.status !== 'DRAFT' && q.status !== 'ADMIN_REJECTED');

            // Map database fields to frontend state
            if (q.property) {
              setProperty({
                propertyType: q.property.propertyType || consultation?.propertyType || '2BHK',
                interiorArea: q.property.interiorArea || 0,
                exteriorArea: q.property.exteriorArea || 0,
                ceilingArea: q.property.ceilingArea || 0,
                balconyArea: q.property.balconyArea || 0,
                totalPaintableArea: q.property.totalPaintableArea || 0
              });
            }

            // Map products back to keys
            const mappedProds = {
              interiorPaint: { productId: '', selectedPackSize: null },
              exteriorPaint: { productId: '', selectedPackSize: null },
              ceilingPaint: { productId: '', selectedPackSize: null },
              balconyPaint: { productId: '', selectedPackSize: null },
              interiorPrimer: { productId: '', selectedPackSize: null },
              exteriorPrimer: { productId: '', selectedPackSize: null },
              interiorPutty: { productId: '', selectedPackSize: null },
              exteriorPutty: { productId: '', selectedPackSize: null }
            };

            let brandSet = false;
            q.products.forEach(p => {
              // Deduce brand from first product
              if (!brandSet && p.brandId) {
                setSelectedBrand(p.brandId.toString());
                brandSet = true;
              }

              const pId = p.productId?._id || p.productId;
              // Map by productType and applied area/description
              if (p.productType === 'Paint') {
                if (p.appliedArea === q.property?.interiorArea && q.property?.interiorArea > 0 && !mappedProds.interiorPaint.productId) {
                  mappedProds.interiorPaint = { productId: pId, selectedPackSize: p.selectedPackSize };
                } else if (p.appliedArea === q.property?.exteriorArea && q.property?.exteriorArea > 0 && !mappedProds.exteriorPaint.productId) {
                  mappedProds.exteriorPaint = { productId: pId, selectedPackSize: p.selectedPackSize };
                } else if (p.appliedArea === q.property?.ceilingArea && q.property?.ceilingArea > 0 && !mappedProds.ceilingPaint.productId) {
                  mappedProds.ceilingPaint = { productId: pId, selectedPackSize: p.selectedPackSize };
                } else if (p.appliedArea === q.property?.balconyArea && q.property?.balconyArea > 0 && !mappedProds.balconyPaint.productId) {
                  mappedProds.balconyPaint = { productId: pId, selectedPackSize: p.selectedPackSize };
                }
              } else if (p.productType === 'Primer') {
                if (p.appliedArea === (q.property?.interiorArea + q.property?.ceilingArea) && !mappedProds.interiorPrimer.productId) {
                  mappedProds.interiorPrimer = { productId: pId, selectedPackSize: p.selectedPackSize };
                } else if (p.appliedArea === (q.property?.exteriorArea + q.property?.balconyArea) && !mappedProds.exteriorPrimer.productId) {
                  mappedProds.exteriorPrimer = { productId: pId, selectedPackSize: p.selectedPackSize };
                }
              } else if (p.productType === 'Putty') {
                if (p.appliedArea === (q.property?.interiorArea + q.property?.ceilingArea) && !mappedProds.interiorPutty.productId) {
                  mappedProds.interiorPutty = { productId: pId, selectedPackSize: p.selectedPackSize };
                } else if (p.appliedArea === (q.property?.exteriorArea + q.property?.balconyArea) && !mappedProds.exteriorPutty.productId) {
                  mappedProds.exteriorPutty = { productId: pId, selectedPackSize: p.selectedPackSize };
                }
              }
            });
            setSelectedProducts(mappedProds);

            // Map labour
            const mappedLabour = { interiorLabour: '', exteriorLabour: '' };
            q.labour.forEach(l => {
              const lId = l.labourRateId?._id || l.labourRateId;
              const rateObj = labRes.data?.find(r => r._id === lId.toString());
              if (rateObj) {
                if (rateObj.application === 'INTERIOR') {
                  mappedLabour.interiorLabour = lId;
                } else {
                  mappedLabour.exteriorLabour = lId;
                }
              }
            });
            setSelectedLabour(mappedLabour);

            setAdditionalCharges(q.additionalCharges || []);
            setDiscount(q.discount || { type: 'NONE', value: 0, reason: '' });
            setRemarks(q.remarks || { vendorRemarks: '', customerRemarks: '', adminRemarks: '' });
            setAttachments(q.attachments || { inspectionPhotos: [], beforePhotos: [], referenceImages: [] });
          }
        }
      } catch (err) {
        console.error('Failed to load wizard resources:', err);
        toast.error('Error loading configuration details.');
      } finally {
        setLoading(false);
      }
    };
    initializeData();
  }, [consultation]);

  // Compute live calculations
  const calculateCosts = () => {
    let materialCost = 0;
    let labourCost = 0;
    let additionalCost = 0;

    const selectedProductDetails = [];
    const selectedLabourDetails = [];

    // Helper for products mapping
    const productMappings = [
      { key: 'interiorPaint', area: Number(property.interiorArea) || 0, label: 'Interior Paint' },
      { key: 'exteriorPaint', area: Number(property.exteriorArea) || 0, label: 'Exterior Paint' },
      { key: 'ceilingPaint', area: Number(property.ceilingArea) || 0, label: 'Ceiling Paint' },
      { key: 'balconyPaint', area: Number(property.balconyArea) || 0, label: 'Balcony Paint' },
      { key: 'interiorPrimer', area: (Number(property.interiorArea) || 0) + (Number(property.ceilingArea) || 0), label: 'Interior Primer' },
      { key: 'exteriorPrimer', area: (Number(property.exteriorArea) || 0) + (Number(property.balconyArea) || 0), label: 'Exterior Primer' },
      { key: 'interiorPutty', area: (Number(property.interiorArea) || 0) + (Number(property.ceilingArea) || 0), label: 'Interior Putty' },
      { key: 'exteriorPutty', area: (Number(property.exteriorArea) || 0) + (Number(property.balconyArea) || 0), label: 'Exterior Putty' }
    ];

    productMappings.forEach(mapping => {
      const selection = selectedProducts[mapping.key];
      if (selection?.productId && mapping.area > 0) {
        const prod = productsList.find(p => p._id === selection.productId);
        if (prod) {
          const coverage = prod.coverage?.value || 1;
          const price = prod.price || 0;
          const quantityRequired = parseFloat((mapping.area / coverage).toFixed(2));
          const packSize = selection.selectedPackSize?.size || 1;
          const quantityPurchased = Math.ceil(quantityRequired / packSize);
          const subtotal = parseFloat((quantityRequired * price).toFixed(2));

          materialCost += subtotal;
          selectedProductDetails.push({
            label: mapping.label,
            productName: prod.productName,
            productCode: prod.productCode,
            productType: prod.productType,
            coverage,
            unitPrice: price,
            selectedPackSize: selection.selectedPackSize,
            quantityRequired,
            quantityPurchased,
            subtotal,
            appliedArea: mapping.area
          });
        }
      }
    });

    // Labour mapping
    const labourMappings = [
      { key: 'interiorLabour', area: (Number(property.interiorArea) || 0) + (Number(property.ceilingArea) || 0) + (Number(property.balconyArea) || 0), label: 'Interior Labour' },
      { key: 'exteriorLabour', area: Number(property.exteriorArea) || 0, label: 'Exterior Labour' }
    ];

    labourMappings.forEach(mapping => {
      const lId = selectedLabour[mapping.key];
      if (lId && mapping.area > 0) {
        const rate = labourRatesList.find(r => r._id === lId);
        if (rate) {
          const subtotal = parseFloat((mapping.area * rate.pricePerSqft).toFixed(2));
          labourCost += subtotal;
          selectedLabourDetails.push({
            label: mapping.label,
            workType: rate.workType,
            pricePerSqFt: rate.pricePerSqft,
            area: mapping.area,
            subtotal
          });
        }
      }
    });

    // Additional charges cost
    additionalCharges.forEach(c => {
      additionalCost += Number(c.amount) || 0;
    });

    const baseSum = materialCost + labourCost + additionalCost;
    let discountVal = 0;
    if (discount.type === 'PERCENTAGE') {
      discountVal = parseFloat((baseSum * (discount.value / 100)).toFixed(2));
    } else if (discount.type === 'FLAT') {
      discountVal = Math.min(baseSum, discount.value);
    }

    const taxableAmount = Math.max(0, baseSum - discountVal);
    const gstVal = parseFloat((taxableAmount * 0.18).toFixed(2));
    const grandTotal = parseFloat((taxableAmount + gstVal).toFixed(2));

    return {
      materialCost: parseFloat(materialCost.toFixed(2)),
      labourCost: parseFloat(labourCost.toFixed(2)),
      additionalCharges: parseFloat(additionalCost.toFixed(2)),
      discount: parseFloat(discountVal.toFixed(2)),
      gst: parseFloat(gstVal.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2)),
      products: selectedProductDetails,
      labour: selectedLabourDetails
    };
  };

  const calculated = calculateCosts();

  // Navigation handlers
  const goNext = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const goBack = () => {
    if (step === 0) {
      onBack();
    } else {
      setStep(s => s - 1);
    }
  };

  // Compile full quotation payload for backend save/update
  const getPayload = () => {
    const productsPayload = [];
    const productKeys = [
      { key: 'interiorPaint', area: Number(property.interiorArea) || 0 },
      { key: 'exteriorPaint', area: Number(property.exteriorArea) || 0 },
      { key: 'ceilingPaint', area: Number(property.ceilingArea) || 0 },
      { key: 'balconyPaint', area: Number(property.balconyArea) || 0 },
      { key: 'interiorPrimer', area: (Number(property.interiorArea) || 0) + (Number(property.ceilingArea) || 0) },
      { key: 'exteriorPrimer', area: (Number(property.exteriorArea) || 0) + (Number(property.balconyArea) || 0) },
      { key: 'interiorPutty', area: (Number(property.interiorArea) || 0) + (Number(property.ceilingArea) || 0) },
      { key: 'exteriorPutty', area: (Number(property.exteriorArea) || 0) + (Number(property.balconyArea) || 0) }
    ];

    productKeys.forEach(p => {
      const selection = selectedProducts[p.key];
      if (selection?.productId && p.area > 0) {
        productsPayload.push({
          productId: selection.productId,
          selectedPackSize: selection.selectedPackSize,
          appliedArea: p.area
        });
      }
    });

    const labourPayload = [];
    if (selectedLabour.interiorLabour && (Number(property.interiorArea) + Number(property.ceilingArea) + Number(property.balconyArea)) > 0) {
      labourPayload.push({
        labourRateId: selectedLabour.interiorLabour,
        area: (Number(property.interiorArea) || 0) + (Number(property.ceilingArea) || 0) + (Number(property.balconyArea) || 0)
      });
    }
    if (selectedLabour.exteriorLabour && Number(property.exteriorArea) > 0) {
      labourPayload.push({
        labourRateId: selectedLabour.exteriorLabour,
        area: Number(property.exteriorArea) || 0
      });
    }

    return {
      consultationId: consultation?._id,
      property,
      products: productsPayload,
      labour: labourPayload,
      additionalCharges,
      discount,
      gstPercentage: 18,
      remarks,
      attachments
    };
  };

  // Save quotation draft (autosaves when navigating or manually clicked)
  const handleSaveDraft = async (silent = false) => {
    if (isReadOnly) return;
    try {
      const payload = getPayload();
      let res;
      if (quoteId) {
        res = await updateQuotationDraft(quoteId, payload);
      } else {
        res = await saveQuotationDraft(payload);
        if (res?.success && res.data?._id) {
          setQuoteId(res.data._id);
        }
      }
      if (!silent) {
        toast.success('Draft quotation saved successfully!');
      }
    } catch (err) {
      console.error(err);
      if (!silent) {
        toast.error('Failed to save draft quotation.');
      }
    }
  };

  // Submit to Admin
  const handleSubmitToAdmin = async () => {
    if (!quoteId) {
      // Create first
      await handleSaveDraft(true);
    }
    try {
      setSubmitting(true);
      const res = await submitQuotationToAdmin(quoteId);
      if (res?.success) {
        toast.success('🚀 Quotation submitted to Admin for review!');
        setIsReadOnly(true);
        setCurrentStatus('SUBMITTED_TO_ADMIN');
        if (onComplete) onComplete();
      } else {
        toast.error(res?.message || 'Failed to submit quote');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error submitting quotation to Admin.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle local mock image file upload
  const handleMockUpload = (field, e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(prev => ({ ...prev, [field]: true }));

    // Mock network lag
    setTimeout(() => {
      const urls = [];
      for (let i = 0; i < files.length; i++) {
        // Create mock URL or object URL
        urls.push(URL.createObjectURL(files[i]));
      }

      setAttachments(prev => ({
        ...prev,
        [field]: [...prev[field], ...urls]
      }));
      setUploading(prev => ({ ...prev, [field]: false }));
      toast.success(`Uploaded ${files.length} photo(s)`);
    }, 1500);
  };

  const handleRemoveAttachment = (field, idx) => {
    setAttachments(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== idx)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-500">Loading Wizard Config...</p>
        </div>
      </div>
    );
  }

  // Filter products by selected brand and productType
  const getFilteredProducts = (type) => {
    return productsList.filter(p => p.brandId?._id === selectedBrand && p.productType === type);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      
      {/* Header bar */}
      <div className="bg-white sticky top-0 z-40 border-b border-gray-150 px-4 py-4 shadow-sm">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={goBack} className="p-2.5 hover:bg-gray-100 rounded-full transition-all active:scale-95 text-gray-500 hover:text-orange-500">
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-extrabold text-gray-800 text-lg flex items-center gap-2">
                Quotation Builder
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                  currentStatus === 'DRAFT' ? 'bg-orange-100 text-orange-600' :
                  currentStatus === 'SUBMITTED_TO_ADMIN' ? 'bg-blue-100 text-blue-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  {currentStatus}
                </span>
              </h1>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                {consultation?.userId?.name || 'Customer'} • {property.propertyType}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!isReadOnly && (
              <button 
                onClick={() => handleSaveDraft(false)}
                className="text-xs font-bold text-orange-500 hover:bg-orange-50 px-4 py-2 rounded-xl transition-all border border-orange-200"
              >
                Save Draft
              </button>
            )}
            <span className="text-xs font-extrabold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-lg">
              Step {step + 1} of {STEPS.length}
            </span>
          </div>
        </div>

        {/* Step Indicator Progress bar */}
        <div className="flex items-center gap-1.5 max-w-4xl mx-auto mt-4 px-1">
          {STEPS.map((s, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center relative cursor-pointer" onClick={() => setStep(idx)}>
              <div className={`w-full h-1.5 rounded-full transition-all duration-300 ${
                idx < step ? 'bg-orange-500' : idx === step ? 'bg-orange-400 scale-y-125 shadow-md shadow-orange-200' : 'bg-gray-200'
              }`} />
              <span className={`text-[9px] mt-2 font-bold uppercase tracking-wider transition-colors duration-250 ${
                idx === step ? 'text-orange-500' : 'text-gray-400'
              } hidden md:block`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Main wizard content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {isReadOnly && (
          <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl flex gap-3 text-amber-800">
            <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">Read-Only Quotation</p>
              <p className="text-xs opacity-90 mt-0.5">This quotation was submitted to the Admin on {new Date(consultation?.updatedAt).toLocaleDateString()} and is locked. Edits are disabled.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-xl shadow-gray-100/50">
          
          {/* Step 1: Property Summary */}
          {step === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                  <span>🏠</span> Step 1: Property Summary
                </h2>
                <p className="text-sm text-gray-400 font-semibold mt-1">Review and input the property dimensions verified during inspection.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Property Type</label>
                  <select
                    disabled={isReadOnly}
                    value={property.propertyType}
                    onChange={e => setProperty({ ...property, propertyType: e.target.value })}
                    className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-xl px-4 py-3 text-sm font-bold bg-white text-gray-800 outline-none"
                  >
                    <option value="1BHK">1 BHK</option>
                    <option value="2BHK">2 BHK</option>
                    <option value="3BHK">3 BHK</option>
                    <option value="Villa">Villa / Bungalow</option>
                    <option value="Commercial">Commercial Office</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Interior Wall Area (sq.ft)</label>
                  <input
                    disabled={isReadOnly}
                    type="number"
                    min="0"
                    value={property.interiorArea || ''}
                    onChange={e => setProperty({ ...property, interiorArea: Number(e.target.value) || 0 })}
                    placeholder="e.g. 1200"
                    className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Exterior Wall Area (sq.ft)</label>
                  <input
                    disabled={isReadOnly}
                    type="number"
                    min="0"
                    value={property.exteriorArea || ''}
                    onChange={e => setProperty({ ...property, exteriorArea: Number(e.target.value) || 0 })}
                    placeholder="e.g. 800"
                    className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Ceiling Area (sq.ft)</label>
                  <input
                    disabled={isReadOnly}
                    type="number"
                    min="0"
                    value={property.ceilingArea || ''}
                    onChange={e => setProperty({ ...property, ceilingArea: Number(e.target.value) || 0 })}
                    placeholder="e.g. 600"
                    className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Balcony Wall Area (sq.ft)</label>
                  <input
                    disabled={isReadOnly}
                    type="number"
                    min="0"
                    value={property.balconyArea || ''}
                    onChange={e => setProperty({ ...property, balconyArea: Number(e.target.value) || 0 })}
                    placeholder="e.g. 200"
                    className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none"
                  />
                </div>

                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex flex-col justify-center">
                  <span className="text-xs font-bold text-orange-500 uppercase">Total Paintable Area</span>
                  <span className="text-2xl font-black text-orange-600">{property.totalPaintableArea} sq.ft</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Select Paint Brand */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                  <span>🎨</span> Step 2: Select Paint Brand
                </h2>
                <p className="text-sm text-gray-400 font-semibold mt-1">Select the paint brand to use. Products for quotes will be filtered by this brand.</p>
              </div>

              {brandsList.length === 0 ? (
                <div className="p-8 text-center text-gray-400 font-bold border-2 border-dashed border-gray-200 rounded-2xl">
                  No active paint brands found in database. Create brand in Admin panel first.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {brandsList.map(brand => (
                    <div
                      key={brand._id}
                      onClick={() => !isReadOnly && setSelectedBrand(brand._id)}
                      className={`p-6 border-2 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                        selectedBrand === brand._id 
                          ? 'border-orange-500 bg-orange-50/20 scale-[1.02]' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      {brand.logo?.url ? (
                        <img src={brand.logo.url} alt={brand.name} className="h-10 object-contain" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 text-gray-500 font-black rounded-xl flex items-center justify-center text-lg uppercase">
                          {brand.name.substring(0, 2)}
                        </div>
                      )}
                      <span className="font-extrabold text-gray-800">{brand.name}</span>
                      <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">{brand.code}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Select Paint Product */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                  <span>🖌️</span> Step 3: Select Paint Products
                </h2>
                <p className="text-sm text-gray-400 font-semibold mt-1">Assign paint products to your property's active wall areas.</p>
              </div>

              {!selectedBrand && (
                <div className="p-6 bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-xl">
                  Please select a paint brand in Step 2 first.
                </div>
              )}

              {selectedBrand && (
                <div className="space-y-6">
                  {/* Interior Paint */}
                  {property.interiorArea > 0 && (
                    <div className="p-5 border-2 border-gray-150 rounded-2xl space-y-3 bg-gray-50/50">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-800">Interior Paint (Area: {property.interiorArea} sq.ft)</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <select
                          disabled={isReadOnly}
                          value={selectedProducts.interiorPaint.productId}
                          onChange={e => {
                            const pId = e.target.value;
                            const prod = productsList.find(p => p._id === pId);
                            const defSize = prod?.availablePackSizes?.[0] || null;
                            setSelectedProducts({
                              ...selectedProducts,
                              interiorPaint: { productId: pId, selectedPackSize: defSize }
                            });
                          }}
                          className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                        >
                          <option value="">-- Choose Interior Paint --</option>
                          {getFilteredProducts('Paint').filter(p => p.application === 'Interior' || p.application === 'Universal').map(p => (
                            <option key={p._id} value={p._id}>{p.productName} [₹{p.price}/Unit]</option>
                          ))}
                        </select>

                        {selectedProducts.interiorPaint.productId && (
                          <select
                            disabled={isReadOnly}
                            value={JSON.stringify(selectedProducts.interiorPaint.selectedPackSize)}
                            onChange={e => {
                              const size = JSON.parse(e.target.value);
                              setSelectedProducts({
                                ...selectedProducts,
                                interiorPaint: { ...selectedProducts.interiorPaint, selectedPackSize: size }
                              });
                            }}
                            className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                          >
                            {productsList.find(p => p._id === selectedProducts.interiorPaint.productId)?.availablePackSizes.map((s, idx) => (
                              <option key={idx} value={JSON.stringify(s)}>{s.size} {s.unit} Pack</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Exterior Paint */}
                  {property.exteriorArea > 0 && (
                    <div className="p-5 border-2 border-gray-150 rounded-2xl space-y-3 bg-gray-50/50">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-800">Exterior Paint (Area: {property.exteriorArea} sq.ft)</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <select
                          disabled={isReadOnly}
                          value={selectedProducts.exteriorPaint.productId}
                          onChange={e => {
                            const pId = e.target.value;
                            const prod = productsList.find(p => p._id === pId);
                            const defSize = prod?.availablePackSizes?.[0] || null;
                            setSelectedProducts({
                              ...selectedProducts,
                              exteriorPaint: { productId: pId, selectedPackSize: defSize }
                            });
                          }}
                          className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-855 outline-none text-sm font-semibold"
                        >
                          <option value="">-- Choose Exterior Paint --</option>
                          {getFilteredProducts('Paint').filter(p => p.application === 'Exterior' || p.application === 'Universal').map(p => (
                            <option key={p._id} value={p._id}>{p.productName} [₹{p.price}/Unit]</option>
                          ))}
                        </select>

                        {selectedProducts.exteriorPaint.productId && (
                          <select
                            disabled={isReadOnly}
                            value={JSON.stringify(selectedProducts.exteriorPaint.selectedPackSize)}
                            onChange={e => {
                              const size = JSON.parse(e.target.value);
                              setSelectedProducts({
                                ...selectedProducts,
                                exteriorPaint: { ...selectedProducts.exteriorPaint, selectedPackSize: size }
                              });
                            }}
                            className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                          >
                            {productsList.find(p => p._id === selectedProducts.exteriorPaint.productId)?.availablePackSizes.map((s, idx) => (
                              <option key={idx} value={JSON.stringify(s)}>{s.size} {s.unit} Pack</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ceiling Paint */}
                  {property.ceilingArea > 0 && (
                    <div className="p-5 border-2 border-gray-150 rounded-2xl space-y-3 bg-gray-50/50">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-800">Ceiling Paint (Area: {property.ceilingArea} sq.ft)</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <select
                          disabled={isReadOnly}
                          value={selectedProducts.ceilingPaint.productId}
                          onChange={e => {
                            const pId = e.target.value;
                            const prod = productsList.find(p => p._id === pId);
                            const defSize = prod?.availablePackSizes?.[0] || null;
                            setSelectedProducts({
                              ...selectedProducts,
                              ceilingPaint: { productId: pId, selectedPackSize: defSize }
                            });
                          }}
                          className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                        >
                          <option value="">-- Choose Ceiling Paint --</option>
                          {getFilteredProducts('Paint').filter(p => p.application === 'Interior' || p.application === 'Universal').map(p => (
                            <option key={p._id} value={p._id}>{p.productName} [₹{p.price}/Unit]</option>
                          ))}
                        </select>

                        {selectedProducts.ceilingPaint.productId && (
                          <select
                            disabled={isReadOnly}
                            value={JSON.stringify(selectedProducts.ceilingPaint.selectedPackSize)}
                            onChange={e => {
                              const size = JSON.parse(e.target.value);
                              setSelectedProducts({
                                ...selectedProducts,
                                ceilingPaint: { ...selectedProducts.ceilingPaint, selectedPackSize: size }
                              });
                            }}
                            className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                          >
                            {productsList.find(p => p._id === selectedProducts.ceilingPaint.productId)?.availablePackSizes.map((s, idx) => (
                              <option key={idx} value={JSON.stringify(s)}>{s.size} {s.unit} Pack</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Balcony Paint */}
                  {property.balconyArea > 0 && (
                    <div className="p-5 border-2 border-gray-150 rounded-2xl space-y-3 bg-gray-50/50">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-800">Balcony Paint (Area: {property.balconyArea} sq.ft)</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <select
                          disabled={isReadOnly}
                          value={selectedProducts.balconyPaint.productId}
                          onChange={e => {
                            const pId = e.target.value;
                            const prod = productsList.find(p => p._id === pId);
                            const defSize = prod?.availablePackSizes?.[0] || null;
                            setSelectedProducts({
                              ...selectedProducts,
                              balconyPaint: { productId: pId, selectedPackSize: defSize }
                            });
                          }}
                          className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                        >
                          <option value="">-- Choose Balcony Paint --</option>
                          {getFilteredProducts('Paint').filter(p => p.application === 'Exterior' || p.application === 'Universal').map(p => (
                            <option key={p._id} value={p._id}>{p.productName} [₹{p.price}/Unit]</option>
                          ))}
                        </select>

                        {selectedProducts.balconyPaint.productId && (
                          <select
                            disabled={isReadOnly}
                            value={JSON.stringify(selectedProducts.balconyPaint.selectedPackSize)}
                            onChange={e => {
                              const size = JSON.parse(e.target.value);
                              setSelectedProducts({
                                ...selectedProducts,
                                balconyPaint: { ...selectedProducts.balconyPaint, selectedPackSize: size }
                              });
                            }}
                            className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-855 outline-none text-sm font-semibold"
                          >
                            {productsList.find(p => p._id === selectedProducts.balconyPaint.productId)?.availablePackSizes.map((s, idx) => (
                              <option key={idx} value={JSON.stringify(s)}>{s.size} {s.unit} Pack</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Select Primer */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                  <span>🧪</span> Step 4: Select Primers
                </h2>
                <p className="text-sm text-gray-400 font-semibold mt-1">Select primer products. Interior Primer applies to Interior+Ceiling areas; Exterior Primer applies to Exterior+Balcony areas.</p>
              </div>

              {!selectedBrand && (
                <div className="p-6 bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-xl">
                  Please select a paint brand in Step 2 first.
                </div>
              )}

              {selectedBrand && (
                <div className="space-y-6">
                  {/* Interior Primer */}
                  {(property.interiorArea > 0 || property.ceilingArea > 0) && (
                    <div className="p-5 border-2 border-gray-150 rounded-2xl space-y-3 bg-gray-50/50">
                      <span className="text-sm font-bold text-gray-850 block">Interior Primer (Applied Area: {property.interiorArea + property.ceilingArea} sq.ft)</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <select
                          disabled={isReadOnly}
                          value={selectedProducts.interiorPrimer.productId}
                          onChange={e => {
                            const pId = e.target.value;
                            const prod = productsList.find(p => p._id === pId);
                            const defSize = prod?.availablePackSizes?.[0] || null;
                            setSelectedProducts({
                              ...selectedProducts,
                              interiorPrimer: { productId: pId, selectedPackSize: defSize }
                            });
                          }}
                          className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                        >
                          <option value="">-- Choose Interior Primer --</option>
                          {getFilteredProducts('Primer').filter(p => p.application === 'Interior' || p.application === 'Universal').map(p => (
                            <option key={p._id} value={p._id}>{p.productName} [₹{p.price}/Unit]</option>
                          ))}
                        </select>

                        {selectedProducts.interiorPrimer.productId && (
                          <select
                            disabled={isReadOnly}
                            value={JSON.stringify(selectedProducts.interiorPrimer.selectedPackSize)}
                            onChange={e => {
                              const size = JSON.parse(e.target.value);
                              setSelectedProducts({
                                ...selectedProducts,
                                interiorPrimer: { ...selectedProducts.interiorPrimer, selectedPackSize: size }
                              });
                            }}
                            className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                          >
                            {productsList.find(p => p._id === selectedProducts.interiorPrimer.productId)?.availablePackSizes.map((s, idx) => (
                              <option key={idx} value={JSON.stringify(s)}>{s.size} {s.unit} Pack</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Exterior Primer */}
                  {(property.exteriorArea > 0 || property.balconyArea > 0) && (
                    <div className="p-5 border-2 border-gray-150 rounded-2xl space-y-3 bg-gray-50/50">
                      <span className="text-sm font-bold text-gray-850 block">Exterior Primer (Applied Area: {property.exteriorArea + property.balconyArea} sq.ft)</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <select
                          disabled={isReadOnly}
                          value={selectedProducts.exteriorPrimer.productId}
                          onChange={e => {
                            const pId = e.target.value;
                            const prod = productsList.find(p => p._id === pId);
                            const defSize = prod?.availablePackSizes?.[0] || null;
                            setSelectedProducts({
                              ...selectedProducts,
                              exteriorPrimer: { productId: pId, selectedPackSize: defSize }
                            });
                          }}
                          className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                        >
                          <option value="">-- Choose Exterior Primer --</option>
                          {getFilteredProducts('Primer').filter(p => p.application === 'Exterior' || p.application === 'Universal').map(p => (
                            <option key={p._id} value={p._id}>{p.productName} [₹{p.price}/Unit]</option>
                          ))}
                        </select>

                        {selectedProducts.exteriorPrimer.productId && (
                          <select
                            disabled={isReadOnly}
                            value={JSON.stringify(selectedProducts.exteriorPrimer.selectedPackSize)}
                            onChange={e => {
                              const size = JSON.parse(e.target.value);
                              setSelectedProducts({
                                ...selectedProducts,
                                exteriorPrimer: { ...selectedProducts.exteriorPrimer, selectedPackSize: size }
                              });
                            }}
                            className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-855 outline-none text-sm font-semibold"
                          >
                            {productsList.find(p => p._id === selectedProducts.exteriorPrimer.productId)?.availablePackSizes.map((s, idx) => (
                              <option key={idx} value={JSON.stringify(s)}>{s.size} {s.unit} Pack</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Select Putty */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                  <span>🧱</span> Step 5: Select Putty
                </h2>
                <p className="text-sm text-gray-400 font-semibold mt-1">Select putty products. Interior Putty applies to Interior+Ceiling areas; Exterior Putty applies to Exterior+Balcony areas.</p>
              </div>

              {!selectedBrand && (
                <div className="p-6 bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-xl">
                  Please select a paint brand in Step 2 first.
                </div>
              )}

              {selectedBrand && (
                <div className="space-y-6">
                  {/* Interior Putty */}
                  {(property.interiorArea > 0 || property.ceilingArea > 0) && (
                    <div className="p-5 border-2 border-gray-150 rounded-2xl space-y-3 bg-gray-50/50">
                      <span className="text-sm font-bold text-gray-850 block">Interior Putty (Applied Area: {property.interiorArea + property.ceilingArea} sq.ft)</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <select
                          disabled={isReadOnly}
                          value={selectedProducts.interiorPutty.productId}
                          onChange={e => {
                            const pId = e.target.value;
                            const prod = productsList.find(p => p._id === pId);
                            const defSize = prod?.availablePackSizes?.[0] || null;
                            setSelectedProducts({
                              ...selectedProducts,
                              interiorPutty: { productId: pId, selectedPackSize: defSize }
                            });
                          }}
                          className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                        >
                          <option value="">-- Choose Interior Putty --</option>
                          {getFilteredProducts('Putty').filter(p => p.application === 'Interior' || p.application === 'Universal').map(p => (
                            <option key={p._id} value={p._id}>{p.productName} [₹{p.price}/Unit]</option>
                          ))}
                        </select>

                        {selectedProducts.interiorPutty.productId && (
                          <select
                            disabled={isReadOnly}
                            value={JSON.stringify(selectedProducts.interiorPutty.selectedPackSize)}
                            onChange={e => {
                              const size = JSON.parse(e.target.value);
                              setSelectedProducts({
                                ...selectedProducts,
                                interiorPutty: { ...selectedProducts.interiorPutty, selectedPackSize: size }
                              });
                            }}
                            className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                          >
                            {productsList.find(p => p._id === selectedProducts.interiorPutty.productId)?.availablePackSizes.map((s, idx) => (
                              <option key={idx} value={JSON.stringify(s)}>{s.size} {s.unit} Pack</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Exterior Putty */}
                  {(property.exteriorArea > 0 || property.balconyArea > 0) && (
                    <div className="p-5 border-2 border-gray-150 rounded-2xl space-y-3 bg-gray-50/50">
                      <span className="text-sm font-bold text-gray-850 block">Exterior Putty (Applied Area: {property.exteriorArea + property.balconyArea} sq.ft)</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <select
                          disabled={isReadOnly}
                          value={selectedProducts.exteriorPutty.productId}
                          onChange={e => {
                            const pId = e.target.value;
                            const prod = productsList.find(p => p._id === pId);
                            const defSize = prod?.availablePackSizes?.[0] || null;
                            setSelectedProducts({
                              ...selectedProducts,
                              exteriorPutty: { productId: pId, selectedPackSize: defSize }
                            });
                          }}
                          className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                        >
                          <option value="">-- Choose Exterior Putty --</option>
                          {getFilteredProducts('Putty').filter(p => p.application === 'Exterior' || p.application === 'Universal').map(p => (
                            <option key={p._id} value={p._id}>{p.productName} [₹{p.price}/Unit]</option>
                          ))}
                        </select>

                        {selectedProducts.exteriorPutty.productId && (
                          <select
                            disabled={isReadOnly}
                            value={JSON.stringify(selectedProducts.exteriorPutty.selectedPackSize)}
                            onChange={e => {
                              const size = JSON.parse(e.target.value);
                              setSelectedProducts({
                                ...selectedProducts,
                                exteriorPutty: { ...selectedProducts.exteriorPutty, selectedPackSize: size }
                              });
                            }}
                            className="border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-855 outline-none text-sm font-semibold"
                          >
                            {productsList.find(p => p._id === selectedProducts.exteriorPutty.productId)?.availablePackSizes.map((s, idx) => (
                              <option key={idx} value={JSON.stringify(s)}>{s.size} {s.unit} Pack</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 6: Select Labour Rate */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                  <span>👷</span> Step 6: Select Labour Rates
                </h2>
                <p className="text-sm text-gray-400 font-semibold mt-1">Select labour rates for interior and exterior painting services.</p>
              </div>

              <div className="space-y-6">
                {/* Interior Labour */}
                {(property.interiorArea > 0 || property.ceilingArea > 0 || property.balconyArea > 0) && (
                  <div className="p-5 border-2 border-gray-150 rounded-2xl space-y-3 bg-gray-50/50">
                    <span className="text-sm font-bold text-gray-850 block">Interior Labour (Applied Area: {property.interiorArea + property.ceilingArea + property.balconyArea} sq.ft)</span>
                    <select
                      disabled={isReadOnly}
                      value={selectedLabour.interiorLabour}
                      onChange={e => setSelectedLabour({ ...selectedLabour, interiorLabour: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                    >
                      <option value="">-- Select Interior Labour Rate --</option>
                      {labourRatesList.filter(r => r.application === 'INTERIOR').map(r => (
                        <option key={r._id} value={r._id}>{r.workType} [₹{r.pricePerSqft}/sq.ft]</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Exterior Labour */}
                {property.exteriorArea > 0 && (
                  <div className="p-5 border-2 border-gray-150 rounded-2xl space-y-3 bg-gray-50/50">
                    <span className="text-sm font-bold text-gray-850 block">Exterior Labour (Applied Area: {property.exteriorArea} sq.ft)</span>
                    <select
                      disabled={isReadOnly}
                      value={selectedLabour.exteriorLabour}
                      onChange={e => setSelectedLabour({ ...selectedLabour, exteriorLabour: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-850 outline-none text-sm font-semibold"
                    >
                      <option value="">-- Select Exterior Labour Rate --</option>
                      {labourRatesList.filter(r => r.application === 'EXTERIOR').map(r => (
                        <option key={r._id} value={r._id}>{r.workType} [₹{r.pricePerSqft}/sq.ft]</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 7: Additional Charges */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                    <span>⚡</span> Step 7: Optional Charges
                  </h2>
                  <p className="text-sm text-gray-400 font-semibold mt-1">Add optional charges like Scaffolding, Wall Repair, or Transportation.</p>
                </div>
                {!isReadOnly && (
                  <button
                    onClick={() => setAdditionalCharges([...additionalCharges, { title: 'Transportation', amount: 0, remarks: '' }])}
                    className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md"
                  >
                    <FiPlus className="w-3.5 h-3.5" /> Add Charge
                  </button>
                )}
              </div>

              {additionalCharges.length === 0 ? (
                <div className="p-8 text-center text-gray-400 font-bold border-2 border-dashed border-gray-200 rounded-2xl">
                  No additional charges added. Click "Add Charge" to customize.
                </div>
              ) : (
                <div className="space-y-3">
                  {additionalCharges.map((item, idx) => (
                    <div key={idx} className="p-4 border-2 border-gray-150 rounded-2xl flex flex-col md:flex-row items-center gap-3 bg-gray-50/50">
                      <select
                        disabled={isReadOnly}
                        value={item.title}
                        onChange={e => {
                          const updated = [...additionalCharges];
                          updated[idx].title = e.target.value;
                          setAdditionalCharges(updated);
                        }}
                        className="w-full md:w-48 border border-gray-250 rounded-xl px-3 py-2 bg-white text-gray-800 outline-none text-sm font-semibold"
                      >
                        <option value="Transportation">Transportation</option>
                        <option value="Scaffolding">Scaffolding</option>
                        <option value="Furniture Protection">Furniture Protection</option>
                        <option value="Wall Repair">Wall Repair</option>
                        <option value="Texture Work">Texture Work</option>
                        <option value="Cleaning">Cleaning</option>
                        <option value="Other">Other</option>
                      </select>

                      <input
                        disabled={isReadOnly}
                        type="number"
                        min="0"
                        placeholder="₹ Amount"
                        value={item.amount || ''}
                        onChange={e => {
                          const updated = [...additionalCharges];
                          updated[idx].amount = Number(e.target.value) || 0;
                          setAdditionalCharges(updated);
                        }}
                        className="w-full md:w-32 border border-gray-250 rounded-xl px-3 py-2 text-gray-800 outline-none text-sm font-bold text-center"
                      />

                      <input
                        disabled={isReadOnly}
                        type="text"
                        placeholder="Remarks / details..."
                        value={item.remarks}
                        onChange={e => {
                          const updated = [...additionalCharges];
                          updated[idx].remarks = e.target.value;
                          setAdditionalCharges(updated);
                        }}
                        className="flex-1 w-full border border-gray-250 rounded-xl px-3 py-2 text-gray-850 outline-none text-sm font-semibold"
                      />

                      {!isReadOnly && (
                        <button
                          onClick={() => setAdditionalCharges(additionalCharges.filter((_, i) => i !== idx))}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <FiTrash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 8: Review Quotation */}
          {step === 7 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                  <span>📊</span> Step 8: Review Quotation
                </h2>
                <p className="text-sm text-gray-400 font-semibold mt-1">Review live quotation pricing. Adjust discounts if permitted.</p>
              </div>

              {/* Cost Summary card */}
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 text-white shadow-xl">
                <h3 className="text-xs font-bold uppercase tracking-widest text-orange-400 mb-4">Quotation Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="opacity-70 font-semibold">Material Cost</span>
                    <span className="font-extrabold text-base">₹{calculated.materialCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="opacity-70 font-semibold">Labour Cost</span>
                    <span className="font-extrabold text-base">₹{calculated.labourCost.toLocaleString()}</span>
                  </div>
                  {calculated.additionalCharges > 0 && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="opacity-70 font-semibold">Additional Charges</span>
                      <span className="font-extrabold text-base">₹{calculated.additionalCharges.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="h-px bg-white/10 my-3"></div>

                  <div className="flex justify-between items-center text-sm">
                    <span className="opacity-70 font-semibold">Discount</span>
                    <span className="font-extrabold text-emerald-400">-₹{calculated.discount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="opacity-70 font-semibold">GST (18%)</span>
                    <span className="font-extrabold text-base">₹{calculated.gst.toLocaleString()}</span>
                  </div>

                  <div className="border-t border-white/20 pt-4 mt-3 flex justify-between items-end">
                    <div>
                      <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest block mb-0.5">Grand Total</span>
                      <span className="text-3xl font-black">₹{calculated.grandTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Adjust Discounts */}
              <div className="p-5 border-2 border-gray-150 rounded-3xl space-y-4">
                <span className="text-sm font-bold text-gray-800 block">Apply Discount</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Discount Type</label>
                    <div className="flex border border-gray-250 rounded-xl overflow-hidden font-bold text-xs">
                      {['NONE', 'FLAT', 'PERCENTAGE'].map(t => (
                        <button
                          key={t}
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => setDiscount({ ...discount, type: t, value: 0 })}
                          className={`flex-1 py-3 text-center transition-all ${
                            discount.type === t 
                              ? 'bg-orange-500 text-white' 
                              : 'bg-white text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {t === 'NONE' ? 'None' : t === 'FLAT' ? 'Flat' : '%'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {discount.type !== 'NONE' && (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Discount Value</label>
                        <div className="flex items-center border border-gray-250 rounded-xl px-3 bg-white">
                          {discount.type === 'FLAT' ? <FiDollarSign className="text-gray-400 w-4 h-4 mr-1" /> : null}
                          <input
                            disabled={isReadOnly}
                            type="number"
                            min="0"
                            value={discount.value || ''}
                            onChange={e => setDiscount({ ...discount, value: Number(e.target.value) || 0 })}
                            placeholder="0"
                            className="w-full py-2 bg-transparent text-sm font-bold text-gray-800 outline-none"
                          />
                          {discount.type === 'PERCENTAGE' ? <FiPercent className="text-gray-400 w-4 h-4 ml-1" /> : null}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 md:col-span-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Reason / Remarks</label>
                        <input
                          disabled={isReadOnly}
                          type="text"
                          value={discount.reason}
                          onChange={e => setDiscount({ ...discount, reason: e.target.value })}
                          placeholder="e.g. Festival Season offer"
                          className="w-full border border-gray-250 rounded-xl px-3 py-2 bg-white text-sm font-semibold text-gray-800 outline-none"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-4">
                <span className="text-sm font-bold text-gray-850 block">Detailed Items Breakdown</span>
                
                {/* Products table */}
                <div className="border border-gray-150 rounded-2xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-150 font-bold text-xs text-gray-500 uppercase tracking-wider">
                    Selected Products (Materials)
                  </div>
                  {calculated.products.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-400">No products selected.</div>
                  ) : (
                    <div className="divide-y divide-gray-100 text-sm">
                      {calculated.products.map((p, idx) => (
                        <div key={idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <div>
                            <span className="font-extrabold text-gray-800 block">{p.label}</span>
                            <span className="text-xs text-gray-400 font-semibold">{p.productName} ({p.productCode}) • Pack: {p.selectedPackSize?.size} {p.selectedPackSize?.unit}</span>
                          </div>
                          <div className="flex items-center gap-6 text-right">
                            <div className="text-xs font-semibold text-gray-400">
                              <div>Required: {p.quantityRequired} Unit</div>
                              <div>Purchased: {p.quantityPurchased} Pack</div>
                            </div>
                            <div className="font-bold text-gray-800">
                              ₹{p.subtotal.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Labour list */}
                <div className="border border-gray-150 rounded-2xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-150 font-bold text-xs text-gray-500 uppercase tracking-wider">
                    Labour Services
                  </div>
                  {calculated.labour.length === 0 ? (
                    <div className="p-4 text-center text-xs text-gray-400">No labour rates selected.</div>
                  ) : (
                    <div className="divide-y divide-gray-100 text-sm">
                      {calculated.labour.map((l, idx) => (
                        <div key={idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <div>
                            <span className="font-extrabold text-gray-800 block">{l.label}</span>
                            <span className="text-xs text-gray-400 font-semibold">Service Mode: {l.workType} • Rate: ₹{l.pricePerSqFt}/sq.ft</span>
                          </div>
                          <div className="flex items-center gap-6 text-right">
                            <div className="text-xs font-semibold text-gray-400">
                              Area: {l.area} sq.ft
                            </div>
                            <div className="font-bold text-gray-800">
                              ₹{l.subtotal.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 9: Submit to Admin */}
          {step === 8 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
                  <span>📤</span> Step 9: Submit to Admin
                </h2>
                <p className="text-sm text-gray-400 font-semibold mt-1">Review finalized remarks, upload property inspection attachments, and submit to Admin.</p>
              </div>

              {/* Remarks */}
              <div className="space-y-4">
                <span className="text-sm font-bold text-gray-800 block">Quotation Remarks</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500">Vendor Internal Remarks</label>
                    <textarea
                      disabled={isReadOnly}
                      rows={3}
                      value={remarks.vendorRemarks}
                      onChange={e => setRemarks({ ...remarks, vendorRemarks: e.target.value })}
                      placeholder="Visible to Admin and vendor only..."
                      className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-xl px-4 py-3 text-sm font-semibold outline-none bg-white resize-none text-gray-850"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500">Customer Remarks</label>
                    <textarea
                      disabled={isReadOnly}
                      rows={3}
                      value={remarks.customerRemarks}
                      onChange={e => setRemarks({ ...remarks, customerRemarks: e.target.value })}
                      placeholder="Notes or conditions to display on customer quotation..."
                      className="w-full border-2 border-gray-200 focus:border-orange-400 rounded-xl px-4 py-3 text-sm font-semibold outline-none bg-white resize-none text-gray-850"
                    />
                  </div>
                </div>
              </div>

              {/* Attachments Section */}
              <div className="space-y-4">
                <span className="text-sm font-bold text-gray-800 block">Property Attachments</span>
                
                {['inspectionPhotos', 'beforePhotos', 'referenceImages'].map(field => (
                  <div key={field} className="p-5 border border-gray-150 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-500 uppercase">
                        {field === 'inspectionPhotos' ? 'Property Inspection Photos' :
                         field === 'beforePhotos' ? 'Before Work Photos' :
                         'Reference Design Images'}
                      </span>
                      {!isReadOnly && (
                        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1">
                          <FiUploadCloud className="w-3.5 h-3.5" />
                          Upload
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={e => handleMockUpload(field, e)}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    {uploading[field] ? (
                      <div className="flex items-center gap-2 py-4 justify-center">
                        <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-gray-400 font-bold">Uploading files...</span>
                      </div>
                    ) : attachments[field].length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No photos uploaded yet.</p>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {attachments[field].map((url, idx) => (
                          <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200">
                            <img src={url} alt="attachment" className="w-full h-full object-cover" />
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={() => handleRemoveAttachment(field, idx)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex gap-3 border-t border-gray-100 pt-6 mt-6">
            <button
              onClick={goBack}
              className="px-5 py-3 border-2 border-gray-250 hover:bg-gray-50 rounded-2xl text-sm font-bold text-gray-500 transition-all"
            >
              Back
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-1 shadow-lg shadow-orange-100"
              >
                Next Step <FiArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting || isReadOnly}
                onClick={handleSubmitToAdmin}
                className={`flex-1 font-bold py-3.5 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 text-white shadow-xl ${
                  submitting || isReadOnly
                    ? 'bg-orange-300 cursor-not-allowed shadow-none'
                    : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200 hover:scale-[1.01]'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FiFileText className="w-4 h-4" /> Submit to Admin
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default VendorQuoteWizard;
