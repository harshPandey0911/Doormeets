const mongoose = require('mongoose');
const Booking = require('../../models/Booking');
const Service = require('../../models/Service');
const Category = require('../../models/Category');
const Cart = require('../../models/Cart');
const User = require('../../models/User');
const Vendor = require('../../models/Vendor');
const Review = require('../../models/Review');
const { validationResult } = require('express-validator');
const { BOOKING_STATUS, PAYMENT_STATUS } = require('../../utils/constants');
const { createNotification } = require('../notificationControllers/notificationController');
const { sendNotificationToUser, sendNotificationToVendor, sendNotificationToWorker } = require('../../services/firebaseAdmin');

/**
 * Create a new booking
 */
const createBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    let {
      serviceId,
      vendorId,
      address,
      scheduledDate,
      scheduledTime,
      timeSlot,
      userNotes,
      paymentMethod,
      amount,
      isPlusAdded,
      bookedItems, // Array of specific items from cart
      visitingCharges: reqVisitingCharges,
      visitationFee: reqVisitationFee, // Backward compatibility
      basePrice: reqBasePrice,
      discount: reqDiscount,
      tax: reqTax,
      // Metadata from frontend
      serviceCategory: reqServiceCategory,
      categoryIcon: reqCategoryIcon,
      brandName: reqBrandName,
      brandIcon: reqBrandIcon,
      bookingType, // Extract bookingType
      isConsultation,
      promoCode,
      dynamicFields,
      redeemLoyaltyPoints,
      applyWallet,
      walletAmountRequested
    } = req.body;

    let visitingCharges = reqVisitingCharges !== undefined ? reqVisitingCharges : (reqVisitationFee || 0);

    // Calculate total value from booked items or fallback to base (Move to top)
    let totalServiceValue = 0;
    if (bookedItems && bookedItems.length > 0) {
      totalServiceValue = bookedItems.reduce((sum, item) => {
        const itemPrice = item.card?.price || item.price || 0;
        return sum + (itemPrice * (item.quantity || 1));
      }, 0);
    }
    // Note: Fallback to service.basePrice is done later if totalServiceValue is 0 AND service is loaded.
    // But we need 'service' to define fallback.
    // 'service' is loaded at line 46.
    // So we must calculate it AFTER loading service but BEFORE usage.
    // Usage is at line 98. Service loaded at 46.
    // So distinct placement: AFTER line 52.

    // Handle serviceId if it's an object (from populated cart data)
    if (typeof serviceId === 'object' && serviceId._id) {
      serviceId = serviceId._id;
    }

    // 1. Parallel Fetching: Service and User
    const [service, user] = await Promise.all([
      Service.findById(serviceId).select('title basePrice discountPrice description images iconUrl categoryId category categoryIds type isConsultation').lean(),
      User.findById(userId).select('name phone wallet plans loyaltyPoints')
    ]);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // 2. Fetch Category if exists
    const categoryId = service.categoryId || service.categoryIds?.[0];
    const category = categoryId ? await Category.findById(categoryId).select('title icon image slug').lean() : null;

    // Calculate total value from booked items or fallback to service base price
    if (totalServiceValue === 0) {
      totalServiceValue = service.basePrice || 500;
    }

    // Check for Pending Penalty
    const pendingPenalty = user.wallet?.penalty || 0;

    // --- VENDOR SEARCH LOGIC ---
    const { findNearbyVendors, geocodeAddress } = require('../../services/locationService');
    let nearbyVendors = [];

    // Determine booking location (prioritize frontend coordinates)
    let bookingLocation;
    if (address.lat && address.lng) {
      bookingLocation = { lat: address.lat, lng: address.lng };
    } else {
      bookingLocation = await geocodeAddress(
        `${address.addressLine1}, ${address.city}, ${address.state} ${address.pincode}`
      );
    }

    if (vendorId) {
      // DIRECT BOOKING: User picked a specific vendor
      console.log(`[CreateBooking] Direct booking for vendorId: ${vendorId}`);
      const targetVendor = await Vendor.findById(vendorId).select('name businessName phone address isOnline availability approvalStatus isActive geoLocation settings');
      
      if (!targetVendor) {
        return res.status(404).json({ success: false, message: 'The selected vendor was not found.' });
      }

      // Check if vendor is online/available
      if (!targetVendor.isOnline || targetVendor.availability === 'OFFLINE') {
        return res.status(400).json({ 
          success: false, 
          message: `${targetVendor.businessName || targetVendor.name} is currently offline. Please try another vendor or book later.` 
        });
      }

      // If online, they are the only target
      const vendorObj = targetVendor.toObject();
      vendorObj.distance = 0; // Dist is not critical for direct booking
      nearbyVendors = [vendorObj];
    } else {
      // Sync geoLocation coordinates from address.lat/lng for all approved/active/online vendors who have no real-time coordinates
      try {
        await Vendor.updateMany(
          {
            isActive: true,
            approvalStatus: 'APPROVED',
            isOnline: true,
            $or: [
              { geoLocation: { $exists: false } },
              { 'geoLocation.coordinates': [0, 0] }
            ],
            'address.lat': { $ne: null },
            'address.lng': { $ne: null }
          },
          [
            {
              $set: {
                geoLocation: {
                  type: 'Point',
                  coordinates: ['$address.lng', '$address.lat']
                }
              }
            }
          ]
        );
      } catch (syncErr) {
        console.error('[CreateBooking] Background vendor geoLocation sync failed:', syncErr);
      }

      // Find vendors who offer the category of this service
      let qualifiedVendorIds = [];
      const searchCategoryTitle = category ? category.title : (reqServiceCategory || service.category);
      
      if (category || searchCategoryTitle) {
        const searchArray = [];
        if (searchCategoryTitle) {
          searchArray.push(new RegExp(`^${searchCategoryTitle.trim()}$`, 'i'));
        }
        if (category) {
          searchArray.push(category._id.toString());
        }
        
        // Find vendors who have the category ID or category Title
        const vendorQuery = {
          isActive: true,
          categories: { $in: searchArray }
        };
        
        if (isConsultation) {
          vendorQuery.isConsultant = true;
        }

        const matchingVendors = await Vendor.find(vendorQuery).select('_id').lean();
        
        qualifiedVendorIds = Array.from(new Set(matchingVendors.map(v => v._id.toString())));
      }

      console.log(`[CreateBooking] Found ${qualifiedVendorIds.length} vendors offering category "${category ? category.title : 'Unknown'}" globally.`);

      if (qualifiedVendorIds.length === 0) {
        nearbyVendors = [];
      } else {
        // Find qualified vendors who are nearby
        const vendorFilters = {
          _id: { $in: qualifiedVendorIds },
          checkCashLimit: paymentMethod === 'cash',
          city: address.city
        };

        console.log(`[CreateBooking] Searching for ${qualifiedVendorIds.length} specific vendors near user location...`);
        nearbyVendors = await findNearbyVendors(bookingLocation, 10, vendorFilters);
        console.log(`[CreateBooking] Found ${nearbyVendors.length} qualified vendors within 10km.`);
      }
    }

    console.log(`[CreateBooking] Targeting ${nearbyVendors.length} vendors for this booking`);
    // --- END VENDOR SEARCH BLOCK ---

    // Calculate pricing - use amount from frontend if provided, otherwise calculate
    let basePrice, discount, tax, finalAmount;
    let bookingStatus = nearbyVendors.length === 0 ? 'pending_admin' : BOOKING_STATUS.SEARCHING;
    let bookingPaymentStatus = PAYMENT_STATUS.PENDING;

    // -------------------------------------------------------------------------
    // PRICING CALCULATION LOGIC
    // -------------------------------------------------------------------------

    // 1. Determine if we can use Plan Benefits
    let usePlanBenefits = false;
    if (paymentMethod === 'plan_benefit') {
      if (user.plans && user.plans.isActive) {
        if (user.plans.expiry && new Date() > new Date(user.plans.expiry)) {
          // Plan expired - update status and FALLBACK to normal
          console.log(`[CreateBooking] Plan expired for user ${userId}. Falling back to normal booking.`);
          user.plans.isActive = false;
          await user.save();
          paymentMethod = 'pay_at_home'; // Fallback to Pay at Home
        } else {
          usePlanBenefits = true;
        }
      } else {
        // No active plan or invalid status - Fallback
        paymentMethod = 'pay_at_home';
      }
    }

    // 2. Logic Branch: Plan Benefit vs Standard
    if (usePlanBenefits) {
      const Plan = require('../../models/Plan');
      const userPlan = await Plan.findOne({ name: user.plans.name });

      if (!userPlan) {
        // Fallback if data missing (rare)
        usePlanBenefits = false;
        paymentMethod = 'pay_at_home';
      } else {
        // Check Coverage
        const isCategoryCovered = categoryId && userPlan.freeCategories &&
          userPlan.freeCategories.some(cat => String(cat) === String(categoryId));
        const isServiceCovered = serviceId && userPlan.freeServices &&
          userPlan.freeServices.some(svc => String(svc) === String(serviceId));

        if (isCategoryCovered || isServiceCovered) {
          // >>> APPLY FREE PRICING <<<
          basePrice = totalServiceValue > 0 ? totalServiceValue : (service.basePrice || 500);
          discount = basePrice; // Full discount
          tax = 0;
          visitingCharges = 0;
          finalAmount = pendingPenalty; // User only pays penalty

          bookingStatus = BOOKING_STATUS.SEARCHING;
          bookingPaymentStatus = finalAmount > 0 ? PAYMENT_STATUS.PENDING : PAYMENT_STATUS.PLAN_COVERED;
        } else {
          // Not covered -> Fallback
          usePlanBenefits = false;
          paymentMethod = 'pay_at_home';
        }
      }
    }

    // 3. Standard Pricing (Fallback) if NOT using Plan Benefits
    if (!usePlanBenefits) {
      if (amount && amount > 0) {
        // Use amount from frontend logic
        if (reqBasePrice !== undefined && reqTax !== undefined) {
          // Use breakdown provided by frontend
          basePrice = reqBasePrice;
          discount = reqDiscount || 0;
          tax = reqTax;
          visitingCharges = (reqVisitingCharges !== undefined) ? reqVisitingCharges : (visitingCharges || 0);
          finalAmount = (basePrice - discount + tax + visitingCharges) + pendingPenalty;
        } else {
          // Accurate calculation without aggressive rounding to prevent 1-rupee gap
          if (!visitingCharges) visitingCharges = 0;
          const totalAfterCharges = amount - visitingCharges;
          basePrice = parseFloat((totalAfterCharges / 1.18).toFixed(2));
          tax = parseFloat((totalAfterCharges - basePrice).toFixed(2));
          discount = 0;
          finalAmount = amount + pendingPenalty;
        }
      } else {
        // Fallback to service pricing (if no amount sent)
        if (!visitingCharges) visitingCharges = 0;
        const serviceBase = service.basePrice || 500;
        const serviceDiscount = service.discountPrice ? (serviceBase - service.discountPrice) : 0;
        let netBase = serviceBase - serviceDiscount;

        // Dynamic Pricing Rule calculation:
        try {
          const PricingRule = require('../../models/PricingRule');
          const rules = await PricingRule.find({ serviceId });
          if (rules && rules.length > 0) {
            const fieldInputs = {};
            if (Array.isArray(dynamicFields)) {
              dynamicFields.forEach(f => {
                fieldInputs[f.name] = f.value;
              });
            }
            const { evaluatePricingRules } = require('../../utils/pricingEngine');
            netBase = evaluatePricingRules(netBase, rules, fieldInputs);
          }
        } catch (ruleErr) {
          console.error('[CreateBooking] Dynamic pricing evaluation failed:', ruleErr);
        }

        basePrice = netBase;
        discount = serviceDiscount;
        tax = parseFloat((netBase * 0.18).toFixed(2));
        finalAmount = parseFloat((netBase + tax + visitingCharges).toFixed(2)) + pendingPenalty;
      }
    }

    // Calculate Instant Booking Surcharge
    let instantMarkupCharged = 0;
    if (bookingType === 'instant' && paymentMethod !== 'plan_benefit') {
      const Settings = require('../../models/Settings');
      const globalSettings = await Settings.findOne({ type: 'global' }).lean();
      if (globalSettings?.isInstantBookingEnabled !== false) {
        instantMarkupCharged = globalSettings?.instantBookingMarkup !== undefined ? globalSettings.instantBookingMarkup : 99;
        finalAmount = parseFloat((finalAmount + instantMarkupCharged).toFixed(2));
      }
    }

    // Calculate Loyalty Points Redemption
    let pointsToRedeem = 0;
    if (redeemLoyaltyPoints && (paymentMethod === 'razorpay' || paymentMethod === 'wallet' || paymentMethod === 'online' || paymentMethod === 'pay_at_home' || paymentMethod === 'cash')) {
      const orderNetValue = Math.max(0, basePrice - discount + tax + visitingCharges);
      const Settings = require('../../models/Settings');
      const globalSettings = await Settings.findOne({ type: 'global' }).lean();
      const redemptionRate = globalSettings?.loyaltyPointsRedemptionRate !== undefined ? globalSettings.loyaltyPointsRedemptionRate : 1;
      
      const pointsNeeded = Math.ceil(orderNetValue / redemptionRate);
      pointsToRedeem = Math.min(user.loyaltyPoints || 0, pointsNeeded);
      const loyaltyDiscount = pointsToRedeem * redemptionRate;
      
      if (pointsToRedeem > 0) {
        finalAmount = Math.max(0, finalAmount - loyaltyDiscount);
        user.loyaltyPoints = (user.loyaltyPoints || 0) - pointsToRedeem;
      }
    }

    // Generate unique booking number
    const bookingNumber = `BK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Calculate and Apply Wallet Balance (max percentage limit from settings)
    let walletAmountUsed = 0;
    if (applyWallet !== false && user.wallet && user.wallet.balance > 0 && finalAmount > 0 && paymentMethod !== 'plan_benefit') {
      const Settings = require('../../models/Settings');
      const globalSettings = await Settings.findOne({ type: 'global' }).lean();
      const maxWalletUsagePercentage = globalSettings?.maxWalletUsagePercentage !== undefined ? globalSettings.maxWalletUsagePercentage : 30;

      if (maxWalletUsagePercentage > 0) {
        const maxWalletUse = finalAmount * (maxWalletUsagePercentage / 100);
        let allowedMax = Math.min(user.wallet.balance, maxWalletUse);
        allowedMax = parseFloat(allowedMax.toFixed(2));

        if (walletAmountRequested !== undefined && walletAmountRequested !== null) {
          walletAmountUsed = Math.min(parseFloat(walletAmountRequested) || 0, allowedMax);
        } else {
          walletAmountUsed = allowedMax;
        }
        walletAmountUsed = parseFloat(walletAmountUsed.toFixed(2));

        if (walletAmountUsed > 0) {
          finalAmount = parseFloat((finalAmount - walletAmountUsed).toFixed(2));
          user.wallet.balance = parseFloat((user.wallet.balance - walletAmountUsed).toFixed(2));
        }
      }
    }

    // NOTE: vendor earnings are NOT calculated at booking creation.
    // They are computed ONLY at bill generation (completeSelfJob) and stored in VendorBill.
    // This prevents inconsistency between Booking and VendorBill.
    console.log(`[CreateBooking] Payment=${paymentMethod}, FinalAmount=${finalAmount}, Penalty=${pendingPenalty}, pointsToRedeem=${pointsToRedeem}, walletAmountUsed=${walletAmountUsed}`);

    // Save user if we modified penalty, points, or wallet balance
    if (pendingPenalty > 0 || pointsToRedeem > 0 || walletAmountUsed > 0) {
      if (pendingPenalty > 0) {
        user.wallet.penalty = 0;
      }
      await user.save();
    }

    // Ensure minimum amount for Razorpay (₹1) for paid bookings
    if (finalAmount < 1 && paymentMethod !== 'plan_benefit') {
      finalAmount = 1;
    }

    // Improve Category Fetching if ID is missing (Fallback to title match)
    let finalCategory = category;
    if (!finalCategory && service.category) {
      // Try finding by name if ID lookup failed
      const Category = require('../../models/Category');
      finalCategory = await Category.findOne({ title: service.category });
    }

    // Map booked items to new schema (sectionTitle -> brandName)
    const formattedBookedItems = (Array.isArray(bookedItems) && bookedItems.length > 0) ? bookedItems.map(item => ({
      brandName: item.brandName || item.sectionTitle || item.brand || '', // Robust fallback
      brandIcon: item.brandIcon || item.sectionIcon || item.icon || null,
      card: item.card || item,
      quantity: item.quantity || 1
    })) : [];

    console.log('[CreateBooking] About to save with formatted items:', JSON.stringify(formattedBookedItems, null, 2));

    // Extract Visual Identity Details
    const categoryIcon = finalCategory?.icon || finalCategory?.image || service.iconUrl || 'https://cdn-icons-png.flaticon.com/512/3500/3500833.png';
    let brandName = null;
    let brandIcon = null;

    if (formattedBookedItems.length > 0) {
      // Try to find a distinct brand name
      const distinctBrands = [...new Set(formattedBookedItems.map(item => item.brandName).filter(Boolean))];
      if (distinctBrands.length > 0) {
        brandName = distinctBrands.join(', ');
      }

      // Try to find brand icon
      brandIcon = formattedBookedItems[0].brandIcon || null;
    }

    const isBiddingRequired = !!(finalCategory?.isBiddingEnabled || finalAmount === 0 || service.type === 'product');
    const biddingDeadline = isBiddingRequired ? new Date(Date.now() + 5 * 60 * 1000) : null;

    let computedCodAdvanceAmount = 0;
    if (paymentMethod === 'pay_at_home' && service) {
      const actualServiceType = service.serviceType || service.type;
      if (actualServiceType === 'package_base' && service.packages && service.packages.length > 0) {
        const pkgTitle = formattedBookedItems[0]?.card?.title || service.title;
        const matchedPkg = service.packages.find(p => p.title === pkgTitle);
        if (matchedPkg && matchedPkg.codEnabled !== false) {
          computedCodAdvanceAmount = matchedPkg.codAdvanceAmount || 0;
        }
      } else {
        if (service.codEnabled !== false) {
          computedCodAdvanceAmount = service.codAdvanceAmount || 0;
        }
      }
    }

    if (paymentMethod === 'pay_at_home' && computedCodAdvanceAmount > 0 && walletAmountUsed > 0) {
      computedCodAdvanceAmount = Math.max(0, computedCodAdvanceAmount - walletAmountUsed);
    }

    const booking = await Booking.create({
      bookingNumber,
      codAdvanceAmount: computedCodAdvanceAmount,
      userId,
      vendorId: null, // Will be assigned when vendor accepts
      serviceId,
      categoryId: finalCategory?._id || categoryId,
      serviceName: service.title,
      serviceCategory: reqServiceCategory || finalCategory?.title || service.category || 'General',
      // Visual Identity Fields
      categoryIcon: reqCategoryIcon || categoryIcon,
      brandName: reqBrandName || brandName,
      brandIcon: reqBrandIcon || brandIcon,
      bookingType: bookingType || 'scheduled',
      isConsultation: isConsultation || service.isConsultation || false,
      instantMarkupCharged,

      description: service.description,
      serviceImages: service.images || [],
      bookedItems: formattedBookedItems,
      basePrice,
      discount,
      tax,
      visitingCharges,
      finalAmount,
      userPayableAmount: finalAmount,
      loyaltyPointsRedeemed: pointsToRedeem,
      address: {
        type: address.type || 'home',
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 || '',
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        landmark: address.landmark || '',
        lat: address.lat || null,
        lng: address.lng || null
      },
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      timeSlot: {
        start: timeSlot.start,
        end: timeSlot.end
      },
      serviceType: service.type || 'service',
      paymentMethod: isBiddingRequired ? 'bidding' : (paymentMethod || null),
      status: isBiddingRequired ? BOOKING_STATUS.BIDDING : bookingStatus,
      paymentStatus: isBiddingRequired ? PAYMENT_STATUS.PENDING : bookingPaymentStatus,
      biddingDeadline: biddingDeadline,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes search limit (sequential takes time)
      dynamicFields: dynamicFields || [],
      walletAmountApplied: walletAmountUsed
    });

    // Generate visits for this booking based on its workflow configuration
    try {
      const { scheduleVisitsForBooking } = require('../../services/workflowScheduler');
      await scheduleVisitsForBooking(booking);
    } catch (schedErr) {
      console.error('[CreateBooking] Workflow visits scheduling failed:', schedErr);
    }

    // Create Wallet debit transaction log
    if (walletAmountUsed > 0) {
      try {
        const Transaction = require('../../models/Transaction');
        await Transaction.create({
          userId,
          bookingId: booking._id,
          amount: walletAmountUsed,
          type: 'debit',
          paymentMethod: 'wallet',
          status: 'completed',
          description: `Applied ₹${walletAmountUsed} wallet balance (max limit discount) to booking #${bookingNumber}`,
          balanceAfter: user.wallet.balance
        });
      } catch (txnErr) {
        console.error('[CreateBooking] Failed to log wallet transaction:', txnErr);
      }
    }

    // Create Loyalty Points debit transaction log
    if (pointsToRedeem > 0) {
      try {
        const Transaction = require('../../models/Transaction');
        await Transaction.create({
          userId: user._id,
          bookingId: booking._id,
          type: 'debit',
          amount: pointsToRedeem,
          status: 'completed',
          paymentMethod: 'system',
          description: `Redeemed ${pointsToRedeem} Loyalty Points for booking ${booking.bookingNumber}`,
          metadata: { type: 'loyalty_points', pointsRedeemed: pointsToRedeem }
        });
      } catch (txErr) {
        console.error('[CreateBooking] Error creating loyalty points transaction log:', txErr);
      }
    }

    // --- IMMEDIATE RESPONSE ---
    // Send immediate response to the client. All subsequent operations will run in the background.
    const responsePayload = {
      success: true,
      message: nearbyVendors.length === 0 ? 'No vendors available at the moment.' : 'Booking created successfully. We are finding vendors for you.',
      data: {
        _id: booking._id,
        bookingNumber: booking.bookingNumber,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        finalAmount: booking.finalAmount,
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime,
        address: booking.address,
        serviceName: booking.serviceName,
        categoryIcon: booking.categoryIcon,
        brandName: booking.brandName,
        brandIcon: booking.brandIcon,
      }
    };

    if (nearbyVendors.length === 0) {
      responsePayload.noVendorsFound = true;
      
      // Save notification in database for all admins
      try {
        const User = require('../../models/User');
        const { createNotification } = require('../notificationControllers/notificationController');
        const admins = await User.find({ role: 'ADMIN' });
        
        const notificationData = {
          userId: null,
          vendorId: null,
          workerId: null,
          type: 'admin_booking_requested',
          title: 'Manual Assignment Needed',
          message: `Booking #${booking.bookingNumber} has no available vendors. Manual assignment needed.`,
          priority: 'high',
          pushData: {
            type: 'admin_booking_requested',
            bookingId: booking._id.toString(),
            link: `/admin/bookings/${booking._id}`
          }
        };
        
        await Promise.all(
          admins.map(admin =>
            createNotification({ ...notificationData, adminId: admin._id })
          )
        );
      } catch (dbNotifErr) {
        console.error('[CreateBooking] Failed to save admin notification:', dbNotifErr);
      }

      // Emit socket notification to admins immediately!
      try {
        const { getIO } = require('../../sockets');
        const io = getIO();
        if (io) {
          console.log(`[CreateBooking] No vendors found. Emitting admin_booking_requested to all_admins for booking ${booking.bookingNumber}`);
          io.to('all_admins').emit('admin_booking_requested', {
            bookingId: booking._id.toString(),
            bookingNumber: booking.bookingNumber,
            status: 'pending_admin',
            message: 'Booking request sent to admin for manual assignment.'
          });
        }
      } catch (sockErr) {
        console.error('[CreateBooking] Socket emission failed:', sockErr);
      }
    }

    res.status(201).json(responsePayload);

    // --- DEFERRED POST-BOOKING OPERATIONS ---
    // All operations below will run non-blocking after the HTTP response has been sent.
    setImmediate(async () => {
      try {
        if (promoCode) {
          const upperCode = promoCode.trim().toUpperCase();
          const PromoCode = require('../../models/PromoCode');
          const Voucher = require('../../models/Voucher');

          // Check if it's a PromoCode
          const promoResult = await PromoCode.findOneAndUpdate({ code: upperCode }, { $inc: { usageCount: 1 } });
          if (promoResult) {
            console.log(`[CreateBooking][bg] Promo code usage count incremented for ${upperCode}`);
          } else {
            // Check if it's a Voucher
            const voucher = await Voucher.findOne({ code: upperCode });
            if (voucher) {
              voucher.redeemedBy.push({ userId, redeemedAt: new Date() });
              voucher.usageCount += 1;
              await voucher.save();
              console.log(`[CreateBooking][bg] Gift voucher redemption recorded for ${upperCode}`);
            }
          }
        }

        // Re-fetch user and booking for background tasks to ensure latest state
        const userForBackground = await User.findById(userId);
        const bookingForBackground = await Booking.findById(booking._id)
          .populate('userId', 'name phone email')
          .populate('serviceId', 'title iconUrl')
          .populate('categoryId', 'title slug');
        const serviceForBackground = await Service.findById(serviceId); // Re-fetch service if needed

        if (!userForBackground || !bookingForBackground || !serviceForBackground) {
          console.error('[CreateBooking] Background task failed: User, Booking or Service not found after initial creation.');
          return;
        }

        // If Plus membership was added, update user status
        if (isPlusAdded) {
          const expiryDate = new Date();
          expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year membership
          userForBackground.plans = {
            isActive: true,
            name: 'Plus Membership',
            expiry: expiryDate,
            price: 999 // Or fetch based on constants if needed, hardcoding placeholder or 0
          };
          await userForBackground.save();
          console.log(`User ${userId} upgraded to Plus Membership until ${expiryDate}`);
        }

        // Group qualified vendors by Level (L1 -> Wave 1, L2 -> Wave 2, L3 -> Wave 3)
        // Also sort them internally by distance
        const getPriority = (v) => {
          const cLevel = String(v.currentLevel || '').toUpperCase();
          if (cLevel === 'L1' || v.level === 1) return 1;
          if (cLevel === 'L2' || v.level === 2) return 2;
          return 3;
        };

        const sortedVendors = nearbyVendors.sort((a, b) => {
          const pA = getPriority(a);
          const pB = getPriority(b);
          if (pA !== pB) return pA - pB;
          return (a.distance || 0) - (b.distance || 0);
        });

        // Determine if this is a Product (Broadcast to all) or Service (Wave based)
        const categoryForBackground = await Category.findById(serviceForBackground.categoryId);
        const isProduct = 
          serviceForBackground.type === 'product' || 
          bookingForBackground.serviceType === 'product' ||
          categoryForBackground?.categoryType === 'product';

        // Assign waves to vendors
        const potentialVendorsWithWaves = sortedVendors.map((v, index) => {
          return {
            vendorId: v._id,
            distance: v.distance || 0,
            wave: isProduct ? 1 : index + 1 // Sequential waves for services, broadcast for products
          };
        });

        // Find the lowest wave that has vendors
        const initialWave = potentialVendorsWithWaves.length > 0 
          ? Math.min(...potentialVendorsWithWaves.map(v => v.wave)) 
          : 1;

        // Get initial wave vendors
        const initialWaveVendorsDetails = potentialVendorsWithWaves.filter(v => v.wave === initialWave);
        const initialWaveVendorsIds = initialWaveVendorsDetails.map(v => v.vendorId);
        const initialWaveVendors = sortedVendors.filter(v => initialWaveVendorsIds.some(id => id.toString() === v._id.toString()));

        console.log(`[CreateBooking] ${isProduct ? 'PRODUCT' : 'SERVICE'} Flow: Wave ${initialWave} will notify ${initialWaveVendors.length} vendors`);

        // Store all potential vendors in booking for scheduler to use
        bookingForBackground.potentialVendors = potentialVendorsWithWaves.map(v => ({
          vendorId: v.vendorId,
          distance: v.distance,
          wave: v.wave
        }));
        bookingForBackground.currentWave = initialWave;
        bookingForBackground.waveStartedAt = new Date();
        bookingForBackground.notifiedVendors = initialWaveVendors.map(v => v._id);
        await bookingForBackground.save();

        if (initialWaveVendors.length > 0) {
          console.log(`[CreateBooking] Wave ${initialWave}: Alerting ${initialWaveVendors.length} closest vendors (of ${sortedVendors.length} total)`);

          // Create BookingRequest entries for initial wave vendors
          const BookingRequest = require('../../models/BookingRequest');
          const bookingRequests = initialWaveVendors.map(vendor => ({
            bookingId: bookingForBackground._id,
            vendorId: vendor._id,
            status: 'PENDING',
            wave: initialWave,
            distance: vendor.distance || null,
            sentAt: new Date(),
            expiresAt: new Date(Date.now() + 60 * 60 * 1000) // Expires in 1 hour
          }));

          try {
            await BookingRequest.insertMany(bookingRequests, { ordered: false });
            console.log(`[CreateBooking] Created ${bookingRequests.length} BookingRequest entries`);
          } catch (err) {
            // Ignore duplicate key errors (if retrying)
            if (err.code !== 11000) console.error('[CreateBooking] BookingRequest insert error:', err);
          }
        } else {
          console.warn(`[CreateBooking] NO VENDORS FOUND nearby! Push notifications will not be sent.`);
          bookingForBackground.status = 'pending_admin';
          await bookingForBackground.save();

          // Save notification in database for all admins
          try {
            const User = require('../../models/User');
            const { createNotification } = require('../notificationControllers/notificationController');
            const admins = await User.find({ role: 'ADMIN' });
            
            const notificationData = {
              userId: null,
              vendorId: null,
              workerId: null,
              type: 'admin_booking_requested',
              title: 'Manual Assignment Needed',
              message: `Booking #${bookingForBackground.bookingNumber} has no available vendors. Manual assignment needed.`,
              priority: 'high',
              pushData: {
                type: 'admin_booking_requested',
                bookingId: bookingForBackground._id.toString(),
                link: `/admin/bookings/${bookingForBackground._id}`
              }
            };
            
            await Promise.all(
              admins.map(admin =>
                createNotification({ ...notificationData, adminId: admin._id })
              )
            );
          } catch (dbNotifErr) {
            console.error('[CreateBooking] Failed to save background admin notification:', dbNotifErr);
          }

          // Emit to all admins
          const { getIO } = require('../../sockets');
          const io = getIO();
          if (io) {
            io.to('all_admins').emit('admin_booking_requested', {
              bookingId: bookingForBackground._id.toString(),
              bookingNumber: bookingForBackground.bookingNumber,
              status: 'pending_admin',
              message: 'No online vendors available. Booking request sent to admin for manual assignment.'
            });
          }
        }

        // Send notifications to initial wave vendors ONLY
        // 1. Emit Socket.IO event FIRST (Instant & Reliable)
        const { getIO } = require('../../sockets');
        const io = getIO();
        if (io) {
          console.log(`[CreateBooking] Emitting Socket.IO events to ${initialWaveVendors.length} vendors in Wave ${initialWave}...`);
          initialWaveVendors.forEach(vendor => {
            const vendorRoom = `vendor_${vendor._id.toString()}`;
            console.log(`[Wave ${initialWave}] Emitting to ${vendorRoom} (dist: ${vendor.distance?.toFixed(1) || 'N/A'}km)`);
            io.to(vendorRoom).emit('new_booking_request', {
              bookingId: bookingForBackground._id,
              serviceName: serviceForBackground.title,
              customerName: userForBackground.name,
              scheduledDate: scheduledDate,
              scheduledTime: scheduledTime,
              price: finalAmount,
              address: address,
              distance: vendor.distance,
              serviceCategory: bookingForBackground.serviceCategory,
              brandName: bookingForBackground.brandName,
              brandIcon: bookingForBackground.brandIcon,
              categoryIcon: bookingForBackground.categoryIcon,
              createdAt: bookingForBackground.createdAt || new Date(),
              expiresAt: new Date(new Date(bookingForBackground.createdAt || Date.now()).getTime() + (60 * 1000)).toISOString(),
              status: bookingForBackground.status,
              serviceType: bookingForBackground.serviceType || 'service',
              playSound: true,
              message: `New booking request within ${vendor.distance?.toFixed(1) || '?'}km!`
            });
          });
        }

        // 2. Send Firebase/FCM notifications (External service - call AFTER socket)
        try {
          const vendorNotifications = initialWaveVendors.map(vendor =>
            createNotification({
              vendorId: vendor._id,
              type: 'booking_request',
              title: 'New Booking Request',
              message: `New service request for ${serviceForBackground.title} from ${userForBackground.name}`,
              relatedId: bookingForBackground._id,
              relatedType: 'booking',
              data: {
                bookingId: bookingForBackground._id,
                serviceName: serviceForBackground.title,
                customerName: userForBackground.name,
                scheduledDate: scheduledDate,
                scheduledTime: scheduledTime,
                location: address,
                price: finalAmount,
                distance: vendor.distance
              },
              pushData: {
                type: 'new_booking',
                dataOnly: false,
                link: `/vendor/bookings/${bookingForBackground._id}`
              }
            })
          );
          await Promise.all(vendorNotifications);
        } catch (notifError) {
          console.error('[CreateBooking] Firebase/Notification Error (Non-blocking):', notifError.message);
        }

        // NOTIFY USER: Send actionable notification so they can track status
        await createNotification({
          userId,
          type: 'booking_requested',
          title: 'Booking Created',
          message: `Your booking ${bookingForBackground.bookingNumber} has been created successfully.`,
          relatedId: bookingForBackground._id,
          relatedType: 'booking',
          pushData: {
            type: 'booking_requested',
            bookingId: bookingForBackground._id.toString(),
            link: `/user/booking/${bookingForBackground._id}`
            // dataOnly: true // Removed to ensure User sees the visual notification
          }
        });
        // Clear cart — single atomic operation
        await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });
        console.log(`[CreateBooking][bg] Cart cleared for user ${userId}`);

        // Send vendor notification if it was a direct booking (vendorId provided)
        if (vendorId) {
          await createNotification({
            vendorId,
            type: 'booking_created',
            title: 'New Booking Received',
            message: `You have received a new booking ${bookingForBackground.bookingNumber} for ${serviceForBackground.title}.`,
            relatedId: bookingForBackground._id,
            relatedType: 'booking'
          });
        }

        // Send confirmation emails (fire-and-forget — never blocks)
        const vendorObj = vendorId ? await require('../../models/Vendor').findById(vendorId).lean() : null;
        const { sendBookingEmails } = require('../../services/emailService');
        sendBookingEmails(bookingForBackground, userForBackground, vendorObj, serviceForBackground)
          .catch(err => console.error('[CreateBooking][bg] Email error:', err));

      } catch (bgErr) {
        console.error('[CreateBooking][bg] Background task failed:', bgErr);
      }
    });

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking. Please try again.'
    });
  }
};

