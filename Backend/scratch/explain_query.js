const mongoose = require('mongoose');

const mongoUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const BookingSchema = new mongoose.Schema({}, { strict: false });
    const Booking = mongoose.model('Booking', BookingSchema, 'bookings');

    const start = Date.now();
    const explanation = await Booking.find({}).sort({ createdAt: -1 }).skip(0).limit(20).explain("executionStats");
    console.log("Query explained in:", Date.now() - start, "ms");
    console.log(JSON.stringify(explanation.executionStats, null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
  }
};

run();
