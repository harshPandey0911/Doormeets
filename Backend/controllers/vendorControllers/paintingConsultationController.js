const PaintingConsultation = require('../../models/PaintingConsultation');
const PaintingQuotation = require('../../models/PaintingQuotation');
const { createNotification } = require('../notificationControllers/notificationController');
const { sendSMS } = require('../../services/smsService');
const { sendPushNotification } = require('../../services/firebaseAdmin');
const Vendor = require('../../models/Vendor');
const User = require('../../models/User');

// ─── Helper: Generate a 4-digit OTP ──────────────────────────────────────────
const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString();

// ─── Helper: Save in-app notification + optional push ────────────────────────
const saveAndPushNotification = async ({ userId, vendorId, type, title, message, relatedId }) => {
  try {
    await createNotification({
      userId: userId || null,
      vendorId: vendorId || null,
      type,
      title,
      message,
      relatedId: relatedId || null,
      relatedType: 'painting_consultation',
      data: { consultationId: relatedId }
    });
  } catch (err) {
    console.error('[PaintingNotification] Failed to save/push:', err.message);
  }
};

// ─── 1. Get Available Consultations ──────────────────────────────────────────
exports.getAvailableConsultations = async (req, res) => {
  try {
    const vendorId = req.user.id;

    // 1. PENDING consultations (broadcast) + consultations this vendor owns
    const consultations = await PaintingConsultation.find({
      $or: [
        { status: 'PENDING' },
        { vendorId: vendorId }
      ]
    })
    .populate('userId', 'name phone email')
    .populate('quotationId')
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: consultations.length,
      data: consultations
    });
  } catch (error) {
    console.error('Error fetching available consultations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch consultations', error: error.message });
  }
};

// ─── 2. Accept Consultation ───────────────────────────────────────────────────
exports.acceptConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;

    const consultation = await PaintingConsultation.findOne({ _id: id, status: 'PENDING' })
      .populate('userId', 'name phone email fcmTokens');
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found or already accepted' });
    }

    const vendor = await Vendor.findById(vendorId).select('name phone businessName');

    consultation.status = 'ACCEPTED_BY_VENDOR';
    consultation.vendorId = vendorId;
    consultation.tracking = consultation.tracking || {};
    consultation.tracking.vendorAcceptedAt = new Date();
    await consultation.save();

    // Notify user: vendor assigned
    const userFcmTokens = consultation.userId?.fcmTokens || [];
    const vendorDisplay = vendor?.businessName || vendor?.name || 'Your vendor';
    const vendorPhone = vendor?.phone || 'N/A';

    await saveAndPushNotification({
      userId: consultation.userId._id,
      type: 'painting_vendor_assigned',
      title: '🎨 Vendor Assigned!',
      message: `${vendorDisplay} has accepted your painting request. Contact: ${vendorPhone}`,
      relatedId: consultation._id,
      fcmTokens: userFcmTokens
    });

    // If SCHEDULED, also send slot confirmation
    if (consultation.bookingType === 'SCHEDULED' && consultation.scheduledSlot?.timeSlot) {
      await saveAndPushNotification({
        userId: consultation.userId._id,
        type: 'painting_slot_confirmed',
        title: '📅 Slot Confirmed',
        message: `Your inspection is confirmed for ${consultation.scheduledSlot.timeSlot}`,
        relatedId: consultation._id,
        fcmTokens: userFcmTokens
      });
    }

    res.status(200).json({
      success: true,
      message: 'Consultation accepted successfully',
      data: consultation
    });
  } catch (error) {
    console.error('Error accepting consultation:', error);
    res.status(500).json({ success: false, message: 'Failed to accept consultation', error: error.message });
  }
};

// ─── 3. Mark En Route ─────────────────────────────────────────────────────────
exports.markEnRoute = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;

    const consultation = await PaintingConsultation.findOne({ _id: id, vendorId })
      .populate('userId', 'name phone fcmTokens');
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found or not authorized' });
    }
    if (consultation.status !== 'ACCEPTED_BY_VENDOR') {
      return res.status(400).json({ success: false, message: 'Cannot mark en route at this stage' });
    }

    consultation.status = 'VENDOR_EN_ROUTE';
    consultation.tracking.vendorEnRouteAt = new Date();
    await consultation.save();

    // Notify user
    await saveAndPushNotification({
      userId: consultation.userId._id,
      type: 'painting_vendor_en_route',
      title: '🚗 Vendor On The Way!',
      message: 'Your painting vendor is heading to your location.',
      relatedId: consultation._id,
      fcmTokens: consultation.userId?.fcmTokens || []
    });

    res.status(200).json({ success: true, message: 'Marked as en route', data: consultation });
  } catch (error) {
    console.error('Error marking en route:', error);
    res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
};

