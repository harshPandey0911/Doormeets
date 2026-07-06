const mongoose = require('mongoose');
const PaintingQuotation = require('../../models/PaintingQuotation');
const PaintingConsultation = require('../../models/PaintingConsultation');
const User = require('../../models/User');
const { computeQuotationDetails } = require('../../utils/paintingCalculator');

// Helper to compile and push version snapshot to the quotation versions list
const pushVersionSnapshot = async (quotation, changedById, changedByType, changeSummary) => {
  let changedByName = 'Admin';
  if (changedByType === 'ADMIN') {
    const adminUser = await User.findById(changedById);
    changedByName = adminUser ? adminUser.name : 'Admin';
  } else if (changedByType === 'VENDOR') {
    // If vendor model or user model contains vendor name
    const Vendor = mongoose.model('Vendor');
    const vendorUser = await Vendor.findById(changedById);
    changedByName = vendorUser ? vendorUser.name : 'Vendor';
  } else {
    changedByName = 'System';
  }

  quotation.versions.push({
    version: quotation.currentVersion,
    changedBy: changedById,
    changedByName,
    changedByType,
    changeSummary,
    createdAt: new Date(),
    snapshot: {
      property: quotation.property,
      products: quotation.products,
      labour: quotation.labour,
      additionalCharges: quotation.additionalCharges,
      discount: quotation.discount,
      gst: quotation.gst,
      summary: quotation.summary,
      remarks: quotation.remarks,
      attachments: quotation.attachments
    }
  });
};

// GET /api/admin/painting/quotations
exports.getQuotations = async (req, res) => {
  try {
    const { search, status, vendorId, customerId, startDate, endDate, propertyType, sort } = req.query;
    
    let query = {};
    
    // Search filter: customer name, customer phone, quotation ID, or vendor notes
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { customerName: searchRegex },
        { customerPhone: searchRegex },
        { vendorNotes: searchRegex }
      ];
      
      // If search is a valid ObjectId, search by ID
      if (mongoose.Types.ObjectId.isValid(search)) {
        query.$or.push({ _id: search });
      }
    }
    
    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Vendor filter
    if (vendorId && vendorId !== 'all') {
      query.vendorId = vendorId;
    }
    
    // Customer filter
    if (customerId && customerId !== 'all') {
      query.customerId = customerId;
    }
    
    // Property Type filter
    if (propertyType && propertyType !== 'all') {
      query['property.propertyType'] = propertyType;
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }
    
    // Find options
    let findQuery = PaintingQuotation.find(query)
      .populate('customerId', 'name phone email')
      .populate('vendorId', 'name phone email')
      .populate('products.productId')
      .populate('labour.labourRateId');
      
    // Sort options
    let sortOption = { createdAt: -1 }; // default newest
    if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (sort === 'highest_amount') {
      sortOption = { 'summary.grandTotal': -1 };
    } else if (sort === 'lowest_amount') {
      sortOption = { 'summary.grandTotal': 1 };
    } else if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    }
    
    const quotations = await findQuery.sort(sortOption);
    
    res.status(200).json({
      success: true,
      count: quotations.length,
      data: quotations
    });
  } catch (error) {
    console.error('Error fetching admin quotations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch quotations', error: error.message });
  }
};

// GET /api/admin/painting/quotations/:id
exports.getQuotationById = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await PaintingQuotation.findById(id)
      .populate('customerId', 'name phone email')
      .populate('vendorId', 'name phone email')
      .populate('products.productId')
      .populate('labour.labourRateId');

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    res.status(200).json({
      success: true,
      data: quotation
    });
  } catch (error) {
    console.error('Error fetching quotation details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch quotation details', error: error.message });
  }
};

