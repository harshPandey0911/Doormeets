/**
 * trainingMiddleware.js
 * Blocks vendor from accessing protected routes until training is completed.
 *
 * Usage: Apply AFTER checkSubscription for routes that require training done.
 * The training routes themselves (/api/vendors/training/*) are exempt from this check.
 */

const { USER_ROLES } = require('../utils/constants');

/**
 * requireTrainingComplete
 * If the vendor is a vendor and has NOT completed training, return 403 with
 * a TRAINING_REQUIRED code so the frontend can redirect them to /vendor/training.
 */
const requireTrainingComplete = async (req, res, next) => {
  try {
    // Only applies to vendors
    if (req.userRole !== USER_ROLES.VENDOR) return next();

    // The user object is already attached by authenticate middleware
    const vendor = req.user;
    if (!vendor) return next();

    // Skip training check for vendors with no training field (legacy vendors)
    // Legacy vendors who signed up before this system are considered exempt
    if (!vendor.training) return next();

    const trainingStatus = vendor.training.status;

    // Approved vendors who haven't started training yet get redirected
    if (trainingStatus === 'not_started' || trainingStatus === 'in_progress') {
      return res.status(403).json({
        success: false,
        code: 'TRAINING_REQUIRED',
        message: 'Please complete your training and certification test before accessing the dashboard.',
        redirect: '/vendor/training'
      });
    }

    // Failed training — must retake
    if (trainingStatus === 'failed') {
      const now = new Date();
      const nextAllowed = vendor.training.nextAttemptAllowedAt;

      if (nextAllowed && now < new Date(nextAllowed)) {
        const waitHours = Math.ceil((new Date(nextAllowed) - now) / (1000 * 60 * 60));
        return res.status(403).json({
          success: false,
          code: 'TRAINING_COOLDOWN',
          message: `Your training attempt failed. Please retake the test in ${waitHours} hour(s).`,
          nextAttemptAt: nextAllowed,
          redirect: '/vendor/training'
        });
      }

      // Cooldown passed, allow them to go retake
      return res.status(403).json({
        success: false,
        code: 'TRAINING_REQUIRED',
        message: 'Please retake your certification test to continue.',
        redirect: '/vendor/training'
      });
    }

    // training.status === 'completed' — allow through
    next();
  } catch (error) {
    console.error('[TrainingMiddleware] Error:', error);
    next(); // Fail-open: don't block if middleware crashes
  }
};

module.exports = { requireTrainingComplete };
