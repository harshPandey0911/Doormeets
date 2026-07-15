const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const VendorBill = require('../models/VendorBill');
const Settings = require('../models/Settings');

const mongoUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const bookingId = '6a57462dffc68bdf1883593e';
    const booking = await Booking.findById(bookingId);
    const bill = await VendorBill.findOne({ bookingId });

    console.log("Before simulation:");
    console.log("  booking.finalAmount:", booking.finalAmount);
    console.log("  bill.grandTotal:", bill.grandTotal);

    // Run the exact controller logic
    const settings = await Settings.findOne({ type: 'global' });
    const serviceSplitPct = settings?.servicePayoutPercentage ?? 70;
    const partsSplitPct = settings?.partsPayoutPercentage ?? 10;
    const serviceGstPct = settings?.serviceGstPercentage ?? 18;
    const partsGstPct = settings?.partsGstPercentage ?? 18;

    const basePriceRaw = booking.basePrice || 0;
    const isPlanBooking = booking.paymentMethod === 'plan_benefit';
    const originalGST = isPlanBooking ? 0 : (booking.tax > 0 ? parseFloat(booking.tax.toFixed(2)) : parseFloat((basePriceRaw * (serviceGstPct / 100)).toFixed(2)));
    const originalServiceBaseForBill = isPlanBooking ? 0 : (booking.tax > 0 ? basePriceRaw : parseFloat((basePriceRaw - originalGST).toFixed(2)));
    
    const totalServiceBaseForBill = parseFloat((originalServiceBaseForBill + 0).toFixed(2));
    const totalPartsBase = 0;
    const totalGST = parseFloat((originalGST + 0 + 0).toFixed(2));
    const visitingCharges = Number(booking.visitingCharges) || 0;
    const finalTransportCharges = 0;
    
    const instantMarkup = booking.bookingType === 'instant' ? (parseFloat(booking.instantMarkupCharged) || 0) : 0;
    const grandTotal = parseFloat((totalServiceBaseForBill + totalPartsBase + totalGST + visitingCharges + finalTransportCharges + instantMarkup).toFixed(2));

    console.log("Simulated grandTotal:", grandTotal);

    bill.grandTotal = grandTotal;
    await bill.save();

    booking.finalAmount = grandTotal;
    booking.userPayableAmount = grandTotal;
    await booking.save();

    console.log("After simulation save:");
    const updatedBooking = await Booking.findById(bookingId);
    const updatedBill = await VendorBill.findOne({ bookingId });
    console.log("  updatedBooking.finalAmount:", updatedBooking.finalAmount);
    console.log("  updatedBill.grandTotal:", updatedBill.grandTotal);

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
    try { await mongoose.disconnect(); } catch (_) {}
  }
};

run();
