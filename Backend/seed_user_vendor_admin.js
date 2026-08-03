const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Vendor = require('./models/Vendor');
const Admin = require('./models/Admin');

async function seedCredentials() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // 1. Seed User side: phone 7879363299
    let user = await User.findOne({ phone: '7879363299' });
    if (user) {
      user.name = user.name || 'User 7879363299';
      user.isPhoneVerified = true;
      user.isActive = true;
      await user.save();
      console.log('Updated existing User with phone 7879363299');
    } else {
      user = await User.create({
        name: 'User 7879363299',
        phone: '7879363299',
        role: 'user',
        isPhoneVerified: true,
        isActive: true
      });
      console.log('Created new User with phone 7879363299');
    }

    // 2. Seed Vendor side: phone 7879363299
    let vendor = await Vendor.findOne({ phone: '7879363299' });
    if (vendor) {
      vendor.name = vendor.name || 'Vendor 7879363299';
      vendor.approvalStatus = 'approved';
      vendor.isPhoneVerified = true;
      vendor.isActive = true;
      await vendor.save();
      console.log('Updated existing Vendor with phone 7879363299');
    } else {
      vendor = await Vendor.create({
        name: 'Vendor 7879363299',
        phone: '7879363299',
        role: 'vendor',
        approvalStatus: 'approved',
        isPhoneVerified: true,
        isActive: true,
        categories: [],
        service: []
      });
      console.log('Created new Vendor with phone 7879363299');
    }

    // 3. Seed Admin: admin@Doormeets.com / admin123
    let admin1 = await Admin.findOne({ email: 'admin@doormeets.com' });
    if (admin1) {
      admin1.password = 'admin123'; // pre-save hook will hash it
      admin1.role = 'SUPER_ADMIN';
      admin1.isActive = true;
      await admin1.save();
      console.log('Updated Admin: admin@Doormeets.com');
    } else {
      admin1 = await Admin.create({
        name: 'DoorMeets Admin',
        email: 'admin@doormeets.com',
        password: 'admin123',
        role: 'SUPER_ADMIN',
        isActive: true,
        canApproveVendors: true,
        canApproveWorkers: true
      });
      console.log('Created Admin: admin@Doormeets.com');
    }

    // 4. Seed Admin: admin@harsh.com / harsh123 (Protected)
    let admin2 = await Admin.findOne({ email: 'admin@harsh.com' });
    if (admin2) {
      admin2.password = 'harsh123'; // pre-save hook will hash it
      admin2.role = 'SUPER_ADMIN';
      admin2.isActive = true;
      await admin2.save();
      console.log('Updated Admin: admin@harsh.com');
    } else {
      admin2 = await Admin.create({
        name: 'Harsh Admin',
        email: 'admin@harsh.com',
        password: 'harsh123',
        role: 'SUPER_ADMIN',
        isActive: true,
        canApproveVendors: true,
        canApproveWorkers: true
      });
      console.log('Created Admin: admin@harsh.com');
    }

    console.log('\n--- SEED SUMMARY ---');
    console.log('1. User Phone: 7879363299 | OTP: 123456');
    console.log('2. Vendor Phone: 7879363299 | OTP: 123456');
    console.log('3. Admin Email: admin@Doormeets.com | Password: admin123');
    console.log('4. Protected Admin Email: admin@harsh.com | Password: harsh123');

    await mongoose.disconnect();
    console.log('DB disconnected. Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding DB credentials:', err);
    process.exit(1);
  }
}

seedCredentials();
