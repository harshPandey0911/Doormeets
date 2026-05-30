const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets';

async function checkNotifications() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB\n');

  const Notification = mongoose.model('Notification', new mongoose.Schema({}, { strict: false }));

  // Look for notifications related to this booking
  const notifications = await Notification.find({
    $or: [
      { type: 'booking_reconfirmation_request' },
      { type: 'booking_escalation' }
    ]
  })
  .sort({ createdAt: -1 })
  .limit(10)
  .lean();

  console.log(`Found ${notifications.length} recent reconfirmation/escalation notifications:\n`);
  for (const n of notifications) {
    console.log(`--- ${n.type} ---`);
    console.log(`  Title: ${n.title}`);
    console.log(`  Message: ${n.message}`);
    console.log(`  vendorId: ${n.vendorId}`);
    console.log(`  adminId: ${n.adminId}`);
    console.log(`  createdAt: ${n.createdAt}`);
    console.log('');
  }

  await mongoose.disconnect();
}

checkNotifications().catch(console.error);