/**
 * Get user bookings with filters
 */
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;

    // Build query
    const query = { userId };
    if (status) {
      if (status.includes(',')) {
        query.status = { $in: status.split(',') };
      } else {
        query.status = status;
      }
    } else {
      // Default: Fetch all, including SEARCHING. Frontend will filter for active.
    }
    if (startDate || endDate) {
      query.scheduledDate = {};
      if (startDate) query.scheduledDate.$gte = new Date(startDate);
      if (endDate) query.scheduledDate.$lte = new Date(endDate);
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get bookings
    const bookings = await Booking.find(query)
      .populate('vendorId', 'name businessName profilePhoto')
      .populate('serviceId', 'title iconUrl')
      .populate('categoryId', 'title slug')
      .populate('workerId', 'name profilePhoto')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count
    const total = await Booking.countDocuments(query);

    // Apply Settings Privacy Masks for Customers
    const Settings = require('../../models/Settings');
    const globalSettings = await Settings.findOne({ type: 'global' }).lean();
    const showVendorNameToUser = globalSettings ? globalSettings.showVendorNameToUser !== false : true;
    const showVendorPhoneToUser = globalSettings ? globalSettings.showVendorPhoneToUser !== false : true;

    for (const b of bookings) {
      if (b.vendorId) {
        if (!showVendorNameToUser) {
          b.vendorId.name = "Service Provider";
          b.vendorId.businessName = "Service Provider";
        }
        if (!showVendorPhoneToUser) {
          b.vendorId.phone = undefined;
          b.vendorId.email = undefined;
        }
      }
    }

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings. Please try again.'
    });
  }
};

