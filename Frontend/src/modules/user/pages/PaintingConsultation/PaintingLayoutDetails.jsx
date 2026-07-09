import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { FiCheck, FiCheckCircle } from 'react-icons/fi';
import { 
  LuRuler, 
  LuPalette, 
  LuShieldCheck, 
  LuBed, 
  LuChefHat, 
  LuBath, 
  LuLayers, 
  LuArrowRight, 
  LuPhone, 
  LuSparkles,
  LuX,
  LuChevronRight,
  LuInfo,
  LuScale,
  LuArrowLeft,
  LuChevronDown,
  LuFileText
} from 'react-icons/lu';
import { requestConsultation, getPaintingPublicSettings } from '../../services/paintingConsultationService';

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

const getPricePlaceholder = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('1 bhk') || n.includes('1bhk')) return '₹11,999';
  if (n.includes('2 bhk') || n.includes('2bhk')) return '₹18,999';
  if (n.includes('3 bhk') || n.includes('3bhk')) return '₹27,999';
  if (n.includes('4 bhk') || n.includes('4bhk')) return '₹36,999';
  if (n.includes('villa')) return '₹59,999';
  if (n.includes('office') || n.includes('commercial')) return '₹45,999';
  return '₹9,999';
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
  { title: 'Book Consultation', description: 'Select your layout and request a site survey online.' },
  { title: 'Expert Visits Property', description: 'Our consulting supervisor visits your address at your convenience.' },
  { title: 'Measurements Taken', description: 'Supervisor measures walls and ceilings using laser precision tools.' },
  { title: 'Paint & Recommendation', description: 'Get guidance on paint types, sheens, and waterproofing details.' },
  { title: 'Digital Quote Generated', description: 'Receive a transparent, fully itemized quote on your account dashboard.' },
  { title: 'Approve Quote & Start Work', description: 'Approve the estimate to schedule our verified expert painters.' }
];

const VALUE_PROPS = [
  { title: 'Experienced Professionals', description: 'Our trained supervisors monitor execution and safety standards.', icon: 'shield_person' },
  { title: 'Branded Paint Options', description: 'Genuine products from leading brands like Asian Paints, Dulux, and Berger.', icon: 'opacity' },
  { title: 'Transparent Pricing', description: 'Itemized digital bills detailing paint quality and labor components.', icon: 'account_balance_wallet' },
  { title: 'Warranty Support', description: 'Worry-free paint durability warranties backed by our platform policies.', icon: 'verified' },
  { title: 'Free Consultation', description: 'Complimentary site evaluation and recommendations with zero obligation.', icon: 'volunteer_activism' }
];

const getRoomIcon = (detail = '') => {
  const d = detail.toLowerCase();
  if (d.includes('bed')) return <LuBed className="w-5 h-5 shrink-0" />;
  if (d.includes('kitchen')) return <LuChefHat className="w-5 h-5 shrink-0" />;
  if (d.includes('bath') || d.includes('toilet') || d.includes('washroom')) return <LuBath className="w-5 h-5 shrink-0" />;
  if (d.includes('living') || d.includes('hall') || d.includes('dining') || d.includes('reception') || d.includes('room')) {
    return <LuLayers className="w-5 h-5 shrink-0" />;
  }
  return <FiCheckCircle className="w-5 h-5 shrink-0" />;
};

