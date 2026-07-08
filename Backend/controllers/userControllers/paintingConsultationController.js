const PaintingConsultation = require('../../models/PaintingConsultation');
const PaintingQuotation = require('../../models/PaintingQuotation');

exports.requestConsultation = async (req, res) => {
  try {
    const { propertyType, address, wizardData, bookingType, scheduledSlot } = req.body;
    const userId = req.user.id;

    // Validate scheduled slot when booking type is SCHEDULED
    if (bookingType === 'SCHEDULED') {
      if (!scheduledSlot?.date || !scheduledSlot?.timeSlot) {
        return res.status(400).json({
          success: false,
          message: 'Please select a date and time slot for scheduled booking'
        });
      }
    }

    const consultation = await PaintingConsultation.create({
      userId,
      userPhone: req.user.phone || '',          // denormalized for OTP sending
      propertyType,
      address,
      wizardData: wizardData || {},
      bookingType: bookingType || 'INSTANT',
      scheduledSlot: bookingType === 'SCHEDULED' ? scheduledSlot : { date: null, timeSlot: '' },
      status: 'PENDING'
    });

    // Populate user details for real-time notification detail rendering
    const populatedConsultation = await PaintingConsultation.findById(consultation._id).populate('userId', 'name phone email');

    // Broadcast real-time socket.io alert to all vendors
    try {
      const { getIO } = require('../../sockets');
      const io = getIO();
      if (io) {
        console.log(`[PaintingConsultation] Broadcasting new consultation request #${consultation._id} to all online vendors`);
        io.to('all_vendors').emit('new_painting_consultation', {
          consultationId: consultation._id,
          propertyType: consultation.propertyType,
          customerName: populatedConsultation.userId?.name || 'Customer',
          customerPhone: populatedConsultation.userId?.phone || 'N/A',
          city: consultation.address?.city || 'Location shared',
          bookingType: consultation.bookingType,
          scheduledSlot: consultation.scheduledSlot,
          createdAt: consultation.createdAt
        });
      }
    } catch (socketErr) {
      console.error('[PaintingConsultation] Socket broadcast failed:', socketErr);
    }

    res.status(201).json({
      success: true,
      message: bookingType === 'SCHEDULED'
        ? `Inspection scheduled for ${scheduledSlot.timeSlot}. Vendors are being notified.`
        : 'Consultation requested successfully. Finding vendors near you.',
      data: consultation
    });
  } catch (error) {
    console.error('Error requesting consultation:', error);
    res.status(500).json({ success: false, message: 'Failed to request consultation', error: error.message });
  }
};

exports.getMyConsultations = async (req, res) => {
  try {
    const userId = req.user.id;
    const consultations = await PaintingConsultation.find({ userId })
      .populate('vendorId', 'name phone email businessName profilePic rating yearsExperience')
      .populate('quotationId')
      .sort({ createdAt: -1 });

    // Categorize for the frontend
    const pending = consultations.filter(c => c.status === 'PENDING');
    const active = consultations.filter(c =>
      ['ACCEPTED_BY_VENDOR', 'VENDOR_EN_ROUTE', 'INSPECTION_IN_PROGRESS'].includes(c.status)
    );
    const pendingQuotes = consultations.filter(c => c.status === 'QUOTE_GENERATED');
    const completed = consultations.filter(c =>
      ['QUOTE_ACCEPTED', 'QUOTE_DECLINED', 'COMPLETED', 'DECLINED_BY_VENDOR'].includes(c.status)
    );

    res.status(200).json({
      success: true,
      count: consultations.length,
      data: consultations,
      summary: { pending: pending.length, active: active.length, pendingQuotes: pendingQuotes.length, completed: completed.length }
    });
  } catch (error) {
    console.error('Error fetching consultations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch consultations', error: error.message });
  }
};

exports.quoteAction = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, couponCode, loyaltyDiscount } = req.body; // 'ACCEPT' or 'DECLINE'
    const userId = req.user.id;

    const consultation = await PaintingConsultation.findOne({ _id: id, userId });
    
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found' });
    }

    if (consultation.status !== 'QUOTE_GENERATED') {
      return res.status(400).json({ success: false, message: 'No quote available to accept or decline' });
    }

    if (action === 'ACCEPT') {
      consultation.status = 'QUOTE_ACCEPTED';
      await consultation.save();
      
      if (consultation.quotationId) {
        const { computeQuotationDetails } = require('../../utils/paintingCalculator');
        const quotationObj = await PaintingQuotation.findById(consultation.quotationId);
        
        if (quotationObj) {
          // Calculate dynamic coupon codes
          const getCouponDiscountPercent = (code) => {
            const c = (code || '').trim().toUpperCase();
            if (c === 'SUCCESS20') return 20;
            if (c === 'WELCOME50' || c === 'FLAT50') return 10;
            return 0;
          };

          const couponPercent = getCouponDiscountPercent(couponCode);
          const totalDiscountPercent = Number(couponPercent) + (Number(loyaltyDiscount) || 0);

          let discountInput = { type: 'NONE', value: 0, reason: '' };
          if (totalDiscountPercent > 0) {
            discountInput = {
              type: 'PERCENTAGE',
              value: totalDiscountPercent,
              reason: `Coupon: ${couponCode || 'None'}, Loyalty: ${loyaltyDiscount || 0}%`
            };
          }

          // Recalculate quotation with engine
          const calculations = await computeQuotationDetails(
            quotationObj.property,
            quotationObj.products,
            quotationObj.labour,
            quotationObj.additionalCharges,
            discountInput,
            quotationObj.gst?.gstPercentage,
            quotationObj.settingsSnapshot,
            quotationObj.calculationVersion || '1.1.0'
          );

          if (calculations.success) {
            quotationObj.status = 'CUSTOMER_ACCEPTED';
            quotationObj.couponCode = couponCode || '';
            quotationObj.loyaltyDiscount = Number(loyaltyDiscount) || 0;
            quotationObj.discount = calculations.discount;
            quotationObj.gst = calculations.gst;
            quotationObj.summary = calculations.summary;
            
            // Legacy calculation backup update
            quotationObj.calculation = {
              paintCost: calculations.summary.materialCost,
              puttyCost: calculations.puttyQuantity * 15,
              primerCost: calculations.primerQuantity * 20,
              labourCost: calculations.summary.labourCost,
              additionalServicesCost: calculations.summary.additionalCharges,
              discount: calculations.summary.discount,
              gst: calculations.summary.gst,
              grandTotal: calculations.summary.grandTotal
            };

            // Version parameters
            quotationObj.currentVersion = (quotationObj.currentVersion || 1) + 1;
            quotationObj.calculationTimestamp = calculations.audit.calculationTimestamp;
            quotationObj.engineVersion = calculations.audit.engineVersion;
            quotationObj.calculationDurationMs = calculations.audit.durationMs;

            await quotationObj.save();
          } else {
            console.error('Failed to recalculate quote on customer acceptance:', calculations.validationErrors);
          }
        }
      }

      res.status(200).json({ success: true, message: 'Quote accepted successfully', data: consultation });
    } else if (action === 'DECLINE') {
      consultation.status = 'QUOTE_DECLINED';
      await consultation.save();

      if (consultation.quotationId) {
        await PaintingQuotation.findByIdAndUpdate(consultation.quotationId, { status: 'CUSTOMER_REJECTED' });
      }
      
      res.status(200).json({ success: true, message: 'Quote declined', data: consultation });
    } else {
      res.status(400).json({ success: false, message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error updating quote status:', error);
    res.status(500).json({ success: false, message: 'Failed to update quote status', error: error.message });
  }
};
