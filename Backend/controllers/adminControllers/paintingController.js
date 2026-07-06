const PaintBrand = require('../../models/PaintBrand');
const PaintProduct = require('../../models/PaintProduct');
const LabourRate = require('../../models/LabourRate');
const PaintingQuotation = require('../../models/PaintingQuotation');

// ==========================================
// PAINT BRANDS CONTROLLER
// ==========================================

exports.getBrands = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { isDeleted: false };

    if (req.query.search) {
      query.name = { $regex: req.query.search.trim(), $options: 'i' };
    }

    if (req.query.status !== undefined) {
      query.status = req.query.status === 'true' || req.query.status === true;
    }

    // Run a single aggregation query using $facet to fetch counts and data to avoid N+1 queries
    const aggregationResult = await PaintBrand.aggregate([
      { $match: query },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $sort: { displayOrder: 1, name: 1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: 'paintproducts',
                localField: '_id',
                foreignField: 'brandId',
                as: 'products'
              }
            },
            {
              $addFields: {
                productsCount: { $size: '$products' }
              }
            },
            {
              $project: {
                products: 0
              }
            }
          ]
        }
      }
    ]);

    const total = aggregationResult[0]?.metadata[0]?.total || 0;
    const brands = aggregationResult[0]?.data || [];

    res.status(200).json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: brands
    });
  } catch (error) {
    console.error('Error fetching paint brands:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch brands', error: error.message });
  }
};

exports.getBrandById = async (req, res) => {
  try {
    const brand = await PaintBrand.findOne({ _id: req.params.id, isDeleted: false });
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    const productsCount = await PaintProduct.countDocuments({ brandId: brand._id });

    res.status(200).json({
      success: true,
      data: {
        ...brand.toObject(),
        productsCount
      }
    });
  } catch (error) {
    console.error('Error fetching brand:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch brand', error: error.message });
  }
};

exports.createBrand = async (req, res) => {
  try {
    let { name, code, logo, description, status, displayOrder } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Brand name is required' });
    }
    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Brand code is required' });
    }

    name = name.trim();
    code = code.trim().toUpperCase();

    // Check name uniqueness (case-insensitive, non-deleted records only)
    const nameExists = await PaintBrand.findOne({
      name: { $regex: new RegExp('^' + name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
      isDeleted: false
    });
    if (nameExists) {
      return res.status(400).json({ success: false, message: 'Brand name must be unique' });
    }

    // Check code uniqueness (case-insensitive, non-deleted records only)
    const codeExists = await PaintBrand.findOne({
      code: { $regex: new RegExp('^' + code.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
      isDeleted: false
    });
    if (codeExists) {
      return res.status(400).json({ success: false, message: 'Brand code must be unique' });
    }

    const newBrandData = {
      name,
      code,
      logo: logo || { url: null, publicId: null },
      description: description || '',
      status: status !== undefined ? status : true,
      displayOrder: displayOrder !== undefined ? displayOrder : 0,
      createdBy: req.user?._id || null,
      updatedBy: req.user?._id || null
    };

    const brand = await PaintBrand.create(newBrandData);

    res.status(201).json({ success: true, message: 'Paint brand created successfully', data: brand });
  } catch (error) {
    console.error('Error creating paint brand:', error);
    res.status(500).json({ success: false, message: 'Failed to create brand', error: error.message });
  }
};

exports.updateBrand = async (req, res) => {
  try {
    let { name, code, logo, description, status, displayOrder } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Brand name is required' });
    }
    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Brand code is required' });
    }

    name = name.trim();
    code = code.trim().toUpperCase();

    // Check name uniqueness excluding self
    const nameExists = await PaintBrand.findOne({
      name: { $regex: new RegExp('^' + name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
      isDeleted: false,
      _id: { $ne: req.params.id }
    });
    if (nameExists) {
      return res.status(400).json({ success: false, message: 'Brand name must be unique' });
    }

    // Check code uniqueness excluding self
    const codeExists = await PaintBrand.findOne({
      code: { $regex: new RegExp('^' + code.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
      isDeleted: false,
      _id: { $ne: req.params.id }
    });
    if (codeExists) {
      return res.status(400).json({ success: false, message: 'Brand code must be unique' });
    }

    const updateData = {
      name,
      code,
      logo: logo || { url: null, publicId: null },
      description: description || '',
      status: status !== undefined ? status : true,
      displayOrder: displayOrder !== undefined ? displayOrder : 0,
      updatedBy: req.user?._id || null
    };

    const brand = await PaintBrand.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      updateData,
      { new: true, runValidators: true }
    );

    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    res.status(200).json({ success: true, message: 'Paint brand updated successfully', data: brand });
  } catch (error) {
    console.error('Error updating paint brand:', error);
    res.status(500).json({ success: false, message: 'Failed to update brand', error: error.message });
  }
};

exports.updateBrandStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (status === undefined || typeof status !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Status must be a boolean value' });
    }

    const brand = await PaintBrand.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { status, updatedBy: req.user?._id || null },
      { new: true }
    );

    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    res.status(200).json({ success: true, message: 'Brand status updated successfully', data: brand });
  } catch (error) {
    console.error('Error updating brand status:', error);
    res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
};

exports.reorderBrands = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ success: false, message: 'An array of brand ids is required' });
    }

    const bulkOps = ids.map((id, index) => ({
      updateOne: {
        filter: { _id: id, isDeleted: false },
        update: { $set: { displayOrder: index, updatedBy: req.user?._id || null } }
      }
    }));

    await PaintBrand.bulkWrite(bulkOps);

    res.status(200).json({ success: true, message: 'Brands reordered successfully' });
  } catch (error) {
    console.error('Error reordering paint brands:', error);
    res.status(500).json({ success: false, message: 'Failed to reorder brands', error: error.message });
  }
};

