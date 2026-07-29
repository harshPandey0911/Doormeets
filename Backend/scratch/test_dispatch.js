const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const runTest = async () => {
  try {
    await mongoose.connect('mongodb+srv://harshpandey09112004_db_user:AKJADD1jCULsc5A7@doormeet.xylkk3b.mongodb.net/civilconnect?retryWrites=true&w=majority');
    console.log('Connected to DB');

    const { findNearbyVendors } = require('../services/locationService');
    
    // Coordinates outside any zones (e.g. 0, 0)
    console.log('Testing coordinate (0, 0) outside all zones:');
    const resultOutside = await findNearbyVendors({ lat: 0, lng: 0 }, 10, {});
    console.log('Vendors matched outside zones:', resultOutside);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

runTest();