/**
 * Get booking details by ID
 */
const getBookingById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const booking = await Booking.findOne({ _id: id, userId })
      .select('+visitOtp +paymentOtp') // Include secure OTPs for the user
      .populate('userId', 'name phone email')
      .populate('vendorId', 'name businessName phone email address profilePhoto')
      .populate('serviceId', 'title description iconUrl images')
      .populate('categoryId', 'title slug')
      .populate('workerId', 'name phone rating totalJobs location profilePhoto')
      .lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    const Settings = require('../../models/Settings');
    const globalSettings = await Settings.findOne({ type: 'global' }).lean();
    const showVendorNameToUser = globalSettings ? globalSettings.showVendorNameToUser !== false : true;
    const showVendorPhoneToUser = globalSettings ? globalSettings.showVendorPhoneToUser !== false : true;

    const phoneRevealedStatuses = ['visited', 'in_progress', 'work_done', 'final_settlement', 'completed'];
    const canSeePhone = phoneRevealedStatuses.includes(booking.status) && showVendorPhoneToUser;
    
    if (booking.vendorId) {
      if (!showVendorNameToUser) {
        booking.vendorId.name = "Service Provider";
        booking.vendorId.businessName = "Service Provider";
      }
      if (!canSeePhone) {
        booking.vendorId.phone = undefined;
        booking.vendorId.email = undefined;
      }
    }
    if (booking.workerId && !canSeePhone) {
      booking.workerId.phone = undefined;
    }

    // Fetch Vendor Bill if exists
    const VendorBill = require('../../models/VendorBill');
    const bill = await VendorBill.findOne({ bookingId: booking._id });

    // Convert to object to attach bill
    const bookingData = booking;
    if (bill) {
      bookingData.bill = bill;
    }

    res.status(200).json({
      success: true,
      data: bookingData
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking. Please try again.'
    });
  }
};