// ─── 4. Send Arrival OTP ──────────────────────────────────────────────────────
exports.sendArrivalOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;

    const consultation = await PaintingConsultation.findOne({ _id: id, vendorId });
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found or not authorized' });
    }
    if (!['ACCEPTED_BY_VENDOR', 'VENDOR_EN_ROUTE'].includes(consultation.status)) {
      return res.status(400).json({ success: false, message: 'Cannot send arrival OTP at this stage' });
    }
    if (!consultation.userPhone) {
      return res.status(400).json({ success: false, message: 'User phone not available' });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    consultation.tracking.arrivalOtp = otp;
    consultation.tracking.arrivalOtpExpiresAt = expiresAt;
    consultation.tracking.arrivalOtpVerified = false;
    await consultation.save();

    // Send OTP via SMS to the USER's phone
    const message = `Your Doormeets painting inspection OTP is ${otp}. Share this with your vendor to confirm arrival. Valid for 15 minutes.`;
    await sendSMS(consultation.userPhone, message);

    console.log(`[PaintingOTP] Arrival OTP ${otp} sent to user ${consultation.userPhone}`);

    res.status(200).json({
      success: true,
      message: `OTP sent to customer's phone. Ask the customer to share it with you.`,
      expiresAt
    });
  } catch (error) {
    console.error('Error sending arrival OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP', error: error.message });
  }
};

// ─── 5. Verify Arrival OTP + Upload Arrival Photo ────────────────────────────
exports.verifyArrivalOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;
    const { otp, geoLat, geoLng } = req.body;
    const photoFile = req.file; // handled by uploadMiddleware

    const consultation = await PaintingConsultation.findOne({ _id: id, vendorId })
      .populate('userId', 'name phone fcmTokens');
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found or not authorized' });
    }
    if (!['ACCEPTED_BY_VENDOR', 'VENDOR_EN_ROUTE'].includes(consultation.status)) {
      return res.status(400).json({ success: false, message: 'Cannot verify arrival OTP at this stage' });
    }

    const { arrivalOtp, arrivalOtpExpiresAt, arrivalOtpVerified } = consultation.tracking;

    if (!arrivalOtp) {
      return res.status(400).json({ success: false, message: 'No OTP generated. Please request an OTP first.' });
    }
    if (arrivalOtpVerified) {
      return res.status(400).json({ success: false, message: 'Arrival OTP already verified.' });
    }
    if (new Date() > new Date(arrivalOtpExpiresAt)) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }
    if (otp !== arrivalOtp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please check with the customer.' });
    }

    // Photo URL from Cloudinary (multer-storage-cloudinary uploads automatically)
    const arrivalPhotoUrl = photoFile ? (photoFile.secure_url || photoFile.path || null) : null;

    // Update consultation
    consultation.status = 'INSPECTION_IN_PROGRESS';
    consultation.tracking.arrivalOtpVerified = true;
    consultation.tracking.arrivalOtpVerifiedAt = new Date();
    consultation.tracking.inspectionStartedAt = new Date();
    if (arrivalPhotoUrl) consultation.tracking.arrivalPhotoUrls.push(arrivalPhotoUrl);
    if (geoLat) consultation.tracking.arrivalGeoLat = parseFloat(geoLat);
    if (geoLng) consultation.tracking.arrivalGeoLng = parseFloat(geoLng);
    await consultation.save();

    // Notify user
    await saveAndPushNotification({
      userId: consultation.userId._id,
      type: 'painting_inspection_started',
      title: '🔨 Inspection Started!',
      message: 'Your vendor has arrived and the inspection is now underway.',
      relatedId: consultation._id,
      fcmTokens: consultation.userId?.fcmTokens || []
    });

    res.status(200).json({
      success: true,
      message: 'Arrival verified. Inspection started!',
      data: { status: consultation.status, inspectionStartedAt: consultation.tracking.inspectionStartedAt }
    });
  } catch (error) {
    console.error('Error verifying arrival OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP', error: error.message });
  }
};

// ─── 6. Send Completion OTP ───────────────────────────────────────────────────
exports.sendCompletionOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;

    const consultation = await PaintingConsultation.findOne({ _id: id, vendorId });
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found or not authorized' });
    }
    if (consultation.status !== 'INSPECTION_IN_PROGRESS') {
      return res.status(400).json({ success: false, message: 'Inspection must be in progress to send completion OTP' });
    }
    if (!consultation.userPhone) {
      return res.status(400).json({ success: false, message: 'User phone not available' });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    consultation.tracking.completionOtp = otp;
    consultation.tracking.completionOtpExpiresAt = expiresAt;
    consultation.tracking.completionOtpVerified = false;
    await consultation.save();

    const message = `Your Doormeets painting inspection is complete! Completion OTP: ${otp}. Share with your vendor. Valid for 15 minutes.`;
    await sendSMS(consultation.userPhone, message);

    console.log(`[PaintingOTP] Completion OTP ${otp} sent to user ${consultation.userPhone}`);

    res.status(200).json({
      success: true,
      message: `Completion OTP sent to customer's phone.`,
      expiresAt
    });
  } catch (error) {
    console.error('Error sending completion OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to send completion OTP', error: error.message });
  }
};

