const Service = require('../../models/Service');
const ServiceBrandPricing = require('../../models/ServiceBrandPricing');
const ServicePageBlock = require('../../models/ServicePageBlock');
const { validationResult } = require('express-validator');
const { SERVICE_STATUS } = require('../../utils/constants');

/**
 * Get all services (with filter by brandId)
 * GET /api/admin/services
 */
const getAllServices = async (req, res) => {
  try {
    const { status, categoryId, subCategoryId, cityId } = req.query;

    const query = {};
    if (status) query.status = status;
    if (categoryId) query.categoryId = categoryId;
    if (subCategoryId) query.subCategoryId = subCategoryId;
    if (cityId) {
      query.$or = [
        { cityIds: cityId },
        { cityIds: { $exists: false } },
        { cityIds: { $size: 0 } }
      ];
    }

    const services = await Service.find(query)
      .populate('categoryId', 'title templateId')
      .populate('subCategoryId', 'title')
      .sort({ createdAt: -1 });

    let servicesList = services;

    // If brandId is provided, join with ServiceBrandPricing
    if (req.query.brandId) {
      const pricings = await ServiceBrandPricing.find({ brandId: req.query.brandId, isActive: true }).lean();
      const pricingMap = new Map();
      pricings.forEach(p => pricingMap.set(p.serviceId.toString(), p));

      servicesList = services.map(s => {
        const doc = s.toObject ? s.toObject() : s;
        const pricing = pricingMap.get(doc._id.toString());
        if (pricing) {
          doc.basePrice = pricing.basePrice;
          doc.finalCustomerPrice = pricing.finalCustomerPrice;
          doc.gstPercentage = pricing.gstPercentage;
          doc.discountPrice = pricing.discountPrice || 0;
          doc.pricingId = pricing._id;
        }
        return doc;
      }).filter(s => s.basePrice !== undefined); // Only return services that have a pricing mapping for this brand
    } else {
      // Default: attach first available pricing mapping so that price shows up globally (e.g. in promo manager)
      const pricings = await ServiceBrandPricing.find({ isActive: true }).lean();
      const pricingMap = new Map();
      pricings.forEach(p => {
        if (!pricingMap.has(p.serviceId.toString())) {
          pricingMap.set(p.serviceId.toString(), p);
        }
      });

      servicesList = services.map(s => {
        const doc = s.toObject ? s.toObject() : s;
        const pricing = pricingMap.get(doc._id.toString());
        if (pricing) {
          doc.basePrice = pricing.basePrice;
          doc.finalCustomerPrice = pricing.finalCustomerPrice;
          doc.gstPercentage = pricing.gstPercentage;
          doc.discountPrice = pricing.discountPrice || 0;
          doc.pricingId = pricing._id;
        }
        return doc;
      });
    }

    res.status(200).json({
      success: true,
      count: servicesList.length,
      services: servicesList
    });
  } catch (error) {
    console.error('Get all services error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services'
    });
  }
};

/**
 * Get single service by ID
 * GET /api/admin/services/:id
 */
const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('categoryId', 'title')
      .populate('subCategoryId', 'title');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    res.status(200).json({
      success: true,
      service
    });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service'
    });
  }
};

/**
 * Create new service
 * POST /api/admin/services
 */
