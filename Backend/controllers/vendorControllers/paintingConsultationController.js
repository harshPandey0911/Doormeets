const PaintingConsultation = require('../../models/PaintingConsultation');
const PaintingQuotation = require('../../models/PaintingQuotation');

exports.getAvailableConsultations = async (req, res) => {
  try {
    const vendorId = req.user.id; // vendor authentication

    // 1. Get 'PENDING' consultations for broadcasting
    // 2. Get consultations accepted by this vendor ('ACCEPTED_BY_VENDOR', 'QUOTE_GENERATED', 'QUOTE_ACCEPTED', etc.)
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

exports.acceptConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;

    const consultation = await PaintingConsultation.findOne({ _id: id, status: 'PENDING' });
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found or already accepted' });
    }

    consultation.status = 'ACCEPTED_BY_VENDOR';
    consultation.vendorId = vendorId;
    await consultation.save();

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

    if (consultation.status !== 'ACCEPTED_BY_VENDOR' && consultation.status !== 'QUOTE_GENERATED') {
       return res.status(400).json({ success: false, message: 'Cannot generate quote at this stage' });
    }

    const quoteData = {
      customerName,
      customerPhone,
      interiorArea,
      exteriorArea,
      interiorPaintId,
      exteriorPaintId,
      labourId,
      vendorId,
      calculation,
      consultationId: consultation._id,
      timeline: timeline || '',
      finishing: finishing || '',
      vendorNotes: vendorNotes || '',
      rooms: rooms || [],
      additionalServices: additionalServices || [],
      woodEnamel: woodEnamel || {},
      materials: materials || {},
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
      message: 'Quotation generated and user notified',
      data: quotation
    });
  } catch (error) {
    console.error('Error generating quote:', error);
    res.status(500).json({ success: false, message: 'Failed to generate quote', error: error.message });
  }
};

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
