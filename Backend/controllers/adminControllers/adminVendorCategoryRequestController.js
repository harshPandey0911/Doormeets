const VendorCategoryRequest = require('../../models/VendorCategoryRequest');

/**
 * Get all vendor category requests (Admin view)
 * GET /api/admin/vendor-category-requests
 * Query: ?status=pending|approved|rejected&page=1&limit=20
 */
const getAllRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    const [requests, total, pendingCount] = await Promise.all([
      VendorCategoryRequest.find(query)
        .populate('vendorId', 'name businessName phone email')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      VendorCategoryRequest.countDocuments(query),
      VendorCategoryRequest.countDocuments({ status: 'pending' })
    ]);

    res.status(200).json({
      success: true,
      total,
      pendingCount,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      requests: requests.map(r => ({
        id: r._id,
        categoryName: r.categoryName,
        reason: r.reason,
        status: r.status,
        adminNote: r.adminNote || '',
        createdAt: r.createdAt,
        reviewedAt: r.reviewedAt,
        vendor: r.vendorId ? {
          id: r.vendorId._id,
          name: r.vendorId.name,
          businessName: r.vendorId.businessName,
          phone: r.vendorId.phone,
          email: r.vendorId.email
        } : null,
        reviewedBy: r.reviewedBy ? {
          id: r.reviewedBy._id,
          name: r.reviewedBy.name
        } : null
      }))
    });
  } catch (error) {
    console.error('Admin get all vendor requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch vendor requests.' });
  }
};

/**
 * Get pending vendor category requests count (for sidebar badge)
 * GET /api/admin/vendor-category-requests/count
 */
const getPendingCount = async (req, res) => {
  try {
    const pendingCount = await VendorCategoryRequest.countDocuments({ status: 'pending' });
    res.status(200).json({ success: true, pendingCount });
  } catch (error) {
    console.error('Get pending count error:', error);
    res.status(500).json({ success: false, message: 'Failed to get count.' });
  }
};

/**
 * Approve or reject a vendor category request
 * PATCH /api/admin/vendor-category-requests/:id
 * Body: { status: 'approved'|'rejected', adminNote: '...' }
 */
const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected.' });
    }

    const request = await VendorCategoryRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'This request has already been reviewed.' });
    }

    request.status = status;
    request.adminNote = adminNote?.trim() || '';
    request.reviewedBy = req.user.id;
    request.reviewedAt = new Date();
    await request.save();

    res.status(200).json({
      success: true,
      message: `Request ${status} successfully.`,
      request: {
        id: request._id,
        status: request.status,
        adminNote: request.adminNote,
        reviewedAt: request.reviewedAt
      }
    });
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update request status.' });
  }
};

module.exports = { getAllRequests, getPendingCount, updateRequestStatus };
