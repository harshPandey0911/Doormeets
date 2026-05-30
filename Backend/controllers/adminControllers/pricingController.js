const ServiceBrandPricing = require('../../models/ServiceBrandPricing');
const { validationResult } = require('express-validator');

exports.createPricing = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Auto calculate if finalCustomerPrice is not provided
    const { basePrice, gstPercentage, vendorProfit } = req.body;
    let finalCustomerPrice = req.body.finalCustomerPrice;
    let gstAmount = req.body.gstAmount;

    if (req.body.brandId === '') req.body.brandId = null;
    if (req.body.subCategoryId === '') req.body.subCategoryId = null;
    if (req.body.cityId === '' || req.body.cityId === 'all') req.body.cityId = null;

    const Category = require('../../models/Category');
    const category = await Category.findById(req.body.categoryId);
    if (!category) {
      return res.status(400).json({ success: false, message: 'Category not found' });
    }

    if (category.hasSubCategory && !req.body.subCategoryId) {
      return res.status(400).json({ success: false, message: 'Subcategory is required for this category' });
    }

    if (category.hasBrand && !req.body.brandId) {
      return res.status(400).json({ success: false, message: 'Brand is required for this category' });
    }

    if (basePrice !== undefined && gstPercentage !== undefined) {
      if (gstAmount === undefined) {
        gstAmount = (Number(basePrice) * Number(gstPercentage)) / 100;
      }
      if (finalCustomerPrice === undefined) {
        finalCustomerPrice = Number(basePrice) + gstAmount + Number(vendorProfit || 0);
      }
    }

    const pricing = await ServiceBrandPricing.create({
      ...req.body,
      gstAmount,
      finalCustomerPrice,
      createdBy: req.user.id
    });

    res.status(201).json({ success: true, data: pricing });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Pricing matrix already exists for this exact combination.' });
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

    const pricing = await ServiceBrandPricing.find(filter)
      .populate('categoryId', 'title')
      .populate('subCategoryId', 'title')
      .populate('serviceId', 'title')
      .populate('brandId', 'title')
      .populate('cityId', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: pricing });
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

    const pricingDoc = await ServiceBrandPricing.findById(req.params.id);
    if (!pricingDoc) {
      return res.status(404).json({ success: false, message: 'Pricing not found' });
    }

    // Recalculate
    const basePrice = req.body.basePrice !== undefined ? req.body.basePrice : pricingDoc.basePrice;
    const gstPercentage = req.body.gstPercentage !== undefined ? req.body.gstPercentage : pricingDoc.gstPercentage;
    const vendorProfit = req.body.vendorProfit !== undefined ? req.body.vendorProfit : pricingDoc.vendorProfit;
    
    let gstAmount = req.body.gstAmount;
    let finalCustomerPrice = req.body.finalCustomerPrice;

    if (req.body.brandId === '') req.body.brandId = null;
    if (req.body.subCategoryId === '') req.body.subCategoryId = null;
    if (req.body.cityId === '' || req.body.cityId === 'all') req.body.cityId = null;

    const categoryId = req.body.categoryId || pricingDoc.categoryId;
    const Category = require('../../models/Category');
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(400).json({ success: false, message: 'Category not found' });
    }

    const subCategoryId = req.body.hasOwnProperty('subCategoryId') ? req.body.subCategoryId : pricingDoc.subCategoryId;
    if (category.hasSubCategory && !subCategoryId) {
      return res.status(400).json({ success: false, message: 'Subcategory is required for this category' });
    }

    const brandId = req.body.hasOwnProperty('brandId') ? req.body.brandId : pricingDoc.brandId;
    if (category.hasBrand && !brandId) {
      return res.status(400).json({ success: false, message: 'Brand is required for this category' });
    }

    if (req.body.basePrice !== undefined || req.body.gstPercentage !== undefined || req.body.vendorProfit !== undefined) {
      gstAmount = (Number(basePrice) * Number(gstPercentage)) / 100;
      finalCustomerPrice = Number(basePrice) + gstAmount + Number(vendorProfit || 0);
    }

    const updatedData = {
      ...req.body,
      ...(gstAmount !== undefined && { gstAmount }),
      ...(finalCustomerPrice !== undefined && { finalCustomerPrice })
    };

    const pricing = await ServiceBrandPricing.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: pricing });
  } catch (error) {
    console.error('Update pricing error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

exports.deletePricing = async (req, res) => {
  try {
    const pricing = await ServiceBrandPricing.findByIdAndDelete(req.params.id);
    if (!pricing) {
      return res.status(404).json({ success: false, message: 'Pricing not found' });
    }
    res.status(200).json({ success: true, message: 'Pricing deleted' });
  } catch (error) {
    console.error('Delete pricing error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
