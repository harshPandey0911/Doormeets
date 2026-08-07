const VendorBill = require('../../models/VendorBill');
const Booking = require('../../models/Booking');
const VendorServiceCatalog = require('../../models/VendorServiceCatalog');
const VendorPartsCatalog = require('../../models/VendorPartsCatalog');
const Settings = require('../../models/Settings');
const { BILL_STATUS } = require('../../utils/constants');

/**
 * Settle one service line — the originally booked service, or a vendor-added extra pulled
 * from the central VendorServiceCatalog library — through the exact same cascade used for the
 * main booking's commission split in services/commissionService.js:
 *   vendor payout base → sgst + cgst + platform commission (parallel, off the base) →
 *   remaining → level commission (off the remaining) → vendor's net earning.
 * Admin's margin is this item's GST-inclusive customer total minus the vendor's GROSS base
 * payout (before the cascade above), then split by the item's own GST% the same way the main
 * booking's admin margin is (see splitMarginGst in commissionService.js).
 */
const settleServiceLine = ({ itemTotal, vendorPayoutBase, gstPct, gstIncluded, sgstPct, cgstPct, platformCommPct, levelCommPct }) => {
  const base = Math.max(0, Number(vendorPayoutBase) || 0);
  const sgstAmount = base * (Number(sgstPct) || 0) / 100;
  const cgstAmount = base * (Number(cgstPct) || 0) / 100;
  const platformCommissionAmount = base * (Number(platformCommPct) || 0) / 100;

  const levelCommissionBasis = Math.max(0, base - sgstAmount - cgstAmount - platformCommissionAmount);
  const levelCommissionAmount = levelCommissionBasis * (Number(levelCommPct) || 0) / 100;

  const vendorEarning = Math.max(0, levelCommissionBasis - levelCommissionAmount);

  const adminMarginGross = Math.max(0, (Number(itemTotal) || 0) - base);
  const marginGst = parseFloat((adminMarginGross * (Number(gstPct) || 0) / 100).toFixed(2));
  const adminMarginNet = gstIncluded !== false ? parseFloat((adminMarginGross - marginGst).toFixed(2)) : adminMarginGross;

  return {
    vendorEarning: parseFloat(vendorEarning.toFixed(2)),
    sgstAmount: parseFloat(sgstAmount.toFixed(2)),
    cgstAmount: parseFloat(cgstAmount.toFixed(2)),
    platformCommissionAmount: parseFloat(platformCommissionAmount.toFixed(2)),
    levelCommissionAmount: parseFloat(levelCommissionAmount.toFixed(2)),
    adminMarginGross: parseFloat(adminMarginGross.toFixed(2)),
    adminMarginGst: marginGst,
    adminMarginNet
  };
};

/** Pick l1/l2/l3 commission % from a config-like object based on the vendor's assigned tier. */
const pickLevelCommission = (configObj, currentLevel, fallback) => {
  const level = String(currentLevel || 'L3').toUpperCase();
  if (!configObj) return fallback;
  if (level === 'L1') return configObj.l1Commission ?? fallback;
  if (level === 'L2') return configObj.l2Commission ?? fallback;
  return configObj.l3Commission ?? fallback;
};

/**
 * Create or Update Vendor Bill
 * ────────────────────────────
 * Revenue Model:
 *   Vendor → 70% of total service BASE (excl GST)
 *   Vendor → 10% of total parts BASE  (excl GST)
 *   GST   → 100% retained by company
 *
 * VendorBill is the SINGLE source of truth for earnings.
 * Booking does NOT store vendorEarnings/adminCommission.
 *
 * POST /api/vendors/bookings/:bookingId/bill
 */
