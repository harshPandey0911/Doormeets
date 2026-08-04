const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const { getPendingVerifications, approveVerification, rejectVerification } = require('../../controllers/adminControllers/adminPoliceVerificationController');

// All routes require Admin access
router.use(authenticate);
router.use(isAdmin);

router.get('/', getPendingVerifications);
router.post('/:id/approve', approveVerification);
router.post('/:id/reject', rejectVerification);

module.exports = router;
