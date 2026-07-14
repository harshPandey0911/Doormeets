const Transaction = require('../../models/Transaction');
const Booking = require('../../models/Booking');
const VendorBill = require('../../models/VendorBill');
const User = require('../../models/User');
const Vendor = require('../../models/Vendor');
const Worker = null; // Worker system removed
const PlatformEarning = require('../../models/PlatformEarning');
const { getBookingQueryFilter, getAdminFilterConfig } = require('../../utils/adminFilterHelper');

/**
 * Get all transactions with pagination and filtering
 */
const getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, type, entity } = req.query;

    // --- SPECIAL HANDLING FOR ADMIN REVENUE (Extract from Bookings) ---
    if (entity === 'admin') {
      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Build query for Bookings
      let bookingQuery = {
        status: { $in: ['COMPLETED', 'completed', 'paid', 'PAID'] } // Assuming revenue realized on completion
      };

      const bookingFilter = await getBookingQueryFilter(req.user);
      Object.assign(bookingQuery, bookingFilter);

      // Search filter
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        const [users, vendors] = await Promise.all([
          User.find({ $or: [{ name: searchRegex }, { email: searchRegex }] }).select('_id'),
          Vendor.find({ $or: [{ name: searchRegex }, { email: searchRegex }] }).select('_id'),
        ]);

        bookingQuery.$or = [
          { bookingNumber: searchRegex },
          { userId: { $in: users.map(u => u._id) } },
          { vendorId: { $in: vendors.map(v => v._id) } }
        ];
      }

      // Helper to determine if we should include a specific type
      const shouldInclude = (t) => type === 'all' || type === t;

      // We fetch bookings first
      // Note: Pagination here applies to bookings, not rows, which might result in variable row counts per page
      // This is an acceptable trade-off for virtualizing the data
      const bookings = await Booking.find(bookingQuery)
        .select('bookingNumber createdAt completedAt updatedAt userId vendorId visitingCharges')
        .populate('userId', 'name email phone')
        .populate('vendorId', 'name email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const totalBookings = await Booking.countDocuments(bookingQuery);

      // Transform bookings into virtual transactions
      let virtualTransactions = [];

      bookings.forEach(booking => {
        // We'll look up VendorBill data lazily below
      });

      // Fetch VendorBills for these bookings
      const bookingIds = bookings.map(b => b._id);
      const bills = await VendorBill.find({ bookingId: { $in: bookingIds }, status: 'paid' });
      const billMap = {};
      bills.forEach(b => { billMap[b.bookingId.toString()] = b; });

      bookings.forEach(booking => {
        const bill = billMap[booking._id.toString()];

        // 1. Company Revenue (from VendorBill)
        if (shouldInclude('commission') && bill && bill.companyRevenue > 0) {
          virtualTransactions.push({
            _id: `${booking._id}_comm`,
            referenceId: `REV-${booking.bookingNumber}`,
            bookingId: booking,
            userId: booking.userId,
            vendorId: booking.vendorId,
            type: 'commission',
            amount: bill.companyRevenue,
            status: 'completed',
            paymentMethod: 'system',
            createdAt: bill.paidAt || booking.completedAt || booking.updatedAt || booking.createdAt,
            description: `Company revenue for booking ${booking.bookingNumber}`
          });
        }

        // 2. GST (from VendorBill)
        if (shouldInclude('gst') && bill && bill.totalGST > 0) {
          virtualTransactions.push({
            _id: `${booking._id}_gst`,
            referenceId: `GST-${booking.bookingNumber}`,
            bookingId: booking,
            type: 'gst',
            amount: bill.totalGST,
            status: 'completed',
            paymentMethod: 'system',
            createdAt: bill.paidAt || booking.completedAt || booking.updatedAt || booking.createdAt,
            description: `GST for booking ${booking.bookingNumber}`
          });
        }

        // 3. Convenience Fee (Visiting Charges)
        if (shouldInclude('convenience_fee') && booking.visitingCharges > 0) {
          virtualTransactions.push({
            _id: `${booking._id}_conv`,
            referenceId: `FEE-${booking.bookingNumber}`,
            bookingId: booking,
            type: 'convenience_fee',
            amount: booking.visitingCharges,
            status: 'completed',
            paymentMethod: 'system',
            createdAt: booking.completedAt || booking.updatedAt || booking.createdAt,
            description: `Convenience Fee for booking ${booking.bookingNumber}`
          });
        }
      });

      return res.status(200).json({
        success: true,
        data: virtualTransactions,
        pagination: {
          total: totalBookings, // Note: This is total bookings, not total rows
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalBookings / parseInt(limit))
        }
      });

    }

    // --- STANDARD LOGIC FOR OTHERS (User, Vendor, Worker, All) ---
    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query = {};

    // Apply status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Apply type filter
    if (type && type !== 'all') {
      query.type = type;
    }

    const bookingFilter = await getBookingQueryFilter(req.user);
    Object.assign(query, bookingFilter);

    // Apply entity filter
    if (entity) {
      if (entity === 'user') {
        query.$or = [
          { userId: { $ne: null } },
          { type: 'cash_collected' },
          { type: 'payment' }
        ];
      } else if (entity === 'vendor') {
        query.vendorId = { $ne: null };
      } else if (entity === 'worker') {
        query.workerId = { $ne: null };
      }
    }

    // Apply search filter (Transaction ID, Order ID, or Customer/Vendor/Worker Name/Email)
    if (search) {
      const searchRegex = new RegExp(search, 'i');

      // We need to find matching users, vendors, workers and bookings first
      const [users, vendors, workers, bookings] = await Promise.all([
        User.find({ $or: [{ name: searchRegex }, { email: searchRegex }] }).select('_id'),
        Vendor.find({ $or: [{ name: searchRegex }, { email: searchRegex }] }).select('_id'),
        Worker.find({ $or: [{ name: searchRegex }, { email: searchRegex }] }).select('_id'),
        Booking.find({ bookingNumber: searchRegex }).select('_id')
      ]);

      const userIds = users.map(u => u._id);
      const vendorIds = vendors.map(v => v._id);
      const workerIds = workers.map(w => w._id);
      const bookingIds = bookings.map(b => b._id);

      // Find bookings where the USER matches the search (for indirect transactions like cash_collected)
      const userBookingIds = await Booking.find({ userId: { $in: userIds } }).select('_id');
      const allBookingIds = [...bookingIds, ...userBookingIds.map(b => b._id)];

      query.$or = [
        { referenceId: searchRegex },
        { userId: { $in: userIds } },
        { vendorId: { $in: vendorIds } },
        { workerId: { $in: workerIds } },
        { bookingId: { $in: allBookingIds } }
      ];

      // If it looks like an ObjectId, search by ID too
      if (search.match(/^[0-9a-fA-F]{24}$/)) {
        query.$or.push({ _id: search });
      }
    }

    const transactions = await Transaction.find(query)
      .populate('userId', 'name email phone')
      .populate('vendorId', 'name email phone')
      .populate('workerId', 'name email phone')
      .populate({
        path: 'bookingId',
        select: 'bookingNumber userId',
        populate: {
          path: 'userId',
          select: 'name email phone'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  }
};

/**
 * Get transaction statistics for dashboard
 */
const getTransactionStats = async (req, res) => {
  try {
    const { entity } = req.query;

    // --- SPECIAL HANDLING FOR ADMIN REVENUE (Extract from Bookings) ---
    if (entity === 'admin') {
      const config = await getAdminFilterConfig(req.user);
      if (config.isCityAdmin) {
        return res.status(200).json({
          success: true,
          data: { totalRevenue: 0, totalCommission: 0, totalGST: 0, totalVendorEarnings: 0, netRevenue: 0 }
        });
      }

      const stats = await PlatformEarning.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalRevenue' },
            totalCommission: { $sum: '$platformCommission' },
            totalGST: { $sum: '$totalGST' },
            totalVendorEarnings: { $sum: '$vendorEarnings' }
          }
        }
      ]);

      const data = stats[0] || { totalRevenue: 0, totalCommission: 0, totalGST: 0, totalVendorEarnings: 0 };

      return res.status(200).json({
        success: true,
        data: {
          totalRevenue: data.totalRevenue,
          totalCommission: data.totalCommission,
          totalGST: data.totalGST,
          totalVendorEarnings: data.totalVendorEarnings,
          netRevenue: data.totalCommission
        }
      });
    }

    // --- STANDARD LOGIC FOR OTHERS ---
    let matchQuery = {
      status: 'completed',
      type: { $in: ['credit', 'debit', 'refund', 'commission', 'cash_collected', 'payment'] }
    };

    const bookingFilter = await getBookingQueryFilter(req.user);
    Object.assign(matchQuery, bookingFilter);

    // Apply entity filter
    if (entity) {
      if (entity === 'user') matchQuery.userId = { $ne: null };
      if (entity === 'vendor') matchQuery.vendorId = { $ne: null };
      if (entity === 'worker') matchQuery.workerId = { $ne: null };
    }

    // We count 'completed' transactions for revenue
    const revenueStats = await Transaction.aggregate([
      {
        $match: matchQuery
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $cond: [{ $in: ['$type', ['credit', 'commission', 'cash_collected', 'payment', 'platform_fee', 'convenience_fee', 'gst', 'penalty', 'tds_deduction']] }, '$amount', 0]
            }
          },
          totalRefunds: {
            $sum: {
              $cond: [{ $in: ['$type', ['refund', 'withdrawal']] }, '$amount', 0] // Withdrawal is not exactly refund but money out
            }
          }
        }
      }
    ]);

    const stats = revenueStats[0] || { totalRevenue: 0, totalRefunds: 0 };
    const netRevenue = stats.totalRevenue - stats.totalRefunds;

    // Calculate dynamic tax totals
    let totalGST = 0;
    let totalCGST = 0;
    let totalSGST = 0;

    try {
      const bookingQuery = {
        status: { $in: ['COMPLETED', 'completed', 'paid', 'PAID'] }
      };
      const bookingFilter = await getBookingQueryFilter(req.user);
      Object.assign(bookingQuery, bookingFilter);

      const bookingsForTaxes = await Booking.find(bookingQuery)
        .select('finalAmount basePrice serviceId cityId brandId vendorId')
        .populate('vendorId', 'level');

      const serviceIds = bookingsForTaxes.map(b => b.serviceId).filter(Boolean);
      const PricingConfig = require('../../models/PricingConfig');
      const pricings = await PricingConfig.find({ serviceId: { $in: serviceIds } });

      const pricingMap = {};
      pricings.forEach(p => {
        const sId = p.serviceId.toString();
        if (!pricingMap[sId]) pricingMap[sId] = [];
        pricingMap[sId].push(p);
      });

      bookingsForTaxes.forEach(booking => {
        const sId = booking.serviceId ? booking.serviceId.toString() : '';
        const list = pricingMap[sId] || [];
        let pricing = null;
        if (list.length > 0) {
          if (booking.cityId) {
            pricing = list.find(p => p.cityId && String(p.cityId) === String(booking.cityId));
          }
          if (!pricing && booking.brandId) {
            pricing = list.find(p => p.brandId && String(p.brandId) === String(booking.brandId));
          }
          if (!pricing) {
            pricing = list.find(p => !p.cityId && !p.brandId) || list[0];
          }
        }

        const cp = Number(booking.finalAmount || booking.basePrice || 0);
        const vPayoutBase = pricing ? Number(pricing.vendorPayoutBase || 0) : 0;

        const gstPct = pricing ? Number(pricing.gstPercentage ?? 18) : 18;
        const vSgstPct = pricing ? Number(pricing.vendorSgstPercentage ?? 2.5) : 2.5;
        const vCgstPct = pricing ? Number(pricing.vendorCgstPercentage ?? 2.5) : 2.5;

        const adminGrossShare = Math.max(0, cp - vPayoutBase);
        const platformGstAmount = adminGrossShare * (gstPct / 100);
        const vendorSgstAmount = vPayoutBase * (vSgstPct / 100);
        const vendorCgstAmount = vPayoutBase * (vCgstPct / 100);

        totalGST += (platformGstAmount + vendorSgstAmount + vendorCgstAmount);
        totalCGST += vendorCgstAmount;
        totalSGST += vendorSgstAmount;
      });
    } catch (taxErr) {
      console.error('Error calculating dynamic tax stats:', taxErr);
    }

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: stats.totalRevenue,
        totalRefunds: stats.totalRefunds,
        netRevenue,
        totalGST,
        totalCGST,
        totalSGST
      }
    });

  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction statistics'
    });
  }
};

