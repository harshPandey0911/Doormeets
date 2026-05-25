const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

async function test() {
  await mongoose.connect('mongodb+srv://harshpandey09112004_db_user:harshpandey09112004_db_user@doormeets.4a1n75n.mongodb.net/civilconnect?appName=Doormeets');
  
  const Admin = mongoose.model('Admin', new mongoose.Schema({ name: String, role: String }));
  const harsh = await Admin.findOne({ name: 'Harsh Pandey' });
  console.log('Harsh:', harsh);

  // generate token
  const token = jwt.sign({ userId: harsh._id, role: 'ADMIN' }, 'your-sut-key-change-this-in-production', { expiresIn: '1h' }); 
  console.log('Token:', token);

  const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

  const urls = [
    'http://localhost:5000/api/admin/vendor-parts',
    'http://localhost:5000/api/admin/categories',
    'http://localhost:5000/api/admin/vendor-category-requests/count'
  ];

  for (const url of urls) {
    console.log('Fetching', url);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const text = await res.text();
    console.log(res.status, text.substring(0, 100));
  }

  process.exit(0);
}

test().catch(console.error);
