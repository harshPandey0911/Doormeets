const User = require('../../models/User');
const Vendor = require('../../models/Vendor');
const Worker = null; // Worker system removed
const Booking = require('../../models/Booking');
const Withdrawal = require('../../models/Withdrawal');
const Settlement = require('../../models/Settlement');
const Scrap = require('../../models/Scrap');
const { BOOKING_STATUS, PAYMENT_STATUS, VENDOR_STATUS } = require('../../utils/constants');
const {
  getVendorQueryFilter,
  getWorkerQueryFilter,
  getBookingQueryFilter,
  getCityOnlyFilter,
  getAggregateMatchFilter
} = require('../../utils/adminFilterHelper');

/**
 * Get overall dashboard stats
 */
const getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.$lte = end;
      }
    }

    // Revenue date filter (use completedAt for revenue consistency)
    const revenueDateFilter = {};
    if (startDate || endDate) {
      revenueDateFilter.completedAt = {};
      if (startDate) revenueDateFilter.completedAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        revenueDateFilter.completedAt.$lte = end;
      }
    }

    // City Admin Filters
    const cityFilter = await getCityOnlyFilter(req.user);
    const vendorFilter = await getVendorQueryFilter(req.user);
    const workerFilter = await getWorkerQueryFilter(req.user);
    const bookingFilter = await getBookingQueryFilter(req.user);

    // Total counts (filtered by creation date if provided)
    const totalUsers = await User.countDocuments({ isActive: true, ...dateFilter, ...cityFilter });
    const totalVendors = await Vendor.countDocuments({ isActive: true, ...dateFilter, ...vendorFilter });
    const totalWorkers = 0;
    const totalBookings = await Booking.countDocuments({ ...dateFilter, ...bookingFilter });

    // Booking stats
    const pendingBookings = await Booking.countDocuments({
      ...dateFilter,
      ...bookingFilter,
      status: { $nin: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED] }
    });
    const completedBookings = await Booking.countDocuments({
      ...dateFilter,
      ...bookingFilter,
      status: BOOKING_STATUS.COMPLETED
    });
    const cancelledBookings = await Booking.countDocuments({
      ...dateFilter,
      ...bookingFilter,
      status: BOOKING_STATUS.CANCELLED
    });

    const revenueMatch = await getAggregateMatchFilter(req.user, 'booking');

    // Revenue stats
    const revenueResult = await Booking.aggregate([
      {
        $match: {
          ...revenueMatch,
          status: BOOKING_STATUS.COMPLETED,
          paymentStatus: { $in: [PAYMENT_STATUS.SUCCESS, PAYMENT_STATUS.COLLECTED_BY_VENDOR, 'success', 'collected_by_vendor', 'collected_by_worker', 'paid'] },
          ...revenueDateFilter
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalAmount' },
          totalBookings: { $sum: 1 }
        }
      }
    ]);

    const revenue = revenueResult[0] || { totalRevenue: 0, totalBookings: 0 };
    const platformCommission = 0; // DISABLED: Commission removed

    // Vendor approval stats
    const pendingVendors = await Vendor.countDocuments({ approvalStatus: VENDOR_STATUS.PENDING, ...dateFilter, ...vendorFilter });
    const approvedVendors = await Vendor.countDocuments({ approvalStatus: VENDOR_STATUS.APPROVED, ...dateFilter, ...vendorFilter });

    // Withdrawal & Settlement stats (Use generic booking filter since it uses vendorId)
    const financialFilter = await getBookingQueryFilter(req.user);
    const pendingWithdrawals = await Withdrawal.countDocuments({ status: 'pending', ...dateFilter, ...financialFilter });
    const pendingSettlementsCount = await Settlement.countDocuments({ status: 'pending', ...dateFilter, ...financialFilter });
    const pendingScraps = await Scrap.countDocuments({ status: 'pending', ...dateFilter, ...cityFilter });

    // Recent activities (filtered by period) — exclude heavy Base64 image fields
    const recentActivityDocs = await Booking.find({ ...dateFilter, ...bookingFilter })
      .select('-workPhotos -reachedPhotos -serviceImages -reviewImages -potentialVendors -workDoneDetails')
      .populate('userId', 'name phone')
      .populate('vendorId', 'name businessName')
      .populate('serviceId', 'title')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const recentBookings = recentActivityDocs.map(b => ({
      id: b.bookingNumber || b._id,
      _id: b._id,
      status: b.status,
      user: { name: b.userId?.name || 'Customer' },
      serviceType: b.serviceId?.title || b.serviceName,
      price: b.finalAmount || b.basePrice || 0,
      createdAt: b.createdAt,
      acceptedAt: b.acceptedAt,
      assignedAt: b.assignedAt,
      visitedAt: b.visitedAt,
      completedAt: b.completedAt,
      workerPaymentStatus: b.workerPaymentStatus
    }));

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalVendors,
          totalWorkers,
          totalBookings,
          pendingBookings,
          completedBookings,
          cancelledBookings,
          totalRevenue: revenue.totalRevenue,
          platformCommission,
          pendingVendors,
          approvedVendors,
          pendingWithdrawals,
          pendingSettlements: pendingSettlementsCount,
          pendingScraps
        },
        recentBookings
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats. Please try again.'
    });
  }
};

