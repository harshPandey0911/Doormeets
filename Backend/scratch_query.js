const mongoose = require('mongoose');

const mongoUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";

const test = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const templates = await mongoose.connection.db.collection('categorytemplates').find({}).toArray();
    console.log("Category Templates in DB:");
    templates.forEach(t => {
      console.log(`- Name: ${t.name}, Code: ${t.code}, ID: ${t._id}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
  }
};

test();
