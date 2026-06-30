const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isUser } = require('../../middleware/roleMiddleware');

const {
  requestConsultation,
  getMyConsultations,
  quoteAction
} = require('../../controllers/userControllers/paintingConsultationController');

// All routes require user authentication
router.use(authenticate, isUser);

router.post('/request', requestConsultation);
router.get('/my-requests', getMyConsultations);
router.put('/:id/quote-action', quoteAction);

module.exports = router;
