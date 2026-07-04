import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getPaintingPublicSettings } from '../../services/paintingConsultationService';

const ENRICHED_LAYOUTS_DATA = {
  '1BHK': {
    description: 'Perfect for cozy apartments, studios, and single-bedroom homes.',
    imageUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&q=80&w=600',
    tag: 'Compact',
    details: ['1 Bedroom, 1 Living Room', '1 Kitchen, 1 Bathroom']
  },
  '2BHK': {
    description: 'Ideal standard layout for small families, couples, and guest rooms.',
    imageUrl: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=600',
    tag: 'Standard',
    details: ['2 Bedrooms, 1 Living Room', '1 Kitchen, 2 Bathrooms, 1 Balcony']
  },
  '3BHK': {
    description: 'Generous multi-room layout designed for growing families and spacious living.',
    imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=600',
    tag: 'Premium',
    details: ['3 Bedrooms, 1 Large Living Room', 'Modular Kitchen, 3 Bathrooms, 2 Balconies']
  },
  '4BHK': {
    description: 'Expansive, premium layout offering luxury space for large households.',
    imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=600',
    tag: 'Luxury',
    details: ['4 Bedrooms, 1 Large Living Room, 1 Dining Room', 'Modular Kitchen, 4 Bathrooms, 3 Balconies']
  },
  'Villa': {
    description: 'Complete interior and exterior painting services for premium individual estates.',
    imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=600',
    tag: 'Elite',
    details: ['Multi-story, 4+ Bedrooms, Library', 'Exterior + Interior, Private Terrace']
  },
  'Office_Commercial': {
    description: 'Professional, low-VOC commercial painting optimized for corporate productivity.',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=600',
    tag: 'Commercial',
    details: ['Conference Rooms, Reception, Open Workspace', 'Low-VOC, Quick dry options available']
  }
};