const createOrUpdateBill = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { services, parts, customItems, transportCharges, applyPartsGST = true, note } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const { USER_ROLES } = require('../../utils/constants');

    if (!booking.vendorId) {
      return res.status(400).json({ success: false, message: 'Cannot generate bill for an unassigned booking' });
    }

    // Auth check: Vendor or assigned Worker
    const isVendorAuth = booking.vendorId.toString() === req.user.id && req.userRole === USER_ROLES.VENDOR;
    const isWorkerAuth = booking.workerId && booking.workerId.toString() === req.user.id && req.userRole === USER_ROLES.WORKER;

    if (!isVendorAuth && !isWorkerAuth) {
      return res.status(403).json({ success: false, message: 'Not authorized for this booking' });
    }

    // Always use the booking's vendorId for the bill
    const billVendorId = booking.vendorId;

    // ── Fetch Settings (frozen snapshot) + vendor's tier (drives level commission %) ──
    const settings = await Settings.findOne({ type: 'global' });
    const serviceSplitPct = settings?.servicePayoutPercentage ?? 70;
    const partsSplitPct = settings?.partsPayoutPercentage ?? 10;
    const serviceGstPct = settings?.serviceGstPercentage ?? 18;
    const partsGstPct = settings?.partsGstPercentage ?? 18;
    const globalPlatformCommPct = settings?.commissionPercentage ?? 0;
    const globalLevelDefaults = {
      l1Commission: settings?.commissionRates?.level1 ?? 10,
      l2Commission: settings?.commissionRates?.level2 ?? 15,
      l3Commission: settings?.commissionRates?.level3 ?? 20
    };

    const Vendor = require('../../models/Vendor');
    const vendorDoc = await Vendor.findById(billVendorId).select('currentLevel').lean();
    const vendorCurrentLevel = vendorDoc?.currentLevel || 'L3';
    const globalLevelCommPct = pickLevelCommission(globalLevelDefaults, vendorCurrentLevel, 0);

    // ═══════════════════════════════════════
    // 1. ORIGINAL SERVICE (from booking)
    // ═══════════════════════════════════════
    const isPlanBooking = booking.paymentMethod === 'plan_benefit';
    const basePriceRaw = Math.max(0, (booking.basePrice || 0) - (booking.discount || 0));
    const originalGST = isPlanBooking ? 0 : (booking.tax > 0 ? parseFloat(booking.tax.toFixed(2)) : parseFloat((basePriceRaw * (serviceGstPct / 100)).toFixed(2)));
    const originalServiceBaseForBill = isPlanBooking ? 0 : (booking.tax > 0 ? basePriceRaw : parseFloat((basePriceRaw - originalGST).toFixed(2)));
    const originalServiceBaseForEarnings = originalServiceBaseForBill;
    const visitingCharges = Number(booking.visitingCharges) || 0;

    // ═══════════════════════════════════════
    // 2. VENDOR-ADDED SERVICES (from the central VendorServiceCatalog library)
    // ═══════════════════════════════════════
    // Each add-on is settled through the exact same cascade as the originally booked service —
    // its OWN gst%, sgst/cgst%, platform commission and level commission (falling back to
    // global Settings when the catalog item doesn't override them), never a hardcoded 18%.
    const processedServices = [];
    const addonServiceSettlements = [];
    let vendorServiceBase = 0;
    let vendorServiceGST = 0;

    if (services && Array.isArray(services)) {
      for (const item of services) {
        let catalogItem = null;
        if (item.catalogId) {
          catalogItem = await VendorServiceCatalog.findById(item.catalogId);
        }

        const name = catalogItem ? catalogItem.name : item.name;
        // Treat catalog prices as GST-inclusive customer prices
        const customerPrice = catalogItem ? catalogItem.price : (Number(item.price) || 0);
        const quantity = Number(item.quantity) || 1;
        const itemGstPct = catalogItem ? Number(catalogItem.gstPercentage ?? serviceGstPct) : serviceGstPct;

        const totalInclusive = customerPrice * quantity;
        const gst = parseFloat((totalInclusive * (itemGstPct / 100)).toFixed(2));
        const base = parseFloat((totalInclusive - gst).toFixed(2));

        processedServices.push({
          catalogId: item.catalogId,
          name,
          price: base,
          gstPercentage: itemGstPct,
          quantity,
          gstAmount: gst,
          total: totalInclusive,
          isOriginal: false,
          note: item.note || ''
        });

        vendorServiceBase += base;
        vendorServiceGST += gst;

        // Vendor payout base for this add-on: catalog's own vendorPayoutBase if set, else the
        // same flat service-split fallback used for the original service.
        const itemVendorPayoutBase = (catalogItem && catalogItem.vendorPayoutBase > 0)
          ? catalogItem.vendorPayoutBase * quantity
          : parseFloat((base * (serviceSplitPct / 100)).toFixed(2));

        addonServiceSettlements.push(settleServiceLine({
          itemTotal: totalInclusive,
          vendorPayoutBase: itemVendorPayoutBase,
          gstPct: itemGstPct,
          gstIncluded: true,
          sgstPct: catalogItem ? Number(catalogItem.vendorSgstPercentage ?? 2.5) : 2.5,
          cgstPct: catalogItem ? Number(catalogItem.vendorCgstPercentage ?? 2.5) : 2.5,
          platformCommPct: catalogItem ? Number(catalogItem.platformCommission ?? globalPlatformCommPct) : globalPlatformCommPct,
          levelCommPct: catalogItem ? Number(pickLevelCommission(catalogItem, vendorCurrentLevel, globalLevelCommPct)) : globalLevelCommPct
        }));
      }
    }

    // ═══════════════════════════════════════
    // 3. PARTS
    // ═══════════════════════════════════════
    const processedParts = [];
    let totalPartsBase = 0;
    let partsGST = 0;

    if (parts && Array.isArray(parts)) {
      for (const item of parts) {
        let catalogItem = null;
        if (item.catalogId) {
          catalogItem = await VendorPartsCatalog.findById(item.catalogId);
        }

        const name = catalogItem ? catalogItem.name : item.name;
        const unitBasePrice = catalogItem ? catalogItem.price : (Number(item.price) || 0);
        const quantity = Number(item.quantity) || 1;
        const pGstPct = catalogItem ? (catalogItem.gstPercentage || partsGstPct) : (Number(item.gstPercentage) || partsGstPct);

        const base = unitBasePrice * quantity;
        // Honour the worker's GST toggle — if applyPartsGST=false, force zero GST
        const effectivePGstPct = applyPartsGST ? pGstPct : 0;
        const gst = applyPartsGST ? parseFloat(((base * pGstPct) / 100).toFixed(2)) : 0;

        processedParts.push({
          catalogId: item.catalogId,
          name,
          price: unitBasePrice,
          gstPercentage: effectivePGstPct,
          quantity,
          gstAmount: gst,
          total: parseFloat((base + gst).toFixed(2))
        });

        totalPartsBase += base;
        partsGST += gst;
      }
    }

    // ═══════════════════════════════════════
    // 3.5 CUSTOM ITEMS (treated as Parts for revenue logic)
    // ═══════════════════════════════════════
    const processedCustomItems = []; // To store in bill

    if (customItems && Array.isArray(customItems)) {
      for (const item of customItems) {
        const name = item.name || 'Custom Item';
        const unitBasePrice = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 1;
        // Default custom items to parts GST % if not provided (usually from settings)
        const cGstPct = Number(item.gstPercentage) || partsGstPct;

        const base = unitBasePrice * quantity;
        // Honour the worker's GST toggle — if applyPartsGST=false, force zero GST on custom items too
        const effectiveCGstPct = applyPartsGST ? cGstPct : 0;
        const gst = applyPartsGST ? parseFloat(((base * cGstPct) / 100).toFixed(2)) : 0;

        processedCustomItems.push({
          name,
          price: unitBasePrice,
          gstPercentage: effectiveCGstPct,
          quantity,
          gstAmount: gst,
          total: parseFloat((base + gst).toFixed(2)),
          hsnCode: item.hsnCode || '',
          gstApplicable: applyPartsGST
        });

        // Add to PARTS totals
        totalPartsBase += base;
        partsGST += gst;
      }
    }

    // ═══════════════════════════════════════
    // 4. AGGREGATION
    // ═══════════════════════════════════════
    const totalServiceBaseForBill = parseFloat((originalServiceBaseForBill + vendorServiceBase).toFixed(2));
    const totalServiceBaseForEarnings = parseFloat((originalServiceBaseForEarnings + vendorServiceBase).toFixed(2));
    totalPartsBase = parseFloat(totalPartsBase.toFixed(2));

    const totalGST = parseFloat((originalGST + vendorServiceGST + partsGST).toFixed(2));
    const finalTransportCharges = Number(transportCharges) || 0;
    const instantMarkup = booking.bookingType === 'instant' ? (parseFloat(booking.instantMarkupCharged) || 0) : 0;
    const grandTotal = parseFloat((totalServiceBaseForBill + totalPartsBase + totalGST + visitingCharges + finalTransportCharges + instantMarkup).toFixed(2));

    // ═══════════════════════════════════════
    // 5. REVENUE SPLIT (% applied on BASE only)
    // ═══════════════════════════════════════
    let packageVendorPayout = 0;
    try {
      const Service = require('../../models/Service');
      const serviceDoc = await Service.findById(booking.serviceId);
      if (serviceDoc && serviceDoc.packages && serviceDoc.packages.length > 0 && booking.bookedItems && booking.bookedItems.length > 0) {
        for (const bookedItem of booking.bookedItems) {
          const bookedTitle = bookedItem.card?.title;
          const qty = Number(bookedItem.quantity) || 1;
          if (bookedTitle) {
            const matchingPackage = serviceDoc.packages.find(pkg => 
              pkg.title === bookedTitle || 
              bookedTitle.includes(pkg.title) || 
              pkg.title.includes(bookedTitle)
            );
            if (matchingPackage && matchingPackage.vendorPayout > 0) {
              packageVendorPayout += matchingPackage.vendorPayout * qty;
            }
          }
        }
      }
    } catch (err) {
      console.error('Error finding package vendor payout:', err);
    }

    const PricingConfig = require('../../models/PricingConfig');
    let pricing = null;
    if (packageVendorPayout === 0 && booking.serviceId) {
      const pricings = await PricingConfig.find({ serviceId: booking.serviceId });
      if (pricings.length > 0) {
        if (booking.zoneId) {
          pricing = pricings.find(p => p.zoneId && String(p.zoneId) === String(booking.zoneId));
        }
        if (!pricing && booking.cityId) {
          pricing = pricings.find(p => p.cityId && String(p.cityId) === String(booking.cityId));
        }
        if (!pricing && booking.brandId) {
          pricing = pricings.find(p => p.brandId && String(p.brandId) === String(booking.brandId));
        }
        if (!pricing) {
          pricing = pricings.find(p => !p.zoneId && !p.cityId && !p.brandId) || pricings[0];
        }
      }
    }

    // Original service's vendor payout BASE (before the sgst/cgst/commission cascade below).
    let originalVendorPayoutBase = 0;
    if (packageVendorPayout > 0) {
      originalVendorPayoutBase = packageVendorPayout;
    } else if (pricing) {
      originalVendorPayoutBase = pricing.vendorPayoutBase !== undefined && pricing.vendorPayoutBase !== null ? pricing.vendorPayoutBase : 0;
    } else {
      originalVendorPayoutBase = parseFloat((originalServiceBaseForBill * (serviceSplitPct / 100)).toFixed(2));
    }

    // Settle the original service through the SAME cascade as every add-on service — sgst/cgst
    // + platform commission (off the base) → level commission (off what's left) → vendor's net.
    // This closes the gap where a booking with add-ons used to skip this cascade entirely for
    // its own original service and just hand the vendor the raw, undiminished payout base.
    const originalItemTotal = parseFloat((originalServiceBaseForBill + originalGST).toFixed(2));
    const originalSettlement = settleServiceLine({
      itemTotal: originalItemTotal,
      vendorPayoutBase: originalVendorPayoutBase,
      gstPct: pricing ? Number(pricing.gstPercentage ?? serviceGstPct) : serviceGstPct,
      gstIncluded: pricing ? (pricing.gstIncluded !== false) : true,
      sgstPct: pricing ? Number(pricing.vendorSgstPercentage ?? 2.5) : 2.5,
      cgstPct: pricing ? Number(pricing.vendorCgstPercentage ?? 2.5) : 2.5,
      platformCommPct: pricing ? Number(pricing.platformCommission ?? globalPlatformCommPct) : globalPlatformCommPct,
      levelCommPct: pricing ? Number(pickLevelCommission(pricing, vendorCurrentLevel, globalLevelCommPct)) : globalLevelCommPct
    });

    // Instant booking markup — a flat convenience fee on top of the cascade above, split
    // between vendor and platform by instantBookingVendorShare. Neither half is subject to
    // sgst/cgst/commission (it's not part of the taxable service cascade at all).
    let vendorInstantMarkupShare = 0;
    let adminInstantMarkupShare = 0;
    if (booking.bookingType === 'instant') {
      const configuredMarkup = settings?.instantBookingMarkup !== undefined ? settings.instantBookingMarkup : 99;
      vendorInstantMarkupShare = settings?.instantBookingVendorShare !== undefined ? settings.instantBookingVendorShare : 50;
      adminInstantMarkupShare = Math.max(0, configuredMarkup - vendorInstantMarkupShare);
    }

    let vendorServiceEarning = parseFloat((originalSettlement.vendorEarning + vendorInstantMarkupShare).toFixed(2));

    // Fold in every add-on service's settlement (computed alongside processedServices above).
    let vendorServiceSgst = originalSettlement.sgstAmount;
    let vendorServiceCgst = originalSettlement.cgstAmount;
    let platformCommissionAmount = originalSettlement.platformCommissionAmount;
    let levelCommissionAmount = originalSettlement.levelCommissionAmount;
    let adminMarginGross = originalSettlement.adminMarginGross;
    let adminMarginGst = originalSettlement.adminMarginGst;
    // adminInstantMarkupShare is added directly to the NET figure only — mirroring the vendor's
    // side, it's a flat untaxed bonus, not part of the taxable margin (adminMarginGross/Gst stay
    // scoped to the actual service). Previously this was never added anywhere in this
    // margin/profit calculation at all — companyRevenue (below) already netted it out correctly
    // via subtraction, but adminMarginGross/Net (and downstream platformCommission/
    // platformProfit) silently dropped the admin's share of every instant booking's markup.
    let adminMarginNet = parseFloat((originalSettlement.adminMarginNet + adminInstantMarkupShare).toFixed(2));

    addonServiceSettlements.forEach(s => {
      vendorServiceEarning = parseFloat((vendorServiceEarning + s.vendorEarning).toFixed(2));
      vendorServiceSgst = parseFloat((vendorServiceSgst + s.sgstAmount).toFixed(2));
      vendorServiceCgst = parseFloat((vendorServiceCgst + s.cgstAmount).toFixed(2));
      platformCommissionAmount = parseFloat((platformCommissionAmount + s.platformCommissionAmount).toFixed(2));
      levelCommissionAmount = parseFloat((levelCommissionAmount + s.levelCommissionAmount).toFixed(2));
      adminMarginGross = parseFloat((adminMarginGross + s.adminMarginGross).toFixed(2));
      adminMarginGst = parseFloat((adminMarginGst + s.adminMarginGst).toFixed(2));
      adminMarginNet = parseFloat((adminMarginNet + s.adminMarginNet).toFixed(2));
    });

    // Parts earnings (partsSplitPct) — kept as a flat split; parts are physical materials with
    // their own per-item GST%, not run through the sgst/cgst/commission cascade like labour.
    const vendorPartsEarning = parseFloat((totalPartsBase * (partsSplitPct / 100)).toFixed(2));

    const vendorTotalEarning = parseFloat((vendorServiceEarning + vendorPartsEarning).toFixed(2));
    const companyRevenue = parseFloat((grandTotal - vendorTotalEarning).toFixed(2));

    // Clean admin-facing totals: what was originally booked vs what got added on site.
    const totalServiceCharge = originalServiceBaseForBill;
    const totalAddonCharge = parseFloat((vendorServiceBase + totalPartsBase).toFixed(2));

    // ═══════════════════════════════════════
    // 6. ALL SERVICES (original + vendor-added)
    // ═══════════════════════════════════════
    const allServices = [
      {
        name: booking.serviceName || 'Original Service',
        price: originalServiceBaseForBill,
        gstPercentage: serviceGstPct,
        quantity: 1,
        gstAmount: originalGST,
        total: parseFloat((originalServiceBaseForBill + originalGST).toFixed(2)),
        isOriginal: true
      },
      ...processedServices
    ];

    // ═══════════════════════════════════════
    // 7. SAVE BILL
    // ═══════════════════════════════════════
    let bill = await VendorBill.findOne({ bookingId });

    const billData = {
      vendorId: billVendorId,
      services: allServices,
      parts: processedParts,
      customItems: processedCustomItems,
      originalServiceBase: originalServiceBaseForBill,
      vendorServiceBase: parseFloat(vendorServiceBase.toFixed(2)),
      totalServiceBase: totalServiceBaseForBill,
      totalPartsBase,
      originalGST,
      vendorServiceGST: parseFloat(vendorServiceGST.toFixed(2)),
      partsGST: parseFloat(partsGST.toFixed(2)),
      totalGST,
      visitingCharges,
      transportCharges: finalTransportCharges,
      grandTotal,
      payoutConfig: {
        serviceSplitPercentage: serviceSplitPct,
        partsSplitPercentage: partsSplitPct,
        serviceGstPercentage: serviceGstPct,
        partsGstPercentage: partsGstPct
      },
      vendorServiceEarning,
      vendorPartsEarning,
      vendorTotalEarning,
      vendorInstantMarkupEarning: vendorInstantMarkupShare,
      companyRevenue,
      // Clean admin-facing breakdown — see model comments for what each figure represents.
      vendorServiceSgst,
      vendorServiceCgst,
      platformCommissionAmount,
      levelCommissionAmount,
      adminMarginGross,
      adminMarginGst,
      adminMarginNet,
      totalServiceCharge,
      totalAddonCharge,
      applyPartsGST,
      status: BILL_STATUS.GENERATED,
      generatedAt: new Date(),
      note: note !== undefined ? note : (bill ? bill.note : null)
    };

    if (bill) {
      Object.assign(bill, billData);
      await bill.save();
    } else {
      bill = await VendorBill.create({ bookingId, ...billData });
    }

    // ═══════════════════════════════════════
    // 8. UPDATE BOOKING (no earnings!)
    // ═══════════════════════════════════════
    booking.finalAmount = grandTotal;
    booking.userPayableAmount = grandTotal;
    booking.vendorBillId = bill._id;
    await booking.save();

    // Emit real-time update to the user
    try {
      const { getIO } = require('../../sockets');
      const io = getIO();
      if (io) {
        io.to(`user_${booking.userId.toString()}`).emit('booking_updated', {
          bookingId: booking._id.toString(),
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          finalAmount: booking.finalAmount,
          totalAmount: booking.totalAmount,
          bill: bill,
          message: 'Professional has added addon services to your booking.'
        });
      }
    } catch (sockErr) {
      console.error('Failed to emit socket update for addon bill:', sockErr);
    }

    res.status(200).json({
      success: true,
      message: 'Bill generated successfully',
      bill,
      financials: {
        grandTotal,
        vendorTotalEarning,
        companyRevenue,
        // Clean summary for the admin panel: what the customer paid, split by originally-booked
        // vs added-on-site, plus the admin's own margin net of its GST.
        adminSummary: {
          customerPaid: grandTotal,
          totalServiceCharge,
          totalAddonCharge,
          totalGST,
          vendorProfit: vendorTotalEarning,
          adminMarginGross,
          adminMarginGst,
          adminProfit: adminMarginNet
        },
        breakdown: {
          serviceBase: totalServiceBaseForBill,
          partsBase: totalPartsBase,
          totalGST
        }
      }
    });

  } catch (error) {
    console.error('Create bill error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate bill' });
  }
};

