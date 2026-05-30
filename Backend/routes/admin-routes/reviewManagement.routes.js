const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin, hasPermission } = require('../../middleware/roleMiddleware');
const {
  getAllReviews,
  updateReviewStatus,
  getReviewStats
} = require('../../controllers/adminControllers/adminReviewController');

// All routes require authentication and admin role with review permission
router.use(authenticate, isAdmin, hasPermission('view_reviews'));

// Get all reviews
router.get('/reviews', getAllReviews);

// Get review statistics
router.get('/reviews/stats', getReviewStats);

// Update review status
router.patch('/reviews/:id/status', updateReviewStatus);

module.exports = router;
