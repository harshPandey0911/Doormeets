const mongoose = require('mongoose');

const serviceFieldSchema = new mongoose.Schema({
  serviceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Service', 
    required: true, 
    index: true 
  },
  label: { 
    type: String, 
    required: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  fieldType: { 
    type: String, 
    enum: ['text', 'number', 'dropdown', 'radio', 'checkbox', 'multi-select', 'date', 'time', 'textarea', 'image', 'file', 'location'], 
    required: true 
  },
  isRequired: { 
    type: Boolean, 
    default: false 
  },
  showToUser: {
    type: Boolean,
    default: true
  },
  options: [{ 
    type: String 
  }],
  defaultValue: { 
    type: String, 
    default: '' 
  },
  order: { 
    type: Number, 
    default: 0 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('ServiceField', serviceFieldSchema);
