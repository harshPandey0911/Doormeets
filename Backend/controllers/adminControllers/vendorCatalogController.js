const VendorServiceCatalog = require('../../models/VendorServiceCatalog');
const VendorPartsCatalog = require('../../models/VendorPartsCatalog');
const Brand = require('../../models/Brand');
const { validationResult } = require('express-validator');
const { SERVICE_STATUS } = require('../../utils/constants');

/**
 * Get all vendor services
 * GET /api/admin/vendor-services
 */
const getAllVendorServices = async (req, res) => {
  try {
    const [globalServices, vendorBrands] = await Promise.all([
      VendorServiceCatalog.find()
        .populate('categoryId', 'title')
        .populate('serviceIds', 'title')
        .sort({ createdAt: -1 }),
      Brand.find({ vendorId: { $exists: true }, type: 'service' })
        .populate('categoryId', 'title')
        .populate('vendorId', 'name businessName')
        .sort({ createdAt: -1 })
    ]);

    // Format vendor brands to match service schema
    const formattedVendorServices = vendorBrands.map(b => ({
      _id: b._id,
      name: b.title,
      price: b.basePrice,
      status: b.status,
      description: b.description,
      categoryId: b.categoryId,
      vendorId: b.vendorId,
      isVendorCreated: true,
      serviceIds: [],
      customerPrice: b.basePrice,
      vendorPayoutBase: b.basePrice
    }));

    const services = [...globalServices, ...formattedVendorServices];
    res.status(200).json({ success: true, count: services.length, services });
  } catch (error) {
    console.error('Get vendor services error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch vendor services' });
  }
};

/**
 * Create vendor service
 * POST /api/admin/vendor-services
 */
const createVendorService = async (req, res) => {
  try {
    const { name, price, basePrice, status, description, categoryId, serviceIds, customerPrice, vendorPayoutBase } = req.body;
    // Handle either price or basePrice from frontend
    const finalPrice = price || basePrice;

    const service = await VendorServiceCatalog.create({
      name,
      price: finalPrice,
      status,
      description,
      categoryId,
      serviceIds,
      customerPrice,
      vendorPayoutBase
    });
    res.status(201).json({ success: true, service });
  } catch (error) {
    console.error('Create vendor service error:', error);
    res.status(500).json({ success: false, message: 'Failed to create vendor service' });
  }
};

/**
 * Update vendor service
 * PUT /api/admin/vendor-services/:id
 */
const updateVendorService = async (req, res) => {
  try {
    const { basePrice, price, ...rest } = req.body;
    const updateData = { ...rest };
    if (basePrice !== undefined || price !== undefined) {
      updateData.price = price || basePrice;
    }

    const service = await VendorServiceCatalog.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.status(200).json({ success: true, service });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update vendor service' });
  }
};

/**
 * Delete vendor service
 * DELETE /api/admin/vendor-services/:id
 */
const deleteVendorService = async (req, res) => {
  try {
    const id = req.params.id;
    // 1. Try deleting from Global Catalog
    const deletedGlobal = await VendorServiceCatalog.findByIdAndDelete(id);
    if (deletedGlobal) {
      return res.status(200).json({ success: true, message: 'Global service deleted' });
    }

    // 2. Try deleting from Vendor created Brands/Services
    const Brand = require('../../models/Brand');
    const UserService = require('../../models/UserService');

    // Delete Brand first
    const deletedBrand = await Brand.findByIdAndDelete(id);
    if (deletedBrand) {
      // Also delete associated services under this brand
      await UserService.deleteMany({ brandId: id });
      return res.status(200).json({ success: true, message: 'Vendor service/brand deleted' });
    }

    res.status(404).json({ success: false, message: 'Service not found' });
  } catch (error) {
    console.error('Delete vendor service error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete vendor service' });
  }
};

/**
 * Get all vendor parts
 * GET /api/admin/vendor-parts
 */
