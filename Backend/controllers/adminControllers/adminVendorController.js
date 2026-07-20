const Vendor = require('../../models/Vendor');
const Booking = require('../../models/Booking');
const VendorBill = require('../../models/VendorBill');
const City = require('../../models/City');
const { validationResult } = require('express-validator');
const { VENDOR_STATUS, BOOKING_STATUS, PAYMENT_STATUS } = require('../../utils/constants');
const { createNotification } = require('../notificationControllers/notificationController');
const { getVendorQueryFilter, getBookingQueryFilter } = require('../../utils/adminFilterHelper');

/**
 * Get all vendors with filters and pagination
 */
const getAllVendors = async (req, res) => {
  try {
    const {
      search,
      approvalStatus,
      isActive,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = { isDeleted: { $ne: true } };

    // CITY ADMIN FILTER
    const adminFilter = await getVendorQueryFilter(req.user);
    Object.assign(query, adminFilter);

    if (approvalStatus) {
      query.approvalStatus = approvalStatus;
    }
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Search by name, email, phone, or business name
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get vendors
    const vendors = await Vendor.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Vendor.countDocuments(query);

    res.status(200).json({
      success: true,
      data: vendors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendors. Please try again.'
    });
  }
};

/**
 * Get vendor details
 */
const getVendorDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findById(id).select('-password');

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Security check: Can admin access this vendor?
    const adminFilter = await getVendorQueryFilter(req.user);
    if (adminFilter._id && adminFilter._id.$in) {
      if (!adminFilter._id.$in.map(v => v.toString()).includes(vendor._id.toString())) {
        return res.status(403).json({ success: false, message: 'Access denied to this vendor.' });
      }
    }

    // Get vendor stats from VendorBill (single source of truth)
    const totalBookings = await Booking.countDocuments({ vendorId: vendor._id });
    const completedBookings = await Booking.countDocuments({ vendorId: vendor._id, status: BOOKING_STATUS.COMPLETED });

    const earningsResult = await VendorBill.aggregate([
      {
        $match: {
          vendorId: vendor._id,
          status: 'paid'
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$vendorTotalEarning' },
          totalRevenue: { $sum: '$grandTotal' }
        }
      }
    ]);

    const bookingStats = [{
      totalBookings,
      completedBookings,
      totalEarnings: earningsResult[0]?.totalEarnings || 0,
      totalRevenue: earningsResult[0]?.totalRevenue || 0
    }];

    res.status(200).json({
      success: true,
      data: {
        vendor,
        stats: bookingStats[0] || {
          totalBookings: 0,
          completedBookings: 0,
          totalEarnings: 0
        }
      }
    });
  } catch (error) {
    console.error('Get vendor details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor details. Please try again.'
    });
  }
};

/**
 * Approve vendor registration
 */
