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

module.exports = { calculateTotalAcceptanceFee, calculateTotalPackagePayout };
