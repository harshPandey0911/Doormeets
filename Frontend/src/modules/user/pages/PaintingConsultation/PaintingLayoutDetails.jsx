import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { requestConsultation, getPaintingPublicSettings } from '../../services/paintingConsultationService';
import { toast } from 'react-hot-toast';
import { FiCheck } from 'react-icons/fi';

const ENRICHED_LAYOUTS_DATA = {
  '1BHK': {
    description: 'Perfect for cozy apartments, studios, and single-bedroom homes.',
    imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=800',
    tag: 'Compact',
    details: ['1 Bedroom, 1 Living Room', '1 Kitchen, 1 Bathroom']
  },
  '2BHK': {
    description: 'Ideal standard layout for small families, couples, and guest rooms.',
    imageUrl: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=800',
    tag: 'Standard',
    details: ['2 Bedrooms, 1 Living Room', '1 Kitchen, 2 Bathrooms, 1 Balcony']
  },
  '3BHK': {
    description: 'Generous multi-room layout designed for growing families and spacious living.',
    imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=800',
    tag: 'Premium',
    details: ['3 Bedrooms, 1 Large Living Room', 'Modular Kitchen, 3 Bathrooms, 2 Balconies']
  },
  '4BHK': {
    description: 'Expansive, premium layout offering luxury space for large households.',
    imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=800',
    tag: 'Luxury',
    details: ['4 Bedrooms, 1 Large Living Room, 1 Dining Room', 'Modular Kitchen, 4 Bathrooms, 3 Balconies']
  },
  'Villa': {
    description: 'Complete interior and exterior painting services for premium individual estates.',
    imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=800',
    tag: 'Elite',
    details: ['Multi-story, 4+ Bedrooms, Library', 'Exterior + Interior, Private Terrace']
  },
  'Office_Commercial': {
    description: 'Professional, low-VOC commercial painting optimized for corporate productivity.',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
    tag: 'Commercial',
    details: ['Conference Rooms, Reception, Open Workspace', 'Low-VOC, Quick dry options available']
  }
};

const CONSULTATION_INCLUSIONS = [
  'Site Inspection',
  'Area Measurement',
  'Surface Inspection',
  'Paint Recommendation',
  'Digital Quotation',
  'Material Estimation',
  'Labour Estimation'
];

const WORKFLOW_STEPS = [
  { title: 'Book Consultation', desc: 'Select your layout and request a site survey online.' },
  { title: 'Expert Visits Property', desc: 'Our consulting supervisor visits your address at your convenience.' },
  { title: 'Measurements Taken', desc: 'Supervisor measures walls and ceilings using laser precision tools.' },
  { title: 'Paint & Recommendation', desc: 'Get guidance on paint types, sheens, and waterproofing details.' },
  { title: 'Digital Quote Generated', desc: 'Receive a transparent, fully itemized quote on your account dashboard.' },
  { title: 'Approve Quote & Start Work', desc: 'Approve the estimate to schedule our verified expert painters.' }
];

const VALUE_PROPS = [
  { title: 'Experienced Professionals', desc: 'Our trained supervisors monitor execution and safety standards.', icon: 'shield_person' },
  { title: 'Branded Paint Options', desc: 'Genuine products from leading brands like Asian Paints, Dulux, and Berger.', icon: 'opacity' },
  { title: 'Transparent Pricing', desc: 'Itemized digital bills detailing paint quality and labor components.', icon: 'account_balance_wallet' },
  { title: 'Warranty Support', desc: 'Worry-free paint durability warranties backed by our platform policies.', icon: 'verified' },
  { title: 'Free Consultation', desc: 'Complimentary site evaluation and recommendations with zero obligation.', icon: 'volunteer_activism' }
];

const getRoomIcon = (detail) => {
  const d = detail.toLowerCase();
  if (d.includes('bed')) return 'bed';
  if (d.includes('living') || d.includes('dining')) return 'weekend';
  if (d.includes('kitchen')) return 'kitchen';
  if (d.includes('bath') || d.includes('toilet')) return 'bathtub';
  if (d.includes('balcony') || d.includes('terrace') || d.includes('exterior')) return 'balcony';
  if (d.includes('office') || d.includes('room') || d.includes('workspace') || d.includes('reception')) return 'meeting_room';
  return 'check_circle';
};

