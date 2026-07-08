const PaintingQuotation = require('../../models/PaintingQuotation');
const PaintingConsultation = require('../../models/PaintingConsultation');
const PaintProduct = require('../../models/PaintProduct');
const LabourRate = require('../../models/LabourRate');
const Vendor = require('../../models/Vendor');
const PropertyTemplate = require('../../models/PropertyTemplate');
const PaintingSettings = require('../../models/PaintingSettings');
const PaintingSettingsVersion = require('../../models/PaintingSettingsVersion');
const { computeQuotationDetails } = require('../../utils/paintingCalculator');

// Helper to log version snapshot from vendor actions
const logVersionSnapshot = async (quotation, changedById, changeSummary) => {
  const vendor = await Vendor.findById(changedById);
  const vendorName = vendor ? vendor.name : 'Vendor';
  
  quotation.versions.push({
    version: quotation.currentVersion,
    changedBy: changedById,
    changedByName: vendorName,
    changedByType: 'VENDOR',
    changeSummary,
    createdAt: new Date(),
    snapshot: {
      property: quotation.property,
      products: quotation.products,
      labour: quotation.labour,
      additionalCharges: quotation.additionalCharges,
      discount: quotation.discount,
      gst: quotation.gst,
      summary: quotation.summary,
      remarks: quotation.remarks,
      attachments: quotation.attachments
    }
  });
};


// GET /api/vendor/painting/quotations/:consultationId
exports.getQuotationByConsultationId = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const vendorId = req.user.id;

    const quotation = await PaintingQuotation.findOne({ consultationId, vendorId })
      .populate('products.productId')
      .populate('labour.labourRateId');

    res.status(200).json({
      success: true,
      data: quotation || null
    });
  } catch (error) {
    console.error('Error fetching quotation by consultation ID:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch quotation', error: error.message });
  }
};

// POST /api/vendor/painting/quotations
exports.createQuotation = async (req, res) => {
  try {
    const vendorId = req.user.id;
    const {
      consultationId,
      property,
      products,
      labour,
      additionalCharges,
      discount,
      gstPercentage = 18,
      remarks,
      attachments
    } = req.body;

    if (!consultationId) {
      return res.status(400).json({ success: false, message: 'Consultation ID is required.' });
    }

    const consultation = await PaintingConsultation.findOne({ _id: consultationId, vendorId });
    if (!consultation) {
      return res.status(404).json({ success: false, message: 'Consultation not found or not accepted by this vendor.' });
    }

    // Fetch active settings snapshot prior to calculation
    const activeSettings = await PaintingSettings.findOne({ isDefault: true }).populate('activeVersionId');
    const settingsSnapshot = activeSettings?.activeVersionId?.snapshot || null;

    // Run dynamic calculations using centralized engine
    const calculations = await computeQuotationDetails(
      property,
      products,
      labour,
      additionalCharges,
      discount,
      gstPercentage,
      settingsSnapshot,
      '1.1.0'
    );

    if (!calculations.success) {
      return res.status(400).json({
        success: false,
        message: 'Quotation validation failed',
        errors: calculations.validationErrors
      });
    }

    // Keep legacy fields populated for backup
    const legacyCalculation = {
      paintCost: calculations.summary.materialCost,
      puttyCost: calculations.puttyQuantity * 15, // estimation
      primerCost: calculations.primerQuantity * 20, // estimation
      labourCost: calculations.summary.labourCost,
      additionalServicesCost: calculations.summary.additionalCharges,
      discount: calculations.summary.discount,
      gst: calculations.summary.gst,
      grandTotal: calculations.summary.grandTotal
    };

    const quotation = await PaintingQuotation.create({
      consultationId,
      customerId: consultation.userId,
      vendorId,
      status: 'DRAFT',
      property,
      rooms: req.body.rooms || [],
      products: calculations.products,
      labour: calculations.labour,
      additionalCharges: calculations.additionalCharges,
      discount: calculations.discount,
      gst: calculations.gst,
      summary: calculations.summary,
      remarks: remarks || {},
      attachments: attachments || {},
      
      // Settings & Engine Audit Metadata
      settingsProfileId: activeSettings ? activeSettings._id : null,
      settingsVersion: activeSettings ? (activeSettings.publishedVersion || activeSettings.currentVersion) : 1,
      settingsSnapshot,
      calculationVersion: '1.1.0',
      calculationTimestamp: calculations.audit.calculationTimestamp,
      engineVersion: calculations.audit.engineVersion,
      calculationDurationMs: calculations.audit.durationMs,
      validationResults: calculations.validationErrors,
      validationWarnings: calculations.validationWarnings,
      
      // Legacy backups
      interiorArea: property?.interiorArea || 0,
      exteriorArea: property?.exteriorArea || 0,
      calculation: legacyCalculation
    });

    // Update consultation with the draft quotation
    consultation.quotationId = quotation._id;
    await consultation.save();

    res.status(201).json({
      success: true,
      message: 'Quotation draft created successfully',
      data: quotation
    });
  } catch (error) {
    console.error('Error creating quotation draft:', error);
    res.status(500).json({ success: false, message: 'Failed to create quotation draft', error: error.message });
  }
};

