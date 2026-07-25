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

    if (booking.commissionStatus && booking.commissionStatus !== 'none') {
      console.log(`[CommissionService] Booking #${bookingId} commission already processed.`);
      return { success: true, booking };
    }

    // 1. Load System Commission Rate from settings
    const settings = await Settings.findOne({ type: 'global' });
    const commissionPct = settings && settings.commissionPercentage !== undefined ? settings.commissionPercentage : 20;

    // 2. Determine base amount to calculate commission on (finalAmount / Grand Total)
    const amount = Number(booking.finalAmount || booking.basePrice || 0);

    // 3. Compute Splits (Use custom Price Matrix if configured, otherwise fallback to percentage split)
    let adminCommission = 0;
    let vendorShare = 0;

    let basePayout = 0;
    let acceptanceFee = 0;

    // Check Combo Package Payout / Options Group Payout in Service Model first!
    try {
      const Service = require('../models/Service');
      const serviceDoc = await Service.findById(booking.serviceId).select('serviceType packages serviceGroups').lean();
      if (serviceDoc) {
        const bookedTitle = booking.bookedItems?.[0]?.card?.title;
        if (bookedTitle) {
          // A. Check Option Groups first
          if (Array.isArray(serviceDoc.serviceGroups)) {
            for (const grp of serviceDoc.serviceGroups) {
              if (Array.isArray(grp.items)) {
                const matchedItem = grp.items.find(item => 
                  item.title === bookedTitle || 
                  bookedTitle.endsWith(` - ${item.title}`) || 
                  bookedTitle.includes(item.title) ||
                  item.title.includes(bookedTitle)
                );
                if (matchedItem) {
                  basePayout = Number(matchedItem.vendorPayout) || 0;
                  acceptanceFee = Number(matchedItem.vendorAcceptanceFee) || 0;
                  break;
                }
              }
            }
          }
          // B. Check Combo Packages
          if (basePayout === 0 && Array.isArray(serviceDoc.packages)) {
            const matchedPkg = serviceDoc.packages.find(pkg => 
              pkg.title === bookedTitle || 
              bookedTitle.endsWith(` - ${pkg.title}`) || 
              bookedTitle.includes(pkg.title) ||
              pkg.title.includes(bookedTitle)
            );
            if (matchedPkg) {
              basePayout = Number(matchedPkg.vendorPayout) || 0;
              acceptanceFee = Number(matchedPkg.vendorAcceptanceFee) || 0;
            }
          }
        }
      }
    } catch (err) {
      console.error('[CommissionService] Error finding package vendor payout:', err);
    }

    const PricingConfig = require('../models/PricingConfig');
    let pricing = null;

    if (basePayout === 0 && booking.serviceId) {
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
      if (pricing) {
        basePayout = pricing.vendorPayoutBase !== undefined && pricing.vendorPayoutBase !== null ? pricing.vendorPayoutBase : 0;
        acceptanceFee = pricing.vendorAcceptanceFee !== undefined && pricing.vendorAcceptanceFee !== null ? pricing.vendorAcceptanceFee : 0;
      }
    }

    // Fallback for acceptanceFee from Category if still 0
    if (acceptanceFee === 0 && booking.categoryId) {
      try {
        const Category = require('../models/Category');
        const cat = await Category.findById(booking.categoryId).select('minWalletBalance').lean();
        if (cat && cat.minWalletBalance > 0) {
          acceptanceFee = cat.minWalletBalance;
        }
      } catch (err) {}
    }

    // If we have a basePayout resolved, calculate the exact matrix requested by user
    if (basePayout > 0) {
      let instantShare = 0;
      if (booking.bookingType === 'instant' && settings) {
        instantShare = settings.instantBookingVendorShare !== undefined ? settings.instantBookingVendorShare : 50;
      }

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
                  basePayout += catalogItem.vendorPayoutBase * (s.quantity || 1);
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
                  basePayout += catalogItem.vendorPayoutBase * (p.quantity || 1);
                }
              }
            });
          }
        }
      } catch (err) {
        console.error('[CommissionService] Error aggregating addon prices:', err);
      }

      // vPayoutBase is base + instant - acceptanceFee
      const vPayoutBase = basePayout + instantShare - acceptanceFee;

      // Platform commission percentage: use pricing commission (default 25%)
      const vCommPct = pricing ? (pricing.commissionPercentage ?? 25) : 25;
      const vSgstPct = 2.5;
      const vCgstPct = 2.5;
      const levelWiseChargePct = 0; // Currently 0%

      const platformCommission = vPayoutBase * (vCommPct / 100);
      const sgst = vPayoutBase * (vSgstPct / 100);
      const cgst = vPayoutBase * (vCgstPct / 100);
      const levelCharge = vPayoutBase * (levelWiseChargePct / 100);

      const totalDeductions = platformCommission + sgst + cgst + levelCharge;
      
      vendorShare = parseFloat(Math.max(0, vPayoutBase - totalDeductions).toFixed(2));
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

    // 6. Update Vendor's wallet balance (Sole source of wallet updates now!)
    if (vendorId) {
      const Vendor = require('../models/Vendor');
      const vendor = await Vendor.findById(vendorId);
      if (vendor) {
        if (!vendor.wallet) {
          vendor.wallet = { dues: 0, earnings: 0, totalCashCollected: 0, totalWithdrawn: 0, totalSettled: 0, cashLimit: 10000, credits: 0 };
        }
        
        if (isCash) {
          // Cash booking: dues increase by total amount, credits increase by vendorShare / 10
          vendor.wallet.dues = parseFloat(((vendor.wallet.dues || 0) + amount).toFixed(2));
          vendor.wallet.credits = parseFloat(((vendor.wallet.credits || 0) + (vendorShare / 10)).toFixed(2));
          vendor.wallet.totalCashCollected = parseFloat(((vendor.wallet.totalCashCollected || 0) + amount).toFixed(2));
        } else {
          // Online booking: only credits increase by vendorShare / 10 (no dues change)
          vendor.wallet.credits = parseFloat(((vendor.wallet.credits || 0) + (vendorShare / 10)).toFixed(2));
        }
        // Sync earnings value as well (credits * 10)
        vendor.wallet.earnings = parseFloat((vendor.wallet.credits * 10).toFixed(2));

        // Block checks
        const netOwed = (vendor.wallet.dues || 0) - (vendor.wallet.earnings || 0);
        const cashLimit = vendor.wallet.cashLimit || 10000;
        if (netOwed > cashLimit) {
          vendor.wallet.isBlocked = true;
          vendor.wallet.blockedAt = new Date();
          vendor.wallet.blockReason = `Cash limit exceeded. Net owed: ₹${netOwed.toFixed(2)}, Limit: ₹${cashLimit}`;
          
          // Notify admins
          try {
            const { createNotification } = require('../notificationControllers/notificationController');
            const Admin = require('../models/Admin');
            const admins = await Admin.find({ isActive: true }).select('_id');
            for (const admin of admins) {
              await createNotification({
                adminId: admin._id,
                type: 'vendor_cash_limit_exceeded',
                title: '⚠️ Cash Limit Exceeded',
                message: `${vendor.businessName || vendor.name} exceeded cash limit! Net owed: ₹${netOwed.toFixed(2)}, Limit: ₹${cashLimit}`,
                relatedId: vendor._id,
                relatedType: 'vendor',
                data: {
                  vendorId: vendor._id,
                  vendorName: vendor.businessName || vendor.name,
                  netOwed,
                  cashLimit
                },
                pushData: {
                  type: 'admin_alert',
                  link: '/admin/settlements'
                }
              });
            }
          } catch (notifyErr) {
            console.error('[CommissionService] Failed to notify admins about cash limit block:', notifyErr);
          }
        }

        await vendor.save();
        console.log(`[CommissionService] Updated wallet for Vendor ${vendorId}. Dues: ${vendor.wallet.dues}, Credits: ${vendor.wallet.credits}`);
      }
    }

    // 7. Create earnings credit transaction for ledger visibility
    if (vendorId && vendorShare > 0) {
      await Transaction.create({
        vendorId: vendorId,
        bookingId: booking._id,
        amount: vendorShare,
        type: 'earnings_credit',
        status: 'completed',
        paymentMethod: 'system',
        description: `Earnings ₹${vendorShare} credited for booking #${booking.bookingNumber}`,
        metadata: {
          type: 'earnings_increase',
          vendorShare
        }
      });
    }

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
