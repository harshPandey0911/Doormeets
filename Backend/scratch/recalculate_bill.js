const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doormeets');
  console.log("Connected to MongoDB");

  const Booking = require('../models/Booking');
  const VendorBill = require('../models/VendorBill');
  const Settings = require('../models/Settings');
  const PricingConfig = require('../models/PricingConfig');

  const bookingId = '6a58b8223c91fe398321d4c1';
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    console.log("Booking not found!");
    await mongoose.connection.close();
    return;
  }

  const settings = await Settings.findOne({ type: 'global' });
  const serviceSplitPct = settings?.servicePayoutPercentage ?? 70;
  const partsSplitPct = settings?.partsPayoutPercentage ?? 10;
  const serviceGstPct = settings?.serviceGstPercentage ?? 18;

  const isPlanBooking = booking.paymentMethod === 'plan_benefit';
  const basePriceRaw = Math.max(0, (booking.basePrice || 0) - (booking.discount || 0));
  const originalGST = isPlanBooking ? 0 : (booking.tax > 0 ? parseFloat(booking.tax.toFixed(2)) : parseFloat((basePriceRaw * (serviceGstPct / 100)).toFixed(2)));
  const originalServiceBaseForBill = isPlanBooking ? 0 : (booking.tax > 0 ? basePriceRaw : parseFloat((basePriceRaw - originalGST).toFixed(2)));
  const visitingCharges = Number(booking.visitingCharges) || 0;

  const totalServiceBaseForBill = originalServiceBaseForBill;
  const totalGST = originalGST;
  const instantMarkup = booking.bookingType === 'instant' ? (parseFloat(booking.instantMarkupCharged) || 0) : 0;
  const grandTotal = parseFloat((totalServiceBaseForBill + totalGST + visitingCharges + instantMarkup).toFixed(2));

  // Pricing config vendor payout
  const pricings = await PricingConfig.find({ serviceId: booking.serviceId });
  let pricing = pricings.find(p => !p.cityId && !p.brandId) || pricings[0];

  let vendorServiceEarning = 0;
  if (pricing) {
    vendorServiceEarning = pricing.vendorPayoutBase !== undefined && pricing.vendorPayoutBase !== null ? pricing.vendorPayoutBase : 0;
  } else {
    vendorServiceEarning = parseFloat((originalServiceBaseForBill * (serviceSplitPct / 100)).toFixed(2));
  }

  let vendorInstantMarkupShare = 0;
  if (booking.bookingType === 'instant') {
    vendorInstantMarkupShare = settings?.instantBookingVendorShare !== undefined ? settings.instantBookingVendorShare : 50;
    vendorServiceEarning = parseFloat((vendorServiceEarning + vendorInstantMarkupShare).toFixed(2));
  }

  const vendorTotalEarning = vendorServiceEarning;
  const companyRevenue = parseFloat((grandTotal - vendorTotalEarning).toFixed(2));

  const allServices = [
    {
      name: booking.serviceName || 'Original Service',
      price: originalServiceBaseForBill,
      gstPercentage: serviceGstPct,
      quantity: 1,
      gstAmount: originalGST,
      total: parseFloat((originalServiceBaseForBill + originalGST).toFixed(2)),
      isOriginal: true
    }
  ];

  let bill = await VendorBill.findOne({ bookingId });
  if (bill) {
    bill.services = allServices;
    bill.originalServiceBase = originalServiceBaseForBill;
    bill.totalServiceBase = totalServiceBaseForBill;
    bill.originalGST = originalGST;
    bill.totalGST = totalGST;
    bill.grandTotal = grandTotal;
    bill.vendorServiceEarning = vendorServiceEarning;
    bill.vendorTotalEarning = vendorTotalEarning;
    bill.vendorInstantMarkupEarning = vendorInstantMarkupShare;
    bill.companyRevenue = companyRevenue;
    await bill.save();
    console.log("Recalculated bill successfully!");
  } else {
    console.log("No bill found for this booking.");
  }

  // Update booking final amount
  booking.finalAmount = grandTotal;
  booking.userPayableAmount = grandTotal;
  await booking.save();
  console.log("Updated booking successfully!");

  await mongoose.connection.close();
}

run().catch(console.error);
