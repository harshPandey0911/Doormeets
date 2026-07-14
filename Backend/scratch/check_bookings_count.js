const mongoose = require('mongoose');

const mongoUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const BookingSchema = new mongoose.Schema({}, { strict: false });
    const Booking = mongoose.model('Booking', BookingSchema, 'bookings');

    const UserSchema = new mongoose.Schema({}, { strict: false });
    const User = mongoose.model('User', UserSchema, 'users');

    // 1. Total bookings count
    const totalCount = await Booking.countDocuments({});
    console.log("Total Bookings in collection:", totalCount);

    // 2. Check indexes
    const indexes = await Booking.collection.indexes();
    console.log("Indexes on bookings collection:", indexes);

    // 3. Time simple query
    const startSimple = Date.now();
    const simpleRes = await Booking.find({}).sort({ createdAt: -1 }).skip(0).limit(20);
    console.log("Simple query (no populate) took:", Date.now() - startSimple, "ms. Items found:", simpleRes.length);

    // 4. Time populated query
    const startPopulate = Date.now();
    // Since we don't have schemas defined here, let's look at what we got
    // Let's run raw find and inspect some documents
    const sample = await Booking.findOne({});
    console.log("Sample Booking Document:", sample);

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
  }
};

run();
