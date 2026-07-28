require('mongoose').connect('mongodb+srv://harshpandey09112004_db_user:AKJADD1jCULsc5A7@doormeet.xylkk3b.mongodb.net/civilconnect?retryWrites=true&w=majority').then(async () => {
  try {
    const bookingScheduler = require('./services/bookingScheduler');
    const Booking = require('./models/Booking');
    const booking = await Booking.findOne({status: 'cancelled'}).sort({createdAt: -1});
    if (!booking) {
      console.log('No booking found');
      return;
    }
    console.log('Testing booking id:', booking._id);
    await bookingScheduler.broadcastBookingSearch(booking._id);
    console.log('Broadcast finished!');
  } catch(e) {
    console.error('Error during broadcast:', e);
  } finally {
    process.exit();
  }
});
