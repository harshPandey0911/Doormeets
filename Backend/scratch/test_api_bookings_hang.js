const axios = require('axios');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to DB');
    const Vendor = require('../models/Vendor');
    
    // Find an active approved vendor
    const vendor = await Vendor.findOne({ approvalStatus: 'approved', isDeleted: { $ne: true } });
    if (!vendor) {
      console.log('No approved vendor found in DB to test');
      process.exit(0);
    }
    
    console.log('Testing with Vendor:', vendor.phone, 'ID:', vendor._id);
    
    // Generate an access token for this vendor using tokenService
    const { generateAccessToken } = require('../utils/tokenService');
    const token = generateAccessToken({ userId: vendor._id, role: 'vendor' });
    
    console.log('Generated token:', token.substring(0, 20) + '...');
    
    console.log('Sending request to http://localhost:5000/api/vendors/bookings...');
    const startTime = Date.now();
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/vendors/bookings', {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 15000
      });
      console.log('API Response status:', response.status);
      console.log('API Response success:', response.data.success);
      console.log('API Response bookings count:', response.data.data?.length);
      console.log(`Request completed in ${Date.now() - startTime}ms`);
    } catch (err) {
      console.error('API Error Stack:', err.stack || err);
      if (err.response) {
        console.error('Response Status:', err.response.status);
        console.error('Response Data:', err.response.data);
      }
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
