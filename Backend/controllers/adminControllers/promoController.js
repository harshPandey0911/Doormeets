const PromoCode = require('../../models/PromoCode');
const Service = require('../../models/Service');
const Category = require('../../models/Category');

// Create Promo Code (Admin Only)
exports.createPromo = async (req, res) => {
  try {
    const { code, discountType, discountValue, expiryDate, minOrderValue, appliesTo, serviceId, categoryId, usageLimit, maxDiscountAmount, maxDiscountQty } = req.body;

    if (!code || !discountType || !discountValue || !expiryDate) {
      return res.status(400).json({ success: false, message: 'Code, discount type, value and expiry date are required.' });
    }

    const uppercaseCode = code.trim().toUpperCase();

    // Check if code already exists
    const existing = await PromoCode.findOne({ code: uppercaseCode });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A promo code with this name already exists.' });
    }

    const promo = await PromoCode.create({
      code: uppercaseCode,
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue || 0),
      appliesTo: appliesTo || 'all',
      serviceId: serviceId || null,
      categoryId: categoryId || null,
      expiryDate: new Date(expiryDate),
      usageLimit: usageLimit ? Number(usageLimit) : null,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      maxDiscountQty: maxDiscountQty ? Number(maxDiscountQty) : null
    });

    res.status(201).json({ success: true, data: promo });
  } catch (error) {
    console.error('Create promo error:', error);
    res.status(500).json({ success: false, message: 'Server error while creating promo code' });
  }
};

// Get All Promo Codes (Admin Only)
exports.getAllPromos = async (req, res) => {
  try {
    const promos = await PromoCode.find()
      .populate('serviceId', 'title')
      .populate('categoryId', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: promos });
  } catch (error) {
    console.error('Get promos error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching promo codes' });
  }
};

// Update Promo Code (Admin Only)
exports.updatePromo = async (req, res) => {
  try {
    const { code, discountType, discountValue, expiryDate, minOrderValue, appliesTo, serviceId, categoryId, usageLimit, maxDiscountAmount, maxDiscountQty, isActive } = req.body;

    const promo = await PromoCode.findById(req.params.id);
    if (!promo) {
      return res.status(404).json({ success: false, message: 'Promo code not found.' });
    }

    const updateFields = {
      isActive: isActive !== undefined ? isActive : promo.isActive,
      appliesTo: appliesTo !== undefined ? appliesTo : promo.appliesTo,
      serviceId: appliesTo === 'service' ? serviceId : null,
      categoryId: appliesTo === 'category' ? categoryId : null
    };

    if (code) {
      const uppercaseCode = code.trim().toUpperCase();
      const existing = await PromoCode.findOne({ code: uppercaseCode, _id: { $ne: promo._id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Another promo code with this name already exists.' });
      }
      updateFields.code = uppercaseCode;
    }

    if (discountType) updateFields.discountType = discountType;
    if (discountValue !== undefined) updateFields.discountValue = Number(discountValue);
    if (expiryDate) updateFields.expiryDate = new Date(expiryDate);
    if (minOrderValue !== undefined) updateFields.minOrderValue = Number(minOrderValue);
    if (usageLimit !== undefined) updateFields.usageLimit = usageLimit ? Number(usageLimit) : null;
    if (maxDiscountAmount !== undefined) updateFields.maxDiscountAmount = maxDiscountAmount ? Number(maxDiscountAmount) : null;
    if (maxDiscountQty !== undefined) updateFields.maxDiscountQty = maxDiscountQty ? Number(maxDiscountQty) : null;

    const updatedPromo = await PromoCode.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: updatedPromo });
  } catch (error) {
    console.error('Update promo error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating promo code' });
  }
};

// Delete Promo Code (Admin Only)
exports.deletePromo = async (req, res) => {
  try {
    const promo = await PromoCode.findByIdAndDelete(req.params.id);
    if (!promo) {
      return res.status(404).json({ success: false, message: 'Promo code not found.' });
    }
    res.status(200).json({ success: true, message: 'Promo code deleted successfully.' });
  } catch (error) {
    console.error('Delete promo error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting promo code' });
  }
};

// Apply/Verify Promo Code (User checkout)
exports.applyPromo = async (req, res) => {
  try {
    const { code, serviceId, basePrice, quantity } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Promo code is required.' });
    }

    const promo = await PromoCode.findOne({ code: code.trim().toUpperCase(), isActive: true });
    if (!promo) {
      return res.status(404).json({ success: false, message: 'Invalid or inactive promo code.' });
    }

    // Check Expiry Date
    if (new Date(promo.expiryDate) < new Date()) {
      return res.status(400).json({ success: false, message: 'This promo code has expired.' });
    }

    // Check Usage Limit
    if (promo.usageLimit !== null && promo.usageCount >= promo.usageLimit) {
      return res.status(400).json({ success: false, message: 'Usage limit for this promo code has been reached.' });
    }

    // Check Minimum Order Value
    if (basePrice < promo.minOrderValue) {
      return res.status(400).json({ success: false, message: `Minimum order value of ₹${promo.minOrderValue} is required to apply this code.` });
    }

    // Check specific service/category restrictions
    if (promo.appliesTo === 'service') {
      if (!serviceId || String(serviceId) !== String(promo.serviceId)) {
        return res.status(400).json({ success: false, message: 'This promo code is not applicable to the selected service.' });
      }
    } else if (promo.appliesTo === 'category') {
      // Resolve category of the service first
      const service = await Service.findById(serviceId);
      if (!service || String(service.categoryId) !== String(promo.categoryId)) {
        return res.status(400).json({ success: false, message: 'This promo code is not applicable to services in this category.' });
      }
    }

    // Calculate Eligible Price & Quantity for Discount
    const itemQty = Number(quantity || 1);
    const eligibleQty = promo.maxDiscountQty ? Math.min(itemQty, Number(promo.maxDiscountQty)) : itemQty;
    const unitPrice = Number(basePrice) / itemQty;
    const eligiblePrice = unitPrice * eligibleQty;

    // Calculate Discount Amount
    let discountAmount = 0;
    if (promo.discountType === 'flat') {
      // Flat discount applies per eligible item
      discountAmount = promo.discountValue * eligibleQty;
    } else {
      discountAmount = (eligiblePrice * promo.discountValue) / 100;
      if (promo.maxDiscountAmount !== null && discountAmount > promo.maxDiscountAmount) {
        discountAmount = promo.maxDiscountAmount;
      }
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
      message: 'Promo code applied successfully!',
      data: {
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        discountAmount: Number(discountAmount.toFixed(2)),
        finalPrice: Number((basePrice - discountAmount).toFixed(2))
      }
    });
  } catch (error) {
    console.error('Apply promo error:', error);
    res.status(500).json({ success: false, message: 'Server error while validating promo code' });
  }
};

// Get Active Promo Codes (Public)
exports.getActivePublicPromos = async (req, res) => {
  try {
    const today = new Date();
    const promos = await PromoCode.find({
      isActive: true,
      expiryDate: { $gt: today }
    })
      .populate('serviceId', 'title')
      .populate('categoryId', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: promos });
  } catch (error) {
    console.error('Get public active promos error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching active promo codes' });
  }
};