const createService = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      categoryId,
      subCategoryId,
      title,
      description,
      status,
      iconUrl,
      brandId,
      basePrice,
      gstPercentage,
      discountPrice,
      fields,
      workflow,
      rules,
      cityIds,
      // NEW: service type fields
      serviceType,
      pricePerMinute,
      minimumMinutes,
      packages,
      serviceGroups,
      quoteInstructions,
      maxImageUploads,
      pageBlocks,
      features,
      steps,
      variants,
      rating,
      reviewCount
    } = req.body;

    const cleanedCategoryId = (categoryId === '' || !categoryId) ? null : categoryId;
    const cleanedSubCategoryId = (subCategoryId === '' || !subCategoryId) ? null : subCategoryId;

    const service = await Service.create({
      categoryId: cleanedCategoryId,
      subCategoryId: cleanedSubCategoryId,
      title,
      description,
      features: Array.isArray(features) ? features : [],
      steps: Array.isArray(steps) ? steps : [],
      status: status || SERVICE_STATUS.ACTIVE,
      iconUrl,
      cityIds: Array.isArray(cityIds) ? cityIds : [],
      rating: rating !== undefined ? Number(rating) : 4.5,
      reviewCount: reviewCount !== undefined ? reviewCount : '1.2k',
      // Service type fields
      serviceType: serviceType || 'package_base',
      pricePerMinute: serviceType === 'minute_base' ? (Number(pricePerMinute) || null) : null,
      minimumMinutes: serviceType === 'minute_base' ? (Number(minimumMinutes) || 30) : 30,
      packages: (serviceType === 'package_base' || serviceType === 'subscription_base') && Array.isArray(packages) ? packages : [],
      serviceGroups: serviceType === 'package_base' && Array.isArray(serviceGroups) ? serviceGroups : [],
      quoteInstructions: serviceType === 'image_base' ? (quoteInstructions || null) : null,
      maxImageUploads: serviceType === 'image_base' ? (Number(maxImageUploads) || 5) : 5,
      variants: Array.isArray(variants) ? variants : []
    });

    // basePrice and gstPercentage handling removed. Prices are strictly managed from Pricing Matrix.

    // Dynamic Fields (Step 2)
    if (Array.isArray(fields) && fields.length > 0) {
      const ServiceField = require('../../models/ServiceField');
      for (const field of fields) {
        await ServiceField.create({
          serviceId: service._id,
          label: field.label,
          name: field.name,
          fieldType: field.fieldType,
          isRequired: !!field.isRequired,
          showToUser: field.showToUser !== undefined ? !!field.showToUser : true,
          options: field.options || [],
          defaultValue: field.defaultValue || '',
          order: Number(field.order) || 0
        });
      }
    }

    // Workflow (Step 3)
    if (workflow) {
      const ServiceWorkflow = require('../../models/ServiceWorkflow');
      const ServiceWorkflowStep = require('../../models/ServiceWorkflowStep');
      const newWorkflow = await ServiceWorkflow.create({
        serviceId: service._id,
        workflowType: workflow.workflowType || 'single_visit',
        totalVisits: workflow.totalVisits || 1,
        frequency: workflow.frequency || 'none'
      });
      if (Array.isArray(workflow.steps) && workflow.steps.length > 0) {
        for (let i = 0; i < workflow.steps.length; i++) {
          const step = workflow.steps[i];
          await ServiceWorkflowStep.create({
            workflowId: newWorkflow._id,
            sequence: i + 1,
            title: step.title,
            daysAfterPreviousVisit: step.daysAfterPreviousVisit || 0,
            schedulingType: step.schedulingType || 'auto_offset'
          });
        }
      }
    }

    // Pricing Rules (Step 5)
    if (Array.isArray(rules) && rules.length > 0) {
      const PricingRule = require('../../models/PricingRule');
      for (const rule of rules) {
        await PricingRule.create({
          serviceId: service._id,
          ruleType: rule.ruleType || 'conditional',
          formulaString: rule.formulaString || '',
          fieldName: rule.fieldName || '',
          operator: rule.operator || '',
          value: rule.value || '',
          priceModifierType: rule.priceModifierType || '',
          modifierValue: Number(rule.modifierValue) || 0
        });
      }
    }

    // Page Builder Blocks (Step 4)
    if (Array.isArray(pageBlocks) && pageBlocks.length > 0) {
      for (let i = 0; i < pageBlocks.length; i++) {
        const block = pageBlocks[i];
        await ServicePageBlock.create({
          serviceId: service._id,
          blockType: block.blockType,
          order: block.order !== undefined ? block.order : i,
          isVisible: block.isVisible !== false,
          data: block.data || {}
        });
      }
    }

    // Create default ServiceBrandPricing entry so service is visible and bookable
    if (cleanedCategoryId) {
      try {
        const targetBrandId = brandId || null;
        await ServiceBrandPricing.create({
          categoryId: cleanedCategoryId,
          subCategoryId: cleanedSubCategoryId || null,
          serviceId: service._id,
          brandId: targetBrandId,
          basePrice: Number(basePrice) || 0,
          gstPercentage: Number(gstPercentage || 18),
          vendorProfit: 0,
          isActive: true
        });
      } catch (pricingErr) {
        console.error('[CreateService] Failed to create default brand pricing:', pricingErr);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    // Handle duplicate slug error specifically
    if (error.code === 11000 && error.keyPattern && error.keyPattern.slug) {
      return res.status(409).json({
        success: false,
        message: 'A service with this name already exists.'
      });
    }

    console.error('Create service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create service'
    });
  }
};