const getEarningsBreakdown = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, taxType, vendorId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 1. Build Query for Bookings
    let bookingQuery = {
      status: { $in: ['COMPLETED', 'completed', 'paid', 'PAID'] }
    };

    if (vendorId && vendorId !== 'all') {
      bookingQuery.vendorId = vendorId;
    }

    const bookingFilter = await getBookingQueryFilter(req.user);
    Object.assign(bookingQuery, bookingFilter);

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      const [users, vendors] = await Promise.all([
        User.find({ $or: [{ name: searchRegex }, { email: searchRegex }] }).select('_id'),
        Vendor.find({ $or: [{ name: searchRegex }, { email: searchRegex }, { businessName: searchRegex }] }).select('_id')
      ]);
      bookingQuery.$or = [
        { bookingNumber: searchRegex },
        { userId: { $in: users.map(u => u._id) } },
        { vendorId: { $in: vendors.map(v => v._id) } }
      ];
    }

    const bookings = await Booking.find(bookingQuery)
      .select('bookingNumber createdAt userId vendorId finalAmount basePrice serviceId cityId brandId completedAt updatedAt serviceName serviceCategory')
      .populate('userId', 'name email phone')
      .populate('vendorId', 'name email phone businessName level')
      .sort({ createdAt: -1 });

    // 2. Fetch PricingConfigs in batch to avoid N+1 queries
    const serviceIds = bookings.map(b => b.serviceId).filter(Boolean);
    const PricingConfig = require('../../models/PricingConfig');
    const pricings = await PricingConfig.find({ serviceId: { $in: serviceIds } });
    
    // Map serviceId -> pricingConfigs
    const pricingMap = {};
    pricings.forEach(p => {
      const sId = p.serviceId.toString();
      if (!pricingMap[sId]) pricingMap[sId] = [];
      pricingMap[sId].push(p);
    });

    const breakdownData = [];

    bookings.forEach(booking => {
      const sId = booking.serviceId ? booking.serviceId.toString() : '';
      const list = pricingMap[sId] || [];
      let pricing = null;
      if (list.length > 0) {
        if (booking.cityId) {
          pricing = list.find(p => p.cityId && String(p.cityId) === String(booking.cityId));
        }
        if (!pricing && booking.brandId) {
          pricing = list.find(p => p.brandId && String(p.brandId) === String(booking.brandId));
        }
        if (!pricing) {
          pricing = list.find(p => !p.cityId && !p.brandId) || list[0];
        }
      }

      // Calculations
      const cp = Number(booking.finalAmount || booking.basePrice || 0);
      const vPayoutBase = pricing ? Number(pricing.vendorPayoutBase || 0) : 0;
      
      const gstPct = pricing ? Number(pricing.gstPercentage ?? 18) : 18;
      const vSgstPct = pricing ? Number(pricing.vendorSgstPercentage ?? 2.5) : 2.5;
      const vCgstPct = pricing ? Number(pricing.vendorCgstPercentage ?? 2.5) : 2.5;
      const pCommPct = pricing ? Number(pricing.platformCommission ?? 25) : 25;
      
      // Determine level commission based on vendor level (L1/L2/L3)
      let lCommPct = 0;
      if (booking.vendorId) {
        const level = booking.vendorId.level || 'L1';
        if (level === 'L1') lCommPct = pricing ? Number(pricing.l1Commission ?? 0) : 0;
        else if (level === 'L2') lCommPct = pricing ? Number(pricing.l2Commission ?? 0) : 0;
        else if (level === 'L3') lCommPct = pricing ? Number(pricing.l3Commission ?? 0) : 0;
      }

      // Math
      const adminGrossShare = Math.max(0, cp - vPayoutBase);
      const platformGstAmount = adminGrossShare * (gstPct / 100);
      const adminTaxableEarning = adminGrossShare - platformGstAmount;

      const vendorSgstAmount = vPayoutBase * (vSgstPct / 100);
      const vendorCgstAmount = vPayoutBase * (vCgstPct / 100);
      const remainingVendorBase = Math.max(0, vPayoutBase - vendorSgstAmount - vendorCgstAmount);
      
      const platformCommissionAmount = remainingVendorBase * (pCommPct / 100);
      const levelCommissionAmount = remainingVendorBase * (lCommPct / 100);
      const totalCommissionEarned = platformCommissionAmount + levelCommissionAmount;
      const netVendorPayout = remainingVendorBase - totalCommissionEarned;

      const totalGstCalculated = platformGstAmount + vendorSgstAmount + vendorCgstAmount;

      const row = {
        _id: booking._id,
        bookingId: booking._id,
        bookingNumber: booking.bookingNumber,
        createdAt: booking.completedAt || booking.updatedAt || booking.createdAt,
        user: booking.userId,
        vendor: booking.vendorId,
        serviceName: booking.serviceName || 'General Service',
        serviceCategory: booking.serviceCategory || 'Service',
        customerPay: cp,
        vendorPayoutBase: vPayoutBase,
        adminGrossShare,
        adminTaxableEarning,
        
        // Taxes
        platformGstAmount,
        vendorSgstAmount,
        vendorCgstAmount,
        totalGstCalculated,
        
        // Commissions
        platformCommissionAmount,
        levelCommissionAmount,
        totalCommissionEarned,
        netVendorPayout,
        vendorLevel: booking.vendorId ? (booking.vendorId.level || 'L1') : 'L1'
      };

      // Filter by taxType if specified
      if (taxType && taxType !== 'all') {
        if (taxType === 'gst' && platformGstAmount <= 0) return;
        if (taxType === 'cgst' && vendorCgstAmount <= 0) return;
        if (taxType === 'sgst' && vendorSgstAmount <= 0) return;
      }

      breakdownData.push(row);
    });

    const total = breakdownData.length;
    const paginatedData = breakdownData.slice(skip, skip + parseInt(limit));

    res.status(200).json({
      success: true,
      data: paginatedData,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching earnings breakdown:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch earnings breakdown data' });
  }
};

module.exports = {
  getAllTransactions,
  getTransactionStats,
  getEarningsBreakdown
};
