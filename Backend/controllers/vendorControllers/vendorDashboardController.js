const Booking = require('../../models/Booking');
const VendorBill = require('../../models/VendorBill');
const VendorDashboardContent = require('../../models/VendorDashboardContent');
const Worker = null; // Worker model removed
const Service = require('../../models/UserService');
const Settings = require('../../models/Settings');
const { BOOKING_STATUS, PAYMENT_STATUS, WORKER_STATUS } = require('../../utils/constants');

/**
 * Get vendor dashboard stats
 */
const getDashboardStats = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const mongoose = require('mongoose');
    const vId = new mongoose.Types.ObjectId(vendorId);

    const isWorkerRole = req.userRole === 'WORKER' || req.user?.role === 'WORKER';

    let counts = { total: 0, completed: 0, inProgress: 0, pending: 0 };
    let recentBookings = [];
    let rating = 5;
    let vendorEarnings = 0;
    let workersOnline = 0;
    let globalSettings = {};
    let vendorProfile = {};

    if (isWorkerRole) {
      const Worker = require('../../models/Worker');
      const workerDoc = await Worker.findById(vendorId);
      
      const countsResult = await Booking.aggregate([
        { $match: { workerId: vId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', BOOKING_STATUS.COMPLETED] }, 1, 0] } },
            inProgress: {
              $sum: {
                $cond: [
                  {
                    $in: ['$status', [
                      BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.ASSIGNED, BOOKING_STATUS.CONFIRMED,
                      BOOKING_STATUS.JOURNEY_STARTED, BOOKING_STATUS.VISITED, BOOKING_STATUS.IN_PROGRESS,
                      BOOKING_STATUS.WORK_DONE, 'started', 'reached', 'on_the_way'
                    ]]
                  }, 1, 0
                ]
              }
            }
          }
        }
      ]);
      counts = countsResult[0] || { total: 0, completed: 0, inProgress: 0, pending: 0 };
      
      recentBookings = await Booking.find({ workerId: vId })
        .sort({ createdAt: -1 })
        .limit(15)
        .populate('userId', 'name phone')
        .populate('serviceId', 'title iconUrl categoryId');

      vendorProfile = {
        isOnline: workerDoc?.status === 'ONLINE' || workerDoc?.status === 'active',
        isSubscriptionActive: true,
        performanceScore: 100,
        level: 3,
        currentLevel: 'L3',
        commissionRate: 0
      };

      const Settings = require('../../models/Settings');
      globalSettings = await Settings.findOne({ type: 'global' }).lean();
    } else {
      // ── Get categories from req.user (from auth middleware) ──
      const vendorCategories = [
        ...(Array.isArray(req.user.categories) ? req.user.categories : []),
        ...(Array.isArray(req.user.service) ? req.user.service : [])
      ];

      // ─── SINGLE PARALLEL BLAST (Highly Optimized Simple Finds) ───────────────
      const [assignedBookings, searchingBookings, earningsResult] = await Promise.all([
        Booking.find({ vendorId: vId, status: { $ne: BOOKING_STATUS.AWAITING_PAYMENT } })
          .select('_id bookingNumber status rating finalAmount vendorEarnings address userId workerId serviceId serviceCategory brandName brandIcon categoryIcon createdAt expiresAt potentialVendors')
          .lean(),
        Booking.find({
          vendorId: null,
          status: { $in: [BOOKING_STATUS.REQUESTED, BOOKING_STATUS.SEARCHING] },
          'potentialVendors.vendorId': vId
        })
          .select('_id bookingNumber status rating finalAmount vendorEarnings address userId workerId serviceId serviceCategory brandName brandIcon categoryIcon createdAt expiresAt potentialVendors')
          .lean(),
        VendorBill.aggregate([
          { $match: { vendorId: vId, status: 'paid' } },
          { $group: { _id: null, total: { $sum: '$vendorTotalEarning' } } }
        ])
      ]);

      // Combine and process in-memory
      const allBookings = [...assignedBookings, ...searchingBookings];

      let total = allBookings.length;
      let completed = 0;
      let inProgress = 0;
      let pending = 0;

      const inProgressStatuses = [
        BOOKING_STATUS.ACCEPTED, BOOKING_STATUS.ASSIGNED, BOOKING_STATUS.CONFIRMED,
        BOOKING_STATUS.JOURNEY_STARTED, BOOKING_STATUS.VISITED, BOOKING_STATUS.IN_PROGRESS,
        BOOKING_STATUS.WORK_DONE, 'started', 'reached', 'on_the_way'
      ];

      allBookings.forEach(bk => {
        const statusLower = bk.status;
        if (statusLower === BOOKING_STATUS.COMPLETED) {
          completed++;
        } else if (inProgressStatuses.includes(statusLower)) {
          inProgress++;
        }

        if (bk.vendorId) {
          if (statusLower === BOOKING_STATUS.REQUESTED) {
            pending++;
          }
        } else {
          if ([BOOKING_STATUS.REQUESTED, BOOKING_STATUS.SEARCHING].includes(statusLower)) {
            pending++;
          }
        }
      });

      counts = { total, completed, inProgress, pending };

      // Calculate average rating
      const ratedBookings = assignedBookings.filter(bk => bk.rating !== null && bk.rating !== undefined);
      rating = ratedBookings.length > 0
        ? ratedBookings.reduce((sum, bk) => sum + bk.rating, 0) / ratedBookings.length
        : (req.user.rating || 0);

      vendorEarnings = earningsResult[0]?.total || 0;
      workersOnline = 0;

      // Sort and limit recent bookings in-memory
      recentBookings = [...allBookings]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 15);

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

      const Settings = require('../../models/Settings');
      const Vendor = require('../../models/Vendor');
      
      const [globalSettingsResult, vendorProfileResult] = await Promise.all([
        Settings.findOne({ type: 'global' }).lean(),
        Vendor.findById(vendorId).select('performanceScore level commissionRate isOnline isSubscriptionActive currentLevel').lean()
      ]);
      
      globalSettings = globalSettingsResult;
      vendorProfile = vendorProfileResult;
    }

    res.status(200).json({
      success: true,
      data: {
        config: {
          maxSearchTime: globalSettings?.maxSearchTime || 5,
          waveDuration: globalSettings?.waveDuration || 60
        },
        stats: {
          totalBookings: counts.total,
          pendingBookings: counts.pending || 0,
          completedBookings: counts.completed,
          inProgressBookings: counts.inProgress,
          totalRevenue: vendorEarnings,
          vendorEarnings: vendorEarnings,
          workersOnline,
          rating: parseFloat(rating.toFixed(1)),
          isOnline: vendorProfile?.isOnline ?? req.user.isOnline,
          isSubscriptionActive: vendorProfile?.isSubscriptionActive ?? req.user.isSubscriptionActive,
          performanceScore: vendorProfile?.performanceScore ?? 100,
          level: vendorProfile?.level ?? 3,
          currentLevel: vendorProfile?.currentLevel || 'L3',
          commissionRate: vendorProfile?.commissionRate ?? 15,
          commissionRates: { level1: 10, level2: 15, level3: 20 },
          platformFeeRates: { level1: 0.5, level2: 1.0, level3: 2.0 }
        },
        recentBookings
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
};

/**
 * Get revenue analytics
 */
const getRevenueAnalytics = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const { period = 'monthly' } = req.query; // daily, weekly, monthly

    let groupFormat = '%Y-%m-%d';
    if (period === 'weekly') {
      groupFormat = '%Y-%W'; // Year-Week
    } else if (period === 'monthly') {
      groupFormat = '%Y-%m'; // Year-Month
    }

    // Revenue analytics from VendorBill
    const revenueData = await VendorBill.aggregate([
      {
        $match: {
          vendorId: vendorId,
          status: 'paid'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: groupFormat,
              date: '$paidAt'
            }
          },
          revenue: { $sum: '$grandTotal' },
          earnings: { $sum: '$vendorTotalEarning' },
          bookings: { $sum: 1 }
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
 * Get worker performance
 */
const getWorkerPerformance = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Get worker performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch worker performance. Please try again.'
    });
  }
};

