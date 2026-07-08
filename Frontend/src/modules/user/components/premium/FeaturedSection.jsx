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
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="text-[17px] font-extrabold tracking-tight text-dark-text">{sectionTitle}</h2>
          <p className="text-xs font-semibold text-muted-text mt-0.5">Top rated service partners</p>
        </div>
      </div>

      {/* Brand — horizontal scrolling chips */}
      <div className="flex gap-4 overflow-x-auto pb-3 -mx-5 px-5 no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
              className="rounded-3xl border border-transparent p-4 text-left shadow-[0_8px_30px_rgba(0,0,0,0.02)] bg-surface transition-all duration-300 hover:-translate-y-1.5 hover:border-brand/15 hover:shadow-[0_20px_45px_rgba(255,107,74,0.06)] active:scale-95 cursor-pointer w-32"
            >
              <div className="mb-3.5 flex h-16 w-full items-center justify-center rounded-2xl bg-card-bg overflow-hidden border border-border/40">
                {item.iconUrl ? (
                  <img
                    src={toAssetUrl(item.iconUrl)}
                    alt={item.title}
                    className="h-10 w-10 object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <span className="text-xl font-black text-brand">
                    {item.title?.[0] || '?'}
                  </span>
                )}
              </div>
              <div className="text-sm font-extrabold truncate text-dark-text leading-tight">{item.title}</div>
              <div className="text-[10px] font-bold text-muted-text mt-0.5">Top rated</div>
            </button>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedSection;
