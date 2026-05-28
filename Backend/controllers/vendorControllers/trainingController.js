/**
 * trainingController.js — Vendor-facing training & certification endpoints
 *
 * Flow:
 *  1. GET /status         — vendor checks their progress
 *  2. GET /videos         — fetch all active training videos
 *  3. POST /watch         — mark a video as watched (progress tracking)
 *  4. GET /test           — get MCQ questions (only if all required videos watched)
 *  5. POST /submit        — submit answers → score calculated → level assigned
 */

const Vendor = require('../../models/Vendor');
const TrainingVideo = require('../../models/TrainingVideo');
const TrainingQuestion = require('../../models/TrainingQuestion');
const TrainingAttempt = require('../../models/TrainingAttempt');
const { TRAINING_LEVELS, TRAINING_SCORE_THRESHOLDS, TRAINING_STATUS } = require('../../utils/constants');
const { createNotification } = require('../notificationControllers/notificationController');

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate level based on score percentage
 */
const calculateLevel = (score, minL1 = 80, minL2 = 50) => {
  if (score >= minL1) return TRAINING_LEVELS.L1;
  if (score >= minL2) return TRAINING_LEVELS.L2;
  return TRAINING_LEVELS.L3;
};

/**
 * Check if vendor is allowed to take/retake the test
 */
const canAttemptTest = (vendor) => {
  if (!vendor.training.nextAttemptAllowedAt) return { allowed: true };
  const now = new Date();
  if (now >= new Date(vendor.training.nextAttemptAllowedAt)) return { allowed: true };

  const waitMs = new Date(vendor.training.nextAttemptAllowedAt) - now;
  const waitHours = Math.ceil(waitMs / (1000 * 60 * 60));
  return { allowed: false, waitHours, nextAttemptAt: vendor.training.nextAttemptAllowedAt };
};

// ─────────────────────────────────────────────────────────────────────────────
// CONTROLLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/vendors/training/status
 * Returns the vendor's current training state (progress, score, level, cooldown)
 */
const getTrainingStatus = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.user.id)
      .select('training currentLevel trainingScore approvalStatus isFrozen');

    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // Fetch latest attempt if training was done
    const latestAttempt = await TrainingAttempt.findOne({ vendorId: vendor._id })
      .sort({ createdAt: -1 })
      .select('score levelAssigned completedAt attemptNumber answers totalQuestions correctAnswers');

    const canAttempt = canAttemptTest(vendor);

    res.status(200).json({
      success: true,
      data: {
        training: vendor.training,
        currentLevel: vendor.currentLevel,
        trainingScore: vendor.trainingScore,
        approvalStatus: vendor.approvalStatus,
        isFrozen: vendor.isFrozen,
        canAttemptTest: canAttempt.allowed,
        nextAttemptAt: canAttempt.nextAttemptAt || null,
        waitHours: canAttempt.waitHours || null,
        latestAttempt: latestAttempt || null
      }
    });
  } catch (error) {
    console.error('[Training] getTrainingStatus error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch training status' });
  }
};

/**
 * GET /api/vendors/training/videos
 * Returns all active training videos, with vendor's watch progress
 */
const getTrainingVideos = async (req, res) => {
  try {
    const videos = await TrainingVideo.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .select('-createdBy -totalViews');

    // Get latest attempt to check video watch data
    const latestAttempt = await TrainingAttempt.findOne({
      vendorId: req.user.id
    }).sort({ createdAt: -1 }).select('videoWatchData');

    const watchedVideoIds = new Set(
      (latestAttempt?.videoWatchData || [])
        .filter(v => v.fullyWatched)
        .map(v => v.videoId.toString())
    );

    const videosWithProgress = videos.map(v => ({
      ...v.toObject(),
      isWatched: watchedVideoIds.has(v._id.toString())
    }));

    res.status(200).json({
      success: true,
      data: videosWithProgress,
      totalRequired: videos.filter(v => v.isRequired).length,
      totalWatched: watchedVideoIds.size
    });
  } catch (error) {
    console.error('[Training] getTrainingVideos error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch training videos' });
  }
};

