const mongoose = require('mongoose');

const serviceWorkflowStepSchema = new mongoose.Schema({
  workflowId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ServiceWorkflow', 
    required: true, 
    index: true 
  },
  sequence: { 
    type: Number, 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  daysAfterPreviousVisit: { 
    type: Number, 
    default: 0 
  },
  schedulingType: { 
    type: String, 
    enum: ['auto_offset', 'custom_scheduling'], 
    default: 'auto_offset' 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('ServiceWorkflowStep', serviceWorkflowStepSchema);
