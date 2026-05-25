const Razorpay = require('razorpay');
const crypto = require('crypto');
const Vendor = require('../../models/Vendor');
const SubscriptionPlan = require('../../models/SubscriptionPlan');

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    console.error('CRITICAL: Razorpay keys are missing from .env');
    throw new Error('Razorpay configuration missing');
  }

  return new Razorpay({ key_id, key_secret });
};

/**
 * Get active subscription plans for vendors
 */
const getActivePlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({
      $or: [
        { status: 'active' },
        { isActive: true, status: { $exists: false } }
      ]
    }).sort({ price: 1 });
    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a Razorpay order for subscription
 */
const createOrder = async (req, res) => {
  try {
    const { planId, vendorId } = req.body;
    console.log('DEBUG: Creating order for Plan:', planId, 'Vendor:', vendorId);
    
    if (!planId || !vendorId) {
      return res.status(400).json({ success: false, message: 'Plan ID and Vendor ID are required' });
    }

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    const options = {
      amount: Math.round(plan.price * 100), // amount in paise
      currency: "INR",
      receipt: `rcpt_${vendorId.toString().slice(-5)}_${Date.now()}`,
    };

    console.log('DEBUG: Razorpay Options:', options);

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create(options);
    console.log('DEBUG: Razorpay Order Created:', order.id);
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error('Razorpay order creation error details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create payment order',
      error: error.message 
    });
  }
};

const SubscriptionTransaction = require('../../models/SubscriptionTransaction');
const Admin = require('../../models/Admin');

/**
 * Verify Razorpay payment and activate subscription
 */
const verifyPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      vendorId,
      planId 
    } = req.body;

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const razorpay = getRazorpayInstance();
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (!isSignatureValid) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Activate subscription
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + parseInt(plan.duration));

    // Update Vendor
    await Vendor.findByIdAndUpdate(vendorId, {
      subscription: {
        planId: plan._id,
        startDate,
        endDate,
        status: 'active'
      },
      isSubscriptionActive: true,
      approvalStatus: 'approved',
      adminApproval: 'approved'
    });

    // Record Transaction
    const transaction = new SubscriptionTransaction({
      vendorId,
      planId,
      amount: plan.price,
      razorpay_order_id,
      razorpay_payment_id,
      startDate,
      endDate
    });
    await transaction.save();

    // Update Admin Wallet (Assuming the first Super Admin is the platform owner)
    // Alternatively, update all super admins or a specific platform account.
    // Let's update all super admins or the first one found.
    const admin = await Admin.findOne({ role: 'super_admin' });
    if (admin) {
      admin.wallet = (admin.wallet || 0) + plan.price;
      await admin.save();
    }

    res.status(200).json({ 
      success: true, 
      message: 'Subscription activated successfully!',
      subscription: { planName: plan.name, endDate }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify payment' });
  }
};

module.exports = {
  getActivePlans,
  createOrder,
  verifyPayment
};