// POST /api/admin/painting/quotations/:id/start-review
exports.startReview = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await PaintingQuotation.findById(id);

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    // Move status to UNDER_REVIEW if it is SUBMITTED_TO_ADMIN
    if (quotation.status === 'SUBMITTED_TO_ADMIN') {
      quotation.status = 'UNDER_REVIEW';
      quotation.reviewedBy = req.user.id;
      quotation.reviewedAt = new Date();
      quotation.review.reviewStartedAt = new Date();
      quotation.review.status = 'UNDER_REVIEW';
      await quotation.save();
    }

    res.status(200).json({
      success: true,
      message: 'Review started successfully',
      data: quotation
    });
  } catch (error) {
    console.error('Error starting review:', error);
    res.status(500).json({ success: false, message: 'Failed to start review', error: error.message });
  }
};

// PUT /api/admin/painting/quotations/:id
exports.updateQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      property,
      products,
      labour,
      additionalCharges,
      discount,
      gstPercentage = 18,
      remarks,
      attachments,
      reviewRemarks,
      internalNotes,
      dryRun
    } = req.body;

    const quotation = await PaintingQuotation.findById(id);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    // 1. Approval Lock Validation (when not dryRun previewing)
    if (!dryRun && quotation.status === 'ADMIN_APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'This quotation is approved and locks edits. To make changes, a new version must be created.'
      });
    }

    // 2. Validate status rules (when not dryRun previewing)
    if (!dryRun && quotation.status !== 'SUBMITTED_TO_ADMIN' && quotation.status !== 'UNDER_REVIEW') {
      return res.status(400).json({
        success: false,
        message: `Quotations can only be edited when status is SUBMITTED_TO_ADMIN or UNDER_REVIEW.`
      });
    }

    // Run dynamic calculations
    const calculations = await computeQuotationDetails(
      property || quotation.property,
      products || quotation.products,
      labour || quotation.labour,
      additionalCharges || quotation.additionalCharges,
      discount || quotation.discount,
      gstPercentage
    );

    const compiledQuotation = {
      property: property || quotation.property,
      products: calculations.products,
      labour: calculations.labour,
      additionalCharges: calculations.additionalCharges,
      discount: calculations.discount,
      gst: calculations.gst,
      summary: calculations.summary,
      remarks: remarks || quotation.remarks,
      attachments: attachments || quotation.attachments
    };

    // If dryRun, just return the preview
    if (dryRun || req.query.dryRun === 'true') {
      return res.status(200).json({
        success: true,
        message: 'Quotation recalculated preview',
        data: {
          ...quotation.toObject(),
          ...compiledQuotation
        }
      });
    }

    // Apply changes
    quotation.property = compiledQuotation.property;
    quotation.products = compiledQuotation.products;
    quotation.labour = compiledQuotation.labour;
    quotation.additionalCharges = compiledQuotation.additionalCharges;
    quotation.discount = compiledQuotation.discount;
    quotation.gst = compiledQuotation.gst;
    quotation.summary = compiledQuotation.summary;
    quotation.remarks = compiledQuotation.remarks;
    quotation.attachments = compiledQuotation.attachments;

    // Apply Review updates
    if (reviewRemarks !== undefined) quotation.review.adminRemarks = reviewRemarks;
    if (internalNotes !== undefined) quotation.review.internalNotes = internalNotes;

    // If starting edit from SUBMITTED_TO_ADMIN, transition to UNDER_REVIEW
    if (quotation.status === 'SUBMITTED_TO_ADMIN') {
      quotation.status = 'UNDER_REVIEW';
      quotation.reviewedBy = req.user.id;
      quotation.reviewedAt = new Date();
      quotation.review.reviewStartedAt = new Date();
      quotation.review.status = 'UNDER_REVIEW';
    }

    // Increment version
    quotation.currentVersion = (quotation.currentVersion || 1) + 1;
    
    // Save version history snapshot
    await pushVersionSnapshot(quotation, req.user.id, 'ADMIN', 'Admin Edited');

    await quotation.save();

    res.status(200).json({
      success: true,
      message: 'Quotation updated and version snapshot saved successfully',
      data: quotation
    });
  } catch (error) {
    console.error('Error updating admin quotation:', error);
    res.status(500).json({ success: false, message: 'Failed to update quotation', error: error.message });
  }
};

