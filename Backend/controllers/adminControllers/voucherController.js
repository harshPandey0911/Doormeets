const Voucher = require('../../models/Voucher');
const User = require('../../models/User');
const Service = require('../../models/Service');
const Transaction = require('../../models/Transaction');

// Create Gift Card / Voucher (Admin Only)
exports.createVoucher = async (req, res) => {
  try {
    const { code, type, value, discountType, serviceId, categoryId, maxDiscountQty, minOrderValue, expiryDate, usageLimit, oneTimePerUser } = req.body;

    if (!code || !type || value === undefined || !expiryDate) {
      return res.status(400).json({ success: false, message: 'Code, type, value and expiry date are required.' });
    }

    const uppercaseCode = code.trim().toUpperCase();

    // Check if voucher already exists
    const existing = await Voucher.findOne({ code: uppercaseCode });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A gift card or voucher with this code already exists.' });
    }

    const voucher = await Voucher.create({
      code: uppercaseCode,
      type,
      value: Number(value),
      discountType: ['service_discount', 'all_discount'].includes(type) ? discountType : null,
      serviceId: type === 'service_discount' ? (serviceId || null) : null,
      categoryId: type === 'service_discount' ? (categoryId || null) : null,
      maxDiscountQty: type === 'service_discount' && maxDiscountQty ? Number(maxDiscountQty) : null,
      minOrderValue: Number(minOrderValue || 0),
      expiryDate: new Date(expiryDate),
      usageLimit: usageLimit ? Number(usageLimit) : null,
      oneTimePerUser: oneTimePerUser !== undefined ? oneTimePerUser : true
    });

    res.status(201).json({ success: true, data: voucher });
  } catch (error) {
    console.error('Create voucher error:', error);
    res.status(500).json({ success: false, message: 'Server error while creating gift voucher' });
  }
};

// Get All Vouchers (Admin Only)
exports.getAllVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find()
      .populate('serviceId', 'title')
      .populate('categoryId', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: vouchers });
  } catch (error) {
    console.error('Get vouchers error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching gift vouchers' });
  }
};

// Update Voucher (Admin Only)
exports.updateVoucher = async (req, res) => {
  try {
    const { code, type, value, discountType, serviceId, categoryId, maxDiscountQty, minOrderValue, expiryDate, usageLimit, oneTimePerUser, isActive } = req.body;

    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Gift voucher not found.' });
    }

    const updateFields = {
      isActive: isActive !== undefined ? isActive : voucher.isActive,
      type: type !== undefined ? type : voucher.type,
      serviceId: type === 'service_discount' ? serviceId : null,
      categoryId: type === 'service_discount' ? categoryId : null,
      oneTimePerUser: oneTimePerUser !== undefined ? oneTimePerUser : voucher.oneTimePerUser
    };

    if (code) {
      const uppercaseCode = code.trim().toUpperCase();
      const existing = await Voucher.findOne({ code: uppercaseCode, _id: { $ne: voucher._id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Another gift voucher with this code already exists.' });
      }
      updateFields.code = uppercaseCode;
    }

    if (value !== undefined) updateFields.value = Number(value);
    if (discountType) updateFields.discountType = discountType;
    if (maxDiscountQty !== undefined) updateFields.maxDiscountQty = maxDiscountQty ? Number(maxDiscountQty) : null;
    if (minOrderValue !== undefined) updateFields.minOrderValue = Number(minOrderValue);
    if (expiryDate) updateFields.expiryDate = new Date(expiryDate);
    if (usageLimit !== undefined) updateFields.usageLimit = usageLimit ? Number(usageLimit) : null;

    const updatedVoucher = await Voucher.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: updatedVoucher });
  } catch (error) {
    console.error('Update voucher error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating gift voucher' });
  }
};

// Delete Voucher (Admin Only)
exports.deleteVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findByIdAndDelete(req.params.id);
    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Gift voucher not found.' });
    }
    res.status(200).json({ success: true, message: 'Gift voucher deleted successfully.' });
  } catch (error) {
    console.error('Delete voucher error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting gift voucher' });
  }
};

