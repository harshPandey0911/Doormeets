import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { FiCheckCircle } from 'react-icons/fi';
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
  LuScale
} from 'react-icons/lu';
import { getPaintingPublicSettings } from '../../services/paintingConsultationService';

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

const getRoomIcon = (detail = '') => {
  const d = detail.toLowerCase();
  if (d.includes('bed')) return <LuBed className="w-3.5 h-3.5 shrink-0" />;
  if (d.includes('kitchen')) return <LuChefHat className="w-3.5 h-3.5 shrink-0" />;
  if (d.includes('bath') || d.includes('toilet') || d.includes('washroom')) return <LuBath className="w-3.5 h-3.5 shrink-0" />;
  if (d.includes('living') || d.includes('hall') || d.includes('dining') || d.includes('reception') || d.includes('room')) {
    return <LuLayers className="w-3.5 h-3.5 shrink-0" />;
  }
  return <FiCheckCircle className="w-3.5 h-3.5 shrink-0" />;
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

const RoomConfiguration = ({ onSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [requested, setRequested] = useState(false);
  const [layouts, setLayouts] = useState([]);
  const [pageConfig, setPageConfig] = useState(null);
  const [comparingLayouts, setComparingLayouts] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Check for successful request navigation state callback
  useEffect(() => {
    if (location.state?.requested) {
      setRequested(true);
      // Clear navigation state so notification doesn't repeat on reload
      navigate(location.pathname, { replace: true, state: {} });
      if (onSuccess) onSuccess();
    }
  }, [location.state, navigate, location.pathname, onSuccess]);

  // Scroll to top on mount to fix React Router scroll persistence issues
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const enrichLayout = (layout) => {
    const nameLower = (layout.name || '').toLowerCase();
    
    let key = '1BHK';
    if (nameLower.includes('2 bhk') || nameLower.includes('2bhk')) key = '2BHK';
    else if (nameLower.includes('3 bhk') || nameLower.includes('3bhk')) key = '3BHK';
    else if (nameLower.includes('4 bhk') || nameLower.includes('4bhk')) key = '4BHK';
    else if (nameLower.includes('villa')) key = 'Villa';
    else if (nameLower.includes('office') || nameLower.includes('commercial')) key = 'Office_Commercial';
    
    const defaults = ENRICHED_LAYOUTS_DATA[key];
    return {
      ...layout,
      description: layout.description || defaults.description,
      imageUrl: layout.imageUrl || defaults.imageUrl,
      details: layout.details && layout.details.length > 0 ? layout.details : defaults.details,
      tag: layout.tag || defaults.tag
    };
  };

  useEffect(() => {
    getPaintingPublicSettings().then(res => {
      if (res?.success) {
        // Load page config
        if (res.settings?.paintingPageConfig) {
          setPageConfig(res.settings.paintingPageConfig);
        }
        // Load property layouts
        if (res?.settings?.propertyLayouts?.length > 0) {
          const enriched = res.settings.propertyLayouts.map(enrichLayout);
          setLayouts(enriched);
        } else {
          // Fallback to our premium default list of 6 layouts
          setLayouts(Object.entries(ENRICHED_LAYOUTS_DATA).map(([id, data]) => ({
            id,
            name: id === 'Office_Commercial' ? 'Office / Commercial' : id.replace('BHK', ' BHK'),
            ...data
          })));
        }
      } else {
        setLayouts(Object.entries(ENRICHED_LAYOUTS_DATA).map(([id, data]) => ({
          id,
          name: id === 'Office_Commercial' ? 'Office / Commercial' : id.replace('BHK', ' BHK'),
          ...data
        })));
      }
    }).catch(err => {
      console.error('Error fetching dynamic layouts, using defaults:', err);
      setLayouts(Object.entries(ENRICHED_LAYOUTS_DATA).map(([id, data]) => ({
        id,
        name: id === 'Office_Commercial' ? 'Office / Commercial' : id.replace('BHK', ' BHK'),
        ...data
      })));
    });
  }, []);

  const handleCompare = (layout, e) => {
    e.stopPropagation();
    if (comparingLayouts.find(l => l.id === layout.id)) {
      setComparingLayouts(prev => prev.filter(l => l.id !== layout.id));
      toast.success(`Removed ${layout.name} from comparison.`);
      return;
    }
    
    if (comparingLayouts.length >= 3) {
      toast.error('You can compare up to 3 layouts at a time.');
      return;
    }
    
    setComparingLayouts(prev => [...prev, layout]);
    toast.success(`Added ${layout.name} to comparison!`);
  };

  const handleScrollToGrid = () => {
    const grid = document.getElementById('packages-grid');
    if (grid) {
      grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Dynamic or Fallback Feature Cards configured by the admin
  const resolvedFeatures = useMemo(() => {
    // Dynamic mapping helper for admin icon names to premium Lucide React icons
    const getIconComponent = (iconName = '') => {
      const name = iconName.toLowerCase();
      if (name.includes('survey') || name.includes('ruler') || name.includes('repair') || name.includes('tool') || name.includes('measure') || name.includes('home')) {
        return LuRuler;
      }
      if (name.includes('palette') || name.includes('paint') || name.includes('brush') || name.includes('color') || name.includes('format')) {
        return LuPalette;
      }
      if (name.includes('shield') || name.includes('warranty') || name.includes('check') || name.includes('verified') || name.includes('security')) {
        return LuShieldCheck;
      }
      return LuSparkles; // general fallback
    };

    if (pageConfig?.featureCards && pageConfig.featureCards.length > 0) {
      return pageConfig.featureCards.map(card => ({
        icon: getIconComponent(card.icon),
        title: card.title,
        description: card.description
      }));
    }

    return [
      {
        icon: LuRuler,
        title: 'Free Site Survey',
        description: 'Accurate wall laser measurements & moisture inspections by our paint supervisors.'
      },
      {
        icon: LuPalette,
        title: 'Premium Paint Brands',
        description: 'Choose from official collections of Asian Paints, Dulux, Berger, and ultra low-VOC paints.'
      },
      {
        icon: LuShieldCheck,
        title: '2-Year Warranty',
        description: 'Worry-free finish quality and paint peeling warranty backed by platform safety policies.'
      }
    ];
  }, [pageConfig?.featureCards]);

  return (
    <div className="bg-[#FAFAFA] dark:bg-gray-950 text-[#111827] dark:text-gray-100 min-h-screen font-sans antialiased">
      
      {/* Dynamic requested status toast removed */}

      {/* Hero Section Container */}
      <div className="relative overflow-x-hidden bg-gradient-to-b from-[#FFF5F2]/60 via-white to-[#FAFAFA] dark:from-gray-950 dark:via-gray-950 dark:to-gray-950 pt-6 pb-12 md:pb-16 px-4 md:px-8">
        
        {/* Glow Blob Background Graphics */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#E85D3F]/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-[#E85D3F]/3 rounded-full blur-[100px] -z-10 pointer-events-none" />
        
        {/* Premium Page Header */}
        <header className="max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4">
          
          {/* Left Column: Copy & Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="lg:col-span-7 text-left space-y-6 md:pr-6"
          >
            {/* Top Badge pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFF5F2] dark:bg-[#E85D3F]/10 border border-[#E85D3F]/20 text-[#E85D3F] text-[11px] font-bold tracking-widest uppercase shadow-sm">
              <LuSparkles className="w-3.5 h-3.5 animate-pulse" />
              {pageConfig?.badgeText || 'Premium Painting Services'}
            </div>

            {/* Impactful Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-[56px] font-black text-gray-900 dark:text-white tracking-tight leading-[1.1] md:max-w-xl">
              {pageConfig?.heroTitle || 'Professional Painting Services'}
            </h1>

            {/* Hero Subtitle Description */}
            <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 leading-relaxed font-normal max-w-lg">
              {pageConfig?.heroSubtitle || 'Book a free professional consultation and receive a personalized, detailed quotation after our on-site expert inspection.'}
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                onClick={handleScrollToGrid}
                className="bg-[#E85D3F] hover:bg-[#d04a2d] text-white font-bold px-8 py-4 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-[#E85D3F]/25 hover:scale-[1.02] shadow-md shadow-[#E85D3F]/10 text-xs md:text-sm uppercase tracking-wider text-center cursor-pointer"
                style={{ minHeight: '48px' }}
              >
                Book Free Survey
              </button>
              <button
                onClick={handleScrollToGrid}
                className="border border-gray-300 dark:border-gray-700 hover:border-[#E85D3F] text-[#111827] dark:text-gray-200 hover:bg-[#FFF5F2]/40 dark:hover:bg-[#E85D3F]/5 font-bold px-8 py-4 rounded-full transition-all duration-300 text-xs md:text-sm uppercase tracking-wider text-center cursor-pointer"
                style={{ minHeight: '48px' }}
              >
                View Packages
              </button>
            </div>

            {/* Trust Badges Strip */}
            <div className="pt-6 border-t border-gray-100 dark:border-gray-900 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-400 dark:text-gray-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E85D3F]"></span>
                ★ 4.9 Rated Painters
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E85D3F]"></span>
                100% Insured Teams
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E85D3F]"></span>
                Premium Quality Materials
              </span>
            </div>
          </motion.div>

          {/* Right Column: Hero Visuals */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
            className="lg:col-span-5 relative hidden lg:block"
          >
            {/* Visual Frame */}
            <div className="relative rounded-[28px] overflow-hidden border-[6px] border-white dark:border-gray-900 shadow-2xl w-full h-[460px] transform rotate-1">
              <img 
                src="/assets/painting-hero.png" 
                alt="Modern premium interior paint style"
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>

            {/* Floating Visual Badges */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="absolute -top-4 -left-6 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-4 shadow-xl flex items-center gap-3 max-w-xs"
            >
              <div className="w-10 h-10 rounded-xl bg-[#FFF5F2] dark:bg-[#E85D3F]/10 flex items-center justify-center text-[#E85D3F] shrink-0">
                <LuPalette className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">10k+ Homes Styled</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Top-rated color consultations</p>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 0.5 }}
              className="absolute -bottom-4 -right-2 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-4 shadow-xl flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <LuShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">100% Safe Paints</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">Low VOC, eco-friendly certifications</p>
              </div>
            </motion.div>
          </motion.div>

        </header>
      </div>

      {/* Section Divider Spacer */}
      <div className="h-20 md:h-24" />

      {/* Features Strip Section */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-8">
        <div className="text-center max-w-xl mx-auto space-y-3 mb-12">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Designed for Ultimate Peace of Mind
          </h2>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 leading-relaxed font-normal">
            Enjoy premium standard painting execution, from transparent quotations to certified post-paint checks.
          </p>
        </div>

        {/* Features list cards */}
        <div className={`grid grid-cols-1 ${
          resolvedFeatures.length === 2 
            ? 'md:grid-cols-2 max-w-4xl mx-auto' 
            : resolvedFeatures.length === 4 
              ? 'md:grid-cols-2 lg:grid-cols-4' 
              : 'md:grid-cols-3'
        } gap-8`}>
          {resolvedFeatures.map((feat, idx) => {
            const IconComponent = feat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800/80 rounded-[20px] p-8 shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col items-start text-left space-y-4 w-full"
              >
                <div className="w-12 h-12 rounded-[16px] bg-[#FFF5F2] dark:bg-[#E85D3F]/10 text-[#E85D3F] flex items-center justify-center shrink-0 shadow-sm">
                  <IconComponent className="w-6 h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{feat.title}</h3>
                  <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-normal">
                    {feat.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Section Divider Spacer */}
      <div className="h-20 md:h-24" />

      {/* Packages / Layouts Selection Section */}
      <section id="packages-grid" className="max-w-[1280px] mx-auto px-4 md:px-8 scroll-mt-20">
        <div className="text-center max-w-xl mx-auto space-y-3 mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Select Your Property Layout
          </h2>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 leading-relaxed font-normal">
            Choose your layout package. Our supervisor will conduct a free inspection to confirm custom requirements.
          </p>
        </div>

        {/* Packages Grid wrapper */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {layouts.map((layout) => (
            <motion.div
              key={layout.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.4 }}
              className="group relative flex flex-col bg-white dark:bg-gray-900 rounded-[24px] overflow-hidden border border-gray-150/60 dark:border-gray-800/80 shadow-[0_8px_30px_rgba(232,93,63,0.01)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] hover:-translate-y-2 transition-all duration-300"
            >
              {/* Layout Photo Image frame */}
              <div className="relative h-60 w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                <ImageWithSkeleton 
                  src={layout.imageUrl}
                  alt={layout.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Left Floating Overlay Badge */}
                <div className="absolute top-4 left-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md text-[#E85D3F] border border-[#E85D3F]/10 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E85D3F] animate-pulse"></span>
                  Free Survey
                </div>

                {/* Right Tag Badge */}
                {layout.tag && (
                  <div className="absolute top-4 right-4 bg-[#E85D3F] text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md">
                    {layout.tag}
                  </div>
                )}
              </div>

              {/* Layout Card Details */}
              <div className="p-6 md:p-8 flex-1 flex flex-col justify-between space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                    {layout.name}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-normal min-h-[40px]">
                    {layout.description}
                  </p>
                </div>

                {/* Included items room chips list */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-widest block">
                    Inclusions Blueprint:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(layout.details || []).map((detail, dIdx) => (
                      <span 
                        key={dIdx} 
                        className="inline-flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800/40 border border-gray-150/50 dark:border-gray-800 px-3 py-1 rounded-xl text-[10px] md:text-xs text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-100 transition-colors"
                      >
                        {getRoomIcon(detail)}
                        {detail}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Pricing component */}
                <div className="pt-2 flex items-baseline gap-2">
                  <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold">Estimated:</span>
                  <span className="text-2xl font-black text-[#E85D3F]">
                    {getPricePlaceholder(layout.name)}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">onwards*</span>
                </div>

                {/* CTAs strip */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800/80 flex items-center gap-3">
                  <button 
                    onClick={() => navigate(`/user/painting/${layout.id}`, { state: { layout } })}
                    className="flex-1 bg-[#E85D3F] hover:bg-[#d04a2d] text-white text-xs md:text-sm font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-md shadow-[#E85D3F]/15 hover:shadow-lg text-center cursor-pointer"
                    style={{ minHeight: '44px' }}
                  >
                    Book Survey
                  </button>
                  <button
                    onClick={(e) => handleCompare(layout, e)}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                      comparingLayouts.find(l => l.id === layout.id)
                        ? 'border-[#E85D3F] bg-[#FFF5F2] dark:bg-[#E85D3F]/10 text-[#E85D3F]'
                        : 'border-gray-255 dark:border-gray-700 hover:border-[#E85D3F] text-gray-600 dark:text-gray-300'
                    }`}
                    style={{ minHeight: '44px' }}
                    aria-label={`Compare ${layout.name}`}
                  >
                    <LuScale className="w-4 h-4" />
                    <span className="hidden sm:inline">Compare</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Section Divider Spacer */}
      <div className="h-20 md:h-24" />

      {/* Bottom Contact / Premium Call to Action */}
      <section className="max-w-[1280px] mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          className="relative bg-gradient-to-r from-gray-900 via-gray-950 to-gray-900 text-white rounded-[28px] p-8 md:p-12 lg:p-16 overflow-hidden shadow-2xl border border-gray-800 flex flex-col lg:flex-row items-center justify-between gap-8"
        >
          {/* Subtle soft orange backdrop glow */}
          <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-[#E85D3F]/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#E85D3F]/5 rounded-full blur-[60px] pointer-events-none" />

          {/* Left Text details */}
          <div className="text-center lg:text-left space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[#E85D3F] text-[10px] font-bold uppercase tracking-widest">
              <LuPhone className="w-3.5 h-3.5" />
              Special Assistance
            </div>
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight">
              {pageConfig?.supportSection?.title || 'Need a Custom Property Layout?'}
            </h3>
            <p className="text-xs md:text-sm text-gray-400 leading-relaxed font-normal">
              {pageConfig?.supportSection?.description || 'Our commercial experts handle larger enterprise spaces, hotels, offices, and unique multi-use properties. Reach out to schedule a custom team callback.'}
            </p>
          </div>

          {/* Right Action button */}
          <a
            href="tel:+1800DOORMEETS"
            className="bg-[#E85D3F] hover:bg-[#d04a2d] text-white font-bold px-8 py-4 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-[#E85D3F]/20 hover:scale-[1.02] flex items-center justify-center gap-2 shrink-0 text-xs md:text-sm uppercase tracking-wider"
            style={{ minHeight: '48px' }}
          >
            {pageConfig?.supportSection?.buttonLabel || 'Contact Support'}
            <LuArrowRight className="w-4 h-4" />
          </a>
        </motion.div>
      </section>

      {/* Floating Comparison Drawer Component */}
      <AnimatePresence>
        {comparingLayouts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-6 left-4 right-4 z-40 max-w-2xl mx-auto"
          >
            <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-3xl p-4 md:p-5 shadow-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FFF5F2] dark:bg-[#E85D3F]/10 text-[#E85D3F] flex items-center justify-center">
                  <LuScale className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs md:text-sm font-bold text-gray-900 dark:text-white">
                    Compare Packages ({comparingLayouts.length}/3)
                  </h4>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">
                    Compare layout blue-prints and prices
                  </p>
                </div>
              </div>

              {/* Thumbnails Selected */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-1.5">
                  {comparingLayouts.map(l => (
                    <div 
                      key={l.id} 
                      className="relative w-8 h-8 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 group"
                    >
                      <img src={l.imageUrl} className="w-full h-full object-cover" alt="" />
                      <button
                        onClick={(e) => handleCompare(l, e)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white outline-none focus:outline-none focus:ring-0 border-none cursor-pointer"
                      >
                        <LuX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setIsCompareModalOpen(true)}
                  className="bg-[#E85D3F] hover:bg-[#d04a2d] text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all duration-300 flex items-center gap-1 cursor-pointer"
                >
                  Compare Now
                  <LuArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setComparingLayouts([])}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all duration-200 outline-none focus:outline-none focus:ring-0 border-none cursor-pointer flex items-center justify-center"
                  aria-label="Clear all selection"
                >
                  <LuX className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Package Comparison Detailed Modal */}
      <AnimatePresence>
        {isCompareModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsCompareModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-[28px] border border-gray-150 dark:border-gray-800 shadow-2xl overflow-hidden w-full max-w-4xl max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LuScale className="w-5 h-5 text-[#E85D3F]" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Compare Layout Specifications</h3>
                </div>
                <button
                  onClick={() => setIsCompareModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-all duration-200 outline-none focus:outline-none focus:ring-0 border-none cursor-pointer flex items-center justify-center"
                >
                  <LuX className="w-5 h-5" />
                </button>
              </div>

              {/* Comparison Details Grid */}
              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-3 gap-6">
                  {comparingLayouts.map((layout) => (
                    <div key={layout.id} className="space-y-6 flex flex-col justify-between h-full border-r last:border-0 border-gray-100 dark:border-gray-800/80 pr-6 last:pr-0">
                      
                      {/* Top layout basic card info */}
                      <div className="space-y-4">
                        <div className="h-32 w-full rounded-2xl overflow-hidden bg-gray-100">
                          <img src={layout.imageUrl} className="w-full h-full object-cover" alt={layout.name} />
                        </div>
                        <div>
                          <div className="inline-block bg-[#FFF5F2] dark:bg-[#E85D3F]/10 border border-[#E85D3F]/10 text-[#E85D3F] px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider mb-1">
                            {layout.tag}
                          </div>
                          <h4 className="text-base font-black text-gray-900 dark:text-white leading-tight">
                            {layout.name}
                          </h4>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 leading-normal">
                            {layout.description}
                          </p>
                        </div>
                      </div>

                      {/* Specs blueprint section */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">
                          Included Rooms:
                        </span>
                        <div className="flex flex-col gap-1.5">
                          {layout.details.map((detail, idx) => (
                            <span 
                              key={idx} 
                              className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 font-medium"
                            >
                              {getRoomIcon(detail)}
                              {detail}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Pricing Specs */}
                      <div className="pt-4 border-t border-gray-100 dark:border-gray-800/80 space-y-3">
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Estimated cost:</p>
                          <p className="text-xl font-black text-[#E85D3F] mt-0.5">
                            {getPricePlaceholder(layout.name)}
                          </p>
                          <p className="text-[9px] text-gray-405 mt-0.5">*Includes expert supervision & standard colors</p>
                        </div>

                        <button 
                          onClick={() => {
                            setIsCompareModalOpen(false);
                            navigate(`/user/painting/${layout.id}`, { state: { layout } });
                          }}
                          className="w-full bg-[#E85D3F] hover:bg-[#d04a2d] text-white text-xs font-bold py-2.5 rounded-xl transition-all duration-300 text-center flex items-center justify-center gap-1 cursor-pointer"
                        >
                          Book Free Survey
                          <LuChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer warning */}
              <div className="bg-gray-50 dark:bg-gray-900/60 p-4 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                <LuInfo className="w-4 h-4 shrink-0 text-gray-455" />
                <span>Pricing shown is a baseline model calculation. Final estimations depend on surface conditions, custom damp treatment, and paint options selected during dynamic site surveys.</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default RoomConfiguration;
