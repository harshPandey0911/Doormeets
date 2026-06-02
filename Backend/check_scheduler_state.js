const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets';

async function checkSchedulerState() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB\n');

  const Booking = mongoose.model('Booking', new mongoose.Schema({}, { strict: false }));

  // Find all upcoming scheduled bookings (status: accepted/confirmed/assigned)
  const bookings = await Booking.find({
    status: { $in: ['accepted', 'confirmed', 'assigned'] },
    bookingType: 'scheduled',
    vendorId: { $ne: null }
  }).lean();

  console.log(`\nFound ${bookings.length} upcoming scheduled bookings:\n`);
  for (const b of bookings) {
    console.log(`--- Booking ${b.bookingNumber || b._id} ---`);
    console.log(`  Status: ${b.status}`);
    console.log(`  bookingType: ${b.bookingType}`);
    console.log(`  scheduledDate: ${b.scheduledDate}`);
    console.log(`  scheduledTime: ${b.scheduledTime}`);
    console.log(`  timeSlot: ${JSON.stringify(b.timeSlot)}`);
    console.log(`  reconfirmationStatus: ${b.reconfirmationStatus}`);
    console.log(`  vendorId: ${b.vendorId}`);
    console.log(`  serviceName: ${b.serviceName}`);
    console.log('');
  }

  // Also check if any bookings DON'T have bookingType 'scheduled' but have a scheduledDate
  const otherScheduled = await Booking.find({
    status: { $in: ['accepted', 'confirmed', 'assigned'] },
    bookingType: { $ne: 'scheduled' },
    scheduledDate: { $ne: null },
    vendorId: { $ne: null }
  }).lean();

  if (otherScheduled.length > 0) {
    console.log(`\n⚠️  Found ${otherScheduled.length} bookings with scheduledDate but bookingType != 'scheduled':`);
    for (const b of otherScheduled) {
      console.log(`  - ${b.bookingNumber || b._id} | bookingType: ${b.bookingType} | scheduledDate: ${b.scheduledDate}`);
    }
  }

  await mongoose.disconnect();
}

checkSchedulerState().catch(console.error);