exports.deleteBrand = async (req, res) => {
  try {
    const brand = await PaintBrand.findOne({ _id: req.params.id, isDeleted: false });
    if (!brand) {
      return res.status(404).json({ success: false, message: 'Brand not found' });
    }

    // Deletion references checks:
    // 1. Paint Products
    const brandProducts = await PaintProduct.find({ brandId: brand._id });
    const productIds = brandProducts.map(p => p._id);
    const hasProducts = brandProducts.length > 0;

    // 2. Paint Quotations
    const hasQuotations = productIds.length > 0 && await PaintingQuotation.exists({
      $or: [
        { interiorPaintId: { $in: productIds } },
        { exteriorPaintId: { $in: productIds } }
      ]
    });

    // 3. Paint Orders (Note: Booking model doesn't reference paint brands, but check in case of future models)
    // Currently, there are no order tables referencing PaintBrand, but if hasProducts or hasQuotations is true, it is referenced.
    if (hasProducts || hasQuotations) {
      // Set status to false (Inactive) instead of soft delete
      brand.status = false;
      brand.updatedBy = req.user?._id || null;
      await brand.save();
      return res.status(200).json({
        success: true,
        message: 'Brand is referenced by products or quotations. Marked as Inactive instead of deleting.',
        action: 'marked_inactive',
        data: brand
      });
    }

    // Soft delete if no references exist
    brand.isDeleted = true;
    brand.updatedBy = req.user?._id || null;
    await brand.save();

    res.status(200).json({
      success: true,
      message: 'Paint brand soft-deleted successfully',
      action: 'soft_deleted'
    });
  } catch (error) {
    console.error('Error deleting paint brand:', error);
    res.status(500).json({ success: false, message: 'Failed to delete brand', error: error.message });
  }
};

// ==========================================
// PAINT PRODUCTS CONTROLLER
// ==========================================

// ==========================================
// PAINT PRODUCTS CONTROLLER
// ==========================================

