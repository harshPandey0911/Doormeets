const mongoose = require('mongoose');

/**
 * Zone Model
 * Manages service zones for geofencing capabilities.
 * A zone is defined as a closed polygon on the map.
 */
const zoneSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a zone name'],
    trim: true,
    unique: true
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon',
      required: true
    },
    // Array of rings, each ring is an array of coordinates [longitude, latitude]
    coordinates: {
      type: [[[Number]]],
      required: [true, 'Coordinates polygon is required']
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  }
}, {
  timestamps: true
});

// Index the coordinates array for fast 2dsphere queries (point in polygon matching)
zoneSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('Zone', zoneSchema);
