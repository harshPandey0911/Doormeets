const Worker = require('../../models/Worker');
const Booking = require('../../models/Booking');
const City = require('../../models/City');
const { validationResult } = require('express-validator');
const { WORKER_STATUS, BOOKING_STATUS, VENDOR_STATUS } = require('../../utils/constants');
const { createNotification } = require('../notificationControllers/notificationController');

/**
 * Get all workers with filters and pagination
 */
const getAllWorkers = async (req, res) => {
  try {
    const {
      search,
      approvalStatus,
      isActive,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    const query = {};

    // CITY ADMIN FILTER: Restrict workers to assigned cities
    if (req.user && (req.user.role === 'CITY_ADMIN' || req.user.role === 'admin')) {
      if (req.user.assignedCities && req.user.assignedCities.length > 0) {
        const cities = await City.find({ _id: { $in: req.user.assignedCities } });
        const cityNames = cities.map(c => new RegExp(`^${c.name}$`, 'i'));
        query['address.city'] = { $in: cityNames };
      } else {
        return res.status(200).json({
          success: true,
          data: [],
          pagination: { page: parseInt(page), limit: parseInt(limit), total: 0, pages: 0 }
        });
      }
    }

    if (approvalStatus) {
      query.approvalStatus = approvalStatus;
    }
    if (req.query.type === 'labour') {
      query.vendorId = null;
    } else if (req.query.type === 'worker') {
      query.vendorId = { $ne: null };
    }
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    // Search by name, email, phone
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { serviceCategory: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get workers
    const workers = await Worker.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Worker.countDocuments(query);

    res.status(200).json({
      success: true,
      data: workers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all workers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workers. Please try again.'
    });
  }
};

/**
 * Create a new worker (labour) manually
 */
const createWorker = async (req, res) => {
  try {
    const { name, phone, serviceCategories } = req.body;

    if (!name || !phone || !serviceCategories || serviceCategories.length === 0) {
      return res.status(400).json({ success: false, message: 'Name, phone, and at least one skill are required' });
    }

    const existingWorker = await Worker.findOne({ phone });
    if (existingWorker) {
      return res.status(400).json({ success: false, message: 'This phone number is already registered' });
    }

    // Prepare worker data
    const workerData = {
      name,
      phone,
      serviceCategories,
      approvalStatus: 'approved',
      isActive: true,
      status: 'OFFLINE',
      isPhoneVerified: true // Admin created, assume verified
    };

    // Only add email if it was provided (though not in current form)
    if (req.body.email) {
      workerData.email = req.body.email;
    }

    const worker = new Worker(workerData);
    await worker.save();

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: worker
    });
  } catch (error) {
    console.error('Create worker error:', error);

    // Handle duplicate key error (MongoDB error code 11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `This ${field} is already registered. Please use a different one.`
      });
    }

    // If validation error, send specific message
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while creating account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get worker details
 */
const getWorkerDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const worker = await Worker.findById(id).select('-password');

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    // Get worker booking stats
    const jobStats = await Booking.aggregate([
      {
        $match: { workerId: worker._id }
      },
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          completedJobs: {
            $sum: {
              $cond: [{ $eq: ['$status', BOOKING_STATUS.COMPLETED] }, 1, 0]
            }
          },
          // Assuming workers might get paid or we just track job value
          totalJobValue: {
            $sum: '$finalAmount'
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        worker,
        stats: jobStats[0] || {
          totalJobs: 0,
          completedJobs: 0,
          totalJobValue: 0
        }
      }
    });
  } catch (error) {
    console.error('Get worker details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch worker details. Please try again.'
    });
  }
};

/**
 * Approve worker registration
 */
const approveWorker = async (req, res) => {
  try {
    const { id } = req.params;

    const worker = await Worker.findById(id);

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    worker.approvalStatus = 'approved';
    worker.isActive = true;
    await worker.save();

    // Send notification to worker
    /*
    // Note: Assuming notification system supports 'worker' type or we treat them as users for now
    await createNotification({
      userId: worker._id, // Use userId for workers too? or need separate workerId field in notification
      type: 'worker_approved',
      title: 'Worker Registration Approved',
      message: 'Your worker registration has been approved.',
      relatedId: worker._id,
      relatedType: 'worker'
    });
    */

    res.status(200).json({
      success: true,
      message: 'Worker approved successfully',
      data: worker
    });
  } catch (error) {
    console.error('Approve worker error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve worker. Please try again.'
    });
  }
};

/**
 * Reject worker registration
 */
const rejectWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const worker = await Worker.findById(id);

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    worker.approvalStatus = 'rejected';
    worker.isActive = false;
    // worker.rejectedReason = reason; // If we want to store reason
    await worker.save();

    res.status(200).json({
      success: true,
      message: 'Worker rejected successfully',
      data: worker
    });
  } catch (error) {
    console.error('Reject worker error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject worker. Please try again.'
    });
  }
};