// Helper function to check composite uniqueness for products
const checkProductDuplicates = async (brandId, productName, productType, availablePackSizes, excludeId = null) => {
  for (const pack of availablePackSizes) {
    const duplicate = await PaintProduct.findOne({
      brandId,
      productName: { $regex: new RegExp('^' + productName.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
      productType,
      availablePackSizes: {
        $elemMatch: {
          size: pack.size,
          unit: pack.unit
        }
      },
      isDeleted: false,
      _id: excludeId ? { $ne: excludeId } : { $exists: true }
    });
    if (duplicate) {
      return `Product with name "${productName}" and pack size ${pack.size} ${pack.unit} already exists for this brand and type.`;
    }
  }
  return null;
};

exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filters matching stage
    const match = { isDeleted: false };

    if (req.query.search) {
      const searchRegex = { $regex: req.query.search.trim(), $options: 'i' };
      match.$or = [
        { productName: searchRegex },
        { productCode: searchRegex },
        { sku: searchRegex },
        { description: searchRegex }
      ];
    }

    if (req.query.brandId) {
      match.brandId = new mongoose.Types.ObjectId(req.query.brandId);
    }
    if (req.query.productType) {
      match.productType = req.query.productType;
    }
    if (req.query.application) {
      match.application = req.query.application;
    }
    if (req.query.category) {
      match.category = req.query.category;
    }
    if (req.query.status !== undefined) {
      match.status = req.query.status === 'true' || req.query.status === true;
    }
    if (req.query.isFeatured !== undefined) {
      match.isFeatured = req.query.isFeatured === 'true' || req.query.isFeatured === true;
    }
    if (req.query.isRecommended !== undefined) {
      match.isRecommended = req.query.isRecommended === 'true' || req.query.isRecommended === true;
    }
    if (req.query.visibleToVendor !== undefined) {
      match.visibleToVendor = req.query.visibleToVendor === 'true' || req.query.visibleToVendor === true;
    }

    // Price range filters
    if (req.query.minPrice || req.query.maxPrice) {
      match.price = {};
      if (req.query.minPrice) {
        match.price.$gte = parseFloat(req.query.minPrice);
      }
      if (req.query.maxPrice) {
        match.price.$lte = parseFloat(req.query.maxPrice);
      }
    }

    // Sort stage mapping
    const sortBy = req.query.sortBy || 'displayOrder';
    const order = req.query.order === 'desc' ? -1 : 1;
    let sortStage = {};

    if (sortBy === 'productName') {
      sortStage = { productName: order };
    } else if (sortBy === 'brand') {
      sortStage = { 'brandDetails.name': order };
    } else if (sortBy === 'price') {
      sortStage = { price: order };
    } else if (sortBy === 'displayOrder') {
      sortStage = { displayOrder: order, productName: 1 };
    } else if (sortBy === 'createdAt') {
      sortStage = { createdAt: order };
    } else {
      sortStage = { displayOrder: 1, productName: 1 };
    }

    // Single aggregation query using $facet
    const aggregationResult = await PaintProduct.aggregate([
      { $match: match },
      // Lookup brand info
      {
        $lookup: {
          from: 'paintbrands',
          localField: 'brandId',
          foreignField: '_id',
          as: 'brandDetails'
        }
      },
      {
        $unwind: {
          path: '$brandDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $sort: sortStage },
            { $skip: skip },
            { $limit: limit }
          ]
        }
      }
    ]);

    const total = aggregationResult[0]?.metadata[0]?.total || 0;
    const products = aggregationResult[0]?.data || [];

    res.status(200).json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: products
    });
  } catch (error) {
    console.error('Error fetching paint products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await PaintProduct.findOne({ _id: req.params.id, isDeleted: false })
      .populate('brandId');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error('Error fetching paint product:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product', error: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    let { 
      brandId, productName, productCode, sku, description, 
      application, productType, category, finish, 
      availablePackSizes, coverage, price, taxPercentage, 
      warrantyYears, washable, features, images, 
      status, isFeatured, isRecommended, visibleToVendor, 
      internalNotes, displayOrder 
    } = req.body;

    if (!brandId) return res.status(400).json({ success: false, message: 'Brand ID is required' });
    if (!productName || !productName.trim()) return res.status(400).json({ success: false, message: 'Product name is required' });
    if (!productCode || !productCode.trim()) return res.status(400).json({ success: false, message: 'Product code is required' });
    if (!sku || !sku.trim()) return res.status(400).json({ success: false, message: 'SKU is required' });
    
    if (price === undefined || parseFloat(price) <= 0) return res.status(400).json({ success: false, message: 'Price must be greater than zero' });
    if (!coverage || coverage.value === undefined || parseFloat(coverage.value) <= 0) return res.status(400).json({ success: false, message: 'Coverage value must be greater than zero' });
    
    if (!availablePackSizes || !Array.isArray(availablePackSizes) || availablePackSizes.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one pack size is required' });
    }
    for (const pack of availablePackSizes) {
      if (pack.size === undefined || parseFloat(pack.size) <= 0) {
        return res.status(400).json({ success: false, message: 'Pack size must be greater than zero' });
      }
      if (!pack.unit || !pack.unit.trim()) {
        return res.status(400).json({ success: false, message: 'Pack size unit is required' });
      }
    }

    if (warrantyYears !== undefined && parseInt(warrantyYears) < 0) {
      return res.status(400).json({ success: false, message: 'Warranty years cannot be negative' });
    }

    // Verify linked brand is active
    const brand = await PaintBrand.findOne({ _id: brandId, isDeleted: false });
    if (!brand) {
      return res.status(400).json({ success: false, message: 'Selected brand does not exist' });
    }
    if (!brand.status) {
      return res.status(400).json({ success: false, message: 'Selected brand is inactive. Only active brands can be selected.' });
    }

    productName = productName.trim();
    productCode = productCode.trim().toUpperCase();
    sku = sku.trim().toUpperCase();

    // Check code uniqueness
    const codeExists = await PaintProduct.findOne({ productCode, isDeleted: false });
    if (codeExists) return res.status(400).json({ success: false, message: 'Product code must be unique' });

    // Check SKU uniqueness
    const skuExists = await PaintProduct.findOne({ sku, isDeleted: false });
    if (skuExists) return res.status(400).json({ success: false, message: 'SKU must be unique' });

    // Composite uniqueness check
    const duplicateError = await checkProductDuplicates(brandId, productName, productType, availablePackSizes);
    if (duplicateError) return res.status(400).json({ success: false, message: duplicateError });

    const newProductData = {
      brandId,
      productName,
      productCode,
      sku,
      description: description ? description.trim() : '',
      application,
      productType,
      category,
      finish,
      availablePackSizes: availablePackSizes.map(p => ({ size: parseFloat(p.size), unit: p.unit.trim() })),
      coverage: {
        value: parseFloat(coverage.value),
        unit: coverage.unit.trim()
      },
      price: parseFloat(price),
      taxPercentage: taxPercentage !== undefined ? parseFloat(taxPercentage) : 18,
      warrantyYears: warrantyYears !== undefined ? parseInt(warrantyYears) : 0,
      washable: !!washable,
      features: Array.isArray(features) ? features.map(f => f.trim()) : [],
      images: Array.isArray(images) ? images : [],
      status: status !== undefined ? !!status : true,
      isFeatured: !!isFeatured,
      isRecommended: !!isRecommended,
      visibleToVendor: visibleToVendor !== undefined ? !!visibleToVendor : true,
      internalNotes: internalNotes ? internalNotes.trim() : '',
      displayOrder: displayOrder !== undefined ? parseInt(displayOrder) : 0,
      createdBy: req.user?._id || null,
      updatedBy: req.user?._id || null
    };

    const product = await PaintProduct.create(newProductData);
    const populated = await PaintProduct.findById(product._id).populate('brandId');

    res.status(201).json({ success: true, message: 'Paint product created successfully', data: populated });
  } catch (error) {
    console.error('Error creating paint product:', error);
    res.status(500).json({ success: false, message: 'Failed to create product', error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    let { 
      brandId, productName, productCode, sku, description, 
      application, productType, category, finish, 
      availablePackSizes, coverage, price, taxPercentage, 
      warrantyYears, washable, features, images, 
      status, isFeatured, isRecommended, visibleToVendor, 
      internalNotes, displayOrder 
    } = req.body;

    const existingProduct = await PaintProduct.findOne({ _id: req.params.id, isDeleted: false });
    if (!existingProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (!brandId) return res.status(400).json({ success: false, message: 'Brand ID is required' });
    if (!productName || !productName.trim()) return res.status(400).json({ success: false, message: 'Product name is required' });
    if (!productCode || !productCode.trim()) return res.status(400).json({ success: false, message: 'Product code is required' });
    if (!sku || !sku.trim()) return res.status(400).json({ success: false, message: 'SKU is required' });
    
    if (price === undefined || parseFloat(price) <= 0) return res.status(400).json({ success: false, message: 'Price must be greater than zero' });
    if (!coverage || coverage.value === undefined || parseFloat(coverage.value) <= 0) return res.status(400).json({ success: false, message: 'Coverage value must be greater than zero' });
    
    if (!availablePackSizes || !Array.isArray(availablePackSizes) || availablePackSizes.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one pack size is required' });
    }
    for (const pack of availablePackSizes) {
      if (pack.size === undefined || parseFloat(pack.size) <= 0) {
        return res.status(400).json({ success: false, message: 'Pack size must be greater than zero' });
      }
      if (!pack.unit || !pack.unit.trim()) {
        return res.status(400).json({ success: false, message: 'Pack size unit is required' });
      }
    }

    if (warrantyYears !== undefined && parseInt(warrantyYears) < 0) {
      return res.status(400).json({ success: false, message: 'Warranty years cannot be negative' });
    }

    // Verify linked brand if updated
    if (brandId.toString() !== existingProduct.brandId.toString()) {
      const brand = await PaintBrand.findOne({ _id: brandId, isDeleted: false });
      if (!brand) {
        return res.status(400).json({ success: false, message: 'Selected brand does not exist' });
      }
      if (!brand.status) {
        return res.status(400).json({ success: false, message: 'Selected brand is inactive. Cannot change to inactive brand.' });
      }
    }

    productName = productName.trim();
    productCode = productCode.trim().toUpperCase();
    sku = sku.trim().toUpperCase();

    // Check code uniqueness excluding self
    const codeExists = await PaintProduct.findOne({ productCode, isDeleted: false, _id: { $ne: req.params.id } });
    if (codeExists) return res.status(400).json({ success: false, message: 'Product code must be unique' });

    // Check SKU uniqueness excluding self
    const skuExists = await PaintProduct.findOne({ sku, isDeleted: false, _id: { $ne: req.params.id } });
    if (skuExists) return res.status(400).json({ success: false, message: 'SKU must be unique' });

    // Composite duplicate check
    const duplicateError = await checkProductDuplicates(brandId, productName, productType, availablePackSizes, req.params.id);
    if (duplicateError) return res.status(400).json({ success: false, message: duplicateError });

    const updateData = {
      brandId,
      productName,
      productCode,
      sku,
      description: description ? description.trim() : '',
      application,
      productType,
      category,
      finish,
      availablePackSizes: availablePackSizes.map(p => ({ size: parseFloat(p.size), unit: p.unit.trim() })),
      coverage: {
        value: parseFloat(coverage.value),
        unit: coverage.unit.trim()
      },
      price: parseFloat(price),
      taxPercentage: taxPercentage !== undefined ? parseFloat(taxPercentage) : 18,
      warrantyYears: warrantyYears !== undefined ? parseInt(warrantyYears) : 0,
      washable: !!washable,
      features: Array.isArray(features) ? features.map(f => f.trim()) : [],
      images: Array.isArray(images) ? images : [],
      status: status !== undefined ? !!status : true,
      isFeatured: !!isFeatured,
      isRecommended: !!isRecommended,
      visibleToVendor: visibleToVendor !== undefined ? !!visibleToVendor : true,
      internalNotes: internalNotes ? internalNotes.trim() : '',
      displayOrder: displayOrder !== undefined ? parseInt(displayOrder) : 0,
      updatedBy: req.user?._id || null
    };

    const product = await PaintProduct.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      updateData,
      { new: true, runValidators: true }
    ).populate('brandId');

    res.status(200).json({ success: true, message: 'Paint product updated successfully', data: product });
  } catch (error) {
    console.error('Error updating paint product:', error);
    res.status(500).json({ success: false, message: 'Failed to update product', error: error.message });
  }
};

exports.updateProductStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (status === undefined || typeof status !== 'boolean') {
      return res.status(400).json({ success: false, message: 'Status must be a boolean' });
    }
    const product = await PaintProduct.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { status, updatedBy: req.user?._id || null },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, message: 'Status updated successfully', data: product });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
};

