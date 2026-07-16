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
    <div ref={containerRef} className="min-h-screen bg-light-bg pb-10">
      {/* SVG Gradient Definition */}
      <svg width="0" height="0" className="absolute">
        <linearGradient id="doormeets-about-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#B33A35" />
          <stop offset="50%" stopColor="#9E2E2A" />
          <stop offset="100%" stopColor="#D56C67" />
        </linearGradient>
      </svg>
 
      {/* Header */}
      <header className="bg-transparent backdrop-blur-xl border-b border-border-color sticky top-0 z-30">
        <div className="px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-orange-50/10 rounded-full transition-colors active:scale-95 text-dark-text"
          >
            <FiArrowLeft className="w-5 h-5 text-dark-text" />
          </button>
          <span className="text-xl font-semibold" style={doormeetsTextGradient}>About Doormeets</span>
        </div>
      </header>

      <main className="px-5 py-6 space-y-8">
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
            <div className="absolute inset-0 bg-white rounded-full shadow-lg flex items-center justify-center overflow-hidden">
              {aboutConfig.logoUrl ? (
                <img src={aboutConfig.logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
              ) : (
                <Logo className="w-16 h-16 object-contain" />
              )}
            </div>
          </div>

          <h1 className="text-3xl font-semibold text-dark-text tracking-tight mb-2">
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
          <p className="text-secondary-text max-w-xs mx-auto leading-relaxed text-sm">
            {aboutConfig.subtitle}
          </p>
        </div>

        {/* Stats Row */}
        <div className="animate-item flex justify-between bg-card-bg rounded-2xl p-6 shadow-sm border border-border-color divide-x divide-border-color">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex-1 text-center px-2">
              <div className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-[#B33A35] to-[#9E2E2A]">
                {stat.number}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-secondary-text font-medium mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Mission Statement */}
        <div className="animate-item">
          <div className="bg-gradient-to-br from-[#B33A35]/5 to-[#9E2E2A]/5 rounded-2xl p-6 border border-[#B33A35]/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <FiGlobe className="w-24 h-24 text-dark-text" />
            </div>
            <h3 className="text-lg font-semibold text-dark-text mb-3">Our Mission</h3>
            <p className="text-sm text-secondary-text leading-relaxed relative z-10 font-medium">
              {aboutConfig.mission}
            </p>
          </div>
        </div>

        {/* Why Choose Us Grid */}
        <div className="animate-item">
          <h3 className="text-lg font-semibold text-dark-text mb-4 px-1">Why Choose Doormeets?</h3>
          <div className="grid grid-cols-2 gap-3">
            {(aboutConfig.features || []).map((feature, index) => (
              <div
                key={index}
                className="bg-card-bg rounded-2xl p-4 shadow-sm border border-border-color hover:shadow-md transition-shadow group"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300"
                  style={{ background: 'linear-gradient(135deg, rgba(255, 159, 69, 0.1), rgba(255, 184, 108, 0.1))' }}>
                  {renderDynamicIcon(feature.iconName, "w-5 h-5", { stroke: 'url(#doormeets-about-gradient)' })}
                </div>
                <h4 className="text-sm font-semibold text-dark-text mb-1">{feature.title}</h4>
                <p className="text-xs text-secondary-text leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="animate-item">
          <h3 className="text-lg font-semibold text-dark-text mb-4 px-1">How We Work</h3>
          <div className="bg-card-bg rounded-2xl p-1 shadow-sm border border-border-color">
            {(aboutConfig.steps || []).map((step, i) => (
              <div key={i} className="flex items-center p-4 border-b last:border-0 border-border-color relative">
                <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 mr-4 shadow-sm text-white font-semibold text-lg relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#B33A35] to-[#9E2E2A]" />
                  <span className="relative z-10">{i + 1}</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-dark-text flex items-center gap-2">
                    {step.title}
                    {renderDynamicIcon(step.iconName, "w-3.5 h-3.5 opacity-60 text-dark-text")}
                  </h4>
                  <p className="text-xs text-secondary-text mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Info */}
        <div className="animate-item text-center pt-4 border-t border-border-color">
          <p className="text-xs text-secondary-text mb-1 font-medium">Designed & Developed by</p>
          <span className="text-sm font-semibold tracking-wide" style={doormeetsTextGradient}>Doormeets Team</span>
          <p className="text-[10px] text-secondary-text opacity-50 mt-4">v7.6.27 • Made with ❤️ in India</p>
        </div>
      </main>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AboutDoormeets;