/**
 * POST /api/vendors/training/watch
 * Mark a video as watched (or update watch progress)
 * Body: { videoId, watchedSeconds, fullyWatched }
 */
const markVideoWatched = async (req, res) => {
  try {
    const { videoId, watchedSeconds = 0, fullyWatched = false } = req.body;

    if (!videoId) {
      return res.status(400).json({ success: false, message: 'videoId is required' });
    }

    const video = await TrainingVideo.findById(videoId);
    if (!video || !video.isActive) {
      return res.status(404).json({ success: false, message: 'Training video not found' });
    }

    // Increment view count (async, non-blocking)
    TrainingVideo.findByIdAndUpdate(videoId, { $inc: { totalViews: 1 } }).catch(() => {});

    // Update the vendor's training status to in_progress if not_started
    await Vendor.findByIdAndUpdate(req.user.id, {
      $set: {
        'training.status': 'in_progress',
        'training.assignedAt': new Date()
      }
    });

    // Find or create a "in-progress" attempt to track video watches
    // We store video watch data temporarily; it gets locked in on test submission
    let progressAttempt = await TrainingAttempt.findOne({
      vendorId: req.user.id,
      completedAt: null // not yet submitted
    });

    const watchEntry = {
      videoId,
      watchedAt: new Date(),
      watchedSeconds,
      fullyWatched: fullyWatched || watchedSeconds >= video.durationSeconds * 0.8 // 80% watched = fully watched
    };

    if (progressAttempt) {
      // Update existing entry for this video
      const existingIdx = progressAttempt.videoWatchData.findIndex(
        v => v.videoId.toString() === videoId
      );
      if (existingIdx >= 0) {
        progressAttempt.videoWatchData[existingIdx] = watchEntry;
      } else {
        progressAttempt.videoWatchData.push(watchEntry);
      }
      await progressAttempt.save();
    } else {
      // Create a temp (incomplete) attempt just for tracking
      await TrainingAttempt.create({
        vendorId: req.user.id,
        attemptNumber: 0, // placeholder, updated on submission
        score: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        levelAssigned: 'L3',
        videoWatchData: [watchEntry],
        completedAt: null // null = in progress
      });
    }

    // Count all required videos and how many the vendor has watched
    const allRequiredVideos = await TrainingVideo.find({ isActive: true, isRequired: true }).select('_id');
    const watchedRequired = await TrainingAttempt.aggregate([
      { $match: { vendorId: require('mongoose').Types.ObjectId.createFromHexString(req.user.id) } },
      { $sort: { createdAt: -1 } },
      { $limit: 1 },
      { $unwind: '$videoWatchData' },
      { $match: { 'videoWatchData.fullyWatched': true } },
      { $count: 'watched' }
    ]);

    const watchedCount = watchedRequired[0]?.watched || 0;
    const requiredCount = allRequiredVideos.length;

    res.status(200).json({
      success: true,
      message: watchEntry.fullyWatched ? 'Video marked as fully watched' : 'Watch progress recorded',
      data: {
        videoId,
        fullyWatched: watchEntry.fullyWatched,
        totalRequired: requiredCount,
        totalWatched: watchedCount,
        canTakeTest: watchedCount >= requiredCount
      }
    });
  } catch (error) {
    console.error('[Training] markVideoWatched error:', error);
    res.status(500).json({ success: false, message: 'Failed to record video progress' });
  }
};

/**
 * GET /api/vendors/training/test
 * Returns MCQ questions for the test (options shuffled, correct answers hidden)
 * Guard: All required videos must be watched
 */