/**
 * Get service performance metrics
 */
const getServicePerformance = async (req, res) => {
  try {
    const vendorId = req.user.id;

    // Get service stats
    const serviceStats = await Booking.aggregate([
      {
        $match: {
          vendorId: vendorId
        }
      },
      {
        $group: {
          _id: '$serviceId',
          totalBookings: { $sum: 1 },
          completedBookings: {
            $sum: {
              $cond: [{ $eq: ['$status', BOOKING_STATUS.COMPLETED] }, 1, 0]
            }
          },
          totalRevenue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', BOOKING_STATUS.COMPLETED] },
                    { $eq: ['$paymentStatus', PAYMENT_STATUS.SUCCESS] }
                  ]
                },
                '$finalAmount',
                0
              ]
            }
          },
          averageRating: { $avg: '$rating' }
        }
      }
    ]);

    // Populate service details
    const serviceIds = serviceStats.map(s => s._id);
    const services = await Service.find({ _id: { $in: serviceIds } })
      .select('title iconUrl slug');

    const performance = serviceStats.map(stat => {
      const service = services.find(s => s._id.toString() === stat._id.toString());
      return {
        serviceId: stat._id,
        serviceName: service?.title || 'Unknown Service',
        iconUrl: service?.iconUrl,
        totalBookings: stat.totalBookings,
        completedBookings: stat.completedBookings,
        totalRevenue: stat.totalRevenue,
        averageRating: stat.averageRating ? stat.averageRating.toFixed(2) : null,
        completionRate: stat.totalBookings
          ? ((stat.completedBookings / stat.totalBookings) * 100).toFixed(2)
          : 0
      };
    });

    res.status(200).json({
      success: true,
      data: performance
    });
  } catch (error) {
    console.error('Get service performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service performance. Please try again.'
    });
  }
};

/**
 * Get active dashboard banners/media for vendor app
 */
const getActiveBanners = async (req, res) => {
  try {
    const doc = await VendorDashboardContent.findOne();
    if (!doc) {
      return res.status(200).json({ success: true, data: [] });
    }
    // Filter active banners
    const active = (doc.banners || []).filter(b => b.isActive !== false);
    res.status(200).json({ success: true, data: active });
  } catch (error) {
    console.error('Get active banners error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard banners' });
  }
};

module.exports = {
  getDashboardStats,
  getRevenueAnalytics,
  getWorkerPerformance,
  getServicePerformance,
  getActiveBanners
};