exports.updateProductFeature = async (req, res) => {
  try {
    const { isFeatured } = req.body;
    if (isFeatured === undefined || typeof isFeatured !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isFeatured must be a boolean' });
    }
    const product = await PaintProduct.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isFeatured, updatedBy: req.user?._id || null },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, message: 'Featured status updated successfully', data: product });
  } catch (error) {
    console.error('Error updating featured status:', error);
    res.status(500).json({ success: false, message: 'Failed to update featured status', error: error.message });
  }
};

exports.updateProductRecommend = async (req, res) => {
  try {
    const { isRecommended } = req.body;
    if (isRecommended === undefined || typeof isRecommended !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isRecommended must be a boolean' });
    }
    const product = await PaintProduct.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isRecommended, updatedBy: req.user?._id || null },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, message: 'Recommended status updated successfully', data: product });
  } catch (error) {
    console.error('Error updating recommended status:', error);
    res.status(500).json({ success: false, message: 'Failed to update recommended status', error: error.message });
  }
};

exports.updateProductVendorVisibility = async (req, res) => {
  try {
    const { visibleToVendor } = req.body;
    if (visibleToVendor === undefined || typeof visibleToVendor !== 'boolean') {
      return res.status(400).json({ success: false, message: 'visibleToVendor must be a boolean' });
    }
    const product = await PaintProduct.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { visibleToVendor, updatedBy: req.user?._id || null },
      { new: true }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, message: 'Vendor visibility updated successfully', data: product });
  } catch (error) {
    console.error('Error updating vendor visibility:', error);
    res.status(500).json({ success: false, message: 'Failed to update vendor visibility', error: error.message });
  }
};

