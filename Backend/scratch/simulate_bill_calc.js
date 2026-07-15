const mongoose = require('mongoose');
const Booking = require('../models/Booking');

const mongoUri = "mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets";

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    const booking = await Booking.findById('6a57462dffc68bdf1883593e');
    
    console.log("Loaded booking ID:", booking._id);
    console.log("booking.bookingType:", booking.bookingType);
    console.log("booking.instantMarkupCharged:", booking.instantMarkupCharged);

    const isPlanBooking = booking.paymentMethod === 'plan_benefit';
    const basePriceRaw = booking.basePrice || 0;
    const originalGST = isPlanBooking ? 0 : (booking.tax > 0 ? parseFloat(booking.tax.toFixed(2)) : parseFloat((basePriceRaw * (18 / 100)).toFixed(2)));
    const originalServiceBaseForBill = isPlanBooking ? 0 : (booking.tax > 0 ? basePriceRaw : parseFloat((basePriceRaw - originalGST).toFixed(2)));
    const totalServiceBaseForBill = parseFloat((originalServiceBaseForBill + 0).toFixed(2));
    const totalPartsBase = 0;
    const totalGST = parseFloat((originalGST + 0 + 0).toFixed(2));
    const visitingCharges = Number(booking.visitingCharges) || 0;
    const finalTransportCharges = 0;
    const instantMarkup = booking.bookingType === 'instant' ? (parseFloat(booking.instantMarkupCharged) || 0) : 0;
    const grandTotal = parseFloat((totalServiceBaseForBill + totalPartsBase + totalGST + visitingCharges + finalTransportCharges + instantMarkup).toFixed(2));

    console.log("Intermediate values:");
    console.log("  isPlanBooking:", isPlanBooking);
    console.log("  basePriceRaw:", basePriceRaw);
    console.log("  originalGST:", originalGST);
    console.log("  originalServiceBaseForBill:", originalServiceBaseForBill);
    console.log("  totalServiceBaseForBill:", totalServiceBaseForBill);
    console.log("  totalPartsBase:", totalPartsBase);
    console.log("  totalGST:", totalGST);
    console.log("  visitingCharges:", visitingCharges);
    console.log("  finalTransportCharges:", finalTransportCharges);
    console.log("  instantMarkup:", instantMarkup);
    console.log("  grandTotal:", grandTotal);

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err);
    try { await mongoose.disconnect(); } catch (_) {}
  }
};

run();
