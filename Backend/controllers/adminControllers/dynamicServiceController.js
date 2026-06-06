const ServiceField = require('../../models/ServiceField');
const ServiceWorkflow = require('../../models/ServiceWorkflow');
const ServiceWorkflowStep = require('../../models/ServiceWorkflowStep');
const PricingRule = require('../../models/PricingRule');
const Service = require('../../models/Service');

// Get Dynamic Fields
exports.getFields = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const fields = await ServiceField.find({ serviceId }).sort({ order: 1 });
    res.status(200).json({ success: true, fields });
  } catch (error) {
    next(error);
  }
};

// Save Dynamic Fields
exports.saveFields = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const { fields } = req.body; // Array of fields

    // Delete existing
    await ServiceField.deleteMany({ serviceId });

    // Insert new fields
    const createdFields = [];
    if (Array.isArray(fields) && fields.length > 0) {
      for (const field of fields) {
        const newField = await ServiceField.create({
          serviceId,
          label: field.label,
          name: field.name,
          fieldType: field.fieldType,
          isRequired: !!field.isRequired,
          showToUser: field.showToUser !== undefined ? !!field.showToUser : true,
          options: field.options || [],
          defaultValue: field.defaultValue || '',
          order: Number(field.order) || 0
        });
        createdFields.push(newField);
      }
    }

    res.status(200).json({ success: true, message: 'Fields saved successfully', fields: createdFields });
  } catch (error) {
    next(error);
  }
};

// Get Workflow Configuration
exports.getWorkflow = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const workflow = await ServiceWorkflow.findOne({ serviceId });
    if (!workflow) {
      return res.status(200).json({ success: true, workflow: null, steps: [] });
    }
    const steps = await ServiceWorkflowStep.find({ workflowId: workflow._id }).sort({ sequence: 1 });
    res.status(200).json({ success: true, workflow, steps });
  } catch (error) {
    next(error);
  }
};

// Save Workflow Configuration
exports.saveWorkflow = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const { workflowType, totalVisits, frequency, steps } = req.body;

    let workflow = await ServiceWorkflow.findOne({ serviceId });
    if (!workflow) {
      workflow = new ServiceWorkflow({ serviceId });
    }

    workflow.workflowType = workflowType;
    workflow.totalVisits = totalVisits || 1;
    workflow.frequency = frequency || 'none';
    await workflow.save();

    // Delete existing steps
    await ServiceWorkflowStep.deleteMany({ workflowId: workflow._id });

    // Create steps
    const createdSteps = [];
    if (Array.isArray(steps) && steps.length > 0) {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const newStep = await ServiceWorkflowStep.create({
          workflowId: workflow._id,
          sequence: i + 1,
          title: step.title,
          daysAfterPreviousVisit: step.daysAfterPreviousVisit || 0,
          schedulingType: step.schedulingType || 'auto_offset'
        });
        createdSteps.push(newStep);
      }
    }

    res.status(200).json({ success: true, message: 'Workflow saved successfully', workflow, steps: createdSteps });
  } catch (error) {
    next(error);
  }
};

// Get Pricing Rules
exports.getPricing = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const rules = await PricingRule.find({ serviceId });
    res.status(200).json({ success: true, rules });
  } catch (error) {
    next(error);
  }
};

// Save Pricing Rules
exports.savePricing = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const { rules } = req.body; // Array of rules

    // Delete existing
    await PricingRule.deleteMany({ serviceId });

    // Insert new rules
    const createdRules = [];
    if (Array.isArray(rules) && rules.length > 0) {
      for (const rule of rules) {
        const newRule = await PricingRule.create({
          serviceId,
          ruleType: rule.ruleType || 'conditional',
          formulaString: rule.formulaString || '',
          fieldName: rule.fieldName || '',
          operator: rule.operator || '',
          value: rule.value || '',
          priceModifierType: rule.priceModifierType || '',
          modifierValue: Number(rule.modifierValue) || 0
        });
        createdRules.push(newRule);
      }
    }

    res.status(200).json({ success: true, message: 'Pricing rules saved successfully', rules: createdRules });
  } catch (error) {
    next(error);
  }
};

