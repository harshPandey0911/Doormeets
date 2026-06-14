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

  if (!items.length) return null;

  const handleClick = (item) => {
    if (type === 'brand') {
      navigate(`/user/brand/${item.slug || item.refId}`, { state: { vendor: item } });
    } else {
      navigate(`/user/category/${item.slug || item.refId}`, { state: { category: item } });
    }
  };

  return (
    <section className="px-5 w-full pt-1">
      {/* Section Header */}
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-[17px] font-semibold text-[#1f2937]">{sectionTitle}</h2>
          <p className="text-sm text-gray-500">
            {type === 'brand' ? 'Top rated service partners' : 'Browse popular categories'}
          </p>
        </div>
      </div>

      {type === 'brand' ? (
        /* Brand — horizontal scrolling chips */
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
                className="rounded-3xl border border-gray-100 bg-white p-3 text-left shadow-sm transition-transform hover:-translate-y-1 active:scale-95"
              >
                <div className="mb-2 flex h-16 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-50 to-white overflow-hidden">
                  {item.iconUrl ? (
                    <img
                      src={toAssetUrl(item.iconUrl)}
                      alt={item.title}
                      className="h-10 w-10 object-contain"
                    />
                  ) : (
                    <span className="text-xl font-black text-purple-700">
                      {item.title?.[0] || '?'}
                    </span>
                  )}
                </div>
                <div className="text-sm font-bold text-gray-900 truncate max-w-[90px]">{item.title}</div>
                <div className="text-xs text-gray-500">Top rated</div>
              </button>
            </motion.div>
          ))}
        </div>
      ) : (
        /* Category — 3-column grid */
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {items.map((item, index) => (
            <motion.button
              key={item.refId || index}
              type="button"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleClick(item)}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-95"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center overflow-hidden">
                {item.iconUrl ? (
                  <img
                    src={toAssetUrl(item.iconUrl)}
                    alt={item.title}
                    className="h-9 w-9 object-contain"
                  />
                ) : (
                  <span className="text-lg font-black text-indigo-600">
                    {item.title?.[0] || '?'}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold text-gray-700 text-center leading-tight line-clamp-2">
                {item.title}
              </span>
            </motion.button>
          ))}
        </div>
      )}
    </section>
  );
};

export default FeaturedSection;
