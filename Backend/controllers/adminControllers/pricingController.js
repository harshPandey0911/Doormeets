const PricingConfig = require('../../models/PricingConfig');
const Category = require('../../models/Category');
const SubCategory = require('../../models/SubCategory');
const Service = require('../../models/Service');
const Brand = require('../../models/Brand');
const Zone = require('../../models/Zone');
const Settings = require('../../models/Settings');
const { validationResult } = require('express-validator');

// Helper to calculate pricing fields live using the new Price Matrix model
const calculatePricingDetails = (
  customerPrice,
  gstPercentage,
  gstIncluded,
  platformCommission,
  l1Commission,
  l2Commission,
  l3Commission,
  vendorPayoutBase = 0,
  vendorSgstPercentage = 2.5,
  vendorCgstPercentage = 2.5,
  vendorTdsPercentage = 0,
  commissionPercentage = 10
) => {
  const price = Number(customerPrice) || 0;
  const gstPct = Number(gstPercentage) || 0;
  const vPayoutBase = Number(vendorPayoutBase) || 0;
  const vSgstPct = Number(vendorSgstPercentage) || 0;
  const vCgstPct = Number(vendorCgstPercentage) || 0;
  const vTdsPct = Number(vendorTdsPercentage) || 0;
  const vCommPct = Number(commissionPercentage) || 0;

  // 1. Admin/Company Gross Margin
  const adminGrossMargin = Math.max(0, price - vPayoutBase);
  let adminTaxableBase = 0;
  let adminGstAmount = 0;

  if (gstIncluded) {
    adminGstAmount = adminGrossMargin * (gstPct / 100);
    adminTaxableBase = adminGrossMargin - adminGstAmount;
  } else {
    adminTaxableBase = adminGrossMargin;
    adminGstAmount = adminGrossMargin * (gstPct / 100);
  }

  // 2. Vendor Payout Breakdown
  const sgstAmount = vPayoutBase * (vSgstPct / 100);
  const cgstAmount = vPayoutBase * (vCgstPct / 100);
  const tdsAmount = vPayoutBase * (vTdsPct / 100);
  
  // Remaining Base after taxes & TDS
  const remainingBase = Math.max(0, vPayoutBase - sgstAmount - cgstAmount - tdsAmount);
  
  // Platform Commission deducted from Remaining Base
  const platformCommAmt = remainingBase * (vCommPct / 100);
  const netVendorPayout = Math.max(0, remainingBase - platformCommAmt);

  // For multi-level commission preview (using level percentages if configured)
  const l1Pct = Number(l1Commission) || 0;
  const l2Pct = Number(l2Commission) || 0;
  const l3Pct = Number(l3Commission) || 0;

  const l1CommAmount = remainingBase * (l1Pct / 100);
  const l2CommAmount = remainingBase * (l2Pct / 100);
  const l3CommAmount = remainingBase * (l3Pct / 100);

  const vendorFinalPayoutL1 = Math.max(0, remainingBase - l1CommAmount);
  const vendorFinalPayoutL2 = Math.max(0, remainingBase - l2CommAmount);
  const vendorFinalPayoutL3 = Math.max(0, remainingBase - l3CommAmount);

  return {
    customerPrice: price,
    gstPercentage: gstPct,
    gstIncluded,
    vendorPayoutBase: vPayoutBase,
    vendorSgstPercentage: vSgstPct,
    vendorCgstPercentage: vCgstPct,
    vendorTdsPercentage: vTdsPct,
    commissionPercentage: vCommPct,

    adminGrossMargin: Number(adminGrossMargin.toFixed(2)),
    adminTaxableBase: Number(adminTaxableBase.toFixed(2)),
    adminGstAmount: Number(adminGstAmount.toFixed(2)),
    
    sgstAmount: Number(sgstAmount.toFixed(2)),
    cgstAmount: Number(cgstAmount.toFixed(2)),
    tdsAmount: Number(tdsAmount.toFixed(2)),
    remainingBase: Number(remainingBase.toFixed(2)),
    platformCommissionAmount: Number(platformCommAmt.toFixed(2)),
    vendorShare: Number(netVendorPayout.toFixed(2)), // Net payout

    l1CommAmount: Number(l1CommAmount.toFixed(2)),
    l2CommAmount: Number(l2CommAmount.toFixed(2)),
    l3CommAmount: Number(l3CommAmount.toFixed(2)),
    vendorFinalPayoutL1: Number(vendorFinalPayoutL1.toFixed(2)),
    vendorFinalPayoutL2: Number(vendorFinalPayoutL2.toFixed(2)),
    vendorFinalPayoutL3: Number(vendorFinalPayoutL3.toFixed(2)),

    adminNetProfitL1: Number((adminTaxableBase + l1CommAmount).toFixed(2)),
    adminNetProfitL2: Number((adminTaxableBase + l2CommAmount).toFixed(2)),
    adminNetProfitL3: Number((adminTaxableBase + l3CommAmount).toFixed(2))
  };
};

