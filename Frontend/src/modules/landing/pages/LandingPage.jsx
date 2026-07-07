import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  FaUser, FaStore, FaHammer, FaClock, FaArrowRight, FaChevronDown, 
  FaStar, FaShieldAlt, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, 
  FaGooglePlay, FaBars, FaTimes, FaBroom, FaTools, FaBolt, 
  FaPaintRoller, FaQuoteLeft, FaPlay, FaCheck, FaHandshake, 
  FaCalendarCheck, FaAward, FaClipboardList, FaCalendarAlt, 
  FaCheckDouble, FaLinkedin, FaTwitter
} from 'react-icons/fa';
import { configService } from '../../../services/configService';
import { publicCatalogService } from '../../../services/catalogService';

const toAssetUrl = (url) => {
  if (!url) return '';
  const clean = url.replace('/api/upload', '/upload');
  if (clean.startsWith('http')) return clean;
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/api$/, '');
  return `${base}${clean.startsWith('/') ? '' : '/'}${clean}`;
};

const serviceImages = [
  "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=800"
];

// ── Global animation variants ──────────────────────────────────────────────
const VP = { once: false, amount: 0.18 };

const fadeUp = {
  hidden: { opacity: 0, y: 48 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
};
const fadeLeft = {
  hidden: { opacity: 0, x: -56 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
};
const fadeRight = {
  hidden: { opacity: 0, x: 56 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};
const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.13, delayChildren: 0.05 } }
};
const staggerItem = {
  hidden: { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};
// ──────────────────────────────────────────────────────────────────────────


const timelineContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2
    }
  }
};

