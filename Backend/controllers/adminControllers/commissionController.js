const Booking = require('../../models/Booking');
const mongoose = require('mongoose');

/**
 * Get Admin Collection and Commission Summary
 */
exports.getAdminCollectionSummary = async (req, res) => {
  try {
    const summary = await Booking.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: null,
          cashCollection: {
            $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$totalAmount', 0] }
          },
          onlineCollection: {
            $sum: { $cond: [{ $eq: ['$paymentMethod', 'online'] }, '$totalAmount', 0] }
          },
          pendingCommission: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$paymentMethod', 'cash'] },
                    { $eq: ['$commissionStatus', 'pending'] }
                  ]
                },
                '$adminCommission',
                0
              ]
            }
          },
          receivedCommission: {
            $sum: {
              $cond: [
                { $eq: ['$commissionStatus', 'received'] },
                '$adminCommission',
                0
              ]
            }
          }
        }
      }
    ]);

    const data = summary[0] || {
      cashCollection: 0,
      onlineCollection: 0,
      pendingCommission: 0,
      receivedCommission: 0
    };

    res.status(200).json({
      success: true,
      data: {
        cashCollection: data.cashCollection,
        onlineCollection: data.onlineCollection,
        totalCollection: data.cashCollection + data.onlineCollection,
        pendingCommission: data.pendingCommission,
        receivedCommission: data.receivedCommission
      }
    });
  } catch (error) {
    console.error('getAdminCollectionSummary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Vendor Collection and Earnings Summary
 */
exports.getVendorCollectionSummary = async (req, res) => {
  try {
    const vendorId = req.params.vendorId || req.user.id;
    if (!vendorId) {
      return res.status(400).json({ success: false, message: 'Vendor ID required' });
    }

    const summary = await Booking.aggregate([
      {
        $match: {
          vendorId: new mongoose.Types.ObjectId(vendorId),
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          cashCollected: {
            $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$totalAmount', 0] }
          },
          onlineOrders: {
            $sum: { $cond: [{ $eq: ['$paymentMethod', 'online'] }, '$totalAmount', 0] }
          },
          adminDue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$paymentMethod', 'cash'] },
                    { $eq: ['$commissionStatus', 'pending'] }
                  ]
                },
                '$adminCommission',
                0
              ]
            }
          },
          netEarnings: {
            $sum: '$vendorShare'
          }
        }
      }
    ]);

    const data = summary[0] || {
      cashCollected: 0,
      onlineOrders: 0,
      adminDue: 0,
      netEarnings: 0
    };

    res.status(200).json({
      success: true,
      data: {
        cashCollected: data.cashCollected,
        onlineOrders: data.onlineOrders,
        totalBusiness: data.cashCollected + data.onlineOrders,
        adminDue: data.adminDue,
        netEarnings: data.netEarnings
      }
    });
  } catch (error) {
    console.error('getVendorCollectionSummary error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Global Commission and Settlement Report
 */
exports.getCommissionReport = async (req, res) => {
  try {
    const { page = 1, limit = 20, paymentMethod, commissionStatus, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = { status: 'completed' };
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (commissionStatus) query.commissionStatus = commissionStatus;
    if (search) {
      query.$or = [
        { bookingNumber: new RegExp(search, 'i') },
        { serviceName: new RegExp(search, 'i') }
      ];
    }

    const bookings = await Booking.find(query)
      .populate('userId', 'name phone')
      .populate('vendorId', 'name businessName phone')
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('getCommissionReport error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Pending Vendor Dues List (grouped by vendor)
 */
exports.getPendingVendorDues = async (req, res) => {
  try {
    const dues = await Booking.aggregate([
      {
        $match: {
          status: 'completed',
          paymentMethod: 'cash',
          commissionStatus: 'pending',
          vendorId: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$vendorId',
          totalBusiness: { $sum: '$totalAmount' },
          adminDue: { $sum: '$adminCommission' },
          netEarnings: { $sum: '$vendorShare' },
          bookingCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'vendors',
          localField: '_id',
          foreignField: '_id',
          as: 'vendorInfo'
        }
      },
      { $unwind: '$vendorInfo' },
      {
        $project: {
          _id: 1,
          totalBusiness: 1,
          adminDue: 1,
          netEarnings: 1,
          bookingCount: 1,
          vendorName: '$vendorInfo.name',
          businessName: '$vendorInfo.businessName',
          phone: '$vendorInfo.phone',
          email: '$vendorInfo.email'
        }
      },
      { $sort: { adminDue: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: dues
    });
  } catch (error) {
    console.error('getPendingVendorDues error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
