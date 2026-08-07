const PromoCode = require('../../models/PromoCode');
const Booking = require('../../models/Booking');
const { getZoneMatchFilter } = require('../../utils/adminFilterHelper');
const { validateAndCalculatePromo, PromoValidationError } = require('../../utils/promoValidator');

// Create Promo Code (Admin Only)
exports.createPromo = async (req, res) => {
  try {
    const { code, discountType, discountValue, expiryDate, minOrderValue, appliesTo, serviceId, categoryId, usageLimit, maxDiscountAmount, maxDiscountQty, zoneIds } = req.body;

    if (!code || !discountType || !discountValue || !expiryDate) {
      return res.status(400).json({ success: false, message: 'Code, discount type, value and expiry date are required.' });
    }

    const uppercaseCode = code.trim().toUpperCase();

    // Check if code already exists
    const existing = await PromoCode.findOne({ code: uppercaseCode });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A promo code with this name already exists.' });
    }

    const expDate = new Date(expiryDate);
    expDate.setHours(23, 59, 59, 999);

    // Zone Admin can only scope a promo to their own zone(s), never someone else's, and never
    // leave it global (empty zoneIds) unless they explicitly have no zone assigned. Super Admin
    // can set any zoneIds (or none, for a global promo).
    const zoneScope = req.zoneScope;
    let finalZoneIds = Array.isArray(zoneIds) ? zoneIds : [];
    if (zoneScope && !zoneScope.isSuperAdmin) {
      finalZoneIds = finalZoneIds.filter(z => zoneScope.zoneIds.includes(z.toString()));
      if (finalZoneIds.length === 0) finalZoneIds = zoneScope.zoneIds;
    }

    const promo = await PromoCode.create({
      code: uppercaseCode,
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue || 0),
      appliesTo: appliesTo || 'all',
      serviceId: serviceId || null,
      categoryId: categoryId || null,
      zoneIds: finalZoneIds,
      expiryDate: expDate,
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
    const query = {};
    // Zone Admins see promos scoped to their zone + global ones (empty zoneIds), same
    // "empty = global" convention as Category.zoneIds.
    const zoneFilter = await getZoneMatchFilter(req.user, 'zoneIds', { includeGlobal: true });
    if (Object.keys(zoneFilter).length > 0) Object.assign(query, zoneFilter);

    const promos = await PromoCode.find(query)
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
      isActive: isActive !== undefined ? isActive : promo.isActive
    };

    // Only touch appliesTo/serviceId/categoryId when appliesTo is actually part of THIS update —
    // previously this unconditionally reset serviceId/categoryId to null on every save (even a
    // plain isActive toggle), silently wiping out a promo's service/category scope.
    if (appliesTo !== undefined) {
      updateFields.appliesTo = appliesTo;
      updateFields.serviceId = appliesTo === 'service' ? serviceId : null;
      updateFields.categoryId = appliesTo === 'category' ? categoryId : null;
    }

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
    if (expiryDate) {
      const expDate = new Date(expiryDate);
      expDate.setHours(23, 59, 59, 999);
      updateFields.expiryDate = expDate;
    }
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

// Apply/Verify Promo Code (User checkout — preview only, never persists anything).
// Uses the exact same validation/calculation as createBooking's real, server-side re-check
// (utils/promoValidator.js), so this preview can never drift out of sync with what actually
// gets charged when the booking is placed.
exports.applyPromo = async (req, res) => {
  try {
    const { code, serviceId, basePrice, quantity } = req.body;
    const { discountAmount, promo } = await validateAndCalculatePromo({ code, basePrice, serviceId, quantity });

    res.status(200).json({
      success: true,
      message: 'Promo code applied successfully!',
      data: {
        code: promo.code,
        discountType: promo.discountType,
        discountValue: promo.discountValue,
        discountAmount,
        finalPrice: Number((Number(basePrice) - discountAmount).toFixed(2))
      }
    });
  } catch (error) {
    if (error instanceof PromoValidationError) {
      return res.status(400).json({ success: false, message: error.message });
    }
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

// Promo Analytics (Admin Only)
// Total/active/expired counts + usage-based stats (usage, discount given, revenue generated,
// most-used, highest-discount, average discount, last-used) computed straight from Booking
// records — no separate ledger to keep in sync, Booking.promoApplied/promoCodeId IS the ledger.
exports.getPromoAnalytics = async (req, res) => {
  try {
    const now = new Date();

    const [totalPromoCodes, activePromoCodes, expiredPromoCodes] = await Promise.all([
      PromoCode.countDocuments({}),
      PromoCode.countDocuments({ isActive: true, expiryDate: { $gte: now } }),
      PromoCode.countDocuments({ expiryDate: { $lt: now } })
    ]);

    const usageStats = await Booking.aggregate([
      { $match: { promoApplied: true, promoCodeId: { $ne: null } } },
      {
        $group: {
          _id: '$promoCodeId',
          code: { $first: '$promoCode' },
          totalUsage: { $sum: 1 },
          totalDiscountGiven: { $sum: '$promoDiscountAmount' },
          totalRevenueGenerated: { $sum: '$finalAmount' },
          lastUsedDate: { $max: '$createdAt' }
        }
      }
    ]);

    const totalUsage = usageStats.reduce((sum, s) => sum + s.totalUsage, 0);
    const totalDiscountGiven = parseFloat(usageStats.reduce((sum, s) => sum + s.totalDiscountGiven, 0).toFixed(2));
    const totalRevenueGenerated = parseFloat(usageStats.reduce((sum, s) => sum + s.totalRevenueGenerated, 0).toFixed(2));
    const averageDiscount = totalUsage > 0 ? parseFloat((totalDiscountGiven / totalUsage).toFixed(2)) : 0;
    const lastUsedDate = usageStats.reduce((latest, s) => (!latest || s.lastUsedDate > latest ? s.lastUsedDate : latest), null);

    const mostUsedPromo = usageStats.length > 0
      ? usageStats.reduce((max, s) => (s.totalUsage > max.totalUsage ? s : max))
      : null;
    const highestDiscountPromo = usageStats.length > 0
      ? usageStats.reduce((max, s) => (s.totalDiscountGiven > max.totalDiscountGiven ? s : max))
      : null;

    res.status(200).json({
      success: true,
      data: {
        totalPromoCodes,
        activePromoCodes,
        expiredPromoCodes,
        totalUsage,
        totalDiscountGiven,
        totalRevenueGenerated,
        averageDiscount,
        lastUsedDate,
        mostUsedPromo: mostUsedPromo ? { code: mostUsedPromo.code, usage: mostUsedPromo.totalUsage } : null,
        highestDiscountPromo: highestDiscountPromo ? { code: highestDiscountPromo.code, discountGiven: parseFloat(highestDiscountPromo.totalDiscountGiven.toFixed(2)) } : null
      }
    });
  } catch (error) {
    console.error('Get promo analytics error:', error);
    res.status(500).json({ success: false, message: 'Server error while computing promo analytics' });
  }
};

// Promo Usage History (Admin Only) — every booking a promo was actually redeemed on.
exports.getPromoUsageHistory = async (req, res) => {
  try {
    const { code, startDate, endDate, page = 1, limit = 20 } = req.query;

    const query = { promoApplied: true };
    if (code) query.promoCode = String(code).trim().toUpperCase();
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .select('bookingNumber userId vendorId serviceId serviceName promoCode promoDiscountAmount originalAmount finalAmount createdAt paymentStatus status')
        .populate('userId', 'name phone')
        .populate('vendorId', 'name businessName')
        .populate('serviceId', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Booking.countDocuments(query)
    ]);

    const data = bookings.map(b => ({
      bookingId: b._id,
      bookingNumber: b.bookingNumber,
      customer: b.userId?.name || 'N/A',
      vendor: b.vendorId?.name || b.vendorId?.businessName || 'Unassigned',
      service: b.serviceId?.title || b.serviceName || 'N/A',
      promoCode: b.promoCode,
      discountAmount: b.promoDiscountAmount,
      originalAmount: b.originalAmount,
      finalPaidAmount: b.finalAmount,
      bookingDate: b.createdAt,
      paymentStatus: b.paymentStatus,
      bookingStatus: b.status
    }));

    res.status(200).json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get promo usage history error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching promo usage history' });
  }
};