/**
 * Get revenue analytics
 */
const getRevenueAnalytics = async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate } = req.query;

    let groupFormat = '%Y-%m';
    if (period === 'daily') {
      groupFormat = '%Y-%m-%d';
    } else if (period === 'weekly') {
      groupFormat = '%Y-%W';
    }

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.completedAt = {};
      if (startDate) dateFilter.completedAt.$gte = new Date(startDate);
      if (endDate) dateFilter.completedAt.$lte = new Date(endDate);
    }

    const revenueMatch = await getAggregateMatchFilter(req.user, 'booking');

    // Revenue analytics
    const revenueData = await Booking.aggregate([
      {
        $match: {
          ...revenueMatch,
          status: BOOKING_STATUS.COMPLETED,
          paymentStatus: { $in: [PAYMENT_STATUS.SUCCESS, PAYMENT_STATUS.COLLECTED_BY_VENDOR, 'success', 'collected_by_vendor', 'collected_by_worker', 'paid'] },
          ...dateFilter
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupFormat,
              date: '$completedAt'
            }
          },
          revenue: { $sum: '$finalAmount' },
          bookings: { $sum: 1 },
          platformCommission: { $sum: 0 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        period,
        revenueData
      }
    });
  } catch (error) {
    console.error('Get revenue analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue analytics. Please try again.'
    });
  }
};

/**
 * Get booking trends
 */
const getBookingTrends = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const bookingMatch = await getAggregateMatchFilter(req.user, 'booking');

    // Daily booking trends
    const trends = await Booking.aggregate([
      {
        $match: {
          ...bookingMatch,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$status', BOOKING_STATUS.COMPLETED] }, 1, 0]
            }
          },
          cancelled: {
            $sum: {
              $cond: [{ $eq: ['$status', BOOKING_STATUS.CANCELLED] }, 1, 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        days: parseInt(days),
        trends
      }
    });
  } catch (error) {
    console.error('Get booking trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking trends. Please try again.'
    });
  }
};

/**
 * Get user growth metrics
 */
const getUserGrowthMetrics = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const cityMatch = await getAggregateMatchFilter(req.user, 'cityOnly');
    const vendorMatch = await getAggregateMatchFilter(req.user, 'vendor');

    // User growth
    const userGrowth = await User.aggregate([
      {
        $match: {
          ...cityMatch,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Vendor growth
    const vendorGrowth = await Vendor.aggregate([
      {
        $match: {
          ...vendorMatch,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        days: parseInt(days),
        userGrowth,
        vendorGrowth
      }
    });
  } catch (error) {
    console.error('Get user growth metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user growth metrics. Please try again.'
    });
  }
};

module.exports = {
  getDashboardStats,
  getRevenueAnalytics,
  getBookingTrends,
  getUserGrowthMetrics
};

