const Settings = require('../../models/Settings');
const Vendor = require('../../models/Vendor');

// Get Global Settings
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne({ type: 'global' });

    // If no settings exist yet, create default
    if (!settings) {
      settings = await Settings.create({ type: 'global' });
    }

    res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings'
    });
  }
};

// Update Global Settings
exports.updateSettings = async (req, res, next) => {
  try {
    const {
      visitedCharges,
      serviceGstPercentage,
      partsGstPercentage,
      servicePayoutPercentage,
      partsPayoutPercentage,
      tdsPercentage,
      platformFeePercentage,
      vendorCashLimit, // Add this
      cancellationPenalty,
      razorpayKeyId,
      razorpayKeySecret,
      razorpayWebhookSecret,
      cloudinaryCloudName,
      cloudinaryApiKey,
      cloudinaryApiSecret,
      // Billing Settings
      companyName, companyGSTIN, companyPAN, companyAddress, companyCity, companyState, companyPincode, companyPhone, companyEmail, invoicePrefix, sacCode,
      // Support Settings
      supportEmail, supportPhone, supportWhatsapp,
      // Booking Timing
      maxSearchTime, waveDuration, searchRadius,
      // Payment Control
      isOnlinePaymentEnabled,
      // Commission & Platform Fees
      commissionRates, platformFeeRates,
      // Police Verification
      policeVerificationDays,
      // MCQ Test
      mcqTimeLimitMinutes,
      mcqMinScoreL1,
      mcqMinScoreL2,
      welcomeVideoUrl,
      commissionPercentage,
      loyaltyPointsEarningRate,
      loyaltyPointsRedemptionRate,
      loyaltyPointsCancellationPenalty,
      loyaltyPointsFixedCompletionAward,
      referralRewardReferrer,
      referralRewardReferee,
      maxWalletUsagePercentage,
      vendorBusyBufferHours,
      showVendorProfitToVendor,
      showVendorNameToUser,
      showVendorPhoneToUser,
      // Instant Booking Settings
      isInstantBookingEnabled,
      instantBookingMarkup,
      instantBookingWaitTime,
      instantBookingWindowHours,
      showArrivalTime
    } = req.body;

    let settings = await Settings.findOne({ type: 'global' });

    if (!settings) {
      settings = await Settings.create({
        type: 'global',
        visitedCharges,
        serviceGstPercentage,
        partsGstPercentage,
        servicePayoutPercentage,
        partsPayoutPercentage,
        tdsPercentage,
        platformFeePercentage,
        vendorCashLimit, // Add this
        cancellationPenalty,
        razorpayKeyId,
        razorpayKeySecret,
        razorpayWebhookSecret,
        cloudinaryCloudName,
        cloudinaryApiKey,
        cloudinaryApiSecret,
        mcqMinScoreL1,
        mcqMinScoreL2,
        welcomeVideoUrl,
        commissionPercentage: commissionPercentage !== undefined ? Number(commissionPercentage) : 20,
        loyaltyPointsEarningRate: loyaltyPointsEarningRate !== undefined ? Number(loyaltyPointsEarningRate) : 1,
        loyaltyPointsRedemptionRate: loyaltyPointsRedemptionRate !== undefined ? Number(loyaltyPointsRedemptionRate) : 1,
        loyaltyPointsCancellationPenalty: loyaltyPointsCancellationPenalty !== undefined ? Number(loyaltyPointsCancellationPenalty) : 0,
        loyaltyPointsFixedCompletionAward: loyaltyPointsFixedCompletionAward !== undefined ? Number(loyaltyPointsFixedCompletionAward) : 0,
        referralRewardReferrer: referralRewardReferrer !== undefined ? Number(referralRewardReferrer) : 100,
        referralRewardReferee: referralRewardReferee !== undefined ? Number(referralRewardReferee) : 100,
        maxWalletUsagePercentage: maxWalletUsagePercentage !== undefined ? Number(maxWalletUsagePercentage) : 30,
        vendorBusyBufferHours: vendorBusyBufferHours !== undefined ? Number(vendorBusyBufferHours) : 1,
        showVendorProfitToVendor: showVendorProfitToVendor !== undefined ? showVendorProfitToVendor === true : true,
        showVendorNameToUser: showVendorNameToUser !== undefined ? showVendorNameToUser === true : true,
        showVendorPhoneToUser: showVendorPhoneToUser !== undefined ? showVendorPhoneToUser === true : true,
        isInstantBookingEnabled: isInstantBookingEnabled !== undefined ? isInstantBookingEnabled === true : true,
        instantBookingMarkup: instantBookingMarkup !== undefined ? Number(instantBookingMarkup) : 99,
        instantBookingWaitTime: instantBookingWaitTime !== undefined ? Number(instantBookingWaitTime) : 45,
        instantBookingWindowHours: instantBookingWindowHours !== undefined ? Number(instantBookingWindowHours) : 4,
        showArrivalTime: showArrivalTime !== undefined ? showArrivalTime === true : true
      });
    } else {
      // Update fields if provided
      if (visitedCharges !== undefined) settings.visitedCharges = visitedCharges;
      if (serviceGstPercentage !== undefined) settings.serviceGstPercentage = serviceGstPercentage;
      if (partsGstPercentage !== undefined) settings.partsGstPercentage = partsGstPercentage;
      if (servicePayoutPercentage !== undefined) settings.servicePayoutPercentage = servicePayoutPercentage;
      if (partsPayoutPercentage !== undefined) settings.partsPayoutPercentage = partsPayoutPercentage;
      if (tdsPercentage !== undefined) settings.tdsPercentage = tdsPercentage;
      if (platformFeePercentage !== undefined) settings.platformFeePercentage = platformFeePercentage;
      if (vendorCashLimit !== undefined) settings.vendorCashLimit = vendorCashLimit; // Add this
      if (cancellationPenalty !== undefined) settings.cancellationPenalty = cancellationPenalty;
      if (razorpayKeyId !== undefined) settings.razorpayKeyId = razorpayKeyId;
      if (razorpayKeySecret !== undefined) settings.razorpayKeySecret = razorpayKeySecret;
      if (razorpayWebhookSecret !== undefined) settings.razorpayWebhookSecret = razorpayWebhookSecret;
      if (cloudinaryCloudName !== undefined) settings.cloudinaryCloudName = cloudinaryCloudName;
      if (cloudinaryApiKey !== undefined) settings.cloudinaryApiKey = cloudinaryApiKey;
      if (cloudinaryApiSecret !== undefined) settings.cloudinaryApiSecret = cloudinaryApiSecret;

      if (cloudinaryApiSecret !== undefined) settings.cloudinaryApiSecret = cloudinaryApiSecret;

      // Billing update
      if (companyName !== undefined) settings.companyName = companyName;
      if (companyGSTIN !== undefined) settings.companyGSTIN = companyGSTIN;
      if (companyPAN !== undefined) settings.companyPAN = companyPAN;
      if (companyAddress !== undefined) settings.companyAddress = companyAddress;
      if (companyCity !== undefined) settings.companyCity = companyCity;
      if (companyState !== undefined) settings.companyState = companyState;
      if (companyPincode !== undefined) settings.companyPincode = companyPincode;
      if (companyPhone !== undefined) settings.companyPhone = companyPhone;
      if (companyEmail !== undefined) settings.companyEmail = companyEmail;
      if (invoicePrefix !== undefined) settings.invoicePrefix = invoicePrefix;
      if (sacCode !== undefined) settings.sacCode = sacCode;

      // Support update
      if (supportEmail !== undefined) settings.supportEmail = supportEmail;
      if (supportPhone !== undefined) settings.supportPhone = supportPhone;
      if (supportWhatsapp !== undefined) settings.supportWhatsapp = supportWhatsapp;

      // Booking Timing update
      if (maxSearchTime !== undefined) settings.maxSearchTime = maxSearchTime;
      if (waveDuration !== undefined) settings.waveDuration = waveDuration;
      if (searchRadius !== undefined) settings.searchRadius = searchRadius;
      if (isOnlinePaymentEnabled !== undefined) settings.isOnlinePaymentEnabled = isOnlinePaymentEnabled;

      // Commission & Platform Fees update
      if (commissionRates !== undefined) settings.commissionRates = commissionRates;
      if (platformFeeRates !== undefined) settings.platformFeeRates = platformFeeRates;

      // Police Verification update
      if (policeVerificationDays !== undefined) settings.policeVerificationDays = policeVerificationDays;

      // MCQ Test update
      if (mcqTimeLimitMinutes !== undefined) settings.mcqTimeLimitMinutes = mcqTimeLimitMinutes;
      if (mcqMinScoreL1 !== undefined) settings.mcqMinScoreL1 = mcqMinScoreL1;
      if (mcqMinScoreL2 !== undefined) undefined; // handled below
      if (mcqMinScoreL2 !== undefined) settings.mcqMinScoreL2 = mcqMinScoreL2;
      if (welcomeVideoUrl !== undefined) settings.welcomeVideoUrl = welcomeVideoUrl;
      if (commissionPercentage !== undefined) settings.commissionPercentage = Number(commissionPercentage);
      if (loyaltyPointsEarningRate !== undefined) settings.loyaltyPointsEarningRate = Number(loyaltyPointsEarningRate);
      if (loyaltyPointsRedemptionRate !== undefined) settings.loyaltyPointsRedemptionRate = Number(loyaltyPointsRedemptionRate);
      if (loyaltyPointsCancellationPenalty !== undefined) settings.loyaltyPointsCancellationPenalty = Number(loyaltyPointsCancellationPenalty);
      if (loyaltyPointsFixedCompletionAward !== undefined) settings.loyaltyPointsFixedCompletionAward = Number(loyaltyPointsFixedCompletionAward);
      if (referralRewardReferrer !== undefined) settings.referralRewardReferrer = Number(referralRewardReferrer);
      if (referralRewardReferee !== undefined) settings.referralRewardReferee = Number(referralRewardReferee);
      if (maxWalletUsagePercentage !== undefined) settings.maxWalletUsagePercentage = Number(maxWalletUsagePercentage);
      if (vendorBusyBufferHours !== undefined) settings.vendorBusyBufferHours = Number(vendorBusyBufferHours);
      if (showVendorProfitToVendor !== undefined) settings.showVendorProfitToVendor = showVendorProfitToVendor === true;
      if (showVendorNameToUser !== undefined) settings.showVendorNameToUser = showVendorNameToUser === true;
      if (showVendorPhoneToUser !== undefined) settings.showVendorPhoneToUser = showVendorPhoneToUser === true;

      // Instant Booking Settings update
      if (isInstantBookingEnabled !== undefined) settings.isInstantBookingEnabled = isInstantBookingEnabled === true;
      if (instantBookingMarkup !== undefined) settings.instantBookingMarkup = Number(instantBookingMarkup);
      if (instantBookingWaitTime !== undefined) settings.instantBookingWaitTime = Number(instantBookingWaitTime);
      if (instantBookingWindowHours !== undefined) settings.instantBookingWindowHours = Number(instantBookingWindowHours);
      if (showArrivalTime !== undefined) settings.showArrivalTime = showArrivalTime === true;

      await settings.save();
    }

    // Propagate vendorCashLimit to all existing vendors if it was changed
    if (vendorCashLimit !== undefined) {
      console.log(`Updating all vendors with new cash limit: ${vendorCashLimit}`);
      await Vendor.updateMany(
        {}, // Filter: all vendors
        { $set: { 'wallet.cashLimit': vendorCashLimit } }
      );
    }

    // Propagate searchRadius to all existing vendors if it was changed
    if (searchRadius !== undefined) {
      console.log(`Updating all vendors with new service range: ${searchRadius}`);
      await Vendor.updateMany(
        {},
        { $set: { 'settings.serviceRange': searchRadius } }
      );
    }

    // Propagate updated commission rates to all existing PricingConfig records if updated
    if (commissionRates !== undefined || commissionPercentage !== undefined) {
      try {
        const PricingConfig = require('../../models/PricingConfig');
        const globalPlat = commissionPercentage !== undefined ? Number(commissionPercentage) : settings.commissionPercentage;
        const globalL1 = (commissionRates && commissionRates.level1 !== undefined) ? Number(commissionRates.level1) : settings.commissionRates.level1;
        const globalL2 = (commissionRates && commissionRates.level2 !== undefined) ? Number(commissionRates.level2) : settings.commissionRates.level2;
        const globalL3 = (commissionRates && commissionRates.level3 !== undefined) ? Number(commissionRates.level3) : settings.commissionRates.level3;

        console.log(`Propagating commission settings to PricingConfigs: Plat=${globalPlat}%, L1=${globalL1}%, L2=${globalL2}%, L3=${globalL3}%`);

        // Find all pricing configurations
        const pricings = await PricingConfig.find({});
        for (const prc of pricings) {
          prc.platformCommission = globalPlat;
          prc.l1Commission = globalL1;
          prc.l2Commission = globalL2;
          prc.l3Commission = globalL3;
          await prc.save(); // Save individually to trigger mongoose post-save hooks for synchronization
        }
      } catch (propError) {
        console.error('Error propagating commission rates to PricingConfig:', propError);
      }
    }

    res.status(200).json({
      success: true,
      message: 'System settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
};
// Get Public Settings (Visited Charges, GST)
exports.getPublicSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne({ type: 'global' }).select('visitedCharges serviceGstPercentage partsGstPercentage supportEmail supportPhone supportWhatsapp cancellationPenalty companyName companyAddress companyCity companyState companyPincode companyPhone companyEmail isOnlinePaymentEnabled welcomeVideoUrl loyaltyPointsEarningRate loyaltyPointsRedemptionRate loyaltyPointsCancellationPenalty loyaltyPointsFixedCompletionAward referralRewardReferrer referralRewardReferee maxWalletUsagePercentage isInstantBookingEnabled instantBookingMarkup instantBookingWaitTime instantBookingWindowHours showArrivalTime');

    // Default if not found (fallback values)
    if (!settings) {
      settings = { visitedCharges: 29, serviceGstPercentage: 18, partsGstPercentage: 18, referralRewardReferrer: 100, referralRewardReferee: 100, maxWalletUsagePercentage: 30 };
    }

    res.status(200).json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error fetching public settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings'
    });
  }
};
