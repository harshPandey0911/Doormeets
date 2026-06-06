const mongoose = require('mongoose');

const bookingVisitSchema = new mongoose.Schema({
  bookingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Booking', 
    required: true, 
    index: true 
  },
  visitNumber: { 
    type: Number, 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  scheduledDate: { 
    type: Date, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'assigned', 'on_the_way', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  workerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Worker', 
    default: null 
  },
  completedAt: { 
    type: Date, 
    default: null 
  },
  otp: { 
    type: String 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('BookingVisit', bookingVisitSchema);
