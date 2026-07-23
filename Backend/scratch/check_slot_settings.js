const mongoose = require('mongoose');
require('dotenv').config();

const Settings = require('../models/Settings');

async function checkSlotSettings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const settings = await Settings.findOne({ type: 'global' }).select('slotsStartTime slotsEndTime slotIntervalGap');
    console.log('=== SLOT SETTINGS IN DATABASE ===');
    console.log('slotsStartTime:', settings?.slotsStartTime || 'NOT SET (will use default 09:00 AM)');
    console.log('slotsEndTime:', settings?.slotsEndTime || 'NOT SET (will use default 09:00 PM)');
    console.log('slotIntervalGap:', settings?.slotIntervalGap || 'NOT SET (will use default 30)');
    console.log('=================================');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkSlotSettings();