// Reusable FAQ Accordion Component
const FAQAccordion = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-150/60 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow transition-shadow duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-bold text-gray-900 dark:text-white hover:bg-gray-50/50 dark:hover:bg-gray-850/50 transition-colors duration-200 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none border-none cursor-pointer"
      >
        <span className="text-sm md:text-base tracking-tight">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-[#E85D3F] shrink-0"
        >
          <LuChevronDown className="w-5 h-5" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="px-6 pb-5 text-xs md:text-sm text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-800/80 pt-4 font-normal">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Image loader component with responsive skeleton loader
const ImageWithSkeleton = ({ src, alt, className }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className="relative w-full h-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
      {!loaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
          <LuPalette className="w-10 h-10 text-gray-400 dark:text-gray-600 animate-spin" />
        </div>
      )}
      <img
        src={error ? 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=800' : src}
        alt={alt}
        className={`${className} ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} transition-all duration-500 ease-out`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        loading="lazy"
      />
    </div>
  );
};

// Premium Page Skeleton Loader
const SkeletonLoader = () => {
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-950 font-sans pb-32 animate-pulse">
      {/* Hero Skeleton */}
      <div className="h-[360px] md:h-[480px] bg-gray-200 dark:bg-gray-800 w-full" />
      
      <div className="max-w-[1280px] mx-auto px-4 pt-12 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column Skeleton */}
          <div className="lg:col-span-2 space-y-12">
            {/* Overview Skeleton */}
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 dark:bg-gray-800 w-48 rounded" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(n => (
                  <div key={n} className="h-20 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
                ))}
              </div>
            </div>
            
            {/* Timeline Skeleton */}
            <div className="space-y-6">
              <div className="h-6 bg-gray-200 dark:bg-gray-800 w-48 rounded" />
              <div className="space-y-8 pl-6">
                {[1, 2, 3].map(n => (
                  <div key={n} className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-800 w-32 rounded" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-800 w-64 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right Sidebar Skeleton */}
          <div className="space-y-8">
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
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
  const [modalStep, setModalStep] = useState(1); // 1: Areas selection, 2: Review Screen
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
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    // Reset any layout locks that might be stuck
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    document.body.style.height = '';
    document.documentElement.style.height = '';
  }, []);

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

  const getTimelineIcon = (idx) => {
    switch (idx) {
      case 0: return <LuPhone className="w-4 h-4 shrink-0" />;
      case 1: return <LuSparkles className="w-4 h-4 shrink-0" />;
      case 2: return <LuRuler className="w-4 h-4 shrink-0" />;
      case 3: return <LuFileText className="w-4 h-4 shrink-0" />;
      case 4: return <LuPalette className="w-4 h-4 shrink-0" />;
      default: return <FiCheckCircle className="w-4 h-4 shrink-0" />;
    }
  };

  const getReactIcon = (iconName = '') => {
    const name = iconName.toLowerCase();
    if (name.includes('shield') || name.includes('safety') || name.includes('verified') || name.includes('protect') || name.includes('person')) {
      return <LuShieldCheck className="w-5 h-5" />;
    }
    if (name.includes('wallet') || name.includes('price') || name.includes('cash') || name.includes('card') || name.includes('money') || name.includes('account_balance') || name.includes('file')) {
      return <LuFileText className="w-5 h-5" />;
    }
    if (name.includes('paint') || name.includes('brush') || name.includes('palette') || name.includes('color') || name.includes('opacity')) {
      return <LuPalette className="w-5 h-5" />;
    }
    if (name.includes('star') || name.includes('quality') || name.includes('expert') || name.includes('sparkles') || name.includes('volunteer')) {
      return <LuSparkles className="w-5 h-5" />;
    }
    return <FiCheckCircle className="w-5 h-5" />;
  };

  // Custom visual list for trust section cards mapping dynamically to admin-configured valueProps
  const trustFeatures = useMemo(() => {
    const list = pageConfig?.valueProps?.length > 0 ? pageConfig.valueProps : VALUE_PROPS;
    return list.map(item => ({
      icon: () => getReactIcon(item.icon),
      title: item.title,
      description: item.description || item.desc || ''
    }));
  }, [pageConfig?.valueProps]);

  const accordionFaqs = useMemo(() => {
    return [
      {
        question: 'Is this site survey consultation completely free?',
        answer: 'Yes. Our supervisor will inspect your walls, test moisture levels, measure the area, and generate a digital quotation with absolutely zero cost or obligation to you.'
      },
      {
        question: 'How long does the site inspection take?',
        answer: 'A standard home inspection takes approximately 45 to 60 minutes depending on the property size and requirements.'
      },
      {
        question: 'Which paint brands and choices do you offer?',
        answer: 'We provide catalog selections from all major premium brands, including Asian Paints Royale, Berger Silk, Dulux Velvet, and specific sanitizing coatings.'
      },
      {
        question: 'Can I reschedule or cancel the inspection?',
        answer: 'Yes. You can cancel or reschedule the survey at any time from your account dashboard or by speaking directly with your assigned supervisor.'
      },
      {
        question: 'When will I receive my digital quotation?',
        answer: 'A comprehensive, fully itemized digital bill is generated and sent to your Doormeets dashboard within 2 hours of completing the physical site measurement.'
      }
    ];
  }, []);

  if (pageLoading) {
    return <SkeletonLoader />;
  }

  if (!layout) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FAFAFA] dark:bg-gray-950 px-4 text-center">
        <LuInfo className="w-12 h-12 text-[#E85D3F] mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Layout Not Found</h2>
        <p className="text-sm text-gray-500 max-w-sm mb-6">The requested property layout specifications could not be loaded.</p>
        <button 
          onClick={() => navigate('/user/painting')}
          className="px-6 py-2.5 bg-white border border-gray-200 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm hover:shadow"
        >
          Back to Painting
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans pb-32">
      
      {/* Immersive Hero Header */}
      <div className="relative h-[340px] md:h-[440px] w-full overflow-hidden bg-gray-100 dark:bg-gray-900">
        <ImageWithSkeleton 
          src={layout.imageUrl} 
          alt={layout.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent"></div>
        
        {/* Navigation Floating Header */}
        <div className="absolute top-0 inset-x-0 p-4 sm:p-6 flex items-center justify-between z-10">
          <button 
            onClick={() => navigate(-1)}
            className="w-11 h-11 rounded-full bg-white/10 text-white backdrop-blur-md border border-white/20 hover:bg-white/25 active:scale-95 flex items-center justify-center shadow-md transition-all outline-none focus:outline-none focus:ring-0 border-none cursor-pointer"
            aria-label="Back"
          >
            <LuArrowLeft className="w-5 h-5 font-bold" />
          </button>
        </div>

        {/* Hero Meta Info */}
        <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 md:p-12 max-w-[1280px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center flex-wrap gap-2">
              <div className="inline-flex items-center gap-1.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md text-[#E85D3F] text-[10px] font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E85D3F] animate-pulse"></span>
                {pageConfig?.detailsBadgeText || 'Free Consultation'}
              </div>
              {layout.tag && (
                <span className="bg-[#E85D3F] text-white text-[10px] font-black px-3.5 py-1.5 rounded-full uppercase tracking-widest shadow-md">
                  {layout.tag}
                </span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              {layout.name}
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-gray-200/90 max-w-xl font-normal leading-relaxed">
              {layout.description}
            </p>

            {/* Quick trust metrics strip */}
            <div className="pt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-gray-300 font-medium">
              <span className="flex items-center gap-1">★ 4.9 Rating</span>
              <span className="w-1 h-1 rounded-full bg-gray-500"></span>
              <span className="flex items-center gap-1">5000+ Painted</span>
              <span className="w-1 h-1 rounded-full bg-gray-500"></span>
              <span className="flex items-center gap-1">Certified Experts</span>
              <span className="w-1 h-1 rounded-full bg-gray-500"></span>
              <span className="flex items-center gap-1">2-Yr Warranty</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-4 pt-12 md:pt-16 sm:px-6">

        {/* Property Overview — full-width, always at the top */}
        <section className="space-y-5 mb-12">
          <div className="space-y-1">
            <div className="text-[10px] font-black text-[#E85D3F] uppercase tracking-widest">Scope details</div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              {pageConfig?.overviewTitle || 'Property Overview'}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {(layout.details || []).map((detail, idx) => (
              <div
                key={idx}
                className="p-5 bg-white dark:bg-gray-900 border border-gray-150/60 dark:border-gray-800 rounded-2xl flex flex-col justify-between items-start gap-4 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-[#FFF5F2] dark:bg-[#E85D3F]/10 text-[#E85D3F] flex items-center justify-center shrink-0 shadow-sm">
                  {getRoomIcon(detail)}
                </div>
                <div className="text-xs md:text-sm font-bold text-gray-900 dark:text-gray-100 leading-snug">
                  {detail}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          
          {/* Main Left Columns */}
          <div className="lg:col-span-2 space-y-16 order-2 lg:order-1">

            {/* Why Choose Us */}
            <section className="space-y-5">
              <div className="space-y-1">
                <div className="text-[10px] font-black text-[#E85D3F] uppercase tracking-widest">Platform benefits</div>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  {pageConfig?.whyChooseTitle || 'Why Choose Doormeets Painting'}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {trustFeatures.map((feat, idx) => {
                  return (
                    <div 
                      key={idx} 
                      className="p-6 bg-white dark:bg-gray-900 border border-gray-150/60 dark:border-gray-800 rounded-2xl flex flex-col gap-4 shadow-sm hover:shadow-md transition-all duration-300"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#FFF5F2] dark:bg-[#E85D3F]/10 text-[#E85D3F] flex items-center justify-center shrink-0 shadow-sm">
                        {feat.icon()}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">{feat.title}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-normal">{feat.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* What's Included visual grid */}
            <section className="space-y-5">
              <div className="space-y-1">
                <div className="text-[10px] font-black text-[#E85D3F] uppercase tracking-widest">Inspection blueprint</div>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  {pageConfig?.inclusionsTitle || "What's Included in Consultation"}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {(pageConfig?.inclusions?.length > 0 ? pageConfig.inclusions : CONSULTATION_INCLUSIONS).map((item, idx) => (
                  <div key={idx} className="p-4 bg-white dark:bg-gray-900 border border-gray-150/60 dark:border-gray-800 rounded-2xl flex items-center gap-3 shadow-sm">
                    <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                      <FiCheck className="w-3 h-3 font-black" />
                    </span>
                    <span className="text-xs text-gray-800 dark:text-gray-200 font-semibold">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* How It Works Timeline */}
            <section className="space-y-8">
              <div className="space-y-1">
                <div className="text-[10px] font-black text-[#E85D3F] uppercase tracking-widest">Process flow</div>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  {pageConfig?.howItWorksTitle || 'How It Works'}
                </h2>
              </div>
              
              <div className="relative pl-8 border-l-2 border-[#FFF5F2] dark:border-gray-800/80 space-y-10 py-2 ml-4">
                {(pageConfig?.workflowSteps?.length > 0 ? pageConfig.workflowSteps : WORKFLOW_STEPS).map((step, idx) => (
                  <motion.div 
                    key={idx} 
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="relative group text-left"
                  >
                    {/* Timeline Node dot */}
                    <span className="absolute -left-[45px] top-0 w-8 h-8 rounded-full border-4 border-[#FAFAFA] dark:border-gray-950 bg-[#FFF5F2] dark:bg-gray-900 text-[#E85D3F] flex items-center justify-center font-bold text-xs shadow-md transition-colors duration-300">
                      {getTimelineIcon(idx)}
                    </span>
                    
                    <div className="space-y-1.5 pt-0.5">
                      <span className="text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block">Step 0{idx + 1}</span>
                      <h4 className="text-base font-bold text-gray-900 dark:text-gray-200">
                        {step.title}
                      </h4>
                      <p className="text-xs md:text-sm text-gray-500 dark:text-gray-405 leading-relaxed max-w-xl font-normal">
                        {step.description || step.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* FAQs Accordions Section */}
            <section className="space-y-5">
              <div className="space-y-1">
                <div className="text-[10px] font-black text-[#E85D3F] uppercase tracking-widest">Questions answered</div>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  Frequently Asked Questions
                </h2>
              </div>
              <div className="space-y-4">
                {accordionFaqs.map((faq, idx) => (
                  <FAQAccordion key={idx} question={faq.question} answer={faq.answer} />
                ))}
              </div>
            </section>

          </div>

          {/* Right Column (Sticky Sidebar Summary) */}
          <div className="space-y-8 lg:sticky lg:top-24 order-1 lg:order-2">
            
            {/* Pricing Summary Card */}
            <div className="p-6 md:p-8 bg-white dark:bg-gray-900 border border-gray-150/60 dark:border-gray-800 rounded-3xl space-y-6 shadow-sm">
              <div className="space-y-4">
                <div className="text-[10px] font-black text-[#E85D3F] uppercase tracking-widest">Estimate overview</div>
                <div className="space-y-1 border-b border-gray-100 dark:border-gray-800 pb-4">
                  <div className="text-xs text-gray-400 dark:text-gray-500 font-semibold">Survey Inspection Fee:</div>
                  <div className="text-3xl font-black text-emerald-500 flex items-center gap-2">
                    FREE
                    <span className="text-[11px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-black px-2 py-0.5 rounded-md uppercase tracking-wider">Site Inspection</span>
                  </div>
                </div>
                
                <div className="space-y-1 border-b border-gray-100 dark:border-gray-800 pb-4">
                  <div className="text-xs text-gray-400 dark:text-gray-500 font-semibold">Estimated Starting Price:</div>
                  <div className="text-2xl font-black text-gray-900 dark:text-white">
                    {getPricePlaceholder(layout.name)}
                    <span className="text-xs text-gray-400 font-semibold ml-1">onwards*</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-gray-600 dark:text-gray-300">
                  <div className="space-y-1">
                    <span className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-wider block">Duration:</span>
                    <span>45-60 Mins</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-gray-400 dark:text-gray-500 text-[10px] uppercase font-bold tracking-wider block">Response:</span>
                    <span>Within 30 mins</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => { setModalStep(1); setIsTypeModalOpen(true); }}
                className="w-full bg-[#E85D3F] hover:bg-[#d04a2d] text-white text-xs md:text-sm uppercase tracking-wider font-extrabold py-4 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
                style={{ minHeight: '48px' }}
              >
                Confirm & Book Consultation
                <LuArrowRight className="w-4 h-4" />
              </button>

              {/* Note warning details */}
              <div className="p-4 bg-amber-50/20 dark:bg-amber-950/10 border border-amber-200/40 dark:border-amber-900/30 rounded-2xl flex gap-3 text-left">
                <LuInfo className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 dark:text-amber-300/90 leading-relaxed font-semibold">
                  {pageConfig?.infoNoteText || 'Final pricing is calculated after measuring the actual paintable area and understanding your requirements.'}
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Sticky Bottom Booking Bar */}
      <footer className="fixed bottom-6 inset-x-4 max-w-5xl mx-auto bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border border-gray-200/50 dark:border-gray-800/80 p-4 sm:p-5 rounded-3xl z-40 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left space-y-1">
          <h4 className="text-xs md:text-sm font-black text-gray-800 dark:text-white flex items-center justify-center sm:justify-start gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {pageConfig?.bottomBarTitle || 'Free Site Inspection'}
          </h4>
          <p className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500">
            {pageConfig?.bottomBarSubtitle || 'Usually responds within 30 mins • 45 mins inspection'}
          </p>
        </div>
        
        <button 
          onClick={() => { setModalStep(1); setIsTypeModalOpen(true); }}
          className="w-full sm:w-auto min-w-[220px] bg-[#E85D3F] hover:bg-[#d04a2d] text-white text-xs uppercase tracking-wider font-extrabold py-3.5 px-8 rounded-full shadow-lg shadow-[#E85D3F]/20 hover:shadow-[#E85D3F]/35 hover:scale-[1.02] flex items-center justify-center gap-2.5 transition-all duration-300 cursor-pointer"
          style={{ minHeight: '44px' }}
        >
          {pageConfig?.bottomBarButtonLabel || 'Confirm & Book Consultation'}
        </button>
      </footer>

      {/* Guided Multi-Step Onboarding Modal */}
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
              className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-[28px] overflow-hidden shadow-2xl z-10 flex flex-col max-h-[85vh] sm:max-h-[90vh] md:max-h-[95vh] border border-gray-150 dark:border-gray-800"
            >
              {/* Header with progress steps */}
              <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-850 shrink-0 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-black text-[#E85D3F] uppercase tracking-widest mb-0.5">
                    Step {modalStep} of 2
                  </div>
                  <h3 className="text-base lg:text-lg font-black text-gray-900 dark:text-white">
                    {modalStep === 1 ? 'What would you like to paint?' : 'Review Booking Details'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTypeModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 p-1.5 rounded-full outline-none focus:outline-none focus:ring-0 focus-visible:outline-none border-none cursor-pointer flex items-center justify-center shrink-0" 
                  aria-label="Close"
                >
                  <LuX className="w-5 h-5" />
                </button>
              </div>

              {/* Step 1 Content Selection cards list */}
              {modalStep === 1 ? (
                <div className="p-6 overflow-y-auto space-y-4 flex-1">
                  {/* Interior Painting card */}
                  <div 
                    onClick={() => handleToggleOption('interior')}
                    className={`p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 cursor-pointer ${
                      selectedOptions.both ? 'opacity-50 cursor-not-allowed bg-gray-50/50 dark:bg-gray-850/50 border-gray-100 dark:border-gray-800' :
                      selectedOptions.interior 
                        ? 'border-[#E85D3F] bg-[#FFF5F2] dark:bg-[#E85D3F]/10 shadow-sm' 
                        : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-850/50'
                    }`}
                  >
                    <div className="pt-0.5">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        selectedOptions.interior 
                          ? 'bg-[#E85D3F] border-[#E85D3F] text-white' 
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
                    className={`p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 cursor-pointer ${
                      selectedOptions.both ? 'opacity-50 cursor-not-allowed bg-gray-50/50 dark:bg-gray-850/50 border-gray-100 dark:border-gray-800' :
                      selectedOptions.exterior 
                        ? 'border-[#E85D3F] bg-[#FFF5F2] dark:bg-[#E85D3F]/10 shadow-sm' 
                        : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-850/50'
                    }`}
                  >
                    <div className="pt-0.5">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        selectedOptions.exterior 
                          ? 'bg-[#E85D3F] border-[#E85D3F] text-white' 
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
                    className={`p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 cursor-pointer ${
                      selectedOptions.both 
                        ? 'border-[#E85D3F] bg-[#FFF5F2] dark:bg-[#E85D3F]/10 shadow-sm' 
                        : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-850/50'
                    }`}
                  >
                    <div className="pt-0.5">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        selectedOptions.both 
                          ? 'bg-[#E85D3F] border-[#E85D3F] text-white' 
                          : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950'
                      }`}>
                        {selectedOptions.both && <FiCheck className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white">Interior + Exterior Painting</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Complete, end-to-end home painting consultation.</p>
                    </div>
                  </div>

                  {/* Other Requirement card */}
                  <div 
                    onClick={() => handleToggleOption('other')}
                    className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col gap-3 cursor-pointer ${
                      selectedOptions.other 
                        ? 'border-[#E85D3F] bg-[#FFF5F2] dark:bg-[#E85D3F]/10 shadow-sm' 
                        : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-850/50'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="pt-0.5">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          selectedOptions.other 
                            ? 'bg-[#E85D3F] border-[#E85D3F] text-white' 
                            : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950'
                        }`}>
                          {selectedOptions.other && <FiCheck className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">Other Custom Requirement</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Texture details, metal work, waterproofing, custom finishes.</p>
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
                          className="w-full px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs outline-none focus:border-[#E85D3F] bg-white dark:bg-gray-950 resize-none text-gray-800 dark:text-gray-150 font-medium"
                        />
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 leading-relaxed font-semibold">
                          Examples: Textured accent wall, waterproofing treatment, office partitions, wood coating, repair work.
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Step 2 Review Screen */
                <div className="p-6 overflow-y-auto space-y-5 flex-1 text-left">
                  <div className="p-5 bg-gray-50 dark:bg-gray-900/60 rounded-2xl space-y-4 border border-gray-100 dark:border-gray-800">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Selected Layout:</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{layout.name}</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Scope Areas:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {selectedOptions.interior && (
                          <span className="bg-[#FFF5F2] dark:bg-[#E85D3F]/10 border border-[#E85D3F]/10 px-2.5 py-0.5 rounded-lg text-xs font-bold text-[#E85D3F]">Interior</span>
                        )}
                        {selectedOptions.exterior && (
                          <span className="bg-[#FFF5F2] dark:bg-[#E85D3F]/10 border border-[#E85D3F]/10 px-2.5 py-0.5 rounded-lg text-xs font-bold text-[#E85D3F]">Exterior</span>
                        )}
                        {selectedOptions.both && (
                          <span className="bg-[#FFF5F2] dark:bg-[#E85D3F]/10 border border-[#E85D3F]/10 px-2.5 py-0.5 rounded-lg text-xs font-bold text-[#E85D3F]">Interior + Exterior</span>
                        )}
                        {selectedOptions.other && otherText.trim() && (
                          <span className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2.5 py-0.5 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300">Custom</span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Consultation Fee:</span>
                      <span className="text-sm font-black text-emerald-500">FREE</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Duration Estimate:</span>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">45 - 60 Minutes physical survey</span>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100/80 dark:border-blue-900/40 rounded-2xl flex gap-3 text-left">
                    <LuInfo className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-[10.5px] text-blue-800 dark:text-blue-300 leading-relaxed font-semibold">
                      Your details will be assigned to a certified Doormeets painting supervisor. They will carry laser guidelines and tools to verify wall measurements.
                    </p>
                  </div>
                </div>
              )}

              {/* Modal Footer actions */}
              <div className="border-t border-gray-100 dark:border-gray-850 p-4.5 bg-gray-50/50 dark:bg-gray-900/50 flex justify-between gap-3 shrink-0">
                {modalStep === 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsTypeModalOpen(false)}
                      className="px-5 py-2.5 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:outline-none"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!selectedOptions.interior && !selectedOptions.exterior && !selectedOptions.both && !selectedOptions.other}
                      onClick={() => setModalStep(2)}
                      className="px-6 py-2.5 bg-[#E85D3F] text-white rounded-xl text-xs font-bold hover:bg-[#d04a2d] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 transition-all cursor-pointer outline-none focus:outline-none focus:ring-0 focus-visible:outline-none"
                    >
                      Continue
                      <LuChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setModalStep(1)}
                      className="px-5 py-2.5 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer flex items-center gap-1.5 outline-none focus:outline-none"
                    >
                      <LuArrowLeft className="w-3.5 h-3.5" />
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmBooking}
                      disabled={loading}
                      className="px-6 py-2.5 bg-[#E85D3F] text-white rounded-xl text-xs font-bold hover:bg-[#d04a2d] shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 transition-all cursor-pointer outline-none focus:outline-none focus:ring-0"
                    >
                      {loading && <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      Confirm & Book Survey
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default PaintingLayoutDetails;
