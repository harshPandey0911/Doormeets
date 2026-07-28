const mongoose = require('mongoose');
const mongoUri = "mongodb+srv://harshpandey09112004_db_user:AKJADD1jCULsc5A7@doormeet.xylkk3b.mongodb.net/civilconnect?retryWrites=true&w=majority";
const Worker = require('../models/Worker');

async function cleanup() {
  console.log('Connecting to database for cleanup...');
  await mongoose.connect(mongoUri);
  console.log('Connected.');

  // Delete test workers by names or test phones
  const result = await Worker.deleteMany({
    $or: [
      { name: /Offline Test Worker/i },
      { name: /Simulated Worker/i },
      { name: /Test worker/i },
      { phone: '9999911111' },
      { phone: '9876543298' },
      { phone: '9876543219' },
      { phone: '9175588666' }
    ]
  });

  console.log(`Deleted ${result.deletedCount} test workers from the database.`);
  await mongoose.disconnect();
}

cleanup();
