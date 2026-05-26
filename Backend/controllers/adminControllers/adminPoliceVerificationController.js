const Vendor = require('../../models/Vendor');
const { createNotification } = require('../notificationControllers/notificationController');

/**
 * Get all vendors with submitted police verifications
 */
const getPendingVerifications = async (req, res) => {
  try {
    const { status = 'submitted', page = 1, limit = 10 } = req.query;
    
    const query = {
      'policeVerification.status': status
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const vendors = await Vendor.find(query)
      .select('name phone policeVerification createdAt')
      .sort({ 'policeVerification.submittedAt': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Vendor.countDocuments(query);

    res.status(200).json({
      success: true,
      data: vendors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch verifications.' });
  }
};

/**
 * Approve Police Verification
 */
const approveVerification = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    vendor.policeVerification.status = 'approved';
    vendor.policeVerification.rejectionReason = null;
    await vendor.save();

    // Send notification to vendor
    createNotification({
      type: 'police_verification_approved',
      title: 'Police Verification Approved',
      message: 'Your police verification document has been approved! You can now proceed to the next step.',
      vendorId: vendor._id,
      relatedId: vendor._id,
      relatedType: 'vendor'
    }).catch(err => console.error('Notification error:', err));

    res.status(200).json({
      success: true,
      message: 'Police verification approved successfully.'
    });

  } catch (error) {
    console.error('Approve verification error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve verification.' });
  }
};

/**
 * Reject Police Verification
 */
const rejectVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
    }

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    vendor.policeVerification.status = 'rejected';
    vendor.policeVerification.rejectionReason = reason;
    await vendor.save();

    // Send notification to vendor
    createNotification({
      type: 'police_verification_rejected',
      title: 'Police Verification Rejected',
      message: `Your police verification was rejected. Reason: ${reason}`,
      vendorId: vendor._id,
      relatedId: vendor._id,
      relatedType: 'vendor'
    }).catch(err => console.error('Notification error:', err));

    res.status(200).json({
      success: true,
      message: 'Police verification rejected successfully.'
    });

  } catch (error) {
    console.error('Reject verification error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject verification.' });
  }
};

module.exports = {
  getPendingVerifications,
  approveVerification,
  rejectVerification
};
