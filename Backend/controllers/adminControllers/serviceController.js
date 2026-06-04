const Service = require('../../models/Service');
const ServiceBrandPricing = require('../../models/ServiceBrandPricing');
const { validationResult } = require('express-validator');
const { SERVICE_STATUS } = require('../../utils/constants');

/**
 * Get all services (with filter by brandId)
 * GET /api/admin/services
 */
const getAllServices = async (req, res) => {
  try {
    const { status, categoryId, subCategoryId } = req.query;

    const query = {};
    if (status) query.status = status;
    if (categoryId) query.categoryId = categoryId;
    if (subCategoryId) query.subCategoryId = subCategoryId;

    const services = await Service.find(query)
      .populate('categoryId', 'title')
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
      rules
    } = req.body;

    const cleanedCategoryId = (categoryId === '' || !categoryId) ? null : categoryId;
    const cleanedSubCategoryId = (subCategoryId === '' || !subCategoryId) ? null : subCategoryId;

    const service = await Service.create({
      categoryId: cleanedCategoryId,
      subCategoryId: cleanedSubCategoryId,
      title,
      description,
      status: status || SERVICE_STATUS.ACTIVE,
      iconUrl
    });

    if (basePrice !== undefined && cleanedCategoryId) {
      await ServiceBrandPricing.create({
        categoryId: cleanedCategoryId,
        subCategoryId: cleanedSubCategoryId || null,
        serviceId: service._id,
        brandId: brandId || null,
        basePrice: Number(basePrice),
        gstPercentage: Number(gstPercentage || 18),
        vendorProfit: 0, // Admin can update this later via Pricing Matrix
        isActive: true
      });
    }

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

    // Pricing Rules (Step 4)
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
    if (updates.status) service.status = updates.status;
    if (updates.iconUrl !== undefined) service.iconUrl = updates.iconUrl;

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

module.exports = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService
};