/**
 * Cancel booking
 */
const cancelBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { id } = req.params;
    const { cancellationReason } = req.body;

    const booking = await Booking.findOne({ _id: id, userId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking can be cancelled
    if (booking.status === BOOKING_STATUS.CANCELLED) {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      });
    }

    if (booking.status === BOOKING_STATUS.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed booking'
      });
    }

    // Cancellation window check: strictly 3 minutes from booking creation
    const timeSinceBookingMs = Date.now() - new Date(booking.createdAt).getTime();
    if (timeSinceBookingMs > 3 * 60 * 1000) { // 3 minutes in ms
      return res.status(400).json({
        success: false,
        message: 'You can only cancel a booking within 3 minutes of creating it.'
      });
    }

    // --- REFUND & CANCELLATION FEE LOGIC ---
    let refundAmount = 0;
    let cancellationFee = 0;
    let refundMessage = '';

    // Fetch dynamic cancellation penalty from Settings
    const Settings = require('../../models/Settings');
    let settingsPenalty = 49; // Default
    try {
      const globalSettings = await Settings.findOne({ type: 'global' });
      if (globalSettings && globalSettings.cancellationPenalty !== undefined) {
        settingsPenalty = globalSettings.cancellationPenalty;
      }
    } catch (err) {
      console.error('Error fetching settings for cancellation penalty:', err);
    }

    const hasStartedJourney = !!booking.journeyStartedAt;
    const isPaid = booking.paymentStatus === PAYMENT_STATUS.SUCCESS;
    const isWalletOrOnline = ['wallet', 'razorpay', 'upi', 'card'].includes(booking.paymentMethod);
    const isCash = booking.paymentMethod === 'cash';

    if (hasStartedJourney) {
      // SCENARIO: Worker/Vendor already started journey

      const hasReached = !!booking.visitedAt || booking.status === 'visited';

      if (hasReached) {
        // Professional Reached -> Full Visiting Charges
        cancellationFee = booking.visitingCharges || 49;
      } else {
        // Before Arrival (Journey Started) -> Dynamic Penalty
        cancellationFee = settingsPenalty;
      }

      if (isPaid && isWalletOrOnline) {
        // User paid upfront -> Refund (Total - Fee)
        refundAmount = Math.max(0, booking.finalAmount - cancellationFee);
        refundMessage = `Booking cancelled after ${hasReached ? 'professional arrival' : 'journey start'}. Refund of ₹${refundAmount} initiated (Cancellation Fee: ₹${cancellationFee} deducted).`;
      } else {
        // User hasn't paid (e.g. COD or pending) -> Add Penalty to Wallet for Next Booking
        refundAmount = 0;
        refundMessage = `Booking cancelled after ${hasReached ? 'professional arrival' : 'journey start'}. A cancellation fee of ₹${cancellationFee} has been added to your account and will be charged on your next booking.`;

        // We will add this to user.wallet.penalty below
      }
    } else {
      // SCENARIO: Cancelled before journey start
      // Policy: Full Refund
      cancellationFee = 0;

      if (isPaid && isWalletOrOnline) {
        refundAmount = booking.finalAmount;
        refundMessage = `Booking cancelled successfully. Full refund of ₹${refundAmount} initiated to your wallet.`;
      } else {
        refundAmount = 0;
        refundMessage = 'Booking cancelled successfully.';
      }
    }

    // Update User Wallet
    if (refundAmount > 0 || (cancellationFee > 0 && !isPaid)) {
      const User = require('../../models/User');
      const Transaction = require('../../models/Transaction');

      const user = await User.findById(userId);

      // 1. Process Refund
      if (refundAmount > 0) {
        user.wallet.balance = (user.wallet.balance || 0) + refundAmount;

        await Transaction.create({
          userId: user._id,
          type: 'refund',
          amount: refundAmount,
          status: 'completed',
          paymentMethod: 'wallet',
          description: `Refund for booking #${booking.bookingNumber}`,
          bookingId: booking._id,
          balanceAfter: user.wallet.balance
        });

        booking.paymentStatus = PAYMENT_STATUS.REFUNDED;
      }

      // 2. Process Cancellation Fee (Add to Penalty Bucket if Unpaid)
      if (cancellationFee > 0 && !isPaid) {
        // Use wallet.penalty bucket
        user.wallet.penalty = (user.wallet.penalty || 0) + cancellationFee;
        // Do NOT create a 'debit' transaction yet, as money hasn't left. 
        // Or create a 'penalty_added' transaction?
        // User didn't ask for transaction record logic, just functionality.
        // We will skip transaction for penalty addition to keep it simple, 
        // as the actual CHARGE happens on next booking creation.

        console.log(`[CancelBooking] Added penalty of ₹${cancellationFee} to user ${userId}. Total Penalty: ${user.wallet.penalty}`);
      }

      await user.save();
    }

    // Update booking status
    booking.status = BOOKING_STATUS.CANCELLED;
    booking.cancelledAt = new Date();
    booking.cancelledBy = 'user';
    booking.cancellationReason = cancellationReason || 'Cancelled by user';

    await booking.save();

    // Send notification to user
    await createNotification({
      userId,
      type: 'booking_cancelled',
      title: 'Booking Cancelled',
      message: refundMessage || `Your booking ${booking.bookingNumber} has been cancelled.`,
      relatedId: booking._id,
      relatedType: 'booking',
      pushData: {
        type: 'booking_cancelled',
        bookingId: booking._id.toString(),
        link: `/user/booking/${booking._id}`
      }
    });

    // Manual FCM push removed (handled by createNotification)

    // Send notification to vendor
    if (booking.vendorId) {
      await createNotification({
        vendorId: booking.vendorId,
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        message: `Booking ${booking.bookingNumber} has been cancelled by the customer.`,
        relatedId: booking._id,
        relatedType: 'booking',
        pushData: {
          type: 'booking_cancelled',
          bookingId: booking._id.toString(),
          link: `/vendor/bookings/${booking._id}`
        }
      });
      // Manual FCM push removed
    }

    // Notify worker if assigned
    if (booking.workerId) {
      await createNotification({
        workerId: booking.workerId,
        type: 'booking_cancelled',
        title: 'Booking Cancelled',
        message: `Job ${booking.bookingNumber} has been cancelled by the customer.`,
        relatedId: booking._id,
        relatedType: 'booking',
        pushData: {
          type: 'job_cancelled',
          bookingId: booking._id.toString(),
          link: `/worker/job/${booking._id}`
        }
      });
      // Manual FCM push removed
    }

    // ── Update Vendor Performance Stats & Availability ──
    if (booking.vendorId) {
      try {
        const { updateVendorStats } = require('../../utils/vendorStatsHelper');
        updateVendorStats(booking.vendorId);

        // Also free up the vendor's availability so they appear online to new users
        const Vendor = require('../../models/Vendor');
        await Vendor.findByIdAndUpdate(booking.vendorId, {
          availability: 'AVAILABLE',
          workStatus: 'available',
          availabilityStatus: 'ONLINE',
          reservedFrom: null,
          reservedBookingId: null
        });
        await Vendor.updateWorkStatus(booking.vendorId);
      } catch (statsErr) {
        console.error('Error updating vendor stats after user cancellation:', statsErr);
      }
    }

    res.status(200).json({
      success: true,
      message: refundMessage || 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking. Please try again.'
    });
  }
};

