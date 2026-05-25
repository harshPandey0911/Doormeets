const mongoose = require('mongoose');

/**
 * TrainingAttempt — Records each vendor's test attempt.
 * One document per attempt; vendors can have multiple attempts (with cooldown).
 */
const videoWatchSchema = new mongoose.Schema({
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingVideo',
    required: true
  },
  watchedAt: { type: Date, default: Date.now },
  // How many seconds of the video the vendor actually watched
  watchedSeconds: { type: Number, default: 0 },
  // Whether vendor watched the full required duration
  fullyWatched: { type: Boolean, default: false }
}, { _id: false });

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingQuestion',
    required: true
  },
  // Index 0–3 of the selected option
  selectedOptionIndex: {
    type: Number,
    min: 0,
    max: 3,
    required: true
  },
  isCorrect: { type: Boolean, required: true }
}, { _id: false });

const trainingAttemptSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
    index: true
  },
  // Which attempt number this is (1st, 2nd, etc.)
  attemptNumber: {
    type: Number,
    default: 1
  },
  // Score as percentage (0–100)
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  // Level automatically assigned based on score
  levelAssigned: {
    type: String,
    enum: ['L1', 'L2', 'L3'],
    required: true
  },
  // Individual answers submitted
  answers: [answerSchema],
  // Videos watched before this attempt (progress tracking)
  videoWatchData: [videoWatchSchema],
  // When the vendor clicked "Submit Test"
  completedAt: {
    type: Date,
    default: Date.now
  },
  // Whether this was the attempt that activated the vendor
  isActivatingAttempt: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

trainingAttemptSchema.index({ vendorId: 1, createdAt: -1 });

module.exports = mongoose.model('TrainingAttempt', trainingAttemptSchema);
