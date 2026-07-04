const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const Booking = require('./models/Booking');
const VendorBill = require('./models/VendorBill');
const Transaction = require('./models/Transaction');
const Invoice = require('./models/Invoice');

dotenv.config({ path: path.join(__dirname, '.env') });

async function run() {
  await connectDB();
  const bookingId = '6a48f1245ad2c9c511037c1d';
  console.log('Fixing all database entries for booking:', bookingId);

  // 1. Update Booking
  const booking = await Booking.findById(bookingId);
  if (booking) {
    booking.vendorShare = 600;
    booking.finalAmount = 1582;
    booking.userPayableAmount = 1582;
    await booking.save();
    console.log('Updated Booking!');
  }

  // 2. Update Bill
  const bill = await VendorBill.findOne({ bookingId });
  if (bill) {
    bill.vendorServiceEarning = 600;
    bill.vendorTotalEarning = 600;
    bill.grandTotal = 1582;
    bill.status = 'paid';
    await bill.save();
    console.log('Updated VendorBill!');
  }

  // 3. Update Invoices
  const vendorInvoice = await Invoice.findOne({ bookingId, type: 'vendor_service' });
  if (vendorInvoice) {
    vendorInvoice.baseAmount = 600;
    vendorInvoice.totalAmount = 600; // or 630 with GST, but let's keep it 600
    await vendorInvoice.save();
    console.log('Updated Vendor Invoice!');
  }

  // 4. Update Transactions
  const txns = await Transaction.find({ bookingId });
  for (const txn of txns) {
    if (txn.type === 'earnings_credit') {
      txn.amount = 600;
      await txn.save();
      console.log('Updated Earnings Credit Transaction!');
    }
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
