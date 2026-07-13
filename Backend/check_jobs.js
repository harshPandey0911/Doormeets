const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

async function checkVendorJobs() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Booking = require('./models/Booking');
  const vendorId = '6a13fdd2381a994f1815879a';

  const activeSelfJobs = await Booking.find({
    vendorId: vendorId,
    status: { $in: ['accepted', 'assigned', 'visited', 'in_progress', 'work_done', 'final_settlement'] }
  }).lean();

  console.log('Vendor active bookings count:', activeSelfJobs.length);
  activeSelfJobs.forEach(j => {
    console.log(`- Booking: ${j.bookingNumber}, status: ${j.status}, isSelfJob: ${j.isSelfJob}`);
  });

  const b = await Booking.findById('6a521fbf447ebcc58dc7e41e').lean();
  if (b) {
    console.log('Target Booking Status:', b.status);
    console.log('Target Booking notifiedVendors:', b.notifiedVendors);
    console.log('Target Booking potentialVendors:', b.potentialVendors);
  } else {
    console.log('Target booking not found');
  }

  process.exit(0);
}
checkVendorJobs();
