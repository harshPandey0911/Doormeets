const mongoose = require('mongoose');
const mongoUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    const db = mongoose.connection.db;
    const bookings = await db.collection('bookings').find({}).sort({ createdAt: -1 }).limit(20).toArray();
    console.log("Fetched 20 bookings.");
    bookings.forEach((b, idx) => {
      const str = JSON.stringify(b);
      const sizeKB = (str.length / 1024).toFixed(2);
      console.log(`Booking #${idx + 1} (${b.bookingNumber}): size = ${sizeKB} KB`);
      // Find large keys
      Object.keys(b).forEach(k => {
        const valStr = JSON.stringify(b[k]);
        if (valStr && valStr.length > 5000) {
          console.log(`  -> Key "${k}" is large: ${(valStr.length / 1024).toFixed(2)} KB`);
        }
      });
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

run();
