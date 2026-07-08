const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const Booking = require('../models/Booking');
const PaintingConsultation = require('../models/PaintingConsultation');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');
  
  try {
    const booking = await Booking.findById('6a4de6c088189c9bb076e501');
    if (!booking) {
      console.log('Booking not found!');
      return;
    }
    
    console.log('Original Booking:', booking.bookingNumber, 'isConsultation:', booking.isConsultation);
    
    // Create consultation linked to this booking
    const consultation = await PaintingConsultation.create({
      userId: booking.userId,
      vendorId: booking.vendorId,
      bookingId: booking._id,
      status: 'INSPECTION_IN_PROGRESS',
      propertyType: '3BHK',
      projectType: 'INTERIOR',
      scope: 'Custom Painting Consultation',
      city: booking.address?.city || 'Indore'
    });
    
    booking.isConsultation = true;
    booking.consultationId = consultation._id;
    booking.status = 'visited'; // Keep status as visited
    await booking.save();
    
    console.log('Updated Booking successfully! Linked consultation ID:', consultation._id);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
