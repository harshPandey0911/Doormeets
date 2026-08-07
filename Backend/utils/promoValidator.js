const PromoCode = require('../models/PromoCode');
const Service = require('../models/Service');

/**
 * Typed error for promo validation failures — carries a user-facing `message` and keeps the
 * HTTP status decision with the caller (400 for all of these today).
 */
class PromoValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PromoValidationError';
  }
}

/**
 * Single source of truth for "is this promo code valid, and what's the discount?" — used by
 * both the checkout preview endpoint (applyPromo) and the real booking-creation path
 * (createBooking). Previously this logic only existed in applyPromo, a stateless preview that
 * was never called again at booking time — the server just trusted whatever discount number the
 * client sent. Extracting it here means both call sites can never drift out of sync, and
 * createBooking can now re-derive the authoritative discount itself instead of trusting the client.
 *
 * @param {Object} params
 * @param {string} params.code
 * @param {number} params.basePrice - server-computed base price, never a client-supplied number
 * @param {string} [params.serviceId]
 * @param {number} [params.quantity]
 * @returns {Promise<{ promo: Object, discountAmount: number }>}
 * @throws {PromoValidationError} with a user-facing message on any validation failure
 */
const validateAndCalculatePromo = async ({ code, basePrice, serviceId, quantity }) => {
  if (!code) {
    throw new PromoValidationError('Promo code is required.');
  }

  const promo = await PromoCode.findOne({ code: String(code).trim().toUpperCase(), isActive: true });
  if (!promo) {
    throw new PromoValidationError('Invalid or inactive promo code.');
  }

  // Valid until 11:59:59.999 PM of the expiry date.
  const promoExp = new Date(promo.expiryDate);
  promoExp.setHours(23, 59, 59, 999);
  if (promoExp < new Date()) {
    throw new PromoValidationError('This promo code has expired.');
  }

  if (promo.usageLimit !== null && promo.usageCount >= promo.usageLimit) {
    throw new PromoValidationError('Usage limit for this promo code has been reached.');
  }

  const price = Number(basePrice) || 0;
  if (price < promo.minOrderValue) {
    throw new PromoValidationError(`Minimum order value of ₹${promo.minOrderValue} is required to apply this code.`);
  }

  if (promo.appliesTo === 'service') {
    if (!serviceId || String(serviceId) !== String(promo.serviceId)) {
      throw new PromoValidationError('This promo code is not applicable to the selected service.');
    }
  } else if (promo.appliesTo === 'category') {
    const service = serviceId ? await Service.findById(serviceId).select('categoryId').lean() : null;
    if (!service || String(service.categoryId) !== String(promo.categoryId)) {
      throw new PromoValidationError('This promo code is not applicable to services in this category.');
    }
  }

  const itemQty = Number(quantity || 1) || 1;
  const eligibleQty = promo.maxDiscountQty ? Math.min(itemQty, Number(promo.maxDiscountQty)) : itemQty;
  const unitPrice = price / itemQty;
  const eligiblePrice = unitPrice * eligibleQty;

  let discountAmount = 0;
  if (promo.discountType === 'flat') {
    discountAmount = promo.discountValue * eligibleQty;
  } else {
    discountAmount = (eligiblePrice * promo.discountValue) / 100;
    if (promo.maxDiscountAmount !== null && discountAmount > promo.maxDiscountAmount) {
      discountAmount = promo.maxDiscountAmount;
    }
  }

  if (discountAmount > eligiblePrice) discountAmount = eligiblePrice;
  if (discountAmount > price) discountAmount = price;

  return {
    promo,
    discountAmount: Number(discountAmount.toFixed(2))
  };
};

/**
 * Atomically reserves one usage slot on a promo (compare-and-increment), so concurrent bookings
 * can never push usageCount past usageLimit — the previous background `$inc` had no such guard.
 * @returns {Promise<Object|null>} the updated PromoCode doc, or null if the limit was already hit
 */
const reservePromoUsage = async (promoId) => {
  return PromoCode.findOneAndUpdate(
    {
      _id: promoId,
      $or: [{ usageLimit: null }, { $expr: { $lt: ['$usageCount', '$usageLimit'] } }]
    },
    { $inc: { usageCount: 1 } },
    { new: true }
  );
};

/**
 * Releases a previously reserved usage slot (e.g. on booking cancellation), floored at 0.
 */
const releasePromoUsage = async (promoId) => {
  const promo = await PromoCode.findById(promoId).select('usageCount');
  if (!promo || promo.usageCount <= 0) return;
  await PromoCode.findByIdAndUpdate(promoId, { $inc: { usageCount: -1 } });
};

module.exports = {
  PromoValidationError,
  validateAndCalculatePromo,
  reservePromoUsage,
  releasePromoUsage
};