/**
 * Get Bill by Booking ID
 * GET /api/vendors/bookings/:bookingId/bill
 */
const getBillByBookingId = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const { USER_ROLES } = require('../../utils/constants');

    if (!booking.vendorId) {
      return res.status(200).json({ success: true, bill: null, message: 'Booking is unassigned. No bill exists.' });
    }

    const isVendorAuth = booking.vendorId.toString() === req.user.id && req.userRole === USER_ROLES.VENDOR;
    const isWorkerAuth = booking.workerId && booking.workerId.toString() === req.user.id && req.userRole === USER_ROLES.WORKER;

    if (!isVendorAuth && !isWorkerAuth) {
      return res.status(403).json({ success: false, message: 'Not authorized for this booking' });
    }

    const bill = await VendorBill.findOne({ bookingId }).populate('services.catalogId parts.catalogId');

    if (!bill) {
      // Return 200 instead of 404 to gracefully tell the frontend that a bill is not yet created
      // This prevents Ugly `404 (Not Found)` network errors in the console from Axios on page load
      return res.status(200).json({ success: true, bill: null, message: 'Bill not found' });
    }

    res.status(200).json({ success: true, bill });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch bill' });
  }
};

module.exports = {
  createOrUpdateBill,
  getBillByBookingId
};
