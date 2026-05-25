const Category = require('../../models/Category');
const { validationResult } = require('express-validator');
const { SERVICE_STATUS } = require('../../utils/constants');

/**
 * Get all categories
 * GET /api/admin/categories
 */
const getAllCategories = async (req, res) => {
  try {
    const { status, showOnHome, isPopular, cityId } = req.query;

    // Build query
    const query = { status: { $ne: 'deleted' } };
    if (status) query.status = status;
    if (showOnHome !== undefined) query.showOnHome = showOnHome === 'true';
    if (isPopular !== undefined) query.isPopular = isPopular === 'true';
    if (cityId) {
      query.$or = [
        { cityIds: cityId },
        { cityIds: { $exists: false } },
        { cityIds: { $size: 0 } }
      ];
    }

    const categories = await Category.find(query)
      .select('-__v')
      .populate('vendorId', 'name businessName')
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
        homeBadge: cat.homeBadge,
        hasSaleBadge: cat.hasSaleBadge,
        hasBrands: cat.hasBrands ?? true,
        showOnHome: cat.showOnHome,
        homeOrder: cat.homeOrder,
        description: cat.description,
        imageUrl: cat.imageUrl,
        status: cat.status,
        isPopular: cat.isPopular,
        cityIds: cat.cityIds || [],
        metaTitle: cat.metaTitle,
        metaDescription: cat.metaDescription,
        categoryType: cat.categoryType,
        vendorId: cat.vendorId,
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
        homeBadge: category.homeBadge,
        hasSaleBadge: category.hasSaleBadge,
        hasBrands: category.hasBrands ?? true,
        showOnHome: category.showOnHome,
        homeOrder: category.homeOrder,
        description: category.description,
        imageUrl: category.imageUrl,
        status: category.status,
        isPopular: category.isPopular,
        metaTitle: category.metaTitle,
        metaDescription: category.metaDescription,
        categoryType: category.categoryType,
        vendorId: category.vendorId,
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

    const {
      title,
      slug,
      homeIconUrl,
      homeBadge,
      hasSaleBadge,
      hasBrands,
      showOnHome,
      homeOrder,
      description,
      imageUrl,
      status,
      isPopular,
      metaTitle,
      metaDescription,
      cityIds,
      categoryType
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
        existingCategory.homeBadge = homeBadge?.trim() || null;
        existingCategory.hasSaleBadge = Boolean(hasSaleBadge);
        existingCategory.hasBrands = hasBrands !== undefined ? Boolean(hasBrands) : true;
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
        existingCategory.createdBy = req.user.id;
        
        await existingCategory.save();
        
        return res.status(201).json({
          success: true,
          message: 'Category revived successfully',
          category: {
            id: existingCategory._id,
            title: existingCategory.title,
            slug: existingCategory.slug,
            homeIconUrl: existingCategory.homeIconUrl,
            homeBadge: existingCategory.homeBadge,
            hasSaleBadge: existingCategory.hasSaleBadge,
            hasBrands: existingCategory.hasBrands ?? true,
            showOnHome: existingCategory.showOnHome,
            homeOrder: existingCategory.homeOrder,
            description: existingCategory.description,
            imageUrl: existingCategory.imageUrl,
            status: existingCategory.status,
            isPopular: existingCategory.isPopular,
            categoryType: existingCategory.categoryType,
            createdAt: existingCategory.createdAt,
            updatedAt: existingCategory.updatedAt
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
      homeBadge: homeBadge?.trim() || null,
      hasSaleBadge: Boolean(hasSaleBadge),
      hasBrands: hasBrands !== undefined ? Boolean(hasBrands) : true,
      showOnHome: showOnHome !== false,
      homeOrder: Number(homeOrder) || 0,
      description: description?.trim() || null,
      imageUrl: imageUrl || null,
      status: status || SERVICE_STATUS.ACTIVE,
      isPopular: Boolean(isPopular),
      metaTitle: metaTitle?.trim() || null,
      metaDescription: metaDescription?.trim() || null,
      cityIds: cityIds || [],
      categoryType: categoryType || 'service',
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      category: {
        id: category._id,
        title: category.title,
        slug: category.slug,
        homeIconUrl: category.homeIconUrl,
        homeBadge: category.homeBadge,
        hasSaleBadge: category.hasSaleBadge,
        hasBrands: category.hasBrands ?? true,
        showOnHome: category.showOnHome,
        homeOrder: category.homeOrder,
        description: category.description,
        imageUrl: category.imageUrl,
        status: category.status,
        isPopular: category.isPopular,
        categoryType: category.categoryType,
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

    const { id } = req.params;
    const {
      title,
      slug,
      homeIconUrl,
      homeBadge,
      hasSaleBadge,
      hasBrands,
      showOnHome,
      homeOrder,
      description,
      imageUrl,
      status,
      isPopular,
      metaTitle,
      metaDescription,
      cityIds: updateCityIds,
      categoryType
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
    if (homeBadge !== undefined) category.homeBadge = homeBadge?.trim() || null;
    if (hasSaleBadge !== undefined) category.hasSaleBadge = Boolean(hasSaleBadge);
    if (hasBrands !== undefined) category.hasBrands = Boolean(hasBrands);
    if (showOnHome !== undefined) category.showOnHome = showOnHome !== false;
    if (homeOrder !== undefined) category.homeOrder = Number(homeOrder) || 0;
    if (description !== undefined) category.description = description?.trim() || null;
    if (imageUrl !== undefined) category.imageUrl = imageUrl || null;
    if (status !== undefined) category.status = status;
    if (isPopular !== undefined) category.isPopular = Boolean(isPopular);
    if (metaTitle !== undefined) category.metaTitle = metaTitle?.trim() || null;
    if (metaDescription !== undefined) category.metaDescription = metaDescription?.trim() || null;
    if (categoryType !== undefined) category.categoryType = categoryType;

    if (updateCityIds !== undefined) {
      category.cityIds = updateCityIds;
      category.markModified('cityIds'); // Explicitly mark modified for array
    }

    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      category: {
        id: category._id,
        title: category.title,
        slug: category.slug,
        homeIconUrl: category.homeIconUrl,
        homeBadge: category.homeBadge,
        hasSaleBadge: category.hasSaleBadge,
        hasBrands: category.hasBrands ?? true,
        showOnHome: category.showOnHome,
        homeOrder: category.homeOrder,
        description: category.description,
        imageUrl: category.imageUrl,
        status: category.status,
        isPopular: category.isPopular,
        categoryType: category.categoryType,
        vendorId: category.vendorId,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
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

    // Soft delete - set status to deleted
    category.status = SERVICE_STATUS.DELETED;
    await category.save();

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
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

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  updateCategoryOrder
};

