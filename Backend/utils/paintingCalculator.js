const PaintProduct = require('../models/PaintProduct');
const LabourRate = require('../models/LabourRate');

/**
 * Helper to compute all dynamic calculations for painting quotations.
 * Can be shared by both Vendor and Admin modules.
 */
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
    
    // Support admin manual quantity overrides (quantityRequired)
    const quantityRequired = item.quantityRequired !== undefined 
      ? Number(item.quantityRequired) 
      : parseFloat((appliedArea / coverageVal).toFixed(2));
    
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
    
    // Support admin custom rate/workType overrides
    const pricePerSqFt = item.pricePerSqFt !== undefined 
      ? Number(item.pricePerSqFt) 
      : labourRate.pricePerSqft;
      
    const subtotal = parseFloat((area * pricePerSqFt).toFixed(2));

    labour.push({
      labourRateId: labourRate._id,
      workType: item.workType || labourRate.workType,
      pricePerSqFt,
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

module.exports = {
  computeQuotationDetails
};
