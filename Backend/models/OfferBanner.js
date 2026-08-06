const mongoose = require('mongoose');

const offerBannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true
  },
  imageUrl: {
    type: String,
    required: [true, 'Please provide an image URL']
  },
  mobileImageUrl: {
    type: String,
    default: ''
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    default: 'image'
  },
  link: {
    type: String,
    default: ''
  },
  targetCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  slug: {
    type: String,
    default: null
  },
  // Zones this banner is scoped to. Empty = global (shown in every zone), same convention as
  // Category.zoneIds. A Zone Admin creating a banner can only scope it to their own zone.
  zoneIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zone',
    index: true
  }],
  priority: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('OfferBanner', offerBannerSchema);