// Redeem Voucher (User claim endpoint)
exports.redeemVoucher = async (req, res) => {
  try {
    const { code, serviceId, basePrice, quantity } = req.body;
    const userId = req.user.id;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Gift voucher code is required.' });
    }

    const voucher = await Voucher.findOne({ code: code.trim().toUpperCase(), isActive: true });
    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive gift voucher code.' });
    }

    // Check Expiry Date
    if (new Date(voucher.expiryDate) < new Date()) {
      return res.status(400).json({ success: false, message: 'This gift voucher has expired.' });
    }

    // Check Global Usage Limit
    if (voucher.usageLimit !== null && voucher.usageCount >= voucher.usageLimit) {
      return res.status(400).json({ success: false, message: 'Usage limit for this gift voucher has been reached.' });
    }

    // Check if user has already redeemed this voucher (if oneTimePerUser is true)
    if (voucher.oneTimePerUser) {
      const alreadyRedeemed = voucher.redeemedBy.some(r => r.userId.toString() === userId.toString());
      if (alreadyRedeemed) {
        return res.status(400).json({ success: false, message: 'You have already claimed this gift voucher once.' });
      }
    }

    // --- CASE A: WALLET TOPUP VOUCHER ---
    if (voucher.type === 'wallet') {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Add balance to user wallet
      user.wallet.balance = (user.wallet.balance || 0) + voucher.value;
      await user.save();

      // Record System top-up transaction
      await Transaction.create({
        userId: user._id,
        amount: voucher.value,
        type: 'credit',
        paymentMethod: 'system',
        status: 'completed',
        description: `Redeemed Gift Card ${voucher.code}`
      });

      // Track redemption in Voucher
      voucher.redeemedBy.push({ userId: user._id, redeemedAt: new Date() });
      voucher.usageCount += 1;
      await voucher.save();

      return res.status(200).json({
        success: true,
        message: `Congratulations! ₹${voucher.value} has been instantly added to your wallet.`,
        data: {
          type: 'wallet',
          value: voucher.value,
          newBalance: user.wallet.balance
        }
      });
    }

    // --- CASE B: DISCOUNT VOUCHER (Applied at checkout) ---
    // If user is just checking the voucher value without checking out:
    if (basePrice === undefined) {
      return res.status(200).json({
        success: true,
        message: 'Gift voucher is valid!',
        data: {
          type: voucher.type,
          discountType: voucher.discountType,
          discountValue: voucher.value
        }
      });
    }

    // Check Minimum Order Value
    if (Number(basePrice) < voucher.minOrderValue) {
      return res.status(400).json({ success: false, message: `Minimum order value of ₹${voucher.minOrderValue} is required to claim this voucher.` });
    }

    // Check specific service/category restrictions
    if (voucher.type === 'service_discount') {
      if (voucher.serviceId && (!serviceId || String(serviceId) !== String(voucher.serviceId))) {
        return res.status(400).json({ success: false, message: 'This gift voucher is not applicable to the selected service.' });
      }
      if (voucher.categoryId) {
        const service = await Service.findById(serviceId);
        if (!service || String(service.categoryId) !== String(voucher.categoryId)) {
          return res.status(400).json({ success: false, message: 'This gift voucher is not applicable to services in this category.' });
        }
      }
    }

    // Calculate Eligible Price & Quantity for Discount
    const itemQty = Number(quantity || 1);
    const eligibleQty = voucher.maxDiscountQty ? Math.min(itemQty, Number(voucher.maxDiscountQty)) : itemQty;
    const unitPrice = Number(basePrice) / itemQty;
    const eligiblePrice = unitPrice * eligibleQty;

    // Calculate Discount Amount
    let discountAmount = 0;
    if (voucher.discountType === 'flat') {
      discountAmount = voucher.value * eligibleQty;
    } else {
      discountAmount = (eligiblePrice * voucher.value) / 100;
    }

    // Guard against discount exceeding eligible price
    if (discountAmount > eligiblePrice) {
      discountAmount = eligiblePrice;
    }

    // Guard against discount exceeding overall basePrice
    if (discountAmount > basePrice) {
      discountAmount = basePrice;
    }

    res.status(200).json({
      success: true,
      message: 'Gift voucher applied successfully!',
      data: {
        code: voucher.code,
        type: voucher.type,
        discountType: voucher.discountType,
        discountValue: voucher.value,
        discountAmount: Number(discountAmount.toFixed(2)),
        finalPrice: Number((basePrice - discountAmount).toFixed(2))
      }
    });
  } catch (error) {
    console.error('Redeem voucher error:', error);
    res.status(500).json({ success: false, message: 'Server error while claiming gift card' });
  }
};
