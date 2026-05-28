/**
 * adminTrainingController.js — Admin-facing CRUD for training content + vendor management
 *
 * Endpoints:
 *  Videos:    GET/POST/PUT/DELETE /api/admin/training/videos
 *  Questions: GET/POST/PUT/DELETE /api/admin/training/questions
 *  Attempts:  GET /api/admin/training/attempts
 *  Vendors:   POST /api/admin/training/assign/:vendorId
 *             POST /api/admin/training/freeze/:vendorId
 *             POST /api/admin/training/unfreeze/:vendorId
 */

const TrainingVideo = require('../../models/TrainingVideo');
const TrainingQuestion = require('../../models/TrainingQuestion');
const TrainingAttempt = require('../../models/TrainingAttempt');
const Vendor = require('../../models/Vendor');
const { createNotification } = require('../notificationControllers/notificationController');

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/training/videos
 * List all training videos (active + inactive)
 */
const listVideos = async (req, res) => {
  try {
    const { isActive, page = 1, limit = 50 } = req.query;
    const query = {};
    // Default to active only; pass isActive=false to see inactive
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    } else {
      query.isActive = true; // Only show active videos by default
    }

    const videos = await TrainingVideo.find(query)
      .sort({ order: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await TrainingVideo.countDocuments(query);

    res.status(200).json({
      success: true,
      data: videos,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('[AdminTraining] listVideos error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch videos' });
  }
};

/**
 * POST /api/admin/training/videos
 * Add a new training video
 */
const createVideo = async (req, res) => {
  try {
    const { title, description, videoUrl, videoSource, thumbnailUrl, durationSeconds, isRequired, order, categoryId } = req.body;

    if (!title || !videoUrl) {
      return res.status(400).json({ success: false, message: 'Title and videoUrl are required' });
    }

    const video = await TrainingVideo.create({
      title,
      description,
      videoUrl,
      videoSource: videoSource || 'youtube',
      thumbnailUrl: thumbnailUrl || null,
      durationSeconds: durationSeconds || 300,
      isRequired: isRequired !== false,
      order: order || 0,
      categoryId: categoryId || null,
      isActive: true,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Training video created successfully',
      data: video
    });
  } catch (error) {
    console.error('[AdminTraining] createVideo error:', error);
    res.status(500).json({ success: false, message: 'Failed to create video' });
  }
};

/**
 * PUT /api/admin/training/videos/:id
 * Update a training video
 */
const updateVideo = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    delete updates._id; // Safety

    const video = await TrainingVideo.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    if (!video) {
      return res.status(404).json({ success: false, message: 'Video not found' });
    }

    res.status(200).json({ success: true, message: 'Video updated', data: video });
  } catch (error) {
    console.error('[AdminTraining] updateVideo error:', error);
    res.status(500).json({ success: false, message: 'Failed to update video' });
  }
};

/**
 * DELETE /api/admin/training/videos/:id
 * Hard delete — permanently removes the video from the database
 */
