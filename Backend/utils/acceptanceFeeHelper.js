/**
 * Shared vendor-acceptance-fee calculation.
 * ──────────────────────────────────────────
 * A single booking can bundle several packages/options together (booking.bookedItems — e.g.
 * "Switch repair" + "Socket replacement" booked in one go), and admin can configure a separate
 * vendorAcceptanceFee per package/option. The fee the vendor is charged to accept the job must
 * be the SUM across every booked item, not just the first one.
 *
 * This was previously duplicated (buggily, bookedItems[0]-only) in four places: the accept-time
 * deduction, two pre-accept preview endpoints, and the wave-dispatch notification — each summing
 * to a different, wrong number. Now there is exactly one implementation.
 */

/**
 * @param {Object} serviceDoc - Service document with serviceType/packages/serviceGroups selected.
 * @param {Array}  bookedItems - booking.bookedItems (each item has card.title and quantity).
 * @returns {number} Total acceptance fee in rupees across every booked item.
 */
const calculateTotalAcceptanceFee = (serviceDoc, bookedItems) => {
  let total = 0;
  if (!serviceDoc || serviceDoc.serviceType !== 'package_base' || !Array.isArray(bookedItems)) {
    return total;
  }

  for (const bookedItem of bookedItems) {
    const bookedItemTitle = bookedItem?.card?.title;
    const qty = Number(bookedItem?.quantity) || 1;
    if (!bookedItemTitle) continue;

    let itemFee = 0;

    // 1. Check option-group sub-items first
    if (Array.isArray(serviceDoc.serviceGroups)) {
      for (const grp of serviceDoc.serviceGroups) {
        if (Array.isArray(grp.items)) {
          const matchedItem = grp.items.find(item =>
            bookedItemTitle === item.title ||
            bookedItemTitle.endsWith(` - ${item.title}`) ||
            bookedItemTitle.includes(item.title)
          );
          if (matchedItem) {
            itemFee = matchedItem.vendorAcceptanceFee || 0;
            break;
          }
        }
      }
    }

    // 2. Fall back to combo packages
    if (itemFee === 0 && Array.isArray(serviceDoc.packages) && serviceDoc.packages.length > 0) {
      const matchedPkg = serviceDoc.packages.find(p =>
        bookedItemTitle === p.title ||
        bookedItemTitle.endsWith(` - ${p.title}`) ||
        bookedItemTitle.includes(p.title)
      );
      if (matchedPkg) {
        itemFee = matchedPkg.vendorAcceptanceFee || 0;
      }
    }

    total += itemFee * qty;
  }

  return total;
};

/**
 * Some services have no fixed `packages`/`serviceGroups` at all — instead the customer picks
 * one or more free-form "variant" add-ons together in a single "Customized Items" selection
 * (e.g. "AC Switchboard Installation" + "1 Switch" booked in the same request). That whole
 * selection collapses into ONE booking.bookedItems entry with a combined price, so per-item
 * matching against bookedItems (like calculateTotalAcceptanceFee does) can't see the individual
 * variants at all — it always returns 0 for these bookings, which used to silently fall through
 * to a single arbitrary PricingConfig record for the whole booking instead of summing.
 *
 * Each variant's own acceptance fee lives on its own per-variant PricingConfig row (matched by
 * `variantId`), not on the variant subdocument itself. Which variants were actually selected is
 * recovered from booking.dynamicFields's "Selected Variants" entry (the only place that survives
 * to the booking — see PremiumServiceDetailPage.jsx), formatted as e.g.
 * "AC Switchboard Installation (x1) (+₹100), 1 Switch (x1) (+₹120)".
 *
 * @param {Object} serviceDoc - Service doc with `variants` selected.
 * @param {Array}  dynamicFields - booking.dynamicFields.
 * @param {Array}  pricings - PricingConfig docs already fetched for this serviceId (reused, no extra query).
 * @param {Object} context - { zoneId, cityId, brandId } tie-break preference, mirroring the
 *                            existing single-pricing fallback's own preference order.
 * @returns {number} Total acceptance fee in rupees across every selected variant.
 */
const calculateVariantAcceptanceFee = (serviceDoc, dynamicFields, pricings, context = {}) => {
  let total = 0;
  if (!serviceDoc || !Array.isArray(serviceDoc.variants) || serviceDoc.variants.length === 0) return total;
  if (!Array.isArray(dynamicFields) || !Array.isArray(pricings) || pricings.length === 0) return total;

  const variantsField = dynamicFields.find(f => f.name === 'Selected Variants');
  if (!variantsField || !variantsField.value) return total;

  const entries = String(variantsField.value).split(',').map(s => s.trim()).filter(Boolean);

  for (const entry of entries) {
    const qtyMatch = entry.match(/\(x(\d+)\)/);
    const qty = qtyMatch ? (parseInt(qtyMatch[1], 10) || 1) : 1;
    const title = entry.replace(/\s*\(x\d+\)/, '').replace(/\s*\(\+₹[\d.]+\)/, '').trim();
    if (!title) continue;

    const matchedVariant = serviceDoc.variants.find(v => v.title === title) ||
      serviceDoc.variants.find(v => title.endsWith(` - ${v.title}`) || title.includes(v.title));
    if (!matchedVariant) continue;

    const variantId = String(matchedVariant._id);
    const variantPricings = pricings.filter(p => p.variantId && String(p.variantId) === variantId);
    if (variantPricings.length === 0) continue;

    let matched = null;
    if (context.zoneId) matched = variantPricings.find(p => p.zoneId && String(p.zoneId) === String(context.zoneId));
    if (!matched && context.cityId) matched = variantPricings.find(p => p.cityId && String(p.cityId) === String(context.cityId));
    if (!matched && context.brandId) matched = variantPricings.find(p => p.brandId && String(p.brandId) === String(context.brandId));
    if (!matched) matched = variantPricings.find(p => !p.zoneId && !p.cityId && !p.brandId) || variantPricings[0];

    if (matched && matched.vendorAcceptanceFee > 0) {
      total += matched.vendorAcceptanceFee * qty;
    }
  }

  return total;
};

/**
 * Same idea for the estimated vendor payout shown/used at accept time (booking.vendorShare
 * preview) — sum every booked item's package payout instead of only the first one.
 */
const calculateTotalPackagePayout = (serviceDoc, bookedItems) => {
  let total = 0;
  if (!serviceDoc || !Array.isArray(serviceDoc.packages) || serviceDoc.packages.length === 0 || !Array.isArray(bookedItems)) {
    return total;
  }

  for (const bookedItem of bookedItems) {
    const bookedItemTitle = bookedItem?.card?.title;
    const qty = Number(bookedItem?.quantity) || 1;
    if (!bookedItemTitle) continue;

    const matchedPkg = serviceDoc.packages.find(pkg =>
      pkg.title === bookedItemTitle ||
      bookedItemTitle.includes(pkg.title) ||
      pkg.title.includes(bookedItemTitle)
    );
    if (matchedPkg && matchedPkg.vendorPayout > 0) {
      total += matchedPkg.vendorPayout * qty;
    }
  }

  return total;
};

module.exports = { calculateTotalAcceptanceFee, calculateTotalPackagePayout, calculateVariantAcceptanceFee };
