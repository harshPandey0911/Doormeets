const PricingConfig = require('../../models/PricingConfig');
const Category = require('../../models/Category');
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    if (req.body.brandId === '') req.body.brandId = null;
    if (req.body.subCategoryId === '') req.body.subCategoryId = null;
    if (req.body.cityId === '' || req.body.cityId === 'all') req.body.cityId = null;
    // Normalize variantId — empty string or falsy → null
    if (!req.body.variantId || req.body.variantId === '') req.body.variantId = null;

    console.log('[CreatePricing] Incoming payload:', {
      serviceId: req.body.serviceId,
      variantId: req.body.variantId,
      categoryId: req.body.categoryId,
      brandId: req.body.brandId,
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
      pricing.commissionPercentage
    );

    res.status(201).json({ 
      success: true, 
      data: pricing,
      calculations: liveCalculations
    });
  } catch (error) {
    if (error.code === 11000) {
      console.error('[CreatePricing] Duplicate key error. keyPattern:', error.keyPattern, 'keyValue:', error.keyValue);
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

    const pricing = await PricingConfig.find(filter)
      .populate('categoryId', 'title')
      .populate('subCategoryId', 'title')
      .populate('serviceId', 'title')
      .populate('brandId', 'title')
      .populate('cityId', 'name')
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
        item.commissionPercentage
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const pricingDoc = await PricingConfig.findById(req.params.id);
    if (!pricingDoc) {
      return res.status(404).json({ success: false, message: 'Pricing config not found' });
    }

    if (req.body.brandId === '') req.body.brandId = null;
    if (req.body.subCategoryId === '') req.body.subCategoryId = null;
    if (req.body.cityId === '' || req.body.cityId === 'all') req.body.cityId = null;

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
      pricing.commissionPercentage
    );

    res.status(200).json({ 
      success: true, 
      data: pricing,
      calculations
    });
  } catch (error) {
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
