const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isSuperAdmin } = require('../../middleware/roleMiddleware');
const { getPendingVerifications, approveVerification, rejectVerification } = require('../../controllers/adminControllers/adminPoliceVerificationController');

// All routes require Super Admin access
router.use(authenticate);
router.use(isSuperAdmin);

router.get('/', getPendingVerifications);
router.post('/:id/approve', approveVerification);
router.post('/:id/reject', rejectVerification);

module.exports = router;
