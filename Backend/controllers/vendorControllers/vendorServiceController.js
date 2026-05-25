const Vendor = require('../../models/Vendor');
const Category = require('../../models/Category');
const SubCategory = require('../../models/SubCategory');
const Service = require('../../models/Service');
const Brand = require('../../models/Brand');
const ServiceBrandPricing = require('../../models/ServiceBrandPricing');
const VendorServiceMapping = require('../../models/VendorServiceMapping');
const Booking = require('../../models/Booking');
const { validationResult } = require('express-validator');

/**
 * Get all services/categories assigned to the vendor with performance stats
 */
const getMyServices = async (req, res) => {
  try {
    const vendorId = req.user.id;
    console.log('[getMyServices] vendorId:', vendorId);

    // 1. Fetch vendor to get assigned categories
    const vendor = await Vendor.findById(vendorId).select('service categories');
    if (!vendor) {
      console.log('[getMyServices] Vendor not found');
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Combine 'service' and 'categories' arrays (handle legacy data)
    const assignedCategories = Array.from(new Set([...(vendor.service || []), ...(vendor.categories || [])]));
    console.log('[getMyServices] assignedCategories:', assignedCategories);

    if (assignedCategories.length === 0) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // Separate ObjectIds and Names
    const objectIds = [];
    const names = [];
    assignedCategories.forEach(cat => {
      // Check if it's a valid MongoDB ObjectId
      if (/^[0-9a-fA-F]{24}$/.test(cat)) {
        objectIds.push(cat);
      } else {
        names.push(new RegExp(`^${cat}$`, 'i'));
      }
    });

    const query = { status: 'active' };
    if (objectIds.length > 0 && names.length > 0) {
      query.$or = [{ _id: { $in: objectIds } }, { title: { $in: names } }];
    } else if (objectIds.length > 0) {
      query._id = { $in: objectIds };
    } else if (names.length > 0) {
      query.title = { $in: names };
    }

    // 2. Fetch Category details
    const categories = await Category.find(query).select('title imageUrl homeIconUrl description slug');
    
    console.log(`[getMyServices] Found ${categories.length} categories in DB for vendor ${vendorId}`);

    // 3. For each category, calculate performance stats
    const servicesWithStats = await Promise.all(categories.map(async (cat) => {
      // Get booking stats for this specific category and vendor
      const stats = await Booking.aggregate([
        {
          $match: {
            vendorId: vendor._id,
            serviceName: { $regex: new RegExp(cat.title, 'i') } // Rough match by name
          }
        },
        {
          $group: {
            _id: null,
            totalJobs: { $sum: 1 },
            completedJobs: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            totalRating: { $sum: '$rating' },
            ratingCount: {
              $sum: { $cond: [{ $gt: ['$rating', 0] }, 1, 0] }
            }
          }
        }
      ]);

      const catStats = stats[0] || { totalJobs: 0, completedJobs: 0, totalRating: 0, ratingCount: 0 };
      
      return {
        id: cat._id,
        title: cat.title,
        slug: cat.slug,
        imageUrl: cat.imageUrl,
        iconUrl: cat.homeIconUrl,
        description: cat.description,
        status: 'Active', // Authorized by admin
        stats: {
          totalJobs: catStats.totalJobs,
          completedJobs: catStats.completedJobs,
          rating: catStats.ratingCount > 0 
            ? parseFloat((catStats.totalRating / catStats.ratingCount).toFixed(1)) 
            : 0.0
        }
      };
    }));

    res.status(200).json({
      success: true,
      data: servicesWithStats
    });

  } catch (error) {
    console.error('Get My Services error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your service portfolio'
    });
  }
};

/**
 * Get vendor's services (Old/Generic implementation)
 */
const getVendorServices = async (req, res) => {
    // Keep for backward compatibility or other uses
    res.status(200).json({ success: true, data: [] });
};

/**
 * Update service availability (enable/disable)
 */
const updateServiceAvailability = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { isAvailable } = req.body;
    res.status(200).json({ success: true, message: 'Updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get available catalog hierarchy for vendor selection
 */
const getAvailableHierarchy = async (req, res) => {
  try {
    // We fetch the Pricing matrix, as that defines what is actually available and priced
    const pricingMatrix = await ServiceBrandPricing.find({ isActive: true })
      .populate('categoryId', 'title slug')
      .populate('subCategoryId', 'title slug')
      .populate('serviceId', 'title slug')
      .populate('brandId', 'title slug');

    // Build a nested tree for the frontend
    // Format: Category -> SubCategory -> Service -> Array of Brands with Pricing
    const hierarchy = {};

    pricingMatrix.forEach(item => {
      const cat = item.categoryId;
      const sub = item.subCategoryId;
      const srv = item.serviceId;
      const brd = item.brandId;

      if (!cat || !sub || !srv || !brd) return;

      if (!hierarchy[cat._id]) {
        hierarchy[cat._id] = { id: cat._id, title: cat.title, subCategories: {} };
      }
      if (!hierarchy[cat._id].subCategories[sub._id]) {
        hierarchy[cat._id].subCategories[sub._id] = { id: sub._id, title: sub.title, services: {} };
      }
      if (!hierarchy[cat._id].subCategories[sub._id].services[srv._id]) {
        hierarchy[cat._id].subCategories[sub._id].services[srv._id] = { id: srv._id, title: srv.title, brands: [] };
      }

      hierarchy[cat._id].subCategories[sub._id].services[srv._id].brands.push({
        id: brd._id,
        title: brd.title,
        customerPrice: item.finalCustomerPrice,
        vendorProfit: item.vendorProfit
      });
    });

    // Convert objects to arrays
    const formattedHierarchy = Object.values(hierarchy).map(cat => ({
      ...cat,
      subCategories: Object.values(cat.subCategories).map(sub => ({
        ...sub,
        services: Object.values(sub.services)
      }))
    }));

    // Also fetch what the vendor has already selected
    const selections = await VendorServiceMapping.find({ vendorId: req.user.id });

    res.status(200).json({ 
      success: true, 
      hierarchy: formattedHierarchy,
      selections 
    });
  } catch (error) {
    console.error('getAvailableHierarchy error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Save Vendor Service Selections
 * Expects array of mappings: [{ categoryId, subCategoryId, serviceId, supportedBrandIds }]
 */
const saveServiceSelections = async (req, res) => {
  try {
    const { selections } = req.body; // Array of objects
    const vendorId = req.user.id;

    if (!Array.isArray(selections)) {
      return res.status(400).json({ success: false, message: 'Selections must be an array' });
    }

    // Process each selection
    for (const sel of selections) {
      const { categoryId, subCategoryId, serviceId, supportedBrandIds } = sel;
      
      if (!categoryId || !subCategoryId || !serviceId) continue;

      if (supportedBrandIds && supportedBrandIds.length > 0) {
        // Upsert mapping
        await VendorServiceMapping.findOneAndUpdate(
          { vendorId, serviceId },
          { vendorId, categoryId, subCategoryId, serviceId, supportedBrandIds, isAvailable: true },
          { upsert: true, new: true }
        );
      } else {
        // If no brands selected, remove the mapping
        await VendorServiceMapping.findOneAndDelete({ vendorId, serviceId });
      }
    }

    res.status(200).json({ success: true, message: 'Service selections saved successfully' });
  } catch (error) {
    console.error('saveServiceSelections error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getMyServices,
  getVendorServices,
  updateServiceAvailability,
  getAvailableHierarchy,
  saveServiceSelections
};
