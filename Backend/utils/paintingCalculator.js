const PaintProduct = require('../models/PaintProduct');
const LabourRate = require('../models/LabourRate');

/**
 * Resolves the optimal combination of available pack sizes to meet or exceed the required quantity.
 * Minimizes total purchased volume, then minimizes pack count.
 */
function getOptimalPacks(requiredQty, availableSizes) {
  if (!availableSizes || !Array.isArray(availableSizes) || availableSizes.length === 0) {
    return [{ size: 1, count: Math.ceil(requiredQty) }];
  }

  const sizes = availableSizes
    .map(p => (typeof p === 'object' && p !== null) ? Number(p.size) : Number(p))
    .filter(s => !isNaN(s) && s > 0)
    .sort((a, b) => b - a);

  if (sizes.length === 0) {
    return [{ size: 1, count: Math.ceil(requiredQty) }];
  }

  if (requiredQty <= 0) return [];

  let bestCombo = null;
  let bestVolume = Infinity;
  let bestPackCount = Infinity;

  function isBetter(volume, packCount) {
    if (volume < bestVolume - 0.0001) return true;
    if (Math.abs(volume - bestVolume) < 0.0001) {
      return packCount < bestPackCount;
    }
    return false;
  }

  function search(index, currentVolume, currentPackCount, currentCombo) {
    if (currentVolume >= bestVolume + 0.0001 && currentVolume > requiredQty) {
      return;
    }

    if (currentVolume >= requiredQty - 0.0001) {
      if (isBetter(currentVolume, currentPackCount)) {
        bestVolume = currentVolume;
        bestPackCount = currentPackCount;
        bestCombo = { ...currentCombo };
      }
      return;
    }

    if (index >= sizes.length) {
      return;
    }

    const size = sizes[index];
    const maxPacks = Math.ceil((requiredQty - currentVolume) / size);

    for (let count = maxPacks; count >= 0; count--) {
      const nextVolume = currentVolume + count * size;
      const nextPackCount = currentPackCount + count;
      
      currentCombo[size] = count;
      search(index + 1, nextVolume, nextPackCount, currentCombo);
      if (count === 0) {
        delete currentCombo[size];
      }
    }
  }

  search(0, 0, 0, {});

  const result = [];
  if (bestCombo) {
    for (const sizeStr of Object.keys(bestCombo)) {
      const size = parseFloat(sizeStr);
      const count = bestCombo[sizeStr];
      if (count > 0) {
        result.push({ size, count });
      }
    }
  }

  result.sort((a, b) => b.size - a.size);
  return result;
}

/**
 * Centrally manages all painting quotation calculations.
 * Supports versioning and settingsSnapshot integration for financial safety.
 */
