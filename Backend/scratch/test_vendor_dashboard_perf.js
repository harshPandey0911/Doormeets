const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const uri = process.env.MONGODB_URI;

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to DB');
    const Vendor = require('../models/Vendor');
    const Booking = require('../models/Booking');
    const VendorBill = require('../models/VendorBill');
    
    // Find an active vendor
    const vendor = await Vendor.findOne().lean();
    if (!vendor) {
      console.log('No vendor found');
      process.exit(0);
    }
    
    const vId = vendor._id;
    console.log(`Running perf test for Vendor ID: ${vId} (${vendor.name})`);
    
    const start = Date.now();
    
    // Simulate getDashboardStats aggregation
    const [bookingData, workersOnlineCount, earningsResult] = await Promise.all([
      Booking.aggregate([
        {
          $facet: {
            counts: [
              {
                $match: {
                  $or: [
                    { vendorId: vId, status: { $ne: 'awaiting_payment' } },
                    {
                      vendorId: null,
                      status: { $in: ['requested', 'searching'] },
                      'potentialVendors.vendorId': vId
                    }
                  ]
                }
              },
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
                }
              }
            ],
            recent: [
              {
                $match: {
                  $or: [
                    { vendorId: vId, status: { $ne: 'awaiting_payment' } },
                    {
                      vendorId: null,
                      status: { $in: ['requested', 'searching'] },
                      'potentialVendors.vendorId': vId
                    }
                  ]
                }
              },
              { $sort: { createdAt: -1 } },
              { $limit: 15 }
            ]
          }
        }
      ]),
      Promise.resolve(0),
      VendorBill.aggregate([
        { $match: { vendorId: vId, status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$vendorTotalEarning' } } }
      ])
    ]);
    
    console.log(`Aggregate query completed in ${Date.now() - start}ms`);
    
    const populateStart = Date.now();
    const recentBookings = bookingData[0].recent || [];
    await Booking.populate(recentBookings, [
      { path: 'userId', select: 'name phone', options: { lean: true } },
      { path: 'workerId', select: 'name', options: { lean: true } },
      {
        path: 'serviceId',
        select: 'title iconUrl categoryId',
        populate: { path: 'categoryId', select: 'title' },
        options: { lean: true }
      }
    ]);
    console.log(`Populate completed in ${Date.now() - populateStart}ms`);
    console.log(`Total dashboard stats load simulation: ${Date.now() - start}ms`);
    
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
