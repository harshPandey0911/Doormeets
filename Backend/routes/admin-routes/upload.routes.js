const express = require('express');
const router = express.Router();
const { uploadImage, uploadVideo } = require('../../middleware/uploadMiddleware');
const { getSignature } = require('../../controllers/cloudinaryController');
const { authenticate } = require('../../middleware/authMiddleware');
const { isAdmin } = require('../../middleware/roleMiddleware');

// Get signature for direct signed upload
router.get('/upload/sign-signature', getSignature);

// Upload single image to Cloudinary
router.post('/upload', authenticate, isAdmin, uploadImage, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // When using multer-storage-cloudinary, req.file.path is the secure_url
    res.status(200).json({
      success: true,
      imageUrl: req.file.path,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: error.message
    });
  }
});

// Upload video to Cloudinary (for welcome page background video)
router.post('/upload/video', authenticate, isAdmin, uploadVideo, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file uploaded'
      });
    }

    console.log('[Video Upload] File info:', JSON.stringify({
      path: req.file.path,
      secure_url: req.file.secure_url,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size
    }));

    const videoUrl = req.file.secure_url || req.file.path;

    res.status(200).json({
      success: true,
      videoUrl,
      message: 'Video uploaded successfully'
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload video',
      error: error.message
    });
  }
});

module.exports = router;