/**
 * Reschedule booking
 */
const rescheduleBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { id } = req.params;
    const { scheduledDate, scheduledTime, timeSlot } = req.body;

    const booking = await Booking.findOne({ _id: id, userId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking can be rescheduled
    if (booking.status === BOOKING_STATUS.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule completed booking'
      });
    }

    if (booking.status === BOOKING_STATUS.CANCELLED) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule cancelled booking'
      });
    }

    // Update booking
    booking.scheduledDate = new Date(scheduledDate);
    booking.scheduledTime = scheduledTime;
    booking.timeSlot = {
      start: timeSlot.start,
      end: timeSlot.end
    };

    // Reset status to pending if it was confirmed
    if (booking.status === BOOKING_STATUS.CONFIRMED) {
      booking.status = BOOKING_STATUS.PENDING;
    }

    await booking.save();

    // Send notification to vendor
    await createNotification({
      vendorId: booking.vendorId,
      type: 'booking_created', // Keeping type as is for now
      title: 'Booking Rescheduled',
      message: `Booking ${booking.bookingNumber} has been rescheduled.`,
      relatedId: booking._id,
      relatedType: 'booking',
      pushData: {
        type: 'booking_rescheduled',
        bookingId: booking._id.toString(),
        link: `/vendor/bookings/${booking._id}`
      }
    });

    res.status(200).json({
      success: true,
      message: 'Booking rescheduled successfully',
      data: booking
    });
  } catch (error) {
    console.error('Reschedule booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reschedule booking. Please try again.'
    });
  }
};

