const mongoose = require('mongoose');
require('dotenv').config();

async function checkTransactions() {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to', uri);
    await mongoose.connect(uri);
    console.log('Connected!');

    const Transaction = mongoose.model('Transaction', new mongoose.Schema({}, { strict: false }));
    const txs = await Transaction.find({ type: 'credit' }).limit(30);
    console.log('Credit Transactions found in DB:', txs.length);
    txs.forEach(t => {
      console.log({
        id: t._id,
        desc: t.description,
        type: t.type,
        amount: t.amount,
        createdAt: t.createdAt,
        referenceType: t.referenceType,
        metadata: t.metadata
      });
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkTransactions();