exports.reorderProducts = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ success: false, message: 'An array of product ids is required' });
    }
    const bulkOps = ids.map((id, index) => ({
      updateOne: {
        filter: { _id: id, isDeleted: false },
        update: { $set: { displayOrder: index, updatedBy: req.user?._id || null } }
      }
    }));
    await PaintProduct.bulkWrite(bulkOps);
    res.status(200).json({ success: true, message: 'Products reordered successfully' });
  } catch (error) {
    console.error('Error reordering paint products:', error);
    res.status(500).json({ success: false, message: 'Failed to reorder products', error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await PaintProduct.findOne({ _id: req.params.id, isDeleted: false });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // References check in PaintingQuotation
    const isUsedInQuotations = await PaintingQuotation.exists({
      $or: [
        { interiorPaintId: product._id },
        { exteriorPaintId: product._id }
      ]
    });

    if (isUsedInQuotations) {
      // Inactive flag on used product
      product.status = false;
      product.updatedBy = req.user?._id || null;
      await product.save();
      return res.status(200).json({
        success: true,
        message: 'Product is referenced by quotations. Marked as Inactive instead of deleting.',
        action: 'marked_inactive',
        data: product
      });
    }

    // Soft delete
    product.isDeleted = true;
    product.updatedBy = req.user?._id || null;
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Paint product soft-deleted successfully',
      action: 'soft_deleted'
    });
  } catch (error) {
    console.error('Error deleting paint product:', error);
    res.status(500).json({ success: false, message: 'Failed to delete product', error: error.message });
  }
};

