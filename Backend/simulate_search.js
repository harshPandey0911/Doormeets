require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const { findNearbyVendors } = require('./services/locationService');
  
  // Simulated booking parameters
  const centerLocation = { lat: null, lng: null }; // From user booking
  const filters = {
    _id: { $in: ['6a55e7dedabee9f033cfe937'] }, // Fake ID just to pass validation if needed, but in real it's an array of vendor IDs
    checkCashLimit: false,
    city: 'Indore',
    service: 'Electrician' // Title
  };

  // Wait, in userBookingController.js, the filters are:
  /*
  const vendorFilters = {
    _id: { $in: qualifiedVendorIds },
    checkCashLimit: paymentMethod === 'cash',
    city: address.city
  };
  */
  // So let's get the qualified vendor IDs first
  const Vendor = require('./models/Vendor');
  const searchArray = [new RegExp('^Electrician$', 'i'), '6a55e7dedabee9f033cfe937'];
  
  const vendorQuery = {
    isActive: true,
    categories: { $in: searchArray }
  };
  
  const matchingVendors = await Vendor.find(vendorQuery).select('_id').lean();
  const qualifiedVendorIds = Array.from(new Set(matchingVendors.map(v => v._id.toString())));
  
  console.log(`Qualified Vendors Count: ${qualifiedVendorIds.length}`);
  
  if(qualifiedVendorIds.length > 0) {
    const vendorFilters = {
      _id: { $in: qualifiedVendorIds },
      checkCashLimit: false,
      city: 'Indore'
    };
    
    console.log("Calling findNearbyVendors with:", vendorFilters);
    const nearbyVendors = await findNearbyVendors(centerLocation, 10, vendorFilters);
    console.log(`Nearby Vendors Found: ${nearbyVendors.length}`);
    console.log(nearbyVendors.map(v => v.name));
  }
  
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
