const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const Booking = require('./models/Booking');
const Service = require('./models/Service');
const VendorServiceCatalog = require('./models/VendorServiceCatalog');
const VendorBill = require('./models/VendorBill');
const Settings = require('./models/Settings');

dotenv.config({ path: path.join(__dirname, '.env') });

async function run() {
  await connectDB();
  const bookingId = '6a48f1245ad2c9c511037c1d';
  const booking = await Booking.findById(bookingId);
  const bill = await VendorBill.findOne({ bookingId });
  const settings = await Settings.findOne({ type: 'global' });

  const serviceSplitPct = 70; // fallback default
  const partsSplitPct = 70;
  const serviceGstPct = 18;

  let packageVendorPayout = 0;
  const serviceDoc = await Service.findById(booking.serviceId);
  if (serviceDoc && serviceDoc.packages && serviceDoc.packages.length > 0 && booking.bookedItems && booking.bookedItems.length > 0) {
    const bookedTitle = booking.bookedItems[0].card?.title;
    console.log('Booked Title:', bookedTitle);
    if (bookedTitle) {
      const matchingPackage = serviceDoc.packages.find(pkg => 
        pkg.title === bookedTitle || 
        bookedTitle.includes(pkg.title) || 
        pkg.title.includes(bookedTitle)
      );
      if (matchingPackage) {
        console.log('Found matching package:', matchingPackage.title, 'vendorPayout:', matchingPackage.vendorPayout);
        packageVendorPayout = matchingPackage.vendorPayout;
      }
    }
  }

  let vendorServiceEarning = 0;
  if (packageVendorPayout > 0) {
    vendorServiceEarning = packageVendorPayout;
  }
  console.log('Base vendorServiceEarning:', vendorServiceEarning);

  let vendorInstantMarkupShare = 0;
  if (booking.bookingType === 'instant') {
    vendorInstantMarkupShare = settings?.instantBookingVendorShare !== undefined ? settings.instantBookingVendorShare : 50;
    vendorServiceEarning = parseFloat((vendorServiceEarning + vendorInstantMarkupShare).toFixed(2));
  }
  console.log('After instant markup vendorServiceEarning:', vendorServiceEarning);

  // Extra services
  let extraServicesEarning = 0;
  if (bill && bill.services) {
    // filter original
    const extraServices = bill.services.filter(s => !s.isOriginal);
    for (const item of extraServices) {
      let catalogItem = null;
      if (item.catalogId) {
        catalogItem = await VendorServiceCatalog.findById(item.catalogId);
      }
      const qty = Number(item.quantity) || 1;
      if (catalogItem && catalogItem.vendorPayoutBase !== undefined && catalogItem.vendorPayoutBase > 0) {
        extraServicesEarning += catalogItem.vendorPayoutBase * qty;
        console.log('Extra service catalog vendorPayoutBase:', catalogItem.vendorPayoutBase);
      } else {
        const unitPrice = catalogItem ? catalogItem.price : (Number(item.price) || 0);
        extraServicesEarning += parseFloat(((unitPrice * qty) * (serviceSplitPct / 100)).toFixed(2));
      }
    }
  }
  console.log('extraServicesEarning:', extraServicesEarning);
  vendorServiceEarning = parseFloat((vendorServiceEarning + extraServicesEarning).toFixed(2));
  console.log('Final vendorServiceEarning:', vendorServiceEarning);

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