// POST /api/admin/painting/quotations/:id/approve
exports.approveQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminRemarks, internalNotes } = req.body;

    const quotation = await PaintingQuotation.findById(id);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    if (quotation.status === 'ADMIN_APPROVED') {
      return res.status(400).json({ success: false, message: 'Quotation is already approved' });
    }

    // Transition state
    quotation.status = 'ADMIN_APPROVED';
    quotation.approvedBy = req.user.id;
    quotation.approvedAt = new Date();

    // Review updates
    quotation.review.status = 'ADMIN_APPROVED';
    quotation.review.reviewCompletedAt = new Date();
    if (adminRemarks !== undefined) quotation.review.adminRemarks = adminRemarks;
    if (internalNotes !== undefined) quotation.review.internalNotes = internalNotes;

    // Increment version
    quotation.currentVersion = (quotation.currentVersion || 1) + 1;

    // Record snapshot
    await pushVersionSnapshot(quotation, req.user.id, 'ADMIN', 'Admin Approved');

    await quotation.save();

    // Update the linked consultation status to QUOTE_GENERATED so it is visible to the customer
    if (quotation.consultationId) {
      try {
        const consultation = await PaintingConsultation.findById(quotation.consultationId);
        if (consultation) {
          consultation.status = 'QUOTE_GENERATED';
          consultation.quotationId = quotation._id;
          await consultation.save();
        }
      } catch (err) {
        console.error('Error updating linked PaintingConsultation status:', err);
      }
    }

    // Notify Vendor of Approval (Non-blocking)
    (async () => {
      try {
        const { createNotification } = require('../notificationControllers/notificationController');
        await createNotification({
          vendorId: quotation.vendorId,
          type: 'general',
          title: 'Painting Quotation Approved',
          message: `Admin has approved the painting quotation for ${quotation.customerName || 'Customer'}. It is now visible to the customer.`,
          relatedId: quotation.consultationId,
          relatedType: 'booking',
          data: { isPainting: true, consultationId: quotation.consultationId }
        });
      } catch (e) {
        console.error('Non-blocking vendor notification error:', e);
      }
    })();

    // Notify Customer of Approved Quotation (Non-blocking)
    (async () => {
      try {
        const { createNotification } = require('../notificationControllers/notificationController');
        
        // Find consultation to get correct userId
        const consultationObj = await PaintingConsultation.findById(quotation.consultationId);
        const recipientUserId = quotation.customerId || consultationObj?.userId;
        
        if (recipientUserId) {
          await createNotification({
            userId: recipientUserId,
            type: 'general',
            title: 'Painting Quotation Approved & Shared',
            message: `Your painting quotation of ₹${quotation.summary?.grandTotal || quotation.calculation?.grandTotal} has been approved by admin and is ready for your review.`,
            relatedId: quotation.consultationId,
            relatedType: 'booking',
            data: { isPainting: true, consultationId: quotation.consultationId }
          });
        }
      } catch (e) {
        console.error('Non-blocking customer notification error:', e);
      }
    })();

    res.status(200).json({
      success: true,
      message: 'Quotation approved successfully',
      data: quotation
    });
  } catch (error) {
    console.error('Error approving quotation:', error);
    res.status(500).json({ success: false, message: 'Failed to approve quotation', error: error.message });
  }
};

