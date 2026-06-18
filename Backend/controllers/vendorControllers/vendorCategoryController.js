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
      categoryType: 'service',
      $or: [
        { vendorId: null },
        { vendorId: { $exists: false } }
      ]
    };

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

    const brands = await Brand.find({
      $or: [
        { categoryIds: categoryId },
        { categoryId: categoryId }
      ],
      status: 'active',
      type: { $ne: 'product' }
    })
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
      .lean();

    const servicesWithPricing = pricings
      .filter(p => p.serviceId && p.serviceId.status === 'active')
      .map(pricing => ({
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
