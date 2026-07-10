const VendorBill = require('../../models/VendorBill');
const Booking = require('../../models/Booking');
const VendorServiceCatalog = require('../../models/VendorServiceCatalog');
const VendorPartsCatalog = require('../../models/VendorPartsCatalog');
const Settings = require('../../models/Settings');
const { BILL_STATUS } = require('../../utils/constants');

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

    // ── Fetch Settings (frozen snapshot) ──
    const settings = await Settings.findOne({ type: 'global' });
    const serviceSplitPct = settings?.servicePayoutPercentage ?? 70;
    const partsSplitPct = settings?.partsPayoutPercentage ?? 10;
    const serviceGstPct = settings?.serviceGstPercentage ?? 18;
    const partsGstPct = settings?.partsGstPercentage ?? 18;

    // ═══════════════════════════════════════
    // 1. ORIGINAL SERVICE (from booking)
    // ═══════════════════════════════════════
    const isPlanBooking = booking.paymentMethod === 'plan_benefit';
    const basePriceRaw = booking.basePrice || 0;
    const originalGST = isPlanBooking ? 0 : (booking.tax > 0 ? parseFloat(booking.tax.toFixed(2)) : parseFloat((basePriceRaw * (serviceGstPct / 100)).toFixed(2)));
    const originalServiceBaseForBill = isPlanBooking ? 0 : (booking.tax > 0 ? basePriceRaw : parseFloat((basePriceRaw - originalGST).toFixed(2)));
    const originalServiceBaseForEarnings = originalServiceBaseForBill;
    const visitingCharges = Number(booking.visitingCharges) || 0;

    // ═══════════════════════════════════════
    // 2. VENDOR-ADDED SERVICES
    // ═══════════════════════════════════════
    const processedServices = [];
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

        const totalInclusive = customerPrice * quantity;
        const gst = parseFloat((totalInclusive * 0.18).toFixed(2));
        const base = parseFloat((totalInclusive - gst).toFixed(2));

        processedServices.push({
          catalogId: item.catalogId,
          name,
          price: base,
          gstPercentage: serviceGstPct,
          quantity,
          gstAmount: gst,
          total: totalInclusive,
          isOriginal: false,
          note: item.note || ''
        });

        vendorServiceBase += base;
        vendorServiceGST += gst;
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
      console.error('Error finding package vendor payout:', err);
    }

    const PricingConfig = require('../../models/PricingConfig');
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

    let vendorServiceEarning = 0;
    if (packageVendorPayout > 0) {
      vendorServiceEarning = packageVendorPayout;
    } else if (pricing) {
      vendorServiceEarning = pricing.vendorPayoutBase !== undefined && pricing.vendorPayoutBase !== null ? pricing.vendorPayoutBase : 0;
    } else {
      vendorServiceEarning = parseFloat((originalServiceBaseForBill * (serviceSplitPct / 100)).toFixed(2));
    }

    // Add vendor's instant booking markup share if applicable
    let vendorInstantMarkupShare = 0;
    if (booking.bookingType === 'instant') {
      vendorInstantMarkupShare = settings?.instantBookingVendorShare !== undefined ? settings.instantBookingVendorShare : 50;
      vendorServiceEarning = parseFloat((vendorServiceEarning + vendorInstantMarkupShare).toFixed(2));
    }

    // Add extra services vendor earnings (using catalog vendorPayoutBase if configured)
    let extraServicesEarning = 0;
    if (services && Array.isArray(services)) {
      for (const item of services) {
        let catalogItem = null;
        if (item.catalogId) {
          catalogItem = await VendorServiceCatalog.findById(item.catalogId);
        }
        const qty = Number(item.quantity) || 1;
        if (catalogItem && catalogItem.vendorPayoutBase !== undefined && catalogItem.vendorPayoutBase > 0) {
          extraServicesEarning += catalogItem.vendorPayoutBase * qty;
        } else {
          const unitPrice = catalogItem ? catalogItem.price : (Number(item.price) || 0);
          extraServicesEarning += parseFloat(((unitPrice * qty) * (serviceSplitPct / 100)).toFixed(2));
        }
      }
    }
    vendorServiceEarning = parseFloat((vendorServiceEarning + extraServicesEarning).toFixed(2));

    // Parts earnings (partsSplitPct)
    const vendorPartsEarning = parseFloat((totalPartsBase * (partsSplitPct / 100)).toFixed(2));

    const vendorTotalEarning = parseFloat((vendorServiceEarning + vendorPartsEarning).toFixed(2));
    const companyRevenue = parseFloat((grandTotal - vendorTotalEarning).toFixed(2));

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