const getAllVendorParts = async (req, res) => {
  try {
    const [globalParts, vendorBrands] = await Promise.all([
      VendorPartsCatalog.find()
        .populate('categoryId', 'title')
        .populate('serviceIds', 'title')
        .sort({ createdAt: -1 }),
      Brand.find({ vendorId: { $exists: true }, type: 'product' })
        .populate('categoryId', 'title')
        .populate('vendorId', 'name businessName')
        .sort({ createdAt: -1 })
    ]);

    // Format vendor brands to match parts schema
    const formattedVendorParts = vendorBrands.map(b => ({
      _id: b._id,
      name: b.title,
      price: b.basePrice,
      status: b.status,
      description: b.description,
      categoryId: b.categoryId,
      vendorId: b.vendorId,
      isVendorCreated: true,
      hsnCode: b.hsnCode || '',
      serviceIds: [],
      customerPrice: b.basePrice,
      vendorPayoutBase: b.basePrice
    }));

    const parts = [...globalParts, ...formattedVendorParts];
    res.status(200).json({ success: true, count: parts.length, parts });
  } catch (error) {
    console.error('Get vendor parts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch vendor parts' });
  }
};

/**
 * Create vendor part
 * POST /api/admin/vendor-parts
 */
const createVendorPart = async (req, res) => {
  try {
    const { name, price, basePrice, hsnCode, gstApplicable, gstPercentage, status, description, categoryId, serviceIds, customerPrice, vendorPayoutBase } = req.body;
    const finalPrice = price || basePrice;
    const part = await VendorPartsCatalog.create({
      name,
      price: finalPrice,
      hsnCode,
      gstApplicable,
      gstPercentage,
      status,
      description,
      categoryId,
      serviceIds,
      customerPrice,
      vendorPayoutBase
    });
    res.status(201).json({ success: true, part });
  } catch (error) {
    console.error('Create vendor part error:', error);
    res.status(500).json({ success: false, message: 'Failed to create vendor part' });
  }
};

/**
 * Update vendor part
 * PUT /api/admin/vendor-parts/:id
 */
const updateVendorPart = async (req, res) => {
  try {
    const { basePrice, price, categoryId, ...rest } = req.body;
    const updateData = { ...rest };
    if (basePrice !== undefined || price !== undefined) {
      updateData.price = price || basePrice;
    }
    if (categoryId) {
      updateData.categoryId = categoryId;
    }

    const part = await VendorPartsCatalog.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!part) return res.status(404).json({ success: false, message: 'Part not found' });
    res.status(200).json({ success: true, part });
  } catch (error) {
    console.error('Update vendor part error:', error);
    res.status(500).json({ success: false, message: 'Failed to update vendor part' });
  }
};

/**
 * Delete vendor part
 * DELETE /api/admin/vendor-parts/:id
 */
const deleteVendorPart = async (req, res) => {
  try {
    const id = req.params.id;
    // 1. Try deleting from Global Catalog
    const deletedGlobal = await VendorPartsCatalog.findByIdAndDelete(id);
    if (deletedGlobal) {
      return res.status(200).json({ success: true, message: 'Global part deleted' });
    }

    // 2. Try deleting from Vendor created Brands/Services
    const Brand = require('../../models/Brand');
    const UserService = require('../../models/UserService');
    
    // Delete Brand first
    const deletedBrand = await Brand.findByIdAndDelete(id);
    if (deletedBrand) {
      // Also delete associated services under this brand
      await UserService.deleteMany({ brandId: id });
      return res.status(200).json({ success: true, message: 'Vendor part/brand deleted' });
    }

    res.status(404).json({ success: false, message: 'Part not found' });
  } catch (error) {
    console.error('Delete vendor part error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete vendor part' });
  }
};

/**
 * Get active addons/parts linked to a specific Service
 * GET /api/admin/vendor-catalog/addons-for-service/:serviceId
 */
const getAddonsForService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const [services, parts] = await Promise.all([
      VendorServiceCatalog.find({ serviceIds: serviceId, status: SERVICE_STATUS.ACTIVE }),
      VendorPartsCatalog.find({ serviceIds: serviceId, status: SERVICE_STATUS.ACTIVE })
    ]);
    res.status(200).json({ success: true, services, parts });
  } catch (error) {
    console.error('Error fetching addons for service:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch addons for service' });
  }
};

module.exports = {
  getAllVendorServices,
  createVendorService,
  updateVendorService,
  deleteVendorService,
  getAllVendorParts,
  createVendorPart,
  updateVendorPart,
  deleteVendorPart,
  getAddonsForService
};
