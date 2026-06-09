const mongoose = require('mongoose');
const Category = require('../../models/Category');
const Brand = require('../../models/Brand');
const Service = require('../../models/Service');
const HomeContent = require('../../models/HomeContent');
const ServiceBrandPricing = require('../../models/ServiceBrandPricing');
const VendorServiceMapping = require('../../models/VendorServiceMapping');
const { calculateDistance } = require('../../services/locationService');

/**
 * Public Catalog Controllers
 * These endpoints are accessible without authentication for user app
 */

/**
 * Get all active categories for user app
 * GET /api/public/categories
 */
const getPublicCategories = async (req, res) => {
  try {
    const { cityId } = req.query;

    // Build query
    const query = { status: { $in: ['active', 'coming_soon'] } };
    if (cityId) {
      query.$or = [
        { cityIds: cityId },
        { cityIds: { $exists: false } },
        { cityIds: { $size: 0 } }
      ];
    }

    // Find all DB-active category titles (admin status is the source of truth)
    const dbActiveCategories = await Category.find({ status: { $in: ['active', 'coming_soon'] } }).select('_id title');
    const dbActiveCatIdsSet = new Set(dbActiveCategories.map(c => c._id.toString()));
    const dbActiveCatTitlesSet = new Set(dbActiveCategories.map(c => c.title.toLowerCase().trim()));

    // Find all online and available vendors — filtered by city if cityId provided
    let vendorFilterCat = { isOnline: true, workStatus: 'available' };
    if (cityId) {
      const City = require('../../models/City');
      const cityDocCat = await City.findById(cityId).select('name').lean();
      if (cityDocCat && cityDocCat.name) {
        vendorFilterCat['address.city'] = new RegExp(`^${cityDocCat.name.trim()}$`, 'i');
      }
    }
    const onlineVendors = await require('../../models/Vendor').find(vendorFilterCat).select('categories');

    const activeCategoryIds = new Set();
    const activeCategoryTitles = new Set();
    onlineVendors.forEach(vendor => {
      if (Array.isArray(vendor.categories)) {
        vendor.categories.forEach(cat => {
          if (cat) {
            if (mongoose.isValidObjectId(cat)) {
              // Only count if category is truly active in DB
              if (dbActiveCatIdsSet.has(cat.toString())) {
                activeCategoryIds.add(cat.toString());
              }
            } else {
              // Only count if title maps to an actually active DB category
              const titleLower = cat.toLowerCase().trim();
              if (dbActiveCatTitlesSet.has(titleLower)) {
                activeCategoryTitles.add(titleLower);
              }
            }
          }
        });
      }
    });

    const categories = await Category.find(query)
      .select('title slug homeIconUrl homeBadge hasSaleBadge homeOrder showOnHome categoryType status interestedUsers')
      .sort({ homeOrder: 1, createdAt: -1 })
      .lean();

    // Check optional authentication for isInterested flag
    const jwt = require('jsonwebtoken');
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        // Ignore invalid token for public endpoint
      }
    }

    // Filter and map
    const initialCategories = categories
      .map(cat => ({
        id: cat._id.toString(),
        title: cat.title,
        slug: cat.slug,
        icon: cat.homeIconUrl || '',
        badge: cat.homeBadge || '',
        hasSaleBadge: cat.hasSaleBadge || false,
        showOnHome: cat.showOnHome || false,
        categoryType: cat.categoryType || 'service',
        status: cat.status || 'active',
        interestedCount: cat.interestedUsers ? cat.interestedUsers.length : 0,
        isInterested: userId && cat.interestedUsers ? cat.interestedUsers.some(id => id.toString() === userId.toString()) : false
      }));

    res.status(200).json({
      success: true,
      categories: initialCategories
    });
  } catch (error) {
    console.error('Get public categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories. Please try again.'
    });
  }
};

/**
 * Get active subcategories for a category
 * GET /api/public/subcategories
 */
const getPublicSubCategories = async (req, res) => {
  try {
    const { categoryId } = req.query;
    if (!categoryId) {
      return res.status(400).json({ success: false, message: 'categoryId is required' });
    }

    const category = await Category.findById(categoryId);
    if (!category || category.status !== 'active') {
      return res.status(200).json({ success: true, subCategories: [] });
    }

    const SubCategory = require('../../models/SubCategory');
    const subCategories = await SubCategory.find({ categoryId, status: 'active' })
      .select('title slug iconUrl description')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      subCategories: subCategories.map(sub => ({
        id: sub._id.toString(),
        title: sub.title,
        slug: sub.slug,
        iconUrl: sub.iconUrl || '',
        description: sub.description || ''
      }))
    });
  } catch (error) {
    console.error('Get public subcategories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subcategories.'
    });
  }
};

/**
 * Get Dynamic Booking Hierarchy (Categories -> SubCat -> Brand -> Service -> Pricing)
 * GET /api/public/booking-hierarchy
 */
