const Category = require('../../models/Category');
const { validationResult } = require('express-validator');
const { SERVICE_STATUS } = require('../../utils/constants');

/**
 * Get all categories
 * GET /api/admin/categories
 */
const getAllCategories = async (req, res) => {
  try {
    const { status, showOnHome, isPopular, cityId, zoneId } = req.query;

    // Build query
    const query = { status: { $ne: 'deleted' } };
    if (status) query.status = status;
    if (showOnHome !== undefined) query.showOnHome = showOnHome === 'true';
    if (isPopular !== undefined) query.isPopular = isPopular === 'true';
    if (zoneId) {
      query.$or = [
        { zoneIds: zoneId },
        { zoneIds: { $exists: false } },
        { zoneIds: { $size: 0 } }
      ];
    } else if (cityId) {
      query.$or = [
        { cityIds: cityId },
        { cityIds: { $exists: false } },
        { cityIds: { $size: 0 } }
      ];
    }

    const categories = await Category.find(query)
      .select('-__v')
      .populate('vendorId', 'name businessName')
      .populate('zoneIds', 'name')
      .sort({ homeOrder: 1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: categories.length,
      categories: categories.map(cat => ({
        id: cat._id,
        title: cat.title,
        slug: cat.slug,
        homeIconUrl: cat.homeIconUrl,
        bannerImage: cat.bannerImage,
        homeBadge: cat.homeBadge,
        hasSaleBadge: cat.hasSaleBadge,
        hasBrands: cat.hasBrands ?? true,
        hasSubCategory: cat.hasSubCategory ?? true,
        hasBrand: cat.hasBrand ?? true,
        templateId: cat.templateId ? cat.templateId.toString() : null,
        enableBrands: cat.enableBrands || false,
        brandRequired: cat.brandRequired || false,
        enableConsultantBooking: cat.enableConsultantBooking || false,
        enableWarranty: cat.enableWarranty || false,
        enableMultiVisit: cat.enableMultiVisit || false,
        enablePricingMatrix: cat.enablePricingMatrix !== false,
        showOnHome: cat.showOnHome,
        homeOrder: cat.homeOrder,
        description: cat.description,
        imageUrl: cat.imageUrl,
        status: cat.status,
        isPopular: cat.isPopular,
        cityIds: cat.cityIds || [],
        zoneIds: (cat.zoneIds || []).filter(Boolean),
        metaTitle: cat.metaTitle,
        metaDescription: cat.metaDescription,
        categoryType: cat.categoryType,
        vendorId: cat.vendorId,
        interestedCount: cat.interestedUsers ? cat.interestedUsers.length : 0,
        isGroupCategory: cat.isGroupCategory || false,
        mappedCategories: (cat.mappedCategories || []).map(id => (id && typeof id === 'object') ? id.toString() : String(id)),
        minWalletBalance: cat.minWalletBalance || 0,
        sacCode: cat.sacCode || null,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt
      }))
    });
  } catch (error) {
    console.error('Get all categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories. Please try again.'
    });
  }
};

/**
 * Get single category by ID
 * GET /api/admin/categories/:id
 */
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id).select('-__v').lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      category: {
        id: category._id,
        title: category.title,
        slug: category.slug,
        homeIconUrl: category.homeIconUrl,
        bannerImage: category.bannerImage,
        homeBadge: category.homeBadge,
        hasSaleBadge: category.hasSaleBadge,
        hasBrands: category.hasBrands ?? true,
        hasSubCategory: category.hasSubCategory ?? true,
        hasBrand: category.hasBrand ?? true,
        templateId: category.templateId,
        enableBrands: category.enableBrands || false,
        brandRequired: category.brandRequired || false,
        enableConsultantBooking: category.enableConsultantBooking || false,
        enableWarranty: category.enableWarranty || false,
        enableMultiVisit: category.enableMultiVisit || false,
        enablePricingMatrix: category.enablePricingMatrix !== false,
        showOnHome: category.showOnHome,
        homeOrder: category.homeOrder,
        description: category.description,
        imageUrl: category.imageUrl,
        status: category.status,
        isPopular: category.isPopular,
        cityIds: category.cityIds || [],
        zoneIds: category.zoneIds || [],
        metaTitle: category.metaTitle,
        metaDescription: category.metaDescription,
        categoryType: category.categoryType,
        vendorId: category.vendorId,
        interestedCount: category.interestedUsers ? category.interestedUsers.length : 0,
        sacCode: category.sacCode || null,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      }
    });
  } catch (error) {
    console.error('Get category by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category. Please try again.'
    });
  }
};

