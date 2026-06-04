const mongoose = require('mongoose');

const serviceWorkflowSchema = new mongoose.Schema({
  serviceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Service', 
    required: true, 
    unique: true, 
    index: true 
  },
  workflowType: { 
    type: String, 
    enum: ['single_visit', 'multi_visit', 'subscription', 'recurring'], 
    required: true 
  },
  totalVisits: { 
    type: Number, 
    default: 1 
  },
  frequency: { 
    type: String, 
    enum: ['none', 'daily', 'weekly', 'bi-weekly', 'monthly', 'quarterly'], 
    default: 'none' 
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive'], 
    default: 'active' 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('ServiceWorkflow', serviceWorkflowSchema);
