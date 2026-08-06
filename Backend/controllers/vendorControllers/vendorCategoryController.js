const Category = require('../../models/Category');
const Brand = require('../../models/Brand');
const Service = require('../../models/Service');

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

    const userRole = (req.userRole || req.user?.role || '').toUpperCase();

    if (userRole === 'VENDOR' || userRole === 'WORKER') {
      let vendorDoc = req.user;
      if (userRole === 'WORKER' && req.user.vendorId) {
        const Vendor = require('../../models/Vendor');
        vendorDoc = await Vendor.findById(req.user.vendorId).lean();
      }

      if (!vendorDoc) {
        return res.status(200).json({ success: true, count: 0, categories: [] });
      }

      const assignedCategories = Array.from(new Set([
        ...(vendorDoc.service || []),
        ...(vendorDoc.categories || [])
      ]));

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

    let categories = await Category.find(query)
      .select('title slug categoryType imageUrl homeIconUrl description status homeOrder isGroupCategory mappedCategories')
      .sort({ homeOrder: 1, title: 1 })
      .lean();

    // If vendor has individual categories (e.g. "Electrician"), filter out redundant Group Categories (e.g. "Electrician / Plumber / Carpenter")
    const groupCats = categories.filter(c => c.isGroupCategory);
    const individualCatIds = new Set(categories.filter(c => !c.isGroupCategory).map(c => c._id.toString()));

    if (individualCatIds.size > 0 && groupCats.length > 0) {
      categories = categories.filter(c => {
        if (!c.isGroupCategory) return true;
        // If all or any mappedCategories are already present individually in vendor's assigned list, hide the group card
        const mappedStrArr = (c.mappedCategories || []).map(id => id.toString());
        const hasOverlap = mappedStrArr.some(id => individualCatIds.has(id));
        return !hasOverlap;
      });
    }

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

const getCategoryBrands = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Check if requested category is a Group Category
    const categoryDoc = await Category.findById(categoryId).lean();
    let targetCatIds = [categoryId];
    if (categoryDoc && categoryDoc.isGroupCategory && Array.isArray(categoryDoc.mappedCategories) && categoryDoc.mappedCategories.length > 0) {
      targetCatIds = [...targetCatIds, ...categoryDoc.mappedCategories.map(id => id.toString())];
    }

    const query = {
      status: 'active',
      type: { $ne: 'product' },
      $or: [
        { categoryIds: { $in: targetCatIds } },
        { categoryId: { $in: targetCatIds } }
      ]
    };

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
// Mirrors PricingConfig's post-save vendorProfit formula exactly (models/PricingConfig.js) —
// computed here inline because that legacy sync writes to ServiceBrandPricing, a table that
// (until just now) silently never actually got written due to a schema mismatch, and even once
// fixed only covers pricing saved/edited *after* the fix. Reading PricingConfig directly means
// vendor payout is always correct regardless of the legacy sync's health.
const computeVendorProfitFromConfig = (pc) => {
  const vPayoutBase = pc.vendorPayoutBase || 0;
  const vSgstPct = pc.vendorSgstPercentage || 2.5;
  const vCgstPct = pc.vendorCgstPercentage || 2.5;
  const vTdsPct = pc.vendorTdsPercentage || 0;
  const vCommPct = pc.platformCommission || 0;

  if (vPayoutBase > 0) {
    const sgstAmount = vPayoutBase * (vSgstPct / 100);
    const cgstAmount = vPayoutBase * (vCgstPct / 100);
    const tdsAmount = vPayoutBase * (vTdsPct / 100);
    const remainingBase = Math.max(0, vPayoutBase - sgstAmount - cgstAmount - tdsAmount);
    const platformCommAmt = remainingBase * (vCommPct / 100);
    return Math.max(0, remainingBase - platformCommAmt);
  }

  // No explicit vendor payout base configured — fall back to taxable-amount-minus-commission.
  const gstPct = pc.gstPercentage || 18;
  const price = Number(pc.customerPrice) || 0;
  const taxableAmount = pc.gstIncluded ? price - (price * (gstPct / 100)) : price;
  return Math.max(0, taxableAmount - (taxableAmount * (vCommPct / 100)));
};

const getBrandServicesAndPricing = async (req, res) => {
  try {
    const { categoryId, brandId } = req.params;

    // Check if requested category is a Group Category
    const categoryDoc = await Category.findById(categoryId).lean();
    let targetCatIds = [categoryId];
    if (categoryDoc && categoryDoc.isGroupCategory && Array.isArray(categoryDoc.mappedCategories) && categoryDoc.mappedCategories.length > 0) {
      targetCatIds = [...targetCatIds, ...categoryDoc.mappedCategories.map(id => id.toString())];
    }

    const brandFilter = (brandId === 'null' || brandId === 'undefined' || !brandId) ? null : brandId;

    // Vendor payout must reflect THIS vendor's own operating zone — a payout configured for a
    // different zone (e.g. Indore's) must never be shown to a Dewas vendor. Same cross-zone
    // rule already enforced for customer-facing pricing.
    const vendorZoneId = req.user?.zoneId
      ? req.user.zoneId.toString()
      : (Array.isArray(req.user?.zoneIds) && req.user.zoneIds.length > 0 ? req.user.zoneIds[0].toString() : null);

    const PricingConfig = require('../../models/PricingConfig');
    const configRows = await PricingConfig.find({
      categoryId: { $in: targetCatIds },
      brandId: brandFilter,
      isActive: { $ne: false }
    })
      .populate('serviceId', 'title slug duration warranty iconUrl status')
      .populate('subCategoryId', 'title slug')
      .lean();

    // Group ALL rows (base + every variant) per service, then keep only the ones matching the
    // vendor's own zone exactly — no Global/any-zone fallback. If nothing is priced for the
    // vendor's own zone, that service just isn't shown to them (rather than displaying a payout
    // configured for a different zone, or a stale Global row).
    const rowsByService = new Map();
    configRows.forEach(r => {
      const sId = r.serviceId?._id?.toString();
      if (!sId || !r.serviceId || r.serviceId.status !== 'active') return;
      if (!rowsByService.has(sId)) rowsByService.set(sId, { service: r.serviceId, subCategoryId: r.subCategoryId, rows: [] });
      rowsByService.get(sId).rows.push(r);
    });

    let servicesWithPricing = [];
    rowsByService.forEach(({ service, subCategoryId, rows }) => {
      const scoped = vendorZoneId ? rows.filter(r => r.zoneId && r.zoneId.toString() === vendorZoneId) : [];
      if (scoped.length === 0) return;

      const profits = scoped.map(computeVendorProfitFromConfig).filter(p => p > 0);
      const baseRow = scoped.find(r => !r.variantId) || scoped[0];

      servicesWithPricing.push({
        serviceId: service,
        subCategoryId,
        finalCustomerPrice: baseRow.customerPrice,
        vendorProfitMin: profits.length ? Math.min(...profits) : 0,
        vendorProfitMax: profits.length ? Math.max(...profits) : 0,
        basePrice: baseRow.customerPrice,
        gstAmount: 0
      });
    });

    // Fallback to direct Service collection lookup if this category/brand has no pricing
    // configured at all yet — so the vendor at least sees the service listed (0 payout) rather
    // than nothing.
    if (servicesWithPricing.length === 0) {
      const directServicesQuery = { categoryId: { $in: targetCatIds }, status: 'active' };
      if (brandFilter) directServicesQuery.brandId = brandFilter;
      const directServices = await Service.find(directServicesQuery)
        .populate('subCategoryId', 'title slug')
        .lean();

      servicesWithPricing = directServices.map(s => ({
        serviceId: s,
        subCategoryId: s.subCategoryId,
        finalCustomerPrice: s.price || s.basePrice || 0,
        vendorProfitMin: 0,
        vendorProfitMax: 0,
        basePrice: s.basePrice || 0,
        gstAmount: 0
      }));
    }

    // Filter by vendor's allowed subCategories if configured
    if (req.user && (req.user.role === 'vendor' || req.userRole === 'vendor')) {
      const allowedSubs = req.user.subCategories || [];
      if (allowedSubs.length > 0) {
        servicesWithPricing = servicesWithPricing.filter(p => {
          if (!p.subCategoryId) return true; // No subcategory -> allowed by category
          const subTitle = p.subCategoryId.title;
          const subId = p.subCategoryId._id.toString();
          return allowedSubs.some(allowed => allowed === subId || (new RegExp(`^${allowed}$`, 'i')).test(subTitle));
        });
      }
    }

    // Deduplicate services by unique serviceId
    const uniqueServicesMap = new Map();
    servicesWithPricing.forEach(pricing => {
      const sId = pricing.serviceId?._id?.toString() || pricing.serviceId?.toString();
      if (sId && !uniqueServicesMap.has(sId)) {
        uniqueServicesMap.set(sId, pricing);
      }
    });
    const uniqueServicesList = Array.from(uniqueServicesMap.values());

    const formattedServices = uniqueServicesList.map(pricing => ({
      id: pricing.serviceId._id,
      title: pricing.serviceId.title,
      subCategory: pricing.subCategoryId ? pricing.subCategoryId.title : null,
      duration: pricing.serviceId.duration,
      warranty: pricing.serviceId.warranty,
      iconUrl: pricing.serviceId.iconUrl,
      priceDetails: {
        finalCustomerPrice: pricing.finalCustomerPrice,
        // Single number when every configured option pays the same; a min/max range whenever
        // the service has multiple packages/variants (e.g. "2 Pin" vs "3 Pin") with different payouts.
        vendorProfit: pricing.vendorProfitMax,
        vendorProfitMin: pricing.vendorProfitMin,
        vendorProfitMax: pricing.vendorProfitMax,
        basePrice: pricing.basePrice,
        gstAmount: pricing.gstAmount
      }
    }));

    res.status(200).json({
      success: true,
      count: formattedServices.length,
      services: formattedServices
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
