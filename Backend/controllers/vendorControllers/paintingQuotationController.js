const PaintingQuotation = require('../../models/PaintingQuotation');
const PaintingConsultation = require('../../models/PaintingConsultation');
const PaintProduct = require('../../models/PaintProduct');
const LabourRate = require('../../models/LabourRate');

// Helper to compute all dynamic calculations
const computeQuotationDetails = async (property, productsInput = [], labourInput = [], additionalChargesInput = [], discountInput = {}, gstPercentage = 18) => {
  let materialCost = 0;
  let labourCost = 0;
  let additionalChargesCost = 0;
  
  let paintQuantity = 0;
  let primerQuantity = 0;
  let puttyQuantity = 0;

  // 1. Process Product Snapshots
  const products = [];
  for (const item of productsInput) {
    const product = await PaintProduct.findOne({ _id: item.productId, isDeleted: false, status: true });
    if (!product) {
      throw new Error(`Product not found or inactive: ${item.productId}`);
    }

    const coverageVal = product.coverage?.value || 1;
    const appliedArea = Number(item.appliedArea) || 0;
    
    // quantityRequired = appliedArea / coverage
    const quantityRequired = parseFloat((appliedArea / coverageVal).toFixed(2));
    
    // Find selected pack size details
    const selectedSize = item.selectedPackSize?.size || 1;
    const selectedUnit = item.selectedPackSize?.unit || 'Litre';
    
    // quantityPurchased = Math.ceil(quantityRequired / selectedPackSize)
    const quantityPurchased = Math.ceil(quantityRequired / selectedSize);
    
    // subtotal = quantityRequired * unitPrice
    const subtotal = parseFloat((quantityRequired * product.price).toFixed(2));

    products.push({
      productId: product._id,
      brandId: product.brandId,
      productName: product.productName,
      productCode: product.productCode,
      productType: product.productType,
      selectedPackSize: {
        size: selectedSize,
        unit: selectedUnit
      },
      coverage: coverageVal,
      unitPrice: product.price,
      quantityRequired,
      quantityPurchased,
      subtotal,
      appliedArea
    });

    materialCost += subtotal;

    // Track total quantities by type
    if (product.productType === 'Paint') paintQuantity += quantityRequired;
    if (product.productType === 'Primer') primerQuantity += quantityRequired;
    if (product.productType === 'Putty') puttyQuantity += quantityRequired;
  }

  // 2. Process Labour Snapshots
  const labour = [];
  for (const item of labourInput) {
    const labourRate = await LabourRate.findOne({ _id: item.labourRateId, status: true });
    if (!labourRate) {
      throw new Error(`Labour rate not found or inactive: ${item.labourRateId}`);
    }

    const area = Number(item.area) || 0;
    const subtotal = parseFloat((area * labourRate.pricePerSqft).toFixed(2));

    labour.push({
      labourRateId: labourRate._id,
      workType: labourRate.workType,
      pricePerSqFt: labourRate.pricePerSqft,
      area,
      subtotal
    });

    labourCost += subtotal;
  }

  // 3. Process Additional Charges
  const additionalCharges = additionalChargesInput.map(item => {
    const amount = Number(item.amount) || 0;
    additionalChargesCost += amount;
    return {
      title: item.title,
      amount,
      remarks: item.remarks || ''
    };
  });

  // 4. Calculate Discount
  const discountType = discountInput.type || 'NONE';
  const discountVal = Number(discountInput.value) || 0;
  const discountReason = discountInput.reason || '';
  
  const baseTotal = materialCost + labourCost + additionalChargesCost;
  let discountAmount = 0;
  if (discountType === 'PERCENTAGE') {
    discountAmount = parseFloat((baseTotal * (discountVal / 100)).toFixed(2));
  } else if (discountType === 'FLAT') {
    discountAmount = Math.min(baseTotal, discountVal);
  }

  // 5. Calculate GST
  const taxableAmount = Math.max(0, baseTotal - discountAmount);
  const gstPct = Number(gstPercentage) || 0;
  const gstAmount = parseFloat((taxableAmount * (gstPct / 100)).toFixed(2));

  // 6. Grand Total
  const grandTotal = parseFloat((taxableAmount + gstAmount).toFixed(2));

  return {
    products,
    labour,
    additionalCharges,
    discount: {
      type: discountType,
      value: discountVal,
      reason: discountReason
    },
    gst: {
      gstPercentage: gstPct,
      gstAmount
    },
    summary: {
      materialCost: parseFloat(materialCost.toFixed(2)),
      labourCost: parseFloat(labourCost.toFixed(2)),
      additionalCharges: parseFloat(additionalChargesCost.toFixed(2)),
      discount: parseFloat(discountAmount.toFixed(2)),
      gst: parseFloat(gstAmount.toFixed(2)),
      grandTotal: parseFloat(grandTotal.toFixed(2))
    },
    // Quantities for legacy compatibility or summaries
    paintQuantity: parseFloat(paintQuantity.toFixed(2)),
    primerQuantity: parseFloat(primerQuantity.toFixed(2)),
    puttyQuantity: parseFloat(puttyQuantity.toFixed(2))
  };
};

// GET /api/vendor/painting/quotations/:consultationId
exports.getQuotationByConsultationId = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const vendorId = req.user.id;

    const quotation = await PaintingQuotation.findOne({ consultationId, vendorId })
      .populate('products.productId')
      .populate('labour.labourRateId');

    res.status(200).json({
      success: true,
      data: quotation || null
    });
  } catch (error) {
    console.error('Error fetching quotation by consultation ID:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch quotation', error: error.message });
  }
};

