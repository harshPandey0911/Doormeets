const VendorCategoryRequest = require('../../models/VendorCategoryRequest');
const { validationResult } = require('express-validator');

/**
 * Submit a new category request
 * POST /api/vendors/category-requests
 */
const submitCategoryRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: errors.array()[0].msg });
    }

    const { categoryName, reason } = req.body;
    const vendorId = req.user.id;

    // Check for duplicate pending request by same vendor
    const existing = await VendorCategoryRequest.findOne({
      vendorId,
      categoryName: { $regex: new RegExp(`^${categoryName.trim()}$`, 'i') },
      status: 'pending'
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending request for this category name.'
      });
    }

    const request = await VendorCategoryRequest.create({
      vendorId,
      categoryName: categoryName.trim(),
      reason: reason?.trim() || ''
    });

    res.status(201).json({
      success: true,
      message: 'Category request submitted successfully. Admin will review it shortly.',
      request: {
        id: request._id,
        categoryName: request.categoryName,
        reason: request.reason,
        status: request.status,
        createdAt: request.createdAt
      }
    });
  } catch (error) {
    console.error('Submit category request error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit request. Please try again.' });
  }
};

/**
 * Get vendor's own category requests
 * GET /api/vendors/category-requests
 */
const getMyRequests = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { status } = req.query;

    const query = { vendorId };
    if (status) query.status = status;

    const requests = await VendorCategoryRequest.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: requests.length,
      requests: requests.map(r => ({
        id: r._id,
        categoryName: r.categoryName,
        reason: r.reason,
        status: r.status,
        adminNote: r.adminNote || '',
        createdAt: r.createdAt,
        reviewedAt: r.reviewedAt
      }))
    });
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch requests.' });
  }
};

module.exports = { submitCategoryRequest, getMyRequests };