const getPublicBookingHierarchy = async (req, res) => {
  try {
    // We only want pricing where vendors actually support it
    // Wait, the prompt says: "Booking request goes only to matching vendors."
    // So we fetch the entire active pricing matrix.
    const pricingMatrix = await ServiceBrandPricing.find({ isActive: true })
      .populate('categoryId', 'title slug')
      .populate('subCategoryId', 'title slug')
      .populate('serviceId', 'title slug')
      .populate('brandId', 'title slug iconUrl');

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
        hierarchy[cat._id].subCategories[sub._id] = { id: sub._id, title: sub.title, brands: {} };
      }
      
      // Grouping by Brand first for User Flow: Electrician -> AC Services -> LG -> AC Gas Filling
      if (!hierarchy[cat._id].subCategories[sub._id].brands[brd._id]) {
        hierarchy[cat._id].subCategories[sub._id].brands[brd._id] = { 
          id: brd._id, 
          title: brd.title,
          iconUrl: brd.iconUrl,
          services: [] 
        };
      }

      hierarchy[cat._id].subCategories[sub._id].brands[brd._id].services.push({
        id: srv._id,
        title: srv.title,
        price: item.finalCustomerPrice,
        pricingId: item._id
      });
    });

    const formattedHierarchy = Object.values(hierarchy).map(cat => ({
      ...cat,
      subCategories: Object.values(cat.subCategories).map(sub => ({
        ...sub,
        brands: Object.values(sub.brands)
      }))
    }));

    res.status(200).json({
      success: true,
      hierarchy: formattedHierarchy
    });

  } catch (error) {
    console.error('Get public hierarchy error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getPublicBrands = async (req, res) => {
  try {
    const { categoryId, subCategoryId, categorySlug, search, cityId, lat, lng } = req.query;

    // Build query
    const query = { status: 'active' };
    
    // Find all active categories from DB (source of truth for status)
    const activeCategories = await Category.find({ status: { $in: ['active', 'coming_soon'] } }).select('_id title');
    const activeCatIds = activeCategories.map(c => c._id);
    // Build Sets for fast O(1) lookup
    const activeCatIdsSet = new Set(activeCategories.map(c => c._id.toString()));
    const activeCatTitlesFromDB = new Set(activeCategories.map(c => c.title.toLowerCase().trim()));

    if (subCategoryId) {
      query.subCategoryIds = subCategoryId;
    }
    if (categoryId) {
      const category = await Category.findById(categoryId);
      if (category && (category.status === 'active' || category.status === 'coming_soon')) {
        // Find all categories with the same title to show all vendors' brands for this category
        const relatedCategories = await Category.find({ 
          title: { $regex: `^${category.title.trim()}$`, $options: 'i' }, 
          status: { $in: ['active', 'coming_soon'] } 
        }).select('_id');
        const catIds = relatedCategories.map(c => c._id);
        query.categoryIds = { $in: catIds };
      } else {
        return res.status(200).json({ success: true, brands: [] });
      }
    } else {
      query.categoryIds = { $in: activeCatIds };
    }
    if (cityId) {
      query.$or = [
        { cityIds: cityId },
        { cityIds: { $exists: false } },
        { cityIds: { $size: 0 } }
      ];
    }

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.title = { $regex: escapedSearch, $options: 'i' };
    }

    let brands = await Brand.find(query)
      .select('title slug iconUrl logo imageUrl badge categoryIds basePrice discountPrice sections type isPriceDisclosed')
      .sort({ createdAt: -1 })
      .lean();

    // Find all online and available vendors, filtered by city if cityId provided
    let vendorCityFilter = { isOnline: true, workStatus: 'available' };
    if (cityId) {
      // Look up city name to match vendor's address.city string field
      const City = require('../../models/City');
      const cityDoc = await City.findById(cityId).select('name').lean();
      if (cityDoc && cityDoc.name) {
        vendorCityFilter['address.city'] = new RegExp(`^${cityDoc.name.trim()}$`, 'i');
      }
    }
    const onlineVendors = await require('../../models/Vendor').find(vendorCityFilter)
      .select('categories location address geoLocation');

    const activeCategoryIds = new Set();
    const activeCategoryTitles = new Set();
    onlineVendors.forEach(vendor => {
      if (Array.isArray(vendor.categories)) {
        vendor.categories.forEach(cat => {
          if (cat) {
            if (mongoose.isValidObjectId(cat)) {
              // Only add if this category ID is actually active in DB
              if (activeCatIdsSet.has(cat.toString())) {
                activeCategoryIds.add(cat.toString());
              }
            } else {
              // Only add title if it corresponds to an actually active DB category
              const titleLower = cat.toLowerCase().trim();
              if (activeCatTitlesFromDB.has(titleLower)) {
                activeCategoryTitles.add(titleLower);
              }
            }
          }
        });
      }
    });

    // Populate category details to get the titles for filtering
    const brandCategoryIds = [...new Set(brands.flatMap(b => b.categoryIds || []))];
    const brandCategories = await Category.find({ _id: { $in: brandCategoryIds } }).select('_id title').lean();
    const brandCategoryMap = new Map();
    brandCategories.forEach(c => brandCategoryMap.set(c._id.toString(), c.title.toLowerCase().trim()));

    // Filter out brands whose category is not active in DB (admin status wins)
    brands = brands.filter(b => {
      if (!b.categoryIds) return false;
      return b.categoryIds.some(catId => {
        const idStr = catId.toString();
        // category must be active in DB
        return activeCatIdsSet.has(idStr);
      });
    });

    // Deduplicate by title to ensure a clean catalog
    const groupedBrands = new Map();
    
    brands.forEach(brand => {
      const titleKey = brand.title.toLowerCase().trim();
      const existing = groupedBrands.get(titleKey);
      
      // LOGIC: 
      // 1. If brand doesn't exist in map yet, add it.
      // 3. If distances are equal (or no location), pick the CHEAPEST (basePrice).
      if (!existing) {
        groupedBrands.set(titleKey, brand);
      } else {
        const currentPrice = brand.basePrice || 0;
        const existingPrice = existing.basePrice || 0;
        
        if (currentPrice < existingPrice) {
          groupedBrands.set(titleKey, brand);
        }
      }
    });

    brands = Array.from(groupedBrands.values());

    // If categorySlug is provided, filter by category
    if (categorySlug) {
      const catQuery = { slug: categorySlug, status: 'active' };
      if (cityId) {
        catQuery.cityIds = cityId;
      }

      let category = await Category.findOne(catQuery).lean();

      if (!category && cityId) {
        category = await Category.findOne({ slug: categorySlug, status: 'active' }).lean();
      }

      if (category) {
        const relatedCategories = await Category.find({ 
          title: { $regex: `^${category.title.trim()}$`, $options: 'i' }, 
          status: 'active' 
        }).select('_id');
        const catIds = relatedCategories.map(c => c._id.toString());
        
        brands = brands.filter(b =>
          Array.isArray(b.categoryIds) &&
          b.categoryIds.some(id => catIds.includes(id.toString()))
        );
      }
    }

    res.status(200).json({
      success: true,
      brands: brands.map(brand => ({
        id: brand._id.toString(),
        title: brand.title,
        slug: brand.slug,
        icon: brand.iconUrl || '',
        logo: brand.logo || brand.iconUrl || '',
        imageUrl: brand.imageUrl || brand.iconUrl || '',
        badge: brand.badge || '',
        price: brand.basePrice || 0, // Legacy support
        originalPrice: brand.discountPrice ? (brand.basePrice + brand.discountPrice) : (brand.basePrice || 0),
        categoryId: brand.categoryIds && brand.categoryIds.length > 0 ? brand.categoryIds[0].toString() : null,
        categoryIds: (brand.categoryIds || []).map(id => id.toString()),
        sections: brand.sections || [],
        type: brand.type || 'service',
        isPriceDisclosed: brand.isPriceDisclosed ?? true
      }))
    });
  } catch (error) {
    console.error('Get public brands error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch brands. Please try again.'
    });
  }
};

