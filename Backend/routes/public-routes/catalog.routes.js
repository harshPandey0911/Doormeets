const express = require('express');
const router = express.Router();
const {
  getPublicCategories,
  getPublicSubCategories,
  getPublicBrands,
  getPublicBrandBySlug,
  getPublicServices,
  getPublicHomeContent,
  getPublicHomeData,
  getPublicBookingHierarchy,
  getPublicProfessions,
  getPublicTrainingData
} = require('../../controllers/publicControllers/catalogController');

// Public routes - no authentication required
router.get('/training-data', getPublicTrainingData);
router.get('/categories', getPublicCategories);
router.get('/subcategories', getPublicSubCategories);
router.get('/brands', getPublicBrands); // Formerly services
router.get('/brands/slug/:slug', getPublicBrandBySlug);
router.get('/services', getPublicServices); // New services
router.get('/home-content', getPublicHomeContent);
router.get('/home-data', getPublicHomeData);
router.get('/booking-hierarchy', getPublicBookingHierarchy);
router.get('/professions', getPublicProfessions);

module.exports = router;