/**
 * Add review and rating after completion
 */
const addReview = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const { id } = req.params;
    const { rating, review, reviewImages } = req.body;

    const booking = await Booking.findOne({ _id: id, userId });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if booking is completed or work is done
    if (booking.status !== BOOKING_STATUS.COMPLETED && booking.status !== BOOKING_STATUS.WORK_DONE) {
      return res.status(400).json({
        success: false,
        message: 'Can only review bookings after work is done'
      });
    }

    // Check if already reviewed
    if (booking.rating) {
      return res.status(400).json({
        success: false,
        message: 'Booking already reviewed'
      });
    }

    // Update booking
    booking.rating = rating;
    booking.review = review || null;
    booking.reviewImages = reviewImages || [];
    booking.reviewedAt = new Date();

    await booking.save();

    // Create a new Review document for the Review model (used by Admin)
    try {
      await Review.create({
        bookingId: booking._id,
        userId: booking.userId,
        serviceId: booking.serviceId,
        vendorId: booking.vendorId,
        workerId: booking.workerId,
        rating: rating,
        review: review || '',
        images: reviewImages || [],
        status: 'active'
      });
    } catch (reviewErr) {
      console.error('Error creating separate review document:', reviewErr);
      // We don't fail the request if the separate review creation fails
    }

    // Helper to update cumulative rating on Model
    const updateCumulativeRating = async (Model, docId, newRating) => {
      try {
        const doc = await Model.findById(docId);
        if (!doc) return;

        const oldTotal = doc.totalReviews || 0;
        const oldRating = doc.rating || 0;

        const newTotal = oldTotal + 1;
        const updatedRating = ((oldRating * oldTotal) + newRating) / newTotal;

        doc.rating = Number(updatedRating.toFixed(2));
        doc.totalReviews = newTotal;
        await doc.save();
      } catch (err) {
        console.error(`Error updating rating for ${Model.modelName}:`, err);
      }
    };

    // Update Vendor Rating (Always)
    if (booking.vendorId) {
      await updateCumulativeRating(Vendor, booking.vendorId, rating);
    }

    // Update Worker Rating (Only if worker was assigned)
    if (booking.workerId) {
      await updateCumulativeRating(Worker, booking.workerId, rating);
    }

    // Send notification to vendor
    await createNotification({
      vendorId: booking.vendorId,
      type: 'review_submitted',
      title: 'New Review Received',
      message: `You have received a ${rating}-star review for booking ${booking.bookingNumber}.`,
      relatedId: booking._id,
      relatedType: 'booking'
    });

    // ── Update Vendor Performance Stats ──
    try {
      const { updateVendorStats } = require('../../utils/vendorStatsHelper');
      updateVendorStats(booking.vendorId);
    } catch (statsErr) {
      console.error('Error updating vendor stats after review:', statsErr);
    }

    res.status(200).json({
      success: true,
      message: 'Review added successfully',
      data: booking
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add review. Please try again.'
    });
  }
};