/**
 * Update service
 * PUT /api/admin/services/:id
 */
const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    if (updates.title) service.title = updates.title;
    if (updates.categoryId !== undefined) {
      service.categoryId = (updates.categoryId === '' || !updates.categoryId) ? null : updates.categoryId;
    }
    if (updates.subCategoryId !== undefined) {
      service.subCategoryId = (updates.subCategoryId === '' || !updates.subCategoryId) ? null : updates.subCategoryId;
    }
    if (updates.description !== undefined) service.description = updates.description;
    if (updates.features !== undefined) {
      service.features = Array.isArray(updates.features) ? updates.features : [];
      service.markModified('features');
    }
    if (updates.steps !== undefined) {
      service.steps = Array.isArray(updates.steps) ? updates.steps : [];
      service.markModified('steps');
    }
    if (updates.status) service.status = updates.status;
    if (updates.iconUrl !== undefined) service.iconUrl = updates.iconUrl;
    if (updates.rating !== undefined) service.rating = Number(updates.rating) || 4.5;
    if (updates.reviewCount !== undefined) service.reviewCount = updates.reviewCount;
    if (updates.cityIds !== undefined) {
      service.cityIds = Array.isArray(updates.cityIds) ? updates.cityIds : [];
      service.markModified('cityIds');
    }
    // Service type updates
    if (updates.serviceType) service.serviceType = updates.serviceType;
    if (updates.pricePerMinute !== undefined) service.pricePerMinute = updates.pricePerMinute;
    if (updates.minimumMinutes !== undefined) service.minimumMinutes = updates.minimumMinutes;
    if (updates.packages !== undefined) {
      service.packages = Array.isArray(updates.packages) ? updates.packages : [];
      service.markModified('packages');
    }
    if (updates.variants !== undefined) {
      service.variants = Array.isArray(updates.variants) ? updates.variants : [];
      service.markModified('variants');
    }
    if (updates.quoteInstructions !== undefined) service.quoteInstructions = updates.quoteInstructions;
    if (updates.maxImageUploads !== undefined) service.maxImageUploads = updates.maxImageUploads;
    if (updates.serviceGroups !== undefined) {
      service.serviceGroups = Array.isArray(updates.serviceGroups) ? updates.serviceGroups : [];
      service.markModified('serviceGroups');
    }

    await service.save();

    if (updates.basePrice !== undefined) {
      const targetBrandId = updates.brandId || null;
      const pricing = await ServiceBrandPricing.findOne({ serviceId: service._id, brandId: targetBrandId });
      if (pricing) {
        pricing.basePrice = Number(updates.basePrice);
        if (updates.gstPercentage !== undefined) pricing.gstPercentage = Number(updates.gstPercentage);
        if (updates.categoryId !== undefined) {
          pricing.categoryId = (updates.categoryId === '' || !updates.categoryId) ? null : updates.categoryId;
        }
        if (updates.subCategoryId !== undefined) {
          pricing.subCategoryId = (updates.subCategoryId === '' || !updates.subCategoryId) ? null : updates.subCategoryId;
        }
        await pricing.save();
      } else if (updates.categoryId || service.categoryId) {
        const finalCategoryId = (updates.categoryId === '' || !updates.categoryId) ? service.categoryId : updates.categoryId;
        const finalSubCategoryId = (updates.subCategoryId === '' || !updates.subCategoryId) ? service.subCategoryId : updates.subCategoryId;

        await ServiceBrandPricing.create({
          categoryId: finalCategoryId,
          subCategoryId: finalSubCategoryId || null,
          serviceId: service._id,
          brandId: targetBrandId,
          basePrice: Number(updates.basePrice),
          gstPercentage: Number(updates.gstPercentage || 18),
          vendorProfit: 0,
          isActive: true
        });
      }
    }

    // Dynamic Fields (Step 2)
    if (updates.fields !== undefined) {
      const ServiceField = require('../../models/ServiceField');
      await ServiceField.deleteMany({ serviceId: service._id });
      if (Array.isArray(updates.fields) && updates.fields.length > 0) {
        for (const field of updates.fields) {
          await ServiceField.create({
            serviceId: service._id,
            label: field.label,
            name: field.name,
            fieldType: field.fieldType,
            isRequired: !!field.isRequired,
            showToUser: field.showToUser !== undefined ? !!field.showToUser : true,
            options: field.options || [],
            defaultValue: field.defaultValue || '',
            order: Number(field.order) || 0
          });
        }
      }
    }

    // Workflow (Step 3)
    if (updates.workflow !== undefined) {
      const ServiceWorkflow = require('../../models/ServiceWorkflow');
      const ServiceWorkflowStep = require('../../models/ServiceWorkflowStep');

      const existingWorkflow = await ServiceWorkflow.findOne({ serviceId: service._id });
      if (existingWorkflow) {
        await ServiceWorkflowStep.deleteMany({ workflowId: existingWorkflow._id });
        await ServiceWorkflow.deleteOne({ _id: existingWorkflow._id });
      }

      if (updates.workflow) {
        const newWorkflow = await ServiceWorkflow.create({
          serviceId: service._id,
          workflowType: updates.workflow.workflowType || 'single_visit',
          totalVisits: updates.workflow.totalVisits || 1,
          frequency: updates.workflow.frequency || 'none'
        });
        if (Array.isArray(updates.workflow.steps) && updates.workflow.steps.length > 0) {
          for (let i = 0; i < updates.workflow.steps.length; i++) {
            const step = updates.workflow.steps[i];
            await ServiceWorkflowStep.create({
              workflowId: newWorkflow._id,
              sequence: i + 1,
              title: step.title,
              daysAfterPreviousVisit: step.daysAfterPreviousVisit || 0,
              schedulingType: step.schedulingType || 'auto_offset'
            });
          }
        }
      }
    }

    // Pricing Rules (Step 4)
    if (updates.rules !== undefined) {
      const PricingRule = require('../../models/PricingRule');
      await PricingRule.deleteMany({ serviceId: service._id });
      if (Array.isArray(updates.rules) && updates.rules.length > 0) {
        for (const rule of updates.rules) {
          await PricingRule.create({
            serviceId: service._id,
            ruleType: rule.ruleType || 'conditional',
            formulaString: rule.formulaString || '',
            fieldName: rule.fieldName || '',
            operator: rule.operator || '',
            value: rule.value || '',
            priceModifierType: rule.priceModifierType || '',
            modifierValue: Number(rule.modifierValue) || 0
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Service updated successfully',
      service
    });
  } catch (error) {
    // Handle duplicate slug error specifically
    if (error.code === 11000 && error.keyPattern && error.keyPattern.slug) {
      return res.status(409).json({
        success: false,
        message: 'A service with this name already exists.'
      });
    }

    console.error('Update service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service'
    });
  }
};

