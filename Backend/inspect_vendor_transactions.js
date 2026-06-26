const mongoose = require('mongoose');
require('dotenv').config();

async function checkTransactions() {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    const Transaction = mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));
    const txs = await Transaction.find({ vendorId: { $ne: null } });
    console.log('Total Vendor Transactions found:', txs.length);
    txs.forEach(t => {
      console.log({
        id: t._id,
        desc: t.description,
        type: t.type,
        amount: t.amount,
        createdAt: t.createdAt,
        paymentMethod: t.paymentMethod,
        referenceType: t.referenceType
      });
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkTransactions();
