const CityAdminRequest = require('../models/CityAdminRequest');
const Admin = require('../models/Admin');
const City = require('../models/City');
const { createNotification } = require('../controllers/notificationControllers/notificationController');

/**
 * Checks if the request is initiated by a CITY_ADMIN or scoped admin,
 * and if so, intercepts the call, creates a CityAdminRequest, notifies super admins,
 * and returns a response.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} options - { requestType, proposedData, cityId, notes }
 * @returns {Promise<boolean>} - Returns true if intercepted (response sent), false if super admin (continue)
 */
const handleCityAdminApproval = async (req, res, { requestType, proposedData, cityId, zoneId, notes = '' }) => {
  try {
    const admin = req.admin || req.user;
    if (!admin) return false;

    const isSuper = admin.role === 'SUPER_ADMIN' || admin.role === 'super_admin';
    // Approval Control toggle (Admin.approvalControlEnabled, default false): when ON, a Zone
    // Admin's approval-gated actions apply immediately — same direct-modification path Super
    // Admin already takes — instead of being queued here. OFF (default) is today's behavior,
    // unchanged.
    if (isSuper || admin.approvalControlEnabled === true) {
      return false;
    }

    // Zone Admin or Scoped Admin - queue for Super Admin approval
    const resolvedZoneId = zoneId || admin.zoneId || (admin.assignedZones && admin.assignedZones[0]);
    const resolvedCityId = cityId || (admin.assignedCities && admin.assignedCities[0]) || null;

    let cityName = '';
    if (resolvedCityId) {
      const city = await City.findById(resolvedCityId).select('name');
      cityName = city?.name || '';
    }

    // Create the proposal request
    const request = await CityAdminRequest.create({
      requestedBy: admin._id,
      requestedByName: admin.name,
      cityId: resolvedCityId,
      cityName,
      zoneId: resolvedZoneId || null,
      requestType,
      proposedData,
      notes: notes || ''
    });

    // Notify Super Admins
    try {
      const superAdmins = await Admin.find({ role: { $in: ['SUPER_ADMIN', 'super_admin'] } }).select('_id');
      for (const superAdmin of superAdmins) {
        await createNotification({
          adminId: superAdmin._id,
          type: 'city_admin_proposal',
          title: 'New Zone Admin Proposal Awaiting Approval 📋',
          message: `${admin.name} (Zone Admin) submitted a proposal for ${requestType.replace('_', ' ')}.`,
          relatedId: request._id,
          relatedType: 'city_admin_request',
          data: { requestId: request._id }
        });
      }
    } catch (notifErr) {
      console.error('[ApprovalInterceptor] Failed to send notification to Super Admin:', notifErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Proposal submitted successfully for Super Admin approval.',
      data: request
    });
    return true;
  } catch (error) {
    console.error('[ApprovalInterceptor] Intercept error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit proposal request for review.'
    });
    return true;
  }
};

module.exports = {
  handleCityAdminApproval
};