/**
 * Get brand by slug for user app
 * GET /api/public/brands/slug/:slug
 */
const getPublicBrandBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const brand = await Brand.findOne({ slug, status: 'active' })
      .populate('categoryIds', 'title slug')
      .populate('vendorId', 'name businessName isOnline availability workStatus')
      .lean();

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: 'Brand not found'
      });
    }

    // Remove _id from nested objects
    const cleanBrand = JSON.parse(JSON.stringify(brand));
    const removeIds = (obj) => {
      if (Array.isArray(obj)) {
        return obj.map(item => {
          if (item && typeof item === 'object') {
            const { _id, ...rest } = item;
            return removeIds(rest);
          }
          return item;
        });
      } else if (obj && typeof obj === 'object') {
        const { _id, ...rest } = obj;
        return Object.keys(rest).reduce((acc, key) => {
          acc[key] = removeIds(rest[key]);
          return acc;
        }, {});
      }
      return obj;
    };

    // Find all brands with the same title to ensure we show the closest one's details
    const relatedBrands = await Brand.find({
      title: { $regex: `^${brand.title.trim()}$`, $options: 'i' },
      status: 'active'
    }).populate('vendorId', 'name businessName isOnline availability workStatus location address geoLocation').lean();

    const { lat, lng, cityId } = req.query;
    const userLoc = (lat && lng) ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null;
    
    let closestBrand = brand;
    if (userLoc) {
      let minDistance = Infinity;
      relatedBrands.forEach(rb => {
        const vendor = rb.vendorId;
        if (vendor) {
          const vLat = vendor.location?.lat || vendor.address?.lat || (vendor.geoLocation?.coordinates ? vendor.geoLocation.coordinates[1] : null);
          const vLng = vendor.location?.lng || vendor.address?.lng || (vendor.geoLocation?.coordinates ? vendor.geoLocation.coordinates[0] : null);
          if (vLat && vLng) {
            const dist = calculateDistance(userLoc, { lat: vLat, lng: vLng });
            if (dist < minDistance) {
              minDistance = dist;
              closestBrand = rb;
            }
          }
        }
      });
    }

    // Fetch ALL services in the same category that have the same title as any service in this brand
    // This is more robust than just looking at brand IDs
    const initialServicesQuery = { brandId: brand._id, status: 'active' };
    if (cityId) {
      initialServicesQuery.$or = [
        { cityIds: cityId },
        { cityIds: { $exists: false } },
        { cityIds: { $size: 0 } }
      ];
    }
    const initialServices = await Service.find(initialServicesQuery).select('title categoryId');
    const serviceTitles = [...new Set(initialServices.map(s => s.title.toLowerCase().trim()))];
    
    // Fallback to brand title if no services found yet
    if (serviceTitles.length === 0) {
      serviceTitles.push(brand.title.toLowerCase().trim());
    }

    const allServicesQuery = {
      title: { $in: serviceTitles.map(t => new RegExp(`^${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i')) },
      status: 'active'
    };
    if (cityId) {
      allServicesQuery.$or = [
        { cityIds: cityId },
        { cityIds: { $exists: false } },
        { cityIds: { $size: 0 } }
      ];
    }

    const allServices = await Service.find(allServicesQuery)
      .populate('vendorId', 'name businessName isOnline availability workStatus location address geoLocation')
      .lean();

    // Deduplicate services by title, picking the one from the closest/best vendor
    const groupedServices = new Map();
    allServices.forEach(svc => {
      const vendor = svc.vendorId;
      // STRICT CHECK: Only show Available vendors
      if (!vendor || vendor.isOnline === false || vendor.workStatus !== 'available') return;

      if (userLoc) {
        const vLat = vendor.location?.lat || vendor.address?.lat || (vendor.geoLocation?.coordinates ? vendor.geoLocation.coordinates[1] : null);
        const vLng = vendor.location?.lng || vendor.address?.lng || (vendor.geoLocation?.coordinates ? vendor.geoLocation.coordinates[0] : null);
        if (vLat && vLng) {
          svc.distance = calculateDistance(userLoc, { lat: vLat, lng: vLng });
        } else {
          svc.distance = Infinity;
        }
      } else {
        svc.distance = 0;
      }

      const titleKey = svc.title.toLowerCase().trim();
      const existing = groupedServices.get(titleKey);
      // LOGIC: 
      // 1. If service doesn't exist, add it.
      // 2. If it exists and we have location, pick the NEAREST.
      // 3. If distances are equal (or no location), pick the CHEAPEST.
      if (!existing) {
        groupedServices.set(titleKey, svc);
      } else {
        const currentPrice = svc.basePrice || 0;
        const existingPrice = existing.basePrice || 0;

        if (userLoc) {
          if (svc.distance < existing.distance) {
            groupedServices.set(titleKey, svc);
          } else if (svc.distance === existing.distance && currentPrice < existingPrice) {
            groupedServices.set(titleKey, svc);
          }
        } else if (currentPrice < existingPrice) {
          groupedServices.set(titleKey, svc);
        }
      }
    });

    const brandServices = Array.from(groupedServices.values());

    // Map services to a default section structure for the frontend
    const servicesSection = {
      title: closestBrand.title,
      subtitle: 'Available Services',
      cards: brandServices.map(svc => ({
        id: svc._id.toString(),
        serviceId: svc._id.toString(), // CRITICAL for 'Add' button
        categoryId: svc.categoryId?.toString() || brand.categoryId?.toString() || null, // CRITICAL for 'Add' button
        title: svc.title,
        subtitle: svc.description || '',
        price: svc.basePrice,
        vendorName: svc.vendorId?.businessName || svc.vendorId?.name,
        vendorId: svc.vendorId?._id?.toString(),
        rating: "4.8", 
        reviews: "1k+",
        image: svc.iconUrl || closestBrand.iconUrl || '', // Changed to 'image' for ServiceWithRatingCard
        features: svc.features && svc.features.length > 0 ? svc.features : (svc.description ? [svc.description] : []),
        steps: svc.steps || [],
        duration: "60 min",
        type: svc.type || 'service',
        isPriceDisclosed: svc.isPriceDisclosed ?? true
      }))
    };

    const formattedBrand = {
      id: brand._id.toString(),
      title: brand.title,
      slug: brand.slug,
      icon: brand.iconUrl || '',
      logo: brand.logo || '',
      badge: brand.badge || '',
      basePrice: brand.basePrice, // Legacy
      category: brand.categoryIds && brand.categoryIds[0] ? {
        id: brand.categoryIds[0]._id.toString(),
        title: brand.categoryIds[0].title,
        slug: brand.categoryIds[0].slug
      } : null,
      categories: (brand.categoryIds || []).map(cat => ({
        id: cat._id.toString(),
        title: cat.title,
        slug: cat.slug
      })),
      page: brand.page ? removeIds(brand.page) : {
        banners: brand.iconUrl ? [{ imageUrl: brand.iconUrl, text: brand.title }] : [],
        paymentOffers: [],
        paymentOffersEnabled: false
      },
      sections: brandServices.length > 0 ? [servicesSection] : [],
      type: brand.type || 'service',
      isPriceDisclosed: brand.isPriceDisclosed ?? true,
      vendor: brand.vendorId ? {
        id: brand.vendorId._id,
        name: brand.vendorId.name,
        businessName: brand.vendorId.businessName,
        isOnline: brand.vendorId.isOnline,
        availability: brand.vendorId.availability,
        workStatus: brand.vendorId.workStatus
      } : null
    };

    res.status(200).json({
      success: true,
      brand: formattedBrand
    });
  } catch (error) {
    console.error('Get public brand by slug error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch brand. Please try again.'
    });
  }
};

const getPublicServices = async (req, res) => {
  try {
    const { brandId, brandSlug, categoryId, subCategoryId, lat, lng, cityId } = req.query;

    const query = { status: 'active' };
    if (cityId) {
      query.$or = [
        { cityIds: cityId },
        { cityIds: { $exists: false } },
        { cityIds: { $size: 0 } }
      ];
    }

    // Find all active categories from DB (source of truth — admin status wins over vendor status)
    const activeCategoriesQuery = { status: { $in: ['active', 'coming_soon'] } };
    if (cityId) {
      activeCategoriesQuery.$or = [
        { cityIds: cityId },
        { cityIds: { $exists: false } },
        { cityIds: { $size: 0 } }
      ];
    }
    const activeCategories = await Category.find(activeCategoriesQuery).select('_id title');
    const activeCatIds = activeCategories.map(c => c._id);
    const dbActiveCatIds = new Set(activeCategories.map(c => c._id.toString()));
    const dbActiveCatTitles = new Set(activeCategories.map(c => c.title.toLowerCase().trim()));

    if (categoryId) {
      const category = await Category.findById(categoryId);
      if (!category || (category.status !== 'active' && category.status !== 'coming_soon')) {
        return res.status(200).json({ success: true, services: [] });
      }
      query.categoryId = categoryId;
    } else {
      query.categoryId = { $in: activeCatIds };
    }

    let targetBrand = null;
    if (brandId || brandSlug) {
      const brand = brandId ? await Brand.findById(brandId) : await Brand.findOne({ slug: brandSlug });
      if (brand) {
        targetBrand = brand;
        // Fetch service IDs mapped to this brand via pricing model
        const ServiceBrandPricing = require('../../models/ServiceBrandPricing');

        // Prefer pricings scoped to the requested subCategoryId when present
        let pricings = [];
        if (subCategoryId) {
          pricings = await ServiceBrandPricing.find({
            brandId: brand._id,
            subCategoryId,
            isActive: true
          }).select('serviceId').lean();
        }

        // Fallback: if no scoped pricings found, use all pricings for the brand
        if (!pricings || pricings.length === 0) {
          pricings = await ServiceBrandPricing.find({
            brandId: brand._id,
            isActive: true
          }).select('serviceId').lean();
        }

        const mappedServiceIds = pricings.map(p => p.serviceId);
        query._id = { $in: mappedServiceIds };
      }
    }

    // If a subCategoryId is provided and we don't already restrict by mapped services,
    // also filter services by their subCategoryId so frontend requests return accurate results.
    if (subCategoryId && !query._id) {
      query.subCategoryId = subCategoryId;
    }

    if (req.query.search) {
      const escapedSearch = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.title = { $regex: escapedSearch, $options: 'i' };
    }

    let activeServices = await Service.find(query)
      .sort({ createdAt: 1 })
      .lean();

    // Find online vendors filtered by city (if provided) so cross-city bleed doesn't happen
    let svcVendorFilter = { isOnline: true, workStatus: 'available' };
    if (cityId) {
      const City = require('../../models/City');
      const svcCityDoc = await City.findById(cityId).select('name').lean();
      if (svcCityDoc && svcCityDoc.name) {
        svcVendorFilter['address.city'] = new RegExp(`^${svcCityDoc.name.trim()}$`, 'i');
      }
    }
    const onlineVendors = await require('../../models/Vendor').find(svcVendorFilter)
      .select('categories location address geoLocation');

    const activeCategoryIds = new Set();
    const activeCategoryTitles = new Set();
    onlineVendors.forEach(vendor => {
      if (Array.isArray(vendor.categories)) {
        vendor.categories.forEach(cat => {
          if (cat) {
            if (mongoose.isValidObjectId(cat)) {
              // Only include if category is actually active in DB
              if (dbActiveCatIds.has(cat.toString())) {
                activeCategoryIds.add(cat.toString());
              }
            } else {
              // Only include if this title maps to an actually active DB category
              const titleLower = cat.toLowerCase().trim();
              if (dbActiveCatTitles.has(titleLower)) {
                activeCategoryTitles.add(titleLower);
              }
            }
          }
        });
      }
    });

    // Populate category details to get the titles for filtering
    const svcCategoryIds = [...new Set(activeServices.map(s => s.categoryId).filter(Boolean))];
    const svcCategories = await Category.find({ _id: { $in: svcCategoryIds }, status: { $in: ['active', 'coming_soon'] } }).select('_id title').lean();
    const svcCategoryMap = new Map();
    svcCategories.forEach(c => svcCategoryMap.set(c._id.toString(), c.title.toLowerCase().trim()));

    // Filter out services whose category is not active in DB (admin status takes priority)
    activeServices = activeServices.filter(svc => {
      if (!svc.categoryId) return false;
      const idStr = svc.categoryId.toString();
      // Category must be active in DB first
      return dbActiveCatIds.has(idStr);
    });

    // Deduplicate by title to ensure only one "Reti" shows up even if 10 vendors have it
    const groupedServices = new Map();

    activeServices.forEach(svc => {
      const titleKey = svc.title.toLowerCase().trim();
      const existing = groupedServices.get(titleKey);

      // If it exists, pick the CHEAPEST.
      if (!existing) {
        groupedServices.set(titleKey, svc);
      } else {
        const currentPrice = svc.basePrice || 0;
        const existingPrice = existing.basePrice || 0;

        if (currentPrice < existingPrice) {
          groupedServices.set(titleKey, svc);
        }
      }
    });

    activeServices = Array.from(groupedServices.values());

    // Fetch pricing for these services
    const ServiceBrandPricing = require('../../models/ServiceBrandPricing');
    const serviceIds = activeServices.map(s => s._id);
    const pricings = await ServiceBrandPricing.find({
      serviceId: { $in: serviceIds },
      isActive: true
    }).lean();

    // Map pricing back to activeServices
    activeServices = activeServices.map(svc => {
      // Find exact pricing match if possible (matching subCategoryId and brandId)
      const exactPricing = pricings.find(p => 
        p.serviceId.toString() === svc._id.toString() &&
        (targetBrand ? (p.brandId && p.brandId.toString() === targetBrand._id.toString()) : true) &&
        (p.subCategoryId ? p.subCategoryId.toString() === svc.subCategoryId?.toString() : true)
      );

      // Or fallback to first pricing found for this service
      const pricing = exactPricing || pricings.find(p => p.serviceId.toString() === svc._id.toString());

      if (pricing) {
        return {
          ...svc,
          basePrice: pricing.finalCustomerPrice || pricing.basePrice, // Present final price as basePrice for user app
          gstPercentage: pricing.gstPercentage || 18,
          // Vendor profit shouldn't be exposed to the public user app, only to vendors
        };
      }
      return svc;
    });

    res.status(200).json({
      success: true,
      services: activeServices.map(svc => ({
        id: svc._id.toString(),
        categoryId: svc.categoryId?.toString() || null,
        subCategoryId: svc.subCategoryId?.toString() || null,
        title: svc.title,
        slug: svc.slug,
        icon: svc.iconUrl,
        basePrice: svc.basePrice,
        discountPrice: svc.discountPrice || 0,
        gstPercentage: svc.gstPercentage,
        description: svc.description,
        features: svc.features || [],
        steps: svc.steps || [],
        brandId: targetBrand ? targetBrand._id : null,
        brandName: targetBrand ? targetBrand.title : null,
        brandIcon: targetBrand ? targetBrand.iconUrl : null,
        type: svc.type || 'service',
        isPriceDisclosed: svc.isPriceDisclosed ?? true
      }))
    });
  } catch (error) {
    console.error('Get public services error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services'
    });
  }
};

/**
 * Get home content
 */
const getPublicHomeContent = async (req, res) => {
  try {
    const { cityId } = req.query;
    const homeContent = await HomeContent.getHomeContent(cityId);

    if (!homeContent) {
      return res.status(200).json({
        success: true,
        homeContent: {
          banners: [],
          promos: [],
          curated: [],
          noteworthy: [],
          booked: [],
          categorySections: []
        }
      });
    }

    // Used for backwards compatibility, we might need to update this to refer to Brands?
    // For now keeping as is, but assuming targetServiceId will point to Brand ID essentially.

    const contentObj = homeContent.toObject();

    const formattedContent = {
      banners: (contentObj.banners || []).map(item => ({
        ...item,
        id: item._id ? item._id.toString() : item.id,
        targetCategoryId: item.targetCategoryId?.toString() || null,
        targetServiceId: item.targetServiceId?.toString() || null,
      })),
      promos: (contentObj.promos || []).map(item => ({
        ...item,
        id: item._id ? item._id.toString() : item.id,
        targetCategoryId: item.targetCategoryId?.toString() || null,
        targetServiceId: item.targetServiceId?.toString() || null,
      })),
      curated: (contentObj.curated || []).map(item => ({
        ...item,
        id: item._id ? item._id.toString() : item.id,
        targetCategoryId: item.targetCategoryId?.toString() || null,
        targetServiceId: item.targetServiceId?.toString() || null,
      })),
      noteworthy: (contentObj.noteworthy || []).map(item => ({
        ...item,
        id: item._id ? item._id.toString() : item.id,
        targetCategoryId: item.targetCategoryId?.toString() || null,
        targetServiceId: item.targetServiceId?.toString() || null,
      })),
      booked: (contentObj.booked || []).map(item => ({
        ...item,
        id: item._id ? item._id.toString() : item.id,
        targetCategoryId: item.targetCategoryId?.toString() || null,
        targetServiceId: item.targetServiceId?.toString() || null,
      })),
      categorySections: (contentObj.categorySections || []).map(section => ({
        ...section,
        id: section._id ? section._id.toString() : section.id,
        seeAllTargetCategoryId: section.seeAllTargetCategoryId?.toString() || null,
        seeAllTargetServiceId: section.seeAllTargetServiceId?.toString() || null,
        cards: (section.cards || []).map(card => ({
          ...card,
          id: card._id ? card._id.toString() : card.id,
          targetCategoryId: card.targetCategoryId?.toString() || null,
          targetServiceId: card.targetServiceId?.toString() || null,
        }))
      })),
      isBannersVisible: contentObj.isBannersVisible ?? true,
      isPromosVisible: contentObj.isPromosVisible ?? true,
      isCuratedVisible: contentObj.isCuratedVisible ?? true,
      isNoteworthyVisible: contentObj.isNoteworthyVisible ?? true,
      isBookedVisible: contentObj.isBookedVisible ?? true,
      isCategorySectionsVisible: contentObj.isCategorySectionsVisible ?? true,
      isCategoriesVisible: contentObj.isCategoriesVisible ?? true
    };

    res.status(200).json({
      success: true,
      homeContent: formattedContent
    });

  } catch (error) {
    console.error('Get public home content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch home content. Please try again.'
    });
  }
};

/**
 * Get consolidated home data (Categories + Content)
 */
const getPublicHomeData = async (req, res) => {
  try {
    const { cityId } = req.query;

    // 1. Find all DB-active categories first (admin status is source of truth)
    const dbActiveCategoriesForHome = await Category.find({ status: { $in: ['active', 'coming_soon'] } }).select('_id title');
    const dbActiveCatIdsForHome = new Set(dbActiveCategoriesForHome.map(c => c._id.toString()));
    const dbActiveCatTitlesForHome = new Set(dbActiveCategoriesForHome.map(c => c.title.toLowerCase().trim()));

    // 2. Find all online and available vendors, filtered by city if provided
    let homeVendorFilter = { isOnline: true, workStatus: 'available' };
    if (cityId) {
      const City = require('../../models/City');
      const homeCityDoc = await City.findById(cityId).select('name').lean();
      if (homeCityDoc && homeCityDoc.name) {
        homeVendorFilter['address.city'] = new RegExp(`^${homeCityDoc.name.trim()}$`, 'i');
      }
    }
    const onlineVendors = await require('../../models/Vendor').find(homeVendorFilter)
      .select('categories location address geoLocation');

    const activeCategoryIds = new Set();
    const activeCategoryTitles = new Set();
    onlineVendors.forEach(vendor => {
      if (Array.isArray(vendor.categories)) {
        vendor.categories.forEach(cat => {
          if (cat) {
            if (mongoose.isValidObjectId(cat)) {
              // Only include if category is truly active in DB
              if (dbActiveCatIdsForHome.has(cat.toString())) {
                activeCategoryIds.add(cat.toString());
              }
            } else {
              // Only include title if it maps to an actually active DB category
              const titleLower = cat.toLowerCase().trim();
              if (dbActiveCatTitlesForHome.has(titleLower)) {
                activeCategoryTitles.add(titleLower);
              }
            }
          }
        });
      }
    });

    // 2. Fetch categories and home content
    const [categoriesRes, homeContent] = await Promise.all([
      Category.find({ 
        status: { $in: ['active', 'coming_soon'] }, 
        showOnHome: { $ne: false },
        $or: cityId ? [
          { cityIds: cityId },
          { cityIds: { $exists: false } },
          { cityIds: { $size: 0 } }
        ] : [{ status: { $in: ['active', 'coming_soon'] } }]
      })
        .select('title slug homeIconUrl homeBadge hasSaleBadge categoryType status interestedUsers')
        .sort({ homeOrder: 1 })
        .lean(),
      HomeContent.getHomeContent(cityId)
    ]);

    // Check optional authentication for isInterested flag
    const jwt = require('jsonwebtoken');
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        // Ignore invalid token for public endpoint
      }
    }

    const formattedCategories = categoriesRes
      .map(cat => ({
        id: cat._id.toString(),
        title: cat.title,
        slug: cat.slug,
        icon: cat.homeIconUrl || '',
        badge: cat.homeBadge || '',
        hasSaleBadge: cat.hasSaleBadge || false,
        categoryType: cat.categoryType || 'service',
        status: cat.status || 'active',
        interestedCount: cat.interestedUsers ? cat.interestedUsers.length : 0,
        isInterested: userId && cat.interestedUsers ? cat.interestedUsers.some(id => id.toString() === userId.toString()) : false
      }));

    // Deduplicate by title to prevent duplicate icons on home page
    const uniqueCategories = [];
    const seenTitles = new Set();
    formattedCategories.forEach(cat => {
      const lowerTitle = cat.title.toLowerCase();
      if (!seenTitles.has(lowerTitle)) {
        seenTitles.add(lowerTitle);
        uniqueCategories.push(cat);
      }
    });

    const { lat, lng } = req.query;
    const userLoc = (lat && lng) ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null;

    let formattedContent = null;
    if (homeContent) {
      const contentObj = homeContent.toObject();
      
      // Find all active categories
      const activeCats = await Category.find({ status: { $in: ['active', 'coming_soon'] } }).select('_id');
      const activeCatIds = activeCats.map(c => c._id);

      // We need to fetch all active services and brands to dynamically update home page cards
      // This ensures the price shown on home matches the nearest vendor
      // We no longer populate vendorId on Service/Brand because Admin creates them
      const allActiveServices = await Service.find({ status: 'active', categoryId: { $in: activeCatIds } }).lean();
      const allActiveBrands = await Brand.find({ status: 'active', categoryIds: { $in: activeCatIds } }).lean();

      // Helper to find best item for a title
      const findBestItem = (title, items) => {
        if (!title) return null;
        const targetTitle = title.toLowerCase().trim();
        
        let best = null;
        items.forEach(item => {
          // STRICT CHECK: Item's category must be in activeCategoryIds or Titles (meaning at least one online vendor serves it)
          const itemCategoryId = item.categoryId || (item.categoryIds && item.categoryIds[0]);
          let isSupported = false;
          
          if (itemCategoryId) {
            const idStr = itemCategoryId.toString();
            if (activeCategoryIds.has(idStr)) {
              isSupported = true;
            } else {
              // Get category title from pre-fetched categoriesRes
              const catObj = categoriesRes.find(c => c._id.toString() === idStr);
              if (catObj && activeCategoryTitles.has(catObj.title.toLowerCase().trim())) {
                isSupported = true;
              }
            }
          }
          
          if (!isSupported) return;
          
          if (item.title.toLowerCase().trim().includes(targetTitle) || targetTitle.includes(item.title.toLowerCase().trim())) {
            
            // Without specific vendor matching, we just pick the cheapest item for now
            if (!best) {
              best = item;
            } else {
              const currentPrice = item.basePrice || 0;
              const bestPrice = best.basePrice || 0;
              
              if (currentPrice < bestPrice) {
                best = item;
              }
            }
          }
        });
        
        return best;
      };

      formattedContent = {
        banners: (contentObj.banners || []).map(item => ({
          imageUrl: item.imageUrl,
          targetCategoryId: item.targetCategoryId?.toString() || null,
          slug: item.slug,
          order: item.order
        })),
        promos: (contentObj.promos || []).map(item => ({
          title: item.title,
          subtitle: item.subtitle,
          imageUrl: item.imageUrl,
          targetCategoryId: item.targetCategoryId?.toString() || null,
          order: item.order
        })),
        curated: (contentObj.curated || []).map(item => ({
          title: item.title,
          gifUrl: item.gifUrl,
          order: item.order
        })),
        noteworthy: (contentObj.noteworthy || []).map(item => ({
          title: item.title,
          imageUrl: item.imageUrl,
          targetCategoryId: item.targetCategoryId?.toString() || null,
          order: item.order
        })),
        booked: (contentObj.booked || []).map(item => {
          // Dynamically update booked items price
          const bestService = findBestItem(item.title, allActiveServices);
          return {
            title: item.title,
            rating: item.rating,
            price: bestService ? bestService.basePrice : item.price,
            imageUrl: item.imageUrl,
            targetCategoryId: item.targetCategoryId?.toString() || null,
            targetServiceId: bestService ? bestService._id.toString() : (item.targetServiceId?.toString() || null),
            slug: bestService ? bestService.slug : (item.slug || ''),
            order: item.order
          };
        }),
        categorySections: (contentObj.categorySections || []).map(section => ({
          title: section.title,
          seeAllTargetCategoryId: section.seeAllTargetCategoryId?.toString() || null,
          cards: (section.cards || []).map(card => {
            // Dynamically update card price and vendor name based on nearest logic
            const bestService = findBestItem(card.title, allActiveServices);
            const bestBrand = findBestItem(card.title, allActiveBrands);
            const best = bestService || bestBrand;
            
            let displayTitle = card.title;
            if (best && best.vendorId) {
              const vendorName = best.vendorId.businessName || best.vendorId.name;
              displayTitle = `${card.title} by ${vendorName}`;
            }

            return {
              title: displayTitle,
              imageUrl: card.imageUrl,
              price: best ? (best.basePrice || best.price) : card.price,
              rating: card.rating,
              targetCategoryId: card.targetCategoryId?.toString() || null,
              targetServiceId: card.targetServiceId?.toString() || null,
              slug: card.slug, // VITAL: Keep the original brand slug so navigation doesn't break
            };
          }),
          order: section.order
        })),
        isBannersVisible: contentObj.isBannersVisible ?? true,
        isPromosVisible: contentObj.isPromosVisible ?? true,
        isCuratedVisible: contentObj.isCuratedVisible ?? true,
        isNoteworthyVisible: contentObj.isNoteworthyVisible ?? true,
        isBookedVisible: contentObj.isBookedVisible ?? true,
        isCategorySectionsVisible: contentObj.isCategorySectionsVisible ?? true,
        isCategoriesVisible: contentObj.isCategoriesVisible ?? true,
        isFeaturedSectionsVisible: contentObj.isFeaturedSectionsVisible ?? true,
        featuredSections: await Promise.all(
          (contentObj.featuredSections || [])
            .filter(section => section.isVisible)
            .sort((a, b) => a.order - b.order)
            .map(async (section) => {
              const populatedItems = await Promise.all(
                (section.items || []).map(async (item) => {
                  if (!item.refId) return null;
                  try {
                    let doc;
                    if (section.type === 'brand') {
                      doc = await Brand.findById(item.refId).select('_id title slug iconUrl').lean();
                    } else {
                      doc = await Category.findById(item.refId).select('_id title slug homeIconUrl').lean();
                    }
                    if (!doc) return null;
                    return {
                      refId: item.refId.toString(),
                      order: item.order,
                      title: doc.title,
                      slug: doc.slug,
                      iconUrl: section.type === 'brand' ? (doc.iconUrl || '') : (doc.homeIconUrl || '')
                    };
                  } catch { return null; }
                })
              );
              return {
                sectionTitle: section.sectionTitle,
                type: section.type,
                order: section.order,
                items: populatedItems.filter(Boolean).sort((a, b) => a.order - b.order)
              };
            })
        )
      };
    }

    res.status(200).json({
      success: true,
      categories: uniqueCategories,
      homeContent: formattedContent
    });
  } catch (error) {
    console.error('Get public home data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch home data'
    });
  }
};

/**
 * Get all active professions
 * GET /api/public/professions
 */
const getPublicProfessions = async (req, res) => {
  try {
    const Profession = require('../../models/Profession');
    const professions = await Profession.find({ status: 'active' })
      .populate('categories', 'title _id homeIconUrl imageUrl slug')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: professions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch professions',
      error: error.message
    });
  }
};

/**
 * Get active training videos and questions for vendor signup
 * GET /api/public/training-data
 */
const getPublicTrainingData = async (req, res) => {
  try {
    const TrainingVideo = require('../../models/TrainingVideo');
    const TrainingQuestion = require('../../models/TrainingQuestion');

    // For signup, fetch all global required videos and random questions
    const videos = await TrainingVideo.find({ isActive: true, isRequired: true })
      .sort({ order: 1 })
      .select('title description videoUrl videoSource durationSeconds');

    const questions = await TrainingQuestion.find({ isActive: true })
      .select('question options difficulty');

    res.status(200).json({
      success: true,
      videos,
      questions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch training data',
      error: error.message
    });
  }
};

/**
 * Register interest in a coming soon category
 * POST /api/public/categories/:categoryId/interested
 */
const registerInterest = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const userId = req.user ? req.user.id : null;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (category.status !== 'coming_soon') {
      return res.status(400).json({ success: false, message: 'Category is not coming soon' });
    }

    if (!category.interestedUsers) {
      category.interestedUsers = [];
    }

    if (category.interestedUsers.some(id => id.toString() === userId.toString())) {
      return res.status(200).json({
        success: true,
        message: 'You have already registered interest in this category!',
        interestedCount: category.interestedUsers.length,
        isInterested: true
      });
    }

    category.interestedUsers.push(userId);
    await category.save();

    res.status(200).json({
      success: true,
      message: 'Thank you for your interest! We will notify you when it launches.',
      interestedCount: category.interestedUsers.length,
      isInterested: true
    });
  } catch (error) {
    console.error('Register interest error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getPublicServiceDynamicDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const ServiceField = require('../../models/ServiceField');
    const ServiceWorkflow = require('../../models/ServiceWorkflow');
    const ServiceWorkflowStep = require('../../models/ServiceWorkflowStep');
    const PricingRule = require('../../models/PricingRule');
    const ServicePageBlock = require('../../models/ServicePageBlock');

    const service = await Service.findById(id).lean();
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    const fields = await ServiceField.find({ serviceId: id }).sort({ order: 1 }).lean();
    const workflow = await ServiceWorkflow.findOne({ serviceId: id }).lean();
    let steps = [];
    if (workflow) {
      steps = await ServiceWorkflowStep.find({ workflowId: workflow._id }).sort({ sequence: 1 }).lean();
    }
    const pricingRules = await PricingRule.find({ serviceId: id }).lean();
    const pageBlocks = await ServicePageBlock.find({ serviceId: id, isVisible: true }).sort({ order: 1 }).lean();

    res.status(200).json({
      success: true,
      service,
      fields,
      workflow: workflow ? { ...workflow, steps } : null,
      pricingRules,
      pageBlocks
    });
  } catch (error) {
    console.error('Get public service dynamic details error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getPublicCategories,
  getPublicSubCategories,
  getPublicBrands,
  getPublicBrandBySlug,
  getPublicServices,
  getPublicHomeContent,
  getPublicHomeData,
  getPublicBookingHierarchy,
  getPublicProfessions,
  getPublicTrainingData,
  registerInterest,
  getPublicServiceDynamicDetails
};
