const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Vendor = require('../models/Vendor');
const Worker = require('../models/Worker');
const User = require('../models/User');
const Service = require('../models/Service');
const { acceptBooking } = require('../controllers/bookingControllers/vendorBookingController');

const mongoUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";

const runTest = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully.");

    // Find an active vendor to run tests on
    const vendor = await Vendor.findOne({ approvalStatus: 'approved' });
    if (!vendor) {
      console.log("No approved vendor found. Exiting test.");
      await mongoose.disconnect();
      return;
    }
    console.log(`Testing with Vendor: ${vendor.name} (${vendor._id})`);

    // Find or create a user for bookings
    let user = await User.findOne();
    if (!user) {
      user = await User.create({
        name: "Test User",
        phone: "9999999999",
        email: "testuser@gmail.com",
        role: "user"
      });
    }

    // Find a valid service for booking
    const service = await Service.findOne();
    if (!service) {
      console.log("No service found to create bookings. Exiting test.");
      await mongoose.disconnect();
      return;
    }

    // Clear any previous test bookings for this vendor
    await Booking.deleteMany({ userId: user._id });
    console.log("Cleared old test bookings.");

    // Create 2 instant bookings
    const booking1 = await Booking.create({
      bookingNumber: "TSTBK001",
      userId: user._id,
      serviceId: service._id,
      serviceName: service.title || "Test Service",
      serviceCategory: "Test Category",
      basePrice: 500,
      finalAmount: 500,
      scheduledDate: new Date(),
      scheduledTime: "12:00 PM",
      timeSlot: { start: "12:00 PM", end: "2:00 PM" },
      bookingType: "instant",
      status: "searching",
      address: {
        addressLine1: "123 Test St",
        city: "Indore",
        state: "MP",
        pincode: "452001"
      }
    });

    const booking2 = await Booking.create({
      bookingNumber: "TSTBK002",
      userId: user._id,
      serviceId: service._id,
      serviceName: service.title || "Test Service",
      serviceCategory: "Test Category",
      basePrice: 500,
      finalAmount: 500,
      scheduledDate: new Date(),
      scheduledTime: "12:30 PM",
      timeSlot: { start: "12:30 PM", end: "2:30 PM" },
      bookingType: "instant",
      status: "searching",
      address: {
        addressLine1: "123 Test St",
        city: "Indore",
        state: "MP",
        pincode: "452001"
      }
    });

    console.log("Created 2 test instant bookings.");

    // Let's create mock req, res for acceptBooking
    const mockRes = () => {
      const res = {};
      res.status = (code) => {
        res.statusCode = code;
        return res;
      };
      res.json = (data) => {
        res.body = data;
        return res;
      };
      return res;
    };

    // 1. Accept first booking
    const req1 = {
      user: {
        id: vendor._id.toString(),
        name: vendor.name,
        businessName: vendor.businessName
      },
      params: { id: booking1._id.toString() },
      app: {
        get: () => null // mock io
      }
    };
    const res1 = mockRes();

    console.log("Accepting Booking 1...");
    await acceptBooking(req1, res1);
    console.log("Booking 1 Response Status:", res1.statusCode);
    console.log("Booking 1 Response Body:", JSON.stringify(res1.body, null, 2));

    const updatedBooking1 = await Booking.findById(booking1._id);
    console.log(`Booking 1 isSelfJob: ${updatedBooking1.isSelfJob} (Expected: true)`);

    // Ensure vendor has at least one online worker so we can accept the second one
    let worker = await Worker.findOne({ vendorId: vendor._id });
    if (!worker) {
      worker = await Worker.create({
        name: "Test Worker",
        phone: "8888888888",
        aadhar: { number: "123456789012", document: "http://doc" },
        vendorId: vendor._id,
        status: "ONLINE"
      });
      console.log("Created online worker for testing second acceptance.");
    } else {
      worker.status = "ONLINE";
      await worker.save();
    }

    // 2. Accept second booking
    const req2 = {
      user: {
        id: vendor._id.toString(),
        name: vendor.name,
        businessName: vendor.businessName
      },
      params: { id: booking2._id.toString() },
      app: {
        get: () => null // mock io
      }
    };
    const res2 = mockRes();

    console.log("Accepting Booking 2...");
    await acceptBooking(req2, res2);
    console.log("Booking 2 Response Status:", res2.statusCode);
    console.log("Booking 2 Response Body:", JSON.stringify(res2.body, null, 2));

    const updatedBooking2 = await Booking.findById(booking2._id);
    console.log(`Booking 2 isSelfJob: ${updatedBooking2.isSelfJob} (Expected: false)`);

    // Clean up
    await Booking.deleteMany({ userId: user._id });
    console.log("Cleaned up bookings.");

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  } catch (err) {
    console.error("Test Error:", err);
    try {
      await mongoose.disconnect();
    } catch (_) {}
  }
};

runTest();
