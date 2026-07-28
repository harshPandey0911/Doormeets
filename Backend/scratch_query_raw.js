const mongoose = require('mongoose');

const mongoUri = "mongodb+srv://harshpandey09112004_db_user:AKJADD1jCULsc5A7@doormeet.xylkk3b.mongodb.net/civilconnect?retryWrites=true&w=majority";

const Worker = require('./models/Worker');

async function run() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to DB successfully!');
    const workers = await Worker.find({}).select('name phone vendorId isDeleted').lean();
    console.log('Workers in this DB:', JSON.stringify(workers, null, 2));
  } catch (error) {
    console.error('Failed to query:', error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
