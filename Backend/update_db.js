const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const Booking = require('./models/Booking');
const VendorBill = require('./models/VendorBill');
const Transaction = require('./models/Transaction');

dotenv.config({ path: path.join(__dirname, '.env') });

async function run() {
  await connectDB();
  const bookingId = '6a48f1245ad2c9c511037c1d';
  console.log('Updating booking:', bookingId);

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    console.error('Booking not found!');
    process.exit(1);
  }

  // Update booking fields
  booking.basePrice = 1342;
  booking.tax = 0;
  booking.finalAmount = 1582; // 1342 original + 120 addon + 120 transport
  booking.userPayableAmount = 1582;
  booking.vendorShare = 600; // 500 base + 50 addon + 50 instant share
  booking.adminCommission = 982;
  await booking.save();
  console.log('Updated Booking successfully!');

  // Update associated bill
  const bill = await VendorBill.findOne({ bookingId: booking._id });
  if (bill) {
    bill.originalServiceBase = 1137.29; // 1342 / 1.18
    bill.originalGST = 204.71;
    bill.totalServiceBase = 1238.98; // 1137.29 + 101.69
    bill.totalGST = 223.02; // 204.71 + 18.31
    bill.grandTotal = 1582;
    bill.vendorServiceEarning = 600;
    bill.vendorTotalEarning = 600;
    bill.vendorInstantMarkupEarning = 50;
    bill.companyRevenue = 982;
    bill.transportCharges = 120;
    await bill.save();
    console.log('Updated VendorBill successfully!');
  }

  // Update Transaction entries for this booking
  const txns = await Transaction.find({ bookingId: booking._id });
  let foundPrepaid = false;
  for (const txn of txns) {
    if (txn.type === 'payment') {
      txn.amount = 1342; // Prepaid transaction is exactly 1342
      txn.status = 'completed';
      await txn.save();
      foundPrepaid = true;
    } else if (txn.type === 'earnings_credit') {
      txn.amount = 600;
      await txn.save();
    }
  }

  if (!foundPrepaid) {
    // If no payment transaction, create one
    await Transaction.create({
      userId: booking.userId,
      bookingId: booking._id,
      amount: 1342,
      type: 'payment',
      status: 'completed',
      paymentMethod: 'razorpay',
      description: 'Prepaid amount for booking BK1783165220535ASYAF'
    });
  }

  console.log('Updated Transactions successfully!');

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
