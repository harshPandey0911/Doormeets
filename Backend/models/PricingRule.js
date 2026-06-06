const mongoose = require('mongoose');

const pricingRuleSchema = new mongoose.Schema({
  serviceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Service', 
    required: true, 
    index: true 
  },
  ruleType: { 
    type: String, 
    enum: ['formula', 'conditional'], 
    default: 'conditional' 
  },
  formulaString: { 
    type: String, 
    default: '' 
  },
  fieldName: { 
    type: String,
    default: ''
  },
  operator: { 
    type: String, 
    enum: ['', 'equals', 'greater_than', 'less_than'],
    default: ''
  },
  value: { 
    type: String,
    default: ''
  },
  priceModifierType: { 
    type: String, 
    enum: ['', 'add', 'multiply', 'fixed'],
    default: ''
  },
  modifierValue: { 
    type: Number,
    default: 0
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('PricingRule', pricingRuleSchema);
