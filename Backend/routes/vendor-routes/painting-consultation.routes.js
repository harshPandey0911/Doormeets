const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isVendor } = require('../../middleware/roleMiddleware');

const {
  getAvailableConsultations,
  acceptConsultation,
  generateQuote,
  declineConsultation
} = require('../../controllers/vendorControllers/paintingConsultationController');

router.use(authenticate, isVendor);

router.get('/available', getAvailableConsultations);
router.put('/:id/accept', acceptConsultation);
router.post('/:id/generate-quote', generateQuote);
router.put('/:id/decline', declineConsultation);

module.exports = router;
