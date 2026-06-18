const HomeContent = require('../../models/HomeContent');
const Brand = require('../../models/Brand');
const Category = require('../../models/Category');
const { validationResult } = require('express-validator');

/**
 * Get Home Content
 * GET /api/admin/home-content
 */
const getHomeContent = async (req, res) => {
  try {
    const { cityId } = req.query;
    let homeContent = await HomeContent.getHomeContent(cityId);

    // Populate featuredSections items with actual Brand/Category data
    const populatedSections = await Promise.all(
      (homeContent.featuredSections || []).map(async (section) => {
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
          _id: section._id?.toString(),
          sectionTitle: section.sectionTitle,
          type: section.type,
          isVisible: section.isVisible,
          order: section.order,
          items: populatedItems.filter(Boolean).sort((a, b) => a.order - b.order)
        };
      })
    );

    res.status(200).json({
      success: true,
      homeContent: {
        id: homeContent._id,
        cityId: homeContent.cityId,
        banners: homeContent.banners || [],
        promos: homeContent.promos || [],
        curated: homeContent.curated || [],
        noteworthy: homeContent.noteworthy || [],
        booked: homeContent.booked || [],
        categorySections: homeContent.categorySections || [],
        featuredSections: populatedSections.sort((a, b) => a.order - b.order),
        isActive: homeContent.isActive,
        isBannersVisible: homeContent.isBannersVisible ?? true,
        isPromosVisible: homeContent.isPromosVisible ?? true,
        isCuratedVisible: homeContent.isCuratedVisible ?? true,
        isNoteworthyVisible: homeContent.isNoteworthyVisible ?? true,
        isBookedVisible: homeContent.isBookedVisible ?? true,
        isCategorySectionsVisible: homeContent.isCategorySectionsVisible ?? true,
        isCategoriesVisible: homeContent.isCategoriesVisible ?? true,
        isFeaturedSectionsVisible: homeContent.isFeaturedSectionsVisible ?? true,
        popularServices: homeContent.popularServices || [],
        isPopularServicesVisible: homeContent.isPopularServicesVisible ?? true,
        createdAt: homeContent.createdAt,
        updatedAt: homeContent.updatedAt
      }
    });
  } catch (error) {
    console.error('Get home content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch home content. Please try again.'
    });
  }
};

/**
 * Update Home Content
 * PUT /api/admin/home-content
 */
