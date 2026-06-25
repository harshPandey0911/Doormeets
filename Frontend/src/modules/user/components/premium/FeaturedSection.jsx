import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toAssetUrl } from './cartUtils';

/**
 * FeaturedSection — Renders admin-curated brand/category sections on the user home page.
 * Supports two types:
 *   - 'brand'    → horizontal scrolling brand chips (like Popular Brands)
 *   - 'category' → grid of category cards
 */
const FeaturedSection = ({ section }) => {
  const navigate = useNavigate();
  const { sectionTitle, type, items = [] } = section;

  if (!items || !items.length || items.length === 0) return null;

  const handleClick = (item) => {
    navigate(`/user/brand/${item.slug || item.refId}`, { state: { vendor: item } });
  };

  return (
    <section className="px-5 w-full pt-1">
      {/* Section Header */}
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-[17px] font-semibold" style={{ color: 'var(--text-primary)' }}>{sectionTitle}</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Top rated service partners</p>
        </div>
      </div>

      {/* Brand — horizontal scrolling chips */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {items.map((item, index) => (
          <motion.div
            key={item.refId || index}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="shrink-0"
          >
            <button
              type="button"
              onClick={() => handleClick(item)}
              className="rounded-3xl border p-3 text-left shadow-sm transition-transform hover:-translate-y-1 active:scale-95"
              style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}
            >
              <div className="mb-2 flex h-16 w-24 items-center justify-center rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
                {item.iconUrl ? (
                  <img
                    src={toAssetUrl(item.iconUrl)}
                    alt={item.title}
                    className="h-10 w-10 object-contain"
                  />
                ) : (
                  <span className="text-xl font-black text-purple-700 dark:text-purple-400">
                    {item.title?.[0] || '?'}
                  </span>
                )}
              </div>
              <div className="text-sm font-bold truncate max-w-[90px]" style={{ color: 'var(--text-primary)' }}>{item.title}</div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Top rated</div>
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedSection;