const approveVendor = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findById(id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    const wasApproved = vendor.approvalStatus === VENDOR_STATUS.APPROVED;

    vendor.approvalStatus = VENDOR_STATUS.APPROVED;
    vendor.approvalDate = new Date();

    // Process Shop Owner Referral Rewards if not already approved
    if (!wasApproved && vendor.referredByShopOwner) {
      try {
        const Settings = require('../../models/Settings');
        const ShopOwner = require('../../models/ShopOwner');
        const Transaction = require('../../models/Transaction');

        const settings = await Settings.findOne({ type: 'global' });
        const shopOwnerReward = settings?.shopReferralRewardShopOwner || 100;
        const vendorReward = settings?.shopReferralRewardVendor || 50;

        // Credit Shop Owner
        const shopOwner = await ShopOwner.findById(vendor.referredByShopOwner);
        if (shopOwner) {
          const balanceBefore = shopOwner.wallet?.balance || 0;
          shopOwner.wallet = shopOwner.wallet || { balance: 0 };
          shopOwner.wallet.balance += shopOwnerReward;
          await shopOwner.save();

          // Create transaction for shop owner
          await Transaction.create({
            shopOwnerId: shopOwner._id,
            type: 'shop_referral_earned',
            amount: shopOwnerReward,
            status: 'completed',
            paymentMethod: 'system',
            description: `Referral Reward: You referred vendor ${vendor.name} (${vendor.phone}) who has been approved!`,
            balanceBefore,
            balanceAfter: balanceBefore + shopOwnerReward
          });
        }

        // Credit Vendor
        const vendorBalanceBefore = vendor.wallet?.credits || 0;
        vendor.wallet = vendor.wallet || { credits: 0, dues: 0 };
        vendor.wallet.credits += vendorReward / 10;

        // Create transaction for vendor
        await Transaction.create({
          vendorId: vendor._id,
          type: 'earnings_credit',
          amount: vendorReward,
          status: 'completed',
          paymentMethod: 'system',
          description: `Welcome Reward: Onboarded via Shop Owner referral.`,
          balanceBefore: vendorBalanceBefore,
          balanceAfter: vendorBalanceBefore + vendorReward
        });
      } catch (err) {
        console.error('[Shop Referral] Error distributing rewards on vendor approval:', err);
      }
    }

    await vendor.save();

    // Send notification to vendor
    await createNotification({
      vendorId: vendor._id,
      type: 'vendor_approved',
      title: 'Vendor Registration Approved',
      message: 'Your vendor registration has been approved. You can now start accepting bookings.',
      relatedId: vendor._id,
      relatedType: 'vendor'
    });

    res.status(200).json({
      success: true,
      message: 'Vendor approved successfully',
      data: vendor
    });
  } catch (error) {
    console.error('Approve vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve vendor. Please try again.'
    });
  }
};

/**
 * Reject vendor registration
 */
const rejectVendor = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { reason } = req.body;

    const vendor = await Vendor.findById(id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    vendor.approvalStatus = VENDOR_STATUS.REJECTED;
    vendor.rejectedReason = reason || 'Registration rejected by admin';
    await vendor.save();

    // Send notification to vendor
    await createNotification({
      vendorId: vendor._id,
      type: 'vendor_rejected',
      title: 'Vendor Registration Rejected',
      message: `Your vendor registration has been rejected. Reason: ${vendor.rejectedReason}`,
      relatedId: vendor._id,
      relatedType: 'vendor'
    });

    res.status(200).json({
      success: true,
      message: 'Vendor rejected successfully',
      data: vendor
    });
  } catch (error) {
    console.error('Reject vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject vendor. Please try again.'
    });
  }
};

/**
 * Suspend vendor
 */
const suspendVendor = async (req, res) => {
  try {
    const { id } = req.params;

    const vendor = await Vendor.findById(id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    vendor.approvalStatus = VENDOR_STATUS.SUSPENDED;
    vendor.isActive = false;
    await vendor.save();

    res.status(200).json({
      success: true,
      message: 'Vendor suspended successfully',
      data: vendor
    });
  } catch (error) {
    console.error('Suspend vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend vendor. Please try again.'
    });
  }
};

/**
 * View vendor bookings
 */
const getVendorBookings = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    // Build query
    const query = { vendorId: id };
    if (status) {
      query.status = status;
    }

    // Security Check: Can admin access this vendor?
    const vendorFilter = await getVendorQueryFilter(req.user);
    if (vendorFilter._id && vendorFilter._id.$in) {
      if (!vendorFilter._id.$in.map(v => v.toString()).includes(id)) {
        return res.status(403).json({ success: false, message: 'Access denied to this vendor.' });
      }
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get bookings
    const bookings = await Booking.find(query)
      .select('-workPhotos -reachedPhotos -serviceImages -reviewImages -potentialVendors -workDoneDetails')
      .populate('userId', 'name phone')
      .populate('serviceId', 'title iconUrl')
      .populate('workerId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

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
    console.error('Get vendor bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor bookings. Please try again.'
    });
  }
};

/**
 * View vendor earnings
 */