/**
 * Suspend worker
 */
const suspendWorker = async (req, res) => {
  try {
    const { id } = req.params;

    const worker = await Worker.findById(id);

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    worker.approvalStatus = 'suspended';
    worker.isActive = false;
    await worker.save();

    res.status(200).json({
      success: true,
      message: 'Worker suspended successfully',
      data: worker
    });
  } catch (error) {
    console.error('Suspend worker error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend worker. Please try again.'
    });
  }
};

/**
 * Get worker jobs
 */
const getWorkerJobs = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    const query = { workerId: id };
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const jobs = await Booking.find(query)
      .populate('userId', 'name phone')
      .populate('serviceId', 'title iconUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get worker jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch worker jobs.'
    });
  }
};

/**
 * Get worker earnings
 */
const getWorkerEarnings = async (req, res) => {
  // Placeholder for now, can be expanded if we track granular worker earnings
  res.status(200).json({
    success: true,
    data: {
      totalEarnings: 0
    }
  });
};

/**
 * Pay worker manually
 */
const payWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reference, notes } = req.body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid amount'
      });
    }

    const worker = await Worker.findById(id);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    // Update wallet balance
    // Assuming balance is amount owed to Admin? 
    // Usually admin pays worker, so worker balance increases or decreases?
    // In this system, vendor owes admin (negative balance).
    // For workers, positive balance probably means earnings they can withdraw.
    // If admin pays them, it should reduce their pending balance or just reflect as a transaction.
    // If the user says "pay worker", it usually means adding money to their wallet or clearing dues.

    if (!worker.wallet) worker.wallet = { balance: 0 };
    worker.wallet.balance += parseFloat(amount);

    await worker.save();

    res.status(200).json({
      success: true,
      message: `Successfully recorded payment of ₹${amount} to ${worker.name}`,
      data: {
        balance: worker.wallet.balance
      }
    });
  } catch (error) {
    console.error('Pay worker error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment. Please try again.'
    });
  }
};

/**
 * Get all worker jobs (global)
 */
const getAllWorkerJobs = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search, type } = req.query;

    const query = { workerId: { $exists: true, $ne: null } };
    if (status) {
      query.status = status;
    }

    // Identify which workers we care about
    const workerQuery = {};
    if (type === 'labour') {
      workerQuery.vendorId = null;
    } else if (type === 'worker') {
      workerQuery.vendorId = { $ne: null };
    }

    // If search is provided, add it to workerQuery
    if (search) {
      workerQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Only lookup workers if there's a type filter or search filter
    if (Object.keys(workerQuery).length > 0) {
      const workers = await Worker.find(workerQuery).select('_id');
      const workerIds = workers.map(w => w._id);
      query.workerId = { $in: workerIds };
    }

    const jobs = await Booking.find(query)
      .populate('workerId', 'name phone profileImage')
      .populate('userId', 'name phone')
      .populate('serviceId', 'title iconUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Booking.countDocuments(query);

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get all worker jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch all worker jobs.'
    });
  }
};

/**
 * Get worker payments summary
 */
const getWorkerPaymentsSummary = async (req, res) => {
  try {
    // For now, return workers with non-zero balances or recent job activity
    const workers = await Worker.find({
      'wallet.balance': { $exists: true }
    })
      .select('name phone wallet email serviceCategory approvalStatus')
      .sort({ 'wallet.balance': -1 });

    res.status(200).json({
      success: true,
      data: workers
    });
  } catch (error) {
    console.error('Get worker payments summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch worker payments summary.'
    });
  }
};

/**
 * Toggle worker active status
 */
const toggleWorkerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body; // Expecting { isActive: true/false }

    const worker = await Worker.findById(id);

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    worker.isActive = isActive;
    await worker.save();

    res.status(200).json({
      success: true,
      message: `Worker ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: worker
    });
  } catch (error) {
    console.error('Toggle worker status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update worker status'
    });
  }
};

/**
 * Delete worker details
 */
const deleteWorker = async (req, res) => {
  try {
    const { id } = req.params;

    const worker = await Worker.findByIdAndDelete(id);

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Worker deleted successfully'
    });
  } catch (error) {
    console.error('Delete worker error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete worker'
    });
  }
};

module.exports = {
  getAllWorkers,
  getWorkerDetails,
  approveWorker,
  rejectWorker,
  suspendWorker,
  getWorkerJobs,
  getWorkerEarnings,
  payWorker,
  getAllWorkerJobs,
  getWorkerPaymentsSummary,
  toggleWorkerStatus,
  deleteWorker,
  createWorker
};
