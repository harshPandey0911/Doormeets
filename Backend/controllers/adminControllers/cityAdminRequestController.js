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

    // Validate city admin has access to this city
    if (!req.admin.canAccessCity(cityId)) {
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
    if (permMap[requestType] && !req.admin.hasPermission(permMap[requestType])) {
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

    // City Admin can only see their own requests
    if (!req.admin.isSuperAdmin()) {
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

    let createdDoc = null;
    let modelName = null;

    // Create the actual document based on request type
    if (request.requestType === 'category') {
      createdDoc = await Category.create({
        ...request.proposedData,
        status: 'active',
        createdBy: req.admin._id
      });
      modelName = 'Category';
    } else if (request.requestType === 'brand') {
      createdDoc = await Brand.create({
        ...request.proposedData,
        status: 'active',
        createdBy: req.admin._id
      });
      modelName = 'Brand';
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

    res.status(200).json({
      success: true,
      message: `Request approved. ${modelName || 'Document'} created successfully.`,
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
