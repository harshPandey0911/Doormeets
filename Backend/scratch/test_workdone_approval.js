const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const mongoUri = "mongodb+srv://harshpandey09112004_db_user:AKJADD1jCULsc5A7@doormeet.xylkk3b.mongodb.net/civilconnect?retryWrites=true&w=majority";

const Vendor = require('../models/Vendor');
const Worker = require('../models/Worker');
const Booking = require('../models/Booking');

async function runTest() {
  const API_URL = 'http://localhost:5000/api';
  console.log('Connecting to database...');
  await mongoose.connect(mongoUri);
  console.log('Connected to DB');

  // Use Harsh Kanojiya (Vendor ID: 6a5b5bc99ad2dce4e2abb776)
  const vendorId = '6a5b5bc99ad2dce4e2abb776';
  
  // Find or create worker
  let worker = await Worker.findOne({ phone: '9999922222' });
  if (!worker) {
    worker = await Worker.create({
      name: 'Test Approval Worker',
      phone: '9999922222',
      vendorId: vendorId,
      status: 'ONLINE',
      aadhar: {
        number: '123456789012',
        document: 'https://res.cloudinary.com/deorxby43/image/upload/v1779695058/vendors/documents/jenam0ubwilxc196j8xc.webp'
      }
    });
  } else {
    worker.status = 'ONLINE';
    await worker.save();
  }

  // Generate tokens
  const vendorToken = jwt.sign({ userId: vendorId, role: 'VENDOR' }, process.env.JWT_SECRET || 'your_secret_here');
  const workerToken = jwt.sign({ userId: worker._id.toString(), role: 'WORKER' }, process.env.JWT_SECRET || 'your_secret_here');

  const vendorHeaders = { Authorization: `Bearer ${vendorToken}` };
  const workerHeaders = { Authorization: `Bearer ${workerToken}` };

  // Create a fresh test booking
  const booking = await Booking.create({
    bookingNumber: 'BK-TEST-APPROVAL-' + Date.now().toString().slice(-4),
    userId: '6a13fdd2381a994f1815879a', // existing user in DB
    vendorId: vendorId,
    workerId: worker._id,
    serviceId: '6a114e7a962a59f22354f24a',
    serviceName: 'AC Cleaning Service',
    serviceCategory: 'AC Service',
    status: 'in_progress',
    basePrice: 300,
    tax: 0,
    visitingCharges: 0,
    finalAmount: 300,
    address: {
      addressLine1: 'Test Address Line 1',
      city: 'Indore',
      state: 'MP',
      pincode: '452001'
    },
    scheduledDate: new Date(),
    scheduledTime: '12:00 PM',
    timeSlot: {
      start: '12:00 PM',
      end: '02:00 PM'
    }
  });
  console.log(`Created test booking ${booking.bookingNumber} in status ${booking.status}`);

  try {
    // 1. Worker submits work done
    console.log('\n--- 1. Worker submitting work done details ---');
    const completionPayload = {
      workPhotos: ['https://res.cloudinary.com/demo/image/upload/sample.jpg'],
      workDoneDetails: { notes: 'AC clean complete, filter replaced' },
      billDetails: {
        allServices: [{ name: 'AC Cleaning Service', quantity: 1, basePrice: 300 }],
        billParts: []
      }
    };

    const submitRes = await axios.post(`${API_URL}/vendors/bookings/${booking._id}/self/complete`, completionPayload, { headers: workerHeaders });
    console.log('API Response:', submitRes.data.message);
    
    // Check updated booking
    let updatedBooking = await Booking.findById(booking._id);
    console.log(`Booking Status after worker submit: "${updatedBooking.status}" (Expected: "work_done_submitted")`);
    console.log(`Work Done Approval Status: "${updatedBooking.workDoneApprovalStatus}" (Expected: "pending")`);

    // 2. Vendor rejects work done
    console.log('\n--- 2. Vendor rejecting work done details ---');
    const rejectRes = await axios.post(`${API_URL}/vendors/bookings/${booking._id}/reject-work`, { reason: 'Photo is blurry' }, { headers: vendorHeaders });
    console.log('API Response:', rejectRes.data.message);

    updatedBooking = await Booking.findById(booking._id);
    console.log(`Booking Status after vendor reject: "${updatedBooking.status}" (Expected: "in_progress")`);
    console.log(`Work Done Approval Status: "${updatedBooking.workDoneApprovalStatus}" (Expected: "rejected")`);
    console.log(`Rejection Reason: "${updatedBooking.workDoneRejectionReason}"`);

    // 3. Worker resubmits work done
    console.log('\n--- 3. Worker resubmitting work done details ---');
    const resubmitRes = await axios.post(`${API_URL}/vendors/bookings/${booking._id}/self/complete`, completionPayload, { headers: workerHeaders });
    console.log('API Response:', resubmitRes.data.message);

    updatedBooking = await Booking.findById(booking._id);
    console.log(`Booking Status after worker resubmit: "${updatedBooking.status}" (Expected: "work_done_submitted")`);
    console.log(`Work Done Approval Status: "${updatedBooking.workDoneApprovalStatus}" (Expected: "pending")`);

    // 4. Vendor approves work done
    console.log('\n--- 4. Vendor approving work done details ---');
    const approveRes = await axios.post(`${API_URL}/vendors/bookings/${booking._id}/approve-work`, {}, { headers: vendorHeaders });
    console.log('API Response:', approveRes.data.message);

    updatedBooking = await Booking.findById(booking._id);
    console.log(`Booking Status after vendor approve: "${updatedBooking.status}" (Expected: "work_done")`);
    console.log(`Work Done Approval Status: "${updatedBooking.workDoneApprovalStatus}" (Expected: "approved")`);
    console.log(`Payment OTP generated: "${updatedBooking.paymentOtp}"`);

    console.log('\n✅ All tests passed successfully!');

  } catch (err) {
    console.error('❌ Test failed:', err.response?.data || err.message);
  } finally {
    // Cleanup
    await Booking.deleteOne({ _id: booking._id });
    await Worker.deleteOne({ _id: worker._id });
    console.log('Cleanup finished.');
    await mongoose.disconnect();
  }
}

runTest();
