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
router.get('/reviews', authenticate, isAdmin, hasPermission('view_reviews'), getAllReviews);

// Get review statistics
router.get('/reviews/stats', authenticate, isAdmin, hasPermission('view_reviews'), getReviewStats);

// Update review status
router.patch('/reviews/:id/status', authenticate, isAdmin, hasPermission('view_reviews'), updateReviewStatus);

module.exports = router;
