const OfferBanner = require('../../models/OfferBanner');
const { validationResult } = require('express-validator');
const cloudinaryService = require('../../services/cloudinaryService');

/**
 * Get all offer banners
 */
const getOfferBanners = async (req, res) => {
  try {
    const banners = await OfferBanner.find().sort({ priority: 1, createdAt: -1 });
    res.status(200).json({
      success: true,
      data: banners
    });
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banners'
    });
  }
};

/**
 * Add new offer banner
 */
const addOfferBanner = async (req, res) => {
  try {
    const { title, link, priority, image, mobileImage, mediaType } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, message: 'Image/Video is required' });
    }

    // Upload to Cloudinary
    const uploadRes = await cloudinaryService.uploadFile(image, { folder: 'banners/offers' });
    if (!uploadRes.success) {
      return res.status(500).json({ success: false, message: 'Upload failed' });
    }

    // Upload mobile banner if present
    let mobileImageUrl = '';
    if (mobileImage) {
      const uploadMobileRes = await cloudinaryService.uploadFile(mobileImage, { folder: 'banners/offers' });
      if (uploadMobileRes.success) {
        mobileImageUrl = uploadMobileRes.url;
      }
    }

    const banner = await OfferBanner.create({
      title,
      link,
      priority: priority || 0,
      imageUrl: uploadRes.url,
      mobileImageUrl: mobileImageUrl || uploadRes.url, // Fallback to main image
      mediaType: mediaType || 'image'
    });

    res.status(201).json({
      success: true,
      message: 'Banner added successfully',
      data: banner
    });
  } catch (error) {
    console.error('Error adding banner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add banner'
    });
  }
};

/**
 * Update offer banner
 */
const updateOfferBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, link, priority, isActive, image, mobileImage, mediaType } = req.body;

    let updateData = { title, link, priority, isActive, mediaType };

    if (image && image.startsWith('data:')) {
      // Upload new image
      const uploadRes = await cloudinaryService.uploadFile(image, { folder: 'banners/offers' });
      if (uploadRes.success) {
        updateData.imageUrl = uploadRes.url;
      }
    }

    if (mobileImage && mobileImage.startsWith('data:')) {
      // Upload new mobile image
      const uploadMobileRes = await cloudinaryService.uploadFile(mobileImage, { folder: 'banners/offers' });
      if (uploadMobileRes.success) {
        updateData.mobileImageUrl = uploadMobileRes.url;
      }
    }

    const banner = await OfferBanner.findByIdAndUpdate(id, updateData, { new: true });

    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Banner updated successfully',
      data: banner
    });
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update banner'
    });
  }
};

/**
 * Delete offer banner
 */
const deleteOfferBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await OfferBanner.findByIdAndDelete(id);

    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete banner'
    });
  }
};

module.exports = {
  getOfferBanners,
  addOfferBanner,
  updateOfferBanner,
  deleteOfferBanner
};
