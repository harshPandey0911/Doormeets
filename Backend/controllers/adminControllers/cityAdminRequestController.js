const CityAdminRequest = require('../../models/CityAdminRequest');
const Category = require('../../models/Category');
const Brand = require('../../models/Brand');

/**
 * City Admin: Submit a new proposal (category, brand, etc.)
 * POST /api/admin/city-admin-requests
 */
const createRequest = async (req, res) => {
  try {
    const admin = req.admin || req.user;
    const { requestType, proposedData, cityId, notes } = req.body;

    if (!requestType || !proposedData || !cityId) {
      return res.status(400).json({
        success: false,
        message: 'requestType, proposedData, and cityId are required.'
      });
    }

    // Helper functions since req.admin is a plain object (due to .lean() in authMiddleware)
    const isSuper = admin.role === 'SUPER_ADMIN' || admin.role === 'super_admin';
    const canAccessCity = (cId) => {
      if (isSuper) return true;
      if (!cId) return true;
      return (admin.assignedCities || []).some(c => c.toString() === cId.toString());
    };
    const hasPerm = (key) => {
      if (isSuper) return true;
      const p = (admin.permissions || []).find(p => p.key === key);
      return p ? p.enabled : false;
    };

    // Validate city admin has access to this city
    if (!canAccessCity(cityId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this city.'
      });
    }

    // Map request type to required permission
    const permMap = {
      category: 'propose_categories',
      brand: 'propose_brands'
    };
    if (permMap[requestType] && !hasPerm(permMap[requestType])) {
      return res.status(403).json({
        success: false,
        code: 'PERMISSION_DENIED',
        message: `You do not have permission to propose ${requestType} additions.`
      });
    }

    const City = require('../../models/City');
    const city = await City.findById(cityId).select('name');

    const request = await CityAdminRequest.create({
      requestedBy: req.admin._id,
      requestedByName: req.admin.name,
      cityId,
      cityName: city?.name || '',
      requestType,
      proposedData,
      notes: notes || ''
    });

    res.status(201).json({
      success: true,
      message: 'Your proposal has been submitted for Super Admin approval.',
      data: request
    });
  } catch (error) {
    console.error('Create city admin request error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit request.' });
  }
};

/**
 * Get all requests (Super Admin sees all, City Admin sees only their own)
 * GET /api/admin/city-admin-requests
 */
const getAllRequests = async (req, res) => {
  try {
    const { status, requestType, cityId, page = 1, limit = 20 } = req.query;
    const query = {};

    const isSuper = req.admin.role === 'SUPER_ADMIN' || req.admin.role === 'super_admin';
    // City Admin can only see their own requests
    if (!isSuper) {
      query.requestedBy = req.admin._id;
    }

    if (status) query.status = status;
    if (requestType) query.requestType = requestType;
    if (cityId) query.cityId = cityId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [requests, total] = await Promise.all([
      CityAdminRequest.find(query)
        .populate('requestedBy', 'name email')
        .populate('cityId', 'name')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      CityAdminRequest.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: requests,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    console.error('Get city admin requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch requests.' });
  }
};

/**
 * Super Admin: Approve a request — creates the actual document
 * POST /api/admin/city-admin-requests/:id/approve
 */
const approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const request = await CityAdminRequest.findById(id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Request is already ${request.status}.` });
    }

    let messageText = 'Request approved successfully.';

    // Create or update the actual document based on request type
    if (request.requestType === 'category') {
      if (request.proposedData && request.proposedData.categoryId) {
        const categoryId = request.proposedData.categoryId;
        const updateData = { ...request.proposedData };
        delete updateData.categoryId;
        createdDoc = await Category.findByIdAndUpdate(categoryId, updateData, { new: true });
        modelName = 'Category';
        messageText = 'Request approved. Category updated successfully.';
      } else {
        createdDoc = await Category.create({
          ...request.proposedData,
          status: 'active',
          createdBy: req.admin._id
        });
        modelName = 'Category';
        messageText = 'Request approved. Category created successfully.';
      }
    } else if (request.requestType === 'brand') {
      if (request.proposedData && request.proposedData.brandId) {
        const brandId = request.proposedData.brandId;
        const updateData = { ...request.proposedData };
        delete updateData.brandId;
        createdDoc = await Brand.findByIdAndUpdate(brandId, updateData, { new: true });
        modelName = 'Brand';
        messageText = 'Request approved. Brand updated successfully.';
      } else {
        createdDoc = await Brand.create({
          ...request.proposedData,
          status: 'active',
          createdBy: req.admin._id
        });
        modelName = 'Brand';
        messageText = 'Request approved. Brand created successfully.';
      }
    } else if (request.requestType === 'delete_vendor') {
      const Vendor = require('../../models/Vendor');
      const vendorId = request.proposedData?.vendorId;
      if (vendorId) {
        await Vendor.findByIdAndDelete(vendorId);
      }
      modelName = 'Vendor';
      messageText = 'Request approved. Vendor deleted successfully.';
    }
    // Add more types here (pricing_override, banner, etc.)

    // Mark request as approved
    request.status = 'approved';
    request.reviewedBy = req.admin._id;
    request.reviewedAt = new Date();
    if (createdDoc) {
      request.createdDocumentId = createdDoc._id;
      request.createdDocumentModel = modelName;
    }
    await request.save();

    // Send in-app notification to requesting City Admin
    try {
      const { createNotification } = require('../notificationControllers/notificationController');
      await createNotification({
        adminId: request.requestedBy,
        type: 'proposal_status_updated',
        title: 'Proposal Approved! 🎉',
        message: `Your proposal for ${request.requestType} has been approved by the Super Admin.`,
        relatedId: request._id,
        relatedType: 'city_admin_request',
        data: { requestId: request._id }
      });
    } catch (err) {
      console.error('[CityAdminRequest] Failed to notify requester of approval:', err.message);
    }

    res.status(200).json({
      success: true,
      message: messageText,
      data: { request, createdDoc }
    });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve request.' });
  }
};

/**
 * Super Admin: Reject a request
 * POST /api/admin/city-admin-requests/:id/reject
 */
const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const request = await CityAdminRequest.findById(id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Request is already ${request.status}.` });
    }

    request.status = 'rejected';
    request.reviewedBy = req.admin._id;
    request.reviewedAt = new Date();
    request.rejectionReason = reason || 'No reason provided';
    await request.save();

    // Send in-app notification to requesting City Admin
    try {
      const { createNotification } = require('../notificationControllers/notificationController');
      await createNotification({
        adminId: request.requestedBy,
        type: 'proposal_status_updated',
        title: 'Proposal Rejected ❌',
        message: `Your proposal for ${request.requestType} was rejected. Reason: ${reason || 'No reason provided'}`,
        relatedId: request._id,
        relatedType: 'city_admin_request',
        data: { requestId: request._id }
      });
    } catch (err) {
      console.error('[CityAdminRequest] Failed to notify requester of rejection:', err.message);
    }

    res.status(200).json({
      success: true,
      message: 'Request rejected.',
      data: request
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject request.' });
  }
};

/**
 * Get pending request count (for Super Admin badge)
 * GET /api/admin/city-admin-requests/pending-count
 */
const getPendingCount = async (req, res) => {
  try {
    const count = await CityAdminRequest.countDocuments({ status: 'pending' });
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get count.' });
  }
};

module.exports = {
  createRequest,
  getAllRequests,
  approveRequest,
  rejectRequest,
  getPendingCount
};
