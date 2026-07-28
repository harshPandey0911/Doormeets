const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });
console.log('MONGODB_URI from .env:', process.env.MONGODB_URI);