// ==========================================
// LABOUR RATES CONTROLLER
// ==========================================

exports.getLabourRates = async (req, res) => {
  try {
    const rates = await LabourRate.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: rates.length, data: rates });
  } catch (error) {
    console.error('Error fetching labour rates:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch labour rates', error: error.message });
  }
};

exports.createLabourRate = async (req, res) => {
  try {
    const rate = await LabourRate.create(req.body);
    res.status(201).json({ success: true, message: 'Labour rate created successfully', data: rate });
  } catch (error) {
    console.error('Error creating labour rate:', error);
    res.status(500).json({ success: false, message: 'Failed to create labour rate', error: error.message });
  }
};

exports.updateLabourRate = async (req, res) => {
  try {
    const rate = await LabourRate.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!rate) return res.status(404).json({ success: false, message: 'Labour rate not found' });
    res.status(200).json({ success: true, message: 'Labour rate updated successfully', data: rate });
  } catch (error) {
    console.error('Error updating labour rate:', error);
    res.status(500).json({ success: false, message: 'Failed to update labour rate', error: error.message });
  }
};

exports.deleteLabourRate = async (req, res) => {
  try {
    const rate = await LabourRate.findByIdAndDelete(req.params.id);
    if (!rate) return res.status(404).json({ success: false, message: 'Labour rate not found' });
    res.status(200).json({ success: true, message: 'Labour rate deleted successfully' });
  } catch (error) {
    console.error('Error deleting labour rate:', error);
    res.status(500).json({ success: false, message: 'Failed to delete labour rate', error: error.message });
  }
};

// ==========================================
// PAINTING QUOTATIONS & CALCULATIONS CONTROLLER
// ==========================================

exports.getQuotations = async (req, res) => {
  try {
    const quotations = await PaintingQuotation.find()
      .populate('interiorPaintId')
      .populate('exteriorPaintId')
      .populate('labourId')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: quotations.length, data: quotations });
  } catch (error) {
    console.error('Error fetching quotations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch quotations', error: error.message });
  }
};

