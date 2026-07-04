import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  FiChevronRight, FiChevronLeft, FiPlus, FiTrash2, FiSave,
  FiInfo, FiCheckCircle, FiEdit3, FiLayout, FiStar, FiPhone
} from 'react-icons/fi';
import api from '../../../../services/api';

// ─────────────────────────────────────────────
// Default content (shown when no config saved)
// ─────────────────────────────────────────────
const DEFAULT_CONFIG = {
  isEnabled: true,
  badgeText: 'Premium Painting Services',
  heroTitle: 'Professional Painting Services',
  heroSubtitle: 'Book a free professional consultation and receive a personalized, detailed quotation after our on-site expert inspection.',
  metaTitle: 'Professional Painting Services | Free Home Consultation',
  metaDescription: 'Get expert painting consultation for your home or office. Free site survey, premium brands, transparent pricing.',
  featureCards: [
    { icon: 'home_repair_service', title: 'Free Site Survey', description: 'Accurate wall measurements & laser tools' },
    { icon: 'palette', title: 'Premium Finishes', description: 'Asian Paints, Berger, Dulux & more' }
  ],
  inclusions: [
    'Site Inspection',
    'Area Measurement',
    'Surface Inspection',
    'Paint Recommendation',
    'Digital Quotation',
    'Material Estimation',
    'Labour Estimation'
  ],
  workflowSteps: [
    { title: 'Book Consultation', description: 'Select your layout and request a site survey online.' },
    { title: 'Expert Visits Property', description: 'Our consulting supervisor visits your address at your convenience.' },
    { title: 'Measurements Taken', description: 'Supervisor measures walls and ceilings using laser precision tools.' },
    { title: 'Paint & Recommendation', description: 'Get guidance on paint types, sheens, and waterproofing details.' },
    { title: 'Digital Quote Generated', description: 'Receive a transparent, fully itemized quote on your account dashboard.' },
    { title: 'Approve Quote & Start Work', description: 'Approve the estimate to schedule our verified expert painters.' }
  ],
  valueProps: [
    { icon: 'shield_person', title: 'Experienced Professionals', description: 'Our trained supervisors monitor execution and safety standards.' },
    { icon: 'opacity', title: 'Branded Paint Options', description: 'Genuine products from leading brands like Asian Paints, Dulux, and Berger.' },
    { icon: 'account_balance_wallet', title: 'Transparent Pricing', description: 'Itemized digital bills detailing paint quality and labor components.' },
    { icon: 'verified', title: 'Warranty Support', description: 'Worry-free paint durability warranties backed by our platform policies.' },
    { icon: 'volunteer_activism', title: 'Free Consultation', description: 'Complimentary site evaluation and recommendations with zero obligation.' }
  ],
  supportSection: {
    title: 'Need a Custom Property Layout?',
    description: 'Our commercial experts handle larger enterprise spaces, hotels, and unique multi-use complexes.',
    buttonLabel: 'Contact Support'
  },
  detailsBadgeText: 'Free Consultation',
  overviewTitle: 'Property Overview',
  howItWorksTitle: 'How It Works',
  whyChooseTitle: 'Why Choose Doormeets Painting',
  inclusionsTitle: "What's Included in Consultation",
  infoNoteText: 'Final pricing is calculated after measuring the actual paintable area and understanding your requirements.',
  bottomBarTitle: 'Free Site Inspection',
  bottomBarSubtitle: 'Book a consultation today and receive a personalized quotation.',
  bottomBarButtonLabel: 'Confirm & Book Consultation'
};

// ─────────────────────────────────────────────
// Step definitions
// ─────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Basic Info', icon: FiEdit3, desc: 'Hero headline, badge, subtitle & SEO' },
  { id: 2, label: 'Feature Cards', icon: FiStar, desc: 'Mini highlight cards in the hero banner' },
  { id: 3, label: 'Page Sections', icon: FiLayout, desc: 'Inclusions, how it works, value props' },
  { id: 4, label: 'Support Section', icon: FiPhone, desc: 'Bottom CTA block' },
  { id: 5, label: 'Details Page Texts', icon: FiLayout, desc: 'Customize details page headers & sticky bar' }
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const InputField = ({ label, value, onChange, placeholder, multiline = false, required = false }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400">
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    {multiline ? (
      <textarea
        rows={3}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-gray-50/30 resize-none leading-relaxed"
      />
    ) : (
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-gray-50/30"
      />
    )}
  </div>
);