/**
 * Create new category
 * POST /api/admin/categories
 */
const createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Category Create Validation Errors:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Intercept if City Admin
    const { handleCityAdminApproval } = require('../../utils/approvalInterceptor');
    const isIntercepted = await handleCityAdminApproval(req, res, {
      requestType: 'category',
      proposedData: req.body,
      cityId: req.body.cityIds && req.body.cityIds[0]
    });
    if (isIntercepted) return;

    const {
      title,
      slug,
      homeIconUrl,
      bannerImage,
      homeBadge,
      hasSaleBadge,
      hasBrands,
      hasSubCategory,
      hasBrand,
      templateId,
      enableBrands,
      brandRequired,
      enableConsultantBooking,
      enableWarranty,
      enableMultiVisit,
      enablePricingMatrix,
      showOnHome,
      homeOrder,
      description,
      imageUrl,
      status,
      isPopular,
      metaTitle,
      metaDescription,
      cityIds,
      zoneIds,
      categoryType,
      isGroupCategory,
      mappedCategories,
      minWalletBalance,
      sacCode
    } = req.body;

    console.log('Creating category with payload:', req.body);

    // Check for duplicate slug ONLY within the same cities
    // Logic:
    // 1. If cityIds provided, check if any existing category with same slug has overlapping cityIds
    // 2. If no cityIds (global), check if global category with same slug exists

    const slugToCheck = slug?.trim().toLowerCase() || title.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

    // Build query for duplicate check
    const duplicateQuery = {
      $or: [
        { slug: slugToCheck }
      ]
    };

    const existingCategory = await Category.findOne(duplicateQuery);

    let isDuplicate = false;
    if (existingCategory) {
      // If found, check city overlap
      const existingCities = existingCategory.cityIds.map(id => id.toString());
      const newCities = (cityIds || []).map(id => id.toString());

      if (newCities.length === 0) {
        // Trying to create Global. Duplicate if existing is also Global
        if (existingCities.length === 0) isDuplicate = true;
      } else {
        // Trying to create City-specific. Duplicate if ANY overlap
        const hasOverlap = newCities.some(cityId => existingCities.includes(cityId));
        if (hasOverlap) isDuplicate = true;

        // Also duplicate if existing is Global (Global covers all cities)
        if (existingCities.length === 0) isDuplicate = true;
      }
    }

    if (isDuplicate && existingCategory) {
      if (existingCategory.status === SERVICE_STATUS.DELETED) {
        // Revive deleted category
        existingCategory.title = title.trim();
        existingCategory.homeIconUrl = homeIconUrl || null;
        existingCategory.bannerImage = bannerImage || null;
        existingCategory.homeBadge = homeBadge?.trim() || null;
        existingCategory.hasSaleBadge = Boolean(hasSaleBadge);
        existingCategory.hasBrands = hasBrands !== undefined ? Boolean(hasBrands) : true;
        existingCategory.hasSubCategory = hasSubCategory !== undefined ? Boolean(hasSubCategory) : true;
        existingCategory.hasBrand = hasBrand !== undefined ? Boolean(hasBrand) : true;
        existingCategory.showOnHome = showOnHome !== false;
        existingCategory.homeOrder = Number(homeOrder) || 0;
        existingCategory.description = description?.trim() || null;
        existingCategory.imageUrl = imageUrl || null;
        existingCategory.status = status || SERVICE_STATUS.ACTIVE;
        existingCategory.isPopular = Boolean(isPopular);
        existingCategory.metaTitle = metaTitle?.trim() || null;
        existingCategory.metaDescription = metaDescription?.trim() || null;
        existingCategory.cityIds = cityIds || [];
        existingCategory.categoryType = categoryType || 'service';
        existingCategory.templateId = templateId || null;
        existingCategory.enableBrands = enableBrands !== undefined ? Boolean(enableBrands) : false;
        existingCategory.brandRequired = brandRequired !== undefined ? Boolean(brandRequired) : false;
        existingCategory.enableConsultantBooking = enableConsultantBooking !== undefined ? Boolean(enableConsultantBooking) : false;
        existingCategory.enableWarranty = enableWarranty !== undefined ? Boolean(enableWarranty) : false;
        existingCategory.enableMultiVisit = enableMultiVisit !== undefined ? Boolean(enableMultiVisit) : false;
        existingCategory.enablePricingMatrix = enablePricingMatrix !== undefined ? Boolean(enablePricingMatrix) : true;
        existingCategory.createdBy = req.user.id;
        existingCategory.minWalletBalance = minWalletBalance !== undefined ? Number(minWalletBalance) : 0;
        if (sacCode !== undefined) existingCategory.sacCode = sacCode || null;
        
        await existingCategory.save();
        
        return res.status(201).json({
          success: true,
          message: 'Category revived successfully',
          category: {
            id: existingCategory._id,
            title: existingCategory.title,
            slug: existingCategory.slug,
            homeIconUrl: existingCategory.homeIconUrl,
            bannerImage: existingCategory.bannerImage,
            homeBadge: existingCategory.homeBadge,
            hasSaleBadge: existingCategory.hasSaleBadge,
            hasBrands: existingCategory.hasBrands ?? true,
            hasSubCategory: existingCategory.hasSubCategory ?? true,
            hasBrand: existingCategory.hasBrand ?? true,
            showOnHome: existingCategory.showOnHome,
            homeOrder: existingCategory.homeOrder,
            description: existingCategory.description,
            imageUrl: existingCategory.imageUrl,
            status: existingCategory.status,
            isPopular: existingCategory.isPopular,
            categoryType: existingCategory.categoryType,
            sacCode: existingCategory.sacCode || null,
            createdAt: existingCategory.createdAt,
            updatedAt: existingCategory.updatedAt,
            minWalletBalance: existingCategory.minWalletBalance
          }
        });
      }

      console.log('Category with this title/slug already exists:', existingCategory.title, existingCategory.slug);
      return res.status(400).json({
        success: false,
        message: 'Category with this title or slug already exists'
      });
    }

    const category = await Category.create({
      title: title.trim(),
      slug: slug?.trim().toLowerCase() || undefined, // Will be auto-generated if not provided
      homeIconUrl: homeIconUrl || null,
      bannerImage: bannerImage || null,
      homeBadge: homeBadge?.trim() || null,
      hasSaleBadge: Boolean(hasSaleBadge),
      hasBrands: hasBrands !== undefined ? Boolean(hasBrands) : true,
      hasSubCategory: hasSubCategory !== undefined ? Boolean(hasSubCategory) : true,
      hasBrand: hasBrand !== undefined ? Boolean(hasBrand) : true,
      showOnHome: showOnHome !== false,
      homeOrder: Number(homeOrder) || 0,
      description: description?.trim() || null,
      imageUrl: imageUrl || null,
      status: status || SERVICE_STATUS.ACTIVE,
      isPopular: Boolean(isPopular),
      metaTitle: metaTitle?.trim() || null,
      metaDescription: metaDescription?.trim() || null,
      cityIds: cityIds || [],
      zoneIds: zoneIds || [],
      categoryType: categoryType || 'service',
      templateId: templateId || null,
      enableBrands: enableBrands !== undefined ? Boolean(enableBrands) : false,
      brandRequired: brandRequired !== undefined ? Boolean(brandRequired) : false,
      enableConsultantBooking: enableConsultantBooking !== undefined ? Boolean(enableConsultantBooking) : false,
      enableWarranty: enableWarranty !== undefined ? Boolean(enableWarranty) : false,
      enableMultiVisit: enableMultiVisit !== undefined ? Boolean(enableMultiVisit) : false,
      enablePricingMatrix: enablePricingMatrix !== undefined ? Boolean(enablePricingMatrix) : true,
      createdBy: req.user.id,
      isGroupCategory: isGroupCategory !== undefined ? Boolean(isGroupCategory) : false,
      mappedCategories: Array.isArray(mappedCategories) ? mappedCategories : [],
      minWalletBalance: minWalletBalance !== undefined ? Number(minWalletBalance) : 0,
      sacCode: sacCode || null
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: {
        id: category._id,
        title: category.title,
        slug: category.slug,
        homeIconUrl: category.homeIconUrl,
        bannerImage: category.bannerImage,
        homeBadge: category.homeBadge,
        hasSaleBadge: category.hasSaleBadge,
        hasBrands: category.hasBrands ?? true,
        hasSubCategory: category.hasSubCategory ?? true,
        hasBrand: category.hasBrand ?? true,
        showOnHome: category.showOnHome,
        homeOrder: category.homeOrder,
        description: category.description,
        imageUrl: category.imageUrl,
        status: category.status,
        isPopular: category.isPopular,
        categoryType: category.categoryType,
        templateId: category.templateId ? category.templateId.toString() : null,
        enableBrands: category.enableBrands || false,
        brandRequired: category.brandRequired || false,
        enableConsultantBooking: category.enableConsultantBooking || false,
        enableWarranty: category.enableWarranty || false,
        enableMultiVisit: category.enableMultiVisit || false,
        enablePricingMatrix: category.enablePricingMatrix !== false,
        cityIds: category.cityIds || [],
        zoneIds: category.zoneIds || [],
        interestedCount: category.interestedUsers ? category.interestedUsers.length : 0,
        isGroupCategory: category.isGroupCategory || false,
        mappedCategories: (category.mappedCategories || []).map(id => id.toString()),
        minWalletBalance: category.minWalletBalance || 0,
        sacCode: category.sacCode || null,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      }
    });
  } catch (error) {
    console.error('Create category error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category with this title or slug already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create category. Please try again.'
    });
  }
};

