const Booking = require('../../models/Booking');
const Vendor = require('../../models/Vendor');
const Worker = require('../../models/Worker');
const User = require('../../models/User');
const Service = require('../../models/UserService');
const { BOOKING_STATUS, PAYMENT_STATUS, VENDOR_STATUS } = require('../../utils/constants');

/**
 * Get Booking Report Data
 */
exports.getBookingReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};
    if (startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // Status distribution
    const statusDistribution = await Booking.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Service category distribution
    const serviceDistribution = await Booking.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: 'userservices',
          localField: 'serviceId',
          foreignField: '_id',
          as: 'serviceObj'
        }
      },
      {
        $lookup: {
          from: 'subcategories',
          localField: 'subCategoryId',
          foreignField: '_id',
          as: 'subCatObj'
        }
      },
      {
        $group: {
          _id: {
            $ifNull: [
              { $arrayElemAt: ['$serviceObj.title', 0] },
              { $arrayElemAt: ['$subCatObj.title', 0] },
              '$serviceName',
              '$serviceCategory',
              'Other Services'
            ]
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Monthly trends
    const monthlyTrends = await Booking.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', BOOKING_STATUS.COMPLETED] }, 1, 0] }
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ['$status', BOOKING_STATUS.CANCELLED] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        statusDistribution,
        serviceDistribution,
        monthlyTrends
      }
    });
  } catch (error) {
    console.error('Booking report error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch booking report' });
  }
};

/**
 * Get Vendor Report Data
 */
exports.getVendorReport = async (req, res) => {
  try {
    const { getVendorQueryFilter, getBookingQueryFilter } = require('../../utils/adminFilterHelper');
    const vendorFilter = await getVendorQueryFilter(req.user);
    const bookingFilter = await getBookingQueryFilter(req.user);

    // Top vendors by revenue
    const topVendors = await Booking.aggregate([
      { $match: { status: BOOKING_STATUS.COMPLETED, ...bookingFilter } },
      {
        $group: {
          _id: '$vendorId',
          totalRevenue: { $sum: '$finalAmount' },
          bookingsCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'vendors',
          localField: '_id',
          foreignField: '_id',
          as: 'vendor'
        }
      },
      { $unwind: '$vendor' },
      {
        $project: {
          businessName: '$vendor.businessName',
          name: '$vendor.name',
          totalRevenue: 1,
          bookingsCount: 1
        }
      }
    ]);

    // Total vendors count
    const totalVendors = await Vendor.countDocuments(vendorFilter);
    const totalBookings = await Booking.countDocuments(bookingFilter);

    // Monthly registration trend
    const monthlyTrend = await Vendor.aggregate([
      { $match: vendorFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 6 }
    ]);

    // Status distribution
    const statusDistribution = await Vendor.aggregate([
      { $match: vendorFilter },
      { $group: { _id: '$approvalStatus', count: { $sum: 1 } } }
    ]);

    // Category distribution
    const categoryDistribution = await Vendor.aggregate([
      { $match: vendorFilter },
      { $group: { _id: '$profession', count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalVendors,
        totalBookings,
        topVendors,
        statusDistribution,
        categoryDistribution,
        monthlyTrend
      }
    });
  } catch (error) {
    console.error('Vendor report error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch vendor report' });
  }
};

/**
 * Get Worker Report Data
 */
