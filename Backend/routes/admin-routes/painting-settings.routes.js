const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const {
  getSettingsProfiles,
  getSettingsProfileById,
  createSettingsProfile,
  updateDraftSnapshot,
  transitionWorkflow,
  rollbackSettingsVersion,
  getSettingsProfileHistory
} = require('../../controllers/adminControllers/paintingSettingsController');

// Secure all routes with admin middleware
router.use(authenticate, isAdmin);

router.route('/settings/profiles')
  .get(getSettingsProfiles)
  .post(createSettingsProfile);

router.route('/settings/profiles/:id')
  .get(getSettingsProfileById);

router.route('/settings/profiles/:id/snapshot')
  .put(updateDraftSnapshot);

router.route('/settings/profiles/:id/workflow')
  .post(transitionWorkflow);

router.route('/settings/profiles/:id/rollback')
  .post(rollbackSettingsVersion);

router.route('/settings/profiles/:id/history')
  .get(getSettingsProfileHistory);

module.exports = router;