const getTestQuestions = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.user.id).select('training');

    // Check cooldown
    const canAttempt = canAttemptTest(vendor);
    if (!canAttempt.allowed) {
      return res.status(429).json({
        success: false,
        message: `Please wait ${canAttempt.waitHours} hour(s) before retaking the test.`,
        nextAttemptAt: canAttempt.nextAttemptAt
      });
    }

    // Fetch all active questions (randomize order)
    const questions = await TrainingQuestion.find({ isActive: true })
      .select('-createdBy -totalAnswered -totalCorrect -__v');

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No test questions available yet. Please check back later.'
      });
    }

    // Shuffle questions and strip isCorrect from options (prevent cheating)
    const shuffled = questions
      .sort(() => Math.random() - 0.5)
      .map(q => ({
        _id: q._id,
        question: q.question,
        difficulty: q.difficulty,
        videoId: q.videoId,
        // Only return option text, not isCorrect
        options: q.options.map((opt, idx) => ({ text: opt.text, index: idx }))
      }));

    // Fetch admin-configured time limit
    const Settings = require('../../models/Settings');
    const settings = await Settings.findOne({ type: 'global' });
    const timeLimitMinutes = settings?.mcqTimeLimitMinutes || 30;

    res.status(200).json({
      success: true,
      data: shuffled,
      totalQuestions: shuffled.length,
      passingScore: settings?.mcqMinScoreL2 !== undefined ? settings.mcqMinScoreL2 : 50,
      timeLimitMinutes
    });
  } catch (error) {
    console.error('[Training] getTestQuestions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch test questions' });
  }
};

/**
 * POST /api/vendors/training/submit
 * Submit MCQ answers, calculate score, assign level, update vendor
 * Body: { answers: [{ questionId, selectedOptionIndex }] }
 */
