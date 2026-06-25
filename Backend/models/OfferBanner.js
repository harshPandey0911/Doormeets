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
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    default: 'image'
  },
  link: {
    type: String,
    default: ''
  },
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