const getVendorEarnings = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Get earnings from VendorBill (single source of truth)
    const billQuery = {
      vendorId: require('mongoose').Types.ObjectId(id),
      status: 'paid'
    };

    // Security Check: Can admin access this vendor?
    const vendorFilter = await getVendorQueryFilter(req.user);
    if (vendorFilter._id && vendorFilter._id.$in) {
      if (!vendorFilter._id.$in.map(v => v.toString()).includes(id)) {
        return res.status(403).json({ success: false, message: 'Access denied to this vendor.' });
      }
    }

    if (startDate || endDate) {
      billQuery.paidAt = {};
      if (startDate) billQuery.paidAt.$gte = new Date(startDate);
      if (endDate) billQuery.paidAt.$lte = new Date(endDate);
    }

    const earnings = await VendorBill.aggregate([
      { $match: billQuery },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$grandTotal' },
          vendorEarnings: { $sum: '$vendorTotalEarning' },
          platformCommission: { $sum: '$companyRevenue' },
          totalBookings: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: earnings[0] || {
        totalRevenue: 0,
        vendorEarnings: 0,
        platformCommission: 0,
        totalBookings: 0
      }
    });
  } catch (error) {
    console.error('Get vendor earnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor earnings. Please try again.'
    });
  }
};

/**
 * Get all vendor bookings (global)
 */
const getAllVendorBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;

    const query = { vendorId: { $exists: true, $ne: null } };
    if (status) {
      query.status = status;
    }

    // CITY ADMIN FILTER
    const bookingFilter = await getBookingQueryFilter(req.user);
    Object.assign(query, bookingFilter);

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // If search is provided, we need to find vendors by business name or name first
    if (search) {
      const vendors = await Vendor.find({
        $or: [
          { businessName: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');

      const vendorIds = vendors.map(v => v._id);
      query.vendorId = { $in: vendorIds };
    }

    const bookings = await Booking.find(query)
      .select('-workPhotos -reachedPhotos -serviceImages -reviewImages -potentialVendors -workDoneDetails')
      .populate('vendorId', 'name businessName phone profileImage')
      .populate('userId', 'name phone')
      .populate('serviceId', 'title iconUrl')
      .populate('workerId', 'name phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

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
    console.error('Get all vendor bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch all vendor bookings.'
    });
  }
};

/**
 * Get vendor payments summary
 */
const getVendorPaymentsSummary = async (req, res) => {
  try {
    // Return vendors with their wallet balances and earnings
    const query = { 'wallet.balance': { $exists: true }, isDeleted: { $ne: true } };

    // CITY ADMIN FILTER
    const adminFilter = await getVendorQueryFilter(req.user);
    Object.assign(query, adminFilter);

    const vendors = await Vendor.find(query)
      .select('name businessName phone wallet email approvalStatus')
      .sort({ 'wallet.balance': -1 });

    res.status(200).json({
      success: true,
      data: vendors
    });
  } catch (error) {
    console.error('Get vendor payments summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor payments summary.'
    });
  }
};

/**
 * Toggle vendor active status (approve/disable login)
 */
const toggleVendorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body; // Expecting { isActive: true/false }

    const vendor = await Vendor.findById(id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    vendor.isActive = isActive;
    await vendor.save();

    // Log the action (optional but recommended)
    // console.log(`Vendor ${vendor._id} status changed to ${isActive}`);

    res.status(200).json({
      success: true,
      message: `Vendor ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: vendor
    });
  } catch (error) {
    console.error('Toggle vendor status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vendor status'
    });
  }
};

/**
 * Delete vendor
 */
const deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = req.admin || req.user;
    const isSuperAdmin = admin.role === 'SUPER_ADMIN' || admin.role === 'super_admin';

    const vendor = await Vendor.findById(id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    if (!isSuperAdmin) {
      // Create a deletion request for Super Admin
      const CityAdminRequest = require('../../models/CityAdminRequest');
      
      // Check if a request already exists
      const existingRequest = await CityAdminRequest.findOne({
        requestType: 'delete_vendor',
        'proposedData.vendorId': id,
        status: 'pending'
      });

      if (existingRequest) {
        return res.status(400).json({
          success: false,
          message: 'A deletion request for this vendor is already pending approval.'
        });
      }

      await CityAdminRequest.create({
        requestedBy: admin._id,
        requestedByName: admin.name,
        cityId: vendor.city || null,
        cityName: '', // We could fetch city name, but keeping it simple
        requestType: 'delete_vendor',
        proposedData: { 
          vendorId: id,
          businessName: vendor.businessName 
        },
        notes: `Requested deletion of vendor: ${vendor.businessName}`
      });

      return res.status(200).json({
        success: true,
        message: 'Vendor deletion proposal submitted for Super Admin approval.'
      });
    }

    // Super Admin deletes directly
    await Vendor.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Vendor deleted successfully'
    });
  } catch (error) {
    console.error('Delete vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete vendor'
    });
  }
};

/**
 * Update vendor (categories, status, and level)
 */
const updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive, service, subCategories, brands, currentLevel } = req.body;

    const vendor = await Vendor.findById(id);

    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    if (isActive !== undefined) {
      vendor.isActive = isActive;
    }
    
    if (service !== undefined) {
      vendor.service = Array.isArray(service) ? service : [service];
    }

    if (subCategories !== undefined) {
      vendor.subCategories = Array.isArray(subCategories) ? subCategories : [subCategories];
    }

    if (brands !== undefined) {
      vendor.brands = Array.isArray(brands) ? brands : [brands];
    }

    if (currentLevel !== undefined) {
      vendor.currentLevel = currentLevel;
      if (currentLevel === 'L1') {
        vendor.level = 1;
      } else if (currentLevel === 'L2') {
        vendor.level = 2;
      } else {
        vendor.level = 3;
      }
    }

    await vendor.save();

    res.status(200).json({
      success: true,
      message: 'Vendor updated successfully',
      data: vendor
    });
  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vendor'
    });
  }
};

/**
 * Get vendor incentive statistics (rating and bookings count) in date range
 */
const getVendorIncentiveStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Start Date and End Date are required'
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const Review = require('../../models/Review');

    const vendors = await Vendor.find({ approvalStatus: VENDOR_STATUS.APPROVED, isActive: true })
      .select('name businessName phone wallet.credits wallet.dues')
      .lean();

    const stats = await Promise.all(vendors.map(async (vendor) => {
      // Completed Booking count in date range
      const bookingsCount = await Booking.countDocuments({
        vendorId: vendor._id,
        status: 'completed',
        createdAt: { $gte: start, $lte: end }
      });

      // Average Rating in date range
      const reviewResult = await Review.aggregate([
        {
          $match: {
            vendorId: vendor._id,
            createdAt: { $gte: start, $lte: end },
            status: 'active'
          }
        },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' }
          }
        }
      ]);

      const averageRating = reviewResult[0]?.avgRating ? parseFloat(reviewResult[0].avgRating.toFixed(2)) : 0;

      return {
        id: vendor._id,
        name: vendor.name,
        businessName: vendor.businessName,
        phone: vendor.phone,
        earnings: (vendor.wallet?.credits * 10) || 0,
        dues: vendor.wallet?.dues || 0,
        bookingsCount,
        averageRating
      };
    }));

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get vendor incentive stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vendor incentive stats'
    });
  }
};

/**
 * Get incentive transaction history
 */
const getIncentiveHistory = async (req, res) => {
  try {
    const Transaction = require('../../models/Transaction');
    
    // Find credit transactions containing "Incentive" or marked as admin adjustment
    const transactions = await Transaction.find({
      type: 'credit',
      vendorId: { $ne: null },
      $or: [
        { referenceType: 'admin_adjustment' },
        { referenceType: { $exists: false } },
        { referenceType: null },
        { description: /incentive/i }
      ]
    })
      .populate('vendorId', 'name businessName phone')
      .sort({ createdAt: -1 });

    const formattedHistory = transactions.map(tx => ({
      id: tx._id,
      amount: tx.amount,
      description: tx.description,
      createdAt: tx.createdAt,
      vendor: tx.vendorId ? {
        id: tx.vendorId._id,
        name: tx.vendorId.name,
        businessName: tx.vendorId.businessName,
        phone: tx.vendorId.phone
      } : null
    }));

    res.status(200).json({
      success: true,
      data: formattedHistory
    });
  } catch (error) {
    console.error('Get incentive history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch incentive history'
    });
  }
};

/**
 * Award incentive to vendor
 */
const giveVendorIncentive = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, notes } = req.body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }

    // Add money directly to earnings
    const currentEarnings = vendor.wallet?.earnings || 0;
    vendor.wallet = {
      ...vendor.wallet,
      earnings: currentEarnings + parsedAmount
    };
    await vendor.save();

    // Create completed credit transaction
    const Transaction = require('../../models/Transaction');
    await Transaction.create({
      vendorId: vendor._id,
      type: 'credit',
      amount: parsedAmount,
      description: notes || `Admin Incentive of ₹${parsedAmount} awarded`,
      status: 'completed',
      referenceType: 'admin_adjustment'
    });

    // Notify vendor
    try {
      await createNotification({
        vendorId: vendor._id,
        type: 'wallet_credit',
        title: '🎉 Incentive Received!',
        message: `Admin has credited ₹${parsedAmount} incentive to your wallet.`,
        data: {
          amount: parsedAmount,
          notes: notes || ''
        },
        pushData: {
          type: 'wallet_update',
          link: '/vendor/wallet'
        }
      });
    } catch (notifErr) {
      console.error('FCM/Notification error during incentive:', notifErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Incentive of ₹${parsedAmount} successfully credited to ${vendor.businessName || vendor.name}`,
      data: {
        earnings: vendor.wallet.earnings,
        dues: vendor.wallet.dues
      }
    });
  } catch (error) {
    console.error('Give vendor incentive error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to award incentive'
    });
  }
};

