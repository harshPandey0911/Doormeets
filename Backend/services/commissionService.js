const Booking = require('../models/Booking');
const Settings = require('../models/Settings');
const Transaction = require('../models/Transaction');

/**
 * Centrally processes booking completion, computes commission & records transaction ledger entries.
 * @param {string} bookingId - Mongoose Booking ID.
 */
async function processBookingCompletion(bookingId) {
  try {
    console.log(`[CommissionService] Processing booking completion for: ${bookingId}`);
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.error(`[CommissionService] Booking not found: ${bookingId}`);
      return { success: false, message: 'Booking not found' };
    }

    // 1. Load System Commission Rate from settings
    const settings = await Settings.findOne({ type: 'global' });
    const commissionPct = settings && settings.commissionPercentage !== undefined ? settings.commissionPercentage : 20;

    // 2. Determine base amount to calculate commission on (finalAmount / Grand Total)
    const amount = Number(booking.finalAmount || booking.basePrice || 0);

    // 3. Compute Splits (Use custom Price Matrix if configured, otherwise fallback to percentage split)
    let adminCommission = 0;
    let vendorShare = 0;

    // Check Combo Package Payout in Service Model first!
    let packageVendorPayout = 0;
    try {
      const Service = require('../models/Service');
      const serviceDoc = await Service.findById(booking.serviceId);
      if (serviceDoc && serviceDoc.packages && serviceDoc.packages.length > 0 && booking.bookedItems && booking.bookedItems.length > 0) {
        const bookedTitle = booking.bookedItems[0].card?.title;
        if (bookedTitle) {
          const matchingPackage = serviceDoc.packages.find(pkg => 
            pkg.title === bookedTitle || 
            bookedTitle.includes(pkg.title) || 
            pkg.title.includes(bookedTitle)
          );
          if (matchingPackage && matchingPackage.vendorPayout > 0) {
            packageVendorPayout = matchingPackage.vendorPayout;
          }
        }
      }
    } catch (err) {
      console.error('[CommissionService] Error finding package vendor payout:', err);
    }

    const PricingConfig = require('../models/PricingConfig');
    let pricing = null;

    if (packageVendorPayout === 0 && booking.serviceId) {
      const pricings = await PricingConfig.find({ serviceId: booking.serviceId });
      if (pricings.length > 0) {
        if (booking.cityId) {
          pricing = pricings.find(p => p.cityId && String(p.cityId) === String(booking.cityId));
        }
        if (!pricing && booking.brandId) {
          pricing = pricings.find(p => p.brandId && String(p.brandId) === String(booking.brandId));
        }
        if (!pricing) {
          pricing = pricings.find(p => !p.cityId && !p.brandId) || pricings[0];
        }
      }
    }

    if (packageVendorPayout > 0 || (pricing && pricing.vendorPayoutBase > 0)) {
      let totalVendorPayoutBase = packageVendorPayout > 0 ? packageVendorPayout : pricing.vendorPayoutBase;

      // Check if there is a generated VendorBill for this booking to aggregate addon prices
      try {
        const VendorBill = require('../models/VendorBill');
        const VendorServiceCatalog = require('../models/VendorServiceCatalog');
        const VendorPartsCatalog = require('../models/VendorPartsCatalog');

        const bill = await VendorBill.findOne({ bookingId: booking._id });
        if (bill) {
          // Add vendorPayoutBase for selected services
          if (bill.services && bill.services.length > 0) {
            const svcCatalogIds = bill.services.map(s => s.catalogId).filter(Boolean);
            const svcCatalogItems = await VendorServiceCatalog.find({ _id: { $in: svcCatalogIds } });
            const svcCatalogMap = {};
            svcCatalogItems.forEach(item => { svcCatalogMap[item._id.toString()] = item; });

            bill.services.forEach(s => {
              if (s.catalogId) {
                const catalogItem = svcCatalogMap[s.catalogId.toString()];
                if (catalogItem && catalogItem.vendorPayoutBase > 0) {
                  totalVendorPayoutBase += catalogItem.vendorPayoutBase * (s.quantity || 1);
                }
              }
            });
          }

          // Add vendorPayoutBase for selected parts
          if (bill.parts && bill.parts.length > 0) {
            const partCatalogIds = bill.parts.map(p => p.catalogId).filter(Boolean);
            const partCatalogItems = await VendorPartsCatalog.find({ _id: { $in: partCatalogIds } });
            const partCatalogMap = {};
            partCatalogItems.forEach(item => { partCatalogMap[item._id.toString()] = item; });

            bill.parts.forEach(p => {
              if (p.catalogId) {
                const catalogItem = partCatalogMap[p.catalogId.toString()];
                if (catalogItem && catalogItem.vendorPayoutBase > 0) {
                  totalVendorPayoutBase += catalogItem.vendorPayoutBase * (p.quantity || 1);
                }
              }
            });
          }
        }
      } catch (err) {
        console.error('[CommissionService] Error aggregating addon prices:', err);
      }

      let vPayoutBase = totalVendorPayoutBase;
      if (booking.bookingType === 'instant' && settings) {
        const vendorMarkupShare = settings.instantBookingVendorShare !== undefined ? settings.instantBookingVendorShare : 50;
        vPayoutBase += vendorMarkupShare;
      }
      const vSgstPct = pricing ? (pricing.vendorSgstPercentage ?? 2.5) : 2.5;
      const vCgstPct = pricing ? (pricing.vendorCgstPercentage ?? 2.5) : 2.5;
      const vTdsPct = pricing ? (pricing.vendorTdsPercentage ?? 0) : 0;
      const vCommPct = pricing ? (pricing.commissionPercentage ?? 10) : 10;

      vendorShare = parseFloat(vPayoutBase.toFixed(2));
      adminCommission = parseFloat((amount - vendorShare).toFixed(2));
    } else if (booking.bookingType === 'instant' && settings) {
      const markupFee = settings.instantBookingMarkup !== undefined ? settings.instantBookingMarkup : 99;
      const vendorMarkupShare = settings.instantBookingVendorShare !== undefined ? settings.instantBookingVendorShare : 50;
      const adminMarkupShare = Math.max(0, markupFee - vendorMarkupShare);

      const baseForCommission = Math.max(0, amount - markupFee);
      const baseAdminCommission = parseFloat(((baseForCommission * commissionPct) / 100).toFixed(2));
      const baseVendorShare = parseFloat((baseForCommission - baseAdminCommission).toFixed(2));

      adminCommission = parseFloat((baseAdminCommission + adminMarkupShare).toFixed(2));
      vendorShare = parseFloat((baseVendorShare + vendorMarkupShare).toFixed(2));
    } else {
      adminCommission = parseFloat(((amount * commissionPct) / 100).toFixed(2));
      vendorShare = parseFloat((amount - adminCommission).toFixed(2));
    }

    booking.totalAmount = amount;
    booking.adminCommission = adminCommission;
    booking.vendorShare = vendorShare;

    // 4. Map paymentMethod and set status values
    const originalMethod = (booking.paymentMethod || '').toLowerCase();
    const isCash = ['cash', 'pay_at_home', 'cash collected', 'hand_to_hand'].includes(originalMethod);

    if (isCash) {
      booking.paymentMethod = 'cash';
      booking.paymentStatus = 'completed';
      booking.commissionStatus = 'pending';
    } else {
      booking.paymentMethod = 'online';
      booking.paymentStatus = 'completed';
      booking.commissionStatus = 'received';
    }

    await booking.save();

    // 5. Create Ledger Transaction entry
    const vendorId = booking.vendorId || null;
    const type = isCash ? 'cash_collection' : 'online_collection';

    await Transaction.create({
      userId: booking.userId || null,
      vendorId: vendorId,
      bookingId: booking._id,
      amount: amount,
      type: type,
      status: 'completed',
      paymentMethod: isCash ? 'cash' : 'online',
      description: `${isCash ? 'Cash' : 'Online'} payment collection of ₹${amount} recorded for booking #${booking.bookingNumber}`,
      metadata: {
        adminCommission,
        vendorShare,
        commissionPercentage: commissionPct
      }
    });

    console.log(`[CommissionService] Booking #${booking.bookingNumber} completed successfully. Cash=${isCash}, Commission=${adminCommission}, VendorShare=${vendorShare}`);
    return { success: true, booking };
  } catch (error) {
    console.error('[CommissionService] Completion processing failed:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  processBookingCompletion
};