const RoomConfiguration = ({ onSuccess }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [requested, setRequested] = useState(false);
  const [layouts, setLayouts] = useState([]);
  const [pageConfig, setPageConfig] = useState(null);

  // Check for successful request navigation state callback
  useEffect(() => {
    if (location.state?.requested) {
      setRequested(true);
      // Clear navigation state so notification doesn't repeat on reload
      navigate(location.pathname, { replace: true, state: {} });
      if (onSuccess) onSuccess();
    }
  }, [location.state, navigate, location.pathname, onSuccess]);

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

  return (
    <div className="text-on-surface bg-surface min-h-screen pt-4 pb-24 px-4 max-w-6xl mx-auto font-body-lg font-sans">
      
      {requested && (
        <div className="mb-8 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 p-5 rounded-2xl flex items-center justify-between shadow-sm animate-pulse">
          <div className="flex items-center gap-3 text-emerald-800 dark:text-emerald-300">
            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400">check_circle</span>
            <span className="text-sm font-semibold">Consultation requested successfully! Our design experts are reviewing your request.</span>
          </div>
          <button className="text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-200 transition-colors cursor-pointer" onClick={() => setRequested(false)}>
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      {/* Hero Section */}
      <header className="mb-16 text-center max-w-3xl mx-auto space-y-5 pt-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-bold uppercase tracking-widest">
          <span className="material-symbols-outlined text-xs">brush</span>
          {pageConfig?.badgeText || 'Premium Painting Services'}
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
            {pageConfig?.heroTitle || 'Professional Painting Services'}
          </h1>
          <p className="text-sm md:text-base text-gray-500 dark:text-gray-450 leading-relaxed font-normal">
            {pageConfig?.heroSubtitle || 'Book a free professional consultation and receive a personalized, detailed quotation after our on-site expert inspection.'}
          </p>
        </div>
        
        {/* Feature Highlight Cards - admin configurable */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[var(--primary)]/5 via-[var(--primary)]/10 to-[var(--primary)]/5 border border-gray-100 dark:border-gray-800/60 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 max-w-2xl mx-auto shadow-[0_4px_12px_rgba(0,0,0,0.015)]">
          {(pageConfig?.featureCards?.length > 0
            ? pageConfig.featureCards
            : [
                { icon: 'home_repair_service', title: 'Free Site Survey', description: 'Accurate wall measurements & laser tools' },
                { icon: 'palette', title: 'Premium Finishes', description: 'Asian Paints, Berger, Dulux & more' }
              ]
          ).map((card, idx, arr) => (
            <div key={idx} className={`flex items-center gap-4 text-left ${
              idx > 0 ? 'border-t sm:border-t-0 sm:border-l border-gray-200/60 dark:border-gray-800/80 pt-4 sm:pt-0 sm:pl-6' : ''
            }`}>
              <div className="w-11 h-11 rounded-2xl bg-white dark:bg-gray-900 shadow-sm flex items-center justify-center text-[var(--primary)] shrink-0">
                <span className="material-symbols-outlined text-xl">{card.icon}</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-800 dark:text-gray-255">{card.title}</h4>
                <p className="text-[10px] text-gray-450 dark:text-gray-500 mt-0.5">{card.description}</p>
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* Property Layouts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {layouts.map(layout => (
          <div 
            key={layout.id}
            className="group relative flex flex-col bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.012)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.04)] hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
            onClick={() => navigate(`/user/painting/${layout.id}`, { state: { layout } })}
          >
            {/* Property Image */}
            <div className="relative h-56 w-full overflow-hidden bg-gray-100 dark:bg-gray-855">
              <img 
                src={layout.imageUrl} 
                alt={layout.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              {/* Overlay Free Consultation Badge */}
              <span className="absolute top-4 left-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md text-[var(--primary)] border border-[var(--primary)]/10 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse"></span>
                Free Consultation
              </span>
              
              {/* Optional tag overlay */}
              {layout.tag && (
                <span className="absolute top-4 right-4 bg-gray-900/85 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider">
                  {layout.tag}
                </span>
              )}
            </div>

            {/* Card Content */}
            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-gray-900 dark:text-white tracking-tight">{layout.name}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-normal">
                  {layout.description || 'Professional end-to-end painting solution customized to your property layout.'}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                {/* Rooms Summary Label */}
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Included Rooms:</div>
                <div className="flex flex-wrap gap-1.5">
                  {(layout.details || []).map((detail, dIdx) => (
                    <span 
                      key={dIdx} 
                      className="inline-flex items-center gap-1 bg-gray-50 dark:bg-gray-800/60 border border-gray-100/60 dark:border-gray-800/45 px-2.5 py-1 rounded-xl text-[10px] text-gray-600 dark:text-gray-400 font-medium"
                    >
                      <span className="material-symbols-outlined text-[12px] shrink-0 text-gray-450">
                        {detail.toLowerCase().includes('bed') ? 'bed' : detail.toLowerCase().includes('kitchen') ? 'kitchen' : 'check_circle'}
                      </span>
                      {detail}
                    </span>
                  ))}
                </div>
              </div>

              {/* Minimalist Action Trigger */}
              <div className="pt-4 border-t border-gray-50 dark:border-gray-850 flex items-center justify-between">
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate(`/user/painting/${layout.id}`, { state: { layout } }); }}
                  className="text-xs font-bold text-[var(--primary)] group-hover:text-[var(--primary-hover)] flex items-center gap-1 transition-all duration-300 cursor-pointer group/btn"
                >
                  View Details
                  <span className="material-symbols-outlined text-xs transform translate-x-0 group-hover:translate-x-1 transition-transform font-bold">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Support Section - admin configurable */}
      <section className="mt-16 p-8 bg-gray-50/50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 rounded-3xl flex flex-col sm:flex-row items-center gap-6">
        <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-2xl">support_agent</span>
        </div>
        <div className="text-center sm:text-left space-y-1">
          <h4 className="text-base font-bold text-gray-900 dark:text-white">
            {pageConfig?.supportSection?.title || 'Need a Custom Property Layout?'}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {pageConfig?.supportSection?.description || 'Our commercial experts handle larger enterprise spaces, hotels, and unique multi-use complexes.'}
          </p>
        </div>
        <button className="sm:ml-auto border border-gray-200 dark:border-gray-700 hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 text-gray-700 dark:text-gray-200 font-bold px-6 py-3 rounded-xl transition-all duration-300 text-xs tracking-wider uppercase cursor-pointer">
          {pageConfig?.supportSection?.buttonLabel || 'Contact Support'}
        </button>
      </section>

    </div>
  );
};

export default RoomConfiguration;
