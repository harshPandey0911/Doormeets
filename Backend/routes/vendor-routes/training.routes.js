/**
 * training.routes.js — Vendor-facing training endpoints
 * Mount: /api/vendors/training
 * Protected: authenticate + isVendor
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isVendor } = require('../../middleware/roleMiddleware');
const {
  getTrainingStatus,
  getTrainingVideos,
  markVideoWatched,
  getTestQuestions,
  submitTest
} = require('../../controllers/vendorControllers/trainingController');

// All routes require authenticated vendor
router.use(authenticate, isVendor);

// GET /api/vendors/training/status — current training progress
router.get('/status', getTrainingStatus);

// GET /api/vendors/training/videos — all training videos with watch progress
router.get('/videos', getTrainingVideos);

// POST /api/vendors/training/watch — record video watch progress
router.post('/watch', markVideoWatched);

// GET /api/vendors/training/test — get MCQ questions (shuffled)
router.get('/test', getTestQuestions);

// POST /api/vendors/training/submit — submit answers & get result
router.post('/submit', submitTest);

module.exports = router;