exports.createQuotation = async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      customerPhone,
      interiorArea = 0,
      exteriorArea = 0,
      interiorPaintId,
      exteriorPaintId,
      labourId,
      discount = 0,
      gstPercentage = 18
    } = req.body;

    if (!customerName || !customerPhone) {
      return res.status(400).json({ success: false, message: 'Customer Name and Phone are required.' });
    }

    let paintCost = 0;
    let puttyCost = 0;
    let primerCost = 0;
    let labourCost = 0;

    let interiorPaint = null;
    let exteriorPaint = null;
    let labourRate = null;

    // 1. Fetch Labour rate
    if (labourId) {
      labourRate = await LabourRate.findById(labourId);
      if (labourRate) {
        labourCost = (Number(interiorArea) + Number(exteriorArea)) * labourRate.pricePerSqft;
      }
    }

    // 2. Fetch Interior Paint product and calculate its cost + consumables (Putty/Primer)
    if (interiorPaintId && Number(interiorArea) > 0) {
      interiorPaint = await PaintProduct.findById(interiorPaintId);
      if (interiorPaint) {
        paintCost += (Number(interiorArea) / interiorPaint.coverage) * interiorPaint.price;

        // Consumables: If putty or primer is included, calculate them dynamically from the same brand
        const includesPutty = labourRate && labourRate.includes && labourRate.includes.includes('PUTTY');
        const includesPrimer = labourRate && labourRate.includes && labourRate.includes.includes('PRIMER');

        if (includesPutty) {
          const puttyProduct = await PaintProduct.findOne({
            brandId: interiorPaint.brandId,
            productType: 'PUTTY',
            application: 'INTERIOR'
          });
          if (puttyProduct) {
            puttyCost += (Number(interiorArea) / puttyProduct.coverage) * puttyProduct.price;
          }
        }

        if (includesPrimer) {
          const primerProduct = await PaintProduct.findOne({
            brandId: interiorPaint.brandId,
            productType: 'PRIMER',
            application: 'INTERIOR'
          });
          if (primerProduct) {
            primerCost += (Number(interiorArea) / primerProduct.coverage) * primerProduct.price;
          }
        }
      }
    }

    // 3. Fetch Exterior Paint and calculate cost + consumables
    if (exteriorPaintId && Number(exteriorArea) > 0) {
      exteriorPaint = await PaintProduct.findById(exteriorPaintId);
      if (exteriorPaint) {
        paintCost += (Number(exteriorArea) / exteriorPaint.coverage) * exteriorPaint.price;

        const includesPutty = labourRate && labourRate.includes && labourRate.includes.includes('PUTTY');
        const includesPrimer = labourRate && labourRate.includes && labourRate.includes.includes('PRIMER');

        if (includesPutty) {
          const puttyProduct = await PaintProduct.findOne({
            brandId: exteriorPaint.brandId,
            productType: 'PUTTY',
            application: 'EXTERIOR'
          });
          if (puttyProduct) {
            puttyCost += (Number(exteriorArea) / puttyProduct.coverage) * puttyProduct.price;
          }
        }

        if (includesPrimer) {
          const primerProduct = await PaintProduct.findOne({
            brandId: exteriorPaint.brandId,
            productType: 'PRIMER',
            application: 'EXTERIOR'
          });
          if (primerProduct) {
            primerCost += (Number(exteriorArea) / primerProduct.coverage) * primerProduct.price;
          }
        }
      }
    }

    // Round calculations to 2 decimal places
    paintCost = parseFloat(paintCost.toFixed(2));
    puttyCost = parseFloat(puttyCost.toFixed(2));
    primerCost = parseFloat(primerCost.toFixed(2));
    labourCost = parseFloat(labourCost.toFixed(2));

    const baseSum = paintCost + puttyCost + primerCost + labourCost;
    const netSum = Math.max(0, baseSum - Number(discount));
    const gstVal = parseFloat((netSum * (Number(gstPercentage) / 100)).toFixed(2));
    const grandTotal = parseFloat((netSum + gstVal).toFixed(2));

    const quotation = await PaintingQuotation.create({
      customerId: customerId || null,
      customerName,
      customerPhone,
      interiorArea,
      exteriorArea,
      interiorPaintId: interiorPaintId || null,
      exteriorPaintId: exteriorPaintId || null,
      labourId: labourId || null,
      calculation: {
        paintCost,
        puttyCost,
        primerCost,
        labourCost,
        discount: Number(discount),
        gst: gstVal,
        grandTotal
      }
    });

    const populated = await PaintingQuotation.findById(quotation._id)
      .populate('interiorPaintId')
      .populate('exteriorPaintId')
      .populate('labourId');

    res.status(201).json({ success: true, message: 'Painting quotation created successfully', data: populated });
  } catch (error) {
    console.error('Error creating quotation:', error);
    res.status(500).json({ success: false, message: 'Failed to create quotation', error: error.message });
  }
};