/**
 * Update category
 * PUT /api/admin/categories/:id
 */
const updateCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Intercept if City Admin
    const { handleCityAdminApproval } = require('../../utils/approvalInterceptor');
    const isIntercepted = await handleCityAdminApproval(req, res, {
      requestType: 'category',
      proposedData: { categoryId: req.params.id, ...req.body },
      cityId: req.body.cityIds && req.body.cityIds[0]
    });
    if (isIntercepted) return;

    const { id } = req.params;
    const {
      title,
      slug,
      homeIconUrl,
      bannerImage,
      homeBadge,
      hasSaleBadge,
      hasBrands,
      hasSubCategory,
      hasBrand,
      showOnHome,
      homeOrder,
      description,
      imageUrl,
      status,
      isPopular,
      metaTitle,
      metaDescription,
      cityIds: updateCityIds,
      zoneIds: updateZoneIds,
      categoryType,
      templateId,
      enableBrands,
      brandRequired,
      enableConsultantBooking,
      enableWarranty,
      enableMultiVisit,
      enablePricingMatrix,
      isGroupCategory,
      mappedCategories,
      minWalletBalance,
      sacCode
    } = req.body;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check for duplicate slug ONLY within the same cities
    if (title || slug || updateCityIds) {
      const slugToCheck = slug?.trim().toLowerCase() || (title ? title.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-') : category.slug);

      const duplicateQuery = {
        _id: { $ne: id },
        slug: slugToCheck
      };

      const existingCategory = await Category.findOne(duplicateQuery);

      if (existingCategory) {
        let isDuplicate = false;
        const existingCities = existingCategory.cityIds.map(id => id.toString());
        // For update, if updateCityIds provided use it, else use existing category.cityIds
        const newCities = (updateCityIds ? updateCityIds : category.cityIds).map(id => id.toString());

        if (newCities.length === 0) {
          if (existingCities.length === 0) isDuplicate = true;
        } else {
          const hasOverlap = newCities.some(cityId => existingCities.includes(cityId));
          if (hasOverlap) isDuplicate = true;
          if (existingCities.length === 0) isDuplicate = true;
        }

        if (isDuplicate) {
          return res.status(400).json({
            success: false,
            message: 'Category with this title or slug already exists'
          });
        }
      }
    }

    // Update fields
    if (title !== undefined) category.title = title.trim();
    if (slug !== undefined) category.slug = slug.trim().toLowerCase();
    if (homeIconUrl !== undefined) category.homeIconUrl = homeIconUrl || null;
    if (bannerImage !== undefined) category.bannerImage = bannerImage || null;
    if (homeBadge !== undefined) category.homeBadge = homeBadge?.trim() || null;
    if (hasSaleBadge !== undefined) category.hasSaleBadge = Boolean(hasSaleBadge);
    if (hasBrands !== undefined) category.hasBrands = Boolean(hasBrands);
    if (hasSubCategory !== undefined) category.hasSubCategory = Boolean(hasSubCategory);
    if (hasBrand !== undefined) category.hasBrand = Boolean(hasBrand);
    if (showOnHome !== undefined) category.showOnHome = showOnHome !== false;
    if (homeOrder !== undefined) category.homeOrder = Number(homeOrder) || 0;
    if (description !== undefined) category.description = description?.trim() || null;
    if (imageUrl !== undefined) category.imageUrl = imageUrl || null;
    if (status !== undefined) category.status = status;
    if (isPopular !== undefined) category.isPopular = Boolean(isPopular);
    if (metaTitle !== undefined) category.metaTitle = metaTitle?.trim() || null;
    if (metaDescription !== undefined) category.metaDescription = metaDescription?.trim() || null;
    if (categoryType !== undefined) category.categoryType = categoryType;
    if (templateId !== undefined) category.templateId = templateId || null;
    if (enableBrands !== undefined) category.enableBrands = Boolean(enableBrands);
    if (brandRequired !== undefined) category.brandRequired = Boolean(brandRequired);
    if (enableConsultantBooking !== undefined) category.enableConsultantBooking = Boolean(enableConsultantBooking);
    if (enableWarranty !== undefined) category.enableWarranty = Boolean(enableWarranty);
    if (enableMultiVisit !== undefined) category.enableMultiVisit = Boolean(enableMultiVisit);
    if (enablePricingMatrix !== undefined) category.enablePricingMatrix = Boolean(enablePricingMatrix);
    if (minWalletBalance !== undefined) {
      category.minWalletBalance = Number(minWalletBalance);
      category.markModified('minWalletBalance');
    }
    if (sacCode !== undefined) {
      category.sacCode = sacCode || null;
      category.markModified('sacCode');
    }

    if (updateCityIds !== undefined) {
      category.cityIds = updateCityIds;
      category.markModified('cityIds');
    }
    const finalZonesToUpdate = updateZoneIds !== undefined ? updateZoneIds : req.body.zoneIds;
    if (finalZonesToUpdate !== undefined) {
      category.zoneIds = finalZonesToUpdate;
      category.markModified('zoneIds');
    }
    if (isGroupCategory !== undefined) category.isGroupCategory = Boolean(isGroupCategory);
    if (mappedCategories !== undefined) {
      category.mappedCategories = Array.isArray(mappedCategories) ? mappedCategories : [];
      category.markModified('mappedCategories');
    }

    await category.save();

    // Also do a direct DB update to guarantee minWalletBalance and sacCode are persisted
    const directUpdate = {};
    if (minWalletBalance !== undefined) directUpdate.minWalletBalance = Number(minWalletBalance);
    if (sacCode !== undefined) directUpdate.sacCode = sacCode || null;
    if (Object.keys(directUpdate).length > 0) {
      await Category.updateOne({ _id: id }, { $set: directUpdate });
    }

    // Re-read from DB to return accurate data
    const savedCategory = await Category.findById(id).lean();

    console.log('📌 Category saved. minWalletBalance:', savedCategory.minWalletBalance, 'sacCode:', savedCategory.sacCode);

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      category: {
        id: savedCategory._id,
        title: savedCategory.title,
        slug: savedCategory.slug,
        homeIconUrl: savedCategory.homeIconUrl,
        bannerImage: savedCategory.bannerImage,
        homeBadge: savedCategory.homeBadge,
        hasSaleBadge: savedCategory.hasSaleBadge,
        hasBrands: savedCategory.hasBrands ?? true,
        hasSubCategory: savedCategory.hasSubCategory ?? true,
        hasBrand: savedCategory.hasBrand ?? true,
        templateId: savedCategory.templateId ? savedCategory.templateId.toString() : null,
        enableBrands: savedCategory.enableBrands || false,
        brandRequired: savedCategory.brandRequired || false,
        enableConsultantBooking: savedCategory.enableConsultantBooking || false,
        enableWarranty: savedCategory.enableWarranty || false,
        enableMultiVisit: savedCategory.enableMultiVisit || false,
        enablePricingMatrix: savedCategory.enablePricingMatrix !== false,
        showOnHome: savedCategory.showOnHome,
        homeOrder: savedCategory.homeOrder,
        description: savedCategory.description,
        imageUrl: savedCategory.imageUrl,
        status: savedCategory.status,
        isPopular: savedCategory.isPopular,
        categoryType: savedCategory.categoryType,
        vendorId: savedCategory.vendorId,
        cityIds: (savedCategory.cityIds || []).map(id => id.toString()),
        zoneIds: (savedCategory.zoneIds || []).map(id => id.toString()),
        interestedCount: savedCategory.interestedUsers ? savedCategory.interestedUsers.length : 0,
        isGroupCategory: savedCategory.isGroupCategory || false,
        mappedCategories: (savedCategory.mappedCategories || []).map(id => id.toString()),
        minWalletBalance: savedCategory.minWalletBalance || 0,
        sacCode: savedCategory.sacCode || null,
        createdAt: savedCategory.createdAt,
        updatedAt: savedCategory.updatedAt
      }
    });
  } catch (error) {
    console.error('Update category error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category with this title or slug already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update category. Please try again.'
    });
  }
};