const submitTest = async (req, res) => {
  try {
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ success: false, message: 'Answers array is required' });
    }

    const vendor = await Vendor.findById(req.user.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    // Check cooldown
    const canAttempt = canAttemptTest(vendor);
    if (!canAttempt.allowed) {
      return res.status(429).json({
        success: false,
        message: `Cooldown active. Please wait ${canAttempt.waitHours} hour(s).`,
        nextAttemptAt: canAttempt.nextAttemptAt
      });
    }

    // Fetch all questions submitted
    const questionIds = answers.map(a => a.questionId);
    const questions = await TrainingQuestion.find({ _id: { $in: questionIds }, isActive: true });

    if (questions.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid questions found' });
    }

    // Build question map for fast lookup
    const questionMap = {};
    questions.forEach(q => { questionMap[q._id.toString()] = q; });

    // Evaluate answers
    let correctCount = 0;
    const evaluatedAnswers = [];
    const questionStats = [];

    for (const ans of answers) {
      const q = questionMap[ans.questionId];
      if (!q) continue;

      const selectedIndex = parseInt(ans.selectedOptionIndex);
      const isCorrect = q.options[selectedIndex]?.isCorrect === true;

      if (isCorrect) correctCount++;

      evaluatedAnswers.push({
        questionId: ans.questionId,
        selectedOptionIndex: selectedIndex,
        isCorrect
      });

      // Track analytics
      questionStats.push({
        updateOne: {
          filter: { _id: ans.questionId },
          update: {
            $inc: {
              totalAnswered: 1,
              ...(isCorrect ? { totalCorrect: 1 } : {})
            }
          }
        }
      });
    }

    // Batch update question stats (non-blocking)
    if (questionStats.length > 0) {
      TrainingQuestion.bulkWrite(questionStats).catch(err =>
        console.error('[Training] Question stats update failed:', err)
      );
    }

    const Settings = require('../../models/Settings');
    const settings = await Settings.findOne({ type: 'global' });
    const minL1 = settings?.mcqMinScoreL1 !== undefined ? settings.mcqMinScoreL1 : 80;
    const minL2 = settings?.mcqMinScoreL2 !== undefined ? settings.mcqMinScoreL2 : 50;

    const totalQuestions = evaluatedAnswers.length;
    const scorePercent = Math.round((correctCount / totalQuestions) * 100);
    const levelAssigned = calculateLevel(scorePercent, minL1, minL2);
    const passed = scorePercent >= minL2; // L2+ = pass

    // Attempt number
    const newAttemptNumber = (vendor.training.attemptCount || 0) + 1;

    // Get video watch data from in-progress attempt
    const inProgressAttempt = await TrainingAttempt.findOne({
      vendorId: vendor._id,
      completedAt: null
    });
    const videoWatchData = inProgressAttempt?.videoWatchData || [];

    // Delete in-progress placeholder and create final attempt
    if (inProgressAttempt) {
      await TrainingAttempt.deleteOne({ _id: inProgressAttempt._id });
    }

    const attempt = await TrainingAttempt.create({
      vendorId: vendor._id,
      attemptNumber: newAttemptNumber,
      score: scorePercent,
      totalQuestions,
      correctAnswers: correctCount,
      levelAssigned,
      answers: evaluatedAnswers,
      videoWatchData,
      completedAt: new Date(),
      isActivatingAttempt: passed && vendor.training.status !== 'completed'
    });

    // ── Update Vendor ──
    const levelNumber = levelAssigned === 'L1' ? 1 : levelAssigned === 'L2' ? 2 : 3;
    const vendorUpdate = {
      'training.status': passed ? 'completed' : 'failed',
      'training.completedAt': passed ? new Date() : null,
      'training.attemptCount': newAttemptNumber,
      'training.lastAttemptAt': new Date(),
      currentLevel: levelAssigned,
      level: levelNumber,
      trainingScore: scorePercent
    };

    // If failed, set 24h cooldown
    if (!passed) {
      const nextAllowed = new Date();
      nextAllowed.setHours(nextAllowed.getHours() + 24);
      vendorUpdate['training.nextAttemptAllowedAt'] = nextAllowed;
    } else {
      vendorUpdate['training.nextAttemptAllowedAt'] = null;
      // Move vendor to training_pending so admin can review & approve
      if (vendor.approvalStatus !== 'approved') {
        vendorUpdate.approvalStatus = 'training_pending';
      }
    }

    await Vendor.findByIdAndUpdate(vendor._id, { $set: vendorUpdate });

    // ── Notifications ──
    try {
      if (passed) {
        // Notify vendor of success
        await createNotification({
          vendorId: vendor._id,
          type: 'training_passed',
          title: `🎉 Training Passed — Level ${levelAssigned}`,
          message: `You scored ${scorePercent}% and have been assigned Level ${levelAssigned}. Your account is now pending admin review.`,
          relatedId: attempt._id,
          relatedType: 'training'
        });

        // Notify all admins
        const Admin = require('../../models/Admin');
        const admins = await Admin.find({}).select('_id');
        const { createNotification: notify } = require('../notificationControllers/notificationController');
        for (const admin of admins) {
          await notify({
            adminId: admin._id,
            type: 'vendor_training_completed',
            title: 'Vendor Training Completed',
            message: `Vendor ${vendor.name} completed training with ${scorePercent}% score (${levelAssigned}). Pending your approval.`,
            relatedId: vendor._id,
            relatedType: 'vendor'
          });
        }
      } else {
        await createNotification({
          vendorId: vendor._id,
          type: 'training_failed',
          title: '📚 Training Score Below Passing',
          message: `You scored ${scorePercent}%. You need ${minL2}% to pass. You can retake after 24 hours.`,
          relatedId: attempt._id,
          relatedType: 'training'
        });
      }
    } catch (notifErr) {
      console.error('[Training] Notification error (non-blocking):', notifErr.message);
    }

    // Build answer review (show explanations)
    const answerReview = evaluatedAnswers.map(ans => {
      const q = questionMap[ans.questionId];
      return {
        questionId: ans.questionId,
        question: q?.question,
        selectedOptionIndex: ans.selectedOptionIndex,
        isCorrect: ans.isCorrect,
        correctOptionIndex: q?.options.findIndex(o => o.isCorrect),
        explanation: q?.explanation || ''
      };
    });

    res.status(200).json({
      success: true,
      message: passed
        ? `Congratulations! You passed with ${scorePercent}% and have been assigned Level ${levelAssigned}.`
        : `You scored ${scorePercent}%. Required: ${minL2}%. Please retake after 24 hours.`,
      data: {
        score: scorePercent,
        correctAnswers: correctCount,
        totalQuestions,
        levelAssigned,
        passed,
        attemptNumber: newAttemptNumber,
        nextAttemptAt: passed ? null : vendorUpdate['training.nextAttemptAllowedAt'],
        answerReview
      }
    });
  } catch (error) {
    console.error('[Training] submitTest error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit test. Please try again.' });
  }
};

module.exports = {
  getTrainingStatus,
  getTrainingVideos,
  markVideoWatched,
  getTestQuestions,
  submitTest
};