// PUT /api/vendor/painting/quotations/:id
exports.updateQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;
    const {
      property,
      products,
      labour,
      additionalCharges,
      discount,
      gstPercentage = 18,
      remarks,
      attachments
    } = req.body;

    const quotation = await PaintingQuotation.findOne({ _id: id, vendorId });
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found.' });
    }

    // Check if quotation is read-only
    if (quotation.status !== 'DRAFT' && quotation.status !== 'ADMIN_REJECTED' && quotation.status !== 'REVISION_REQUESTED') {
      return res.status(400).json({
        success: false,
        message: `Quotation is in ${quotation.status} status and cannot be edited.`
      });
    }

    // Fetch snapshot dynamically if not present
    let settingsSnapshot = quotation.settingsSnapshot;
    let settingsProfileId = quotation.settingsProfileId;
    let settingsVersion = quotation.settingsVersion;

    if (!settingsSnapshot) {
      const activeSettings = await PaintingSettings.findOne({ isDefault: true }).populate('activeVersionId');
      if (activeSettings) {
        settingsProfileId = activeSettings._id;
        settingsVersion = activeSettings.publishedVersion || activeSettings.currentVersion;
        settingsSnapshot = activeSettings.activeVersionId?.snapshot || null;
      }
    }

    // Run calculations using engine with snapshot
    const calculations = await computeQuotationDetails(
      property,
      products,
      labour,
      additionalCharges,
      discount,
      gstPercentage,
      settingsSnapshot,
      quotation.calculationVersion || '1.1.0'
    );

    if (!calculations.success) {
      return res.status(400).json({
        success: false,
        message: 'Quotation validation failed',
        errors: calculations.validationErrors
      });
    }

    const legacyCalculation = {
      paintCost: calculations.summary.materialCost,
      puttyCost: calculations.puttyQuantity * 15,
      primerCost: calculations.primerQuantity * 20,
      labourCost: calculations.summary.labourCost,
      additionalServicesCost: calculations.summary.additionalCharges,
      discount: calculations.summary.discount,
      gst: calculations.summary.gst,
      grandTotal: calculations.summary.grandTotal
    };

    // Update fields
    quotation.property = property;
    if (req.body.rooms) {
      quotation.rooms = req.body.rooms;
    }
    quotation.products = calculations.products;
    quotation.labour = calculations.labour;
    quotation.additionalCharges = calculations.additionalCharges;
    quotation.discount = calculations.discount;
    quotation.gst = calculations.gst;
    quotation.summary = calculations.summary;
    quotation.remarks = remarks || {};
    quotation.attachments = attachments || {};

    quotation.settingsProfileId = settingsProfileId;
    quotation.settingsVersion = settingsVersion;
    quotation.settingsSnapshot = settingsSnapshot;

    // Calculation version parameters
    quotation.calculationTimestamp = calculations.audit.calculationTimestamp;
    quotation.engineVersion = calculations.audit.engineVersion;
    quotation.calculationDurationMs = calculations.audit.durationMs;
    quotation.validationResults = calculations.validationErrors;
    quotation.validationWarnings = calculations.validationWarnings;

    // Legacy updates
    quotation.interiorArea = property?.interiorArea || 0;
    quotation.exteriorArea = property?.exteriorArea || 0;
    quotation.calculation = legacyCalculation;

    await quotation.save();

    res.status(200).json({
      success: true,
      message: 'Quotation draft updated successfully',
      data: quotation
    });
  } catch (error) {
    console.error('Error updating quotation draft:', error);
    res.status(500).json({ success: false, message: 'Failed to update quotation draft', error: error.message });
  }
};

