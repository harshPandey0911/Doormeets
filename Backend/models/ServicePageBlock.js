const mongoose = require('mongoose');

/**
 * ServicePageBlock Model
 * Stores the designable page builder blocks for a service page.
 * Admin can add/remove/reorder up to 15 block types.
 */
const servicePageBlockSchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
    index: true
  },
  blockType: {
    type: String,
    required: true,
    enum: [
      'image_gallery',       // 1. Image Gallery
      'banner_slider',       // 2. Banner Image Slider
      'heading_text',        // 3. Heading and Text Block (multiple use)
      'whats_included',      // 4. What's Included
      'please_note',         // 5. Please Note
      'warranty',            // 6. Warranty Block
      'faq',                 // 7. FAQ Accordion
      'reviews',             // 8. Reviews
      'process',             // 9. Process with/without Image
      'brands',              // 10. Brands
      'whats_not_included',  // 11. What's Not Included
      'rate_card',           // 12. Rate Card Link
      'how_it_works',        // 13. How It Works with/without Image
      'comparison',          // 14. Comparison Link
      'offer_image'          // 15. Offer Image
    ]
  },
  order: {
    type: Number,
    default: 0,
    index: true
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  // Block-specific data stored as flexible Mixed type
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

servicePageBlockSchema.index({ serviceId: 1, order: 1 });

module.exports = mongoose.model('ServicePageBlock', servicePageBlockSchema);