exports.createPricing = async (req, res) => {
  try {
    console.log('📌 [Backend createPricing] Received payload:', JSON.stringify(req.body, null, 2));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ [Backend createPricing] Validation errors:', errors.array());
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const isValidId = id => id && typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

    if (!isValidId(req.body.brandId)) req.body.brandId = null;
    if (!isValidId(req.body.subCategoryId)) req.body.subCategoryId = null;
    if (!isValidId(req.body.cityId)) req.body.cityId = null;
    if (!isValidId(req.body.zoneId)) req.body.zoneId = null;
    if (!isValidId(req.body.variantId)) req.body.variantId = null;
    if (!isValidId(req.body.categoryId)) {
      if (req.body.categoryId && typeof req.body.categoryId === 'object') {
        req.body.categoryId = req.body.categoryId._id || req.body.categoryId.id || null;
      }
    }
    if (!isValidId(req.body.serviceId)) {
      if (req.body.serviceId && typeof req.body.serviceId === 'object') {
        req.body.serviceId = req.body.serviceId._id || req.body.serviceId.id || null;
      }
    }

    console.log('[CreatePricing] Incoming payload:', {
      serviceId: req.body.serviceId,
      variantId: req.body.variantId,
      categoryId: req.body.categoryId,
      brandId: req.body.brandId,
      zoneId: req.body.zoneId,
      cityId: req.body.cityId,
      customerPrice: req.body.customerPrice
    });

    // Fetch global settings to overwrite commission rates
    let settings = await Settings.findOne({ type: 'global' });
    if (!settings) {
      settings = await Settings.create({ type: 'global' });
    }

    req.body.platformCommission = settings.commissionPercentage !== undefined ? settings.commissionPercentage : 20;
    req.body.l1Commission = (settings.commissionRates && settings.commissionRates.level1 !== undefined) ? settings.commissionRates.level1 : 10;
    req.body.l2Commission = (settings.commissionRates && settings.commissionRates.level2 !== undefined) ? settings.commissionRates.level2 : 15;
    req.body.l3Commission = (settings.commissionRates && settings.commissionRates.level3 !== undefined) ? settings.commissionRates.level3 : 20;

    const category = await Category.findById(req.body.categoryId);
    if (!category) {
      return res.status(400).json({ success: false, message: 'Category not found' });
    }

    if (category.hasSubCategory && !req.body.subCategoryId) {
      return res.status(400).json({ success: false, message: 'Subcategory is required for this category' });
    }

    // Brands check (only required if category supports and requires brands)
    if (category.enableBrands && category.brandRequired && !req.body.brandId) {
      return res.status(400).json({ success: false, message: 'Brand is required for this category' });
    }

    // Category Zone-Inheritance Validation:
    // If zoneId is provided and category has assigned zoneIds, validate that zoneId belongs to assigned zones.
    const catZoneIds = (category.zoneIds || []).map(z => z.toString());
    const inputZoneIds = Array.isArray(req.body.zoneIds) ? req.body.zoneIds.filter(Boolean) : (req.body.zoneId ? [req.body.zoneId] : []);

    if (inputZoneIds.length > 0 && catZoneIds.length > 0) {
      for (const zId of inputZoneIds) {
        if (!catZoneIds.includes(zId.toString())) {
          return res.status(400).json({
            success: false,
            message: `Selected zone ${zId} is not assigned to this Category.`
          });
        }
      }
    }

    // Bulk creation if multiple zoneIds provided
    if (Array.isArray(req.body.zoneIds) && req.body.zoneIds.length > 0) {
      const createdPricings = [];
      for (const zId of req.body.zoneIds) {
        const itemPayload = {
          ...req.body,
          zoneId: zId || null,
          createdBy: req.user.id
        };
        delete itemPayload.zoneIds;

        // Upsert matching existing
        const query = {
          categoryId: itemPayload.categoryId,
          subCategoryId: itemPayload.subCategoryId || null,
          serviceId: itemPayload.serviceId,
          brandId: itemPayload.brandId || null,
          zoneId: itemPayload.zoneId || null,
          variantId: itemPayload.variantId || null,
          packageTitle: itemPayload.packageTitle || null
        };

        let pricingDoc = await PricingConfig.findOne(query);
        if (pricingDoc) {
          Object.assign(pricingDoc, itemPayload);
          await pricingDoc.save();
        } else {
          pricingDoc = await PricingConfig.create(itemPayload);
        }
        createdPricings.push(pricingDoc);
      }

      return res.status(200).json({
        success: true,
        data: createdPricings,
        message: `Successfully saved pricing for ${createdPricings.length} zone(s).`
      });
    }

    const pricing = await PricingConfig.create({
      ...req.body,
      createdBy: req.user.id
    });

    console.log('[CreatePricing] Successfully created pricing:', pricing._id, 'variantId:', pricing.variantId);

    const liveCalculations = calculatePricingDetails(
      pricing.customerPrice,
      pricing.gstPercentage,
      pricing.gstIncluded,
      pricing.platformCommission,
      pricing.l1Commission,
      pricing.l2Commission,
      pricing.l3Commission,
      pricing.vendorPayoutBase,
      pricing.vendorSgstPercentage,
      pricing.vendorCgstPercentage,
      pricing.vendorTdsPercentage,
      // Use platformCommission (the field real bookings are actually settled against in
      // commissionService.js), not the legacy commissionPercentage field — they can diverge.
      pricing.platformCommission
    );

    res.status(201).json({
      success: true, 
      data: pricing,
      calculations: liveCalculations
    });
  } catch (error) {
    if (error.code === 11000) {
      console.error('[CreatePricing] Duplicate key error. Updating existing matching config instead.');
      try {
        const query = {
          categoryId: req.body.categoryId,
          subCategoryId: req.body.subCategoryId || null,
          serviceId: req.body.serviceId,
          brandId: req.body.brandId || null,
          zoneId: req.body.zoneId || null,
          variantId: req.body.variantId || null,
          packageTitle: req.body.packageTitle || null
        };
        const existing = await PricingConfig.findOne(query);
        if (existing) {
          Object.assign(existing, req.body);
          const updatedPricing = await existing.save();
          const calculations = calculatePricingDetails(
            updatedPricing.customerPrice,
            updatedPricing.gstPercentage,
            updatedPricing.gstIncluded,
            updatedPricing.platformCommission,
            updatedPricing.l1Commission,
            updatedPricing.l2Commission,
            updatedPricing.l3Commission,
            updatedPricing.vendorPayoutBase,
            updatedPricing.vendorSgstPercentage,
            updatedPricing.vendorCgstPercentage,
            updatedPricing.vendorTdsPercentage,
            updatedPricing.platformCommission
          );
          return res.status(200).json({
            success: true,
            data: updatedPricing,
            calculations,
            message: 'Existing pricing configuration updated successfully.'
          });
        }
      } catch (upsertErr) {
        console.error('[CreatePricing] Error auto-updating existing pricing:', upsertErr);
      }
      return res.status(400).json({ success: false, message: 'Pricing config already exists for this exact combination.' });
    }
    console.error('Create pricing error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.getAllPricing = async (req, res) => {
  try {
    const filter = {};
    if (req.query.categoryId) filter.categoryId = req.query.categoryId;
    if (req.query.subCategoryId) filter.subCategoryId = req.query.subCategoryId;
    if (req.query.serviceId) filter.serviceId = req.query.serviceId;
    if (req.query.brandId) filter.brandId = req.query.brandId;
    if (req.query.cityId) {
      filter.cityId = req.query.cityId === 'all' ? null : req.query.cityId;
    }
    if (req.query.zoneId) {
      filter.zoneId = req.query.zoneId === 'all' ? null : req.query.zoneId;
    }

    const pricing = await PricingConfig.find(filter)
      .populate('categoryId', 'title')
      .populate('subCategoryId', 'title')
      .populate('serviceId', 'title')
      .populate('brandId', 'title')
      .populate('zoneId', 'name')
      .sort({ createdAt: -1 });

    const calculatedData = pricing.map(item => {
      const calculations = calculatePricingDetails(
        item.customerPrice,
        item.gstPercentage,
        item.gstIncluded,
        item.platformCommission,
        item.l1Commission,
        item.l2Commission,
        item.l3Commission,
        item.vendorPayoutBase,
        item.vendorSgstPercentage,
        item.vendorCgstPercentage,
        item.vendorTdsPercentage,
        item.platformCommission
      );
      return {
        ...item.toObject(),
        calculations
      };
    });

    res.status(200).json({ success: true, data: calculatedData });
  } catch (error) {
    console.error('Get pricing error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updatePricing = async (req, res) => {
  try {
    console.log(`📌 [Backend updatePricing] Updating ID: ${req.params.id}, Payload:`, JSON.stringify(req.body, null, 2));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ [Backend updatePricing] Validation errors:', errors.array());
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const pricingDoc = await PricingConfig.findById(req.params.id);
    if (!pricingDoc) {
      return res.status(404).json({ success: false, message: 'Pricing config not found' });
    }

    const isValidId = id => id && typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id);

    if (!isValidId(req.body.brandId)) req.body.brandId = null;
    if (!isValidId(req.body.subCategoryId)) req.body.subCategoryId = null;
    if (!isValidId(req.body.cityId)) req.body.cityId = null;
    if (!isValidId(req.body.zoneId)) req.body.zoneId = null;
    if (!isValidId(req.body.variantId)) req.body.variantId = null;
    if (!isValidId(req.body.categoryId)) {
      if (req.body.categoryId && typeof req.body.categoryId === 'object') {
        req.body.categoryId = req.body.categoryId._id || req.body.categoryId.id || null;
      }
    }
    if (!isValidId(req.body.serviceId)) {
      if (req.body.serviceId && typeof req.body.serviceId === 'object') {
        req.body.serviceId = req.body.serviceId._id || req.body.serviceId.id || null;
      }
    }

    // Fetch global settings to overwrite commission rates
    let settings = await Settings.findOne({ type: 'global' });
    if (!settings) {
      settings = await Settings.create({ type: 'global' });
    }

    req.body.platformCommission = settings.commissionPercentage !== undefined ? settings.commissionPercentage : 20;
    req.body.l1Commission = (settings.commissionRates && settings.commissionRates.level1 !== undefined) ? settings.commissionRates.level1 : 10;
    req.body.l2Commission = (settings.commissionRates && settings.commissionRates.level2 !== undefined) ? settings.commissionRates.level2 : 15;
    req.body.l3Commission = (settings.commissionRates && settings.commissionRates.level3 !== undefined) ? settings.commissionRates.level3 : 20;

    const categoryId = req.body.categoryId || pricingDoc.categoryId;
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(400).json({ success: false, message: 'Category not found' });
    }

    const subCategoryId = req.body.hasOwnProperty('subCategoryId') ? req.body.subCategoryId : pricingDoc.subCategoryId;
    if (category.hasSubCategory && !subCategoryId) {
      return res.status(400).json({ success: false, message: 'Subcategory is required for this category' });
    }

    const brandId = req.body.hasOwnProperty('brandId') ? req.body.brandId : pricingDoc.brandId;
    if (category.enableBrands && category.brandRequired && !brandId) {
      return res.status(400).json({ success: false, message: 'Brand is required for this category' });
    }

    const catZoneIds = (category.zoneIds || []).map(z => z.toString());
    const zoneId = req.body.hasOwnProperty('zoneId') ? req.body.zoneId : pricingDoc.zoneId;
    if (zoneId && catZoneIds.length > 0) {
      if (!catZoneIds.includes(zoneId.toString())) {
        return res.status(400).json({
          success: false,
          message: 'Selected zone is not assigned to this Category.'
        });
      }
    }

    Object.assign(pricingDoc, req.body);
    const pricing = await pricingDoc.save();

    const calculations = calculatePricingDetails(
      pricing.customerPrice,
      pricing.gstPercentage,
      pricing.gstIncluded,
      pricing.platformCommission,
      pricing.l1Commission,
      pricing.l2Commission,
      pricing.l3Commission,
      pricing.vendorPayoutBase,
      pricing.vendorSgstPercentage,
      pricing.vendorCgstPercentage,
      pricing.vendorTdsPercentage,
      pricing.platformCommission
    );

    res.status(200).json({
      success: true, 
      data: pricing,
      calculations
    });
  } catch (error) {
    if (error.code === 11000) {
      console.error('[UpdatePricing] Duplicate key error. keyPattern:', error.keyPattern, 'keyValue:', error.keyValue);
      return res.status(400).json({ success: false, message: 'Pricing config already exists for this exact combination.' });
    }
    console.error('Update pricing error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.deletePricing = async (req, res) => {
  try {
    const pricing = await PricingConfig.findByIdAndDelete(req.params.id);
    if (!pricing) {
      return res.status(404).json({ success: false, message: 'Pricing not found' });
    }
    res.status(200).json({ success: true, message: 'Pricing deleted' });
  } catch (error) {
    console.error('Delete pricing error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