// POST /api/vendor/painting/quotations
exports.createQuotation = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const {
      consultationId,
      property,
      products,
      labour,
      additionalCharges,
      discount,
      gstPercentage = 18,
      remarks,
      attachments
    } = req.body;

    if (!consultationId) {
      return res.status(400).json({ success: false, message: 'Consultation ID is required.' });
    }

    const consultation = await PaintingConsultation.findOne({ _id: consultationId, vendorId });
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found or not accepted by this vendor.' });
    }

    // Run dynamic calculations
    const calculations = await computeQuotationDetails(
      property,
      products,
      labour,
      additionalCharges,
      discount,
      gstPercentage
    );

    // Keep legacy fields populated for backup
    const legacyCalculation = {
      paintCost: calculations.summary.materialCost,
      puttyCost: calculations.puttyQuantity * 15, // estimation
      primerCost: calculations.primerQuantity * 20, // estimation
      labourCost: calculations.summary.labourCost,
      additionalServicesCost: calculations.summary.additionalCharges,
      discount: calculations.summary.discount,
      gst: calculations.summary.gst,
      grandTotal: calculations.summary.grandTotal
    };

    const quotation = await PaintingQuotation.create({
      consultationId,
      customerId: consultation.userId,
      vendorId,
      status: 'DRAFT',
      property,
      products: calculations.products,
      labour: calculations.labour,
      additionalCharges: calculations.additionalCharges,
      discount: calculations.discount,
      gst: calculations.gst,
      summary: calculations.summary,
      remarks: remarks || {},
      attachments: attachments || {},
      
      // Legacy backups
      interiorArea: property?.interiorArea || 0,
      exteriorArea: property?.exteriorArea || 0,
      calculation: legacyCalculation
    });

    // Update consultation with the draft quotation
    consultation.quotationId = quotation._id;
    await consultation.save();

    res.status(201).json({
      success: true,
      message: 'Quotation draft created successfully',
      data: quotation
    });
  } catch (error) {
    console.error('Error creating quotation draft:', error);
    res.status(500).json({ success: false, message: 'Failed to create quotation draft', error: error.message });
  }
};

// PUT /api/vendor/painting/quotations/:id
exports.updateQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;
    const {
      property,
      products,
      labour,
      additionalCharges,
      discount,
      gstPercentage = 18,
      remarks,
      attachments
    } = req.body;

    const quotation = await PaintingQuotation.findOne({ _id: id, vendorId });
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found.' });
    }

    // Check if quotation is read-only
    if (quotation.status !== 'DRAFT' && quotation.status !== 'ADMIN_REJECTED') {
      return res.status(400).json({
        success: false,
        message: `Quotation is in ${quotation.status} status and cannot be edited.`
      });
    }

    // Run calculations
    const calculations = await computeQuotationDetails(
      property,
      products,
      labour,
      additionalCharges,
      discount,
      gstPercentage
    );

    const legacyCalculation = {
      paintCost: calculations.summary.materialCost,
      puttyCost: calculations.puttyQuantity * 15,
      primerCost: calculations.primerQuantity * 20,
      labourCost: calculations.summary.labourCost,
      additionalServicesCost: calculations.summary.additionalCharges,
      discount: calculations.summary.discount,
      gst: calculations.summary.gst,
      grandTotal: calculations.summary.grandTotal
    };

    // Update fields
    quotation.property = property;
    quotation.products = calculations.products;
    quotation.labour = calculations.labour;
    quotation.additionalCharges = calculations.additionalCharges;
    quotation.discount = calculations.discount;
    quotation.gst = calculations.gst;
    quotation.summary = calculations.summary;
    quotation.remarks = remarks || {};
    quotation.attachments = attachments || {};

    // Legacy updates
    quotation.interiorArea = property?.interiorArea || 0;
    quotation.exteriorArea = property?.exteriorArea || 0;
    quotation.calculation = legacyCalculation;

    await quotation.save();

    res.status(200).json({
      success: true,
      message: 'Quotation draft updated successfully',
      data: quotation
    });
  } catch (error) {
    console.error('Error updating quotation draft:', error);
    res.status(500).json({ success: false, message: 'Failed to update quotation draft', error: error.message });
  }
};

// POST /api/vendor/painting/quotations/:id/submit
exports.submitQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;

    const quotation = await PaintingQuotation.findOne({ _id: id, vendorId });
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found.' });
    }

    if (quotation.status !== 'DRAFT' && quotation.status !== 'ADMIN_REJECTED') {
      return res.status(400).json({
        success: false,
        message: `Quotation cannot be submitted as it is currently in ${quotation.status} status.`
      });
    }

    quotation.status = 'SUBMITTED_TO_ADMIN';
    await quotation.save();

    res.status(200).json({
      success: true,
      message: 'Quotation submitted to Admin for approval.',
      data: quotation
    });
  } catch (error) {
    console.error('Error submitting quotation to admin:', error);
    res.status(500).json({ success: false, message: 'Failed to submit quotation', error: error.message });
  }
};

// GET /api/vendor/painting/products
exports.getProducts = async (req, res) => {
  try {
    const products = await PaintProduct.find({ isDeleted: false, status: true })
      .populate('brandId', 'name code logo')
      .sort({ displayOrder: 1, productName: 1 });

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching products for vendor:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
  }
};

// GET /api/vendor/painting/labour-rates
exports.getLabourRates = async (req, res) => {
  try {
    const rates = await LabourRate.find({ status: true })
      .sort({ workType: 1 });

    res.status(200).json({
      success: true,
      data: rates
    });
  } catch (error) {
    console.error('Error fetching labour rates for vendor:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch labour rates', error: error.message });
  }
};
