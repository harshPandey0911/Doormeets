const PaintingConsultation = require('../../models/PaintingConsultation');
const PaintingQuotation = require('../../models/PaintingQuotation');

exports.requestConsultation = async (req, res) => {
  try {
    const { propertyType, address, wizardData } = req.body;
    const userId = req.user.id;

    // Calculate grand total from wizardData if provided
    let grandTotal = 0;
    if (wizardData && wizardData.grandTotal) {
      grandTotal = wizardData.grandTotal;
    }

    const consultation = await PaintingConsultation.create({
      userId,
      propertyType,
      address,
      wizardData: wizardData || {},
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
          createdAt: consultation.createdAt
        });
      }
    } catch (socketErr) {
      console.error('[PaintingConsultation] Socket broadcast failed:', socketErr);
    }

    res.status(201).json({
      success: true,
      message: 'Consultation requested successfully',
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
      .populate('vendorId', 'name phone email profilePic rating yearsExperience')
      .populate('quotationId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: consultations.length,
      data: consultations
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
        // Apply coupon and loyalty discount if provided
        const updateData = { status: 'ACCEPTED' };
        if (couponCode) updateData.couponCode = couponCode;
        if (loyaltyDiscount) updateData.loyaltyDiscount = loyaltyDiscount;
        await PaintingQuotation.findByIdAndUpdate(consultation.quotationId, updateData);
      }

      res.status(200).json({ success: true, message: 'Quote accepted successfully', data: consultation });
    } else if (action === 'DECLINE') {
      consultation.status = 'QUOTE_DECLINED';
      await consultation.save();
      
      res.status(200).json({ success: true, message: 'Quote declined', data: consultation });
    } else {
      res.status(400).json({ success: false, message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error updating quote status:', error);
    res.status(500).json({ success: false, message: 'Failed to update quote status', error: error.message });
  }
};
