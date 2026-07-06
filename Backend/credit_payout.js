const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();

  const vendorId = new ObjectId('6a13fdd2381a994f1815879a');
  const bookingId = new ObjectId('6a4b8d1dfc683f637db710b5');
  const amount = 40;

  // 1. Credit wallet
  await db.collection('vendors').updateOne(
    { _id: vendorId },
    { $inc: { 'wallet.earnings': amount } }
  );
  console.log('Credited ₹40 to vendor wallet earnings.');

  // 2. Create earnings_credit transaction
  await db.collection('transactions').insertOne({
    vendorId,
    bookingId,
    amount,
    type: 'earnings_credit',
    status: 'completed',
    paymentMethod: 'system',
    description: `Earnings ₹40.00 credited for booking #BK1783336221227OJ1O4`,
    metadata: {
      type: 'earnings_increase',
      vendorShare: amount
    },
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log('Created earnings_credit transaction.');

  await client.close();
}

run();
