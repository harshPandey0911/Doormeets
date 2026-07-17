const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  const Booking = require('../models/Booking');
  const booking = await Booking.findOne({ bookingNumber: 'BK1784201397589VBK6F' }).lean();

  if (booking) {
    const isPlanBooking = booking.paymentMethod === 'plan_benefit';
    const basePriceRaw = Math.max(0, (booking.basePrice || 0) - (booking.discount || 0));
    const serviceGstPct = 18;
    const originalGST = isPlanBooking ? 0 : (booking.tax > 0 ? parseFloat(booking.tax.toFixed(2)) : parseFloat((basePriceRaw * (serviceGstPct / 100)).toFixed(2)));
    const originalServiceBaseForBill = isPlanBooking ? 0 : (booking.tax > 0 ? basePriceRaw : parseFloat((basePriceRaw - originalGST).toFixed(2)));
    
    let vendorServiceBase = 0;
    let totalPartsBase = 0;
    let vendorServiceGST = 0;
    let partsGST = 0;
    const visitingCharges = Number(booking.visitingCharges) || 0;
    const transportCharges = 0;

    const totalServiceBaseForBill = parseFloat((originalServiceBaseForBill + vendorServiceBase).toFixed(2));
    const totalGST = parseFloat((originalGST + vendorServiceGST + partsGST).toFixed(2));
    const finalTransportCharges = Number(transportCharges) || 0;
    const instantMarkup = booking.bookingType === 'instant' ? (parseFloat(booking.instantMarkupCharged) || 0) : 0;
    const grandTotal = parseFloat((totalServiceBaseForBill + totalPartsBase + totalGST + visitingCharges + finalTransportCharges + instantMarkup).toFixed(2));

    console.log({
      bookingType: booking.bookingType,
      instantMarkupCharged: booking.instantMarkupCharged,
      instantMarkup,
      totalServiceBaseForBill,
      totalGST,
      grandTotal,
      originalGST,
      basePriceRaw,
      originalServiceBaseForBill,
      bookingTax: booking.tax
    });
  }

  await mongoose.connection.close();
}
run().catch(console.error);
