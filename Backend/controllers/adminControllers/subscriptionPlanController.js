const SubscriptionPlan = require('../../models/SubscriptionPlan');

/**
 * Get all subscription plans
 */
const getAllPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ price: 1 });
    const normalizedPlans = plans.map(p => {
      const pObj = p.toObject();
      pObj.isActive = pObj.isActive === true || (pObj.isActive !== false && pObj.status !== 'hide');
      return pObj;
    });
    res.status(200).json({ success: true, data: normalizedPlans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a new subscription plan
 */
const createPlan = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.isActive !== undefined) {
      payload.status = payload.isActive ? 'active' : 'hide';
    }
    const plan = await SubscriptionPlan.create(payload);
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Update a subscription plan
 */
const updatePlan = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.isActive !== undefined) {
      updateData.status = updateData.isActive ? 'active' : 'hide';
    }
    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Delete a subscription plan
 */
const deletePlan = async (req, res) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    res.status(200).json({ success: true, message: 'Plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const SubscriptionTransaction = require('../../models/SubscriptionTransaction');

/**
 * Get all subscription transactions
 */
const getTransactions = async (req, res) => {
  try {
    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    let query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await SubscriptionTransaction.find(query)
      .populate('vendorId', 'businessName name phone')
      .populate('planId', 'name price duration')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalTransactions = await SubscriptionTransaction.countDocuments(query);

    // Calculate total revenue (of filtered results or all? Usually all for stats, but user might want filtered stats)
    // To get accurate stats for the whole filtered range, we need another query or aggregation
    const allFilteredTransactions = await SubscriptionTransaction.find(query);
    const totalRevenue = allFilteredTransactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);

    res.status(200).json({ 
      success: true, 
      data: transactions,
      pagination: {
        total: totalTransactions,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalTransactions / parseInt(limit))
      },
      stats: {
        totalRevenue,
        transactionCount: totalTransactions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getTransactions
};