/**
 * Get user ratings and reviews (given by the user)
 */
const getUserRatings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Fetch bookings where rating is not null
    const bookings = await Booking.find({ userId, rating: { $ne: null } })
      .populate('vendorId', 'name businessName profilePhoto')
      .populate('serviceId', 'title iconUrl')
      .populate('workerId', 'name profilePhoto')
      .sort({ reviewedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Booking.countDocuments({ userId, rating: { $ne: null } });

    // Apply name masking if settings dictate
    const Settings = require('../../models/Settings');
    const globalSettings = await Settings.findOne({ type: 'global' }).lean();
    const showVendorNameToUser = globalSettings ? globalSettings.showVendorNameToUser !== false : true;

    if (!showVendorNameToUser) {
      bookings.forEach(b => {
        if (b.vendorId) {
          b.vendorId.name = "Service Provider";
          b.vendorId.businessName = "Service Provider";
        }
      });
    }

    res.status(200).json({
      success: true,
      data: bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get user ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your ratings'
    });
  }
};

/**
 * Approve or Decline Inspection Estimate (Step 7 - Addon Services)
 */
const approveInspectionEstimate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { approve } = req.body; // boolean: true to approve, false to decline

    const booking = await Booking.findOne({ _id: id, userId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.estimateStatus !== 'pending') {
      return res.status(400).json({ success: false, message: 'No pending estimate found for this booking' });
    }

    if (approve) {
      booking.estimateStatus = 'approved';
      const estimateTotal = booking.inspectionEstimate?.totalAmount || 0;
      
      // Update booking final amount
      booking.finalAmount = (booking.finalAmount || 0) + estimateTotal;
      booking.userPayableAmount = booking.finalAmount;

      // Sync with VendorBill
      const VendorBill = require('../../models/VendorBill');
      let bill = await VendorBill.findOne({ bookingId: booking._id });
      const serviceGstPct = 18;

      const estimateServices = (booking.inspectionEstimate.services || []).map(s => {
        const gst = parseFloat(((s.price * s.quantity * serviceGstPct) / 100).toFixed(2));
        return {
          name: s.name,
          price: s.price,
          gstPercentage: serviceGstPct,
          quantity: s.quantity,
          gstAmount: gst,
          total: parseFloat((s.price * s.quantity + gst).toFixed(2)),
          isOriginal: false
        };
      });

      const estimateParts = (booking.inspectionEstimate.parts || []).map(p => {
        const gst = parseFloat(((p.price * p.quantity * serviceGstPct) / 100).toFixed(2));
        return {
          name: p.name,
          price: p.price,
          gstPercentage: serviceGstPct,
          quantity: p.quantity,
          gstAmount: gst,
          total: parseFloat((p.price * p.quantity + gst).toFixed(2))
        };
      });

      if (!bill) {
        await VendorBill.create({
          bookingId: booking._id,
          vendorId: booking.vendorId,
          services: estimateServices,
          parts: estimateParts,
          status: 'draft',
          grandTotal: estimateTotal
        });
      } else {
        bill.services.push(...estimateServices);
        bill.parts.push(...estimateParts);
        bill.grandTotal = (bill.grandTotal || 0) + estimateTotal;
        await bill.save();
      }
    } else {
      booking.estimateStatus = 'declined';
    }

    await booking.save();

    // Notify Worker via Socket & Notifications
    const io = req.app.get('io');
    if (io && booking.workerId) {
      io.to(`worker_${booking.workerId.toString()}`).emit('estimate_responded', {
        bookingId: booking._id,
        status: booking.estimateStatus
      });
    } else if (io && booking.vendorId) {
      io.to(`vendor_${booking.vendorId.toString()}`).emit('estimate_responded', {
        bookingId: booking._id,
        status: booking.estimateStatus
      });
    }

    const { createNotification } = require('../notificationControllers/notificationController');
    const recipientObj = booking.workerId ? { workerId: booking.workerId } : { vendorId: booking.vendorId };
    
    await createNotification({
      ...recipientObj,
      type: 'estimate_responded',
      title: `Estimate ${approve ? 'Approved' : 'Declined'}`,
      message: `The customer has ${approve ? 'approved' : 'declined'} the inspection estimate for booking #${booking.bookingNumber}.`,
      relatedId: booking._id,
      relatedType: 'booking',
      pushData: {
        type: 'estimate_responded',
        bookingId: booking._id.toString(),
        status: booking.estimateStatus
      }
    });

    res.status(200).json({
      success: true,
      message: `Estimate ${approve ? 'approved' : 'declined'} successfully`,
      data: booking
    });
  } catch (error) {
    console.error('Approve estimate error:', error);
    res.status(500).json({ success: false, message: 'Failed to process estimate response' });
  }
};

const requestCancelBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'Cancellation reason is required' });
    }

    const booking = await Booking.findOne({ _id: id, userId });
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (['cancelled', 'completed'].includes(booking.status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot request cancellation for a booking that is already ${booking.status}` 
      });
    }

    booking.cancelRequestStatus = 'pending';
    booking.cancelRequestedBy = 'user';
    booking.cancelRequestReason = reason;
    booking.cancelRequestAt = new Date();
    await booking.save();

    console.log(`[CancelRequest] User ${userId} requested cancellation for booking ${booking.bookingNumber}`);

    // Send notifications to admins
    try {
      const Admin = require('../../models/Admin');
      const City = require('../../models/City');
      const { createNotification } = require('../notificationControllers/notificationController');

      const city = booking.address?.city || '';
      const cityDoc = await City.findOne({ name: new RegExp(`^${city}$`, 'i') });
      let adminQuery = { role: { $in: ['admin', 'super_admin', 'super-admin'] } };
      if (cityDoc) {
        adminQuery = {
          $or: [
            { role: { $in: ['admin', 'super_admin', 'super-admin'] } },
            { role: 'CITY_ADMIN', assignedCities: cityDoc._id }
          ]
        };
      }

      const admins = await Admin.find(adminQuery);
      const io = req.app.get('io');
      const msg = `User has requested cancellation for Booking #${booking.bookingNumber}. Reason: ${reason}`;

      for (const admin of admins) {
        await createNotification({
          adminId: admin._id,
          type: 'booking_escalation',
          title: 'Cancellation Request (User)',
          message: msg,
          relatedId: booking._id,
          relatedType: 'booking',
          pushData: {
            type: 'booking_escalation',
            bookingId: booking._id.toString(),
            link: `/admin/bookings/${booking._id}`
          }
        });

        if (io) {
          io.to(`admin_${admin._id.toString()}`).emit('booking_escalation', {
            bookingId: booking._id,
            bookingNumber: booking.bookingNumber,
            message: msg,
            severity: 'MEDIUM'
          });
        }
      }
    } catch (notifErr) {
      console.error('Error notifying admins about user cancellation request:', notifErr);
    }

    res.status(200).json({
      success: true,
      message: 'Cancellation request submitted to admin successfully',
      data: booking
    });
  } catch (error) {
    console.error('User request cancel booking error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit cancellation request' });
  }
};

module.exports = {
  createBooking,
  getUserBookings,
  getBookingById,
  cancelBooking,
  rescheduleBooking,
  addReview,
  getUserRatings,
  approveInspectionEstimate,
  requestCancelBooking
};