const computeQuotationDetails = async (
  property,
  productsInput = [],
  labourInput = [],
  additionalChargesInput = [],
  discountInput = {},
  gstPercentageOverride = null,
  settingsSnapshot = null,
  calculationVersion = '1.1.0',
  options = {}
) => {
  const startTime = Date.now();
  const validationErrors = [];
  const validationWarnings = [];

  // Parse Version
  const activeVersion = calculationVersion || '1.1.0';

  // 1. Initial Centralized Validation
  if (!property) {
    validationErrors.push({ field: 'property', message: 'Property details are required.' });
  } else {
    if (Number(property.interiorArea) < 0) validationErrors.push({ field: 'property.interiorArea', message: 'Interior area cannot be negative.' });
    if (Number(property.exteriorArea) < 0) validationErrors.push({ field: 'property.exteriorArea', message: 'Exterior area cannot be negative.' });
    if (Number(property.ceilingArea) < 0) validationErrors.push({ field: 'property.ceilingArea', message: 'Ceiling area cannot be negative.' });
    if (Number(property.balconyArea) < 0) validationErrors.push({ field: 'property.balconyArea', message: 'Balcony area cannot be negative.' });
  }

  // Batch load active Products & Labour Rates to prevent N+1 queries
  const productIds = (productsInput || []).map(p => p.productId).filter(Boolean);
  const labourRateIds = (labourInput || []).map(l => l.labourRateId).filter(Boolean);

  let productsDb = [];
  let labourRatesDb = [];

  try {
    if (productIds.length > 0) {
      productsDb = await PaintProduct.find({ _id: { $in: productIds } });
    }
    if (labourRateIds.length > 0) {
      labourRatesDb = await LabourRate.find({ _id: { $in: labourRateIds } });
    }
  } catch (err) {
    validationErrors.push({ field: 'db', message: 'Database fetch failed: ' + err.message });
  }

  const productsMap = new Map(productsDb.map(p => [p._id.toString(), p]));
  const labourRatesMap = new Map(labourRatesDb.map(l => [l._id.toString(), l]));

  // Retrieve GST, buffers, rounding, and coats rules from snapshot with backward-compatible defaults
  const snap = settingsSnapshot || {};
  const defaultGst = snap.gstPercentage !== undefined ? Number(snap.gstPercentage) : 18;
  const gstPct = gstPercentageOverride !== null && gstPercentageOverride !== undefined
    ? Number(gstPercentageOverride)
    : defaultGst;

  // Calculation parameters from snapshot
  const paintBufferPercent = snap.paintBuffer !== undefined ? Number(snap.paintBuffer) : 10;
  const primerBufferPercent = snap.primerBuffer !== undefined ? Number(snap.primerBuffer) : 10;
  const puttyBufferPercent = snap.puttyBuffer !== undefined ? Number(snap.puttyBuffer) : 10;
  const wastagePercent = snap.wastagePercent !== undefined ? Number(snap.wastagePercent) : 5;
  const roundingMethod = snap.roundingMethod || 'ROUND_UP';
  const activeLabourMethod = snap.activeLabourMethod || 'PER_SQFT';

  let materialCost = 0;
  let labourCost = 0;
  let additionalChargesCost = 0;

  let paintQuantity = 0;
  let primerQuantity = 0;
  let puttyQuantity = 0;

  const productsResult = [];
  const labourResult = [];

  // Run Calculations
  if (activeVersion === '1.0.0') {
    // --- Legacy Algorithm (v1.0.0) ---
    for (const item of productsInput) {
      const product = productsMap.get(item.productId?.toString());
      if (!product || product.isDeleted) {
        validationErrors.push({ field: 'productId', message: `Product not found or deleted: ${item.productId}` });
        continue;
      }
      if (!product.status) {
        validationWarnings.push({ field: 'productId', message: `Using inactive product: ${product.productName}` });
      }

      const coverageVal = product.coverage?.value || 1;
      const appliedArea = Number(item.appliedArea) || 0;

      const quantityRequired = item.quantityRequired !== undefined
        ? Number(item.quantityRequired)
        : parseFloat((appliedArea / coverageVal).toFixed(2));

      const selectedSize = item.selectedPackSize?.size || 1;
      const selectedUnit = item.selectedPackSize?.unit || 'Litre';
      const quantityPurchased = Math.ceil(quantityRequired / selectedSize);
      const subtotal = parseFloat((quantityRequired * product.price).toFixed(2));

      productsResult.push({
        productId: product._id,
        brandId: product.brandId,
        productName: product.productName,
        productCode: product.productCode,
        productType: product.productType,
        selectedPackSize: { size: selectedSize, unit: selectedUnit },
        coverage: coverageVal,
        unitPrice: product.price,
        quantityRequired,
        quantityPurchased,
        subtotal,
        appliedArea,
        roundingMethodUsed: 'ROUND_UP'
      });

      materialCost += subtotal;

      if (product.productType === 'Paint') paintQuantity += quantityRequired;
      if (product.productType === 'Primer') primerQuantity += quantityRequired;
      if (product.productType === 'Putty') puttyQuantity += quantityRequired;
    }

    for (const item of labourInput) {
      const labourRate = labourRatesMap.get(item.labourRateId?.toString());
      if (!labourRate) {
        validationErrors.push({ field: 'labourRateId', message: `Labour rate not found: ${item.labourRateId}` });
        continue;
      }

      const area = Number(item.area) || 0;
      const pricePerSqFt = item.pricePerSqFt !== undefined ? Number(item.pricePerSqFt) : labourRate.pricePerSqft;
      const subtotal = parseFloat((area * pricePerSqFt).toFixed(2));

      labourResult.push({
        labourRateId: labourRate._id,
        workType: item.workType || labourRate.workType,
        pricePerSqFt,
        area,
        subtotal
      });

      labourCost += subtotal;
    }
  } else {
    // --- Enterprise Snapshot-Driven Algorithm (v1.1.0) ---
    for (const item of productsInput) {
      const product = productsMap.get(item.productId?.toString());
      if (!product || product.isDeleted) {
        validationErrors.push({ field: 'productId', message: `Product not found or deleted: ${item.productId}` });
        continue;
      }
      if (!product.status) {
        validationWarnings.push({ field: 'productId', message: `Using inactive product: ${product.productName}` });
      }

      const coverageVal = product.coverage?.value || 1;
      if (coverageVal <= 0) {
        validationErrors.push({ field: 'coverage', message: `Invalid coverage (zero or negative) for product: ${product.productName}` });
        continue;
      }

      const appliedArea = Number(item.appliedArea) || 0;
      if (appliedArea < 0) {
        validationErrors.push({ field: 'appliedArea', message: `Applied area cannot be negative: ${appliedArea}` });
        continue;
      }

      // Buffer & Wastage Calculations based on Settings Profile snapshot
      let bufferPercent = 0;
      if (product.productType === 'Paint') bufferPercent = paintBufferPercent;
      else if (product.productType === 'Primer') bufferPercent = primerBufferPercent;
      else if (product.productType === 'Putty') bufferPercent = puttyBufferPercent;

      const finalAreaWithBuffer = appliedArea * (1 + bufferPercent / 100);

      // Support manual coats selection from payload, falling back to active snapshot defaults
      const coatsCount = item.coats !== undefined
        ? Number(item.coats)
        : (snap.coatRules?.find(r => r.category === product.productType)?.defaultPaintCoats || 2);

      // Determine required volume/mass (adjusted by coats multiplier)
      const quantityRequired = item.quantityRequired !== undefined
        ? Number(item.quantityRequired)
        : parseFloat(((finalAreaWithBuffer * coatsCount) / coverageVal).toFixed(2));

      const selectedSize = item.selectedPackSize?.size || 1;
      const selectedUnit = item.selectedPackSize?.unit || 'Litre';
      if (selectedSize <= 0) {
        validationErrors.push({ field: 'selectedPackSize', message: `Selected pack size must be greater than zero.` });
        continue;
      }

      // Calculate optimal pack size combination to fulfill the required quantity
      const packBreakdown = getOptimalPacks(quantityRequired, product.availablePackSizes);
      const totalVolumePurchased = packBreakdown.reduce((sum, p) => sum + (p.size * p.count), 0);
      const quantityPurchased = packBreakdown.reduce((sum, p) => sum + p.count, 0);

      // Subtotal is calculated dynamically based on total volume of purchased packs
      const subtotal = parseFloat((totalVolumePurchased * product.price).toFixed(2));

      productsResult.push({
        productId: product._id,
        brandId: product.brandId,
        productName: product.productName,
        productCode: product.productCode,
        productType: product.productType,
        selectedPackSize: { size: selectedSize, unit: selectedUnit },
        coverage: coverageVal,
        unitPrice: product.price,
        quantityRequired,
        quantityPurchased,
        packBreakdown,
        subtotal,
        appliedArea,
        roundingMethodUsed: roundingMethod,
        coats: coatsCount
      });

      materialCost += subtotal;

      if (product.productType === 'Paint') paintQuantity += quantityRequired;
      if (product.productType === 'Primer') primerQuantity += quantityRequired;
      if (product.productType === 'Putty') puttyQuantity += quantityRequired;
    }

    // Extract coats override for each sub-area paint product
    let interiorPaintCoats = 2;
    let exteriorPaintCoats = 2;
    let ceilingPaintCoats = 2;
    let balconyPaintCoats = 2;

    for (const item of productsInput) {
      const prod = productsMap.get(item.productId?.toString());
      if (prod && prod.productType === 'Paint') {
        const itemCoats = item.coats !== undefined ? Number(item.coats) : (snap.coatRules?.find(r => r.category === prod.productType)?.defaultPaintCoats || 2);
        const appliedArea = Number(item.appliedArea) || 0;

        if (appliedArea === Number(property.interiorArea) && Number(property.interiorArea) > 0) {
          interiorPaintCoats = itemCoats;
        } else if (appliedArea === Number(property.exteriorArea) && Number(property.exteriorArea) > 0) {
          exteriorPaintCoats = itemCoats;
        } else if (appliedArea === Number(property.ceilingArea) && Number(property.ceilingArea) > 0) {
          ceilingPaintCoats = itemCoats;
        } else if (appliedArea === Number(property.balconyArea) && Number(property.balconyArea) > 0) {
          balconyPaintCoats = itemCoats;
        }
      }
    }

    // Process Labour snapshot-driven charges
    for (const item of labourInput) {
      const labourRate = labourRatesMap.get(item.labourRateId?.toString());
      if (!labourRate) {
        validationErrors.push({ field: 'labourRateId', message: `Labour rate not found: ${item.labourRateId}` });
        continue;
      }

      const area = Number(item.area) || 0;
      let pricePerSqFt = item.pricePerSqFt !== undefined ? Number(item.pricePerSqFt) : labourRate.pricePerSqft;

      // Apply Premiums from booking settings if requested in options
      let premiumPercent = 0;
      if (options.isEmergency) {
        premiumPercent += snap.emergencyBookingPremiumPercent !== undefined ? Number(snap.emergencyBookingPremiumPercent) : 20;
      }
      if (options.isExpress) {
        premiumPercent += snap.expressBookingPremiumPercent !== undefined ? Number(snap.expressBookingPremiumPercent) : 15;
      }

      if (premiumPercent > 0) {
        pricePerSqFt = parseFloat((pricePerSqFt * (1 + premiumPercent / 100)).toFixed(2));
      }

      // Fetch dynamic coat multipliers
      const multipliers = snap.laborCoatMultipliers || { '1': 0.6, '2': 1.0, '3': 1.3, '4': 1.6 };
      const getMultiplier = (c) => {
        const key = String(c);
        return multipliers[key] !== undefined ? Number(multipliers[key]) : (c === 1 ? 0.6 : c === 2 ? 1.0 : c === 3 ? 1.3 : 1.6);
      };

      let subtotal = 0;
      if (labourRate.application === 'INTERIOR') {
        const intArea = Number(property.interiorArea) || 0;
        const ceilArea = Number(property.ceilingArea) || 0;
        const balcArea = Number(property.balconyArea) || 0;

        const intMult = getMultiplier(interiorPaintCoats);
        const ceilMult = getMultiplier(ceilingPaintCoats);
        const balcMult = getMultiplier(balconyPaintCoats);

        subtotal = parseFloat((
          (intArea * pricePerSqFt * intMult) +
          (ceilArea * pricePerSqFt * ceilMult) +
          (balcArea * pricePerSqFt * balcMult)
        ).toFixed(2));
      } else {
        // EXTERIOR
        const extArea = Number(property.exteriorArea) || 0;
        const extMult = getMultiplier(exteriorPaintCoats);

        subtotal = parseFloat((extArea * pricePerSqFt * extMult).toFixed(2));
      }

      labourResult.push({
        labourRateId: labourRate._id,
        workType: item.workType || labourRate.workType,
        pricePerSqFt,
        area,
        subtotal,
        labourMethodUsed: activeLabourMethod,
        premiumPercentageApplied: premiumPercent
      });

      labourCost += subtotal;
    }
  }

  // 3. Process Additional Charges
  const additionalCharges = (additionalChargesInput || []).map(item => {
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
  const gstAmount = parseFloat((taxableAmount * (gstPct / 100)).toFixed(2));

  // 6. Grand Total
  const grandTotal = parseFloat((taxableAmount + gstAmount).toFixed(2));

  const durationMs = Date.now() - startTime;

  return {
    success: validationErrors.length === 0,
    validationErrors,
    validationWarnings,
    products: productsResult,
    labour: labourResult,
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
    paintQuantity: parseFloat(paintQuantity.toFixed(2)),
    primerQuantity: parseFloat(primerQuantity.toFixed(2)),
    puttyQuantity: parseFloat(puttyQuantity.toFixed(2)),
    audit: {
      calculationVersion: activeVersion,
      calculationTimestamp: new Date(),
      engineVersion: '1.1.0',
      durationMs
    }
  };
};

module.exports = {
  computeQuotationDetails
};