const deleteVideo = async (req, res) => {
  try {
    const video = await TrainingVideo.findByIdAndDelete(req.params.id);
    if (!video) return res.status(404).json({ success: false, message: 'Video not found' });

    res.status(200).json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    console.error('[AdminTraining] deleteVideo error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete video' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/training/questions
 */
const listQuestions = async (req, res) => {
  try {
    const { isActive, difficulty, page = 1, limit = 50 } = req.query;
    const query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (difficulty) query.difficulty = difficulty;

    const questions = await TrainingQuestion.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('videoId', 'title');

    const total = await TrainingQuestion.countDocuments(query);

    res.status(200).json({
      success: true,
      data: questions,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('[AdminTraining] listQuestions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch questions' });
  }
};

/**
 * POST /api/admin/training/questions
 */
const createQuestion = async (req, res) => {
  try {
    const { question, options, explanation, difficulty, videoId, categoryId } = req.body;

    if (!question || !options || !Array.isArray(options) || options.length !== 4) {
      return res.status(400).json({
        success: false,
        message: 'Question, and exactly 4 options are required'
      });
    }

    const correctCount = options.filter(o => o.isCorrect).length;
    if (correctCount !== 1) {
      return res.status(400).json({
        success: false,
        message: 'Exactly one option must be marked as correct'
      });
    }

    const newQuestion = await TrainingQuestion.create({
      question,
      options,
      explanation: explanation || '',
      difficulty: difficulty || 'medium',
      videoId: videoId || null,
      categoryId: categoryId || null,
      isActive: true,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: newQuestion
    });
  } catch (error) {
    console.error('[AdminTraining] createQuestion error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Failed to create question' });
  }
};

/**
 * PUT /api/admin/training/questions/:id
 */
const updateQuestion = async (req, res) => {
  try {
    const updates = req.body;
    delete updates._id;

    // Validate options if provided
    if (updates.options) {
      if (updates.options.length !== 4) {
        return res.status(400).json({ success: false, message: 'Must have exactly 4 options' });
      }
      const correctCount = updates.options.filter(o => o.isCorrect).length;
      if (correctCount !== 1) {
        return res.status(400).json({ success: false, message: 'Exactly one correct option required' });
      }
    }

    const question = await TrainingQuestion.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    res.status(200).json({ success: true, message: 'Question updated', data: question });
  } catch (error) {
    console.error('[AdminTraining] updateQuestion error:', error);
    res.status(500).json({ success: false, message: 'Failed to update question' });
  }
};

/**
 * DELETE /api/admin/training/questions/:id
 * Soft-delete
 */
const deleteQuestion = async (req, res) => {
  try {
    const question = await TrainingQuestion.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' });

    res.status(200).json({ success: true, message: 'Question deactivated' });
  } catch (error) {
    console.error('[AdminTraining] deleteQuestion error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete question' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ATTEMPT MANAGEMENT (Read-Only)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/admin/training/attempts
 * View all vendor training attempts with filtering
 */
const listAttempts = async (req, res) => {
  try {
    const { vendorId, levelAssigned, page = 1, limit = 20 } = req.query;
    const query = { completedAt: { $ne: null } };
    if (vendorId) query.vendorId = vendorId;
    if (levelAssigned) query.levelAssigned = levelAssigned;

    const attempts = await TrainingAttempt.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('vendorId', 'name email phone businessName currentLevel trainingScore approvalStatus')
      .select('-answers -videoWatchData'); // Exclude heavy fields from list view

    const total = await TrainingAttempt.countDocuments(query);

    res.status(200).json({
      success: true,
      data: attempts,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('[AdminTraining] listAttempts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attempts' });
  }
};

/**
 * GET /api/admin/training/attempts/:vendorId
 * Get full attempt history for a specific vendor (with answer review)
 */
const getVendorAttempts = async (req, res) => {
  try {
    const attempts = await TrainingAttempt.find({
      vendorId: req.params.vendorId,
      completedAt: { $ne: null }
    })
      .sort({ createdAt: -1 })
      .populate('answers.questionId', 'question options explanation');

    res.status(200).json({ success: true, data: attempts });
  } catch (error) {
    console.error('[AdminTraining] getVendorAttempts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch vendor attempts' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// VENDOR TRAINING ADMIN ACTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/admin/training/assign/:vendorId
 * Reset and force-assign training to a vendor (retraining)
 */
const assignRetraining = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { reason } = req.body;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    await Vendor.findByIdAndUpdate(vendorId, {
      $set: {
        'training.status': 'not_started',
        'training.assignedAt': new Date(),
        'training.completedAt': null,
        'training.nextAttemptAllowedAt': null,
        currentLevel: null,
        trainingScore: null
      }
    });

    // Remove in-progress attempt placeholders
    await TrainingAttempt.deleteMany({ vendorId, completedAt: null });

    // Notify vendor
    try {
      await createNotification({
        vendorId,
        type: 'retraining_assigned',
        title: '📚 Retraining Assigned',
        message: reason
          ? `An admin has assigned retraining to your account. Reason: ${reason}. Please complete training again.`
          : 'An admin has assigned retraining. Please watch the training videos and complete the test.',
        relatedType: 'training'
      });
    } catch (e) { console.error('[AdminTraining] Notification error:', e); }

    res.status(200).json({
      success: true,
      message: `Retraining assigned to vendor ${vendor.name}`
    });
  } catch (error) {
    console.error('[AdminTraining] assignRetraining error:', error);
    res.status(500).json({ success: false, message: 'Failed to assign retraining' });
  }
};

/**
 * POST /api/admin/training/freeze/:vendorId
 * Freeze a vendor account (blocks dashboard access + job delivery)
 */
const freezeVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Freeze reason is required' });
    }

    const vendor = await Vendor.findByIdAndUpdate(
      vendorId,
      { $set: { isFrozen: true, freezeReason: reason, isOnline: false } },
      { new: true }
    );

    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    try {
      await createNotification({
        vendorId,
        type: 'account_frozen',
        title: '🚫 Account Frozen',
        message: `Your account has been temporarily frozen. Reason: ${reason}. Please contact support.`,
        priority: 'high',
        relatedType: 'vendor'
      });
    } catch (e) { console.error('[AdminTraining] Notification error:', e); }

    res.status(200).json({
      success: true,
      message: `Vendor ${vendor.name} has been frozen`,
      data: { isFrozen: true, freezeReason: reason }
    });
  } catch (error) {
    console.error('[AdminTraining] freezeVendor error:', error);
    res.status(500).json({ success: false, message: 'Failed to freeze vendor' });
  }
};

/**
 * POST /api/admin/training/unfreeze/:vendorId
 * Unfreeze a vendor account
 */
const unfreezeVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const vendor = await Vendor.findByIdAndUpdate(
      vendorId,
      { $set: { isFrozen: false, freezeReason: null } },
      { new: true }
    );

    if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found' });

    try {
      await createNotification({
        vendorId,
        type: 'account_unfrozen',
        title: '✅ Account Reactivated',
        message: 'Your account has been unfrozen. You can now accept bookings again.',
        relatedType: 'vendor'
      });
    } catch (e) { console.error('[AdminTraining] Notification error:', e); }

    res.status(200).json({
      success: true,
      message: `Vendor ${vendor.name} has been unfrozen`
    });
  } catch (error) {
    console.error('[AdminTraining] unfreezeVendor error:', error);
    res.status(500).json({ success: false, message: 'Failed to unfreeze vendor' });
  }
};

/**
 * GET /api/admin/training/stats
 * Dashboard stats: pass rate, level distribution, total attempts
 */
const getTrainingStats = async (req, res) => {
  try {
    const [levelStats, totalAttempts, passRate] = await Promise.all([
      // Level distribution of all vendors
      Vendor.aggregate([
        { $match: { currentLevel: { $ne: null } } },
        { $group: { _id: '$currentLevel', count: { $sum: 1 } } }
      ]),
      // Total completed attempts
      TrainingAttempt.countDocuments({ completedAt: { $ne: null } }),
      // Overall pass rate
      TrainingAttempt.aggregate([
        { $match: { completedAt: { $ne: null } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            passed: { $sum: { $cond: [{ $gte: ['$score', 50] }, 1, 0] } },
            avgScore: { $avg: '$score' }
          }
        }
      ])
    ]);

    const stats = passRate[0] || { total: 0, passed: 0, avgScore: 0 };

    res.status(200).json({
      success: true,
      data: {
        levelDistribution: levelStats,
        totalAttempts,
        passRate: stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0,
        averageScore: Math.round(stats.avgScore || 0),
        totalVendorsTrained: levelStats.reduce((sum, l) => sum + l.count, 0)
      }
    });
  } catch (error) {
    console.error('[AdminTraining] getTrainingStats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch training stats' });
  }
};

module.exports = {
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
};
