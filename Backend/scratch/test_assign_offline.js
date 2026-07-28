const axios = require('axios');
const mongoose = require('mongoose');

// Active DB connection
const mongoUri = "mongodb+srv://harshpandey09112004_db_user:AKJADD1jCULsc5A7@doormeet.xylkk3b.mongodb.net/civilconnect?retryWrites=true&w=majority";

const Worker = require('../models/Worker');
const Booking = require('../models/Booking');

async function test() {
  const API_URL = 'http://localhost:5000/api';
  console.log('1. Logging in with 6263079701...');
  
  try {
    const loginRes = await axios.post(`${API_URL}/vendors/auth/verify-login`, {
      phone: '6263079701',
      otp: '123456'
    });
    
    const token = loginRes.data.accessToken;
    const headers = { Authorization: `Bearer ${token}` };

    // Connect to DB for setups
    await mongoose.connect(mongoUri);
    console.log('Connected to DB');

    // Create a temporary worker in 'active' (default/offline) status
    const tempWorker = await Worker.create({
      name: 'Offline Test Worker',
      phone: '9999911111',
      vendorId: '6a5b5bc99ad2dce4e2abb776',
      status: 'active', // offline state
      aadhar: {
        number: '123456789012',
        document: 'https://res.cloudinary.com/deorxby43/image/upload/v1779695058/vendors/documents/jenam0ubwilxc196j8xc.webp'
      }
    });
    console.log('Created temporary worker with status:', tempWorker.status);

    // Find or create a temporary accepted/confirmed booking
    let booking = await Booking.findOne({ vendorId: '6a5b5bc99ad2dce4e2abb776', status: 'accepted' });
    if (!booking) {
      booking = await Booking.create({
        bookingNumber: 'BK-TEST-OFFLINE',
        userId: '6a13fdd2381a994f1815879a',
        vendorId: '6a5b5bc99ad2dce4e2abb776',
        serviceId: '6a114e7a962a59f22354f24a',
        serviceName: 'Test Service',
        status: 'accepted',
        finalAmount: 500,
        address: 'Indore'
      });
    }
    console.log('Using booking:', booking.bookingNumber);

    console.log('\n2. Trying to assign OFFLINE worker via API...');
    try {
      await axios.post(`${API_URL}/vendors/bookings/${booking._id}/assign-worker`, {
        workerId: tempWorker._id.toString()
      }, { headers });
      console.log('❌ SUCCESS? (Error: Should have failed!)');
    } catch (err) {
      console.log('✅ FAILED (As expected!):', err.response?.status, err.response?.data?.message);
    }

    console.log('\n3. Setting worker status to ONLINE...');
    tempWorker.status = 'ONLINE';
    await tempWorker.save();
    console.log('Worker status set to ONLINE.');

    console.log('\n4. Trying to assign ONLINE worker via API...');
    try {
      const res = await axios.post(`${API_URL}/vendors/bookings/${booking._id}/assign-worker`, {
        workerId: tempWorker._id.toString()
      }, { headers });
      console.log('✅ SUCCESS (As expected!):', res.data.message);
    } catch (err) {
      console.error('❌ FAILED:', err.response?.status, err.response?.data);
    }

    // Cleanup
    await Worker.deleteOne({ _id: tempWorker._id });
    if (booking.bookingNumber === 'BK-TEST-OFFLINE') {
      await Booking.deleteOne({ _id: booking._id });
    } else {
      // Revert booking status
      booking.status = 'accepted';
      booking.workerId = null;
      await booking.save();
    }
    console.log('Cleanup complete.');

  } catch (error) {
    console.error('Error during assignment test:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

test();