/**
 * Delete service
 * DELETE /api/admin/services/:id
 */
const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    // Hard delete as requested
    const service = await Service.findByIdAndDelete(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    // Also delete associated pricings
    await ServiceBrandPricing.deleteMany({ serviceId: id });

    res.status(200).json({
      success: true,
      message: 'Service deleted permanently'
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service'
    });
  }
};

/**
 * Get page blocks for a service
 * GET /api/admin/services/:id/page-blocks
 */
const getPageBlocks = async (req, res) => {
  try {
    const { id } = req.params;
    const blocks = await ServicePageBlock.find({ serviceId: id }).sort({ order: 1 });
    res.status(200).json({ success: true, blocks });
  } catch (error) {
    console.error('Get page blocks error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch page blocks' });
  }
};

/**
 * Save (replace all) page blocks for a service
 * PUT /api/admin/services/:id/page-blocks
 */
const savePageBlocks = async (req, res) => {
  try {
    const { id } = req.params;
    const { blocks } = req.body;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Delete all existing blocks and replace with new ones
    await ServicePageBlock.deleteMany({ serviceId: id });

    const savedBlocks = [];
    if (Array.isArray(blocks) && blocks.length > 0) {
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const saved = await ServicePageBlock.create({
          serviceId: id,
          blockType: block.blockType,
          order: block.order !== undefined ? block.order : i,
          isVisible: block.isVisible !== false,
          data: block.data || {}
        });
        savedBlocks.push(saved);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Page blocks saved successfully',
      blocks: savedBlocks
    });
  } catch (error) {
    console.error('Save page blocks error:', error);
    res.status(500).json({ success: false, message: 'Failed to save page blocks' });
  }
};

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getPageBlocks,
  savePageBlocks
};