const timelineItemVariants = {
  hidden: { opacity: 0, scale: 0.85, y: 30 },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const timelineLineVariants = {
  hidden: { scaleX: 0 },
  visible: { 
    scaleX: 1,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const LandingPage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [activeFaq, setActiveFaq] = useState(null);
  const [currentStatsImage, setCurrentStatsImage] = useState(0);
  const [cardOrder, setCardOrder] = useState([0, 1, 2]);

  const handleCardSwap = () => {
    setCardOrder((prev) => {
      const next = [...prev];
      const front = next.shift();
      next.push(front);
      return next;
    });
  };

  useEffect(() => {
    const statsTimer = setInterval(() => {
      setCurrentStatsImage((prev) => (prev + 1) % serviceImages.length);
    }, 3000);
    return () => clearInterval(statsTimer);
  }, []);

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await configService.getSettings();
      if (data?.success) {
        setSettings(data.settings);
      }
    };

    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await publicCatalogService.getCategories();
        if (response?.success) {
          setCategories(response.categories || []);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchSettings();
    fetchCategories();
  }, []);

  const PLAY_STORE_URL = "https://play.google.com/store/search?q=doormeets&c=apps";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans overflow-x-hidden selection:bg-cyan-500 selection:text-white">
      
      {/* 1. TOP INFORMATION BAR */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800 hidden sm:block">
        <div className="container mx-auto max-w-[1440px] flex justify-between items-center">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <FaPhoneAlt className="text-cyan-400" />
              <a href={`tel:${settings?.supportPhone || '+919876543210'}`} className="hover:text-white transition-colors">{settings?.supportPhone || '+91 98765 43210'}</a>
            </span>
            <span className="flex items-center gap-2">
              <FaEnvelope className="text-cyan-400" />
              <a href={`mailto:${settings?.supportEmail || 'support@doormeets.com'}`} className="hover:text-white transition-colors">{settings?.supportEmail || 'support@doormeets.com'}</a>
            </span>
            <span className="flex items-center gap-2">
              <FaMapMarkerAlt className="text-cyan-400" />
              <span>{settings?.companyCity || 'Indore'}, Madhya Pradesh</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <FaClock className="text-cyan-400 mr-1" />
              <span>Mon - Sat: 09:00 AM - 08:00 PM</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER / NAVIGATION */}
      <header className="sticky top-0 z-[100] bg-white/95 backdrop-blur-md border-b border-slate-100 py-4 shadow-sm">
        <div className="container mx-auto px-6 max-w-[1440px] flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-normal tracking-tight text-slate-900 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Doormeets
            </span>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full">
              Pro
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-700">
            {[
              { label: "Home", href: "#hero" },
              { label: "About Us", href: "#about" },
              { label: "Services", href: "#services" },
              { label: "Why Us", href: "#stats" },
              { label: "Partners", href: "#team" }
            ].map((link, idx) => (
              <a 
                key={idx}
                href={link.href} 
                className="relative py-1.5 hover:text-cyan-600 transition-colors group"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-cyan-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
              </a>
            ))}
            
            <Link
              to="/user"
              className="ml-4 px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl transition-all shadow-md font-bold text-sm tracking-wide"
            >
              Book Service Now
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-slate-800 text-2xl focus:outline-none"
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-100 py-6 px-8 flex flex-col gap-4 shadow-xl z-50 font-bold"
            >
              <a href="#hero" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-700 hover:text-cyan-600 py-1">Home</a>
              <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-700 hover:text-cyan-600 py-1">About Us</a>
              <a href="#services" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-700 hover:text-cyan-600 py-1">Services</a>
              <a href="#stats" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-700 hover:text-cyan-600 py-1">Why Us</a>
              <a href="#join" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-700 hover:text-cyan-600 py-1">Partners</a>
              <Link
                to="/user"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl text-sm"
              >
                Book Service Now
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* 3. HERO SECTION */}
      <section 
        id="hero" 
        className="relative pt-24 pb-36 md:pt-36 md:pb-48 bg-slate-950 overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/hero-bg.png')" }}
      >
        {/* Faded overlay for text readability while keeping the right side bright and clear */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/20 to-transparent"></div>

        <div className="container mx-auto px-6 max-w-[1440px] relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Hero Content */}
            <motion.div
              className="lg:col-span-6 text-center lg:text-left"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.span variants={staggerItem} className="inline-block text-[11px] font-normal uppercase tracking-widest text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-4 py-1.5 rounded-full mb-6">
                ✦ Smart Home Repairs. Verified Experts.
              </motion.span>
              <motion.h1 variants={staggerItem} className="text-4xl sm:text-5xl md:text-6xl font-normal text-white leading-[1.1] mb-6">
                Moving Home Services <br />
                <span className="text-cyan-400">Forward, Together.</span>
              </motion.h1>
              <motion.p variants={staggerItem} className="text-base sm:text-lg text-slate-300 leading-relaxed mb-8 max-w-lg">
                We deliver seamless logistics and technical support for home repairs, maintenance, and diagnostics. Connecting Indore homeowners directly to certified spare parts and platform-guaranteed service experts.
              </motion.p>

              {/* Action Buttons */}
              <motion.div variants={staggerItem} className="flex flex-wrap gap-4 justify-center lg:justify-start items-center">
                <Link
                  to="/user"
                  className="px-8 py-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-base font-bold shadow-lg hover:shadow-cyan-600/20 transition-all flex items-center gap-2 group"
                >
                  Get A Free Quote <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <a
                  href="#about"
                  className="px-6 py-4 bg-slate-900/60 hover:bg-slate-800 text-slate-200 border border-slate-800/60 rounded-xl text-base font-bold transition-all flex items-center gap-2"
                >
                  <span className="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center text-white text-[10px]"><FaPlay className="ml-0.5" /></span>
                  Watch Our Story
                </a>
              </motion.div>

              {/* Avatars Widget */}
              <motion.div variants={staggerItem} className="mt-10 flex items-center justify-center lg:justify-start gap-4">
                <div className="flex -space-x-3">
                  <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100" alt="Avatar" className="w-10 h-10 rounded-full border-2 border-slate-900 object-cover" />
                  <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" alt="Avatar" className="w-10 h-10 rounded-full border-2 border-slate-900 object-cover" />
                  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100" alt="Avatar" className="w-10 h-10 rounded-full border-2 border-slate-900 object-cover" />
                </div>
                <div className="text-left">
                  <div className="flex text-amber-400 text-xs">
                    <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                  </div>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Trusted by 12K+ customers (4.9 Reviews)</p>
                </div>
              </motion.div>
            </motion.div>

          </div>
        </div>

        {/* Bottom Curve Shape - Symmetrical gentle downward dip with highlight line and soft shadow */}
        <div className="absolute bottom-0 left-0 right-0 overflow-visible line-height-0 z-20">
          <svg viewBox="0 0 1440 160" preserveAspectRatio="none" className="relative block w-full h-[40px] sm:h-[80px] overflow-visible">
            <defs>
              {/* Premium soft shadow filter */}
              <filter id="hero-curve-shadow" x="-10%" y="-10%" width="120%" height="130%">
                <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#0f172a" floodOpacity="0.05" />
              </filter>
            </defs>

            {/* 1. Curved Drop Shadow Layer */}
            <path 
              d="M0,40 C300,40 500,120 720,120 C940,120 1140,40 1440,40 L1440,160 L0,160 Z" 
              fill="#f8fafc" 
              filter="url(#hero-curve-shadow)"
            />

            {/* 2. Main White/Slate-50 Solid Fill Layer */}
            <path 
              d="M0,40 C300,40 500,120 720,120 C940,120 1140,40 1440,40 L1440,160 L0,160 Z" 
              fill="#f8fafc" 
            />

            {/* 3. Symmetrical 3px White Highlight along the top edge of the curve */}
            <path 
              d="M0,40 C300,40 500,120 720,120 C940,120 1140,40 1440,40" 
              fill="none" 
              stroke="#ffffff" 
              strokeWidth="3.5" 
              strokeLinecap="round"
            />
          </svg>
        </div>
      </section>

      {/* 4. ABOUT & MULTI-IMAGE COLLAGE SECTION */}
      <section id="about" className="py-12 md:py-16 bg-slate-50 relative">
        <div className="container mx-auto px-6 max-w-[1440px]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <motion.div
            variants={fadeLeft} initial="hidden" whileInView="visible" viewport={VP}
            className="lg:col-span-6"
          >
              <span className="text-xs font-semibold text-cyan-600 uppercase tracking-widest block mb-4">
                ← ABOUT US →
              </span>
              <h2 className="text-3xl sm:text-4xl font-normal text-slate-900 leading-tight mb-6">
                Reliable Cleaning & Repairs For A <br />
                <span className="text-cyan-600">Connected Home</span>
              </h2>
              <p className="text-slate-500 mb-8 leading-relaxed text-sm sm:text-base">
                From fast local emergency fixes to full-house appliance setups, Doormeets standardizes on-site technical repairs. We handle the hard details of parts, scheduling, and warranty so you can rest easy.
              </p>
 
              {/* Feature Items List */}
              <div className="space-y-6">
                {[
                  {
                    title: "Verified Xperts",
                    desc: "Serving Indore with trusted, background-checked professionals.",
                    icon: <FaUser className="text-cyan-600" />
                  },
                  {
                    title: "Real-time Tracking",
                    desc: "Track your technicians live on the map as they travel to you.",
                    icon: <FaMapMarkerAlt className="text-cyan-600" />
                  },
                  {
                    title: "24/7 Dedicated Support",
                    desc: "Our friendly support team is always here to help you.",
                    icon: <FaClock className="text-cyan-600" />
                  }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-full bg-white border border-cyan-500/20 flex items-center justify-center shadow-sm flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 mb-0.5">{item.title}</h4>
                      <p className="text-xs sm:text-sm text-slate-500 leading-normal">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
 
              <Link
                to="/user"
                className="inline-flex items-center gap-3 mt-10 px-7 py-3.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition-all group"
              >
                Learn More About Us 
                <span className="w-6 h-6 rounded-full bg-slate-950/20 flex items-center justify-center text-white transition-transform group-hover:translate-x-1">
                  <FaArrowRight className="text-[10px]" />
                </span>
              </Link>
          </motion.div>

          <motion.div
            variants={fadeRight} initial="hidden" whileInView="visible" viewport={VP}
            className="lg:col-span-6 relative w-full min-h-[520px] sm:min-h-[580px] pl-6 md:pl-12"
          >
              
              {/* Card 1 - Main Portrait Image (z-index: 1 base layer) */}
              <div className="absolute top-0 left-[6%] w-[300px] max-w-[50%] aspect-[300/360] rounded-[22px] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.12)] border-[1.5px] border-white/80 bg-slate-200 z-0">
                <img 
                  src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400" 
                  alt="Professional Cleaner" 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Card 2 - Smaller Portrait Image (z-index: 2 middle layer, overlaps Card 1) */}
              <div className="absolute top-[70px] right-[40px] w-[250px] max-w-[44%] aspect-[250/360] rounded-[22px] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.12)] border-[1.5px] border-white/80 bg-slate-200 -translate-x-[50px] z-10">
                <img 
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400" 
                  alt="Modern Luxury Home" 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Card 3 - Large Square Image (z-index: 3 top image layer) */}
              <div className="absolute bottom-[10%] -left-[2%] w-[270px] max-w-[52%] aspect-square rounded-[22px] overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.12)] border-[1.5px] border-white/80 bg-slate-200 z-30">
                <img 
                  src="https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&q=80&w=400" 
                  alt="Vacuum Cleaning Team" 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Statistics Card (z-index: 2 layer, sits behind Card 3 but in front of Card 2) */}
              <div className="absolute bottom-[14%] left-[38%] w-[220px] max-w-[44%] bg-white p-5 rounded-[22px] shadow-[0_25px_60px_rgba(0,0,0,0.12)] border border-slate-100/50 flex flex-col items-center justify-center text-center min-h-[100px] z-20">
                <h3 className="text-3xl sm:text-4xl font-normal text-cyan-600">98%</h3>
                <p className="text-[11px] sm:text-xs font-bold text-slate-800 mt-1.5 leading-tight">
                  Customer Satisfaction
                </p>
              </div>

            </motion.div>

          </div>
        </div>
      </section>

      {/* 5. SERVICES SECTION */}
      <section id="services" className="py-12 md:py-16 bg-white">
        <div className="container mx-auto px-6 max-w-[1440px] text-center">
          <motion.span variants={fadeUp} initial="hidden" whileInView="visible" viewport={VP} className="text-xs font-semibold text-cyan-600 uppercase tracking-widest block mb-4">
            ← OUR SERVICES →
          </motion.span>
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={VP} className="text-3xl sm:text-4xl font-normal text-slate-900 leading-tight mb-16">
            End-to-End <span className="text-cyan-600">Home Services</span> <br />Tailored to You
          </motion.h2>

          <motion.div
            variants={staggerContainer} initial="hidden" whileInView="visible" viewport={VP}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              {
                title: "Appliance Repair",
                desc: "AC service, Microwave fixing, RO purifiers, and Refrigerator diagnostics.",
                icon: <FaTools className="text-2xl text-cyan-600" />,
                link: "/user"
              },
              {
                title: "Home Cleaning",
                desc: "Deep clean, sofa washing, kitchen disinfecting, and bathroom sanitizing.",
                icon: <FaBroom className="text-2xl text-cyan-600" />,
                link: "/user"
              },
              {
                title: "Electrical & Handyman",
                desc: "Switchboard mounting, short circuit fix, geyser repair, and fan fitting.",
                icon: <FaBolt className="text-2xl text-cyan-600" />,
                link: "/user"
              },
              {
                title: "Wall Painting",
                desc: "Consultation, texture designs, waterproof coats, and color updates.",
                icon: <FaPaintRoller className="text-2xl text-cyan-600" />,
                link: "/user"
              }
            ].map((service, index) => (
              <motion.div 
                key={index}
                variants={staggerItem}
                className="group bg-slate-50 hover:bg-white border border-slate-100 hover:border-cyan-200 p-8 rounded-3xl text-center transition-all duration-300 hover:shadow-xl flex flex-col items-center justify-center min-h-[250px]"
              >
                <div className="w-14 h-14 rounded-full bg-white border border-cyan-500/20 flex items-center justify-center shadow-sm mb-6 transition-colors group-hover:bg-cyan-50 flex-shrink-0">
                  {service.icon}
                </div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-3">{service.title}</h4>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{service.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-16">
            <Link
              to="/user"
              className="px-8 py-3.5 bg-slate-900 hover:bg-cyan-600 text-white rounded-xl font-bold text-sm shadow-md transition-colors"
            >
              View All Services
            </Link>
          </div>
        </div>
      </section>

      {/* 6. STATISTICS SECTION (Mockup-aligned White Background) */}
      <section id="stats" className="py-12 bg-white relative overflow-hidden">
        <div className="container mx-auto px-6 max-w-[1440px] relative z-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Texts */}
            <motion.div variants={fadeLeft} initial="hidden" whileInView="visible" viewport={VP} className="lg:col-span-5 text-center lg:text-left">
              <span className="text-xs font-semibold text-cyan-600 uppercase tracking-widest block mb-4">
                ← WHY CHOOSE US →
              </span>
              <h2 className="text-3xl sm:text-4xl font-normal text-slate-900 leading-tight mb-6">
                We Deliver More <br />Than Just <span className="text-cyan-600">Repairs</span>
              </h2>
              <p className="text-slate-500 mb-8 leading-relaxed text-sm sm:text-base">
                Doormeets matches the speed of logistics with the precision of experienced engineers. We standardize the entire home service workflow, giving you clear tracking and reliable billing.
              </p>
              
              <ul className="space-y-3 inline-block text-left">
                {["Affordable Pricing", "On-Time Delivery", "Advanced Technology", "Dedicated Support"].map((li, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-slate-600 font-semibold">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-[10px] text-cyan-600"><FaCheck /></span>
                    {li}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Right Side Stats Container */}
            <motion.div variants={fadeRight} initial="hidden" whileInView="visible" viewport={VP} className="lg:col-span-7">
              <div className="relative rounded-[32px] overflow-hidden bg-slate-900 border border-slate-800 p-10 sm:p-12 shadow-md min-h-[380px] flex items-center">
                {/* Swapping Background Images with Crossfade */}
                {serviceImages.map((img, idx) => (
                  <div
                    key={idx}
                    style={{ backgroundImage: `url(${img})` }}
                    className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
                      currentStatsImage === idx ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                ))}
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] z-0"></div>

                {/* 2x2 Grid Content */}
                <div className="relative z-10 w-full grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-10">
                  {[
                    { value: "250+", label: "Verified Partners", icon: <FaHandshake className="text-lg text-cyan-400" /> },
                    { value: "12k+", label: "Bookings Completed", icon: <FaCalendarCheck className="text-lg text-cyan-400" /> },
                    { value: "1.5k+", label: "Genuine Parts", icon: <FaTools className="text-lg text-cyan-400" /> },
                    { value: "99%", label: "Satisfaction Rate", icon: <FaAward className="text-lg text-cyan-400" /> }
                  ].map((stat, idx) => (
                    <div key={idx} className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 shadow-inner">
                        {stat.icon}
                      </div>
                      <div>
                        <h3 className="text-2xl sm:text-3xl font-normal text-white">{stat.value}</h3>
                        <p className="text-xs sm:text-sm text-slate-400 font-medium mt-0.5">{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* 7. OUR WORK PROCESS (Timeline Process Section matching mockup) */}
      <section id="process" className="py-12 md:py-16 bg-slate-50 border-t border-slate-100">
        <div className="container mx-auto px-6 max-w-[1440px]">
          
          <motion.div className="text-center mb-20" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={VP}>
            <motion.span variants={fadeUp} className="text-xs font-semibold text-cyan-600 uppercase tracking-widest block mb-4">
              ← OUR WORK PROCESS →
            </motion.span>
            <h2 className="text-3xl sm:text-4xl font-normal text-slate-900 leading-tight">
              How We Deliver <span className="text-cyan-600">Excellence</span>
            </h2>
          </motion.div>

          <div className="relative overflow-hidden md:overflow-visible">
            <motion.div 
              variants={timelineContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: false, amount: 0.25 }}
              className="flex flex-col md:flex-row items-center md:items-start justify-between relative z-10 gap-12 md:gap-0"
            >
              {[
                {
                  title: "Request a Quote",
                  desc: "Tell us your repair or cleaning requirements and get a quick quote.",
                  icon: <FaClipboardList className="text-2xl text-white" />
                },
                {
                  title: "Plan & Schedule",
                  desc: "We assign the best certified local specialist for your preferred time.",
                  icon: <FaCalendarAlt className="text-2xl text-white" />
                },
                {
                  title: "Service with Care",
                  desc: "Our professionals execute the job with top-tier precision and care.",
                  icon: <FaHammer className="text-2xl text-white" />
                },
                {
                  title: "Completed Successfully",
                  desc: "Your home service is finished on time, every time, with complete warranty.",
                  icon: <FaCheckDouble className="text-2xl text-white" />
                }
              ].map((item, idx, arr) => (
                <React.Fragment key={idx}>
                  {/* Step block */}
                  <motion.div 
                    variants={timelineItemVariants}
                    className="flex flex-col items-center text-center group w-full md:w-[20%]"
                  >
                    {/* Circle Gradient Icon Badge */}
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-700 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-600/20 group-hover:scale-105 transition-transform duration-300 z-10 relative mb-6">
                      {item.icon}
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-slate-900 mb-2">{item.title}</h4>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-[220px] mx-auto">{item.desc}</p>
                  </motion.div>

                  {/* Connecting Line Segment (Desktop Only) */}
                  {idx < arr.length - 1 && (
                    <motion.div 
                      variants={timelineLineVariants}
                      style={{ originX: 0 }}
                      className="hidden md:block h-[1.5px] flex-grow bg-gradient-to-r from-cyan-600/30 to-cyan-600/10 self-start mt-10"
                    />
                  )}
                </React.Fragment>
              ))}
            </motion.div>
          </div>

        </div>
      </section>

      {/* 8. TESTIMONIALS SECTION */}
      <section className="py-12 md:py-16 bg-white border-t border-slate-100">
        <div className="container mx-auto px-6 max-w-[1440px] text-center">
          <span className="text-xs font-semibold text-cyan-600 uppercase tracking-widest block mb-4">
            ← CLIENT TESTIMONIALS →
          </span>
          <h2 className="text-3xl sm:text-4xl font-normal text-slate-900 mb-6">
            Loved by <span className="text-cyan-600">Clients</span>
          </h2>
          <div className="flex justify-center gap-1 text-amber-400 text-lg mb-16">
            <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
          </div>

          {/* Infinite Sliding Testimonials Marquee */}
          <div className="relative overflow-hidden w-full py-4 mb-8">
            {/* Fade overlays on sides for a premium look */}
            <div className="absolute inset-y-0 left-0 w-16 sm:w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
            <div className="absolute inset-y-0 right-0 w-16 sm:w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

            <style>{`
              @keyframes marquee {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .animate-marquee-track {
                display: flex;
                width: max-content;
                animation: marquee 25s linear infinite;
              }
              .animate-marquee-track:hover {
                animation-play-state: paused;
              }
            `}</style>

            <div className="animate-marquee-track gap-8">
              {[
                {
                  text: "Highly professional service! The AC repair was completed on time using authentic brand parts, and the pricing was very transparent.",
                  author: "Amit Sharma",
                  location: "Vijay Nagar"
                },
                {
                  text: "Integrating Doormeets has transformed how we distribute jobs. The live map tracking makes coordination extremely simple.",
                  author: "Pooja Patel",
                  location: "Bhawarkua"
                },
                {
                  text: "Vetted experts and premium support. The doorstep billing and instant quotes are extremely convenient.",
                  author: "Sanjay Verma",
                  location: "Rajwada"
                },
                // Repeat cards to achieve seamless infinite loop
                {
                  text: "Highly professional service! The AC repair was completed on time using authentic brand parts, and the pricing was very transparent.",
                  author: "Amit Sharma",
                  location: "Vijay Nagar"
                },
                {
                  text: "Integrating Doormeets has transformed how we distribute jobs. The live map tracking makes coordination extremely simple.",
                  author: "Pooja Patel",
                  location: "Bhawarkua"
                },
                {
                  text: "Vetted experts and premium support. The doorstep billing and instant quotes are extremely convenient.",
                  author: "Sanjay Verma",
                  location: "Rajwada"
                }
              ].map((t, idx) => (
                <div 
                  key={idx}
                  className="w-[300px] sm:w-[380px] flex-shrink-0 bg-slate-50 hover:bg-white border border-slate-100 hover:border-cyan-100 hover:shadow-xl transition-all p-8 rounded-3xl text-left relative"
                >
                  <FaQuoteLeft className="text-cyan-200/40 text-5xl absolute top-6 left-6" />
                  <p className="text-slate-600 leading-relaxed italic mb-8 relative z-10 text-sm">
                    "{t.text}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-600 text-white font-extrabold text-sm flex items-center justify-center uppercase shadow-sm">
                      {t.author.charAt(0)}
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">{t.author}</h5>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">{t.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Statistics Row (Mockup aligned under Testimonials) */}
          <div className="mt-20 p-8 sm:p-10 bg-slate-50/70 rounded-[32px] border border-slate-100/80 grid grid-cols-2 md:grid-cols-4 gap-8 shadow-sm">
            {[
              { value: "250+", label: "Verified Partners", icon: <FaHandshake className="text-cyan-400 text-sm" /> },
              { value: "12k+", label: "Bookings Completed", icon: <FaCalendarCheck className="text-cyan-400 text-sm" /> },
              { value: "2.5k+", label: "Satisfied Customers", icon: <FaUser className="text-cyan-400 text-sm" /> },
              { value: "99%", label: "Satisfaction Rate", icon: <FaAward className="text-cyan-400 text-sm" /> }
            ].map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center mb-3 shadow-md">
                  {stat.icon}
                </div>
                <h4 className="text-2xl sm:text-3xl font-normal text-slate-900 leading-none">{stat.value}</h4>
                <p className="text-[10px] sm:text-xs text-slate-400 font-semibold mt-2 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. OUR TEAM SECTION (Mockup aligned) */}
      <section id="team" className="py-12 md:py-16 bg-slate-50 border-t border-slate-100">
        <div className="container mx-auto px-6 max-w-[1440px]">
          
          <div className="text-center mb-16">
            <span className="text-xs font-semibold text-cyan-600 uppercase tracking-widest block mb-4">
              ← OUR TEAM →
            </span>
            <h2 className="text-3xl sm:text-4xl font-normal text-slate-900 leading-tight">
              Meet the Experts Behind <span className="text-cyan-600">Our Success</span>
            </h2>
          </div>

          <motion.div 
            variants={staggerContainer} 
            initial="hidden" 
            whileInView="visible" 
            viewport={VP} 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              {
                name: "Michael Brown",
                role: "CEO & Founder",
                image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300"
              },
              {
                name: "Sophia Miller",
                role: "Operations Manager",
                image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300"
              },
              {
                name: "David Wilson",
                role: "Service Manager",
                image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=300"
              },
              {
                name: "Emma Taylor",
                role: "Customer Support",
                image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=300"
              }
            ].map((member, idx) => (
              <motion.div key={idx} variants={staggerItem} className="group bg-white border border-slate-100 hover:border-cyan-200 p-5 rounded-3xl text-center transition-all duration-300 hover:shadow-xl">
                <div className="overflow-hidden rounded-2xl mb-4 aspect-[4/5]">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1">{member.name}</h4>
                <p className="text-xs text-slate-500 mb-4">{member.role}</p>
                <div className="flex justify-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-cyan-600/10 hover:bg-cyan-600/20 flex items-center justify-center text-cyan-600 transition-colors cursor-pointer">
                    <FaLinkedin className="text-xs" />
                  </span>
                  <span className="w-8 h-8 rounded-full bg-cyan-600/10 hover:bg-cyan-600/20 flex items-center justify-center text-cyan-600 transition-colors cursor-pointer">
                    <FaTwitter className="text-xs" />
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </section>

      {/* 10. FAQ ACCORDION SECTION (Mockup aligned) */}
      <section id="faqs" className="py-12 md:py-16 bg-white border-t border-slate-100">
        <div className="container mx-auto px-6 max-w-[1440px]">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-stretch">
            
            {/* Left Column - Badge, Heading and Contact Card */}
            <motion.div 
              variants={fadeLeft} 
              initial="hidden" 
              whileInView="visible" 
              viewport={VP}
              className="lg:col-span-5 text-center lg:text-left flex flex-col justify-between h-full"
            >
              <div className="mb-6 lg:mb-0">
                <span className="text-xs font-semibold text-cyan-600 uppercase tracking-widest block mb-4">
                  ← FAQS →
                </span>
                <h2 className="text-3xl sm:text-4xl font-normal text-slate-900 leading-tight mb-4">
                  Frequently Asked <br />
                  <span className="text-cyan-600">Questions</span>
                </h2>
              </div>

              {/* Support Image Card with CTA */}
              <div className="relative rounded-[32px] overflow-hidden shadow-xl w-full mx-auto lg:mx-0 flex flex-col flex-grow lg:mt-6">
                <img 
                  src="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80&w=600" 
                  alt="Doormeets Support Vehicle" 
                  className="w-full h-48 lg:h-0 flex-grow object-cover"
                />
                
                {/* Overlay Green/Teal Phone Card */}
                <div className="bg-gradient-to-r from-cyan-400 to-cyan-500 py-2 px-4 flex items-center gap-3 text-white">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-cyan-600 flex-shrink-0 shadow-md">
                    <FaPhoneAlt className="text-xs" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-semibold text-white/90">Have More Questions?</p>
                    <p className="text-xs font-bold tracking-wide mt-0.5">+91 74470 52361</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Column - Accordion Items */}
            <motion.div 
              variants={fadeRight} 
              initial="hidden" 
              whileInView="visible" 
              viewport={VP}
              className="lg:col-span-7 space-y-4"
            >
              {[
                {
                  q: "How can I book a service?",
                  a: "You can easily book a service by logging into your portal, selecting your desired service (Appliance Repair, Home Cleaning, etc.), choosing a convenient time slot, and confirming the booking instantly."
                },
                {
                  q: "What services do you offer?",
                  a: "We offer end-to-end home solutions including professional appliance repair, deep home cleaning, electrical repairs, handyman tasks, and expert wall painting services tailored to Indore homes."
                },
                {
                  q: "Are the service providers verified?",
                  a: "Absolutely. Every professional on Doormeets undergoes a strict onboarding process including background checks, identity verification, and hands-on skill training to ensure your safety and quality of service."
                },
                {
                  q: "How long does a service booking take?",
                  a: "Most repair and technician tasks are completed within 1 to 2 hours of arrival. Deep cleaning and painting schedules vary depending on the area size and requirements, which will be estimated upfront."
                },
                {
                  q: "How can I get a quote?",
                  a: "Upfront pricing is visible when you select your service details inside our platform. For customized packages or complex repairs, our team will provide a transparent quote before any work starts."
                }
              ].map((faq, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="group bg-slate-50 hover:bg-white border border-slate-100 hover:border-cyan-200 p-5 rounded-2xl cursor-pointer transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <div className="flex justify-between items-center gap-4">
                    <h4 className="text-sm sm:text-base font-bold text-slate-800 group-hover:text-cyan-600 transition-colors">
                      {faq.q}
                    </h4>
                    <div className="w-8 h-8 rounded-full bg-cyan-600/10 flex items-center justify-center text-cyan-600 transition-colors group-hover:bg-cyan-600 group-hover:text-white flex-shrink-0">
                      <FaChevronDown className={`text-xs transform transition-transform duration-300 ${activeFaq === idx ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                  
                  {/* Expandable Answer */}
                  <div className={`overflow-hidden transition-all duration-300 ${activeFaq === idx ? 'max-h-[200px] mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>

          </div>

        </div>
      </section>

      {/* 11. DOWNLOAD APP CTA BANNER */}
      <section className="py-12 bg-white px-6">
        <div className="container mx-auto max-w-[1440px]">
          <div className="bg-slate-950 text-white rounded-[40px] p-8 md:p-16 relative overflow-hidden flex flex-col md:flex-row items-center justify-between border border-slate-800 shadow-2xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
            
            <div className="max-w-xl text-center md:text-left mb-10 md:mb-0 relative z-10">
              <h2 className="text-2xl sm:text-4xl font-normal text-white leading-tight mb-4">
                Repair is just <br />a Single Tap Away!
              </h2>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-sm">
                Get the official Doormeets Mobile Application for android and track repairs live.
              </p>
              <a 
                href={PLAY_STORE_URL} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-white hover:bg-cyan-600 text-slate-950 hover:text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95"
              >
                <FaGooglePlay className="text-lg" /> Get on Play Store
              </a>
            </div>

            <div 
              onClick={handleCardSwap}
              className="relative h-[280px] md:h-[380px] w-full md:w-3/5 flex items-center justify-center mt-12 md:mt-0 cursor-pointer select-none group"
            >
              {[
                { id: 0, src: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400", alt: "Doormeets Electrician Front" },
                { id: 1, src: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400", alt: "Doormeets Cleaner Middle" },
                { id: 2, src: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&q=80&w=400", alt: "Doormeets Painter Back" }
              ].map((card) => {
                const position = cardOrder.indexOf(card.id);
                let styleClass = "";
                let zIndex = "";
                if (position === 0) {
                  styleClass = "translate-x-0 translate-y-0 rotate-2 opacity-100 scale-100 group-hover:scale-105";
                  zIndex = "z-20";
                } else if (position === 1) {
                  styleClass = "-translate-x-4 -translate-y-3 -rotate-3 opacity-70 scale-95";
                  zIndex = "z-10";
                } else {
                  styleClass = "-translate-x-8 -translate-y-6 -rotate-6 opacity-40 scale-90";
                  zIndex = "z-0";
                }

                return (
                  <img 
                    key={card.id}
                    src={card.src} 
                    alt={card.alt} 
                    className={`absolute h-[90%] aspect-[4/3] object-cover rounded-2xl shadow-2xl transition-all duration-500 transform ${styleClass} ${zIndex}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 10. DYNAMIC FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-10 px-6 border-t border-slate-900 relative overflow-hidden">
        <div className="container mx-auto max-w-[1440px] relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-12 border-b border-slate-900 pb-12">
            
            {/* Col 1 */}
            <div>
              <Link to="/" className="flex items-center gap-2 mb-6">
                <span className="text-2xl font-normal tracking-tight text-white bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Doormeets
                </span>
              </Link>
              <p className="text-sm leading-relaxed text-slate-500 mb-6">
                Standardized on-site repairs, genuine certified parts, and map-guided technicians across Indore.
              </p>
              <p className="text-xs text-slate-600">
                Proudly Indore, India 🇮🇳
              </p>
            </div>

            {/* Col 2 */}
            <div>
              <h5 className="font-bold text-white text-sm mb-6 uppercase tracking-wider">Services</h5>
              <ul className="space-y-3 text-sm">
                <li><Link to="/user" className="hover:text-cyan-400 transition-colors">AC repair</Link></li>
                <li><Link to="/user" className="hover:text-cyan-400 transition-colors">Washing Machine</Link></li>
                <li><Link to="/user" className="hover:text-cyan-400 transition-colors">Deep Cleaning</Link></li>
                <li><Link to="/user" className="hover:text-cyan-400 transition-colors">Wall Painting</Link></li>
              </ul>
            </div>

            {/* Col 3 */}
            <div>
              <h5 className="font-bold text-white text-sm mb-6 uppercase tracking-wider">Contact</h5>
              <ul className="space-y-3 text-sm text-slate-500">
                <li>Support: <a href={`mailto:${settings?.supportEmail || 'support@doormeets.com'}`} className="text-slate-400 hover:text-cyan-400 transition-colors">{settings?.supportEmail || 'support@doormeets.com'}</a></li>
                <li>Phone: <a href={`tel:${settings?.supportPhone || '+919876543210'}`} className="text-slate-400 hover:text-cyan-400 transition-colors">{settings?.supportPhone || '+91 98765 43210'}</a></li>
                <li className="text-xs leading-normal">
                  {settings?.companyAddress ? `${settings.companyAddress}, ${settings.companyCity}` : 'Indore, Madhya Pradesh, India'}
                </li>
              </ul>
            </div>

            {/* Col 4 */}
            <div>
              <h5 className="font-bold text-white text-sm mb-6 uppercase tracking-wider">Android App</h5>
              <p className="text-xs text-slate-500 mb-4">Download Doormeets client utility on Google Play Store.</p>
              <a 
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs font-bold hover:bg-cyan-600 transition-all flex items-center justify-center gap-2"
              >
                <FaGooglePlay size={14} /> Download App
              </a>
            </div>

          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-600">
            <p>© {new Date().getFullYear()} {settings?.companyName || 'Doormeets'}. All rights reserved.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-slate-500 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-500 transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default LandingPage;