const updateHomeContent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { cityId } = req.query;

    // Use static method to ensure we get the correct doc (or create if needed)
    let homeContent = await HomeContent.getHomeContent(cityId);

    // Helper to sanitize array items
    const sanitizeItems = (items) => {
      if (!Array.isArray(items)) return [];
      return items.map(item => {
        const newItem = { ...item };
        // Remove frontend-only 'id' fields that are strings
        if (typeof newItem.id === 'string' && (
          newItem.id.startsWith('hbnr-') ||
          newItem.id.startsWith('hprm-') ||
          newItem.id.startsWith('hcur-') ||
          newItem.id.startsWith('hnot-') ||
          newItem.id.startsWith('hbkd-') ||
          newItem.id.startsWith('hsec-')
        )) {
          delete newItem.id;
        }

        if (newItem.targetCategoryId === '') newItem.targetCategoryId = null;
        if (newItem.seeAllTargetCategoryId === '') newItem.seeAllTargetCategoryId = null;
        if (newItem.targetServiceId === '') newItem.targetServiceId = null;
        if (newItem.seeAllTargetServiceId === '') newItem.seeAllTargetServiceId = null;

        if (Array.isArray(newItem.cards)) {
          newItem.cards = newItem.cards.map(card => {
            const newCard = { ...card };
            if (newCard.targetCategoryId === '') newCard.targetCategoryId = null;
            if (newCard.targetServiceId === '') newCard.targetServiceId = null;
            if (typeof newCard.id === 'string' && newCard.id.startsWith('hcard-')) {
              delete newCard.id;
            }
            return newCard;
          });
        }

        return newItem;
      });
    };

    // Update fields with sanitization
    if (req.body.banners !== undefined) homeContent.banners = sanitizeItems(req.body.banners);
    if (req.body.promos !== undefined) homeContent.promos = sanitizeItems(req.body.promos);
    if (req.body.curated !== undefined) homeContent.curated = sanitizeItems(req.body.curated);
    if (req.body.noteworthy !== undefined) homeContent.noteworthy = sanitizeItems(req.body.noteworthy);
    if (req.body.booked !== undefined) homeContent.booked = sanitizeItems(req.body.booked);
    if (req.body.categorySections !== undefined) {
      homeContent.categorySections = sanitizeItems(req.body.categorySections);
      homeContent.markModified('categorySections');
    }

    if (req.body.isActive !== undefined) homeContent.isActive = req.body.isActive;
    if (req.body.isBannersVisible !== undefined) homeContent.isBannersVisible = req.body.isBannersVisible;
    if (req.body.isPromosVisible !== undefined) homeContent.isPromosVisible = req.body.isPromosVisible;
    if (req.body.isCuratedVisible !== undefined) homeContent.isCuratedVisible = req.body.isCuratedVisible;
    if (req.body.isNoteworthyVisible !== undefined) homeContent.isNoteworthyVisible = req.body.isNoteworthyVisible;
    if (req.body.isBookedVisible !== undefined) homeContent.isBookedVisible = req.body.isBookedVisible;
    if (req.body.isCategorySectionsVisible !== undefined) homeContent.isCategorySectionsVisible = req.body.isCategorySectionsVisible;
    if (req.body.isCategoriesVisible !== undefined) homeContent.isCategoriesVisible = req.body.isCategoriesVisible;
    if (req.body.isFeaturedSectionsVisible !== undefined) homeContent.isFeaturedSectionsVisible = req.body.isFeaturedSectionsVisible;
    if (req.body.popularServices !== undefined) homeContent.popularServices = req.body.popularServices;
    if (req.body.isPopularServicesVisible !== undefined) homeContent.isPopularServicesVisible = req.body.isPopularServicesVisible;

    // Handle featuredSections
    if (req.body.featuredSections !== undefined) {
      homeContent.featuredSections = (req.body.featuredSections || []).map(section => ({
        sectionTitle: section.sectionTitle || 'Featured',
        type: section.type || 'brand',
        isVisible: section.isVisible !== undefined ? section.isVisible : true,
        order: section.order || 0,
        items: (section.items || []).map(item => ({
          refId: item.refId || null,
          order: item.order || 0
        })).filter(item => item.refId)
      }));
      homeContent.markModified('featuredSections');
    }

    await homeContent.save();

    res.status(200).json({
      success: true,
      message: 'Home content updated successfully',
      homeContent: {
        id: homeContent._id,
        cityId: homeContent.cityId,
        banners: homeContent.banners,
        promos: homeContent.promos,
        curated: homeContent.curated,
        noteworthy: homeContent.noteworthy,
        booked: homeContent.booked,
        categorySections: homeContent.categorySections,
        featuredSections: homeContent.featuredSections,
        isActive: homeContent.isActive,
        isBannersVisible: homeContent.isBannersVisible,
        isPromosVisible: homeContent.isPromosVisible,
        isCuratedVisible: homeContent.isCuratedVisible,
        isNoteworthyVisible: homeContent.isNoteworthyVisible,
        isBookedVisible: homeContent.isBookedVisible,
        isCategorySectionsVisible: homeContent.isCategorySectionsVisible,
        isCategoriesVisible: homeContent.isCategoriesVisible,
        isFeaturedSectionsVisible: homeContent.isFeaturedSectionsVisible,
        popularServices: homeContent.popularServices || [],
        isPopularServicesVisible: homeContent.isPopularServicesVisible
      }
    });
  } catch (error) {
    console.error('Update home content error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update home content. Please try again.'
    });
  }
};

/**
 * Get Available Items for Featured Sections (Brands or Categories)
 * GET /api/admin/home-content/available-items?type=brand|category
 */
const getAvailableItems = async (req, res) => {
  try {
    const { type = 'brand' } = req.query;
    let items = [];
    if (type === 'brand') {
      const brands = await Brand.find({ status: 'active' })
        .select('_id title slug iconUrl')
        .sort({ title: 1 })
        .lean();
      items = brands.map(b => ({
        id: b._id.toString(),
        title: b.title,
        slug: b.slug,
        iconUrl: b.iconUrl || ''
      }));
    } else {
      const categories = await Category.find({ status: 'active' })
        .select('_id title slug homeIconUrl')
        .sort({ title: 1 })
        .lean();
      items = categories.map(c => ({
        id: c._id.toString(),
        title: c.title,
        slug: c.slug,
        iconUrl: c.homeIconUrl || ''
      }));
    }
    res.status(200).json({ success: true, items });
  } catch (error) {
    console.error('Get available items error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch items.' });
  }
};

module.exports = {
  getHomeContent,
  updateHomeContent,
  getAvailableItems
};