// ─── 7. Verify Completion OTP + Upload Inspection Photos ─────────────────────
exports.verifyCompletionOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;
    const { otp } = req.body;
    const photoFiles = req.files; // array — handled by uploadMiddleware

    const consultation = await PaintingConsultation.findOne({ _id: id, vendorId })
      .populate('userId', 'name phone fcmTokens');
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found or not authorized' });
    }
    if (consultation.status !== 'INSPECTION_IN_PROGRESS') {
      return res.status(400).json({ success: false, message: 'Inspection must be in progress' });
    }

    const { completionOtp, completionOtpExpiresAt, completionOtpVerified } = consultation.tracking;

    if (!completionOtp) {
      return res.status(400).json({ success: false, message: 'No completion OTP generated. Request one first.' });
    }
    if (completionOtpVerified) {
      return res.status(400).json({ success: false, message: 'Completion OTP already verified.' });
    }
    if (new Date() > new Date(completionOtpExpiresAt)) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }
    if (otp !== completionOtp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please check with the customer.' });
    }

    // Upload inspection photos (multer-storage-cloudinary uploads automatically)
    if (photoFiles && photoFiles.length > 0) {
      for (const file of photoFiles) {
        const photoUrl = file.secure_url || file.path;
        if (photoUrl) consultation.tracking.inspectionPhotoUrls.push(photoUrl);
      }
    }

    consultation.tracking.completionOtpVerified = true;
    consultation.tracking.completionOtpVerifiedAt = new Date();
    consultation.tracking.inspectionCompletedAt = new Date();
    // Status stays INSPECTION_IN_PROGRESS until vendor submits to admin via generateQuote
    await consultation.save();

    // Notify user
    await saveAndPushNotification({
      userId: consultation.userId._id,
      type: 'painting_inspection_complete',
      title: '✅ Inspection Complete!',
      message: 'The inspection is done. Your vendor is preparing your quotation.',
      relatedId: consultation._id,
      fcmTokens: consultation.userId?.fcmTokens || []
    });

    res.status(200).json({
      success: true,
      message: 'Inspection completed and verified! You can now proceed to generate the quote.',
      data: {
        inspectionCompletedAt: consultation.tracking.inspectionCompletedAt,
        inspectionPhotoCount: consultation.tracking.inspectionPhotoUrls.length
      }
    });
  } catch (error) {
    console.error('Error verifying completion OTP:', error);
    res.status(500).json({ success: false, message: 'Failed to verify completion OTP', error: error.message });
  }
};