const PaintingLayoutDetails = () => {
  const { layoutId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [layout, setLayout] = useState(location.state?.layout || null);
  const [pageConfig, setPageConfig] = useState(null);

  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({
    interior: false,
    exterior: false,
    both: false,
    other: false
  });
  const [otherText, setOtherText] = useState('');

  const enrichLayout = (layoutData) => {
    const nameLower = (layoutData.name || '').toLowerCase();
    let key = '1BHK';
    if (nameLower.includes('2 bhk') || nameLower.includes('2bhk')) key = '2BHK';
    else if (nameLower.includes('3 bhk') || nameLower.includes('3bhk')) key = '3BHK';
    else if (nameLower.includes('4 bhk') || nameLower.includes('4bhk')) key = '4BHK';
    else if (nameLower.includes('villa')) key = 'Villa';
    else if (nameLower.includes('office') || nameLower.includes('commercial')) key = 'Office_Commercial';

    const defaults = ENRICHED_LAYOUTS_DATA[key];
    return {
      ...layoutData,
      description: layoutData.description || defaults.description,
      imageUrl: layoutData.imageUrl || defaults.imageUrl,
      details: layoutData.details && layoutData.details.length > 0 ? layoutData.details : defaults.details,
      tag: layoutData.tag || defaults.tag
    };
  };

  useEffect(() => {
    setPageLoading(true);
    getPaintingPublicSettings().then(res => {
      if (res?.success) {
        // Save page configuration
        if (res.settings?.paintingPageConfig) {
          setPageConfig(res.settings.paintingPageConfig);
        }
        
        // Find property layout details
        if (res.settings?.propertyLayouts?.length > 0) {
          const matching = res.settings.propertyLayouts.find(l => l.id.toLowerCase() === layoutId.toLowerCase());
          if (matching) {
            setLayout(enrichLayout(matching));
          } else {
            // Fallback matching local static list
            const localMatch = ENRICHED_LAYOUTS_DATA[layoutId] || ENRICHED_LAYOUTS_DATA['1BHK'];
            setLayout({
              id: layoutId,
              name: layoutId === 'Office_Commercial' ? 'Office / Commercial' : layoutId.replace('BHK', ' BHK'),
              ...localMatch
            });
          }
        } else {
          const localMatch = ENRICHED_LAYOUTS_DATA[layoutId] || ENRICHED_LAYOUTS_DATA['1BHK'];
          setLayout({
            id: layoutId,
            name: layoutId === 'Office_Commercial' ? 'Office / Commercial' : layoutId.replace('BHK', ' BHK'),
            ...localMatch
          });
        }
      } else {
        const localMatch = ENRICHED_LAYOUTS_DATA[layoutId] || ENRICHED_LAYOUTS_DATA['1BHK'];
        setLayout({
          id: layoutId,
          name: layoutId === 'Office_Commercial' ? 'Office / Commercial' : layoutId.replace('BHK', ' BHK'),
          ...localMatch
        });
      }
    }).catch(err => {
      console.error('Error fetching settings on details page:', err);
      const localMatch = ENRICHED_LAYOUTS_DATA[layoutId] || ENRICHED_LAYOUTS_DATA['1BHK'];
      setLayout({
        id: layoutId,
        name: layoutId === 'Office_Commercial' ? 'Office / Commercial' : layoutId.replace('BHK', ' BHK'),
        ...localMatch
      });
    }).finally(() => {
      setPageLoading(false);
    });
  }, [layoutId]);

  const handleToggleOption = (type) => {
    setSelectedOptions(prev => {
      if (type === 'both') {
        const nextVal = !prev.both;
        return {
          ...prev,
          both: nextVal,
          interior: nextVal ? true : prev.interior,
          exterior: nextVal ? true : prev.exterior
        };
      }
      if (type === 'interior') {
        if (prev.both) return prev;
        return { ...prev, interior: !prev.interior };
      }
      if (type === 'exterior') {
        if (prev.both) return prev;
        return { ...prev, exterior: !prev.exterior };
      }
      if (type === 'other') {
        return { ...prev, other: !prev.other };
      }
      return prev;
    });
  };

  const handleConfirmBooking = async () => {
    if (!layout) return;
    try {
      setLoading(true);
      
      let projectType = 'INTERIOR';
      if (selectedOptions.both || (selectedOptions.interior && selectedOptions.exterior)) {
        projectType = 'INTERIOR';
      } else if (selectedOptions.exterior) {
        projectType = 'EXTERIOR';
      }

      const selections = [];
      if (selectedOptions.interior) selections.push('Interior Painting');
      if (selectedOptions.exterior) selections.push('Exterior Painting');
      if (selectedOptions.both) selections.push('Interior + Exterior');
      if (selectedOptions.other && otherText.trim()) {
        selections.push(`Other: ${otherText.trim()}`);
      }

      const payload = {
        propertyType: layout.id,
        address: {
          street: '123 Test St',
          city: 'Indore',
          state: 'MP',
          pincode: '452001',
          fullAddress: '123 Test St, Indore, MP 452001'
        },
        wizardData: {
          projectType,
          customAreaName: selections.join(', ') || 'Custom Painting Consultation'
        }
      };

      await requestConsultation(payload);
      toast.success(`${layout.name} Consultation Requested!`);
      setIsTypeModalOpen(false);
      navigate('/user/painting', { state: { requested: true } });
    } catch (error) {
      console.error(error);
      toast.error('Failed to request consultation');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-gray-500 font-semibold tracking-wider uppercase">Loading specifications...</p>
        </div>
      </div>
    );
  }

  if (!layout) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-950 px-4 text-center">
        <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">error</span>
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Layout Not Found</h2>
        <p className="text-sm text-gray-500 max-w-sm mb-6">The requested property layout specifications could not be loaded.</p>
        <button 
          onClick={() => navigate('/user/painting')}
          className="px-6 py-2.5 bg-gray-100 dark:bg-gray-850 hover:bg-gray-200 dark:hover:bg-gray-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
        >
          Back to Painting
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans pb-32">
      
      {/* Hero Header */}
      <div className="relative h-64 sm:h-96 w-full overflow-hidden bg-gray-100 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-900">
        <img 
          src={layout.imageUrl} 
          alt={layout.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        
        {/* Navigation Floating Header */}
        <div className="absolute top-0 inset-x-0 p-4 sm:p-6 flex items-center justify-between z-10">
          <button 
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-md flex items-center justify-center text-gray-800 dark:text-gray-200 shadow-md hover:bg-white dark:hover:bg-gray-900 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg font-bold">arrow_back</span>
          </button>
        </div>

        {/* Hero Meta Info */}
        <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md text-[var(--primary)] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse"></span>
              {pageConfig?.detailsBadgeText || 'Free Consultation'}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {layout.name}
            </h1>
            <p className="text-xs sm:text-sm text-gray-200/90 max-w-xl font-normal">
              {layout.description}
            </p>
          </div>
          {layout.tag && (
            <span className="self-start sm:self-auto bg-[var(--primary)] text-white text-[10px] font-bold px-3.5 py-1.5 rounded-xl uppercase tracking-widest shadow-sm">
              {layout.tag}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-12 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          
          {/* Main Left Columns */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Property Overview */}
            <section className="space-y-4">
              <h2 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-1 h-6 bg-[var(--primary)] rounded-full"></span>
                {pageConfig?.overviewTitle || 'Property Overview'}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {(layout.details || []).map((detail, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800/80 rounded-2xl flex items-center gap-3.5 shadow-[0_4px_12px_rgba(0,0,0,0.01)]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-lg">
                        {getRoomIcon(detail)}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-gray-850 dark:text-gray-300 leading-snug">
                        {detail}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

             {/* How It Works Timeline */}
            <section className="space-y-6">
              <h2 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-1 h-6 bg-[var(--primary)] rounded-full"></span>
                {pageConfig?.howItWorksTitle || 'How It Works'}
              </h2>
              
              <div className="relative pl-6 border-l-2 border-gray-100 dark:border-gray-800 space-y-8 py-2">
                {(pageConfig?.workflowSteps?.length > 0 ? pageConfig.workflowSteps : WORKFLOW_STEPS).map((step, idx) => (
                  <div key={idx} className="relative group">
                    {/* Timeline Node dot */}
                    <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-950 bg-gray-200 dark:bg-gray-850 group-hover:bg-[var(--primary)] transition-colors duration-300"></span>
                    
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-gray-905 dark:text-gray-200">
                        {step.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-lg">
                        {step.description || step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

             {/* Why Choose Us */}
            <section className="space-y-6">
              <h2 className="text-xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-1 h-6 bg-[var(--primary)] rounded-full"></span>
                {pageConfig?.whyChooseTitle || 'Why Choose Doormeets Painting'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {(pageConfig?.valueProps?.length > 0 ? pageConfig.valueProps : VALUE_PROPS).map((prop, idx) => (
                  <div 
                    key={idx} 
                    className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.01)] space-y-2.5"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                      <span className="material-symbols-outlined text-base">
                        {prop.icon}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-gray-850 dark:text-gray-200">{prop.title}</h4>
                      <p className="text-[11px] text-gray-500 dark:text-gray-405 leading-relaxed">{prop.description || prop.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* Right Column (Sidebar) */}
          <div className="space-y-8 lg:sticky lg:top-24">
            
            {/* What's Included */}
            <div className="p-6 bg-gray-50/50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 rounded-3xl space-y-5">
              <h3 className="text-sm font-black uppercase tracking-wider text-gray-450 dark:text-gray-400">
                {pageConfig?.inclusionsTitle || "What's Included in Consultation"}
              </h3>
              
              <div className="space-y-3">
                {(pageConfig?.inclusions?.length > 0 ? pageConfig.inclusions : CONSULTATION_INCLUSIONS).map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-450 shrink-0">
                      <span className="material-symbols-outlined text-xs font-extrabold">check</span>
                    </span>
                    <span className="text-xs text-gray-700 dark:text-gray-300 font-semibold">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Note Card */}
            <div className="p-5 bg-amber-50/30 dark:bg-amber-950/10 border border-amber-200/40 dark:border-amber-900/30 rounded-2xl flex gap-3.5">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-450 shrink-0">info</span>
              <p className="text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed font-medium">
                {pageConfig?.infoNoteText || 'Final pricing is calculated after measuring the actual paintable area and understanding your requirements.'}
              </p>
            </div>

          </div>

        </div>
      </div>

      {/* Sticky Bottom Booking Bar */}
      <footer className="fixed bottom-0 inset-x-0 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-t border-gray-150 dark:border-gray-850 p-4 sm:p-5 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left space-y-1">
            <h4 className="text-sm font-black text-gray-800 dark:text-white flex items-center justify-center sm:justify-start gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {pageConfig?.bottomBarTitle || 'Free Site Inspection'}
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {pageConfig?.bottomBarSubtitle || 'Book a consultation today and receive a personalized quotation.'}
            </p>
          </div>
          
          <button 
            onClick={() => setIsTypeModalOpen(true)}
            className="w-full sm:w-auto min-w-[220px] bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs uppercase tracking-wider font-extrabold py-3.5 px-8 rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer"
          >
            {pageConfig?.bottomBarButtonLabel || 'Confirm & Book Consultation'}
          </button>
        </div>
      </footer>

      {/* Premium Minimalist Centered Modal */}
      <AnimatePresence>
        {isTypeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTypeModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[85vh] sm:max-h-[90vh] md:max-h-[95vh] border border-gray-100 dark:border-gray-800"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-850 shrink-0 text-center sm:text-left">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">What would you like to paint?</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select the area you want our painting expert to inspect.</p>
              </div>

              {/* Selection cards list */}
              <div className="p-6 overflow-y-auto space-y-4 flex-1">
                
                {/* Interior Painting card */}
                <div 
                  onClick={() => handleToggleOption('interior')}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3 cursor-pointer ${
                    selectedOptions.both ? 'opacity-60 cursor-not-allowed bg-gray-50/50 dark:bg-gray-850/50 border-gray-100 dark:border-gray-800' :
                    selectedOptions.interior 
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5 dark:bg-[var(--primary)]/10 shadow-sm' 
                      : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-850/50'
                  }`}
                >
                  <div className="pt-0.5">
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      selectedOptions.interior 
                        ? 'bg-[var(--primary)] border-[var(--primary)] text-white' 
                        : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950'
                    }`}>
                      {selectedOptions.interior && <FiCheck className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">Interior Painting</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Walls, ceilings, bedrooms, living room, kitchen and indoor spaces.</p>
                  </div>
                </div>

                {/* Exterior Painting card */}
                <div 
                  onClick={() => handleToggleOption('exterior')}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3 cursor-pointer ${
                    selectedOptions.both ? 'opacity-60 cursor-not-allowed bg-gray-50/50 dark:bg-gray-850/50 border-gray-100 dark:border-gray-800' :
                    selectedOptions.exterior 
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5 dark:bg-[var(--primary)]/10 shadow-sm' 
                      : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-850/50'
                  }`}
                >
                  <div className="pt-0.5">
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      selectedOptions.exterior 
                        ? 'bg-[var(--primary)] border-[var(--primary)] text-white' 
                        : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950'
                    }`}>
                      {selectedOptions.exterior && <FiCheck className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">Exterior Painting</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Outside walls, balconies, terrace and building exterior.</p>
                  </div>
                </div>

                {/* Interior + Exterior card */}
                <div 
                  onClick={() => handleToggleOption('both')}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3 cursor-pointer ${
                    selectedOptions.both 
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5 dark:bg-[var(--primary)]/10 shadow-sm' 
                      : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-850/50'
                  }`}
                >
                  <div className="pt-0.5">
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      selectedOptions.both 
                        ? 'bg-[var(--primary)] border-[var(--primary)] text-white' 
                        : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950'
                    }`}>
                      {selectedOptions.both && <FiCheck className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">Interior + Exterior</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Complete home painting consultation.</p>
                  </div>
                </div>

                {/* Other Requirement card */}
                <div 
                  onClick={() => handleToggleOption('other')}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col gap-3 cursor-pointer ${
                    selectedOptions.other 
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5 dark:bg-[var(--primary)]/10 shadow-sm' 
                      : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-850/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="pt-0.5">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        selectedOptions.other 
                          ? 'bg-[var(--primary)] border-[var(--primary)] text-white' 
                          : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950'
                      }`}>
                        {selectedOptions.other && <FiCheck className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">Other Requirement</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Custom painting work.</p>
                    </div>
                  </div>
                  
                  {/* Dynamic textarea when Other Requirement selected */}
                  {selectedOptions.other && (
                    <div className="w-full space-y-2 mt-1" onClick={(e) => e.stopPropagation()}>
                      <textarea
                        rows={3}
                        value={otherText}
                        onChange={(e) => setOtherText(e.target.value)}
                        placeholder="Describe your painting requirement..."
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-[var(--primary)] bg-white dark:bg-gray-950 resize-none text-gray-800 dark:text-gray-150 font-medium"
                      />
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed font-semibold">
                        Examples: Texture paint, Waterproofing, Office painting, Commercial building, Wood polish, Metal painting, Ceiling repair, Custom work.
                      </div>
                    </div>
                  )}
                </div>

                {/* Subtle Information card note */}
                <div className="p-4 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100/80 dark:border-blue-900/40 rounded-2xl flex gap-3 text-left">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 shrink-0 text-lg">info</span>
                  <p className="text-[10.5px] text-blue-800 dark:text-blue-300 leading-relaxed font-semibold">
                    Our painting expert will inspect the selected areas and prepare a personalized quotation based on the actual measurements.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-gray-100 dark:border-gray-850 p-4.5 bg-gray-50/50 dark:bg-gray-900/50 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsTypeModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-55 dark:hover:bg-gray-850 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={loading || (!selectedOptions.interior && !selectedOptions.exterior && !selectedOptions.both && !selectedOptions.other)}
                  className="px-6 py-2.5 bg-[var(--primary)] text-white rounded-xl text-xs font-bold hover:bg-[var(--primary-hover)] shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {loading && <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Continue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default PaintingLayoutDetails;
