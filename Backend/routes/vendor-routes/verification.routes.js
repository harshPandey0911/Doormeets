const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { uploadPoliceVerification } = require('../../controllers/vendorControllers/vendorPoliceVerificationController');

// All routes require vendor authentication
router.use(authenticate);

router.post('/police', uploadPoliceVerification);

module.exports = router;
