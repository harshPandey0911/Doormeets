require('dotenv').config();
const mongoose = require('mongoose');
const Vendor = require('./models/Vendor');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const res = await Vendor.findOneAndUpdate(
    { phone: '7879363299' },
    {
      $set: {
        isOnline: true,
        availabilityStatus: 'ONLINE',
        availability: 'AVAILABLE',
        reservedFrom: null,
        reservedBookingId: null
      }
    },
    { new: true }
  );
  
  console.log('Vendor harsh pandey status updated and reservations cleared:');
  console.log(`isOnline: ${res.isOnline}`);
  console.log(`availabilityStatus: ${res.availabilityStatus}`);
  console.log(`availability: ${res.availability}`);
  console.log(`reservedFrom: ${res.reservedFrom}`);
  
  // Sync to Redis if applicable
  try {
    const { setVendorOnline, setVendorAvailability } = require('./services/redisService');
    await setVendorOnline(res._id.toString(), true);
    await setVendorAvailability(res._id.toString(), 'AVAILABLE');
    console.log('Redis status synced');
  } catch (err) {
    console.warn('Redis sync skipped/failed:', err.message);
  }
  
  process.exit(0);
}

run();