// Apply Template Configuration
exports.applyTemplate = async (req, res, next) => {
  try {
    const { serviceId } = req.params;
    const { templateType } = req.body; // 'home_cleaning', 'massage', 'pest_control', 'physiotherapy', 'amc'

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    // Clear existing configurations
    await ServiceField.deleteMany({ serviceId });
    await ServiceWorkflow.deleteMany({ serviceId });
    await PricingRule.deleteMany({ serviceId });

    if (templateType === 'home_cleaning') {
      // 1. Fields
      await ServiceField.create([
        { serviceId, label: 'Number of Rooms', name: 'rooms', fieldType: 'dropdown', options: ['1', '2', '3', '4', '5+'], order: 1, isRequired: true },
        { serviceId, label: 'Number of Bathrooms', name: 'bathrooms', fieldType: 'dropdown', options: ['1', '2', '3', '4+'], order: 2, isRequired: true },
        { serviceId, label: 'Room Size', name: 'room_size', fieldType: 'dropdown', options: ['Small', 'Medium', 'Large'], order: 3, isRequired: false },
        { serviceId, label: 'Cleaning Method (Cleaning kaise hogi)', name: 'cleaning_method', fieldType: 'dropdown', options: ['Mop (Mop se)', 'Vacuum (Vacuum cleaner se)', 'Deep clean machine (Machine deep cleaning)'], order: 4, isRequired: true },
        { serviceId, label: 'Deep Cleaning Required?', name: 'deep_clean', fieldType: 'checkbox', order: 5 },
        { serviceId, label: 'Upload Room Images', name: 'room_images', fieldType: 'image', order: 6 }
      ]);
      // 2. Workflow
      await ServiceWorkflow.create({ serviceId, workflowType: 'single_visit', totalVisits: 1 });
      // 3. Conditional Pricing Rules (simple and visual for admin)
      await PricingRule.create([
        { serviceId, ruleType: 'conditional', fieldName: 'rooms', operator: 'equals', value: '1', priceModifierType: 'add', modifierValue: 200 },
        { serviceId, ruleType: 'conditional', fieldName: 'rooms', operator: 'equals', value: '2', priceModifierType: 'add', modifierValue: 400 },
        { serviceId, ruleType: 'conditional', fieldName: 'rooms', operator: 'equals', value: '3', priceModifierType: 'add', modifierValue: 600 },
        { serviceId, ruleType: 'conditional', fieldName: 'rooms', operator: 'equals', value: '4', priceModifierType: 'add', modifierValue: 800 },
        { serviceId, ruleType: 'conditional', fieldName: 'rooms', operator: 'equals', value: '5+', priceModifierType: 'add', modifierValue: 1000 },
        { serviceId, ruleType: 'conditional', fieldName: 'room_size', operator: 'equals', value: 'Medium', priceModifierType: 'add', modifierValue: 100 },
        { serviceId, ruleType: 'conditional', fieldName: 'room_size', operator: 'equals', value: 'Large', priceModifierType: 'add', modifierValue: 200 },
        { serviceId, ruleType: 'conditional', fieldName: 'cleaning_method', operator: 'equals', value: 'Vacuum (Vacuum cleaner se)', priceModifierType: 'add', modifierValue: 150 },
        { serviceId, ruleType: 'conditional', fieldName: 'cleaning_method', operator: 'equals', value: 'Deep clean machine (Machine deep cleaning)', priceModifierType: 'add', modifierValue: 300 }
      ]);

    } else if (templateType === 'massage') {
      // 1. Fields
      await ServiceField.create([
        { serviceId, label: 'Duration (Minutes)', name: 'duration', fieldType: 'radio', options: ['60', '90', '120'], order: 1, isRequired: true },
        { serviceId, label: 'Preferred Therapist Gender', name: 'therapist_gender', fieldType: 'radio', options: ['Male', 'Female', 'Any'], order: 2, isRequired: true },
        { serviceId, label: 'Oil Type Selection', name: 'oil_type', fieldType: 'dropdown', options: ['Aromatherapy Oil', 'Coconut Oil', 'Mustard Oil'], order: 3, isRequired: false }
      ]);
      // 2. Workflow
      await ServiceWorkflow.create({ serviceId, workflowType: 'single_visit', totalVisits: 1 });
      // 3. Dynamic Rules
      await PricingRule.create([
        { serviceId, ruleType: 'conditional', fieldName: 'duration', operator: 'equals', value: '90', priceModifierType: 'add', modifierValue: 400 },
        { serviceId, ruleType: 'conditional', fieldName: 'duration', operator: 'equals', value: '120', priceModifierType: 'add', modifierValue: 800 }
      ]);

    } else if (templateType === 'pest_control') {
      // 1. Fields
      await ServiceField.create([
        { serviceId, label: 'Property Type', name: 'property_type', fieldType: 'dropdown', options: ['1 BHK', '2 BHK', '3 BHK', 'Villa/Independent'], order: 1, isRequired: true },
        { serviceId, label: 'Infestation Level', name: 'infestation', fieldType: 'radio', options: ['Low', 'Medium', 'High'], order: 2, isRequired: true }
      ]);
      // 2. Workflow (2 visits, second visit is 15 days later)
      const workflow = await ServiceWorkflow.create({ serviceId, workflowType: 'multi_visit', totalVisits: 2 });
      await ServiceWorkflowStep.create([
        { workflowId: workflow._id, sequence: 1, title: 'Initial Pest Treatment', daysAfterPreviousVisit: 0 },
        { workflowId: workflow._id, sequence: 2, title: 'Follow-up Treatment & Prevention', daysAfterPreviousVisit: 15 }
      ]);

    } else if (templateType === 'physiotherapy') {
      // 1. Fields
      await ServiceField.create([
        { serviceId, label: 'Session Type', name: 'session_type', fieldType: 'dropdown', options: ['Orthopedic', 'Neurological', 'Cardio-respiratory'], order: 1, isRequired: true },
        { serviceId, label: 'Location Map Coord', name: 'map_location', fieldType: 'location', order: 2, isRequired: false }
      ]);
      // 2. Workflow (4 visits, daily)
      const workflow = await ServiceWorkflow.create({ serviceId, workflowType: 'multi_visit', totalVisits: 4 });
      await ServiceWorkflowStep.create([
        { workflowId: workflow._id, sequence: 1, title: 'Session 1: Assessment & Therapy', daysAfterPreviousVisit: 0 },
        { workflowId: workflow._id, sequence: 2, title: 'Session 2: Progress Therapy', daysAfterPreviousVisit: 1, schedulingType: 'custom_scheduling' },
        { workflowId: workflow._id, sequence: 3, title: 'Session 3: Progress Therapy', daysAfterPreviousVisit: 1, schedulingType: 'custom_scheduling' },
        { workflowId: workflow._id, sequence: 4, title: 'Session 4: Final Therapy & Discharge', daysAfterPreviousVisit: 1, schedulingType: 'custom_scheduling' }
      ]);

    } else if (templateType === 'amc') {
      // Annual Maintenance Contract (12 Monthly Visits)
      await ServiceField.create([
        { serviceId, label: 'Appliance Model Name/Brand', name: 'appliance_brand', fieldType: 'text', order: 1, isRequired: true },
        { serviceId, label: 'Appliance Serial Photo', name: 'serial_photo', fieldType: 'image', order: 2, isRequired: false }
      ]);
      await ServiceWorkflow.create({ serviceId, workflowType: 'recurring', totalVisits: 12, frequency: 'monthly' });
    }

    res.status(200).json({ success: true, message: `Template '${templateType}' applied successfully` });
  } catch (error) {
    next(error);
  }
};
