const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const {
  createZone,
  getZones,
  getZoneById,
  updateZone,
  deleteZone
} = require('../../controllers/adminControllers/zoneController');

// Protect all routes to only Admin users
router.use(authenticate, isAdmin);

router.route('/')
  .post(createZone)
  .get(getZones);

router.route('/:id')
  .get(getZoneById)
  .put(updateZone)
  .delete(deleteZone);

module.exports = router;
