const PropertyTemplate = require('../../models/PropertyTemplate');
const PaintingConsultation = require('../../models/PaintingConsultation');

// GET /api/admin/painting/templates
exports.getTemplates = async (req, res) => {
  try {
    const { search, category, status, sortBy } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'ALL') {
      query.category = category;
    }

    if (status && status !== 'ALL') {
      query.status = status;
    } else {
      query.status = { $ne: 'ARCHIVED' }; // Exclude soft deleted by default
    }

    let sort = { displayOrder: 1, createdAt: -1 };
    if (sortBy === 'NEWEST') sort = { createdAt: -1 };
    if (sortBy === 'OLDEST') sort = { createdAt: 1 };
    if (sortBy === 'NAME_ASC') sort = { name: 1 };
    if (sortBy === 'NAME_DESC') sort = { name: -1 };

    const templates = await PropertyTemplate.find(query).sort(sort);

    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching property templates:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch templates', error: error.message });
  }
};

// GET /api/admin/painting/templates/:id
exports.getTemplateById = async (req, res) => {
  try {
    const template = await PropertyTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.status(200).json({ success: true, data: template });
  } catch (error) {
    console.error('Error fetching template details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch template details', error: error.message });
  }
};

// POST /api/admin/painting/templates
exports.createTemplate = async (req, res) => {
  try {
    const { name, code, description, category, displayOrder, isDefault, defaultScope, roomLibrary, featureLibrary, rooms, exteriorZones } = req.body;

    const existing = await PropertyTemplate.findOne({ $or: [{ name }, { code }] });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A template with this name or code already exists' });
    }

    // Set other templates as not default if this one is marked default
    if (isDefault) {
      await PropertyTemplate.updateMany({}, { isDefault: false });
    }

    const template = await PropertyTemplate.create({
      name,
      code,
      description,
      category,
      displayOrder: displayOrder || 0,
      isDefault: isDefault || false,
      defaultScope: defaultScope || 'BOTH',
      roomLibrary: roomLibrary || [],
      featureLibrary: featureLibrary || [],
      rooms: rooms || [],
      exteriorZones: exteriorZones || [],
      version: 1,
      versions: [{
        version: 1,
        rooms: rooms || [],
        exteriorZones: exteriorZones || [],
        changedBy: req.user?.id,
        changeSummary: 'Initial blueprint creation',
        createdAt: new Date()
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Property template created successfully',
      data: template
    });
  } catch (error) {
    console.error('Error creating property template:', error);
    res.status(500).json({ success: false, message: 'Failed to create template', error: error.message });
  }
};

// PUT /api/admin/painting/templates/:id
exports.updateTemplate = async (req, res) => {
  try {
    const { name, code, description, category, displayOrder, isDefault, defaultScope, roomLibrary, featureLibrary, rooms, exteriorZones, status, changeSummary } = req.body;

    const template = await PropertyTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    if (isDefault && !template.isDefault) {
      await PropertyTemplate.updateMany({ _id: { $ne: template._id } }, { isDefault: false });
    }

    // If template is PUBLISHED, we should increment its version if rooms/exterior change
    let shouldIncrementVersion = false;
    if (template.status === 'PUBLISHED' && (rooms || exteriorZones)) {
      shouldIncrementVersion = true;
    }

    const updatedData = {
      name: name || template.name,
      code: code || template.code,
      description: description !== undefined ? description : template.description,
      category: category || template.category,
      displayOrder: displayOrder !== undefined ? displayOrder : template.displayOrder,
      isDefault: isDefault !== undefined ? isDefault : template.isDefault,
      defaultScope: defaultScope || template.defaultScope,
      roomLibrary: roomLibrary || template.roomLibrary,
      featureLibrary: featureLibrary || template.featureLibrary,
      status: status || template.status
    };

    if (rooms) updatedData.rooms = rooms;
    if (exteriorZones) updatedData.exteriorZones = exteriorZones;

    if (shouldIncrementVersion) {
      updatedData.version = template.version + 1;
      template.versions.push({
        version: updatedData.version,
        rooms: rooms || template.rooms,
        exteriorZones: exteriorZones || template.exteriorZones,
        changedBy: req.user?.id,
        changeSummary: changeSummary || `Updated template version to ${updatedData.version}`,
        createdAt: new Date()
      });
      updatedData.versions = template.versions;
    }

    const updatedTemplate = await PropertyTemplate.findByIdAndUpdate(req.params.id, updatedData, { new: true });

    res.status(200).json({
      success: true,
      message: 'Property template updated successfully',
      data: updatedTemplate
    });
  } catch (error) {
    console.error('Error updating property template:', error);
    res.status(500).json({ success: false, message: 'Failed to update template', error: error.message });
  }
};

// POST /api/admin/painting/templates/:id/duplicate
exports.duplicateTemplate = async (req, res) => {
  try {
    const template = await PropertyTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const newName = `${template.name} (Copy) ${randomSuffix}`;
    const newCode = `${template.code}_COPY_${randomSuffix}`;

    const duplicated = await PropertyTemplate.create({
      name: newName,
      code: newCode,
      description: template.description,
      category: template.category,
      displayOrder: template.displayOrder + 1,
      isDefault: false,
      defaultScope: template.defaultScope,
      roomLibrary: template.roomLibrary,
      featureLibrary: template.featureLibrary,
      rooms: template.rooms,
      exteriorZones: template.exteriorZones,
      version: 1,
      versions: [{
        version: 1,
        rooms: template.rooms,
        exteriorZones: template.exteriorZones,
        changedBy: req.user?.id,
        changeSummary: `Cloned from ${template.name} (v${template.version})`,
        createdAt: new Date()
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Property template duplicated successfully',
      data: duplicated
    });
  } catch (error) {
    console.error('Error duplicating property template:', error);
    res.status(500).json({ success: false, message: 'Failed to duplicate template', error: error.message });
  }
};

// DELETE /api/admin/painting/templates/:id
exports.deleteTemplate = async (req, res) => {
  try {
    const template = await PropertyTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    // Soft delete by setting status to ARCHIVED
    template.status = 'ARCHIVED';
    await template.save();

    res.status(200).json({
      success: true,
      message: 'Property template archived successfully'
    });
  } catch (error) {
    console.error('Error deleting property template:', error);
    res.status(500).json({ success: false, message: 'Failed to delete template', error: error.message });
  }
};

// GET /api/admin/painting/templates/:id/analytics
exports.getTemplateUsage = async (req, res) => {
  try {
    const template = await PropertyTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    // Count consultation records matching the template code
    const consultationsCount = await PaintingConsultation.countDocuments({
      'wizardData.propertyTemplateId': template._id
    });

    // Also count by the propertyType value if it was generated before templates were registered
    const legacyCount = await PaintingConsultation.countDocuments({
      propertyType: template.code
    });

    const activeJobs = await PaintingConsultation.countDocuments({
      'wizardData.propertyTemplateId': template._id,
      status: 'QUOTE_ACCEPTED'
    });

    const lastUsedRecord = await PaintingConsultation.findOne({
      'wizardData.propertyTemplateId': template._id
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        templateId: template._id,
        name: template.name,
        code: template.code,
        consultationsCount: consultationsCount + legacyCount,
        activeJobs: activeJobs,
        lastUsedDate: lastUsedRecord ? lastUsedRecord.createdAt : null
      }
    });
  } catch (error) {
    console.error('Error calculating template analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch template analytics', error: error.message });
  }
};