exports.getWorkerReport = async (req, res) => {
  try {
    const { type } = req.query;

    const workerQueryMatch = { status: BOOKING_STATUS.COMPLETED, workerId: { $ne: null } };
    const availabilityQueryMatch = {};

    if (type === 'labour') {
      availabilityQueryMatch.vendorId = null;
    } else if (type === 'worker') {
      availabilityQueryMatch.vendorId = { $ne: null };
    }

    // CITY ADMIN FILTER: Restrict to assigned cities
    const City = require('../../models/City');
    let cityMatch = {};
    if (req.user && (req.user.role === 'CITY_ADMIN' || req.userRole === 'CITY_ADMIN')) {
      if (req.user.assignedCities && req.user.assignedCities.length > 0) {
        const cities = await City.find({ _id: { $in: req.user.assignedCities } });
        const cityNames = cities.map(c => new RegExp(`^${c.name}$`, 'i'));
        cityMatch = { 'worker.address.city': { $in: cityNames } };
        availabilityQueryMatch['address.city'] = { $in: cityNames };
      }
    }

    // Top workers by jobs completed formatted as totalBookings / fullName
    const topWorkers = await Booking.aggregate([
      { $match: workerQueryMatch },
      {
        $group: {
          _id: '$workerId',
          completedJobs: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      },
      {
        $lookup: {
          from: 'workers',
          localField: '_id',
          foreignField: '_id',
          as: 'worker'
        }
      },
      { $unwind: '$worker' },
      {
        $match: {
          ...cityMatch,
          ...(type === 'labour' ? { 'worker.vendorId': null } : type === 'worker' ? { 'worker.vendorId': { $ne: null } } : {})
        }
      },
      { $sort: { completedJobs: -1 } },
      { $limit: 10 },
      {
        $project: {
          fullName: '$worker.name',
          totalBookings: '$completedJobs',
          phone: '$worker.phone',
          avgRating: 1
        }
      }
    ]);

    // Worker approval status distribution
    const statusDistribution = await Worker.aggregate([
      { $match: availabilityQueryMatch },
      { $group: { _id: { $ifNull: ['$approvalStatus', 'approved'] }, count: { $sum: 1 } } }
    ]);

    // Average rating distribution
    const ratingDistribution = await Booking.aggregate([
      { $match: { workerId: { $ne: null }, rating: { $exists: true, $ne: null } } },
      {
        $lookup: {
          from: 'workers',
          localField: 'workerId',
          foreignField: '_id',
          as: 'worker'
        }
      },
      { $unwind: '$worker' },
      { $match: cityMatch },
      { $group: { _id: { $floor: '$rating' }, count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    // Fetch all workers and their booking aggregates
    const allWorkersData = await Worker.find(availabilityQueryMatch)
      .select('name phone vendorId status approvalStatus')
      .populate('vendorId', 'name businessName phone email')
      .lean();

    const workerIds = allWorkersData.map(w => w._id);

    const bookingStats = await Booking.aggregate([
      { $match: { workerId: { $in: workerIds }, status: BOOKING_STATUS.COMPLETED } },
      {
        $group: {
          _id: '$workerId',
          totalBookings: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      }
    ]);

    const statsMap = new Map(bookingStats.map(s => [s._id.toString(), s]));

    const allWorkersList = allWorkersData.map(worker => {
      const stats = statsMap.get(worker._id.toString()) || { totalBookings: 0, avgRating: 0 };
      const isActiveStatus = worker.status !== 'inactive' && worker.status !== 'suspended';
      const vendorObj = typeof worker.vendorId === 'object' ? worker.vendorId : null;
      return {
        _id: worker._id,
        name: worker.name,
        phone: worker.phone,
        association: vendorObj ? (vendorObj.name || vendorObj.businessName || 'Vendor-Linked') : 'Independent',
        vendorName: vendorObj ? (vendorObj.name || vendorObj.businessName) : null,
        vendorBusinessName: vendorObj ? vendorObj.businessName : null,
        totalBookings: stats.totalBookings,
        avgRating: stats.avgRating ? parseFloat(stats.avgRating.toFixed(2)) : 0,
        status: isActiveStatus ? 'Active' : 'Blocked'
      };
    });

    // Sort by bookings first, then name
    allWorkersList.sort((a, b) => b.totalBookings - a.totalBookings || a.name.localeCompare(b.name));

    res.status(200).json({
      success: true,
      data: {
        topWorkers,
        statusDistribution,
        ratingDistribution,
        allWorkers: allWorkersList
      }
    });
  } catch (error) {
    console.error('Worker report error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch worker report' });
  }
};

const { getCityOnlyFilter } = require('../../utils/adminFilterHelper');

/**
 * Get Customer/User Report Data
 */
exports.getCustomerReport = async (req, res) => {
  try {
    const cityFilter = await getCityOnlyFilter(req.user);
    const totalUsers = await User.countDocuments(cityFilter);
    const totalBookings = await Booking.countDocuments();

    // User verification status distribution
    const verificationStatus = await User.aggregate([
      { $match: cityFilter },
      {
        $group: {
          _id: {
            $cond: [
              { $and: ["$isPhoneVerified", "$isEmailVerified"] },
              "Fully Verified",
              {
                $cond: [
                  { $or: ["$isPhoneVerified", "$isEmailVerified"] },
                  "Partially Verified",
                  "Unverified"
                ]
              }
            ]
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Top users by bookings
    const topUsers = await Booking.aggregate([
      { $group: { _id: '$userId', bookingCount: { $sum: 1 }, totalSpent: { $sum: '$finalAmount' } } },
      { $sort: { bookingCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },
      { $match: { 'user.address.city': cityFilter['address.city'] || { $exists: true } } },
      {
        $project: {
          name: { $ifNull: ['$user.name', 'Deleted User'] },
          bookingCount: 1,
          totalSpent: 1
        }
      }
    ]);

    // Monthly registration trend
    const monthlyTrend = await User.aggregate([
      { $match: cityFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 6 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalBookings,
        verificationStatus,
        topUsers,
        monthlyTrend
      }
    });
  } catch (error) {
    console.error('Customer report error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch customer report' });
  }
};

/**
 * Get Revenue Report Data
 */
exports.getRevenueReport = async (req, res) => {
  try {
    const { period = 'monthly' } = req.query;
    let groupFormat = '%Y-%m';
    if (period === 'daily') groupFormat = '%Y-%m-%d';

    const revenueTrends = await Booking.aggregate([
      { $match: { status: BOOKING_STATUS.COMPLETED, paymentStatus: PAYMENT_STATUS.SUCCESS } },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: '$completedAt' } },
          revenue: { $sum: '$finalAmount' },
          commission: { $sum: { $multiply: ['$finalAmount', 0.2] } } // 20% commission
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Revenue by service
    const revenueByService = await Booking.aggregate([
      { $match: { status: BOOKING_STATUS.COMPLETED } },
      {
        $lookup: {
          from: 'userservices',
          localField: 'serviceId',
          foreignField: '_id',
          as: 'serviceObj'
        }
      },
      {
        $lookup: {
          from: 'subcategories',
          localField: 'subCategoryId',
          foreignField: '_id',
          as: 'subCatObj'
        }
      },
      {
        $group: {
          _id: {
            $ifNull: [
              { $arrayElemAt: ['$serviceObj.title', 0] },
              { $arrayElemAt: ['$subCatObj.title', 0] },
              '$serviceName',
              '$serviceCategory',
              'Other Services'
            ]
          },
          revenue: { $sum: { $ifNull: ['$finalAmount', '$totalAmount', 0] } }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        revenueTrends,
        revenueByService
      }
    });
  } catch (error) {
    console.error('Revenue report error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch revenue report' });
  }
};
