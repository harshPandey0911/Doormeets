const Category = require('../../models/Category');
const Brand = require('../../models/Brand');
const Service = require('../../models/Service');
const ServiceBrandPricing = require('../../models/ServiceBrandPricing');

/**
 * Get all admin-managed categories (Vendor view — read only)
 * GET /api/vendors/categories
 * Only returns service categories added by admin
 */
const getVendorCategories = async (req, res) => {
  try {
    const query = {
      status: 'active',
      categoryType: 'service'
    };

    if (req.user && req.user.role === 'vendor') {
      const assignedCategories = Array.from(new Set([
        ...(req.user.service || []),
        ...(req.user.categories || [])
      ]));

      if (assignedCategories.length === 0) {
        return res.status(200).json({ success: true, count: 0, categories: [] });
      }

      const objectIds = [];
      const names = [];
      assignedCategories.forEach(cat => {
        if (/^[0-9a-fA-F]{24}$/.test(cat)) {
          objectIds.push(cat);
        } else {
          names.push(new RegExp(`^${cat}$`, 'i'));
        }
      });

      if (objectIds.length > 0 && names.length > 0) {
        query.$or = [{ _id: { $in: objectIds } }, { title: { $in: names } }];
      } else if (objectIds.length > 0) {
        query._id = { $in: objectIds };
      } else if (names.length > 0) {
        query.title = { $in: names };
      }
    } else {
      query.$or = [
        { vendorId: null },
        { vendorId: { $exists: false } }
      ];
    }

    const categories = await Category.find(query)
      .select('title slug categoryType imageUrl homeIconUrl description status homeOrder')
      .sort({ homeOrder: 1, title: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: categories.length,
      categories: categories.map(cat => ({
        id: cat._id,
        title: cat.title,
        slug: cat.slug,
        categoryType: cat.categoryType,
        imageUrl: cat.imageUrl || cat.homeIconUrl || null,
        description: cat.description || '',
        status: cat.status
      }))
    });
  } catch (error) {
    console.error('Get vendor categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories. Please try again.'
    });
  }
};

/**
 * Get brands under a specific category (Vendor view)
 * GET /api/vendors/categories/:categoryId/brands
 */
const getCategoryBrands = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const query = {
      status: 'active',
      type: { $ne: 'product' }
    };

    const categoryCond = [
      { categoryIds: categoryId },
      { categoryId: categoryId }
    ];

    if (req.user && req.user.role === 'vendor') {
      const allowedBrands = req.user.brands || [];
      if (allowedBrands.length === 0) {
        return res.status(200).json({ success: true, count: 0, brands: [] });
      }

      const objectIds = [];
      const names = [];
      allowedBrands.forEach(brand => {
        if (/^[0-9a-fA-F]{24}$/.test(brand)) {
          objectIds.push(brand);
        } else {
          names.push(new RegExp(`^${brand}$`, 'i'));
        }
      });

      const brandFilter = [];
      if (objectIds.length > 0) brandFilter.push({ _id: { $in: objectIds } });
      if (names.length > 0) brandFilter.push({ title: { $in: names } });

      if (brandFilter.length > 0) {
        query.$and = [
          { $or: categoryCond },
          { $or: brandFilter }
        ];
      } else {
        return res.status(200).json({ success: true, count: 0, brands: [] });
      }
    } else {
      query.$or = categoryCond;
    }

    const brands = await Brand.find(query)
      .select('title slug iconUrl badge isPopular isFeatured type rating')
      .sort({ isPopular: -1, isFeatured: -1, title: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: brands.length,
      brands: brands.map(b => ({
        id: b._id,
        title: b.title,
        slug: b.slug,
        iconUrl: b.iconUrl || null,
        badge: b.badge || null,
        isPopular: b.isPopular,
        isFeatured: b.isFeatured,
        type: b.type,
        rating: b.rating || 0
      }))
    });
  } catch (error) {
    console.error('Get category brands error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch brands. Please try again.'
    });
  }
};

/**
 * Get services and their pricing under a specific brand
 * GET /api/vendors/categories/:categoryId/brands/:brandId/services
 */
const getBrandServicesAndPricing = async (req, res) => {
  try {
    const { categoryId, brandId } = req.params;
    
    const query = {
      categoryId: categoryId,
      isActive: true
    };

    if (brandId === 'null' || brandId === 'undefined' || !brandId) {
      query.brandId = null;
    } else {
      query.brandId = brandId;
    }

    const pricings = await ServiceBrandPricing.find(query)
      .populate('serviceId', 'title slug duration warranty iconUrl status')
      .populate('subCategoryId', 'title slug')
      .lean();

    let servicesWithPricing = pricings
      .filter(p => p.serviceId && p.serviceId.status === 'active');

    // Filter by vendor's allowed subCategories
    if (req.user && req.user.role === 'vendor') {
      const allowedSubs = req.user.subCategories || [];
      if (allowedSubs.length > 0) {
        servicesWithPricing = servicesWithPricing.filter(p => {
          if (!p.subCategoryId) return true; // No subcategory -> allowed by category
          const subTitle = p.subCategoryId.title;
          const subId = p.subCategoryId._id.toString();
          return allowedSubs.some(allowed => allowed === subId || (new RegExp(`^${allowed}$`, 'i')).test(subTitle));
        });
      } else {
        // If no subcategories assigned, they can only see services without a subcategory
        servicesWithPricing = servicesWithPricing.filter(p => !p.subCategoryId);
      }
    }

    servicesWithPricing = servicesWithPricing.map(pricing => ({
      id: pricing.serviceId._id,
      title: pricing.serviceId.title,
      duration: pricing.serviceId.duration,
      warranty: pricing.serviceId.warranty,
      iconUrl: pricing.serviceId.iconUrl,
      priceDetails: {
        finalCustomerPrice: pricing.finalCustomerPrice,
        vendorProfit: pricing.vendorProfit,
        basePrice: pricing.basePrice,
        gstAmount: pricing.gstAmount
      }
    }));

    res.status(200).json({
      success: true,
      count: servicesWithPricing.length,
      services: servicesWithPricing
    });
  } catch (error) {
    console.error('Get brand services and pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services. Please try again.'
    });
  }
};

module.exports = {
  getVendorCategories,
  getCategoryBrands,
  getBrandServicesAndPricing
};
