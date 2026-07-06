const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  updateBrandStatus,
  reorderBrands,
  deleteBrand,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductStatus,
  updateProductFeature,
  updateProductRecommend,
  updateProductVendorVisibility,
  reorderProducts,
  deleteProduct,
  getLabourRates,
  createLabourRate,
  updateLabourRate,
  deleteLabourRate,
  getConsultationOverview
} = require('../../controllers/adminControllers/paintingController');

const {
  getQuotations,
  getQuotationById,
  updateQuotation,
  startReview,
  approveQuotation,
  rejectQuotation,
  requestRevision,
  getQuotationHistory,
  deleteQuotation
} = require('../../controllers/adminControllers/paintingAdminController');

// All routes are protected and for admin only
router.use(authenticate, isAdmin);

// Painting Consultations Overview
router.route('/painting/consultation-overview').get(getConsultationOverview);

// Paint Brands
router.route('/painting/brands')
  .get(getBrands)
  .post(createBrand);

router.route('/painting/brands/reorder')
  .put(reorderBrands);

router.route('/painting/brands/:id')
  .get(getBrandById)
  .put(updateBrand)
  .delete(deleteBrand);

router.route('/painting/brands/:id/status')
  .patch(updateBrandStatus);

// Paint Products
router.route('/painting/products')
  .get(getProducts)
  .post(createProduct);

router.route('/painting/products/reorder')
  .put(reorderProducts);

router.route('/painting/products/:id')
  .get(getProductById)
  .put(updateProduct)
  .delete(deleteProduct);

router.route('/painting/products/:id/status')
  .patch(updateProductStatus);

router.route('/painting/products/:id/feature')
  .patch(updateProductFeature);

router.route('/painting/products/:id/recommend')
  .patch(updateProductRecommend);

router.route('/painting/products/:id/vendor-visibility')
  .patch(updateProductVendorVisibility);

// Labour Rates
router.route('/painting/labour-rates')
  .get(getLabourRates)
  .post(createLabourRate);

router.route('/painting/labour-rates/:id')
  .put(updateLabourRate)
  .delete(deleteLabourRate);

// Painting Quotations
router.route('/painting/quotations')
  .get(getQuotations);

router.route('/painting/quotations/:id')
  .get(getQuotationById)
  .put(updateQuotation)
  .delete(deleteQuotation);

router.route('/painting/quotations/:id/start-review')
  .post(startReview);

router.route('/painting/quotations/:id/approve')
  .post(approveQuotation);

router.route('/painting/quotations/:id/reject')
  .post(rejectQuotation);

router.route('/painting/quotations/:id/request-revision')
  .post(requestRevision);

router.route('/painting/quotations/:id/history')
  .get(getQuotationHistory);

module.exports = router;
