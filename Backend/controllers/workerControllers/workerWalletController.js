const Worker = require('../../models/Worker');
const Transaction = require('../../models/Transaction');
const Withdrawal = require('../../models/Withdrawal');

/**
 * Get worker's wallet details and summary
 */
const getWallet = async (req, res) => {
  try {
    const workerId = req.user.id;
    const worker = await Worker.findById(workerId).select('wallet name');

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        balance: worker.wallet?.balance || 0,
        totalWithdrawn: worker.wallet?.totalWithdrawn || 0,
        name: worker.name
      }
    });
  } catch (error) {
    console.error('Get worker wallet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch wallet details'
    });
  }
};

/**
 * Get worker's transaction history
 */
const getTransactions = async (req, res) => {
  try {
    const workerId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const query = { workerId };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get worker transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions'
    });
  }
};

/**
 * Submit withdrawal request for worker
 */
const requestWithdrawal = async (req, res) => {
  try {
    const workerId = req.user.id;
    const { amount, bankDetails, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    const currentBalance = worker.wallet?.balance || 0;

    // Check pending withdrawals to verify available balance
    const pendingWithdrawals = await Withdrawal.aggregate([
      { $match: { workerId: worker._id, status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const pendingAmount = pendingWithdrawals[0]?.total || 0;
    const availableBalance = currentBalance - pendingAmount;

    if (amount > availableBalance) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: ₹${availableBalance} (Pending: ₹${pendingAmount})`
      });
    }

    // Create withdrawal request
    const withdrawal = await Withdrawal.create({
      workerId,
      amount,
      userType: 'worker',
      bankDetails,
      adminNotes: notes,
      status: 'pending'
    });

    // Notify Admins
    try {
      const { createNotification } = require('../notificationControllers/notificationController');
      const Admin = require('../../models/Admin');
      const admins = await Admin.find({ isActive: true }).select('_id');

      for (const admin of admins) {
        await createNotification({
          adminId: admin._id,
          type: 'worker_withdrawal_request',
          title: '💸 Worker Withdrawal Request',
          message: `${worker.name} requested withdrawal of ₹${amount}`,
          relatedId: withdrawal._id,
          relatedType: 'withdrawal',
          data: {
            workerId: worker._id,
            workerName: worker.name,
            amount,
            withdrawalId: withdrawal._id
          },
          pushData: {
            type: 'admin_alert',
            link: '/admin/settlements'
          }
        });
      }
    } catch (notifyErr) {
      console.error('[Withdrawal Notification] Error:', notifyErr);
    }

    res.status(200).json({
      success: true,
      message: 'Withdrawal request submitted successfully. Pending admin approval.',
      data: withdrawal
    });
  } catch (error) {
    console.error('Request worker withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request withdrawal'
    });
  }
};

/**
 * Get worker's withdrawal history
 */
const getWithdrawals = async (req, res) => {
  try {
    const workerId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;

    const query = { workerId };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const withdrawals = await Withdrawal.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Withdrawal.countDocuments(query);

    res.status(200).json({
      success: true,
      data: withdrawals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get worker withdrawals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawals'
    });
  }
};

module.exports = {
  getWallet,
  getTransactions,
  requestWithdrawal,
  getWithdrawals
};