/**
 * Delete category (soft delete - set status to deleted)
 * DELETE /api/admin/categories/:id
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Hard delete category
    await Category.findByIdAndDelete(id);

    // Delete associated subcategories
    const SubCategory = require('../../models/SubCategory');
    await SubCategory.deleteMany({ categoryId: id });

    // Delete associated services
    const Service = require('../../models/Service');
    const services = await Service.find({ categoryId: id });
    const serviceIds = services.map(s => s._id);
    await Service.deleteMany({ categoryId: id });

    // Delete associated pricing configurations
    const PricingConfig = require('../../models/PricingConfig');
    await PricingConfig.deleteMany({ categoryId: id });

    // Delete associated service brand pricings
    const ServiceBrandPricing = require('../../models/ServiceBrandPricing');
    await ServiceBrandPricing.deleteMany({ categoryId: id });

    // Delete dynamic details (page blocks, workflows, etc.) for those services
    if (serviceIds.length > 0) {
      const ServiceField = require('../../models/ServiceField');
      const ServiceWorkflow = require('../../models/ServiceWorkflow');
      const ServiceWorkflowStep = require('../../models/ServiceWorkflowStep');
      const PricingRule = require('../../models/PricingRule');
      const ServicePageBlock = require('../../models/ServicePageBlock');

      await ServiceField.deleteMany({ serviceId: { $in: serviceIds } });
      const workflows = await ServiceWorkflow.find({ serviceId: { $in: serviceIds } });
      const workflowIds = workflows.map(w => w._id);
      await ServiceWorkflow.deleteMany({ serviceId: { $in: serviceIds } });
      if (workflowIds.length > 0) {
        await ServiceWorkflowStep.deleteMany({ workflowId: { $in: workflowIds } });
      }
      await PricingRule.deleteMany({ serviceId: { $in: serviceIds } });
      await ServicePageBlock.deleteMany({ serviceId: { $in: serviceIds } });
    }

    res.status(200).json({
      success: true,
      message: 'Category and all associated subcategories, services and pricings deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category. Please try again.'
    });
  }
};

/**
 * Update category order
 * PATCH /api/admin/categories/:id/order
 */
const updateCategoryOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { homeOrder } = req.body;

    if (homeOrder === undefined || isNaN(homeOrder)) {
      return res.status(400).json({
        success: false,
        message: 'homeOrder is required and must be a number'
      });
    }

    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    category.homeOrder = Number(homeOrder);
    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category order updated successfully',
      category: {
        id: category._id,
        title: category.title,
        homeOrder: category.homeOrder
      }
    });
  } catch (error) {
    console.error('Update category order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category order. Please try again.'
    });
  }
};

/**
 * Get interested users for a category
 * GET /api/admin/categories/:id/interested
 */
const getInterestedUsersForCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id)
      .select('title interestedUsers')
      .populate('interestedUsers', 'name email phone profilePhoto')
      .lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      categoryTitle: category.title,
      interestedUsers: category.interestedUsers || []
    });
  } catch (error) {
    console.error('Get interested users for category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interested users'
    });
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryOrder,
  getInterestedUsersForCategory
};

