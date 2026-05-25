const { USER_ROLES } = require('../utils/constants');

/**
 * Role-based authorization middleware
 */
const isUser = (req, res, next) => {
  if (req.userRole !== USER_ROLES.USER) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. User role required.'
    });
  }
  next();
};

const isVendor = (req, res, next) => {
  if (req.userRole !== USER_ROLES.VENDOR) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Vendor role required.'
    });
  }
  next();
};

const checkSubscription = async (req, res, next) => {
  try {
    if (req.userRole !== USER_ROLES.VENDOR) return next();

    const Vendor = require('../models/Vendor');
    const vendor = await Vendor.findById(req.userId);

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    const now = new Date();
    const expiryDate = vendor.subscription?.endDate;

    if (!vendor.isSubscriptionActive || (expiryDate && new Date(expiryDate) < now)) {
      // Auto-update status if expired
      if (vendor.isSubscriptionActive) {
        vendor.isSubscriptionActive = false;
        if (vendor.subscription) vendor.subscription.status = 'expired';
        await vendor.save();
      }

      return res.status(403).json({
        success: false,
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'Active subscription required to access this resource.'
      });
    }

    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    next(); // Fallback to allowing if check fails to avoid blocking legitimate users
  }
};

const isWorker = (req, res, next) => {
  if (req.userRole !== USER_ROLES.WORKER) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Worker role required.'
    });
  }
  next();
};

/**
 * Allow any admin (both Super Admin and City Admin)
 */
const isAdmin = (req, res, next) => {
  const role = req.userRole;
  if (role !== USER_ROLES.ADMIN && role !== 'super_admin' && role !== 'admin' && role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  next();
};

const isAdminOrVendor = (req, res, next) => {
  if (req.userRole !== USER_ROLES.ADMIN && req.userRole !== 'super_admin' && req.userRole !== USER_ROLES.VENDOR) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin or Vendor role required.'
    });
  }
  next();
};

/**
 * Super Admin only middleware — ACTIVATED
 * Checks if admin user has SUPER_ADMIN role in database
 */
const isSuperAdmin = async (req, res, next) => {
  try {
    // Must be an admin first
    const role = req.userRole;
    if (role !== USER_ROLES.ADMIN && role !== 'super_admin' && role !== 'admin' && role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    // Load admin from DB if not already full document
    const Admin = require('../models/Admin');
    const admin = await Admin.findById(req.user.id);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin account not found.'
      });
    }

    if (!admin.isSuperAdmin()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super Admin role required.'
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your admin account has been deactivated.'
      });
    }

    req.admin = admin; // Attach full admin doc
    next();
  } catch (error) {
    console.error('Super admin check error:', error);
    res.status(500).json({ success: false, message: 'Authorization check failed' });
  }
};

/**
 * City Admin only middleware
 */
const isCityAdmin = async (req, res, next) => {
  try {
    const role = req.userRole;
    if (role !== USER_ROLES.ADMIN && role !== 'super_admin' && role !== 'admin' && role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const Admin = require('../models/Admin');
    const admin = await Admin.findById(req.user.id);

    if (!admin || admin.isSuperAdmin()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. City Admin role required.'
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your admin account has been deactivated.'
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('City admin check error:', error);
    res.status(500).json({ success: false, message: 'Authorization check failed' });
  }
};

/**
 * Require a specific permission key
 * Usage: router.get('/route', authenticate, isAdmin, hasPermission('manage_homepage'), handler)
 * Super Admin always passes. City Admin must have the permission enabled.
 */
const hasPermission = (permKey) => {
  return async (req, res, next) => {
    try {
      // Attach full admin if not already done
      if (!req.admin) {
        const Admin = require('../models/Admin');
        req.admin = await Admin.findById(req.user.id);
      }

      if (!req.admin) {
        return res.status(401).json({ success: false, message: 'Admin not found.' });
      }

      if (!req.admin.isActive) {
        return res.status(403).json({ success: false, message: 'Admin account deactivated.' });
      }

      if (!req.admin.hasPermission(permKey)) {
        return res.status(403).json({
          success: false,
          code: 'PERMISSION_DENIED',
          message: `Access denied. You do not have the '${permKey}' permission.`
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ success: false, message: 'Permission check failed' });
    }
  };
};

/**
 * City access guard — verifies the city in req.params[paramName] is in admin's assignedCities
 * Usage: router.get('/:cityId/data', authenticate, isAdmin, canAccessCity('cityId'), handler)
 * Super Admin always passes.
 */
const canAccessCity = (paramName = 'cityId') => {
  return async (req, res, next) => {
    try {
      if (!req.admin) {
        const Admin = require('../models/Admin');
        req.admin = await Admin.findById(req.user.id);
      }

      if (!req.admin) {
        return res.status(401).json({ success: false, message: 'Admin not found.' });
      }

      const cityId = req.params[paramName] || req.query[paramName] || req.body[paramName];

      if (!req.admin.canAccessCity(cityId)) {
        return res.status(403).json({
          success: false,
          code: 'CITY_ACCESS_DENIED',
          message: 'Access denied. You are not assigned to this city.'
        });
      }

      next();
    } catch (error) {
      console.error('City access check error:', error);
      res.status(500).json({ success: false, message: 'City access check failed' });
    }
  };
};

/**
 * Vendor approval guard — only Super Admins or admins with canApproveVendors
 */
const canApproveVendors = async (req, res, next) => {
  try {
    if (!req.admin) {
      const Admin = require('../models/Admin');
      req.admin = await Admin.findById(req.user.id);
    }

    if (!req.admin) {
      return res.status(401).json({ success: false, message: 'Admin not found.' });
    }

    if (req.admin.isSuperAdmin() || req.admin.canApproveVendors) {
      return next();
    }

    return res.status(403).json({
      success: false,
      code: 'VENDOR_APPROVAL_DENIED',
      message: 'Access denied. Only Super Admin can approve or reject vendors.'
    });
  } catch (error) {
    console.error('Vendor approval check error:', error);
    res.status(500).json({ success: false, message: 'Authorization check failed' });
  }
};

/**
 * Worker approval guard — only Super Admins or admins with canApproveWorkers
 */
const canApproveWorkers = async (req, res, next) => {
  try {
    if (!req.admin) {
      const Admin = require('../models/Admin');
      req.admin = await Admin.findById(req.user.id);
    }

    if (!req.admin) {
      return res.status(401).json({ success: false, message: 'Admin not found.' });
    }

    if (req.admin.isSuperAdmin() || req.admin.canApproveWorkers) {
      return next();
    }

    return res.status(403).json({
      success: false,
      code: 'WORKER_APPROVAL_DENIED',
      message: 'Access denied. Only Super Admin can approve or reject workers.'
    });
  } catch (error) {
    console.error('Worker approval check error:', error);
    res.status(500).json({ success: false, message: 'Authorization check failed' });
  }
};

module.exports = {
  isUser,
  isVendor,
  checkSubscription,
  isWorker,
  isAdmin,
  isAdminOrVendor,
  isSuperAdmin,
  isCityAdmin,
  hasPermission,
  canAccessCity,
  canApproveVendors,
  canApproveWorkers
};
