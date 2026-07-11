const mongoose = require('mongoose');

const mongoUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";

const test = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));

    // Try to query the VendorDashboardContent model
    const doc = await mongoose.connection.db.collection('vendordashboardcontents').find().toArray();
    console.log("Vendor Dashboard Contents in DB:", JSON.stringify(doc, null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
  }
};

test();
