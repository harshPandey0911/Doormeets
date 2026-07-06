const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isVendor } = require('../../middleware/roleMiddleware');

const {
  getQuotationByConsultationId,
  createQuotation,
  updateQuotation,
  submitQuotation,
  getProducts,
  getLabourRates
} = require('../../controllers/vendorControllers/paintingQuotationController');

// All routes are restricted to authenticated vendors
router.use(authenticate, isVendor);

router.get('/quotations/:consultationId', getQuotationByConsultationId);
router.post('/quotations', createQuotation);
router.put('/quotations/:id', updateQuotation);
router.post('/quotations/:id/submit', submitQuotation);
router.get('/products', getProducts);
router.get('/labour-rates', getLabourRates);

module.exports = router;
