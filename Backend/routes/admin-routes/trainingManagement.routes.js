/**
 * trainingManagement.routes.js — Admin training system endpoints
 * Mount: /api/admin/training
 * Protected: authenticate + isAdmin
 */

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');
const {
  listVideos,
  createVideo,
  updateVideo,
  deleteVideo,
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  listAttempts,
  getVendorAttempts,
  assignRetraining,
  freezeVendor,
  unfreezeVendor,
  getTrainingStats
} = require('../../controllers/adminControllers/adminTrainingController');

// All routes protected
router.use(authenticate, isAdmin);

// ── Stats ──
router.get('/stats', getTrainingStats);

// ── Video CRUD ──
router.get('/videos', listVideos);
router.post('/videos', createVideo);
router.put('/videos/:id', updateVideo);
router.delete('/videos/:id', deleteVideo);

// ── Question CRUD ──
router.get('/questions', listQuestions);
router.post('/questions', createQuestion);
router.put('/questions/:id', updateQuestion);
router.delete('/questions/:id', deleteQuestion);

// ── Attempt Management ──
router.get('/attempts', listAttempts);
router.get('/attempts/:vendorId', getVendorAttempts);

// ── Vendor Training Actions ──
router.post('/assign/:vendorId', assignRetraining);       // Force retraining
router.post('/freeze/:vendorId', freezeVendor);           // Freeze vendor
router.post('/unfreeze/:vendorId', unfreezeVendor);       // Unfreeze vendor

module.exports = router;
