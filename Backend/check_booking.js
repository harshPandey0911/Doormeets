const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Booking = require('./models/Booking');
const Vendor = require('./models/Vendor');
const Service = require('./models/Service');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const bookingNum = 'BK17854779438419AZWT';
  const booking = await Booking.findOne({ bookingNumber: bookingNum });
  if (booking) {
    console.log('=== BOOKING ===');
    console.log('serviceId:', booking.serviceId);
    
    const service = await Service.findById(booking.serviceId);
    if (service) {
      console.log('=== SERVICE ===');
      console.log('Title:', service.title);
      console.log('subCategoryId:', service.subCategoryId);
      console.log('brandId:', service.brandId);
    }
  }

  const raju = await Vendor.findById('6a649d2988f4d30a80178813');
  if (raju) {
    console.log('=== RAJU (VENDOR) ===');
    console.log('subCategories:', raju.subCategories);
    console.log('brands:', raju.brands);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
