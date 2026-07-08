const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../../config/cloudinary');
const { authenticate } = require('../../middleware/authMiddleware');
const { isVendor } = require('../../middleware/roleMiddleware');

const {
  getAvailableConsultations,
  acceptConsultation,
  generateQuote,
  declineConsultation,
  markEnRoute,
  sendArrivalOtp,
  verifyArrivalOtp,
  sendCompletionOtp,
  verifyCompletionOtp
} = require('../../controllers/vendorControllers/paintingConsultationController');

// ─── Cloudinary storage for inspection photos ─────────────────────
const inspectionPhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: (req, file) => ({
    folder: `painting_inspections/${req.params.id || 'general'}`,
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ quality: 'auto:good', fetch_format: 'auto' }],
    public_id: `${file.fieldname}-${Date.now()}`
  })
});

const uploadInspectionPhoto = multer({
  storage: inspectionPhotoStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

router.use(authenticate, isVendor);

// ─── Core Consultation Actions ────────────────────────────────────
router.get('/available', getAvailableConsultations);
router.put('/:id/accept', acceptConsultation);
router.post('/:id/generate-quote', generateQuote);
router.put('/:id/decline', declineConsultation);

// ─── Tracking Flow ────────────────────────────────────────────────
router.put('/:id/en-route', markEnRoute);

// Arrival OTP: send to user's phone, vendor enters it to confirm physical arrival
router.post('/:id/arrival-otp/send', sendArrivalOtp);
router.post('/:id/arrival-otp/verify', uploadInspectionPhoto.single('arrivalPhoto'), verifyArrivalOtp);

// Completion OTP: send to user after inspection, vendor enters to confirm done + uploads photos
router.post('/:id/completion-otp/send', sendCompletionOtp);
router.post('/:id/completion-otp/verify', uploadInspectionPhoto.array('inspectionPhotos', 10), verifyCompletionOtp);

module.exports = router;
