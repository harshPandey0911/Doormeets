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
const handleCityAdminApproval = async (req, res, { requestType, proposedData, cityId, notes = '' }) => {
  try {
    const admin = req.admin || req.user;
    if (!admin) return false;

    const isSuper = admin.role === 'SUPER_ADMIN' || admin.role === 'super_admin';
    if (isSuper) {
      // Super admin can make direct modifications, do not intercept
      return false;
    }

    // It is a CITY_ADMIN, let's validate and queue for approval
    const resolvedCityId = cityId || (admin.assignedCities && admin.assignedCities[0]);
    if (!resolvedCityId) {
      res.status(400).json({
        success: false,
        message: 'No city configuration found for proposal submission.'
      });
      return true;
    }

    const city = await City.findById(resolvedCityId).select('name');
    
    // Create the proposal request
    const request = await CityAdminRequest.create({
      requestedBy: admin._id,
      requestedByName: admin.name,
      cityId: resolvedCityId,
      cityName: city?.name || '',
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
          title: 'New Proposal Awaiting Approval 📋',
          message: `${admin.name} submitted a new proposal for ${requestType} in ${city?.name || 'City'}.`,
          relatedId: request._id,
          relatedType: 'city_admin_request',
          data: { requestId: request._id }
        });
      }
    } catch (notifErr) {
      console.error('[ApprovalInterceptor] Failed to send notification to Super Admin:', notifErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Your proposal has been submitted for Super Admin approval.',
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
