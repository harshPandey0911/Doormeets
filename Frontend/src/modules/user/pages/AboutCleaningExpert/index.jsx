import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiGlobe } from 'react-icons/fi';
import * as FiIcons from 'react-icons/fi';
import { gsap } from 'gsap';
import Logo from '../../../../components/common/Logo';
import { configService } from '../../../../services/configService';

const AboutDoormeets = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  
  const [aboutConfig, setAboutConfig] = useState({
    title: 'Welcome to Doormeets',
    subtitle: 'Your trusted partner for premium home and personal care services.',
    happyCustomers: '10K+',
    servicePartners: '500+',
    appRating: '4.8',
    mission: 'Doormeets is dedicated to revolutionizing how you experience home services. We connect you with top-tier professionals to deliver safe, reliable, and high-quality services right at your doorstep. We believe in making life simpler, one service at a time.',
    logoUrl: '',
    features: [
      { title: 'Expert Providers', description: 'Verified professionals for all your needs', iconName: 'FiUsers' },
      { title: 'Safe & Secure', description: 'Your safety is our top priority', iconName: 'FiShield' },
      { title: 'On-Time Service', description: 'Punctual delivery at your convenience', iconName: 'FiClock' },
      { title: 'Quality Assured', description: 'Service with 100% satisfaction guarantee', iconName: 'FiAward' }
    ],
    steps: [
      { title: 'Book Details', desc: 'Select service & schedule time', iconName: 'FiSmartphone' },
      { title: 'Get Matched', desc: 'We assign a top-rated pro', iconName: 'FiUsers' },
      { title: 'Relax', desc: 'Enjoy high-quality service', iconName: 'FiSmile' }
    ]
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await configService.getSettings();
        if (res && res.aboutPageConfig) {
          setAboutConfig(res.aboutPageConfig);
        }
      } catch (err) {
        console.error('Failed to load dynamic about page config', err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    // Entrance animation
    const ctx = gsap.context(() => {
      gsap.from('.animate-item', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out'
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Gradient Definition for inline styles
  const doormeetsGradient = 'linear-gradient(135deg, #B33A35 0%, #9E2E2A 100%)';
  const doormeetsTextGradient = {
    background: doormeetsGradient,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  };

  const stats = [
    { number: aboutConfig.happyCustomers || '10K+', label: 'Happy Customers' },
    { number: aboutConfig.servicePartners || '500+', label: 'Service Partners' },
    { number: aboutConfig.appRating || '4.8', label: 'App Rating' },
  ];

  // Helper to render icon dynamically by string name
  const renderDynamicIcon = (iconName, className, styleProps = {}) => {
    const IconComponent = FiIcons[iconName];
    if (IconComponent) {
      return <IconComponent className={className} style={styleProps} />;
    }
    return <FiIcons.FiCheckCircle className={className} style={styleProps} />;
  };

  return (
    <div ref={containerRef} className="min-h-screen pb-10" style={{ backgroundColor: 'var(--background)' }}>
      {/* SVG Gradient Definition */}
      <svg width="0" height="0" className="absolute">
        <linearGradient id="doormeets-about-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B33A35" />
          <stop offset="50%" stopColor="#9E2E2A" />
          <stop offset="100%" stopColor="#D56C67" />
        </linearGradient>
      </svg>
 
      {/* Header */}
      <header className="sticky top-0 z-30 border-b backdrop-blur-xl" style={{ backgroundColor: 'var(--background)', borderColor: 'var(--border)' }}>
        <div className="px-4 py-3.5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border cursor-pointer transition-colors"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xl font-bold tracking-tight" style={doormeetsTextGradient}>About Doormeets</span>
        </div>
      </header>

      <main className="px-5 py-6 space-y-8 max-w-5xl mx-auto">
        {/* Hero Section */}
        <div className="animate-item text-center">
          <div className="relative w-28 h-28 mx-auto mb-6">
            {/* Spinning Border */}
            <div
              className="absolute inset-[-3px] rounded-full opacity-70"
              style={{
                background: 'conic-gradient(from 0deg, #B33A35, #9E2E2A, #D56C67, #B33A35)',
                animation: 'spin 4s linear infinite',
              }}
            />
            {/* Logo Wrapper */}
            <div className="absolute inset-0 rounded-full shadow-lg flex items-center justify-center overflow-hidden border p-0.5" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
              {aboutConfig.logoUrl ? (
                <img src={aboutConfig.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-full" />
              ) : (
                <Logo className="w-full h-full object-cover rounded-full" />
              )}
            </div>
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
            {aboutConfig.title?.includes('Doormeets') ? (
              <>
                {aboutConfig.title.split('Doormeets')[0]}
                <span style={doormeetsTextGradient}>Doormeets</span>
                {aboutConfig.title.split('Doormeets')[1]}
              </>
            ) : (
              aboutConfig.title || 'Welcome to Doormeets'
            )}
          </h1>
          <p className="max-w-xs mx-auto leading-relaxed text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            {aboutConfig.subtitle}
          </p>
        </div>

        {/* Stats Row */}
        <div className="animate-item flex justify-between rounded-xl p-5 shadow-xs border divide-x" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
          {stats.map((stat, idx) => (
            <div key={idx} className="flex-1 text-center px-2">
              <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#B33A35] to-[#9E2E2A]">
                {stat.number}
              </div>
              <div className="text-[10px] uppercase tracking-wider font-semibold mt-1" style={{ color: 'var(--text-secondary)' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Mission Statement */}
        <div className="animate-item">
          <div className="rounded-xl p-5 border relative overflow-hidden" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <FiGlobe className="w-24 h-24" style={{ color: 'var(--text-primary)' }} />
            </div>
            <h3 className="text-lg font-bold mb-2.5" style={{ color: 'var(--text-primary)' }}>Our Mission</h3>
            <p className="text-sm leading-relaxed relative z-10 font-medium" style={{ color: 'var(--text-secondary)' }}>
              {aboutConfig.mission}
            </p>
          </div>
        </div>

        {/* Why Choose Us Grid */}
        <div className="animate-item">
          <h3 className="text-lg font-bold mb-3 px-1" style={{ color: 'var(--text-primary)' }}>Why Choose Doormeets?</h3>
          <div className="grid grid-cols-2 gap-3">
            {(aboutConfig.features || []).map((feature, index) => (
              <div
                key={index}
                className="rounded-xl p-3.5 shadow-xs border hover:shadow-md transition-all group"
                style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform duration-300 bg-orange-500/10">
                  {renderDynamicIcon(feature.iconName, "w-4.5 h-4.5", { stroke: 'url(#doormeets-about-gradient)' })}
                </div>
                <h4 className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{feature.title}</h4>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="animate-item">
          <h3 className="text-lg font-bold mb-3 px-1" style={{ color: 'var(--text-primary)' }}>How We Work</h3>
          <div className="rounded-xl p-1 shadow-xs border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
            {(aboutConfig.steps || []).map((step, i) => (
              <div key={i} className="flex items-center p-3.5 border-b last:border-0 relative" style={{ borderColor: 'var(--border)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mr-3.5 shadow-sm text-white font-bold text-base relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#B33A35] to-[#9E2E2A]" />
                  <span className="relative z-10">{i + 1}</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                    {step.title}
                    {renderDynamicIcon(step.iconName, "w-3.5 h-3.5 opacity-60")}
                  </h4>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="animate-item text-center pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs mb-1 font-medium" style={{ color: 'var(--text-secondary)' }}>Designed & Developed by</p>
          <span className="text-sm font-bold tracking-wide" style={doormeetsTextGradient}>Doormeets Team</span>
          <p className="text-[10px] opacity-50 mt-4" style={{ color: 'var(--text-muted)' }}>v7.6.27 • Made with ❤️ in India</p>
        </div>
      </main>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AboutDoormeets;
