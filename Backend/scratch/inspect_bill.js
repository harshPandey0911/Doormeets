const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const VendorBill = require('../models/VendorBill');

const mongoUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const booking = await Booking.findOne({ bookingNumber: 'BK178410449339358ILJ' }).lean();
    if (!booking) {
      console.log("Booking not found");
    } else {
      console.log("Booking full details:", {
        _id: booking._id,
        bookingNumber: booking.bookingNumber,
        bookingType: booking.bookingType,
        basePrice: booking.basePrice,
        tax: booking.tax,
        visitingCharges: booking.visitingCharges,
        finalAmount: booking.finalAmount,
        instantMarkupCharged: booking.instantMarkupCharged,
        paymentStatus: booking.paymentStatus,
        status: booking.status,
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt
      });

      const bill = await VendorBill.findOne({ bookingId: booking._id }).lean();
      if (bill) {
        console.log("VendorBill full details:", {
          _id: bill._id,
          originalServiceBase: bill.originalServiceBase,
          originalGST: bill.originalGST,
          services: bill.services,
          parts: bill.parts,
          grandTotal: bill.grandTotal,
          createdAt: bill.createdAt,
          updatedAt: bill.updatedAt
        });
      } else {
        console.log("No VendorBill found for this booking.");
      }
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
    try { await mongoose.disconnect(); } catch (_) {}
  }
};

run();
