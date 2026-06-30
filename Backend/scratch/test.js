const express = require('require');
// Wait, I should use const express = require('express');
const router = express.Router();
const {
  requestConsultation,
  getMyConsultations,
  quoteAction
} = require('../../controllers/userControllers/paintingConsultationController');
const { protect } = require('../../middlewares/authMiddleware'); // Check if authMiddleware exists or use the right one.

// I will write the actual file down below with correct imports.