// ─────────────────────────────────────────────
// Main Wizard Component
// ─────────────────────────────────────────────
const PaintingPageWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/settings');
      if (res.data?.success && res.data?.settings?.paintingPageConfig) {
        const saved = res.data.settings.paintingPageConfig;
        // Deep merge with defaults to ensure all fields are present
        setConfig({
          ...DEFAULT_CONFIG,
          ...saved,
          featureCards: saved.featureCards?.length > 0 ? saved.featureCards : DEFAULT_CONFIG.featureCards,
          inclusions: saved.inclusions?.length > 0 ? saved.inclusions : DEFAULT_CONFIG.inclusions,
          workflowSteps: saved.workflowSteps?.length > 0 ? saved.workflowSteps : DEFAULT_CONFIG.workflowSteps,
          valueProps: saved.valueProps?.length > 0 ? saved.valueProps : DEFAULT_CONFIG.valueProps,
          supportSection: { ...DEFAULT_CONFIG.supportSection, ...(saved.supportSection || {}) }
        });
      }
    } catch (err) {
      console.error('Error fetching painting page config:', err);
      toast.error('Failed to load configuration. Using defaults.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.put('/admin/settings', { paintingPageConfig: config });
      if (res.data?.success) {
        toast.success('Painting page configuration saved successfully!');
      } else {
        toast.error('Failed to save configuration.');
      }
    } catch (err) {
      console.error('Error saving painting page config:', err);
      toast.error('An error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  // ── Config updater helpers ──────────────────
  const updateConfig = (key, value) => setConfig(prev => ({ ...prev, [key]: value }));
  const updateSupport = (key, value) => setConfig(prev => ({
    ...prev,
    supportSection: { ...prev.supportSection, [key]: value }
  }));

  // Feature Cards
  const updateFeatureCard = (idx, key, val) => {
    const cards = [...config.featureCards];
    cards[idx] = { ...cards[idx], [key]: val };
    updateConfig('featureCards', cards);
  };
  const addFeatureCard = () => {
    if (config.featureCards.length >= 4) return toast.error('Maximum 4 feature cards allowed.');
    updateConfig('featureCards', [...config.featureCards, { icon: 'star', title: '', description: '' }]);
  };
  const removeFeatureCard = (idx) => {
    if (config.featureCards.length <= 1) return toast.error('At least 1 feature card is required.');
    updateConfig('featureCards', config.featureCards.filter((_, i) => i !== idx));
  };

  // Inclusions
  const updateInclusion = (idx, val) => {
    const list = [...config.inclusions];
    list[idx] = val;
    updateConfig('inclusions', list);
  };
  const addInclusion = () => updateConfig('inclusions', [...config.inclusions, '']);
  const removeInclusion = (idx) => {
    if (config.inclusions.length <= 1) return toast.error('At least 1 inclusion is required.');
    updateConfig('inclusions', config.inclusions.filter((_, i) => i !== idx));
  };

  // Workflow Steps
  const updateStep = (idx, key, val) => {
    const steps = [...config.workflowSteps];
    steps[idx] = { ...steps[idx], [key]: val };
    updateConfig('workflowSteps', steps);
  };
  const addStep = () => updateConfig('workflowSteps', [...config.workflowSteps, { title: '', description: '' }]);
  const removeStep = (idx) => {
    if (config.workflowSteps.length <= 1) return toast.error('At least 1 step is required.');
    updateConfig('workflowSteps', config.workflowSteps.filter((_, i) => i !== idx));
  };

  // Value Props
  const updateValueProp = (idx, key, val) => {
    const props = [...config.valueProps];
    props[idx] = { ...props[idx], [key]: val };
    updateConfig('valueProps', props);
  };
  const addValueProp = () => updateConfig('valueProps', [...config.valueProps, { icon: 'check_circle', title: '', description: '' }]);
  const removeValueProp = (idx) => {
    if (config.valueProps.length <= 1) return toast.error('At least 1 value prop is required.');
    updateConfig('valueProps', config.valueProps.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium text-gray-400">Loading page configuration...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* ── Wizard Header ───────────────────────── */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50/60 to-white flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900">Edit Painting Page</h3>
          <p className="text-xs text-gray-400 mt-0.5">Configure your user-facing painting consultation landing page</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Page active toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs font-semibold text-gray-500">Page Active</span>
            <button
              type="button"
              onClick={() => updateConfig('isEnabled', !config.isEnabled)}
              className={`relative w-10 h-5.5 rounded-full transition-all ${config.isEnabled ? 'bg-emerald-500' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-all ${config.isEnabled ? 'translate-x-[18px]' : ''}`} />
            </button>
          </label>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all cursor-pointer shadow-sm disabled:opacity-60"
          >
            <FiSave className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="flex min-h-[600px]">
        {/* ── Left Step Sidebar ──────────────────── */}
        <div className="w-56 border-r border-gray-100 bg-gray-50/50 shrink-0 p-4 space-y-1.5">
          {STEPS.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isDone = currentStep > step.id;
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`w-full text-left px-3 py-3 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-500 hover:bg-white hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-black ${
                    isActive ? 'bg-white/20' : isDone ? 'bg-emerald-100' : 'bg-gray-100'
                  }`}>
                    {isDone ? <FiCheckCircle className="w-3.5 h-3.5" /> : step.id}
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight">{step.label}</div>
                    <div className={`text-[10px] leading-tight mt-0.5 ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>{step.desc}</div>
                  </div>
                </div>
              </button>
            );
          })}

          <div className="pt-4 border-t border-gray-200 mt-2">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <FiInfo className="w-3.5 h-3.5 text-blue-500 mb-1.5" />
              <p className="text-[10px] text-blue-700 leading-relaxed">
                Changes take effect immediately on the user-facing painting page.
              </p>
            </div>
          </div>
        </div>

        {/* ── Right Content Panel ────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.15 }}
              className="p-6 space-y-6"
            >
              {/* ── STEP 1: Basic Info ─────────────── */}
              {currentStep === 1 && (
                <>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 mb-0.5">Step 1: Basic Info</h4>
                    <p className="text-xs text-gray-400">Configure the hero section and SEO metadata for the painting page.</p>
                  </div>
                  <div className="border-t border-gray-50 pt-5 space-y-4">
                    <InputField
                      label="Hero Badge Text"
                      value={config.badgeText}
                      onChange={v => updateConfig('badgeText', v)}
                      placeholder="e.g. Premium Painting Services"
                      required
                    />
                    <InputField
                      label="Hero Headline (H1)"
                      value={config.heroTitle}
                      onChange={v => updateConfig('heroTitle', v)}
                      placeholder="e.g. Professional Painting Services"
                      required
                    />
                    <InputField
                      label="Hero Subtitle"
                      value={config.heroSubtitle}
                      onChange={v => updateConfig('heroSubtitle', v)}
                      placeholder="e.g. Book a free consultation and get a detailed quotation..."
                      multiline
                      required
                    />
                    <div className="border-t border-dashed border-gray-100 pt-4 space-y-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">SEO Metadata</p>
                      <InputField
                        label="Meta Title"
                        value={config.metaTitle}
                        onChange={v => updateConfig('metaTitle', v)}
                        placeholder="e.g. Professional Painting Services | Free Consultation"
                      />
                      <InputField
                        label="Meta Description"
                        value={config.metaDescription}
                        onChange={v => updateConfig('metaDescription', v)}
                        placeholder="e.g. Get expert painting consultation for your home..."
                        multiline
                      />
                    </div>
                  </div>
                </>
              )}

              {/* ── STEP 2: Feature Cards ──────────── */}
              {currentStep === 2 && (
                <>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 mb-0.5">Step 2: Feature Cards</h4>
                    <p className="text-xs text-gray-400">Configure the mini highlight cards shown in the hero banner strip (1–4 cards).</p>
                  </div>
                  <div className="border-t border-gray-50 pt-5 space-y-4">
                    {config.featureCards.map((card, idx) => (
                      <div key={idx} className="border border-gray-100 rounded-2xl p-4 space-y-3 bg-gray-50/30">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Card {idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeFeatureCard(idx)}
                            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg cursor-pointer"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <InputField
                          label="Material Icon Name"
                          value={card.icon}
                          onChange={v => updateFeatureCard(idx, 'icon', v)}
                          placeholder="e.g. home_repair_service, palette, brush"
                        />
                        <InputField
                          label="Card Title"
                          value={card.title}
                          onChange={v => updateFeatureCard(idx, 'title', v)}
                          placeholder="e.g. Free Site Survey"
                        />
                        <InputField
                          label="Card Description"
                          value={card.description}
                          onChange={v => updateFeatureCard(idx, 'description', v)}
                          placeholder="e.g. Accurate wall measurements & laser tools"
                        />
                      </div>
                    ))}
                    {config.featureCards.length < 4 && (
                      <button
                        type="button"
                        onClick={addFeatureCard}
                        className="w-full border border-dashed border-blue-200 hover:border-blue-400 text-blue-500 text-xs font-bold py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <FiPlus className="w-3.5 h-3.5" /> Add Feature Card
                      </button>
                    )}
                    <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                      <strong>Tip:</strong> Use Google Material Symbols icon names (e.g. <code className="bg-blue-100 px-1 rounded">home_repair_service</code>, <code className="bg-blue-100 px-1 rounded">palette</code>, <code className="bg-blue-100 px-1 rounded">format_paint</code>).
                    </div>
                  </div>
                </>
              )}

              {/* ── STEP 3: Page Sections ─────────── */}
              {currentStep === 3 && (
                <>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 mb-0.5">Step 3: Page Sections</h4>
                    <p className="text-xs text-gray-400">Configure consultation inclusions, how it works workflow steps, and value propositions.</p>
                  </div>

                  {/* Inclusions */}
                  <div className="border-t border-gray-50 pt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Consultation Inclusions</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">What's included in the free site consultation</p>
                      </div>
                      <button type="button" onClick={addInclusion} className="text-xs text-blue-600 font-bold hover:underline cursor-pointer flex items-center gap-1">
                        <FiPlus className="w-3.5 h-3.5" /> Add
                      </button>
                    </div>
                    {config.inclusions.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={item}
                          onChange={e => updateInclusion(idx, e.target.value)}
                          placeholder="e.g. Site Inspection"
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-gray-50/30"
                        />
                        <button type="button" onClick={() => removeInclusion(idx)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl cursor-pointer">
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Workflow Steps */}
                  <div className="border-t border-dashed border-gray-100 pt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">How It Works (Workflow Steps)</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Step-by-step process shown to the user</p>
                      </div>
                      <button type="button" onClick={addStep} className="text-xs text-blue-600 font-bold hover:underline cursor-pointer flex items-center gap-1">
                        <FiPlus className="w-3.5 h-3.5" /> Add Step
                      </button>
                    </div>
                    {config.workflowSteps.map((step, idx) => (
                      <div key={idx} className="border border-gray-100 rounded-2xl p-4 space-y-2 bg-gray-50/30">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Step {idx + 1}</span>
                          <button type="button" onClick={() => removeStep(idx)} className="p-1 text-red-400 hover:bg-red-50 rounded-lg cursor-pointer">
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <InputField
                          label="Step Title"
                          value={step.title}
                          onChange={v => updateStep(idx, 'title', v)}
                          placeholder="e.g. Book Consultation"
                        />
                        <InputField
                          label="Step Description"
                          value={step.description}
                          onChange={v => updateStep(idx, 'description', v)}
                          placeholder="e.g. Select your layout and request a site survey online."
                          multiline
                        />
                      </div>
                    ))}
                  </div>

                  {/* Value Props */}
                  <div className="border-t border-dashed border-gray-100 pt-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Value Propositions (USPs)</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Why choose us — shown as cards below the layout grid</p>
                      </div>
                      <button type="button" onClick={addValueProp} className="text-xs text-blue-600 font-bold hover:underline cursor-pointer flex items-center gap-1">
                        <FiPlus className="w-3.5 h-3.5" /> Add USP
                      </button>
                    </div>
                    {config.valueProps.map((vp, idx) => (
                      <div key={idx} className="border border-gray-100 rounded-2xl p-4 space-y-2 bg-gray-50/30">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">USP {idx + 1}</span>
                          <button type="button" onClick={() => removeValueProp(idx)} className="p-1 text-red-400 hover:bg-red-50 rounded-lg cursor-pointer">
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <InputField label="Icon Name" value={vp.icon} onChange={v => updateValueProp(idx, 'icon', v)} placeholder="e.g. shield_person" />
                        <InputField label="Title" value={vp.title} onChange={v => updateValueProp(idx, 'title', v)} placeholder="e.g. Experienced Professionals" />
                        <InputField label="Description" value={vp.description} onChange={v => updateValueProp(idx, 'description', v)} placeholder="e.g. Our trained supervisors..." multiline />
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── STEP 4: Support Section ───────── */}
              {currentStep === 4 && (
                <>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 mb-0.5">Step 4: Support Section</h4>
                    <p className="text-xs text-gray-400">Configure the bottom CTA support block shown after the layout cards.</p>
                  </div>
                  <div className="border-t border-gray-50 pt-5 space-y-4">
                    <InputField
                      label="Section Title"
                      value={config.supportSection.title}
                      onChange={v => updateSupport('title', v)}
                      placeholder="e.g. Need a Custom Property Layout?"
                      required
                    />
                    <InputField
                      label="Section Description"
                      value={config.supportSection.description}
                      onChange={v => updateSupport('description', v)}
                      placeholder="e.g. Our commercial experts handle larger enterprise spaces..."
                      multiline
                    />
                    <InputField
                      label="Button Label"
                      value={config.supportSection.buttonLabel}
                      onChange={v => updateSupport('buttonLabel', v)}
                      placeholder="e.g. Contact Support"
                      required
                    />
                  </div>

                  {/* Preview */}
                  <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/50 space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Live Preview</p>
                    <div className="bg-white border border-gray-100 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-xl">support_agent</span>
                      </div>
                      <div className="text-center sm:text-left space-y-1 flex-1">
                        <h4 className="text-sm font-bold text-gray-900">{config.supportSection.title || '—'}</h4>
                        <p className="text-xs text-gray-500">{config.supportSection.description || '—'}</p>
                      </div>
                      <div className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700">
                        {config.supportSection.buttonLabel || 'Button'}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ── STEP 5: Details Page Texts ─────── */}
              {currentStep === 5 && (
                <>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800 mb-0.5">Step 5: Details Page Texts</h4>
                    <p className="text-xs text-gray-400">Configure text titles, warnings, and CTA labels shown on the BHK details page.</p>
                  </div>
                  <div className="border-t border-gray-50 pt-5 space-y-4">
                    <InputField
                      label="Details Header Badge"
                      value={config.detailsBadgeText}
                      onChange={v => updateConfig('detailsBadgeText', v)}
                      placeholder="e.g. Free Consultation"
                    />
                    <InputField
                      label="Overview Section Title"
                      value={config.overviewTitle}
                      onChange={v => updateConfig('overviewTitle', v)}
                      placeholder="e.g. Property Overview"
                    />
                    <InputField
                      label="How It Works Title"
                      value={config.howItWorksTitle}
                      onChange={v => updateConfig('howItWorksTitle', v)}
                      placeholder="e.g. How It Works"
                    />
                    <InputField
                      label="Why Choose Us Section Title"
                      value={config.whyChooseTitle}
                      onChange={v => updateConfig('whyChooseTitle', v)}
                      placeholder="e.g. Why Choose Doormeets Painting"
                    />
                    <InputField
                      label="Inclusions Box Header"
                      value={config.inclusionsTitle}
                      onChange={v => updateConfig('inclusionsTitle', v)}
                      placeholder="e.g. What's Included in Consultation"
                    />
                    <InputField
                      label="Pricing Policy warning text"
                      value={config.infoNoteText}
                      onChange={v => updateConfig('infoNoteText', v)}
                      placeholder="e.g. Final pricing is calculated after..."
                      multiline
                    />
                    <div className="border-t border-dashed border-gray-100 pt-4 space-y-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Bottom Sticky Booking Bar</p>
                      <InputField
                        label="Booking Bar Title"
                        value={config.bottomBarTitle}
                        onChange={v => updateConfig('bottomBarTitle', v)}
                        placeholder="e.g. Free Site Inspection"
                      />
                      <InputField
                        label="Booking Bar Subtitle"
                        value={config.bottomBarSubtitle}
                        onChange={v => updateConfig('bottomBarSubtitle', v)}
                        placeholder="e.g. Book a consultation today..."
                      />
                      <InputField
                        label="Booking Button Label"
                        value={config.bottomBarButtonLabel}
                        onChange={v => updateConfig('bottomBarButtonLabel', v)}
                        placeholder="e.g. Confirm & Book Consultation"
                      />
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* ── Step Navigation Footer ─────────────── */}
          <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between bg-gray-50/30 sticky bottom-0">
            <button
              type="button"
              onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
              disabled={currentStep === 1}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold disabled:opacity-40 hover:bg-white transition-colors cursor-pointer"
            >
              <FiChevronLeft className="w-4 h-4" /> Back
            </button>

            <div className="flex gap-1.5">
              {STEPS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(s.id)}
                  className={`w-2 h-2 rounded-full transition-all cursor-pointer ${currentStep === s.id ? 'w-6 bg-blue-600' : currentStep > s.id ? 'bg-emerald-400' : 'bg-gray-200'}`}
                />
              ))}
            </div>

            {currentStep < STEPS.length ? (
              <button
                type="button"
                onClick={() => setCurrentStep(s => Math.min(STEPS.length, s + 1))}
                className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors cursor-pointer shadow-sm"
              >
                Next <FiChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors cursor-pointer shadow-sm disabled:opacity-60"
              >
                <FiSave className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save & Finish'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaintingPageWizard;
