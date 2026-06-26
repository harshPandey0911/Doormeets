const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getLabourRates,
  createLabourRate,
  updateLabourRate,
  deleteLabourRate,
  getQuotations,
  createQuotation,
  updateQuotation,
  deleteQuotation
} = require('../../controllers/adminControllers/paintingController');

// All routes are protected and for admin only
router.use(authenticate, isAdmin);

// Paint Brands
router.route('/painting/brands')
  .get(getBrands)
  .post(createBrand);

router.route('/painting/brands/:id')
  .put(updateBrand)
  .delete(deleteBrand);

// Paint Products
router.route('/painting/products')
  .get(getProducts)
  .post(createProduct);

router.route('/painting/products/:id')
  .put(updateProduct)
  .delete(deleteProduct);

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
