require('mongoose').connect('mongodb+srv://harshpandey09112004_db_user:AKJADD1jCULsc5A7@doormeet.xylkk3b.mongodb.net/civilconnect?retryWrites=true&w=majority').then(async () => {
  const { findNearbyVendors } = require('./services/locationService');
  const Vendor = require('./models/Vendor');
  
  // Pick an offline vendor
  const vendor = await Vendor.findOne({ isOnline: false, isActive: true, approvalStatus: 'approved' });
  if (!vendor) {
    console.log('No offline vendor found');
    return process.exit();
  }
  
  console.log(`Testing with offline vendor: ${vendor.name} (${vendor._id})`);
  
  const bookingLocation = vendor.location?.coordinates ? {
    lng: vendor.location.coordinates[0],
    lat: vendor.location.coordinates[1]
  } : { lat: 0, lng: 0 };
  
  const vendorFilters = {
    _id: { $in: [vendor._id.toString()] }
  };
  
  const nearby = await findNearbyVendors(bookingLocation, 10, vendorFilters);
  console.log('Returned nearby vendors length:', nearby.length);
  if (nearby.length > 0) {
    console.log('BUG! Offline vendor was returned!', nearby[0].name);
  } else {
    console.log('Offline vendor correctly filtered out.');
  }
  
  process.exit();
}).catch(console.error);
