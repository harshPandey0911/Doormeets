import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiArrowLeft, FiClock, FiTrendingUp, FiX, FiLayers, FiChevronRight } from 'react-icons/fi';
import { publicCatalogService } from '../../../../../services/catalogService';
import { themeColors } from '../../../../../theme';

const toAssetUrl = (url) => {
  if (!url) return '';
  const clean = url.replace('/api/upload', '/upload');
  if (clean.startsWith('http')) return clean;
  const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/api$/, '');
  return `${base}${clean.startsWith('/') ? '' : '/'}${clean}`;
};

const SearchOverlay = ({ isOpen, onClose, categories = [], onCategoryClick }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingServices, setTrendingServices] = useState([]);
  const inputRef = useRef(null);

  // Load recent searches and trending services on mount
  useEffect(() => {
    const saved = localStorage.getItem('recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved).slice(0, 5));
    }

    // Fetch trending services (Most Booked)
    const fetchTrending = async () => {
      try {
        const res = await publicCatalogService.getHomeContent();
        if (res.success && res.homeContent?.booked && res.homeContent.booked.length > 0) {
          const filtered = res.homeContent.booked.filter(s =>
            !s.title.toLowerCase().includes('fan install') &&
            !s.title.toLowerCase().includes('fan repair') &&
            !s.title.toLowerCase().includes('top load') &&
            !s.title.toLowerCase().includes('automatic')
          );
          setTrendingServices(filtered.slice(0, 5));
        } else {
          setTrendingServices([
            { id: 'trend-1', title: 'AC Repair & Service', category: 'AC & Appliance', imageUrl: '/assets/icons/services/ac.png' },
            { id: 'trend-2', title: 'Washing Machine Repair', category: 'AC & Appliance', imageUrl: '/assets/icons/services/washing-machine.png' },
            { id: 'trend-3', title: 'Microwave Repair', category: 'AC & Appliance', imageUrl: '/assets/icons/services/microwave.png' },
            { id: 'trend-4', title: 'Refrigerator Repair', category: 'AC & Appliance', imageUrl: '/assets/icons/services/refrigerator.png' },
            { id: 'trend-5', title: 'RO Water Purifier Service', category: 'AC & Appliance', imageUrl: '/assets/icons/services/ro.png' }
          ]);
        }
      } catch (error) {
        console.error("Failed to load trending services", error);
        setTrendingServices([
          { id: 'trend-1', title: 'AC Repair & Service', category: 'AC & Appliance' },
          { id: 'trend-2', title: 'Washing Machine Repair', category: 'AC & Appliance' },
          { id: 'trend-3', title: 'Microwave Repair', category: 'AC & Appliance' },
          { id: 'trend-4', title: 'Refrigerator Repair', category: 'AC & Appliance' },
          { id: 'trend-5', title: 'RO Water Purifier Service', category: 'AC & Appliance' }
        ]);
      }
    };
    fetchTrending();
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true);
        try {
          const lowerQ = query.toLowerCase();

          // 1. Search Categories (Local)
          const categoryMatches = categories.filter(c =>
            c.title.toLowerCase().includes(lowerQ)
          ).map(c => ({ ...c, isCategory: true }));

          // 2. Search Services (API)
          const response = await publicCatalogService.getServices({ search: query });
          let serviceMatches = [];

          if (response.success) {
            serviceMatches = response.services;
          }

          // Combine: Categories first, then Services
          setResults([...categoryMatches, ...serviceMatches]);

        } catch (error) {
          console.error("Search failed", error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, categories]);

  const handleResultClick = (item) => {
    const newRecent = [item.title, ...recentSearches.filter(s => s !== item.title)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('recent_searches', JSON.stringify(newRecent));

    onClose();

    if (item.isCategory) {
      onCategoryClick(item);
      return;
    }

    let catId = item.categoryId || item.targetCategoryId || item.categoryId;
    let category = null;

    if (catId) {
      category = categories.find(c => (c.id === catId || c._id === catId));
    }

    if (!category && item.category) {
      category = categories.find(c => c.title === item.category);
    }

    if (category) {
      const initialBrand = item.brandId ? {
        id: item.brandId,
        title: item.brandName || item.category,
        iconUrl: item.brandIcon || item.icon
      } : (item.id && !item.isCategory ? item : null);

      onCategoryClick({
        ...category,
        initialBrand: initialBrand
      });
    }
  };

  const handleTermClick = (term) => {
    setQuery(term);
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('recent_searches');
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex flex-col"
          style={{ backgroundColor: 'var(--background)' }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 p-4 border-b shadow-sm"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <button
              onClick={onClose}
              className="p-2 -ml-2 rounded-full transition-colors"
              style={{ color: 'var(--text-primary)' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--divider)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <FiArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex-1 relative">
              <FiSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for services..."
                className="w-full pl-10 pr-10 py-3 rounded-xl focus:ring-2 transition-all border outline-none text-base font-medium"
                style={{
                  backgroundColor: 'var(--divider)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                  '--tw-ring-color': `${themeColors.primary}33`
                }}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full"
                  style={{ backgroundColor: 'var(--border)' }}
                >
                  <FiX className="w-3 h-3" style={{ color: 'var(--text-secondary)' }} />
                </button>
              )}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto" style={{ backgroundColor: 'var(--background)' }}>
            {query.length >= 2 ? (
              // Search Results
              <div className="p-4 space-y-3">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-10 opacity-60">
                    <div
                      className="w-8 h-8 border-2 rounded-full animate-spin mb-2"
                      style={{ borderColor: 'var(--border)', borderTopColor: themeColors.primary }}
                    />
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Searching...</p>
                  </div>
                ) : results.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between mb-4 mt-2">
                      <p
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        Search Results
                      </p>
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'var(--divider)', color: 'var(--text-muted)' }}
                      >
                        {results.length} found
                      </span>
                    </div>
                    {results.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleResultClick(item)}
                        className="flex items-center gap-4 p-4 rounded-2xl active:scale-[0.98] transition-all cursor-pointer border group"
                        style={{
                          backgroundColor: 'var(--surface)',
                          borderColor: 'var(--border)',
                        }}
                      >
                        <div
                          className="w-14 h-14 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border transition-colors"
                          style={{ backgroundColor: 'var(--divider)', borderColor: 'var(--border)' }}
                        >
                          {(item.icon || item.imageUrl || item.brandIcon) ? (
                            <img
                              src={toAssetUrl(item.icon || item.brandIcon || item.imageUrl)}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <FiLayers className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4
                            className="font-bold text-[15px] truncate transition-colors"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {item.title}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {item.isCategory ? (
                              <span
                                className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-tighter"
                                style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#60A5FA' }}
                              >
                                Category
                              </span>
                            ) : (
                              <span
                                className="text-[11px] font-semibold flex items-center gap-1"
                                style={{ color: 'var(--text-secondary)' }}
                              >
                                {item.brandName || item.category || 'Service'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                          style={{ backgroundColor: 'var(--divider)' }}
                        >
                          <FiChevronRight
                            className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"
                            style={{ color: 'var(--text-muted)' }}
                          />
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-20">
                    <p className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                      No services found for "{query}"
                    </p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                      Try a different keyword
                    </p>
                  </div>
                )}
              </div>
            ) : (
              // Default State (Recent & Trending)
              <div className="p-5 space-y-8">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <section>
                    <div className="flex justify-between items-center mb-3">
                      <h3
                        className="text-sm font-bold flex items-center gap-2"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        <FiClock style={{ color: 'var(--text-muted)' }} />
                        Recent Searches
                      </h3>
                      <button
                        onClick={clearRecent}
                        className="text-xs font-semibold"
                        style={{ color: 'var(--primary)' }}
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {recentSearches.map((term, i) => (
                        <button
                          key={i}
                          onClick={() => handleTermClick(term)}
                          className="px-4 py-2 rounded-full text-sm transition-all active:scale-95"
                          style={{
                            backgroundColor: 'var(--surface)',
                            border: '1px solid var(--border)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </section>
                )}


              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default SearchOverlay;
