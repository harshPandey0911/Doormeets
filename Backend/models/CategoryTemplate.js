const mongoose = require('mongoose');

const categoryTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    enum: ['MINUTE_BASED', 'PACKAGE_BASED', 'IMAGE_CONSULTANT', 'MULTI_VISIT', 'SERVICE_PAGE', 'NORMAL_SERVICE', 'SUBSCRIPTION_BASED'],
    index: true
  },
  schema: mongoose.Schema.Types.Mixed,
  blocks: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

module.exports = mongoose.model('CategoryTemplate', categoryTemplateSchema);