// POST /api/vendor/painting/quotations/:id/submit
exports.submitQuotation = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorId = req.user.id;

    const quotation = await PaintingQuotation.findOne({ _id: id, vendorId });
    if (!quotation) {
      return res.status(404).json({ success: false, message: 'Quotation not found.' });
    }

    if (quotation.status !== 'DRAFT' && quotation.status !== 'ADMIN_REJECTED' && quotation.status !== 'REVISION_REQUESTED') {
      return res.status(400).json({
        success: false,
        message: `Quotation cannot be submitted as it is currently in ${quotation.status} status.`
      });
    }

     const isRevision = quotation.status === 'REVISION_REQUESTED' || quotation.status === 'ADMIN_REJECTED';
     quotation.status = 'SUBMITTED_TO_ADMIN';
     if (isRevision) {
       quotation.currentVersion = (quotation.currentVersion || 1) + 1;
       await logVersionSnapshot(quotation, vendorId, 'Vendor Revision');
     } else {
       quotation.currentVersion = 1;
       await logVersionSnapshot(quotation, vendorId, 'Vendor Draft');
     }
     
     // Reset review status to match submission
     quotation.review = quotation.review || {};
     quotation.review.status = 'SUBMITTED_TO_ADMIN';
     
     await quotation.save();

    // Notify Admins of New Quotation Submission (Non-blocking)
    (async () => {
      try {
        const { createNotification } = require('../notificationControllers/notificationController');
        const Admin = require('../../models/Admin');
        const admins = await Admin.find({ role: { $in: ['SUPER_ADMIN', 'CITY_ADMIN', 'super_admin', 'city_admin', 'admin'] } });
        
        const notificationData = {
          type: 'general',
          title: 'New Painting Quotation Submitted',
          message: `Vendor has submitted a painting quotation of ₹${quotation.summary?.grandTotal || quotation.calculation?.grandTotal} for review.`,
          relatedId: quotation._id,
          relatedType: 'booking'
        };

        await Promise.all(admins.map(admin => 
          createNotification({ ...notificationData, adminId: admin._id })
        ));
      } catch (e) {
        console.error('Non-blocking admin notification error:', e);
      }
    })();

    res.status(200).json({
      success: true,
      message: 'Quotation submitted to Admin for approval.',
      data: quotation
    });
  } catch (error) {
    console.error('Error submitting quotation to admin:', error);
    res.status(500).json({ success: false, message: 'Failed to submit quotation', error: error.message });
  }
};

// GET /api/vendor/painting/products
exports.getProducts = async (req, res) => {
  try {
    const products = await PaintProduct.find({ isDeleted: false, status: true })
      .populate('brandId', 'name code logo')
      .sort({ displayOrder: 1, productName: 1 });

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching products for vendor:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
  }
};

// GET /api/vendor/painting/labour-rates
exports.getLabourRates = async (req, res) => {
  try {
    const rates = await LabourRate.find({ status: true })
      .sort({ workType: 1 });

    res.status(200).json({
      success: true,
      data: rates
    });
  } catch (error) {
    console.error('Error fetching labour rates for vendor:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch labour rates', error: error.message });
  }
};

// GET /api/vendor/painting/templates
exports.getTemplatesForVendor = async (req, res) => {
  try {
    const templates = await PropertyTemplate.find({ status: 'PUBLISHED' }).sort({ displayOrder: 1 });
    res.status(200).json({ success: true, data: templates });
  } catch (error) {
    console.error('Error fetching templates for vendor:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch templates', error: error.message });
  }
};

// GET /api/vendor/painting/settings
exports.getSettingsForVendor = async (req, res) => {
  try {
    const defaultProfile = await PaintingSettings.findOne({ isDefault: true }).populate('activeVersionId');
    res.status(200).json({ success: true, data: defaultProfile });
  } catch (error) {
    console.error('Error fetching settings for vendor:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch settings', error: error.message });
  }
};
