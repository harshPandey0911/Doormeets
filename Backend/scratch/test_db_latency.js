const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const uri = process.env.MONGODB_URI;

console.log('Connecting to database...');
const start = Date.now();

mongoose.connect(uri)
  .then(async () => {
    console.log(`Connected successfully in ${Date.now() - start}ms`);
    
    const pingStart = Date.now();
    await mongoose.connection.db.admin().ping();
    console.log(`Ping to database took ${Date.now() - pingStart}ms`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection failed:', err);
    process.exit(1);
  });
