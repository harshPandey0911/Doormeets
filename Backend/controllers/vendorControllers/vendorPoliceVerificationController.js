const Vendor = require('../../models/Vendor');
const cloudinaryService = require('../../services/cloudinaryService');
const { createNotification } = require('../notificationControllers/notificationController');

/**
 * Upload Police Verification Document
 */
const uploadPoliceVerification = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { documentUrl } = req.body;

    if (!documentUrl) {
      return res.status(400).json({ success: false, message: 'Document URL is required.' });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    // Handle base64 upload if needed, though usually frontend uploads and sends URL
    let finalDocUrl = documentUrl;
    if (documentUrl.startsWith('data:')) {
      const uploadRes = await cloudinaryService.uploadFile(documentUrl, { folder: 'vendors/police_verification' });
      if (!uploadRes.success) {
         return res.status(500).json({ success: false, message: 'Failed to upload document.' });
      }
      finalDocUrl = uploadRes.url;
    }

    vendor.policeVerification = {
      ...vendor.policeVerification,
      status: 'submitted',
      documentUrl: finalDocUrl,
      submittedAt: new Date(),
      rejectionReason: null
    };

    await vendor.save();

    // Notify Super Admin
    (async () => {
      try {
        const Admin = require('../../models/Admin');
        const admins = await Admin.find({ role: 'super_admin' });
        const notificationData = {
          type: 'police_verification_submitted',
          title: 'Police Verification Submitted',
          message: `Vendor ${vendor.name} has submitted their police verification document for review.`,
          relatedId: vendor._id,
          relatedType: 'vendor'
        };

        await Promise.all(admins.map(admin => 
          createNotification({ ...notificationData, adminId: admin._id })
        ));
      } catch (err) {
        console.error('Failed to send notification to admin:', err);
      }
    })();

    res.status(200).json({
      success: true,
      message: 'Police verification document submitted successfully. Waiting for admin approval.',
      policeVerification: vendor.policeVerification
    });

  } catch (error) {
    console.error('Upload police verification error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload police verification.' });
  }
};

module.exports = {
  uploadPoliceVerification
};
