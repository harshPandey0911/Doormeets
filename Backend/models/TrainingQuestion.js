const mongoose = require('mongoose');

/**
 * TrainingQuestion — MCQ bank for vendor certification test.
 * Each question has exactly 4 options, one correct answer.
 */
const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  isCorrect: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const trainingQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  // Exactly 4 options; exactly 1 must have isCorrect: true
  options: {
    type: [optionSchema],
    validate: {
      validator: function (opts) {
        if (opts.length !== 4) return false;
        const correctCount = opts.filter(o => o.isCorrect).length;
        return correctCount === 1;
      },
      message: 'Each question must have exactly 4 options and exactly 1 correct answer'
    }
  },
  // Shown to vendor AFTER they submit the test (learning reinforcement)
  explanation: {
    type: String,
    default: '',
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  // Optional: link to a specific training video for context
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingVideo',
    default: null
  },
  // Optional: per-category question (null = global)
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Track how often this question is answered correctly (analytics)
  totalAnswered: { type: Number, default: 0 },
  totalCorrect: { type: Number, default: 0 },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  }
}, {
  timestamps: true
});

trainingQuestionSchema.index({ isActive: 1, difficulty: 1 });
trainingQuestionSchema.index({ categoryId: 1, isActive: 1 });

module.exports = mongoose.model('TrainingQuestion', trainingQuestionSchema);
