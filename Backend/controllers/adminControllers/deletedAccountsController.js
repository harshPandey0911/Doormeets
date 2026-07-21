const User = require('../../models/User');
const Vendor = require('../../models/Vendor');
const Worker = require('../../models/Worker');
const ShopOwner = require('../../models/ShopOwner');
const Booking = require('../../models/Booking');
const Transaction = require('../../models/Transaction');

/**
 * GET /api/admin/deleted-accounts
 * Fetch all soft-deleted accounts grouped by role
 */
exports.getDeletedAccounts = async (req, res, next) => {
  try {
    const users = await User.find({ isDeleted: true }).sort({ deletedAt: -1 }).lean();
    const vendors = await Vendor.find({ isDeleted: true }).sort({ deletedAt: -1 }).lean();
    const workers = await Worker.find({ isDeleted: true }).sort({ deletedAt: -1 }).lean();
    const shopOwners = await ShopOwner.find({ isDeleted: true }).sort({ deletedAt: -1 }).lean();

    res.status(200).json({
      success: true,
      data: {
        users,
        vendors,
        workers,
        shopOwners
      }
    });
  } catch (error) {
    console.error('Error fetching deleted accounts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch deleted accounts.' });
  }
};

/**
 * GET /api/admin/deleted-accounts/:role/:id/history
 * Fetch booking/transaction/referral history of a deleted account
 */
exports.getDeletedAccountHistory = async (req, res, next) => {
  try {
    const { role, id } = req.params;
    let details = null;
    let history = [];

    if (role === 'user') {
      details = await User.findOne({ _id: id, isDeleted: true }).lean();
      if (details) {
        history = await Booking.find({ userId: id })
          .populate('vendorId', 'name phone')
          .sort({ createdAt: -1 })
          .lean();
      }
    } else if (role === 'vendor') {
      details = await Vendor.findOne({ _id: id, isDeleted: true }).lean();
      if (details) {
        history = await Booking.find({ vendorId: id })
          .populate('userId', 'name phone')
          .sort({ createdAt: -1 })
          .lean();
      }
    } else if (role === 'worker') {
      details = await Worker.findOne({ _id: id, isDeleted: true }).lean();
      if (details) {
        history = await Booking.find({ workerId: id })
          .populate('userId', 'name phone')
          .sort({ createdAt: -1 })
          .lean();
      }
    } else if (role === 'shopOwner') {
      details = await ShopOwner.findOne({ _id: id, isDeleted: true }).lean();
      if (details) {
        // Shop owners history could be referred vendors or transactions
        const referredVendors = await Vendor.find({ referredByShopOwner: id }).select('name phone approvalStatus').lean();
        const transactions = await Transaction.find({ shopOwnerId: id }).sort({ createdAt: -1 }).lean();
        history = {
          referredVendors,
          transactions
        };
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid role parameter.' });
    }

    if (!details) {
      return res.status(404).json({ success: false, message: 'Deleted account not found.' });
    }

    res.status(200).json({
      success: true,
      data: {
        details,
        history
      }
    });
  } catch (error) {
    console.error('Error fetching deleted account history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch history details.' });
  }
};

/**
 * DELETE /api/admin/deleted-accounts/:role/:id
 * Permanently delete an account from the database
 */
exports.permanentlyDeleteAccount = async (req, res, next) => {
  try {
    const { role, id } = req.params;
    let deletedDoc = null;

    if (role === 'user') {
      deletedDoc = await User.findByIdAndDelete(id);
    } else if (role === 'vendor') {
      deletedDoc = await Vendor.findByIdAndDelete(id);
    } else if (role === 'worker') {
      deletedDoc = await Worker.findByIdAndDelete(id);
    } else if (role === 'shopOwner') {
      deletedDoc = await ShopOwner.findByIdAndDelete(id);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid role parameter.' });
    }

    if (!deletedDoc) {
      return res.status(404).json({ success: false, message: 'Account not found or already deleted.' });
    }

    res.status(200).json({
      success: true,
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} account permanently deleted.`
    });
  } catch (error) {
    console.error('Error permanently deleting account:', error);
    res.status(500).json({ success: false, message: 'Failed to permanently delete account.' });
  }
};

/**
 * DELETE /api/users/profile
 * Soft delete current user
 */
exports.deleteUserAccount = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.isActive = false; // deactivate
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Your account has been deleted successfully.'
    });
  } catch (error) {
    console.error('Error soft-deleting user:', error);
    res.status(500).json({ success: false, message: 'Failed to delete account.' });
  }
};

/**
 * DELETE /api/vendors/profile
 * Soft delete current vendor
 */
exports.deleteVendorAccount = async (req, res, next) => {
  try {
    const vendorId = req.user.id;
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendor not found.' });
    }

    vendor.isDeleted = true;
    vendor.deletedAt = new Date();
    vendor.isActive = false;
    await vendor.save();

    res.status(200).json({
      success: true,
      message: 'Your vendor account has been deleted successfully.'
    });
  } catch (error) {
    console.error('Error soft-deleting vendor:', error);
    res.status(500).json({ success: false, message: 'Failed to delete account.' });
  }
};

/**
 * DELETE /api/workers/profile
 * Soft delete current worker
 */
exports.deleteWorkerAccount = async (req, res, next) => {
  try {
    const workerId = req.user.id;
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ success: false, message: 'Worker not found.' });
    }

    worker.isDeleted = true;
    worker.deletedAt = new Date();
    worker.status = 'inactive';
    await worker.save();

    res.status(200).json({
      success: true,
      message: 'Your worker account has been deleted successfully.'
    });
  } catch (error) {
    console.error('Error soft-deleting worker:', error);
    res.status(500).json({ success: false, message: 'Failed to delete account.' });
  }
};

/**
 * DELETE /api/shop/profile
 * Soft delete current shop owner
 */
exports.deleteShopOwnerAccount = async (req, res, next) => {
  try {
    const shopOwnerId = req.user.id;
    const shopOwner = await ShopOwner.findById(shopOwnerId);
    if (!shopOwner) {
      return res.status(404).json({ success: false, message: 'Shop owner not found.' });
    }

    shopOwner.isDeleted = true;
    shopOwner.deletedAt = new Date();
    shopOwner.isActive = false;
    await shopOwner.save();

    res.status(200).json({
      success: true,
      message: 'Your shop owner account has been deleted successfully.'
    });
  } catch (error) {
    console.error('Error soft-deleting shop owner:', error);
    res.status(500).json({ success: false, message: 'Failed to delete account.' });
  }
};
