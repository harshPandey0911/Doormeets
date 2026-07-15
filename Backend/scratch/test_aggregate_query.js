const mongoose = require('mongoose');
const Booking = require('../models/Booking');

const mongoUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const vendorId = "6a13fdd2381a994f1815879a";
    const vId = new mongoose.Types.ObjectId(vendorId);

    // Build the exact query from getVendorBookings
    const query = {
      vendorId: vId,
      status: { $in: ['assigned', 'worker_accepted'] }
    };

    console.log("Query:", JSON.stringify(query));

    const bookings = await Booking.find(query).lean();
    console.log(`find() matching items: ${bookings.length}`);

    const [result] = await Booking.aggregate([
      { $match: query },
      {
        $facet: {
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: 0 },
            { $limit: 20 },
            {
              $project: {
                _id: 1,
                bookingNumber: 1,
                status: 1
              }
            }
          ],
          total: [{ $count: 'n' }]
        }
      }
    ]);

    console.log("Aggregate result:", JSON.stringify(result, null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
    try { await mongoose.disconnect(); } catch (_) {}
  }
};

run();