// POST /api/admin/painting/quotations/:id/reject
exports.rejectQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason, adminRemarks, internalNotes } = req.body;

    if (!rejectionReason || rejectionReason.trim() === '') {
      return res.status(400).json({ success: false, message: 'Rejection reason is mandatory.' });
    }

    const quotation = await PaintingQuotation.findById(id);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    // Transition state
    quotation.status = 'ADMIN_REJECTED';
    quotation.rejectedBy = req.user.id;
    quotation.rejectedAt = new Date();

    // Review updates
    quotation.review.status = 'ADMIN_REJECTED';
    quotation.review.rejectionReason = rejectionReason;
    quotation.review.reviewCompletedAt = new Date();
    if (adminRemarks !== undefined) quotation.review.adminRemarks = adminRemarks;
    if (internalNotes !== undefined) quotation.review.internalNotes = internalNotes;

    // Rejecting a quotation means vendor can edit it again. Set the admin remark visible to vendor.
    quotation.remarks = quotation.remarks || {};
    quotation.remarks.adminRemarks = rejectionReason;

    // Increment version
    quotation.currentVersion = (quotation.currentVersion || 1) + 1;

    // Record snapshot
    await pushVersionSnapshot(quotation, req.user.id, 'ADMIN', 'Admin Rejected');

    await quotation.save();

    // Notify Vendor of Rejection (Non-blocking)
    (async () => {
      try {
        const { createNotification } = require('../notificationControllers/notificationController');
        await createNotification({
          vendorId: quotation.vendorId,
          type: 'general',
          title: 'Painting Quotation Rejected',
          message: `Admin has rejected the painting quotation: "${rejectionReason}"`,
          relatedId: quotation.consultationId,
          relatedType: 'booking',
          data: { isPainting: true, consultationId: quotation.consultationId }
        });
      } catch (e) {
        console.error('Non-blocking vendor notification error:', e);
      }
    })();

    res.status(200).json({
      success: true,
      message: 'Quotation rejected successfully',
      data: quotation
    });
  } catch (error) {
    console.error('Error rejecting quotation:', error);
    res.status(500).json({ success: false, message: 'Failed to reject quotation', error: error.message });
  }
};

// POST /api/admin/painting/quotations/:id/request-revision
exports.requestRevision = async (req, res) => {
  try {
    const { id } = req.params;
    const { revisionReason, adminRemarks, internalNotes } = req.body;

    if (!revisionReason || revisionReason.trim() === '') {
      return res.status(400).json({ success: false, message: 'Revision reason is mandatory.' });
    }

    const quotation = await PaintingQuotation.findById(id);
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    // Transition state
    quotation.status = 'REVISION_REQUESTED';
    quotation.revisionRequestedBy = req.user.id;
    quotation.revisionRequestedAt = new Date();

    // Review updates
    quotation.review.status = 'REVISION_REQUESTED';
    quotation.review.revisionReason = revisionReason;
    quotation.review.reviewCompletedAt = new Date();
    if (adminRemarks !== undefined) quotation.review.adminRemarks = adminRemarks;
    if (internalNotes !== undefined) quotation.review.internalNotes = internalNotes;

    // Revision request makes it editable by vendor. Set the admin remark visible to vendor.
    quotation.remarks = quotation.remarks || {};
    quotation.remarks.adminRemarks = revisionReason;

    // Increment version
    quotation.currentVersion = (quotation.currentVersion || 1) + 1;

    // Record snapshot
    await pushVersionSnapshot(quotation, req.user.id, 'ADMIN', 'Revision Requested');

    await quotation.save();

    // Notify Vendor of Revision Request (Non-blocking)
    (async () => {
      try {
        const { createNotification } = require('../notificationControllers/notificationController');
        await createNotification({
          vendorId: quotation.vendorId,
          type: 'general',
          title: 'Painting Quotation Revision Requested',
          message: `Admin has requested a revision on the painting quotation: "${revisionReason}"`,
          relatedId: quotation.consultationId,
          relatedType: 'booking',
          data: { isPainting: true, consultationId: quotation.consultationId }
        });
      } catch (e) {
        console.error('Non-blocking vendor notification error:', e);
      }
    })();

    res.status(200).json({
      success: true,
      message: 'Revision requested successfully',
      data: quotation
    });
  } catch (error) {
    console.error('Error requesting revision:', error);
    res.status(500).json({ success: false, message: 'Failed to request revision', error: error.message });
  }
};

// GET /api/admin/painting/quotations/:id/history
exports.getQuotationHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const quotation = await PaintingQuotation.findById(id);

    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found' });
    }

    res.status(200).json({
      success: true,
      data: quotation.versions || []
    });
  } catch (error) {
    console.error('Error fetching quotation version history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch quotation version history', error: error.message });
  }
};

// DELETE /api/admin/painting/quotations/:id
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
