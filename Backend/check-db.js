require('mongoose').connect('mongodb+srv://harshpandey09112004_db_user:AKJADD1jCULsc5A7@doormeet.xylkk3b.mongodb.net/civilconnect?retryWrites=true&w=majority').then(async () => { 
  const Booking = require('./models/Booking'); 
  const count = await Booking.countDocuments({ status: 'searching' }); 
  console.log('Searching bookings:', count); 
  process.exit(); 
}).catch(console.error);
