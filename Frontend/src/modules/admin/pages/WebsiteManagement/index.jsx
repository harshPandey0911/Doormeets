import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FiImage, FiInfo, FiLayers, FiHelpCircle, 
  FiMail, FiBookOpen, FiSettings, FiPlus, 
  FiTrash2, FiEdit3, FiEye, FiCheck, FiSave,
  FiGlobe, FiShare2, FiGrid, FiEyeOff
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const WebsiteManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab from route
  const getActiveTabFromPath = (path) => {
    if (path.includes('/hero')) return 'hero';
    if (path.includes('/about')) return 'about';
    if (path.includes('/services')) return 'services';
    if (path.includes('/faqs')) return 'faqs';
    if (path.includes('/blogs')) return 'blogs';
    if (path.includes('/inquiries')) return 'inquiries';
    if (path.includes('/seo')) return 'seo';
    return 'hero';
  };

  const activeTab = getActiveTabFromPath(location.pathname);

  const handleTabChange = (tab) => {
    navigate(`/admin/website/${tab}`);
  };

  // Mock data / LocalStorage states for mock administration
  const [heroData, setHeroData] = useState(() => {
    const saved = localStorage.getItem('web_hero_data');
    return saved ? JSON.parse(saved) : {
      title: 'Expert Home Services, At Your Doorstep',
      subtitle: 'Book top-rated professionals for haircut, salon, cleaning, plumbing, painting and more.',
      ctaText: 'Explore Services',
      ctaLink: '#services',
      promoCode: 'FIRST50',
      bannerImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80',
      bgColor: '#0f172a',
      accentColor: '#3b82f6',
      textColor: '#ffffff'
    };
  });

  const [aboutData, setAboutData] = useState(() => {
    const saved = localStorage.getItem('web_about_data');
    return saved ? JSON.parse(saved) : {
      mainText: 'Doormeets is India\'s leading on-demand home service marketplace, connecting thousands of customers with certified, high-quality professionals directly at home. We ensure quality, safety, and transparent pricing in every booking.',
      yearsOfOperation: '5+',
      completedJobs: '25,000+',
      happyCustomers: '12,000+',
      verifiedWorkers: '300+',
      coreValues: [
        { id: 1, title: 'Uncompromising Quality', desc: 'Every service is vetted and backed by our quality guarantee.' },
        { id: 2, title: 'Safe & Verified', desc: 'Background checked & police-verified professionals only.' },
        { id: 3, title: 'Transparent Pricing', desc: 'No hidden charges. Know what you pay before booking.' }
      ]
    };
  });

  const [marketingServices, setMarketingServices] = useState(() => {
    const saved = localStorage.getItem('web_mkt_services');
    return saved ? JSON.parse(saved) : [
      { id: 1, name: 'Men\'s Haircut & Grooming', category: 'Salon', price: '₹79', rating: '4.8', image: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&q=80' },
      { id: 2, name: 'Deep Home Cleaning', category: 'Cleaning', price: '₹999', rating: '4.9', image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=300&q=80' },
      { id: 3, name: 'Professional Wall Painting', category: 'Painting', price: '₹4,999', rating: '4.7', image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=300&q=80' }
    ];
  });

  const [faqs, setFaqs] = useState(() => {
    const saved = localStorage.getItem('web_faqs');
    return saved ? JSON.parse(saved) : [
      { id: 1, question: 'How do you verify your professionals?', answer: 'All service providers undergo standard background checks, government ID collection, and professional capability evaluations before onboarding.' },
      { id: 2, question: 'What is your refund policy?', answer: 'If a service is not completed up to your standards or cancelled by the provider, a full refund will be processed directly to your bank account within 3-5 working days.' }
    ];
  });

  const [blogs, setBlogs] = useState(() => {
    const saved = localStorage.getItem('web_blogs');
    return saved ? JSON.parse(saved) : [
      { id: 1, title: '5 Simple Grooming Tips for Men this Summer', author: 'Vikram Singh', date: 'June 28, 2026', readTime: '4 min read', category: 'Grooming', likes: 124 },
      { id: 2, title: 'How to Choose the Right Wall Colors for Small Rooms', author: 'Neha Sharma', date: 'July 02, 2026', readTime: '6 min read', category: 'Painting', likes: 98 }
    ];
  });

  const [inquiries, setInquiries] = useState(() => {
    const saved = localStorage.getItem('web_inquiries');
    return saved ? JSON.parse(saved) : [
      { id: 'INQ-102', name: 'Rajesh Malhotra', email: 'rajesh@gmail.com', phone: '9876543210', message: 'Looking for a commercial cleaning contract for a 3-floor office in Delhi NCR. Please contact with pricing.', date: '2026-07-05', status: 'new' },
      { id: 'INQ-101', name: 'Priya Verma', email: 'priya@yahoo.com', phone: '9988776655', message: 'Interested in becoming a vendor partner for beauty services. Do you charge commission on packages?', date: '2026-07-03', status: 'resolved' }
    ];
  });

  const [seoSettings, setSeoSettings] = useState(() => {
    const saved = localStorage.getItem('web_seo');
    return saved ? JSON.parse(saved) : {
      siteTitle: 'Doormeets - On-Demand Home Services & Salon',
      metaDescription: 'Book salon, haircuts, home cleaning, electrical repair, appliance service and painting at home from Doormeets. Verified experts, transparent pricing.',
      metaKeywords: 'home services, salon at home, mens haircut, wall painting, deep cleaning, electrician near me',
      logoUrl: 'https://cdn-icons-png.flaticon.com/512/2874/2874802.png',
      contactPhone: '+91 99999 88888',
      contactEmail: 'support@doormeets.com',
      instagramUrl: 'https://instagram.com/doormeets',
      facebookUrl: 'https://facebook.com/doormeets'
    };
  });

  // Save triggers
  const handleSaveHero = () => {
    localStorage.setItem('web_hero_data', JSON.stringify(heroData));
    toast.success('Hero Section configs saved successfully!');
  };

  const handleSaveAbout = () => {
    localStorage.setItem('web_about_data', JSON.stringify(aboutData));
    toast.success('About Us content saved successfully!');
  };

  const handleSaveSEO = () => {
    localStorage.setItem('web_seo', JSON.stringify(seoSettings));
    toast.success('SEO & Global settings updated!');
  };

  // State for Service Form Modal
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [currentService, setCurrentService] = useState({ name: '', category: '', price: '', rating: '5.0', image: '' });
  const [editingServiceId, setEditingServiceId] = useState(null);

  const handleAddOrEditService = () => {
    if (!currentService.name || !currentService.price) {
      toast.error('Please enter name and pricing');
      return;
    }
    if (editingServiceId) {
      const updated = marketingServices.map(s => s.id === editingServiceId ? { ...s, ...currentService } : s);
      setMarketingServices(updated);
      localStorage.setItem('web_mkt_services', JSON.stringify(updated));
      toast.success('Service updated');
    } else {
      const newService = { ...currentService, id: Date.now() };
      const updated = [...marketingServices, newService];
      setMarketingServices(updated);
      localStorage.setItem('web_mkt_services', JSON.stringify(updated));
      toast.success('Service added');
    }
    setIsServiceModalOpen(false);
    setCurrentService({ name: '', category: '', price: '', rating: '5.0', image: '' });
    setEditingServiceId(null);
  };

  const handleDeleteService = (id) => {
    const updated = marketingServices.filter(s => s.id !== id);
    setMarketingServices(updated);
    localStorage.setItem('web_mkt_services', JSON.stringify(updated));
    toast.success('Service removed');
  };

  // State for FAQ Modal
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [currentFaq, setCurrentFaq] = useState({ question: '', answer: '' });
  const [editingFaqId, setEditingFaqId] = useState(null);

  const handleAddOrEditFaq = () => {
    if (!currentFaq.question || !currentFaq.answer) {
      toast.error('Please enter question and answer');
      return;
    }
    if (editingFaqId) {
      const updated = faqs.map(f => f.id === editingFaqId ? { ...f, ...currentFaq } : f);
      setFaqs(updated);
      localStorage.setItem('web_faqs', JSON.stringify(updated));
      toast.success('FAQ updated');
    } else {
      const newFaq = { ...currentFaq, id: Date.now() };
      const updated = [...faqs, newFaq];
      setFaqs(updated);
      localStorage.setItem('web_faqs', JSON.stringify(updated));
      toast.success('FAQ added');
    }
    setIsFaqModalOpen(false);
    setCurrentFaq({ question: '', answer: '' });
    setEditingFaqId(null);
  };

  const handleDeleteFaq = (id) => {
    const updated = faqs.filter(f => f.id !== id);
    setFaqs(updated);
    localStorage.setItem('web_faqs', JSON.stringify(updated));
    toast.success('FAQ removed');
  };

  // State for Blog Modal
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [currentBlog, setCurrentBlog] = useState({ title: '', author: '', date: '', readTime: '', category: '', content: '' });
  const [editingBlogId, setEditingBlogId] = useState(null);

  const handleAddOrEditBlog = () => {
    if (!currentBlog.title || !currentBlog.category) {
      toast.error('Title and Category are required');
      return;
    }
    const dateStr = currentBlog.date || new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    if (editingBlogId) {
      const updated = blogs.map(b => b.id === editingBlogId ? { ...b, ...currentBlog, date: dateStr } : b);
      setBlogs(updated);
      localStorage.setItem('web_blogs', JSON.stringify(updated));
      toast.success('Article updated');
    } else {
      const newBlog = { ...currentBlog, id: Date.now(), date: dateStr, likes: 0 };
      const updated = [...blogs, newBlog];
      setBlogs(updated);
      localStorage.setItem('web_blogs', JSON.stringify(updated));
      toast.success('Article published');
    }
    setIsBlogModalOpen(false);
    setCurrentBlog({ title: '', author: '', date: '', readTime: '', category: '', content: '' });
    setEditingBlogId(null);
  };

  const handleDeleteBlog = (id) => {
    const updated = blogs.filter(b => b.id !== id);
    setBlogs(updated);
    localStorage.setItem('web_blogs', JSON.stringify(updated));
    toast.success('Article removed');
  };

  // Toggle Inquiry Status
  const handleToggleInquiryStatus = (id) => {
    const updated = inquiries.map(inq => {
      if (inq.id === id) {
        const nextStatus = inq.status === 'new' ? 'resolved' : 'new';
        toast.success(`Inquiry marked as ${nextStatus}`);
        return { ...inq, status: nextStatus };
      }
      return inq;
    });
    setInquiries(updated);
    localStorage.setItem('web_inquiries', JSON.stringify(updated));
  };

  // Tab Header Configuration
  const tabsList = [
    { id: 'hero', label: 'Hero Banner', icon: FiImage },
    { id: 'about', label: 'About Page', icon: FiInfo },
    { id: 'services', label: 'Services Showcase', icon: FiLayers },
    { id: 'faqs', label: 'FAQ Manager', icon: FiHelpCircle },
    { id: 'blogs', label: 'Blog Manager', icon: FiBookOpen },
    { id: 'inquiries', label: 'Inquiries', icon: FiMail },
    { id: 'seo', label: 'SEO & Global', icon: FiSettings }
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-full">
      {/* Tabs Navigation (Left Column) */}
      <div className="w-full lg:w-64 shrink-0 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-4 scrollbar-none">
        {tabsList.map(tab => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs whitespace-nowrap transition-all uppercase tracking-wider ${
                isActive 
                  ? 'bg-primary-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Tab Content Panel */}
      <div className="flex-1 bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
        
        {/* HERO BANNER EDIT TAB */}
        {activeTab === 'hero' && (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-lg font-black text-gray-800 uppercase tracking-wide">Homepage Hero Banner Config</h2>
              <p className="text-xs text-gray-500 mt-1">Configure layout, titles, colors and graphics displayed at the top section of the public marketing website.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-1.5">Hero Headline (Main Title)</label>
                  <input 
                    type="text" 
                    value={heroData.title}
                    onChange={(e) => setHeroData({...heroData, title: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-1.5">Hero Subtitle</label>
                  <textarea 
                    value={heroData.subtitle}
                    onChange={(e) => setHeroData({...heroData, subtitle: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-none focus:border-primary-500"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-1.5">CTA Button Text</label>
                    <input 
                      type="text" 
                      value={heroData.ctaText}
                      onChange={(e) => setHeroData({...heroData, ctaText: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-1.5">Promo Code Highlight</label>
                    <input 
                      type="text" 
                      value={heroData.promoCode}
                      onChange={(e) => setHeroData({...heroData, promoCode: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-1.5">Banner Image URL</label>
                  <input 
                    type="text" 
                    value={heroData.bannerImage}
                    onChange={(e) => setHeroData({...heroData, bannerImage: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">BG HEX Color</label>
                    <input 
                      type="color" 
                      value={heroData.bgColor}
                      onChange={(e) => setHeroData({...heroData, bgColor: e.target.value})}
                      className="w-full h-10 rounded-lg cursor-pointer border border-gray-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Accent HEX Color</label>
                    <input 
                      type="color" 
                      value={heroData.accentColor}
                      onChange={(e) => setHeroData({...heroData, accentColor: e.target.value})}
                      className="w-full h-10 rounded-lg cursor-pointer border border-gray-200"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Text HEX Color</label>
                    <input 
                      type="color" 
                      value={heroData.textColor}
                      onChange={(e) => setHeroData({...heroData, textColor: e.target.value})}
                      className="w-full h-10 rounded-lg cursor-pointer border border-gray-200"
                    />
                  </div>
                </div>
              </div>

              {/* LIVE WEBPAGE MINI-PREVIEW CARD */}
              <div className="bg-gray-50 rounded-3xl p-4 border border-dashed border-gray-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-2">
                    <span className="text-[10px] font-bold text-gray-400 tracking-wider flex items-center gap-1 uppercase">
                      <FiEye className="w-3 h-3 text-primary-500" /> Public Website Preview
                    </span>
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  </div>
                  
                  {/* Hero Container Mock */}
                  <div 
                    className="rounded-2xl p-6 shadow-md transition-all relative overflow-hidden"
                    style={{ backgroundColor: heroData.bgColor, color: heroData.textColor }}
                  >
                    <div className="relative z-10 max-w-sm">
                      <span className="bg-white/10 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase border border-white/20" style={{ color: heroData.accentColor }}>
                        🎁 USE CODE: {heroData.promoCode}
                      </span>
                      <h3 className="text-lg font-black mt-2 leading-snug">{heroData.title}</h3>
                      <p className="text-[10px] opacity-75 mt-1.5 leading-relaxed">{heroData.subtitle}</p>
                      
                      <button 
                        className="mt-4 px-4 py-2 rounded-lg text-[10px] font-black tracking-wide uppercase transition-all shadow-md"
                        style={{ backgroundColor: heroData.accentColor, color: '#ffffff' }}
                      >
                        {heroData.ctaText}
                      </button>
                    </div>

                    {/* Image Preview Mock */}
                    {heroData.bannerImage && (
                      <img 
                        src={heroData.bannerImage} 
                        alt="Hero Banner" 
                        className="absolute bottom-0 right-0 w-24 h-24 object-cover rounded-tl-2xl border-t border-l border-white/20 opacity-90"
                      />
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200 flex items-center gap-2">
                  <div className="p-1 rounded bg-yellow-50 text-yellow-600 text-[10px] font-bold border border-yellow-200">
                    NOTE: Colors and banner image will sync in real time on the customer-facing main landing domain.
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button 
                onClick={handleSaveHero}
                className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider active:scale-95 transition-all shadow-md"
              >
                <FiSave className="w-4 h-4" /> Save Hero Section
              </button>
            </div>
          </div>
        )}

        {/* ABOUT PAGE EDIT TAB */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-lg font-black text-gray-800 uppercase tracking-wide">About Us Content Settings</h2>
              <p className="text-xs text-gray-500 mt-1">Manage marketing descriptions, business milestones, stats, and company core values for public trust generation.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-1.5">Main Brand Introduction Paragraph</label>
                <textarea 
                  value={aboutData.mainText}
                  onChange={(e) => setAboutData({...aboutData, mainText: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-none focus:border-primary-500"
                  rows={4}
                />
              </div>

              {/* Milestones Counters Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Years active</label>
                  <input 
                    type="text" 
                    value={aboutData.yearsOfOperation}
                    onChange={(e) => setAboutData({...aboutData, yearsOfOperation: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-black text-gray-700 focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Completed jobs</label>
                  <input 
                    type="text" 
                    value={aboutData.completedJobs}
                    onChange={(e) => setAboutData({...aboutData, completedJobs: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-black text-gray-700 focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Happy clients</label>
                  <input 
                    type="text" 
                    value={aboutData.happyCustomers}
                    onChange={(e) => setAboutData({...aboutData, happyCustomers: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-black text-gray-700 focus:outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Onboarded experts</label>
                  <input 
                    type="text" 
                    value={aboutData.verifiedWorkers}
                    onChange={(e) => setAboutData({...aboutData, verifiedWorkers: e.target.value})}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-black text-gray-700 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Core Values Cards */}
              <div>
                <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-2">Core Value Cards</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {aboutData.coreValues.map((val, idx) => (
                    <div key={val.id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between">
                      <div>
                        <input 
                          type="text" 
                          value={val.title}
                          onChange={(e) => {
                            const updatedVal = { ...val, title: e.target.value };
                            const updatedList = aboutData.coreValues.map(v => v.id === val.id ? updatedVal : v);
                            setAboutData({ ...aboutData, coreValues: updatedList });
                          }}
                          className="w-full border-b border-transparent hover:border-gray-300 focus:border-primary-500 font-bold text-sm text-gray-800 focus:outline-none mb-2 pb-0.5"
                        />
                        <textarea 
                          value={val.desc}
                          onChange={(e) => {
                            const updatedVal = { ...val, desc: e.target.value };
                            const updatedList = aboutData.coreValues.map(v => v.id === val.id ? updatedVal : v);
                            setAboutData({ ...aboutData, coreValues: updatedList });
                          }}
                          className="w-full border border-transparent hover:border-gray-200 focus:border-primary-500 text-xs text-gray-500 focus:outline-none rounded p-1"
                          rows={3}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button 
                onClick={handleSaveAbout}
                className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider active:scale-95 transition-all shadow-md"
              >
                <FiSave className="w-4 h-4" /> Save About Us Configs
              </button>
            </div>
          </div>
        )}

        {/* SERVICES SHOWCASE EDIT TAB */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-gray-800 uppercase tracking-wide">Featured Home Services Showcase</h2>
                <p className="text-xs text-gray-500 mt-1">Onboard customized categories and details shown under the marketing showcase carousel of the website.</p>
              </div>
              <button 
                onClick={() => {
                  setEditingServiceId(null);
                  setCurrentService({ name: '', category: '', price: '', rating: '5.0', image: '' });
                  setIsServiceModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
              >
                <FiPlus className="w-4 h-4" /> Add Showcase Service
              </button>
            </div>

            {/* Services Grid cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {marketingServices.map(service => (
                <div key={service.id} className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-md flex flex-col justify-between group hover:shadow-lg transition-all duration-300">
                  <div className="relative">
                    <img 
                      src={service.image || 'https://images.unsplash.com/photo-1540553016722-983e48a2cd10?auto=format&fit=crop&w=800&q=80'} 
                      alt={service.name} 
                      className="w-full h-36 object-cover"
                    />
                    <span className="absolute top-3 left-3 bg-gray-950/80 backdrop-blur-md px-2 py-0.5 rounded-full text-[9px] font-bold text-white uppercase tracking-wider">
                      {service.category}
                    </span>
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-sm text-gray-800 group-hover:text-primary-600 transition-colors">{service.name}</h3>
                    <div className="flex justify-between items-center pt-2">
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wide">starting from</span>
                        <span className="text-base font-black text-primary-600">{service.price}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded text-yellow-600 text-[10px] font-bold border border-yellow-100">
                        ⭐ {service.rating}
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 border-t border-gray-100 px-4 py-3 flex justify-end gap-2">
                    <button 
                      onClick={() => {
                        setEditingServiceId(service.id);
                        setCurrentService(service);
                        setIsServiceModalOpen(true);
                      }}
                      className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-white rounded transition-all"
                    >
                      <FiEdit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteService(service.id)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-white rounded transition-all"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQ MANAGER EDIT TAB */}
        {activeTab === 'faqs' && (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-gray-800 uppercase tracking-wide">Website FAQs Manager</h2>
                <p className="text-xs text-gray-500 mt-1">Configure questions and answers regarding services, payments, safety, and policies visible on the site.</p>
              </div>
              <button 
                onClick={() => {
                  setEditingFaqId(null);
                  setCurrentFaq({ question: '', answer: '' });
                  setIsFaqModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
              >
                <FiPlus className="w-4 h-4" /> Add FAQ
              </button>
            </div>

            <div className="space-y-3">
              {faqs.map(faq => (
                <div key={faq.id} className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50 hover:bg-gray-50 transition-all flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-gray-800">Q: {faq.question}</p>
                    <p className="text-xs text-gray-600 pl-4">A: {faq.answer}</p>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        setEditingFaqId(faq.id);
                        setCurrentFaq(faq);
                        setIsFaqModalOpen(true);
                      }}
                      className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-white rounded transition-all border border-gray-200"
                    >
                      <FiEdit3 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteFaq(faq.id)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-white rounded transition-all border border-gray-200"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BLOG MANAGER EDIT TAB */}
        {activeTab === 'blogs' && (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-4 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-black text-gray-800 uppercase tracking-wide">Marketing Blogs / Articles</h2>
                <p className="text-xs text-gray-500 mt-1">Publish informative articles, cleaning tips, grooming guidelines, or service news to drive search engine traffic (SEO).</p>
              </div>
              <button 
                onClick={() => {
                  setEditingBlogId(null);
                  setCurrentBlog({ title: '', author: '', date: '', readTime: '', category: '', content: '' });
                  setIsBlogModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all"
              >
                <FiPlus className="w-4 h-4" /> Write Article
              </button>
            </div>

            <div className="space-y-3">
              {blogs.map(blog => (
                <div key={blog.id} className="border border-gray-100 rounded-2xl p-4 hover:border-gray-200 flex items-center justify-between shadow-sm bg-white">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-primary-50 text-primary-600 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-primary-100">
                        {blog.category}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">{blog.date}</span>
                    </div>
                    <h3 className="font-bold text-sm text-gray-800">{blog.title}</h3>
                    <p className="text-[10px] text-gray-500 font-medium">By {blog.author} • {blog.readTime} • 👍 {blog.likes} Likes</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setEditingBlogId(blog.id);
                        setCurrentBlog(blog);
                        setIsBlogModalOpen(true);
                      }}
                      className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-50 rounded-xl transition-all border border-gray-200"
                    >
                      <FiEdit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteBlog(blog.id)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-50 rounded-xl transition-all border border-gray-200"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PUBLIC CONTACT FORM INQUIRIES TAB */}
        {activeTab === 'inquiries' && (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-lg font-black text-gray-800 uppercase tracking-wide">Public Website Contact Inquiries</h2>
              <p className="text-xs text-gray-500 mt-1">Review contact forms and franchise queries submitted by users via the marketing website contact form.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-[10px] font-black text-gray-400 uppercase tracking-wider bg-gray-50">
                    <th className="py-3 px-4">Inquiry ID</th>
                    <th className="py-3 px-4">Contact Info</th>
                    <th className="py-3 px-4">Message</th>
                    <th className="py-3 px-4">Submitted Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                  {inquiries.map(inq => (
                    <tr key={inq.id} className="hover:bg-gray-50/50">
                      <td className="py-4 px-4 font-bold text-gray-900">{inq.id}</td>
                      <td className="py-4 px-4 space-y-0.5">
                        <p className="font-bold text-gray-800 text-xs">{inq.name}</p>
                        <p className="text-gray-400">{inq.email}</p>
                        <p className="text-gray-400">{inq.phone}</p>
                      </td>
                      <td className="py-4 px-4 max-w-xs truncate" title={inq.message}>{inq.message}</td>
                      <td className="py-4 px-4 text-gray-400 font-bold uppercase">{inq.date}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          inq.status === 'resolved' 
                            ? 'bg-green-50 text-green-600 border border-green-200' 
                            : 'bg-orange-50 text-orange-600 border border-orange-200'
                        }`}>
                          {inq.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button 
                          onClick={() => handleToggleInquiryStatus(inq.id)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border active:scale-95 transition-all ${
                            inq.status === 'resolved' 
                              ? 'bg-gray-50 text-gray-600 border-gray-300' 
                              : 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                          }`}
                        >
                          {inq.status === 'resolved' ? 'Reopen' : 'Resolve'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SEO & GLOBAL SETTINGS TAB */}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-lg font-black text-gray-800 uppercase tracking-wide">SEO & Global Marketing Configurations</h2>
              <p className="text-xs text-gray-500 mt-1">Configure search meta tags, global branding images, corporate coordinates and social profile references.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-1.5">Meta Site Title (Default tab name)</label>
                  <input 
                    type="text" 
                    value={seoSettings.siteTitle}
                    onChange={(e) => setSeoSettings({...seoSettings, siteTitle: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-1.5">Meta Search Description</label>
                  <textarea 
                    value={seoSettings.metaDescription}
                    onChange={(e) => setSeoSettings({...seoSettings, metaDescription: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-none focus:border-primary-500"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-1.5">SEO Meta Keywords (comma separated)</label>
                  <input 
                    type="text" 
                    value={seoSettings.metaKeywords}
                    onChange={(e) => setSeoSettings({...seoSettings, metaKeywords: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-1.5">Contact Support Phone</label>
                    <input 
                      type="text" 
                      value={seoSettings.contactPhone}
                      onChange={(e) => setSeoSettings({...seoSettings, contactPhone: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-1.5">Contact Support Email</label>
                    <input 
                      type="text" 
                      value={seoSettings.contactEmail}
                      onChange={(e) => setSeoSettings({...seoSettings, contactEmail: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-800 focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-1.5">Instagram URL</label>
                  <input 
                    type="text" 
                    value={seoSettings.instagramUrl}
                    onChange={(e) => setSeoSettings({...seoSettings, instagramUrl: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 focus:outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-gray-400 uppercase tracking-wider block mb-1.5">Facebook URL</label>
                  <input 
                    type="text" 
                    value={seoSettings.facebookUrl}
                    onChange={(e) => setSeoSettings({...seoSettings, facebookUrl: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 focus:outline-none focus:border-primary-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button 
                onClick={handleSaveSEO}
                className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider active:scale-95 transition-all shadow-md"
              >
                <FiSave className="w-4 h-4" /> Save SEO Settings
              </button>
            </div>
          </div>
        )}

      </div>

      {/* SERVICE MODAL POPUP */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="font-black text-base text-gray-900 uppercase tracking-wider">{editingServiceId ? 'Edit Showcase Item' : 'New Showcase Item'}</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Service Name</label>
                <input 
                  type="text" 
                  value={currentService.name} 
                  onChange={(e) => setCurrentService({...currentService, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-gray-800 focus:outline-none focus:border-primary-500 font-semibold"
                  placeholder="e.g. Sofa Dry Cleaning"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Category</label>
                <input 
                  type="text" 
                  value={currentService.category} 
                  onChange={(e) => setCurrentService({...currentService, category: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-gray-800 focus:outline-none focus:border-primary-500 font-semibold"
                  placeholder="e.g. Cleaning"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Starting Price</label>
                  <input 
                    type="text" 
                    value={currentService.price} 
                    onChange={(e) => setCurrentService({...currentService, price: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-gray-800 focus:outline-none focus:border-primary-500 font-semibold"
                    placeholder="e.g. ₹299"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Rating</label>
                  <input 
                    type="text" 
                    value={currentService.rating} 
                    onChange={(e) => setCurrentService({...currentService, rating: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-gray-800 focus:outline-none focus:border-primary-500 font-semibold"
                    placeholder="e.g. 4.9"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Banner Image URL</label>
                <input 
                  type="text" 
                  value={currentService.image} 
                  onChange={(e) => setCurrentService({...currentService, image: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-xs text-gray-600 focus:outline-none focus:border-primary-500"
                  placeholder="Paste direct unsplash / cdn image url"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setIsServiceModalOpen(false)}
                className="flex-1 py-3 border rounded-xl font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddOrEditService}
                className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider active:scale-95 transition-all"
              >
                Save Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAQ MODAL POPUP */}
      {isFaqModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="font-black text-base text-gray-900 uppercase tracking-wider">{editingFaqId ? 'Edit FAQ Card' : 'New FAQ Card'}</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Question Description</label>
                <input 
                  type="text" 
                  value={currentFaq.question} 
                  onChange={(e) => setCurrentFaq({...currentFaq, question: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-gray-800 focus:outline-none focus:border-primary-500 font-semibold"
                  placeholder="e.g. Can I cancel my booking?"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Detailed Answer</label>
                <textarea 
                  value={currentFaq.answer} 
                  onChange={(e) => setCurrentFaq({...currentFaq, answer: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-gray-800 focus:outline-none focus:border-primary-500 font-semibold"
                  placeholder="e.g. Yes, you can cancel up to 2 hours..."
                  rows={4}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setIsFaqModalOpen(false)}
                className="flex-1 py-3 border rounded-xl font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddOrEditFaq}
                className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider active:scale-95 transition-all"
              >
                Save FAQ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BLOG MODAL POPUP */}
      {isBlogModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="font-black text-base text-gray-900 uppercase tracking-wider">{editingBlogId ? 'Edit Blog Article' : 'Write Blog Article'}</h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Category</label>
                  <input 
                    type="text" 
                    value={currentBlog.category} 
                    onChange={(e) => setCurrentBlog({...currentBlog, category: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-xs text-gray-850 font-bold focus:outline-none focus:border-primary-500"
                    placeholder="e.g. Home Cleaning"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Read Time (minutes)</label>
                  <input 
                    type="text" 
                    value={currentBlog.readTime} 
                    onChange={(e) => setCurrentBlog({...currentBlog, readTime: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-xs text-gray-850 font-bold focus:outline-none focus:border-primary-500"
                    placeholder="e.g. 5 min read"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Article Title</label>
                <input 
                  type="text" 
                  value={currentBlog.title} 
                  onChange={(e) => setCurrentBlog({...currentBlog, title: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-gray-900 font-bold focus:outline-none focus:border-primary-500"
                  placeholder="e.g. 10 Mistakes people make while washing sofa covers"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Author Name</label>
                  <input 
                    type="text" 
                    value={currentBlog.author} 
                    onChange={(e) => setCurrentBlog({...currentBlog, author: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-xs text-gray-800 font-semibold focus:outline-none focus:border-primary-500"
                    placeholder="e.g. Aman Gupta"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Published Date (optional)</label>
                  <input 
                    type="text" 
                    value={currentBlog.date} 
                    onChange={(e) => setCurrentBlog({...currentBlog, date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg text-xs text-gray-800 font-semibold focus:outline-none focus:border-primary-500"
                    placeholder="e.g. June 30, 2026"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Content Body</label>
                <textarea 
                  value={currentBlog.content} 
                  onChange={(e) => setCurrentBlog({...currentBlog, content: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg text-xs text-gray-800 focus:outline-none focus:border-primary-500"
                  placeholder="Write the full content body of the article..."
                  rows={5}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setIsBlogModalOpen(false)}
                className="flex-1 py-3 border rounded-xl font-bold text-xs uppercase tracking-wider text-gray-500 bg-gray-50 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddOrEditBlog}
                className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider active:scale-95 transition-all"
              >
                Publish
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default WebsiteManagement;
