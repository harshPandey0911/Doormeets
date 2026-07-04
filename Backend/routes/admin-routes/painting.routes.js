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
  getQuotations,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  getConsultationOverview
} = require('../../controllers/adminControllers/paintingController');

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
  .get(getQuotations)
  .post(createQuotation);

router.route('/painting/quotations/:id')
  .put(updateQuotation)
  .delete(deleteQuotation);

module.exports = router;
