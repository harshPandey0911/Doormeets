const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

async function run() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db();
  
  const vendor = await db.collection('vendors').findOne({ _id: new ObjectId('6a13fdd2381a994f1815879a') });
  
  // Let's mimic getWallet controller:
  const dues = vendor.wallet?.dues || 0;
  const earnings = vendor.wallet?.earnings || 0;
  const totalWithdrawn = vendor.wallet?.totalWithdrawn || 0;
  
  console.log('dues:', dues);
  console.log('earnings:', earnings);
  console.log('totalWithdrawn:', totalWithdrawn);
  
  // Let's check if there are pending settlements
  const pendingSettlements = await db.collection('settlements').countDocuments({
    vendorId: vendor._id,
    status: 'pending'
  });
  console.log('pendingSettlements:', pendingSettlements);
  
  await client.close();
}

run();
