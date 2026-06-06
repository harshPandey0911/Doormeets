import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSliders, FiCheckCircle, FiSave, FiX, FiInfo, FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import api from '../../../../../services/api';

const TEMPLATES = {
  home_cleaning: {
    fields: [
      { label: 'Number of Rooms', name: 'rooms', fieldType: 'dropdown', options: ['1', '2', '3', '4', '5+'], order: 1, isRequired: true },
      { label: 'Number of Bathrooms', name: 'bathrooms', fieldType: 'dropdown', options: ['1', '2', '3', '4+'], order: 2, isRequired: true },
      { label: 'Room Size', name: 'room_size', fieldType: 'dropdown', options: ['Small', 'Medium', 'Large'], order: 3, isRequired: false },
      { label: 'Cleaning Method (Cleaning kaise hogi)', name: 'cleaning_method', fieldType: 'dropdown', options: ['Mop (Mop se)', 'Vacuum (Vacuum cleaner se)', 'Deep clean machine (Machine deep cleaning)'], order: 4, isRequired: true },
      { label: 'Deep Cleaning Required?', name: 'deep_clean', fieldType: 'checkbox', order: 5 },
      { label: 'Upload Room Images', name: 'room_images', fieldType: 'image', order: 6 }
    ],
    workflow: { workflowType: 'single_visit', totalVisits: 1, frequency: 'none' },
    steps: [],
    rules: [
      { ruleType: 'conditional', fieldName: 'rooms', operator: 'equals', value: '1', priceModifierType: 'add', modifierValue: 200 },
      { ruleType: 'conditional', fieldName: 'rooms', operator: 'equals', value: '2', priceModifierType: 'add', modifierValue: 400 },
      { ruleType: 'conditional', fieldName: 'rooms', operator: 'equals', value: '3', priceModifierType: 'add', modifierValue: 600 },
      { ruleType: 'conditional', fieldName: 'rooms', operator: 'equals', value: '4', priceModifierType: 'add', modifierValue: 800 },
      { ruleType: 'conditional', fieldName: 'rooms', operator: 'equals', value: '5+', priceModifierType: 'add', modifierValue: 1000 },
      { ruleType: 'conditional', fieldName: 'room_size', operator: 'equals', value: 'Medium', priceModifierType: 'add', modifierValue: 100 },
      { ruleType: 'conditional', fieldName: 'room_size', operator: 'equals', value: 'Large', priceModifierType: 'add', modifierValue: 200 },
      { ruleType: 'conditional', fieldName: 'cleaning_method', operator: 'equals', value: 'Vacuum (Vacuum cleaner se)', priceModifierType: 'add', modifierValue: 150 },
      { ruleType: 'conditional', fieldName: 'cleaning_method', operator: 'equals', value: 'Deep clean machine (Machine deep cleaning)', priceModifierType: 'add', modifierValue: 300 }
    ]
  },
  massage: {
    fields: [
      { label: 'Duration (Minutes)', name: 'duration', fieldType: 'radio', options: ['60', '90', '120'], order: 1, isRequired: true },
      { label: 'Preferred Therapist Gender', name: 'therapist_gender', fieldType: 'radio', options: ['Male', 'Female', 'Any'], order: 2, isRequired: true },
      { label: 'Oil Type Selection', name: 'oil_type', fieldType: 'dropdown', options: ['Aromatherapy Oil', 'Coconut Oil', 'Mustard Oil'], order: 3, isRequired: false }
    ],
    workflow: { workflowType: 'single_visit', totalVisits: 1, frequency: 'none' },
    steps: [],
    rules: [
      { ruleType: 'conditional', fieldName: 'duration', operator: 'equals', value: '90', priceModifierType: 'add', modifierValue: 400 },
      { ruleType: 'conditional', fieldName: 'duration', operator: 'equals', value: '120', priceModifierType: 'add', modifierValue: 800 }
    ]
  },
  pest_control: {
    fields: [
      { label: 'Property Type', name: 'property_type', fieldType: 'dropdown', options: ['1 BHK', '2 BHK', '3 BHK', 'Villa/Independent'], order: 1, isRequired: true },
      { label: 'Infestation Level', name: 'infestation', fieldType: 'radio', options: ['Low', 'Medium', 'High'], order: 2, isRequired: true }
    ],
    workflow: { workflowType: 'multi_visit', totalVisits: 2, frequency: 'none' },
    steps: [
      { title: 'Initial Pest Treatment', daysAfterPreviousVisit: 0, schedulingType: 'auto_offset' },
      { title: 'Follow-up Treatment & Prevention', daysAfterPreviousVisit: 15, schedulingType: 'auto_offset' }
    ],
    rules: []
  },
  physiotherapy: {
    fields: [
      { label: 'Session Type', name: 'session_type', fieldType: 'dropdown', options: ['Orthopedic', 'Neurological', 'Cardio-respiratory'], order: 1, isRequired: true },
      { label: 'Location Map Coord', name: 'map_location', fieldType: 'location', order: 2, isRequired: false }
    ],
    workflow: { workflowType: 'multi_visit', totalVisits: 4, frequency: 'none' },
    steps: [
      { title: 'Session 1: Assessment & Therapy', daysAfterPreviousVisit: 0, schedulingType: 'auto_offset' },
      { title: 'Session 2: Progress Therapy', daysAfterPreviousVisit: 1, schedulingType: 'custom_scheduling' },
      { title: 'Session 3: Progress Therapy', daysAfterPreviousVisit: 1, schedulingType: 'custom_scheduling' },
      { title: 'Session 4: Final Therapy & Discharge', daysAfterPreviousVisit: 1, schedulingType: 'custom_scheduling' }
    ],
    rules: []
  },
  amc: {
    fields: [
      { label: 'Appliance Model Name/Brand', name: 'appliance_brand', fieldType: 'text', order: 1, isRequired: true },
      { label: 'Appliance Serial Photo', name: 'serial_photo', fieldType: 'image', order: 2, isRequired: false }
    ],
    workflow: { workflowType: 'recurring', totalVisits: 12, frequency: 'monthly' },
    steps: [],
    rules: []
  }
};

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  
  // Wizard Navigation Step
  const [activeStep, setActiveStep] = useState(0); // 0: Basic, 1: Fields, 2: Workflow, 3: Pricing
  
  const [formData, setFormData] = useState({ 
    categoryId: '', 
    subCategoryId: '', 
    title: '', 
    description: '', 
    status: 'active',
    templateType: '',
    basePrice: ''
  });

  // Builder States mapped inside the wizard
  const [builderFields, setBuilderFields] = useState([]);
  const [builderWorkflow, setBuilderWorkflow] = useState({
    workflowType: 'single_visit',
    totalVisits: 1,
    frequency: 'none'
  });
  const [builderWorkflowSteps, setBuilderWorkflowSteps] = useState([]);
  const [builderRules, setBuilderRules] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [srvRes, subRes, catRes] = await Promise.all([
        api.get('/admin/services'),
        api.get('/admin/subcategories'),
        api.get('/admin/categories')
      ]);
      setServices(srvRes.data.services || []);
      setSubCategories(subRes.data.data || subRes.data.subCategories || []);
      setCategories(catRes.data.categories || catRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const handleOpenWizard = async (srv = null) => {
    setCurrentService(srv);
    setActiveStep(0);
    
    if (srv) {
      // Edit mode: populate basic details & fetch dynamic configs
      setFormData({
        categoryId: srv.categoryId?._id || srv.categoryId || '',
        subCategoryId: srv.subCategoryId?._id || srv.subCategoryId || '',
        title: srv.title,
        description: srv.description || '',
        status: srv.status,
        templateType: '',
        basePrice: srv.basePrice || ''
      });

      // Load sub-models details
      try {
        const [fieldsRes, workflowRes, pricingRes] = await Promise.all([
          api.get(`/admin/services/${srv._id}/fields`),
          api.get(`/admin/services/${srv._id}/workflow`),
          api.get(`/admin/services/${srv._id}/pricing`)
        ]);
        setBuilderFields(fieldsRes.data.fields || []);
        if (workflowRes.data.workflow) {
          setBuilderWorkflow({
            workflowType: workflowRes.data.workflow.workflowType,
            totalVisits: workflowRes.data.workflow.totalVisits,
            frequency: workflowRes.data.workflow.frequency
          });
          setBuilderWorkflowSteps(workflowRes.data.steps || []);
        } else {
          setBuilderWorkflow({ workflowType: 'single_visit', totalVisits: 1, frequency: 'none' });
          setBuilderWorkflowSteps([]);
        }
        setBuilderRules(pricingRes.data.rules || []);
      } catch (err) {
        console.error('Failed to load sub-details:', err);
      }
    } else {
      // Create Mode: Reset states
      setFormData({ categoryId: '', subCategoryId: '', title: '', description: '', status: 'active', templateType: '', basePrice: '' });
      setBuilderFields([]);
      setBuilderWorkflow({ workflowType: 'single_visit', totalVisits: 1, frequency: 'none' });
      setBuilderWorkflowSteps([]);
      setBuilderRules([]);
    }
    setIsModalOpen(true);
  };

  const handleTemplateChange = (template) => {
    setFormData(prev => ({ ...prev, templateType: template }));
    if (template && TEMPLATES[template]) {
      const t = TEMPLATES[template];
      setBuilderFields(t.fields);
      setBuilderWorkflow(t.workflow);
      setBuilderWorkflowSteps(t.steps);
      setBuilderRules(t.rules);
    } else {
      setBuilderFields([]);
      setBuilderWorkflow({ workflowType: 'single_visit', totalVisits: 1, frequency: 'none' });
      setBuilderWorkflowSteps([]);
      setBuilderRules([]);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Client-side validation for required fields in Step 1
    if (!formData.categoryId) {
      alert('Please select a Category in Step 1 (Basic Info)');
      setActiveStep(0);
      return;
    }
    if (!formData.title?.trim()) {
      alert('Please enter a Service Title in Step 1 (Basic Info)');
      setActiveStep(0);
      return;
    }

    // Prepare unified payload
    const payload = {
      ...formData,
      fields: builderFields,
      workflow: {
        ...builderWorkflow,
        steps: builderWorkflowSteps
      },
      rules: builderRules
    };

    try {
      if (currentService) {
        await api.put(`/admin/services/${currentService._id}`, payload);
        alert('Service updated successfully!');
      } else {
        await api.post('/admin/services', payload);
        alert('Service created successfully!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      // If backend validation fails, show detailed validation error messages if available
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errMsgs = error.response.data.errors.map(err => err.msg).join('\n');
        alert(`Validation failed:\n${errMsgs}`);
      } else {
        alert(error.response?.data?.message || 'Error saving service');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await api.delete(`/admin/services/${id}`);
        fetchData();
      } catch (error) {
        alert('Error deleting service');
      }
    }
  };

  // Field modifier operations
  const addField = () => {
    setBuilderFields([...builderFields, {
      label: 'New Field',
      name: 'new_field_' + Date.now(),
      fieldType: 'text',
      isRequired: false,
      options: [],
      defaultValue: '',
      order: builderFields.length + 1
    }]);
  };

  const updateField = (index, key, val) => {
    const updated = [...builderFields];
    updated[index][key] = val;
    setBuilderFields(updated);
  };

  const removeField = (index) => {
    setBuilderFields(builderFields.filter((_, i) => i !== index));
  };

  // Workflow modifiers
  const addWorkflowStep = () => {
    setBuilderWorkflowSteps([...builderWorkflowSteps, {
      title: 'New Step',
      daysAfterPreviousVisit: 1,
      schedulingType: 'auto_offset'
    }]);
  };

  const updateWorkflowStep = (index, key, val) => {
    const updated = [...builderWorkflowSteps];
    updated[index][key] = val;
    setBuilderWorkflowSteps(updated);
  };

  const removeWorkflowStep = (index) => {
    setBuilderWorkflowSteps(builderWorkflowSteps.filter((_, i) => i !== index));
  };

  // Pricing engine modifiers
  const addPricingRule = (type = 'conditional') => {
    if (type === 'formula') {
      if (builderRules.some(r => r.ruleType === 'formula')) {
        alert('Only one formula rule is allowed per service');
        return;
      }
      setBuilderRules([...builderRules, {
        ruleType: 'formula',
        formulaString: 'basePrice + 100'
      }]);
    } else {
      setBuilderRules([...builderRules, {
        ruleType: 'conditional',
        fieldName: '',
        operator: 'equals',
        value: '',
        priceModifierType: 'add',
        modifierValue: 0
      }]);
    }
  };

  const updatePricingRule = (index, key, val) => {
    const updated = [...builderRules];
    updated[index][key] = val;
    setBuilderRules(updated);
  };

  const removePricingRule = (index) => {
    setBuilderRules(builderRules.filter((_, i) => i !== index));
  };

  const STEPS = [
    { title: '1. Basic Info', key: 'basic' },
    { title: '2. Checkout Fields', key: 'fields' },
    { title: '3. Booking Workflow', key: 'workflow' },
    { title: '4. Pricing Engine', key: 'pricing' }
  ];

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Services</h2>
          <p className="text-sm text-gray-500">Manage individual services under subcategories</p>
        </div>
        <button 
          onClick={() => handleOpenWizard(null)} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 font-semibold transition-colors"
        >
          <FiPlus /> Add Service
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-150">
                <th className="p-4 font-semibold text-gray-600 text-sm">Title</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Category &gt; SubCategory</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                <th className="p-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((srv) => (
                <tr key={srv._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-bold text-gray-800">{srv.title}</td>
                  <td className="p-4 text-gray-600 text-sm">
                    {srv.categoryId?.title || 'Unknown'} &gt; {srv.subCategoryId?.title || 'Unknown'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${srv.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {srv.status}
                    </span>
                  </td>
                  <td className="p-4 flex justify-end gap-2">
                    <button onClick={() => handleOpenWizard(srv)} title="Configure Dynamic Builder Wizard" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded flex items-center gap-1 font-bold text-xs"><FiSliders /> Configure</button>
                    <button onClick={() => handleDelete(srv._id)} title="Delete Service" className="p-2 text-red-600 hover:bg-red-50 rounded"><FiTrash2 /></button>
                  </td>
                </tr>
              ))}
              {services.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">No services found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Unified Wizard Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden my-8 animate-in fade-in slide-in-from-bottom duration-300">
            {/* Modal Header */}
            <div className="p-6 bg-gray-50 border-b border-gray-150 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-extrabold text-gray-800">{currentService ? 'Edit Service Configuration' : 'Create New Service Configuration'}</h3>
                <p className="text-sm text-gray-500">Unified Service Builder & Form Wizard</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors">
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {/* Layout body */}
            <div className="flex flex-col md:flex-row h-[550px]">
              {/* Wizard Step List Sidebar */}
              <div className="w-full md:w-56 bg-gray-50 border-r border-gray-150 p-4 space-y-1 shrink-0">
                {STEPS.map((step, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveStep(idx)}
                    className={`w-full text-left px-4 py-2.5 text-sm font-bold rounded-xl transition-all flex items-center justify-between ${activeStep === idx ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <span>{step.title}</span>
                    {idx < activeStep && <span className="text-emerald-500 text-xs">✓</span>}
                  </button>
                ))}
              </div>

              {/* Active Step Panel Body */}
              <div className="flex-1 p-6 overflow-y-auto min-h-0 bg-white">
                
                {/* STEP 1: Basic Info */}
                {activeStep === 0 && (
                  <div className="space-y-4">
                    <h4 className="text-base font-bold text-gray-800 mb-2 border-b pb-2">Step 1: Service Basics & Template Selection</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                        <select 
                          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                          value={formData.categoryId}
                          onChange={(e) => setFormData({...formData, categoryId: e.target.value, subCategoryId: ''})}
                          required
                        >
                          <option value="">Select Category</option>
                          {categories.map(cat => (
                            <option key={cat.id || cat._id} value={cat.id || cat._id}>{cat.title}</option>
                          ))}
                        </select>
                      </div>

                      {(() => {
                        const selectedCategory = categories.find(cat => (cat.id || cat._id) === formData.categoryId);
                        const hasSubCategory = selectedCategory ? (selectedCategory.hasSubCategory !== false) : true;
                        if (!hasSubCategory) return null;

                        return (
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">SubCategory</label>
                            <select 
                              className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                              value={formData.subCategoryId}
                              onChange={(e) => setFormData({...formData, subCategoryId: e.target.value})}
                              required={hasSubCategory}
                            >
                              <option value="">Select SubCategory</option>
                              {subCategories
                                .filter(sub => !formData.categoryId || sub.categoryId?._id === formData.categoryId || sub.categoryId === formData.categoryId)
                                .map(sub => (
                                <option key={sub._id} value={sub._id}>{sub.title}</option>
                              ))}
                            </select>
                          </div>
                        );
                      })()}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Service Title</label>
                      <input 
                        type="text" 
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        placeholder="e.g. Room Deep Cleaning"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {!currentService && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Apply Service Template (Optional)</label>
                          <select 
                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                            value={formData.templateType}
                            onChange={(e) => handleTemplateChange(e.target.value)}
                          >
                            <option value="">Standard Service (No template)</option>
                            <option value="home_cleaning">Home Cleaning Template</option>
                            <option value="massage">Massage Template</option>
                            <option value="pest_control">Pest Control Template</option>
                            <option value="physiotherapy">Physiotherapy Template</option>
                            <option value="amc">AMC Services Template</option>
                          </select>
                          <div className="text-[10px] text-gray-500 mt-1">Applying a template will auto-fill steps 2, 3, and 4 instantly. You can customize them!</div>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Base Price (Starting Price)</label>
                        <input 
                          type="number" 
                          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          value={formData.basePrice}
                          onChange={(e) => setFormData({...formData, basePrice: e.target.value})}
                          placeholder="e.g. 500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                      <textarea 
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        rows="3"
                        placeholder="Explain this service..."
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                      <select 
                        className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* STEP 2: Checkout Fields */}
                {activeStep === 1 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h4 className="text-base font-bold text-gray-800">Step 2: Dynamic Checkout Fields</h4>
                      <button 
                        onClick={addField} 
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors"
                      >
                        + Add Custom Field
                      </button>
                    </div>

                    <div className="space-y-4">
                      {builderFields.map((field, idx) => (
                        <div key={idx} className="p-4 border border-gray-200 rounded-xl bg-gray-50 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-indigo-600">Field #{idx + 1}</span>
                            <button onClick={() => removeField(idx)} className="text-xs font-bold text-red-600 hover:text-red-800">Delete</button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-700 mb-1">Field Label (Visible to User)</label>
                              <input 
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white"
                                value={field.label}
                                onChange={(e) => updateField(idx, 'label', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-700 mb-1">Variable Name (Formula key)</label>
                              <input 
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white font-mono"
                                value={field.name}
                                onChange={(e) => updateField(idx, 'name', e.target.value)}
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-700 mb-1">Field Type</label>
                              <select 
                                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white"
                                value={field.fieldType}
                                onChange={(e) => updateField(idx, 'fieldType', e.target.value)}
                              >
                                <option value="text">Text Input</option>
                                <option value="number">Number Input</option>
                                <option value="dropdown">Dropdown Selection</option>
                                <option value="radio">Radio Buttons</option>
                                <option value="checkbox">Checkbox Switch</option>
                                <option value="image">Image/File Upload</option>
                                <option value="location">Location Picker (GPS)</option>
                              </select>
                            </div>
                          </div>

                          {(field.fieldType === 'dropdown' || field.fieldType === 'radio') && (
                            <div>
                              <label className="block text-[10px] font-bold text-gray-700 mb-1">Field Options (Comma separated list)</label>
                              <input 
                                type="text"
                                placeholder="e.g. Option 1, Option 2, Option 3"
                                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white"
                                value={Array.isArray(field.options) ? field.options.join(', ') : field.options}
                                onChange={(e) => updateField(idx, 'options', e.target.value.split(',').map(x => x.trim()))}
                              />
                            </div>
                          )}

                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <input 
                                type="checkbox" 
                                id={`req-${idx}`}
                                checked={field.isRequired} 
                                onChange={(e) => updateField(idx, 'isRequired', e.target.checked)}
                              />
                              <label htmlFor={`req-${idx}`} className="text-xs font-medium text-gray-700">Is Required?</label>
                            </div>
                            <div className="flex items-center gap-2">
                              <input 
                                type="checkbox" 
                                id={`show-${idx}`}
                                checked={field.showToUser !== false} 
                                onChange={(e) => updateField(idx, 'showToUser', e.target.checked)}
                              />
                              <label htmlFor={`show-${idx}`} className="text-xs font-medium text-gray-700">Show to User?</label>
                            </div>
                          </div>
                        </div>
                      ))}
                      {builderFields.length === 0 && <div className="text-center py-6 text-gray-400 text-sm">No dynamic checkout fields configured yet.</div>}
                    </div>
                  </div>
                )}

                {/* STEP 3: Workflow Config */}
                {activeStep === 2 && (
                  <div className="space-y-4">
                    <h4 className="text-base font-bold text-gray-800 mb-2 border-b pb-2">Step 3: Scheduling Workflow</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Workflow Type</label>
                        <select 
                          className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white"
                          value={builderWorkflow.workflowType}
                          onChange={(e) => setBuilderWorkflow({ ...builderWorkflow, workflowType: e.target.value })}
                        >
                          <option value="single_visit">Single Visit (Default)</option>
                          <option value="multi_visit">Multi-Visit (Pest control / Physiotherapy)</option>
                          <option value="recurring">Recurring (AMC Monthly Visits)</option>
                        </select>
                      </div>

                      {builderWorkflow.workflowType !== 'single_visit' && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Total Visits</label>
                          <input 
                            type="number"
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white"
                            value={builderWorkflow.totalVisits}
                            onChange={(e) => setBuilderWorkflow({ ...builderWorkflow, totalVisits: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                      )}

                      {builderWorkflow.workflowType === 'recurring' && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Frequency</label>
                          <select 
                            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white"
                            value={builderWorkflow.frequency}
                            onChange={(e) => setBuilderWorkflow({ ...builderWorkflow, frequency: e.target.value })}
                          >
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                          </select>
                        </div>
                      )}
                    </div>

                    {builderWorkflow.workflowType === 'multi_visit' && (
                      <div className="space-y-3 pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-700">Visits Timeline & Intervals</span>
                          <button onClick={addWorkflowStep} className="px-2 py-1 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700">+ Add Step</button>
                        </div>

                        {builderWorkflowSteps.map((step, idx) => (
                          <div key={idx} className="p-3 border border-gray-150 rounded-lg bg-gray-50 flex items-center justify-between gap-3 flex-wrap">
                            <span className="text-xs font-extrabold text-indigo-600">Visit #{idx + 1}</span>
                            <div className="flex gap-2 items-center flex-wrap">
                              <input 
                                type="text"
                                placeholder="e.g. Follow-up treatment"
                                className="p-2 border border-gray-300 rounded-lg text-xs bg-white w-44"
                                value={step.title}
                                onChange={(e) => updateWorkflowStep(idx, 'title', e.target.value)}
                              />
                              <input 
                                type="number"
                                placeholder="Days after previous visit"
                                className="p-2 border border-gray-300 rounded-lg text-xs bg-white w-20"
                                value={step.daysAfterPreviousVisit}
                                onChange={(e) => updateWorkflowStep(idx, 'daysAfterPreviousVisit', parseInt(e.target.value) || 0)}
                              />
                              <span className="text-[10px] text-gray-500">days offset</span>
                              <select 
                                className="p-2 border border-gray-300 rounded-lg text-xs bg-white"
                                value={step.schedulingType}
                                onChange={(e) => updateWorkflowStep(idx, 'schedulingType', e.target.value)}
                              >
                                <option value="auto_offset">Auto Date Offset</option>
                                <option value="custom_scheduling">User Custom Scheduled</option>
                              </select>
                            </div>
                            <button onClick={() => removeWorkflowStep(idx)} className="text-xs font-bold text-red-600 hover:text-red-800">Delete</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 4: Pricing Engine */}
                {activeStep === 3 && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h4 className="text-base font-bold text-gray-800">Step 4: Pricing Engine</h4>
                      <div className="flex gap-2">
                        <button onClick={() => addPricingRule('formula')} className="px-2 py-1 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700">Add Formula</button>
                        <button onClick={() => addPricingRule('conditional')} className="px-2 py-1 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700">Add Condition</button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {builderRules.map((rule, idx) => (
                        <div key={idx} className="p-4 border border-gray-200 rounded-xl bg-gray-50 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-indigo-600">Rule #{idx + 1} ({rule.ruleType === 'formula' ? 'Math Formula' : 'Condition'})</span>
                            <button onClick={() => removePricingRule(idx)} className="text-xs font-bold text-red-600 hover:text-red-800">Delete</button>
                          </div>

                          {rule.ruleType === 'formula' ? (
                            <div className="space-y-2">
                              <label className="block text-[10px] font-bold text-gray-700">Mathematical Pricing Formula</label>
                              <input 
                                type="text"
                                placeholder="e.g. basePrice + (rooms * 500) + (bathrooms * 300)"
                                className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white font-mono"
                                value={rule.formulaString}
                                onChange={(e) => updatePricingRule(idx, 'formulaString', e.target.value)}
                              />
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                              <div>
                                <label className="block text-[9px] font-bold text-gray-700 mb-1">If Field Name</label>
                                <input 
                                  type="text"
                                  placeholder="e.g. rooms"
                                  className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white"
                                  value={rule.fieldName}
                                  onChange={(e) => updatePricingRule(idx, 'fieldName', e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-gray-700 mb-1">Operator</label>
                                <select 
                                  className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white"
                                  value={rule.operator}
                                  onChange={(e) => updatePricingRule(idx, 'operator', e.target.value)}
                                >
                                  <option value="equals">Equals</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-gray-700 mb-1">Value</label>
                                <input 
                                  type="text"
                                  placeholder="e.g. 2"
                                  className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white"
                                  value={rule.value}
                                  onChange={(e) => updatePricingRule(idx, 'value', e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-gray-700 mb-1">Modifier Action</label>
                                <select 
                                  className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white"
                                  value={rule.priceModifierType}
                                  onChange={(e) => updatePricingRule(idx, 'priceModifierType', e.target.value)}
                                >
                                  <option value="add">Add (+)</option>
                                  <option value="multiply">Multiply (*)</option>
                                  <option value="fixed">Fixed Price (=)</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-gray-700 mb-1">Value Modifier</label>
                                <input 
                                  type="number"
                                  placeholder="e.g. 400"
                                  className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white"
                                  value={rule.modifierValue}
                                  onChange={(e) => updatePricingRule(idx, 'modifierValue', parseFloat(e.target.value) || 0)}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {builderRules.length === 0 && <div className="text-center py-6 text-gray-400 text-sm">No pricing rules configured yet.</div>}
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="p-6 bg-gray-50 border-t border-gray-150 flex justify-between items-center">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-150 transition-colors font-bold text-sm"
              >
                Cancel
              </button>

              <div className="flex gap-2">
                {activeStep > 0 && (
                  <button 
                    type="button" 
                    onClick={() => setActiveStep(activeStep - 1)} 
                    className="px-4 py-2 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-150 transition-colors flex items-center gap-1 font-bold text-sm"
                  >
                    <FiChevronLeft /> Back
                  </button>
                )}

                {activeStep < 3 ? (
                  <button 
                    type="button" 
                    onClick={() => setActiveStep(activeStep + 1)} 
                    className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md flex items-center gap-1 font-bold text-sm"
                  >
                    Next <FiChevronRight />
                  </button>
                ) : (
                  <button 
                    type="button" 
                    onClick={handleSubmit} 
                    className="px-5 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-md flex items-center gap-1.5 font-bold text-sm"
                  >
                    <FiSave /> Save Service Configuration
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
