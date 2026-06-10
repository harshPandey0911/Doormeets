const PricingConfig = require('../../models/PricingConfig');
const Category = require('../../models/Category');
const Settings = require('../../models/Settings');
const { validationResult } = require('express-validator');

// Helper to calculate pricing fields live
const calculatePricingDetails = (customerPrice, gstPercentage, gstIncluded, platformCommission, l1Commission, l2Commission, l3Commission) => {
  const price = Number(customerPrice) || 0;
  const gstPct = Number(gstPercentage) || 0;
  const platCommPct = Number(platformCommission) || 0;
  const l1Pct = Number(l1Commission) || 0;
  const l2Pct = Number(l2Commission) || 0;
  const l3Pct = Number(l3Commission) || 0;

  let totalCustomerPay = 0;
  let vendorShareInclusive = 0;
  let platformFeeInclusive = 0;

  if (gstIncluded) {
    totalCustomerPay = price;
    platformFeeInclusive = price * (platCommPct / 100);
    vendorShareInclusive = price - platformFeeInclusive;
  } else {
    const platformBase = price * (platCommPct / 100);
    const vendorBase = price - platformBase;
    const platformGST = platformBase * (gstPct / 100);
    const vendorGST = vendorBase * 0.05; // 5% Vendor GST (2.5% CGST + 2.5% SGST)

    platformFeeInclusive = platformBase + platformGST;
    vendorShareInclusive = vendorBase + vendorGST;
    totalCustomerPay = platformFeeInclusive + vendorShareInclusive;
  }

  const platformTaxableBase = platformFeeInclusive / (1 + (gstPct / 100));
  const platformGstAmount = platformFeeInclusive - platformTaxableBase;

  const vendorTaxableBase = vendorShareInclusive / (1 + 0.05);
  const vendorGstAmount = vendorShareInclusive - vendorTaxableBase;

  const totalTaxableAmount = platformTaxableBase + vendorTaxableBase;
  const totalGstAmount = platformGstAmount + vendorGstAmount;

  const cgstAmount = (platformGstAmount / 2) + (vendorGstAmount / 2);
  const sgstAmount = (platformGstAmount / 2) + (vendorGstAmount / 2);

  const l1CommAmount = vendorShareInclusive * (l1Pct / 100);
  const l2CommAmount = vendorShareInclusive * (l2Pct / 100);
  const l3CommAmount = vendorShareInclusive * (l3Pct / 100);

  const vendorFinalPayoutL1 = vendorShareInclusive - l1CommAmount;
  const vendorFinalPayoutL2 = vendorShareInclusive - l2CommAmount;
  const vendorFinalPayoutL3 = vendorShareInclusive - l3CommAmount;

  const adminNetProfitL1 = platformTaxableBase + l1CommAmount;
  const adminNetProfitL2 = platformTaxableBase + l2CommAmount;
  const adminNetProfitL3 = platformTaxableBase + l3CommAmount;

  return {
    customerPrice: price,
    gstPercentage: gstPct,
    gstIncluded,
    platformCommission: platCommPct,
    l1Commission: l1Pct,
    l2Commission: l2Pct,
    l3Commission: l3Pct,
    
    finalCustomerPrice: Number(totalCustomerPay.toFixed(2)),
    taxableAmount: Number(totalTaxableAmount.toFixed(2)),
    gstAmount: Number(totalGstAmount.toFixed(2)),
    cgstAmount: Number(cgstAmount.toFixed(2)),
    sgstAmount: Number(sgstAmount.toFixed(2)),
    platformCommissionAmount: Number(platformFeeInclusive.toFixed(2)),
    vendorShare: Number(vendorShareInclusive.toFixed(2)),
    
    l1CommAmount: Number(l1CommAmount.toFixed(2)),
    l2CommAmount: Number(l2CommAmount.toFixed(2)),
    l3CommAmount: Number(l3CommAmount.toFixed(2)),
    
    vendorFinalPayoutL1: Number(vendorFinalPayoutL1.toFixed(2)),
    vendorFinalPayoutL2: Number(vendorFinalPayoutL2.toFixed(2)),
    vendorFinalPayoutL3: Number(vendorFinalPayoutL3.toFixed(2)),
    
    adminNetProfitL1: Number(adminNetProfitL1.toFixed(2)),
    adminNetProfitL2: Number(adminNetProfitL2.toFixed(2)),
    adminNetProfitL3: Number(adminNetProfitL3.toFixed(2))
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

    const liveCalculations = calculatePricingDetails(
      pricing.customerPrice,
      pricing.gstPercentage,
      pricing.gstIncluded,
      pricing.platformCommission,
      pricing.l1Commission,
      pricing.l2Commission,
      pricing.l3Commission
    );

    res.status(201).json({ 
      success: true, 
      data: pricing,
      calculations: liveCalculations
    });
  } catch (error) {
    if (error.code === 11000) {
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
        item.l3Commission
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
      pricing.l3Commission
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
