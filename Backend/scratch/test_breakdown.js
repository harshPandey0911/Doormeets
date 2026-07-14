const mongoose = require('mongoose');

const mongoUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";

const test = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Pre-register all models
    const User = require('../models/User');
    const Vendor = require('../models/Vendor');
    const Booking = require('../models/Booking');
    const PricingConfig = require('../models/PricingConfig');

    console.log("1. Finding bookings with projection, populate, and sort...");
    const start = Date.now();
    const bookings = await Booking.find({
      status: { $in: ['COMPLETED', 'completed', 'paid', 'PAID'] }
    })
      .select('bookingNumber createdAt userId vendorId finalAmount basePrice serviceId cityId brandId completedAt updatedAt')
      .populate('userId', 'name email phone')
      .populate('vendorId', 'name email phone businessName level')
      .sort({ createdAt: -1 });

    console.log(`2. Bookings found: ${bookings.length} (took ${Date.now() - start}ms)`);

    const serviceIds = bookings.map(b => b.serviceId).filter(Boolean);
    const pricings = await PricingConfig.find({ serviceId: { $in: serviceIds } });
    console.log(`3. PricingConfigs found: ${pricings.length}`);

    await mongoose.disconnect();
    console.log("Done");
  } catch (err) {
    console.error("Test Error:", err);
  }
};

test();