// ─── 8. Generate Quote ────────────────────────────────────────────────────────
exports.generateQuote = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;
    const {
      customerName,
      customerPhone,
      interiorArea,
      exteriorArea,
      interiorPaintId,
      exteriorPaintId,
      labourId,
      calculation,
      timeline,
      finishing,
      vendorNotes,
      rooms,
      additionalServices,
      woodEnamel,
      materials
    } = req.body;

    const consultation = await PaintingConsultation.findOne({ _id: id, vendorId });
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found or you are not authorized' });
    }

    // Must have completed inspection OTP verification before generating quote
    const allowedStatuses = ['ACCEPTED_BY_VENDOR', 'VENDOR_EN_ROUTE', 'INSPECTION_IN_PROGRESS', 'QUOTE_GENERATED'];
    if (!allowedStatuses.includes(consultation.status)) {
       return res.status(400).json({ success: false, message: 'Cannot generate quote at this stage' });
    }

    const PaintingSettings = require('../../models/PaintingSettings');
    const { computeQuotationDetails } = require('../../utils/paintingCalculator');

    // Mapped structure for backend recalculation
    const mappedProducts = [];
    if (interiorPaintId && Number(interiorArea) > 0) {
      mappedProducts.push({
        productId: interiorPaintId,
        appliedArea: Number(interiorArea),
        selectedPackSize: { size: 1, unit: 'Litre' }
      });
    }
    if (exteriorPaintId && Number(exteriorArea) > 0) {
      mappedProducts.push({
        productId: exteriorPaintId,
        appliedArea: Number(exteriorArea),
        selectedPackSize: { size: 1, unit: 'Litre' }
      });
    }

    const mappedLabour = [];
    if (labourId && (Number(interiorArea) > 0 || Number(exteriorArea) > 0)) {
      mappedLabour.push({
        labourRateId: labourId,
        area: (Number(interiorArea) || 0) + (Number(exteriorArea) || 0)
      });
    }

    const mappedCharges = (additionalServices || []).map(s => ({
      title: s.name || 'Additional Service',
      amount: Number(s.cost) || Number(s.estimatedCost) || 0
    }));

    const mappedDiscount = {
      type: 'FLAT',
      value: Number(calculation?.discount) || 0
    };

    // Retrieve active settings snapshot
    const activeSettings = await PaintingSettings.findOne({ isDefault: true }).populate('activeVersionId');
    const settingsSnapshot = activeSettings?.activeVersionId?.snapshot || null;

    // Run Calculations via Engine
    const calculations = await computeQuotationDetails(
      {
        propertyType: consultation.propertyType,
        interiorArea: Number(interiorArea) || 0,
        exteriorArea: Number(exteriorArea) || 0,
        ceilingArea: Number(materials?.ceilingArea) || 0,
        balconyArea: 0,
        totalPaintableArea: (Number(interiorArea) || 0) + (Number(exteriorArea) || 0)
      },
      mappedProducts,
      mappedLabour,
      mappedCharges,
      mappedDiscount,
      18,
      settingsSnapshot,
      '1.1.0'
    );

    if (!calculations.success) {
      return res.status(400).json({
        success: false,
        message: 'Calculation failed due to validation errors',
        errors: calculations.validationErrors
      });
    }

    const finalCalculation = {
      paintCost: calculations.summary.materialCost,
      puttyCost: calculations.puttyQuantity * 15,
      primerCost: calculations.primerQuantity * 20,
      labourCost: calculations.summary.labourCost,
      additionalServicesCost: calculations.summary.additionalCharges,
      discount: calculations.summary.discount,
      gst: calculations.summary.gst,
      grandTotal: calculations.summary.grandTotal
    };

    const quoteData = {
      customerName,
      customerPhone,
      interiorArea,
      exteriorArea,
      interiorPaintId,
      exteriorPaintId,
      labourId,
      vendorId,
      calculation: finalCalculation,
      consultationId: consultation._id,
      timeline: timeline || '',
      finishing: finishing || '',
      vendorNotes: vendorNotes || '',
      rooms: rooms || [],
      additionalServices: additionalServices || [],
      woodEnamel: woodEnamel || {},
      materials: materials || {},
      
      // New snapshot schema integration
      property: {
        propertyType: consultation.propertyType,
        interiorArea: Number(interiorArea) || 0,
        exteriorArea: Number(exteriorArea) || 0,
        ceilingArea: Number(materials?.ceilingArea) || 0,
        balconyArea: 0,
        totalPaintableArea: (Number(interiorArea) || 0) + (Number(exteriorArea) || 0)
      },
      products: calculations.products,
      labour: calculations.labour,
      additionalCharges: calculations.additionalCharges,
      discount: calculations.discount,
      gst: calculations.gst,
      summary: calculations.summary,
      
      settingsProfileId: activeSettings ? activeSettings._id : null,
      settingsVersion: activeSettings ? (activeSettings.publishedVersion || activeSettings.currentVersion) : 1,
      settingsSnapshot,
      calculationVersion: '1.1.0',
      calculationTimestamp: calculations.audit.calculationTimestamp,
      engineVersion: calculations.audit.engineVersion,
      calculationDurationMs: calculations.audit.durationMs,
      validationResults: calculations.validationErrors,
      validationWarnings: calculations.validationWarnings
    };

    // Create or update the quotation
    let quotation;
    if (consultation.quotationId) {
       quotation = await PaintingQuotation.findByIdAndUpdate(consultation.quotationId, quoteData, { new: true });
    } else {
       quotation = await PaintingQuotation.create({
         ...quoteData,
         customerId: consultation.userId,
       });
       
       consultation.quotationId = quotation._id;
    }

    consultation.status = 'QUOTE_GENERATED';
    await consultation.save();

    res.status(200).json({
      success: true,
      message: 'Quotation generated and submitted to admin',
      data: quotation
    });
  } catch (error) {
    console.error('Error generating quote:', error);
    res.status(500).json({ success: false, message: 'Failed to generate quote', error: error.message });
  }
};

// ─── 9. Decline Consultation ─────────────────────────────────────────────────
exports.declineConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;

    const consultation = await PaintingConsultation.findOne({ _id: id });
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found' });
    }

    // If this vendor had accepted it, release it back
    if (consultation.vendorId && consultation.vendorId.toString() === vendorId) {
      consultation.status = 'DECLINED_BY_VENDOR';
      consultation.vendorId = null;
      await consultation.save();
    }

    res.status(200).json({
      success: true,
      message: 'Consultation declined',
      data: consultation
    });
  } catch (error) {
    console.error('Error declining consultation:', error);
    res.status(500).json({ success: false, message: 'Failed to decline consultation', error: error.message });
  }
};