exports.updateQuotation = async (req, res) => {
  try {
    const {
      customerId,
      customerName,
      customerPhone,
      interiorArea = 0,
      exteriorArea = 0,
      interiorPaintId,
      exteriorPaintId,
      labourId,
      discount = 0,
      gstPercentage = 18
    } = req.body;

    if (!customerName || !customerPhone) {
      return res.status(400).json({ success: false, message: 'Customer Name and Phone are required.' });
    }

    let paintCost = 0;
    let puttyCost = 0;
    let primerCost = 0;
    let labourCost = 0;

    let interiorPaint = null;
    let exteriorPaint = null;
    let labourRate = null;

    // 1. Fetch Labour rate
    if (labourId) {
      labourRate = await LabourRate.findById(labourId);
      if (labourRate) {
        labourCost = (Number(interiorArea) + Number(exteriorArea)) * labourRate.pricePerSqft;
      }
    }

    // 2. Fetch Interior Paint product and calculate its cost + consumables (Putty/Primer)
    if (interiorPaintId && Number(interiorArea) > 0) {
      interiorPaint = await PaintProduct.findById(interiorPaintId);
      if (interiorPaint) {
        paintCost += (Number(interiorArea) / interiorPaint.coverage) * interiorPaint.price;

        const includesPutty = labourRate && labourRate.includes && labourRate.includes.includes('PUTTY');
        const includesPrimer = labourRate && labourRate.includes && labourRate.includes.includes('PRIMER');

        if (includesPutty) {
          const puttyProduct = await PaintProduct.findOne({
            brandId: interiorPaint.brandId,
            productType: 'PUTTY',
            application: 'INTERIOR'
          });
          if (puttyProduct) {
            puttyCost += (Number(interiorArea) / puttyProduct.coverage) * puttyProduct.price;
          }
        }

        if (includesPrimer) {
          const primerProduct = await PaintProduct.findOne({
            brandId: interiorPaint.brandId,
            productType: 'PRIMER',
            application: 'INTERIOR'
          });
          if (primerProduct) {
            primerCost += (Number(interiorArea) / primerProduct.coverage) * primerProduct.price;
          }
        }
      }
    }

    // 3. Fetch Exterior Paint and calculate cost + consumables
    if (exteriorPaintId && Number(exteriorArea) > 0) {
      exteriorPaint = await PaintProduct.findById(exteriorPaintId);
      if (exteriorPaint) {
        paintCost += (Number(exteriorArea) / exteriorPaint.coverage) * exteriorPaint.price;

        const includesPutty = labourRate && labourRate.includes && labourRate.includes.includes('PUTTY');
        const includesPrimer = labourRate && labourRate.includes && labourRate.includes.includes('PRIMER');

        if (includesPutty) {
          const puttyProduct = await PaintProduct.findOne({
            brandId: exteriorPaint.brandId,
            productType: 'PUTTY',
            application: 'EXTERIOR'
          });
          if (puttyProduct) {
            puttyCost += (Number(exteriorArea) / puttyProduct.coverage) * puttyProduct.price;
          }
        }

        if (includesPrimer) {
          const primerProduct = await PaintProduct.findOne({
            brandId: exteriorPaint.brandId,
            productType: 'PRIMER',
            application: 'EXTERIOR'
          });
          if (primerProduct) {
            primerCost += (Number(exteriorArea) / primerProduct.coverage) * primerProduct.price;
          }
        }
      }
    }

    // Round calculations to 2 decimal places
    paintCost = parseFloat(paintCost.toFixed(2));
    puttyCost = parseFloat(puttyCost.toFixed(2));
    primerCost = parseFloat(primerCost.toFixed(2));
    labourCost = parseFloat(labourCost.toFixed(2));

    const baseSum = paintCost + puttyCost + primerCost + labourCost;
    const netSum = Math.max(0, baseSum - Number(discount));
    const gstVal = parseFloat((netSum * (Number(gstPercentage) / 100)).toFixed(2));
    const grandTotal = parseFloat((netSum + gstVal).toFixed(2));

    const quotation = await PaintingQuotation.findByIdAndUpdate(
      req.params.id,
      {
        customerId: customerId || null,
        customerName,
        customerPhone,
        interiorArea,
        exteriorArea,
        interiorPaintId: interiorPaintId || null,
        exteriorPaintId: exteriorPaintId || null,
        labourId: labourId || null,
        calculation: {
          paintCost,
          puttyCost,
          primerCost,
          labourCost,
          discount: Number(discount),
          gst: gstVal,
          grandTotal
        }
      },
      { new: true }
    );

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    const populated = await PaintingQuotation.findById(quotation._id)
      .populate('interiorPaintId')
      .populate('exteriorPaintId')
      .populate('labourId');

    res.status(200).json({ success: true, message: 'Painting quotation updated successfully', data: populated });
  } catch (error) {
    console.error('Error updating quotation:', error);
    res.status(500).json({ success: false, message: 'Failed to update quotation', error: error.message });
  }
};

exports.deleteQuotation = async (req, res) => {
  try {
    const quotation = await PaintingQuotation.findByIdAndDelete(req.params.id);
    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
    res.status(200).json({ success: true, message: 'Quotation deleted successfully' });
  } catch (error) {
    console.error('Error deleting quotation:', error);
    res.status(500).json({ success: false, message: 'Failed to delete quotation', error: error.message });
  }
};

// ==========================================
// CONSULTATIONS OVERVIEW (ADMIN MASTER DASHBOARD)
// ==========================================

const PaintingConsultation = require('../../models/PaintingConsultation');

exports.getConsultationOverview = async (req, res) => {
  try {
    const consultations = await PaintingConsultation.find()
      .populate('userId', 'name phone email')
      .populate('vendorId', 'name phone')
      .populate('quotationId')
      .sort({ createdAt: -1 });

    const total = consultations.length;
    const pending = consultations.filter(c => c.status === 'PENDING').length;
    const acceptedByVendor = consultations.filter(c => c.status === 'ACCEPTED_BY_VENDOR').length;
    const quoteGenerated = consultations.filter(c => c.status === 'QUOTE_GENERATED').length;
    const quoteAccepted = consultations.filter(c => c.status === 'QUOTE_ACCEPTED').length;
    
    // Calculate simple conversion rate: (Quote Accepted / Total Consultations) * 100
    const conversionRate = total > 0 ? ((quoteAccepted / total) * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      stats: {
        total,
        pending,
        acceptedByVendor,
        quoteGenerated,
        quoteAccepted,
        conversionRate
      },
      data: consultations
    });
  } catch (error) {
    console.error('Error fetching consultation overview:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch consultation overview', error: error.message });
  }
};

