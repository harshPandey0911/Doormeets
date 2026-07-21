const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Vendor = require('./models/Vendor');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/doormeets', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('Connected to DB. Starting migration...');
  try {
    const vendors = await Vendor.find({ 'wallet.earnings': { $gt: 0 } });
    console.log(`Found ${vendors.length} vendors with earnings to migrate.`);
    
    let count = 0;
    for (const vendor of vendors) {
      const earnings = vendor.wallet.earnings || 0;
      if (earnings > 0) {
        vendor.wallet.credits = (vendor.wallet.credits || 0) + (earnings / 10);
        vendor.wallet.earnings = 0;
        await vendor.save();
        count++;
        console.log(`Migrated ${earnings} earnings (${earnings/10} credits) for vendor ${vendor._id}`);
      }
    }
    
    console.log(`Migration complete! Successfully migrated ${count} vendors.`);
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    mongoose.disconnect();
  }
}).catch(err => console.error(err));
