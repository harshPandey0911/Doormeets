require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Check service 6a549a59a4d568fa49ca2bd1
  const s1 = await mongoose.connection.db.collection('services').findOne(
    { _id: new mongoose.Types.ObjectId('6a549a59a4d568fa49ca2bd1') }
  );
  console.log('=== Service 6a549a59a4d568fa49ca2bd1 ===');
  console.log('Title:', s1?.title);
  console.log('Status:', s1?.status);
  console.log('ServiceType:', s1?.serviceType);
  console.log('Variants:', JSON.stringify(s1?.variants, null, 2));
  console.log('CategoryId:', s1?.categoryId);

  // Check ALL active services with their variant counts
  const allServices = await mongoose.connection.db.collection('services')
    .find({ status: 'active' })
    .project({ title: 1, variants: 1, serviceType: 1, categoryId: 1 })
    .toArray();
  
  console.log('\n=== All active services ===');
  allServices.forEach(s => {
    console.log(`  [${s._id}] ${s.title} | type: ${s.serviceType} | variants: ${(s.variants || []).length}`);
  });

  await mongoose.disconnect();
}
check().catch(console.error);