/**
 * Get all vendors with wallet info for admin wallet management
 */
const getVendorWallets = async (req, res) => {
  try {
    const { search, page = 1, limit = 20, frozenOnly } = req.query;
    const query = {};

    const adminFilter = await getVendorQueryFilter(req.user);
    Object.assign(query, adminFilter);

    if (frozenOnly === 'true') {
      query['wallet.isBlocked'] = true;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { businessName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const vendors = await Vendor.find(query)
      .select('name businessName phone profilePhoto approvalStatus isActive wallet createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Vendor.countDocuments(query);

    res.status(200).json({
      success: true,
      data: vendors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get vendor wallets error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch vendor wallets.' });
  }
};

/**
 * Freeze or unfreeze a vendor's wallet
 */
const toggleVendorWalletFreeze = async (req, res) => {
  try {
    const { id } = req.params;
    const { freeze, reason } = req.body;

    const vendor = await Vendor.findById(id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found' });
    }

    vendor.wallet.isBlocked = !!freeze;
    vendor.wallet.blockedAt = freeze ? new Date() : null;
    vendor.wallet.blockReason = freeze ? (reason || 'Frozen by admin') : null;
    await vendor.save();

    // Notify vendor
    await createNotification({
      vendorId: vendor._id,
      type: freeze ? 'wallet_frozen' : 'wallet_unfrozen',
      title: freeze ? 'Wallet Frozen' : 'Wallet Unfrozen',
      message: freeze
        ? `Your wallet has been frozen by admin. Reason: ${reason || 'Policy violation'}. Contact support for help.`
        : 'Your wallet has been unfrozen. You can now withdraw your earnings.',
      relatedId: vendor._id,
      relatedType: 'vendor'
    });

    res.status(200).json({
      success: true,
      message: freeze ? 'Vendor wallet frozen successfully' : 'Vendor wallet unfrozen successfully',
      data: {
        vendorId: id,
        walletIsBlocked: vendor.wallet.isBlocked,
        blockedAt: vendor.wallet.blockedAt,
        blockReason: vendor.wallet.blockReason
      }
    });
  } catch (error) {
    console.error('Toggle vendor wallet freeze error:', error);
    res.status(500).json({ success: false, message: 'Failed to update wallet status.' });
  }
};

module.exports = {
  getAllVendors,
  getVendorDetails,
  approveVendor,
  rejectVendor,
  suspendVendor,
  getVendorBookings,
  getVendorEarnings,
  getAllVendorBookings,
  getVendorPaymentsSummary,
  toggleVendorStatus,
  deleteVendor,
  updateVendor,
  getVendorIncentiveStats,
  giveVendorIncentive,
  getIncentiveHistory,
  getVendorWallets,
  toggleVendorWalletFreeze
};


