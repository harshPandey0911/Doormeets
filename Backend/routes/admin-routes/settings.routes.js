const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const { getSettings, updateSettings, getLoyaltyAnalytics } = require('../../controllers/adminControllers/settingsController');

const {
  getAllPackagesAdmin,
  createPackage,
  updatePackage,
  deletePackage
} = require('../../controllers/adminControllers/creditPackageController');

// All routes are protected and for admin only
router.use(authenticate, isAdmin);

router.route('/settings')
  .get(getSettings)
  .put(updateSettings);

router.get('/loyalty/analytics', getLoyaltyAnalytics);

router.route('/credit-packages')
  .get(getAllPackagesAdmin)
  .post(createPackage);

router.route('/credit-packages/:id')
  .put(updatePackage)
  .delete(deletePackage);

module.exports = router;
